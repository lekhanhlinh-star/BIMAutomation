# Prompt Flash v4 — đối chiếu chất lượng diễn họa

Model: `gemini-3.1-flash-image`. So sánh prompt `2026-09-07.3` và `2026-09-07.4` với cùng ảnh, cùng thông số, chất lượng 1K, strict, ánh sáng dịu. Ba ảnh: nội thất, mặt đứng đơn giản, góc cao thấy mái. Sáu lượt API thật thành công, không mock. Mỗi tổ hợp chỉ thử một lần; sai khác còn chịu ảnh hưởng ngẫu nhiên của model, không đủ để khẳng định cải thiện ổn định.

Ảnh đẹp người dùng gửi là chuẩn chất lượng, không phải mẫu hình học. Không nhúng mô tả nhà hai tầng, xe, màu kem, cây cụ thể hay góc máy của ảnh đó vào compiler. Chưa chạy trực tiếp ảnh người dùng đính kèm vì chưa có đường dẫn file đầu vào.

## Quan sát trực tiếp

- Nội thất: v3 thêm chân đế cho khối treo tường; v4 không thêm chân đế, ánh sáng dịu và độ sâu bề mặt tốt hơn. Cả hai vẫn diễn giải khung cửa và cảnh ngoài cửa.
- Mặt đứng: v4 giữ bố cục, kính gọn hơn; nguồn sơ đồ đơn giản nên chưa đạt độ giàu chi tiết như ảnh target. Không thể dùng nguồn này để nghiệm thu toàn bộ chất lượng mục tiêu.
- Góc cao: v4 rõ ngói, phản xạ và bóng hơn v3. Tuy nhiên có mạch ốp và chất liệu nền chưa chỉ định; còn cần kiểm tra hệ cửa.

Kết luận: có tín hiệu cải thiện hình thức ở một số mẫu, chưa đạt nghiệm thu bảo toàn kiến trúc/vật liệu và chưa xác nhận đạt target của người dùng. Không tự thêm chi tiết từ ảnh target để làm kết quả có vẻ đẹp hơn.

`*_before.json` và `*_after.json` lưu prompt cùng cấu hình; `*_source.png` là ảnh gốc; `*_before.png`, `*_after.png` là kết quả. `report.json` lưu nhận xét từng lượt. `run_comparison.py --real` dùng lại cấu hình đã lưu và gọi API có tính phí; cần sao chép thư mục trước khi chạy lại để giữ bằng chứng cũ.
