from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field


class BulkScanRequest(BaseModel):
    urls: List[str] = Field(..., max_items=20, min_items=1, description="List of URLs to scrape and score.")
    primary_keyword: str = Field(..., description="Focus keyword for SEO scoring comparison.")


class BulkScanResultItem(BaseModel):
    url: str
    status: str
    page_id: Optional[str] = None
    title: str
    score: Optional[int] = None
    completed_at: str
    error: Optional[str] = None


class BulkJobStatusResponse(BaseModel):
    job_id: str
    urls: List[str]
    total_urls: int
    completed_urls: int
    status: str
    results: List[BulkScanResultItem]
    created_at: datetime
    updated_at: datetime
