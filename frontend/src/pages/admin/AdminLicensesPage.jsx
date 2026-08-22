import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/services';
import { RefreshCw, Lock, Loader2, Key, Monitor, PlusCircle, ShieldAlert } from 'lucide-react';

export default function AdminLicensesPage() {
  const [activeTab, setActiveTab] = useState('trials'); // 'trials' | 'paid'
  const queryClient = useQueryClient();

  const { data: licenses = [], isLoading: isLoadingLicenses } = useQuery({
    queryKey: ['adminLicenses'],
    queryFn: adminApi.getLicenses,
  });

  const { data: deviceTrials = [], isLoading: isLoadingTrials } = useQuery({
    queryKey: ['adminDeviceTrials'],
    queryFn: adminApi.getDeviceTrials,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['adminLicenses'] });
    queryClient.invalidateQueries({ queryKey: ['adminDeviceTrials'] });
  };

  const resetDevice = useMutation({
    mutationFn: (licenseId) => adminApi.resetLicenseDevice(licenseId),
    onSuccess: invalidate,
  });

  const revoke = useMutation({
    mutationFn: (licenseId) => adminApi.updateLicenseStatus(licenseId, 'REVOKED'),
    onSuccess: invalidate,
  });

  const resetTrial = useMutation({
    mutationFn: ({ trialId, days }) => adminApi.resetDeviceTrial(trialId, days),
    onSuccess: invalidate,
  });

  const blockTrial = useMutation({
    mutationFn: (trialId) => adminApi.blockDeviceTrial(trialId),
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Quản lý Bản quyền & Thiết bị</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Theo dõi thiết bị dùng thử 14 ngày và quản lý License Key kích hoạt trên Autodesk Revit.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-[var(--surface-subtle)] rounded-[var(--radius-control)] border border-[var(--line)] self-start">
          <button
            onClick={() => setActiveTab('trials')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-[var(--radius-control)] transition-all ${
              activeTab === 'trials'
                ? 'bg-[var(--surface-raised)] text-[var(--brand)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Thiết bị Dùng thử ({deviceTrials.length})
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-[var(--radius-control)] transition-all ${
              activeTab === 'paid'
                ? 'bg-[var(--surface-raised)] text-[var(--brand)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            License Key Trả phí ({licenses.length})
          </button>
        </div>
      </div>

      {/* TAB 1: THIẾT BỊ DÙNG THỬ 14 NGÀY */}
      {activeTab === 'trials' && (
        <>
          {isLoadingTrials ? (
            <div className="py-12 flex items-center gap-2.5 text-[var(--text-secondary)]">
              <Loader2 className="animate-spin" size={20} /> Đang tải danh sách thiết bị dùng thử...
            </div>
          ) : deviceTrials.length === 0 ? (
            <div className="panel p-8 text-center bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)]">
              <Monitor className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-60" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Chưa có thiết bị nào kích hoạt Dùng thử</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md mx-auto">
                Khi kỹ sư đăng nhập và chạy công cụ trên Autodesk Revit, thiết bị phần cứng sẽ tự động xuất hiện và được cấp 14 ngày trải nghiệm tại đây.
              </p>
            </div>
          ) : (
            <div className="panel overflow-x-auto bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="text-[var(--text-secondary)] uppercase font-mono bg-[var(--surface-subtle)] border-b border-[var(--line)] font-bold">
                  <tr>
                    <th className="px-4 py-3.5">#</th>
                    <th className="px-4 py-3.5">Thiết bị & HWID</th>
                    <th className="px-4 py-3.5">Email Kỹ sư</th>
                    <th className="px-4 py-3.5">Môi trường Revit</th>
                    <th className="px-4 py-3.5">Hạn dùng thử</th>
                    <th className="px-4 py-3.5">Thời hạn còn</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {deviceTrials.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-[var(--surface-subtle)]/50 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-[var(--text-muted)] font-bold">{idx + 1}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-[var(--text-primary)]">{t.displayName}</p>
                        <p className="font-mono text-[11px] text-[var(--text-muted)] truncate max-w-[140px]" title={t.fingerprintHash}>
                          {t.fingerprintHash.substring(0, 12)}...
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-[var(--brand)] font-medium">{t.userEmail}</td>
                      <td className="px-4 py-3.5 text-[var(--text-secondary)] font-mono">
                        {t.revitVersion} • {t.platform}
                      </td>
                      <td className="px-4 py-3.5 text-[var(--text-primary)]">{t.trialExpiresAt}</td>
                      <td className="px-4 py-3.5">
                        {t.status === 'ACTIVE' ? (
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            Còn {t.remainingDays} ngày
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)] font-mono">0 ngày</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`status-tag ${
                            t.status === 'ACTIVE'
                              ? 'status-tag--ok'
                              : t.status === 'EXPIRED'
                              ? 'status-tag--pending'
                              : 'bg-rose-500/15 text-rose-600 border-rose-500/30'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 flex items-center gap-1.5">
                        <button
                          onClick={() => resetTrial.mutate({ trialId: t.id, days: 14 })}
                          disabled={resetTrial.isPending}
                          className="px-2 py-1 rounded-[var(--radius-control)] border border-[var(--line)] text-[var(--brand)] hover:bg-[var(--brand)]/10 transition-colors text-[11px] font-bold flex items-center gap-1 disabled:opacity-40"
                          title="Gia hạn thêm 14 ngày dùng thử"
                        >
                          <PlusCircle className="w-3.5 h-3.5" /> +14 Ngày
                        </button>
                        <button
                          onClick={() => blockTrial.mutate(t.id)}
                          disabled={blockTrial.isPending || t.status === 'BLOCKED'}
                          className="p-1.5 rounded-[var(--radius-control)] border border-[var(--line)] text-[var(--text-secondary)] hover:text-rose-600 hover:border-rose-500 transition-colors disabled:opacity-40"
                          title="Khóa thiết bị chống gian lận"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* TAB 2: LICENSE KEY TRẢ PHÍ */}
      {activeTab === 'paid' && (
        <>
          {isLoadingLicenses ? (
            <div className="py-12 flex items-center gap-2.5 text-[var(--text-secondary)]">
              <Loader2 className="animate-spin" size={20} /> Đang tải danh sách bản quyền trả phí...
            </div>
          ) : licenses.length === 0 ? (
            <div className="panel p-8 text-center bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)]">
              <Key className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-60" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Chưa có License Key trả phí nào</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md mx-auto">
                Khi khách hàng đặt mua và hoàn tất thanh toán các gói bản quyền (Tháng / Năm / Vĩnh viễn), License Key sẽ tự động được cấp và quản lý tại đây.
              </p>
            </div>
          ) : (
            <div className="panel overflow-x-auto bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="text-[var(--text-secondary)] uppercase font-mono bg-[var(--surface-subtle)] border-b border-[var(--line)] font-bold">
                  <tr>
                    <th className="px-4 py-3.5">License Key</th>
                    <th className="px-4 py-3.5">Khách hàng</th>
                    <th className="px-4 py-3.5">Gói dịch vụ</th>
                    <th className="px-4 py-3.5">Thiết bị (HWID)</th>
                    <th className="px-4 py-3.5">Ngày hết hạn</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {licenses.map((lic) => (
                    <tr key={lic.id} className="hover:bg-[var(--surface-subtle)]/50 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-[var(--brand)] font-bold">{lic.key}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-[var(--text-primary)]">{lic.customer}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">{lic.email}</p>
                      </td>
                      <td className="px-4 py-3.5 text-[var(--text-secondary)] font-medium">{lic.plan}</td>
                      <td className="px-4 py-3.5 font-mono text-[var(--text-muted)]">{lic.device}</td>
                      <td className="px-4 py-3.5 text-[var(--text-primary)]">{lic.expiresAt}</td>
                      <td className="px-4 py-3.5">
                        <span className={`status-tag ${lic.status === 'ACTIVE' ? 'status-tag--ok' : 'status-tag--pending'}`}>{lic.status}</span>
                      </td>
                      <td className="px-4 py-3.5 flex items-center gap-1.5">
                        <button
                          onClick={() => resetDevice.mutate(lic.id)}
                          disabled={resetDevice.isPending}
                          className="p-1.5 rounded-[var(--radius-control)] border border-[var(--line)] text-[var(--text-secondary)] hover:text-[var(--brand)] hover:border-[var(--brand)] transition-colors disabled:opacity-40"
                          title="Reset thiết bị kích hoạt"
                          aria-label="Reset thiết bị kích hoạt"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => revoke.mutate(lic.id)}
                          disabled={revoke.isPending || lic.status === 'REVOKED'}
                          className="p-1.5 rounded-[var(--radius-control)] border border-[var(--line)] text-[var(--text-secondary)] hover:text-rose-600 hover:border-rose-500 transition-colors disabled:opacity-40"
                          title="Khóa/Thu hồi license"
                          aria-label="Khóa/Thu hồi license"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

