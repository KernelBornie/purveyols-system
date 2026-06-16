import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Conditional PWA import (fallback if not installed)
let VitePWA;
try {
  VitePWA = (await import('vite-plugin-pwa')).VitePWA;
} catch (_) {
  VitePWA = null;
}

const plugins = [react()];
if (VitePWA) {
  plugins.push(
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/purveyols-backend\.onrender\.com\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
            },
          },
        ],
      },
    })
  );
}

export default defineConfig({
  plugins,
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
