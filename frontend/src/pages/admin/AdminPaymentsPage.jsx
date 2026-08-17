import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/services';

export default function AdminPaymentsPage() {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['adminPayments'],
    queryFn: adminApi.getPayments
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Quản lý giao dịch thanh toán</h2>
        <p className="text-xs text-slate-500 mt-1">Lịch sử biến động số dư và sao kê ngân hàng chuyển khoản tự động.</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-slate-400">Đang tải lịch sử giao dịch...</div>
      ) : payments.length === 0 ? (
        <div className="py-12 text-slate-500 text-sm">Chưa có giao dịch nào.</div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-slate-500 uppercase font-mono border-b border-[var(--line)]">
              <tr>
                <th className="px-4 py-3">Mã đơn hàng</th>
                <th className="px-4 py-3">Kênh thanh toán</th>
                <th className="px-4 py-3">Mã GD ngân hàng</th>
                <th className="px-4 py-3">Số tiền</th>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line-soft)]">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3.5 font-mono text-cyan-300">{p.orderId}</td>
                  <td className="px-4 py-3.5 text-slate-200">{p.provider}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-400">{p.txHash}</td>
                  <td className="px-4 py-3.5 font-mono font-bold text-white">{p.amount}</td>
                  <td className="px-4 py-3.5 text-slate-400">{p.time}</td>
                  <td className="px-4 py-3.5"><span className={`status-tag ${p.status === 'SUCCESS' || p.status === 'PAID' ? 'status-tag--ok' : 'status-tag--pending'}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
