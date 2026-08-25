from fastapi.testclient import TestClient
import re

import pytest
from sqlalchemy import select

from app.core.config import settings
from app.models.license import License, LicenseStatus
from app.models.order import Order, OrderStatus
from app.models.payment import Payment
from app.models.plan import Plan
from app.models.product import Product
from tests.conftest import TestSessionLocal


@pytest.mark.asyncio
async def test_plans_orders_qr_and_webhook_flow(client: TestClient) -> None:
    # 1. Seed Product & Plan in DB
    async with TestSessionLocal() as session:
        product = Product(name="BIMPilot", slug="bimpilot-pro")
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

    # 2. Test GET /api/v1/plans (Public)
    plans_res = client.get("/api/v1/plans")
    assert plans_res.status_code == 200
    plans_data = plans_res.json()
    assert len(plans_data) == 1
    assert plans_data[0]["name"] == "6 Months"
    assert plans_data[0]["price"] == 1200000

    # 3. Register & Login User
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "checkout_user@example.com",
            "password": "mypassword123",
        },
    )

    login_res = client.post(
        "/api/v1/auth/jwt/login",
        data={
            "username": "checkout_user@example.com",
            "password": "mypassword123",
        },
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Test POST /api/v1/orders (Create Order)
    order_res = client.post(
        "/api/v1/orders",
        headers=headers,
        json={"plan_id": plan_id},
    )
    assert order_res.status_code == 201
    order_data = order_res.json()
    assert "id" in order_data
    assert order_data["status"] == "PENDING"
    assert order_data["amount"] == 1200000
    assert re.fullmatch(r"BA\d{10}", order_data["order_code"])
    order_id = order_data["id"]
    order_code = order_data["order_code"]

    # 5. Test GET /api/v1/orders/{order_id}/qr
    qr_res = client.get(
        f"/api/v1/orders/{order_id}/qr",
        headers=headers,
    )
    assert qr_res.status_code == 200
    qr_data = qr_res.json()
    assert qr_data["order_code"] == order_code
    assert qr_data["payment_content"] == f"BIMPILOT {order_code}"
    assert "img.vietqr.io" in qr_data["qr_code_url"]

    # 6. Test POST /api/v1/payments/webhook (SePay Payment confirmation)
    sepay_header = {"Authorization": f"Apikey {settings.sepay_api_key}"}
    
    # Attempt without header -> Expect 401 Unauthorized
    unauth_res = client.post(
        "/api/v1/payments/webhook",
        json={"transactionContent": f"BIMPILOT {order_code}", "amountIn": 1200000},
    )
    assert unauth_res.status_code == 401

    # Valid SePay Webhook request
    webhook_res = client.post(
        "/api/v1/payments/webhook",
        headers=sepay_header,
        json={
            "id": 92704,
            "gateway": "MBBank",
            "code": order_code,
            "content": f"BIMPILOT {order_code}",
            "transferType": "in",
            "transferAmount": 1200000,
            "referenceCode": "MB_SEPAY_998877",
        },
    )
    assert webhook_res.status_code == 200
    webhook_data = webhook_res.json()
    assert webhook_data == {"success": True}

    # 7. Verify DB state: Order = PAID, Payment record exists, License auto-generated
    async with TestSessionLocal() as session:
        # Check Order
        res_order = await session.execute(
            select(Order).where(Order.order_code == order_code)
        )
        db_order = res_order.scalar_one()
        assert db_order.status == OrderStatus.PAID

        # Check Payment
        res_payment = await session.execute(
            select(Payment).where(Payment.order_id == db_order.id)
        )
        db_payment = res_payment.scalar_one()
        assert db_payment.transaction_id == "MB_SEPAY_998877"

        # Check License auto-generation
        res_license = await session.execute(
            select(License).where(License.order_id == db_order.id)
        )
        db_license = res_license.scalar_one()
        assert db_license.license_key.startswith("BP7X-")
        assert db_license.status == LicenseStatus.ACTIVE
        assert db_license.starts_at is not None
        assert db_license.expires_at is not None
