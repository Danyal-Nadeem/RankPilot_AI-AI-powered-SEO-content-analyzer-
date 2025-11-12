import logging
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import db_manager
from app.core.deps import get_current_user
from app.models.ai_suggestions import AISuggestionRequest, AISuggestionResponse
from app.services.ai_suggestions import generate_ai_suggestions
from app.services.scoring_engine import generate_seo_audit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["analysis"])

COLLECTION_PAGES = "scraped_pages"
COLLECTION_AUDITS = "score_audits"


@router.post("/ai-suggestions", response_model=AISuggestionResponse, status_code=status.HTTP_200_OK)
async def get_ai_suggestions_endpoint(
    payload: AISuggestionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate AI-powered content improvement suggestions using scraped context and SEO scores.
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

    # 2. Fetch or generate the latest score audit for context
    score_doc = None
    if payload.score_audit_id:
        try:
            audit_oid = ObjectId(payload.score_audit_id)
            score_doc = await db_manager.db[COLLECTION_AUDITS].find_one(
                {"_id": audit_oid, "user_email": current_user["email"]}
            )
        except Exception:
            pass

    # If no score audit ID was passed or it was invalid, fetch the latest audit for this page
    if not score_doc:
        score_doc = await db_manager.db[COLLECTION_AUDITS].find_one(
            {"page_id": payload.page_id, "user_email": current_user["email"]},
            sort=[("scored_at", -1)]
        )

    # If still no audit exists, generate a dynamic one on the fly
    if not score_doc:
        try:
            audit_res = generate_seo_audit(
                page_id=payload.page_id,
                page_data=page_doc,
                primary_keyword=payload.primary_keyword,
                lsi_keywords=[]
            )
            score_doc = audit_res.model_dump()
        except Exception as e:
            logger.error(f"Failed to generate SEO context score: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to analyze SEO score context."
            )

    # 3. Generate suggestions
    try:
        report = await generate_ai_suggestions(
            page_data=page_doc,
            score_data=score_doc,
            keyword=payload.primary_keyword
        )
        return report
    except Exception as e:
        logger.error(f"Failed to generate AI recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LLM suggestion generation failed: {str(e)}"
        )
