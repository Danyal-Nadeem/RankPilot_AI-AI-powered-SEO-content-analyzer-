from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class AISuggestionRequest(BaseModel):
    page_id: str
    score_audit_id: Optional[str] = None
    primary_keyword: str


class TitleVariant(BaseModel):
    variant: str
    rationale: str


class MetaVariant(BaseModel):
    variant: str
    rationale: str


class RewriteSuggestion(BaseModel):
    section: str
    original_excerpt: str
    suggested_rewrite: str
    reason: str


class AISuggestions(BaseModel):
    title_suggestions: List[TitleVariant]
    meta_suggestions: List[MetaVariant]
    rewrite_suggestions: List[RewriteSuggestion]
    missing_keywords: List[str]
    readability_tips: List[str]


class AISuggestionResponse(BaseModel):
    page_id: str
    primary_keyword: str
    suggestions: AISuggestions
    cached: bool = False
    generated_at: datetime
