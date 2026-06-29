import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { CssBaseline } from '@mui/material';

// ─── Register service worker (optional) ──────────────────────
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

// ─── No offline sync initialisation ──────────────────────────
// All sync logic has been disabled to eliminate console spam and retry loops.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CssBaseline />
      <App />
    </AuthProvider>
  </React.StrictMode>
);