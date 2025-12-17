from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class AuditHistoryItem(BaseModel):
    page_id: str
    url: Optional[str] = None
    title: Optional[str] = None
    latest_score: Optional[int] = None
    scraped_at: datetime
    audited_at: Optional[datetime] = None


class AuditHistoryResponse(BaseModel):
    items: List[AuditHistoryItem]
    total_count: int
    page: int
    limit: int


class DashboardStatsResponse(BaseModel):
    total_analyses: int
    average_score: float
    most_analyzed_domain: str
    remaining_scans: int
