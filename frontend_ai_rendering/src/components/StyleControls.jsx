import { ShieldCheck, Sparkles, Sun, Palette, Layers, Box } from 'lucide-react';

function getDisplayValue(catalog, groupName, value) {
  if (!value) return '';
  const item = catalog?.[groupName]?.find(p => p.id === value);
  return item ? item.name_vi : value;
}

function ChipField({ label, field, value, chips, onChange, placeholder, multiline = false, catalog, groupName }) {
  const displayVal = groupName ? getDisplayValue(catalog, groupName, value) : (value || '');

  const isChipActive = (chip) => {
    if (!value) return false;
    return value === chip.id || value === chip.name_vi || (chip.prompt_hint && value === chip.prompt_hint);
  };

  const handleChipClick = (chip) => {
    if (isChipActive(chip)) {
      onChange(field, '');
    } else {
      onChange(field, chip.id);
    }
  };

  const handleInputChange = (e) => {
    onChange(field, e.target.value);
  };

  const Input = multiline ? 'textarea' : 'input';

  return (
    <div className="compact-field-card">
      <div className="compact-field-header">
        <label className="compact-field-label" htmlFor={`field-${field}`}>{label}</label>
      </div>
      {chips && chips.length > 0 && (
        <div className="quick-chips-row" role="group" aria-label={`Gợi ý cho ${label}`}>
          {chips.map((chip) => {
            const active = isChipActive(chip);
            return (
              <button
                key={chip.id}
                type="button"
                className={`quick-chip-btn ${active ? 'active' : ''}`}
                onClick={() => handleChipClick(chip)}
                aria-pressed={active}
              >
                {chip.name_vi || chip.label}
              </button>
            );
          })}
        </div>
      )}
      <Input
        id={`field-${field}`}
        className="compact-field-input"
        value={displayVal}
        onChange={handleInputChange}
        placeholder={placeholder}
        rows={multiline ? 2 : undefined}
        maxLength={multiline ? 1000 : 400}
      />
    </div>
  );
}

