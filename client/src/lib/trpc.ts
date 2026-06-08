import { QueryClient } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@timetable/server/trpc'

export type RouterOutputs = inferRouterOutputs<AppRouter>
export type EventListItem = RouterOutputs['events']['list'][number]

const SIXTY_DAYS_MS = 1000 * 60 * 60 * 24 * 60

export const trpc = createTRPCReact<AppRouter>()

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: SIXTY_DAYS_MS,
      retry: 2,
      networkMode: 'offlineFirst',
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 3,
      networkMode: 'offlineFirst',
    },
  },
})

export const offlineCacheOptions = {
  maxAge: SIXTY_DAYS_MS,
  buster: 'daad-2026-v1',
} as const

export const trpcClient = trpc.createClient({
  links: [httpBatchLink({ url: '/trpc' })],
})
