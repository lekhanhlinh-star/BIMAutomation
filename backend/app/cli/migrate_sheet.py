import argparse
import asyncio
import csv
import json
import sys
from pathlib import Path

from app.db.session import async_session_maker
from app.services.migration_service import import_sheet_records


async def main_async(csv_path: str, dry_run: bool) -> None:
    path = Path(csv_path)
    if not path.exists():
        print(f"Error: File '{csv_path}' not found.")
        sys.exit(1)

    records = []
    with open(path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append(row)

    print(f"Loaded {len(records)} rows from {csv_path}. Processing migration (dry_run={dry_run})...")

    async with async_session_maker() as session:
        result = await import_sheet_records(
            session=session,
            records=records,
            dry_run=dry_run,
        )

    print("\n--- Migration Results ---")
    print(f"Total Rows:  {result['total_rows']}")
    print(f"Imported:    {result['imported']}")
    print(f"Duplicates:  {result['duplicates']}")
    print(f"Errors:      {len(result['errors'])}")
    print(f"Dry Run:     {result['dry_run']}")

    if result["errors"]:
        print("\nError Details:")
        for err in result["errors"]:
            print(f"  Row {err['row']} ({err['email']}): {err['error']}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Migrate licenses from legacy Google Sheet CSV.")
    parser.add_argument("--file", "-f", required=True, help="Path to CSV export file")
    parser.add_argument("--dry-run", action="store_true", help="Validate without committing to database")
    args = parser.parse_args()

    asyncio.run(main_async(args.file, args.dry_run))


if __name__ == "__main__":
    main()
