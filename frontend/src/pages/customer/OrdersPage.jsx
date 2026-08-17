import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../../api/services';
import { ShoppingBag } from 'lucide-react';

export default function OrdersPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: customerApi.getOrders
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Lịch sử đơn hàng</h2>
        <p className="text-xs text-slate-400 mt-1">Theo dõi trạng thái thanh toán và hóa đơn giao dịch của bạn.</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-slate-400">Đang tải lịch sử đơn hàng...</div>
      ) : orders.length === 0 ? (
        <div className="panel p-12 text-center space-y-3">
          <ShoppingBag className="w-9 h-9 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-white">Chưa có đơn hàng nào.</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Bạn chưa thực hiện giao dịch mua bản quyền nào. Hãy chọn gói phù hợp tại Bảng giá để trải nghiệm Add-in Revit.
          </p>
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-slate-500 uppercase font-mono border-b border-[var(--line)]">
              <tr>
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Ngày mua</th>
                <th className="px-4 py-3">Gói bản quyền</th>
                <th className="px-4 py-3">Số tiền</th>
                <th className="px-4 py-3">Phương thức</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line-soft)]">
              {orders.map((ord) => (
                <tr key={ord.id}>
                  <td className="px-4 py-3.5 font-mono font-bold text-white">{ord.id}</td>
                  <td className="px-4 py-3.5 text-slate-400">{ord.date}</td>
                  <td className="px-4 py-3.5 font-semibold text-white">{ord.planName}</td>
                  <td className="px-4 py-3.5 font-mono font-bold text-cyan-300">{ord.amount}</td>
                  <td className="px-4 py-3.5 text-slate-400">{ord.paymentMethod}</td>
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
