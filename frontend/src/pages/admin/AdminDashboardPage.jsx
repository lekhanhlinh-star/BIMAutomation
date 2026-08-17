import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/services';
import { TrendingUp, Users, Key, ShoppingBag } from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: stats = {}, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminApi.getStats
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Dashboard quản trị hệ thống</h2>
        <p className="text-xs text-slate-500 mt-1">Tổng quan chỉ số kinh doanh & hoạt động cấp phát bản quyền BIMAutomation.</p>
      </div>

      {/* Metric row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[var(--line)]">
        <div className="p-6 space-y-2 border-r border-b border-[var(--line)]">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span>Tổng doanh thu</span>
            <TrendingUp className="w-4 h-4 text-cyan-300" />
          </div>
          <p className="text-2xl font-mono font-bold text-white">{stats.totalRevenue || '0đ'}</p>
          <p className="text-[11px] text-emerald-400 font-semibold">{stats.recentGrowth} so với tháng trước</p>
        </div>

        <div className="p-6 space-y-2 border-r border-b border-[var(--line)]">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span>Tổng khách hàng</span>
            <Users className="w-4 h-4 text-cyan-300" />
          </div>
          <p className="text-2xl font-mono font-bold text-white">{stats.totalCustomers || 0}</p>
          <p className="text-[11px] text-slate-500">Tài khoản đã đăng ký</p>
        </div>

        <div className="p-6 space-y-2 border-r border-b border-[var(--line)]">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span>License hoạt động</span>
            <Key className="w-4 h-4 text-cyan-300" />
          </div>
          <p className="text-2xl font-mono font-bold text-white">{stats.activeLicenses || 0}</p>
          <p className="text-[11px] text-slate-500">Đã kích hoạt trên máy</p>
        </div>

        <div className="p-6 space-y-2 border-r border-b border-[var(--line)]">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span>Đơn hàng chờ duyệt</span>
            <ShoppingBag className="w-4 h-4 text-cyan-300" />
          </div>
          <p className="text-2xl font-mono font-bold text-white">{stats.pendingOrders || 0}</p>
          <p className="text-[11px] text-amber-400">Cần xác nhận thanh toán</p>
        </div>
      </div>
    </div>
  );
}
