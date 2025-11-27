from typing import List
from pydantic import BaseModel, Field


class CompetitorComparisonRequest(BaseModel):
    primary_url: str = Field(..., description="The main URL being analyzed")
    competitor_urls: List[str] = Field(default=[], max_items=3, description="Up to 3 competitor URLs to compare against")
    primary_keyword: str = Field(..., description="Target keyword to evaluate all pages against")


class PageComparisonMetrics(BaseModel):
    url: str
    overall_score: int
    word_count: int
    title_score: int
    meta_score: int
    headings_score: int
    readability_score: int
    density_score: int
    image_score: int
    link_score: int


class ContentGapKeyword(BaseModel):
    keyword: str
    competitor_frequency: float
    user_frequency: float
    suggested_usage: str


class CompetitorComparisonResponse(BaseModel):
    primary_metrics: PageComparisonMetrics
    competitors_metrics: List[PageComparisonMetrics]
    content_gaps: List[ContentGapKeyword]
