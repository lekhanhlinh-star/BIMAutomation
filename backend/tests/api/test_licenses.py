from fastapi.testclient import TestClient
import pytest

from app.models.license import License, LicenseStatus
from app.models.order import Order, OrderStatus
from app.models.plan import Plan
from app.models.product import Product
from app.models.user import User, UserRole
from tests.conftest import TestSessionLocal


@pytest.mark.asyncio
async def test_license_activation_and_verification_flow(client: TestClient) -> None:
    # 1. Seed User, Product, Plan, Order, License in DB
    async with TestSessionLocal() as session:
        user = User(email="license_user@example.com", hashed_password="pw", role=UserRole.USER)
        product = Product(name="BIMPilot", slug="bimpilot-addon")
        session.add_all([user, product])
        await session.flush()

        plan = Plan(product_id=product.id, name="6 Months", duration_months=6, price=1200000)
        session.add(plan)
        await session.flush()

        order = Order(order_code="BP-20260813-9999", user_id=user.id, plan_id=plan.id, amount=1200000, status=OrderStatus.PAID)
        session.add(order)
        await session.flush()

        license_key = "BP7X-TEST-KEY1-9999"
        license_obj = License(
            license_key=license_key,
            user_id=user.id,
            order_id=order.id,
            plan_id=plan.id,
            status=LicenseStatus.PENDING,
        )
        session.add(license_obj)
        await session.commit()

    device_id_pc1 = "PC-WORKSTATION-001"
    device_id_pc2 = "PC-LAPTOP-002"

    # 2. Activate License on PC1
    act_res = client.post(
        "/api/v1/licenses/activate",
        json={"licenseKey": license_key, "deviceId": device_id_pc1},
    )
    assert act_res.status_code == 200
    act_data = act_res.json()
    assert act_data["success"] is True
    assert act_data["status"] == "ACTIVE"
    assert act_data["expiresAt"] is not None

    # 3. Attempt Activation on PC2 (Different device) -> Expect 400 Bad Request
    act_fail_res = client.post(
        "/api/v1/licenses/activate",
        json={"licenseKey": license_key, "deviceId": device_id_pc2},
    )
    assert act_fail_res.status_code == 400
    assert "registered to another device" in act_fail_res.json()["detail"]

    # 4. Verify License on PC1 -> Expect valid: True, status: ACTIVE
    verify_res = client.post(
        "/api/v1/licenses/verify",
        json={"licenseKey": license_key, "deviceId": device_id_pc1},
    )
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["valid"] is True
    assert verify_data["status"] == "ACTIVE"

    # 5. Verify License on PC2 -> Expect valid: False
    verify_pc2_res = client.post(
        "/api/v1/licenses/verify",
        json={"licenseKey": license_key, "deviceId": device_id_pc2},
    )
    assert verify_pc2_res.status_code == 200
    assert verify_pc2_res.json()["valid"] is False
