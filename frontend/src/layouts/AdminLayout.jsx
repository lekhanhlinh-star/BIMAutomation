import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import BrandLogo from '../components/BrandLogo';
import ThemeToggle from '../components/ThemeToggle';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  CreditCard, 
  ShieldCheck, 
  TrendingUp, 
  MessageSquare, 
  UploadCloud, 
  LogOut,
  ArrowLeft
} from 'lucide-react';

const adminMenu = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/customers', label: 'Khách hàng', icon: Users },
  { path: '/admin/orders', label: 'Đơn hàng', icon: ShoppingBag },
  { path: '/admin/payments', label: 'Thanh toán', icon: CreditCard },
  { path: '/admin/licenses', label: 'Quản lý Bản quyền', icon: ShieldCheck },
  { path: '/admin/revenue', label: 'Doanh thu', icon: TrendingUp },
  { path: '/admin/feedback', label: 'Góp ý khách hàng', icon: MessageSquare },
  { path: '/admin/releases', label: 'Phiên bản Add-in', icon: UploadCloud },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage = adminMenu.find((item) => item.path === location.pathname)?.label || 'Quản trị';

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div>
          {/* Admin Header */}
          <div className="admin-sidebar__brand">
            <div className="flex items-center gap-2.5 min-w-0">
              <BrandLogo size="sm" iconOnly />
              <div>
                <span className="font-extrabold text-[var(--text-primary)] text-sm leading-none block tracking-tight">BIMAutomation</span>
                <span className="text-[10px] block text-[var(--brand)] font-mono font-bold tracking-[0.08em] mt-0.5">ADMIN PORTAL</span>
              </div>
            </div>
            <Link 
              to="/" 
              className="p-2 -mr-1 rounded-[var(--radius-control)] text-[var(--text-muted)] hover:text-[var(--brand)] hover:bg-[var(--surface-subtle)] transition-colors"
              aria-label="Về trang chủ"
              title="Về trang chủ"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {/* Admin User info */}
          <div className="admin-sidebar__user">
            <span className="text-[var(--text-secondary)] font-bold block">Quản trị viên</span>
            <span className="text-[var(--text-muted)] font-mono truncate block mt-0.5">{user?.email || 'admin@bimautomation.com'}</span>
          </div>

          {/* Admin Links */}
          <nav className="admin-nav" aria-label="Điều hướng quản trị">
            {adminMenu.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={active ? 'is-active' : ''}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="admin-nav__icon" size={17} strokeWidth={1.8} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Controls & Theme Toggle */}
        <div className="admin-sidebar__footer">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs text-[var(--text-secondary)] font-medium">Giao diện</span>
            <ThemeToggle size="sm" />
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-control)] text-xs font-semibold text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Thoát Admin
          </button>
        </div>
      </aside>

      {/* Main Admin View */}
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <span>Hệ thống Quản trị & Điều hành BIMAutomation</span>
            <h1>{currentPage}</h1>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-muted)]">
            <ThemeToggle size="sm" />
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] border border-[var(--line)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-[10px] text-emerald-600 dark:text-emerald-400">OPERATIONAL</span>
            </div>
          </div>
        </header>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
