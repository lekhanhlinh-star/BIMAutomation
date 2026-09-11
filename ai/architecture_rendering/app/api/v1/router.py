import base64
import json
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import ValidationError
from app.core.config import settings
from app.schemas.render import RenderOptions, RenderRequest, RenderResponse, PromptPreview, PresetsCatalogResponse, HealthResponse
from app.services.preset_service import PresetCatalog
from app.services.request_service import prepare_render, OptionError
from app.services.rendering_service import ArchitecturalRenderingService, rendering_service, RenderFailure

api_router = APIRouter()


def get_rendering_service():
    return rendering_service


Service = Annotated[ArchitecturalRenderingService, Depends(get_rendering_service)]


def validation_error(exc):
    # Never echo uploaded base64 or raw input in API validation responses.
    return HTTPException(422, detail=[{"loc": list(e["loc"]), "msg": e["msg"], "type": e["type"]} for e in exc.errors()])


def option_error(exc):
    return HTTPException(422, detail=[{"loc": ["body", exc.field], "msg": str(exc), "type": "option_conflict"}])


@api_router.get("/health", response_model=HealthResponse)
async def health_check():
    configured = bool(settings.GOOGLE_API_KEY)
    return HealthResponse(status="mock" if settings.MOCK_RENDER_ENABLED else "ready" if configured else "unconfigured",
                          service=settings.APP_NAME, version=settings.APP_VERSION, environment=settings.ENVIRONMENT,
                          google_api_configured=configured, default_model=settings.DEFAULT_IMAGE_MODEL,
                          mock_mode=settings.MOCK_RENDER_ENABLED)


@api_router.get("/presets", response_model=PresetsCatalogResponse)
async def get_presets():
    return PresetCatalog.get_catalog()


@api_router.post("/prompt/preview", response_model=PromptPreview)
async def preview_prompt(request: RenderOptions):
    try:
        return prepare_render(request)
    except OptionError as exc:
        raise option_error(exc) from exc


async def run_render(request, service):
    try:
        return await service.render(request)
    except OptionError as exc:
        raise option_error(exc) from exc
    except RenderFailure as exc:
        raise HTTPException(exc.status_code, str(exc)) from exc


@api_router.post("/render", response_model=RenderResponse)
async def render_json(request: RenderRequest, service: Service):
    return await run_render(request, service)


@api_router.post("/render/upload", response_model=RenderResponse, openapi_extra={
    "requestBody": {"required": True, "content": {"multipart/form-data": {"schema": {
        "type": "object", "required": ["file", "options"], "properties": {
            "file": {"type": "string", "format": "binary"},
            "options": {"type": "string", "description": "JSON RenderOptions, identical to /prompt/preview. Flat fields also supported; do not mix formats."}
        }}}}}
})
async def render_upload(request: Request, service: Service):
    form = await request.form(max_files=1, max_fields=60, max_part_size=24 * 1024 * 1024)
    file = form.get("file")
    if not hasattr(file, "read") or file.content_type not in ("image/png", "image/jpeg", "image/webp"):
        raise HTTPException(422, "Cần file ảnh PNG, JPEG hoặc WEBP.")
    try:
        image = await file.read(24 * 1024 * 1024 + 1)
    finally:
        await file.close()
    if not image or len(image) > 24 * 1024 * 1024:
        raise HTTPException(422, "Ảnh rỗng hoặc vượt 24 MB.")
    if len(form) != len(list(form.multi_items())):
        raise HTTPException(422, "Không gửi trùng tên trường.")
    try:
        if "options" in form:
            if set(form) != {"file", "options"}:
                raise HTTPException(422, "Dùng options JSON hoặc các trường rời; không trộn hai cách.")
            data = json.loads(form["options"])
            if not isinstance(data, dict):
                raise HTTPException(422, "options phải là một JSON object.")
        else:
            data = {key: value for key, value in form.items() if key != "file"}
            for key in ("additions", "revit_metadata", "preservation_elements", "quick_tags"):
                if key in data:
                    raw = data[key]
                    # Legacy comma-separated lists still accepted, including deliberately empty lists.
                    if key in ("preservation_elements", "quick_tags") and not raw.strip().startswith("["):
                        data[key] = [x.strip() for x in raw.split(",") if x.strip()]
                    else:
                        data[key] = json.loads(raw)
        options = RenderOptions.model_validate(data)
        render_request = RenderRequest(**options.model_dump(), image_base64=base64.b64encode(image).decode())
    except (json.JSONDecodeError, TypeError) as exc:
        raise HTTPException(422, "Trường JSON không hợp lệ.") from exc
    except ValidationError as exc:
        raise validation_error(exc) from exc
    return await run_render(render_request, service)


@api_router.post("/analyze")
async def analyze_uploaded_image():
    raise HTTPException(501, "Phân tích ảnh tự động chưa hỗ trợ. Hãy chọn Nội thất hoặc Ngoại thất.")


@api_router.post("/expand-prompt")
async def expand_short_prompt():
    raise HTTPException(501, "Nhập yêu cầu trực tiếp; bản demo không tự mở rộng hoặc thêm ý thiết kế.")
