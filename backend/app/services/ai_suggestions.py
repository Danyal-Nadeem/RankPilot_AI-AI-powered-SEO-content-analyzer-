import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

import anthropic
from app.core.config import settings
from app.core.database import db_manager
from app.models.ai_suggestions import AISuggestions, AISuggestionResponse

logger = logging.getLogger(__name__)


def _get_cache_key(page_id: str, keyword: str) -> str:
    """Generate cache key using SHA-256 hash of parameters."""
    kw_hash = hashlib.sha256(keyword.strip().lower().encode("utf-8")).hexdigest()
    return f"ai_sug:{page_id}:{kw_hash}"


async def get_cached_suggestions(page_id: str, keyword: str) -> Optional[Dict[str, Any]]:
    """Try to retrieve cached suggestions from Upstash Redis."""
    try:
        cache_key = _get_cache_key(page_id, keyword)
        # Check if database manager has active Redis connection
        if db_manager.redis and await db_manager.redis.ping():
            cached = await db_manager.redis.get(cache_key)
            if cached:
                logger.info(f"Redis cache hit for key: {cache_key}")
                return json.loads(cached)
    except Exception as e:
        logger.warning(f"Failed reading suggestions from Redis cache: {e}")
    return None


async def set_cached_suggestions(page_id: str, keyword: str, data: Dict[str, Any]) -> None:
    """Cache suggestions in Redis for 1 hour."""
    try:
        cache_key = _get_cache_key(page_id, keyword)
        if db_manager.redis:
            await db_manager.redis.setex(
                cache_key,
                3600,  # 1 hour TTL
                json.dumps(data)
            )
            logger.info(f"Suggestions cached in Redis with key: {cache_key}")
    except Exception as e:
        logger.warning(f"Failed writing suggestions to Redis cache: {e}")


def _generate_mock_suggestions(title: str, meta: str, keyword: str, body_excerpt: str) -> Dict[str, Any]:
    """Fallback mock generator for suggestions when Anthropic API Key is not set."""
    return {
        "title_suggestions": [
            {
                "variant": f"Ultimate Guide: {keyword.title()} for Beginners",
                "rationale": "Injects the primary keyword at the front and uses click-generating guide hooks."
            },
            {
                "variant": f"How to Boost SEO with {keyword.title()} in 2026",
                "rationale": "Leverages urgency with year placement and lists actionable outcome benefits."
            },
            {
                "variant": f"Step-by-Step {keyword.title()} Strategy",
                "rationale": "High CTR hook targeting users searching for structured workflows."
            }
        ],
        "meta_suggestions": [
            {
                "variant": f"Want to master {keyword}? Read our actionable guide to optimize your search rankings and boost organic visibility today.",
                "rationale": "Uses active CTAs ('Read our guide', 'optimize', 'boost') within optimal length rules."
            },
            {
                "variant": f"Discover the exact steps we use to rank for {keyword}. Learn SEO secrets, content strategies, and growth hacks now.",
                "rationale": "Targets search intent directly using psychological hooks ('Discover', 'Learn secrets')."
            },
            {
                "variant": f"Unlock high-performance rankings. Learn how {keyword} can grow your blog conversion rates by over 50% immediately.",
                "rationale": "Focuses on numerical value benefits to drive high click rates."
            }
        ],
        "rewrite_suggestions": [
            {
                "section": "Introductory Paragraph",
                "original_excerpt": body_excerpt[:150] + "..." if body_excerpt else "SEO is important for website rankings...",
                "suggested_rewrite": f"Optimizing your web copy for {keyword} is the most effective way to rank fast in search results. By leveraging structured headlines and semantic keyword distribution, your blog content gains a clear search advantage.",
                "reason": "Directly resolves structural ambiguity by introducing keyword focus at the very beginning."
            }
        ],
        "missing_keywords": [
            f"{keyword} optimization",
            "SEO crawl structure",
            "search ranking factors",
            "page indexing"
        ],
        "readability_tips": [
            "Use shorter paragraphs (under 3 sentences) to maintain user engagement.",
            "Integrate bullet lists to present stats grids visually.",
            "Write in a conversational tone to lower reading difficulty levels."
        ]
    }


