"""Pure validation and preparation shared by preview, JSON and multipart rendering."""
import re
from app.schemas.render import RenderOptions, PromptPreview
from app.services.preset_service import PresetCatalog
from app.core.prompts import PROMPT_VERSION, build_interior_render_prompt, build_exterior_render_prompt
from app.services.consistency_service import load_reference, reference_instructions, CONSISTENCY_VERSION


class OptionError(ValueError):
    def __init__(self, field, message):
        self.field = field
        super().__init__(message)


def prepare_render(options: RenderOptions) -> PromptPreview:
    data = options.model_dump(mode="json", exclude={"image_base64"})
    view = data["view_type"]
    all_items = {p.id: (field, p) for field, values in PresetCatalog.groups().items() for p in values}
    for field, values in PresetCatalog.groups().items():
        value = data.get(field)
        if not value:
            continue
        item = next((p for p in values if p.id == value), None)
        if item and item.view_type not in (view, "both"):
            raise OptionError(field, "Lựa chọn không phù hợp với loại khung nhìn. Hãy chọn lại.")
        if not item and (value in all_items or re.fullmatch(r"[a-z][a-z0-9]*_[a-z0-9_]+", value)):
            raise OptionError(field, "Mã lựa chọn không hợp lệ hoặc đã cũ. Hãy tải lại danh mục hoặc nhập mô tả vật liệu.")
    if data["archetype"]:
        preset = next((p for p in PresetCatalog.ARCHETYPES if p.id == data["archetype"]), None)
        if not preset or preset.view_type != view:
            raise OptionError("archetype", "Gói cấu hình không phù hợp. Hãy chọn lại.")
        # Attribution only: every actual value must already be visible in the request.
    locks = list(dict.fromkeys(data["preservation_elements"]))
    for lock in locks:
        item = next((p for p in PresetCatalog.PRESERVATION_ELEMENTS if p.id == lock), None)
        if not item or item.view_type not in (view, "both"):
            raise OptionError("preservation_elements", "Ràng buộc không phù hợp với loại khung nhìn.")
    if "lock_site_context" in locks and (data["additions"] or data["geometry_mode"] == "staged"):
        raise OptionError("additions", "Đang giữ nguyên bố trí khu đất; hãy bỏ yêu cầu bổ sung.")
    required = ["lock_structure", "lock_fenestration", "lock_camera", "lock_geometric_fidelity",
                "lock_interior_shell" if view == "interior" else "lock_roof"]
    data["preservation_elements"] = list(dict.fromkeys(required + locks))
    effective = RenderOptions.model_validate(data)
    compiler = build_interior_render_prompt if view == "interior" else build_exterior_render_prompt
    labels = PresetCatalog.SURFACE_LABELS[view]
    def label(field, value):
        return next((p.name_vi for p in PresetCatalog.groups().get(field, []) if p.id == value), value)
    summary = ["Nội thất" if view == "interior" else "Ngoại thất",
               next(p.name_vi for p in PresetCatalog.GEOMETRY_MODES if p.id == data["geometry_mode"]),
               "Giữ kiến trúc, bố trí hiện có và góc nhìn ảnh gốc",
               "Mục đích: " + next(p.name_vi for p in PresetCatalog.RENDER_PURPOSES if p.id == data["render_purpose"])]
    for field, title in [("project_name", "Dự án"), ("view_name", "Khung nhìn"), ("space_type", "Công trình / không gian"),
                         ("location_context", "Điều kiện địa điểm"), ("style", "Phong cách"), ("lighting", "Ánh sáng"),
                         ("environment_context", "Bối cảnh"), ("material_mood", "Tổng thể vật liệu")]:
        if data[field]:
            summary.append(f"{title}: {label(field, data[field])}")
    for surface, title in labels.items():
        value = data[f"{surface}_material"]
        if value:
            location = data[f"{surface}_material_location"] or "bề mặt tương ứng hiện có trong ảnh"
            summary.append(f"{title}: {label(f'{surface}_material', value)} — {location}")
    summary += [f"Bổ sung: {a.item} — {a.location}" for a in effective.additions]
    if effective.preservation_notes:
        summary.append("Giữ thêm: " + effective.preservation_notes)
    if effective.custom_prompt:
        summary.append("Yêu cầu thêm (trong phạm vi đã chọn): " + effective.custom_prompt)
    summary.append("Mục bỏ trống: không yêu cầu thay đổi; thông tin thiếu được diễn họa trung tính.")
    prompt, version, changed = compiler(effective), PROMPT_VERSION, []
    if effective.reference_render_id:
        try:
            _, previous = load_reference(effective.reference_render_id)
        except ValueError as exc:
            raise OptionError("reference_render_id", str(exc)) from exc
        if previous.view_type != effective.view_type:
            raise OptionError("reference_render_id", "Phương án giữ cố định khác loại Nội thất / Ngoại thất.")
        instructions, changed = reference_instructions(effective, previous)
        prompt += instructions
        version += "+" + CONSISTENCY_VERSION
        summary.append("Giữ phương án đã chọn: " + effective.reference_render_id + "; ảnh Revit gốc vẫn quyết định kiến trúc và góc nhìn.")
        titles = {"geometry_mode": "Chế độ bố trí", "quality": "Độ phân giải", "render_purpose": "Mục đích",
                  "space_type": "Công trình / không gian", "location_context": "Điều kiện địa điểm",
                  "preservation_notes": "Ghi chú giữ nguyên", "custom_prompt": "Yêu cầu thêm",
                  "style": "Phong cách", "lighting": "Ánh sáng", "material_mood": "Tổng thể vật liệu",
                  "environment_context": "Bối cảnh", "preservation_elements": "Ràng buộc bảo toàn",
                  "camera_perspective": "Góc nhìn", "view_type": "Loại khung nhìn", "additions": "Bổ sung bố trí"}
        for surface, title in labels.items():
            titles[f"{surface}_material"] = title
            titles[f"{surface}_material_location"] = "Vị trí " + title.lower()
        summary.append("Mục thay đổi: " + ", ".join(titles.get(key, key) for key in changed) if changed
                       else "Không đổi thông số: yêu cầu AI bám lại phương án cố định, không phát triển thiết kế mới.")
        summary.append("Chỉ điều chỉnh các mục đã đổi so với phương án; các mục khác giữ theo ảnh phương án. AI vẫn cần được đối chiếu.")
    return PromptPreview(prompt_type=view, prompt_version=version, prompt_used=prompt,
                         effective_options=effective, summary=summary, changed_fields=changed)
