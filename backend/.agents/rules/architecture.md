---
trigger: always_on
---

# FastAPI Architecture Rules

## General principles

- Keep the architecture simple and explicit.
- Follow the existing project structure before introducing new patterns.
- Prefer the smallest correct change.
- Do not refactor unrelated code while implementing a feature.
- Do not introduce new abstractions unless they solve a real existing problem.
- Before creating a new helper, service, repository, or utility, search the codebase for existing functionality.

## Layer responsibilities

### API / Router layer

Routers are responsible for:

- HTTP request parsing
- dependency injection
- authentication / authorization dependencies
- calling application/service logic
- returning HTTP responses

Routers must NOT contain complex business logic.

Keep route handlers small.

Example:

```python
@router.post("/users", response_model=UserResponse)
async def create_user(
    payload: UserCreate,
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    return await service.create_user(payload)
```

Avoid:

```python
@router.post("/users")
async def create_user(payload: UserCreate):
    # database queries
    # validation
    # business rules
    # email sending
    # 100 lines of logic
```

## Services

Business logic belongs in services.

Services may:

- validate business rules
- coordinate multiple repositories
- call external services
- execute application use cases

Services should not depend directly on FastAPI HTTP objects such as:

- `Request`
- `Response`
- `HTTPException`

Prefer domain/application exceptions instead.

## Database

Database-specific logic should not leak into API routes.

When a repository layer already exists, database queries must stay in repositories.

Do not introduce a repository layer only for abstraction's sake if the project does not currently use one.

Keep transaction boundaries explicit.

Avoid unnecessary database round trips.

Prevent N+1 queries where relevant.

## Schemas

Use Pydantic models for API input/output.

Keep separate schemas when input and output have different responsibilities.

Example:

- `UserCreate`
- `UserUpdate`
- `UserResponse`

Do not expose database models directly as public API contracts.

## Dependencies

Use FastAPI dependency injection for infrastructure concerns such as:

- database sessions
- authentication
- permissions
- application services
- external clients

Avoid using `Depends` deep inside business logic.

## Async

Do not use async automatically.

Use async when the underlying operation is asynchronous.

Never perform blocking I/O directly inside async endpoints.

Do not mix sync and async database APIs accidentally.

## Errors

Do not use broad exceptions such as:

```python
except Exception:
    ...
```

unless:

1. it is an application boundary
2. the exception is logged
3. the error is intentionally converted into a controlled response

Business errors should use explicit exception types.

HTTP error mapping should preferably happen at the API boundary or exception handler.

## API design

Follow REST conventions unless the existing project intentionally uses another style.

Use correct status codes.

Examples:

- `200` GET/update success
- `201` resource created
- `204` successful deletion without response body
- `400` invalid business request
- `401` authentication required
- `403` insufficient permission
- `404` resource not found
- `409` resource conflict
- `422` request validation failure

Do not return HTTP 200 for known errors.

## Feature implementation

Prefer vertical feature implementation:

1. schema
2. data access
3. service/business logic
4. API endpoint
5. tests

A feature should work end-to-end before moving to the next feature.

## Important FastAPI rule

Before implementing new functionality, search the project for:

- existing dependencies
- existing exception handlers
- existing database session pattern
- existing authentication pattern
- existing pagination pattern
- existing response schemas

Never introduce a second pattern for the same concern unless explicitly requested.