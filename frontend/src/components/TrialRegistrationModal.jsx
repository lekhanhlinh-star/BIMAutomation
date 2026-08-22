import React, { useState } from 'react';
import { Loader2, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import BrandLogo from './BrandLogo';

export default function TrialRegistrationModal({ isOpen, onClose, onSuccess }) {
  const { user, registerTrial, isLoading } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    job_title: user?.job_title || 'Kỹ sư Kết cấu (Structural Engineer)',
    revit_version: user?.revit_version || '2025',
    use_case: user?.use_case || 'Toàn bộ tính năng tự động hóa Revit',
    terms_accepted: true,
  });

  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 8) {
      setError('Vui lòng nhập số điện thoại / Zalo hợp lệ để nhận hỗ trợ kỹ thuật.');
      return;
    }
    if (!formData.terms_accepted) {
      setError('Vui lòng đồng ý với điều khoản sử dụng để tiếp tục.');
      return;
    }

    const res = await registerTrial(formData);
    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 1500);
    } else {
      setError(res.error || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-2xl overflow-hidden p-6 md:p-8">
        
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-[var(--radius-control)] hover:bg-[var(--surface-subtle)] transition-colors"
          >
            <X size={20} />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <BrandLogo size="md" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Đăng ký dùng thử RevitAPP
          </h2>
          <p className="mt-1 text-sm text-[var(--brand)] font-semibold">
            Trải nghiệm miễn phí 14 ngày đầy đủ tính năng tự động hóa BIM
          </p>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center space-y-4">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-500">
              <CheckCircle2 size={48} className="animate-bounce" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Đăng ký dùng thử thành công!</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Tài khoản của bạn đã được kích hoạt phiên dùng thử. Đang chuyển hướng...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-[var(--radius-control)] text-rose-600 dark:text-rose-300 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Họ và tên */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-control text-sm"
                />
              </div>

              {/* Email (Readonly từ Google) */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                  Email đăng nhập
                </label>
                <input
                  type="email"
                  readOnly
                  disabled
                  value={user?.email || ''}
                  className="form-control text-sm opacity-70 bg-[var(--surface-subtle)] cursor-not-allowed"
                />
              </div>

              {/* Số điện thoại / Zalo */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                  Số điện thoại / Zalo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0912 345 678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="form-control text-sm"
                />
              </div>

              {/* Vị trí nghề nghiệp */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                  Vị trí / Nghề nghiệp <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  className="form-control text-sm"
                >
                  <option value="Kỹ sư Kết cấu (Structural Engineer)">Kỹ sư Kết cấu (Structural Engineer)</option>
                  <option value="Kỹ sư MEP / Cơ điện (MEP Engineer)">Kỹ sư MEP / Cơ điện (MEP Engineer)</option>
                  <option value="Kiến trúc sư (Architect)">Kiến trúc sư (Architect)</option>
                  <option value="BIM Manager / BIM Coordinator">BIM Manager / BIM Coordinator</option>
                  <option value="BIM Modeler / Họa viên">BIM Modeler / Họa viên</option>
                  <option value="Quản lý dự án / Giám sát">Quản lý dự án / Giám sát</option>
                  <option value="Sinh viên ngành Xây dựng / Kiến trúc">Sinh viên ngành Xây dựng / Kiến trúc</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              {/* Phiên bản Revit */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                  Phiên bản Revit đang dùng <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.revit_version}
                  onChange={(e) => setFormData({ ...formData, revit_version: e.target.value })}
                  className="form-control text-sm"
                >
                  <option value="2027">Autodesk Revit 2027</option>
                  <option value="2026">Autodesk Revit 2026</option>
                  <option value="2025">Autodesk Revit 2025</option>
                  <option value="2024">Autodesk Revit 2024</option>
                  <option value="2023">Autodesk Revit 2023</option>
                  <option value="2022">Autodesk Revit 2022</option>
                </select>
              </div>

              {/* Nhu cầu chính */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                  Nhu cầu quan tâm chính
                </label>
                <select
                  value={formData.use_case}
                  onChange={(e) => setFormData({ ...formData, use_case: e.target.value })}
                  className="form-control text-sm"
                >
                  <option value="Toàn bộ tính năng tự động hóa Revit">Toàn bộ tính năng tự động hóa Revit</option>
                  <option value="Bố trí cốt thép tự động (Dầm, Cột, Móng, Vách)">Bố trí cốt thép tự động (Dầm, Cột, Móng, Vách)</option>
                  <option value="Dựng hình từ CAD sang Revit (Model from CAD)">Dựng hình từ CAD sang Revit (Model from CAD)</option>
                  <option value="Trợ lý AI MCP & Tự động xuất bản vẽ">Trợ lý AI MCP & Tự động xuất bản vẽ</option>
                  <option value="Xuất DWG & Tiện ích quản lý BIM">Xuất DWG & Tiện ích quản lý BIM</option>
                </select>
              </div>
            </div>

            {/* Checkbox điều khoản */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.terms_accepted}
                  onChange={(e) => setFormData({ ...formData, terms_accepted: e.target.checked })}
                  className="mt-0.5 rounded border-[var(--line)] text-[var(--brand)] focus:ring-[var(--brand)]"
                />
                <span>
                  Tôi đồng ý với các điều khoản trong{' '}
                  <span className="text-[var(--brand)] hover:underline font-medium">Chính sách bảo vệ dữ liệu</span> và{' '}
                  <span className="text-[var(--brand)] hover:underline font-medium">Quy định cấp phép dùng thử</span> của BIMAutomation.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="primary-button w-full justify-center !py-3 text-sm font-bold"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Đang kích hoạt bản quyền thử nghiệm...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Bắt đầu dùng thử ngay</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
