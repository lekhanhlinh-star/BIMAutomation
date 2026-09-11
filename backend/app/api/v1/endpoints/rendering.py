import base64
import json
import logging
from typing import Annotated, Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form, Depends
from fastapi.responses import StreamingResponse
from celery.result import AsyncResult
import httpx

from app.core.config import settings
from app.core.celery_app import celery_app
from app.tasks.rendering_tasks import render_architecture_task
from app.services.rendering_client import rendering_client
from app.schemas.rendering import (
    PresetsCatalogResponse,
    RenderRequest,
    RenderResponse,
    RenderTaskResponse,
    RenderTaskStatus,
    GeometryMode,
    QualityTier
)

logger = logging.getLogger("rendering_endpoints")

router = APIRouter(prefix="/rendering", tags=["AI Architecture Rendering"])

@router.get("/presets", response_model=PresetsCatalogResponse, summary="Lấy danh mục presets, archetypes và các phần khóa bất biến")
async def get_rendering_presets():
    """Returns the catalog of architectural presets, styles, materials, and immutable preservation elements."""
    try:
        return await rendering_client.get_presets()
    except Exception as e:
        logger.error(f"Failed to fetch rendering presets from microservice: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Không thể kết nối tới AI Rendering Microservice: {str(e)}"
        )

@router.post("/render", response_model=RenderTaskResponse, summary="Đẩy tác vụ render kiến trúc vào hàng đợi Celery (Bất đồng bộ)")
async def submit_render_task(request: RenderRequest):
    """
    Submits an architectural rendering job to the Celery task queue with Redis broker.
    Returns task_id immediately for progress polling.
    """
    try:
        # Enqueue task to Celery
        task = render_architecture_task.delay(request.model_dump(mode="json"))
        return RenderTaskResponse(
            task_id=task.id,
            status=RenderTaskStatus.PENDING,
            progress=0,
            message="Yêu cầu render đã được tiếp nhận và đưa vào hàng đợi xử lý."
        )
    except Exception as e:
        logger.error(f"Failed to enqueue rendering task to Redis/Celery: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Không thể đưa tác vụ vào hàng đợi: {str(e)}"
        )

@router.post("/render/sync", response_model=RenderResponse, summary="Render kiến trúc trực tiếp (Đồng bộ chờ kết quả)")
async def render_synchronous(request: RenderRequest):
    """Synchronous direct render option for clients that prefer waiting for direct response."""
    try:
        return await rendering_client.render_json(request)
    except Exception as e:
        logger.error(f"Synchronous render failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Quá trình render thất bại: {str(e)}"
        )

@router.post("/render/upload", response_model=RenderTaskResponse, summary="Tải file ảnh lên và đẩy vào hàng đợi render Celery")
async def upload_and_enqueue_render(
    file: Annotated[UploadFile, File(description="File ảnh Revit 3D view (.png, .jpg, .jpeg, .webp)")],
    view_type: Annotated[Optional[str], Form(description="Loại phối cảnh: 'exterior' hoặc 'interior'")] = "exterior",
    archetype: Annotated[Optional[str], Form(description="Gói phong cách 1-chạm")] = None,
    style: Annotated[Optional[str], Form(description="Mã phong cách kiến trúc")] = "vietnam_modern_luxury_villa",
    lighting: Annotated[Optional[str], Form(description="Mã ánh sáng & thời tiết")] = "tropical_sunlight",
    material_mood: Annotated[Optional[str], Form(description="Mã mood vật liệu PBR")] = None,
    environment_context: Annotated[Optional[str], Form(description="Mã bối cảnh & cảnh quan")] = None,
    camera_perspective: Annotated[Optional[str], Form(description="Mã góc máy")] = "match_input_view",
    geometry_mode: Annotated[GeometryMode, Form(description="Chế độ bảo toàn hình học")] = GeometryMode.STRICT,
    quality: Annotated[QualityTier, Form(description="Cấp chất lượng")] = QualityTier.PREVIEW_1K,
    preservation_elements: Annotated[Optional[str], Form(description="Danh sách phần khóa bất biến phân tách dấu phẩy hoặc JSON array")] = None,
    quick_tags: Annotated[Optional[str], Form(description="Danh sách thẻ tính năng bổ trợ")] = None,
    custom_prompt: Annotated[Optional[str], Form(description="Ghi chú thêm tùy chọn của KTS")] = None,
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File tải lên phải là định dạng hình ảnh hợp lệ (PNG, JPEG, WEBP)."
        )

    try:
        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File ảnh rỗng."
            )

        b64_str = f"data:{file.content_type};base64,{base64.b64encode(file_bytes).decode('utf-8')}"

        tag_list: Optional[List[str]] = None
        if quick_tags and quick_tags.strip():
            tag_list = [t.strip() for t in quick_tags.split(",") if t.strip()]

        preservation_list: Optional[List[str]] = None
        if preservation_elements and preservation_elements.strip():
            if preservation_elements.strip().startswith("["):
                try:
                    preservation_list = json.loads(preservation_elements.strip())
                except Exception:
                    preservation_list = [p.strip() for p in preservation_elements.split(",") if p.strip()]
            else:
                preservation_list = [p.strip() for p in preservation_elements.split(",") if p.strip()]

        request = RenderRequest(
            image_base64=b64_str,
            view_type=view_type,
            archetype=archetype,
            style=style,
            lighting=lighting,
            material_mood=material_mood,
            environment_context=environment_context,
            camera_perspective=camera_perspective,
            geometry_mode=geometry_mode,
            quality=quality,
            preservation_elements=preservation_list if preservation_list is not None else ["lock_structure", "lock_roof", "lock_fenestration", "lock_camera"],
            quick_tags=tag_list,
            custom_prompt=custom_prompt
        )

        task = render_architecture_task.delay(request.model_dump(mode="json"))
        return RenderTaskResponse(
            task_id=task.id,
            status=RenderTaskStatus.PENDING,
            progress=0,
            message="Ảnh đã tải lên thành công và tác vụ render đã được đưa vào hàng đợi."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process render upload: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi xử lý file và hàng đợi: {str(e)}"
        )

