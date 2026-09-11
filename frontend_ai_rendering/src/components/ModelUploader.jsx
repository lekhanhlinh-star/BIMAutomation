import { Upload, ImagePlus } from 'lucide-react';
export default function ModelUploader({ source, onFile, view, onView, onSample, loading }) {
  return <section className="panel" aria-labelledby="source-heading">
    <div className="section-heading"><span className="step">01</span><div><h2 id="source-heading">Ảnh và loại khung nhìn</h2><p>Ảnh 3D từ Revit là cơ sở để giữ kiến trúc và góc nhìn.</p></div></div>
    <div className="view-choices" role="group" aria-label="Loại khung nhìn">
      {[['interior', 'Nội thất', 'Không gian bên trong'], ['exterior', 'Ngoại thất', 'Mặt ngoài, sân và mái']].map(([value, title, desc]) =>
        <button type="button" key={value} aria-pressed={view === value} onClick={() => onView(value)}><strong>{title}</strong><span>{desc}</span></button>)}
    </div>
    <label className="upload-control"><Upload size={20} /><span>{loading ? 'Đang đọc ảnh…' : source ? 'Đổi ảnh Revit' : 'Chọn ảnh Revit'}<small>PNG, JPEG, WEBP · tối đa 24 MB / 24 triệu điểm ảnh</small></span>
      <input aria-label="Chọn ảnh Revit" type="file" accept="image/png,image/jpeg,image/webp" disabled={loading} onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); e.target.value = ''; }} /></label>
    {source && <p className="file-info">{source.name} · {source.width} × {source.height} px</p>}
    <div className="sample-links"><ImagePlus size={16} /><span>Thử ảnh mẫu:</span>{[['interior', 'Nội thất'], ['exterior', 'Ngoại thất'], ['roof', 'Góc cao thấy mái']].map(([type, label]) => <button key={type} type="button" disabled={loading} onClick={() => onSample(type)}>{label}</button>)}</div>
  </section>;
}
