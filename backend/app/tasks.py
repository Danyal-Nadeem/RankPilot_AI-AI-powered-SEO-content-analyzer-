import logging
from datetime import datetime, timezone
import httpx
import pymongo
from bson import ObjectId
from app.core.celery_app import celery_app
from app.core.config import settings
from app.services.scraper import extract_page_data, DEFAULT_USER_AGENT
from app.services.scoring_engine import generate_seo_audit

logger = logging.getLogger(__name__)

# Collections names
COLLECTION_JOBS = "bulk_jobs"
COLLECTION_PAGES = "scraped_pages"
COLLECTION_AUDITS = "score_audits"


@celery_app.task(name="app.tasks.analyze_single_url_task")
def analyze_single_url_task(batch_id: str, url: str, primary_keyword: str, user_email: str):
    """
    Synchronous Celery task executing page crawl + SEO Scoring engine.
    Appends audit reports to bulk status array.
    """
    client = None
    try:
        client = pymongo.MongoClient(settings.MONGODB_URL)
        db = client[settings.MONGODB_DB_NAME]

        # 1. Fetch HTML from URL synchronously
        try:
            with httpx.Client(
                timeout=15.0,
                follow_redirects=True,
                headers={"User-Agent": DEFAULT_USER_AGENT}
            ) as http_client:
                res = http_client.get(url)
                res.raise_for_status()
                
                content_type = res.headers.get("content-type", "")
                if "text/html" not in content_type:
                    raise ValueError(f"Non-HTML content type received: {content_type}")
                
                html_content = res.text
        except Exception as e:
            logger.error(f"Scrape request failed for {url}: {e}")
            _update_job_with_error(db, batch_id, url, f"Scrape error: {str(e)}")
            return

        # 2. Parse HTML content with BeautifulSoup
        try:
            parsed_data = extract_page_data(html_content, base_url=url)
        except Exception as e:
            logger.error(f"HTML extract failed for {url}: {e}")
            _update_job_with_error(db, batch_id, url, f"Content parse error: {str(e)}")
            return

        # 3. Save Scraped Page in MongoDB
        page_doc = parsed_data.model_dump()
        page_doc["user_email"] = user_email
        page_insert = db[COLLECTION_PAGES].insert_one(page_doc)
        page_id = str(page_insert.inserted_id)

        # 4. Generate SEO audit breakdown score
        try:
            audit_res = generate_seo_audit(
                page_id=page_id,
                page_data=page_doc,
                primary_keyword=primary_keyword,
                lsi_keywords=[]
            )
        except Exception as e:
            logger.error(f"Audit generation failed for {url}: {e}")
            _update_job_with_error(db, batch_id, url, f"Scoring engine error: {str(e)}")
            return

        # 5. Save Score audit in MongoDB
        audit_doc = audit_res.model_dump()
        audit_doc["user_email"] = user_email
        db[COLLECTION_AUDITS].insert_one(audit_doc)

        # 6. Push success result and increment completed urls
        result_item = {
            "url": url,
            "status": "success",
            "page_id": page_id,
            "title": parsed_data.title or "Untitled Page",
            "score": audit_res.overall_score,
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "error": None
        }

        _update_job_progress(db, batch_id, result_item)

    except Exception as general_err:
        logger.error(f"Unexpected queue runner error for {url}: {general_err}")
        if client:
            try:
                db = client[settings.MONGODB_DB_NAME]
                _update_job_with_error(db, batch_id, url, f"Queue error: {str(general_err)}")
            except Exception:
                pass
    finally:
        if client:
            client.close()


def _update_job_with_error(db, batch_id: str, url: str, error_msg: str):
    """Log URL failure and update job progress counter."""
    result_item = {
        "url": url,
        "status": "failed",
        "page_id": None,
        "title": "Crawl Failed",
        "score": None,
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "error": error_msg
    }
    _update_job_progress(db, batch_id, result_item)


def _update_job_progress(db, batch_id: str, result_item: dict):
    """
    Atomic update for bulk analysis job tracker in MongoDB.
    Checks completed urls limit to mark job status as finished.
    """
    job_oid = ObjectId(batch_id)
    
    # Push item and increment count
    job = db[COLLECTION_JOBS].find_one_and_update(
        {"_id": job_oid},
        {
            "$push": {"results": result_item},
            "$inc": {"completed_urls": 1},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        },
        return_document=pymongo.ReturnDocument.AFTER
    )

    if job:
        # Check if batch analysis has finished
        if job["completed_urls"] >= job["total_urls"]:
            db[COLLECTION_JOBS].update_one(
                {"_id": job_oid},
                {"$set": {"status": "completed"}}
            )

            # Dispatch notification email
            try:
                user_doc = db["users"].find_one({"email": job["user_email"]})
                # Default preference to True if not explicit in DB
                if user_doc and user_doc.get("bulk_completed_email", True):
                    from app.services.email import send_bulk_scan_completed_email
                    final_job = db[COLLECTION_JOBS].find_one({"_id": job_oid})
                    send_bulk_scan_completed_email(
                        to_email=job["user_email"],
                        name=user_doc.get("name", "User"),
                        batch_id=batch_id,
                        results=final_job.get("results", []),
                        keyword=job.get("primary_keyword", "N/A")
                    )
            except Exception as mail_ex:
                logger.error(f"Failed sending bulk scan completion email: {mail_ex}")


@celery_app.task(name="app.tasks.send_weekly_digest_task")
def send_weekly_digest_task():
    """
    Weekly cron job aggregating SEO audit histories over the past week 
    and dispatching digest reports to opt-in profiles.
    """
    from datetime import timedelta
    from urllib.parse import urlparse
    from collections import Counter

    client = None
    try:
        client = pymongo.MongoClient(settings.MONGODB_URL)
        db = client[settings.MONGODB_DB_NAME]
        
        users = list(db["users"].find())
        # We need timezone-aware datetime or naive depending on DB values
        # MongoDB stores ISO date strings or datetimes, usually timezone naive UTC or aware
        one_week_ago = datetime.utcnow() - timedelta(days=7)
        
        for user in users:
            # Opt-in check
            if not user.get("weekly_digest_email", True):
                continue
                
            email = user["email"]
            name = user.get("name", "User")
            
            # Fetch audits for user in the last week
            audits = list(db[COLLECTION_AUDITS].find({
                "user_email": email,
                "scored_at": {"$gte": one_week_ago}
            }))
            
            if not audits:
                continue
                
            total_scans = len(audits)
            avg_score = round(sum(a["overall_score"] for a in audits) / total_scans)
            
            # Find top domains
            domains = []
            for a in audits:
                page_id = a.get("page_id")
                if page_id:
                    try:
                        page = db[COLLECTION_PAGES].find_one({"_id": ObjectId(page_id)})
                        if page and page.get("source_url"):
                            domain = urlparse(page["source_url"]).netloc
                            if domain:
                                domains.append(domain)
                    except Exception:
                        pass
                        
            top_domain = Counter(domains).most_common(1)[0][0] if domains else "N/A"
            
            stats = {
                "total_scans": total_scans,
                "avg_score": avg_score,
                "top_domain": top_domain
            }
            
            try:
                from app.services.email import send_weekly_digest_email
                send_weekly_digest_email(email, name, stats)
            except Exception as e:
                logger.error(f"Error sending weekly digest to {email}: {e}")
                
    except Exception as e:
        logger.error(f"Weekly digest cron job failed: {e}")
    finally:
        if client:
            client.close()


