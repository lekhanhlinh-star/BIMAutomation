import csv
from datetime import datetime, timezone
import io
import re
from typing import Any
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.license import License, LicenseStatus
from app.models.product import Product
from app.models.user import User, UserRole
from app.services.audit_service import log_audit_event


def normalize_email(email: str) -> str:
    return email.strip().lower()


def parse_date(date_str: str | None) -> datetime | None:
    if not date_str:
        return None
    date_str = str(date_str).strip()
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S", "%d/%m/%Y"):
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


async def process_sheet_migration(
    session: AsyncSession,
    data_input: str | list[dict[str, Any]],
    dry_run: bool = False,
    actor_user_id: uuid.UUID | None = None,
) -> dict[str, Any]:
    """
    Imports historical licenses from Google Sheet CSV export or JSON record list.
    Supports dry-run, email normalization, validation, duplicate handling, and audit logging.
    """
    if isinstance(data_input, list):
        rows = data_input
    else:
        reader = csv.DictReader(io.StringIO(str(data_input).strip()))
        rows = list(reader)
    
    imported = []
    skipped_duplicates = []
    errors = []

    prod_res = await session.execute(select(Product))
    product = prod_res.scalars().first()

    for row_idx, row in enumerate(rows, start=1):
        raw_email = row.get("email") or row.get("Email") or ""
        email = normalize_email(str(raw_email))
        
        if not email or "@" not in email:
            errors.append({"row": row_idx, "email": raw_email, "error": "Invalid email address"})
            continue

        raw_plan = str(row.get("plan") or row.get("Plan") or "standard").strip().lower()
        raw_expiry = row.get("expiry") or row.get("Expiry") or row.get("expires") or row.get("expires_at") or None
        expiry_dt = parse_date(raw_expiry)

        max_devices_raw = row.get("max_devices") or row.get("maxDevices") or row.get("MaxDevices") or 2
        try:
            max_devices = int(max_devices_raw)
        except ValueError:
            max_devices = 2

        user_res = await session.execute(select(User).where(User.email == email))
        user = user_res.scalars().first()

        if not dry_run:
            if not user:
                import secrets
                user = User(
                    email=email,
                    normalized_email=email,
                    hashed_password=secrets.token_hex(32),
                    role=UserRole.USER,
                    is_active=True,
                    is_verified=True,
                )
                session.add(user)
                await session.flush()

            lic_res = await session.execute(
                select(License).where(License.user_id == user.id, License.status == LicenseStatus.ACTIVE)
            )
            existing_lic = lic_res.scalars().first()

            if existing_lic:
                skipped_duplicates.append({
                    "row": row_idx,
                    "email": email,
                    "license_key": existing_lic.license_key,
                    "reason": "Active license already exists for this user",
                })
                continue

            import secrets
            license_key = f"BP-MIG-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}"
            now = datetime.now(timezone.utc)

            new_license = License(
                license_key=license_key,
                user_id=user.id,
                product_id=product.id if product else None,
                plan_name=raw_plan,
                status=LicenseStatus.ACTIVE,
                max_devices=max_devices,
                starts_at=now,
                expires_at=expiry_dt,
                activated_at=now,
                created_at=now,
            )
            session.add(new_license)
            imported.append({
                "row": row_idx,
                "email": email,
                "plan": raw_plan,
                "license_key": license_key,
                "expires_at": expiry_dt.isoformat() if expiry_dt else None,
            })
        else:
            imported.append({
                "row": row_idx,
                "email": email,
                "plan": raw_plan,
                "dry_run": True,
                "expires_at": expiry_dt.isoformat() if expiry_dt else None,
            })

    if not dry_run:
        await session.commit()
        await log_audit_event(
            session=session,
            action="sheet_migration_imported",
            target_type="system",
            target_id="migration_job",
            actor_user_id=actor_user_id,
            metadata={
                "imported_count": len(imported),
                "skipped_count": len(skipped_duplicates),
                "error_count": len(errors),
            },
        )

    total = len(imported) + len(skipped_duplicates) + len(errors)
    imp_count = len(imported)
    dup_count = len(skipped_duplicates)
    err_count = len(errors)
    return {
        "dry_run": dry_run,
        "dryRun": dry_run,
        "total_rows": total,
        "totalRows": total,
        "imported": imp_count,
        "importedCount": imp_count,
        "duplicates": dup_count,
        "skippedCount": dup_count,
        "skippedDuplicates": skipped_duplicates,
        "errors": errors,
        "errorCount": err_count,
        "imported_records": imported,
    }
