from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "rankpilot",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    broker_connection_retry_on_startup=True
)

celery_app.autodiscover_tasks(["app"])

from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    "send-weekly-digests": {
        "task": "app.tasks.send_weekly_digest_task",
        "schedule": crontab(hour=9, minute=0, day_of_week="monday"),
    }
}

