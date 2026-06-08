import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import './index.css'
import App from './App.tsx'
import { offlineCacheOptions, queryClient, trpc, trpcClient } from './lib/trpc'

// Drop pre-timezone-fix cache (wrong UTC times from first seed).
localStorage.removeItem('timetable-query-cache')

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: `timetable-query-cache-${offlineCacheOptions.buster}`,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: offlineCacheOptions.maxAge,
          buster: offlineCacheOptions.buster,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => query.state.status === 'success',
          },
        }}
      >
        <App />
      </PersistQueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
)
