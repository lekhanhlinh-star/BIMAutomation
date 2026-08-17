from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict


class PlanRead(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    name: str
    duration_months: int
    price: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
