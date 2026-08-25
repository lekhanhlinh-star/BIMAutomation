import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/services';
import { CheckCircle2, Loader2, ShieldCheck, ShieldPlus } from 'lucide-react';
import AccessibleDialog from '../../components/AccessibleDialog';

export default function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['adminCustomers'],
    queryFn: adminApi.getCustomers,
  });

  const grantAdmin = useMutation({
    mutationFn: (customer) => adminApi.grantAdminRole(customer.id),
    onSuccess: (_, customer) => {
      queryClient.setQueryData(['adminCustomers'], (current = []) =>
        current.map((item) => item.id === customer.id ? { ...item, role: 'ADMIN' } : item)
      );
      queryClient.invalidateQueries({ queryKey: ['adminCustomers'] });
      setSelectedCustomer(null);
      setSuccessMessage(`Đã cấp quyền admin cho ${customer.email}.`);
    },
  });

  const openGrantDialog = (customer) => {
    grantAdmin.reset();
    setSuccessMessage('');
    setSelectedCustomer(customer);
  };

  const closeGrantDialog = () => {
    if (!grantAdmin.isPending) setSelectedCustomer(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Quản lý khách hàng</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Danh sách tài khoản kỹ sư & công ty đã đăng ký trên hệ thống.</p>
      </div>

      {successMessage && (
        <div role="status" className="flex items-center gap-2.5 rounded-[var(--radius-control)] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={18} aria-hidden="true" />
          {successMessage}
        </div>
      )}

      {isLoading ? (
        <div className="py-12 flex items-center gap-2.5 text-[var(--text-secondary)]">
          <Loader2 className="animate-spin" size={20} /> Đang tải danh sách khách hàng...
        </div>
      ) : (
        <div className="panel overflow-x-auto bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="text-[var(--text-secondary)] uppercase font-mono bg-[var(--surface-subtle)] border-b border-[var(--line)] font-bold">
              <tr>
                <th className="px-4 py-3.5">ID</th>
                <th className="px-4 py-3.5">Kỹ sư / Khách hàng</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Số điện thoại</th>
                <th className="px-4 py-3.5">Phiên bản Revit</th>
                <th className="px-4 py-3.5">Loại tài khoản</th>
                <th className="px-4 py-3.5">Tổng chi tiêu</th>
                <th className="px-4 py-3.5">Ngày tham gia</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5">Quyền hệ thống</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {customers.map((c, i) => (
                <tr key={c.id} className="hover:bg-[var(--surface-subtle)]/50 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-[var(--text-muted)] font-bold">{i + 1}</td>
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-[var(--text-primary)]">{c.fullName}</p>
                    {c.jobTitle && c.jobTitle !== '—' && (
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{c.jobTitle}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-[var(--brand)] font-medium">{c.email}</td>
                  <td className="px-4 py-3.5 text-[var(--text-secondary)]">{c.phone}</td>
                  <td className="px-4 py-3.5 text-[var(--text-secondary)] font-mono">
                    {c.revitVersion !== '—' ? `Revit ${c.revitVersion}` : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    {c.activePlan ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        {c.activePlan}
                      </span>
                    ) : c.totalSpent !== '0đ' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
                        Đã thanh toán
                      </span>
                    ) : c.isTrialRegistered ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30">
                        14-Day Trial
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-500/10 text-[var(--text-secondary)] border border-[var(--line)]">
                        Standard
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-[var(--text-primary)]">{c.totalSpent}</td>
                  <td className="px-4 py-3.5 text-[var(--text-secondary)]">{c.joinedAt}</td>
                  <td className="px-4 py-3.5"><span className="status-tag status-tag--ok">{c.status}</span></td>
                  <td className="px-4 py-3.5">
                    {c.role === 'ADMIN' ? (
                      <span className="inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-control)] border border-amber-500/30 bg-amber-500/10 px-3 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                        <ShieldCheck size={15} aria-hidden="true" />
                        Admin
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openGrantDialog(c)}
                        className="secondary-button whitespace-nowrap !min-h-9 !px-3 !py-1.5 !text-[11px]"
                        aria-label={`Cấp quyền admin cho ${c.email}`}
                      >
                        <ShieldPlus size={15} aria-hidden="true" />
                        Cấp quyền admin
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AccessibleDialog
        open={!!selectedCustomer}
        onClose={closeGrantDialog}
        title="Xác nhận cấp quyền admin"
        description="Tài khoản admin có thể truy cập và quản lý toàn bộ khu vực quản trị. Hành động này sẽ được lưu vào nhật ký hệ thống."
      >
        {selectedCustomer && (
          <div className="space-y-5">
            <div className="rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface-subtle)] p-4">
              <p className="text-sm font-bold text-[var(--text-primary)]">{selectedCustomer.fullName}</p>
              <p className="mt-1 break-all text-xs text-[var(--text-secondary)]">{selectedCustomer.email}</p>
            </div>

            {grantAdmin.isError && (
              <p role="alert" className="rounded-[var(--radius-control)] border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-medium text-rose-600 dark:text-rose-300">
                {grantAdmin.error?.response?.data?.detail || 'Không thể cấp quyền admin. Vui lòng thử lại.'}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeGrantDialog} disabled={grantAdmin.isPending} className="secondary-button">
                Hủy
              </button>
              <button
                type="button"
                onClick={() => grantAdmin.mutate(selectedCustomer)}
                disabled={grantAdmin.isPending}
                className="primary-button"
              >
                {grantAdmin.isPending ? (
                  <Loader2 className="animate-spin" size={18} aria-hidden="true" />
                ) : (
                  <ShieldPlus size={18} aria-hidden="true" />
                )}
                {grantAdmin.isPending ? 'Đang cấp quyền...' : 'Xác nhận cấp quyền'}
              </button>
            </div>
          </div>
        )}
      </AccessibleDialog>
    </div>
  );
}
