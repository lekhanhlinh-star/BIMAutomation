"""Telemetry and tracing integration using Langfuse following official best practices."""
import contextlib
import io
from typing import Any, Dict, List, Optional
from PIL import Image

from app.core.config import settings, logger

try:
    from langfuse import Langfuse, propagate_attributes
    from langfuse.langchain import CallbackHandler
    from langfuse.media import LangfuseMedia
    LANGFUSE_AVAILABLE = True
except ImportError:
    LANGFUSE_AVAILABLE = False
    Langfuse = None
    propagate_attributes = None
    CallbackHandler = None
    LangfuseMedia = None


class DummySpan:
    """Fallback span when Langfuse is not configured or unavailable."""
    def update(self, *args, **kwargs):
        pass


_langfuse_client: Optional[Any] = None


def get_langfuse_client() -> Optional[Any]:
    """Get or initialize the Langfuse singleton client."""
    global _langfuse_client
    if not LANGFUSE_AVAILABLE or not settings.is_langfuse_enabled:
        return None

    if _langfuse_client is None:
        try:
            _langfuse_client = Langfuse(
                public_key=settings.LANGFUSE_PUBLIC_KEY,
                secret_key=settings.LANGFUSE_SECRET_KEY,
                host=settings.LANGFUSE_BASE_URL,
                environment=settings.ENVIRONMENT,
                release=settings.APP_VERSION,
                timeout=60,
                media_upload_thread_count=4,
            )
            logger.info("Langfuse client initialized successfully (%s)", settings.LANGFUSE_BASE_URL)
        except Exception as exc:
            logger.warning("Failed to initialize Langfuse client: %s", exc)
            _langfuse_client = None

    return _langfuse_client


def get_langchain_callback_handler() -> Optional[Any]:
    """Get a LangChain CallbackHandler for Langfuse if tracing is enabled."""
    if not LANGFUSE_AVAILABLE or not settings.is_langfuse_enabled:
        return None
    try:
        # Langfuse CallbackHandler automatically attaches to active OpenTelemetry context
        return CallbackHandler()
    except Exception as exc:
        logger.warning("Failed to initialize Langfuse CallbackHandler: %s", exc)
        return None


def flush_telemetry():
    """Flush pending telemetry events to Langfuse."""
    global _langfuse_client
    client = get_langfuse_client()
    if client is not None:
        try:
            client.flush()
        except Exception as exc:
            logger.warning("Error flushing Langfuse telemetry: %s", exc)


def format_image_for_trace(image: Optional[Image.Image], max_dimension: int = 768) -> Optional[Any]:
    """Create an optimized image attachment for Langfuse UI multi-modality rendering."""
    if image is None:
        return None
    try:
        thumb = image.copy()
        thumb.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        thumb.convert("RGB").save(buf, format="JPEG", quality=85)
        raw_bytes = buf.getvalue()

        if LANGFUSE_AVAILABLE and LangfuseMedia is not None:
            return LangfuseMedia(content_bytes=raw_bytes, content_type="image/jpeg")
        return None
    except Exception as exc:
        logger.debug("Failed to format image for trace: %s", exc)
        return None


def sanitize_render_options(options: Any) -> Dict[str, Any]:
    """Extract clean, safe render options dictionary for trace inputs."""
    if hasattr(options, "model_dump"):
        raw = options.model_dump()
    elif isinstance(options, dict):
        raw = dict(options)
    else:
        return {}

    # Never leak raw input image bytes or secret keys in JSON input dict
    clean = {}
    for key, value in raw.items():
        if key in ("image_base64", "api_key", "google_api_key", "secret"):
            continue
        if value is not None:
            clean[key] = value
    return clean


@contextlib.contextmanager
def trace_span(
    name: str,
    as_type: str = "span",
    input: Optional[Any] = None,
    output: Optional[Any] = None,
    metadata: Optional[Dict[str, Any]] = None,
    model: Optional[str] = None,
    model_parameters: Optional[Dict[str, Any]] = None,
):
    """Context manager for child spans/generations with graceful fallback."""
    client = get_langfuse_client()
    if client is not None:
        try:
            obs_cm = client.start_as_current_observation(
                name=name,
                as_type=as_type,
                input=input,
                output=output,
                metadata=metadata,
                model=model,
                model_parameters=model_parameters,
            )
        except Exception as exc:
            logger.debug("Failed to start observation '%s': %s", name, exc)
            obs_cm = None

        if obs_cm is not None:
            with obs_cm as span:
                yield span
            return

    yield DummySpan()


@contextlib.contextmanager
def trace_pipeline(
    trace_name: str,
    tags: Optional[List[str]] = None,
    metadata: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    input_data: Optional[Any] = None,
):
    """
    Context manager for the root pipeline trace.
    Uses start_as_current_observation for the root span and propagate_attributes
    to pass trace name, tags, and metadata to all child spans and LangChain callbacks.
    """
    client = get_langfuse_client()
    if client is not None and propagate_attributes is not None:
        try:
            root_cm = client.start_as_current_observation(
                name=trace_name,
                as_type="span",
                input=input_data,
                metadata=metadata,
            )
        except Exception as exc:
            logger.debug("Failed to start pipeline observation '%s': %s", trace_name, exc)
            root_cm = None

        if root_cm is not None:
            with root_cm as root_span:
                with propagate_attributes(
                    trace_name=trace_name,
                    tags=tags or [],
                    metadata=metadata or {},
                    user_id=user_id,
                    session_id=session_id,
                    version=settings.APP_VERSION,
                    environment=settings.ENVIRONMENT,
                ):
                    yield root_span
            return

    yield DummySpan()
