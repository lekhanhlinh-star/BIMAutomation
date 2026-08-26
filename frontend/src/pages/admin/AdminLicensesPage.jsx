import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/services';
import { 
  RefreshCw, 
  Lock, 
  Unlock, 
  Loader2, 
  Key, 
  Monitor, 
  PlusCircle, 
  ShieldAlert, 
  RotateCcw, 
  Search, 
  Laptop, 
  Clock, 
  Sparkles, 
  UserCheck, 
  ShieldCheck,
  CheckCircle2,
  Trash2
} from 'lucide-react';

export default function AdminLicensesPage() {
  const [activeTab, setActiveTab] = useState('trials'); // 'trials' | 'paid'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ONLINE' | 'ACTIVE' | 'BLOCKED' | 'EXPIRED'
  const queryClient = useQueryClient();

  const { data: licenses = [], isLoading: isLoadingLicenses } = useQuery({
    queryKey: ['adminLicenses'],
    queryFn: adminApi.getLicenses,
    refetchInterval: 60_000,
  });

  const { data: deviceTrials = [], isLoading: isLoadingTrials } = useQuery({
    queryKey: ['adminDeviceTrials'],
    queryFn: adminApi.getDeviceTrials,
    refetchInterval: 60_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['adminLicenses'] });
    queryClient.invalidateQueries({ queryKey: ['adminDeviceTrials'] });
  };

  // Paid License Mutations
  const resetDevice = useMutation({
    mutationFn: (licenseId) => adminApi.resetLicenseDevice(licenseId),
    onSuccess: invalidate,
  });

  const revokeLicense = useMutation({
    mutationFn: (licenseId) => adminApi.updateLicenseStatus(licenseId, 'REVOKED'),
    onSuccess: invalidate,
  });

  const grantLicense = useMutation({
    mutationFn: (licenseId) => adminApi.updateLicenseStatus(licenseId, 'ACTIVE'),
    onSuccess: invalidate,
  });

  // Device Trial Mutations
  const resetTrial = useMutation({
    mutationFn: ({ trialId, days }) => adminApi.resetDeviceTrial(trialId, days),
    onSuccess: invalidate,
  });

  const grantTrial = useMutation({
    mutationFn: ({ trialId, days }) => adminApi.grantDeviceTrial(trialId, days),
    onSuccess: invalidate,
  });

  const revokeTrial = useMutation({
    mutationFn: (trialId) => adminApi.revokeDeviceTrial(trialId),
    onSuccess: invalidate,
  });

  const deleteTrial = useMutation({
    mutationFn: (trialId) => adminApi.deleteDeviceTrial(trialId),
    onSuccess: invalidate,
  });


  // Summary Metrics
  const onlineCount = useMemo(
    () => deviceTrials.filter((t) => t.status === 'ACTIVE' && t.isOnline).length,
    [deviceTrials]
  );
  const activeTrialsCount = useMemo(
    () => deviceTrials.filter((t) => t.status === 'ACTIVE').length,
    [deviceTrials]
  );
  const paidActiveCount = useMemo(
    () => licenses.filter((l) => l.status === 'ACTIVE').length,
    [licenses]
  );

  // Filtered Trials
  const filteredTrials = useMemo(() => {
    return deviceTrials.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.displayName?.toLowerCase().includes(q) ||
        t.userEmail?.toLowerCase().includes(q) ||
        t.fingerprintHash?.toLowerCase().includes(q) ||
        t.revitVersion?.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (statusFilter === 'ONLINE') return t.status === 'ACTIVE' && t.isOnline;
      if (statusFilter === 'ACTIVE') return t.status === 'ACTIVE';
      if (statusFilter === 'BLOCKED') return t.status === 'BLOCKED';
      if (statusFilter === 'EXPIRED') return t.status === 'EXPIRED';
      return true;
    });
  }, [deviceTrials, searchQuery, statusFilter]);

  // Filtered Paid Licenses
  const filteredLicenses = useMemo(() => {
    return licenses.filter((l) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        l.customer?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.plan?.toLowerCase().includes(q) ||
        l.device?.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (statusFilter === 'ONLINE') return l.status === 'ACTIVE' && l.isOnline;
      if (statusFilter === 'ACTIVE') return l.status === 'ACTIVE';
      if (statusFilter === 'BLOCKED') return l.status === 'REVOKED' || l.status === 'SUSPENDED';
      if (statusFilter === 'EXPIRED') return l.status === 'EXPIRED';
      return true;
    });
  }, [licenses, searchQuery, statusFilter]);

  return (
    <div className="admin-page space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--brand)]/20">
              Server-Authoritative
            </span>
            <span className="text-xs text-[var(--text-muted)] font-medium">Google OAuth 2.0 PKCE</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mt-1 tracking-tight">
            Quản lý Bản quyền & Thiết bị
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Theo dõi trạng thái thiết bị dùng thử 14 ngày và điều phối các gói bản quyền trả phí Autodesk Revit.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-[var(--surface-subtle)] rounded-xl border border-[var(--line)] self-start shadow-xs">
          <button
            onClick={() => {
              setActiveTab('trials');
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'trials'
                ? 'bg-[var(--surface-raised)] text-[var(--brand)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Thiết bị Dùng thử</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--brand)]/20">
              {deviceTrials.length}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab('paid');
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'paid'
                ? 'bg-[var(--surface-raised)] text-[var(--brand)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Bản quyền Trả phí</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {licenses.length}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--line)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
            <span>Tổng thiết bị</span>
            <Monitor className="w-4 h-4 text-[var(--brand)]" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-[var(--text-primary)]">{deviceTrials.length}</p>
          <p className="text-[11px] text-[var(--text-secondary)]">Đã đăng ký trải nghiệm</p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--line)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
            <span>Đang Online</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p role="status" aria-label={`${onlineCount} thiết bị đang online`} className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{onlineCount}</p>
          <p className="text-[11px] text-[var(--text-secondary)]">Có tín hiệu trong 7 phút gần nhất</p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--line)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
            <span>Còn hạn dùng thử</span>
            <Clock className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-[var(--text-primary)]">{activeTrialsCount}</p>
          <p className="text-[11px] text-[var(--text-secondary)]">Trong thời gian 14 ngày</p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--line)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
            <span>Gói Trả phí Active</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-[var(--text-primary)]">{paidActiveCount}</p>
          <p className="text-[11px] text-[var(--text-secondary)]">Tổng {licenses.length} bản quyền</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-[var(--surface-raised)] border border-[var(--line)] rounded-xl shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder={activeTab === 'trials' ? "Tìm theo tên máy, email kỹ sư, HWID, Revit..." : "Tìm theo tên khách hàng, email, gói dịch vụ, HWID..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[var(--surface)] border border-[var(--line)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] text-[var(--text-muted)] font-medium mr-1">Bộ lọc:</span>
          {(activeTab === 'trials'
            ? [
                { id: 'ALL', label: 'Tất cả' },
                { id: 'ONLINE', label: 'Đang Online' },
                { id: 'ACTIVE', label: 'Còn hạn' },
                { id: 'BLOCKED', label: 'Đã khóa' },
                { id: 'EXPIRED', label: 'Hết hạn' },
              ]
            : [
                { id: 'ALL', label: 'Tất cả' },
                { id: 'ONLINE', label: 'Đang Online' },
                { id: 'ACTIVE', label: 'Đang hoạt động' },
                { id: 'BLOCKED', label: 'Đã khóa' },
                { id: 'EXPIRED', label: 'Hết hạn' },
              ]
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                statusFilter === f.id
                  ? 'bg-[var(--brand)] text-white font-bold shadow-xs'
                  : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--line)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: THIẾT BỊ DÙNG THỬ 14 NGÀY */}
      {activeTab === 'trials' && (
        <>
          {isLoadingTrials ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-[var(--text-secondary)] bg-[var(--surface-raised)] border border-[var(--line)] rounded-xl">
              <Loader2 className="animate-spin text-[var(--brand)]" size={24} />
              <p className="text-xs font-medium">Đang tải danh sách thiết bị dùng thử...</p>
            </div>
          ) : filteredTrials.length === 0 ? (
            <div className="panel p-10 text-center bg-[var(--surface-raised)] border border-[var(--line)] rounded-xl shadow-xs space-y-3">
              <Laptop className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-50" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {searchQuery ? "Không tìm thấy thiết bị phù hợp với bộ lọc" : "Chưa có thiết bị nào kích hoạt Dùng thử"}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
                Khi kỹ sư bấm "Đăng nhập Google" trong Autodesk Revit, phần cứng máy tính sẽ tự động liên kết và cấp 14 ngày trải nghiệm tại đây.
              </p>
            </div>
          ) : (
            <div className="panel overflow-hidden bg-[var(--surface-raised)] border border-[var(--line)] rounded-xl shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] text-[var(--text-secondary)] uppercase font-mono bg-[var(--surface-subtle)] border-b border-[var(--line)] font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5 w-12 text-center">#</th>
                      <th className="px-4 py-3.5 min-w-[200px]">Thiết bị & Tên máy</th>
                      <th className="px-4 py-3.5 min-w-[220px]">Kỹ sư (Google Account)</th>
                      <th className="px-4 py-3.5 min-w-[140px]">Môi trường</th>
                      <th className="px-4 py-3.5 min-w-[160px]">Thời hạn dùng thử</th>
                      <th className="px-4 py-3.5 min-w-[150px]">Trạng thái</th>
                      <th className="px-4 py-3.5 min-w-[200px] text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {filteredTrials.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-[var(--surface-subtle)]/60 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-[var(--text-muted)] text-center font-bold">
                          {idx + 1}
                        </td>
                        
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0 border border-[var(--brand)]/20">
                              <Laptop className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[var(--text-primary)] text-xs tracking-tight truncate">
                                {t.displayName || 'Workstation'}
                              </p>
                              <span 
                                className="font-mono text-[10px] text-[var(--text-muted)] bg-[var(--surface-subtle)] px-1.5 py-0.2 rounded border border-[var(--line)] inline-block mt-0.5 truncate max-w-[150px]"
                                title={t.fingerprintHash}
                              >
                                {t.fingerprintHash?.substring(0, 14)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="text-[var(--brand)] font-medium text-xs truncate max-w-[220px]">
                            {t.userEmail}
                          </p>
                          <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                            Bắt đầu: {t.firstTrialAt}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--surface-subtle)] border border-[var(--line)] text-[11px] font-mono font-medium text-[var(--text-secondary)] whitespace-nowrap">
                            <span>{t.revitVersion && t.revitVersion !== 'unknown' ? `Revit ${t.revitVersion}` : 'Revit 2025'}</span>
                            <span className="text-[var(--text-muted)]">•</span>
                            <span>Windows</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {t.status === 'ACTIVE' ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <Clock className="w-3 h-3" /> Còn {t.remainingDays} ngày
                              </span>
                              <p className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                                Hết hạn: {t.trialExpiresAt}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-slate-500/10 text-[var(--text-muted)] border border-[var(--line)]">
                                0 ngày
                              </span>
                              <p className="text-[10px] text-rose-500/80 font-medium mt-1 font-mono">
                                Hết hạn: {t.trialExpiresAt}
                              </p>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div>
                            {t.status === 'ACTIVE' ? (
                              t.isOnline ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Đang Online
                              </span>
                            ) : t.isCurrentlyActive ? (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-500/10 text-[var(--text-secondary)] border border-[var(--line)]"
                                title={`Lần cuối nhận tín hiệu: ${t.lastSeenAt}`}
                              >
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                Offline
                              </span>
                            ) : (
                              <span 
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30" 
                                title="Phiên làm việc đã chuyển sang thiết bị khác của cùng tài khoản"
                              >
                                Đã chuyển máy
                              </span>
                            )
                          ) : t.status === 'BLOCKED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              <Lock className="w-3 h-3" />
                              Đã khóa (BLOCKED)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/15 text-[var(--text-secondary)] border border-[var(--line)]">
                              <Clock className="w-3 h-3 text-rose-500" />
                              Đã hết hạn
                            </span>
                            )}
                            <p className="mt-1 text-[10px] font-mono text-[var(--text-muted)]">
                              Tín hiệu cuối: {t.lastSeenAt}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {t.status === 'ACTIVE' ? (
                              <>
                                <button
                                  onClick={() => resetTrial.mutate({ trialId: t.id, days: 14 })}
                                  disabled={resetTrial.isPending}
                                  className="h-7.5 px-2.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--text-primary)] hover:text-[var(--brand)] hover:bg-[var(--brand-soft)] hover:border-[var(--brand)]/40 transition-all text-[11px] font-semibold inline-flex items-center gap-1.5 shadow-2xs disabled:opacity-40 whitespace-nowrap cursor-pointer"
                                  title="Cộng thêm 14 ngày dùng thử cho máy này"
                                >
                                  <PlusCircle className="w-3.5 h-3.5 text-[var(--brand)]" />
                                  <span>+14 Ngày</span>
                                </button>

                                <button
                                  onClick={() => revokeTrial.mutate(t.id)}
                                  disabled={revokeTrial.isPending}
                                  className="h-7.5 w-7.5 rounded-lg border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all inline-flex items-center justify-center disabled:opacity-40 cursor-pointer"
                                  title="Thu hồi quyền dùng thử và khóa thiết bị này"
                                  aria-label="Thu hồi quyền"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : t.status === 'BLOCKED' ? (
                              <button
                                onClick={() => grantTrial.mutate({ trialId: t.id, days: 14 })}
                                disabled={grantTrial.isPending}
                                className="h-7.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all text-[11px] font-bold inline-flex items-center gap-1.5 shadow-xs disabled:opacity-40 whitespace-nowrap cursor-pointer"
                                title="Mở khóa và kích hoạt lại quyền dùng thử cho thiết bị này"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Mở khóa & Kích hoạt lại</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => grantTrial.mutate({ trialId: t.id, days: 14 })}
                                disabled={grantTrial.isPending}
                                className="h-7.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all text-[11px] font-bold inline-flex items-center gap-1.5 shadow-xs disabled:opacity-40 whitespace-nowrap cursor-pointer"
                                title="Khôi phục 14 ngày dùng thử cho thiết bị này"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Cấp lại 14 ngày</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn thiết bị "${t.displayName || 'máy tính'}" (${t.fingerprintHash?.substring(0, 12)}...) khỏi hệ thống không?`)) {
                                  deleteTrial.mutate(t.id);
                                }
                              }}
                              disabled={deleteTrial.isPending}
                              className="h-7.5 w-7.5 rounded-lg border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 transition-all inline-flex items-center justify-center disabled:opacity-40 cursor-pointer"
                              title="Xóa vĩnh viễn thiết bị này khỏi danh sách"
                              aria-label="Xóa thiết bị"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: BẢN QUYỀN TRẢ PHÍ */}
      {activeTab === 'paid' && (
        <>
          {isLoadingLicenses ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-[var(--text-secondary)] bg-[var(--surface-raised)] border border-[var(--line)] rounded-xl">
              <Loader2 className="animate-spin text-[var(--brand)]" size={24} />
              <p className="text-xs font-medium">Đang tải danh sách bản quyền trả phí...</p>
            </div>
          ) : filteredLicenses.length === 0 ? (
            <div className="panel p-10 text-center bg-[var(--surface-raised)] border border-[var(--line)] rounded-xl shadow-xs space-y-3">
              <ShieldCheck className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-50" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {searchQuery || statusFilter !== 'ALL' ? "Không tìm thấy bản quyền phù hợp với bộ lọc" : "Chưa có bản quyền trả phí nào"}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
                Khi khách hàng đặt mua và hoàn tất thanh toán các gói bản quyền (Gói Tháng / Gói Năm), hệ thống sẽ tự động liên kết quyền vào tài khoản Google OAuth và quản lý tại đây.
              </p>
            </div>
          ) : (
            <div className="panel overflow-hidden bg-[var(--surface-raised)] border border-[var(--line)] rounded-xl shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] text-[var(--text-secondary)] uppercase font-mono bg-[var(--surface-subtle)] border-b border-[var(--line)] font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5 w-12 text-center">#</th>
                      <th className="px-4 py-3.5 min-w-[220px]">Khách hàng (Google Account)</th>
                      <th className="px-4 py-3.5 min-w-[190px]">Gói dịch vụ</th>
                      <th className="px-4 py-3.5 min-w-[180px]">Môi trường & Thiết bị</th>
                      <th className="px-4 py-3.5 min-w-[160px]">Thời hạn bản quyền</th>
                      <th className="px-4 py-3.5 min-w-[150px]">Trạng thái</th>
                      <th className="px-4 py-3.5 min-w-[200px] text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {filteredLicenses.map((lic, idx) => (
                      <tr key={lic.id} className="hover:bg-[var(--surface-subtle)]/60 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-[var(--text-muted)] text-center font-bold">
                          {idx + 1}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                              <UserCheck className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[var(--text-primary)] text-xs tracking-tight truncate">
                                {lic.customer}
                              </p>
                              <p className="text-[var(--brand)] font-medium text-xs truncate max-w-[220px]">
                                {lic.email}
                              </p>
                              <span className="text-[10px] text-[var(--text-muted)] block mt-0.5 font-mono">
                                Kích hoạt: {lic.startsAt}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                            {lic.plan}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] block mt-1">
                            Full Suite 13 tính năng
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="min-w-0">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--line)] text-[11px] font-mono text-[var(--text-secondary)] truncate max-w-[170px]" title={lic.device}>
                              <Laptop className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                              <span className="truncate">{lic.device}</span>
                            </div>
                            <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--surface-subtle)] border border-[var(--line)] text-[10px] font-mono font-medium text-[var(--text-secondary)] whitespace-nowrap">
                              <span>Revit {lic.revitVersion || '2025'}</span>
                              <span className="text-[var(--text-muted)]">•</span>
                              <span>Windows</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {lic.status === 'ACTIVE' ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <Clock className="w-3 h-3" /> Còn {lic.remainingDays} ngày
                              </span>
                              <p className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                                Hết hạn: {lic.expiresAt}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-slate-500/10 text-[var(--text-muted)] border border-[var(--line)]">
                                0 ngày
                              </span>
                              <p className="text-[10px] text-rose-500/80 font-medium mt-1 font-mono">
                                Hết hạn: {lic.expiresAt}
                              </p>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div>
                            {lic.status === 'ACTIVE' && lic.isOnline ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Đang Online
                            </span>
                          ) : lic.status === 'ACTIVE' ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-500/10 text-[var(--text-secondary)] border border-[var(--line)]"
                              title={`Lần cuối nhận tín hiệu: ${lic.lastSeenAt}`}
                            >
                              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                              Offline
                            </span>
                          ) : lic.status === 'REVOKED' || lic.status === 'SUSPENDED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              <Lock className="w-3 h-3" />
                              Đã khóa (BLOCKED)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/15 text-[var(--text-secondary)] border border-[var(--line)]">
                              <Clock className="w-3 h-3 text-rose-500" />
                              Đã hết hạn
                            </span>
                            )}
                            <p className="mt-1 text-[10px] font-mono text-[var(--text-muted)]">
                              Tín hiệu cuối: {lic.lastSeenAt}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {lic.status === 'ACTIVE' ? (
                              <button
                                onClick={() => revokeLicense.mutate(lic.id)}
                                disabled={revokeLicense.isPending}
                                className="h-7.5 px-2.5 rounded-lg border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 transition-all inline-flex items-center gap-1.5 text-[11px] font-semibold disabled:opacity-40 cursor-pointer"
                                title="Thu hồi / Khóa bản quyền này"
                                aria-label="Thu hồi quyền"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>Thu hồi quyền</span>
                              </button>
                            ) : lic.status === 'REVOKED' || lic.status === 'SUSPENDED' ? (
                              <button
                                onClick={() => grantLicense.mutate(lic.id)}
                                disabled={grantLicense.isPending}
                                className="h-7.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all text-[11px] font-bold inline-flex items-center gap-1.5 shadow-xs disabled:opacity-40 whitespace-nowrap cursor-pointer"
                                title="Mở khóa và cấp quyền lại cho bản quyền này"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Mở khóa & Kích hoạt lại</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => grantLicense.mutate(lic.id)}
                                disabled={grantLicense.isPending}
                                className="h-7.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all text-[11px] font-bold inline-flex items-center gap-1.5 shadow-xs disabled:opacity-40 whitespace-nowrap cursor-pointer"
                                title="Gia hạn và cấp quyền lại cho bản quyền này"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Cấp lại quyền</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
