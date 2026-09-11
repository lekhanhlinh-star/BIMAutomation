# Hai bộ prompt theo nghiệp vụ

Phiên bản hiện tại: `2026-09-07.3`.

`prepare_render()` là đầu vào chung cho preview/render: kiểm tra view, danh mục, ràng buộc và vị trí; tạo `RenderOptions` hiệu lực, rồi gọi `build_interior_render_prompt()` hoặc `build_exterior_render_prompt()`. Các compiler dùng chung quy tắc bảo toàn, xử lý vật liệu và định dạng đầu ra, không dùng một template thay chữ interior/exterior.

## Nội thất

Ảnh và loại không gian → giữ vách/cột/dầm/trần/ô cửa/bố trí/góc nhìn → ghi chú bảo toàn → mục đích → vật liệu theo bộ phận và vị trí → thẩm mỹ bề mặt → ánh sáng qua cửa và đèn hiện có → phạm vi bố trí → cảnh ngoài cửa → ghi chú → một ảnh kết quả.

Mảng tường trống phải giữ trống; không bổ sung cửa để “hoàn thiện” căn phòng. Không tự chọn phòng khách, thêm đồ theo phong cách hoặc mở hốc trần để tạo ánh sáng.

## Ngoại thất

Ảnh và loại công trình → giữ hình khối/số tầng/mái/ban công/ô cửa/nền/góc nhìn → ghi chú bảo toàn → mục đích → vật liệu mặt đứng/mái/sân/cửa/lan can/diềm theo vị trí → thẩm mỹ bề mặt → thời điểm/ánh sáng → khu đất/bối cảnh → phạm vi bố trí → điều kiện góc cao nhìn mái → ghi chú → một ảnh kết quả.

Không thêm mái ở tiền cảnh, cửa vào hoặc bậc sân để “hoàn thiện” công trình. Không thay góc nhìn xuống mái bằng góc ngang mắt. Không tự tạo hồ, đường, nhà lân cận hoặc khí hậu địa phương.

## Thứ tự ưu tiên

1. Ảnh gốc, kiến trúc và camera bắt buộc giữ.
2. Ràng buộc bảo toàn bổ sung.
3. Phạm vi strict/balanced, vật liệu và món/vị trí cụ thể.
4. Phong cách và không khí ảnh.

Văn bản người dùng được phân định dạng chuỗi JSON; không được quyền thay thứ tự ưu tiên. Mô tả tự do vẫn có thể chứa mâu thuẫn ngữ nghĩa mà validator không phát hiện được; prompt giữ phần gốc khi xung đột. Đây là chỉ dẫn cho model, không phải cơ chế bảo đảm hình học.

Catalog chỉ mô tả bề mặt và ánh sáng; không chứa gợi ý mái/hồ/đồ nội thất ngầm. Archetype là thao tác điền form, không phải lớp default của backend. `null`/trống không yêu cầu thay đổi, mảng hình thiếu chi tiết được diễn họa trung tính.

## Giới hạn đã quan sát

Kiểm thử API xác nhận đúng dữ liệu được gửi, không chứng minh Gemini giữ mọi cấu kiện. Ca ngoại thất balanced vẫn có thể tạo cửa và nền ngoài yêu cầu. Xem ảnh và nhận xét trong [VALIDATION.md](VALIDATION.md) trước khi quyết định tích hợp Revit.

Cấu hình chất lượng dùng `image_config` của [ChatGoogleGenerativeAI](https://docs.langchain.com/oss/python/integrations/chat/google_generative_ai). Không ép ảnh vào tỷ lệ gần nhất; yêu cầu giữ tỷ lệ tham chiếu và ghi kích thước/cảnh báo thực tế trong metadata.

### Fixed render reference (reference-v1)

Both view compilers retain their original architecture rules. The shared preparation layer adds an explicit consistency section only when the user supplies `reference_render_id`. It compares the stored normalized options against the current options and lists previous/requested values for changed fields. Administrative identity fields cannot authorize visual changes. Unchanged selections are preservation instructions, not invitations to reinterpret. Withdrawn additions are removed without removing Revit objects; cleared material requests return that subject to the original view neutrally.

The provider receives original Revit image first, selected render second. Original architecture wins when they conflict. References are immutable by ID; neither API nor UI promotes the latest result automatically. No deterministic-generation claim is made.

### Photographic translation — 2026-09-07.4

Target: `gemini-3.1-flash-image`. Treat the requested photographic example as a quality benchmark, not a new default scene. Both compilers now distinguish model/linework representation from material evidence: white fill is not automatically white paint, black outlines are not trim, ambiguous geometry is not permission to complete a design.

General surface rules describe roughness, reflectance, scale and existing-edge depth. Glazing rules apply only to identified/requested glazing. Interior light is constrained by the room enclosure; exterior light follows selected weather/time. Existing vegetation proxies may acquire realistic foliage inside their existing envelopes, with count, location and site layout preserved. These are conditional interpretation rules, not default plants, building types, colors or lens settings. Explicit material locations remain authoritative; empty fields remain empty in effective_options.

The fixed render reference flow still applies; a new prompt version does not automatically replace the user's selected reference. See `storage/evaluations/flash_photoreal_v4/REVIEW.md` for the limited A/B evidence. Generation guidance: https://ai.google.dev/gemini-api/docs/generate-content/image-generation
