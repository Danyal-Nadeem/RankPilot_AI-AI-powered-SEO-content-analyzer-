"""
MongoDB index creation helper.
Called once on startup to ensure proper query performance.
"""
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


async def create_indexes(db: AsyncIOMotorDatabase):
    """
    Create all required MongoDB collection indexes.
    Safe to call on every startup — `createIndex` is idempotent.
    """
    try:
        # ── users ──────────────────────────────────────────────
        await db["users"].create_index("email", unique=True, name="users_email_unique")
        await db["users"].create_index("verification_token", sparse=True, name="users_verification_token")

        # ── scraped_pages ──────────────────────────────────────
        await db["scraped_pages"].create_index("user_email", name="pages_user_email")
        await db["scraped_pages"].create_index(
            [("user_email", 1), ("scraped_at", -1)],
            name="pages_user_sorted"
        )
        await db["scraped_pages"].create_index("source_url", name="pages_source_url")

        # ── score_audits ───────────────────────────────────────
        await db["score_audits"].create_index("user_email", name="audits_user_email")
        await db["score_audits"].create_index("page_id", name="audits_page_id")
        await db["score_audits"].create_index(
            [("user_email", 1), ("scored_at", -1)],
            name="audits_user_sorted"
        )

        # ── keyword_research ───────────────────────────────────
        await db["keyword_research"].create_index("user_email", name="keywords_user_email")
        await db["keyword_research"].create_index(
            [("user_email", 1), ("created_at", -1)],
            name="keywords_user_sorted"
        )

        # ── bulk_jobs ──────────────────────────────────────────
        await db["bulk_jobs"].create_index("user_email", name="bulk_user_email")
        await db["bulk_jobs"].create_index("status", name="bulk_status")
        await db["bulk_jobs"].create_index(
            [("user_email", 1), ("created_at", -1)],
            name="bulk_user_sorted"
        )

        logger.info("MongoDB indexes created/verified successfully.")

    except Exception as e:
        logger.error(f"Failed to create MongoDB indexes: {e}")
