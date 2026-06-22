import axios from 'axios';
import { enqueueRequest } from '../utils/offlineSync';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor ──────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor ──────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    // If offline or network error, queue the request
    if (!navigator.onLine || (response && response.status === 0)) {
      // Only queue non-GET requests (POST, PUT, DELETE, PATCH)
      if (config.method !== 'get') {
        enqueueRequest({
          method: config.method,
          url: config.url,
          data: config.data,
          headers: config.headers,
        });
        // Return a custom rejection so the app knows it's queued
        return Promise.reject({
          ...error,
          offline: true,
          message: 'Request queued for offline sync',
        });
      }
    }

    // Handle 401 Unauthorized – redirect to login
    if (response && response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
