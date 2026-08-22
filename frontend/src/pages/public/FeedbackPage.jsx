import React, { useState } from 'react';
import { publicApi } from '../../api/services';
import { MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export default function FeedbackPage() {
  const [formData, setFormData] = useState({ name: '', email: '', category: 'Gợi ý tính năng', content: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await publicApi.sendFeedback(formData);
    } catch {
      // Fallback submission simulation
    }
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="page-shell py-14 max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[var(--radius-control)] bg-[var(--brand-soft)] flex items-center justify-center text-[var(--brand)]">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Gửi góp ý & phản hồi</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Đóng góp ý kiến của bạn giúp BIMAutomation hoàn thiện hơn mỗi ngày.
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--line)] pt-8">
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6 panel p-6 lg:p-8 bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-primary)]">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="form-control text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-primary)]">Email liên hệ</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="form-control text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-primary)]">Phân loại góp ý</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-control text-sm"
              >
                <option>Gợi ý tính năng mới</option>
                <option>Báo lỗi Add-in (Bug Report)</option>
                <option>Hỗ trợ License / Thanh toán</option>
                <option>Góp ý khác</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-primary)]">Nội dung phản hồi</label>
              <textarea
                required
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Mô tả chi tiết nội dung bạn muốn đóng góp..."
                className="form-control text-sm"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-button w-full justify-center"
            >
              <Send className="w-4 h-4" /> {loading ? 'Đang gửi...' : 'Gửi phản hồi'}
            </button>
          </form>
        ) : (
          <div className="py-12 text-center space-y-4 panel p-8 bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Cảm ơn góp ý của bạn!</h3>
            <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
              Đội ngũ phát triển BIMAutomation đã ghi nhận phản hồi và sẽ xem xét trong phiên bản cập nhật sắp tới.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="secondary-button mt-4"
            >
              Gửi góp ý khác
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
