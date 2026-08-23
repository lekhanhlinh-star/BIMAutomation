import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../../api/services';
import { ShieldCheck, Monitor, CheckCircle2, Sparkles, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LicensesPage() {
  const { data: licenses = [], isLoading } = useQuery({
    queryKey: ['myLicenses'],
    queryFn: customerApi.getLicenses,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[var(--brand)]" /> Bản quyền BIMAutomation đã kích hoạt
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Hệ thống cấp quyền Server-Authoritative theo Tài khoản Google OAuth PKCE. Không cần nhập mã kích hoạt trong Revit.
        </p>
      </div>

      {/* Guide Banner */}
      <div className="p-5 rounded-[var(--radius-panel)] bg-[var(--brand-soft)]/30 border border-[var(--brand)]/30 flex items-start gap-3.5 shadow-xs">
        <Sparkles className="w-5 h-5 text-[var(--brand)] shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--text-secondary)] space-y-1.5 leading-relaxed">
          <p className="font-bold text-[var(--text-primary)] text-sm">Cách kích hoạt trên Autodesk Revit:</p>
          <p>1. Mở phần mềm Autodesk Revit trên máy tính của bạn.</p>
          <p>2. Trên thanh Ribbon <strong>LDL-STRUCTURAL</strong>, bấm <strong>"Đăng nhập Google"</strong>.</p>
          <p>3. Add-in sẽ tự động nhận diện bản quyền từ tài khoản Google và mở khóa các tính năng tương ứng theo gói.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex items-center gap-2.5 text-[var(--text-secondary)]">
          <Loader2 className="animate-spin" size={20} /> Đang tải thông tin bản quyền...
        </div>
      ) : licenses.length === 0 ? (
        <div className="panel p-8 text-center space-y-3 bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
          <ShieldCheck className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
          <p className="text-base font-bold text-[var(--text-primary)]">Chưa có gói bản quyền trả phí nào được kích hoạt.</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Bạn có thể đăng ký dùng thử 14 ngày miễn phí hoặc mua gói bản quyền để liên kết tự động vào tài khoản.
          </p>
          <div className="pt-2">
            <Link to="/pricing" className="primary-button inline-flex items-center gap-2 text-xs font-bold">
              Xem bảng giá các gói <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {licenses.map((lic) => (
            <div key={lic.id} className="panel p-6 space-y-4 bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[var(--line)]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold text-[var(--text-primary)]">{lic.planName}</span>
                    <span className={`status-tag ${lic.status === 'ACTIVE' ? 'status-tag--ok' : 'status-tag--off'}`}>
                      {lic.status === 'ACTIVE' ? 'Đang hoạt động' : lic.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Ngày bắt đầu: <span className="text-[var(--text-primary)] font-medium">{lic.activatedAt || 'Hôm nay'}</span> · Hạn sử dụng: <span className="text-[var(--brand)] font-bold">{lic.expiresAt}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Google Account Linked
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[var(--radius-control)] flex items-center gap-3">
                  <Monitor className="w-4 h-4 text-[var(--brand)] shrink-0" />
                  <div>
                    <span className="text-[var(--text-muted)] block text-[11px]">Thiết bị kích hoạt</span>
                    <span className="font-bold text-[var(--text-primary)]">{lic.activeDevices || 1} / {lic.maxDevices || 1} máy tính</span>
                  </div>
                </div>
                <div className="p-3.5 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[var(--radius-control)] flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="text-[var(--text-muted)] block text-[11px]">Quyền lợi tính năng</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Mở khóa Full Suite (13 Tính năng)</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
