from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.schemas.plan import PlanRead
from app.services import checkout_service

router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("", response_model=list[PlanRead])
async def list_active_plans(
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> list[PlanRead]:
    plans = await checkout_service.get_active_plans(db)
    return [PlanRead.model_validate(p) for p in plans]
