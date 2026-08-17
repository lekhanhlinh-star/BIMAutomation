import { create } from 'zustand';
import { axiosClient } from '../api/axiosClient';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('bimautomation_token') || null,
  isAuthenticated: !!localStorage.getItem('bimautomation_token'),
  isLoading: false,
  isProfileLoading: !!localStorage.getItem('bimautomation_token'),
  error: null,

  setToken: (token) => {
    if (token) {
      localStorage.setItem('bimautomation_token', token);
      set({ token, isAuthenticated: true });
    } else {
      localStorage.removeItem('bimautomation_token');
      set({ token: null, user: null, isAuthenticated: false });
    }
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
      // Backend returns Google authorization_url
      const response = await axiosClient.get('/auth/google/authorize');
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
      const response = await axiosClient.get('/auth/google/callback', {
        params: { code, state },
      });
      const token = response.data.access_token;
      get().setToken(token);
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

  logout: () => {
    localStorage.removeItem('bimautomation_token');
    set({ user: null, token: null, isAuthenticated: false, error: null });
  }
}));
