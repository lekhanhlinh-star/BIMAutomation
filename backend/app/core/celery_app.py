from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "bimautomation_tasks",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.rendering_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes max per render task
    broker_connection_retry_on_startup=True,
    result_expires=3600 * 24,  # Keep task results in Redis for 24 hours
)
