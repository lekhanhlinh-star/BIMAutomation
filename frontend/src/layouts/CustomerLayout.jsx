import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import BrandLogo from '../components/BrandLogo';
import ThemeToggle from '../components/ThemeToggle';
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
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/account', label: 'Tổng quan', icon: LayoutDashboard },
    { path: '/account/licenses', label: 'License của tôi', icon: Key },
    { path: '/account/orders', label: 'Lịch sử đơn hàng', icon: ShoppingBag },
    { path: '/account/profile', label: 'Hồ sơ cá nhân', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--text-primary)] flex flex-col md:flex-row transition-colors">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-[var(--line)] bg-[var(--surface-raised)] flex flex-col justify-between p-4 shrink-0 shadow-xs">
        <div>
          {/* Logo & Back Button */}
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-[var(--line)]">
            <Link to="/" className="inline-flex items-center min-h-10 min-w-0" aria-label="BIMAutomation - Trang chủ">
              <BrandLogo size="sm" />
            </Link>
            <Link 
              to="/" 
              className="p-2 -mr-1 rounded-[var(--radius-control)] text-[var(--text-muted)] hover:text-[var(--brand)] hover:bg-[var(--surface-subtle)] transition-colors" 
              aria-label="Về trang chủ"
              title="Về trang chủ"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {/* User Badge */}
          <div className="mb-5 pb-4 border-b border-[var(--line-soft)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--brand-soft)] text-[var(--brand)] font-bold flex items-center justify-center text-sm border border-[var(--line)]">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user?.name || user?.email?.split('@')[0] || 'Khách hàng'}</p>
              <p className="text-[11px] font-mono text-[var(--text-muted)] truncate">{user?.email || 'user@bimautomation.com'}</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-control)] text-sm font-semibold transition-all ${
                    active
                      ? 'bg-[var(--brand-soft)] text-[var(--brand-strong)] dark:text-[var(--brand-strong)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Download & Theme Toggle & Logout */}
        <div className="pt-4 border-t border-[var(--line-soft)] space-y-2">
          <Link
            to="/download"
            className="w-full flex items-center gap-2.5 py-2 px-3 rounded-[var(--radius-control)] text-[var(--brand)] text-xs font-bold hover:bg-[var(--brand-soft)]/40 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Tải Add-in Revit
          </Link>
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs text-[var(--text-secondary)] font-medium">Giao diện</span>
            <ThemeToggle size="sm" />
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-control)] text-xs font-semibold text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Account Portal View */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--surface)]">
        <header className="h-14 border-b border-[var(--line)] px-6 flex items-center justify-between sticky top-0 z-40 bg-[var(--surface)]/95 backdrop-blur-sm">
          <h1 className="text-sm font-bold text-[var(--text-primary)]">Portal Khách hàng</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
            <button 
              className="p-2 rounded-[var(--radius-control)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] relative transition-colors" 
              aria-label="Thông báo"
            >
              <Bell className="w-4 h-4" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] absolute top-2 right-2 ring-2 ring-[var(--surface)]"></span>
            </button>
          </div>
        </header>

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
