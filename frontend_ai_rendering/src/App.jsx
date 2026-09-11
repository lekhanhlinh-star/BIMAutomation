import { useEffect, useRef, useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import Header from './components/Header';
import ModelUploader from './components/ModelUploader';
import StyleControls from './components/StyleControls';
import ComparisonStudio from './components/ComparisonStudio';
import { fetchPresets, checkHealth, previewPrompt, executeRender, fetchSample } from './services/api';
import { initialForm, changeView, applyPreset, toOptions, matchingReference } from './state/renderForm';

export default function App() {
  const [form, setForm] = useState(() => initialForm(new URLSearchParams(window.location.search).get('view')?.match(/^(interior|exterior)$/)?.[0] || ''));
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState('');
  const [health, setHealth] = useState(null);
  const [source, setSource] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [result, setResult] = useState(null);
  const [reference, setReference] = useState(null);
  const [renderError, setRenderError] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const [reload, setReload] = useState(0);
  const busy = useRef(false);
  const imageSequence = useRef(0);
  const activeReference = matchingReference(reference, source, form.view_type);
  const selectableReference = matchingReference(result, source, form.view_type);
  const optionsKey = JSON.stringify({ ...toOptions(form), reference_render_id: activeReference?.render_id || null });

  const refreshHealth = () => checkHealth().then(setHealth).catch(() => setHealth(null));
  useEffect(() => {
    const controller = new AbortController();
    fetchPresets(controller.signal).then(setCatalog).catch(error => { if (error.name !== 'AbortError') setCatalogError(error.message); });
    refreshHealth();
    return () => controller.abort();
  }, [reload]);
  useEffect(() => {
    if (!form.view_type || !catalog) return;
    const controller = new AbortController();
    const timer = setTimeout(() => previewPrompt(JSON.parse(optionsKey), controller.signal).then(data => {
      if (!controller.signal.aborted) setPreview({ ...data, key: optionsKey });
    }).catch(error => { if (!controller.signal.aborted) setPreviewError({ key: optionsKey, message: error.message }); }), 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [optionsKey, catalog, form.view_type]);
  useEffect(() => {
    if (!isRendering) return;
    const started = Date.now(); const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [isRendering]);

  function update(name, value) {
    setForm(current => {
      const next = { ...current, [name]: value };
      if (['style', 'lighting', 'environment_context', 'material_mood'].includes(name)) next.archetype = null;
      if (name === 'geometry_mode' && value === 'strict') next.additions = [];
      if (name.endsWith('_material') && !value.trim()) next[`${name}_location`] = '';
      return next;
    });
    if (name === 'geometry_mode' && value === 'strict' && form.additions.length) setNotice('Đã xóa yêu cầu bổ sung khi chuyển sang Diễn họa.');
  }
  function selectView(view) {
    if (view === form.view_type) return;
    setForm(current => changeView(current, view)); setEpoch(e => e + 1);
    setReference(null);
    if (form.view_type) setNotice('Đã xóa phong cách, vật liệu, vị trí, ánh sáng, bối cảnh, mô tả không gian, ghi chú và bố trí của loại khung nhìn trước.');
  }
  async function loadFile(file, sampleView) {
    const sequence = ++imageSequence.current;
    setLoadingImage(true); setImageError('');
    try {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || !file.size || file.size > 24 * 1024 * 1024) throw new Error('Chọn PNG, JPEG hoặc WEBP, không rỗng và tối đa 24 MB.');
      const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Không đọc được ảnh.')); reader.readAsDataURL(file); });
      const dimensions = await new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight }); image.onerror = () => reject(new Error('Nội dung file không phải ảnh hợp lệ.')); image.src = data; });
      if (dimensions.width * dimensions.height > 24_000_000) throw new Error('Ảnh vượt 24 triệu điểm ảnh. Hãy xuất ảnh nhỏ hơn.');
      if (sequence !== imageSequence.current) return;
      setSource({ data, name: file.name, ...dimensions });
      if (source?.data !== data) {
        setReference(null);
        if (reference) setNotice('Đã bỏ phương án giữ cố định vì ảnh đầu vào đã thay đổi.');
      }
      if (sampleView) selectView(sampleView);
    } catch (error) { if (sequence === imageSequence.current) setImageError(error.message); }
    finally { if (sequence === imageSequence.current) setLoadingImage(false); }
  }
  async function loadSample(type) {
    setLoadingImage(true); setImageError('');
    try { await loadFile(await fetchSample(type), type === 'interior' ? 'interior' : 'exterior'); }
    catch (error) { setImageError(error.message); setLoadingImage(false); }
  }
  async function render() {
    if (busy.current || !source || preview?.key !== optionsKey || loadingImage) return;
    busy.current = true; setIsRendering(true); setElapsed(0); setRenderError('');
    const snapshot = { source: { ...source }, optionsKey };
    try {
      const response = await executeRender({ ...JSON.parse(optionsKey), image_base64: source.data });
      setResult({ ...response, ...snapshot });
    } catch (error) { setRenderError(error.message); }
    finally { busy.current = false; setIsRendering(false); }
  }
  const changed = result && (result.source.data !== source?.data || result.optionsKey !== optionsKey);
  const ready = source && !loadingImage && preview?.key === optionsKey && !isRendering && (health?.status === 'ready' || health?.mock_mode);
  return <><a className="skip-link" href="#main">Đến bảng yêu cầu</a><Header health={health} onRetry={refreshHealth} />
    <main id="main"><div className="page-intro"><div><p className="eyebrow">REVIT → PHỐI CẢNH</p><h1>Diễn họa từ mô hình của bạn</h1><p>Chỉ định phần cần thể hiện. Giữ kiến trúc làm cơ sở, đối chiếu từng kết quả trước khi tích hợp Revit.</p></div><span className="demo-label">Bản thử nghiệm</span></div>
      {notice && <div className="notice" role="status">{notice}<button type="button" aria-label="Đóng thông báo" onClick={() => setNotice('')}><X size={16} /></button></div>}
      <div className="workspace"><div className="form-column">
        <ModelUploader source={source} onFile={loadFile} view={form.view_type} onView={selectView} onSample={loadSample} loading={loadingImage} />
        {imageError && <p className="error" role="alert">{imageError}</p>}
        {catalogError ? <div className="error" role="alert">{catalogError}<button type="button" onClick={() => { setCatalogError(''); setReload(n => n + 1); }}>Tải lại danh mục</button></div> : !catalog ? <p role="status">Đang tải danh mục…</p> : !form.view_type ? <p className="notice">Chọn Nội thất hoặc Ngoại thất để mở bảng thiết lập thông số.</p> : <>
          <StyleControls form={form} catalog={catalog} onChange={update} />

          <div className="render-action-footer">
            <div className="render-action-controls">
              <select
                id="quality-select"
                className="quality-compact-select"
                value={form.quality}
                onChange={e => update('quality', e.target.value)}
                aria-label="Độ phân giải diễn họa"
              >
                <option value="preview_1k">1K (Xem nhanh)</option>
                <option value="final_2k">2K (Chi tiết cao)</option>
              </select>

              <button
                type="button"
                className="button primary render-button-main"
                disabled={!ready}
                onClick={render}
              >
                {isRendering ? (
                  <>Đang diễn họa với Gemini 3 Pro · {elapsed}s</>
                ) : (
                  <>
                    <span>Tạo ảnh diễn họa photorealistic</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>

            {!source && <p className="render-hint-text">Cần chọn ảnh Revit hoặc CAD trước khi tạo ảnh.</p>}
            {renderError && <p className="error" role="alert">{renderError}</p>}
          </div>
        </>}
      </div><aside className="reference-column"><ComparisonStudio source={source} result={result} isRendering={isRendering} elapsed={elapsed} changed={changed} /><p className="reference-footnote">Ảnh AI phục vụ trao đổi phương án kiến trúc. Đối chiếu với mô hình gốc để kiểm tra hình khối và chi tiết.</p></aside></div>
    </main><footer>BIMAutomation · Demo diễn họa nội thất và ngoại thất từ ảnh Revit</footer></>;
}
