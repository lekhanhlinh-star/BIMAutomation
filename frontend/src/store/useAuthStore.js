import { create } from 'zustand';
import {
  ACCESS_TOKEN_KEY,
  AUTH_TOKEN_EVENT,
  axiosClient,
  publishAccessToken,
} from '../api/axiosClient';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem(ACCESS_TOKEN_KEY) || null,
  isAuthenticated: !!localStorage.getItem(ACCESS_TOKEN_KEY),
  isLoading: false,
  isProfileLoading: !!localStorage.getItem(ACCESS_TOKEN_KEY),
  error: null,

  setToken: (token) => {
    publishAccessToken(token);
    set(token
      ? { token, isAuthenticated: true }
      : { token: null, user: null, isAuthenticated: false });
  },

  establishWebSession: async () => {
    const response = await axiosClient.post('/auth/jwt/session');
    get().setToken(response.data.access_token);
    return response.data;
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      // FastAPI Users OAuth2 Password Request Form uses form-urlencoded
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axiosClient.post('/auth/jwt/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const token = response.data.access_token;
      get().setToken(token);
      await get().fetchProfile();
      set({ isLoading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  register: async (email, password, fullName = '') => {
    set({ isLoading: true, error: null });
    try {
      await axiosClient.post('/auth/register', { email, password, name: fullName });
      // Auto login after register
      const loginRes = await get().login(email, password);
      set({ isLoading: false });
      return loginRes;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Đăng ký không thành công. Email có thể đã tồn tại.';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      // Backend returns Google authorization_url
      const response = await axiosClient.get('/auth/google/authorize', {
        params: { redirect_url: redirectUri },
      });
      if (response.data?.authorization_url) {
        window.location.href = response.data.authorization_url;
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Không thể kết nối với dịch vụ Google. Vui lòng thử lại.';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  handleGoogleToken: async (token) => {
    set({ isLoading: true, error: null });
    try {
      get().setToken(token);
      await get().establishWebSession();
      await get().fetchProfile();
      set({ isLoading: false });
      return { success: true };
    } catch (err) {
      const msg = 'Xác thực Google không hợp lệ. Vui lòng thử lại.';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  handleGoogleCallback: async (code, state) => {
    set({ isLoading: true, error: null });
    try {
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const response = await axiosClient.get('/auth/google/callback', {
        params: { code, state, redirect_url: redirectUri },
      });
      const token = response.data.access_token;
      get().setToken(token);
      await get().establishWebSession();
      await get().fetchProfile();
      set({ isLoading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Đăng nhập Google thất bại. Vui lòng thử lại.';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  fetchProfile: async () => {
    if (!get().token) {
      set({ isProfileLoading: false });
      return;
    }
    set({ isProfileLoading: true });
    try {
      const response = await axiosClient.get('/users/me');
      set({ user: response.data, isAuthenticated: true, isProfileLoading: false });
    } catch (err) {
      get().logout();
      set({ isProfileLoading: false });
    }
  },

  registerTrial: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.post('/account/trial-register', data);
      await get().fetchProfile();
      set({ isLoading: false });
      return { success: true, data: response.data };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Đăng ký dùng thử không thành công. Vui lòng kiểm tra lại.';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  logout: () => {
    void axiosClient.post('/auth/jwt/logout').catch(() => {});
    publishAccessToken(null);
    set({ user: null, token: null, isAuthenticated: false, error: null });
  }
}));

window.addEventListener(AUTH_TOKEN_EVENT, (event) => {
  const token = event.detail;
  useAuthStore.setState(token
    ? { token, isAuthenticated: true }
    : { token: null, user: null, isAuthenticated: false });
});