@router.get("/tasks/{task_id}", response_model=RenderTaskResponse, summary="Polling kiểm tra tiến độ và kết quả tác vụ render")
async def get_task_status(task_id: str):
    """
    Checks the status and progress of a rendering task from the Celery Redis backend.
    Frontend polls this endpoint to update progress bar and retrieve final render URL.
    """
    task_result = AsyncResult(task_id, app=celery_app)
    state = task_result.state

    if state == "PENDING":
        return RenderTaskResponse(
            task_id=task_id,
            status=RenderTaskStatus.PENDING,
            progress=0,
            message="Tác vụ đang chờ trong hàng đợi..."
        )
    elif state == "PROCESSING":
        meta = task_result.info if isinstance(task_result.info, dict) else {}
        return RenderTaskResponse(
            task_id=task_id,
            status=RenderTaskStatus.PROCESSING,
            progress=meta.get("progress", 30),
            message=meta.get("message", "Đang tiến hành xử lý render...")
        )
    elif state == "SUCCESS":
        result_data = task_result.result
        render_resp = None
        if isinstance(result_data, dict):
            render_resp = RenderResponse.model_validate(result_data)
        return RenderTaskResponse(
            task_id=task_id,
            status=RenderTaskStatus.SUCCESS,
            progress=100,
            message="Quá trình render hoàn tất thành công!",
            result=render_resp
        )
    elif state == "FAILURE":
        return RenderTaskResponse(
            task_id=task_id,
            status=RenderTaskStatus.FAILURE,
            progress=100,
            message="Quá trình render thất bại.",
            error=str(task_result.result)
        )
    else:
        return RenderTaskResponse(
            task_id=task_id,
            status=RenderTaskStatus.PROCESSING,
            progress=50,
            message=f"Trạng thái hiện tại: {state}"
        )

@router.get("/outputs/{filename}", summary="Proxy stream ảnh render trực tiếp từ AI microservice")
async def proxy_rendered_image(filename: str):
    """
    Proxies and streams the rendered image from the AI microservice storage,
    allowing clients to access outputs securely through the Backend Gateway.
    """
    target_url = f"{rendering_client.base_url}/static/outputs/{filename}"
    client = httpx.AsyncClient(timeout=30.0)
    try:
        req = client.build_request("GET", target_url)
        resp = await client.send(req, stream=True)
        if resp.status_code == 404:
            await resp.aclose()
            await client.aclose()
            raise HTTPException(status_code=404, detail="Ảnh render không tồn tại hoặc đã hết hạn.")
        
        async def stream_generator():
            try:
                async for chunk in resp.aiter_bytes():
                    yield chunk
            finally:
                await resp.aclose()
                await client.aclose()

        content_type = resp.headers.get("content-type", "image/png")
        return StreamingResponse(stream_generator(), media_type=content_type)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to proxy image {filename}: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail=f"Lỗi khi tải ảnh từ AI microservice: {str(e)}")

@router.get("/health", summary="Kiểm tra trạng thái kết nối tới AI Microservice và Redis Broker")
async def check_rendering_subsystem_health():
    """Health check for AI rendering microservice and Redis task queue."""
    ai_status = "unavailable"
    ai_details = {}
    try:
        ai_details = await rendering_client.get_health()
        ai_status = "healthy"
    except Exception as e:
        ai_details = {"error": str(e)}

    redis_status = "unavailable"
    try:
        import redis
        r = redis.from_url(settings.redis_url)
        if r.ping():
            redis_status = "healthy"
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"

    return {
        "subsystem": "ai_architecture_rendering",
        "redis_broker": redis_status,
        "ai_microservice": ai_status,
        "ai_microservice_url": rendering_client.base_url,
        "details": ai_details
    }
