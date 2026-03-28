"""
Unit tests for RankPilot AI SEO Scoring Engine.
Run with: python -m pytest tests/ -v
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from app.services.scoring_engine import (
    count_syllables,
    calculate_flesch_reading_ease,
    score_title_tag,
    score_meta_description,
    generate_seo_audit,
)


# ──────────────────────────────────────────────
# count_syllables
# ──────────────────────────────────────────────

class TestCountSyllables:
    def test_monosyllabic_words(self):
        assert count_syllables("cat") >= 1
        assert count_syllables("dog") >= 1
        assert count_syllables("run") >= 1

    def test_multisyllabic_words(self):
        assert count_syllables("beautiful") >= 3
        assert count_syllables("communication") >= 5

    def test_empty_string(self):
        assert count_syllables("") == 0

    def test_single_letter(self):
        assert count_syllables("a") >= 1

    def test_number_like_token(self):
        # Punctuation-stripped tokens shouldn't crash
        assert count_syllables("123") >= 1


# ──────────────────────────────────────────────
# calculate_flesch_reading_ease
# ──────────────────────────────────────────────

class TestFleschReadingEase:
    def test_returns_float(self):
        score = calculate_flesch_reading_ease("This is a simple sentence. Easy to read.")
        assert isinstance(score, float)

    def test_empty_string_returns_zero(self):
        assert calculate_flesch_reading_ease("") == 0.0

    def test_score_clamped_between_0_and_100(self):
        score = calculate_flesch_reading_ease("a" * 1000)
        assert 0.0 <= score <= 100.0

    def test_simple_text_higher_than_complex(self):
        simple = calculate_flesch_reading_ease("The cat sat on the mat. It is a small cat.")
        complex_text = calculate_flesch_reading_ease(
            "Photosynthesis is the process by which autotrophic organisms utilize electromagnetic radiation."
        )
        assert simple >= complex_text


# ──────────────────────────────────────────────
# score_title_tag
# ──────────────────────────────────────────────

class TestScoreTitleTag:
    def test_missing_title_returns_zero(self):
        result = score_title_tag(None, "seo tools")
        assert result.score == 0

    def test_perfect_title_returns_100(self):
        result = score_title_tag("SEO tools for content marketing professionals", "seo tools")
        assert result.score == 100

    def test_short_title_penalized(self):
        result = score_title_tag("Hi", "seo")
        assert result.score < 100

    def test_long_title_penalized(self):
        result = score_title_tag("a" * 70, "seo")
        assert result.score < 100

    def test_missing_keyword_penalized(self):
        result = score_title_tag("Best Marketing Tips for Beginners", "seo tools")
        assert result.score < 100

    def test_score_non_negative(self):
        result = score_title_tag("x", "keyword that is definitely not here at all")
        assert result.score >= 0

    def test_returns_category_score(self):
        from app.models.score import CategoryScore
        result = score_title_tag("Good SEO Title Tag", "seo")
        assert isinstance(result, CategoryScore)
        assert hasattr(result, "suggestions")


# ──────────────────────────────────────────────
# score_meta_description
# ──────────────────────────────────────────────

class TestScoreMetaDescription:
    def test_missing_meta_returns_zero(self):
        result = score_meta_description(None, "seo")
        assert result.score == 0

    def test_optimal_meta_with_keyword(self):
        meta = "Discover the best SEO tools and strategies to grow your organic traffic in 2024."
        result = score_meta_description(meta, "seo tools")
        assert result.score > 50

    def test_too_short_meta_penalized(self):
        result = score_meta_description("Short.", "seo")
        assert result.score < 100

    def test_too_long_meta_penalized(self):
        result = score_meta_description("a" * 200, "seo")
        assert result.score < 100

    def test_score_non_negative(self):
        result = score_meta_description("x", "missing keyword")
        assert result.score >= 0


# ──────────────────────────────────────────────
# generate_seo_audit (integration)
# ──────────────────────────────────────────────

class TestGenerateSeoAudit:
    def _make_page_doc(self, **kwargs):
        base = {
            "title": "Best SEO Tools for Content Marketers",
            "meta_description": "Explore the top SEO tools designed to boost your organic traffic and content strategy.",
            "headings": {
                "h1": ["Best SEO Tools for Content Marketers"],
                "h2": ["Why SEO Matters", "Top Tools"],
                "h3": [],
                "h4": [],
                "h5": [],
                "h6": [],
            },
            "body_text": " ".join(["SEO content marketing tools organic search keywords"] * 30),
            "word_count": 150,
            "images": [],
            "internal_links": ["https://example.com/page"],
            "external_links": [],
            "source_url": "https://example.com",
            "scraped_at": "2024-01-01T00:00:00Z",
        }
        base.update(kwargs)
        return base

    def test_returns_score_response(self):
        from app.models.score import ScoreResponse
        doc = self._make_page_doc()
        result = generate_seo_audit("fake_page_id", doc, "seo tools", lsi_keywords=[])
        assert isinstance(result, ScoreResponse)

    def test_overall_score_range(self):
        doc = self._make_page_doc()
        result = generate_seo_audit("fake_page_id", doc, "seo tools", lsi_keywords=[])
        assert 0 <= result.overall_score <= 100

    def test_all_category_scores_present(self):
        doc = self._make_page_doc()
        result = generate_seo_audit("fake_page_id", doc, "seo tools", lsi_keywords=[])
        assert result.breakdown is not None
        breakdown = result.breakdown
        assert hasattr(breakdown, "title_tag")
        assert hasattr(breakdown, "meta_description")
        assert hasattr(breakdown, "readability")
        assert hasattr(breakdown, "headings")
        assert hasattr(breakdown, "image_optimization")
        assert hasattr(breakdown, "link_ratio")
        assert hasattr(breakdown, "keyword_density")


    def test_empty_page_gives_low_score(self):
        doc = self._make_page_doc(
            title=None,
            meta_description=None,
            body_text="",
            word_count=0,
            headings={"h1": [], "h2": [], "h3": [], "h4": [], "h5": [], "h6": []},
            images=[],
            internal_links=[],
            external_links=[],
        )
        result = generate_seo_audit("empty_id", doc, "seo tools", lsi_keywords=[])
        assert result.overall_score < 40

    def test_keyword_in_title_improves_score(self):
        doc_with = self._make_page_doc(title="SEO Tools for Beginners Guide")
        doc_without = self._make_page_doc(title="Marketing Tips for Professionals")
        score_with = generate_seo_audit("id1", doc_with, "seo tools", lsi_keywords=[]).overall_score
        score_without = generate_seo_audit("id2", doc_without, "seo tools", lsi_keywords=[]).overall_score
        assert score_with >= score_without

