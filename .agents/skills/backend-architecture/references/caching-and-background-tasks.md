# Redis Caching & Background Queues in FastAPI

## 1. Redis Cache-Aside Decorator with TTL & Jitter

```python
# app/core/cache.py
import functools
import json
import random
from collections.abc import Callable
import redis.asyncio as redis
from app.core.config import settings

redis_client = redis.from_url(settings.redis_url, decode_responses=True)

def cache(expire_seconds: int = 300, jitter: int = 30, key_prefix: str = "cache"):
    """
    Cache-aside decorator with TTL jitter to prevent cache stampedes.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Compute cache key from function name and arguments
            serialized_args = json.dumps({"args": [str(a) for a in args], "kwargs": kwargs}, sort_keys=True)
            cache_key = f"{key_prefix}:{func.__name__}:{hash(serialized_args)}"

            cached_data = await redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)

            result = await func(*args, **kwargs)

            # Add random jitter to TTL to avoid synchronized expiration
            ttl = expire_seconds + random.randint(0, jitter)
            await redis_client.set(cache_key, json.dumps(result), ex=ttl)
            return result
        return wrapper
    return decorator
```

---

## 2. Redis Distributed Lock (Mutations / Inventory / Payments)

```python
# app/core/locks.py
from contextlib import asynccontextmanager
import redis.asyncio as redis
from app.core.config import settings

redis_client = redis.from_url(settings.redis_url)

@asynccontextmanager
async def distributed_lock(resource_name: str, timeout_seconds: int = 10):
    lock_key = f"lock:{resource_name}"
    # Acquire lock with non-blocking set NX
    acquired = await redis_client.set(lock_key, "1", nx=True, ex=timeout_seconds)
    if not acquired:
        raise ValueError(f"Resource {resource_name} is currently locked by another process.")
    try:
        yield
    finally:
        await redis_client.delete(lock_key)
```

---

## 3. Asynchronous Background Tasks

### Option A: FastAPI Built-in `BackgroundTasks` (Lightweight)
Best for fire-and-forget lightweight jobs (sending emails, webhook notifications, logging audit trails):

```python
from fastapi import APIRouter, BackgroundTasks, status
from app.schemas.user import UserCreate, UserRead

router = APIRouter()

async def send_welcome_email(email: str, name: str):
    # Simulated non-blocking email dispatch
    pass

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register_user(
    payload: UserCreate,
    background_tasks: BackgroundTasks,
):
    user = await create_user(payload)
    # Offloaded after HTTP response is flushed
    background_tasks.add_task(send_welcome_email, email=user.email, name=user.full_name)
    return user
```

### Option B: ARQ / Celery / BullMQ (Heavy & Distributed Jobs)
Best for video processing, PDF generation, batched DB backfills with Dead Letter Queues (DLQ) and automatic retries.
