# Testing Rules

Every meaningful feature or bug fix should be verified.

## General

Prefer testing behavior instead of implementation details.

Tests should be:

- deterministic
- independent
- easy to understand
- focused on one behavior

## API tests

For endpoints, verify when relevant:

- successful request
- invalid request
- unauthenticated request
- unauthorized request
- resource not found
- business rule violation

Example scenarios:

```text
POST /users

✓ valid payload -> 201
✓ duplicated email -> 409
✓ invalid email -> 422
```

## Bug fixes

Every bug fix should include a regression test when practical.

The test should fail before the fix and pass after the fix.

## Database

Tests must not depend on production data.

Avoid tests whose result depends on execution order.

Clean up test state or isolate transactions appropriately.

## External services

Do not call real third-party APIs in normal unit tests.

Mock or fake external dependencies where appropriate.

## Before completion

Run the relevant project's configured commands.

Examples may include:

```bash
pytest
ruff check .
mypy .
```

Do not assume these tools exist.

Inspect project configuration first.

If the full test suite is expensive, run targeted tests first.

Report:

- tests executed
- tests passed
- tests skipped
- failures remaining
