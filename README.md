# RevitAPP — Nền Tảng Tự Động Hóa BIM & AI Vẽ Cốt Thép Thông Minh

> **Khẩu hiệu cốt lõi (USP):** *"Gõ một câu. Revit tự vẽ xong hệ thép."*  
> Trợ lý AI và hệ thống **57 công cụ chuẩn MCP** kết nối trực tiếp vào Autodesk Revit (2022–2027). Tự động đọc bảng tính Excel, áp dụng preset thiết kế, mô hình hóa cốt thép 3D hoàn chỉnh và tự động triển khai bản vẽ lên Sheet — kèm cơ chế xem trước và xác nhận an toàn trước khi thay đổi mô hình.

---

## 1. Điểm Bán Hàng Độc Nhất (USP) & Tính Năng Nổi Bật

1. **5 Công Cụ AI Vẽ Thép Cốt Lõi:**
   - **Cột (`CR`):** Thép chủ, đai bao, đai lồng, đai C chống phình, nối thép so le 50% qua tầng theo TCVN 5574:2018.
   - **Dầm (`BR`):** Đọc bảng thép Excel hoặc Preset, dầm liên tục đa nhịp, thép gối $L/3$, thép nhịp $L/2$, đai gia cường $a100$.
   - **Móng (`FR`):** Móng đơn, móng băng, móng bè, lưới thép đáy/trên, chân chó Bar Chair $\Phi 12/\Phi 14$, đai bo đài.
   - **Vách (`WR`):** Lưới thép 2 lớp đứng/ngang, đai C, cột biên ẩn đầu vách, gia cường mép lỗ mở cửa.
   - **Sàn (`SR`):** Thép sàn 2 lớp, thép mũ gối trên đỉnh dầm, gia cường góc $45^\circ$ lỗ mở hộp gen.
2. **Chuỗi Triển Khai Bản Vẽ Liên Tục Lên Sheet (Continuous Sheet Generation Pipeline):**
   - Tự động cắt mặt cắt dọc trục và các mặt cắt ngang gối/nhịp.
   - Tự động tạo Sheet mới, chèn Khung tên Titleblock, dàn trang Viewport thẳng hàng.
   - Tự động gắn Rebar Tag và xuất bảng thống kê uốn thép (Rebar Schedule) chuẩn xác.
3. **Hub 57 MCP Tools Chuẩn Hóa (Spec `2025-11-25`):**
   - Phủ rộng 8 nhóm chức năng: Vẽ thép (12), Đọc mô hình (5), Xử lý Excel (4), Dịch thuật Việt/Trung (2), Thao tác cấu kiện (11), Tag & Khối lượng (5), Điều khiển Ribbon (15), Thực thi C# động an toàn & Tiện ích (3).
   - Tích hợp 1-click với **Claude Desktop** (`claude_desktop_config.json`) và **Cursor IDE** (`.cursor/mcp.json`).
4. **Hệ Thống 18 Lệnh Ribbon Trực Quan Trên Tab `LDL-STRUCTURAL`:**
   - Phân bổ khoa học thành 4 Panels: `Rebar` (5 lệnh), `Drawing Rebar` (5 lệnh), `CAD Tools` (4 lệnh), `Commands` (4 lệnh).
5. **Kiến Trúc An Toàn Tuyệt Đối (Why AI Can Draw Rebar):**
   - Gọi trực tiếp vào Native Engine C# .NET qua hàng đợi `IExternalEventHandler` / `ExternalEvent` luồng đơn (STA).
   - Đóng gói trong `Transaction` độc lập có định danh, tự động `RollBack()` khi gặp xung đột.
   - Hộp thoại xác nhận an toàn trong Revit trước khi commit dữ liệu mô hình.
6. **Bộ Cài Đặt Thông Minh `RevitAPP.Installer.exe` & Kích Hoạt 1-Click Google OAuth PKCE:**
   - 1 installer duy nhất tự động nhận diện Autodesk Revit 2022, 2023, 2024, 2025, 2026, 2027.
   - Kích hoạt không cần nhớ key thông qua Google OAuth 2.0 PKCE và kiểm tra quyền Server-Authoritative (`POST /api/v1/entitlements/check`) tại `https://bimautomation.myminiserver.info`.
   - Dùng thử 14 ngày Full tính năng trên máy mới (Anti-Trial-Abuse qua mã băm SHA-256 phần cứng).

---

## 2. Kiến Trúc Hệ Thống Tổng Thể

