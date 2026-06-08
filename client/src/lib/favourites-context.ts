import { createContext } from 'react'

export type FavouritesContextValue = {
  favouriteIds: ReadonlySet<string>
  revision: number
  toggleFavourite: (eventId: string) => void
  isFavourited: (eventId: string) => boolean
}

export const FavouritesContext = createContext<FavouritesContextValue | null>(
  null,
)
