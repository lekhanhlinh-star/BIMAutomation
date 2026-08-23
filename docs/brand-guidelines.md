# Quy Chuẩn Nhận Diện Thương Hiệu BIMAutomation (Brand Guidelines v1.0)

> **Thương hiệu chủ quản:** BIMAutomation  
> **Sản phẩm cốt lõi:** BIMAutomation (Bộ Add-in Tự động hóa Kết cấu cho Autodesk Revit 2022–2027)  
> **Ribbon Tab độc quyền:** `LDL-STRUCTURAL`  
> **Phiên bản tài liệu:** 1.0.0  
> **Cập nhật:** 2026-08-22  

---

## 1. Bản Sắc & Định Vị Thương Hiệu (Brand Core & Positioning)

### 1.1. Sứ mệnh (Mission)
Tiên phong mang trí tuệ nhân tạo và giao thức Model Context Protocol (MCP) vào môi trường kỹ thuật kết cấu BIM, giúp kỹ sư giải phóng 90% thời gian vẽ và mô hình hóa cốt thép thủ công, đảm bảo chuẩn xác tuyệt đối theo TCVN 5574:2018 và an toàn dữ liệu dự án.

### 1.2. Tuyên ngôn giá trị (Value Proposition)
- **Tốc độ & Tự động hóa:** *"Gõ một câu. Revit tự vẽ xong hệ thép"* – Ra lệnh bằng ngôn ngữ tự nhiên thông qua AI Client (Claude Desktop, Cursor) hoặc giao diện trực quan.
- **Chuẩn xác kỹ thuật:** Tuân thủ triệt để tiêu chuẩn thiết kế bê tông cốt thép Việt Nam (TCVN 5574:2018), tự động neo, nối, bố trí đai gia cường theo biểu đồ nội lực.
- **An toàn giao dịch tuyệt đối:** Động cơ Native C# .NET chạy trên luồng STA an toàn, hỗ trợ Transaction Rollback khi phát hiện xung đột và hộp thoại xác nhận trực tiếp trong Revit trước khi ghi dữ liệu.

### 1.3. Giọng văn & Phong cách giao tiếp (Brand Voice & Tone)

