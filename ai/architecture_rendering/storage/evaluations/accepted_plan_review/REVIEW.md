# Đối chiếu bộ sáu ca theo kế hoạch

Tất cả là ảnh Gemini thật, prompt `2026-09-07.3`. `partial` là giữ được bố cục chính nhưng còn sai khác/giới hạn cần người dùng đánh giá; không đồng nghĩa đạt để tích hợp. `fail` là thấy rõ thay đổi ngoài yêu cầu.

| Ca | Quan sát | Đánh giá |
|---|---|---|
| [interior_strict](interior_strict.png) | Giữ bố cục phòng, ô cửa và khối treo tường; không thêm đồ. Model tự diễn giải sàn thành gỗ và thêm cảnh mờ ngoài cửa, chưa được chỉ định. | partial |
| [interior_balanced](interior_balanced.png) | Thêm một chậu cây bên trái, không còn sinh cửa mới. Khối treo tường bị đổi từ xám sang trắng dù không chỉ định vật liệu cho khối này. | partial |
| [exterior_strict](exterior_strict.png) | Giữ hai khối chính và bốn ô kính tầng trên, không tự thêm cửa vào. Các chi tiết không xác định trong sơ đồ vẫn được model diễn giải; chưa phải kiểm chứng hình học BIM. | partial |
| [exterior_balanced](exterior_balanced.png) | Thêm chậu cây nhưng đồng thời tạo cửa tầng dưới, tăng nền lát sân và diễn giải sơn trắng thành bề mặt bê tông. Vi phạm phạm vi cho phép. | fail |
| [roof_strict](roof_strict.png) | Giữ góc cao, các khối mái và sân; không thêm mái tiền cảnh hoặc bậc sân lớn như lần trước. Có sai khác chi tiết cửa và bề mặt cần đối chiếu kỹ. | partial |
| [roof_balanced](roof_balanced.png) | Giữ các khối mái chính, thêm một chậu cây ở sân trước. Vật liệu kim loại còn lan sang mái che hiên; cần chỉ định vùng chính xác hơn để đánh giá chi tiết. | partial |

Ảnh gốc: [Nội thất](interior_source.png), [Ngoại thất sơ đồ gần ngang mắt](exterior_source.png), [Góc cao thấy mái](roof_source.png).

Các file *_request.json và *_metadata.json chứa yêu cầu, prompt và provider thực dùng. Chưa có đối chiếu pixel/mask, kích thước Revit hoặc nhiều lần lặp để đo tỷ lệ lỗi. Hai ảnh mẫu đầu là sơ đồ giản lược; không đại diện toàn bộ dự án thực tế.

Lần thử đầu 20260907_160207 phát hiện thêm cửa nội thất và mái tiền cảnh. Sau đó siết prompt; lượt 20260907_160518 có hai lỗi lưu metadata do giới hạn văn bản áp vào prompt dài. Đã sửa và thêm regression test; chỉ chạy lại hai ca đó trong 20260907_160714. Báo cáo tổng hợp giữ liên kết tới lượt gốc, không che lịch sử lỗi.

**Kết luận:** hoàn thành bộ thử phần mềm và thu thập bằng chứng AI thật. Chưa đủ điều kiện xác nhận chất lượng bảo toàn cho tích hợp Revit; ngoại thất có bổ sung là ca lỗi rõ cần tiếp tục xử lý.
