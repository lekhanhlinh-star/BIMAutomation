import { useState, useRef, useCallback } from 'react';
import { Download, Image, Eye } from 'lucide-react';

const SAMPLE_ORIGINAL = { data: '/sample_cad_wireframe.png', width: 856, height: 1280 };
const SAMPLE_RESULT = {
  full_image_url: '/sample_target_render.jpg',
  download_url: '/sample_target_render.jpg',
  render_id: 'contemporary_arched_townhouse',
  metadata: {
    dimensions: { width: 856, height: 1280 },
    duration_seconds: 4.2,
    is_mock: false,
    warnings: [],
    prompt_type: 'exterior_contemporary_arched_townhouse',
    prompt_version: '2026-09-07.8',
    provider: 'google_genai_arch',
    model: 'gemini-image-arch-v2',
    prompt_used: 'Architectural photograph of a modern 2-story townhouse featuring curved parapet and deep arched recesses, pristine warm cream stucco facade, black aluminum fenestration, granite entry plinth, tropical midday sunlight with crisp architectural shadows, parked white car on asphalt road, leafy green trees.',
    summary: [
      'Khóa 100% khối vòm cong 2 tầng và ô cửa từ bản vẽ CAD',
      'Vật liệu hoàn thiện: vữa khoáng kem ngà, cửa nhôm kính sơn tĩnh điện đen, bậc tam cấp đá granite xám đậm',
      'Ánh sáng tự nhiên nhiệt đới ban ngày, bóng đổ chân thực dưới ban công vòm cong'
    ]
  }
};

