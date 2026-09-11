export function TextField({ label, name, form, onChange, placeholder, multiline = false }) {
  const Input = multiline ? 'textarea' : 'input';
  return <label className="field"><span>{label}</span><Input name={name} value={form[name]} onChange={e => onChange(name, e.target.value)} placeholder={placeholder} rows={multiline ? 3 : undefined} maxLength={multiline ? 2000 : 500} /></label>;
}
export default function ProjectBrief({ form, catalog, onChange }) {
  return <section className="panel"><div className="section-heading"><span className="step">02</span><div><h2>Yêu cầu diễn họa</h2><p>Các mục mô tả không bắt buộc. Bỏ trống nếu không cần thay đổi.</p></div></div>
    <div className="fields-grid">
      <TextField label="Tên dự án" name="project_name" form={form} onChange={onChange} placeholder="Tên để nhận diện lượt thử" />
      <TextField label="Tên khung nhìn / phương án" name="view_name" form={form} onChange={onChange} placeholder="Ví dụ: Mặt tiền_PA02" />
      <TextField label={form.view_type === 'interior' ? 'Loại không gian' : 'Loại công trình'} name="space_type" form={form} onChange={onChange} placeholder={form.view_type === 'interior' ? 'Ví dụ: Phòng họp' : 'Ví dụ: Nhà phố 3 tầng'} />
      <label className="field"><span>Mục đích ảnh</span><select value={form.render_purpose} onChange={e => onChange('render_purpose', e.target.value)}>{catalog.render_purposes.map(p => <option key={p.id} value={p.id}>{p.name_vi}</option>)}</select></label>
    </div>
    <label className="field"><span>Phạm vi thực hiện</span><select value={form.geometry_mode} onChange={e => onChange('geometry_mode', e.target.value)}>{catalog.geometry_modes.map(p => <option key={p.id} value={p.id}>{p.name_vi}</option>)}</select><small>{catalog.geometry_modes.find(p => p.id === form.geometry_mode)?.description}</small></label>
    <div className="preservation-note"><strong>Luôn giữ kiến trúc và góc nhìn</strong><p>{form.view_type === 'interior' ? 'Giữ vách, cột, dầm, trần, ô cửa và bố trí hiện có.' : 'Giữ khối nhà, số tầng, mái, ban công, ô cửa và quan hệ nền.'} Kết quả AI cần đối chiếu với ảnh gốc.</p></div>
    <TextField label="Nội dung cần giữ thêm" name="preservation_notes" form={form} onChange={onChange} multiline placeholder={form.view_type === 'interior' ? 'Ví dụ: Giữ màu gỗ bàn họp, không che lối đi cạnh cửa.' : 'Ví dụ: Giữ màu cửa, không che mặt đứng bằng cây.'} />
  </section>;
}
