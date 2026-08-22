import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/services';
import { Loader2 } from 'lucide-react';

export default function AdminPaymentsPage() {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['adminPayments'],
    queryFn: adminApi.getPayments,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Quản lý giao dịch thanh toán</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Lịch sử biến động số dư và sao kê ngân hàng chuyển khoản tự động.</p>
      </div>

      {isLoading ? (
        <div className="py-12 flex items-center gap-2.5 text-[var(--text-secondary)]">
          <Loader2 className="animate-spin" size={20} /> Đang tải lịch sử giao dịch...
        </div>
      ) : payments.length === 0 ? (
        <div className="py-12 text-[var(--text-muted)] text-sm">Chưa có giao dịch nào.</div>
      ) : (
        <div className="panel overflow-x-auto bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="text-[var(--text-secondary)] uppercase font-mono bg-[var(--surface-subtle)] border-b border-[var(--line)] font-bold">
              <tr>
                <th className="px-4 py-3.5">Mã đơn hàng</th>
                <th className="px-4 py-3.5">Kênh thanh toán</th>
                <th className="px-4 py-3.5">Mã GD ngân hàng</th>
                <th className="px-4 py-3.5">Số tiền</th>
                <th className="px-4 py-3.5">Thời gian</th>
                <th className="px-4 py-3.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--surface-subtle)]/50 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-[var(--brand)]">{p.orderId}</td>
                  <td className="px-4 py-3.5 font-medium text-[var(--text-primary)]">{p.provider}</td>
                  <td className="px-4 py-3.5 font-mono text-[var(--text-muted)]">{p.txHash}</td>
                  <td className="px-4 py-3.5 font-mono font-bold text-[var(--text-primary)]">{p.amount}</td>
                  <td className="px-4 py-3.5 text-[var(--text-secondary)]">{p.time}</td>
                  <td className="px-4 py-3.5">
                    <span className={`status-tag ${p.status === 'SUCCESS' || p.status === 'PAID' ? 'status-tag--ok' : 'status-tag--pending'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
