import logging
from sqlalchemy import select
from app.db.session import async_session_maker
from app.models.product import Product
from app.models.plan import Plan
from app.models.release import Release

logger = logging.getLogger("bimautomation.seed")

async def seed_initial_data():
    async with async_session_maker() as db:
        try:
            prod_res = await db.execute(select(Product))
            product = prod_res.scalar_one_or_none()
            if not product:
                logger.info("Seeding initial Product...")
                product = Product(
                    name="BIMAutomation Revit Add-in",
                    code="revitapp",
                    slug="bimautomation-revit",
                    description="Bộ công cụ tự động hóa Revit BIM hàng đầu",
                    is_active=True
                )
                db.add(product)
                await db.flush()

            plans_res = await db.execute(select(Plan).where(Plan.product_id == product.id))
            plans_by_duration = {plan.duration_months: plan for plan in plans_res.scalars().all()}
            personal_plans = [
                (1, "Gói Cá nhân Tháng (Monthly)", 250000),
                (12, "Gói Cá nhân Năm (Annual)", 2500000),
            ]
            for duration_months, name, price in personal_plans:
                plan = plans_by_duration.get(duration_months)
                if plan:
                    plan.name = name
                    plan.price = price
                    plan.is_active = True
                else:
                    db.add(Plan(
                        product_id=product.id,
                        name=name,
                        duration_months=duration_months,
                        price=price,
                        is_active=True,
                    ))

            rel_res = await db.execute(select(Release))
            release = rel_res.scalar_one_or_none()
            if not release:
                logger.info("Seeding initial Release...")
                rel = Release(
                    version="v2.4.1",
                    download_url="/downloads/BIMAutomation_v2.4.1_Setup.exe",
                    release_notes="Tối ưu tốc độ Auto Dimension, tương thích Revit 2025.",
                    minimum_revit_version=2021,
                    maximum_revit_version=2025,
                    is_active=True
                )
                db.add(rel)

            await db.commit()
            logger.info("Initial data seeded successfully.")
        except Exception as e:
            logger.error(f"Error seeding database: {e}")
            await db.rollback()