async def generate_ai_suggestions(
    page_data: Dict[str, Any],
    score_data: Dict[str, Any],
    keyword: str
) -> AISuggestionResponse:
    """
    Generate content rewriting suggestions using Claude API or a high-quality fallback generator.
    Caches the results to Redis for performance.
    """
    page_id = str(page_data.get("_id") or page_data.get("id"))
    
    # 1. Check Redis Cache
    cached = await get_cached_suggestions(page_id, keyword)
    if cached:
        return AISuggestionResponse(
            page_id=page_id,
            primary_keyword=keyword,
            suggestions=AISuggestions(**cached),
            cached=True,
            generated_at=datetime.now(timezone.utc)
        )

    # 2. Call Anthropic Claude or use Fallback
    suggestions_dict = None
    
    if not settings.ANTHROPIC_API_KEY:
        logger.info("No ANTHROPIC_API_KEY configured. Generating high-quality mock suggestions.")
        excerpt = page_data.get("body_text", "")[:300]
        suggestions_dict = _generate_mock_suggestions(
            title=page_data.get("title") or "",
            meta=page_data.get("meta_description") or "",
            keyword=keyword,
            body_excerpt=excerpt
        )
    else:
        try:
            logger.info("Initializing Anthropic Claude client for SEO suggestions...")
            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            
            # Format inputs for context prompt
            current_title = page_data.get("title") or "None"
            current_meta = page_data.get("meta_description") or "None"
            body_excerpt = page_data.get("body_text", "")[:1200]
            score_breakdown = score_data.get("breakdown", {})
            
            # Strict prompt for JSON output format
            prompt = f"""You are RankPilot AI, an expert SEO copywriting system.
Analyze the following webpage metrics and target keyword to generate optimization recommendations.

Target Keyword: "{keyword}"
Current Title: "{current_title}"
Current Meta Description: "{current_meta}"
Content Excerpt: "{body_excerpt}"
Score Audit Details: {json.dumps(score_breakdown)}

Generate the optimization response. You MUST return ONLY a valid, parseable JSON object matching this schema structure, with no markdown tags or wrapper explanations:
{{
  "title_suggestions": [
    {{"variant": "Title variant 1", "rationale": "why this variant works"}},
    {{"variant": "Title variant 2", "rationale": "why this variant works"}},
    {{"variant": "Title variant 3", "rationale": "why this variant works"}}
  ],
  "meta_suggestions": [
    {{"variant": "Meta variant 1", "rationale": "why this variant works"}},
    {{"variant": "Meta variant 2", "rationale": "why this variant works"}},
    {{"variant": "Meta variant 3", "rationale": "why this variant works"}}
  ],
  "rewrite_suggestions": [
    {{
      "section": "Name of section",
      "original_excerpt": "original sentence from the excerpt that is weak",
      "suggested_rewrite": "rewritten sentence incorporating target keywords",
      "reason": "reason for rewrite"
    }}
  ],
  "missing_keywords": ["keyword 1", "keyword 2", "keyword 3"],
  "readability_tips": ["tip 1", "tip 2"]
}}"""

            response = client.messages.create(
                model=settings.CLAUDE_MODEL,
                max_tokens=2000,
                temperature=0.2,
                system="You are an SEO optimization content generator. Always output JSON mode content.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            raw_text = response.content[0].text.strip()
            
            # Strip potential markdown fences if returned
            if raw_text.startswith("```"):
                # strip lead/trail markdown JSON wrappers
                raw_text = raw_text.split("```json")[-1].split("```")[0].strip()
            
            suggestions_dict = json.loads(raw_text)
            
        except Exception as e:
            logger.error(f"Failed to generate suggestions via Anthropic: {e}. Falling back to mocks.")
            excerpt = page_data.get("body_text", "")[:300]
            suggestions_dict = _generate_mock_suggestions(
                title=page_data.get("title") or "",
                meta=page_data.get("meta_description") or "",
                keyword=keyword,
                body_excerpt=excerpt
            )

    # 3. Save to Redis cache
    if suggestions_dict:
        await set_cached_suggestions(page_id, keyword, suggestions_dict)
        
    return AISuggestionResponse(
        page_id=page_id,
        primary_keyword=keyword,
        suggestions=AISuggestions(**suggestions_dict),
        cached=False,
        generated_at=datetime.now(timezone.utc)
    )
