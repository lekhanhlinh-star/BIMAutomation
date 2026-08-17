from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUserDep, SettingsDep
from app.db.session import get_async_session
from app.models.order import Order
from app.models.user import UserRole
from app.schemas.order import OrderCreate, OrderRead, QRPaymentResponse
from app.services import checkout_service

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_new_order(
    payload: OrderCreate,
    current_user: CurrentUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> OrderRead:
    order = await checkout_service.create_order(
        db, user_id=current_user.id, plan_id=payload.plan_id
    )
    return OrderRead.model_validate(order)


@router.get("/{order_id}", response_model=OrderRead)
async def get_order_details(
    order_id: uuid.UUID,
    current_user: CurrentUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> OrderRead:
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.plan))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    if (
        order.user_id != current_user.id
        and current_user.role != UserRole.ADMIN
        and not current_user.is_superuser
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden"
        )

    return OrderRead.model_validate(order)


@router.get("/{order_id}/qr", response_model=QRPaymentResponse)
async def get_order_qr_payment_info(
    order_id: uuid.UUID,
    current_user: CurrentUserDep,
    settings: SettingsDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> QRPaymentResponse:
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.plan))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    if (
        order.user_id != current_user.id
        and current_user.role != UserRole.ADMIN
        and not current_user.is_superuser
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden"
        )

    return checkout_service.get_qr_payment_info(order, settings)
