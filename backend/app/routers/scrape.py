import logging
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import db_manager
from app.core.deps import get_current_user
from app.models.scrape import ContentRequest, ScrapedPageData, ScrapedPageResponse, ScrapeRequest
from app.services.scraper import (
    check_robots,
    extract_page_data,
    fetch_url,
    parse_raw_content,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scrape", tags=["scraping"])

COLLECTION = "scraped_pages"


def _format_response(doc: dict) -> ScrapedPageResponse:
    """Convert a MongoDB document to a ScrapedPageResponse."""
    doc["id"] = str(doc.pop("_id"))
    return ScrapedPageResponse(**doc)


async def _save_to_db(data: ScrapedPageData, user_email: str) -> str:
    """Persist scraped data to MongoDB and return the inserted _id."""
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is unavailable."
        )
    doc = data.model_dump()
    doc["user_email"] = user_email
    result = await db_manager.db[COLLECTION].insert_one(doc)
    return str(result.inserted_id)


@router.post("/url", status_code=status.HTTP_201_CREATED)
async def scrape_url(
    payload: ScrapeRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Accept a URL, validate it, check robots.txt, scrape HTML,
    extract SEO data, and persist to MongoDB.
    """
    url = str(payload.url).strip()

    # Basic URL validation
    if not url.startswith(("http://", "https://")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL must start with http:// or https://"
        )

    # robots.txt check
    allowed = await check_robots(url)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Scraping this URL is disallowed by the site's robots.txt."
        )

    # Fetch HTML
    try:
        html = await fetch_url(url)
    except TimeoutError as e:
        raise HTTPException(status_code=status.HTTP_408_REQUEST_TIMEOUT, detail=str(e))
    except (ConnectionError, ValueError) as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected scraping error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Scraping failed unexpectedly.")

    # Extract SEO data
    page_data = extract_page_data(html, base_url=url)

    # Save to MongoDB
    inserted_id = await _save_to_db(page_data, current_user["email"])

    return {"id": inserted_id, **page_data.model_dump()}


@router.post("/content", status_code=status.HTTP_201_CREATED)
async def submit_content(
    payload: ContentRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Accept raw HTML or plain text content, extract SEO data,
    and persist to MongoDB.
    """
    if not payload.raw_content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content cannot be empty."
        )

    page_data = parse_raw_content(
        content=payload.raw_content,
        is_html=payload.is_html,
        source_url=payload.source_url,
    )

    inserted_id = await _save_to_db(page_data, current_user["email"])

    return {"id": inserted_id, **page_data.model_dump()}


@router.get("/{page_id}", status_code=status.HTTP_200_OK)
async def get_scraped_page(
    page_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve a previously stored scraped page by its MongoDB _id.
    """
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is unavailable."
        )

    try:
        oid = ObjectId(page_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid page ID format."
        )

    doc = await db_manager.db[COLLECTION].find_one(
        {"_id": oid, "user_email": current_user["email"]}
    )

    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scraped page not found."
        )

    doc["id"] = str(doc.pop("_id"))
    return doc
