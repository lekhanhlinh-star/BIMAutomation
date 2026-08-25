import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { peekPendingIntent, destinationAfterAuth } from '../../utils/pendingIntent';

const GoogleIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const benefits = [
  {
    title: 'Một tài khoản cho web và Revit',
    description: 'License được nhận diện tự động khi bạn đăng nhập Add-in.',
  },
  {
    title: 'Không cần nhập mã kích hoạt',
    description: 'Quản lý gói, thiết bị và lịch sử đơn hàng ngay tại portal.',
  },
  {
    title: 'Xác thực bảo mật',
    description: 'Hỗ trợ Google OAuth PKCE và trình quản lý mật khẩu.',
  },
];

export default function LoginPage() {
  const { loginWithGoogle, login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const intent = peekPendingIntent();
  const authError = formError || error;

  const contextCopy = intent?.type === 'checkout'
    ? 'Đăng nhập để hoàn tất đơn hàng và nhận license.'
    : intent?.type === 'download'
      ? 'Đăng nhập để tải bộ cài Add-in Autodesk Revit.'
      : 'Truy cập license, đơn hàng và thiết bị Revit của bạn.';

  const handleEmailLogin = async (event) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setFormError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    try {
      const response = await login(email.trim(), password);
      if (response.success) {
        navigate(destinationAfterAuth(), { replace: true });
      } else {
        setFormError(response.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch {
      setFormError('Không thể đăng nhập lúc này. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-story" aria-labelledby="auth-story-title">
          <div className="auth-story__content">
            <p className="auth-eyebrow"><span /> BIMAutomation Account</p>
            <h2 id="auth-story-title">Bản quyền đi cùng tài khoản, không đi cùng một đoạn mã.</h2>
            <p className="auth-story__lead">
              Đăng nhập một lần để giữ license, thiết bị và lịch sử mua hàng ở cùng một nơi.
            </p>

            <div className="auth-benefits">
              {benefits.map(({ title, description }, index) => (
                <article className="auth-benefit" key={title}>
                  <div className="auth-benefit__index">0{index + 1}</div>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="auth-story__footer">
            <span className="auth-status-dot" aria-hidden="true" />
            Revit 2022–2027 · Windows 10/11
          </div>
        </section>

        <section className="auth-form-panel" aria-labelledby="login-title">
          <div className="auth-form-wrap">
            <div className="auth-heading">
              <p className="auth-step">Cổng khách hàng</p>
              <h1 id="login-title">Đăng nhập hệ thống</h1>
              <p>{contextCopy}</p>
            </div>

            {authError ? (
              <div id="login-error" role="alert" className="auth-alert">
                <span aria-hidden="true">!</span>
                <p>{authError}</p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={loginWithGoogle}
              disabled={isLoading || isSubmitting}
              className="auth-google-button"
            >
              {isLoading ? <Loader2 aria-hidden="true" size={20} className="animate-spin text-[var(--brand)]" /> : <GoogleIcon />}
              <span>Tiếp tục với Google</span>
            </button>

            <div className="auth-divider"><span><b>hoặc</b> đăng nhập bằng email</span></div>

            <form onSubmit={handleEmailLogin} className="auth-form" noValidate>
              <div className="auth-field">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (formError) setFormError('');
                  }}
                  aria-invalid={Boolean(formError)}
                  aria-describedby={authError ? 'login-error' : undefined}
                  placeholder="ten@congty.vn"
                  className="form-control"
                />
              </div>

              <div className="auth-field">
                <div className="auth-field__label-row">
                  <label htmlFor="login-password">Mật khẩu</label>
                  <Link to="/forgot-password">Quên mật khẩu?</Link>
                </div>
                <div className="auth-password">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (formError) setFormError('');
                    }}
                    aria-invalid={Boolean(formError)}
                    aria-describedby={authError ? 'login-error' : undefined}
                    placeholder="Nhập mật khẩu"
                    className="form-control"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Ẩn nội dung đã nhập' : 'Hiện nội dung đã nhập'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting || isLoading} className="primary-button auth-submit">
                {isSubmitting ? <Loader2 aria-hidden="true" size={18} className="animate-spin" /> : null}
                <span>Đăng nhập với Email</span>
              </button>
            </form>

            <p className="auth-register">
              Chưa có tài khoản? <Link to="/register">Tạo tài khoản</Link>
            </p>

            <p className="auth-legal">
              Bằng việc đăng nhập, bạn đồng ý với <Link to="/feedback">Điều khoản dịch vụ</Link> và{' '}
              <Link to="/feedback">Chính sách bảo vệ dữ liệu</Link> của BIMAutomation.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
