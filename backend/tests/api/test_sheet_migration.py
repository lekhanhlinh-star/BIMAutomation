import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.models.license import License
from app.models.user import User, UserRole
from app.services.token_service import create_access_token
from tests.conftest import TestSessionLocal


@pytest.mark.asyncio
async def test_sheet_migration_dry_run_and_commit(client: TestClient) -> None:
    async with TestSessionLocal() as session:
        admin = User(
            email="sheet_admin@example.com",
            hashed_password="hash",
            role=UserRole.ADMIN,
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        await session.refresh(admin)
        admin_id = admin.id

    admin_token = create_access_token(user_id=admin_id, email="sheet_admin@example.com", role="ADMIN")

    mock_sheet_records = [
        {"email": "  Customer1@Example.com ", "plan": "pro", "max_devices": 3, "expires": "2027-12-31"},
        {"email": "customer2@example.com", "plan": "standard", "max_devices": 1, "expires": "2026-06-30"},
        {"email": "invalid-email-row", "plan": "standard"},
    ]

    # 1. Dry-run mode
    dry_resp = client.post(
        "/api/v1/admin/migrate-sheet",
        headers={"Authorization": f"Bearer {admin_token}"},
        params={"dry_run": True},
        json=mock_sheet_records,
    )
    if dry_resp.status_code != 200:
        print("422 DETAIL:", dry_resp.text)
    assert dry_resp.status_code == 200
    dry_data = dry_resp.json()
    assert dry_data["total_rows"] == 3
    assert dry_data["imported"] == 2
    assert len(dry_data["errors"]) == 1
    assert dry_data["dry_run"] is True

    # Verify no users were created in DB during dry-run
    async with TestSessionLocal() as session:
        u1_res = await session.execute(select(User).where(User.email == "customer1@example.com"))
        assert u1_res.scalar_one_or_none() is None

    # 2. Real import mode
    real_resp = client.post(
        "/api/v1/admin/migrate-sheet",
        headers={"Authorization": f"Bearer {admin_token}"},
        params={"dry_run": False},
        json=mock_sheet_records,
    )
    assert real_resp.status_code == 200
    real_data = real_resp.json()
    assert real_data["imported"] == 2
    assert real_data["dry_run"] is False

    # Verify users and licenses now exist in DB with normalized email
    async with TestSessionLocal() as session:
        u1_res = await session.execute(select(User).where(User.email == "customer1@example.com"))
        user1 = u1_res.scalar_one_or_none()
        assert user1 is not None

        lic_res = await session.execute(select(License).where(License.user_id == user1.id))
        lic = lic_res.scalar_one_or_none()
        assert lic is not None
        assert lic.plan_name == "pro"
        assert lic.max_devices == 3
