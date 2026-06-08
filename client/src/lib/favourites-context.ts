import { createContext } from 'react'

export type FavouritesContextValue = {
  favouriteIds: ReadonlySet<string>
  toggleFavourite: (eventId: string) => void
  isFavourited: (eventId: string) => boolean
}

export const FavouritesContext = createContext<FavouritesContextValue | null>(
  null,
)
