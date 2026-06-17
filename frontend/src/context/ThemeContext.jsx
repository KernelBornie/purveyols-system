import React, { createContext, useState, useContext, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.get('/api/users/settings')
        .then(res => {
          const dark = res.data.darkMode || false;
          setDarkMode(dark);
          // Persist in localStorage for quick load on refresh
          localStorage.setItem('darkMode', dark);
          setLoading(false);
        })
        .catch(() => {
          const stored = localStorage.getItem('darkMode') === 'true';
          setDarkMode(stored);
          setLoading(false);
        });
    } else {
      const stored = localStorage.getItem('darkMode') === 'true';
      setDarkMode(stored);
      setLoading(false);
    }
  }, [user]);

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    if (user) {
      try {
        await api.put('/api/users/settings', { darkMode: newMode });
      } catch (e) { console.error('Failed to save dark mode preference'); }
    }
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#1976d2' },
      secondary: { main: '#dc004e' },
    },
    typography: {
      fontFamily: 'Roboto, sans-serif',
    },
  });

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, loading }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
