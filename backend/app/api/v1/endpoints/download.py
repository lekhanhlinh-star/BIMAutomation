from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.schemas.account import LatestReleaseRead
from app.services import account_service
from app.api.deps import CurrentUserDep

router = APIRouter(prefix="/download", tags=["download"])


@router.get("/latest", response_model=LatestReleaseRead)
async def get_latest_download(
    current_user: CurrentUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> LatestReleaseRead:
    release = await account_service.get_latest_release(db)
    if not release:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active release found",
        )
    return LatestReleaseRead.model_validate(release)
