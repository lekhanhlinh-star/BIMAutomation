from fastapi.testclient import TestClient
import pytest
from sqlalchemy import select

from app.core.config import settings
from app.models.license import License, LicenseStatus
from app.models.order import Order, OrderStatus
from app.models.plan import Plan
from app.models.product import Product
from app.models.release import Release
from app.models.user import User, UserRole
from tests.conftest import TestSessionLocal


@pytest.mark.asyncio
async def test_full_e2e_bimpilot_customer_and_admin_journey(client: TestClient) -> None:
    # --------------------------------------------------------------------------
    # Step 1: Seed Product & Plan
    # --------------------------------------------------------------------------
    async with TestSessionLocal() as session:
        product = Product(name="BIMPilot Pro", slug="bimpilot-pro")
        session.add(product)
        await session.flush()

        plan = Plan(
            product_id=product.id,
            name="Gói 6 tháng",
            duration_months=6,
            price=1200000,
        )
        session.add(plan)

        release = Release(
            version="1.0.0",
            download_url="https://bimpilot.com/downloads/BIMPilot_v1.0.0.exe",
            release_notes="Initial E2E Release",
            minimum_revit_version=2021,
            maximum_revit_version=2026,
            is_active=True,
        )
        session.add(release)

        await session.commit()
        plan_id = str(plan.id)

    # --------------------------------------------------------------------------
    # Step 2: Customer Registration, Login & Profile Update
    # --------------------------------------------------------------------------
    reg_res = client.post(
        "/api/v1/auth/register",
        json={"email": "e2e_customer@example.com", "password": "Password123!"},
    )
    assert reg_res.status_code == 201

    login_res = client.post(
        "/api/v1/auth/jwt/login",
        data={"username": "e2e_customer@example.com", "password": "Password123!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {token}"}

    # Update profile
    profile_res = client.patch(
        "/api/v1/users/me",
        headers=user_headers,
        json={"name": "Le Khanh Linh", "phone": "0912345678"},
    )
    assert profile_res.status_code == 200
    assert profile_res.json()["name"] == "Le Khanh Linh"
    assert profile_res.json()["phone"] == "0912345678"

    # --------------------------------------------------------------------------
    # Step 3: Browse Plans, Create Order & Fetch VietQR Code
    # --------------------------------------------------------------------------
    plans_res = client.get("/api/v1/plans")
    assert plans_res.status_code == 200
    assert len(plans_res.json()) == 1

    order_res = client.post(
        "/api/v1/orders",
        headers=user_headers,
        json={"plan_id": plan_id},
    )
    assert order_res.status_code == 201
    order_data = order_res.json()
    order_id = order_data["id"]
    order_code = order_data["order_code"]
    assert order_data["status"] == "PENDING"
    assert order_data["amount"] == 1200000

    qr_res = client.get(f"/api/v1/orders/{order_id}/qr", headers=user_headers)
    assert qr_res.status_code == 200
    assert qr_res.json()["order_code"] == order_code
    assert "img.vietqr.io" in qr_res.json()["qr_code_url"]

    # --------------------------------------------------------------------------
    # Step 4: Payment Confirmation via SePay Webhook & Auto-License Generation
    # --------------------------------------------------------------------------
    webhook_res = client.post(
        "/api/v1/payments/webhook",
        headers={"Authorization": f"Apikey {settings.sepay_api_key}"},
        json={
            "gateway": "MBBank",
            "amountIn": 1200000,
            "transactionContent": f"BIMPILOT {order_code}",
            "referenceNumber": "MB_E2E_FT_998877",
            "body": f"BIMPILOT {order_code}",
        },
    )
    assert webhook_res.status_code == 200
    assert webhook_res.json() == {"success": True}

    # --------------------------------------------------------------------------
    # Step 5: Customer Portal Auditing
    # --------------------------------------------------------------------------
    licenses_res = client.get("/api/v1/account/licenses", headers=user_headers)
    assert licenses_res.status_code == 200
    licenses_list = licenses_res.json()
    assert len(licenses_list) == 1
    license_key = licenses_list[0]["license_key"]
    license_id = licenses_list[0]["id"]
    assert license_key.startswith("BP7X-")
    assert licenses_list[0]["status"] == "PENDING"

    orders_res = client.get("/api/v1/account/orders", headers=user_headers)
    assert orders_res.status_code == 200
    assert len(orders_res.json()) == 1
    assert orders_res.json()[0]["status"] == "PAID"

    # --------------------------------------------------------------------------
    # Step 6: Add-in Download & First License Activation (PC 1)
    # --------------------------------------------------------------------------
    download_res = client.get("/api/v1/download/latest", headers=user_headers)
    assert download_res.status_code == 200
    assert download_res.json()["version"] == "1.0.0"

    activate_res = client.post(
        "/api/v1/licenses/activate",
        json={"licenseKey": license_key, "deviceId": "WORKSTATION-PC-01"},
    )
    assert activate_res.status_code == 200
    act_data = activate_res.json()
    assert act_data["success"] is True
    assert act_data["status"] == "ACTIVE"
    assert act_data["expiresAt"] is not None

    # --------------------------------------------------------------------------
    # Step 7: Periodic License Verification
    # --------------------------------------------------------------------------
    verify_res = client.post(
        "/api/v1/licenses/verify",
        json={"licenseKey": license_key, "deviceId": "WORKSTATION-PC-01"},
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["valid"] is True
    assert verify_res.json()["status"] == "ACTIVE"

    # --------------------------------------------------------------------------
    # Step 8: Admin Management Operations
    # --------------------------------------------------------------------------
    client.post(
        "/api/v1/auth/register",
        json={"email": "e2e_admin@example.com", "password": "AdminPassword123!"},
    )
    async with TestSessionLocal() as session:
        res = await session.execute(
            select(User).where(User.email == "e2e_admin@example.com")
        )
        admin_obj = res.unique().scalar_one()
        admin_obj.role = UserRole.ADMIN
        await session.commit()

    admin_login = client.post(
        "/api/v1/auth/jwt/login",
        data={"username": "e2e_admin@example.com", "password": "AdminPassword123!"},
    )
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    # Admin Stats
    stats_res = client.get("/api/v1/admin/dashboard/stats", headers=admin_headers)
    assert stats_res.status_code == 200
    assert stats_res.json()["total_revenue"] == 1200000
    assert stats_res.json()["active_licenses"] == 1

    # Admin Reset Device Binding
    reset_res = client.post(
        f"/api/v1/admin/licenses/{license_id}/reset-device",
        headers=admin_headers,
    )
    assert reset_res.status_code == 200
    assert reset_res.json()["device_id"] is None

    # Admin Extend Expiration by 30 days
    extend_res = client.post(
        f"/api/v1/admin/licenses/{license_id}/extend",
        headers=admin_headers,
        json={"days": 30},
    )
    assert extend_res.status_code == 200

    # Admin Publish New Release
    new_release_res = client.post(
        "/api/v1/admin/releases",
        headers=admin_headers,
        json={
            "version": "1.2.0",
            "download_url": "https://bimpilot.com/downloads/v1.2.0.exe",
            "release_notes": "Added Revit 2026 support and speed optimizations",
        },
    )
    assert new_release_res.status_code == 201

    # Verify Latest Release updated
    download_v2_res = client.get("/api/v1/download/latest", headers=user_headers)
    assert download_v2_res.status_code == 200
    assert download_v2_res.json()["version"] == "1.2.0"

    # --------------------------------------------------------------------------
    # Step 9: Re-activation on New Workstation Device (PC 2)
    # --------------------------------------------------------------------------
    reactivate_res = client.post(
        "/api/v1/licenses/activate",
        json={"licenseKey": license_key, "deviceId": "LAPTOP-MOBILE-02"},
    )
    assert reactivate_res.status_code == 200
    assert reactivate_res.json()["success"] is True
    assert reactivate_res.json()["status"] == "ACTIVE"