Hệ thống bao gồm 3 phân hệ chính giao tiếp đồng bộ:

```text
BIMAutomation / RevitAPP
├── backend/          # FastAPI (Python 3.11+) — Server-Authoritative Licensing, Google OAuth PKCE, Webhook SePay/VietQR
├── frontend/         # React 18 + Vite 6 + Tailwind CSS v4 — Web platform, Interactive Hero Prompt, 57 MCP Tools Hub
├── docs/             # Tài liệu kỹ thuật chi tiết
│   ├── revit_mcp.md  # Đặc tả giao thức MCP Server & Danh bạ 57 Tools
│   └── revit_addin_integration.md # Hướng dẫn tích hợp C# Add-in với OAuth & License
└── installer/        # RevitAPP.Installer.exe — Bộ cài đặt tự động cho Revit 2022-2027
```

### Tech Stack Chi Tiết

| Phân Hệ | Công Nghệ Sử Dụng |
|---|---|
| **Revit Add-in** | C# (.NET Framework 4.8 / .NET 8), Revit API 2022–2027, Roslyn C# Compiler, Loopback HttpListener |
| **MCP Server** | Model Context Protocol (Spec `2025-11-25`), Streamable HTTP tại `http://127.0.0.1:8765/mcp`, Bearer Token 256-bit |
| **Backend API** | Python FastAPI, SQLAlchemy (Async), SQLite / PostgreSQL, Authlib OAuth 2.0 PKCE, Pydantic |
| **Frontend Web** | React 18, Vite 6, Tailwind CSS v4, Zustand, TanStack Query, Lucide Icons |
| **Thanh Toán** | Chuyển khoản VietQR, Webhook SePay tự động kích hoạt license tức thì |
| **Triển Khai** | Docker Compose (Backend, Frontend Nginx) |

---

## 3. Hệ Thống 18 Lệnh Ribbon Trên Tab `LDL-STRUCTURAL`

| Panel | Lệnh Ribbon | Mã Feature Code | Phím Tắt | Mô Tả |
|---|---|---|:---:|---|
| **Rebar** | Column Rebar | `column-rebar` | `CR` | Bố trí thép cột tự động theo TCVN 5574:2018 |
| **Rebar** | Beam Rebar | `beam-rebar` | `BR` | Bố trí thép dầm liên tục từ Excel/Preset |
| **Rebar** | Footing Rebar | `footing-rebar` | `FR` | Bố trí thép móng đơn, móng băng, móng bè |
| **Rebar** | Wall Rebar | `wall-rebar` | `WR` | Bố trí thép vách và gia cường lỗ mở |
| **Rebar** | Slab Rebar | `utility-tools` | `SR` | Bố trí thép sàn 2 lớp và thép mũ gối |
| **Drawing Rebar** | Beam Drawing | `beam-drawing` | `BD` | Tự động tạo Sheet và trích xuất chi tiết dầm |
| **Drawing Rebar** | Footing Drawing | `footing-drawing` | `FD` | Tự động tạo Sheet và mặt cắt chi tiết móng |
| **Drawing Rebar** | Column Drawing | `beam-drawing` | `CD` | Khai triển chi tiết mặt cắt cột các tầng |
| **Drawing Rebar** | Wall Drawing | `beam-drawing` | `WD` | Khai triển mặt bằng và mặt cắt diện vách |
| **Drawing Rebar** | Rebar Schedule & Tag | `utility-tools` | `RS` | Đánh số thanh thép, gắn Tag và xuất bảng uốn |
| **CAD Tools** | Model from CAD | `model-from-cad` | `MC` | Dựng mô hình 3D từ 2D CAD *(Y/c AutoCAD Full 2016+)* |
| **CAD Tools** | DWG Export | `dwg-export` | `DE` | Xuất hồ sơ DWG chuẩn layer *(Y/c AutoCAD Full 2016+)* |
| **CAD Tools** | Link CAD Manager | `model-from-cad` | `LM` | Quản lý và căn chỉnh file CAD liên kết |
| **CAD Tools** | Layer Clean & Map | `model-from-cad` | `LC` | Làm sạch layer rác và ánh xạ layer sang Revit |
| **Commands** | Chat AI Assistant | `chat-ai` | `AI` | Trợ lý AI tích hợp trò chuyện và ra lệnh trực tiếp |
| **Commands** | License & Account | *(Free/Public)* | `LA` | Đăng nhập Google OAuth PKCE và kiểm tra bản quyền |
| **Commands** | Settings & Presets | `utility-tools` | `ST` | Cấu hình tham số, lớp bảo vệ và quản lý preset |
| **Commands** | MCP Server Status | `mcp-read` | `MS` | Quản lý dịch vụ MCP kết nối AI ngoài qua cổng 8765 |

