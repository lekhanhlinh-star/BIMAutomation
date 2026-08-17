---
description: Implements a FastAPI feature using a structured workflow: understand requirements, inspect existing code, plan minimal changes, implement by layer, verify with tests, and report results.
---

# Implement FastAPI Feature

When asked to implement a feature, follow this workflow.

## Step 1 — Understand

Read the feature requirement carefully.

Identify:

- expected behavior
- API contract
- business rules
- authentication requirements
- authorization requirements
- database impact
- edge cases

Do not code yet.

## Step 2 — Inspect

Inspect the existing repository.

Find:

- related routers
- schemas
- models
- services
- repositories
- dependencies
- tests
- existing patterns that can be reused

Do not create duplicate functionality.

## Step 3 — Plan

Produce a short implementation plan.

Include:

1. files to modify
2. files to create
3. database changes
4. API changes
5. tests to add
6. important assumptions

Prefer the smallest implementation that satisfies the requirement.

For significant architecture or database changes, stop and request review before implementation.

## Step 4 — Implement

Implement one logical layer at a time.

Suggested order:

1. schemas/types
2. data access
3. service/business logic
4. API endpoint
5. tests

Follow existing project conventions.

Do not modify unrelated code.

## Step 5 — Verify

Run relevant:

- tests
- lint
- typecheck

Start the FastAPI application if useful.

Verify the actual API behavior when possible.

Check:

- happy path
- invalid input
- authentication
- authorization
- error handling

## Step 6 — Report

At completion report:

### Changes

What was implemented.

### Files

Files created or modified.

### Verification

Commands/tests executed.

### Decisions

Any important architectural decisions.

### Remaining issues

Known limitations or follow-up work.
