
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Hochwertiges Kassen-Icon als Data-URI (Orange mit weißem Symbol)
const ICON_SVG = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiB2aWV3Qm94PSIwIDAgNTEyIDUxMiI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZjU5ZTBiIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmJiZjI0Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiIHJ4PSIxMDAiIGZpbGw9InVybCgjZykiLz48cGF0aCBkPSJNMTI4IDM1MmgyNTZ2NjRIMTI4ek0xNjAgMjI0aDE5MmwtMzItOTZIMTkybC0zMiA5NnoiIGZpbGw9IndoaXRlIi8+PHJlY3QgeD0iMTYwIiB5PSIyNDAiIHdpZHRoPSIxOTIiIGhlaWdodD0iOTYiIHJ4PSI4IiBmaWxsPSJ3aGl0ZSIvPjxjaXJjbGUgY3g9IjIwMCIgY3k9IjI3MCIgcj0iMTAiIGZpbGw9IiNmNTllMGIiLz48Y2lyY2xlIGN4PSIyNTYiIGN5PSIyNzAiIHI9IjEwIiBmaWxsPSIjZjU5ZTBiIi8+PGNpcmNsZSBjeD0iMzEyIiBjeT0iMjcwIiByPSIxMCIgZmlsbD0iI2Y1OWUwYiIvPjwvc3ZnPg==`;

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Kassensystem FZ',
        short_name: 'FZ Kasse',
        description: 'Mobile Kassensystem für Events - Powered by C2',
        theme_color: '#f59e0b',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: ICON_SVG,
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: ICON_SVG,
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'external-resources'
            }
          }
        ]
      }
    })
  ]
});
