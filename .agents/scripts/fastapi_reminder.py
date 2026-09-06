#!/usr/bin/env python3
"""
PreInvocation FastAPI Invariant Reminder Hook
Injects brief ephemeral reminder of FastAPI async rules and typing constraints.
"""
import json
import sys

def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        print(json.dumps({"injectSteps": []}))
        return

    invocation_num = payload.get("invocationNum", 0)

    # Invert/inject reminder on the initial turns of a conversation
    if invocation_num <= 2:
        print(json.dumps({
            "injectSteps": [
                {
                    "ephemeralMessage": "FastAPI Standards Active: Enforce async non-blocking I/O, Annotated[..., Depends(...)], SQLAlchemy 2.0 select(), Pydantic v2 schemas, and structured logging."
                }
            ]
        }))
    else:
        print(json.dumps({"injectSteps": []}))

if __name__ == "__main__":
    main()
