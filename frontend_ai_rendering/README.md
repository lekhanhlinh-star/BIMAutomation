# Demo diễn họa từ ảnh Revit

Giao diện tiếng Việt cho kỹ sư: hai luồng nội thất/ngoại thất, bảng vật liệu + vị trí, hai mức diễn họa/bổ sung, xem trước yêu cầu và so sánh đúng ảnh của từng lượt.

## Chạy

```sh
cd frontend_ai_rendering
npm install
npm run dev
```

Vite mặc định cổng 5174, proxy `/api`, `/sample_data`, `/static` sang backend cổng 8010. Để `VITE_API_BASE_URL` trống khi dùng proxy. Khi kiểm thử một backend riêng:

```sh
API_PROXY_TARGET=http://127.0.0.1:18010 npm run dev -- --port 15174
```

Docker/nginx phục vụ `dist` và proxy sang `ai_rendering:8010`. `API_PROXY_TARGET` chỉ dùng cho Vite, không thay DNS trong Docker. Không đưa Gemini key vào frontend. `VITE_API_BASE_URL` chỉ cần khi chủ động dùng API khác origin; cập nhật file `.env` cũ nếu muốn dùng proxy.

## Hành vi

- Chưa chọn nội/ngoại thất thì chưa mở bảng thông số. Chọn ảnh mẫu điền đúng loại ảnh của mẫu.
- Danh mục chỉ từ backend, lỗi tải có nút thử lại; không có danh mục fallback hoặc tự chọn phong cách.
- Chuyển view xóa vật liệu/vị trí, phong cách, ánh sáng, bối cảnh, mô tả không gian, ràng buộc tự nhập và bố trí của view cũ. Tên dự án/khung nhìn, mục đích, chất lượng và chế độ được giữ; có thông báo.
- Chuyển về strict xóa danh sách bổ sung; vật liệu bị bỏ sẽ xóa vị trí đi kèm.
- Preview tự cập nhật sau khi nhập; không gọi AI. Nút render chờ preview hợp lệ, ảnh hợp lệ và trạng thái máy chủ sẵn sàng.
- Khi render, chụp lại ảnh và cấu hình đang gửi. Sửa form/đổi ảnh không làm kết quả cũ ghép với ảnh mới. Có thông báo kết quả thuộc lượt trước.
- So sánh dùng hai ảnh full canvas với `object-fit: contain`, cắt lớp ảnh gốc bằng `clip-path`; kéo thanh không co ảnh. Bàn phím điều khiển thanh được.
- Mock có nhãn rõ; lỗi render không xóa kết quả trước, không hiển thị thành công giả.

## Kiểm thử

```sh
npm test
npm run lint
npm run build
```

Kiểm tra trình duyệt đã thực hiện với backend mock thật qua proxy: tự nhập vật liệu/vị trí, render, kéo 0–100%, đổi view xóa dữ liệu, ảnh kết quả giữ nguồn cũ, strict xóa bổ sung, mobile 390 px, các chế độ so sánh. Xem báo cáo tổng tại `../ai/architecture_rendering/VALIDATION.md`.

Giữ nhất quán: trong bước kiểm tra yêu cầu, chọn **Giữ kết quả đang xem cho các lần thử tiếp theo** sau khi kiểm tra kết quả. Ảnh thu nhỏ hiển thị phương án cố định. Form gửi `reference_render_id` tới cả preview và render; không tự cập nhật theo kết quả mới. Đổi ảnh/loại khung nhìn hoặc bấm **Bỏ phương án cố định** sẽ ngừng dùng tham chiếu. Đây là hỗ trợ giữ nhất quán bằng ảnh, chưa khóa từng vùng ảnh.
