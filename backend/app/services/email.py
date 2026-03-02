import logging
import httpx
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Add config parameters locally or via settings fallback
RESEND_API_KEY = settings.RESEND_API_KEY
SMTP_HOST = settings.SMTP_HOST
SMTP_PORT = settings.SMTP_PORT
SMTP_USER = settings.SMTP_USER
SMTP_PASSWORD = settings.SMTP_PASSWORD
SMTP_FROM = settings.SMTP_FROM
FRONTEND_URL = "http://localhost:3000"


def send_html_email(to_email: str, subject: str, html_content: str):
    """
    Unified email sender helper.
    Dispatches via Resend REST API if RESEND_API_KEY is present.
    Otherwise falls back to standard SMTP.
    If neither configured, prints template to logs for local developer debugging.
    """
    if RESEND_API_KEY:
        try:
            url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "from": SMTP_FROM,
                "to": [to_email],
                "subject": subject,
                "html": html_content
            }
            res = httpx.post(url, headers=headers, json=payload, timeout=10.0)
            if res.status_code in [200, 201, 202]:
                logger.info(f"Email successfully sent to {to_email} via Resend API.")
                return True
            else:
                logger.error(f"Resend email dispatch failed: {res.status_code} - {res.text}")
        except Exception as e:
            logger.error(f"Resend API dispatch error: {e}")

    if SMTP_HOST and SMTP_USER and SMTP_PASSWORD:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = SMTP_FROM
            msg["To"] = to_email

            part = MIMEText(html_content, "html")
            msg.attach(part)

            server = smtplib.SMTP(SMTP_HOST, int(SMTP_PORT))
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, to_email, msg.as_string())
            server.quit()
            logger.info(f"Email successfully sent to {to_email} via SMTP Server.")
            return True
        except Exception as e:
            logger.error(f"SMTP email dispatch error: {e}")

    # Local development print logs fallback
    logger.info("---------------- EMAIL MOCK LOG ----------------")
    logger.info(f"Recipient: {to_email}")
    logger.info(f"Subject: {subject}")
    logger.info("Content Preview:")
    logger.info(html_content[:500] + "...")
    logger.info("------------------------------------------------")
    return True


def send_verification_email(to_email: str, name: str, token: str):
    """Send signup validation link verification email."""
    verify_link = f"{FRONTEND_URL}/dashboard?verify_token={token}"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b; }}
            .container {{ max-width: 580px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }}
            .header {{ text-align: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }}
            .logo {{ font-size: 20px; font-weight: 800; color: #4f46e5; text-decoration: none; }}
            .button {{ display: inline-block; background-color: #4f46e5; color: white !important; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin-top: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); }}
            .footer {{ text-align: center; margin-top: 32px; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <a href="#" class="logo">RankPilot AI</a>
            </div>
            <h3>Verify your email address</h3>
            <p>Hi {name},</p>
            <p>Welcome to RankPilot AI! Please verify your email address to complete your account setup and run content score audits.</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="{verify_link}" class="button">Verify Email Address</a>
            </div>
            <p style="font-size: 12px; color: #64748b;">Or copy this link to your browser: <br>{verify_link}</p>
            <div class="footer">
                <p>Sent by RankPilot AI. Optimization & audit tools.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_html_email(to_email, "Verify your RankPilot AI Account", html)


def send_bulk_scan_completed_email(to_email: str, name: str, batch_id: str, results: List[Dict[str, Any]], keyword: str):
    """Notify user of completion details for bulk URL audits."""
    total = len(results)
    success = sum(1 for r in results if r["status"] == "success")
    failed = total - success
    
    valid_scores = [r["score"] for r in results if r["score"] is not None]
    avg_score = round(sum(valid_scores) / len(valid_scores)) if valid_scores else 0

    html_rows = ""
    for item in results:
        status_color = "#10b981" if item["status"] == "success" else "#ef4444"
        score_val = f"Score: <b>{item['score']}</b>" if item["score"] is not None else "—"
        html_rows += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px;">{item['url']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: {status_color}; font-weight: bold;">{item['status'].upper()}</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; text-align: center;">{score_val}</td>
        </tr>
        """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 20px; color: #1e293b; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }}
            .stat-box {{ display: inline-block; width: 28%; background-color: #f1f5f9; border-radius: 8px; padding: 12px; margin: 5px; text-align: center; }}
            .stat-num {{ font-size: 20px; font-weight: bold; color: #4f46e5; }}
            .stat-lbl {{ font-size: 10px; color: #64748b; text-transform: uppercase; }}
            .footer {{ text-align: center; margin-top: 30px; font-size: 12px; color: #64748b; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Bulk Scan Crawl Job Finished</h2>
            <p>Hi {name},</p>
            <p>Your queued batch analysis for keyword <b>"{keyword}"</b> has finished. Yahan summary stats hain:</p>
            
            <div style="text-align: center; margin: 20px 0;">
                <div class="stat-box">
                    <span class="stat-num">{total}</span><br>
                    <span class="stat-lbl">Total URLs</span>
                </div>
                <div class="stat-box">
                    <span class="stat-num" style="color: #10b981;">{success}</span><br>
                    <span class="stat-lbl">Success</span>
                </div>
                <div class="stat-box">
                    <span class="stat-num">{avg_score}</span><br>
                    <span class="stat-lbl">Avg Score</span>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead>
                    <tr style="background-color: #f8fafc; text-align: left;">
                        <th style="padding: 10px; border-bottom: 2px solid #e2e8f0; font-size: 12px;">Crawl Destination</th>
                        <th style="padding: 10px; border-bottom: 2px solid #e2e8f0; font-size: 12px;">Status</th>
                        <th style="padding: 10px; border-bottom: 2px solid #e2e8f0; font-size: 12px; text-align: center;">Score</th>
                    </tr>
                </thead>
                <tbody>
                    {html_rows}
                </tbody>
            </table>

            <div style="text-align: center; margin-top: 25px;">
                <a href="{FRONTEND_URL}/dashboard" style="background-color: #4f46e5; color: white !important; font-weight: 600; text-decoration: none; padding: 10px 20px; border-radius: 8px;">View Full Dashboard Details</a>
            </div>

            <div class="footer">
                <p>Sent by RankPilot AI. Optimization & audit tools.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_html_email(to_email, f"RankPilot AI: Bulk Crawl Job completed for {keyword}", html)


def send_weekly_digest_email(to_email: str, name: str, stats: Dict[str, Any]):
    """Send digest summarizing total page reviews in past 7 days."""
    scans = stats.get("total_scans", 0)
    avg_score = stats.get("avg_score", 0)
    top_domain = stats.get("top_domain", "None")

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; }}
            .container {{ max-width: 580px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; }}
            .footer {{ text-align: center; margin-top: 32px; font-size: 12px; color: #64748b; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Your RankPilot Weekly Digest</h2>
            <p>Hi {name},</p>
            <p>Yahan aapka summary snapshot hai for analyses performed this past week:</p>
            
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;">Total Analyses Run: <b>{scans}</b></p>
                <p style="margin: 5px 0;">Average SEO Score: <b>{avg_score} / 100</b></p>
                <p style="margin: 5px 0;">Most Analyzed Domain: <b>{top_domain}</b></p>
            </div>
            
            <p>Keep optimizing! Perform new crawls and scoring regularly to push your search engine rankings higher.</p>
            
            <div class="footer">
                <p>Sent by RankPilot AI. You can toggle digest emails off in your settings.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_html_email(to_email, "RankPilot AI: Your Weekly Performance Digest", html)
