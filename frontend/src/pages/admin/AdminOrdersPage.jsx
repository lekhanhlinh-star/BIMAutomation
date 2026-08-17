import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/services';

export default function AdminOrdersPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: adminApi.getOrders
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Quản lý đơn hàng</h2>
        <p className="text-xs text-slate-500 mt-1">Theo dõi giao dịch mua bản quyền Add-in và trạng thái thanh toán tự động qua webhook.</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-slate-400">Đang tải danh sách đơn hàng...</div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-slate-500 text-sm">Chưa có đơn hàng nào.</div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-slate-500 uppercase font-mono border-b border-[var(--line)]">
              <tr>
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Gói dịch vụ</th>
                <th className="px-4 py-3">Thành tiền</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line-soft)]">
              {orders.map((ord) => (
                <tr key={ord.id}>
                  <td className="px-4 py-3.5 font-mono text-slate-500 font-bold">{ord.id}</td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-white">{ord.customer}</p>
                    <p className="text-[11px] text-slate-500">{ord.email}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-200">{ord.plan}</td>
                  <td className="px-4 py-3.5 font-mono font-bold text-cyan-300">{ord.amount}</td>
                  <td className="px-4 py-3.5 text-slate-400">{ord.date}</td>
                  <td className="px-4 py-3.5">
                    <span className={`status-tag ${
                      ord.status === 'PAID' ? 'status-tag--ok'
                      : ord.status === 'PENDING' ? 'status-tag--pending'
                      : 'status-tag--off'
                    }`}>{ord.status}</span>
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
