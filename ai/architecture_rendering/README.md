# Demo diễn họa nội thất và ngoại thất

Backend FastAPI cho `frontend_ai_rendering`. Nhận một ảnh Revit, yêu cầu hoàn thiện và bố trí; chưa đọc mô hình BIM hoặc mask.

## Chạy local

```sh
cd ai/architecture_rendering
python -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
# Điền GOOGLE_API_KEY trong .env, không đưa khóa vào frontend.
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8010
```

`MOCK_RENDER_ENABLED=false` là mặc định. Thiếu khóa trả 503, lỗi Gemini trả 502, hết thời gian trả 504; không tự thay bằng mock. Khi chủ động bật mock, health báo `mock`, response có `status=mock` và `metadata.is_mock=true`. Không dùng ảnh mock để đánh giá AI.

## Chạy backend bằng Docker Compose

Từ thư mục gốc `BIMAutomation`, cấu hình `GOOGLE_API_KEY` và `DEFAULT_IMAGE_MODEL=gemini-3.1-flash-image` trong `.env` ở gốc, rồi chạy:

```sh
docker compose up -d --build --no-deps ai_rendering
docker compose ps ai_rendering
docker compose logs --tail 50 ai_rendering
```

API: `http://localhost:8010`; tài liệu: `http://localhost:8010/docs`. Chỉ chạy microservice diễn họa; không cần khởi động database, gateway hoặc Celery cho demo này. Cổng 8010 phải được giải phóng khỏi tiến trình uvicorn local trước khi khởi động container.

Compose chính dùng volume `bimautomation_ai_rendering_storage` để giữ ảnh qua lần tạo lại container. Không dùng `down -v` nếu cần giữ ảnh. Dữ liệu local đã được sao chép vào volume khi chuyển sang Docker trong lần triển khai này; các lượt render Docker tiếp theo nằm trong volume, không tự đồng bộ về thư mục local. Giao diện Vite hiện có vẫn kết nối API ở cổng 8010.

## API và dữ liệu

- `GET /api/v1/presets`: nguồn danh mục duy nhất của frontend; gồm loại ảnh, hai chế độ, mục đích, vật liệu và nhãn bộ phận theo view.
- `GET /api/v1/health`: trạng thái `ready`, `unconfigured` hoặc `mock`; ready chỉ xác nhận đã cấu hình, không kiểm tra hạn mức với Gemini.
- `POST /api/v1/prompt/preview`: nhận `RenderOptions` (không cần ảnh), trả tóm tắt, cấu hình hiệu lực, loại/phiên bản prompt và prompt đã biên dịch.
- `POST /api/v1/render`: các trường giống preview, thêm `image_base64`.
- `POST /api/v1/render/upload`: multipart `file` + `options` chứa JSON giống preview. Cũng nhận các trường rời để tương thích; không trộn hai cách. Các trường `additions`, `revit_metadata` gửi JSON; danh sách khóa/tag cũ chấp nhận JSON hoặc chuỗi phân cách dấu phẩy.
- `/analyze` và `/expand-prompt`: 501, không cung cấp nhận diện hoặc mở rộng ý thiết kế giả.

Ví dụ xem trước:

```json
{
  "view_type": "exterior",
  "geometry_mode": "balanced",
  "wall_material": "wall_grey_stone",
  "wall_material_location": "Mảng tường ban công tầng 2",
  "roof_material": "roof_metal",
  "roof_material_location": "Mái chính nhìn thấy",
  "preservation_notes": "Giữ màu cửa và toàn bộ ô mở",
  "additions": [{"item": "Một chậu cây nhỏ", "location": "Góc sân trước bên trái"}]
}
```

`view_type` bắt buộc là `interior` hoặc `exterior`. `strict` giữ bố trí; `balanced` chỉ thêm món có `item` và `location`. Kiến trúc và góc nhìn luôn giữ. Trường rỗng/null không yêu cầu đổi, không chọn mặc định phong cách. Bỏ vị trí áp dụng nghĩa là bề mặt tương ứng hiện có; vị trí không nhìn thấy hoặc không xác định được phải giữ nguyên, không chuyển vật liệu sang nơi khác.