export default function StyleControls({ form, catalog, onChange }) {
  const view = form.view_type;
  if (!catalog || !view) return null;

  const scoped = (items) => (items || []).filter(p => p.view_type === view || p.view_type === 'both');

  // Surface materials for this view
  const wallChips = scoped(catalog.wall_materials);
  const floorChips = scoped(catalog.floor_materials);
  const roofCeilingChips = view === 'interior' ? scoped(catalog.ceiling_materials) : scoped(catalog.roof_materials);
  const doorChips = scoped(catalog.door_materials);
  const styleChips = scoped(view === 'interior' ? catalog.interior_styles : catalog.exterior_styles);
  const lightingChips = scoped(catalog.lighting_presets);

  return (
    <div className="essential-form-groups">
      {/* NHÓM 1: PHONG CÁCH & KHÔNG GIAN / CÔNG TRÌNH */}
      <section className="panel group-panel">
        <div className="section-heading">
          <span className="step">02</span>
          <div>
            <h2><Palette size={16} className="inline-icon" /> Phong cách & Không gian</h2>
            <p>Chọn phong cách thiết kế và định danh loại hình công trình hoặc không gian.</p>
          </div>
        </div>

        <ChipField
          label="Phong cách bề mặt & hoàn thiện"
          field="style"
          value={form.style}
          chips={styleChips}
          catalog={catalog}
          groupName={view === 'interior' ? 'interior_styles' : 'exterior_styles'}
          onChange={onChange}
          placeholder="Chọn chip ở trên hoặc nhập phong cách tùy chỉnh (Ví dụ: Hiện đại kem ngà, vòm cong mềm mại...)"
        />

        <div className="compact-field-card" style={{ marginTop: '14px' }}>
          <div className="compact-field-header">
            <label className="compact-field-label" htmlFor="field-space_type">
              {view === 'interior' ? 'Loại không gian' : 'Loại công trình'}
            </label>
          </div>
          <input
            id="field-space_type"
            className="compact-field-input"
            value={form.space_type || ''}
            onChange={(e) => onChange('space_type', e.target.value)}
            placeholder={
              view === 'interior'
                ? 'Ví dụ: Phòng khách liền bếp chung cư, phòng ngủ master, phòng họp...'
                : 'Ví dụ: Nhà phố 3 tầng mặt tiền vòm cong hiện đại, shophouse, biệt thự sân vườn...'
            }
            maxLength={300}
          />
        </div>
      </section>

      {/* NHÓM 2: VẬT LIỆU HOÀN THIỆN CHÍNH */}
      <section className="panel group-panel">
        <div className="section-heading">
          <span className="step">03</span>
          <div>
            <h2><Layers size={16} className="inline-icon" /> Vật liệu hoàn thiện chính</h2>
            <p>Chỉ định vật liệu cho 4 bộ phận chủ đạo; chỉ áp dụng lên các bề mặt nhìn thấy trong bản vẽ.</p>
          </div>
        </div>

        <div className="materials-grid-compact">
          {/* Tường / Mặt đứng */}
          <ChipField
            label={view === 'interior' ? 'Tường trong nhà' : 'Mặt đứng / Tường ngoài'}
            field="wall_material"
            value={form.wall_material}
            chips={wallChips}
            catalog={catalog}
            groupName="wall_materials"
            onChange={onChange}
            placeholder={view === 'interior' ? 'Ví dụ: Vữa khoáng kem ngà, sơn trắng mờ...' : 'Ví dụ: Vữa khoáng microcement kem ngà, mảng tường tầng 1 ốp đá xám...'}
          />

          {/* Sàn / Nền */}
          <ChipField
            label={view === 'interior' ? 'Sàn phòng' : 'Sân / Nền hiện có'}
            field="floor_material"
            value={form.floor_material}
            chips={floorChips}
            catalog={catalog}
            groupName="floor_materials"
            onChange={onChange}
            placeholder={view === 'interior' ? 'Ví dụ: Sàn gỗ sồi sáng tự nhiên, gạch porcelain xám...' : 'Ví dụ: Đá granite xám đậm nhám cho tam cấp và sân...'}
          />

          {/* Trần / Mái */}
          {view === 'interior' ? (
            <ChipField
              label="Trần nhà"
              field="ceiling_material"
              value={form.ceiling_material}
              chips={roofCeilingChips}
              catalog={catalog}
              groupName="ceiling_materials"
              onChange={onChange}
              placeholder="Ví dụ: Sơn trắng trên trần hiện có, trần ốp nan gỗ sồi..."
            />
          ) : (
            <ChipField
              label="Mái / Trần ban công"
              field="roof_material"
              value={form.roof_material}
              chips={roofCeilingChips}
              catalog={catalog}
              groupName="roof_materials"
              onChange={onChange}
              placeholder="Ví dụ: Ngói phẳng xám đậm, trần ban công ốp gỗ nhựa..."
            />
          )}

          {/* Cửa & Khung kính */}
          <ChipField
            label="Cửa & Khung kính"
            field="door_material"
            value={form.door_material}
            chips={doorChips}
            catalog={catalog}
            groupName="door_materials"
            onChange={onChange}
            placeholder="Ví dụ: Khung nhôm đen xingfa, kính an toàn trong suốt..."
          />
        </div>
      </section>

      {/* NHÓM 3: ÁNH SÁNG & BỐI CẢNH */}
      <section className="panel group-panel">
        <div className="section-heading">
          <span className="step">04</span>
          <div>
            <h2><Sun size={16} className="inline-icon" /> Ánh sáng & Bối cảnh</h2>
            <p>Thiết lập nguồn sáng và mức độ hoàn thiện bối cảnh xung quanh.</p>
          </div>
        </div>

        <ChipField
          label="Ánh sáng / Thời điểm"
          field="lighting"
          value={form.lighting}
          chips={lightingChips}
          catalog={catalog}
          groupName="lighting_presets"
          onChange={onChange}
          placeholder="Chọn chip thời điểm hoặc nhập mô tả ánh sáng mong muốn..."
        />

        {/* Chế độ diễn họa Staged vs Strict */}
        <div className="compact-field-card" style={{ marginTop: '14px' }}>
          <div className="compact-field-header">
            <span className="compact-field-title">Chế độ thể hiện bối cảnh</span>
          </div>
          <div className="geometry-mode-selector" role="group" aria-label="Chế độ thể hiện">
            <button
              type="button"
              className={`mode-pill-btn ${form.geometry_mode === 'staged' ? 'active' : ''}`}
              onClick={() => onChange('geometry_mode', 'staged')}
              aria-pressed={form.geometry_mode === 'staged'}
            >
              <Sparkles size={14} />
              <span>Diễn họa sinh động (AI thêm bối cảnh, cây xanh, xe cộ, đồ decor)</span>
            </button>
            <button
              type="button"
              className={`mode-pill-btn ${form.geometry_mode === 'strict' ? 'active' : ''}`}
              onClick={() => onChange('geometry_mode', 'strict')}
              aria-pressed={form.geometry_mode === 'strict'}
            >
              <Box size={14} />
              <span>Chỉ diễn họa vật liệu (Khóa nguyên hiện trạng, không thêm đồ)</span>
            </button>
          </div>
        </div>

        {/* Bối cảnh cảnh quan */}
        <div className="compact-field-card" style={{ marginTop: '14px' }}>
          <div className="compact-field-header">
            <label className="compact-field-label" htmlFor="field-location_context">
              {view === 'interior' ? 'Chi tiết cảnh qua cửa / cây nội thất' : 'Bối cảnh cảnh quan xung quanh (xe, cây, vỉa hè)'}
            </label>
          </div>
          <textarea
            id="field-location_context"
            className="compact-field-input"
            value={form.location_context || ''}
            onChange={(e) => onChange('location_context', e.target.value)}
            placeholder={
              view === 'interior'
                ? 'Ví dụ: Ánh sáng qua rèm voan mỏng, vài chậu cây xanh nhỏ trong góc, cảnh thành phố mờ nhẹ ngoài cửa...'
                : 'Ví dụ: Cây xanh tán mỏng bên hông, 1 xe hơi đỗ trước hiên nhà, vỉa hè lát đá xám, bầu trời trong trẻo...'
            }
            rows={2}
            maxLength={500}
          />
        </div>
      </section>

      {/* NHÓM 4: BẢO TOÀN HÌNH KHỐI (MASSING LOCK) */}
      <section className="panel group-panel massing-lock-panel">
        <div className="section-heading">
          <span className="step">05</span>
          <div>
            <h2><ShieldCheck size={16} className="inline-icon" /> Bảo toàn hình khối CAD / Revit</h2>
            <p>Cam kết độ chính xác hình học và các chi tiết bắt buộc giữ nguyên.</p>
          </div>
        </div>

        <div className="active-lock-badge">
          <div className="lock-icon-wrap">
            <ShieldCheck size={20} className="lock-svg" />
          </div>
          <div className="lock-info">
            <strong>Đang kích hoạt: Khóa 100% Phối Cảnh & Hình Khối 3D</strong>
            <p>
              Giữ nguyên tỉ lệ hình học, góc nhìn camera, độ sâu tường hông, ban công và hệ ô cửa từ file vẽ.
              AI tuyệt đối không tự xoay camera, không đục thêm cửa sổ và không biến tường đặc thành vách kính.
            </p>
          </div>
        </div>

        <div className="compact-field-card" style={{ marginTop: '14px' }}>
          <div className="compact-field-header">
            <label className="compact-field-label" htmlFor="field-preservation_notes">
              Ghi chú chi tiết bắt buộc giữ nguyên (Tùy chọn)
            </label>
          </div>
          <textarea
            id="field-preservation_notes"
            className="compact-field-input"
            value={form.preservation_notes || ''}
            onChange={(e) => onChange('preservation_notes', e.target.value)}
            placeholder={
              view === 'interior'
                ? 'Ví dụ: Giữ nguyên vách trang trí ước lệ, không thay đổi vị trí dầm cột, giữ màu gỗ bàn họp...'
                : 'Ví dụ: Giữ nguyên 4 bậc tam cấp đá granite, giữ nguyên vòm cong ban công tầng 2, giữ mảng tường đặc bên phải...'
            }
            rows={2}
            maxLength={1000}
          />
        </div>
      </section>
    </div>
  );
}

