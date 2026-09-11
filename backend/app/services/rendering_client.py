import httpx
import logging
from typing import Optional, Dict, Any, Tuple
from app.core.config import settings
from app.schemas.rendering import PresetsCatalogResponse, RenderRequest, RenderResponse

logger = logging.getLogger("rendering_client")

class RenderingClient:
    """
    HTTP Client responsible for communication between Backend and the
    AI Architecture Rendering Microservice.
    """

    def __init__(self, base_url: Optional[str] = None, timeout: float = 120.0):
        self.base_url = (base_url or settings.rendering_service_url).rstrip("/")
        self.timeout = timeout

    async def get_presets(self) -> PresetsCatalogResponse:
        """Fetches presets, archetypes, and immutable preservation elements from microservice."""
        url = f"{self.base_url}/api/v1/presets"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return PresetsCatalogResponse.model_validate(resp.json())

    @staticmethod
    def clean_payload(data: Dict[str, Any]) -> Dict[str, Any]:
        """Cleans payload by stripping None values and empty tag fields."""
        cleaned = {}
        for k, v in data.items():
            if v is None:
                continue
            if k == "quick_tags" and (not v or len(v) == 0):
                continue
            cleaned[k] = v
        return cleaned

    async def render_json(self, request: RenderRequest) -> RenderResponse:
        """Calls the AI microservice to render an architectural 3D view via JSON Base64."""
        url = f"{self.base_url}/api/v1/render"
        payload = self.clean_payload(request.model_dump(mode="json"))
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            return RenderResponse.model_validate(resp.json())

    async def render_upload(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: str,
        form_data: Dict[str, Any]
    ) -> RenderResponse:
        """Calls the AI microservice via multipart/form-data."""
        url = f"{self.base_url}/api/v1/render/upload"
        files = {"file": (filename, file_bytes, content_type)}
        payload = self.clean_payload(form_data)
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, files=files, data=payload)
            resp.raise_for_status()
            return RenderResponse.model_validate(resp.json())

    async def get_health(self) -> Dict[str, Any]:
        """Checks the health and status of the AI microservice."""
        url = f"{self.base_url}/api/v1/health"
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.json()

    # Synchronous methods for Celery worker execution
    def render_json_sync(self, request_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Synchronous version for Celery worker tasks."""
        url = f"{self.base_url}/api/v1/render"
        payload = self.clean_payload(request_dict)
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            return resp.json()

    def get_health_sync(self) -> Dict[str, Any]:
        """Synchronous health check for Celery tasks."""
        url = f"{self.base_url}/api/v1/health"
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(url)
            resp.raise_for_status()
            return resp.json()

rendering_client = RenderingClient()
