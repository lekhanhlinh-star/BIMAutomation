import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const ACCESS_TOKEN_KEY = 'bimautomation_token';
const AUTH_TOKEN_EVENT = 'bimautomation:auth-token';

function publishAccessToken(token) {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
  window.dispatchEvent(new CustomEvent(AUTH_TOKEN_EVENT, { detail: token || null }));
}

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/auth/jwt/refresh')
      .then((response) => {
        const token = response.data.access_token;
        publishAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function isSessionEndpoint(url = '') {
  return [
    '/auth/jwt/login',
    '/auth/jwt/logout',
    '/auth/jwt/refresh',
    '/auth/jwt/session',
  ].some((path) => url.includes(path));
}

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token interceptor
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for 401 handling
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const canRefresh = error.response?.status === 401
      && originalRequest
      && !originalRequest._retry
      && !isSessionEndpoint(originalRequest.url);

    if (canRefresh) {
      originalRequest._retry = true;
      try {
        const token = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosClient(originalRequest);
      } catch {
        publishAccessToken(null);
      }
    }
    return Promise.reject(error);
  }
);

export { ACCESS_TOKEN_KEY, AUTH_TOKEN_EVENT, publishAccessToken };
