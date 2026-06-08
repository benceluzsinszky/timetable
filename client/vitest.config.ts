import path from 'node:path'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
    resolve: {
      alias: {
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
  }),
)
