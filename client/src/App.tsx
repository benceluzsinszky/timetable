import { trpc } from './lib/trpc'

function App() {
  const health = trpc.health.useQuery()
  const events = trpc.events.list.useQuery()

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          Timetable
        </h1>
        <p className="text-zinc-600">
          View events and favourite the ones you care about.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-zinc-500">
          API status
        </h2>
        {health.isLoading && <p className="text-zinc-600">Connecting…</p>}
        {health.error && (
          <p className="text-red-600">
            Server unreachable — start the backend with{' '}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm">
              npm run dev
            </code>{' '}
            from the repo root.
          </p>
        )}
        {health.data && (
          <p className="text-emerald-700">
            Connected — last check{' '}
            {new Date(health.data.timestamp).toLocaleTimeString()}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-zinc-900">Events</h2>
        {events.isLoading && <p className="text-zinc-600">Loading events…</p>}
        {events.error && <p className="text-red-600">Failed to load events.</p>}
        {events.data?.length === 0 && (
          <p className="text-zinc-600">
            No events yet. Add some via Prisma Studio or a seed script.
          </p>
        )}
        <ul className="space-y-3">
          {events.data?.map((event) => (
            <li
              key={event.id}
              className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3"
            >
              <p className="font-medium text-zinc-900">{event.title}</p>
              <p className="text-sm text-zinc-600">
                {new Date(event.startTime).toLocaleString()} —{' '}
                {new Date(event.endTime).toLocaleTimeString()}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default App
