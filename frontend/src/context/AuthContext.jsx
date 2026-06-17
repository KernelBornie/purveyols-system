import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';
import { saveUserProfile, getUserProfile } from '../services/persistentStore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to restore from sessionStorage first
    const token = sessionStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        // Also save to persistent store
        saveUserProfile(parsedUser);
        setLoading(false);
        return;
      } catch (e) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
    }
    
    // Fallback: try persistent store
    const persistentUser = getUserProfile();
    if (persistentUser && persistentUser.email) {
      // We have a saved profile, but we need a token
      // Try to restore from sessionStorage (already tried)
      // If no token, we need to login again
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { token, user } = res.data;
      
      // Store in sessionStorage (per tab)
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      
      // Store in persistent storage (never loses data)
      saveUserProfile(user);
      
      // Store credentials for quick restore
      localStorage.setItem('lastUser', JSON.stringify({ email }));
      
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      setUser(user);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    delete api.defaults.headers.common.Authorization;
    setUser(null);
    // Keep persistent data – don't clear it
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
