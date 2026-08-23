# Tài Liệu Kỹ Thuật Giao Thức RevitAPP MCP Server & Danh Bạ 57 Công Cụ

> **Phiên bản tài liệu:** 2.0.0  
> **Giao thức chuẩn:** Model Context Protocol (MCP) — Specification Version `2025-11-25`  
> **Kiểu truyền tải (Transport):** Streamable HTTP (POST / GET + Server-Sent Events)  
> **Endpoint cục bộ:** `http://127.0.0.1:8765/mcp`  
> **Bảo mật:** Loopback-Only (`127.0.0.1`), Bearer Token 256-bit tại `%LocalAppData%\RevitAPP\mcp-access-token.txt`  
> **Môi trường hỗ trợ:** Autodesk Revit 2022, 2023, 2024, 2025, 2026, 2027 (.NET 4.8 / .NET 8)

---

## 1. Giới Thiệu Tổng Quan & Kiến Trúc Kỹ Thuật

**RevitAPP MCP Server** là dịch vụ nhúng trực tiếp bên trong tiến trình Autodesk Revit thông qua bộ Add-in **RevitAPP** (.NET C#). Dịch vụ mở rộng năng lực điều khiển mô hình thông tin công trình (BIM) cho các Mô hình Ngôn ngữ Lớn (LLMs) và Trợ lý AI (Claude Desktop, Cursor, Custom AI Agents) theo chuẩn mở **Model Context Protocol (MCP)**.

```
+-------------------------------------------------------------------------------+
|                        AI Clients (Claude, Cursor, Agents)                    |
+---------------------------------------+---------------------------------------+
                                        |  Streamable HTTP POST / GET
                                        |  Authorization: Bearer <256-bit Token>
                                        v
+-------------------------------------------------------------------------------+
|                RevitAPP Add-in Process (Autodesk Revit 2022-2027)             |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  | McpHttpServer (Loopback 127.0.0.1:8765/mcp)                             |  |
|  | - Token Validator (SHA-256 Bearer Token)                                |  |
|  | - Entitlement & License Gatekeeper (mcp-read / mcp-write)                 |  |
|  +------------------------------------+------------------------------------+  |
|                                       |                                       |
|                  [Read Operation]     |     [Write / Modify Operation]        |
|                        |              |                  |                    |
|                        v              |                  v                    |
|            Direct Document Access     |     RevitExternalEventQueue           |
|            (Safe Querying)            |     (IExternalEventHandler Dispatch)  |
|                                       |                  |                    |
|                                       |                  v                    |
|                                       |     Safe In-Revit Confirmation Prompt |
|                                       |     (Kỹ sư duyệt trước khi commit)    |
|                                       |                  |                    |
|                                       |                  v                    |
|                                       |     Transaction (Manual Mode)         |
|                                       |     - Commit on Success               |
|                                       |     - RollBack on Exception/Reject    |
|                                       |                                       |
|  +------------------------------------+------------------------------------+  |
|  | Autodesk.Revit.DB.Document (Active Structural BIM Model)                |  |
|  +-------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+
```

### 1.1. Các Trụ Cột Kiến Trúc Cốt Lõi

1. **Direct Native Engine (.NET C#):**  
   Không sử dụng mã kịch bản trung gian lỏng lẻo. Lệnh gọi từ MCP Client kích hoạt trực tiếp các module chuyên sâu đã được biên dịch và tối ưu hóa cho Revit API.
2. **Revit STA Threading & Hàng Đợi `ExternalEvent`:**  
   Revit API hoạt động trên mô hình luồng đơn (Single-Threaded Apartment - STA). Bất kỳ tác vụ can thiệp mô hình nào từ HTTP server bất đồng bộ đều được đưa vào hàng đợi `IExternalEventHandler` / `ExternalEvent`, đảm bảo không bao giờ gây xung đột luồng hoặc làm crash ứng dụng Revit.
3. **Quản Lý Transaction & Tự Động Rollback:**  
   Mỗi thao tác ghi mô hình đều mở một `Transaction` độc lập có tên định danh rõ ràng. Nếu gặp lỗi hình học, vi phạm ràng buộc hoặc người dùng từ chối, transaction lập tức được `RollBack()`, bảo vệ mô hình 100% nguyên vẹn.
4. **Phân Tách Quyền Hạn (Server-Authoritative License Gate):**  
   - Quyền Đọc (`mcp-read`): Cho phép các lệnh truy vấn cấu kiện, đọc tham số, phân tích bảng Excel và xuất báo cáo.
   - Quyền Ghi (`mcp-write`): Kiểm soát các lệnh tạo cốt thép, dựng dầm/cột/móng, sửa đổi tham số và thực thi mã động C#. Cần license hợp lệ (Dùng thử 14 ngày, Cốt thép + AI, Full Suite hoặc Doanh nghiệp).
5. **Cơ Chế Xác Nhận An Toàn Trước Khi Thay Đổi (Safe In-Revit Confirmation Prompt):**  
   Đối với các thay đổi diện rộng (rải thép hàng loạt, tạo bản vẽ Sheet), RevitAPP hiển thị bảng tóm tắt preview trong Revit để kỹ sư bấm "Xác nhận", đảm bảo quyền kiểm soát tối cao luôn thuộc về con người.

---

## 2. Hướng Dẫn Cấu Hình Kết Nối External AI Client

### 2.1. Vị Trí Lưu Bearer Token
Khi RevitAPP Add-in khởi chạy lần đầu trên máy trạm, một mã truy cập ngẫu nhiên 256-bit an toàn sẽ được sinh ra và ghi vào file:
```text
%LocalAppData%\RevitAPP\mcp-access-token.txt
```
*(Đường dẫn đầy đủ: `C:\Users\<Tên_Người_Dùng>\AppData\Local\RevitAPP\mcp-access-token.txt`)*

---

### 2.2. Cấu Hình Claude Desktop
Mở hoặc tạo file cấu hình Claude Desktop tại đường dẫn:
```text
%APPDATA%\Claude\claude_desktop_config.json
```

Thêm cấu hình máy chủ `revitapp` vào khóa `mcpServers`:

```json
{
  "mcpServers": {
    "revitapp": {
      "url": "http://127.0.0.1:8765/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_ACCESS_TOKEN_HERE"
      }
    }
  }
}
```

> **Lưu ý:** Thay thế `YOUR_MCP_ACCESS_TOKEN_HERE` bằng chuỗi token đọc được trong file `mcp-access-token.txt`. Khởi động lại Claude Desktop để nhận diện 57 công cụ.

---

### 2.3. Cấu Hình Cursor IDE
Tạo hoặc chỉnh sửa file `.cursor/mcp.json` tại thư mục gốc của dự án hoặc `%USERPROFILE%\.cursor\mcp.json`:

```json
{
  "mcpServers": {
    "revitapp": {
      "url": "http://127.0.0.1:8765/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_ACCESS_TOKEN_HERE"
      }
    }
  }
}
```

---

### 2.4. Kiểm Tra Kết Nối (Liveness Ping)
Để xác minh MCP Server đang hoạt động bình thường, gửi HTTP POST request:

```bash
curl -X POST http://127.0.0.1:8765/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_MCP_ACCESS_TOKEN_HERE" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "ping_mcp_server",
      "arguments": {}
    }
  }'
```

**Phản hồi mẫu thành công:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "status": "ok",
    "protocol_version": "2025-11-25",
    "timestamp": "2026-08-22T07:45:00Z",
    "latency_ms": 1.2
  }
}
```

---

## 3. Hệ Thống 18 Lệnh Ribbon Trên Tab `LDL-STRUCTURAL`

Trong giao diện Autodesk Revit, toàn bộ tính năng của Add-in được bố trí chuyên nghiệp trên Ribbon Tab mang tên **`LDL-STRUCTURAL`**, phân bổ thành 4 nhóm bảng điều khiển (Panels):

```
+-------------------------------------------------------------------------------------------------------+
|                                         TAB: LDL-STRUCTURAL                                           |
+-------------------+-----------------------+-----------------------+-----------------------------------+
|   PANEL: REBAR    | PANEL: DRAWING REBAR  |   PANEL: CAD TOOLS    |         PANEL: COMMANDS           |
+-------------------+-----------------------+-----------------------+-----------------------------------+
| 1. Column Rebar   | 6.  Beam Drawing      | 11. Model from CAD    | 15. Chat AI Assistant             |
| 2. Beam Rebar     | 7.  Footing Drawing   | 12. DWG Export        | 16. License & Account             |
| 3. Footing Rebar  | 8.  Column Drawing    | 13. Link CAD Manager  | 17. Settings & Presets            |
| 4. Wall Rebar     | 9.  Wall Drawing      | 14. Layer Clean & Map | 18. MCP Server Status             |
| 5. Slab Rebar     | 10. Rebar Sched & Tag |                       |                                   |
+-------------------+-----------------------+-----------------------+-----------------------------------+
```

### Bảng Kê Chi Tiết 18 Lệnh Ribbon:

| # | Panel | Tên Lệnh Ribbon | Mã Feature Code | Phím Tắt | Mô Tả Chức Năng Kỹ Thuật |
|---|---|---|---|:---:|---|
| 1 | **Rebar** | **Column Rebar** | `column-rebar` | `CR` | Bố trí thép cột tự động (thép chủ, đai bao, đai lồng, đai C chống phình, đoạn nối so le 50% qua tầng theo TCVN 5574:2018). |
| 2 | **Rebar** | **Beam Rebar** | `beam-rebar` | `BR` | Bố trí thép dầm liên tục đa nhịp từ bảng Excel hoặc Preset: thép gối $L_{clear}/3$, thép nhịp $L_{clear}/2$, thép giá $h \ge 700\text{mm}$, đai dày 2 đầu dầm $a100$. |
| 3 | **Rebar** | **Footing Rebar** | `footing-rebar` | `FR` | Bố trí cốt thép móng đơn, móng băng, móng bè: lưới thép đáy, lưới trên, hệ thép chân chó (Bar Chair $\Phi 12/\Phi 14$), đai viền và râu chờ cột. |
| 4 | **Rebar** | **Wall Rebar** | `wall-rebar` | `WR` | Bố trí 2 lớp thép vách (đứng + ngang), đai C liên kết, cột biên ẩn đầu vách và gia cường mép lỗ mở cửa đi / cửa sổ. |
| 5 | **Rebar** | **Slab Rebar** | `utility-tools` | `SR` | Bố trí thép sàn 2 lớp theo biên dạng CurveLoop, thép mũ gối trên đỉnh dầm, thép gia cường góc $45^\circ$ tại lỗ mở hộp gen kỹ thuật. |
| 6 | **Drawing Rebar** | **Beam Drawing** | `beam-drawing` | `BD` | Tự động tạo Sheet chi tiết dầm, cắt mặt cắt dọc trục và các mặt cắt ngang gối/nhịp, tự động dàn trang Viewport lên khung tên. |
| 7 | **Drawing Rebar** | **Footing Drawing** | `footing-drawing` | `FD` | Tự động tạo Sheet chi tiết móng: mặt bằng định vị đáy đài, mặt cắt 1-1, 2-2 và bảng thống kê hình học thanh uốn. |
| 8 | **Drawing Rebar** | **Column Drawing** | `beam-drawing` | `CD` | Khai triển chi tiết mặt đứng và mặt cắt ngang các tầng cột, gắn cao độ nối thép và ghi chú kỹ thuật. |
| 9 | **Drawing Rebar** | **Wall Drawing** | `beam-drawing` | `WD` | Khai triển diện vách thang máy / vách cứng, tạo các mặt cắt ngang đại diện qua từng tầng. |
| 10 | **Drawing Rebar** | **Rebar Schedule & Tag** | `utility-tools` | `RS` | Tự động đánh số thứ tự thanh thép (Rebar Numbering), gắn nhãn Tag thông số và xuất bảng thống kê khối lượng uốn. |
| 11 | **CAD Tools** | **Model from CAD** | `model-from-cad` | `MC` | Quét layer bản vẽ 2D CAD để tự động dựng cột, dầm, tường, móng trong Revit *(Yêu cầu AutoCAD Full 2016+)*. |
| 12 | **CAD Tools** | **DWG Export** | `dwg-export` | `DE` | Xuất hàng loạt Sheet/View ra file DWG chuẩn màu sắc, chuẩn layer và nét in theo tiêu chuẩn hồ sơ công ty *(Yêu cầu AutoCAD Full 2016+)*. |
| 13 | **CAD Tools** | **Link CAD Manager** | `model-from-cad` | `LM` | Kiểm soát tọa độ, vị trí gốc tọa độ và tự động căn chỉnh các file CAD liên kết trong mô hình Revit. |
| 14 | **CAD Tools** | **Layer Clean & Map** | `model-from-cad` | `LC` | Làm sạch các layer rác và thiết lập bảng ánh xạ tên Layer CAD tương ứng với Family / Type trong Revit. |
| 15 | **Commands** | **Chat AI Assistant** | `chat-ai` | `AI` | Mở cửa sổ Trợ lý AI tích hợp sẵn trong Revit để ra lệnh điều khiển mô hình bằng ngôn ngữ tự nhiên. |
| 16 | **Commands** | **License & Account** | *(Free/Public)* | `LA` | Đăng nhập Google OAuth PKCE 1-click, kích hoạt bản quyền, kiểm tra thời hạn dùng thử 14 ngày và quản lý thiết bị. |
| 17 | **Commands** | **Settings & Presets** | `utility-tools` | `ST` | Cấu hình lớp bê tông bảo vệ (Cover), quy chuẩn nối thép, mác bê tông và quản lý thư viện preset cấu kiện. |
| 18 | **Commands** | **MCP Server Status** | `mcp-read` | `MS` | Xem trạng thái liveness của MCP Server, địa chỉ cổng 8765, token truy cập và khởi động lại dịch vụ khi cần. |

---

## 4. Danh Bạ Chi Tiết 57 MCP Tools Thuộc 8 Nhóm Chức Năng

Danh bạ 57 công cụ MCP được phân loại chính xác thành 8 nhóm chức năng nghiệp vụ:
`12 + 5 + 4 + 2 + 11 + 5 + 15 + 3 = 57 tools`.

---

### Nhóm 1: Vẽ Thép & Bản Vẽ Kết Cấu (12 Tools)

#### 1. `create_column_rebar`
- **Mô tả:** Tạo toàn bộ hệ cốt thép 3D cho cột bê tông (thép chủ, đai bao, đai lồng, đai C chống phình, đoạn nối thép) theo cấu hình preset hoặc instance mark.
- **Quyền yêu cầu:** `mcp-write`, `column-rebar`
- **Tham số đầu vào (Inputs):**
  - `column_ids` (`int[]`, Bắt buộc): Danh sách ElementId của các cột cần bố trí thép.
  - `preset_name` (`string`, Tùy chọn): Tên cấu hình preset đã lưu (ví dụ `"C7"`, `"CotGoc_400x400"`).
  - `main_bar_type` (`string`, Tùy chọn): Tên RebarBarType cho thép chủ (ví dụ `"D20"`, `"D22"`).
  - `stirrup_type` (`string`, Tùy chọn): Tên RebarBarType cho cốt đai (ví dụ `"D8"`, `"D10"`).
  - `stirrup_spacing` (`int[]`, Tùy chọn): Bước rải đai `[vung_duoi, vung_giua, vung_tren]`, ví dụ `[100, 200, 100]`.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "created_rebar_ids": [102451, 102452, 102453], "message": "Đã bố trí thép thành công cho 4 cột." }
  ```
