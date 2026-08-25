from fastapi.testclient import TestClient
import pytest

from app.core.config import settings
from app.models.product import Product
from app.models.plan import Plan
from app.models.release import Release
from tests.conftest import TestSessionLocal


@pytest.mark.asyncio
async def test_get_customer_licenses_and_orders(client: TestClient) -> None:
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

    # 2. Register & Login Customer
    client.post(
        "/api/v1/auth/register",
        json={"email": "customer@example.com", "password": "Password123!"},
    )
    login_res = client.post(
        "/api/v1/auth/jwt/login",
        data={"username": "customer@example.com", "password": "Password123!"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create Order
    order_res = client.post(
        "/api/v1/orders",
        headers=headers,
        json={"plan_id": plan_id},
    )
    order_data = order_res.json()
    order_code = order_data["order_code"]

    # 4. Pay via Webhook
    client.post(
        "/api/v1/payments/webhook",
        headers={"Authorization": f"Apikey {settings.sepay_api_key}"},
        json={
            "gateway": "MBBank",
            "amountIn": 1200000,
            "transactionContent": order_code,
            "referenceNumber": "MB_FT_123456",
        },
    )

    # 5. GET /api/v1/account/licenses
    licenses_res = client.get("/api/v1/account/licenses", headers=headers)
    assert licenses_res.status_code == 200
    licenses_data = licenses_res.json()
    assert len(licenses_data) == 1
    assert licenses_data[0]["license_key"].startswith("BP7X-")
    assert licenses_data[0]["plan"]["name"] == "6 Months"

    # 6. GET /api/v1/account/orders
    orders_res = client.get("/api/v1/account/orders", headers=headers)
    assert orders_res.status_code == 200
    orders_data = orders_res.json()
    assert len(orders_data) == 1
    assert orders_data[0]["order_code"] == order_code
    assert orders_data[0]["status"] == "PAID"


@pytest.mark.asyncio
async def test_get_latest_release(client: TestClient) -> None:
    # 1. Seed active Release in DB
    async with TestSessionLocal() as session:
        release = Release(
            version="1.0.0",
            download_url="https://bimpilot.com/downloads/BIMPilot_v1.0.0.exe",
            release_notes="Initial MVP Release",
            minimum_revit_version=2021,
            maximum_revit_version=2026,
            is_active=True,
        )
        session.add(release)
        await session.commit()

    # 2. Download metadata is available only to an authenticated user.
    assert client.get("/api/v1/download/latest").status_code == 401
    client.post("/api/v1/auth/register", json={"email": "download@example.com", "password": "strongpassword123"})
    login = client.post("/api/v1/auth/jwt/login", data={"username": "download@example.com", "password": "strongpassword123"})
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    res = client.get("/api/v1/download/latest", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["version"] == "1.0.0"
    assert "BIMPilot_v1.0.0.exe" in data["download_url"]
    assert data["minimum_revit_version"] == 2021


@pytest.mark.asyncio
async def test_trial_registration_flow(client: TestClient) -> None:
    client.post("/api/v1/auth/register", json={"email": "engineer_trial@example.com", "password": "strongpassword123"})
    login = client.post("/api/v1/auth/jwt/login", data={"username": "engineer_trial@example.com", "password": "strongpassword123"})
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    # Initial status -> not trial registered
    status_res = client.get("/api/v1/account/trial-status", headers=headers)
    assert status_res.status_code == 200
    assert status_res.json()["isTrialRegistered"] is False

    # Submit Trial Onboarding Form (Personal Engineer info)
    reg_res = client.post(
        "/api/v1/account/trial-register",
        headers=headers,
        json={
            "name": "Nguyễn Văn Kỹ Sư",
            "phone": "0987654321",
            "job_title": "Kỹ sư Kết cấu (Structural Engineer)",
            "revit_version": "2025",
            "use_case": "Bố trí cốt thép tự động",
            "terms_accepted": True,
        },
    )
    assert reg_res.status_code == 200
    assert reg_res.json()["is_trial_registered"] is True

    # Check updated status
    status_after = client.get("/api/v1/account/trial-status", headers=headers)
    assert status_after.status_code == 200
    data = status_after.json()
    assert data["isTrialRegistered"] is True
    assert data["name"] == "Nguyễn Văn Kỹ Sư"
    assert data["phone"] == "0987654321"
    assert data["jobTitle"] == "Kỹ sư Kết cấu (Structural Engineer)"
    assert data["revitVersion"] == "2025"
