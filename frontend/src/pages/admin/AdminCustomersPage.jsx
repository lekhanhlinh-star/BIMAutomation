import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/services';

export default function AdminCustomersPage() {
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['adminCustomers'],
    queryFn: adminApi.getCustomers
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Quản lý khách hàng</h2>
        <p className="text-xs text-slate-500 mt-1">Danh sách tài khoản kỹ sư & công ty đã đăng ký trên hệ thống.</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-slate-400">Đang tải danh sách khách hàng...</div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-slate-500 uppercase font-mono border-b border-[var(--line)]">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Họ và tên</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Số điện thoại</th>
                <th className="px-4 py-3">Tổng chi tiêu</th>
                <th className="px-4 py-3">Ngày tham gia</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line-soft)]">
              {customers.map((c, i) => (
                <tr key={c.id}>
                  <td className="px-4 py-3.5 font-mono text-slate-500 font-bold">{i + 1}</td>
                  <td className="px-4 py-3.5 font-semibold text-white">{c.fullName}</td>
                  <td className="px-4 py-3.5 text-cyan-300">{c.email}</td>
                  <td className="px-4 py-3.5 text-slate-400">{c.phone}</td>
                  <td className="px-4 py-3.5 font-mono font-bold text-white">{c.totalSpent}</td>
                  <td className="px-4 py-3.5 text-slate-400">{c.joinedAt}</td>
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
