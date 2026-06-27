import axios from 'axios';
import { addToSyncQueue, getAuth, clearAuth } from '../services/persistentStore';

const API_URL = import.meta.env.VITE_API_URL || 'https://purveyols-backend.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor ──────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    // Try IndexedDB first, then localStorage as fallback
    let token = null;
    try {
      token = await getAuth('token');
    } catch (e) {
      // fall through
    }
    if (!token) {
      token = localStorage.getItem('token');
    }
    
    // Debug: log whether we found a token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token found, attaching to request:', config.url);
    } else {
      console.warn('⚠️ No token found for request:', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor ─────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    // Offline / network errors – queue the request for later
    if (!navigator.onLine || !response || response.status === 0) {
      if (config && config.method && config.method.toLowerCase() !== 'get') {
        const operation = {
          method: config.method.toUpperCase(),
          url: config.url,
          data: config.data ? JSON.parse(config.data) : undefined,
          id: config.params?.id || undefined
        };
        await addToSyncQueue(operation);
        return Promise.reject({
          ...error,
          offline: true,
          __queued: true,
          message: 'Request queued for offline sync',
        });
      }
    }

    // ─── 401 Unauthorized – clear auth and redirect to login ────
    if (response && response.status === 401) {
      console.warn('🔒 401 Unauthorized – clearing auth and redirecting');
      await clearAuth();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;