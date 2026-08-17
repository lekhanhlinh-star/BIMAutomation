---
trigger: always_on
---

# FastAPI Project Structure Rules

## Purpose

Use a predictable, scalable FastAPI project structure.

Before creating or moving files, inspect the existing repository and preserve established conventions when they are reasonable.

Do not reorganize the whole project unless explicitly requested.

## Recommended Structure

```text
backend/

├── app/
│   ├── __init__.py
│   ├── main.py
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── auth.py
│   │           ├── users.py
│   │           └── health.py
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── logging.py
│   │   └── exceptions.py
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── session.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── user.py
│   │
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── user.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   └── user.py
│   │
│   └── utils/
│       ├── __init__.py
│       └── ...
│
├── tests/
│   ├── conftest.py
│   ├── api/
│   ├── services/
│   └── repositories/
│
├── migrations/
├── alembic.ini
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml
├── .env.example
└── README.md
```

The structure is a guideline, not a reason to create empty directories that are not needed.

## Directory Responsibilities

### `app/main.py`

Application entry point.

Responsible for:

- creating the FastAPI application
- registering routers
- registering middleware
- registering exception handlers
- application lifespan/startup/shutdown wiring

Do not put business logic in `main.py`.

### `app/api/`

HTTP/API boundary.

Contains:

- routers
- request dependencies
- versioned APIs
- endpoint definitions

Do not put database query logic or substantial business logic here.

### `app/api/deps.py`

Shared FastAPI dependencies, for example:

- current user
- database session
- permission checks
- service construction

Do not turn this file into a general utility module.

### `app/api/v1/`

Version 1 API.

Prefer one central router:

```python
api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
```

`main.py` should normally include the version router rather than every endpoint module individually.

### `app/core/`

Application-wide infrastructure and configuration.

Examples:

- settings/configuration
- security primitives
- logging setup
- application exceptions

Do not place feature-specific business logic in `core/`.

### `app/db/`

Database infrastructure.

Examples:

- engine/session setup
- declarative base
- database initialization

Do not place feature queries here.

### `app/models/`

ORM/database models.

Models describe database persistence.

Do not use ORM models as public API schemas.

### `app/schemas/`

Pydantic request/response models.

Recommended naming:

```text
UserCreate
UserUpdate
UserResponse
UserListResponse
```

Keep API contracts separate from ORM models.

### `app/repositories/`

Database access for domain entities.

Repositories may contain:

- SELECT queries
- INSERT/UPDATE/DELETE operations
- persistence-specific filtering
- database-specific loading strategies

Repositories should not:

- know about HTTP
- raise `HTTPException`
- contain endpoint orchestration logic

Only use a repository layer if the project benefits from it or already follows this pattern.

### `app/services/`

Business/application logic.

Services may:

- enforce business rules
- coordinate repositories
- call external integrations
- execute use cases

Services should not depend on FastAPI request/response objects.

### `app/utils/`

Only for small, reusable, domain-neutral helpers.

Do not create a `utils` dumping ground.

If code belongs clearly to a feature, service, repository, core concern, or schema, keep it there instead.

### `tests/`

Mirror important application boundaries where practical.

Example:

```text
tests/
├── api/
│   └── test_users.py
├── services/
│   └── test_user_service.py
└── repositories/
    └── test_user_repository.py
```

Prefer behavior-oriented tests.

## Feature Placement Rules

When adding a new feature, first determine which layers it actually needs.

Example: adding `orders`.

Possible files:

```text
app/
├── api/v1/endpoints/orders.py
├── models/order.py
├── schemas/order.py
├── repositories/order.py
└── services/order.py

tests/
├── api/test_orders.py
├── services/test_order_service.py
└── repositories/test_order_repository.py
```

Do not create every file automatically.

For example, if an endpoint only exposes a simple health check, it does not need:

- a model
- a repository
- a service

Use the smallest structure that fits the feature.

## Naming Rules

Use singular names for entity modules:

```text
models/user.py
schemas/user.py
repositories/user.py
services/user.py
```

Endpoint modules may use plural resource names:

```text
api/v1/endpoints/users.py
api/v1/endpoints/orders.py
```

Be consistent with the existing repository if it already follows another reasonable convention.

## Dependency Direction

Preferred dependency direction:

```text
API
 ↓
Service
 ↓
Repository
 ↓
Database
```

Schemas may be used by the API and service layers where appropriate.

Core/database infrastructure can be depended on by lower-level implementation code.

Avoid reverse dependencies such as:

```text
repository -> API
service -> router
model -> HTTPException
```

## Import Rules

Prefer absolute application imports:

```python
from app.services.user import UserService
from app.schemas.user import UserCreate
```

Avoid deeply nested relative imports unless the repository already standardizes them.

Prevent circular dependencies.

If circular imports appear, reconsider module responsibilities before adding local imports as a workaround.

## API Versioning

For public or evolving APIs, prefer:

```text
app/api/v1/
```

Do not introduce `v2` until there is an actual incompatible API version.

Do not duplicate all business logic when creating a new API version.

Version HTTP contracts, not the entire application architecture.

## Small Projects

For very small projects, a simpler structure is acceptable:

```text
app/
├── main.py
├── routers/
├── schemas/
├── models/
└── services/
```

Do not force enterprise-style layering on a small codebase.

Refactor toward more layers only when complexity justifies it.

## Large Projects

When the project becomes feature-heavy, consider feature-oriented modules instead of global layer folders.

Example:

```text
app/
├── modules/
│   ├── users/
│   │   ├── router.py
│   │   ├── schemas.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   └── models.py
│   └── orders/
│       ├── router.py
│       ├── schemas.py
│       ├── service.py
│       ├── repository.py
│       └── models.py
```

Do not migrate to feature modules automatically.

Use this structure when the current layer-based layout becomes hard to navigate or creates excessive cross-feature coupling.

## Before Creating Files

Before adding a file or folder:

1. inspect the current repository
2. search for the existing convention
3. decide which responsibility the code belongs to
4. reuse existing modules when appropriate
5. create only the minimum files required

Never create duplicate structures such as:

```text
app/routes/
app/routers/
app/api/
```

for the same responsibility.

Never create parallel patterns such as:

```text
app/crud/
app/repositories/
```

unless there is a deliberate architectural distinction.

## Before Moving Files

Do not move or rename existing modules merely to match this document.

A project-wide structure migration must be explicitly requested and should include:

1. migration plan
2. import impact
3. test impact
4. deployment/startup impact
5. staged implementation when appropriate

## Agent Decision Rule

When this rule conflicts with a mature, internally consistent existing project structure:

1. preserve the existing structure
2. follow its established pattern
3. mention the difference in the implementation report

Consistency within the existing codebase is more important than mechanically enforcing this template.