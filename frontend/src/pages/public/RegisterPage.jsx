import React from 'react';
import { Loader2, ShieldCheck, Clock, Laptop } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { peekPendingIntent } from '../../utils/pendingIntent';
import BrandLogo from '../../components/BrandLogo';

export default function RegisterPage() {
  const { loginWithGoogle, isLoading, error } = useAuthStore();
  const intent = peekPendingIntent();

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
            Tạo tài khoản mới
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {intent?.type === 'checkout'
              ? 'Gói bản quyền đã chọn sẽ được lưu vào tài khoản sau khi đăng nhập Google.'
              : 'Đăng nhập nhanh với Google để bắt đầu dùng thử miễn phí 14 ngày.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div role="alert" className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-[var(--radius-control)] text-rose-600 dark:text-rose-300 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Google OAuth Button */}
        <div className="pt-2">
          <button
            onClick={loginWithGoogle}
            disabled={isLoading}
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
            <span>Đăng ký với Google</span>
          </button>
        </div>

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

        <p className="text-xs text-[var(--text-muted)]">
          Bằng việc đăng ký, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo vệ dữ liệu của BIMAutomation.
        </p>
      </div>
    </div>
  );
}
