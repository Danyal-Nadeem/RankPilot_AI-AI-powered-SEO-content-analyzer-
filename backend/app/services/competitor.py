import asyncio
import logging
import re
from typing import Dict, Any, List, Optional, Set, Tuple

from app.models.competitor import (
    CompetitorComparisonResponse,
    ContentGapKeyword,
    PageComparisonMetrics,
)
from app.services.scraper import check_robots, fetch_url, extract_page_data
from app.services.scoring_engine import generate_seo_audit

logger = logging.getLogger(__name__)

STOP_WORDS: Set[str] = {
    "the", "and", "a", "of", "to", "in", "is", "that", "it", "on", "for", "with",
    "as", "at", "by", "an", "be", "this", "are", "from", "or", "your", "you",
    "will", "can", "have", "more", "about", "web", "site", "page", "our", "their",
    "we", "us", "they", "them", "not", "but", "what", "which", "how", "why"
}


async def safe_scrape_and_score(url: str, keyword: str) -> Optional[Tuple[Dict[str, Any], Dict[str, Any]]]:
    """
    Safely crawls and scores a URL, catching any errors to avoid crashing parallel workflows.
    Returns (page_data, score_data) or None on failure.
    """
    try:
        url = url.strip()
        # Verify robots.txt
        allowed = await check_robots(url)
        if not allowed:
            logger.warning(f"Robots.txt disallowed scraping for competitor: {url}")
            return None

        # Fetch page HTML
        html = await fetch_url(url)
        
        # Extract page elements
        page_data = extract_page_data(html, base_url=url)
        page_dict = page_data.model_dump()
        
        # Calculate SEO Audit Scores
        score_report = generate_seo_audit(
            page_id="temp_id",
            page_data=page_dict,
            primary_keyword=keyword,
            lsi_keywords=[]
        )
        
        return page_dict, score_report.model_dump()
        
    except Exception as e:
        logger.error(f"Failed safe scrape and score for URL {url}: {e}")
        return None


def extract_word_frequencies(body_text: str) -> Dict[str, float]:
    """
    Tokenize body text, filter out stop words, and calculate relative frequencies.
    """
    if not body_text:
        return {}

    # Extract alphanumeric words
    words = re.findall(r"\b[a-zA-Z]{3,20}\b", body_text.lower())
    total_words = len(words)
    if total_words == 0:
        return {}

    freq_dict: Dict[str, int] = {}
    for w in words:
        if w not in STOP_WORDS:
            freq_dict[w] = freq_dict.get(w, 0) + 1

    # Convert to percentage relative density
    return {w: (count / total_words) * 100 for w, count in freq_dict.items()}


def perform_content_gap_analysis(
    primary_text: str,
    competitor_texts: List[str]
) -> List[ContentGapKeyword]:
    """
    Find top keywords that are frequently used in competitors' pages but absent or underutilized on the user's page.
    """
    primary_freqs = extract_word_frequencies(primary_text)
    
    # Aggregate competitor frequencies
    competitor_freqs_list = [extract_word_frequencies(txt) for txt in competitor_texts if txt]
    if not competitor_freqs_list:
        return []

    # Map words to their average competitor frequencies
    all_competitor_words: Set[str] = set()
    for freqs in competitor_freqs_list:
        all_competitor_words.update(freqs.keys())

    gaps: List[ContentGapKeyword] = []
    
    for word in all_competitor_words:
        # Average frequency across competitors
        comp_vals = [freqs.get(word, 0.0) for freqs in competitor_freqs_list]
        avg_comp_freq = sum(comp_vals) / len(comp_vals)
        
        user_freq = primary_freqs.get(word, 0.0)
        
        # We flag a gap if the word is used significantly by competitors but barely by the user
        if avg_comp_freq > 0.4 and user_freq < 0.1:
            # Suggest placement location advice
            suggested_usage = f"Integrate '{word}' inside H2 subheadings or main body copy (target frequency: {avg_comp_freq:.2f}%)."
            if avg_comp_freq > 1.2:
                suggested_usage = f"Crucial term! Introduce '{word}' inside the introductory paragraph and at least 2 heading tags."
                
            gaps.append(
                ContentGapKeyword(
                    keyword=word,
                    competitor_frequency=round(avg_comp_freq, 3),
                    user_frequency=round(user_freq, 3),
                    suggested_usage=suggested_usage
                )
            )

    # Sort gaps by competitor frequency descending, and cap at 8 items
    gaps.sort(key=lambda g: g.competitor_frequency, reverse=True)
    return gaps[:8]


def _format_metrics(url: str, page_data: Dict[str, Any], score_data: Dict[str, Any]) -> PageComparisonMetrics:
    """Format metrics dict into Pydantic PageComparisonMetrics model."""
    breakdown = score_data.get("breakdown", {})
    return PageComparisonMetrics(
        url=url,
        overall_score=score_data.get("overall_score", 0),
        word_count=page_data.get("word_count", 0),
        title_score=breakdown.get("title_tag", {}).get("score", 0),
        meta_score=breakdown.get("meta_description", {}).get("score", 0),
        headings_score=breakdown.get("headings", {}).get("score", 0),
        readability_score=breakdown.get("readability", {}).get("score", 0),
        density_score=breakdown.get("keyword_density", {}).get("score", 0),
        image_score=breakdown.get("image_optimization", {}).get("score", 0),
        link_score=breakdown.get("link_ratio", {}).get("score", 0),
    )


async def analyze_competitor_comparison(
    primary_url: str,
    competitor_urls: List[str],
    keyword: str
) -> CompetitorComparisonResponse:
    """
    Run parallel scrapes and SEO audits for the primary page and up to 3 competitor URLs.
    Extract comparative scorecard data and conduct content gap keyword checks.
    """
    # 1. Gather all crawls in parallel
    tasks = [safe_scrape_and_score(primary_url, keyword)]
    for comp_url in competitor_urls:
        tasks.append(safe_scrape_and_score(comp_url, keyword))

    results = await asyncio.gather(*tasks)

    # 2. Extract primary result
    primary_res = results[0]
    if not primary_res:
        raise ValueError(f"Failed to crawl or parse the primary URL: {primary_url}")

    primary_page, primary_score = primary_res
    primary_metrics = _format_metrics(primary_url, primary_page, primary_score)

    # 3. Extract successful competitor results
    competitor_metrics_list: List[PageComparisonMetrics] = []
    competitor_texts: List[str] = []
    
    for idx, comp_url in enumerate(competitor_urls):
        comp_res = results[idx + 1]
        if comp_res:
            comp_page, comp_score = comp_res
            competitor_metrics_list.append(_format_metrics(comp_url, comp_page, comp_score))
            competitor_texts.append(comp_page.get("body_text", ""))
        else:
            logger.warning(f"Skipping failed competitor URL in scorecard comparison: {comp_url}")

    # 4. Content Gap Analysis
    content_gaps = perform_content_gap_analysis(
        primary_text=primary_page.get("body_text", ""),
        competitor_texts=competitor_texts
    )

    return CompetitorComparisonResponse(
        primary_metrics=primary_metrics,
        competitors_metrics=competitor_metrics_list,
        content_gaps=content_gaps
    )
