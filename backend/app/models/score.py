from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ScoreRequest(BaseModel):
    page_id: str
    primary_keyword: str
    lsi_keywords: List[str] = []


class CategoryScore(BaseModel):
    score: int
    details: str
    suggestions: List[str] = []


class ScoreBreakdown(BaseModel):
    title_tag: CategoryScore
    meta_description: CategoryScore
    headings: CategoryScore
    readability: CategoryScore
    keyword_density: CategoryScore
    image_optimization: CategoryScore
    link_ratio: CategoryScore


class ScoreResponse(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    page_id: str
    primary_keyword: str
    lsi_keywords: List[str] = []
    overall_score: int
    breakdown: ScoreBreakdown
    scored_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