- **Xử lý lỗi:** Báo lỗi nếu ElementId không tồn tại, cột không phải bê tông hoặc không tìm thấy RebarBarType tương ứng.

#### 2. `create_beam_rebar`
- **Mô tả:** Bố trí cốt thép dầm chính, dầm phụ, thép giá và đai gia cường theo dữ liệu bảng tính Excel hoặc Preset thiết kế.
- **Quyền yêu cầu:** `mcp-write`, `beam-rebar`
- **Tham số đầu vào (Inputs):**
  - `beam_ids` (`int[]`, Bắt buộc): Danh sách ElementId của các đoạn dầm thuộc trục.
  - `excel_path` (`string`, Tùy chọn): Đường dẫn file Excel chứa bảng thống kê thép thiết kế.
  - `preset_name` (`string`, Tùy chọn): Tên cấu hình dầm mẫu.
  - `cover` (`double`, Tùy chọn): Chiều dày lớp bê tông bảo vệ (mm), mặc định `25.0`.
  - `lap_length` (`double`, Tùy chọn): Chiều dài đoạn neo nối thép (mm).
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "beam_count": 4, "created_rebar_ids": [20101, 20102, 20103] }
  ```
- **Xử lý lỗi:** Báo lỗi nếu các dầm không cùng phương, thiếu tiết diện hoặc đường dẫn file Excel không hợp lệ.

#### 3. `create_footing_rebar`
- **Mô tả:** Bố trí cốt thép móng đơn, móng băng, móng bè (lưới thép đáy, lưới trên, hệ thép chân chó, đai giằng, râu chờ cổ cột).
- **Quyền yêu cầu:** `mcp-write`, `footing-rebar`
- **Tham số đầu vào (Inputs):**
  - `footing_ids` (`int[]`, Bắt buộc): Danh sách ElementId của đài móng / móng.
  - `preset_name` (`string`, Tùy chọn): Tên preset móng (ví dụ `"V1"`, `"MongDon_1500x1500"`).
  - `bottom_bar_type` (`string`, Tùy chọn): Đường kính thép đáy (ví dụ `"D14"`).
  - `bottom_spacing` (`int`, Tùy chọn): Khoảng cách bước rải thép đáy (mm, ví dụ `150`).
  - `top_mesh` (`bool`, Tùy chọn): Bật/tắt tạo lưới thép lớp trên, mặc định `true`.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "footing_count": 8, "rebar_ids": [30401, 30402, 30403] }
  ```
