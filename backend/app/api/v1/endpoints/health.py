from fastapi import APIRouter

from app.api.deps import SettingsDep
from app.schemas.health import HealthResponse

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=HealthResponse)
def get_health(settings: SettingsDep) -> HealthResponse:
    return HealthResponse(
        status="ok",
        environment=settings.environment,
    )
