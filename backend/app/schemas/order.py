from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict

from app.models.order import OrderStatus
from app.schemas.plan import PlanRead


class OrderCreate(BaseModel):
    plan_id: uuid.UUID


class OrderRead(BaseModel):
    id: uuid.UUID
    order_code: str
    user_id: uuid.UUID
    plan_id: uuid.UUID
    amount: int
    status: OrderStatus
    created_at: datetime
    paid_at: datetime | None = None
    plan: PlanRead

    model_config = ConfigDict(from_attributes=True)


class QRPaymentResponse(BaseModel):
    order_code: str
    amount: int
    bank_code: str
    bank_account: str
    bank_holder: str
    payment_content: str
    qr_code_url: str
