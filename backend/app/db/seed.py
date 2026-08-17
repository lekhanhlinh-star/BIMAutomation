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
                logger.info("Seeding initial Product and Plans...")
                product = Product(
                    name="BIMAutomation Revit Add-in",
                    slug="bimautomation-revit",
                    description="Bộ công cụ tự động hóa Revit BIM hàng đầu",
                    is_active=True
                )
                db.add(product)
                await db.flush()

                p1 = Plan(
                    product_id=product.id,
                    name="Gói Tháng (Monthly)",
                    duration_months=1,
                    price=290000,
                    is_active=True
                )
                p2 = Plan(
                    product_id=product.id,
                    name="Gói Năm (Pro Annual)",
                    duration_months=12,
                    price=2490000,
                    is_active=True
                )
                p3 = Plan(
                    product_id=product.id,
                    name="Gói Vĩnh Viễn (Enterprise)",
                    duration_months=120,
                    price=6900000,
                    is_active=True
                )
                db.add_all([p1, p2, p3])

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
