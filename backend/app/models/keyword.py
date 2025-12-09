from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class KeywordResearchRequest(BaseModel):
    seed_keyword: str = Field(..., description="The seed term to query research suggestions for")


class KeywordIdea(BaseModel):
    keyword: str
    intent: str = Field(..., description="Classification: informational, transactional, or navigational")
    content_angle: str = Field(..., description="Suggested SEO context focus or search angle")


class KeywordResearchResponse(BaseModel):
    seed_keyword: str
    related_keywords: List[KeywordIdea]
    long_tail_variations: List[KeywordIdea]
    content_ideas: List[str]
    created_at: datetime


class SaveKeywordRequest(BaseModel):
    keyword: str
    intent: str
    content_angle: str


class SavedKeywordResponse(BaseModel):
    id: str = Field(..., alias="_id")
    keyword: str
    intent: str
    content_angle: str
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