export default function ComparisonStudio({ source, result, isRendering, elapsed, changed }) {
  const [mode, setMode] = useState('slider');
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showSample, setShowSample] = useState(!source && !result);
  const containerRef = useRef(null);

  const activeResult = result || (showSample && !source ? SAMPLE_RESULT : null);
  const activeOriginal = activeResult?.source || source || (showSample ? SAMPLE_ORIGINAL : null);
  const ratio = activeOriginal ? `${activeOriginal.width} / ${activeOriginal.height}` : '4 / 3';

  const updatePosition = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clamped = Math.max(0, Math.min(x, rect.width));
    const percent = Math.round((clamped / rect.width) * 100);
    setPosition(percent);
  }, []);

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
      setIsDragging(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPosition(prev => Math.max(0, prev - 3));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPosition(prev => Math.min(100, prev + 3));
    }
  };

  return (
    <section className="panel comparison" aria-labelledby="comparison-heading">
      <div className="section-heading">
        <div>
          <h2 id="comparison-heading">Ảnh tham chiếu và kết quả</h2>
          <p>{activeResult ? 'Ảnh gốc được giữ theo đúng lượt tạo kết quả này.' : 'Đối chiếu kiến trúc, vật liệu và vị trí bố trí.'}</p>
        </div>
        {!result && (
          <button
            type="button"
            className={`sample-pill-btn ${showSample ? 'active' : ''}`}
            onClick={() => setShowSample(prev => !prev)}
            title="Bật/tắt xem mẫu đối chiếu CAD và Render"
          >
            <Eye size={13} /> {showSample ? 'Đang xem mẫu' : 'Xem mẫu'}
          </button>
        )}
      </div>

      {isRendering && <p className="notice" role="status">Đang tạo ảnh theo yêu cầu đã gửi · {elapsed}s</p>}
      {changed && result && <p className="notice">Form hoặc ảnh đầu vào đã thay đổi. Bên dưới là kết quả của lượt trước.</p>}
      {activeResult?.metadata.is_mock && <p className="notice warning" role="status">Ảnh mô phỏng để thử giao diện — không dùng đánh giá chất lượng AI.</p>}
      {activeResult?.metadata.warnings?.map(message => <p className="notice warning" key={message}>{message}</p>)}

      {!activeOriginal ? (
        <div className="empty-canvas">
          <Image size={36} />
          <p>Chọn ảnh Revit hoặc CAD để bắt đầu</p>
          <small>Ảnh gốc luôn là cơ sở đối chiếu hình khối</small>
          <button type="button" className="button secondary" style={{ marginTop: 14 }} onClick={() => setShowSample(true)}>
            <Eye size={14} /> Xem thử mẫu đối chiếu nhà phố vòm cong
          </button>
        </div>
      ) : (
        <>
          {activeResult && (
            <div className="comparison-modes" role="group" aria-label="Cách so sánh">
              {[
                ['slider', 'Kéo so sánh'],
                ['side', 'Song song'],
                ['result', 'Ảnh kết quả']
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={mode === value}
                  onClick={() => setMode(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className={mode === 'side' && activeResult ? 'side-images' : ''}>
            <div
              ref={containerRef}
              className={`image-canvas lovable-canvas ${mode === 'slider' && activeResult ? 'is-interactive' : ''} ${isDragging ? 'is-dragging' : ''}`}
              style={{ aspectRatio: ratio }}
              tabIndex={mode === 'slider' && activeResult ? 0 : undefined}
              role={mode === 'slider' && activeResult ? 'slider' : undefined}
              aria-label="Kéo thanh trượt để so sánh khối CAD và Render AI"
              aria-valuenow={position}
              aria-valuemin={0}
              aria-valuemax={100}
              onPointerDown={mode === 'slider' && activeResult ? handlePointerDown : undefined}
              onPointerMove={mode === 'slider' && activeResult ? handlePointerMove : undefined}
              onPointerUp={mode === 'slider' && activeResult ? handlePointerUp : undefined}
              onPointerCancel={mode === 'slider' && activeResult ? handlePointerUp : undefined}
              onKeyDown={mode === 'slider' && activeResult ? handleKeyDown : undefined}
            >
              {/* Base Result Image (Right/Under) */}
              <img
                src={activeResult && mode !== 'side' ? activeResult.full_image_url : activeOriginal.data}
                alt={activeResult && mode !== 'side' ? 'Kết quả diễn họa photoreal' : 'Ảnh Revit / CAD gốc'}
                className="base-image"
                draggable={false}
              />

              {/* Clipped Original Overlay (Left/Over) */}
              {activeResult && mode === 'slider' && (
                <>
                  <img
                    className="original-overlay"
                    src={activeOriginal.data}
                    alt="Khối CAD gốc đối chiếu"
                    style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
                    draggable={false}
                  />

                  {/* Lovable-Style Amber Vertical Divider Line with Glow */}
                  <div
                    className="lovable-slider-line"
                    style={{ left: `${position}%` }}
                    aria-hidden="true"
                  >
                    {/* Lovable Circular Drag Handle */}
                    <div className="lovable-slider-handle" aria-hidden="true">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: -6 }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>

                  {/* Lovable-Grade Badges */}
                  <div className="slider-badge before-badge">
                    <span>Trước</span> CAD / Revit
                  </div>
                  <div className="slider-badge after-badge">
                    <span>Sau</span> AI Render
                  </div>
                </>
              )}
            </div>

            {activeResult && mode === 'side' && (
              <div className="image-canvas" style={{ aspectRatio: ratio }}>
                <img src={activeResult.full_image_url} alt="Kết quả diễn họa để đối chiếu" />
                <div className="slider-badge after-badge" style={{ top: 12, right: 12, bottom: 'auto' }}>
                  <span>Sau</span> AI Render
                </div>
              </div>
            )}
          </div>

          <div className="image-caption">
            <span>{activeResult && mode === 'result' ? 'Kết quả hoàn thiện' : 'Khối dựng Revit / CAD gốc'}</span>
            {activeResult && mode !== 'result' && <span>Ảnh render AI thực tế</span>}
          </div>
        </>
      )}

      {activeResult && (
        <div className="result-details">
          <p>
            {activeResult.metadata.dimensions.width} × {activeResult.metadata.dimensions.height} px · {activeResult.metadata.duration_seconds}s
          </p>
          <ul className="result-summary">
            {activeResult.metadata.summary.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
          <div className="result-actions">
            <a
              className="button secondary"
              href={activeResult.download_url}
              download={`${activeResult.render_id}.png`}
              target="_blank"
              rel="noreferrer"
            >
              <Download size={16} /> Tải ảnh
            </a>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                const blob = new Blob([JSON.stringify(activeResult.metadata, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = `${activeResult.render_id}_yeu-cau.json`;
                anchor.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              Tải yêu cầu đối chiếu
            </button>
          </div>
          <details>
            <summary>Chi tiết prompt kỹ thuật của kết quả</summary>
            <p>
              {activeResult.metadata.prompt_type} · {activeResult.metadata.prompt_version} · {activeResult.metadata.provider} · {activeResult.metadata.model}
            </p>
            <pre>{activeResult.metadata.prompt_used}</pre>
          </details>
        </div>
      )}
    </section>
  );
}

