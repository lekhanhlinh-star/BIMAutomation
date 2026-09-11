import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.schemas.rendering import (
    PresetsCatalogResponse,
    RenderResponse,
    RenderMetadata,
    RenderTaskStatus
)

@pytest.mark.asyncio
async def test_rendering_presets_endpoint():
    mock_catalog = PresetsCatalogResponse(
        archetypes=[],
        view_types=[],
        interior_styles=[],
        exterior_styles=[],
        lighting_presets=[],
        material_presets=[],
        context_presets=[],
        camera_perspectives=[],
        geometry_modes=[],
        preservation_elements=[],
        quick_tags=[]
    )

    with patch("app.services.rendering_client.rendering_client.get_presets", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_catalog

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get("/api/v1/rendering/presets")

        assert resp.status_code == 200
        data = resp.json()
        assert "preservation_elements" in data
        assert "geometry_modes" in data

@pytest.mark.asyncio
async def test_rendering_render_async_enqueue():
    mock_task = MagicMock()
    mock_task.id = "mock-task-uuid-12345"

    with patch("app.tasks.rendering_tasks.render_architecture_task.delay", return_value=mock_task):
        payload = {
            "image_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "view_type": "exterior",
            "style": "vietnam_modern_luxury_villa",
            "lighting": "vietnam_midday_tropical",
            "material_mood": "vietnam_lava_stone_teak",
            "geometry_mode": "strict",
            "preservation_elements": ["lock_roof", "lock_fenestration"]
        }

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.post("/api/v1/rendering/render", json=payload)

        assert resp.status_code == 200
        data = resp.json()
        assert data["task_id"] == "mock-task-uuid-12345"
        assert data["status"] == "PENDING"
        assert data["progress"] == 0

@pytest.mark.asyncio
async def test_rendering_task_status_polling():
    mock_async_result = MagicMock()
    mock_async_result.state = "PROCESSING"
    mock_async_result.info = {"progress": 45, "message": "Rendering in progress..."}

    with patch("app.api.v1.endpoints.rendering.AsyncResult", return_value=mock_async_result):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get("/api/v1/rendering/tasks/test-task-123")

        assert resp.status_code == 200
        data = resp.json()
        assert data["task_id"] == "test-task-123"
        assert data["status"] == "PROCESSING"
        assert data["progress"] == 45
        assert "Rendering in progress" in data["message"]

@pytest.mark.asyncio
async def test_rendering_health_endpoint():
    with patch("app.services.rendering_client.rendering_client.get_health", new_callable=AsyncMock) as mock_health:
        mock_health.return_value = {"status": "healthy", "service": "ai_rendering"}
        with patch("redis.from_url") as mock_redis:
            mock_redis.return_value.ping.return_value = True

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get("/api/v1/rendering/health")

            assert resp.status_code == 200
            data = resp.json()
            assert data["subsystem"] == "ai_architecture_rendering"
            assert data["ai_microservice"] == "healthy"
