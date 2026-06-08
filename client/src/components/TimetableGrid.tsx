import type { TimetableEvent } from '../lib/timetable-grid'
import {
  buildTimeMarkers,
  eventPlacement,
  eventsForStage,
  formatSlotTime,
  getFestivalDayTimelineRange,
  timelineHeightPx,
} from '../lib/timetable-grid'

export type DayBlock = {
  label: string
  events: TimetableEvent[]
}

type TimetableGridProps = {
  stages: string[]
  dayBlocks: DayBlock[]
  showDayColumn: boolean
  onToggleFavourite: (eventId: string) => void
}

function EventCard({
  event,
  onToggleFavourite,
  compact,
}: {
  event: TimetableEvent
  onToggleFavourite: (eventId: string) => void
  compact: boolean
}) {
  const favourited =
    Array.isArray(event.favourites) && event.favourites.length > 0

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-violet-200 bg-white/95 p-2 shadow-sm backdrop-blur-sm">
      <div className="min-h-0 flex-1 space-y-0.5 overflow-hidden">
        <p
          className={`font-medium leading-tight text-zinc-900 ${compact ? 'text-xs' : 'text-sm'}`}
        >
          {event.artist}
        </p>
        {event.notes && !compact && (
          <span className="inline-block rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
            {event.notes}
          </span>
        )}
      </div>
      <button
        type="button"
        aria-label={favourited ? 'Remove favourite' : 'Add favourite'}
        className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium transition ${
          favourited
            ? 'bg-violet-600 text-white'
            : 'text-zinc-500 hover:bg-violet-50 hover:text-violet-700'
        }`}
        onClick={() => onToggleFavourite(event.id)}
      >
        {favourited ? '★' : '☆'}
      </button>
    </div>
  )
}

function DayTimeline({
  stages,
  events,
  showDayColumn,
  dayLabel,
  onToggleFavourite,
  isFirst,
  isLast,
}: {
  stages: string[]
  events: TimetableEvent[]
  showDayColumn: boolean
  dayLabel: string
  onToggleFavourite: (eventId: string) => void
  isFirst: boolean
  isLast: boolean
}) {
  const { rangeStart, rangeEnd, durationMs } = getFestivalDayTimelineRange(
    dayLabel,
    events,
    { trimStart: isFirst, trimEnd: isLast },
  )
  const height = timelineHeightPx(durationMs)
  const markers = buildTimeMarkers(rangeStart, rangeEnd, durationMs, height)

  return (
    <div
      className={`grid min-w-max ${isFirst ? '' : 'border-t border-zinc-200'}`}
      style={{
        gridTemplateColumns: showDayColumn
          ? `5rem 4.5rem repeat(${stages.length}, minmax(9rem, 1fr))`
          : `4.5rem repeat(${stages.length}, minmax(9rem, 1fr))`,
      }}
    >
      {showDayColumn && (
        <div
          className="sticky left-0 z-20 flex items-start border-r border-zinc-200 bg-violet-50 px-2 pt-3"
          style={{ height }}
        >
          <span className="text-xs font-semibold text-violet-800">
            {dayLabel}
          </span>
        </div>
      )}

      <div
        className={`relative border-r border-zinc-200 bg-zinc-50 ${showDayColumn ? '' : 'sticky left-0 z-10'}`}
        style={{ height }}
      >
        {markers.map((marker) => (
          <div
            key={marker.time}
            className="absolute right-0 left-0 flex -translate-y-1/2 items-center justify-end pr-1.5"
            style={{ top: marker.topPx }}
          >
            <span className="text-[10px] font-medium tabular-nums text-zinc-400">
              {formatSlotTime(marker.time)}
            </span>
          </div>
        ))}
      </div>

      {stages.map((stage) => {
        const stageEvents = eventsForStage(events, stage)

        return (
          <div
            key={stage}
            className="relative border-l border-zinc-200 bg-zinc-50/50"
            style={{ height }}
          >
            {markers.map((marker) => (
              <div
                key={marker.time}
                className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-zinc-200/80"
                style={{ top: marker.topPx }}
              />
            ))}

            {stageEvents.map((event) => {
              const { topPx, heightPx } = eventPlacement(
                event,
                rangeStart,
                durationMs,
                height,
              )

              return (
                <div
                  key={event.id}
                  className="absolute right-1 left-1 z-10"
                  style={{ top: topPx, height: heightPx }}
                >
                  <EventCard
                    event={event}
                    onToggleFavourite={onToggleFavourite}
                    compact={heightPx < 64}
                  />
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export function TimetableGrid({
  stages,
  dayBlocks,
  showDayColumn,
  onToggleFavourite,
}: TimetableGridProps) {
  const nonEmptyBlocks = dayBlocks.filter((block) => block.events.length > 0)

  if (nonEmptyBlocks.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No events for this selection.</p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50">
      <div
        className="sticky top-0 z-30 grid min-w-max border-b border-zinc-200 bg-zinc-100"
        style={{
          gridTemplateColumns: showDayColumn
            ? `5rem 4.5rem repeat(${stages.length}, minmax(9rem, 1fr))`
            : `4.5rem repeat(${stages.length}, minmax(9rem, 1fr))`,
        }}
      >
        {showDayColumn && (
          <div className="sticky left-0 z-40 border-r border-zinc-200 bg-zinc-100 px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Day
          </div>
        )}
        <div
          className={`border-r border-zinc-200 bg-zinc-100 px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 ${showDayColumn ? '' : 'sticky left-0 z-40'}`}
        >
          Time
        </div>
        {stages.map((stage) => (
          <div
            key={stage}
            className="border-l border-zinc-200 px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-700"
          >
            {stage}
          </div>
        ))}
      </div>

      {nonEmptyBlocks.map((block, index) => (
        <DayTimeline
          key={block.label}
          stages={stages}
          events={block.events}
          showDayColumn={showDayColumn}
          dayLabel={block.label}
          onToggleFavourite={onToggleFavourite}
          isFirst={index === 0}
          isLast={index === nonEmptyBlocks.length - 1}
        />
      ))}
    </div>
  )
}
