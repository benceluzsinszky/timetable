import { useMemo, useState } from 'react'
import { TimetableGrid } from './components/TimetableGrid'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { groupEventsByDay, sortStages } from './lib/timetable-grid'
import { trpc } from './lib/trpc'

const ALL_DAYS = 'all'
const ALL_STAGES = 'all'

function App() {
  const [stageFilter, setStageFilter] = useState<string>()
  const [festivalDay, setFestivalDay] = useState<string>()

  const utils = trpc.useUtils()
  const stages = trpc.events.stages.useQuery()
  const days = trpc.events.days.useQuery()
  const events = trpc.events.list.useQuery({ festivalDay })
  const toggleFavourite = trpc.favourites.toggle.useMutation({
    onSuccess: () => utils.events.list.invalidate(),
  })

  const visibleStages = useMemo(() => {
    const all = sortStages(stages.data ?? [])
    return stageFilter ? all.filter((s) => s === stageFilter) : all
  }, [stages.data, stageFilter])

  const dayBlocks = useMemo(() => {
    const grouped = groupEventsByDay(events.data ?? [])
    return [...grouped.entries()].map(([label, dayEvents]) => ({
      label,
      events: dayEvents,
    }))
  }, [events.data])

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[1400px] flex-col gap-6 p-4 md:p-6">
      <header className="space-y-1">
        <p className="text-sm font-medium tracking-wide text-primary uppercase">
          DAAD 2026
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Timetable</h1>
      </header>

      <section className="flex flex-wrap gap-3">
        <Select
          value={festivalDay ?? ALL_DAYS}
          onValueChange={(value) =>
            setFestivalDay(!value || value === ALL_DAYS ? undefined : value)
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
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
            setStageFilter(!value || value === ALL_STAGES ? undefined : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STAGES}>All stages</SelectItem>
            {stages.data?.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {events.isLoading && (
        <p className="text-sm text-muted-foreground">Loading timetable…</p>
      )}
      {events.error && (
        <p className="text-sm text-destructive">
          Failed to load timetable. Run{' '}
          <code className="rounded-md bg-muted px-1.5 py-0.5 text-sm">
            ./scripts/seed.sh
          </code>{' '}
          after starting Postgres.
        </p>
      )}
      {events.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No events match these filters.
        </p>
      )}

      {events.data && events.data.length > 0 && (
        <TimetableGrid
          stages={visibleStages}
          dayBlocks={dayBlocks}
          showDayColumn={!festivalDay}
          onToggleFavourite={(eventId) => toggleFavourite.mutate({ eventId })}
        />
      )}
    </div>
  )
}

export default App
