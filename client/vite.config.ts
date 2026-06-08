import path from 'node:path'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.png', 'icons.svg'],
      manifest: {
        name: 'DAAD 2026 Timetable',
        short_name: 'DAAD Timetable',
        description: 'Festival timetable for Dádpuszta',
        theme_color: '#1a1625',
        background_color: '#1a1625',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/favicon.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/trpc'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'timetable-trpc-v3',
              expiration: {
                maxEntries: 16,
                maxAgeSeconds: 60 * 60 * 24 * 60,
              },
              networkTimeoutSeconds: 4,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@timetable/server/trpc': path.resolve(
        __dirname,
        '../server/src/trpc/router.ts',
      ),
      '@timetable/server/festival-day': path.resolve(
        __dirname,
        '../server/src/lib/festival-day.ts',
      ),
    },
  },
  server: {
    proxy: {
      '/trpc': 'http://localhost:3001',
    },
  },
})
