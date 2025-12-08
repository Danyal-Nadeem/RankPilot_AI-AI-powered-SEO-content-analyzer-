import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List

import anthropic
from app.core.config import settings
from app.models.keyword import KeywordIdea, KeywordResearchResponse

logger = logging.getLogger(__name__)


def _generate_mock_keyword_data(seed: str) -> Dict[str, Any]:
    """Fallback keyword research suggestions when Anthropic API Key is not set."""
    seed_title = seed.title()
    return {
        "seed_keyword": seed,
        "related_keywords": [
            {
                "keyword": f"best {seed}",
                "intent": "transactional",
                "content_angle": "Review page comparing best alternatives and top features."
            },
            {
                "keyword": f"how to do {seed}",
                "intent": "informational",
                "content_angle": "Comprehensive step-by-step guide with illustrations."
            },
            {
                "keyword": f"{seed} benefits",
                "intent": "informational",
                "content_angle": "Analytical blog post highlighting value and efficiency stats."
            },
            {
                "keyword": f"free {seed} tool",
                "intent": "transactional",
                "content_angle": "Interactive landing page carrying product trial CTAs."
            }
        ],
        "long_tail_variations": [
            {
                "keyword": f"step by step {seed} guide for beginners",
                "intent": "informational",
                "content_angle": "Resource hub targeting entry-level creators."
            },
            {
                "keyword": f"top {seed} software tools for marketers",
                "intent": "transactional",
                "content_angle": "Comparison listicle checking prices and pros/cons."
            },
            {
                "keyword": f"why is {seed} important for seo search success",
                "intent": "informational",
                "content_angle": "Thought leadership article detailing industry metrics."
            }
        ],
        "content_ideas": [
            f"The Ultimate 2026 Blueprint to Mastering {seed_title}",
            f"Top 7 Mistakes to Avoid When Managing {seed_title}",
            f"Case Study: How We Boosted Our Rank by 200% Using {seed_title}"
        ]
    }


async def generate_keyword_research(seed_keyword: str) -> KeywordResearchResponse:
    """
    Generate keyword research suggestions using Claude structured JSON output or a mock fallback.
    """
    seed = seed_keyword.strip()
    
    if not settings.ANTHROPIC_API_KEY:
        logger.info("No ANTHROPIC_API_KEY configured. Generating high-quality mock keyword research.")
        suggestions = _generate_mock_keyword_data(seed)
    else:
        try:
            logger.info(f"Initializing Claude query for seed keyword: '{seed}'...")
            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            
            prompt = f"""You are RankPilot AI, an expert SEO keyword research system.
Analyze the following seed keyword to generate related keywords, long-tail variations, and content ideas.

Seed Keyword: "{seed}"

You MUST categorize the search intent of each keyword strictly as either: "informational", "transactional", or "navigational".
Suggest a specific copy content angle for each keyword.

You MUST return ONLY a valid, parseable JSON object matching this schema structure, with no markdown tags or wrapper explanations:
{{
  "related_keywords": [
    {{"keyword": "related phrase 1", "intent": "informational", "content_angle": "suggested angle"}},
    {{"keyword": "related phrase 2", "intent": "transactional", "content_angle": "suggested angle"}}
  ],
  "long_tail_variations": [
    {{"keyword": "long-tail variation phrase 1", "intent": "informational", "content_angle": "suggested angle"}},
    {{"keyword": "long-tail variation phrase 2", "intent": "transactional", "content_angle": "suggested angle"}}
  ],
  "content_ideas": [
    "Suggested Article Title Idea 1",
    "Suggested Article Title Idea 2",
    "Suggested Article Title Idea 3"
  ]
}}"""

            response = client.messages.create(
                model=settings.CLAUDE_MODEL,
                max_tokens=2000,
                temperature=0.2,
                system="You are an SEO keyword research assistant. Always output JSON mode content.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            raw_text = response.content[0].text.strip()
            
            # Strip potential markdown fences if returned
            if raw_text.startswith("```"):
                raw_text = raw_text.split("```json")[-1].split("```")[0].strip()
                
            data = json.loads(raw_text)
            
            suggestions = {
                "seed_keyword": seed,
                "related_keywords": data.get("related_keywords", []),
                "long_tail_variations": data.get("long_tail_variations", []),
                "content_ideas": data.get("content_ideas", [])
            }
            
        except Exception as e:
            logger.error(f"Failed to query keyword research from Anthropic: {e}. Falling back to mock data.")
            suggestions = _generate_mock_keyword_data(seed)

    return KeywordResearchResponse(
        seed_keyword=suggestions["seed_keyword"],
        related_keywords=[KeywordIdea(**kw) for kw in suggestions["related_keywords"]],
        long_tail_variations=[KeywordIdea(**kw) for kw in suggestions["long_tail_variations"]],
        content_ideas=suggestions["content_ideas"],
        created_at=datetime.now(timezone.utc)
    )
