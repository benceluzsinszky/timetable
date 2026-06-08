import { useMemo, useState } from 'react'
import { TimetableGrid } from './components/TimetableGrid'
import { groupEventsByDay, sortStages } from './lib/timetable-grid'
import { trpc } from './lib/trpc'

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
        <p className="text-sm font-medium uppercase tracking-wide text-violet-600">
          DAAD 2026
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Timetable
        </h1>
      </header>

      <section className="flex flex-wrap gap-3">
        <select
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
          value={festivalDay ?? ''}
          onChange={(event) => setFestivalDay(event.target.value || undefined)}
        >
          <option value="">All days</option>
          {days.data?.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>

        <select
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
          value={stageFilter ?? ''}
          onChange={(event) => setStageFilter(event.target.value || undefined)}
        >
          <option value="">All stages</option>
          {stages.data?.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </section>

      {events.isLoading && <p className="text-zinc-600">Loading timetable…</p>}
      {events.error && (
        <p className="text-red-600">
          Failed to load timetable. Run{' '}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm">
            ./scripts/seed.sh
          </code>{' '}
          after starting Postgres.
        </p>
      )}
      {events.data?.length === 0 && (
        <p className="text-zinc-600">No events match these filters.</p>
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
