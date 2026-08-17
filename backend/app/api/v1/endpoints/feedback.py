from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import OptionalCurrentUserDep
from app.db.session import get_async_session
from app.schemas.feedback import FeedbackCreate, FeedbackRead
from app.services import feedback_service

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackRead, status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    payload: FeedbackCreate,
    current_user: OptionalCurrentUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> FeedbackRead:
    user_id = current_user.id if current_user else None
    feedback = await feedback_service.create_feedback(db, payload, user_id=user_id)
    return FeedbackRead.model_validate(feedback)
