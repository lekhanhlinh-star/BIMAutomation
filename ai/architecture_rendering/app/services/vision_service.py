"""Automatic scene analysis is deliberately unavailable until a real implementation is validated."""

class VisionService:
    async def analyze_scene(self, image):
        raise NotImplementedError("Chọn Nội thất hoặc Ngoại thất; chưa hỗ trợ phân tích tự động.")

    async def expand_prompt(self, short_input, view_type):
        raise NotImplementedError("Nhập yêu cầu trực tiếp; không tự mở rộng ý thiết kế.")

vision_service = VisionService()
