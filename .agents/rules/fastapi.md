# FastAPI Development Rules & Invariants

These rules are strict behavioral and architectural guardrails when developing, refactoring, or auditing FastAPI applications.

---

## 1. Async & Non-Blocking Invariants
- **NEVER** use blocking synchronous I/O inside `async def` endpoints or services:
  - ❌ Prohibited: `time.sleep()`, `requests.get()`, `urllib.request`, synchronous file operations, sync database drivers.
  - ✅ Required: `asyncio.sleep()`, `httpx.AsyncClient()`, `aiofiles`, async DB sessions (`aiosqlite`, `asyncpg`, `asyncmy`).
- If a blocking CPU-intensive task or legacy sync library MUST be called, wrap it explicitly with `await asyncio.to_thread(sync_func, *args)`.

---

## 2. Type Hints & Dependency Injection
- **Explicit Type Signatures**: Every function, route handler, and service method MUST have full parameter type hints and an explicit return type annotation (`def get_user(...) -> UserRead:`).
- **`typing.Annotated` Dependencies**: Always use `Annotated[Type, Depends(getter)]` for dependency injection. Do not mix old-style default parameter `user: User = Depends(...)` in new routes.
- **Explicit Schema Envelopes**: Always specify `response_model` on endpoint decorators or return typed `ResponseEnvelope[T]`.

---

## 3. SQLAlchemy 2.0 Async Query Rules
- **Strict 2.0 Syntax Only**:
  - ❌ Prohibited: `session.query(User).filter(...)`, `User.query.all()`.
  - ✅ Required: `stmt = select(User).where(...)`, `result = await session.execute(stmt)`, `result.scalar_one_or_none()`, `result.scalars().all()`.
- **Eager Loading Invariant (No N+1)**:
  - When accessing relationships in async code, ALWAYS specify `options(selectinload(User.relation))` or `options(joinedload(...))`.
  - Never allow lazy-loading across async boundaries.
- **Transaction Discipline**:
  - Never execute external HTTP requests, emails, or slow third-party calls inside an active database transaction.

---

## 4. Pydantic v2 Standards
- Use `ConfigDict(from_attributes=True, extra="forbid")` for schemas reading from ORM models.
- Separate schemas by lifecycle:
  - `[Model]Base`: Shared attributes.
  - `[Model]Create`: Strict required fields on creation.
  - `[Model]Update`: All fields optional (`Field(default=None)`).
  - `[Model]Read`: Output DTO with IDs, timestamps, and relations.
- Never return raw SQLAlchemy model instances directly from endpoint handlers without Pydantic serialization.

---

## 5. Error Handling & Exception Guardrails
- **Service Layer**: Raise domain-specific `AppException` subclasses (`NotFoundException`, `ConflictException`, `ForbiddenException`, `ValidationException`).
- **Endpoint Layer**: Never catch generic `Exception` to return `500` manually. Let the centralized `register_exception_handlers` handle error formatting and log the stack trace with `trace_id`.
- Never expose internal database error details, raw SQL statements, or stack traces to API clients in production.

---

## 6. Observability & Logging
- **No `print()` statements**: Always use Python `logging` or structured JSON loggers.
- Ensure all logs carry the request's `trace_id` / `correlation_id` via `contextvars`.
- Mask sensitive data (`password`, `token`, `secret`, `api_key`, `card_number`) before logging.
