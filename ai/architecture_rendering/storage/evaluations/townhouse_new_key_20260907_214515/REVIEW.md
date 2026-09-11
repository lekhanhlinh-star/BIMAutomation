# Kiểm tra key Gemini mới

Đã cập nhật GOOGLE_API_KEY trong .env local, .env module và .env trên server_deploy; đã recreate backend local và server. Không lưu key trong tài liệu.

Đã thử đúng test_data/nha_pho.png với cấu hình v4.json và chất lượng 2K. Google trả 403 Forbidden, GenerateContent bị chặn cho API generativelanguage.googleapis.com. v4_failure.json lưu thông báo đã loại bỏ key. Không tạo được ảnh.

Đã gửi cùng ảnh và cấu hình qua API public của server sau khi cập nhật. API demo trả 502 chung; cần đối chiếu log nhà cung cấp, không dùng health ready làm bằng chứng có quyền tạo ảnh. Không thay prompt hoặc dùng mock để che lỗi.
