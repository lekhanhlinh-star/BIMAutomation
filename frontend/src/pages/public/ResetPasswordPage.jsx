import React, { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { authApi } from '../../api/services';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const first = useRef();

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (password.length < 8) next.password = 'Mật khẩu phải có ít nhất 8 ký tự.';
    if (confirm !== password) next.confirm = 'Mật khẩu xác nhận chưa khớp.';
    setErrors(next);
    if (Object.keys(next).length) {
      first.current?.focus();
      return;
    }
    if (!token) {
      setServerError('Liên kết đặt lại mật khẩu không hợp lệ.');
      return;
    }
    setBusy(true);
    setServerError('');
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (e) {
      const detail = e.response?.data?.detail;
      setServerError(
        detail === 'RESET_PASSWORD_BAD_TOKEN'
          ? 'Liên kết đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu liên kết mới.'
          : 'Không thể đổi mật khẩu. Vui lòng kiểm tra yêu cầu và thử lại.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-shell min-h-[68vh] py-14 grid place-items-center">
      <section className="w-full max-w-md panel p-8 bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-md">
        {done ? (
          <div className="text-center py-4">
            <CheckCircle2 className="mx-auto text-emerald-500" size={54} />
            <h1 className="mt-5 text-2xl font-bold text-[var(--text-primary)]">Đã đổi mật khẩu</h1>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.</p>
            <Link to="/login" className="primary-button mt-6 w-full justify-center">
              Đăng nhập ngay
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Tạo mật khẩu mới</h1>
            {serverError && (
              <p role="alert" className="mt-4 border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-[var(--radius-control)] text-sm text-rose-600 dark:text-rose-300 font-medium">
                {serverError}
              </p>
            )}
            <form noValidate onSubmit={submit} className="mt-6 grid gap-4">
              <div>
                <label htmlFor="new-password" className="block text-xs font-bold text-[var(--text-primary)] mb-2">
                  Mật khẩu mới
                </label>
                <input
                  ref={first}
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'new-password-error' : undefined}
                  className="form-control text-sm"
                  placeholder="Tối thiểu 8 ký tự"
                />
                {errors.password && (
                  <p id="new-password-error" className="field-error">
                    {errors.password}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-xs font-bold text-[var(--text-primary)] mb-2">
                  Xác nhận mật khẩu
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  aria-invalid={!!errors.confirm}
                  aria-describedby={errors.confirm ? 'confirm-password-error' : undefined}
                  className="form-control text-sm"
                  placeholder="Nhập lại mật khẩu mới"
                />
                {errors.confirm && (
                  <p id="confirm-password-error" className="field-error">
                    {errors.confirm}
                  </p>
                )}
              </div>
              <button disabled={busy} className="primary-button w-full mt-2 justify-center">
                {busy && <Loader2 size={18} className="animate-spin" />}
                Đổi mật khẩu
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
