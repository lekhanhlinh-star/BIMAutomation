import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { destinationAfterAuth } from '../../utils/pendingIntent';
import BrandLogo from '../../components/BrandLogo';

export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { handleGoogleCallback, handleGoogleToken } = useAuthStore();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const checkAndResumeDesktopOAuth = () => {
    const pendingDesktop = sessionStorage.getItem('pending_desktop_oauth');
    if (pendingDesktop) {
      sessionStorage.removeItem('pending_desktop_oauth');
      try {
        const params = JSON.parse(pendingDesktop);
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.id) {
          const q = new URLSearchParams({
            response_type: params.response_type || 'code',
            ...params,
            user_id: currentUser.id,
          });
          window.location.href = `/oauth/authorize?${q.toString()}`;
          return true;
        }
      } catch (e) {
        console.error('Failed to resume desktop oauth:', e);
      }
    }
    return false;
  };

  useEffect(() => {
    const processCallback = async () => {
      // 1. Check for token in URL fragment hash (#token=... or #access_token=...)
      const hash = location.hash || window.location.hash;
      if (hash && hash.includes('token=')) {
        const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);
        const token = hashParams.get('token') || hashParams.get('access_token');
        if (token) {
          const res = await handleGoogleToken(token);
          if (res?.success) {
            if (checkAndResumeDesktopOAuth()) return;
            setStatus('success');
            const destination = destinationAfterAuth();
            setTimeout(() => navigate(destination, { replace: true }), 1200);
            return;
          }
        }
      }

      // 2. Check for token directly in search query params (?token=...)
      const directToken = searchParams.get('token') || searchParams.get('access_token');
      if (directToken) {
        const res = await handleGoogleToken(directToken);
        if (res?.success) {
          if (checkAndResumeDesktopOAuth()) return;
          setStatus('success');
          const destination = destinationAfterAuth();
          setTimeout(() => navigate(destination, { replace: true }), 1200);
          return;
        }
      }

      // 3. Check for OAuth error in query or hash
      const error = searchParams.get('error');
      if (error) {
        setStatus('error');
        if (error === 'access_denied') {
          setErrorMsg('Bạn đã hủy yêu cầu đăng nhập bằng tài khoản Google.');
        } else {
          setErrorMsg('Đã xảy ra lỗi khi xác thực với Google.');
        }
        return;
      }

      // 4. Check for code and state in query params (frontend direct OAuth code flow)
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (code) {
        const res = await handleGoogleCallback(code, state);
        if (res?.success) {
          if (checkAndResumeDesktopOAuth()) return;
          setStatus('success');
          const destination = destinationAfterAuth();
          setTimeout(() => navigate(destination, { replace: true }), 1200);
        } else {
          setStatus('error');
          setErrorMsg(res?.error || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
        }
        return;
      }

      // 5. If neither token nor code is present
      setStatus('error');
      setErrorMsg('Không tìm thấy thông tin xác thực từ Google. Vui lòng đăng nhập lại.');
    };

    processCallback();
  }, [location, searchParams]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-md p-8 text-center space-y-6">
        <div className="flex justify-center">
          <BrandLogo size="md" />
        </div>

        {status === 'loading' && (
          <div className="space-y-4 py-4">
            <div className="w-14 h-14 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center mx-auto shadow-xs">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Đang xác thực Google...</h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5">
                Đang đồng bộ và thiết lập phiên đăng nhập BIMAutomation của bạn
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 py-4 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Đăng nhập thành công!</h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5">
                Chào mừng bạn trở lại. Hệ thống đang chuyển tiếp đến trang làm việc...
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 py-2 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto shadow-xs">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Xác thực chưa thành công</h2>
              <p className="text-xs sm:text-sm text-rose-500 mt-1.5 leading-relaxed font-medium">{errorMsg}</p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => navigate('/login')}
                className="secondary-button w-full justify-center !py-3 text-sm font-bold cursor-pointer"
              >
                <ArrowLeft size={16} /> Quay lại trang đăng nhập
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