| Thuộc tính | Biểu hiện chuẩn (Do) | Điều cần tránh (Don't) |
| :--- | :--- | :--- |
| **Kỹ thuật & Chuẩn xác** | Sử dụng thuật ngữ kết cấu chuẩn mực: *đường kính thanh $d$, chiều dài neo $L_{an}$, đai gia cường $s$, cấp độ bền B25/CB400-V*. | Không dùng từ ngữ mơ hồ, chung chung như "vẽ thép siêu đẹp", "tự đoán thép". |
| **Quyết đoán & Đáng tin cậy** | Nhấn mạnh tính kiểm chứng: *STA Threading, Atomic Transaction, Rollback Protection, 256-bit Bearer Token*. | Không đưa ra lời hứa ảo không có cơ sở kỹ thuật (như "tự động 100% không cần kỹ sư"). |
| **Hiện đại & Đột phá** | Thể hiện tư duy tiên phong với *Model Context Protocol (MCP), ExternalEvent queue, AI LLM reasoning*. | Không dùng phong cách trình bày khô cứng, lỗi thời hay rập khuôn. |

---

## 2. Hệ Thống Màu Sắc Nhận Diện (Color Palette)

Bộ màu của BIMAutomation lấy cảm hứng từ màu xanh bản vẽ kỹ thuật (Blueprint Navy) kết hợp với ánh sáng rực rỡ của công nghệ số (Electric Cyan / AI Cobalt).

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ Blueprint Navy  │   │  Cobalt Primary │   │  Electric Cyan  │   │ Structural Steel│
│     #0F172A     │   │     #2563EB     │   │     #06B6D4     │   │     #64748B     │
└─────────────────┘   └─────────────────┘   └─────────────────┘   └─────────────────┘
```

### 2.1. Bảng màu chính (Primary Brand Colors)

| Tên màu | Mã HEX | RGB | HSL | Mục đích sử dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Blueprint Navy (Dark)** | `#0F172A` | `rgb(15, 23, 42)` | `222°, 47%, 11%` | Màu nền Dark Mode, Header cấp cao, Text hiển thị chính |
| **Deep Steel Navy** | `#1E293B` | `rgb(30, 41, 59)` | `217°, 33%, 17%` | Nền thẻ Card, Thanh điều hướng Navigation, Container |
| **Cobalt Primary** | `#2563EB` | `rgb(37, 99, 235)` | `221°, 83%, 53%` | Màu thương hiệu cốt lõi, Nút kêu gọi hành động (CTA), Links |
| **Cobalt Hover** | `#1D4ED8` | `rgb(29, 78, 216)` | `224°, 76%, 48%` | Trạng thái hover, Active state cho các phần tử chính |

### 2.2. Bảng màu điểm nhấn & Năng lượng số (Accent & AI Colors)

| Tên màu | Mã HEX | RGB | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| **Electric Cyan** | `#06B6D4` | `rgb(6, 182, 212)` | Điểm nhấn công nghệ AI / MCP, Hiệu ứng phát sáng Glow, Badge |
| **Cyan Light** | `#22D3EE` | `rgb(34, 211, 238)` | Điểm sáng gradient, icon highlights |
| **Teal Energy** | `#14B8A6` | `rgb(20, 184, 166)` | Chỉ báo hoạt động, Realtime stream indicator |

### 2.3. Bảng màu chức năng (Functional & Status Colors)

| Trạng thái | Mã HEX | Ý nghĩa kỹ thuật trong BIMAutomation |
| :--- | :--- | :--- |
| **Success (Thành công)** | `#10B981` | Mô hình hóa hoàn tất, License PKCE hợp lệ, MCP Connected |
| **Warning (Cảnh báo)** | `#F59E0B` | Phát hiện xung đột cốt thép, Cần kiểm tra bước đai gia cường |
| **Error (Lỗi / Rollback)** | `#EF4444` | Transaction thất bại (đã rollback an toàn), Token hết hạn |
| **Structural Steel** | `#64748B` | Đường dóng kích thước, thép cấu tạo, đường bao tiết diện bê tông |

---

## 3. Hệ Thống Typography (Phông Chữ Chuẩn)

### 3.1. Phông chữ quy định

1. **Phông Tiêu Đề & Nhận diện (Display / Headings):**  
   `Plus Jakarta Sans` hoặc `Inter` (700 Bold / 600 SemiBold)  
   *Đặc tính:* Hình khối dứt khoát, góc cạnh kỹ thuật, rõ ràng trên màn hình độ phân giải cao.

2. **Phông Nội Dung & Giao Diện (Body / UI):**  
   `Inter` (400 Regular / 500 Medium)  
   *Đặc tính:* Dễ đọc tối đa, chỉ số x-height cao, hỗ trợ tiếng Việt có dấu hoàn hảo.

3. **Phông Mã Nguồn & Dữ Liệu MCP (Code / Monospace):**  
   `JetBrains Mono` hoặc `Fira Code` (500 Medium / 400 Regular)  
   *Đặc tính:* Phân biệt tuyệt đối giữa `0` và `O`, `1` và `l`, hiển thị JSON parameters và lệnh CLI sắc sảo.

### 3.2. Thang kích thước chuẩn (Type Scale)

| Cấp bậc | Kích thước Desktop | Kích thước Mobile | Line Height | Font Weight |
| :--- | :--- | :--- | :--- | :--- |
| **Display Hero** | 56px (3.5rem) | 36px (2.25rem) | 1.1 | 800 ExtraBold |
| **Heading 1 (H1)** | 40px (2.5rem) | 28px (1.75rem) | 1.2 | 700 Bold |
| **Heading 2 (H2)** | 30px (1.875rem)| 24px (1.5rem) | 1.25 | 700 Bold |
| **Heading 3 (H3)** | 22px (1.375rem)| 20px (1.25rem) | 1.3 | 600 SemiBold |
| **Body Large** | 18px (1.125rem)| 16px (1.0rem) | 1.6 | 400 Regular |
| **Body Base** | 16px (1.0rem) | 15px (0.9375rem)| 1.5 | 400 Regular |
| **Caption / Small** | 13px (0.8125rem)| 12px (0.75rem) | 1.4 | 500 Medium |
| **Code / Mono** | 13px (0.8125rem)| 12px (0.75rem) | 1.5 | 400 Regular |

---

## 4. Quy Chuẩn Logo & Thương Hiệu Sản Phẩm

### 4.1. Cấu trúc Logo BIMAutomation
- **Biểu tượng (Mark):** Khối hình học không gian 3D trừu tượng đại diện cho nút khung kết cấu bê tông cốt thép, điểm giao giữa Cột - Dầm và dòng dữ liệu tự động hóa đa chiều.
- **Tên thương hiệu (Wordmark):** `BIM` (Font Inter ExtraBold, màu Slate-900) kết hợp `Automation` (Font Inter ExtraBold, màu Cobalt `#2563EB` hoặc Electric Cyan `#06B6D4`).

### 4.2. Khoảng cách an toàn (Clear Space) & Kích thước tối thiểu
- **Clear Space ($X$):** Khoảng cách an toàn xung quanh logo tối thiểu bằng chiều cao của chữ cái `A` trong chữ `Automation`. Không được đặt bất kỳ chữ, hình khối hoặc đường kẻ nào xâm phạm vùng này.
- **Kích thước tối thiểu:**
  - Bản in: Chiều rộng tối thiểu **25mm**.
  - Kỹ thuật số (Digital): Chiều rộng tối thiểu **120px** (đối với bản Full) và **24px** (đối với Icon Mark).

### 4.3. Các biến thể Logo chính thức

```
[Bản Full Sáng (Light Background)]
  [Logo Mark Xanh]  BIMAutomation (Chữ Slate-900 + Cobalt Blue)

[Bản Full Tối (Dark Background)]
  [Logo Mark Phát Sáng] BIMAutomation (Chữ Trắng + Electric Cyan)

[Bản Icon Mark Độc Lập]
  [BIMAutomation Mark 3D Geometry]
```

### 4.4. Quy tắc cấm (Brand Don'ts)
1. ❌ **Không** kéo méo, thay đổi tỷ lệ dài/rộng của logo.
2. ❌ **Không** thay đổi màu sắc logo ngoài bảng màu quy chuẩn.
3. ❌ **Không** đặt logo trên nền hình ảnh quá nhiều chi tiết làm giảm độ tương phản.
4. ❌ **Không** viết sai chính tả tên thương hiệu (Viết đúng: `BIMAutomation`; tên Ribbon giữ nguyên: `LDL-STRUCTURAL`).

---

## 5. Quy Chuẩn Đồ Họa & Ngôn Ngữ Hình Ảnh (Visual Assets & Grid)

### 5.1. Lưới kỹ thuật (Isometric Blueprint Grid)
- Các hình ảnh minh họa kỹ thuật sử dụng nền lưới tọa độ mờ (`opacity: 0.05` đến `0.1`) màu `#2563EB` hoặc `#06B6D4` mô phỏng môi trường làm việc 3D Revit.

### 5.2. Hiệu ứng chiều sâu (Depth & Glassmorphism)
- Sử dụng hiệu ứng nền mờ gương (`backdrop-filter: blur(12px)`) với viền mỏng (`border: 1px solid rgba(255, 255, 255, 0.08)`) trên nền tối `#0F172A`.

---

## 6. Danh Mục Ứng Dụng Nhận Diện (Brand Application Inventory)

1. **Giao diện Website & Web Platform:** Đã triển khai tại `frontend/` với Dark/Light Mode chuẩn.
2. **Revit Add-in Ribbon:** Tab `LDL-STRUCTURAL` với 4 panel trực quan (`Rebar`, `Drawing Rebar`, `CAD Tools`, `Commands`).
3. **MCP Protocol Hub:** Bảng điều khiển công cụ MCP với token 256-bit và giao diện Streamable HTTP.
4. **Bộ tài liệu kỹ thuật & Ấn phẩm doanh nghiệp:** Danh thiếp số, Letterhead thuyết minh tính toán, Chữ ký Email, Slide thuyết trình.
