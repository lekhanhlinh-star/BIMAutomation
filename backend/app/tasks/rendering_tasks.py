import logging
from typing import Dict, Any
from app.core.celery_app import celery_app
from app.services.rendering_client import rendering_client

logger = logging.getLogger("rendering_tasks")

@celery_app.task(
    bind=True,
    name="app.tasks.rendering_tasks.render_architecture_task",
    max_retries=2,
    default_retry_delay=5
)
def render_architecture_task(self, request_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Celery background worker task for processing architectural rendering jobs.
    Coordinates queuing, progress reporting, and invocation of the AI microservice.
    """
    task_id = self.request.id
    logger.info(f"[{task_id}] Starting architectural rendering background task...")

    try:
        # Step 1: Initialize Task
        self.update_state(
            state="PROCESSING",
            meta={
                "progress": 15,
                "message": "Đang phân tích cấu hình hình học và bối cảnh kiến trúc..."
            }
        )

        # Step 2: In-flight to AI Microservice
        self.update_state(
            state="PROCESSING",
            meta={
                "progress": 40,
                "message": "Đang kết nối AI Rendering Microservice & chuẩn bị tổng hợp prompt..."
            }
        )

        # Step 3: Invoke AI Microservice
        logger.info(f"[{task_id}] Calling AI Rendering Microservice...")
        result = rendering_client.render_json_sync(request_dict)

        # Step 4: Rendering Complete
        self.update_state(
            state="PROCESSING",
            meta={
                "progress": 95,
                "message": "Quá trình tạo ảnh hoàn tất. Đang đóng gói kết quả..."
            }
        )

        logger.info(f"[{task_id}] Architectural render completed successfully!")
        return result

    except Exception as exc:
        logger.error(f"[{task_id}] Rendering task failed: {exc}", exc_info=True)
        # Attempt retry if network or connection issue
        if self.request.retries < self.max_retries:
            logger.warning(f"[{task_id}] Retrying render task ({self.request.retries + 1}/{self.max_retries})...")
            raise self.retry(exc=exc)
        raise exc
