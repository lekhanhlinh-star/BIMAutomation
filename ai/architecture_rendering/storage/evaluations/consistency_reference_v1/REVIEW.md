# Thử giữ phương án cố định — reference-v1

Hai lượt Gemini thật dùng cùng ảnh nội thất gốc, cùng toàn bộ thông số và cùng phương án `rnd_20260907_160518_145d60d6`. `changed_fields` rỗng ở cả hai lượt. Không dùng cache, không mô phỏng; cả hai yêu cầu gọi provider và trả ảnh mới.

Đã xem trực tiếp ảnh phương án và hai ảnh kết quả: giữ bố cục phòng, cửa bên phải, khối treo tường và phân bố hoàn thiện. Không quan sát thấy đồ mới. Vẫn khác nhẹ ở vân sàn, cạnh/khung cửa, sắc độ; **không giống từng pixel**. Chưa có phép đo hình học, chưa đánh giá lặp lại ngoại thất hoặc các yêu cầu đổi vật liệu/ánh sáng trong đợt này.

Đây là kiểm chứng bước đầu trên một ảnh đơn giản, không phải nghiệm thu tính nhất quán cho mọi ảnh. Muốn bảo toàn tuyệt đối phần không sửa cần thêm cơ chế khóa vùng/compositing hoặc ràng buộc hình học, ngoài phạm vi demo hiện tại.

- `source.png`: ảnh gốc.
- `reference.png`, `reference_metadata.json`: phương án cố định và cấu hình đã tạo nó.
- `options.json`: cấu hình gửi cho hai lượt (ảnh gốc được mã hóa riêng khi gửi).
- `trial_1.png`, `trial_2.png`: hai ảnh kết quả.
- `trial_1.json`, `trial_2.json`: phản hồi đầy đủ, gồm prompt thực dùng.
- `report.json`: mã lượt, kích thước, kiểm tra pixel và nhận xét.
