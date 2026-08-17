import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../../api/services';
import { useAuthStore } from '../../store/useAuthStore';
import { Key, ShoppingBag, Download, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AccountDashboardPage() {
  const { user } = useAuthStore();

  const { data: licenses = [] } = useQuery({
    queryKey: ['myLicenses'],
    queryFn: customerApi.getLicenses
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['myOrders'],
    queryFn: customerApi.getOrders
  });

  const activeLicense = licenses.find(l => l.status === 'ACTIVE');

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <div>
        <p className="text-xs font-mono text-cyan-300 tracking-wide uppercase">Khách hàng BIMAutomation</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
          Xin chào, {user?.email?.split('@')[0] || 'Kỹ sư BIM'}
        </h2>
        <p className="mt-2 text-slate-400 text-sm max-w-xl">
          Quản lý chìa khóa bản quyền (License Key), theo dõi thời hạn sử dụng và lịch sử giao dịch đơn hàng Add-in Revit tại đây.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-l border-[var(--line)]">
        <div className="p-6 space-y-2 border-r border-b border-[var(--line)]">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Bản quyền hoạt động</span>
            <Key className="w-4 h-4 text-cyan-300" />
          </div>
          <p className="text-2xl font-mono font-bold text-white">{licenses.filter(l => l.status === 'ACTIVE').length}</p>
        </div>

        <div className="p-6 space-y-2 border-r border-b border-[var(--line)]">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Tổng số đơn hàng</span>
            <ShoppingBag className="w-4 h-4 text-cyan-300" />
          </div>
          <p className="text-2xl font-mono font-bold text-white">{orders.length}</p>
        </div>

        <div className="p-6 space-y-2 border-r border-b border-[var(--line)]">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Trạng thái tài khoản</span>
            <ShieldCheck className="w-4 h-4 text-cyan-300" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">Đã xác thực</p>
        </div>
      </div>

      {/* Quick Active License Display */}
      {activeLicense ? (
        <div className="panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-300" /> License đang hoạt động
            </h3>
            <span className="status-tag status-tag--ok">Active</span>
          </div>

          <div className="p-4 bg-[var(--surface)] border border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 font-mono">KEY: <span className="text-cyan-300 font-bold text-sm tracking-widest">{activeLicense.key}</span></p>
              <p className="text-xs text-slate-300 mt-1">Gói: {activeLicense.planName} · Hết hạn: {activeLicense.expiresAt}</p>
            </div>
            <Link
              to="/account/licenses"
              className="secondary-button !min-h-9 !py-1.5 text-xs shrink-0"
            >
              Chi tiết Key
            </Link>
          </div>
        </div>
      ) : (
        <div className="panel p-6 text-center space-y-3">
          <p className="text-sm text-slate-300">Bạn chưa sở hữu License Key nào đang hoạt động.</p>
          <Link
            to="/pricing"
            className="primary-button !min-h-9 !py-1.5 text-xs inline-flex"
          >
            Mua bản quyền ngay <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
