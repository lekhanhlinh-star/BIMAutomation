"""Single catalog for UI labels and compiler hints; no implicit design defaults."""
from app.schemas.render import PresetItem, ArchetypeItem, PresetsCatalogResponse


def item(id, label, hint="", view="both", description=""):
    return PresetItem(id=id, name_vi=label, name_en=label, prompt_hint=hint,
                      view_type=view, description=description)


class PresetCatalog:
    VIEW_TYPES = [item("interior", "Nội thất"), item("exterior", "Ngoại thất")]
    INTERIOR_STYLES = [
        item("vietnam_modern_apartment", "Hiện đại, trung tính", "Restrained contemporary aesthetic with neutral tonal relationships on existing surfaces.", "interior"),
        item("vietnam_indochine_heritage", "Đông Dương", "Indochine-inspired color relationships and restrained surface patterns on existing elements only.", "interior"),
        item("japandi", "Nhật – Bắc Âu", "Quiet Japandi aesthetic, understated surface texture and low visual contrast.", "interior"),
        item("minimalist", "Tối giản", "Minimal visual texture and restrained tonal variation; retain all existing objects.", "interior"),
        item("warm_luxury", "Sang trọng ấm cúng", "Warm refined luxury aesthetic with layered warm lighting and rich natural textures.", "interior"),
    ]
    EXTERIOR_STYLES = [
        item("vietnam_modern_luxury_villa", "Hiện đại kem ngà", "Contemporary facade aesthetic with warm ivory tone and mineral finish.", "exterior"),
        item("curved_modern_villa", "Biệt thự vòm cong", "Modern villa aesthetic featuring graceful curved arches and refined mineral plaster.", "exterior"),
        item("vietnam_indochine_villa", "Đông Dương", "Indochine-inspired facade color relationships on existing surfaces only.", "exterior"),
        item("vietnam_japanese_roof_villa", "Nhật, mộc giản dị", "Restrained Japanese-inspired surface finish and muted colors; style is not a building typology.", "exterior"),
        item("raw_concrete", "Bê tông mộc", "Understated exposed-material aesthetic on existing surfaces only.", "exterior"),
    ]
    LIGHTING_PRESETS = [
        item("soft_daylight", "Ban ngày, ánh sáng dịu", "Soft daylight with coherent indirect bounce and readable material detail."),
        item("tropical_sunlight", "Nắng trưa nhiệt đới", "Bright crisp daylight with defined architectural cast shadows and clear depth."),
        item("overcast", "Trời nhiều mây", "Diffuse overcast daylight, neutral white balance and soft contact shadows."),
        item("golden_hour", "Nắng cuối chiều", "Warm late-afternoon daylight without excessive orange color cast."),
        item("evening", "Buổi tối, đèn hiện có", "Evening illumination using existing visible fixtures only; retain detail in dark areas."),
    ]
    MATERIAL_PRESETS = []
    WALL_MATERIALS = [
        item("wall_white_paint", "Sơn trắng mờ", "Matte white painted finish on the existing wall."),
        item("wall_microcement_cream", "Vữa khoáng kem ngà", "Warm ivory mineral microcement surface finish with fine tactile grain."),
        item("wall_grey_stone", "Đá xám", "Grey stone surface finish, plausible joint and grain scale."),
        item("wall_concrete", "Bê tông trần", "Exposed concrete surface with subtle pores."),
    ]
    FLOOR_MATERIALS = [
        item("floor_matte_porcelain", "Gạch porcelain mờ", "Matte porcelain tiles with plausible fine grout joints."),
        item("floor_white_oak", "Gỗ sồi sáng", "Light oak floor finish, natural grain at realistic scale.", "interior"),
        item("floor_flamed_basalt", "Đá bazan nhám", "Textured basalt paving on the existing ground surface.", "exterior"),
        item("floor_dark_granite", "Đá granite xám đậm", "Dark grey flamed granite paving with subtle tight joints."),
    ]
    CEILING_MATERIALS = [
        item("ceiling_seamless_white", "Sơn trắng trên trần hiện có", "Matte white finish following the existing ceiling profile.", "interior"),
        item("ceiling_wood_strip", "Trần ốp nan gỗ sồi", "Light oak linear wood slats finish on existing ceiling profile.", "interior"),
        item("ceiling_exposed_concrete", "Bê tông trần", "Exposed concrete finish on the existing ceiling.", "interior"),
    ]
    ROOF_MATERIALS = [
        item("roof_grey_tile", "Ngói xám", "Grey tile finish following the source roof profile, pitch and edges.", "exterior"),
        item("roof_metal", "Tấm lợp kim loại", "Matte metal roofing finish following the existing roof geometry.", "exterior"),
    ]
    DOOR_MATERIALS = [
        item("door_black_aluminium", "Khung nhôm đen, kính trong", "Matte black finish on existing frames; clear glazing in existing glazed areas only."),
        item("door_champagne_aluminium", "Khung nhôm champagne", "Anodized champagne aluminum finish on existing frames; clear architectural glazing."),
        item("door_wood", "Gỗ tự nhiên", "Natural timber finish on existing solid door surfaces; preserve glazed areas."),
    ]
    TRIM_MATERIALS = [item("trim_matte_black", "Kim loại đen mờ", "Matte black finish on existing trim only."), item("trim_painted", "Sơn cùng màu tường", "Paint existing trim to match the adjacent wall, retaining its profile.")]
    RAILING_MATERIALS = [item("railing_black_metal", "Kim loại sơn đen", "Matte black finish on existing railing members, retaining spacing and profiles.", "exterior")]
    CONTEXT_PRESETS = [
        item("neutral_sky", "Bầu trời trung tính", "A restrained neutral sky only in existing background areas.", "exterior"),
        item("window_neutral", "Cảnh ngoài cửa nhẹ, ít chi tiết", "Restrained low-detail distant background through existing windows only.", "interior"),
    ]
    CAMERA_PERSPECTIVES = [item("match_input_view", "Giữ góc nhìn ảnh gốc")]
    GEOMETRY_MODES = [item("staged", "Diễn họa sinh động — AI bổ sung", description="Cho AI bổ sung bối cảnh, đồ rời và trang trí phù hợp; giữ kiến trúc, góc nhìn và lối đi. Chi tiết bổ sung có thể khác giữa các lượt."), item("strict", "Diễn họa", description="Giữ kiến trúc và bố trí hiện có; chỉ diễn họa bề mặt, ánh sáng và nền được yêu cầu."), item("balanced", "Diễn họa có bổ sung bố trí", description="Chỉ thêm đồ, cây hoặc trang trí được chỉ định tại vị trí bạn nhập; giữ kiến trúc và góc nhìn.")]
    PRESERVATION_ELEMENTS = [item("lock_structure", "Giữ kiến trúc"), item("lock_roof", "Giữ mái", view="exterior"), item("lock_fenestration", "Giữ ô cửa"), item("lock_camera", "Giữ góc nhìn"), item("lock_geometric_fidelity", "Giữ hình khối"), item("lock_interior_shell", "Giữ không gian phòng", view="interior"), item("lock_site_context", "Giữ bố trí khu đất", "Keep the existing site objects and their positions unchanged; do not add site objects.", "exterior")]
    QUICK_TAGS = []
    RENDER_PURPOSES = [item("internal_review", "Trao đổi nội bộ", "Prioritize legibility of the visible architecture and finishes."), item("client_presentation", "Trình bày phương án", "Use balanced exposure and realistic surface appearance for design discussion."), item("material_review", "So sánh vật liệu", "Prioritize neutral color reproduction, visible grain and joints; avoid stylized grading."), item("marketing", "Ảnh giới thiệu", "Use polished tonal balance while respecting every preservation constraint.")]
    SURFACE_LABELS = {
        "interior": {"wall": "Tường", "floor": "Sàn", "ceiling": "Trần", "door": "Cửa / khung cửa", "trim": "Chi tiết hoàn thiện"},
        "exterior": {"wall": "Mặt đứng / tường ngoài", "roof": "Mái", "floor": "Sân / nền hiện có", "door": "Cửa / khung cửa", "railing": "Lan can", "trim": "Diềm / chi tiết hoàn thiện"},
    }
    ARCHETYPES = [ArchetypeItem(id="interior_neutral", name_vi="Nội thất trung tính, ánh sáng dịu", view_type="interior", description="Điền phong cách hiện đại và ánh sáng dịu; không thêm đồ.", style="vietnam_modern_apartment", lighting="soft_daylight"), ArchetypeItem(id="exterior_neutral", name_vi="Ngoại thất hiện đại, trời nhiều mây", view_type="exterior", description="Điền phong cách hiện đại và trời nhiều mây; không thêm cảnh quan.", style="vietnam_modern_luxury_villa", lighting="overcast")]

    @classmethod
    def get_catalog(cls):
        return PresetsCatalogResponse(**{key: getattr(cls, key.upper()) for key in PresetsCatalogResponse.model_fields})

    @classmethod
    def groups(cls):
        return {"style": cls.INTERIOR_STYLES + cls.EXTERIOR_STYLES, "lighting": cls.LIGHTING_PRESETS,
                "environment_context": cls.CONTEXT_PRESETS, "material_mood": cls.MATERIAL_PRESETS,
                **{f"{s}_material": getattr(cls, f"{s.upper()}_MATERIALS") for s in ("wall", "floor", "ceiling", "roof", "door", "trim", "railing")}}

    @classmethod
    def hint(cls, field, value):
        match = next((p for p in cls.groups().get(field, []) if p.id == value), None)
        return match.prompt_hint if match else value
