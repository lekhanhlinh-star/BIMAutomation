# FastAPI Structured Logging & Observability

## 1. ContextVars Trace ID & Correlation Tracking

Using Python's `contextvars`, the `correlation_id` / `trace_id` is automatically attached to **every log message** across all layers (controllers, services, repositories) without needing to manually pass `trace_id` through function arguments:

```python
# app/core/logging.py
import contextvars
import json
import logging
import sys
import time
from datetime import datetime, timezone
import uuid

# Context variable to hold trace ID per async task
trace_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar("trace_id_ctx", default="")

class JSONFormatter(logging.Formatter):
    """Formats log records as structured, single-line JSON."""
    
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "trace_id": trace_id_ctx.get() or getattr(record, "trace_id", None),
        }

        # Include exception stack traces if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Include any custom extra properties passed to logger
        if hasattr(record, "extra_fields"):
            log_entry.update(record.extra_fields)

        return json.dumps(log_entry)

def setup_logging(log_level: str = "INFO", json_output: bool = True) -> None:
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level.upper())

    # Clear existing handlers
    root_logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    if json_output:
        handler.setFormatter(JSONFormatter())
    else:
        # Human-readable format for local development
        formatter = logging.Formatter(
            "%(asctime)s [%(levelname)s] [%(name)s] [%(filename)s:%(lineno)d] - %(message)s"
        )
        handler.setFormatter(formatter)

    root_logger.addHandler(handler)

    # Mute overly verbose third-party loggers
    logging.getLogger("uvicorn.access").handlers.clear()
    logging.getLogger("uvicorn.access").propagate = False
```

---

## 2. HTTP Request & Response Logging Middleware

Captures every incoming HTTP request, logs its method, URL, duration, status code, and propagates the `X-Correlation-ID` header:

```python
# app/core/middlewares.py
import logging
import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core.logging import trace_id_ctx

logger = logging.getLogger("http.access")

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Extract or generate Correlation / Trace ID
        trace_id = request.headers.get("X-Correlation-ID") or request.headers.get("X-Request-ID") or str(uuid.uuid4())
        token = trace_id_ctx.set(trace_id)
        request.state.trace_id = trace_id

        start_time = time.perf_counter()

        # Sanitize query parameters before logging
        query_params = dict(request.query_params)
        for sensitive_key in ["password", "token", "secret", "api_key", "key"]:
            if sensitive_key in query_params:
                query_params[sensitive_key] = "[REDACTED]"

        try:
            response: Response = await call_next(request)
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

            # Skip noisy health check logs from spamming production log aggregators
            if request.url.path not in ["/health", "/health/live", "/health/ready"]:
                logger.info(
                    f"{request.method} {request.url.path} {response.status_code} - {duration_ms}ms",
                    extra={
                        "extra_fields": {
                            "method": request.method,
                            "path": request.url.path,
                            "status_code": response.status_code,
                            "duration_ms": duration_ms,
                            "client_ip": request.client.host if request.client else None,
                            "user_agent": request.headers.get("user-agent"),
                        }
                    },
                )

            # Attach Trace ID to response headers for client tracking
            response.headers["X-Correlation-ID"] = trace_id
            return response

        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(
                f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}",
                exc_info=True,
                extra={
                    "extra_fields": {
                        "method": request.method,
                        "path": request.url.path,
                        "duration_ms": duration_ms,
                    }
                },
            )
            raise
        finally:
            trace_id_ctx.reset(token)
```

---

## 3. Slow Query Logger for Async SQLAlchemy

Log any database queries taking longer than 500ms:

```python
# app/db/logging.py
import logging
import time
from sqlalchemy import event
from sqlalchemy.engine import Engine

db_logger = logging.getLogger("db.slow_query")
SLOW_QUERY_THRESHOLD_MS = 500

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    context._query_start_time = time.perf_counter()

@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total_ms = round((time.perf_counter() - context._query_start_time) * 1000, 2)
    if total_ms > SLOW_QUERY_THRESHOLD_MS:
        db_logger.warning(
            f"Slow Query Detected ({total_ms}ms): {statement}",
            extra={
                "extra_fields": {
                    "duration_ms": total_ms,
                    "statement": statement,
                }
            },
        )
```

---

## 4. Health Probes (Liveness & Readiness)

```python
# app/api/v1/endpoints/health.py
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.api.deps import SessionDep

router = APIRouter()

@router.get("/live", status_code=status.HTTP_200_OK, summary="Liveness Probe")
async def liveness():
    """Returns 200 OK if the process is running."""
    return {"status": "live"}

@router.get("/ready", summary="Readiness Probe")
async def readiness(session: SessionDep):
    """Returns 200 OK only if Database and critical dependencies are reachable."""
    try:
        # Ping Database
        await session.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "database": "unreachable", "error": str(exc)},
        )
```
