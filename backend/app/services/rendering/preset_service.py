from typing import Dict, Any, List, Optional
from app.schemas.rendering import (
    PresetItem,
    ArchetypeItem,
    QuickTagItem,
    PreservationItem,
    PresetsCatalogResponse
)

class PresetCatalog:
    """
    Comprehensive architectural catalog providing rich multi-option presets,
    1-click curated archetypes tailored for Vietnam architecture and international styles,
    and quick feature tags for zero-prompt and advanced rendering.
    """

    VIEW_TYPES: List[PresetItem] = [
        PresetItem(
            id="interior",
            name_vi="Nội thất (Interior View)",
            name_en="Interior View",
            description="Không gian bên trong: phòng khách, phòng ngủ, bếp, thông tầng giếng trời, văn phòng",
            prompt_hint="architectural interior photography, indoor space, enclosed built environment"
        ),
        PresetItem(
            id="exterior",
            name_vi="Ngoại thất (Exterior View)",
            name_en="Exterior View",
            description="Mặt ngoài công trình: mặt đứng nhà phố, biệt thự sân vườn, cảnh quan, shophouse",
            prompt_hint="architectural exterior photography, building facade, outdoor landscape"
        ),
        PresetItem(
            id="auto",
            name_vi="Tự động nhận diện (AI Vision Auto-Pilot)",
            name_en="Auto Detect",
            description="AI tự động phân tích ảnh 3D Revit để xác định không gian nội thất hoặc ngoại thất",
            prompt_hint="intelligent scene classification"
        )
    ]

    # --- 1. ARCHITECTURAL STYLES (ĐẬM CHẤT THỰC TẾ VIỆT NAM & QUỐC TẾ) ---
    INTERIOR_STYLES: List[PresetItem] = [
        # Vietnam Real-World Styles
        PresetItem(
            id="vietnam_indochine_heritage",
            name_vi="Đông Dương Di sản (Indochine Heritage) - Rất chuộng tại VN",
            name_en="Indochine Heritage",
            description="Gạch bông hoa văn cổ điển, gỗ nâu đen, mây đan mắt cáo, quạt trần cổ cánh gỗ, tranh sơn mài hoa sen",
            prompt_hint="authentic Indochine interior style, classical patterned encaustic cement tiles, dark stained teak woodwork with delicate carvings, natural rattan cane webbing on cabinetry and chair backs, antique wooden ceiling fan, serene lacquer lotus artwork"
        ),
        PresetItem(
            id="vietnam_luxury_walnut",
            name_vi="Gỗ Óc Chó Thượng Lưu (Vinhomes Luxury Walnut) - Số 1 Biệt thự VN",
            name_en="Vinhomes Luxury Walnut",
            description="Gỗ óc chó Bắc Mỹ vân cuộn sóng tự nhiên sơn bóng mờ satin, đá cẩm thạch Calacatta, sofa da bò Ý camel, nẹp đồng",
            prompt_hint="ultra-luxury Vietnamese villa interior, natural North American black walnut joinery with swirling grain and satin finish, bookmatched Calacatta marble slab focal wall, imported Italian full-grain caramel leather sofa, brushed champagne bronze trims"
        ),
        PresetItem(
            id="vietnam_modern_apartment",
            name_vi="Căn hộ Chung cư Hiện đại (Modern Apartment VN)",
            name_en="Modern Apartment VN",
            description="Tone màu trung tính thanh lịch, gỗ sồi sáng màu, sofa bọc nỉ tuyết bo cong mềm mại, hệ tủ âm tường phẳng, đèn ray nam châm",
            prompt_hint="contemporary Vietnamese high-rise apartment interior, warm neutral beige and ivory palette, blonde oak cabinetry, curved bouclé fabric sofa, seamless recessed magnetic ceiling track spotlights"
        ),
        PresetItem(
            id="vietnam_skylight_atrium",
            name_vi="Thông tầng Giếng trời Nhà phố (Skylight Atrium VN)",
            name_en="Skylight Greenery Atrium",
            description="Giếng trời trung tâm nhà ống đón nắng tự nhiên từ mái kính, cầu thang xương cá gỗ kính, cây bàng Đài Loan trồng trong nhà",
            prompt_hint="architectural open lightwell atrium inside a modern Vietnamese townhouse, central skylight filtering natural daylight down multiple levels, mature indoor Ficus / Terminalia tree planted in central courtyard, open-tread timber and glass staircase"
        ),
        PresetItem(
            id="vietnam_wabi_sabi_healing",
            name_vi="Wabi-Sabi Mộc mạc Chữa lành (Earthy Wabi-Sabi VN)",
            name_en="Earthy Wabi-Sabi VN",
            description="Tường vữa trát limewash be ấm loang nhẹ, trần và góc tường bo cong mềm mại, sàn vi xi măng microcement, đồ gỗ thô mộc",
            prompt_hint="tranquil wabi-sabi sanctuary, warm beige textured limewash plaster walls with soft organic curved corners, seamless microcement flooring, raw unfinished timber furniture, handcrafted rustic ceramics"
        ),
        PresetItem(
            id="vietnam_japandi_cozy",
            name_vi="Japandi Tối giản Ấm cúng (Japandi Warm Minimalism)",
            name_en="Japandi Warm Minimalist",
            description="Nan gỗ sồi sáng màu, mành nan tre mộc, bàn trà bệt, chậu cây bonsai tối giản, không gian thanh tịnh",
            prompt_hint="serene Japandi interior, light white oak slat wall panels, delicate bamboo blinds, low-profile tea table, minimalist bonsai plant, harmonious balanced simplicity"
        ),
        PresetItem(
            id="vietnam_neoclassical_elegance",
            name_vi="Tân cổ điển Quý phái (Parisian Neoclassical VN)",
            name_en="Parisian Neoclassical VN",
            description="Phào chỉ tường thạch cao tinh xảo, sàn gỗ xương cá chevron, lò sưởi đá trang trí, đèn chùm pha lê ánh sáng ấm",
            prompt_hint="refined neoclassical interior, delicate wall panel moldings, chevron parquet hardwood, classical marble fireplace, elegant warm crystal chandelier"
        ),
        PresetItem(
            id="vietnam_nordic_scandinavian",
            name_vi="Bắc Âu Tươi sáng (Scandinavian Home)",
            name_en="Scandinavian Home",
            description="Tone trắng kem tươi sáng, sàn gỗ tần bì, rèm voan trắng khuếch tán ánh sáng ban mai, cây xanh thanh lọc",
            prompt_hint="warm Scandinavian interior, light natural ash timber, cozy neutral palette, soft linen drapery diffusing daylight, healthy indoor potted plants"
        ),
        # International Standard Styles
        PresetItem(
            id="modern_contemporary",
            name_vi="Hiện đại Đương đại Quốc tế (Modern Contemporary)",
            name_en="Modern Contemporary",
            description="Đường nét thanh lịch, tủ âm tường phẳng, phào chỉ âm, đồ nội thất thiết kế tinh gọn",
            prompt_hint="modern contemporary interior, sleek rectilinear lines, refined architectural detailing, subtle tactile textures"
        ),
        PresetItem(
            id="industrial_chic",
            name_vi="Loft Công nghiệp Hiện đại (Industrial Loft Chic)",
            name_en="Industrial Chic",
            description="Bê tông mài nhẵn, tường gạch mộc thủ công, khung nhôm kính đen mờ, đèn rọi ray kim loại",
            prompt_hint="urban industrial loft, honed concrete surfaces, exposed artisan brickwork, matte black steel glazing frames"
        )
    ]

    EXTERIOR_STYLES: List[PresetItem] = [
        # Vietnam Real-World Exterior Styles
        PresetItem(
            id="vietnam_tropical_townhouse",
            name_vi="Nhà phố Xanh Giếng trời (Tropical Green Townhouse) - Đặc trưng VN",
            name_en="Tropical Green Townhouse VN",
            description="Mặt tiền nhà ống hẹp phân tầng, gạch bông gió chống nóng, ban công cây cúc tần rủ bóng, lam nhôm vân gỗ, cửa Xingfa",
            prompt_hint="contemporary Vietnamese tropical townhouse facade, geometric facade articulation, white cement breeze blocks for solar shading and natural ventilation, lush cascading curtain creepers (cúc tần Ấn Độ) draping from upper balconies, aluminum timber-look louvers, Xingfa glass windows"
        ),
        PresetItem(
            id="vietnam_japanese_roof_villa",
            name_vi="Biệt thự Vườn Mái Nhật (Japanese Hip Roof Villa) - Quốc dân VN",
            name_en="Japanese Hip Roof Villa VN",
            description="Mái ngói dốc thoải màu xanh than đua rộng, cột vuông ốp đá chân cột, sân lát gạch đỏ/đá bazan, hồ cá Koi và đồi tùng",
            prompt_hint="popular Vietnamese modern garden villa with Japanese hip roof, wide overhanging eaves with dark slate blue-gray ceramic roof tiles, square structural columns with stone-clad bases, paved courtyard with natural basalt stone, landscaped Japanese garden with Koi pond and manicured pine trees"
        ),
        PresetItem(
            id="vietnam_modern_luxury_villa",
            name_vi="Biệt thự Hiện đại Vinhomes / Ecopark (Vinhomes Modern Villa)",
            name_en="Vinhomes Modern Villa",
            description="Hình khối giật cấp mạnh mẽ, vách kính lớn kịch trần Low-E, trần ban công ốp gỗ Conwood ngoài trời, hồ bơi sân sau",
            prompt_hint="ultra-luxury modern Vietnamese master-planned villa (Vinhomes/Ecopark style), bold cantilevered geometric volumes, floor-to-ceiling Low-E glass curtain walls, exterior outdoor Conwood timber ceiling soffits, private landscaped backyard with swimming pool and manicured lawn"
        ),
        PresetItem(
            id="vietnam_indochine_villa",
            name_vi="Biệt thự Đông Dương (Indochine Heritage Villa)",
            name_en="Indochine Heritage Villa",
            description="Mái ngói dốc truyền thống, cửa sổ chớp lá sách sơn xanh rêu/đen, tường vôi vàng hoài cổ, ban công con tiện xi măng",
            prompt_hint="heritage Indochine colonial architectural villa in Vietnam, pitched terracotta tile roof, classic dark forest green wooden louvered shutter windows, aged warm ochre yellow plaster walls, French colonial arched veranda with delicate cement balusters"
        ),
        PresetItem(
            id="vietnam_neoclassical_mansion",
            name_vi="Dinh thự Tân cổ điển Pháp (French Neoclassical Villa VN)",
            name_en="French Neoclassical Villa VN",
            description="Tone trắng sứ hoặc vàng kem, phào chỉ chạy tinh tế dọc vòm cửa, mái mansard đá đen, lan can ban công sắt mỹ thuật",
            prompt_hint="luxurious French neoclassical residential villa in Vietnam, pristine porcelain white facade, refined architectural mouldings around arched windows, dark charcoal Mansard roof with dormer windows, ornate black wrought iron balcony railings"
        ),
        PresetItem(
            id="vietnam_resort_coastal_villa",
            name_vi="Biệt thự Nghỉ dưỡng Biển Nhiệt đới (Coastal Resort Villa - Phú Quốc/Hội An)",
            name_en="Coastal Tropical Resort Villa",
            description="Mái dốc thoải, gỗ Teak chịu ẩm, đá ong xám Đồng Nai ốp tường, hồ bơi tràn viền và hàng dừa cảnh",
            prompt_hint="tropical luxury coastal beachfront resort villa (Phu Quoc / Hoi An style), overhanging timber roof eaves, porous dark grey volcanic basalt honeycomb stone wall cladding, weather-resistant natural teak wood screens, private infinity pool with reflection of coconut palms"
        ),
        PresetItem(
            id="vietnam_brutalist_tropical",
            name_vi="Bê tông Kiến trúc Thô mộc Nhiệt đới (Tropical Brutalism VN)",
            name_en="Tropical Brutalism VN",
            description="Bê tông cốp pha vân gỗ phối cây xanh nhiệt đới rủ bóng, gạch thẻ mộc, đường nét sắc sảo thích ứng khí hậu",
            prompt_hint="contemporary tropical brutalist villa in Vietnam, board-formed fair-faced architectural concrete walls, raw terracotta brick screens, mature tropical foliage cascading over concrete ledges, dramatic deep shadow projections under equatorial sunlight"
        ),
        PresetItem(
            id="vietnam_commercial_shophouse",
            name_vi="Nhà phố Thương mại Shophouse (Modern Urban Shophouse VN)",
            name_en="Modern Urban Shophouse VN",
            description="Tầng 1 kinh doanh vách kính lớn sang trọng, các tầng trên là không gian ở cao cấp có ban công xanh",
            prompt_hint="contemporary Vietnamese urban shophouse facade, double-height commercial glass storefront on ground level, high-end residential upper floors with private green balconies and decorative vertical sun louvers"
        ),
        # International Standard Styles
        PresetItem(
            id="commercial_glass_tower",
            name_vi="Cao ốc Văn phòng & Thương mại (Commercial Glass Tower)",
            name_en="Commercial Glass Tower",
            description="Vách kính curtain wall Low-E hai lớp phản chiếu trời mây, kết cấu thép, quảng trường công cộng",
            prompt_hint="contemporary commercial corporate tower facade, high-performance double-glazed curtain wall, active pedestrian streetscape"
        )
    ]

    # --- 2. LIGHTING & WEATHER PRESETS (ĐẶC TRƯNG KHÍ HẬU VIỆT NAM) ---
    LIGHTING_PRESETS: List[PresetItem] = [
        PresetItem(
            id="vietnam_midday_tropical",
            name_vi="Nắng trưa nhiệt đới trong trẻo (Tropical Crisp Daylight) - Chuẩn VN",
            name_en="Tropical Crisp Daylight",
            description="5600K ánh nắng vàng nhiệt đới trong trẻo, trời xanh mây trắng, bóng đổ sắc sảo qua lam che và gạch bông gió",
            prompt_hint="5600K bright tropical midday sunlight, crisp azure sky with wispy clouds, sharp geometric cast shadows through breeze block screens and sun louvers, vibrant saturated natural colors"
        ),
        PresetItem(
            id="vietnam_golden_hour",
            name_vi="Hoàng hôn nhiệt đới rực rỡ (Tropical Golden Hour Sunset)",
            name_en="Tropical Golden Hour",
            description="3200K ánh nắng xiên góc thấp, ráng chiều cam hồng ấm áp rực rỡ trên mặt nước và ban công",
            prompt_hint="3200K rich golden hour sunset light, low 15-degree sun angle, deep amber and coral sky gradation, luminous warm golden rim lighting along architectural overhangs, long dramatic soft shadows"
        ),
        PresetItem(
            id="vietnam_blue_hour_cozy",
            name_vi="Chạng vạng lên đèn ấm cúng (Blue Hour Dusk 3000K) - Rất được chuộng",
            name_en="Cozy Blue Hour 3000K",
            description="Bầu trời dusk xanh thẫm kết hợp đèn 2700K–3000K vàng ấm le lói qua vách kính tạo cảm giác gia đình sum vầy",
            prompt_hint="7500K deep indigo twilight sky creating a vivid complementary color contrast against warm 2700K-3000K interior and exterior architectural illumination glowing warmly through glass windows"
        ),
        PresetItem(
            id="vietnam_morning_dew",
            name_vi="Ban mai tươi mát (Fresh Morning Daylight)",
            name_en="Fresh Morning Daylight",
            description="4500K ánh nắng sớm tinh khiết, sương nhẹ trên tán lá cây xanh ban công, không khí trong lành",
            prompt_hint="4500K fresh early morning tropical daylight, subtle morning mist, pristine quiet atmosphere, gentle sunlight filtering through tree leaves"
        ),
        PresetItem(
            id="vietnam_overcast_cool",
            name_vi="Trời râm mát dịu nhẹ (Overcast Soft Diffuse)",
            name_en="Soft Overcast Diffuse",
            description="6500K ánh sáng khuếch tán đều qua mây mỏng dịu mát, tôn vinh trọn vẹn chất cảm vật liệu không bị lóa",
            prompt_hint="6500K soft diffused overcast sky, shadowless ambient illumination, pure and authentic material color rendering without harsh sun glare"
        ),
        PresetItem(
            id="vietnam_rainy_tropical",
            name_vi="Mưa rào nhiệt đới êm đềm (Tropical Rainy Reflections)",
            name_en="Tropical Rainy Reflections",
            description="Mặt sân lát đá ướt bóng phản chiếu ánh đèn và trời mây, giọt mưa lất phất trên tán lá hoa giấy xanh mướt",
            prompt_hint="atmospheric tropical rainy scene, glistening wet stone pavement with sharp light reflections, soft delicate raindrops in the air, deep saturated rain-washed green vegetation"
        ),
        PresetItem(
            id="vietnam_night_luxury",
            name_vi="Đêm diễn họa kiến trúc cao cấp (Night Architectural Illumination)",
            name_en="Night Architectural Illumination",
            description="Hệ thống đèn spotlight hắt chân tường, đèn hắt cây sân vườn lung linh huyền ảo",
            prompt_hint="dramatic nighttime architectural scene, professional exterior facade uplighting, recessed warm ambient soffit lights, starry night sky"
        )
    ]

    # --- 3. MATERIAL MOOD PRESETS (VẬT LIỆU BẢN ĐỊA & CAO CẤP VIỆT NAM) ---
    MATERIAL_PRESETS: List[PresetItem] = [
        PresetItem(
            id="vietnam_walnut_stone",
            name_vi="Gỗ Óc Chó & Đá Marble Calacatta (Walnut & Calacatta)",
            name_en="Walnut & Calacatta",
            description="Gỗ óc chó Bắc Mỹ vân cuộn sóng tự nhiên kết hợp đá cẩm thạch Calacatta vân vàng đối xứng",
            prompt_hint="natural North American black walnut millwork with fine natural grain and satin finish, paired with honed bookmatched Calacatta gold marble slabs and brushed champagne bronze metal trim"
        ),
        PresetItem(
            id="vietnam_indochine_cement_tile",
            name_vi="Gạch Bông Cổ Điển & Mây Đan (Encaustic Cement Tile & Rattan)",
            name_en="Cement Tile & Rattan",
            description="Gạch bông thủ công hoa văn Đông Dương hoài cổ kết hợp gỗ tự nhiên nâu sẫm và mây đan mắt cáo",
            prompt_hint="handcrafted decorative encaustic cement tiles with classical geometric floral patterns, dark stained solid wood joinery, fine natural rattan cane weave inserts"
        ),
        PresetItem(
            id="vietnam_breeze_block_conwood",
            name_vi="Gạch Bông Gió & Gỗ Conwood (Breeze Blocks & Conwood)",
            name_en="Breeze Blocks & Conwood",
            description="Gạch bông gió xi măng trắng chống nóng kết hợp gỗ nhựa Conwood ngoài trời ốp trần ban công",
            prompt_hint="white architectural cement breeze block screen walls creating intricate dappled shadow patterns, paired with warm exterior Conwood composite wood ceiling slats and black aluminum window frames"
        ),
        PresetItem(
            id="vietnam_lava_stone_teak",
            name_vi="Đá Ong Xám & Gỗ Teak (Volcanic Lava Stone & Teak)",
            name_en="Lava Stone & Teak",
            description="Đá ong xám Đồng Nai ốp tường có lỗ rỗng tự nhiên kết hợp gỗ Teak tự nhiên chịu ẩm",
            prompt_hint="porous dark grey Dong Nai volcanic basalt lava stone wall cladding with natural textural cavities, paired with rich oiled natural teak timber slats and smooth sand-colored stucco"
        ),
        PresetItem(
            id="vietnam_oak_microcement",
            name_vi="Gỗ Sồi & Sàn Vi Xi Măng (Oak & Microcement Wabi-Sabi)",
            name_en="Oak & Microcement",
            description="Gỗ sồi trắng tự nhiên vân mịn màng phối cùng sàn và tường vi xi măng microcement mờ satin",
            prompt_hint="natural white oak timber joinery with silky satin finish, seamless warm grey microcement flooring and walls with subtle trowel movement"
        ),
        PresetItem(
            id="vietnam_chevron_parquet_glass",
            name_vi="Sàn Gỗ Xương Cá & Kính Hộp Low-E (Chevron Parquet & Low-E Glass)",
            name_en="Chevron Parquet & Low-E Glass",
            description="Sàn gỗ tự nhiên lát xương cá chevron tinh tế phối cùng vách kính Low-E khung nhôm xước",
            prompt_hint="engineered European oak hardwood flooring laid in chevron parquet pattern, high-performance low-iron Low-E architectural glass with ultra-clear transparency"
        ),
        PresetItem(
            id="vietnam_terracotta_brick",
            name_vi="Gạch Gốm Bát Tràng & Thép Đen (Terracotta Brick & Steel)",
            name_en="Terracotta Brick & Steel",
            description="Gạch nung đất sét mộc mạc thủ công Bát Tràng phối khung thép đen mờ",
            prompt_hint="handcrafted artisanal Vietnamese terracotta brickwork with flushed lime mortar joints, structural matte black steel elements"
        )
    ]

    # --- 4. ENVIRONMENT & CONTEXT PRESETS ---
    CONTEXT_PRESETS: List[PresetItem] = [
        PresetItem(
            id="vietnam_tropical_garden",
            name_vi="Sân vườn nhiệt đới Việt Nam (Exterior)",
            name_en="Tropical Vietnam Garden",
            description="Cây bàng Đài Loan, hoa giấy rực rỡ, chuối rẻ quạt, cỏ nhung Nhật Bản mịn màng",
            prompt_hint="lush tropical Vietnamese garden, specimen Terminalia mantaly tree, vibrant bougainvillea flowers cascading, bird of paradise, manicured Japanese velvet grass lawn"
        ),
        PresetItem(
            id="vietnam_koi_pond_courtyard",
            name_vi="Sân trong hồ cá Koi & non bộ (Exterior)",
            name_en="Koi Pond Garden Courtyard",
            description="Hồ cá Koi trong vắt, đá cuội tự nhiên, đồi tùng la hán xanh ngắt, lối đi lát đá bazan",
            prompt_hint="serene courtyard with crystal clear Koi pond, natural river boulders, sculpted Podocarpus pine trees, basalt stepping stones"
        ),
        PresetItem(
            id="vietnam_urban_tube_street",
            name_vi="Khu phố đô thị nhà liền kề (Exterior)",
            name_en="Urban Townhouse Streetscape",
            description="Vỉa hè sạch đẹp, cây xanh đô thị, đường phố đô thị Việt Nam khang trang hiện đại",
            prompt_hint="clean upscale Vietnamese urban residential streetscape, paved sidewalk, landscaped street trees, modern adjacent architecture"
        ),
        PresetItem(
            id="vietnam_skylight_atrium_ctx",
            name_vi="Giếng trời thông tầng giữa nhà (Interior)",
            name_en="Townhouse Skylight Atrium",
            description="Giếng trời ngập tràn ánh sáng rọi từ trên mái kính xuống tiểu cảnh cây xanh trong nhà",
            prompt_hint="open vertical skylight atrium in the center of the home, glass roof overhead filtering bright natural sunbeams down onto an indoor landscaped planter"
        ),
        PresetItem(
            id="vietnam_balcony_garden_view",
            name_vi="View ban công cây xanh mát (Interior)",
            name_en="Green Balcony Garden View",
            description="Nhìn ra ban công có cây cúc tần rủ bóng hoặc tiểu cảnh xanh qua vách kính kịch trần",
            prompt_hint="large floor-to-ceiling glass sliding doors opening onto a lush green balcony garden with draped foliage"
        ),
        PresetItem(
            id="vietnam_city_skyline_view",
            name_vi="View toàn cảnh thành phố hiện đại (Interior)",
            name_en="Modern Metropolitan Skyline",
            description="Nhìn ra toàn cảnh đường chân trời thành phố qua cửa kính lớn kịch trần",
            prompt_hint="expansive full-height glazing framing a panoramic modern metropolitan city skyline in the soft background"
        )
    ]

    # --- 5. CAMERA PERSPECTIVES (GÓC MÁY NHIẾP ẢNH & KHÓA GÓC REVIT) ---
    CAMERA_PERSPECTIVES: List[PresetItem] = [
        PresetItem(
            id="match_input_view",
            name_vi="Khóa góc cam ảnh gốc 100% (Khuyên dùng - Khớp tuyệt đối góc Revit)",
            name_en="Match Input Viewpoint (Recommended)",
            description="Bảo toàn chính xác góc nhìn, cao độ máy và phối cảnh của ảnh Revit gốc (đặc biệt các góc nhìn từ trên cao thấy mái, góc trục đo Axonometric)",
            prompt_hint="CRITICAL CAMERA VANTAGE FIDELITY: Strictly adhere to and replicate the exact viewing angle, camera height, elevation, tilt, and perspective orientation of the input 3D model. If the view is an elevated axonometric or high-angle view showing the roof, render from that EXACT elevated high-angle vantage point looking down at the roof. Do NOT lower the camera to pedestrian eye-level. Maintain the precise vantage point and framing of the original image."
        ),
        PresetItem(
            id="axonometric_high_angle",
            name_vi="Phối cảnh trục đo / Nhìn từ trên cao thấy mái (Axonometric 35°–45°)",
            name_en="Axonometric High-Angle Roof View",
            description="Góc nhìn từ trên cao chếch 35°–45° nhìn xuống, thấy rõ toàn bộ hình khối mái dốc, sân vườn và ranh giới khu đất",
            prompt_hint="elevated axonometric high-angle architectural perspective, camera positioned at 35 to 45 degrees elevation looking down at the building massing and roofscape, complete unobstructed view of the roof tiles, eaves, courtyard, and surrounding site boundaries"
        ),
        PresetItem(
            id="eye_level_pedestrian",
            name_vi="Ngang tầm mắt người đi bộ (Eye-Level 1.6m - 2 điểm tụ chuẩn KTS)",
            name_en="Eye-Level Pedestrian (2-Point)",
            description="Góc chụp chuẩn mực nhất của nhiếp ảnh kiến trúc, các đường thẳng đứng song song 100% không méo",
            prompt_hint="natural eye-level pedestrian viewpoint shot from 1.6m height, perfectly straight vertical lines, corrected two-point architectural perspective, zero vertical barrel distortion"
        ),
        PresetItem(
            id="frontal_elevation",
            name_vi="Chính diện diện đứng đối xứng (Frontal 1-Point Symmetrical)",
            name_en="Frontal 1-Point Symmetrical",
            description="Phối cảnh chính diện tĩnh lặng, uy nghi, cân đối hoàn hảo trục giữa",
            prompt_hint="strict centered one-point frontal elevation perspective, camera positioned perpendicular to the primary facade, perfect symmetry along the central axis, serene monumental balance"
        ),
        PresetItem(
            id="wide_angle_corner",
            name_vi="Góc rộng bao quát công trình 24mm (24mm Wide-Angle Corner)",
            name_en="24mm Wide-Angle Corner",
            description="Bao quát toàn cảnh không gian từ góc xéo, mở rộng trường nhìn mà không bị biến dạng",
            prompt_hint="shot with a 24mm architectural tilt-shift prime lens from an oblique corner vantage point, wide field of view capturing both front and side facades in dynamic spatial depth, rectilinear perspective with perfectly vertical walls"
        ),
        PresetItem(
            id="low_angle_heroic",
            name_vi="Góc thấp ngước nhìn tôn vinh công trình (Heroic Low Angle)",
            name_en="Heroic Low Angle",
            description="Góc máy thấp ngước nhẹ tạo cảm giác bề thế, hùng vĩ và hoành tráng",
            prompt_hint="dramatic low-angle heroic viewpoint looking upwards from ground level, emphasizing soaring vertical height, majestic massing, structural overhangs, and grand architectural scale against the sky"
        ),
        PresetItem(
            id="drone_aerial",
            name_vi="Flycam / Toàn cảnh từ trên trời (Aerial Drone Masterplan)",
            name_en="Aerial Drone Masterplan",
            description="Góc nhìn flycam bao quát toàn bộ cụm công trình, đường xá và quy hoạch cảnh quan xung quanh",
            prompt_hint="high-altitude aerial drone perspective overlooking the entire architectural complex, surrounding roads, neighborhood fabric, and masterplan landscaping from a high bird's-eye vantage point"
        )
    ]

    # --- 6. GEOMETRY MODES (CÁC CHẾ ĐỘ BẢO TOÀN HÌNH HỌC & BẤT BIẾN BIM) ---
    GEOMETRY_MODES: List[PresetItem] = [
        PresetItem(
            id="strict",
            name_vi="Nghiêm ngặt (Strict BIM Fidelity) - Khuyên dùng cho Revit",
            name_en="Strict BIM Fidelity",
            description="Bảo toàn chính xác 100% hình khối kiến trúc, độ dốc mái, viền sê-nô, hệ đố cửa, cột dầm và cao độ từ Revit gốc",
            prompt_hint=(
                "IMMUTABLE BIM ARCHITECTURAL INVARIANTS (STRICTLY PRESERVE FROM INPUT 3D MODEL): "
                "1. ROOF PITCH & PROFILE: Preserve 100% of the exact roof pitch, slope angle, ridge height, cantilevered overhang depth, and horizontal stepped fascia cornice profiles from the input 3D model. If the roof in the drawing is flat, low-pitch, or has stepped fascia copings, render it with that EXACT flat/low-pitch geometry and stepped fascia trim. DO NOT invent steep roof pitches, DO NOT add curved pagoda eaves, and DO NOT replace flat/low-pitch roofs with high-pitched ceramic tiles. "
                "2. FENESTRATION & CLERESTORY BANDS: Preserve the exact position, size, count, and mullion grid layout of all window openings, door frames, glass storefronts, and continuous clerestory ribbon window bands directly under eaves. DO NOT add, delete, resize, or reposition any windows or doors. "
                "3. STRUCTURAL MASSING & PROFILES: Preserve all structural columns, pilasters, beams, cantilever slabs, stepped reveal profiles, wall alignments, building footprints, and floor levels exactly as modeled in Revit. DO NOT add imaginary balconies, extra floors, false columns, or phantom walls. "
                "4. STEPS, LEVELS & PLINTH: Preserve all ground plinths, entrance steps/stairs, terraces, and retaining wall heights. "
                "5. CAMERA VANTAGE POINT & FRAMING: Maintain the exact camera angle, elevation height, tilt, perspective alignment, and framing of the original view. "
                "Translate only the structural surfaces into authentic, genuine physical building materials."
            )
        ),
        PresetItem(
            id="balanced",
            name_vi="Cân bằng (Balanced Enhancement)",
            name_en="Balanced Enhancement",
            description="Giữ nguyên hình khối chính, độ dốc mái và hệ cửa sổ, tự động bù đắp cảnh quan cây cỏ và ánh sáng sinh động",
            prompt_hint=(
                "ARCHITECTURAL INVARIANCE WITH CONTEXT ENRICHMENT: "
                "Preserve the core architectural geometry, exact roof slope angle and profile, window openings, structural column grid, and camera vantage point from the input 3D model without warping or shifting. "
                "Naturally enrich the surrounding outdoor site with realistic landscaping, mature tropical greenery, paving stones, and authentic material textures."
            )
        ),
        PresetItem(
            id="creative",
            name_vi="Sáng tạo (Creative Concept)",
            name_en="Creative Ideation",
            description="Sử dụng hình khối Revit làm ý tưởng concept, cho phép AI sáng tạo thêm giải pháp mặt đứng mới",
            prompt_hint="CREATIVE IDEATION: Use the input 3D model as structural inspiration. Translate into a stunning completed visionary building with dynamic artistic landscape and luxury styling."
        )
    ]

    # --- 7. IMMUTABLE PRESERVATION ELEMENTS (CÁC PHẦN BẢO TOÀN NGUYÊN TRẠNG / KHÓA BẤT BIẾN) ---
    PRESERVATION_ELEMENTS: List[PreservationItem] = [
        PreservationItem(
            id="lock_structure",
            name_vi="Khóa Khung kết cấu & Cao độ tầng (Columns, Beams, Slabs, Levels)",
            name_en="Lock Structural Massing & Levels",
            description="Bảo toàn tuyệt đối lưới cột, dầm bê tông/thép, cao độ các tầng, độ vươn sàn ban công và ranh giới diện tường từ Revit.",
            target_element="structure",
            prompt_hint=(
                "IMMUTABLE STRUCTURAL MASSING: Preserve 100% of all structural columns, load-bearing pilasters, concrete/steel beams, floor-to-floor elevation heights, cantilever floor slabs, and exterior wall perimeter footprints exactly as modeled in the input 3D model. "
                "DO NOT add imaginary balconies, extra floors, false columns, phantom walls, or altered structural depths."
            )
        ),
        PreservationItem(
            id="lock_roof",
            name_vi="Khóa Độ dốc & Diềm sê-nô Mái (Roof Pitch, Overhangs & Copings)",
            name_en="Lock Roof Pitch & Profile",
            description="Bảo toàn 100% độ dốc mái, cao độ đỉnh chóp, sê-nô thu nước, độ vươn mái đua và diềm chỉ copings. Ngăn AI tự biến mái bằng thành mái dốc hoặc mái vòm.",
            target_element="roof",
            prompt_hint=(
                "IMMUTABLE ROOF GEOMETRY: Preserve 100% of the exact roof pitch, slope angle, ridge line elevation, parapet height, cantilevered eaves overhang depth, and horizontal stepped fascia cornice profiles from the input 3D model. "
                "If the roof in the drawing is flat, low-pitch, or has stepped fascia copings, render it with that EXACT flat/low-pitch geometry and stepped fascia trim. "
                "DO NOT invent steep roof pitches, DO NOT add curved pagoda eaves, and DO NOT replace flat/low-pitch roofs with high-pitched ceramic tiles."
            )
        ),
        PreservationItem(
            id="lock_fenestration",
            name_vi="Khóa Lưới Cửa sổ & Đố kính (Windows, Doors & Mullion Grid)",
            name_en="Lock Fenestration & Mullions",
            description="Bảo toàn chính xác vị trí, số lượng, kích thước ô cửa, vách kính mặt dựng và khoảng chia đố nhôm từ bản vẽ Revit.",
            target_element="openings",
            prompt_hint=(
                "IMMUTABLE FENESTRATION GRID: Preserve the exact position, size, opening count, and mullion grid layout of all window openings, entrance doors, glass curtain walls, and continuous clerestory ribbon bands directly under eaves. "
                "DO NOT add, delete, resize, reposition, or rearrange any window frames or door openings."
            )
        ),
        PreservationItem(
            id="lock_camera",
            name_vi="Khóa Góc máy & Phối cảnh (Camera Vantage & Horizon)",
            name_en="Lock Camera Vantage & Horizon",
            description="Khóa tuyệt đối góc nhìn phối cảnh, cao độ mắt người, tiêu cự lens và đường chân trời khớp 100% với khung nhìn 3D Revit gốc.",
            target_element="camera",
            prompt_hint=(
                "IMMUTABLE CAMERA VANTAGE: Lock the exact camera angle, elevation height, viewing direction, optical tilt, perspective convergence, and framing matching 100% of the input view. DO NOT shift camera perspective or rotate the scene."
            )
        ),
        PreservationItem(
            id="lock_site_context",
            name_vi="Khóa Ranh đất & Hiện trạng lân cận (Site Boundary & Neighboring)",
            name_en="Lock Site Boundary & Context",
            description="Bảo toàn cốt cao độ sân, bậc tam cấp, vỉa hè, tường rào và hình khối các công trình nhà lân cận.",
            target_element="site",
            prompt_hint=(
                "IMMUTABLE SITE & NEIGHBORING CONTEXT: Strictly preserve all existing site boundaries, plot limits, entrance steps, terrace levels, retaining walls, sidewalk curb alignments, and neighboring building volumes without alteration."
            )
        ),
        PreservationItem(
            id="lock_interior_shell",
            name_vi="Khóa Khung vỏ Nội thất (Interior Shell: Walls, Ceilings, Openings)",
            name_en="Lock Interior Shell",
            description="Dành cho nội thất: Khóa vị trí tường ngăn phòng, dầm trần, hốc thạch cao và vị trí các ô cửa sổ đón sáng, chỉ thay đổi vật liệu và đồ đạc rời.",
            target_element="interior",
            prompt_hint=(
                "IMMUTABLE INTERIOR SPATIAL SHELL: Preserve 100% of the interior room enclosure, partition walls, ceiling height, beam drop reveals, and window opening locations as modeled. Transform surface materials and loose furnishings while keeping the architectural room shell completely untouched."
            )
        ),
        PreservationItem(
            id="lock_geometric_fidelity",
            name_vi="Tuân thủ nghiêm ngặt hình khối ảnh gốc (Strict Geometric Fidelity)",
            name_en="Strict Geometric Fidelity to Source View",
            description="Bảo toàn 100% hình khối, tỷ lệ tầng, khối tích và bố cục không gian từ ảnh Revit gốc. Tuyệt đối không thay đổi hình học kiến trúc.",
            target_element="massing",
            prompt_hint=(
                "IMMUTABLE GEOMETRIC FIDELITY: Tuân thủ nghiêm ngặt hình khối và bố cục của ảnh Revit gốc. "
                "Strictly adhere to and preserve 100% of the building massing, spatial proportions, number of stories, roof shape and pitch, "
                "door and window positions, structural grid, and all primary architectural components from the input Revit model view. "
                "Do NOT add, remove, resize, or alter any structural or geometric elements. "
                "Modify ONLY visualization rendering aspects: materials, surface textures, colors, lighting, landscaping, and stylistic atmosphere."
            )
        )
    ]

    # --- 8. MULTI-SELECT QUICK FEATURE TAGS (ĐẬM CHẤT THỰC TẾ VIỆT NAM) ---
    QUICK_TAGS: List[QuickTagItem] = [
        # Exterior Vietnam Tags
        QuickTagItem(
            id="breeze_blocks",
            name_vi="Gạch bông gió chắn nắng",
            name_en="Breeze Cement Blocks",
            view_type="exterior",
            prompt_hint="featuring clean white geometric cement breeze block screen walls providing passive shading and casting intricate geometric light patterns"
        ),
        QuickTagItem(
            id="curtain_creeper",
            name_vi="Cây cúc tần rủ ban công",
            name_en="Curtain Creeper Foliage",
            view_type="exterior",
            prompt_hint="lush emerald curtain creepers (cúc tần Ấn Độ) elegantly cascading down from upper floor balconies and planter boxes"
        ),
        QuickTagItem(
            id="japanese_hip_roof",
            name_vi="Mái ngói dốc kiểu Nhật",
            name_en="Japanese Hip Roof Tiles",
            view_type="exterior",
            prompt_hint="refined Japanese-style hip roof with wide overhang eaves and matte dark blue-grey glazed roof tiles"
        ),
        QuickTagItem(
            id="clerestory_windows",
            name_vi="Cổ mái dải kính lấy sáng (Clerestory Windows)",
            name_en="Clerestory Ribbon Windows",
            view_type="exterior",
            prompt_hint="continuous horizontal ribbon clerestory window band with rectilinear geometric mullions directly beneath the upper cantilevered roof overhang, elevating the roof plane with natural daylight"
        ),
        QuickTagItem(
            id="low_pitch_stepped_roof",
            name_vi="Mái dốc thấp & viền sê-nô giật cấp",
            name_en="Low-Pitch Stepped Fascia Roof",
            view_type="exterior",
            prompt_hint="ultra-low-pitch modern roof with broad cantilevered horizontal overhangs, thick stepped horizontal fascia trim with double reveal edge profiles, smooth dark charcoal flat standing-seam panels, no traditional ceramic tiles"
        ),
        QuickTagItem(
            id="koi_pond",
            name_vi="Hồ cá Koi & non bộ",
            name_en="Koi Pond & Rockery",
            view_type="exterior",
            prompt_hint="a crystal clear Japanese Koi pond in the garden with colorful swimming Nishikigoi, natural slate boulders, and miniature waterfall"
        ),
        QuickTagItem(
            id="conwood_ceiling",
            name_vi="Trần ốp gỗ Conwood",
            name_en="Conwood Ceiling Soffit",
            view_type="exterior",
            prompt_hint="exterior terrace ceiling soffit lined with warm natural wood-grained Conwood timber composite slats with recessed spot lights"
        ),
        QuickTagItem(
            id="infinity_pool",
            name_vi="Hồ bơi tràn viền",
            name_en="Infinity Pool",
            view_type="exterior",
            prompt_hint="featuring an elegant infinity edge swimming pool with crystal clear water, subtle surface caustics, and submerged underwater LED lights"
        ),
        QuickTagItem(
            id="warm_facade_lights",
            name_vi="Đèn hắt kiến trúc 3000K",
            name_en="Warm 3000K Facade Uplights",
            view_type="exterior",
            prompt_hint="precision 3000K warm architectural facade uplights accentuating vertical wall pilasters and ground tree canopies"
        ),
        QuickTagItem(
            id="luxury_car_driveway",
            name_vi="Xe hơi sang trọng đỗ sân",
            name_en="Luxury Vehicle on Driveway",
            view_type="exterior",
            prompt_hint="a sleek modern luxury SUV parked cleanly on the paved stone driveway, perfectly scaled and grounded"
        ),
        # Interior Vietnam Tags
        QuickTagItem(
            id="indoor_skylight_tree",
            name_vi="Giếng trời cây xanh thông tầng",
            name_en="Indoor Skylight Tree",
            view_type="interior",
            prompt_hint="a mature indoor specimen tree (Terminalia mantaly or Ficus) growing under a central multi-story glass skylight with natural sunbeams"
        ),
        QuickTagItem(
            id="indochine_cement_tiles",
            name_vi="Gạch bông hoa văn Indochine",
            name_en="Patterned Cement Floor Tiles",
            view_type="interior",
            prompt_hint="flooring accented with authentic decorative black, white and mustard patterned encaustic cement tiles in Indochine heritage style"
        ),
        QuickTagItem(
            id="rattan_webbing_furniture",
            name_vi="Ghế & tủ mây đan mắt cáo",
            name_en="Rattan Cane Webbing",
            view_type="interior",
            prompt_hint="furniture crafted with natural octagonal rattan cane webbing inserts on cabinet doors and armchair backrests"
        ),
        QuickTagItem(
            id="antique_wooden_fan",
            name_vi="Quạt trần cổ cánh gỗ",
            name_en="Antique Wooden Ceiling Fan",
            view_type="interior",
            prompt_hint="a vintage colonial Indochine wooden 5-blade ceiling fan suspended gracefully from the high ceiling"
        ),
        QuickTagItem(
            id="magnetic_track_lights",
            name_vi="Đèn ray nam châm âm trần",
            name_en="Magnetic Track Lights",
            view_type="interior",
            prompt_hint="recessed matte black magnetic ceiling track channels with precision warm spotlight modules flush with plasterboard ceiling"
        ),
        QuickTagItem(
            id="curved_boucle_sofa",
            name_vi="Sofa bo cong nỉ tuyết",
            name_en="Curved Bouclé Sofa",
            view_type="interior",
            prompt_hint="a sculptural organic curved sofa upholstered in cozy off-white bouclé fabric with tactile softness"
        ),
        QuickTagItem(
            id="sheer_linen_drapes",
            name_vi="Rèm voan lanh 2 lớp",
            name_en="Sheer Linen Drapes",
            view_type="interior",
            prompt_hint="floor-to-ceiling sheer white linen curtains gently diffusing natural outdoor daylight into the interior space"
        ),
        QuickTagItem(
            id="herringbone_wood_floor",
            name_vi="Sàn gỗ xương cá",
            name_en="Herringbone Parquet",
            view_type="interior",
            prompt_hint="engineered European oak hardwood flooring laid in a sophisticated herringbone chevron pattern with silky matte finish"
        )
    ]

    # --- 8. CURATED 1-CLICK ARCHETYPES (12 GÓI PHONG CÁCH 1 CHẠM CHUẨN GU VIỆT NAM) ---
    ARCHETYPES: List[ArchetypeItem] = [
        # 1. Nhà phố xanh giếng trời nhiệt đới
        ArchetypeItem(
            id="vn_tropical_townhouse",
            name_vi="Nhà phố Xanh Giếng trời Nhiệt đới (Tropical Green Townhouse)",
            name_en="Tropical Green Townhouse VN",
            view_type="exterior",
            description="Mặt tiền nhà ống hiện đại, gạch bông gió chống nóng, cây cúc tần rủ ban công, lam nhôm vân gỗ",
            style="vietnam_tropical_townhouse",
            lighting="vietnam_midday_tropical",
            material_mood="vietnam_breeze_block_conwood",
            environment_context="vietnam_tropical_garden",
            default_tags=["breeze_blocks", "curtain_creeper", "conwood_ceiling"],
            prompt_summary="Authentic Vietnamese tropical green townhouse with white breeze blocks, cascading creepers, and Conwood louvers."
        ),
        # 2. Biệt thự sân vườn mái Nhật
        ArchetypeItem(
            id="vn_japanese_roof_villa",
            name_vi="Biệt thự Sân vườn Mái Nhật (Japanese Hip Roof Garden Villa)",
            name_en="Japanese Hip Roof Villa VN",
            view_type="exterior",
            description="Mái ngói dốc xanh than kiểu Nhật, cột vuông ốp đá chân cột, sân lát đá bazan, hồ cá Koi và đồi tùng",
            style="vietnam_japanese_roof_villa",
            lighting="vietnam_midday_tropical",
            material_mood="vietnam_lava_stone_teak",
            environment_context="vietnam_koi_pond_courtyard",
            default_tags=["japanese_hip_roof", "koi_pond"],
            prompt_summary="Popular Vietnamese Japanese-hip-roof garden villa with dark blue-gray tiles, basalt courtyard, and Koi pond."
        ),
        # 3. Biệt thự hiện đại Vinhomes
        ArchetypeItem(
            id="vn_modern_luxury_villa",
            name_vi="Biệt thự Hiện đại Vinhomes / Ecopark (Modern Luxury Villa)",
            name_en="Vinhomes Modern Luxury Villa",
            view_type="exterior",
            description="Khối hộp cantilever vươn dài, kính kịch trần Low-E, trần ban công ốp gỗ Conwood, hồ bơi sân sau",
            style="vietnam_modern_luxury_villa",
            lighting="vietnam_golden_hour",
            material_mood="vietnam_walnut_stone",
            environment_context="vietnam_tropical_garden",
            default_tags=["conwood_ceiling", "infinity_pool", "warm_facade_lights"],
            prompt_summary="Ultra-luxury cantilevered modern Vietnamese villa with Low-E glass, Conwood ceilings, and pool bathed in sunset."
        ),
        # 4. Biệt thự Đông Dương Indochine
        ArchetypeItem(
            id="vn_indochine_heritage_villa",
            name_vi="Biệt thự Đông Dương (Indochine Heritage Villa)",
            name_en="Indochine Heritage Villa VN",
            view_type="exterior",
            description="Kiến trúc Pháp-Đông Dương, mái ngói dốc, cửa sổ chớp lá sách xanh rêu, tường vàng hoài cổ",
            style="vietnam_indochine_villa",
            lighting="vietnam_morning_dew",
            material_mood="vietnam_indochine_cement_tile",
            environment_context="vietnam_tropical_garden",
            default_tags=["curtain_creeper"],
            prompt_summary="Heritage Indochine colonial villa in Vietnam with pitched tile roof, green shutters, and warm yellow walls."
        ),
        # 5. Biệt thự Tân cổ điển nhẹ nhàng
        ArchetypeItem(
            id="vn_neoclassical_mansion",
            name_vi="Biệt thự Tân cổ điển Nhẹ nhàng (French Neoclassical Villa)",
            name_en="French Neoclassical Villa VN",
            view_type="exterior",
            description="Biệt thự tân cổ điển sơn trắng sứ, phào chỉ tinh tế, vòm cửa cong, lan can sắt mỹ thuật uốn lượn",
            style="vietnam_neoclassical_mansion",
            lighting="vietnam_midday_tropical",
            material_mood="vietnam_chevron_parquet_glass",
            environment_context="vietnam_tropical_garden",
            default_tags=["warm_facade_lights", "luxury_car_driveway"],
            prompt_summary="Pristine white French neoclassical villa in Vietnam with refined moldings, Mansard roof, and wrought iron balconies."
        ),
        # 6. Biệt thự nghỉ dưỡng biển nhiệt đới
        ArchetypeItem(
            id="vn_coastal_resort_villa",
            name_vi="Biệt thự Nghỉ dưỡng Biển Nhiệt đới (Phú Quốc / Hội An Resort)",
            name_en="Coastal Tropical Resort VN",
            view_type="exterior",
            description="Mái dốc thoải, gỗ Teak, đá ong xám Đồng Nai ốp tường, hồ bơi tràn viền và hàng dừa cảnh",
            style="vietnam_resort_coastal_villa",
            lighting="vietnam_blue_hour_cozy",
            material_mood="vietnam_lava_stone_teak",
            environment_context="vietnam_tropical_garden",
            default_tags=["infinity_pool", "warm_facade_lights"],
            prompt_summary="Beachfront tropical resort villa with teak louvers, volcanic lava stone, and infinity pool at twilight."
        ),

        # 7. Phòng khách Đông Dương Indochine
        ArchetypeItem(
            id="vn_indochine_living",
            name_vi="Phòng khách Đông Dương Di sản (Indochine Living Room)",
            name_en="Indochine Heritage Living",
            view_type="interior",
            description="Gạch bông cổ điển lát sàn, đồ gỗ chạm nhẹ nâu đen, cửa mây đan mắt cáo, quạt trần cổ, tranh sơn mài",
            style="vietnam_indochine_heritage",
            lighting="vietnam_morning_dew",
            material_mood="vietnam_indochine_cement_tile",
            environment_context="vietnam_balcony_garden_view",
            default_tags=["indochine_cement_tiles", "rattan_webbing_furniture", "antique_wooden_fan"],
            prompt_summary="Authentic Indochine living room with patterned cement tiles, dark teak furniture, rattan webbing, and vintage fan."
        ),
        # 8. Nội thất Gỗ óc chó thượng lưu
        ArchetypeItem(
            id="vn_walnut_luxury_living",
            name_vi="Nội thất Gỗ Óc Chó Thượng Lưu (Vinhomes Luxury Walnut)",
            name_en="Vinhomes Luxury Walnut Living",
            view_type="interior",
            description="Gỗ óc chó Bắc Mỹ vân cuộn sóng, đá cẩm thạch Calacatta vân vàng, sofa da bò Ý, đèn ray âm trần",
            style="vietnam_luxury_walnut",
            lighting="vietnam_midday_tropical",
            material_mood="vietnam_walnut_stone",
            environment_context="vietnam_balcony_garden_view",
            default_tags=["magnetic_track_lights", "sheer_linen_drapes"],
            prompt_summary="Ultra-luxury Vietnamese living space with bookmatched Calacatta marble, American walnut millwork, and Italian leather."
        ),
        # 9. Căn hộ chung cư Hiện đại
        ArchetypeItem(
            id="vn_modern_apartment",
            name_vi="Căn hộ Chung cư Hiện đại Tiện nghi (Modern Apartment VN)",
            name_en="Modern Apartment VN",
            view_type="interior",
            description="Không gian chung cư thanh lịch, gỗ sồi sáng màu, sofa bo cong nỉ tuyết, đèn ray nam châm âm trần",
            style="vietnam_modern_apartment",
            lighting="vietnam_midday_tropical",
            material_mood="vietnam_oak_microcement",
            environment_context="vietnam_city_skyline_view",
            default_tags=["curved_boucle_sofa", "magnetic_track_lights", "sheer_linen_drapes"],
            prompt_summary="Bright contemporary Vietnamese apartment with curved bouclé sofa, blonde oak joinery, and city view."
        ),
        # 10. Thông tầng Giếng trời Xanh
        ArchetypeItem(
            id="vn_skylight_atrium",
            name_vi="Thông tầng Giếng trời Xanh Nhà phố (Townhouse Skylight Atrium)",
            name_en="Townhouse Skylight Atrium VN",
            view_type="interior",
            description="Giếng trời nhà ống đón nắng tự nhiên từ mái kính, cây bàng Đài Loan trồng trong nhà, cầu thang gỗ kính",
            style="vietnam_skylight_atrium",
            lighting="vietnam_midday_tropical",
            material_mood="vietnam_oak_microcement",
            environment_context="vietnam_skylight_atrium_ctx",
            default_tags=["indoor_skylight_tree", "magnetic_track_lights"],
            prompt_summary="Light-filled open skylight atrium with mature indoor tree, natural sunbeams, and floating wood stairs."
        ),
        # 11. Phòng khách Wabi-Sabi mộc mạc
        ArchetypeItem(
            id="vn_wabi_sabi_living",
            name_vi="Phòng khách Wabi-Sabi Mộc mạc (Earthy Wabi-Sabi VN)",
            name_en="Earthy Wabi-Sabi VN",
            view_type="interior",
            description="Tường vữa limewash be ấm loang nhẹ, trần bo cong, sàn vi xi măng microcement, đồ gỗ thô mộc chữa lành",
            style="vietnam_wabi_sabi_healing",
            lighting="vietnam_overcast_cool",
            material_mood="vietnam_oak_microcement",
            environment_context="vietnam_balcony_garden_view",
            default_tags=["curved_boucle_sofa", "sheer_linen_drapes"],
            prompt_summary="Peaceful wabi-sabi living room with warm limewash plaster, organic curved contours, and microcement floor."
        ),
        # 12. Phòng khách Tân cổ điển quý phái
        ArchetypeItem(
            id="vn_neoclassical_salon",
            name_vi="Phòng khách Tân cổ điển Quý phái (Parisian Neoclassical Salon)",
            name_en="Parisian Neoclassical Salon VN",
            view_type="interior",
            description="Phào chỉ tường đăng đối, sàn gỗ xương cá chevron, lò sưởi đá, đèn chùm pha lê ấm cúng",
            style="vietnam_neoclassical_elegance",
            lighting="vietnam_golden_hour",
            material_mood="vietnam_chevron_parquet_glass",
            environment_context="vietnam_balcony_garden_view",
            default_tags=["herringbone_wood_floor", "sheer_linen_drapes"],
            prompt_summary="Elegant French neoclassical salon with refined wall moldings, herringbone parquet, and warm golden sunset."
        )
    ]

    # --- 9. LEGACY ALIASES MAP FOR 100% BACKWARD COMPATIBILITY ---
    LEGACY_ALIASES: Dict[str, str] = {
        # Styles
        "modern": "vietnam_modern_apartment",
        "minimalist": "vietnam_japandi_cozy",
        "scandinavian": "vietnam_nordic_scandinavian",
        "luxury": "vietnam_luxury_walnut",
        "industrial": "industrial_chic",
        "neoclassical": "vietnam_neoclassical_elegance",
        "modern_villa": "vietnam_modern_luxury_villa",
        "tropical_resort": "vietnam_resort_coastal_villa",
        "brutalist_concrete": "vietnam_brutalist_tropical",
        "commercial_tower": "commercial_glass_tower",
        "townhouse": "vietnam_tropical_townhouse",
        # Old Archetypes aliases
        "modern_tropical_luxury": "vn_tropical_townhouse",
        "sunset_golden_villa": "vn_modern_luxury_villa",
        "twilight_blue_resort": "vn_coastal_resort_villa",
        "brutalist_raw_concrete": "vn_japanese_roof_villa",
        "mediterranean_earthy": "vn_indochine_heritage_villa",
        "urban_green_townhouse": "vn_tropical_townhouse",
        "commercial_glass_tower": "commercial_glass_tower",
        "modern_luxury_living": "vn_walnut_luxury_living",
        "warm_japandi_minimalist": "vn_japandi_cozy",
        "cozy_scandinavian": "vn_nordic_scandinavian",
        "night_penthouse_moody": "vn_walnut_luxury_living",
        "industrial_loft_chic": "industrial_chic",
        "neoclassical_elegance": "vn_neoclassical_salon",
        # Lighting aliases
        "golden_hour": "vietnam_golden_hour",
        "golden_hour_sunset": "vietnam_golden_hour",
        "midday_sun": "vietnam_midday_tropical",
        "midday_clear": "vietnam_midday_tropical",
        "overcast": "vietnam_overcast_cool",
        "overcast_soft_diffuse": "vietnam_overcast_cool",
        "blue_hour_dusk": "vietnam_blue_hour_cozy",
        "blue_hour_twilight": "vietnam_blue_hour_cozy",
        "night_cozy": "vietnam_night_luxury",
        "night_architectural": "vietnam_night_luxury",
        # Materials aliases
        "warm_wood_concrete": "vietnam_walnut_stone",
        "warm_oak_concrete": "vietnam_oak_microcement",
        "luxury_marble_brass": "vietnam_walnut_stone",
        "calacatta_marble_gold": "vietnam_walnut_stone",
        "glass_steel": "vietnam_chevron_parquet_glass",
        "exposed_brick_black": "vietnam_terracotta_brick",
        # Camera aliases
        "eye_level_twopoint": "eye_level_pedestrian",
        "centered_onepoint": "frontal_elevation",
        "wide_angle_architectural": "wide_angle_corner",
        "low_angle_dramatic": "low_angle_heroic",
        "aerial_birds_eye": "axonometric_high_angle",
        "match_input": "match_input_view",
        "original_view": "match_input_view",
        "axonometric": "axonometric_high_angle",
        "high_angle": "axonometric_high_angle",
        "bird_eye": "drone_aerial"
    }

    @classmethod
    def normalize_id(cls, raw_id: Optional[str]) -> str:
        if not raw_id:
            return ""
        clean = raw_id.strip()
        return cls.LEGACY_ALIASES.get(clean, clean)

    @classmethod
    def get_catalog(cls) -> PresetsCatalogResponse:
        return PresetsCatalogResponse(
            archetypes=cls.ARCHETYPES,
            view_types=cls.VIEW_TYPES,
            interior_styles=cls.INTERIOR_STYLES,
            exterior_styles=cls.EXTERIOR_STYLES,
            lighting_presets=cls.LIGHTING_PRESETS,
            material_presets=cls.MATERIAL_PRESETS,
            context_presets=cls.CONTEXT_PRESETS,
            camera_perspectives=cls.CAMERA_PERSPECTIVES,
            geometry_modes=cls.GEOMETRY_MODES,
            preservation_elements=cls.PRESERVATION_ELEMENTS,
            quick_tags=cls.QUICK_TAGS
        )

    @classmethod
    def resolve_archetype(cls, archetype_id: str) -> Optional[ArchetypeItem]:
        clean_id = cls.normalize_id(archetype_id)
        # Check direct match
        match = next((a for a in cls.ARCHETYPES if a.id == clean_id), None)
        if match:
            return match
        # Check raw id match
        return next((a for a in cls.ARCHETYPES if a.id == archetype_id), None)

    @classmethod
    def resolve_prompt_components(
        cls,
        view_type: str,
        style: str,
        lighting: str,
        material_mood: str,
        geometry_mode: str,
        environment_context: Optional[str] = None,
        camera_perspective: Optional[str] = None
    ) -> Dict[str, str]:
        """Resolves detailed prompt hints for given preset ids with legacy alias support."""
        n_style = cls.normalize_id(style)
        n_lighting = cls.normalize_id(lighting)
        n_material = cls.normalize_id(material_mood)
        n_geom = cls.normalize_id(geometry_mode)
        n_context = cls.normalize_id(environment_context)
        n_camera = cls.normalize_id(camera_perspective) if camera_perspective else "match_input_view"

        style_list = cls.INTERIOR_STYLES if "interior" in view_type.lower() else cls.EXTERIOR_STYLES
        style_item = next((item for item in style_list if item.id in [n_style, style]), None)
        style_hint = style_item.prompt_hint if style_item else n_style

        lighting_item = next((item for item in cls.LIGHTING_PRESETS if item.id in [n_lighting, lighting]), None)
        lighting_hint = lighting_item.prompt_hint if lighting_item else n_lighting

        material_item = next((item for item in cls.MATERIAL_PRESETS if item.id in [n_material, material_mood]), None)
        material_hint = material_item.prompt_hint if material_item else n_material

        geom_item = next((item for item in cls.GEOMETRY_MODES if item.id in [n_geom, geometry_mode]), None)
        geom_hint = geom_item.prompt_hint if geom_item else n_geom

        context_item = next((item for item in cls.CONTEXT_PRESETS if item.id in [n_context, environment_context]), None)
        context_hint = context_item.prompt_hint if context_item else ""

        camera_item = next((item for item in cls.CAMERA_PERSPECTIVES if item.id in [n_camera, camera_perspective]), None)
        if not camera_item:
            camera_item = cls.CAMERA_PERSPECTIVES[0]  # default to match_input_view
        camera_hint = camera_item.prompt_hint

        return {
            "style_hint": style_hint,
            "lighting_hint": lighting_hint,
            "material_hint": material_hint,
            "geometry_hint": geom_hint,
            "context_hint": context_hint,
            "camera_hint": camera_hint
        }

    @classmethod
    def resolve_tag_hints(cls, tags: Optional[List[str]], view_type: str = "exterior") -> List[str]:
        """Resolves active quick tag IDs into professional prompt phrases."""
        if not tags:
            return []
        hints = []
        for tag_id in tags:
            clean_tag = cls.normalize_id(tag_id)
            tag_item = next((t for t in cls.QUICK_TAGS if t.id in [clean_tag, tag_id]), None)
            if tag_item:
                hints.append(tag_item.prompt_hint)
            elif tag_id.strip():
                hints.append(tag_id.strip())
        return hints

    @classmethod
    def resolve_preservation_directives(cls, locked_ids: Optional[List[str]], geometry_mode: str = "strict") -> str:
        """
        Compiles user-selected preservation checkboxes into a strict, authoritative
        architectural invariant directive for the image generation model.
        """
        if not locked_ids:
            # Fallback to baseline geometry mode if no checkboxes selected
            n_geom = cls.normalize_id(geometry_mode)
            geom_item = next((item for item in cls.GEOMETRY_MODES if item.id in [n_geom, geometry_mode]), None)
            return geom_item.prompt_hint if geom_item else ""

        directives = []
        for locked_id in locked_ids:
            clean_id = cls.normalize_id(locked_id)
            item = next((p for p in cls.PRESERVATION_ELEMENTS if p.id in [clean_id, locked_id]), None)
            if item:
                directives.append(item.prompt_hint)

        if not directives:
            n_geom = cls.normalize_id(geometry_mode)
            geom_item = next((item for item in cls.GEOMETRY_MODES if item.id in [n_geom, geometry_mode]), None)
            return geom_item.prompt_hint if geom_item else ""

        header = "IMMUTABLE ARCHITECTURAL INVARIANTS (STRICTLY PRESERVE FROM INPUT 3D MODEL - ZERO MORPHING): "
        body = " ".join(directives)
        footer = " STRICT DIRECTIVE: Render genuine physical materials, natural lighting, and environmental context strictly onto these locked structural geometries without shifting, distorting, adding, or deleting any architectural element."
        return f"{header}{body}{footer}"
