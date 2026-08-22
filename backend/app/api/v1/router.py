from fastapi import APIRouter

from app.api.v1.endpoints import (
    account,
    admin,
    auth,
    devices,
    download,
    entitlements,
    feedback,
    health,
    licenses,
    me,
    oauth_desktop,
    orders,
    payments,
    plans,
    public,
    users,
)

api_router = APIRouter(prefix="/v1")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(oauth_desktop.router)
api_router.include_router(devices.router)
api_router.include_router(entitlements.router)
api_router.include_router(me.router)
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
