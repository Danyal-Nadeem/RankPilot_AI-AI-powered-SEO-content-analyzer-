import logging
import re
from datetime import datetime, timezone
from typing import Dict, List, Optional
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import httpx
from bs4 import BeautifulSoup

from app.models.scrape import HeadingData, ImageData, ScrapedPageData

logger = logging.getLogger(__name__)

# Browser-like user agent to avoid blocks
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/125.0.0.0 Safari/537.36"
)

REQUEST_TIMEOUT = 15.0  # seconds


async def check_robots(url: str) -> bool:
    """
    Returns True if scraping is allowed, False if blocked by robots.txt.
    Fails open (returns True) on any fetch error.
    """
    try:
        parsed = urlparse(url)
        robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"

        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(robots_url, headers={"User-Agent": DEFAULT_USER_AGENT})

        rp = RobotFileParser()
        rp.set_url(robots_url)
        rp.parse(res.text.splitlines())
        return rp.can_fetch(DEFAULT_USER_AGENT, url)
    except Exception:
        # Fail open — if we can't fetch robots.txt, allow crawling
        return True


async def fetch_url(url: str) -> str:
    """
    Fetch raw HTML from a URL using httpx async client.
    Raises descriptive HTTPException-friendly exceptions.
    """
    try:
        async with httpx.AsyncClient(
            timeout=REQUEST_TIMEOUT,
            follow_redirects=True,
            headers={"User-Agent": DEFAULT_USER_AGENT},
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

        # Validate it's actually HTML content
        content_type = response.headers.get("content-type", "")
        if "text/html" not in content_type:
            raise ValueError(f"Non-HTML content type received: {content_type}")

        return response.text

    except httpx.TimeoutException:
        raise TimeoutError(f"Request timed out after {REQUEST_TIMEOUT}s for URL: {url}")
    except httpx.ConnectError:
        raise ConnectionError(f"Could not connect to host: {url}")
    except httpx.HTTPStatusError as e:
        raise ConnectionError(f"HTTP error {e.response.status_code} for URL: {url}")
    except ValueError:
        raise


def extract_page_data(html: str, base_url: Optional[str] = None) -> ScrapedPageData:
    """
    Parse HTML with BeautifulSoup and extract all SEO-relevant data.
    """
    soup = BeautifulSoup(html, "lxml")

    # --- Title ---
    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else None

    # --- Meta Description ---
    meta_desc_tag = soup.find("meta", attrs={"name": re.compile("description", re.I)})
    meta_description = meta_desc_tag.get("content", "").strip() if meta_desc_tag else None

    # --- Headings ---
    headings = HeadingData(
        h1=[tag.get_text(strip=True) for tag in soup.find_all("h1")],
        h2=[tag.get_text(strip=True) for tag in soup.find_all("h2")],
        h3=[tag.get_text(strip=True) for tag in soup.find_all("h3")],
        h4=[tag.get_text(strip=True) for tag in soup.find_all("h4")],
        h5=[tag.get_text(strip=True) for tag in soup.find_all("h5")],
        h6=[tag.get_text(strip=True) for tag in soup.find_all("h6")],
    )

    # --- Body Text (remove scripts, styles, nav, footer) ---
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
        tag.decompose()

    body = soup.find("body") or soup
    body_text = " ".join(body.get_text(separator=" ", strip=True).split())
    word_count = len(body_text.split())

    # --- Images ---
    images: List[ImageData] = []
    for img in soup.find_all("img", src=True):
        src = img.get("src", "").strip()
        alt = img.get("alt", "").strip()
        if src:
            if base_url and not src.startswith(("http://", "https://")):
                src = urljoin(base_url, src)
            images.append(ImageData(src=src, alt=alt))

    # --- Links ---
    internal_links: List[str] = []
    external_links: List[str] = []

    if base_url:
        base_domain = urlparse(base_url).netloc.lower()
        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"].strip()
            if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
                continue
            absolute = urljoin(base_url, href)
            parsed = urlparse(absolute)
            if not parsed.scheme.startswith("http"):
                continue
            link_domain = parsed.netloc.lower()
            if link_domain == base_domain:
                if absolute not in internal_links:
                    internal_links.append(absolute)
            else:
                if absolute not in external_links:
                    external_links.append(absolute)

    return ScrapedPageData(
        source_url=base_url,
        title=title,
        meta_description=meta_description,
        headings=headings,
        body_text=body_text,
        word_count=word_count,
        images=images,
        internal_links=internal_links[:50],   # cap at 50 to avoid huge payloads
        external_links=external_links[:50],
        scraped_at=datetime.now(timezone.utc),
    )


def parse_raw_content(content: str, is_html: bool = False, source_url: Optional[str] = None) -> ScrapedPageData:
    """
    Parse raw text or HTML directly without fetching any URL.
    """
    if is_html:
        return extract_page_data(content, base_url=source_url)

    # Plain text — wrap minimal scaffold to reuse the same pipeline
    escaped = content.replace("<", "&lt;").replace(">", "&gt;")
    minimal_html = f"<html><body><p>{escaped}</p></body></html>"
    data = extract_page_data(minimal_html, base_url=source_url)
    # Override with direct word count from original content
    data.word_count = len(content.split())
    return data
