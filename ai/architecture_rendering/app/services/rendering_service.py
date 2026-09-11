"""Render prepared requests; provider failure is never a successful mock render."""
import asyncio
import base64
import io
import time
from pathlib import Path
from PIL import Image
from langchain_core.exceptions import ModelRateLimitError
from app.core.config import settings, logger
from app.schemas.render import RenderRequest, RenderMetadata, RenderResponse
from app.services.image_service import ImageService
from app.services.request_service import prepare_render
from app.services.consistency_service import image_fingerprint, reference_image_for_source
from app.core.telemetry import (
    trace_pipeline,
    trace_span,
    get_langchain_callback_handler,
    flush_telemetry,
    sanitize_render_options,
)


class RenderFailure(RuntimeError):
    def __init__(self, message, status_code=502):
        self.status_code = status_code
        super().__init__(message)


class ArchitecturalRenderingService:
    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY
        self._image_model = None

    def _get_langchain_image_model(self):
        if not self.api_key:
            raise RenderFailure("Máy chủ chưa cấu hình Gemini. Chưa thể tạo ảnh AI.", 503)
        if self._image_model is None:
            from langchain_google_genai import ChatGoogleGenerativeAI, Modality
            self._image_model = ChatGoogleGenerativeAI(
                model=settings.DEFAULT_IMAGE_MODEL, google_api_key=self.api_key,
                vertexai=settings.GOOGLE_GENAI_USE_VERTEXAI,
                response_modalities=[Modality.IMAGE], max_retries=0,
                timeout=settings.RENDER_TIMEOUT_SECONDS,
            )
        return self._image_model

    async def _generate_with_langchain(self, input_image, prompt, quality, reference_image=None):
        from langchain_core.messages import HumanMessage
        model = self._get_langchain_image_model()
        content = [{"type": "text", "text": prompt}, {"type": "text", "text": "Image 1: original Revit view."},
                   {"type": "image_url", "image_url": {"url": await ImageService.encode_image_to_base64(input_image)}}]
        if reference_image is not None:
            content += [{"type": "text", "text": "Image 2: fixed rendered reference selected by the user."},
                        {"type": "image_url", "image_url": {"url": await ImageService.encode_image_to_base64(reference_image)}}]
        message = HumanMessage(content=content)
        # Preserve the supplied aspect ratio by reference; don't force the nearest supported ratio.
        config = {"image_size": "2K" if quality == "final_2k" else "1K"}
        callback_handler = get_langchain_callback_handler()
        ainvoke_kwargs = {"image_config": config}
        if callback_handler is not None:
            ainvoke_kwargs["config"] = {"callbacks": [callback_handler]}

        try:
            with trace_span(
                name="gemini-image-generation",
                as_type="generation",
                model=settings.DEFAULT_IMAGE_MODEL,
                input={"quality": quality, "has_reference": reference_image is not None},
            ) as gen_span:
                response = await asyncio.wait_for(
                    model.ainvoke([message], **ainvoke_kwargs),
                    timeout=settings.RENDER_TIMEOUT_SECONDS
                )
                for block in response.content if isinstance(response.content, list) else []:
                    if isinstance(block, dict) and block.get("image_url"):
                        url = block["image_url"]
                        url = url.get("url", "") if isinstance(url, dict) else url
                        if not url.startswith("data:image/"):
                            continue
                        output = Image.open(io.BytesIO(base64.b64decode(url.split(",", 1)[1], validate=True)))
                        output.load()
                        gen_span.update(output={"status": "image_generated", "dimensions": {"width": output.width, "height": output.height}})
                        return output.convert("RGB")
                raise RenderFailure("Gemini không trả ảnh. Hãy kiểm tra yêu cầu và thử lại.")
        except asyncio.TimeoutError as exc:
            raise RenderFailure("Gemini xử lý quá thời gian cho phép. Bạn có thể thử lại.", 504) from exc
        except RenderFailure:
            raise
        except ModelRateLimitError as exc:
            logger.warning("Gemini render rate limited: model=%s", settings.DEFAULT_IMAGE_MODEL)
            raise RenderFailure(
                f"Gemini đang giới hạn lượt gọi hoặc hạn mức cho model {settings.DEFAULT_IMAGE_MODEL}. "
                "Hãy thử lại sau; nếu lỗi tiếp diễn, kiểm tra hạn mức và thanh toán của API key trên Google AI Studio.",
                429,
            ) from exc
        except Exception as exc:
            # Don't expose provider exception strings, which may contain credentials or request data.
            logger.error("Gemini render failed: %s", type(exc).__name__)
            raise RenderFailure("Không tạo được ảnh từ Gemini. Kiểm tra kết nối, hạn mức và model trên máy chủ.") from exc

    async def render(self, request: RenderRequest, include_base64_response=False):
        started = time.monotonic()
        vt = request.view_type.value if hasattr(request.view_type, "value") else str(request.view_type)
        gm = request.geometry_mode.value if hasattr(request.geometry_mode, "value") else str(request.geometry_mode)
        qt = request.quality.value if hasattr(request.quality, "value") else str(request.quality)
        tags = [
            "ai-rendering",
            f"view:{vt}",
            f"mode:{gm}",
            f"quality:{qt}",
            "mock" if settings.MOCK_RENDER_ENABLED else "gemini",
        ]
        trace_metadata = {
            "view_type": vt,
            "geometry_mode": gm,
            "quality": qt,
            "is_mock": settings.MOCK_RENDER_ENABLED,
            "reference_render_id": request.reference_render_id,
        }
        safe_input = sanitize_render_options(request)

        with trace_pipeline(
            trace_name="architectural-render",
            tags=tags,
            metadata=trace_metadata,
            input_data=safe_input,
        ) as root_span:
            with trace_span(name="prepare-render", as_type="span", input=safe_input) as prep_span:
                prepared = prepare_render(request)
                prep_span.update(output={
                    "prompt_version": prepared.prompt_version,
                    "prompt_type": prepared.prompt_type,
                    "summary": prepared.summary,
                    "changed_fields": prepared.changed_fields,
                    "prompt_used": prepared.prompt_used,
                })

            try:
                input_image, _ = await ImageService.decode_base64_to_image(request.image_base64)
            except Exception as exc:
                root_span.update(level="ERROR", status_message=str(exc))
                flush_telemetry()
                raise RenderFailure("Ảnh không hợp lệ. Dùng PNG, JPEG hoặc WEBP trong giới hạn 24 MB / 24 triệu điểm ảnh.", 422) from exc

            render_id = ImageService.generate_render_id()
            reference_image = None
            if request.reference_render_id:
                try:
                    reference_image = await asyncio.to_thread(reference_image_for_source, request.reference_render_id, input_image)
                except (OSError, ValueError) as exc:
                    root_span.update(level="ERROR", status_message=str(exc))
                    flush_telemetry()
                    raise RenderFailure(str(exc) if isinstance(exc, ValueError) else "Không đọc được ảnh phương án giữ cố định.", 422) from exc

            try:
                if settings.MOCK_RENDER_ENABLED:
                    with trace_span(name="mock-render", as_type="span", input={"lighting": request.lighting or ""}) as mock_span:
                        output = await ImageService.create_mock_render(input_image, lighting=request.lighting or "")
                        mock_span.update(output={"status": "mock_generated"})
                    provider, model = "mock_test_provider", "mock-architecture-v1"
                else:
                    if reference_image is None:
                        output = await self._generate_with_langchain(input_image, prepared.prompt_used, request.quality)
                    else:
                        output = await self._generate_with_langchain(input_image, prepared.prompt_used, request.quality, reference_image)
                    provider, model = "langchain_google_genai", settings.DEFAULT_IMAGE_MODEL
            except Exception as exc:
                root_span.update(level="ERROR", status_message=str(exc))
                flush_telemetry()
                raise

            warnings = []
            if reference_image is not None:
                warnings.append("Đã dùng phương án cố định để giữ nhất quán giữa các lượt. Đây là tham chiếu cho AI, chưa phải khóa từng vùng ảnh; cần đối chiếu kết quả.")
            if abs(output.width / output.height - input_image.width / input_image.height) > 0.01:
                warnings.append("AI trả tỷ lệ ảnh khác ảnh gốc; cần đối chiếu góc nhìn. Ảnh không bị kéo giãn hoặc cắt lại.")

            source_fp = await asyncio.to_thread(image_fingerprint, input_image)
            metadata = RenderMetadata(
                **prepared.effective_options.model_dump(), render_id=render_id,
                prompt_type=prepared.prompt_type, prompt_version=prepared.prompt_version,
                prompt_used=prepared.prompt_used, effective_options=prepared.effective_options,
                summary=prepared.summary, duration_seconds=round(time.monotonic() - started, 2),
                dimensions={"width": output.width, "height": output.height},
                input_dimensions={"width": input_image.width, "height": input_image.height},
                provider=provider, model=model, is_mock=settings.MOCK_RENDER_ENABLED, warnings=warnings,
                changed_fields=prepared.changed_fields, source_fingerprint=source_fp,
            )

            with trace_span(name="save-output", as_type="span") as save_span:
                await ImageService.save_image(input_image, ImageService.get_input_file_path(render_id))
                await ImageService.save_image(output, ImageService.get_output_file_path(render_id))
                audit_path = Path(settings.INPUTS_DIR) / f"{render_id}_request.json"
                await asyncio.to_thread(audit_path.write_text, metadata.model_dump_json(indent=2), encoding="utf-8")
                save_span.update(output={
                    "render_id": render_id,
                    "input_path": str(ImageService.get_input_file_path(render_id)),
                    "output_path": str(ImageService.get_output_file_path(render_id)),
                })

            logger.info("Render %s completed via %s in %ss", render_id, provider, metadata.duration_seconds)
            response = RenderResponse(
                status="mock" if settings.MOCK_RENDER_ENABLED else "success",
                render_id=render_id,
                image_url=ImageService.get_public_url(render_id),
                metadata=metadata,
                image_base64=await ImageService.encode_image_to_base64(output) if include_base64_response else None
            )

            root_span.update(
                output={
                    "render_id": render_id,
                    "status": response.status,
                    "image_url": response.image_url,
                    "duration_seconds": metadata.duration_seconds,
                    "dimensions": metadata.dimensions,
                    "warnings": warnings,
                },
                metadata={
                    "render_id": render_id,
                    "model": model,
                    "provider": provider,
                    "source_fingerprint": source_fp,
                }
            )
            flush_telemetry()
            return response


rendering_service = ArchitecturalRenderingService()
