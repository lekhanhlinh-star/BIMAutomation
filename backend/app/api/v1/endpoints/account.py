from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUserDep
from app.db.session import get_async_session
from app.schemas.account import CustomerLicenseRead, CustomerOrderRead
from app.services import account_service

router = APIRouter(prefix="/account", tags=["account"])


@router.get("/licenses", response_model=list[CustomerLicenseRead])
async def get_my_licenses(
    current_user: CurrentUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> list[CustomerLicenseRead]:
    licenses = await account_service.get_customer_licenses(db, current_user.id)
    return [CustomerLicenseRead.model_validate(lic) for lic in licenses]


@router.get("/orders", response_model=list[CustomerOrderRead])
async def get_my_orders(
    current_user: CurrentUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> list[CustomerOrderRead]:
    orders = await account_service.get_customer_orders(db, current_user.id)
    return [CustomerOrderRead.model_validate(order) for order in orders]