Các trường vật liệu cũ được giữ, thêm mái/lan can và `<surface>_material_location`. Mã preset phải lấy từ catalog; mã đã cũ hoặc sai view trả 422. Mô tả tự nhập là văn bản, không mã giả có dạng snake_case. `archetype` chỉ ghi nhận gói đã chọn, không tự điền; client điền mọi giá trị trên form và gửi rõ. `quick_tags` chỉ nhận rỗng: bổ sung phải có món và vị trí.

Thông tin dự án/khung nhìn và `revit_metadata` được lưu để nhận diện, không suy đoán cảnh. `space_type`, `render_purpose`, `location_context`, `preservation_notes` và `custom_prompt` tham gia prompt. Trường không khai báo bị từ chối, không âm thầm bỏ qua. `design_stage`, `creative`, `auto` và thay góc máy không thuộc contract mới; client cũ cần cập nhật. Chưa cập nhật gateway trong `backend/` hoặc plugin Revit trong thay đổi này.

Ảnh giới hạn PNG/JPEG/WEBP, 24 MB và 24 triệu điểm ảnh. `quality` truyền `1K`/`2K` đến Gemini; metadata ghi kích thước thực. Nếu AI đổi tỷ lệ ảnh, trả cảnh báo, không kéo giãn hoặc cắt ảnh để che sai lệch.

## Kiểm thử

```sh
GOOGLE_API_KEY='' .venv/bin/python -m pytest tests -q
.venv/bin/python scripts/evaluate_rendering.py --real
# Chỉ chạy lại một ca:
.venv/bin/python scripts/evaluate_rendering.py --real --case exterior_balanced
```

Unit/API tests bật mock có chủ đích và ghi file vào thư mục tạm. Bộ AI thật gọi Gemini sáu lần: nội thất, ngoại thất gần ngang mắt (ảnh sơ đồ), góc cao thấy mái; mỗi cảnh thử strict/balanced. Kết quả nằm trong `storage/evaluations/<timestamp>` gồm ảnh gốc, prompt/cấu hình, ảnh kết quả, metadata và báo cáo trạng thái. Sau đó phải đọc ảnh để đánh giá; `visual_review=pending` không phải đạt.

Mỗi lượt render thành công lưu ảnh gốc và hồ sơ JSON trong `storage/inputs`, ảnh kết quả trong `storage/outputs`. Hồ sơ yêu cầu không được mount public. Xem [báo cáo kiểm thử lần triển khai](VALIDATION.md) và [quy tắc prompt](PROMPT_DESIGN.md).

### Giữ phương án qua nhiều lần thử

Sau khi tạo và kiểm tra một kết quả, chọn **Giữ kết quả đang xem cho các lần thử tiếp theo** trên form. Phương án này giữ cố định cho tới khi người dùng chủ động thay/bỏ; kết quả mới không tự trở thành tham chiếu. Đổi ảnh gốc hoặc loại khung nhìn sẽ bỏ phương án.

API dùng `reference_render_id` trong cùng `RenderOptions` của preview, JSON và upload. Máy chủ đọc ảnh và cấu hình đã lưu; kiểm tra cùng loại khung nhìn, cùng chế độ thật/mô phỏng, và so sánh pixel RGB ảnh gốc trước khi gọi AI. Hai ảnh được gửi theo thứ tự: ảnh Revit quyết định kiến trúc/góc nhìn, ảnh phương án quyết định diện mạo các phần không đổi. Metadata ghi `reference_render_id`, `source_fingerprint`, `changed_fields` và phiên bản prompt có hậu tố `reference-v1`. Bản xem trước hiển thị các mục thay đổi; xóa một giá trị nghĩa là rút yêu cầu cũ và quay về ảnh gốc cho phần đó.

Đây là tham chiếu ảnh, không phải khóa pixel, seed xác định hay bộ kiểm chứng hình học. Các lần thử vẫn gọi AI thật; không trả ảnh cũ rồi coi như đã render mới. Cần xem kết quả để đánh giá; khóa cứng vùng không đổi cần quy trình chỉnh vùng/compositing hoặc dữ liệu hình học, chưa triển khai trong demo.

Google cũng hướng dẫn đưa ảnh đã tạo vào yêu cầu tiếp theo để duy trì tính nhất quán: https://ai.google.dev/gemini-api/docs/generate-content/image-generation?hl=en
