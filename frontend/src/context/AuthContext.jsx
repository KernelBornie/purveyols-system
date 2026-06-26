import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';
import { getAuth, saveAuth, clearAuth } from '../services/persistentStore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── Restore session from IndexedDB ──────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await getAuth('token');
        const storedUser = await getAuth('user');
        if (token && storedUser) {
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          setUser(storedUser);
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  // ─── Login ──────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      console.log('🔑 Login response:', res.data); // Debug – check the actual field names

      // ─── Support different token field names ──────────────────────
      const token = res.data.token || res.data.accessToken || res.data.access_token || res.data.data?.token;
      const userData = res.data.user || res.data.data?.user;

      if (!token) {
        throw new Error('No token received from server. Check login response format.');
      }

      // ─── Store token in IndexedDB and localStorage (fallback) ────
      await saveAuth('token', token);
      await saveAuth('user', userData);

      // Also store in localStorage for fallback in the interceptor
      localStorage.setItem('token', token);
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('user', JSON.stringify(userData));
      }

      // Set the default Authorization header for all future requests
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      setUser(userData);

      return { success: true, user: userData };
    } catch (err) {
      console.error('Login error:', err);

      // ─── Offline fallback – try to use stored credentials ──────
      if (!navigator.onLine || err.message === 'Network Error') {
        const token = await getAuth('token');
        const storedUser = await getAuth('user');
        if (token && storedUser) {
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          setUser(storedUser);
          return { success: true, user: storedUser, offline: true };
        }
      }

      return { success: false, error: err.response?.data?.error || err.message };
    }
  };

  // ─── Logout ──────────────────────────────────────────────────────────
  const logout = async () => {
    await clearAuth();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  };

  // ─── Update user ────────────────────────────────────────────────────
  const updateUser = (updatedData) => {
    if (!user) return;
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    saveAuth('user', newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    sessionStorage.setItem('user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);