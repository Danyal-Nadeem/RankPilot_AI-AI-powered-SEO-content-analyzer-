import io
from datetime import datetime
from typing import Dict, Any, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak


def generate_pdf_report(page_data: Dict[str, Any], audit_data: Dict[str, Any]) -> io.BytesIO:
    """
    Generate a professional PDF SEO report using ReportLab platypus layouts.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    story = []
    styles = getSampleStyleSheet()

    # Define custom branding colors
    primary_color = colors.HexColor("#4f46e5")  # Indigo
    secondary_color = colors.HexColor("#312e81")  # Deep Blue
    neutral_dark = colors.HexColor("#1e293b")  # Slate 800
    neutral_light = colors.HexColor("#f8fafc")  # Slate 50
    border_color = colors.HexColor("#e2e8f0")  # Slate 200

    # Custom styles
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=colors.white,
        spaceAfter=10
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#c7d2fe"),
        spaceAfter=5
    )
    h2_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=secondary_color,
        spaceBefore=15,
        spaceAfter=8,
        keepWithNext=True
    )
    h3_style = ParagraphStyle(
        "SubSectionHeader",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=neutral_dark,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        "ReportBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=neutral_dark
    )
    bullet_style = ParagraphStyle(
        "ReportBullet",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#475569"),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    # 1. Branding Header Banner Table
    header_data = [
        [
            Paragraph("RankPilot AI — SEO Audit Report", title_style),
            ""
        ],
        [
            Paragraph(f"Target Keyword: <b>{audit_data.get('primary_keyword', 'N/A')}</b>", subtitle_style),
            Paragraph(f"Generated: <b>{datetime.now().strftime('%Y-%m-%d %H:%M')}</b>", ParagraphStyle("RightHeader", parent=subtitle_style, alignment=2))
        ]
    ]
    header_table = Table(header_data, colWidths=[3.5 * inch, 3.5 * inch])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), primary_color),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('SPAN', (0, 0), (1, 0)),
        ('TOPPADDING', (0, 0), (-1, -1), 16),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 16),
        ('LEFTPADDING', (0, 0), (-1, -1), 18),
        ('RIGHTPADDING', (0, 0), (-1, -1), 18),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 20))

    # 2. Document Metadata Details
    meta_url = page_data.get("source_url") or "Pasted Raw Content Draft"
    meta_title = page_data.get("title") or "Untitled Document"
    
    meta_data = [
        [Paragraph("<b>Analyzed URL:</b>", body_style), Paragraph(meta_url, body_style)],
        [Paragraph("<b>Page Title:</b>", body_style), Paragraph(meta_title, body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[1.5 * inch, 5.5 * inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), neutral_light),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('LINEBELOW', (0, 0), (-1, -1), 0.5, border_color),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 25))

    # 3. Overall Performance Scorecard Block
    overall_score = audit_data.get("overall_score", 0)
    score_desc = "Good" if overall_score >= 80 else "Fair" if overall_score >= 50 else "Poor"
    score_color = colors.HexColor("#10b981") if overall_score >= 80 else colors.HexColor("#f59e0b") if overall_score >= 50 else colors.HexColor("#ef4444")

    score_data = [
        [
            Paragraph("OVERALL SEO RATING", ParagraphStyle("ScoreLabel", parent=body_style, fontName="Helvetica-Bold", fontSize=11, textColor=colors.HexColor("#64748b"))),
            Paragraph(f"<font color='{score_color}' size='48'><b>{overall_score}</b></font> / 100", ParagraphStyle("BigScore", parent=body_style, leading=52)),
            Paragraph(f"Rating Level: <b>{score_desc}</b>", ParagraphStyle("ScoreDesc", parent=body_style, fontName="Helvetica-Bold", textColor=score_color))
        ]
    ]
    score_table = Table(score_data, colWidths=[2.2 * inch, 2.8 * inch, 2.0 * inch])
    score_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 16),
        ('BOX', (0, 0), (-1, -1), 1, border_color),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 25))

    # 4. Detailed Category Score Breakdowns
    story.append(Paragraph("Category Performance Breakdowns", h2_style))
    story.append(Spacer(1, 8))

    breakdown = audit_data.get("breakdown", {})
    categories = [
        ("title_tag", "Title Tag Optimization"),
        ("meta_description", "Meta Description Optimization"),
        ("headings", "Heading Structure"),
        ("readability", "Readability & Word Count"),
        ("keyword_density", "Keyword Density & LSIs"),
        ("image_optimization", "Image Alt-Tag Coverage"),
        ("link_ratio", "Internal & External Links Ratio")
    ]

    for key, label in categories:
        cat_data = breakdown.get(key)
        if not cat_data:
            continue

        score = cat_data.get("score", 0)
        badge_color = "#10b981" if score >= 80 else "#f59e0b" if score >= 50 else "#ef4444"
        details = cat_data.get("details", "")

        # Render Category Row Header
        cat_header_data = [
            [
                Paragraph(f"<b>{label}</b>", h3_style),
                Paragraph(f"<font color='{badge_color}'><b>Score: {score}/100</b></font>", ParagraphStyle("RightScore", parent=h3_style, alignment=2))
            ]
        ]
        cat_header_table = Table(cat_header_data, colWidths=[4.5 * inch, 2.5 * inch])
        cat_header_table.setStyle(TableStyle([
            ('LINEBELOW', (0, 0), (-1, -1), 1, primary_color),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(cat_header_table)
        story.append(Spacer(1, 6))

        # Show details summary
        story.append(Paragraph(details, body_style))
        story.append(Spacer(1, 6))

        # Render improvement checklist items
        suggestions = cat_data.get("suggestions", [])
        if suggestions:
            story.append(Paragraph("<b>Recommended Checklist actions:</b>", ParagraphStyle("ActionLabel", parent=body_style, fontName="Helvetica-Bold", fontSize=9, spaceAfter=4)))
            for sug in suggestions:
                story.append(Paragraph(f"&bull; {sug}", bullet_style))
        else:
            story.append(Paragraph("&bull; No issues found! Standard criteria fulfilled.", bullet_style))

        story.append(Spacer(1, 15))

    doc.build(story)
    buffer.seek(0)
    return buffer
