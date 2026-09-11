# Thử lại đúng ảnh người dùng

Nguồn: `test_data/nha_pho.png`, đã xem và xác nhận là ảnh nét nhà phố người dùng gửi. Bản sao: `source.png`.

Cấu hình: `v4.json` gồm toàn bộ lựa chọn, vị trí áp dụng và prompt 2026-09-07.4. Model `gemini-3.1-flash-image`, yêu cầu 2K. Vật liệu/ánh sáng được chọn trong cấu hình thử theo ảnh mục tiêu, không thêm làm mặc định backend. Giữ strict, không tự thêm xe hay vật thể mới.

Hai yêu cầu thực bị trả 429 trước khi tạo ảnh. Chẩn đoán từ phản hồi gốc của Google:

> Your prepayment credits are depleted.

Chi tiết: `v4_failure.json`. Key Gemini ở `.env` gốc và module trùng nhau, không ghi key vào báo cáo.

Chưa tạo được kết quả, chưa có bằng chứng chất lượng mới, chưa sửa hoặc deploy prompt tiếp sau v4. Cần bổ sung số dư trả trước hoặc cấu hình key thuộc project có hạn mức trước khi tiếp tục so sánh. `run_trial.py v4` chạy lại cấu hình hiện tại; `run_trial.py empty` kiểm tra trường hợp bỏ trống vật liệu. Hai lệnh gọi API thật có tính phí; sao lưu kết quả trước khi chạy lại vì tên file cố định.
