import { Building2 } from 'lucide-react';
export default function Header({ health, onRetry }) {
  return <header className="app-header"><a className="brand" href="#main"><Building2 size={24} /><span>BIMAutomation <small>Phòng thử diễn họa</small></span></a>
    <button type="button" className="connection" onClick={onRetry}><span className={`status-dot ${health?.status === 'ready' ? 'ready' : ''}`} />
      {health?.mock_mode ? 'Chế độ mô phỏng' : health?.status === 'ready' ? 'Sẵn sàng tạo ảnh AI' : health?.status === 'unconfigured' ? 'Chưa cấu hình Gemini' : 'Kiểm tra kết nối'}
    </button></header>;
}
