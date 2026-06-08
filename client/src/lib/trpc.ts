import { QueryClient } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@timetable/server/trpc'
import { getSessionId } from './session'

export type RouterOutputs = inferRouterOutputs<AppRouter>
export type EventListItem = RouterOutputs['events']['list'][number]

export const trpc = createTRPCReact<AppRouter>()

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
    },
  },
})

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/trpc',
      headers() {
        return { 'x-session-id': getSessionId() }
      },
    }),
  ],
})
