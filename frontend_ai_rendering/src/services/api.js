export const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/+$/, '');

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Không kết nối được máy chủ. Kiểm tra kết nối rồi thử lại.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data?.detail;
    const message = Array.isArray(detail)
      ? detail.map(e => `${e.loc?.filter(x => x !== 'body').join(' / ') || 'Yêu cầu'}: ${e.msg}`).join('\n')
      : typeof detail === 'string' ? detail : `Máy chủ trả lỗi ${response.status}. Vui lòng thử lại.`;
    throw new Error(message);
  }
  if (!data) throw new Error('Máy chủ trả dữ liệu không hợp lệ.');
  return data;
}

export const fetchPresets = signal => request('/api/v1/presets', { signal });
export const checkHealth = () => request('/api/v1/health');
export const previewPrompt = (options, signal) => request('/api/v1/prompt/preview', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(options), signal,
});
export const resolveImageUrl = url => url?.startsWith('/') ? `${API_BASE_URL}${url}` : url;
export async function executeRender(payload) {
  const data = await request('/api/v1/render', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  return { ...data, full_image_url: data.image_base64 || resolveImageUrl(data.image_url), download_url: resolveImageUrl(data.image_url) };
}
export async function fetchSample(type) {
  const filenames = { interior: 'sample_interior_view.png', exterior: 'sample_exterior_view.png', roof: 'sample_elevated_roof_view.png' };
  let response;
  try { response = await fetch(`${API_BASE_URL}/sample_data/${filenames[type]}`); }
  catch { throw new Error('Không kết nối được máy chủ để tải ảnh mẫu. Vui lòng thử lại.'); }
  if (!response.ok) throw new Error('Không tải được ảnh mẫu.');
  return new File([await response.blob()], filenames[type], { type: 'image/png' });
}
