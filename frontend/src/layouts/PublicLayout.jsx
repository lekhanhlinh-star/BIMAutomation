import React, { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Award, CheckCircle2, Download, Headphones, LogOut, Mail, MapPin, Menu, PhoneCall, ShieldCheck, User, X } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import ThemeToggle from '../components/ThemeToggle';
import ConsultationModal from '../components/ConsultationModal';
import FloatingSupportWidget from '../components/FloatingSupportWidget';
import { useAuthStore } from '../store/useAuthStore';
import { savePendingIntent } from '../utils/pendingIntent';

const links = [
  ['/features', 'Sản phẩm'],
  ['/#workflow', 'Giải pháp'],
  ['/tutorials', 'Tài nguyên'],
  ['/pricing', 'Bảng giá'],
  ['/feedback', 'Hỗ trợ'],
];

export default function PublicLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector('a,button')?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
      if (e.key === 'Tab' && menuRef.current) {
        const els = [...menuRef.current.querySelectorAll('a,button:not([disabled])')];
        const first = els[0], last = els.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const goDownload = (e) => {
    if (isAuthenticated) return;
    e.preventDefault();
    savePendingIntent({ type: 'download', returnTo: '/download' });
    navigate('/login');
  };

  const NavLink = ({ path, label, mobile = false }) => {
    const isActive = location.pathname === path;
    return (
      <Link
        to={path}
        onClick={path === '/download' ? goDownload : undefined}
        aria-current={isActive ? 'page' : undefined}
        className={`${
          mobile
            ? 'flex items-center px-3 py-3 font-semibold text-sm border-b border-[var(--line)]'
            : 'site-nav-link'
        } ${
          isActive
            ? mobile
              ? 'text-[var(--brand)]'
              : 'is-active'
            : mobile
              ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              : ''
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface)] text-[var(--text-primary)] antialiased selection:bg-[var(--brand)] selection:text-[var(--brand-text)]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-[var(--surface)] focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-[var(--brand)]">
        Bỏ qua điều hướng
      </a>
      <header className="site-header sticky top-0 z-50 w-full transition-colors duration-200">
        <div className="page-shell site-header-shell">
          <div className="flex min-w-0 items-center">
            <Link to="/" className="site-header-brand group" aria-label="BIMAutomation - Trang chủ">
              <BrandLogo />
            </Link>
          </div>

          <nav aria-label="Điều hướng chính" className="site-nav hidden xl:flex">
            {links.map(([p, l]) => (
              <NavLink key={p} path={p} label={l} />
            ))}
          </nav>

          <div className="site-header-actions hidden xl:flex">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/account" className="primary-button !min-h-10 !py-1.5 !px-4 text-xs font-semibold">
                  <User size={15} />
                  {user?.name || user?.email?.split('@')[0] || 'Tài khoản'}
                </Link>
                <button
                  onClick={logout}
                  className="w-9 h-9 grid place-items-center rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-rose-500 hover:border-rose-300 transition-colors"
                  aria-label="Đăng xuất"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                <Link
                  to="/download"
                  onClick={goDownload}
                  className="site-header-cta"
                >
                  Dùng thử 14 ngày
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 justify-self-end xl:hidden">
            <ThemeToggle size="sm" />
            <button
              ref={buttonRef}
              onClick={() => setOpen((x) => !x)}
              aria-label={open ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              className="grid h-10 w-10 place-items-center border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--text-primary)]"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <nav
            ref={menuRef}
            id="mobile-navigation"
            aria-label="Điều hướng di động"
            className="absolute inset-x-0 top-[68px] border-b border-[var(--line)] bg-[var(--surface-raised)] p-4 shadow-xl animate-fade-in xl:hidden"
          >
            <div className="grid gap-1">
              {links.map(([p, l]) => (
                <NavLink key={p} path={p} label={l} mobile />
              ))}
              <div className="mt-4 grid gap-2">
                <button
                  onClick={() => {
                    setOpen(false);
                    setConsultationOpen(true);
                  }}
                  className="secondary-button justify-center font-bold text-[var(--brand)]"
                >
                  <Headphones size={16} /> Đặt lịch demo 1-1
                </button>
                {isAuthenticated ? (
                  <>
                    <Link to="/account" className="primary-button justify-center">
                      <User size={16} /> Tài khoản của tôi
                    </Link>
                    <button onClick={logout} className="secondary-button justify-center text-rose-500">
                      <LogOut size={16} /> Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    {location.pathname !== '/login' && (
                      <Link to="/login" className="secondary-button justify-center">
                        Đăng nhập
                      </Link>
                    )}
                    <Link to="/download" onClick={goDownload} className="primary-button justify-center">
                      <Download size={16} /> Dùng thử miễn phí
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        )}
      </header>

      <main id="main-content" className="flex-1 w-full max-w-full overflow-x-hidden">
        <Outlet context={{ onOpenConsultation: () => setConsultationOpen(true) }} />
      </main>

      {/* Footer: Minimal on login page, Full Marketing on other public pages */}
      {location.pathname === '/login' ? (
        <footer className="border-t border-[var(--line)] bg-[var(--surface-raised)] py-6 text-xs text-[var(--text-muted)] transition-colors">
          <div className="page-shell flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <p>© 2026 BIMAutomation. Bản quyền thuộc về Đội ngũ Kỹ thuật BIM & AI Automation.</p>
            <div className="flex items-center gap-5">
              <Link to="/feedback" className="hover:underline">Điều khoản sử dụng</Link>
              <Link to="/feedback" className="hover:underline">Chính sách bảo mật</Link>
              <Link to="/feedback" className="hover:underline">Chính sách License</Link>
            </div>
          </div>
        </footer>
      ) : (
        <footer className="border-t border-[var(--line)] bg-[var(--surface-raised)] pt-16 pb-12 text-sm transition-colors">
          <div className="page-shell grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-14 border-b border-[var(--line)]">
            {/* Col 1 & 2: Brand identity */}
            <div className="lg:col-span-2 space-y-4">
              <BrandLogo />
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-md">
                Hệ sinh thái Add-in AI & 57 MCP Tools tự động hóa thiết kế, mô hình hóa cốt thép 3D và xuất bản hồ sơ Autodesk Revit chuẩn TCVN dành cho kỹ sư kết cấu và doanh nghiệp tại Việt Nam.
              </p>

              <div className="pt-2 space-y-2 text-xs text-[var(--text-secondary)]">
                <p className="flex items-start gap-2">
                  <MapPin size={15} className="text-[var(--brand)] shrink-0 mt-0.5" />
                  <span>Tòa nhà Công nghệ, số 8 Duy Tân, P. Dịch Vọng Hậu, Q. Cầu Giấy, TP. Hà Nội</span>
                </p>
                <p className="flex items-center gap-2">
                  <PhoneCall size={15} className="text-emerald-500 shrink-0" />
                  <span>Hotline: <strong>0904 885 833</strong> (8:00 - 18:00)</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={15} className="text-[var(--brand)] shrink-0" />
                  <span>Hỗ trợ: <a href="mailto:linhld.cs@gmail.com" className="hover:text-[var(--brand)] transition-colors font-bold">linhld.cs@gmail.com</a></span>
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-subtle)] border border-[var(--line)] text-xs font-semibold text-[var(--text-primary)]">
                  <ShieldCheck size={14} className="text-emerald-500" /> Cổng VietQR 24/7
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-subtle)] border border-[var(--line)] text-xs font-semibold text-[var(--text-primary)]">
                  <Award size={14} className="text-amber-500" /> Tương thích Revit 2022-2027
                </div>
              </div>
            </div>

            {/* Col 3: Modules */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)] mb-4">
                Phân hệ tính năng
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                <li><Link to="/features" className="hover:text-[var(--brand)] transition-colors">Bố trí cốt thép Cột / Dầm / Móng / Vách</Link></li>
                <li><Link to="/features" className="hover:text-[var(--brand)] transition-colors">Triển khai Bản vẽ Dầm liên tục</Link></li>
                <li><Link to="/features" className="hover:text-[var(--brand)] transition-colors">Hệ thống 57 MCP Tools tương tác</Link></li>
                <li><Link to="/features" className="hover:text-[var(--brand)] transition-colors">Đọc bảng thép Excel tự động</Link></li>
                <li><Link to="/features" className="hover:text-[var(--brand)] transition-colors">Dựng hình từ CAD & Xuất DWG</Link></li>
              </ul>
            </div>

            {/* Col 4: Support */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)] mb-4">
                Tài nguyên & Hỗ trợ
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                <li><Link to="/pricing" className="hover:text-[var(--brand)] transition-colors">Bảng giá dành cho cá nhân</Link></li>
                <li><Link to="/download" className="hover:text-[var(--brand)] transition-colors">Tải bộ cài Revit 2022-2027</Link></li>
                <li><Link to="/tutorials" className="hover:text-[var(--brand)] transition-colors">Video hướng dẫn sử dụng</Link></li>
                <li><Link to="/feedback" className="hover:text-[var(--brand)] transition-colors">Góp ý & Yêu cầu tính năng</Link></li>
                <li><button onClick={() => setConsultationOpen(true)} className="hover:text-[var(--brand)] transition-colors text-left">Báo giá gói Doanh nghiệp</button></li>
              </ul>
            </div>

            {/* Col 5: Legal & VAT */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)] mb-4">
                Bản quyền & Hóa đơn
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                Kích hoạt License tự động tức thì sau khi quét mã VietQR. Cung cấp hóa đơn GTGT điện tử hợp lệ cho doanh nghiệp.
              </p>
              <div className="p-3.5 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] border border-[var(--line)] text-xs text-[var(--text-secondary)] space-y-1">
                <p className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-500" /> Xuất hóa đơn VAT đầy đủ
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Bảo hành cập nhật trọn đời cho gói Doanh nghiệp.
                </p>
              </div>
            </div>
          </div>

          <div className="page-shell pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
            <p>© 2026 BIMAutomation. Bản quyền thuộc về Đội ngũ Kỹ thuật BIM & AI Automation.</p>
            <div className="flex items-center gap-5">
              <Link to="/feedback" className="hover:underline">Điều khoản sử dụng</Link>
              <Link to="/feedback" className="hover:underline">Chính sách bảo mật</Link>
              <Link to="/feedback" className="hover:underline">Chính sách License</Link>
            </div>
          </div>
        </footer>
      )}

      {/* Floating Support Action Widget */}
      {location.pathname !== '/' && (
        <FloatingSupportWidget onOpenConsultation={() => setConsultationOpen(true)} />
      )}

      {/* Consultation Lead Modal */}
      <ConsultationModal
        isOpen={consultationOpen}
        onClose={() => setConsultationOpen(false)}
      />
    </div>
  );
}
