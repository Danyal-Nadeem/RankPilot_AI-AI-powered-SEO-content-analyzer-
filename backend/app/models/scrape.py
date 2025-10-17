from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, HttpUrl


class ScrapeRequest(BaseModel):
    url: str


class ContentRequest(BaseModel):
    raw_content: str
    source_url: Optional[str] = None
    is_html: bool = False


class HeadingData(BaseModel):
    h1: List[str] = []
    h2: List[str] = []
    h3: List[str] = []
    h4: List[str] = []
    h5: List[str] = []
    h6: List[str] = []


class ImageData(BaseModel):
    src: str
    alt: str


class ScrapedPageData(BaseModel):
    source_url: Optional[str] = None
    title: Optional[str] = None
    meta_description: Optional[str] = None
    headings: HeadingData = HeadingData()
    body_text: str = ""
    word_count: int = 0
    images: List[ImageData] = []
    internal_links: List[str] = []
    external_links: List[str] = []
    scraped_at: datetime


class ScrapedPageResponse(ScrapedPageData):
    id: str
