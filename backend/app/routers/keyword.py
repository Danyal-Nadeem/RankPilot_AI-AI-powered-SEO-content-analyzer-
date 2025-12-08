import logging
from datetime import datetime, timezone
from typing import List
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import db_manager
from app.core.deps import get_current_user
from app.models.keyword import (
    KeywordResearchRequest,
    KeywordResearchResponse,
    SaveKeywordRequest,
    SavedKeywordResponse,
)
from app.services.keyword import generate_keyword_research

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/keyword", tags=["keyword"])

COLLECTION_RESEARCH = "keyword_researches"
COLLECTION_LIST = "saved_keywords"


@router.post("/research", response_model=KeywordResearchResponse, status_code=status.HTTP_201_CREATED)
async def perform_research(
    payload: KeywordResearchRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Run keyword suggestion research on a seed keyword, saving queries to history logs.
    """
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )

    seed = payload.seed_keyword.strip()
    if not seed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seed keyword query cannot be empty."
        )

    try:
        report = await generate_keyword_research(seed)
    except Exception as e:
        logger.error(f"Keyword research failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Research module failed: {str(e)}"
        )

    # Save to history logs
    try:
        doc = report.model_dump()
        doc["user_email"] = current_user["email"]
        await db_manager.db[COLLECTION_RESEARCH].insert_one(doc)
    except Exception as e:
        logger.warning(f"Failed to write keyword query logs: {e}")

    return report


@router.get("/history", response_model=List[KeywordResearchResponse], status_code=status.HTTP_200_OK)
async def get_research_history(
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve keyword query research logs associated with user profile.
    """
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )

    cursor = db_manager.db[COLLECTION_RESEARCH].find(
        {"user_email": current_user["email"]}
    ).sort("created_at", -1).limit(10)
    
    history = []
    async for doc in cursor:
        doc.pop("_id", None)
        history.append(doc)

    return history


@router.post("/list", response_model=SavedKeywordResponse, status_code=status.HTTP_201_CREATED)
async def save_keyword(
    payload: SaveKeywordRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Save a research keyword suggestion to user's saved list.
    """
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )

    kw = payload.keyword.strip()
    if not kw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Keyword text cannot be empty."
        )

    # Check for duplicates
    existing = await db_manager.db[COLLECTION_LIST].find_one({
        "user_email": current_user["email"],
        "keyword": kw
    })
    
    if existing:
        existing["_id"] = str(existing["_id"])
        return existing

    doc = payload.model_dump()
    doc["user_email"] = current_user["email"]
    doc["created_at"] = datetime.now(timezone.utc)

    result = await db_manager.db[COLLECTION_LIST].insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    return doc


@router.get("/list", response_model=List[SavedKeywordResponse], status_code=status.HTTP_200_OK)
async def get_saved_keyword_list(
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve all saved keywords.
    """
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )

    cursor = db_manager.db[COLLECTION_LIST].find(
        {"user_email": current_user["email"]}
    ).sort("created_at", -1)
    
    saved_list = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        saved_list.append(doc)

    return saved_list


@router.delete("/list/{keyword_id}", status_code=status.HTTP_200_OK)
async def delete_saved_keyword(
    keyword_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Remove a saved keyword from list.
    """
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )

    try:
        oid = ObjectId(keyword_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid keyword ID format."
        )

    result = await db_manager.db[COLLECTION_LIST].delete_one({
        "_id": oid,
        "user_email": current_user["email"]
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Keyword not found in saved list."
        )

    return {"message": "Keyword successfully removed from saved list."}
