import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { CssBaseline } from '@mui/material';
import { initSync, syncAllData } from './services/dataSyncService';
import { initOfflineSync, processQueue } from './utils/offlineSync';
import api from './api/axios';

// ─── Register service worker ──────────────────────────────────
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

// ─── Initialize offline sync (legacy queue) ──────────────────
const cleanup = initOfflineSync(api);

// ─── Initialize new sync (IndexedDB endpoints) ──────────────
initSync();

// ─── Preload data from API into persistent storage ──────────
setTimeout(() => {
  syncAllData().then(results => {
    console.log('📦 Data preloaded:', Object.keys(results).filter(k => results[k].success));
  }).catch(err => {
    console.log('Data preload failed:', err);
  });
}, 5000);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CssBaseline />
      <App />
    </AuthProvider>
  </React.StrictMode>
);