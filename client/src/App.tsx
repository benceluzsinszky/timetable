import { useMemo, useState } from 'react'
import { TimetableGrid } from './components/TimetableGrid'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { isFavourited, toTimetableEvents } from './lib/events'
import { groupEventsByDay, sortStages } from './lib/timetable-grid'
import { trpc } from './lib/trpc'
import { cn } from '@/lib/utils'

const ALL_DAYS = 'All days'
const ALL_STAGES = 'All stages'

function App() {
  const [stageFilter, setStageFilter] = useState<string>()
  const [festivalDay, setFestivalDay] = useState<string>()
  const [showMyTimetable, setShowMyTimetable] = useState(false)

  const utils = trpc.useUtils()
  const stages = trpc.events.stages.useQuery()
  const days = trpc.events.days.useQuery()
  const events = trpc.events.list.useQuery({ festivalDay })
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
    return stageFilter
      ? relevantStages.filter((stage) => stage === stageFilter)
      : relevantStages
  }, [relevantStages, stageFilter])

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

  return (
    <div className="daad-app min-h-svh">
      <div className="daad-shell relative z-10 mx-auto flex h-svh w-full max-w-[1400px] flex-col gap-3 overflow-hidden p-4 md:p-6">
        <span aria-hidden className="daad-corner daad-corner-tl" />
        <span aria-hidden className="daad-corner daad-corner-tr" />
        <span aria-hidden className="daad-corner daad-corner-bl" />
        <span aria-hidden className="daad-corner daad-corner-br" />

        <header className="flex shrink-0 items-end justify-between gap-4 pb-1">
          <div className="space-y-0.5">
            <h1 className="text-4xl font-bold tracking-[0.08em] text-foreground uppercase md:text-5xl">
              DAAD 2026
            </h1>
            <p className="text-xs font-medium tracking-[0.18em] text-foreground/55 uppercase">
              Dádpuszta · 17–22 June · Hungary
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={showMyTimetable ? 'default' : 'outline'}
              className={cn(
                'rounded-none border-foreground/20 uppercase tracking-wide',
                !showMyTimetable &&
                  'bg-black/35 text-foreground hover:bg-black/50',
              )}
              onClick={() => setShowMyTimetable((active) => !active)}
            >
              Your timetable
            </Button>

            <Select
              value={festivalDay ?? ALL_DAYS}
              onValueChange={(value) =>
                setFestivalDay(!value || value === ALL_DAYS ? undefined : value)
              }
            >
              <SelectTrigger
                size="sm"
                className="w-[132px] rounded-none border-foreground/20 bg-black/35 text-foreground uppercase"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none border-foreground/20 bg-card uppercase">
                <SelectItem value={ALL_DAYS}>All days</SelectItem>
                {days.data?.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={stageFilter ?? ALL_STAGES}
              onValueChange={(value) =>
                setStageFilter(
                  !value || value === ALL_STAGES ? undefined : value,
                )
              }
            >
              <SelectTrigger
                size="sm"
                className="w-[148px] rounded-none border-foreground/20 bg-black/35 text-foreground uppercase"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none border-foreground/20 bg-card uppercase">
                <SelectItem value={ALL_STAGES}>All stages</SelectItem>
                {stages.data?.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  ? festivalDay || stageFilter
                    ? 'No favourites match these filters.'
                    : 'No favourites yet. Tap events to add them.'
                  : 'No favourites on this stage.'
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
