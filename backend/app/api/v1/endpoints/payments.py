from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import SettingsDep
from app.db.session import get_async_session
from app.schemas.payment import PaymentWebhookPayload
from app.services import checkout_service

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/webhook")
async def process_payment_webhook(
    payload: PaymentWebhookPayload,
    db: Annotated[AsyncSession, Depends(get_async_session)],
    settings: SettingsDep,
    authorization: str | None = Header(default=None),
) -> dict[str, bool]:
    if settings.sepay_api_key:
        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing Authorization header",
            )
        parts = authorization.split(maxsplit=1)
        provided_key = parts[-1] if parts else ""
        if provided_key != settings.sepay_api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid SePay API Key in Authorization header",
            )

    await checkout_service.process_payment_webhook(db, payload)
    return {"success": True}
