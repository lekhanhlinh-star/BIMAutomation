import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/services';
import { Loader2 } from 'lucide-react';

export default function AdminCustomersPage() {
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['adminCustomers'],
    queryFn: adminApi.getCustomers,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Quản lý khách hàng</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Danh sách tài khoản kỹ sư & công ty đã đăng ký trên hệ thống.</p>
      </div>

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
                    {c.isTrialRegistered ? (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
