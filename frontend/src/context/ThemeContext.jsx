import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';
import { getAuth, saveAuth, clearAuth } from '../services/persistentStore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── Restore session ──────────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await getAuth('token');
        const storedUser = await getAuth('user');
        console.log('🔐 Restore - token:', token ? '✅ exists' : '❌ null');
        if (token && storedUser) {
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          setUser(storedUser);
          console.log('✅ Session restored');
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
      console.log('🔑 Login response FULL:', JSON.stringify(res.data, null, 2));

      // ─── Try ALL possible token field names ──────────────────────
      const token = res.data.token || res.data.accessToken || res.data.access_token || res.data.data?.token || res.data.data?.accessToken || res.data.data?.access_token || res.data;
      const userData = res.data.user || res.data.data?.user || res.data;

      console.log('🔑 Extracted token:', typeof token === 'string' ? '✅ string' : typeof token);
      console.log('👤 Extracted user:', userData ? '✅ found' : '❌ null');

      if (typeof token !== 'string' || token.length < 10) {
        console.error('❌ No valid token in response. Raw response:', res.data);
        throw new Error('Invalid token received. Check login response format.');
      }

      // ─── Save to both stores ──────────────────────────────────────
      await saveAuth('token', token);
      await saveAuth('user', userData);
      localStorage.setItem('token', token);
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('user', JSON.stringify(userData));
      }

      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      setUser(userData);

      console.log('✅ Login successful, token stored');
      return { success: true, user: userData };
    } catch (err) {
      console.error('Login error:', err);
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