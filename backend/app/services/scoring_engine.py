import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.models.score import CategoryScore, ScoreBreakdown, ScoreResponse


def count_syllables(word: str) -> int:
    """
    Estimate the syllable count of a word.
    """
    word = word.lower().strip()
    if not word:
        return 0
    
    # Remove standard punctuation
    word = re.sub(r"[^\w]", "", word)
    if not word:
        return 0

    vowels = "aeiouy"
    count = 0
    
    # If the word starts with a vowel, count it
    if word[0] in vowels:
        count += 1
        
    # Count transitions from non-vowel to vowel
    for i in range(1, len(word)):
        if word[i] in vowels and word[i - 1] not in vowels:
            count += 1
            
    # Remove trailing silent 'e'
    if word.endswith("e") and count > 1:
        # Check if it ends in '-le' which usually makes a syllable (e.g., table, apple)
        if not word.endswith("le"):
            count -= 1
            
    return max(1, count)


def calculate_flesch_reading_ease(text: str) -> float:
    """
    Calculate the Flesch Reading Ease score of a given plain text string.
    Formula: 206.835 - 1.015 * (total_words / total_sentences) - 84.6 * (total_syllables / total_words)
    """
    clean_text = text.strip()
    if not clean_text:
        return 0.0

    words = clean_text.split()
    total_words = len(words)
    if total_words == 0:
        return 0.0

    # Approximate sentence splitting
    sentences = re.split(r"[.!?]+", clean_text)
    sentences = [s.strip() for s in sentences if s.strip()]
    total_sentences = len(sentences) if sentences else 1

    total_syllables = sum(count_syllables(w) for w in words)

    score = 206.835 - 1.015 * (total_words / total_sentences) - 84.6 * (total_syllables / total_words)
    return max(0.0, min(100.0, score))


def score_title_tag(title: Optional[str], keyword: str) -> CategoryScore:
    score = 100
    suggestions = []
    details = ""

    if not title:
        return CategoryScore(
            score=0,
            details="Missing title tag.",
            suggestions=["Add a descriptive <title> tag to your page."]
        )

    title_len = len(title)
    keyword_lower = keyword.lower()
    title_lower = title.lower()

    # 1. Length scoring (optimal 50-60 characters)
    if title_len < 30:
        score -= 30
        suggestions.append(f"Title is too short ({title_len} chars). Expand it to 50-60 characters to improve visibility.")
    elif title_len > 60:
        score -= 20
        suggestions.append(f"Title is too long ({title_len} chars). Shorten it to under 60 characters to avoid truncation in Google SERPs.")
    else:
        details += "Optimal length. "

    # 2. Keyword presence
    if keyword_lower not in title_lower:
        score -= 40
        suggestions.append(f"Primary keyword '{keyword}' was not found in the title tag.")
    else:
        # Check if keyword is at the beginning
        if title_lower.startswith(keyword_lower):
            details += "Primary keyword located at the beginning of the title (optimal for click rates). "
        else:
            details += "Primary keyword is present in the title tag. "

    score = max(0, score)
    if score == 100:
        details = "Your title tag is fully optimized!"

    return CategoryScore(score=score, details=details, suggestions=suggestions)


def score_meta_description(meta_desc: Optional[str], keyword: str) -> CategoryScore:
    score = 100
    suggestions = []
    details = ""

    if not meta_desc:
        return CategoryScore(
            score=0,
            details="Missing meta description.",
            suggestions=["Add a meta description to explain page contents in search snippets."]
        )

    desc_len = len(meta_desc)
    keyword_lower = keyword.lower()
    desc_lower = meta_desc.lower()

    # 1. Length scoring (optimal 120-160 characters)
    if desc_len < 90:
        score -= 25
        suggestions.append(f"Meta description is too short ({desc_len} chars). Expand to 120-160 characters.")
    elif desc_len > 160:
        score -= 20
        suggestions.append(f"Meta description is too long ({desc_len} chars). Keep it under 160 characters to avoid clipping in search snippets.")
    else:
        details += "Optimal description size. "

    # 2. Keyword presence
    if keyword_lower not in desc_lower:
        score -= 30
        suggestions.append(f"Primary keyword '{keyword}' is missing in the meta description.")
    else:
        details += "Primary keyword is present in the meta description. "

    # 3. Call-To-Action (CTA) presence
    cta_words = ["get", "learn", "discover", "boost", "try", "find", "check", "start", "free", "save", "buy"]
    has_cta = any(word in desc_lower for word in cta_words)
    if not has_cta:
        score -= 15
        suggestions.append("Add an action word/CTA (e.g. 'discover', 'learn', 'explore') to meta copy to increase CTR.")
    else:
        details += "Call-to-Action detected. "

    score = max(0, score)
    if score == 100:
        details = "Your meta description is fully optimized!"

    return CategoryScore(score=score, details=details, suggestions=suggestions)