- **Xử lý lỗi:** Báo lỗi nếu phần tử không thuộc Category `Structural Foundations`.

#### 4. `create_wall_rebar`
- **Mô tả:** Bố trí lưới thép đứng, thép ngang 2 lớp, đai liên kết chữ C và thép gia cường mép lỗ mở vách bê tông.
- **Quyền yêu cầu:** `mcp-write`, `wall-rebar`
- **Tham số đầu vào (Inputs):**
  - `wall_ids` (`int[]`, Bắt buộc): Danh sách ElementId của vách kết cấu.
  - `vertical_bar` (`string`, Tùy chọn): RebarBarType thép đứng (ví dụ `"D12"`).
  - `horizontal_bar` (`string`, Tùy chọn): RebarBarType thép ngang (ví dụ `"D10"`).
  - `vertical_spacing` (`int`, Tùy chọn): Bước rải thép đứng (mm, ví dụ `150`).
  - `horizontal_spacing` (`int`, Tùy chọn): Bước rải thép ngang (mm, ví dụ `200`).
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "wall_count": 2, "rebar_ids": [40501, 40502] }
  ```
- **Xử lý lỗi:** Báo lỗi nếu tường không phải là `Structural Wall` hoặc vách cong dạng Freeform không hỗ trợ.

#### 5. `create_slab_rebar`
- **Mô tả:** Tạo thép sàn 2 lớp (phương X/Y), thép mũ gối trên đỉnh dầm và thép gia cường lỗ mở sàn.
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `floor_id` (`int`, Bắt buộc): ElementId của ô sàn kết cấu.
  - `top_bar` (`string`, Tùy chọn): Loại thép lớp trên.
  - `bottom_bar` (`string`, Tùy chọn): Loại thép lớp dưới.
  - `spacing_x` (`int`, Tùy chọn): Bước rải phương X (mm).
  - `spacing_y` (`int`, Tùy chọn): Bước rải phương Y (mm).
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "slab_rebar_ids": [50101, 50102, 50103] }
  ```
- **Xử lý lỗi:** Báo lỗi nếu đường bao sàn tự cắt nhau hoặc thiếu thông số cao độ đặt thép.

#### 6. `generate_beam_drawing_sheet`
- **Mô tả:** Tự động tạo Sheet mới, cắt mặt cắt dọc dầm và các mặt cắt ngang đại diện, sắp xếp Viewport lên bản vẽ.
- **Quyền yêu cầu:** `mcp-write`, `beam-drawing`
- **Tham số đầu vào (Inputs):**
  - `beam_ids` (`int[]`, Bắt buộc): Danh sách dầm thuộc trục cần tạo bản vẽ.
  - `sheet_number` (`string`, Tùy chọn): Số hiệu bản vẽ (ví dụ `"KC-201"`).
  - `sheet_name` (`string`, Tùy chọn): Tên bản vẽ (ví dụ `"CHI TIẾT DẦM TẦNG 2 TRỤC 1-4"`).
  - `titleblock_name` (`string`, Tùy chọn): Tên khung tên Titleblock (ví dụ `"A1 metric"`).
  - `scale` (`int`, Tùy chọn): Tỷ lệ bản vẽ (ví dụ `25`, `50`).
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "sheet_id": 60100, "view_ids": [60101, 60102, 60103], "sheet_number": "KC-201" }
  ```
- **Xử lý lỗi:** Báo lỗi nếu trùng Sheet Number hoặc không tìm thấy Titleblock.

#### 7. `generate_footing_drawing_sheet`
- **Mô tả:** Tự động tạo Sheet chi tiết móng, mặt bằng định vị và các mặt cắt ngang qua đài móng.
- **Quyền yêu cầu:** `mcp-write`, `footing-drawing`
- **Tham số đầu vào (Inputs):**
  - `footing_ids` (`int[]`, Bắt buộc): Danh sách móng cần xuất bản vẽ.
  - `sheet_number` (`string`, Tùy chọn): Số hiệu bản vẽ.
  - `sheet_name` (`string`, Tùy chọn): Tên bản vẽ.
  - `scale` (`int`, Tùy chọn): Tỷ lệ bản vẽ.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "sheet_id": 70100, "section_view_ids": [70101, 70102] }
  ```
- **Xử lý lỗi:** Báo lỗi nếu không xác định được hướng cắt chính của cấu kiện móng.

