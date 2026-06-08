import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import './index.css'
import App from './App.tsx'
import {
  migrateOfflineCache,
  queryCacheStorageKey,
} from './lib/cache-migration'
import { FavouritesProvider } from './lib/favourites-store'
import { offlineCacheOptions, queryClient, trpc, trpcClient } from './lib/trpc'

migrateOfflineCache()

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: queryCacheStorageKey(),
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
        <FavouritesProvider>
          <App />
        </FavouritesProvider>
      </PersistQueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
)