def score_headings(headings: Dict[str, List[str]], keyword: str) -> CategoryScore:
    score = 100
    suggestions = []
    details = ""

    h1_list = headings.get("h1", [])
    h2_list = headings.get("h2", [])
    h3_list = headings.get("h3", [])

    # 1. H1 Count check (exactly 1 is optimal)
    if len(h1_list) == 0:
        score -= 40
        suggestions.append("No <h1> heading tag found. Add exactly one H1 tag describing the page's main topic.")
    elif len(h1_list) > 1:
        score -= 25
        suggestions.append(f"Multiple <h1> headings found ({len(h1_list)}). Consolidate them into a single primary H1 heading.")
    else:
        details += "Exactly one <h1> heading present. "

    # 2. Hierarchy skips (e.g., H3 exists but H2 is empty)
    if not h2_list and h3_list:
        score -= 15
        suggestions.append("Structural skip detected: Page contains <h3> headings but no <h2> headings. Fix the structure outline.")
    else:
        details += "Heading hierarchy is structured properly. "

    # 3. Keyword in Headings
    keyword_lower = keyword.lower()
    kw_in_h1 = any(keyword_lower in h.lower() for h in h1_list)
    kw_in_h2 = any(keyword_lower in h.lower() for h in h2_list)

    if not kw_in_h1:
        score -= 20
        suggestions.append(f"Inject primary keyword '{keyword}' inside the <h1> tag.")
    else:
        details += "Primary keyword used in H1 heading. "

    if h2_list and not kw_in_h2:
        score -= 10
        suggestions.append(f"Include the primary keyword '{keyword}' in at least one <h2> heading.")
    elif h2_list:
        details += "Primary keyword utilized in H2 headings. "

    score = max(0, score)
    if score == 100:
        details = "Excellent heading outline structure!"

    return CategoryScore(score=score, details=details, suggestions=suggestions)


def score_readability(word_count: int, body_text: str) -> CategoryScore:
    suggestions = []
    
    # 1. Content Length (optimal > 1000 words, minimum 300 words)
    length_score = 100
    if word_count < 300:
        length_score = 40
        suggestions.append(f"Content is thin ({word_count} words). Expand to at least 300-600 words to improve SEO value.")
    elif word_count < 1000:
        length_score = 75
        suggestions.append(f"Your content is {word_count} words. Aim for 1000+ words to cover the topic comprehensively.")
    else:
        length_score = 100

    # 2. Readability Ease
    flesch_score = calculate_flesch_reading_ease(body_text)
    
    if flesch_score < 30:
        readability_desc = "Very Difficult (Academic/College level). "
        suggestions.append("Simplify sentences and vocabulary to improve Flesch reading index (target > 50).")
    elif flesch_score < 60:
        readability_desc = "Fairly Difficult. "
    elif flesch_score < 80:
        readability_desc = "Standard/Conversational. "
    else:
        readability_desc = "Easy to read. "

    # Average of length and readability ease
    final_score = int((length_score + flesch_score) / 2)
    details = f"Flesch Readability Score: {flesch_score:.1f} ({readability_desc}). Word Count: {word_count}."

    return CategoryScore(score=final_score, details=details, suggestions=suggestions)


def score_keyword_density(body_text: str, word_count: int, primary_kw: str, lsi_kws: List[str]) -> CategoryScore:
    score = 100
    suggestions = []
    details = ""

    if word_count == 0 or not body_text:
        return CategoryScore(score=0, details="Empty content, unable to measure keyword density.", suggestions=["Add body copy text to run keyword density audits."])

    # Clean text to count keywords
    clean_text = body_text.lower()
    primary_lower = primary_kw.lower()

    # Find occurrences (using word boundaries to avoid false positives inside words)
    pattern = r"\b" + re.escape(primary_lower) + r"\b"
    matches = re.findall(pattern, clean_text)
    kw_count = len(matches)
    density = (kw_count / word_count) * 100

    # 1. Primary Keyword Density Scoring (Optimal 1.0% - 2.5%)
    if density == 0.0:
        score -= 40
        suggestions.append(f"Primary keyword '{primary_kw}' was not found in the body text copy. Inject it naturally.")
    elif density < 0.8:
        score -= 20
        suggestions.append(f"Keyword density is low ({density:.2f}%). Target between 1.0% and 2.5% density.")
    elif density > 3.0:
        score -= 30
        suggestions.append(f"Keyword stuffing warning ({density:.2f}%). Reduce keyword instances below 2.5% to avoid search penalties.")
    else:
        details += f"Optimal primary keyword density ({density:.2f}%). "

    # 2. LSI Keywords
    lsi_found = []
    lsi_missing = []
    for kw in lsi_kws:
        kw_clean = kw.lower().strip()
        if not kw_clean:
            continue
        lsi_pattern = r"\b" + re.escape(kw_clean) + r"\b"
        if re.search(lsi_pattern, clean_text):
            lsi_found.append(kw)
        else:
            lsi_missing.append(kw)

    if lsi_kws:
        found_ratio = len(lsi_found) / len(lsi_kws)
        if found_ratio < 0.5:
            score -= int(15 * (1.0 - found_ratio))
            suggestions.append(f"Missing semantically related (LSI) keywords: {', '.join(lsi_missing)}. Include them to improve contextual relevance.")
        else:
            details += f"Strong semantic LSI support ({len(lsi_found)}/{len(lsi_kws)} found). "
    else:
        details += "No target LSI keywords provided for comparison. "

    score = max(0, score)
    return CategoryScore(score=score, details=details, suggestions=suggestions)


