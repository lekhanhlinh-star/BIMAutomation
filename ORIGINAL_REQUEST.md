# Original User Request

## 2026-08-22T07:29:53Z

Tái cấu trúc và nâng cấp toàn diện giao diện người dùng (Frontend React/Tailwind/Vite) cùng tài liệu kỹ thuật quảng bá sản phẩm RevitAPP, đưa tính năng AI & MCP tự động hóa vẽ cốt thép (5 tool Rebar cốt lõi + 57 MCP tools chuẩn hóa) làm điểm bán hàng độc nhất (USP) số 1, loại bỏ triệt để các thông tin không chính xác so với mã nguồn thực tế.

Working directory: /home/linh/Desktop/BIMAutomation
Integrity mode: development

## Requirements

### R1. Tái cấu trúc Trang chủ (HomePage) & Điểm nhấn Hero Prompt Interactive
- Cập nhật Hero Section với tiêu đề chuẩn: "Gõ một câu. Revit tự vẽ xong hệ thép", đoạn mô tả chuẩn hóa mở 57 công cụ qua chuẩn MCP, 5 công cụ vẽ thép hoàn chỉnh, xác nhận trước khi thay đổi mô hình.
- Xây dựng Typewriter/Interactive Prompt Component hiển thị sinh động 3 ca sử dụng thực tế:
  1. Vẽ hệ cột theo preset: `„ Vẽ hệ cột C7 theo cấu hình đã lưu “` (Dò Instance Mark = C7, áp preset theo tầng).
  2. Vẽ thép dầm từ bảng Excel: `„ Vẽ thép cho các dầm đang chọn theo bảng thép trong file Excel này “` (Đọc bảng thép theo Mark, cách ly dầm cùng trục).
  3. Vẽ thép móng theo preset: `„ Vẽ thép cho các móng đang chọn theo preset V1 “` (Lưới đáy/trên, chân chó, đai ngang).
- Xây dựng Section "Vì sao AI vẽ được thép": Nhấn mạnh kiến trúc gọi thẳng vào engine RevitAPP, dùng chung ExternalEvent queue, transaction ownership, license gate, xác nhận thay đổi an toàn trong Revit.
- Xây dựng Section Showcase 5 Tool vẽ thép AI & Chuỗi triển khai bản vẽ dầm/móng lên sheet liên tục.
- Loại bỏ hoàn toàn các thông tin sai lệch theo audit: Gỡ bỏ Auto Dimension độc lập, MEP routing, Batch Rename Sheets, 2-way sync 10k param, fake testimonials.

### R2. Trang Tính năng (FeaturesPage) & Hub Tra cứu 57 Tools MCP Interactive
- Cập nhật hệ thống 18 lệnh Ribbon trên tab `LDL-STRUCTURAL` (Rebar, Drawing Rebar, CAD Tools, Commands).
- Xây dựng Hub/Tab tra cứu tương tác 57 công cụ AI & MCP chia theo 8 nhóm rõ ràng:
  1. Vẽ thép & Bản vẽ kết cấu (12 tools)
  2. Đọc mô hình & Chọn đối tượng (5 tools)
  3. Xử lý dữ liệu Excel (4 tools)
  4. Dịch bản vẽ Việt / Trung (2 tools)
  5. Tạo & Thao tác đối tượng (11 tools)
  6. Tag & Thống kê khối lượng (5 tools)
  7. Lệnh điều khiển Ribbon (15 tools)
  8. Thực thi C# động an toàn (1 tool `send_code_to_revit`) & Tiện ích khác
- Tích hợp bộ lọc tìm kiếm nhanh theo tên tool / danh mục và hiển thị chi tiết các tham số quan trọng.

### R3. Khu vực Kỹ thuật MCP & Cấu hình AI Client Ngoài (Claude / Cursor)
- Trình bày thông số kỹ thuật MCP chuẩn xác: Streamable HTTP `http://127.0.0.1:8765/mcp`, MCP spec 2025-11-25, Loopback-only, Bearer Token 256-bit tại `%LocalAppData%\RevitAPP\mcp-access-token.txt`.
- Cung cấp hộp mã (Code Box) copy-paste cấu hình nhanh cho `claude_desktop_config.json` và `.cursor/mcp.json`.
- Tạo / cập nhật tài liệu kỹ thuật hoàn chỉnh tại `docs/revit_mcp.md` (hoặc nâng cấp `docs/revit_addin_integration.md`).

### R4. Cập nhật Bảng giá (PricingPage) & Tải về / Kích hoạt (DownloadPage)
- Điều chỉnh trang Bảng giá phản ánh đúng 12 Feature Codes trong code:
  - Gói Dùng thử (14 ngày full tính năng)
  - Gói Cốt thép (Bấm nút thủ công: `column-rebar`, `beam-rebar`, `wall-rebar`, `footing-rebar`, `beam-drawing`, `footing-drawing`)
  - Gói Cốt thép + AI (Mở khóa AI vẽ thép, MCP server, `chat-ai`, `utility-tools`, `mcp-write`)
  - Gói Full Suite (+ `model-from-cad`, `dwg-export`, `point-cloud`)
  - Gói Doanh nghiệp
- Cập nhật trang Download & Kích hoạt:
  - 1 Installer duy nhất `RevitAPP.Installer.exe` tự động nhận diện Revit 2022–2027 vào `%AppData%\Autodesk\Revit\Addins\<năm>`.
  - Kích hoạt qua Google OAuth PKCE, không cần nhập key, license quản lý online tại `https://bimautomation.myminiserver.info`.
  - Nêu rõ yêu cầu hệ thống và điều kiện AutoCAD Full 2016+ cho Model from CAD & DWG Export.

### R5. FAQ & Chuẩn hóa Thương hiệu
- Tích hợp bộ 9 câu hỏi thường gặp (FAQ) chi tiết về độ chính xác AI, an toàn mô hình, bảo mật MCP, tương thích Revit.
- Chuẩn hóa tên thương hiệu toàn bộ website: Tên add-in **RevitAPP**, Tab Ribbon **LDL-STRUCTURAL**.

## Acceptance Criteria

### Content & Technical Fidelity
- [ ] Mọi thông số, tên tool, lệnh ribbon và mã license trên toàn bộ UI và docs khớp 100% với tài liệu và source code.
- [ ] Không còn tồn tại bất kỳ nội dung nào bị liệt kê trong bảng xử lý sai lệch (mục 8 audit).
- [ ] File tài liệu `docs/revit_mcp.md` được tạo mới/cập nhật đầy đủ hướng dẫn kết nối MCP, cấu hình token và danh bạ 57 tools.

### UI Experience & Quality
- [ ] Hero Prompt Typewriter component hoạt động mượt mà, chuyển đổi giữa 3 kịch bản kèm hiển thị kết quả trực quan.
- [ ] Hub tra cứu 57 MCP tools có thanh tìm kiếm (search bar) và bộ lọc filter danh mục theo thời gian thực.
- [ ] Có khối hướng dẫn tích hợp kèm nút Copy JSON config cho Claude Desktop & Cursor.
- [ ] Giao diện responsive 100% trên Desktop, Tablet và Mobile; hỗ trợ hoàn hảo cả Dark Mode và Light Mode.
- [ ] Dự án frontend build thành công (`npm run build`) không có bất kỳ lỗi linter hoặc build error nào.
