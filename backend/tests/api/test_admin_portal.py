from fastapi.testclient import TestClient
import pytest
from sqlalchemy import select

from app.core.config import settings
from app.models.license import LicenseStatus
from app.models.product import Product
from app.models.plan import Plan
from app.models.user import User, UserRole
from tests.conftest import TestSessionLocal


@pytest.mark.asyncio
async def test_non_admin_forbidden(client: TestClient) -> None:
    # Register regular user
    client.post(
        "/api/v1/auth/register",
        json={"email": "regular@example.com", "password": "Password123!"},
    )
    login_res = client.post(
        "/api/v1/auth/jwt/login",
        data={"username": "regular@example.com", "password": "Password123!"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt admin routes -> Expect 403 Forbidden
    assert client.get("/api/v1/admin/dashboard/stats", headers=headers).status_code == 403
    assert client.get("/api/v1/admin/orders", headers=headers).status_code == 403
    assert client.get("/api/v1/admin/licenses", headers=headers).status_code == 403
    assert client.get("/api/v1/admin/releases", headers=headers).status_code == 403


@pytest.mark.asyncio
async def test_admin_portal_full_flow(client: TestClient) -> None:
    # 1. Seed Product & Plan
    async with TestSessionLocal() as session:
        product = Product(name="BIMPilot Pro", slug="bimpilot-pro")
        session.add(product)
        await session.flush()

        plan = Plan(
            product_id=product.id,
            name="6 Months",
            duration_months=6,
            price=1200000,
        )
        session.add(plan)
        await session.commit()
        plan_id = str(plan.id)

    # 2. Register & Elevate Admin User
    client.post(
        "/api/v1/auth/register",
        json={"email": "admin@example.com", "password": "AdminPassword123!"},
    )
    async with TestSessionLocal() as session:
        res = await session.execute(select(User).where(User.email == "admin@example.com"))
        admin_user = res.unique().scalar_one()
        admin_user.role = UserRole.ADMIN
        await session.commit()

    login_res = client.post(
        "/api/v1/auth/jwt/login",
        data={"username": "admin@example.com", "password": "AdminPassword123!"},
    )
    admin_token = login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 3. Create Order & Process Payment
    order_res = client.post(
        "/api/v1/orders",
        headers=admin_headers,
        json={"plan_id": plan_id},
    )
    order_code = order_res.json()["order_code"]

    client.post(
        "/api/v1/payments/webhook",
        headers={"Authorization": f"Apikey {settings.sepay_api_key}"},
        json={
            "gateway": "MBBank",
            "amountIn": 1200000,
            "transactionContent": order_code,
            "referenceNumber": "MB_FT_ADMIN_TEST",
        },
    )

    # 4. GET /api/v1/admin/dashboard/stats
    stats_res = client.get("/api/v1/admin/dashboard/stats", headers=admin_headers)
    assert stats_res.status_code == 200
    stats_data = stats_res.json()
    assert stats_data["total_revenue"] == 1200000
    assert stats_data["total_orders"] == 1
    assert stats_data["total_users"] == 1

    # 5. GET /api/v1/admin/orders
    orders_res = client.get("/api/v1/admin/orders", headers=admin_headers)
    assert orders_res.status_code == 200
    assert len(orders_res.json()) == 1

    # 6. GET /api/v1/admin/licenses
    licenses_res = client.get("/api/v1/admin/licenses", headers=admin_headers)
    assert licenses_res.status_code == 200
    licenses_list = licenses_res.json()
    assert len(licenses_list) == 1
    license_id = licenses_list[0]["id"]
    license_key = licenses_list[0]["license_key"]

    # 7. Activate License with device_id
    activate_res = client.post(
        "/api/v1/licenses/activate",
        json={"licenseKey": license_key, "deviceId": "TEST-DEVICE-001"},
    )
    assert activate_res.status_code == 200
    assert activate_res.json()["status"] == "ACTIVE"

    # 8. POST /api/v1/admin/licenses/{license_id}/reset-device
    reset_res = client.post(
        f"/api/v1/admin/licenses/{license_id}/reset-device",
        headers=admin_headers,
    )
    assert reset_res.status_code == 200
    assert reset_res.json()["device_id"] is None
    assert reset_res.json()["status"] == "PENDING"

    # 9. POST /api/v1/admin/licenses/{license_id}/status (Suspend)
    status_res = client.post(
        f"/api/v1/admin/licenses/{license_id}/status",
        headers=admin_headers,
        json={"status": "SUSPENDED"},
    )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "SUSPENDED"

    # 10. POST /api/v1/admin/licenses/{license_id}/extend
    extend_res = client.post(
        f"/api/v1/admin/licenses/{license_id}/extend",
        headers=admin_headers,
        json={"days": 30},
    )
    assert extend_res.status_code == 200

    # 11. POST /api/v1/admin/releases
    release_res = client.post(
        "/api/v1/admin/releases",
        headers=admin_headers,
        json={
            "version": "1.1.0",
            "download_url": "https://bimpilot.com/downloads/v1.1.0.exe",
            "release_notes": "Added Revit 2026 support",
        },
    )
    assert release_res.status_code == 201
    assert release_res.json()["version"] == "1.1.0"

    # 12. Activate Trial on a machine and then DELETE via admin
    inst_res = client.post(
        "/api/v1/devices/activate",
        headers=admin_headers,
        json={
            "productCode": "revitapp",
            "installationId": "test-inst-uuid-1",
            "machineFingerprint": "mock_fp_hash_admin_delete_test",
            "displayName": "JUNK-TEST-MACHINE",
            "platform": "windows",
        },
    )
    assert inst_res.status_code == 200

    trials_res = client.get("/api/v1/admin/device-trials", headers=admin_headers)
    assert trials_res.status_code == 200
    target_trial = [t for t in trials_res.json() if t["fingerprint_hash"] == "mock_fp_hash_admin_delete_test"][0]

    del_trial_res = client.delete(
        f"/api/v1/admin/device-trials/{target_trial['id']}",
        headers=admin_headers,
    )
    assert del_trial_res.status_code == 200
    assert del_trial_res.json()["status"] == "ok"

    # Trial hardware history is tombstoned instead of deleted, preventing reuse.
    trials_res_after = client.get("/api/v1/admin/device-trials", headers=admin_headers)
    archived_trial = next(t for t in trials_res_after.json() if t["id"] == target_trial["id"])
    assert archived_trial["status"] == "BLOCKED"
