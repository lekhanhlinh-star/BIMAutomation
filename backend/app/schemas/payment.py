from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict, Field


class PaymentWebhookPayload(BaseModel):
    # Standard format fields
    order_code: str | None = None
    amount: int | None = None
    transaction_id: str | None = None
    provider: str = "QR_BANK"
    raw_payload: str | None = None

    # SePay format fields
    amountIn: int | None = None
    transactionContent: str | None = None
    referenceNumber: str | None = None
    gateway: str | None = None
    body: str | None = None
    code: str | None = None

    # Current SePay webhook fields
    id: int | None = None
    content: str | None = None
    transferAmount: int | None = None
    transferType: str | None = None
    referenceCode: str | None = None
    transactionDate: str | None = None
    accountNumber: str | None = None
    subAccount: str | None = None
    description: str | None = None
    accumulated: int | None = None

    model_config = ConfigDict(extra="ignore")


class PaymentRead(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    provider: str
    transaction_id: str | None
    amount: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
