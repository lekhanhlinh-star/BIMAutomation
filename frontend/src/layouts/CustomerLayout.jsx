import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import BrandLogo from '../components/BrandLogo';
import { 
  LayoutDashboard, 
  Key, 
  ShoppingBag, 
  User, 
  LogOut, 
  ArrowLeft,
  Download,
  Bell
} from 'lucide-react';

export default function CustomerLayout() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/account', label: 'Tổng quan', icon: LayoutDashboard },
    { path: '/account/licenses', label: 'License của tôi', icon: Key },
    { path: '/account/orders', label: 'Lịch sử đơn hàng', icon: ShoppingBag },
    { path: '/account/profile', label: 'Hồ sơ cá nhân', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[var(--surface)] text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-[var(--line)] flex flex-col justify-between p-4 shrink-0">
        <div>
          {/* Logo & Back Button */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-[var(--line)]">
            <Link to="/" className="inline-flex items-center min-h-11 min-w-0" aria-label="BIMAutomation - Trang chủ">
              <BrandLogo size="sm" />
            </Link>
            <Link to="/" className="shrink-0 p-2 -mr-2 text-slate-500 hover:text-cyan-300" aria-label="Về trang chủ">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {/* User Badge */}
          <div className="mb-6 pb-4 border-b border-[var(--line-soft)] flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--line-soft)] text-cyan-300 font-bold flex items-center justify-center text-sm">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.email?.split('@')[0] || 'Khách hàng'}</p>
              <p className="text-[11px] font-mono text-slate-500 truncate">{user?.email || 'user@bimautomation.com'}</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-0.5">
            {menuItems.map((item) => {
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

        {/* Quick Download & Logout */}
        <div className="pt-4 border-t border-[var(--line-soft)] space-y-1">
          <Link
            to="/download"
            className="w-full flex items-center gap-2 py-2 px-3 text-cyan-300 text-xs font-semibold hover:bg-[var(--line-soft)] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Tải Add-in Revit
          </Link>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Account Portal View */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-[var(--line)] px-6 flex items-center justify-between sticky top-0 z-40 bg-[var(--surface)]/95">
          <h1 className="text-sm font-semibold text-white">Portal Khách hàng</h1>
          <button className="p-2 text-slate-400 hover:text-slate-200 relative" aria-label="Thông báo">
            <Bell className="w-4 h-4" />
            <span className="w-1.5 h-1.5 bg-cyan-400 absolute top-2 right-2"></span>
          </button>
        </header>

        <main className="p-6 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
