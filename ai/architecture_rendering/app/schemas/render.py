"""Public demo contract. Empty selections never authorize an additional edit."""
from enum import Enum
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ViewType(str, Enum):
    INTERIOR = "interior"
    EXTERIOR = "exterior"


class GeometryMode(str, Enum):
    STRICT = "strict"
    BALANCED = "balanced"
    STAGED = "staged"


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
    description: str
    style: str
    lighting: str
    material_mood: str | None = None
    environment_context: str | None = None
    default_tags: list[str] = Field(default_factory=list)
    prompt_summary: str = ""


class Addition(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    item: str = Field(min_length=1, max_length=300)
    location: str = Field(min_length=1, max_length=500)


class RenderOptions(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    view_type: ViewType
    reference_render_id: str | None = Field(default=None, pattern=r"^rnd_[0-9]{8}_[0-9]{6}_[0-9a-f]{8}$")
    geometry_mode: GeometryMode = GeometryMode.STRICT
    quality: QualityTier = QualityTier.PREVIEW_1K
    project_name: str | None = Field(default=None, max_length=200)
    view_name: str | None = Field(default=None, max_length=200)
    render_purpose: Literal["internal_review", "client_presentation", "material_review", "marketing"] = "internal_review"
    space_type: str | None = Field(default=None, max_length=300)
    location_context: str | None = Field(default=None, max_length=500)
    preservation_notes: str | None = Field(default=None, max_length=2000)
    custom_prompt: str | None = Field(default=None, max_length=2000)
    archetype: str | None = None  # attribution only; never merges defaults
    style: str | None = None
    lighting: str | None = None
    material_mood: str | None = None
    environment_context: str | None = None
    camera_perspective: Literal["match_input_view"] = "match_input_view"
    preservation_elements: list[str] = Field(default_factory=list)
    quick_tags: list[str] = Field(default_factory=list)
    revit_metadata: dict[str, Any] | None = None  # recorded, never used to guess view
    wall_material: str | None = None
    wall_material_location: str | None = None
    floor_material: str | None = None
    floor_material_location: str | None = None
    ceiling_material: str | None = None
    ceiling_material_location: str | None = None
    roof_material: str | None = None
    roof_material_location: str | None = None
    door_material: str | None = None
    door_material_location: str | None = None
    trim_material: str | None = None
    trim_material_location: str | None = None
    railing_material: str | None = None
    railing_material_location: str | None = None
    additions: list[Addition] = Field(default_factory=list, max_length=20)

    @field_validator("*", mode="before")
    @classmethod
    def trim_optional_strings(cls, value, info):
        if isinstance(value, str):
            value = value.strip()
            if len(value) > 4000 and info.field_name not in ("image_base64", "prompt_used"):
                raise ValueError("Nội dung quá dài (tối đa 4000 ký tự).")
            if value == "" and cls.model_fields[info.field_name].default is None:
                return None
        if value is None and info.field_name in ("quick_tags", "preservation_elements"):
            return []
        return value

    @model_validator(mode="after")
    def check_scope(self):
        if self.quick_tags:
            raise ValueError("Thẻ chi tiết cũ không còn hỗ trợ; hãy nhập từng món bổ sung và vị trí.")
        if self.geometry_mode == GeometryMode.STRICT and self.additions:
            raise ValueError("Muốn thêm đồ hoặc cây, chọn Diễn họa có bổ sung bố trí.")
        if self.view_type == ViewType.INTERIOR and (self.roof_material or self.railing_material):
            raise ValueError("Vật liệu mái và lan can ngoài nhà chỉ dùng cho Ngoại thất.")
        if self.view_type == ViewType.EXTERIOR and self.ceiling_material:
            raise ValueError("Vật liệu trần trong phòng chỉ dùng cho Nội thất.")
        for surface in ("wall", "floor", "ceiling", "roof", "door", "trim", "railing"):
            if getattr(self, f"{surface}_material_location") and not getattr(self, f"{surface}_material"):
                raise ValueError(f"Vị trí {surface} cần có vật liệu đi kèm.")
        return self


class RenderRequest(RenderOptions):
    image_base64: str = Field(min_length=1)


class PromptPreview(BaseModel):
    prompt_type: ViewType
    prompt_version: str
    prompt_used: str
    effective_options: RenderOptions
    summary: list[str]
    changed_fields: list[str] = Field(default_factory=list)


class RenderMetadata(RenderOptions):
    render_id: str
    prompt_type: ViewType
    prompt_version: str
    prompt_used: str
    effective_options: RenderOptions
    summary: list[str]
    duration_seconds: float
    dimensions: dict[str, int]
    input_dimensions: dict[str, int]
    provider: str
    model: str
    is_mock: bool = False
    warnings: list[str] = Field(default_factory=list)
    changed_fields: list[str] = Field(default_factory=list)
    source_fingerprint: str | None = None


class RenderResponse(BaseModel):
    status: Literal["success", "mock"]
    render_id: str
    image_url: str
    image_base64: str | None = None
    metadata: RenderMetadata


class PresetsCatalogResponse(BaseModel):
    archetypes: list[ArchetypeItem]
    view_types: list[PresetItem]
    interior_styles: list[PresetItem]
    exterior_styles: list[PresetItem]
    lighting_presets: list[PresetItem]
    material_presets: list[PresetItem]
    wall_materials: list[PresetItem]
    floor_materials: list[PresetItem]
    ceiling_materials: list[PresetItem]
    roof_materials: list[PresetItem]
    door_materials: list[PresetItem]
    trim_materials: list[PresetItem]
    railing_materials: list[PresetItem]
    context_presets: list[PresetItem]
    camera_perspectives: list[PresetItem]
    geometry_modes: list[PresetItem]
    preservation_elements: list[PresetItem]
    quick_tags: list[PresetItem] = Field(default_factory=list)
    render_purposes: list[PresetItem]
    surface_labels: dict[str, dict[str, str]]


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
    google_api_configured: bool
    default_model: str
    mock_mode: bool
