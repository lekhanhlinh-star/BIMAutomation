#!/usr/bin/env python3
"""
PreToolUse Safety Gate Hook
Checks for destructive commands and prompts the user for confirmation.
"""
import json
import re
import sys

DANGEROUS_PATTERNS = [
    r"rm\s+-(?:r|f|rf|fr)\s+(?:/|\.\.|\*)",
    r"git\s+reset\s+--hard",
    r"git\s+clean\s+-fdx",
    r"drop\s+database",
    r"drop\s+table",
    r"truncate\s+table",
    r"alembic\s+downgrade\s+base",
    r"mkfs",
    r":(){ :|:& };:",
]

def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        print(json.dumps({"decision": "allow"}))
        return

    tool_call = payload.get("toolCall", {})
    name = tool_call.get("name", "")
    args = tool_call.get("args", {})

    if name == "run_command":
        cmd = args.get("CommandLine", "")
        for pattern in DANGEROUS_PATTERNS:
            if re.search(pattern, cmd, re.IGNORECASE):
                print(json.dumps({
                    "decision": "ask",
                    "reason": f"Dangerous command pattern detected ('{cmd}'). User confirmation required.",
                }))
                return

    print(json.dumps({"decision": "allow"}))

if __name__ == "__main__":
    main()
