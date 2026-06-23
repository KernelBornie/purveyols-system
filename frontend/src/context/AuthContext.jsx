import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';
import { getAuth, saveAuth, clearAuth } from '../services/persistentStore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── Restore session from IndexedDB ──────────────────────
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

  // ─── Login ──────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { token, user: userData } = res.data;

      // Store in IndexedDB
      await saveAuth('token', token);
      await saveAuth('user', userData);

      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      // If offline, try using stored credentials
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

  // ─── Logout ──────────────────────────────────────────────────
  const logout = async () => {
    await clearAuth();
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  };

  // ─── Update user (sync state + storage) ─────────────────────
  const updateUser = (updatedData) => {
    if (!user) return;
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    // Update IndexedDB (persistentStore)
    saveAuth('user', newUser);
    // Also update localStorage/sessionStorage if used elsewhere
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