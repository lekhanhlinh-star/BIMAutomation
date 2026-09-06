# Pytest Asyncio & FastAPI Testing Standards

## 1. Pytest Async Configuration (`conftest.py`)

```python
# tests/conftest.py
import pytest
from collections.abc import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.main import app
from app.db.base import Base
from app.db.session import get_async_session

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    maker = async_sessionmaker(test_engine, expire_on_commit=False)
    async with maker() as session:
        yield session

@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    # Override database session dependency
    app.dependency_overrides[get_async_session] = lambda: db_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
```

---

## 2. Authentication Mocking Fixture

```python
# tests/fixtures/auth.py
import pytest
from app.core.dependencies import get_current_user
from app.main import app
from app.models.user import User, UserRole

@pytest.fixture
def mock_user() -> User:
    return User(
        id="usr_test_123",
        email="tester@example.com",
        full_name="Test User",
        role=UserRole.USER,
        is_active=True,
    )

@pytest.fixture
def authenticated_client(client, mock_user: User):
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield client
    app.dependency_overrides.pop(get_current_user, None)
```

---

## 3. Writing Endpoint Integration Tests

```python
# tests/api/test_items.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_item_success(authenticated_client: AsyncClient):
    payload = {
        "title": "Ergonomic Keyboard",
        "description": "Mechanical split keyboard",
        "price": 149.99,
    }
    response = await authenticated_client.post("/api/v1/items/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["title"] == "Ergonomic Keyboard"
    assert "id" in data["data"]

@pytest.mark.asyncio
async def test_create_item_unauthorized(client: AsyncClient):
    payload = {"title": "Keyboard", "price": 100.0}
    response = await client.post("/api/v1/items/", json=payload)
    assert response.status_code == 401
```
