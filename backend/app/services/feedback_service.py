import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.feedback import Feedback, FeedbackStatus, FeedbackType
from app.schemas.feedback import FeedbackCreate


async def create_feedback(
    session: AsyncSession, payload: FeedbackCreate, user_id: uuid.UUID | None = None
) -> Feedback:
    feedback = Feedback(
        user_id=user_id,
        name=payload.name,
        email=payload.email,
        type=payload.type,
        title=payload.title,
        content=payload.content,
        status=FeedbackStatus.NEW,
    )
    session.add(feedback)
    await session.commit()
    return feedback


async def get_all_feedbacks(
    session: AsyncSession,
    type_filter: FeedbackType | None = None,
    status_filter: FeedbackStatus | None = None,
) -> list[Feedback]:
    query = select(Feedback)
    if type_filter:
        query = query.where(Feedback.type == type_filter)
    if status_filter:
        query = query.where(Feedback.status == status_filter)
    query = query.order_by(Feedback.created_at.desc())

    result = await session.execute(query)
    return list(result.scalars().all())
