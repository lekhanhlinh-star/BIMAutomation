# FastAPI API Design & Contract Standards

## 1. Universal APIRouter Hierarchy

Organize API routes hierarchically using modular `APIRouter` instances:

```python
# app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, items, health

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(items.router, prefix="/items", tags=["Items"])
```

---

## 2. Generic Response Envelope & Pagination

### Reusable Envelope Models (`app/schemas/common.py`)
```python
from typing import Generic, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")

class ResponseEnvelope(BaseModel, Generic[T]):
    success: bool = True
    data: T
    meta: dict | None = None

class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1, description="1-indexed page number")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page")
    sort_by: str = Field(default="created_at", description="Field to sort by")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$", description="Sort direction")

class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_prev: bool

class CursorPaginationParams(BaseModel):
    cursor: str | None = Field(default=None, description="Opaque cursor for next page")
    limit: int = Field(default=20, ge=1, le=100)
```

### Endpoint Implementation Example:
```python
# app/api/v1/endpoints/items.py
from fastapi import APIRouter, Depends, status
from app.api.deps import SessionDep, CurrentUserDep
from app.schemas.common import ResponseEnvelope, PaginationParams, PaginationMeta
from app.schemas.item import ItemRead
from app.services.item_service import ItemService

router = APIRouter(prefix="/items", tags=["Items"])

@router.get("/", response_model=ResponseEnvelope[list[ItemRead]], status_code=status.HTTP_200_OK)
async def list_items(
    current_user: CurrentUserDep,
    session: SessionDep,
    pagination: PaginationParams = Depends(),
) -> ResponseEnvelope[list[ItemRead]]:
    service = ItemService(session)
    items, total = await service.list_items(
        user_id=current_user.id,
        page=pagination.page,
        limit=pagination.limit,
        sort_by=pagination.sort_by,
        sort_order=pagination.sort_order,
    )
    
    total_pages = (total + pagination.limit - 1) // pagination.limit
    meta = PaginationMeta(
        page=pagination.page,
        limit=pagination.limit,
        total=total,
        total_pages=total_pages,
        has_next=pagination.page < total_pages,
        has_prev=pagination.page > 1,
    )

    return ResponseEnvelope(success=True, data=items, meta=meta.model_dump())
```

---

## 3. Idempotency Key Middleware (Redis + FastAPI)

Protects critical mutating endpoints (`POST`, `PATCH`, `PUT`) from duplicate submissions due to network retries or double clicks:

```python
import json
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import redis.asyncio as redis

class IdempotencyMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, redis_client: redis.Redis):
        super().__init__(app)
        self.redis = redis_client

    async def dispatch(self, request: Request, call_next):
        # Only inspect mutating HTTP methods
        if request.method not in ["POST", "PATCH", "PUT"]:
            return await call_next(request)

        idempotency_key = request.headers.get("Idempotency-Key")
        if not idempotency_key:
            return await call_next(request)

        cache_key = f"idempotency:{idempotency_key}"
        cached_response = await self.redis.get(cache_key)
        if cached_response:
            payload = json.loads(cached_response)
            return JSONResponse(
                status_code=payload["status_code"],
                content=payload["content"],
                headers={"X-Idempotency-Hit": "true"},
            )

        # Acquire 30s distributed in-flight lock
        acquired = await self.redis.set(f"lock:{cache_key}", "1", nx=True, ex=30)
        if not acquired:
            return JSONResponse(
                status_code=409,
                content={
                    "success": False,
                    "error": {
                        "code": "CONCURRENT_REQUEST",
                        "message": "A request with this Idempotency-Key is currently processing.",
                    },
                },
            )

        try:
            response = await call_next(request)

            # Cache successful 2xx responses for 24 hours
            if 200 <= response.status_code < 300:
                body = [section async for section in response.body_iterator]
                response.body_iterator = iter(body)
                body_text = b"".join(body).decode()
                try:
                    content = json.loads(body_text)
                    await self.redis.set(
                        cache_key,
                        json.dumps({"status_code": response.status_code, "content": content}),
                        ex=86400,
                    )
                except Exception:
                    pass

            return response
        finally:
            await self.redis.delete(f"lock:{cache_key}")
```
