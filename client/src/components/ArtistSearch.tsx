import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { getStageShortName } from '../lib/stage-theme'
import { MIN_QUERY_LENGTH, searchEvents } from '../lib/event-search'
import { formatSlotTime } from '../lib/timetable-grid'
import type { TimetableEvent } from '../lib/timetable-grid'
import { cn } from '@/lib/utils'

type ArtistSearchProps = {
  events: TimetableEvent[]
  onSelect: (event: TimetableEvent) => void
  className?: string
}

export function ArtistSearch({
  events,
  onSelect,
  className,
}: ArtistSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()

  const suggestions = useMemo(
    () => searchEvents(events, query),
    [events, query],
  )

  const showSuggestions = open && query.trim().length >= MIN_QUERY_LENGTH

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const handleSelect = (event: TimetableEvent) => {
    setQuery('')
    setOpen(false)
    onSelect(event)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-foreground/45" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="Search"
          aria-label="Search artists"
          aria-expanded={showSuggestions}
          aria-controls={showSuggestions ? listboxId : undefined}
          aria-autocomplete="list"
          className="h-7 w-full rounded-none border border-foreground/20 bg-black/35 pr-7 pl-7 text-xs uppercase tracking-wide text-foreground outline-none placeholder:text-foreground/45 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 sm:text-sm"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setQuery('')
              setOpen(false)
              inputRef.current?.blur()
            }
          }}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-none p-0.5 text-foreground/45 transition-colors hover:text-foreground"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {showSuggestions && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute top-full right-0 z-50 mt-1 max-h-60 w-max min-w-full overflow-y-auto rounded-none border border-foreground/20 bg-card py-1 shadow-md"
        >
          {suggestions.length === 0 ? (
            <p className="px-2.5 py-1.5 text-xs uppercase tracking-wide text-foreground/55">
              No matches
            </p>
          ) : (
            suggestions.map((event) => {
              const startMs = new Date(event.startTime).getTime()

              return (
                <button
                  key={event.id}
                  type="button"
                  role="option"
                  className="flex w-full flex-col gap-0.5 px-2.5 py-1.5 text-left transition-colors hover:bg-muted"
                  onClick={() => handleSelect(event)}
                >
                  <span className="truncate text-xs font-medium uppercase tracking-wide text-foreground sm:text-sm">
                    {event.artist}
                  </span>
                  <span className="truncate text-[10px] uppercase tracking-wide text-foreground/55">
                    {event.festivalDay} · {formatSlotTime(startMs)} ·{' '}
                    {getStageShortName(event.stage)}
                  </span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