#### 8. `create_rebar_schedule`
- **Mô tả:** Tạo bảng thống kê cốt thép kèm hình dáng uốn (Rebar Shape) theo cấu kiện hoặc tầng.
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `schedule_name` (`string`, Tùy chọn): Tên bảng thống kê.
  - `filter_by_mark` (`string`, Tùy chọn): Bộ lọc theo ký hiệu cấu kiện (ví dụ `"D1*"`).
  - `filter_by_level` (`string`, Tùy chọn): Bộ lọc theo tầng.
  - `include_shapes` (`bool`, Tùy chọn): Hiển thị hình vẽ thanh thép uốn (mặc định `true`).
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "schedule_id": 80100, "total_weight_kg": 4250.8 }
  ```
- **Xử lý lỗi:** Báo lỗi nếu mô hình chưa có cốt thép hoặc tên Schedule bị trùng lặp.

#### 9. `tag_rebar_elements`
- **Mô tả:** Tự động gắn nhãn (Rebar Tag) cho tất cả các thanh cốt thép trên View hiện hành.
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `view_id` (`int`, Bắt buộc): ElementId của View cần gắn tag.
  - `tag_family_name` (`string`, Tùy chọn): Tên Family Rebar Tag mong muốn.
  - `leader` (`bool`, Tùy chọn): Bật đường dẫn (Leader line), mặc định `true`.
  - `orientation` (`string`, Tùy chọn): Hướng hiển thị (`"Horizontal"` hoặc `"Vertical"`).
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "tagged_count": 48 }
  ```
- **Xử lý lỗi:** Báo lỗi nếu View không phải là Plan/Section hoặc Tag Family chưa được load vào project.

#### 10. `modify_rebar_parameters`
- **Mô tả:** Thay đổi hàng loạt tham số cốt thép (đường kính, bước rải, chiều dài bẻ móc, mác thép).
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `rebar_ids` (`int[]`, Bắt buộc): Danh sách ID thanh thép cần sửa.
  - `parameters` (`dict`, Bắt buộc): Cặp khóa-giá trị tham số cần cập nhật (ví dụ `{"Comments": "Thép tăng cường", "Bar Diameter": 20}`).
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "modified_count": 12 }
  ```
- **Xử lý lỗi:** Báo cáo chi tiết danh sách tham số bị lỗi do Read-Only hoặc sai kiểu dữ liệu.

#### 11. `check_rebar_clashes`
- **Mô tả:** Kiểm tra va chạm hình học và khoảng hở tối thiểu giữa các thanh cốt thép hoặc với lỗ mở sàn/dầm.
- **Quyền yêu cầu:** `mcp-read`
- **Tham số đầu vào (Inputs):**
  - `rebar_ids` (`int[]`, Tùy chọn): Danh sách ID thanh thép cần kiểm tra (mặc định kiểm tra toàn bộ view).
  - `tolerance_mm` (`double`, Tùy chọn): Khoảng hở dung sai va chạm (mm), mặc định `5.0`.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "clash_count": 2, "clash_pairs": [{"rebar_1": 101, "rebar_2": 205, "distance_mm": 1.2}] }
  ```
- **Xử lý lỗi:** Trả về danh sách rỗng nếu không phát hiện va chạm.

#### 12. `isolate_continuous_beam_axis`
- **Mô tả:** Tự động tìm kiếm, lọc và sắp xếp theo thứ tự hình học các đoạn dầm thuộc cùng một trục kết cấu liên tục.
- **Quyền yêu cầu:** `mcp-read`
- **Tham số đầu vào (Inputs):**
  - `grid_name` (`string`, Bắt buộc): Tên trục lưới (ví dụ `"Trục 3"`, `"Grid B"`).
  - `level_name` (`string`, Tùy chọn): Tên tầng (ví dụ `"Tầng 2"`, `"Level 2"`).
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "axis_name": "Trục 3", "ordered_beam_ids": [101, 102, 103, 104] }
  ```
- **Xử lý lỗi:** Báo lỗi nếu không tìm thấy trục lưới hoặc không có dầm nào nằm trên trục ở tầng đã chọn.

---

### Nhóm 2: Đọc Mô Hình & Chọn Đối Tượng (5 Tools)

#### 13. `get_selected_elements`
- **Mô tả:** Lấy danh sách ID, Category, Name và Type của các phần tử đang được chọn trong giao diện Revit.
- **Quyền yêu cầu:** `mcp-read`
- **Tham số đầu vào (Inputs):** *Không có tham số.*
- **Định dạng đầu ra (Outputs):**
  ```json
  { "count": 2, "elements": [{"id": 45012, "category": "Structural Columns", "name": "C400x400", "type": "400x400mm"}] }
  ```
- **Xử lý lỗi:** Trả về mảng rỗng nếu người dùng chưa chọn đối tượng nào trong Revit.

#### 14. `select_elements_by_ids`
- **Mô tả:** Đánh dấu chọn (highlight selection) các phần tử trong mô hình theo danh sách ElementId.
- **Quyền yêu cầu:** `mcp-read`
- **Tham số đầu vào (Inputs):**
  - `element_ids` (`int[]`, Bắt buộc): Danh sách ID cần chọn trên màn hình Revit.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "selected_count": 5 }
  ```
- **Xử lý lỗi:** Báo lỗi nếu ID không tồn tại trong Document.

#### 15. `query_elements_by_category`
- **Mô tả:** Truy vấn các phần tử trong mô hình theo Category (cột, dầm, sàn, móng...) kèm bộ lọc tầng và Mark.
- **Quyền yêu cầu:** `mcp-read`
- **Tham số đầu vào (Inputs):**
  - `category` (`string`, Bắt buộc): Tên Built-in Category (ví dụ `"Structural Framing"`, `"Structural Columns"`).
  - `level_name` (`string`, Tùy chọn): Lọc theo tên tầng.
  - `mark_filter` (`string`, Tùy chọn): Lọc theo ký hiệu Mark (ví dụ `"C7*"`).
  - `limit` (`int`, Tùy chọn): Giới hạn số lượng kết quả (mặc định `100`).
- **Định dạng đầu ra (Outputs):**
  ```json
  { "count": 16, "elements": [{"id": 1201, "name": "C1", "mark": "C7", "level": "Level 1"}] }
  ```
- **Xử lý lỗi:** Báo lỗi nếu tên Category không hợp lệ.

#### 16. `get_element_parameters`
- **Mô tả:** Đọc toàn bộ tham số Built-in, Shared Parameter và Project Parameter của một phần tử.
- **Quyền yêu cầu:** `mcp-read`
- **Tham số đầu vào (Inputs):**
  - `element_id` (`int`, Bắt buộc): ElementId của phần tử cần đọc.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "element_id": 45012, "parameters": { "Comments": {"value": "Cột trục A", "type": "String", "is_readonly": false}, "Volume": {"value": 0.48, "type": "Double", "is_readonly": true} } }
  ```
- **Xử lý lỗi:** Báo lỗi nếu ElementId không tồn tại.

#### 17. `get_element_geometry_bbox`
- **Mô tả:** Lấy tọa độ BoundingBox 3D (Min, Max), tâm đối tượng và thể tích hình học.
- **Quyền yêu cầu:** `mcp-read`
- **Tham số đầu vào (Inputs):**
  - `element_id` (`int`, Bắt buộc): ElementId của phần tử.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "element_id": 45012, "bbox_min": [0.0, 0.0, 0.0], "bbox_max": [0.4, 0.4, 3.6], "center": [0.2, 0.2, 1.8], "volume": 0.576 }
  ```
- **Xử lý lỗi:** Báo lỗi nếu phần tử không có hình học 3D (ví dụ View, Sheet).

---

### Nhóm 3: Xử Lý Dữ Liệu Excel (4 Tools)

