import logging
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import db_manager
from app.core.deps import get_current_user
from app.models.bulk import BulkScanRequest, BulkJobStatusResponse
from app.tasks import analyze_single_url_task

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bulk", tags=["bulk"])

COLLECTION_JOBS = "bulk_jobs"


@router.post("/analyze", status_code=status.HTTP_202_ACCEPTED)
async def trigger_bulk_analysis(
    payload: BulkScanRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Accept lists of URLs to analyze in background celery worker threads.
    Returns the created batch job ID.
    """
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )

    if not payload.urls:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one URL must be provided."
        )

    if len(payload.urls) > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum batch limit is 20 URLs."
        )

    # Initialize batch job log
    job_doc = {
        "user_email": current_user["email"],
        "urls": payload.urls,
        "total_urls": len(payload.urls),
        "completed_urls": 0,
        "status": "processing",
        "results": [],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    result = await db_manager.db[COLLECTION_JOBS].insert_one(job_doc)
    batch_id = str(result.inserted_id)

    # Dispatch tasks to Celery queue broker
    for url in payload.urls:
        try:
            analyze_single_url_task.delay(
                batch_id,
                url,
                payload.primary_keyword,
                current_user["email"]
            )
        except Exception as celery_err:
            logger.error(f"Failed to queue URL {url} on broker: {celery_err}")
            # Even if queueing fail happens, count towards finished so batch doesn't hang
            await db_manager.db[COLLECTION_JOBS].update_one(
                {"_id": result.inserted_id},
                {
                    "$push": {
                        "results": {
                            "url": url,
                            "status": "failed",
                            "page_id": None,
                            "title": "Queue Failed",
                            "score": None,
                            "completed_at": datetime.now(timezone.utc).isoformat(),
                            "error": f"Task dispatch error: {str(celery_err)}"
                        }
                    },
                    "$inc": {"completed_urls": 1},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                }
            )

    # Recheck completion immediately in case all failed or skipped
    final_check = await db_manager.db[COLLECTION_JOBS].find_one({"_id": result.inserted_id})
    if final_check and final_check["completed_urls"] >= final_check["total_urls"]:
        await db_manager.db[COLLECTION_JOBS].update_one(
            {"_id": result.inserted_id},
            {"$set": {"status": "completed"}}
        )

    return {"job_id": batch_id}


@router.get("/status/{job_id}", response_model=BulkJobStatusResponse)
async def get_bulk_job_status(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get live progress status log for a bulk scan batch job.
    """
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )

    try:
        job_oid = ObjectId(job_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Job ID format."
        )

    job = await db_manager.db[COLLECTION_JOBS].find_one(
        {"_id": job_oid, "user_email": current_user["email"]}
    )

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bulk job record not found."
        )

    job["job_id"] = str(job.pop("_id"))
    return job
