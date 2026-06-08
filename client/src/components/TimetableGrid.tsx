import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { TimeMarker, TimetableEvent } from '../lib/timetable-grid'
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
  className?: string
}

const TIME_COLUMN_WIDTH = '4.5rem'

function gridTemplateColumns(
  showDayColumn: boolean,
  stageCount: number,
): string {
  const stageColumns = `repeat(${stageCount}, minmax(0, 1fr))`

  return showDayColumn
    ? `5rem ${TIME_COLUMN_WIDTH} ${stageColumns}`
    : `${TIME_COLUMN_WIDTH} ${stageColumns}`
}

const GRID_LINE_CLASS = 'border-t border-border'

function TimeMarkersColumn({
  markers,
  rangeEnd,
  height,
}: {
  markers: TimeMarker[]
  rangeEnd: number
  height: number
}) {
  return (
    <div
      className="relative border-r border-border bg-muted/30"
      style={{ height }}
    >
      {markers.map((marker) => {
        const isRangeEnd = marker.time === rangeEnd

        return (
          <div
            key={marker.time}
            className={cn(
              'absolute right-0 left-0 flex items-center justify-end pr-1.5',
              isRangeEnd ? '-translate-y-full' : '-translate-y-1/2',
            )}
            style={{ top: isRangeEnd ? height : marker.topPx }}
          >
            <span className="text-[10px] font-medium text-foreground/70 tabular-nums">
              {formatSlotTime(marker.time)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function HourGridLines({
  markers,
  rangeEnd,
  height,
}: {
  markers: TimeMarker[]
  rangeEnd: number
  height: number
}) {
  return (
    <>
      {markers.map((marker) => {
        const isRangeEnd = marker.time === rangeEnd

        return (
          <div
            key={marker.time}
            className={cn(
              'pointer-events-none absolute right-0 left-0',
              GRID_LINE_CLASS,
            )}
            style={{ top: isRangeEnd ? height : marker.topPx }}
          />
        )
      })}
    </>
  )
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
  const startMs = new Date(event.startTime).getTime()
  const endMs = new Date(event.endTime).getTime()
  const timeLabel = `${formatSlotTime(startMs)} – ${formatSlotTime(endMs)}`

  return (
    <Card
      size="sm"
      role="button"
      tabIndex={0}
      aria-label={
        favourited
          ? `Remove ${event.artist} from favourites`
          : `Add ${event.artist} to favourites`
      }
      className={cn(
        'h-full cursor-pointer gap-1 rounded-sm border py-2 ring-0 shadow-none transition-[background-color,filter,box-shadow,border-color] [--card-spacing:--spacing(2)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        favourited
          ? 'border-primary bg-primary text-primary-foreground shadow-md hover:brightness-95 hover:shadow-lg active:brightness-90 active:shadow-md'
          : 'border-violet-300/50 bg-card hover:bg-secondary active:bg-muted',
      )}
      onClick={() => onToggleFavourite(event.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggleFavourite(event.id)
        }
      }}
    >
      <div className="min-h-0 flex-1 space-y-1 overflow-hidden px-2">
        <p
          className={cn(
            'font-medium leading-tight',
            compact ? 'text-xs' : 'text-sm',
            favourited && 'font-semibold',
          )}
        >
          {event.artist}
        </p>
        <p
          className={cn(
            'tabular-nums leading-tight',
            compact ? 'text-[10px]' : 'text-xs',
            favourited ? 'text-primary-foreground/85' : 'text-muted-foreground',
          )}
        >
          {timeLabel}
        </p>
        {event.notes && !compact && (
          <Badge
            variant="secondary"
            className={cn(
              'h-4 px-1.5 text-[10px]',
              favourited &&
                'border-primary-foreground/25 bg-primary-foreground/15 text-primary-foreground',
            )}
          >
            {event.notes}
          </Badge>
        )}
      </div>
    </Card>
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
  const markers = buildTimeMarkers(rangeStart, rangeEnd, durationMs, height, {
    hideStart: !isFirst,
  })

  return (
    <div
      className={cn('grid w-full', !isFirst && 'border-t border-border')}
      style={{
        gridTemplateColumns: gridTemplateColumns(showDayColumn, stages.length),
      }}
    >
      {showDayColumn && (
        <div
          className="relative border-r border-border bg-primary/5"
          style={{ height }}
        >
          <div className="sticky top-0 z-10 bg-primary/10 px-2 py-2 shadow-[0_1px_0_0_var(--border)]">
            <span className="text-xs font-semibold text-primary">
              {dayLabel}
            </span>
          </div>
        </div>
      )}

      <TimeMarkersColumn
        markers={markers}
        rangeEnd={rangeEnd}
        height={height}
      />

      {stages.map((stage) => {
        const stageEvents = eventsForStage(events, stage)

        return (
          <div
            key={stage}
            className="relative border-l border-border bg-muted/15"
            style={{ height }}
          >
            <HourGridLines
              markers={markers}
              rangeEnd={rangeEnd}
              height={height}
            />

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
                  className="absolute inset-x-0.5 z-10 py-0.5"
                  style={{ top: topPx, height: heightPx }}
                >
                  <EventCard
                    event={event}
                    onToggleFavourite={onToggleFavourite}
                    compact={heightPx < 40}
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
  className,
}: TimetableGridProps) {
  const nonEmptyBlocks = dayBlocks.filter((block) => block.events.length > 0)

  if (nonEmptyBlocks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No events for this selection.
      </p>
    )
  }

  return (
    <div
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-xl bg-card ring-1 ring-border',
        className,
      )}
    >
      <div
        className="grid w-full shrink-0 border-b border-border bg-muted/95"
        style={{
          gridTemplateColumns: gridTemplateColumns(
            showDayColumn,
            stages.length,
          ),
        }}
      >
        {showDayColumn && (
          <div className="border-r px-2 py-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            Day
          </div>
        )}
        <div className="border-r px-2 py-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          Time
        </div>
        {stages.map((stage) => (
          <div
            key={stage}
            className="truncate border-l px-2 py-2 text-center text-[11px] font-semibold tracking-wide uppercase"
            title={stage}
          >
            {stage}
          </div>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
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
    </div>
  )
}
