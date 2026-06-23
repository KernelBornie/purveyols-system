import axios from 'axios';
import { addToSyncQueue, getAuth } from '../services/persistentStore';

const API_URL = import.meta.env.VITE_API_URL || 'https://purveyols-backend.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor ──────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await getAuth('token');
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
    if (!navigator.onLine || !response || response.status === 0) {
      // Only queue non-GET requests (POST, PUT, DELETE, PATCH)
      if (config && config.method && config.method.toLowerCase() !== 'get') {
        const operation = {
          method: config.method.toUpperCase(),
          url: config.url,
          data: config.data ? JSON.parse(config.data) : undefined,
          id: config.params?.id || undefined
        };
        await addToSyncQueue(operation);
        // Return a custom rejection so the app knows it's queued
        return Promise.reject({
          ...error,
          offline: true,
          __queued: true,
          message: 'Request queued for offline sync',
        });
      }
    }

    // Handle 401 Unauthorized – redirect to login
    if (response && response.status === 401) {
      // Clear auth and redirect
      const { clearAuth } = await import('../services/persistentStore');
      await clearAuth();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
