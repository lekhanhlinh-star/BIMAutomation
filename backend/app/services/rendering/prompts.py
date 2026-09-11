from typing import Optional, List, Dict
from app.services.rendering.preset_service import PresetCatalog

def _build_pbr_material_directive(material_mood: str) -> str:
    """Generates physically-based rendering (PBR) material descriptions tailored to the mood."""
    n_mat = PresetCatalog.normalize_id(material_mood)
    if n_mat == "vietnam_walnut_stone":
        return (
            "Authentic Physical Materials: Natural North American black walnut millwork with fine swirling wood grain and silky satin polyurethane finish, "
            "paired with honed bookmatched Calacatta gold marble focal slabs showing grey-gold veining, full-grain Italian leather, and brushed champagne bronze trims."
        )
    elif n_mat == "vietnam_indochine_cement_tile":
        return (
            "Authentic Physical Materials: Handcrafted decorative encaustic cement tiles with classical geometric Indochine floral patterns and smooth matte patina, "
            "contrasted with dark-stained solid teak timber joinery and natural woven rattan cane webbing."
        )
    elif n_mat == "vietnam_breeze_block_conwood":
        return (
            "Authentic Physical Materials: White architectural cement breeze block screen walls with crisp geometric perforations casting intricate shadow play, "
            "combined with exterior Conwood wood-plastic composite ceiling slats with natural timber texture and matte black anodized aluminum window mullions."
        )
    elif n_mat == "vietnam_lava_stone_teak":
        return (
            "Authentic Physical Materials: Dark porous Dong Nai volcanic basalt lava stone wall cladding with natural textural cavities, "
            "weather-resistant natural teak wood louvers with warm amber oil finish, and smooth sand-colored lime plaster."
        )
    elif n_mat == "vietnam_oak_microcement":
        return (
            "Authentic Physical Materials: Natural European white oak timber joinery with soft matte wax finish, "
            "seamless warm beige microcement flooring and walls with delicate artisanal trowel movement, and textured tactile bouclé upholstery."
        )
    elif n_mat == "vietnam_chevron_parquet_glass":
        return (
            "Authentic Physical Materials: Engineered oak hardwood flooring laid in a sophisticated chevron herringbone parquet pattern, "
            "ultra-clear low-iron Low-E architectural double glazing with zero greenish tint, and precision dark graphite aluminum frames."
        )
    elif n_mat == "vietnam_terracotta_brick":
        return (
            "Authentic Physical Materials: Handcrafted artisanal Bat Trang terracotta red clay brickwork with flushed natural lime mortar joints, "
            "contrasted with structural matte black powder-coated steel beams and low-iron architectural glass."
        )
    else:
        return (
            "Authentic Physical Materials: Genuine real-world architectural building finishes with authentic tactile textures, "
            "physically-based optical reflectance, natural roughness, and true physical material depth."
        )


def _build_lighting_physics_directive(lighting: str) -> str:
    """Generates accurate color temperature and atmospheric lighting physics for tropical & temperate environments."""
    n_light = PresetCatalog.normalize_id(lighting)
    if n_light == "vietnam_midday_tropical":
        return (
            "Lighting & Atmospheric Physics: 5600K bright tropical midday sunlight under a vivid azure sky. "
            "Crisp, well-defined architectural cast shadows slicing cleanly through breeze block screens and sun louvers. "
            "Rich ambient daylight bounce filling shaded under-eaves with balanced dynamic range and true material saturation."
        )
    elif n_light == "vietnam_golden_hour":
        return (
            "Lighting & Atmospheric Physics: 3200K rich golden hour sunset light striking surfaces at a low 15-degree angle. "
            "Long, soft-edged dramatic cast shadows stretching across the ground. "
            "Warm amber and coral sky gradation, luminous golden rim lighting along roof edges and balcony perimeters."
        )
    elif n_light == "vietnam_blue_hour_cozy":
        return (
            "Lighting & Atmospheric Physics: Dramatic 7500K deep indigo twilight sky creating a vivid complementary color contrast "
            "against warm 2700K-3000K interior and exterior architectural illumination glowing softly through transparent glass, evoking a warm, inviting residential ambiance."
        )
    elif n_light == "vietnam_morning_dew":
        return (
            "Lighting & Atmospheric Physics: 4500K fresh early morning daylight with pristine atmospheric clarity and a delicate touch of morning mist. "
            "Soft directional sun rays filtering gently through foliage, creating a quiet, contemplative spatial atmosphere."
        )
    elif n_light == "vietnam_overcast_cool":
        return (
            "Lighting & Atmospheric Physics: 6500K soft, diffused ambient skylight filtering through a high thin cloud deck. "
            "Shadowless ambient illumination that reveals pure material colors, subtle texture gradients, and refined joinery without harsh sun glare."
        )
    elif n_light == "vietnam_rainy_tropical":
        return (
            "Lighting & Atmospheric Physics: Atmospheric tropical rainy mood with glistening damp stone pavement creating sharp, luminous reflections "
            "of the warm building lights. Soft rain-washed atmosphere with heightened surface saturation on foliage and stone."
        )
    elif n_light == "vietnam_night_luxury":
        return (
            "Lighting & Atmospheric Physics: Atmospheric nocturnal architectural illumination. "
            "Concealed 3000K warm LED soffit lighting, narrow-beam facade uplights accentuating vertical structural rhythm, "
            "dark night sky with natural depth and zero artificial light pollution."
        )
    else:
        return (
            "Lighting & Atmospheric Physics: Authentic natural daylight exposure with realistic optical dynamic range, "
            "physically balanced bounce lighting, and true-to-life architectural shadow falloff."
        )


