import { FESTIVAL_DAYS } from '@timetable/server/festival-day'
import { useCallback, useMemo, useState } from 'react'
import { ArtistSearch } from './components/ArtistSearch'
import { FilterMultiSelect } from './components/FilterMultiSelect'
import { TimetableGrid } from './components/TimetableGrid'
import { Button } from '@/components/ui/button'
import { filterEvents, getStagesFromEvents } from './lib/event-filters'
import { toTimetableEvents } from './lib/events'
import { toggleFavouriteId } from './lib/favourites'
import { useFavouriteIds } from './lib/use-favourites'
import type { TimetableEvent } from './lib/timetable-grid'
import { DAY_STAGES, getStageShortName, NIGHT_STAGES } from './lib/stage-theme'
import { groupEventsByDay, sortStages } from './lib/timetable-grid'
import { useOnlineStatus } from './lib/use-online-status'
import { trpc } from './lib/trpc'
import { cn } from '@/lib/utils'

const ALL_DAYS = 'All days'
const ALL_STAGES = 'All stages'

function App() {
  const [stageFilters, setStageFilters] = useState<string[]>([])
  const [festivalDays, setFestivalDays] = useState<string[]>([])
  const [showMyTimetable, setShowMyTimetable] = useState(false)
  const [scrollToEventId, setScrollToEventId] = useState<string | null>(null)

  const isOnline = useOnlineStatus()
  const favouriteIds = useFavouriteIds()

  const eventsQuery = trpc.events.list.useQuery({})

  const allEvents = useMemo(
    () => toTimetableEvents(eventsQuery.data),
    [eventsQuery.data],
  )

  const filteredEvents = useMemo(
    () =>
      filterEvents(allEvents, {
        festivalDays,
        stages: stageFilters,
      }),
    [allEvents, festivalDays, stageFilters],
  )

  const displayEvents = useMemo(
    () =>
      showMyTimetable
        ? filteredEvents.filter((event) => favouriteIds.has(event.id))
        : filteredEvents,
    [filteredEvents, showMyTimetable, favouriteIds],
  )

  const stageOptions = useMemo(
    () => getStagesFromEvents(allEvents),
    [allEvents],
  )

  const relevantStages = useMemo(() => {
    if (showMyTimetable) {
      return sortStages([...new Set(displayEvents.map((event) => event.stage))])
    }

    return stageOptions
  }, [showMyTimetable, displayEvents, stageOptions])

  const visibleStages = useMemo(() => {
    if (stageFilters.length === 0) return relevantStages

    const selected = new Set(stageFilters)
    return relevantStages.filter((stage) => selected.has(stage))
  }, [relevantStages, stageFilters])

  const eventsForGrid = useMemo(() => {
    const visible = new Set(visibleStages)
    return displayEvents.filter((event) => visible.has(event.stage))
  }, [displayEvents, visibleStages])

  const dayBlocks = useMemo(() => {
    const grouped = groupEventsByDay(eventsForGrid)
    return [...grouped.entries()].map(([label, dayEvents]) => ({
      label,
      events: dayEvents,
    }))
  }, [eventsForGrid])

  const hasActiveFilters = festivalDays.length > 0 || stageFilters.length > 0

  const handleSearchSelect = useCallback((event: TimetableEvent) => {
    setScrollToEventId(event.id)
  }, [])

  return (
    <div className="daad-app min-h-svh">
      <div className="daad-shell relative z-10 mx-auto flex h-svh w-full max-w-[1400px] flex-col gap-2 overflow-hidden p-3 sm:gap-3 sm:p-4 md:p-6">
        <span aria-hidden className="daad-corner daad-corner-tl" />
        <span aria-hidden className="daad-corner daad-corner-tr" />
        <span aria-hidden className="daad-corner daad-corner-bl" />
        <span aria-hidden className="daad-corner daad-corner-br" />

        <header className="flex shrink-0 flex-col gap-3 pb-1 md:flex-row md:items-end md:justify-between">
          <div className="space-y-0.5">
            <h1 className="text-3xl font-bold tracking-[0.08em] text-foreground uppercase sm:text-4xl md:text-5xl">
              DAAD 2026
            </h1>
            <p className="text-[10px] font-medium tracking-[0.14em] text-foreground/55 uppercase sm:text-xs sm:tracking-[0.18em]">
              Dádpuszta · 17–22 June · Hungary
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:w-[18rem]">
            <div className="flex min-w-0 flex-col gap-2">
              <ArtistSearch
                events={displayEvents}
                onSelect={handleSearchSelect}
                className="w-full"
              />

              <Button
                type="button"
                size="sm"
                variant={showMyTimetable ? 'default' : 'outline'}
                className={cn(
                  'h-7 w-full rounded-none border-foreground/20 text-xs font-normal uppercase tracking-wide sm:text-sm',
                  !showMyTimetable &&
                    'bg-black/35 text-foreground hover:bg-black/50',
                )}
                onClick={() => setShowMyTimetable((active) => !active)}
              >
                Your timetable
              </Button>
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <FilterMultiSelect
                emptyLabel={ALL_DAYS}
                options={[...FESTIVAL_DAYS]}
                selected={festivalDays}
                onChange={setFestivalDays}
                className="w-full"
              />

              <FilterMultiSelect
                emptyLabel={ALL_STAGES}
                options={stageOptions}
                selected={stageFilters}
                onChange={setStageFilters}
                getOptionLabel={getStageShortName}
                presets={[
                  { label: 'Day stages', values: [...DAY_STAGES] },
                  { label: 'Night stages', values: [...NIGHT_STAGES] },
                ]}
                className="w-full"
              />
            </div>
          </div>
        </header>

        {!isOnline && (
          <p className="text-[10px] font-medium tracking-[0.14em] text-foreground/50 uppercase sm:text-xs">
            Offline · using saved timetable
          </p>
        )}

        {eventsQuery.isLoading && !eventsQuery.data && (
          <p className="text-sm tracking-wide text-foreground/60 uppercase">
            Loading timetable…
          </p>
        )}
        {eventsQuery.error && !eventsQuery.data && (
          <p className="text-sm text-destructive">
            Failed to load timetable. Open the app once while online, then it
            will work offline.
          </p>
        )}
        {eventsQuery.data &&
          eventsForGrid.length === 0 &&
          !eventsQuery.isLoading &&
          !eventsQuery.error && (
            <p className="text-sm tracking-wide text-foreground/60 uppercase">
              {showMyTimetable
                ? displayEvents.length === 0
                  ? hasActiveFilters
                    ? 'No favourites match these filters.'
                    : 'No favourites yet. Tap events to add them.'
                  : 'No favourites on these stages.'
                : 'No events match these filters.'}
            </p>
          )}

        {eventsQuery.data &&
          eventsForGrid.length > 0 &&
          visibleStages.length > 0 && (
            <div className="min-h-0 flex-1">
              <TimetableGrid
                className="h-full"
                stages={visibleStages}
                dayBlocks={dayBlocks}
                showDayColumn
                scrollToEventId={scrollToEventId}
                onScrolledToEvent={() => setScrollToEventId(null)}
                onToggleFavourite={toggleFavouriteId}
              />
            </div>
          )}
      </div>
    </div>
  )
}

export default App
