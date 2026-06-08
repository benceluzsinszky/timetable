import type { TimetableEvent } from '../lib/timetable-grid'
import {
  buildTimeMarkers,
  eventPlacement,
  eventsForStage,
  formatSlotTime,
  getFestivalDayTimelineRange,
  timelineHeightPx,
} from '../lib/timetable-grid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

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
    <Card
      size="sm"
      className="h-full gap-1 border-violet-200/70 bg-card/95 py-2 shadow-sm ring-violet-200/40 [--card-spacing:--spacing(2)]"
    >
      <div className="min-h-0 flex-1 space-y-1 overflow-hidden px-2">
        <p
          className={cn(
            'font-medium leading-tight',
            compact ? 'text-xs' : 'text-sm',
          )}
        >
          {event.artist}
        </p>
        {event.notes && !compact && (
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
            {event.notes}
          </Badge>
        )}
      </div>
      <div className="px-2">
        <Button
          type="button"
          variant={favourited ? 'default' : 'ghost'}
          size="icon-xs"
          aria-label={favourited ? 'Remove favourite' : 'Add favourite'}
          onClick={() => onToggleFavourite(event.id)}
        >
          <Star className={cn('size-3', favourited && 'fill-current')} />
        </Button>
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
    hideEnd: !isLast,
  })

  return (
    <div
      className={cn('grid min-w-max', !isFirst && 'border-t border-border')}
      style={{
        gridTemplateColumns: showDayColumn
          ? `5rem 4.5rem repeat(${stages.length}, minmax(9rem, 1fr))`
          : `4.5rem repeat(${stages.length}, minmax(9rem, 1fr))`,
      }}
    >
      {showDayColumn && (
        <div
          className="sticky left-0 z-20 flex items-start border-r border-border bg-primary/5 px-2 pt-3"
          style={{ height }}
        >
          <span className="text-xs font-semibold text-primary">{dayLabel}</span>
        </div>
      )}

      <div
        className={cn(
          'relative border-r border-border bg-muted/40',
          !showDayColumn && 'sticky left-0 z-10',
        )}
        style={{ height }}
      >
        {markers.map((marker) => (
          <div
            key={marker.time}
            className="absolute right-0 left-0 flex -translate-y-1/2 items-center justify-end pr-1.5"
            style={{ top: marker.topPx }}
          >
            <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
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
            className="relative border-l border-border bg-muted/20"
            style={{ height }}
          >
            {markers.map((marker) => (
              <div
                key={marker.time}
                className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-border/80"
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
      <p className="text-sm text-muted-foreground">
        No events for this selection.
      </p>
    )
  }

  return (
    <Card className="overflow-hidden p-0 ring-border">
      <div
        className="sticky top-0 z-30 grid min-w-max border-b border-border bg-muted/60"
        style={{
          gridTemplateColumns: showDayColumn
            ? `5rem 4.5rem repeat(${stages.length}, minmax(9rem, 1fr))`
            : `4.5rem repeat(${stages.length}, minmax(9rem, 1fr))`,
        }}
      >
        {showDayColumn && (
          <div className="sticky left-0 z-40 border-r border-border bg-muted/60 px-2 py-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            Day
          </div>
        )}
        <div
          className={cn(
            'border-r border-border bg-muted/60 px-2 py-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase',
            !showDayColumn && 'sticky left-0 z-40',
          )}
        >
          Time
        </div>
        {stages.map((stage) => (
          <div
            key={stage}
            className="border-l border-border px-2 py-2 text-center text-[11px] font-semibold tracking-wide uppercase"
          >
            {stage}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
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
    </Card>
  )
}