#### 18. `read_rebar_excel_table`
- **Mô tả:** Đọc và phân tích cấu trúc bảng thép từ file Excel (Mark dầm/cột, vị trí gối/nhịp, đường kính, số lượng).
- **Quyền yêu cầu:** `mcp-read`
- **Tham số đầu vào (Inputs):**
  - `file_path` (`string`, Bắt buộc): Đường dẫn file Excel (`.xlsx` hoặc `.xls`).
  - `sheet_name` (`string`, Tùy chọn): Tên sheet cần đọc (mặc định sheet đầu tiên).
  - `header_row` (`int`, Tùy chọn): Dòng tiêu đề (mặc định dòng `1`).
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "row_count": 24, "data": [{"mark": "D1", "pos": "Gối trái", "diameter": 20, "count": 3}] }
  ```
- **Xử lý lỗi:** Mở bằng `FileShare.ReadWrite` để không bị khóa nếu file đang mở bởi người khác; báo lỗi nếu file không tồn tại.

#### 19. `export_rebar_to_excel`
- **Mô tả:** Xuất bảng thống kê chi tiết cốt thép từ mô hình ra file Excel theo mẫu chuẩn dự án.
- **Quyền yêu cầu:** `mcp-read`
- **Tham số đầu vào (Inputs):**
  - `file_path` (`string`, Bắt buộc): Đường dẫn file Excel đầu ra.
  - `filter_by_level` (`string`, Tùy chọn): Lọc theo tầng cần xuất.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "exported_path": "C:\\Exports\\BangThongKeThep.xlsx", "total_items": 120 }
  ```
- **Xử lý lỗi:** Báo lỗi nếu thư mục không có quyền ghi.

#### 20. `sync_parameters_from_excel`
- **Mô tả:** Cập nhật hàng loạt tham số vào các phần tử Revit từ file Excel theo mã khóa ElementId hoặc Mark.
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `file_path` (`string`, Bắt buộc): Đường dẫn file Excel chứa dữ liệu cập nhật.
  - `key_column` (`string`, Bắt buộc): Tên cột dùng làm khóa tra cứu (`"ElementId"` hoặc `"Mark"`).
  - `update_columns` (`string[]`, Bắt buộc): Danh sách tên các cột tham số cần đồng bộ vào Revit.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "updated_count": 45, "failed_count": 0, "errors": [] }
  ```
- **Xử lý lỗi:** Tự động bỏ qua và ghi nhận lỗi các dòng có tham số Read-Only mà không làm dừng cả tiến trình.

#### 21. `export_model_quantities_excel`
- **Mô tả:** Trích xuất khối lượng bê tông, diện tích ván khuôn và khối lượng thép toàn dự án ra file Excel.
- **Quyền yêu cầu:** `mcp-read`
- **Tham số đầu vào (Inputs):**
  - `file_path` (`string`, Bắt buộc): Đường dẫn lưu file Excel.
  - `group_by` (`string`, Tùy chọn): Gom nhóm dữ liệu theo `"Level"` hoặc `"Category"`.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "file_path": "C:\\Exports\\KhoiLuong.xlsx", "summary": {"concrete_m3": 1250.5, "steel_ton": 142.3} }
  ```
- **Xử lý lỗi:** Báo lỗi nếu mô hình chưa hoàn thành việc gán vật liệu.

---

### Nhóm 4: Dịch Bản Vẽ Việt / Trung (2 Tools)

#### 22. `translate_sheet_annotations`
- **Mô tả:** Dịch toàn bộ Text Note, Dimension override text và Annotation trên Sheet giữa Tiếng Việt và Tiếng Trung.
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `sheet_id` (`int`, Bắt buộc): ElementId của Sheet cần dịch.
  - `source_lang` (`string`, Bắt buộc): Ngôn ngữ nguồn (`"vi"` hoặc `"zh"`).
  - `target_lang` (`string`, Bắt buộc): Ngôn ngữ đích (`"zh"` hoặc `"vi"`).
  - `preserve_terms` (`bool`, Tùy chọn): Giữ nguyên các thuật ngữ kỹ thuật viết tắt (ví dụ `D20`, `a200`, `C30`), mặc định `true`.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "translated_count": 32 }
  ```
- **Xử lý lỗi:** Báo lỗi nếu Sheet không tồn tại hoặc ngôn ngữ không được hỗ trợ.

#### 23. `batch_translate_parameters`
- **Mô tả:** Dịch giá trị các tham số mô tả (Comments, Description, Family Name) hàng loạt giữa Tiếng Việt và Tiếng Trung.
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `element_ids` (`int[]`, Bắt buộc): Danh sách ID phần tử cần dịch tham số.
  - `parameter_names` (`string[]`, Bắt buộc): Tên các tham số cần dịch (ví dụ `["Comments", "Description"]`).
  - `source_lang` (`string`, Bắt buộc): Ngôn ngữ nguồn (`"vi"` / `"zh"`).
  - `target_lang` (`string`, Bắt buộc): Ngôn ngữ đích (`"zh"` / `"vi"`).
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "modified_elements": 18 }
  ```
- **Xử lý lỗi:** Tự động bỏ qua các tham số hệ thống Read-Only.

---

### Nhóm 5: Tạo & Thao Tác Đối Tượng (11 Tools)

#### 24. `create_structural_column`
- **Mô tả:** Tạo cột kết cấu mới theo tọa độ điểm X, Y, Level đáy, Level đỉnh và Family Type.
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `family_name` (`string`, Bắt buộc): Tên Family cột.
  - `type_name` (`string`, Bắt buộc): Tên Type cột (ví dụ `"400x400mm"`).
  - `location` (`double[]`, Bắt buộc): Tọa độ điểm đặt `[X, Y, Z]`.
  - `base_level` (`string`, Bắt buộc): Tên tầng chân cột.
  - `top_level` (`string`, Bắt buộc): Tên tầng đỉnh cột.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "column_id": 90101 }
  ```
- **Xử lý lỗi:** Báo lỗi nếu Family Type hoặc Level không tồn tại trong dự án.

#### 25. `create_structural_beam`
- **Mô tả:** Tạo dầm kết cấu mới nối giữa 2 điểm tọa độ 3D theo Type và Level xác định.
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `family_name` (`string`, Bắt buộc): Tên Family dầm.
  - `type_name` (`string`, Bắt buộc): Tên Type dầm (ví dụ `"300x600mm"`).
  - `start_point` (`double[]`, Bắt buộc): Tọa độ điểm đầu `[X, Y, Z]`.
  - `end_point` (`double[]`, Bắt buộc): Tọa độ điểm cuối `[X, Y, Z]`.
  - `level_name` (`string`, Bắt buộc): Tên tầng liên kết.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "beam_id": 90201 }
  ```
- **Xử lý lỗi:** Báo lỗi nếu 2 điểm trùng nhau hoặc khoảng cách quá ngắn (< 1mm).

#### 26. `create_structural_footing`
- **Mô tả:** Tạo móng đơn / đài móng tại vị trí tọa độ theo Family Type và Level.
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `type_name` (`string`, Bắt buộc): Tên Type móng.
  - `location` (`double[]`, Bắt buộc): Tọa độ đặt `[X, Y, Z]`.
  - `level_name` (`string`, Bắt buộc): Tên tầng đáy móng.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "footing_id": 90301 }
  ```
- **Xử lý lỗi:** Báo lỗi nếu không tìm thấy Type móng.

#### 27. `create_structural_wall`
- **Mô tả:** Tạo tường hoặc vách bê tông kết cấu theo đường thẳng tọa độ, chiều cao và Type.
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `wall_type_name` (`string`, Bắt buộc): Tên Wall Type.
  - `start_point` (`double[]`, Bắt buộc): Tọa độ điểm đầu `[X, Y, Z]`.
  - `end_point` (`double[]`, Bắt buộc): Tọa độ điểm cuối `[X, Y, Z]`.
  - `base_level` (`string`, Bắt buộc): Tên tầng chân vách.
  - `height` (`double`, Bắt buộc): Chiều cao vách (mm).
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "wall_id": 90401 }
  ```
