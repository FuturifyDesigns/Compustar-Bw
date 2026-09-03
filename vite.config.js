import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: [
        'favicon.png',
        'favicon-16.png',
        'favicon-32.png',
        'favicon-48.png',
        'apple-touch-icon.png',
        'logo.webp',
        'hero-bg.webp',
        'pwa-192.png',
        'pwa-512.png',
        'pwa-maskable-512.png'
      ],
      manifest: {
        id: '/',
        name: 'Compustar Botswana',
        short_name: 'Compustar',
        description: 'Computers, printers, surveillance, networking, accessories, repairs, and IT support in Gaborone.',
        theme_color: '#ef1717',
        background_color: '#0c0d10',
        display: 'standalone',
        orientation: 'any',
        lang: 'en',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        categories: ['shopping', 'business'],
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,webmanifest,svg,ico,webp,woff2,json}'],
        globIgnores: ['**/hero-logo.mp4'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/404\.html$/, /^\/robots\.txt$/, /^\/sitemap\.xml$/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'compustar-pages',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'compustar-images',
              expiration: { maxEntries: 180, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'compustar-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: ({ url }) => url.hostname.endsWith('tile.openstreetmap.org'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'compustar-maps',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 14 }
            }
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
