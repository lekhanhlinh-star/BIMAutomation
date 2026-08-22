import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.models.audit_log import AuditLog
from app.models.license import License, LicenseStatus
from app.models.user import User, UserRole
from app.services.token_service import create_access_token
from tests.conftest import TestSessionLocal


@pytest.mark.asyncio
async def test_admin_rbac_and_audit_logging(client: TestClient) -> None:
    async with TestSessionLocal() as session:
        admin = User(
            email="admin_auditor@example.com",
            hashed_password="hash",
            role=UserRole.ADMIN,
            is_active=True,
        )
        user = User(
            email="regular_user@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
        )
        session.add_all([admin, user])
        await session.commit()
        await session.refresh(admin)
        await session.refresh(user)
        admin_id = admin.id
        user_id = user.id

    admin_token = create_access_token(user_id=admin_id, email="admin_auditor@example.com", role="ADMIN")
    user_token = create_access_token(user_id=user_id, email="regular_user@example.com", role="USER")

    # 1. Non-admin user calling admin API is forbidden (403)
    res_forbidden = client.get(
        "/api/v1/admin/audit-logs",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert res_forbidden.status_code == 403

    # 2. Admin creates license -> Audit log created
    res_create = client.post(
        "/api/v1/admin/licenses",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "user_id": str(user_id),
            "plan": "professional",
            "max_devices": 3,
            "days_valid": 180,
            "features": ["beam-rebar", "chat-ai"],
        },
    )
    assert res_create.status_code == 201
    license_id = res_create.json()["id"]

    # 3. Admin updates features
    res_feat = client.post(
        f"/api/v1/admin/licenses/{license_id}/features",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"features": ["beam-rebar", "column-rebar", "mcp-write"]},
    )
    assert res_feat.status_code == 200

    # 4. Admin revokes license
    res_rev = client.post(
        f"/api/v1/admin/licenses/{license_id}/revoke",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_rev.status_code == 200
    assert res_rev.json()["status"] == "REVOKED"

    # 5. Fetch audit logs and verify actions recorded
    audit_resp = client.get(
        "/api/v1/admin/audit-logs",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert audit_resp.status_code == 200
    logs = audit_resp.json()
    assert len(logs) >= 3

    actions = [l["action"] for l in logs]
    assert "admin_license_created" in actions
    assert "admin_license_features_updated" in actions
    assert "admin_license_revoked" in actions

    # 6. Verify secrets/passwords are NOT in any audit log
    for l in logs:
        meta = str(l.get("metadata_json") or "")
        assert "secret" not in meta.lower() or "[REDACTED]" in meta
        assert "password" not in meta.lower() or "[REDACTED]" in meta