- **Xử lý lỗi:** Báo lỗi nếu Wall Type không phải là cấu kiện chịu lực (`Structural`).

#### 28. `create_structural_floor`
- **Mô tả:** Tạo sàn bê tông kết cấu theo chuỗi đường bao CurveLoop khép kín và Level.
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `floor_type_name` (`string`, Bắt buộc): Tên Floor Type.
  - `boundary_points` (`double[][]`, Bắt buộc): Danh sách tọa độ các đỉnh tạo thành đường bao khép kín `[[x1,y1,z1], [x2,y2,z2], ...]`.
  - `level_name` (`string`, Bắt buộc): Tên tầng đặt sàn.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "floor_id": 90501 }
  ```
- **Xử lý lỗi:** Báo lỗi nếu đường bao không phẳng hoặc không khép kín.

#### 29. `modify_element_parameter`
- **Mô tả:** Gán giá trị mới cho một tham số xác định của phần tử Revit.
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `element_id` (`int`, Bắt buộc): ElementId của phần tử.
  - `parameter_name` (`string`, Bắt buộc): Tên tham số cần gán.
  - `value` (`any`, Bắt buộc): Giá trị gán mới (chuỗi, số thực hoặc nguyên).
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "message": "Tham số Comments đã được cập nhật thành công." }
  ```
- **Xử lý lỗi:** Báo lỗi nếu tham số là Read-Only hoặc sai kiểu dữ liệu.

#### 30. `batch_modify_parameters`
- **Mô tả:** Gán giá trị tham số hàng loạt cho danh sách nhiều phần tử cùng lúc trong một Transaction.
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `element_ids` (`int[]`, Bắt buộc): Danh sách ID phần tử.
  - `parameter_name` (`string`, Bắt buộc): Tên tham số.
  - `value` (`any`, Bắt buộc): Giá trị gán.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "updated_count": 30 }
  ```
- **Xử lý lỗi:** Báo cáo chi tiết các phần tử thất bại nếu có phần tử bị khóa.

#### 31. `delete_elements`
- **Mô tả:** Xóa danh sách phần tử khỏi mô hình Revit theo ElementId.
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `element_ids` (`int[]`, Bắt buộc): Danh sách ID cần xóa.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "deleted_count": 5 }
  ```
- **Xử lý lỗi:** Báo lỗi nếu phần tử đang bị ghim (Pinned) hoặc bị khóa bởi Worksharing.

#### 32. `copy_elements`
- **Mô tả:** Sao chép các phần tử sang Level khác hoặc theo vector tịnh tiến XYZ.
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `element_ids` (`int[]`, Bắt buộc): Danh sách ID phần tử cần nhân bản.
  - `translation_vector` (`double[]`, Bắt buộc): Vector dịch chuyển `[dX, dY, dZ]`.
  - `target_level_name` (`string`, Tùy chọn): Tầng đích nếu copy theo tầng.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "new_element_ids": [91001, 91002] }
  ```
- **Xử lý lỗi:** Báo lỗi nếu Level đích không hợp lệ.

#### 33. `move_elements`
- **Mô tả:** Di chuyển phần tử theo vector không gian XYZ.
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `element_ids` (`int[]`, Bắt buộc): Danh sách ID phần tử.
  - `translation_vector` (`double[]`, Bắt buộc): Vector di chuyển `[dX, dY, dZ]`.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "moved_count": 3 }
  ```
- **Xử lý lỗi:** Báo lỗi nếu phần tử bị ràng buộc hình học không thể dịch chuyển.

#### 34. `rotate_element`
- **Mô tả:** Xoay phần tử quanh trục thẳng đứng Z một góc xác định.
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `element_id` (`int`, Bắt buộc): ElementId của phần tử.
  - `angle_degrees` (`double`, Bắt buộc): Góc xoay tính bằng độ (ví dụ `45.0`, `90.0`).
  - `center_point` (`double[]`, Tùy chọn): Điểm tâm xoay `[X, Y, Z]` (mặc định lấy tâm BoundingBox).
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "message": "Đã xoay phần tử 90 độ." }
  ```
- **Xử lý lỗi:** Báo lỗi nếu phần tử bị ghim (Pinned).

---

### Nhóm 6: Tag & Thống Kê Khối Lượng (5 Tools)

#### 35. `tag_elements_by_category`
- **Mô tả:** Tự động gắn nhãn (Tag) cho tất cả các đối tượng thuộc Category trên một View xác định.
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `view_id` (`int`, Bắt buộc): ElementId của View.
  - `category_name` (`string`, Bắt buộc): Tên Category (ví dụ `"Structural Framing"`).
  - `tag_family_name` (`string`, Tùy chọn): Tên Tag Family mong muốn.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "tagged_count": 28 }
  ```
- **Xử lý lỗi:** Báo lỗi nếu View không hỗ trợ Annotation 2D.

#### 36. `create_material_takeoff_schedule`
- **Mô tả:** Tạo bảng thống kê bóc tách vật liệu (Bê tông, Cốt thép, Ván khuôn) theo tầng và cấu kiện.
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `category_name` (`string`, Bắt buộc): Tên Category cần bóc tách.
  - `schedule_name` (`string`, Tùy chọn): Tên bảng thống kê.
  - `fields` (`string[]`, Bắt buộc): Danh sách tên các trường thông tin cần hiển thị.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "schedule_id": 92001 }
  ```
- **Xử lý lỗi:** Báo lỗi nếu trùng tên Schedule đã có trong dự án.

#### 37. `calculate_concrete_volume`
- **Mô tả:** Tính toán tổng thể tích bê tông ($m^3$) theo cấu kiện, phân khu thi công hoặc tầng.
- **Quyền yêu cầu:** `mcp-read`
- **Tham số đầu vào (Inputs):**
  - `category_filter` (`string`, Tùy chọn): Lọc theo Category (`"Columns"`, `"Framing"`, `"Floors"`).
  - `level_name` (`string`, Tùy chọn): Lọc theo tầng.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "total_volume_m3": 540.8, "breakdown_by_type": {"C400x400": 120.4, "D300x600": 210.2, "San_d150": 210.2} }
  ```
- **Xử lý lỗi:** Bỏ qua các đối tượng rỗng hình học.

#### 38. `calculate_rebar_weight`
- **Mô tả:** Tính toán tổng trọng lượng cốt thép (kg và tấn) phân tách theo từng đường kính ($\Phi 10, \Phi 12, \Phi 20, \dots$).
- **Quyền yêu cầu:** `mcp-read`
- **Tham số đầu vào (Inputs):**
  - `level_name` (`string`, Tùy chọn): Lọc theo tầng.
  - `rebar_ids` (`int[]`, Tùy chọn): Danh sách ID cốt thép cụ thể cần tính.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "total_weight_kg": 18450.0, "total_weight_ton": 18.45, "by_diameter": {"D10": 2100.0, "D20": 9800.0, "D25": 6550.0} }
  ```
- **Xử lý lỗi:** Trả về 0 nếu chưa có cốt thép trong phạm vi truy vấn.

#### 39. `update_schedule_views`
- **Mô tả:** Làm mới và cập nhật lại toàn bộ dữ liệu bảng thống kê hiển thị trên các Sheet.
- **Quyền yêu cầu:** `mcp-write`, `utility-tools`
- **Tham số đầu vào (Inputs):**
  - `schedule_ids` (`int[]`, Tùy chọn): Danh sách ID bảng thống kê cần làm mới (mặc định làm mới tất cả).
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "updated_schedules": 6 }
  ```
- **Xử lý lỗi:** Báo lỗi nếu bảng Schedule đang bị khóa bởi tiến trình khác.