def _build_interior_environment_directive(material_mood: str, context_hint: str) -> str:
    """Constructs realistic interior context, ceiling, floor, and furnishings (NO outdoor grass/pool inside!)."""
    ctx_phrase = f" Window View: {context_hint}." if context_hint else " Window View: Floor-to-ceiling clear glazing looking out to a lush green balcony garden or serene soft-focus courtyard."
    return (
        "Interior Spatial & Environmental Detailing: "
        "The ceiling features seamless flat gypsum board with recessed architectural magnetic track lighting channels and concealed indirect 3000K cove light reveals. "
        "The floor is finished in authentic material planks, tiles, or microcement with subtle satin sheen. "
        "The space is furnished with proportionally accurate, designer-grade contemporary furniture (curved sofa, sculptural coffee table, curated art books, textural throw blankets). "
        "Natural indoor indirect light bounces realistically across the floor and walls."
        f"{ctx_phrase}"
    )


def _build_exterior_environment_directive(context_hint: str) -> str:
    """Constructs realistic outdoor site context, landscape, horizon, and ground plane."""
    ctx_phrase = f" Site Context: {context_hint}." if context_hint else " Site Context: Seamlessly grounded in a real outdoor landscape with paved stone pathways, tropical vegetation, and natural horizon."
    return (
        "Exterior Site & Landscape Environment: "
        "The building is solidly and seamlessly grounded in a real physical outdoor terrain. "
        "Manicured green lawn, authentic tropical foliage (Terminalia mantaly trees, cascading curtain creepers, bougainvillea, bird of paradise), "
        "realistic paving stones with natural joint sand, subtle curbs, and an authentic sky with gentle clouds and natural horizon line."
        f"{ctx_phrase}"
    )


