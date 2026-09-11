import pytest
from PIL import Image
from app.core.config import Settings
from app.core.telemetry import (
    DummySpan,
    get_langfuse_client,
    get_langchain_callback_handler,
    format_image_for_trace,
    sanitize_render_options,
    trace_pipeline,
    trace_span,
    flush_telemetry,
)
from app.schemas.render import RenderRequest, RenderOptions


def test_telemetry_disabled_when_no_keys():
    s = Settings(LANGFUSE_PUBLIC_KEY="", LANGFUSE_SECRET_KEY="")
    assert s.is_langfuse_enabled is False


def test_telemetry_enabled_when_keys_present():
    s = Settings(LANGFUSE_PUBLIC_KEY="pk-test", LANGFUSE_SECRET_KEY="sk-test")
    assert s.is_langfuse_enabled is True


def test_dummy_span_safe_noops():
    span = DummySpan()
    span.update(output={"test": 123}, level="ERROR", status_message="error")
    # Should not raise any exception


def test_sanitize_render_options_strips_sensitive():
    req = RenderRequest(
        image_base64="aW1hZ2VkYXRh",
        view_type="interior",
        geometry_mode="strict",
        wall_material="Wood",
    )
    clean = sanitize_render_options(req)
    assert "image_base64" not in clean
    assert clean["view_type"] == "interior"
    assert clean["geometry_mode"] == "strict"
    assert clean["wall_material"] == "Wood"


def test_format_image_for_trace():
    img = Image.new("RGB", (400, 300), "blue")
    media = format_image_for_trace(img, max_dimension=100)
    assert media is not None
    assert format_image_for_trace(None) is None


def test_trace_pipeline_and_span_execution():
    with trace_pipeline(
        trace_name="test-trace",
        tags=["unit-test"],
        metadata={"component": "testing"},
        input_data={"param": 1},
    ) as root:
        with trace_span(name="test-step", as_type="span", input={"x": 10}) as step:
            step.update(output={"y": 20})
        root.update(output={"done": True})

    flush_telemetry()
