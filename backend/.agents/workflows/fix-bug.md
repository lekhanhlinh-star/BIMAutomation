---
description: Debugs and fixes FastAPI issues by reproducing the problem, identifying the root cause, applying the smallest safe fix, adding regression tests, and verifying behavior.
---

# Fix Bug Workflow

## 1. Reproduce

Understand the reported behavior.

Try to reproduce the bug before changing code.

Identify:

- expected behavior
- actual behavior
- reproduction steps

## 2. Investigate

Inspect relevant code.

Trace the execution path from:

request
→ router
→ dependency
→ service
→ database/external system

Do not modify code until there is a plausible root cause.

## 3. Explain

State the likely root cause briefly.

Separate root cause from symptoms.

## 4. Fix

Make the smallest change that fixes the root cause.

Do not perform unrelated refactors.

## 5. Regression test

Add or update a test that reproduces the original bug when practical.

The test should fail without the fix.

## 6. Verify

Run relevant tests.

Check nearby behavior for regressions.

## 7. Report

Explain:

- root cause
- fix
- files changed
- tests performed