def build_architectural_render_prompt(
    view_type: str,
    style: str,
    lighting: str,
    material_mood: str,
    geometry_mode: str,
    environment_context: Optional[str] = None,
    camera_perspective: Optional[str] = None,
    preservation_elements: Optional[List[str]] = None,
    quick_tags: Optional[List[str]] = None,
    custom_prompt: Optional[str] = None,
    scene_description: Optional[str] = None
) -> str:
    """
    Constructs an authoritative architectural visualization prompt based on BIM presets,
    real-world Vietnamese & international architectural practices, optical physics,
    user-selected dropdown configurations, and clicked immutable preservation elements.
    
    CRITICAL DESIGN PRINCIPLES:
    - 100% UI Selection Driven: All parameters mapped from Dropdowns, Toggles, and Checkboxes.
    - Zero-Prompt Ready: 100% self-sufficient when custom_prompt is None or empty.
    - Explicit Invariants: Direct user control over which architectural geometries are strictly locked.
    - Completely separates Interior and Exterior physical environments (no pools/grass inside rooms).
    """
    clean_view_type = "interior" if "interior" in view_type.lower() else "exterior"

    hints = PresetCatalog.resolve_prompt_components(
        view_type=clean_view_type,
        style=style,
        lighting=lighting,
        material_mood=material_mood,
        geometry_mode=geometry_mode,
        environment_context=environment_context,
        camera_perspective=camera_perspective
    )

    # 1. Base Identification
    if clean_view_type == "interior":
        base_identification = (
            "Authentic real-world architectural interior photograph of a completed built residential or commercial space, "
            "photographed on location for Architectural Digest, Dezeen, and Elle Decoration Vietnam."
        )
    else:
        base_identification = (
            "Authentic real-world architectural exterior photograph of a completed physical building on site, "
            "photographed on location for Architectural Digest, Dezeen, and ArchDaily."
        )

    # 2. Architectural Typology & Style
    style_directive = f"Architectural Design Aesthetic: {hints['style_hint']}."

    # 3. BIM Structural & Geometry Preservation (Configured by Clicked Preservation Elements)
    if preservation_elements:
        geom_directive = PresetCatalog.resolve_preservation_directives(preservation_elements, geometry_mode=geometry_mode)
    else:
        geom_directive = hints["geometry_hint"]

    # 4. Physically-Based Materials (PBR)
    material_directive = _build_pbr_material_directive(material_mood)

    # 5. Lighting & Atmospheric Physics
    lighting_directive = _build_lighting_physics_directive(lighting)

    # 6. Environmental Context (Completely separated for Interior vs Exterior)
    if clean_view_type == "interior":
        environment_directive = _build_interior_environment_directive(material_mood, hints["context_hint"])
    else:
        environment_directive = _build_exterior_environment_directive(hints["context_hint"])

    # 7. Camera Optics & Technical Photography Specifications
    n_camera = PresetCatalog.normalize_id(camera_perspective) if camera_perspective else "match_input_view"
    if n_camera in ["match_input_view", "axonometric_high_angle", "drone_aerial"]:
        camera_directive = (
            f"Camera & Optical Specifications: {hints['camera_hint']}. "
            "Shot with professional medium format optical fidelity (Hasselblad H6D-100c), "
            "ISO 100, f/8, crisp edge-to-edge optical sharpness, natural depth of field, "
            "and physically balanced real-world exposure faithfully matching the original vantage point."
        )
    else:
        camera_directive = (
            f"Camera & Optical Specifications: {hints['camera_hint']}. "
            "Shot on medium format camera (Hasselblad H6D-100c or Sony A7R V) with architectural prime tilt-shift lens, "
            "ISO 100, f/8, 1/250s, perfectly leveled vertical lines, natural optical depth of field with edge-to-edge clarity, "
            "and balanced real-world exposure."
        )

    # Compile the foundational 7 pillars
    prompt_parts = [
        base_identification,
        style_directive,
        geom_directive,
        material_directive,
        lighting_directive,
        environment_directive,
        camera_directive
    ]

    # Optional Vision Scene Composition from AI pre-analysis
    if scene_description and scene_description.strip():
        prompt_parts.append(f"Spatial Composition: {scene_description.strip()}.")

    # Feature Addon Tags (Multi-select quick chips)
    tag_phrases = PresetCatalog.resolve_tag_hints(quick_tags, view_type=clean_view_type)
    if tag_phrases:
        tag_text = "; ".join(tag_phrases)
        prompt_parts.append(f"Architectural Feature Enhancements: {tag_text}.")

    # Optional Custom Prompt Nuance Layer (Graceful, non-intrusive)
    if custom_prompt and custom_prompt.strip():
        prompt_parts.append(f"Architect's Specific Custom Nuance: {custom_prompt.strip()}.")

    # Strict Negative Exclusions
    negative_directive = (
        "STRICT NEGATIVE EXCLUSIONS: Absolutely NOT a 3D computer render, NOT CGI, NOT an architectural scale model, "
        "NOT a miniature maquette, NOT a plastic toy house, NOT Lumion, NOT V-Ray, NOT Twinmotion, NOT SketchUp clay view, "
        "NOT video-game graphics, NOT floating on a blank gray plane, NO cartoon illustration, NO artificial glossy plastic sheen, "
        "NO warped geometric lines, NO deformed furniture legs, NO watermarks, NO text overlays."
    )
    prompt_parts.append(negative_directive)

    return " \n".join(prompt_parts)


def build_vision_analysis_prompt(view_type: str = "auto") -> str:
    """Prompt for Gemini vision multimodal analysis of the Revit 3D view."""
    return (
        "You are an expert architectural visualization consultant analyzing an Autodesk Revit 3D model view. "
        "Identify the camera vantage point and height (such as elevated axonometric high-angle looking down at the roof, eye-level pedestrian, frontal elevation, low angle, or aerial drone), "
        "whether the roof surfaces are prominently visible from above, "
        "the main architectural elements (walls, glazing mullions, columns, floor, ceiling, roof, landscape, breeze blocks, skylight), "
        "and produce a concise description of the spatial composition and viewing angle to guide high-fidelity photorealistic rendering."
    )
