import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Download, FileClock, LayoutDashboard, LogOut, UserRound, KeyRound } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import BrandLogo from '../components/BrandLogo';
import ThemeToggle from '../components/ThemeToggle';

const menuItems = [
  { path: '/account', label: 'Tổng quan', shortLabel: 'Tổng quan', icon: LayoutDashboard },
  { path: '/account/licenses', label: 'License của tôi', shortLabel: 'License', icon: KeyRound },
  { path: '/account/orders', label: 'Lịch sử đơn hàng', shortLabel: 'Đơn hàng', icon: FileClock },
  { path: '/account/profile', label: 'Hồ sơ cá nhân', shortLabel: 'Hồ sơ', icon: UserRound },
];

function AccountNavigation({ location, mobile = false }) {
  return (
    <nav aria-label="Điều hướng tài khoản" className={mobile ? 'account-mobile-nav' : 'account-sidebar-nav'}>
      {menuItems.map((item, index) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            aria-current={isActive ? 'page' : undefined}
            className={isActive ? 'is-active' : ''}
          >
            <Icon className="account-nav-icon" size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>{mobile ? item.shortLabel : item.label}</span>
            {!mobile ? <span className="account-nav-index" aria-hidden="true">0{index + 1}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export default function CustomerLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = menuItems.find((item) => item.path === location.pathname)?.label || 'Tài khoản';
  const displayName = user?.name || user?.email?.split('@')[0] || 'Khách hàng';
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="account-shell">
      <a href="#account-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-[var(--surface)] focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-[var(--brand)]">
        Bỏ qua điều hướng
      </a>

      <aside className="account-sidebar">
        <div>
          <div className="account-sidebar__brand">
            <Link to="/" aria-label="BIMAutomation - Trang chủ"><BrandLogo size="sm" /></Link>
            <Link to="/" aria-label="Về trang chủ">Website <ArrowUpRight size={13} aria-hidden="true" /></Link>
          </div>

          <div className="account-user-card">
            <div className="account-avatar" aria-hidden="true">{initial}</div>
            <div>
              <p>{displayName}</p>
              <span>{user?.email || 'Tài khoản BIMAutomation'}</span>
            </div>
          </div>

          <p className="account-nav-label">Tài khoản</p>
          <AccountNavigation location={location} />
        </div>

        <div className="account-sidebar__footer">
          <Link to="/download" className="account-download-link">
            <Download size={18} aria-hidden="true" />
            <span><strong>Tải Add-in Revit</strong><small>Phiên bản mới nhất</small></span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
          <div className="account-preference">
            <span>Giao diện</span>
            <ThemeToggle size="sm" />
          </div>
          <button type="button" onClick={handleLogout} className="account-logout">
            <LogOut size={17} aria-hidden="true" /> Đăng xuất
          </button>
        </div>
      </aside>

      <div className="account-workspace">
        <header className="account-mobile-header">
          <Link to="/" aria-label="BIMAutomation - Trang chủ"><BrandLogo size="sm" /></Link>
          <div>
            <ThemeToggle size="sm" />
            <button type="button" onClick={handleLogout} aria-label="Đăng xuất">
              Thoát
            </button>
          </div>
        </header>
        <AccountNavigation location={location} mobile />

        <header className="account-topbar">
          <div>
            <span>Khu vực khách hàng</span>
            <h1>{currentPage}</h1>
          </div>
          <div className="account-topbar__identity">
            <ThemeToggle size="sm" />
            <span>{displayName}</span>
            <div className="account-avatar" aria-hidden="true">{initial}</div>
          </div>
        </header>

        <main id="account-main" className="account-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
