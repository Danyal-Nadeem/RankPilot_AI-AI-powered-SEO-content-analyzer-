from fastapi import APIRouter, status
from app.core.database import db_manager

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", status_code=status.HTTP_200_OK)
async def check_health():
    mongodb_status = "unhealthy"
    redis_status = "unhealthy"

    # Check MongoDB
    if db_manager.client is not None:
        try:
            await db_manager.client.admin.command('ping')
            mongodb_status = "healthy"
        except Exception:
            pass

    # Check Redis
    if db_manager.redis is not None:
        try:
            await db_manager.redis.ping()
            redis_status = "healthy"
        except Exception:
            pass

    overall_status = "healthy" if mongodb_status == "healthy" and redis_status == "healthy" else "degraded"

    return {
        "status": overall_status,
        "services": {
            "mongodb": mongodb_status,
            "redis": redis_status
        }
    }
