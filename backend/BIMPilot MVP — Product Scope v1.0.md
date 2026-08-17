# BIMAutomation MVP

## 1. Mục tiêu sản phẩm

BIMAutomation là nền tảng website phục vụ việc:

- Giới thiệu và bán Add-in BIM/Revit.
- Cho phép khách hàng xem tính năng, bảng giá và video hướng dẫn.
- Thanh toán và cấp bản quyền Add-in tự động.
- Quản lý tài khoản, license và thời hạn sử dụng.
- Cung cấp hệ thống Admin để quản lý doanh thu, khách hàng, đơn hàng và bản quyền.
- Thu thập góp ý để phát triển Add-in.

Mục tiêu của MVP là có thể **đưa sản phẩm lên bán thực tế trong vòng 2 tuần**, ưu tiên luồng:

**Khách hàng → Chọn gói → Thanh toán → Nhận License → Kích hoạt Add-in.**

---

# 2. Đối tượng người dùng

## 2.1. Khách truy cập

Người chưa đăng nhập có thể:

- Xem trang chủ.
- Xem tính năng Add-in.
- Xem bảng giá.
- Xem video hướng dẫn.
- Xem thông tin về BIMAutomation.
- Gửi góp ý.
- Đăng ký / đăng nhập.
- Chọn mua bản quyền.

---

## 2.2. Khách hàng

Khách hàng đã đăng nhập có thể:

- Xem thông tin tài khoản.
- Xem license đã mua.
- Xem ngày kích hoạt.
- Xem ngày hết hạn.
- Tải Add-in.
- Copy License Key.
- Xem lịch sử đơn hàng.
- Gia hạn bản quyền.
- Gửi góp ý.

---

## 2.3. Admin

Admin có quyền:

- Xem Dashboard.
- Quản lý khách hàng.
- Quản lý đơn hàng.
- Quản lý thanh toán.
- Quản lý license.
- Reset thiết bị.
- Gia hạn license.
- Khóa hoặc thu hồi license.
- Quản lý doanh thu.
- Xem góp ý.
- Quản lý nội dung video hướng dẫn.
- Quản lý phiên bản Add-in.

---

# 3. Sitemap MVP

```text
/
├── Trang chủ
├── /features
├── /pricing
├── /tutorials
├── /about
├── /feedback
├── /download
├── /login
├── /register
│
├── /account
│   ├── Dashboard
│   ├── Licenses
│   ├── Orders
│   └── Profile
│
└── /admin
    ├── Dashboard
    ├── Customers
    ├── Orders
    ├── Payments
    ├── Licenses
    ├── Revenue
    ├── Feedback
    └── Releases
```

---

# 4. Trang chủ

## Hero Section

Logo:

**BIMAutomation**

Headline đề xuất:

# Làm BIM nhanh hơn với BIMAutomation

Subheadline:

Bộ công cụ Add-in giúp tự động hóa các thao tác lặp lại, giảm thời gian xử lý và nâng cao hiệu suất làm việc trên Revit.

CTA chính:

**Tải Add-in**

CTA phụ:

**Xem bảng giá**

Bên phải hiển thị:

- Screenshot Add-in trong Revit.
- Hoặc video demo.
- Hoặc mockup giao diện Add-in.

---

## Khối lợi ích

Hiển thị 4 lợi ích chính:

### Tiết kiệm thời gian

Tự động hóa các thao tác BIM thường xuyên.

### Dễ sử dụng

Thiết kế trực quan, dễ học và triển khai.

### Cập nhật liên tục

Các tính năng mới được bổ sung theo nhu cầu người dùng.

### Hỗ trợ kỹ thuật

Hỗ trợ xử lý lỗi và hướng dẫn sử dụng.

---

# 5. Trang tính năng

Route:

```text
/features
```

Hiển thị khoảng 5–8 tính năng quan trọng nhất.

Mỗi tính năng gồm:

- Tên tính năng.
- Mô tả ngắn.
- Screenshot hoặc GIF.
- Video hướng dẫn nếu có.

Ví dụ:

### Batch Rename

Đổi tên hàng loạt các đối tượng Revit theo quy tắc.

### Auto Dimension

Tạo kích thước tự động cho các đối tượng.

### Parameter Manager

Quản lý và chỉnh sửa Parameter nhanh hơn.

### Sheet Automation

Tạo và quản lý Sheet theo template.

### Export Tools

Tự động hóa quy trình Export.

---

# 6. Trang bảng giá

Route:

```text
/pricing
```

## Gói 3 tháng

**Giá: TBD**

Bao gồm:

