import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

// Optional: if you use IndexedDB for offline sync
// import { clearAllOfflineData } from '../utils/offlineSync';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read from sessionStorage first, then localStorage
    const token = sessionStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user');

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        setLoading(false);
        return;
      } catch {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
    }

    const localToken = localStorage.getItem('token');
    const localUser = localStorage.getItem('user');
    if (localToken && localUser) {
      try {
        const parsedUser = JSON.parse(localUser);
        setUser(parsedUser);
        sessionStorage.setItem('token', localToken);
        sessionStorage.setItem('user', localUser);
        api.defaults.headers.common.Authorization = `Bearer ${localToken}`;
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { token, user } = res.data;

    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(user);
    return user;
  };

  const logout = () => {
    // ─── Clear all storage ──────────────────────────────────
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // ─── Remove Authorization header ──────────────────────
    delete api.defaults.headers.common.Authorization;

    // ─── (Optional) Clear IndexedDB / offline data ────────
    // if (typeof clearAllOfflineData === 'function') {
    //   clearAllOfflineData().catch(console.error);
    // }
    // If you use localForage:
    // import localForage from 'localforage';
    // localForage.clear();

    // ─── Reset React state ──────────────────────────────────
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
