# Thử Gemini Pro Image — 2026-09-07

Model: `gemini-3-pro-image`, LangChain qua Agent Platform/Vertex Express, ảnh thật 2K.
Nguồn: `source.png` từ `test_data/nha_pho.png`. Các lựa chọn vật liệu và ánh sáng giống nhau giữa hai lượt; không dùng ảnh kết quả làm tham chiếu bổ sung.

| Lượt | Prompt | Thời gian | Ảnh |
|---|---|---|---|
| Pro đối chứng | 2026-09-07.4 | 31.66 giây | [baseline.png](baseline.png) |
| Pro chi tiết | 2026-09-07.5 | 49.35 giây | [detailed.png](detailed.png) |

Cả hai HTTP 200, 2208 × 1920. Cấu hình và prompt đầy đủ trong baseline.json/detailed.json; thông tin lượt chạy trong metrics.json.

## Quan sát

- Prompt mới bổ sung cách xử lý vùng không rõ sau kính, phản xạ vật liệu, bóng đổ, vùng trống và kiểm tra chi tiết trước xuất ảnh. Không hardcode nhà phố, màu vật liệu, cây hay góc máy vào compiler.
- Pro đối chứng tự thêm ốp gỗ dưới mái. Bản chi tiết không còn ốp gỗ ở lượt này nhưng có đường sáng chạy theo gờ cong.
- Cả hai vẫn tự thêm rèm và vạch đường. Bản chi tiết còn biến đổi mép vỉa hè. Chất cảm vẫn giống ảnh dựng hơn ảnh chụp mục tiêu.
- Tỷ lệ ảnh Pro 1.15 so với nguồn 620/546 xấp xỉ 1.136; prompt không bảo đảm chính xác tỷ lệ đầu ra của provider. Đây là ảnh thô từ provider, chưa qua bước xử lý API.
- Chỉ một lượt mỗi prompt; khác biệt có thể do tính ngẫu nhiên, chưa chứng minh cải thiện ổn định. Chưa nghiệm thu bảo toàn hoặc chất lượng ảnh mục tiêu, chưa kiểm chứng nội thất/góc cao với Pro.
