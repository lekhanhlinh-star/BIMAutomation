from fastapi import APIRouter

from app.api.v1.endpoints import (
    account,
    admin,
    auth,
    download,
    feedback,
    health,
    licenses,
    orders,
    payments,
    plans,
    public,
    users,
)

api_router = APIRouter(prefix="/v1")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(account.router)
api_router.include_router(download.router)
api_router.include_router(feedback.router)
api_router.include_router(public.router)
api_router.include_router(admin.router)
api_router.include_router(plans.router)
api_router.include_router(orders.router)
api_router.include_router(payments.router)
api_router.include_router(licenses.router)



