import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/services';
import { TrendingUp, Users, Key, ShoppingBag } from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: stats = {} } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminApi.getStats,
  });

  return (
    <div className="admin-page admin-dashboard">
      <header className="admin-page-heading">
        <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Dashboard quản trị hệ thống</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Tổng quan chỉ số kinh doanh & hoạt động cấp phát bản quyền BIMAutomation.</p>
      </header>

      {/* Metric row */}
      <section className="admin-metrics" aria-label="Tổng quan vận hành">
        <article>
          <div className="flex justify-between items-center text-[var(--text-secondary)] text-xs font-semibold">
            <span>Tổng doanh thu</span>
            <TrendingUp className="w-4 h-4 text-[var(--brand)]" />
          </div>
          <p className="text-3xl font-mono font-extrabold text-[var(--text-primary)]">{stats.totalRevenue || '0đ'}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">{stats.recentGrowth} so với tháng trước</p>
        </article>

        <article>
          <div className="flex justify-between items-center text-[var(--text-secondary)] text-xs font-semibold">
            <span>Tổng khách hàng</span>
            <Users className="w-4 h-4 text-[var(--brand)]" />
          </div>
          <p className="text-3xl font-mono font-extrabold text-[var(--text-primary)]">{stats.totalCustomers || 0}</p>
          <p className="text-xs text-[var(--text-muted)]">Tài khoản đã đăng ký</p>
        </article>

        <article>
          <div className="flex justify-between items-center text-[var(--text-secondary)] text-xs font-semibold">
            <span>License hoạt động</span>
            <Key className="w-4 h-4 text-[var(--brand)]" />
          </div>
          <p className="text-3xl font-mono font-extrabold text-[var(--text-primary)]">{stats.activeLicenses || 0}</p>
          <p className="text-xs text-[var(--text-muted)]">Đã kích hoạt trên máy</p>
        </article>

        <article>
          <div className="flex justify-between items-center text-[var(--text-secondary)] text-xs font-semibold">
            <span>Đơn hàng chờ duyệt</span>
            <ShoppingBag className="w-4 h-4 text-[var(--brand)]" />
          </div>
          <p className="text-3xl font-mono font-extrabold text-[var(--text-primary)]">{stats.pendingOrders || 0}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">Cần xác nhận thanh toán</p>
        </article>
      </section>
    </div>
  );
}
