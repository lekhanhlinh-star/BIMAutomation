# BIMAutomation Backend API

FastAPI backend application for **BIMAutomation MVP** — providing product subscriptions, VietQR / SePay automated payment webhooks, and Revit Add-in license management.

---

## 🚀 Quick Start & Running Server

### 1. Active Virtual Environment & Setup

```bash
cd backend
source .venv/bin/activate
pip install -e ".[dev]"
```

### 2. Configure Environment (`.env`)

Copy `.env.example` to `.env` and fill in your settings:
```bash
cp .env.example .env
```

Example `.env` settings:
```env
APP_NAME="BIMAutomation Backend"
ENVIRONMENT="development"
DEBUG=True
PORT=8000
HOST="0.0.0.0"
SECRET_KEY="CHANGE_THIS_SECRET_KEY_FOR_PRODUCTION_MIN_32_CHARS"
DATABASE_URL="sqlite+aiosqlite:///./app.db"

# MBBank / VietQR Config
BANK_CODE=MB
BANK_ACCOUNT=0381000123456
BANK_HOLDER="CONG TY BIMAUTOMATION"

# SePay Webhook Config
SEPAY_API_KEY=BIMAUTOMATIONADDINANDMCP
```

---

### 3. Run Development Server

Run with `uvicorn`:
```bash
python -m uvicorn app.main:app --reload --port 8000
```

*(If port 8000 is occupied by another service, run on port 8001)*:
```bash
python -m uvicorn app.main:app --reload --port 8001
```

---

## 📚 API Documentation

Once the server is running, access the interactive API docs:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 💳 SePay & VietQR Webhook Flow

1. **Order Creation**: Client calls `POST /api/v1/orders` to create a `PENDING` order (`BP-YYYYMMDD-XXXX`).
2. **VietQR Display**: Client calls `GET /api/v1/orders/{order_id}/qr` to get VietQR MBBank image URL.
3. **SePay Webhook Security**: SePay sends HTTP POST to `/api/v1/payments/webhook` with header:
   ```text
   Authorization: Apikey YOUR_SEPAY_API_KEY
   ```
4. **Auto License Generation**: On successful webhook authentication, Order transitions to `PAID` and a new License Key (`BP7X-XXXX-XXXX-XXXX`) is automatically issued.

---

## 🧪 Testing

Run all 17 automated unit and integration tests with pytest:
```bash
PYTHONPATH=. pytest
```

---

## 📁 Project Structure

```text
backend/
├── app/
│   ├── api/          # HTTP Routers, Versioning (v1), and Dependencies
│   │   └── v1/
│   │       └── endpoints/ # Admin, Auth, Users, Plans, Orders, Payments, Licenses
│   ├── core/         # Settings, Logging, Security, and Exceptions
│   ├── db/           # Async SQLAlchemy database setup and sessions
│   ├── models/       # Database ORM models (User, Product, Plan, Order, Payment, License, etc.)
│   ├── schemas/      # Pydantic contracts and request/response validation
│   ├── services/     # Core Business Logic (CheckoutService, LicenseService)
│   └── main.py       # FastAPI App entry point and lifecycle hooks
├── tests/            # Integration & Unit test suite
├── pyproject.toml    # Project dependencies and configuration
└── .env.example      # Example environment configuration
```