---

## 4. Ma Trận 12 Feature Codes & Phân Bậc 5 Gói Bản Quyền

| Mã Feature Code | Tên Tính Năng | Dùng Thử 14 Ngày | Cốt Thép (Manual) | Cốt Thép + AI | Full Suite | Doanh Nghiệp |
|---|---|:---:|:---:|:---:|:---:|:---:|
| `column-rebar` | Bố trí thép cột tự động |  |  |  |  |  |
| `beam-rebar` | Bố trí thép dầm tự động |  |  |  |  |  |
| `footing-rebar` | Bố trí thép móng tự động |  |  |  |  |  |
| `wall-rebar` | Bố trí thép vách tự động |  |  |  |  |  |
| `beam-drawing` | Triển khai bản vẽ dầm |  |  |  |  |  |
| `footing-drawing` | Triển khai bản vẽ móng |  |  |  |  |  |
| `chat-ai` | Trợ lý AI tích hợp |  | ❌ |  |  |  |
| `utility-tools` | Tiện ích mô hình & tham số |  | ❌ |  |  |  |
| `mcp-read` & `mcp-write` | Kết nối 57 MCP Tools |  | ❌ |  |  |  |
| `model-from-cad` | Dựng hình từ CAD *(AutoCAD Full)* |  | ❌ | ❌ |  |  |
| `dwg-export` | Xuất CAD hàng loạt *(AutoCAD Full)* |  | ❌ | ❌ |  |  |
| `point-cloud` | Scan to BIM đám mây điểm |  | ❌ | ❌ |  |  |

---

## 5. Kết Nối MCP Server Với Claude Desktop & Cursor

### Cấu Hình Claude Desktop (`%APPDATA%\Claude\claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "revitapp": {
      "url": "http://127.0.0.1:8765/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_FROM_LOCALAPPDATA_REVITAPP_MCP_ACCESS_TOKEN_TXT"
      }
    }
  }
}
```

### Cấu Hình Cursor IDE (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "revitapp": {
      "url": "http://127.0.0.1:8765/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_FROM_LOCALAPPDATA_REVITAPP_MCP_ACCESS_TOKEN_TXT"
      }
    }
  }
}
```

> Chi tiết toàn bộ 57 công cụ và tham số xem tại [Tài liệu kỹ thuật RevitAPP MCP (docs/revit_mcp.md)](docs/revit_mcp.md).

---

## 6. Hướng Dẫn Cài Đặt & Khởi Chạy Dự Án

### Cách 1 — Chạy Bằng Docker Compose (Production Ready)

```bash
# 1. Sao chép và cấu hình biến môi trường
cp .env.example .env

# 2. Khởi chạy toàn bộ hệ thống
docker compose up --build -d
```
- Web Application: `http://localhost:80` (hoặc cổng cấu hình `FRONTEND_PORT`)
- Backend REST API: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`

### Cách 2 — Khởi Chạy Môi Trường Phát Triển (Development)

**1. Khởi động Backend (FastAPI):**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Trên Windows: .venv\Scripts\activate
pip install -e ".[dev]"
python -m uvicorn app.main:app --reload --port 8000
```

**2. Khởi động Frontend (React + Vite):**
```bash
cd frontend
npm install
npm run dev
```

---

## 7. Kiểm Thử Hệ Thống (Automated Testing)

**Chạy kiểm thử Backend:**
```bash
cd backend
PYTHONPATH=. pytest
```

**Chạy kiểm thử Frontend:**
```bash
cd frontend
npm run test
```

---

## 8. Tài Liệu Kỹ Thuật Liên Quan

- [docs/revit_mcp.md](docs/revit_mcp.md) — Đặc tả toàn diện giao thức MCP Server, 57 công cụ, pipeline dầm/móng và xử lý sự cố.
- [docs/revit_addin_integration.md](docs/revit_addin_integration.md) — Hướng dẫn tích hợp C# .NET Add-in với Google OAuth PKCE và Server-Authoritative Licensing.
- [backend/README.md](backend/README.md) — Hướng dẫn cấu hình cổng thanh toán VietQR / SePay Webhook.
