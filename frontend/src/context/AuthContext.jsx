import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

// If you use IndexedDB (offline sync), import the clearing function
// import { clearAllData } from '../utils/offlineSync'; // optional

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try sessionStorage first, then localStorage
    const token = sessionStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        setLoading(false);
        return;
      } catch (e) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
    }

    // Fallback to localStorage
    const localToken = localStorage.getItem('token');
    const localUser = localStorage.getItem('user');
    if (localToken && localUser) {
      try {
        const parsedUser = JSON.parse(localUser);
        setUser(parsedUser);
        // Sync to sessionStorage for this session
        sessionStorage.setItem('token', localToken);
        sessionStorage.setItem('user', localUser);
        api.defaults.headers.common.Authorization = `Bearer ${localToken}`;
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { token, user } = res.data;
      
      // Store in both sessionStorage and localStorage for persistence
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      setUser(user);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    // ─── Clear all authentication data ──────────────────────
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // ─── Remove Authorization header from axios ─────────────
    delete api.defaults.headers.common.Authorization;
    
    // ─── (Optional) Clear IndexedDB / offline data ──────────
    // if (window.indexedDB) {
    //   // Call a function to clear your offline store
    //   clearAllData().catch(console.error);
    // }
    
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
