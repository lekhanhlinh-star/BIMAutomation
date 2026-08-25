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

            rel_res = await db.execute(select(Release).order_by(Release.released_at.desc()))
            release = rel_res.scalar_one_or_none()
            sample_packages = [
                {
                    "revit_version": 2022,
                    "url": "https://downloads.bimautomation.solutions/release/BIMAutomation_R22_v1.0.1.zip",
                    "sha256": "A1B2C3D4E5F60718293A4B5C6D7E8F90123456789ABCDEF0123456789ABCDEF0",
                    "file_size_bytes": 5621400,
                },
                {
                    "revit_version": 2023,
                    "url": "https://downloads.bimautomation.solutions/release/BIMAutomation_R23_v1.0.1.zip",
                    "sha256": "B2C3D4E5F6A70819203B4C5D6E7F80123456789ABCDEF0123456789ABCDEF01",
                    "file_size_bytes": 5648900,
                },
                {
                    "revit_version": 2024,
                    "url": "https://downloads.bimautomation.solutions/release/BIMAutomation_R24_v1.0.1.zip",
                    "sha256": "C3D4E5F6A7B80910213C4D5E6F70123456789ABCDEF0123456789ABCDEF012",
                    "file_size_bytes": 5689100,
                },
                {
                    "revit_version": 2025,
                    "url": "https://downloads.bimautomation.solutions/release/BIMAutomation_R25_v1.0.1.zip",
                    "sha256": "5857951FA628D8A0E4F982637DCEB72A1F524A456C93FBEF8B923B0F76A0350B",
                    "file_size_bytes": 5704044,
                },
                {
                    "revit_version": 2026,
                    "url": "https://downloads.bimautomation.solutions/release/BIMAutomation_R26_v1.0.1.zip",
                    "sha256": "D4E5F6A7B8C91021324D5E6F70123456789ABCDEF0123456789ABCDEF0123",
                    "file_size_bytes": 5732100,
                },
            ]
            if not release:
                logger.info("Seeding initial Release...")
                rel = Release(
                    version="v1.0.1",
                    download_url="https://downloads.bimautomation.solutions/release/BIMAutomation_v1.0.1_Setup.exe",
                    sha256_hash="F55BD5EA48F825DF51B5A96A000A17537F51E5C1B258AE0D235F88EEAE9B6631",
                    release_notes="Bản phát hành chính thức BIMAutomation Suite với hỗ trợ cập nhật tại chỗ.",
                    file_size_label="71.4 MB",
                    minimum_revit_version=2022,
                    maximum_revit_version=2027,
                    is_active=True,
                    packages=sample_packages,
                )
                db.add(rel)
            elif not release.packages:
                release.packages = sample_packages
                release.version = "v1.0.1"
                release.download_url = "https://downloads.bimautomation.solutions/release/BIMAutomation_v1.0.1_Setup.exe"
                release.sha256_hash = "F55BD5EA48F825DF51B5A96A000A17537F51E5C1B258AE0D235F88EEAE9B6631"
                release.file_size_label = "71.4 MB"
                release.minimum_revit_version = 2022
                release.maximum_revit_version = 2027

            # Seed Admin Accounts
            from app.models.user import User, UserRole, UserStatus
            from fastapi_users.password import PasswordHelper
            from datetime import datetime, timezone
            import uuid

            admin_emails = ["linhld.cs@gmail.com"]
            for admin_email in admin_emails:
                user_res = await db.execute(select(User).where(User.email == admin_email))
                admin_user = user_res.scalar_one_or_none()
                if admin_user:
                    if admin_user.role != UserRole.ADMIN or not admin_user.is_superuser:
                        admin_user.role = UserRole.ADMIN
                        admin_user.is_superuser = True
                        admin_user.is_verified = True
                        admin_user.is_active = True
                        admin_user.status = UserStatus.ACTIVE
                        logger.info(f"Updated user {admin_email} to ADMIN role.")
                else:
                    logger.info(f"Seeding default Admin user {admin_email}...")
                    helper = PasswordHelper()
                    pwd_hash = helper.hash("Admin@123456")
                    admin_user = User(
                        id=uuid.uuid4(),
                        email=admin_email,
                        hashed_password=pwd_hash,
                        is_active=True,
                        is_superuser=True,
                        is_verified=True,
                        role=UserRole.ADMIN,
                        status=UserStatus.ACTIVE,
                        name="Lê Khánh Linh",
                        created_at=datetime.now(timezone.utc),
                        updated_at=datetime.now(timezone.utc),
                    )
                    db.add(admin_user)

            await db.commit()
            logger.info("Initial data seeded successfully.")
        except Exception as e:
            logger.error(f"Error seeding database: {e}")
            await db.rollback()
