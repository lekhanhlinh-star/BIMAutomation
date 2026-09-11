# Phân tích nghiệp vụ BIMAutomation AI Visualizer

Ngày đánh giá: 2026-09-07  
Phạm vi: trang `http://localhost:5175/`, PRD và mã nguồn liên quan trong workspace hiện tại.

## Kết luận điều hành

Sản phẩm hiện tại là một **web AI image-to-image có preset kiến trúc**, chưa phải một **Revit-aware rendering workflow** đúng với định vị trong PRD. Phần mạnh là danh mục phong cách/vật liệu Việt Nam và thao tác so sánh ảnh. Phần còn thiếu lại chính là lợi thế khiến kiến trúc sư/BIM user trả tiền: lấy Current View trực tiếp, metadata BIM, ElementId/mask, lịch sử theo Project/View, kiểm soát credit, hàng đợi, nghiệm thu sai lệch hình học và quy trình Final 2K.

Không nên quảng bá kết quả là BIM-perfect hoặc “khóa 100%” khi dữ liệu đầu vào chỉ là một ảnh RGB và cơ chế bảo toàn hiện chủ yếu là prompt. Sản phẩm nên được định vị là **ảnh concept/presentation có ưu tiên giữ hình học**, cho đến khi có pipeline mask/depth/edge và kiểm tra đầu ra.

## Luồng nghiệp vụ hiện tại

1. Người dùng tải thủ công một ảnh từ Revit/SketchUp/Rhino/3ds Max.
2. Chọn Interior/Exterior, phong cách, ánh sáng, bối cảnh và 5 nhóm vật liệu.
3. Chọn mức Strict/Balanced/Creative và các “khóa”.
4. Gửi ảnh trực tiếp đến AI rendering microservice theo kiểu đồng bộ.
5. Nhận ảnh, so sánh trực quan và tải về.

Luồng mục tiêu nên là:

`Revit Current/Saved View → tiền kiểm view → capture RGB + BIM metadata/masks → báo credit/ETA → async render → kiểm tra geometry drift → duyệt Preview 1K → Final 2K → lưu lịch sử theo Project/View`

## Các vấn đề nghiệp vụ cần sửa

### P0 — Phải sửa trước khi beta trả phí

1. **Sai khớp giữa định vị và sản phẩm thực tế.** PRD bán “one-click trong Revit”, nhưng giao diện đang yêu cầu upload ảnh thủ công; workspace hiện tại cũng không có mã nguồn `.cs`, `.addin`, `.csproj` hoặc `.sln` cho add-in. Nếu add-in nằm ở repo khác cần tích hợp và đưa nó thành điểm vào chính; nếu chưa có, phải đổi thông điệp thành web visualizer thử nghiệm.

2. **Cam kết “khóa 100%” không có cơ sở kỹ thuật.** Pipeline hiện nhận ảnh RGB và biên dịch prompt. `scene_analysis_dict` được đặt `None`; không thấy depth map, edge map, semantic/ElementId mask hoặc bước validation. Một ảnh phối cảnh không đủ suy ra chính xác cao độ tầng, lưới trục, kích thước cửa, độ dốc mái hay cấu kiện bị che khuất.

3. **Frontend đang đi thẳng vào AI microservice.** Giao diện gọi `/api/v1/render` đồng bộ trên service 8010, trong khi backend thương mại có route async riêng `/api/v1/rendering/render`. Vì vậy luồng đang bỏ qua xác thực, entitlement, credit ledger, lịch sử, rate limit và job persistence.

4. **Sai cấp chất lượng và lời hứa đầu ra.** Nút ghi “4K”, payload luôn gửi `preview_1k`, còn PRD chỉ định Preview 1K và Final 2K. Cần thống nhất một taxonomy duy nhất và hiển thị chi phí credit trước khi chạy.

5. **Chưa có Selected Element Material Edit.** Đây là một trong các khác biệt chính với Gemini web, nhưng payload chỉ có 5 vật liệu toàn cục; không có `ElementId`, face/material slot hay mask. Không nên coi đây là MVP hoàn chỉnh nếu chức năng này chưa hoạt động.

6. **Chưa có lịch sử theo Project/View và project style.** Không có `project_guid`, `document_guid`, `view_unique_id`, revision hay preset version trong payload. Kết quả không thể truy vết, tái tạo hoặc giữ đồng nhất cho nhiều view trong cùng hồ sơ.

7. **Không có cổng nghiệm thu kỹ thuật.** So sánh slider chỉ giúp nhìn bằng mắt. Cần đo silhouette/edge drift, số lượng và vị trí openings, số tầng, đường mái và sai lệch camera; output vượt ngưỡng phải mang trạng thái Warning/Rejected, không chỉ “Success”.

### P1 — Cần sửa để workflow dùng được trong văn phòng thiết kế

8. **Mô hình vật liệu quá thô.** “Tường/sàn/trần/cửa/chỉ” là các nhóm toàn cục, chưa phân biệt exterior/interior, room, level, type, finish layer hoặc ElementId. Cần hỗ trợ phạm vi áp dụng: toàn view, category, selected elements, selected faces; có texture scale, joint pattern, roughness và màu chuẩn.

9. **Interior/Exterior chưa tách dữ liệu đầy đủ.** Chế độ Interior vẫn hiện chip ngoại thất như sân vườn nhiệt đới, đô thị, cảnh quan đồi thông; vật liệu tường vẫn ưu tiên sơn ngoại thất/đá ong. Preset, placeholder, quick tags và vật liệu phải được lọc theo view type và loại không gian.

