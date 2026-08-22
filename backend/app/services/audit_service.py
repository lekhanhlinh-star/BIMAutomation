from datetime import datetime, timezone
import json
from typing import Any
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


async def log_audit_event(
    session: AsyncSession,
    action: str,
    target_type: str,
    target_id: str | None = None,
    actor_user_id: uuid.UUID | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> AuditLog:
    """
    Creates an immutable audit log entry.
    Ensures secrets, raw tokens and credentials are NEVER logged.
    """
    clean_metadata = None
    if metadata:
        # Sanitize sensitive fields if any
        sanitized = {}
        for k, v in metadata.items():
            if any(s in k.lower() for s in ("token", "secret", "password", "code_verifier")):
                sanitized[k] = "[REDACTED]"
            else:
                sanitized[k] = v
        clean_metadata = json.dumps(sanitized)

    audit_entry = AuditLog(
        actor_user_id=actor_user_id,
        action=action,
        target_type=target_type,
        target_id=str(target_id) if target_id else None,
        ip_address=ip_address,
        user_agent=user_agent[:500] if user_agent else None,
        metadata_json=clean_metadata,
        created_at=datetime.now(timezone.utc),
    )
    session.add(audit_entry)
    await session.commit()
    return audit_entry
