import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { destinationAfterAuth } from '../../utils/pendingIntent';

export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { handleGoogleCallback, handleGoogleToken } = useAuthStore();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

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
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="panel max-w-sm w-full p-8 text-center space-y-6">
        {status === 'loading' && (
          <div className="space-y-3">
            <Loader2 className="w-9 h-9 text-cyan-300 animate-spin mx-auto" />
            <div>
              <h2 className="text-lg font-bold text-white">Đang xác thực Google...</h2>
              <p className="text-xs text-slate-400 mt-1">Đang thiết lập phiên đăng nhập BIMAutomation của bạn</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <CheckCircle className="w-9 h-9 text-emerald-400 mx-auto" />
            <div>
              <h2 className="text-lg font-bold text-white">Đăng nhập Google thành công</h2>
              <p className="text-xs text-slate-300 mt-1">Chào mừng bạn trở lại. Đang chuyển đến bảng quản lý...</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <XCircle className="w-9 h-9 text-red-400 mx-auto" />
            <div>
              <h2 className="text-lg font-bold text-white">Xác thực thất bại</h2>
              <p className="text-xs text-red-400 mt-1 leading-relaxed">{errorMsg}</p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => navigate('/login')}
                className="secondary-button w-full"
              >
                <ArrowLeft className="w-4 h-4" /> Quay lại trang đăng nhập
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
