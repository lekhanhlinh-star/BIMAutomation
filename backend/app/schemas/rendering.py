from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ViewType(str, Enum):
    AUTO = "auto"
    INTERIOR = "interior"
    EXTERIOR = "exterior"

class GeometryMode(str, Enum):
    STRICT = "strict"
    BALANCED = "balanced"
    CREATIVE = "creative"

class QualityTier(str, Enum):
    PREVIEW_1K = "preview_1k"
    FINAL_2K = "final_2k"

class PresetItem(BaseModel):
    id: str
    name_vi: str
    name_en: str = ""
    view_type: str = "both"
    description: str = ""
    prompt_hint: str = ""

class ArchetypeItem(BaseModel):
    id: str
    name_vi: str
    name_en: str = ""
    view_type: str
    description: str = ""
    style: str
    lighting: str
    material_mood: Optional[str] = None
    environment_context: Optional[str] = None
    default_tags: List[str] = Field(default_factory=list)
    prompt_summary: str = ""

class PreservationItem(BaseModel):
    id: str
    name_vi: str
    name_en: str = ""
    description: str = ""
    target_element: str = ""
    prompt_hint: str = ""

class QuickTagItem(BaseModel):
    id: str
    name_vi: str
    name_en: str = ""
    view_type: str = "both"
    prompt_hint: str = ""

class PresetsCatalogResponse(BaseModel):
    archetypes: List[ArchetypeItem]
    view_types: List[PresetItem]
    interior_styles: List[PresetItem]
    exterior_styles: List[PresetItem]
    lighting_presets: List[PresetItem]
    material_presets: List[PresetItem]
    wall_materials: List[PresetItem] = Field(default_factory=list)
    floor_materials: List[PresetItem] = Field(default_factory=list)
    ceiling_materials: List[PresetItem] = Field(default_factory=list)
    door_materials: List[PresetItem] = Field(default_factory=list)
    trim_materials: List[PresetItem] = Field(default_factory=list)
    context_presets: List[PresetItem]
    camera_perspectives: List[PresetItem]
    geometry_modes: List[PresetItem]
    preservation_elements: List[PreservationItem]
    quick_tags: List[QuickTagItem]

class RenderRequest(BaseModel):
    """Payload for rendering via JSON Base64."""
    image_base64: str = Field(..., description="Chuỗi base64 của ảnh Revit 3D View")
    view_type: Optional[str] = Field(default="exterior", description="Loại phối cảnh: 'exterior' hoặc 'interior'")
    archetype: Optional[str] = Field(default=None, description="Gói phong cách 1-chạm tùy chọn")
    style: Optional[str] = Field(default="vietnam_modern_luxury_villa", description="Mã phong cách kiến trúc từ dropdown")
    lighting: Optional[str] = Field(default="tropical_sunlight", description="Mã ánh sáng & thời tiết từ dropdown")
    material_mood: Optional[str] = Field(default=None, description="Mã mood vật liệu PBR tùy chọn")
    environment_context: Optional[str] = Field(default=None, description="Mã bối cảnh & cảnh quan từ dropdown")
    camera_perspective: Optional[str] = Field(default="match_input_view", description="Mã góc máy hoặc 'match_input_view' để khóa 100% góc ảnh gốc Revit")
    geometry_mode: GeometryMode = Field(default=GeometryMode.STRICT, description="Chế độ bảo toàn hình học BIM từ dropdown")
    quality: QualityTier = Field(default=QualityTier.PREVIEW_1K, description="Cấp chất lượng render")
    preservation_elements: Optional[List[str]] = Field(
        default_factory=lambda: ["lock_structure", "lock_roof", "lock_fenestration", "lock_camera", "lock_geometric_fidelity"],
        description="Danh sách các thành phần kiến trúc bất biến được click chọn để khóa 100% hình khối gốc"
    )
    quick_tags: Optional[List[str]] = Field(default=None, description="Danh sách thẻ tính năng bổ trợ (chọn nhiều cùng lúc)")
    revit_metadata: Optional[Dict[str, Any]] = Field(default=None, description="Metadata từ Revit (view_name, categories...)")
    custom_prompt: Optional[str] = Field(default=None, description="Ghi chú thêm tùy chọn của KTS (không bắt buộc)")
    # 5 specific material fields
    wall_material: Optional[str] = Field(default=None, description="Vật liệu tường")
    floor_material: Optional[str] = Field(default=None, description="Vật liệu sàn")
    ceiling_material: Optional[str] = Field(default=None, description="Vật liệu trần")
    door_material: Optional[str] = Field(default=None, description="Vật liệu cửa")
    trim_material: Optional[str] = Field(default=None, description="Vật liệu chỉ/trang trí")

class RenderMetadata(BaseModel):
    render_id: str
    view_type: str
    archetype: Optional[str] = None
    style: str
    lighting: str
    material_mood: Optional[str] = None
    wall_material: Optional[str] = None
    floor_material: Optional[str] = None
    ceiling_material: Optional[str] = None
    door_material: Optional[str] = None
    trim_material: Optional[str] = None
    environment_context: Optional[str] = None
    camera_perspective: Optional[str] = None
    geometry_mode: str
    quality: str
    preservation_elements: List[str] = Field(default_factory=list)
    quick_tags: List[str] = Field(default_factory=list)
    prompt_used: str
    duration_seconds: float
    dimensions: Dict[str, int]
    provider: str
    model: str
    scene_analysis: Optional[Dict[str, Any]] = None

class RenderResponse(BaseModel):
    status: str = Field(default="success", description="Trạng thái render (success / error)")
    render_id: str = Field(..., description="Mã định danh duy nhất của lượt render")
    image_url: str = Field(..., description="Đường dẫn HTTP trực tiếp để xem/tải ảnh kết quả")
    image_base64: Optional[str] = Field(default=None, description="Chuỗi base64 của ảnh kết quả")
    metadata: RenderMetadata = Field(..., description="Thông tin chi tiết về quá trình render")

class RenderTaskStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"

class RenderTaskResponse(BaseModel):
    task_id: str = Field(..., description="ID định danh tác vụ trong hàng đợi Celery")
    status: RenderTaskStatus = Field(..., description="Trạng thái xử lý của tác vụ")
    progress: int = Field(default=0, description="Tiến độ hoàn thành (0 - 100%)")
    message: Optional[str] = Field(default=None, description="Thông điệp trạng thái hiện tại")
    result: Optional[RenderResponse] = Field(default=None, description="Kết quả render khi task hoàn tất thành công")
    error: Optional[str] = Field(default=None, description="Chi tiết lỗi nếu task thất bại")