def score_image_optimization(images: List[Dict[str, str]]) -> CategoryScore:
    score = 100
    suggestions = []
    details = ""

    if not images:
        # Don't penalize heavily but advise adding images
        return CategoryScore(
            score=100,
            details="No images detected on this page. Consider adding visual assets to improve readability.",
            suggestions=["Add relevant images with descriptive Alt attributes to enhance content quality."]
        )

    total_images = len(images)
    images_with_alt = sum(1 for img in images if img.get("alt", "").strip())
    
    if images_with_alt == total_images:
        details = "All images contain descriptive Alt tags. Excellent!"
    else:
        pct = (images_with_alt / total_images) * 100
        score = int(pct)
        missing_count = total_images - images_with_alt
        suggestions.append(f"Missing Alt attributes on {missing_count} out of {total_images} images. Add descriptive alt text to improve image accessibility.")
        details = f"{images_with_alt} of {total_images} images ({pct:.1f}%) have alt text tags."

    return CategoryScore(score=score, details=details, suggestions=suggestions)


def score_links(internal_links: List[str], external_links: List[str]) -> CategoryScore:
    score = 100
    suggestions = []
    details = ""

    int_count = len(internal_links)
    ext_count = len(external_links)

    # 1. Internal Link check (helps crawlability)
    if int_count == 0:
        score -= 30
        suggestions.append("No internal links found. Inject links pointing to other sections or pages on your domain.")
    elif int_count < 2:
        score -= 10
        suggestions.append("Low internal link count. Add 1-2 more internal reference links.")
    else:
        details += f"Healthy internal linking structure ({int_count} links). "

    # 2. External Outbound links check (increases trustworthiness)
    if ext_count == 0:
        score -= 20
        suggestions.append("No external outbound links found. Add links to trusted external references or high-quality domains.")
    else:
        details += f"Outbound links present ({ext_count} references). "

    score = max(0, score)
    return CategoryScore(score=score, details=details, suggestions=suggestions)


def generate_seo_audit(page_id: str, page_data: Dict[str, Any], primary_keyword: str, lsi_keywords: List[str]) -> ScoreResponse:
    """
    Perform a complete SEO assessment and generate scored outputs.
    """
    title_res = score_title_tag(page_data.get("title"), primary_keyword)
    meta_res = score_meta_description(page_data.get("meta_description"), primary_keyword)
    headings_res = score_headings(page_data.get("headings", {}), primary_keyword)
    
    # Extract body text and word count
    word_count = page_data.get("word_count", 0)
    body_text = page_data.get("body_text", "")
    readability_res = score_readability(word_count, body_text)
    
    density_res = score_keyword_density(body_text, word_count, primary_keyword, lsi_keywords)
    image_res = score_image_optimization(page_data.get("images", []))
    links_res = score_links(page_data.get("internal_links", []), page_data.get("external_links", []))

    # Calculate weighted average
    weights = {
        "title_tag": 0.15,
        "meta_description": 0.10,
        "headings": 0.15,
        "readability": 0.20,
        "keyword_density": 0.20,
        "image_optimization": 0.10,
        "link_ratio": 0.10,
    }

    weighted_score = (
        title_res.score * weights["title_tag"] +
        meta_res.score * weights["meta_description"] +
        headings_res.score * weights["headings"] +
        readability_res.score * weights["readability"] +
        density_res.score * weights["keyword_density"] +
        image_res.score * weights["image_optimization"] +
        links_res.score * weights["link_ratio"]
    )

    overall_score = int(round(weighted_score))

    breakdown = ScoreBreakdown(
        title_tag=title_res,
        meta_description=meta_res,
        headings=headings_res,
        readability=readability_res,
        keyword_density=density_res,
        image_optimization=image_res,
        link_ratio=links_res
    )

    return ScoreResponse(
        page_id=page_id,
        primary_keyword=primary_keyword,
        lsi_keywords=lsi_keywords,
        overall_score=overall_score,
        breakdown=breakdown,
        scored_at=datetime.now(timezone.utc)
    )
