import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CssBaseline } from '@mui/material';
import { initOfflineSync } from './utils/offlineSync';

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('📡 Service Worker registered successfully');
          registration.update();
        })
        .catch((err) => {
          console.log('📡 Service Worker registration failed:', err);
        });
    } catch (e) {
      console.log('📡 Service Worker not supported');
    }
  });
}

// Initialize offline sync (doesn't block rendering)
try {
  initOfflineSync();
} catch (e) {
  console.log('Offline sync not available:', e);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);
