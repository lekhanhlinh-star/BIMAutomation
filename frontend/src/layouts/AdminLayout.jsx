import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import BrandLogo from '../components/BrandLogo';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  CreditCard, 
  Key, 
  TrendingUp, 
  MessageSquare, 
  UploadCloud, 
  LogOut,
  ArrowLeft,
  Settings
} from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const adminMenu = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/customers', label: 'Khách hàng', icon: Users },
    { path: '/admin/orders', label: 'Đơn hàng', icon: ShoppingBag },
    { path: '/admin/payments', label: 'Thanh toán', icon: CreditCard },
    { path: '/admin/licenses', label: 'Bản quyền & Key', icon: Key },
    { path: '/admin/revenue', label: 'Doanh thu', icon: TrendingUp },
    { path: '/admin/feedback', label: 'Góp ý khách hàng', icon: MessageSquare },
    { path: '/admin/releases', label: 'Phiên bản Add-in', icon: UploadCloud },
  ];

  return (
    <div className="min-h-screen bg-[var(--surface)] text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-[var(--line)] flex flex-col justify-between p-4 shrink-0">
        <div>
          {/* Admin Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
            <div className="flex items-center gap-2 min-w-0">
              <BrandLogo size="sm" iconOnly />
              <div>
                <span className="font-bold text-white text-base leading-none block">BIMAutomation</span>
                <span className="text-[10px] block text-slate-500 font-mono tracking-[0.08em]">ADMIN</span>
              </div>
            </div>
            <Link to="/" className="text-slate-500 hover:text-cyan-300 text-xs">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {/* Admin User info */}
          <div className="mb-6 pb-4 border-b border-[var(--line-soft)] text-xs">
            <span className="text-slate-300 font-semibold block">Đã xác thực Admin</span>
            <span className="text-slate-500 font-mono truncate block">{user?.email || 'admin@bimautomation.com'}</span>
          </div>

          {/* Admin Links */}
          <nav className="space-y-0.5">
            {adminMenu.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 border-l-2 text-sm font-medium transition-colors ${
                    active
                      ? 'border-cyan-400 text-white bg-[var(--line-soft)]'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[var(--line-soft)]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Logout */}
        <div className="pt-4 border-t border-[var(--line-soft)]">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Thoát Admin
          </button>
        </div>
      </aside>

      {/* Main Admin View */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-[var(--line)] px-6 flex items-center justify-between sticky top-0 z-40 bg-[var(--surface)]/95">
          <h1 className="text-sm font-semibold text-white">Hệ thống Quản trị & Điều hành BIMAutomation</h1>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
            <span className="w-1.5 h-1.5 bg-emerald-400"></span>
            SYSTEM OPERATIONAL
          </div>
        </header>

        <main className="p-6 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
