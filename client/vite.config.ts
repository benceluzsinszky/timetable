import path from 'node:path'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
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
