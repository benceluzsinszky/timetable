import { useMemo, useState } from 'react'
import { FilterMultiSelect } from './components/FilterMultiSelect'
import { TimetableGrid } from './components/TimetableGrid'
import { Button } from '@/components/ui/button'
import { isFavourited, toTimetableEvents } from './lib/events'
import { DAY_STAGES, getStageShortName, NIGHT_STAGES } from './lib/stage-theme'
import { groupEventsByDay, sortStages } from './lib/timetable-grid'
import { trpc } from './lib/trpc'
import { cn } from '@/lib/utils'

const ALL_DAYS = 'All days'
const ALL_STAGES = 'All stages'

function App() {
  const [stageFilters, setStageFilters] = useState<string[]>([])
  const [festivalDays, setFestivalDays] = useState<string[]>([])
  const [showMyTimetable, setShowMyTimetable] = useState(false)

  const utils = trpc.useUtils()
  const stages = trpc.events.stages.useQuery()
  const days = trpc.events.days.useQuery()
  const events = trpc.events.list.useQuery({
    festivalDays: festivalDays.length > 0 ? festivalDays : undefined,
    stages: stageFilters.length > 0 ? stageFilters : undefined,
  })
  const toggleFavourite = trpc.favourites.toggle.useMutation({
    onSuccess: () => utils.events.list.invalidate(),
  })

  const allEvents = useMemo(() => toTimetableEvents(events.data), [events.data])

  const displayEvents = useMemo(
    () => (showMyTimetable ? allEvents.filter(isFavourited) : allEvents),
    [allEvents, showMyTimetable],
  )

  const relevantStages = useMemo(() => {
    if (showMyTimetable) {
      return sortStages([...new Set(displayEvents.map((event) => event.stage))])
    }

    return sortStages(stages.data ?? [])
  }, [showMyTimetable, displayEvents, stages.data])

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

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={showMyTimetable ? 'default' : 'outline'}
              className={cn(
                'rounded-none border-foreground/20 text-xs uppercase tracking-wide sm:text-sm',
                !showMyTimetable &&
                  'bg-black/35 text-foreground hover:bg-black/50',
              )}
              onClick={() => setShowMyTimetable((active) => !active)}
            >
              Your timetable
            </Button>

            <FilterMultiSelect
              emptyLabel={ALL_DAYS}
              options={days.data ?? []}
              selected={festivalDays}
              onChange={setFestivalDays}
              className="w-[7.5rem] sm:w-[132px]"
            />

            <FilterMultiSelect
              emptyLabel={ALL_STAGES}
              options={stages.data ?? []}
              selected={stageFilters}
              onChange={setStageFilters}
              getOptionLabel={getStageShortName}
              presets={[
                { label: 'Day stages', values: [...DAY_STAGES] },
                { label: 'Night stages', values: [...NIGHT_STAGES] },
              ]}
              className="w-[7.5rem] sm:w-[148px]"
            />
          </div>
        </header>

        {events.isLoading && (
          <p className="text-sm tracking-wide text-foreground/60 uppercase">
            Loading timetable…
          </p>
        )}
        {events.error && (
          <p className="text-sm text-destructive">
            Failed to load timetable. Run{' '}
            <code className="rounded-none bg-black/35 px-1.5 py-0.5 text-sm">
              ./scripts/seed.sh
            </code>{' '}
            after starting Postgres.
          </p>
        )}
        {events.data &&
          eventsForGrid.length === 0 &&
          !events.isLoading &&
          !events.error && (
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

        {events.data &&
          eventsForGrid.length > 0 &&
          visibleStages.length > 0 && (
            <div className="min-h-0 flex-1">
              <TimetableGrid
                className="h-full"
                stages={visibleStages}
                dayBlocks={dayBlocks}
                showDayColumn
                onToggleFavourite={(eventId) =>
                  toggleFavourite.mutate({ eventId })
                }
              />
            </div>
          )}
      </div>
    </div>
  )
}

export default App
