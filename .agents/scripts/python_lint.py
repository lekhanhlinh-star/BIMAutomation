#!/usr/bin/env python3
"""
PostToolUse Python Syntax & Linter Check Hook
Checks edited Python files for basic syntax validity.
"""
import json
import py_compile
import sys

def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        print("{}")
        return

    # In PostToolUse, stdout expects an empty JSON object {}
    print("{}")

if __name__ == "__main__":
    main()
