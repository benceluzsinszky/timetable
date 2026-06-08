import { useMemo, useState } from 'react'
import { trpc } from './lib/trpc'

function formatTimeRange(start: Date | string, end: Date | string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${formatter.format(startDate)} – ${formatter.format(endDate)}`
}

function App() {
  const [stage, setStage] = useState<string>()
  const [festivalDay, setFestivalDay] = useState<string>()

  const utils = trpc.useUtils()
  const stages = trpc.events.stages.useQuery()
  const days = trpc.events.days.useQuery()
  const events = trpc.events.list.useQuery({ stage, festivalDay })
  const toggleFavourite = trpc.favourites.toggle.useMutation({
    onSuccess: () => utils.events.list.invalidate(),
  })

  const groupedEvents = useMemo(() => {
    const groups = new Map<string, NonNullable<typeof events.data>>()

    for (const event of events.data ?? []) {
      const dayEvents = groups.get(event.festivalDay) ?? []
      dayEvents.push(event)
      groups.set(event.festivalDay, dayEvents)
    }

    return [...groups.entries()]
  }, [events.data])

  return (
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col gap-8 p-6 md:p-8">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-violet-600">
          DAAD 2026
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          Timetable
        </h1>
        <p className="text-zinc-600">
          Browse sets by day and stage, then favourite the ones you want to
          catch.
        </p>
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
          value={stage ?? ''}
          onChange={(event) => setStage(event.target.value || undefined)}
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

      <div className="space-y-8">
        {groupedEvents.map(([day, dayEvents]) => (
          <section key={day} className="space-y-4">
            <h2 className="text-xl font-semibold text-zinc-900">{day}</h2>
            <ul className="space-y-3">
              {dayEvents.map((event) => {
                const favourited =
                  Array.isArray(event.favourites) && event.favourites.length > 0

                return (
                  <li
                    key={event.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-zinc-900">
                          {event.artist}
                        </p>
                        {event.notes && (
                          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                            {event.notes}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500">{event.stage}</p>
                      <p className="text-sm text-zinc-600">
                        {formatTimeRange(event.startTime, event.endTime)}
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-label={
                        favourited ? 'Remove favourite' : 'Add favourite'
                      }
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                        favourited
                          ? 'bg-violet-600 text-white'
                          : 'border border-zinc-200 text-zinc-700 hover:border-violet-300 hover:text-violet-700'
                      }`}
                      onClick={() =>
                        toggleFavourite.mutate({ eventId: event.id })
                      }
                    >
                      {favourited ? 'Favourited' : 'Favourite'}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

export default App
