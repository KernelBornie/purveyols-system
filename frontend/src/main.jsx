import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { CssBaseline } from '@mui/material';

// ─── Service Worker registration with update check ──────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('📡 Service Worker registered');

        // ─── Check for updates every 60 seconds ─────────────
        setInterval(() => {
          registration.update();
        }, 60 * 1000);

        // ─── Reload when a new SW is waiting ────────────────
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New version available – reloading...');
              window.location.reload();
            }
          });
        });
      })
      .catch((err) => {
        console.log('📡 Service Worker registration failed:', err);
      });
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