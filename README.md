# BIMAutomation (BIMPilot)

Nền tảng website bán và quản lý bản quyền cho **Add-in BIM/Revit** — cho phép khách hàng xem tính năng, bảng giá, thanh toán qua VietQR/SePay, tự động nhận License, và kích hoạt Add-in trên Revit. Có kèm hệ thống Admin để quản lý khách hàng, đơn hàng, thanh toán, license và doanh thu.

> Luồng lõi của MVP: **Khách hàng → Chọn gói → Thanh toán → Nhận License → Kích hoạt Add-in.**

---

## 1. Kiến trúc tổng quan

Dự án gồm 2 phần chạy độc lập, giao tiếp qua REST API:

```text
BIMPilot_Project/
├── backend/          # FastAPI (Python) — API, database, xử lý thanh toán, license
├── frontend/         # React + Vite — giao diện web (public / account / admin)
├── docker-compose.yml
├── .env               # Biến môi trường dùng chung khi chạy bằng Docker Compose
└── .env.example
```

### Tech stack thực tế

| Thành phần | Công nghệ |
|---|---|
| Backend | FastAPI, SQLAlchemy (async), aiosqlite, fastapi-users (auth + OAuth) |
| Database | SQLite (file `app.db`, có thể đổi qua `DATABASE_URL`) |
| Frontend | React 18, Vite, React Router, TanStack Query, Zustand, Tailwind CSS |
| Xác thực | Email/Password + Google OAuth |
| Thanh toán | VietQR (chuyển khoản ngân hàng) + Webhook SePay |
| Triển khai | Docker Compose (2 container: `backend`, `frontend` + Nginx) |

> Ghi chú: tài liệu đặc tả sản phẩm ban đầu ([BIMPilot MVP — Product Scope v1.0.md](backend/BIMPilot%20MVP%20—%20Product%20Scope%20v1.0.md)) đề xuất Next.js/PostgreSQL/Supabase, nhưng bản triển khai thực tế dùng FastAPI + React + SQLite như mô tả ở trên.

---

## 2. Chức năng chính

### Khách truy cập (chưa đăng nhập)
- Xem trang chủ, tính năng, bảng giá, hướng dẫn, giới thiệu.
- Gửi góp ý (`/feedback`).
- Đăng ký / đăng nhập (email hoặc Google).

### Khách hàng (đã đăng nhập) — `/account`
- Xem license đã mua, ngày kích hoạt/hết hạn, copy License Key.
- Tải Add-in, xem lịch sử đơn hàng, gia hạn bản quyền.

### Admin — `/admin`
- Dashboard doanh thu, đơn hàng, license.
- Quản lý khách hàng, đơn hàng, thanh toán, license (reset thiết bị, gia hạn, khóa, thu hồi).
- Quản lý góp ý và phiên bản phát hành (releases).

---

## 3. Luồng mua hàng & cấp License

```text
Chọn gói (Pricing)
   ↓
Tạo Order  →  POST /api/v1/orders
   ↓
Hiển thị QR thanh toán  →  GET /api/v1/orders/{order_id}/qr
   ↓
SePay gửi Webhook xác nhận thanh toán  →  POST /api/v1/payments/webhook
   ↓
Order chuyển trạng thái: PENDING → PAID
   ↓
Hệ thống tự động sinh License Key (vd: BP7X-XXXX-XXXX-XXXX)
   ↓
Khách hàng kích hoạt Add-in bằng License Key + Device ID
```

Webhook SePay được xác thực qua header:
```text
Authorization: Apikey <SEPAY_API_KEY>
```

---

## 4. Cấu trúc mã nguồn

### Backend (`backend/app`)
```text
app/
├── api/v1/endpoints/   # auth, users, plans, orders, payments, licenses,
│                       # account, admin, download, feedback, public, health
├── core/               # Settings, logging, security, exception handling
├── db/                 # Async SQLAlchemy session/engine
├── models/             # User, Product, Plan, Order, Payment, License, Feedback, Release, OAuth
├── repositories/        # Data-access layer theo từng model
├── schemas/             # Pydantic request/response contracts
├── services/             # Business logic (CheckoutService, LicenseService, ...)
└── main.py               # FastAPI entrypoint
```

### Frontend (`frontend/src`)
```text
src/
├── api/            # axios client + services gọi API backend
├── store/          # Zustand store (auth, ...)
├── layouts/        # PublicLayout, CustomerLayout, AdminLayout
├── pages/
│   ├── public/     # Home, Features, Pricing, Tutorials, About, Feedback, Download,
│   │               # Login, Register, ForgotPassword, ResetPassword, GoogleCallback
│   ├── customer/   # AccountDashboard, Licenses, Orders, Profile
│   └── admin/      # AdminDashboard, Customers, Orders, Payments, Licenses,
│                   # Revenue, Feedback, Releases
└── components/     # Component dùng chung (AccessibleDialog, BrandLogo, ...)
```

