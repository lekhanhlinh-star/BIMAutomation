import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, Clock, Laptop } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { peekPendingIntent, destinationAfterAuth } from '../../utils/pendingIntent';
import BrandLogo from '../../components/BrandLogo';

export default function LoginPage() {
  const { loginWithGoogle, login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const intent = peekPendingIntent();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setFormError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      if (res.success) {
        const dest = destinationAfterAuth();
        navigate(dest, { replace: true });
      } else {
        setFormError(res.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err) {
      setFormError('Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell min-h-[75vh] py-12 flex items-center justify-center">
      <div className="w-full max-w-md bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-md p-8 text-center space-y-6">
        
        {/* Brand Logo */}
        <div className="flex justify-center">
          <BrandLogo size="lg" />
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Đăng nhập hệ thống
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {intent?.type === 'checkout'
              ? 'Đăng nhập để hoàn tất đơn hàng và nhận License.'
              : intent?.type === 'download'
              ? 'Đăng nhập để tải bộ cài Add-in Autodesk Revit.'
              : 'Đăng nhập để quản lý bản quyền và kích hoạt dùng thử 14 ngày.'}
          </p>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div role="alert" className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-[var(--radius-control)] text-rose-600 dark:text-rose-300 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Google OAuth Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={loginWithGoogle}
            disabled={isLoading || isSubmitting}
            className="w-full py-3.5 px-4 bg-[var(--surface)] hover:bg-[var(--surface-subtle)] border border-[var(--line)] text-[var(--text-primary)] font-bold rounded-[var(--radius-control)] shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin text-[var(--brand)]" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Tiếp tục với Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[var(--line)]" />
          <span className="shrink mx-4 text-xs text-[var(--text-muted)] font-medium">hoặc</span>
          <div className="flex-grow border-t border-[var(--line)]" />
        </div>

        {/* Fallback Email/Password Sign-in Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
          <div>
            <label htmlFor="login-email" className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="form-control text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-xs font-bold text-[var(--text-primary)]">
                Mật khẩu
              </label>
              <Link to="/forgot-password" className="text-xs font-semibold text-[var(--brand)] hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="form-control text-sm"
            />
          </div>

          {formError && (
            <p className="field-error text-xs" role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="primary-button w-full justify-center text-sm font-bold"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
            <span>Đăng nhập với Email</span>
          </button>
        </form>

        {/* Value Props Badges */}
        <div className="pt-4 border-t border-[var(--line)] grid grid-cols-3 gap-2 text-center text-xs text-[var(--text-secondary)] font-medium">
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck size={18} className="text-[var(--brand)]" />
            <span>Bảo mật PKCE</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Clock size={18} className="text-emerald-500" />
            <span>Dùng thử 14 ngày</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Laptop size={18} className="text-blue-500" />
            <span>Đồng bộ Revit</span>
          </div>
        </div>

        {/* Clickable Terms & Privacy Policy Notice */}
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Bằng việc đăng nhập, bạn đồng ý với{' '}
          <Link to="/feedback" className="text-[var(--brand)] hover:underline">
            Điều khoản dịch vụ
          </Link>{' '}
          và{' '}
          <Link to="/feedback" className="text-[var(--brand)] hover:underline">
            Chính sách bảo vệ dữ liệu
          </Link>{' '}
          của BIMAutomation.
        </p>
      </div>
    </div>
  );
}
