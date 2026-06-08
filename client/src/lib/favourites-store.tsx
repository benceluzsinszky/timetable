import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { FavouritesContext } from './favourites-context'
import {
  FAVOURITES_KEY,
  getFavouriteIds,
  toggleFavouriteId,
} from './favourites'

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const [revision, setRevision] = useState(0)
  const [favouriteIds, setFavouriteIds] = useState(
    () => new Set(getFavouriteIds()),
  )

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === FAVOURITES_KEY) {
        setFavouriteIds(new Set(getFavouriteIds()))
        setRevision((value) => value + 1)
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toggleFavourite = useCallback((eventId: string) => {
    toggleFavouriteId(eventId)
    setFavouriteIds(new Set(getFavouriteIds()))
    setRevision((value) => value + 1)
  }, [])

  const value = useMemo(
    () => ({
      favouriteIds,
      revision,
      toggleFavourite,
      isFavourited: (eventId: string) => favouriteIds.has(eventId),
    }),
    [favouriteIds, revision, toggleFavourite],
  )

  return (
    <FavouritesContext.Provider value={value}>
      {children}
    </FavouritesContext.Provider>
  )
}
