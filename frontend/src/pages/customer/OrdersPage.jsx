import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../../api/services';
import { ShoppingBag, Loader2 } from 'lucide-react';

export default function OrdersPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: customerApi.getOrders,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Lịch sử đơn hàng</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Theo dõi trạng thái thanh toán và hóa đơn giao dịch của bạn.</p>
      </div>

      {isLoading ? (
        <div className="py-12 flex items-center gap-2.5 text-[var(--text-secondary)]">
          <Loader2 className="animate-spin" size={20} /> Đang tải lịch sử đơn hàng...
        </div>
      ) : orders.length === 0 ? (
        <div className="panel p-12 text-center space-y-3 bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
          <ShoppingBag className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
          <p className="text-base font-bold text-[var(--text-primary)]">Chưa có đơn hàng nào.</p>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            Bạn chưa thực hiện giao dịch mua bản quyền nào. Hãy chọn gói phù hợp tại Bảng giá để trải nghiệm Add-in Revit.
          </p>
        </div>
      ) : (
        <div className="panel overflow-x-auto bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="text-[var(--text-secondary)] uppercase font-mono bg-[var(--surface-subtle)] border-b border-[var(--line)] font-bold">
              <tr>
                <th className="px-4 py-3.5">Mã đơn</th>
                <th className="px-4 py-3.5">Ngày mua</th>
                <th className="px-4 py-3.5">Gói bản quyền</th>
                <th className="px-4 py-3.5">Số tiền</th>
                <th className="px-4 py-3.5">Phương thức</th>
                <th className="px-4 py-3.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[var(--surface-subtle)]/50 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-[var(--text-primary)]">{ord.id}</td>
                  <td className="px-4 py-3.5 text-[var(--text-secondary)]">{ord.date}</td>
                  <td className="px-4 py-3.5 font-bold text-[var(--text-primary)]">{ord.planName}</td>
                  <td className="px-4 py-3.5 font-mono font-bold text-[var(--brand)]">{ord.amount}</td>
                  <td className="px-4 py-3.5 text-[var(--text-secondary)]">{ord.paymentMethod}</td>
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
