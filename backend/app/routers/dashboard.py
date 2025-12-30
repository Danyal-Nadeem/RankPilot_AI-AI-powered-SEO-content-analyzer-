import logging
from urllib.parse import urlparse
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from app.services.pdf_generator import generate_pdf_report
from app.core.database import db_manager
from app.core.deps import get_current_user
from app.models.dashboard import AuditHistoryResponse, AuditHistoryItem, DashboardStatsResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

COLLECTION_PAGES = "scraped_pages"
COLLECTION_AUDITS = "score_audits"


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """
    Calculate aggregate stats for user analyses history.
    """
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )

    user_email = current_user["email"]

    # 1. Total count
    total_analyses = await db_manager.db[COLLECTION_PAGES].count_documents({"user_email": user_email})

    # 2. Avg SEO Score
    pipeline = [
        {"$match": {"user_email": user_email, "latest_score": {"$ne": None}}},
        {"$group": {"_id": None, "avg_score": {"$avg": "$latest_score"}}}
    ]
    avg_cursor = db_manager.db[COLLECTION_PAGES].aggregate(pipeline)
    avg_score = 0.0
    async for res in avg_cursor:
        avg_score = round(res.get("avg_score", 0.0), 1)

    # 3. Most analyzed domain
    cursor = db_manager.db[COLLECTION_PAGES].find(
        {"user_email": user_email, "source_url": {"$ne": None}},
        {"source_url": 1}
    )
    domain_counts = {}
    async for doc in cursor:
        url = doc.get("source_url")
        if url:
            try:
                domain = urlparse(url).netloc.replace("www.", "")
                if domain:
                    domain_counts[domain] = domain_counts.get(domain, 0) + 1
            except Exception:
                pass
    
    most_analyzed_domain = "N/A"
    if domain_counts:
        most_analyzed_domain = max(domain_counts, key=domain_counts.get)

    # Free tier limit
    remaining_scans = max(0, 5 - total_analyses)

    return DashboardStatsResponse(
        total_analyses=total_analyses,
        average_score=avg_score,
        most_analyzed_domain=most_analyzed_domain,
        remaining_scans=remaining_scans
    )


@router.get("/history", response_model=AuditHistoryResponse)
async def get_history_list(
    page: int = 1,
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """
    Fetch paginated audit history list for user.
    """
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )

    user_email = current_user["email"]
    skip = (page - 1) * limit

    total_count = await db_manager.db[COLLECTION_PAGES].count_documents({"user_email": user_email})

    cursor = db_manager.db[COLLECTION_PAGES].find(
        {"user_email": user_email}
    ).sort("scraped_at", -1).skip(skip).limit(limit)

    items = []
    async for doc in cursor:
        items.append(
            AuditHistoryItem(
                page_id=str(doc["_id"]),
                url=doc.get("source_url"),
                title=doc.get("title") or "Pasted Raw Content",
                latest_score=doc.get("latest_score"),
                scraped_at=doc["scraped_at"],
                audited_at=doc.get("audited_at")
            )
        )

    return AuditHistoryResponse(
        items=items,
        total_count=total_count,
        page=page,
        limit=limit
    )


@router.get("/report/{page_id}")
async def get_report_details(
    page_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve full scraped details + latest score audit breakdown by page_id.
    """
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )

    try:
        page_oid = ObjectId(page_id)
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
            detail="Page not found."
        )

    # Fetch corresponding latest score audit
    audit_doc = await db_manager.db[COLLECTION_AUDITS].find_one(
        {"page_id": page_id, "user_email": current_user["email"]},
        sort=[("scored_at", -1)]
    )

    page_doc["id"] = str(page_doc.pop("_id"))
    if audit_doc:
        audit_doc["id"] = str(audit_doc.pop("_id"))

    return {
        "page": page_doc,
        "audit": audit_doc
    }


@router.delete("/report/{page_id}", status_code=status.HTTP_200_OK)
async def delete_report(
    page_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Remove scraped page and all its corresponding audits.
    """
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )

    try:
        page_oid = ObjectId(page_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid page ID format."
        )

    result = await db_manager.db[COLLECTION_PAGES].delete_one(
        {"_id": page_oid, "user_email": current_user["email"]}
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found."
        )

    # Clean up audits
    await db_manager.db[COLLECTION_AUDITS].delete_many(
        {"page_id": page_id, "user_email": current_user["email"]}
    )

    return {"message": "Report successfully deleted."}


@router.get("/report/{page_id}/export-pdf")
async def export_pdf_report(
    page_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate and stream professional PDF SEO audit report.
    """
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )

    try:
        page_oid = ObjectId(page_id)
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
            detail="Page report context not found."
        )

    # Fetch corresponding latest score audit
    audit_doc = await db_manager.db[COLLECTION_AUDITS].find_one(
        {"page_id": page_id, "user_email": current_user["email"]},
        sort=[("scored_at", -1)]
    )

    if not audit_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Score audits not found for this report. Run scoring first."
        )

    page_doc["id"] = str(page_doc.pop("_id"))
    audit_doc["id"] = str(audit_doc.pop("_id"))

    try:
        pdf_buffer = generate_pdf_report(page_doc, audit_doc)
        filename = f"seo_audit_{page_id}.pdf"
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        logger.error(f"Failed to generate PDF report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF generation failed: {str(e)}"
        )

