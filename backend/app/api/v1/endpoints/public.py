from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import SettingsDep
from app.db.session import get_async_session
from app.models.plan import Plan
from app.models.release import Release


class PublicSystemInfo(BaseModel):
    app_name: str
    supported_revit_versions: list[int] = [2021, 2022, 2023, 2024, 2025, 2026]
    latest_release_version: str | None = None
    active_plans_count: int = 0


router = APIRouter(prefix="/public", tags=["public"])


@router.get("/info", response_model=PublicSystemInfo)
async def get_public_info(
    settings: SettingsDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> PublicSystemInfo:
    rel_res = await db.execute(
        select(Release)
        .where(Release.is_active == True)
        .order_by(Release.released_at.desc())
        .limit(1)
    )
    latest_rel = rel_res.scalar_one_or_none()

    plans_res = await db.execute(
        select(func.count(Plan.id)).where(Plan.is_active == True)
    )
    active_plans_count = plans_res.scalar_one()

    return PublicSystemInfo(
        app_name=settings.app_name,
        latest_release_version=latest_rel.version if latest_rel else None,
        active_plans_count=int(active_plans_count),
    )