- Toàn bộ tính năng Add-in.
- 1 thiết bị.
- Update miễn phí trong thời hạn.
- Hỗ trợ kỹ thuật.
- Tải phiên bản mới.

CTA:

**Mua 3 tháng**

---

## Gói 6 tháng

**Giá: TBD**

Bao gồm:

- Toàn bộ tính năng Add-in.
- 1 thiết bị.
- Update miễn phí.
- Hỗ trợ kỹ thuật.
- Tải phiên bản mới.

CTA:

**Mua 6 tháng**

Có thể đánh dấu:

**Phổ biến nhất**

---

# 7. Luồng mua hàng

Luồng MVP:

```text
Pricing
   ↓
Chọn gói
   ↓
Checkout
   ↓
Nhập thông tin
   ↓
Tạo Order
   ↓
Hiển thị QR thanh toán
   ↓
Nhận payment webhook
   ↓
Order = PAID
   ↓
Tạo License
   ↓
Gửi License cho khách hàng
   ↓
Khách hàng kích hoạt Add-in
```

---

# 8. Checkout

Thông tin cần nhập:

### Họ và tên

Required.

### Email

Required.

### Số điện thoại

Required.

### Gói sản phẩm

Được tự động lấy từ Pricing.

Ví dụ:

```text
BIMAutomation — 6 tháng
```

Sau khi click:

**Thanh toán**

hệ thống tạo:

```text
Order Code: BP-20260813-0012
```

---

# 9. Thanh toán

MVP ưu tiên:

**Chuyển khoản QR ngân hàng**

Trang thanh toán hiển thị:

- QR Code.
- Ngân hàng.
- Số tài khoản.
- Chủ tài khoản.
- Số tiền.
- Nội dung chuyển khoản.

Ví dụ:

```text
BIMAUTOMATION BP000123
```

Trạng thái:

```text
WAITING_PAYMENT
```

Sau khi webhook xác nhận:

```text
PAID
```

Website tự động chuyển sang:

# Thanh toán thành công

Bản quyền của bạn đã được kích hoạt.

---

# 10. License System

Đây là chức năng cốt lõi của MVP.

Một license bao gồm:

```text
License Key
User ID
Plan ID
Order ID
Device ID
Activated At
Expires At
Status
Last Checked At
```

---

## License Key

Ví dụ:

```text
BP7X-82DK-P9L2-6QAW
```

---

## License Status

Các trạng thái:

```text
PENDING
ACTIVE
EXPIRED
SUSPENDED
REVOKED
```

---

# 11. API kích hoạt Add-in

Endpoint:

```text
POST /api/licenses/activate
```

Request:

```json
{
  "licenseKey": "BP7X-82DK-P9L2-6QAW",
  "deviceId": "DEVICE-FINGERPRINT-001"
}
```

Response thành công:

```json
{
  "success": true,
  "status": "ACTIVE",
  "expiresAt": "2027-02-13T00:00:00Z"
}
```

---

# 12. API kiểm tra license

Endpoint:

```text
POST /api/licenses/verify
```

Request:

```json
{
  "licenseKey": "BP7X-82DK-P9L2-6QAW",
  "deviceId": "DEVICE-FINGERPRINT-001"
}
```

Response:

```json
{
  "valid": true,
  "status": "ACTIVE",
  "expiresAt": "2027-02-13T00:00:00Z"
}
```

Add-in có thể gọi API định kỳ.

Ví dụ:

```text
1 lần / 24 giờ
```

---

# 13. Tài khoản khách hàng

Route:

```text
/account
```

Dashboard hiển thị:

## License hiện tại

```text
BIMAutomation Pro

Gói:
6 tháng

Status:
Active

Ngày kích hoạt:
13/08/2026

Ngày hết hạn:
13/02/2027

License:
BP7X-****-****-6QAW
```

Buttons:

**Copy License**

**Tải Add-in**

**Gia hạn**

---

# 14. Lịch sử đơn hàng

Route:

```text
/account/orders
```

Bảng:

| Order | Gói | Ngày mua | Giá | Trạng thái |
|---|---|---|---|---|
| BP0001 | 6 tháng | 13/08/2026 | 1.200.000đ | Paid |

Click vào Order để xem chi tiết.

---

# 15. Trang Download

Route:

```text
/download
```

Hiển thị:

# BIMAutomation

### Version 1.0.0

Ngày phát hành:

```text
13/08/2026
```

Button:

**Download BIMAutomation**

Thông tin hỗ trợ:

```text
Revit 2023
Revit 2024
Revit 2025
Revit 2026
```

Có thể thêm:

### Release Notes

- Thêm chức năng A.
- Cải thiện chức năng B.
- Sửa lỗi C.