---

### Nhóm 7: Lệnh Điều Khiển Ribbon (15 Tools)

#### 40. `trigger_column_rebar_command`
- **Mô tả:** Kích hoạt lệnh vẽ cốt thép cột từ Ribbon add-in.
- **Quyền yêu cầu:** `column-rebar`
- **Tham số:** `selection_mode` (`string`, Tùy chọn: `"CurrentSelection"` hoặc `"PickOnScreen"`).
- **Đầu ra:** `{ "success": true, "command_status": "Executed" }`

#### 41. `trigger_beam_rebar_command`
- **Mô tả:** Kích hoạt lệnh vẽ cốt thép dầm từ Ribbon add-in.
- **Quyền yêu cầu:** `beam-rebar`
- **Tham số:** `selection_mode` (`string`, Tùy chọn).
- **Đầu ra:** `{ "success": true, "command_status": "Executed" }`

#### 42. `trigger_footing_rebar_command`
- **Mô tả:** Kích hoạt lệnh vẽ cốt thép móng từ Ribbon add-in.
- **Quyền yêu cầu:** `footing-rebar`
- **Tham số:** `selection_mode` (`string`, Tùy chọn).
- **Đầu ra:** `{ "success": true, "command_status": "Executed" }`

#### 43. `trigger_wall_rebar_command`
- **Mô tả:** Kích hoạt lệnh vẽ cốt thép vách từ Ribbon add-in.
- **Quyền yêu cầu:** `wall-rebar`
- **Tham số:** `selection_mode` (`string`, Tùy chọn).
- **Đầu ra:** `{ "success": true, "command_status": "Executed" }`

#### 44. `trigger_beam_drawing_command`
- **Mô tả:** Kích hoạt lệnh tạo bản vẽ dầm liên tục từ Ribbon.
- **Quyền yêu cầu:** `beam-drawing`
- **Tham số:** `beam_ids` (`int[]`, Tùy chọn).
- **Đầu ra:** `{ "success": true, "command_status": "Executed" }`

#### 45. `trigger_footing_drawing_command`
- **Mô tả:** Kích hoạt lệnh tạo bản vẽ móng từ Ribbon.
- **Quyền yêu cầu:** `footing-drawing`
- **Tham số:** `footing_ids` (`int[]`, Tùy chọn).
- **Đầu ra:** `{ "success": true, "command_status": "Executed" }`

#### 46. `trigger_model_from_cad_command`
- **Mô tả:** Kích hoạt công cụ dựng mô hình từ CAD *(Yêu cầu AutoCAD Full 2016+)*.
- **Quyền yêu cầu:** `model-from-cad`
- **Tham số:** `cad_path` (`string`, Tùy chọn).
- **Đầu ra:** `{ "success": true, "command_status": "Executed" }`
- **Xử lý lỗi:** Báo lỗi nếu thiếu AutoCAD Full 2016+.

#### 47. `trigger_dwg_export_command`
- **Mô tả:** Kích hoạt công cụ xuất DWG hàng loạt từ Ribbon *(Yêu cầu AutoCAD Full 2016+)*.
- **Quyền yêu cầu:** `dwg-export`
- **Tham số:** `sheet_ids` (`int[]`, Tùy chọn).
- **Đầu ra:** `{ "success": true, "command_status": "Executed" }`

#### 48. `trigger_license_dialog`
- **Mô tả:** Mở hộp thoại đăng nhập Google OAuth PKCE và kích hoạt bản quyền.
- **Quyền yêu cầu:** *(Miễn phí / Public)*
- **Tham số:** *Không có.*
- **Đầu ra:** `{ "success": true, "dialog_opened": true }`

#### 49. `trigger_settings_dialog`
- **Mô tả:** Mở hộp thoại cấu hình hệ thống & thiết lập preset Add-in.
- **Quyền yêu cầu:** `utility-tools`
- **Tham số:** *Không có.*
- **Đầu ra:** `{ "success": true, "dialog_opened": true }`

#### 50. `trigger_rebar_schedule_command`
- **Mô tả:** Kích hoạt lệnh tạo bảng thống kê cốt thép tự động.
- **Quyền yêu cầu:** `utility-tools`
- **Tham số:** *Không có.*
- **Đầu ra:** `{ "success": true, "command_status": "Executed" }`

#### 51. `trigger_point_cloud_command`
- **Mô tả:** Kích hoạt công cụ xử lý đám mây điểm (Scan to BIM).
- **Quyền yêu cầu:** `point-cloud`
- **Tham số:** *Không có.*
- **Đầu ra:** `{ "success": true, "command_status": "Executed" }`

#### 52. `trigger_chat_ai_window`
- **Mô tả:** Mở cửa sổ bảng điều khiển Chat AI tích hợp trong Revit.
- **Quyền yêu cầu:** `chat-ai`
- **Tham số:** *Không có.*
- **Đầu ra:** `{ "success": true, "window_visible": true }`

#### 53. `trigger_mcp_server_restart`
- **Mô tả:** Khởi động lại dịch vụ MCP Server nội bộ trên cổng 8765.
- **Quyền yêu cầu:** `mcp-read`
- **Tham số:** *Không có.*
- **Đầu ra:** `{ "success": true, "port": 8765, "status": "Restarted" }`

#### 54. `get_ribbon_status`
- **Mô tả:** Kiểm tra trạng thái sẵn sàng của các panel và lệnh trên tab `LDL-STRUCTURAL`.
- **Quyền yêu cầu:** `mcp-read`
- **Tham số:** *Không có.*
- **Đầu ra:** `{ "active_tab": "LDL-STRUCTURAL", "available_commands": ["CR", "BR", "FR", "WR", "SR", "BD", "FD", "CD", "WD", "RS", "MC", "DE", "LM", "LC", "AI", "LA", "ST", "MS"], "license_tier": "Rebar + AI Suite" }`

---

### Nhóm 8: Thực Thi C# Động An Toàn & Tiện Ích Khác (3 Tools)

#### 55. `send_code_to_revit`
- **Mô tả:** Biên dịch Roslyn trong bộ nhớ và thực thi đoạn mã C# động an toàn trong transaction Revit, kèm sandbox kiểm soát timeout 10s và xác nhận an toàn trước khi chạy.
- **Quyền yêu cầu:** `mcp-write`, `chat-ai`
- **Tham số đầu vào (Inputs):**
  - `csharp_code` (`string`, Bắt buộc): Đoạn mã C# tuân thủ cú pháp Revit API.
  - `transaction_name` (`string`, Tùy chọn): Tên Transaction hiển thị trong lịch sử Undo của Revit.
  - `dry_run` (`bool`, Tùy chọn): Chạy thử nghiệm kiểm tra lỗi biên dịch mà không commit vào mô hình, mặc định `false`.
- **Định dạng đầu ra (Outputs):**
  ```json
  { "success": true, "execution_time_ms": 42.5, "result_summary": "Created 12 detail curves.", "compiler_errors": [] }
  ```
- **Xử lý lỗi:** Bắt lỗi cú pháp biên dịch Roslyn, bắt ngoại lệ runtime, tự động hủy bỏ Transaction (`RollBack()`) và ngắt an toàn sau 10 giây nếu phát hiện vòng lặp vô tận.

#### 56. `get_revit_application_info`
- **Mô tả:** Lấy thông tin chi tiết về phiên bản Revit (2022–2027), active document, project info và người dùng hiện hành.
- **Quyền yêu cầu:** `mcp-read`
- **Tham số đầu vào (Inputs):** *Không có.*
- **Định dạng đầu ra (Outputs):**
  ```json
  { "revit_version": "2025", "build_number": "20240410_1515", "document_title": "DuAnChungCu_ThapA.rvt", "document_path": "D:\\Projects\\DuAnChungCu_ThapA.rvt", "is_workshared": true }
  ```
