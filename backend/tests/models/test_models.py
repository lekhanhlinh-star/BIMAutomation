import pytest
from sqlalchemy import select

from app.models.feedback import Feedback, FeedbackStatus, FeedbackType
from app.models.license import License, LicenseStatus
from app.models.order import Order, OrderStatus
from app.models.payment import Payment
from app.models.plan import Plan
from app.models.product import Product
from app.models.release import Release
from app.models.user import User, UserRole
from tests.conftest import TestSessionLocal


@pytest.mark.asyncio
async def test_create_product_and_plans() -> None:
    async with TestSessionLocal() as session:
        # Create Product
        product = Product(
            name="BIMPilot",
            slug="bimpilot",
            description="Revit Add-in Suite",
        )
        session.add(product)
        await session.flush()

        # Create Plans
        plan_3m = Plan(
            product_id=product.id,
            name="3 Months",
            duration_months=3,
            price=600000,
        )
        plan_6m = Plan(
            product_id=product.id,
            name="6 Months",
            duration_months=6,
            price=1200000,
        )
        session.add_all([plan_3m, plan_6m])
        await session.commit()

        # Query Product and check plans
        result = await session.execute(
            select(Product).where(Product.slug == "bimpilot")
        )
        fetched_product = result.scalar_one()
        assert fetched_product.name == "BIMPilot"

        result_plans = await session.execute(
            select(Plan).where(Plan.product_id == fetched_product.id)
        )
        plans = result_plans.scalars().all()
        assert len(plans) == 2


@pytest.mark.asyncio
async def test_create_order_payment_license() -> None:
    async with TestSessionLocal() as session:
        # User
        user = User(
            email="buyer@example.com",
            hashed_password="hashed_secret",
            role=UserRole.USER,
        )
        # Product & Plan
        product = Product(name="BIMPilot", slug="bimpilot-suite")
        session.add_all([user, product])
        await session.flush()

        plan = Plan(
            product_id=product.id,
            name="6 Months",
            duration_months=6,
            price=1200000,
        )
        session.add(plan)
        await session.flush()

        # Order
        order = Order(
            order_code="BP-20260813-0001",
            user_id=user.id,
            plan_id=plan.id,
            amount=1200000,
            status=OrderStatus.PENDING,
        )
        session.add(order)
        await session.flush()

        # Payment
        payment = Payment(
            order_id=order.id,
            provider="QR_BANK",
            transaction_id="TXN123456",
            amount=1200000,
            status="PAID",
        )
        session.add(payment)

        # License
        license_obj = License(
            license_key="BP7X-82DK-P9L2-6QAW",
            user_id=user.id,
            order_id=order.id,
            plan_id=plan.id,
            status=LicenseStatus.PENDING,
        )
        session.add(license_obj)
        await session.commit()

        # Verify
        result_order = await session.execute(
            select(Order).where(Order.order_code == "BP-20260813-0001")
        )
        fetched_order = result_order.scalar_one()
        assert fetched_order.amount == 1200000

        result_lic = await session.execute(
            select(License).where(License.license_key == "BP7X-82DK-P9L2-6QAW")
        )
        fetched_lic = result_lic.scalar_one()
        assert fetched_lic.status == LicenseStatus.PENDING


@pytest.mark.asyncio
async def test_create_feedback_and_release() -> None:
    async with TestSessionLocal() as session:
        feedback = Feedback(
            name="Nguyen Van A",
            email="a@example.com",
            type=FeedbackType.FEATURE,
            title="Auto Rename Tool",
            content="Please add prefix option",
            status=FeedbackStatus.NEW,
        )

        release = Release(
            version="1.0.0",
            download_url="https://downloads.bimpilot.com/v1.0.0.msi",
            minimum_revit_version=2023,
            maximum_revit_version=2026,
        )

        session.add_all([feedback, release])
        await session.commit()

        res_fb = await session.execute(
            select(Feedback).where(Feedback.email == "a@example.com")
        )
        fetched_fb = res_fb.scalar_one()
        assert fetched_fb.type == FeedbackType.FEATURE

        res_rel = await session.execute(
            select(Release).where(Release.version == "1.0.0")
        )
        fetched_rel = res_rel.scalar_one()
        assert fetched_rel.minimum_revit_version == 2023