---

# 16. Trang hướng dẫn

Route:

```text
/tutorials
```

Header:

# Hướng dẫn BIMAutomation

Có thanh search:

```text
Tìm hướng dẫn...
```

Danh mục:

- Cài đặt.
- Kích hoạt bản quyền.
- Công cụ Architecture.
- Công cụ Structure.
- Công cụ MEP.
- FAQ.

Video card:

```text
Thumbnail

Cài đặt BIMAutomation

05:20

Xem video
```

Video có thể nhúng YouTube.

---

# 17. Góp ý phát triển Add-in

Route:

```text
/feedback
```

Form:

### Tên

### Email

### Loại góp ý

Options:

```text
Tính năng mới
Cải thiện
Báo lỗi
Khác
```

### Tiêu đề

### Nội dung

### File đính kèm

Optional.

CTA:

**Gửi góp ý**

---

# 18. Admin Dashboard

Route:

```text
/admin
```

Chỉ user có:

```text
role = ADMIN
```

mới được truy cập.

Dashboard bao gồm:

### Doanh thu tháng

```text
48.500.000đ
```

### Đơn hàng tháng

```text
84
```

### License Active

```text
126
```

### License sắp hết hạn

```text
14
```

---

# 19. Admin — Orders

Route:

```text
/admin/orders
```

Bảng:

| Order | Customer | Plan | Amount | Payment | Created |
|---|---|---|---:|---|---|
| BP0001 | Nguyễn Văn A | 6 tháng | 1.200.000đ | Paid | 13/08 |

Filter:

- All.
- Pending.
- Paid.
- Failed.

Search:

```text
Order ID / Email / Phone
```

---

# 20. Admin — License Management

Route:

```text
/admin/licenses
```

Bảng:

| License | Customer | Plan | Device | Expires | Status |
|---|---|---|---|---|---|
| BP7X... | Nguyễn A | 6 tháng | PC01 | 13/02/27 | Active |

Admin actions:

### Reset Device

Xóa Device ID.

Khách có thể kích hoạt lại trên máy khác.

### Extend

Gia hạn license.

### Suspend

Tạm khóa.

### Revoke

Thu hồi license.

---

# 21. Admin — Revenue

Route:

```text
/admin/revenue
```

Hiển thị:

### Hôm nay

### 7 ngày

### 30 ngày

### Tháng này

### Custom Range

Biểu đồ:

```text
Revenue by Date
```

Summary:

```text
Total Revenue
Total Orders
Average Order Value
```

---

# 22. Admin — Feedback

Route:

```text
/admin/feedback
```

Trạng thái feedback:

```text
NEW
REVIEWING
PLANNED
DEVELOPING
DONE
REJECTED
```

Admin có thể:

- Xem nội dung.
- Đổi trạng thái.
- Ghi chú nội bộ.

---

# 23. Database MVP

## users

```text
id
name
email
phone
password_hash
role
created_at
updated_at
```

Role:

```text
USER
ADMIN
```

---

## products

```text
id
name
slug
description
is_active
created_at
```

Ví dụ:

```text
BIMAutomation
```

---

## plans

```text
id
product_id
name
duration_months
price
is_active
created_at
```

Ví dụ:

```text
3 Months
6 Months
```

---

## orders

```text
id
order_code
user_id
plan_id
amount
status
created_at
paid_at
```

Status:

```text
PENDING
PAID
CANCELLED
FAILED
```

---

## payments

```text
id
order_id
provider
transaction_id
amount
status
raw_payload
created_at
```

---

## licenses

```text
id
license_key
user_id
order_id
plan_id
device_id
status
activated_at
expires_at
last_checked_at
created_at
```

---

## feedback

```text
id
user_id
name
email
type
title
content
status
created_at
updated_at
```

---

## releases

```text
id
version
download_url
release_notes
minimum_revit_version
maximum_revit_version
is_active
released_at
```

---

# 24. Tech Stack

## Frontend

```text
Next.js
TypeScript
Tailwind CSS
```

## UI

```text
shadcn/ui
Lucide Icons
```

## Backend

Ưu tiên:

```text
Next.js API
```

để giảm thời gian triển khai.

Nếu hệ thống mở rộng lớn hơn mới tách NestJS.

---

## Database

```text
PostgreSQL
```

Có thể sử dụng:

```text
Supabase
```

để có:

- Database.
- Authentication.
- Storage.
- Row Level Security.

---

## Deploy

Frontend/API:

```text
Vercel
```

Database:

```text
Supabase
```

---

# 25. Authentication

MVP hỗ trợ:

### Email + Password

Các route protected:

```text
/account/*
```

Admin protected:

```text
/admin/*
```

Authorization phải kiểm tra cả frontend và backend.

Không chỉ ẩn menu Admin.

---

# 26. UI Design System

## Brand

Tên:

# BIMAutomation

Concept:

**BIM + Navigation + Automation**

---

## Color

Primary:

```text
Deep Blue
```

Secondary:

```text
Charcoal
```

Background:

```text
White
```

Neutral:

```text
Slate / Gray
```

---

## Typography

Ưu tiên:

```text
Inter
```

hoặc:

```text
Be Vietnam Pro
```

---

## Style

UI định hướng:

```text
Professional
Engineering
Minimal
SaaS
Technical
```

Không dùng quá nhiều:

- Gradient.
- Card.
- Shadow.
- Animation.

Ưu tiên UI sạch và dễ đọc.

---

# 27. Navigation

Desktop:

```text
BIMAutomation

Tính năng
Bảng giá
Hướng dẫn
Về chúng tôi

Góp ý

Đăng nhập

[Tải Add-in]
```

Sau khi đăng nhập:

```text
Account
```

Nếu Admin:

```text
Admin
```

---

# 28. Footer

Footer gồm:

### BIMAutomation

Công cụ giúp tự động hóa BIM workflow.

### Product

- Features.
- Pricing.
- Download.
- Tutorials.

### Company

- About.
- Feedback.

### Support

- Email.
- Facebook.
- YouTube.

Bottom:

```text
© 2026 BIMAutomation. All rights reserved.
```

---

# 29. Yêu cầu bảo mật tối thiểu

MVP cần có:

- Password hashing.
- HTTPS.
- JWT/session bảo mật.
- Backend role validation.
- Payment webhook signature validation.
- Rate limit License API.
- Không lưu password dạng plain text.
- Không expose License database trực tiếp.
- Validate Device ID.
- Audit log cho thao tác revoke/reset license.

---

# 30. MVP Priority

## P0 — Bắt buộc

- Landing page.
- Features.
- Pricing.
- Login/Register.
- Checkout.
- Payment.
- Payment webhook.
- License generation.
- License activation API.
- License verification API.
- Account.
- Download.
- Admin Orders.
- Admin Licenses.
- Admin Revenue.

---

## P1 — Nên có

- Tutorials.
- Feedback.
- Release management.
- Reset Device.
- License renewal.
- Email thông báo.

---

## P2 — Sau MVP

- Blog.
- Coupon.
- Affiliate.
- Public roadmap.
- Team license.
- Company license.
- Multiple devices.
- Invoice.
- AI assistant.
- Chat support.
- Analytics nâng cao.

---

# 31. Kế hoạch 2 tuần

## Ngày 1

- Setup project.
- Database.
- Authentication.
- Design system.
- Header/Footer.

## Ngày 2

- Home.
- Features.

## Ngày 3

- Pricing.
- About.
- Tutorials.

## Ngày 4

- Login/Register.
- Account UI.

## Ngày 5

- Checkout.
- Orders.

## Ngày 6

- QR payment.
- Payment integration.

## Ngày 7

- Payment webhook.
- License generation.

## Ngày 8

- Activation API.
- Verify API.
- Add-in integration test.

## Ngày 9

- Admin Dashboard.
- Orders.
- Licenses.
- Revenue.

## Ngày 10

- Feedback.
- Download.
- Releases.

## Ngày 11

- Responsive.
- Validation.
- Security.

## Ngày 12

- End-to-end testing.

Test:

```text
Register
→ Buy
→ Pay
→ Get License
→ Activate
→ Verify
```

## Ngày 13

- Bug fixing.
- Performance.
- Deployment.

## Ngày 14

- Production QA.
- Backup.
- Monitoring.
- Go Live.

---

# 32. Tiêu chí hoàn thành MVP

BIMAutomation MVP được coi là hoàn thành khi một khách hàng mới có thể thực hiện toàn bộ luồng sau mà Admin không cần can thiệp thủ công:

```text
Vào BIMAutomation
      ↓
Xem sản phẩm
      ↓
Xem bảng giá
      ↓
Đăng ký
      ↓
Chọn gói
      ↓
Thanh toán
      ↓
Hệ thống xác nhận tiền
      ↓
License tự động được tạo
      ↓
Khách tải Add-in
      ↓
Nhập License
      ↓
Add-in kích hoạt thành công
      ↓
License xuất hiện trong Admin
      ↓
Doanh thu được ghi nhận
```

Đây là **core MVP của BIMAutomation**. Các tính năng ngoài luồng này chỉ nên được bổ sung sau khi hệ thống bán hàng và cấp license chạy ổn định.