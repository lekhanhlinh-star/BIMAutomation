# Kết quả kiểm thử triển khai — 07/09/2026

## Phần mềm

- Backend: **50 passed** bằng `GOOGLE_API_KEY='' .venv/bin/python -m pytest tests -q`. Một cảnh báo deprecation từ Starlette/AnyIO, không phải lỗi test.
- Frontend: **4 passed** bằng `npm test`; `npm run lint` không lỗi/cảnh báo; `npm run build` thành công.
- Backend tests: compiler độc lập; bắt buộc view; hai chế độ; custom vật liệu/vị trí; trường rỗng không có default thiết kế; gói mẫu không tự merge; sai view/ID trả 422; scope xung đột; JSON/upload/preview cùng prompt và effective options; ảnh hỏng; provider thiếu khóa/lỗi; 2K được truyền đến provider; mock có nhãn; prompt dài không bị giới hạn như input người dùng.

## Trình duyệt và proxy

Kiểm tra trực tiếp Chrome với Vite và nginx dùng backend mock riêng, không dựa riêng vào request giả lập:

- Chọn mẫu nội thất mở trần/sàn, chọn ngoại thất mở mái/sân/lan can và bỏ trần.
- Nhập vật liệu tường và vị trí, backend tóm tắt đúng; render mock hiển thị nhãn rõ.
- Chọn gói mẫu rồi bỏ phong cách/ánh sáng: tóm tắt và kết quả không khôi phục chúng.
- Chuyển view xóa mô tả riêng; chuyển strict xóa món bổ sung và có thông báo.
- Kéo slider bằng Home/End: clip-path 100%/0%, lớp ảnh vẫn giữ toàn kích thước.
- Xem song song và chỉ ảnh kết quả hoạt động.
- Đổi ảnh từ mẫu mái sang nội thất sau render: ảnh gốc của kết quả cũ vẫn giữ nguyên (đối chiếu trực tiếp src); thông báo kết quả cũ hiện đúng.
- Kiểm tra màn hình 390 × 844: không tràn ngang; bảng chuyển sang một cột. Đã trả viewport về mặc định sau kiểm tra.
- Dừng backend mock: nginx giữ mã **502**, UI hiện lỗi và nút tải lại danh mục. Khôi phục backend, bấm thử lại tải được danh mục.
- `nginx -t` đạt với file cấu hình thật. Kiểm thử chức năng dùng cùng cấu hình, chỉ đổi cổng listen 18080 và upstream 18010 để không ảnh hưởng dịch vụ khác: API, mẫu, output, SPA trả 200; asset thiếu trả 404.
- Vite proxy `/api`, `/sample_data` đã kiểm tra. Tiến trình local cổng 8010 được khởi động lại với cấu hình môi trường cũ để nạp backend mới; health `ready`, mock tắt. Vite đang chạy cổng 5175 nối được backend mới. `/studio/` và JS build qua cổng 8010 trả 200.

## Gemini thật

Xem [bộ ảnh và nhận xét sáu ca](storage/evaluations/accepted_plan_review/REVIEW.md), [báo cáo máy đọc](storage/evaluations/accepted_plan_review/report.json).

Model: `gemini-3.1-flash-image`; prompt cuối `2026-09-07.3`; chất lượng yêu cầu 1K. Sáu ca cuối đều nhận ảnh thật, có ảnh gốc/cấu hình/prompt/metadata để đối chiếu. Các lượt trước và lỗi trung gian vẫn được giữ trong thư mục có timestamp; không đánh đồng API success với chất lượng bảo toàn.

**Chưa xác nhận đạt để tích hợp Revit:** ca ngoại thất balanced vẫn tự tạo cửa tầng dưới và tăng nền sân. Các ca khác giữ được bố cục chính nhưng còn thay đổi vật liệu không chỉ định hoặc chi tiết cần người dùng đánh giá. Đây là quan sát một lượt cho mỗi ca, chưa đo xác suất lỗi qua nhiều lần chạy. Ảnh nội thất và ngoại thất gần ngang mắt là sơ đồ mẫu đơn giản, không phải bộ xuất Revit thực tế đầy đủ. Cần thêm ảnh dự án thực trước khi chốt chất lượng.

## Thay đổi tương thích

Demo contract mới bắt buộc `interior`/`exterior`, từ chối `auto`, `creative`, thay góc máy, `design_stage` và tag thêm chi tiết kiểu cũ. Mã danh mục cũ không còn phù hợp trả 422. Năm trường vật liệu cũ giữ lại; thêm mái, lan can và vị trí. Chưa chỉnh gateway `backend/` hoặc plugin Revit; cần đồng bộ chúng ở bước tích hợp sau.

## Chuyển backend sang Docker

Theo yêu cầu tiếp theo, backend hiện chạy bằng service Compose `ai_rendering`, container `bimautomation_ai_rendering`, cổng 8010. Đã dừng tiến trình local trên cổng này. Image chạy lại đủ 50 test thành công; `.env`, `.venv` và storage không nằm trong build context. Cấu hình model lấy từ `.env` gốc, mock tắt.

Đã sao chép dữ liệu render local vào volume mới `bimautomation_ai_rendering_storage`, kiểm tra hash một ảnh kết quả cũ qua HTTP khớp bản local. Hai preview trả prompt `2026-09-07.3`, docs trả 200, frontend Vite cổng 5175 kết nối API Docker báo ready. Các container khác không bị khởi động lại. Các tiến trình/container kiểm thử tạm đã được dọn.

## Giữ nhất quán giữa các lần thử — reference-v1 (2026-09-07)

- Backend: 57 tests passed ở môi trường local và trong Docker image. Bao gồm tham chiếu cố định qua nhiều lượt; preview/JSON/upload tương đương; hai ảnh gửi đúng thứ tự; xóa vật liệu; chuyển balanced sang strict; từ chối sai ảnh gốc/sai view/sai chế độ mock, ID không hợp lệ hoặc file đã mất.
- Frontend: 5 state tests passed; lint/build passed. Liên kết tham chiếu đúng ảnh và view; nút chọn/bỏ, ảnh thu nhỏ và danh sách mục thay đổi đã thêm. Chưa kiểm thử tương tác nút trên browser trong đợt này: kết nối browser cũ không khả dụng, danh sách browser hiện rỗng.
- Docker `ai_rendering` đã rebuild/recreate, healthy; Gemini thật, mock tắt, giữ volume dữ liệu.
- Hai lượt Gemini thật cùng ảnh nội thất, cùng thông số, cùng phương án: API success; đã xem cả hai ảnh và ảnh tham chiếu. Bố cục/cửa/khối treo tường nhất quán về tổng thể; vẫn sai khác nhỏ ở vân sàn và cạnh cửa. Không giống từng pixel, chưa nghiệm thu khóa tuyệt đối. Chưa mở rộng đánh giá sang ngoại thất hoặc các mục thay đổi.
- Ảnh, options, prompt, metadata, kết luận: [consistency_reference_v1/REVIEW.md](storage/evaluations/consistency_reference_v1/REVIEW.md).

## Flash photographic prompt v4

62 backend tests pass, including scope/preservation and absence of sample-specific design defaults. Six real Flash calls compare v3/v4 across interior, simple facade and elevated roof, using identical options per pair. All responses succeeded; manual visual inspection found partial improvements and remaining hallucinated surface/window details. No exact-target acceptance: the user's attached source has not been run without an accessible file path. See [A/B review](storage/evaluations/flash_photoreal_v4/REVIEW.md). No frontend controls or API schema changed.
