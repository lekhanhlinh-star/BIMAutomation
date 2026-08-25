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


@pytest.mark.asyncio
async def test_admin_can_grant_admin_role_to_another_account(client: TestClient) -> None:
    async with TestSessionLocal() as session:
        admin = User(
            email="role_manager@example.com",
            hashed_password="hash",
            role=UserRole.ADMIN,
            is_active=True,
        )
        target = User(
            email="future_admin@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
        )
        regular_user = User(
            email="not_allowed@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
        )
        session.add_all([admin, target, regular_user])
        await session.commit()
        await session.refresh(admin)
        await session.refresh(target)
        await session.refresh(regular_user)
        admin_id = admin.id
        target_id = target.id
        regular_user_id = regular_user.id

    admin_token = create_access_token(
        user_id=admin_id,
        email="role_manager@example.com",
        role="ADMIN",
    )
    regular_token = create_access_token(
        user_id=regular_user_id,
        email="not_allowed@example.com",
        role="USER",
    )

    forbidden = client.post(
        f"/api/v1/admin/customers/{target_id}/grant-admin",
        headers={"Authorization": f"Bearer {regular_token}"},
    )
    assert forbidden.status_code == 403

    response = client.post(
        f"/api/v1/admin/customers/{target_id}/grant-admin",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["role"] == "ADMIN"

    customers = client.get(
        "/api/v1/admin/customers",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    target_customer = next(
        customer for customer in customers.json() if customer["id"] == str(target_id)
    )
    assert target_customer["role"] == "ADMIN"

    async with TestSessionLocal() as session:
        promoted_user = await session.get(User, target_id)
        assert promoted_user is not None
        assert promoted_user.role == UserRole.ADMIN

        result = await session.execute(
            select(AuditLog).where(
                AuditLog.action == "admin_role_granted",
                AuditLog.target_id == str(target_id),
            )
        )
        audit_log = result.scalar_one()
        assert audit_log.actor_user_id == admin_id
        assert '"previous_role": "USER"' in (audit_log.metadata_json or "")
        assert '"new_role": "ADMIN"' in (audit_log.metadata_json or "")
