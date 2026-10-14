import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const isLoginPage = window.location.pathname === '/login';
      const currentUser = localStorage.getItem('user');
      let role = '';
      try {
        if (currentUser) role = JSON.parse(currentUser)?.role;
      } catch (e) {}

      // Untuk akun orang tua (parent), jangan hapus sesi secara agresif pada data error biasa
      const reqUrl = error.config?.url || '';
      const isAuthRoute = reqUrl.includes('/me') || reqUrl.includes('/login') || reqUrl.includes('/logout');

      if (isAuthRoute || role !== 'parent') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!isLoginPage) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
