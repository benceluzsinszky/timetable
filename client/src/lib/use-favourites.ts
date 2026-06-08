import { useSyncExternalStore } from 'react'
import {
  getFavouriteIds,
  getFavouritesSnapshot,
  subscribeFavourites,
} from './favourites'

export function useFavouriteIds(): ReadonlySet<string> {
  useSyncExternalStore(subscribeFavourites, getFavouritesSnapshot)
  return new Set(getFavouriteIds())
}