---

## 5. Chạy dự án

### Cách 1 — Docker Compose (khuyến nghị, giống production)

```bash
cp .env.example .env   # điền các giá trị thật (SECRET_KEY, Google OAuth, SePay, ngân hàng...)
docker compose up --build
```

- Frontend: `http://localhost:${FRONTEND_PORT:-80}`
- Backend API: `http://localhost:${PORT:-8000}`
- Dữ liệu SQLite được lưu ở Docker volume `backend_data` (không mất khi rebuild container).

### Cách 2 — Chạy riêng từng phần (dev)

**Backend:**
```bash
cd backend
source .venv/bin/activate      # hoặc tạo venv mới: python -m venv .venv
pip install -e ".[dev]"
cp .env.example .env           # chỉnh sửa theo môi trường dev
python -m uvicorn app.main:app --reload --port 8000
```
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 6. Biến môi trường quan trọng (`.env`)

| Nhóm | Biến | Mô tả |
|---|---|---|
| App | `APP_NAME`, `ENVIRONMENT`, `DEBUG`, `PORT`, `HOST`, `SECRET_KEY` | Cấu hình chung & khóa bảo mật |
| Database | `DATABASE_URL` | Chuỗi kết nối SQLAlchemy (mặc định SQLite) |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | Đăng nhập bằng Google |
| Email | `FRONTEND_RESET_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_SENDER`, `SMTP_USE_TLS` | Gửi email reset mật khẩu |
| Thanh toán | `SEPAY_CLIENT_ID`, `SEPAY_CLIENT_SECRET`, `SEPAY_API_KEY`, `VIETQR_TEMPLATE` | Xác thực webhook & tạo mã QR |
| Ngân hàng | `BANK_CODE`, `BANK_ACCOUNT`, `BANK_HOLDER` | Thông tin hiển thị trên QR chuyển khoản |
| Frontend | `FRONTEND_PORT` | Cổng phục vụ frontend khi chạy Docker |

> **Không commit file `.env` thật lên git** — chỉ dùng `.env.example` làm mẫu tham khảo.

---

## 7. Kiểm thử

**Backend** (17 test integration/unit với pytest):
```bash
cd backend
PYTHONPATH=. pytest
```

**Frontend** (Vitest + Testing Library):
```bash
cd frontend
npm run test
```

---

## 8. Mô hình dữ liệu (rút gọn)

```text
users        → id, name, email, phone, password_hash, role (USER/ADMIN)
products     → id, name, slug, description, is_active
plans        → id, product_id, name, duration_months, price
orders       → id, order_code, user_id, plan_id, amount, status (PENDING/PAID/CANCELLED/FAILED)
payments     → id, order_id, provider, transaction_id, amount, status, raw_payload
licenses     → id, license_key, user_id, order_id, plan_id, device_id,
               status (PENDING/ACTIVE/EXPIRED/SUSPENDED/REVOKED), activated_at, expires_at
feedback     → id, user_id, name, email, type, title, content, status
releases     → id, version, download_url, release_notes, min/max_revit_version, is_active
```

---

## 9. API kích hoạt & kiểm tra License (dùng bởi Add-in Revit)

**Kích hoạt:**
```http
POST /api/licenses/activate
{ "licenseKey": "BP7X-82DK-P9L2-6QAW", "deviceId": "DEVICE-FINGERPRINT-001" }
```

**Kiểm tra (Add-in gọi định kỳ, ví dụ 1 lần/24h):**
```http
POST /api/licenses/verify
{ "licenseKey": "BP7X-82DK-P9L2-6QAW", "deviceId": "DEVICE-FINGERPRINT-001" }
```

---

## 10. Tài liệu liên quan

- [backend/README.md](backend/README.md) — hướng dẫn chi tiết chạy backend, luồng webhook SePay/VietQR.
- [backend/BIMPilot MVP — Product Scope v1.0.md](backend/BIMPilot%20MVP%20—%20Product%20Scope%20v1.0.md) — đặc tả sản phẩm đầy đủ (sitemap, UI, bảo mật, kế hoạch triển khai 2 tuần, tiêu chí hoàn thành MVP).

---

## 11. Yêu cầu bảo mật tối thiểu (theo Product Scope)

- Hash mật khẩu, không lưu plain text.
- HTTPS + JWT/session bảo mật.
- Kiểm tra quyền (role) ở cả frontend lẫn backend, không chỉ ẩn menu Admin.
- Xác thực chữ ký (signature) của webhook thanh toán.
- Rate limit cho License API.
- Validate Device ID khi kích hoạt license.
- Audit log cho thao tác revoke/reset license.
