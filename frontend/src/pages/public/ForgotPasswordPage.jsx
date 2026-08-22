import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { authApi } from '../../api/services';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef();

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.');
      input.current?.focus();
      return;
    }
    setBusy(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-shell min-h-[68vh] py-14 grid place-items-center">
      <section className="w-full max-w-md panel p-8 bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-md">
        {sent ? (
          <div className="text-center py-4">
            <CheckCircle2 className="mx-auto text-emerald-500" size={54} />
            <h1 className="mt-5 text-2xl font-bold text-[var(--text-primary)]">Kiểm tra hộp thư của bạn</h1>
            <p role="status" className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
              Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu. Vui lòng kiểm tra cả thư mục spam.
            </p>
            <Link to="/login" className="secondary-button mt-6 w-full justify-center">
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Quên mật khẩu?</h1>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.
            </p>
            <form noValidate onSubmit={submit} className="mt-6">
              <label htmlFor="forgot-email" className="block text-xs font-bold text-[var(--text-primary)] mb-2">
                Email
              </label>
              <input
                ref={input}
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? 'forgot-email-error' : undefined}
                className="form-control text-sm"
                placeholder="name@example.com"
              />
              {error && (
                <p id="forgot-email-error" className="field-error">
                  {error}
                </p>
              )}
              <button disabled={busy} className="primary-button w-full mt-5 justify-center">
                {busy && <Loader2 size={18} className="animate-spin" />}
                Gửi liên kết đặt lại
              </button>
            </form>
            <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--brand)] hover:underline">
              <ArrowLeft size={16} /> Quay lại đăng nhập
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