10. **Logic Strict/Balanced/Creative mâu thuẫn.** Balanced vẫn hiển thị 5/5 khóa. Prompt nền lại luôn yêu cầu giữ 100% hình học, kể cả khi chọn Creative. Cần định nghĩa rõ edit budget theo từng mode và những khóa nào bắt buộc/được phép tắt.

11. **Tiến trình render chưa phản ánh job thật.** UI chỉ đếm thời gian cục bộ và thanh progress pulse, trong khi endpoint trực tiếp chờ kết quả đồng bộ. Cần job ID, queued/processing/retrying/completed/failed/cancelled, ETA, cancel và retry có kiểm soát credit.

12. **Thiếu nghiệp vụ dữ liệu và riêng tư.** Cần công khai retention của ảnh input/output, quyền xóa, vùng lưu trữ, project confidentiality, audit log và chính sách không dùng dữ liệu khách hàng để huấn luyện nếu đó là cam kết sản phẩm.

## Bộ dữ liệu đầu vào tối thiểu từ Revit

- `project_guid`, `document_guid`, `view_unique_id`, tên view, Revit version và add-in version.
- Projection type, camera eye/target/up vector, crop region, section box, aspect ratio và FOV/lens tương đương.
- RGB image sạch, không selection outline/annotation; độ phân giải tối thiểu theo quality tier.
- Category visibility và thống kê Walls/Floors/Roofs/Doors/Windows/Curtain Panels/Structural Framing/Columns.
- ElementId/UniqueId map hoặc semantic mask; depth/normal/edge map nếu mode Accurate.
- Material map hiện tại và phạm vi thay đổi được phép.
- Ground level, shared coordinates hoặc ít nhất các datum/cao độ nhìn thấy cần bảo toàn.

## Quy tắc nghiệp vụ đề xuất

### Strict

- Chỉ đổi vật liệu, ánh sáng và hậu cảnh trong vùng cho phép.
- Camera, silhouette, tầng, mái, openings và cấu kiện chính là bất biến.
- Bắt buộc có edge/semantic validation; không đạt thì tự retry một lần hoặc trả Warning và hoàn credit phù hợp.

### Balanced

- Giữ camera, khối tích, tầng, mái và openings.
- Cho phép thêm đồ rời, cây, đèn và décor; không cho thêm/xóa tường, cửa, cầu thang hay ban công.

### Creative

- Cho phép thay đổi chi tiết thứ cấp hoặc décor theo edit budget đã công bố.
- Vẫn phải ghi rõ những gì có thể thay đổi; không dùng cùng thông điệp “khóa 100%”.

## Acceptance criteria đề xuất cho MVP thật

1. Từ Current 3D View trong Revit đến render đầu tiên không cần export/upload thủ công.
2. Mọi render có `job_id`, `user_id`, `project_guid`, `view_unique_id`, preset version và credit transaction id.
3. Preview 1K và Final 2K là hai thao tác riêng, giá credit riêng; không hiển thị 4K nếu không tạo 4K.
4. 100% job đi qua auth, entitlement, rate limit và idempotent credit ledger.
5. Lịch sử hiển thị ít nhất 20 kết quả theo Project/View và cho phép tái dùng cấu hình.
6. Selected Element Edit hoạt động cho Wall/Floor với mask; vùng ngoài mask có chỉ số thay đổi dưới ngưỡng benchmark.
7. Strict mode được benchmark trên 20–30 scene; báo cáo riêng các lỗi cửa, mái, tầng, camera và silhouette.
8. Kết quả AI được gắn nhãn “Concept/Presentation — không dùng thay hồ sơ thiết kế/kết cấu/thi công”.

## Thứ tự triển khai khuyến nghị

1. **Đóng khoảng cách lời hứa:** sửa “100%/4K”, thống nhất 1K–2K, phân loại lại Strict/Balanced/Creative.
2. **Nối đúng tuyến thương mại:** frontend/add-in → backend auth/credits → async queue → AI service; bổ sung job/history schema.
3. **Hoàn thiện Revit loop:** capture Current View và metadata, lưu theo Project/View, trả kết quả về đúng view.
4. **Tạo moat kỹ thuật:** ElementId masks, depth/edge/semantic inputs và geometry validation.
5. **Beta có kiểm soát:** benchmark scene chuẩn, thu accepted-render rate, retry rate, cost/accepted render và thời gian từ view đến ảnh duyệt.

## Bằng chứng ảnh

- `02-initial-viewport.png`: luồng bắt đầu bằng upload ảnh thủ công.
- `03-interior-mode.png`: chế độ Interior nhưng dữ liệu gợi ý vẫn lẫn ngoại thất.
- `06-balanced-mode.png`: Balanced vẫn hiển thị toàn bộ khóa đang bật.
- `07-empty-result.png`: khu vực kết quả chỉ có so sánh trực quan và nhắc tới nút ảnh mẫu không tồn tại trên màn hình.

## Giới hạn đánh giá

Chưa chạy một render thật vì thao tác đó cần upload ảnh qua trình duyệt; đánh giá kết quả/quality thực tế cần một bộ scene chuẩn và quyền dùng ảnh test. Các nhận định về nghiệp vụ backend dựa trên mã nguồn hiện có trong workspace; add-in có thể nằm ở repository khác.
