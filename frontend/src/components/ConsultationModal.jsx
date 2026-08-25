import React, { useState } from 'react';
import { Building2, CheckCircle2, Loader2, Mail, Phone, Send, Sparkles, User, X } from 'lucide-react';
import AccessibleDialog from './AccessibleDialog';
import { publicApi } from '../api/services';
import AiToolIcon from './icons/AiToolIcon';

export default function ConsultationModal({ isOpen, onClose, defaultTopic = 'Tư vấn giải pháp & Báo giá Doanh nghiệp' }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    teamSize: '5-15 kỹ sư',
    interest: 'Toàn bộ gói Full Suite BIMAutomation',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const content = `[YÊU CẦU TƯ VẤN DOANH NGHIỆP]\n- Đơn vị: ${formData.company || 'Cá nhân/Studio'}\n- Quy mô: ${formData.teamSize}\n- SĐT: ${formData.phone}\n- Nhu cầu quan tâm: ${formData.interest}\n- Ghi chú: ${formData.note || 'Không có'}`;
      await publicApi.sendFeedback({
        name: formData.name,
        email: formData.email,
        category: 'Hỗ trợ License / Thanh toán',
        content: content
      });
    } catch {
      // Fallback
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      phone: '',
      email: '',
      company: '',
      teamSize: '5-15 kỹ sư',
      interest: 'Toàn bộ gói Full Suite BIMAutomation',
      note: ''
    });
    onClose();
  };

  return (
    <AccessibleDialog
      open={isOpen}
      onClose={handleReset}
      title={submitted ? "Đã tiếp nhận yêu cầu" : "Đăng ký Nhận Tư vấn & Trải nghiệm Doanh nghiệp"}
      description={submitted ? undefined : "Chuyên viên giải pháp BIMAutomation sẽ liên hệ trong vòng 15 phút để tư vấn demo và hỗ trợ cấp bản quyền dùng thử."}
    >
      {submitted ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-primary)]">Gửi yêu cầu thành công!</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            Cảm ơn bạn <strong className="text-[var(--text-primary)]">{formData.name}</strong>. Chúng tôi đã nhận được thông tin và sẽ liên hệ qua số điện thoại/email để gửi tài liệu giải pháp và kích hoạt bản quyền thử nghiệm cho đội ngũ.
          </p>
          <div className="p-4 bg-[var(--surface-subtle)] rounded-[var(--radius-control)] border border-[var(--line)] text-xs text-[var(--text-secondary)] text-left space-y-1">
            <p><strong>Hotline hỗ trợ trực tiếp:</strong> <a href="tel:0799660737" className="hover:underline text-[var(--brand)] font-semibold">0799 660 737</a> (8:00 - 18:00)</p>
            <p className="flex items-center gap-1.5">
              <img src="/assets/brand/zalo-icon.png" alt="Zalo" width={14} height={14} className="rounded-[3px] shrink-0" />
              <strong>Cộng đồng Zalo:</strong> <a href="https://zalo.me/g/euhwzpu6ouswooub16tl" target="_blank" rel="noopener noreferrer" className="hover:underline text-[var(--brand)] font-semibold">Tham gia nhóm Zalo hỗ trợ</a>
            </p>
          </div>
          <button
            onClick={handleReset}
            className="primary-button w-full justify-center mt-4"
          >
            Đóng cửa sổ
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none z-10" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Kỹ sư Nguyễn Văn A"
                  className="form-control form-control--with-icon text-sm w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Số điện thoại / Zalo <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none z-10" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0912 345 678"
                  className="form-control form-control--with-icon text-sm w-full"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Email công việc <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none z-10" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="engineer@company.com"
                  className="form-control form-control--with-icon text-sm w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Tên công ty / Studio thiết kế
              </label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none z-10" />
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Công ty CP Kiến trúc & Xây dựng..."
                  className="form-control form-control--with-icon text-sm w-full"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Quy mô đội ngũ Revit
              </label>
              <select
                value={formData.teamSize}
                onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                className="form-control text-sm w-full"
              >
                <option value="1-3 kỹ sư">1 - 3 kỹ sư (Cá nhân / Nhóm nhỏ)</option>
                <option value="4-10 kỹ sư">4 - 10 kỹ sư (Studio thiết kế)</option>
                <option value="11-30 kỹ sư">11 - 30 kỹ sư (Phòng BIM / Dự án)</option>
                <option value=">30 kỹ sư">&gt; 30 kỹ sư (Tổng thầu / Doanh nghiệp lớn)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 flex items-center justify-between gap-3 text-xs font-bold text-[var(--text-primary)]">
                <span>Phân hệ quan tâm nhất</span>
                <span className="flex items-center gap-1.5 text-[var(--text-secondary)]" aria-hidden="true">
                  <AiToolIcon tool="claude" size={16} />
                  <AiToolIcon tool="cursor" size={16} />
                </span>
              </label>
              <select
                value={formData.interest}
                onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                className="form-control text-sm w-full"
              >
                <option value="Toàn bộ gói Full Suite BIMAutomation">Trọn bộ Full Suite (AI Rebar + CAD + MCP)</option>
                <option value="Gói Cốt thép + AI (Rebar + AI Suite)">Gói Cốt thép + AI (Rebar + AI Suite)</option>
                <option value="Gói Cốt thép (Rebar Suite)">Gói Cốt thép (Rebar Suite)</option>
                <option value="Tích hợp 57 MCP Tools & Claude/Cursor">Tích hợp 57 MCP Tools & Claude/Cursor</option>
                <option value="Tùy biến Preset thiết kế riêng cho Doanh nghiệp">Tùy biến Preset riêng cho Doanh nghiệp</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
              Ghi chú thêm hoặc phiên bản Revit đang sử dụng
            </label>
            <textarea
              rows={2}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="VD: Cần demo trực tiếp qua Google Meet cho 10 kỹ sư, dùng Revit 2024..."
              className="form-control text-sm w-full"
            ></textarea>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="primary-button w-full justify-center !py-3 text-base shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Đang gửi yêu cầu...
                </>
              ) : (
                <>
                  <Send size={18} /> Gửi yêu cầu tư vấn & Dùng thử ngay
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-[var(--text-muted)] mt-2">
              Cam kết bảo mật thông tin 100% · Không làm phiền nếu không có nhu cầu
            </p>
          </div>
        </form>
      )}
    </AccessibleDialog>
  );
}
