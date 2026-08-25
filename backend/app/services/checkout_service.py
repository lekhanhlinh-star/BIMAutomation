import asyncio
from datetime import datetime, timedelta, timezone
import random
import re
import string
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import Settings
from app.models.license import License, LicenseStatus
from app.models.order import Order, OrderStatus
from app.models.payment import Payment
from app.models.plan import Plan
from app.schemas.order import QRPaymentResponse
from app.schemas.payment import PaymentWebhookPayload

# QR bank transfer window: an unpaid order past this age is considered abandoned.
ORDER_EXPIRY_MINUTES = 30


async def expire_stale_orders(session: AsyncSession) -> None:
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=ORDER_EXPIRY_MINUTES)
    result = await session.execute(
        update(Order)
        .where(Order.status == OrderStatus.PENDING, Order.created_at < cutoff)
        .values(status=OrderStatus.FAILED)
    )
    if result.rowcount:
        await session.commit()


def generate_order_code() -> str:
    # SePay supports a 2-5 letter prefix followed by at most 10 characters.
    # BA + YYMMDD + 4 random digits fits that format without separators that
    # banking apps may strip from transfer descriptions.
    date_str = datetime.now(timezone.utc).strftime("%y%m%d")
    random_str = "".join(random.choices(string.digits, k=4))
    return f"BA{date_str}{random_str}"


def generate_license_key() -> str:
    part1 = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    part2 = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    part3 = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"BP7X-{part1}-{part2}-{part3}"


async def get_active_plans(session: AsyncSession) -> list[Plan]:
    result = await session.execute(
        select(Plan).where(Plan.is_active == True).order_by(Plan.price.asc())
    )
    return list(result.scalars().all())


async def create_order(
    session: AsyncSession, user_id: uuid.UUID, plan_id: uuid.UUID
) -> Order:
    result = await session.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan or not plan.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plan not found or inactive",
        )

    order_code = generate_order_code()
    order = Order(
        order_code=order_code,
        user_id=user_id,
        plan_id=plan.id,
        amount=plan.price,
        status=OrderStatus.PENDING,
    )
    session.add(order)
    await session.commit()

    # Re-fetch order with plan relationship eagerly loaded
    result = await session.execute(
        select(Order).options(selectinload(Order.plan)).where(Order.id == order.id)
    )
    return result.scalar_one()


def get_qr_payment_info(order: Order, settings: Settings) -> QRPaymentResponse:
    payment_content = f"BIMPILOT {order.order_code}"
    encoded_memo = payment_content.replace(" ", "%20")
    qr_code_url = (
        f"https://img.vietqr.io/image/{settings.bank_code}-{settings.bank_account}-compact2.png"
        f"?amount={order.amount}&addInfo={encoded_memo}&accountName={settings.bank_holder}"
    )

    return QRPaymentResponse(
        order_code=order.order_code,
        amount=order.amount,
        bank_code=settings.bank_code,
        bank_account=settings.bank_account,
        bank_holder=settings.bank_holder,
        payment_content=payment_content,
        qr_code_url=qr_code_url,
    )

def normalize_order_code(value: str) -> str | None:
    value = value.strip().upper()

    # Current SePay-compatible format: BA + 10 digits.
    match = re.search(r"\bBA\d{10}\b", value)
    if match:
        return match.group(0)

    # Keep accepting legacy codes already stored in the database.
    match = re.search(r"\bBP-\d{8}-\d{4}\b", value)
    if match:
        return match.group(0)

    # Some banks remove separators from legacy transfer descriptions.
    match = re.search(r"\bBP(\d{8})(\d{4})\b", value)
    if match:
        return f"BP-{match.group(1)}-{match.group(2)}"

    return None


def extract_order_code(payload: PaymentWebhookPayload) -> str | None:
    candidates = [
        payload.order_code,
        payload.code,
        payload.content or payload.transactionContent or payload.body,
    ]

    for candidate in candidates:
        if not candidate:
            continue
        order_code = normalize_order_code(candidate)
        if order_code:
            return order_code

    return None


async def process_payment_webhook(
    session: AsyncSession, payload: PaymentWebhookPayload
) -> Order:
    order_code = extract_order_code(payload)
    if not order_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order code could not be determined from webhook payload",
        )

    result = await session.execute(
        select(Order)
        .options(selectinload(Order.plan), selectinload(Order.user))
        .where(Order.order_code == order_code)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_code} not found",
        )

    if order.status == OrderStatus.PAID:
        return order

    # Update Order
    now = datetime.now(timezone.utc)
    order.status = OrderStatus.PAID
    order.paid_at = now

    amount = payload.transferAmount or payload.amount or payload.amountIn or order.amount
    provider = payload.gateway or payload.provider or "SEPAY"
    txn_id = (
        payload.referenceCode
        or payload.referenceNumber
        or payload.transaction_id
        or (str(payload.id) if payload.id is not None else None)
    )

    # Record Payment
    payment = Payment(
        order_id=order.id,
        provider=provider,
        transaction_id=txn_id,
        amount=amount,
        status="PAID",
        raw_payload=payload.raw_payload or str(payload.model_dump(exclude_none=True)),
    )
    session.add(payment)

    # Auto Create License - Activated immediately upon payment
    duration_months = order.plan.duration_months if order.plan else 1
    duration_days = 365 if duration_months >= 12 else (duration_months * 30 if duration_months else 30)
    expires_at = now + timedelta(days=duration_days)

    license_key = generate_license_key()
    license_obj = License(
        license_key=license_key,
        user_id=order.user_id,
        order_id=order.id,
        plan_id=order.plan_id,
        plan_name=order.plan.name if order.plan else "standard",
        status=LicenseStatus.ACTIVE,
        starts_at=now,
        activated_at=now,
        expires_at=expires_at,
    )
    session.add(license_obj)

    await session.commit()

    # Send confirmation email asynchronously
    if order.user and order.user.email:
        try:
            from app.services import email_service
            plan_title = order.plan.name if order.plan else "Gói Bản Quyền BIMAutomation"
            asyncio.create_task(
                email_service.send_order_success_email(
                    email=order.user.email,
                    order_code=order.order_code,
                    plan_name=plan_title,
                    amount=order.amount,
                    license_key=license_key,
                )
            )
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Could not trigger order email: {e}")

    return order
