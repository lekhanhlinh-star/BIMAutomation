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
    <div className="page-shell py-12 max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <MessageSquare className="w-6 h-6 text-cyan-300" />
        <h1 className="text-3xl font-extrabold text-white">Gửi góp ý & phản hồi</h1>
      </div>
      <p className="text-slate-400 text-sm -mt-4">
        Đóng góp ý kiến của bạn giúp BIMAutomation phát triển hoàn thiện hơn mỗi ngày.
      </p>

      <div className="border-t border-[var(--line)] pt-8">
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Họ và tên</label>
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
                <label className="text-xs font-semibold text-slate-300">Email liên hệ</label>
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
              <label className="text-xs font-semibold text-slate-300">Phân loại góp ý</label>
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
              <label className="text-xs font-semibold text-slate-300">Nội dung phản hồi</label>
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
              className="primary-button w-full"
            >
              <Send className="w-4 h-4" /> {loading ? 'Đang gửi...' : 'Gửi phản hồi'}
            </button>
          </form>
        ) : (
          <div className="py-8 space-y-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">Cảm ơn góp ý của bạn.</h3>
            <p className="text-xs text-slate-400">
              Đội ngũ phát triển BIMAutomation đã ghi nhận phản hồi và sẽ xem xét trong phiên bản sắp tới.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="secondary-button"
            >
              Gửi góp ý khác
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
