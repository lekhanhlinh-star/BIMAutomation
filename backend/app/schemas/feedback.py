from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.feedback import FeedbackStatus, FeedbackType


class FeedbackCreate(BaseModel):
    name: str
    email: EmailStr
    type: FeedbackType = FeedbackType.FEATURE
    title: str
    content: str


class FeedbackRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None
    name: str
    email: str
    type: FeedbackType
    title: str
    content: str
    status: FeedbackStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
