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
  Key, 
  TrendingUp, 
  MessageSquare, 
  UploadCloud, 
  LogOut,
  ArrowLeft
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
    <div className="min-h-screen bg-[var(--surface)] text-[var(--text-primary)] flex flex-col md:flex-row transition-colors">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-[var(--line)] bg-[var(--surface-raised)] flex flex-col justify-between p-4 shrink-0 shadow-xs">
        <div>
          {/* Admin Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
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
          <div className="mb-5 pb-4 border-b border-[var(--line-soft)] text-xs">
            <span className="text-[var(--text-secondary)] font-bold block">Quản trị viên</span>
            <span className="text-[var(--text-muted)] font-mono truncate block mt-0.5">{user?.email || 'admin@bimautomation.com'}</span>
          </div>

          {/* Admin Links */}
          <nav className="space-y-1">
            {adminMenu.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-control)] text-sm font-semibold transition-all ${
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

        {/* Footer Controls & Theme Toggle */}
        <div className="pt-4 border-t border-[var(--line-soft)] space-y-2">
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
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--surface)]">
        <header className="h-14 border-b border-[var(--line)] px-6 flex items-center justify-between sticky top-0 z-40 bg-[var(--surface)]/95 backdrop-blur-sm">
          <h1 className="text-sm font-bold text-[var(--text-primary)]">Hệ thống Quản trị & Điều hành BIMAutomation</h1>
          <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-muted)]">
            <ThemeToggle size="sm" />
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] border border-[var(--line)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-[10px] text-emerald-600 dark:text-emerald-400">OPERATIONAL</span>
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
