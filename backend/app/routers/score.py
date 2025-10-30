import logging
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import db_manager
from app.core.deps import get_current_user
from app.models.score import ScoreRequest, ScoreResponse
from app.services.scoring_engine import generate_seo_audit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/score", tags=["scoring"])

COLLECTION_AUDITS = "score_audits"
COLLECTION_PAGES = "scraped_pages"


@router.post("", response_model=ScoreResponse, status_code=status.HTTP_201_CREATED)
async def create_score_audit(
    payload: ScoreRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Execute the SEO scoring engine on a stored scraped page by page_id.
    Persist results inside MongoDB.
    """
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )

    # 1. Fetch scraped page
    try:
        page_oid = ObjectId(payload.page_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid page ID format."
        )

    page_doc = await db_manager.db[COLLECTION_PAGES].find_one(
        {"_id": page_oid, "user_email": current_user["email"]}
    )

    if not page_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target scraped page not found."
        )

    # 2. Generate SEO Audit Report
    try:
        audit_res = generate_seo_audit(
            page_id=payload.page_id,
            page_data=page_doc,
            primary_keyword=payload.primary_keyword,
            lsi_keywords=payload.lsi_keywords
        )
    except Exception as e:
        logger.error(f"Failed to generate SEO audit score: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scoring failure: {str(e)}"
        )

    # 3. Persist audit to MongoDB score_audits collection
    audit_dict = audit_res.model_dump()
    audit_dict["user_email"] = current_user["email"]
    
    # Save the audit report
    result = await db_manager.db[COLLECTION_AUDITS].insert_one(audit_dict)
    audit_dict["_id"] = str(result.inserted_id)

    # 4. Update the scraped_pages document to reference the latest score
    await db_manager.db[COLLECTION_PAGES].update_one(
        {"_id": page_oid},
        {
            "$set": {
                "latest_score": audit_res.overall_score,
                "latest_audit_id": str(result.inserted_id),
                "audited_at": datetime.now(timezone.utc)
            }
        }
    )

    return audit_dict


@router.get("/{page_id}", response_model=ScoreResponse, status_code=status.HTTP_200_OK)
async def get_latest_score_audit(
    page_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve the latest generated score report audit for a given page_id.
    """
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )

    # Fetch the latest score audit document
    audit_doc = await db_manager.db[COLLECTION_AUDITS].find_one(
        {"page_id": page_id, "user_email": current_user["email"]},
        sort=[("scored_at", -1)]
    )

    if not audit_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No score audits found for this page."
        )

    audit_doc["_id"] = str(audit_doc["_id"])
    return audit_doc
