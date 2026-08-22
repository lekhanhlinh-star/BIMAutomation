import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/services';
import { Loader2 } from 'lucide-react';

export default function AdminOrdersPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: adminApi.getOrders,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Quản lý đơn hàng</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Theo dõi giao dịch mua bản quyền Add-in và trạng thái thanh toán tự động qua webhook.</p>
      </div>

      {isLoading ? (
        <div className="py-12 flex items-center gap-2.5 text-[var(--text-secondary)]">
          <Loader2 className="animate-spin" size={20} /> Đang tải danh sách đơn hàng...
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-[var(--text-muted)] text-sm">Chưa có đơn hàng nào.</div>
      ) : (
        <div className="panel overflow-x-auto bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="text-[var(--text-secondary)] uppercase font-mono bg-[var(--surface-subtle)] border-b border-[var(--line)] font-bold">
              <tr>
                <th className="px-4 py-3.5">Mã đơn</th>
                <th className="px-4 py-3.5">Khách hàng</th>
                <th className="px-4 py-3.5">Gói dịch vụ</th>
                <th className="px-4 py-3.5">Thành tiền</th>
                <th className="px-4 py-3.5">Ngày tạo</th>
                <th className="px-4 py-3.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[var(--surface-subtle)]/50 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-[var(--text-muted)] font-bold">{ord.id}</td>
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-[var(--text-primary)]">{ord.customer}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{ord.email}</p>
                  </td>
                  <td className="px-4 py-3.5 text-[var(--text-secondary)] font-medium">{ord.plan}</td>
                  <td className="px-4 py-3.5 font-mono font-bold text-[var(--brand)]">{ord.amount}</td>
                  <td className="px-4 py-3.5 text-[var(--text-secondary)]">{ord.date}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`status-tag ${
                        ord.status === 'PAID'
                          ? 'status-tag--ok'
                          : ord.status === 'PENDING'
                          ? 'status-tag--pending'
                          : 'status-tag--off'
                      }`}
                    >
                      {ord.status}
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
