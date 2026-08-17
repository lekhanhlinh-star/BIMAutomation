---
trigger: always_on
---

# Python / FastAPI Coding Rules

## Python

- Use modern Python syntax supported by this project.
- Add type hints to public functions and methods.
- Avoid `Any` unless necessary and justified.
- Prefer explicit code over clever code.
- Prefer early returns over deeply nested conditions.
- Keep functions focused on one responsibility.
- Use meaningful names.

Prefer:

```python
def get_user(user_id: UUID) -> User | None:
    ...
```

Avoid vague APIs such as:

```python
def process(data):
    ...
```

## Imports

Keep imports organized:

1. Python standard library
2. third-party libraries
3. application imports

Do not use wildcard imports.

Avoid circular imports.

## FastAPI routes

Keep handlers thin.

A route should normally:

1. receive validated input
2. resolve dependencies
3. call service/use-case
4. return result

Do not put significant business logic in routers.

## Pydantic

Use Pydantic models for validation.

Do not manually validate something that Pydantic can express clearly.

Prefer strongly typed fields.

Example:

```python
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    name: str
```

Avoid dictionary-based APIs when a typed model is appropriate.

## Functions

Prefer functions that are easy to test independently.

Avoid hidden global state.

Pass dependencies explicitly.

## Constants

Do not scatter magic strings or magic numbers throughout the codebase.

Extract meaningful constants when values are reused or have domain meaning.

Do not create constants for trivial one-off values.

## Logging

Use the application's logging system.

Do not use `print()` for production debugging.

Never log:

- passwords
- access tokens
- refresh tokens
- API secrets
- sensitive personal data

## Security

Never hardcode credentials.

Read configuration from the project's settings/config system.

Never trust client-controlled IDs for authorization.

Authentication and authorization are separate concerns.

Always verify that the current user is allowed to access the requested resource.

## Changes

When implementing a task:

- inspect related code first
- reuse existing conventions
- modify only relevant files
- do not perform unrelated cleanup
- do not rename public APIs without explicit reason
- do not add dependencies unless necessary

When adding a dependency, explain why the existing stack cannot reasonably solve the problem.

## Completion

Before considering work complete:

- check imports
- run formatter/linter configured by the repository
- run type checking if configured
- run relevant tests
- ensure application can start
- check for obvious regressions