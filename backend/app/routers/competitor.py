import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import db_manager
from app.core.deps import get_current_user
from app.models.competitor import CompetitorComparisonRequest, CompetitorComparisonResponse
from app.services.competitor import analyze_competitor_comparison

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/competitor", tags=["competitor"])

COLLECTION_COMPARISONS = "competitor_comparisons"


@router.post("/compare", response_model=CompetitorComparisonResponse, status_code=status.HTTP_200_OK)
async def compare_competitors(
    payload: CompetitorComparisonRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Scrape primary site and up to 3 competitors in parallel.
    Run scoring audits against the focus keyword and generate content gaps.
    """
    primary_url = payload.primary_url.strip()
    competitor_urls = [url.strip() for url in payload.competitor_urls if url.strip()]
    keyword = payload.primary_keyword.strip()

    if not primary_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Primary website URL cannot be empty."
        )
        
    if not keyword:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Focus keyword cannot be empty."
        )

    # Execute Parallel Scraping and Auditing
    try:
        report = await analyze_competitor_comparison(
            primary_url=primary_url,
            competitor_urls=competitor_urls,
            keyword=keyword
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Competitor comparison failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected failure occurred: {str(e)}"
        )

    # Save to MongoDB
    if db_manager.db is not None:
        try:
            report_dict = report.model_dump()
            report_dict["user_email"] = current_user["email"]
            report_dict["compared_at"] = datetime.now(timezone.utc)
            await db_manager.db[COLLECTION_COMPARISONS].insert_one(report_dict)
        except Exception as e:
            logger.warning(f"Failed to persist competitor comparison logs: {e}")

    return report
