"""Compatibility launcher for the new six-case evaluation (requires --real)."""
import asyncio
from scripts.evaluate_rendering import main

if __name__ == "__main__":
    asyncio.run(main())