- **Xử lý lỗi:** Trả về `document_title: null` nếu người dùng chưa mở file dự án nào.

#### 57. `ping_mcp_server`
- **Mô tả:** Kiểm tra kết nối liveness và đo độ trễ của RevitAPP MCP Server.
- **Quyền yêu cầu:** *(Miễn phí / Public)*
- **Tham số đầu vào (Inputs):** *Không có.*
- **Định dạng đầu ra (Outputs):**
  ```json
  { "status": "ok", "protocol_version": "2025-11-25", "timestamp": "2026-08-22T07:45:00Z", "latency_ms": 1.2 }
  ```
- **Xử lý lỗi:** Trả về mã lỗi HTTP 500 nếu tiến trình máy chủ nội bộ bị treo.

---

## 5. Chi Tiết Chuỗi Triển Khai Bản Vẽ Thép Liên Tục (Continuous Sheet Generation Pipelines)

RevitAPP cung cấp năng lực tự động hóa khép kín từ khâu nhận diện cấu kiện, đọc bảng tính, mô hình hóa 3D đến khâu tạo bản vẽ và đặt lên Sheet hoàn chỉnh.

### 5.1. Chuỗi Triển Khai Bản Vẽ Dầm Liên Tục Lên Sheet (Beam Pipeline)

```
[1. Kỹ sư chọn dầm hoặc trục]
             │
             ▼
[2. Gọi isolate_continuous_beam_axis] ────► Sắp xếp danh sách dầm từ trục A đến trục D
             │
             ▼
[3. Đọc dữ liệu Excel / Preset] ─────────► Đọc bảng thống kê thép theo Mark dầm
             │
             ▼
[4. Gọi create_beam_rebar] ──────────────► Mô hình hóa thép 3D: thép gối L/3, thép nhịp L/2, đai dày
             │
             ▼
[5. Tạo ViewSection dọc dầm] ────────────► Cắt mặt cắt dọc tâm trục, áp dụng View Template dầm
             │
             ▼
[6. Tạo ViewSection ngang qua gối/nhịp] ──► Cắt tự động các mặt cắt 1-1, 2-2, 3-3 qua các dầm
             │
             ▼
[7. Gọi generate_beam_drawing_sheet] ────► Tạo Sheet mới (ví dụ KC-201), chèn Khung tên Titleblock
             │
             ▼
[8. Bố trí Viewport & Gắn Rebar Tag] ────► Tự động căn chỉnh Viewport thẳng hàng, gọi tag_rebar_elements
             │
             ▼
[9. Gắn Bảng Rebar Schedule] ────────────► Gọi create_rebar_schedule, đặt bảng uốn thép vào góc Sheet
```

---

### 5.2. Chuỗi Triển Khai Bản Vẽ Móng Liên Tục Lên Sheet (Footing Pipeline)

```
[1. Kỹ sư chọn nhóm đài móng]
             │
             ▼
[2. Áp dụng Preset móng (e.g. V1)] ──────► Gọi create_footing_rebar: lưới đáy, lưới trên, chân chó, râu cột
             │
             ▼
[3. Gọi generate_footing_drawing_sheet] ─► Tạo Sheet chi tiết kết cấu móng mới
             │
             ▼
[4. Tạo Mặt bằng định vị móng] ──────────► Cắt mặt bằng cao độ đáy đài, tự động gắn Tag móng
             │
             ▼
[5. Tạo Mặt cắt 1-1 & 2-2 qua đài] ──────► Cắt dọc và ngang qua tâm đài móng, hiển thị thép
             │
             ▼
[6. Đặt Viewport & Gắn Bar Schedule] ────► Căn chỉnh khung tên, xuất bảng thống kê khối lượng uốn thép
```

---

## 6. Bảng Mã Lỗi & Hướng Dẫn Khắc Phục Sự Cố (Error Codes & Troubleshooting)

| Mã Lỗi (Error Code) | HTTP Status | Nguyên Nhân Gây Ra | Hướng Dẫn Xử Lý & Khắc Phục |
|---|:---:|---|---|
| `PORT_IN_USE` | `500` | Cổng Loopback `8765` đang bị ứng dụng khác chiếm dụng. | Vào Ribbon tab `LDL-STRUCTURAL` -> `Settings & Presets`, cấu hình cổng thay thế và khởi động lại dịch vụ. |
| `INVALID_BEARER_TOKEN` | `401` | Token gửi trong header `Authorization` không khớp với file cục bộ. | Mở file `%LocalAppData%\RevitAPP\mcp-access-token.txt`, sao chép lại chuỗi token chính xác vào cấu hình client. |
| `FEATURE_NOT_LICENSED` | `403` | Tài khoản chưa mua gói chứa tính năng yêu cầu (ví dụ: gọi `create_beam_rebar` khi chỉ có `utility-tools`). | Nâng cấp gói bản quyền tại website hoặc kích hoạt gói Dùng thử 14 ngày Full tính năng. |
| `UNAUTHORIZED_WRITE` | `403` | Client gọi công cụ sửa đổi mô hình nhưng tài khoản chỉ có quyền `mcp-read`. | Đăng nhập tài khoản có license hỗ trợ quyền `mcp-write`. |
| `NO_ACTIVE_DOCUMENT` | `400` | Chưa mở bất kỳ dự án hoặc file `.rvt` nào trong Revit. | Mở một dự án kết cấu trong Revit trước khi gửi lệnh MCP. |
| `ELEMENT_NOT_FOUND` | `404` | Danh sách `element_ids` chứa ID không tồn tại trong Document hiện hành. | Gọi `get_selected_elements` hoặc `query_elements_by_category` để lấy danh sách ID mới nhất. |
| `AUTOCAD_NOT_INSTALLED` | `503` | Kích hoạt công cụ `model-from-cad` hoặc `dwg-export` nhưng máy chưa cài AutoCAD Full 2016+. | Cài đặt AutoCAD bản Full phiên bản từ 2016 trở lên (AutoCAD LT không hỗ trợ COM Automation API). |
| `ROS_COMPILATION_TIMEOUT` | `408` | Mã C# gửi qua `send_code_to_revit` chạy quá thời gian tối đa 10 giây hoặc chứa vòng lặp vô tận. | Tối ưu hóa mã nguồn C#, chia nhỏ thành các hàm ngắn và kiểm tra điều kiện dừng của vòng lặp. |
| `TRANSACTION_ROLLBACK` | `409` | Thao tác can thiệp mô hình bị hủy do vi phạm ràng buộc hình học hoặc người dùng bấm "Hủy" trên hộp thoại xác nhận. | Kiểm tra thông báo chi tiết trả về trong trường `message` và kiểm tra lại thông số đầu vào. |
| `OFFLINE_GRACE_EXPIRED` | `403` | Máy trạm mất kết nối Internet quá 24 giờ kể từ lần kiểm tra bản quyền gần nhất. | Kết nối lại Internet để Add-in tự động xác thực lại quyền hạn với License Server. |

---

## 7. Kết Luận

Tài liệu này là đặc tả kỹ thuật chính thức và toàn diện nhất cho toàn bộ hệ thống **RevitAPP MCP Server**, bao gồm 18 lệnh Ribbon trên tab `LDL-STRUCTURAL`, 57 công cụ MCP chuẩn hóa và các chuỗi pipeline tự động hóa triển khai bản vẽ cốt thép. Mọi nhà phát triển và kỹ sư AI cần tuân thủ nghiêm ngặt các định dạng tham số và cơ chế an toàn nêu trên.
