import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user');
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      } catch (e) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
    }
    // Always verify token with backend
    if (token) {
      api.get('/api/users/me')
        .then(res => {
          setUser(res.data);
          sessionStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { token, user } = res.data;
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
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
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
