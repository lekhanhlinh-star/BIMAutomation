import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../../api/services';
import { useAuthStore } from '../../store/useAuthStore';
import { ShieldCheck, ShoppingBag, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import TrialRegistrationModal from '../../components/TrialRegistrationModal';

export default function AccountDashboardPage() {
  const { user } = useAuthStore();
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);

  const { data: licenses = [] } = useQuery({
    queryKey: ['myLicenses'],
    queryFn: customerApi.getLicenses,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['myOrders'],
    queryFn: customerApi.getOrders,
  });

  const activeLicense = licenses.find((l) => l.status === 'ACTIVE');

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <div>
        <span className="text-xs font-mono font-bold text-[var(--brand)] tracking-wider uppercase px-2.5 py-1 rounded bg-[var(--brand-soft)] border border-[var(--line)]">
          Khách hàng BIMAutomation
        </span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Xin chào, {user?.name || user?.email?.split('@')[0] || 'Kỹ sư BIM'}
        </h2>
        <p className="mt-2 text-[var(--text-secondary)] text-sm max-w-xl leading-relaxed">
          Bản quyền và phiên dùng thử được liên kết tự động trực tiếp vào tài khoản Google của bạn. Không cần nhập mã kích hoạt phức tạp trong Revit.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-raised)] shadow-xs space-y-2">
          <div className="flex justify-between items-center text-[var(--text-secondary)] text-xs font-semibold">
            <span>Bản quyền hoạt động</span>
            <ShieldCheck className="w-4 h-4 text-[var(--brand)]" />
          </div>
          <p className="text-3xl font-mono font-extrabold text-[var(--text-primary)]">
            {licenses.filter((l) => l.status === 'ACTIVE').length}
          </p>
        </div>

        <div className="p-6 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-raised)] shadow-xs space-y-2">
          <div className="flex justify-between items-center text-[var(--text-secondary)] text-xs font-semibold">
            <span>Tổng số đơn hàng</span>
            <ShoppingBag className="w-4 h-4 text-[var(--brand)]" />
          </div>
          <p className="text-3xl font-mono font-extrabold text-[var(--text-primary)]">{orders.length}</p>
        </div>

        <div className="p-6 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-raised)] shadow-xs space-y-2">
          <div className="flex justify-between items-center text-[var(--text-secondary)] text-xs font-semibold">
            <span>Tài khoản Google</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate mt-2">{user?.email}</p>
        </div>
      </div>

      {/* Active License / Trial Display */}
      {activeLicense ? (
        <div className="panel p-6 space-y-4 bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[var(--brand)]" /> Bản quyền đang hoạt động
            </h3>
            <span className="status-tag status-tag--ok">Active</span>
          </div>

          <div className="p-5 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[var(--radius-control)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-base font-bold text-[var(--text-primary)]">{activeLicense.planName}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                Hạn sử dụng: <span className="text-[var(--brand)] font-bold">{activeLicense.expiresAt}</span> · Quyền lợi: <span className="text-emerald-600 dark:text-emerald-400 font-bold">Full 13 tính năng</span>
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                Tự động nhận diện khi bấm "Đăng nhập Google" trên Revit.
              </p>
            </div>
            <Link
              to="/account/licenses"
              className="secondary-button !min-h-9 !py-1.5 text-xs font-bold shrink-0"
            >
              Chi tiết bản quyền
            </Link>
          </div>
        </div>
      ) : user?.is_trial_registered ? (
        <div className="panel p-6 border border-[var(--brand)]/30 bg-[var(--brand-soft)]/30 rounded-[var(--radius-panel)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Dùng thử 14 ngày đã sẵn sàng
            </h3>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--brand)]/30">
              Trial Ready
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Bạn đã hoàn tất thông tin kỹ sư. Hãy mở phần mềm <strong>Autodesk Revit</strong> trên máy tính của bạn, bấm <strong>"Đăng nhập Google"</strong> để tự động mở khóa 14 ngày trải nghiệm Full Suite!
          </p>
        </div>
      ) : (
        <div className="panel p-6 border border-[var(--brand)]/20 bg-[var(--surface-raised)] rounded-[var(--radius-panel)] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> Bạn chưa đăng ký dùng thử 14 ngày?
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Chỉ cần điền nhanh thông tin kỹ sư (SĐT/Zalo, Phiên bản Revit) để nhận ngay 14 ngày dùng thử miễn phí Full Suite.
              </p>
            </div>
            <button
              onClick={() => setIsTrialModalOpen(true)}
              className="primary-button !min-h-10 !py-2 text-xs font-bold shrink-0 flex items-center gap-1.5"
            >
              Kích hoạt dùng thử 14 ngày <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Trial Registration Modal */}
      <TrialRegistrationModal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
      />
    </div>
  );
}
