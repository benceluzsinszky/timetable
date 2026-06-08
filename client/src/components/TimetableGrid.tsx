import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getStageTheme, type StageTheme } from '../lib/stage-theme'
import type { TimeMarker, TimetableEvent } from '../lib/timetable-grid'
import {
  buildTimeMarkers,
  eventPlacement,
  eventsForStage,
  formatSlotTime,
  getFestivalDayTimelineRange,
  MIN_TWO_LINE_EVENT_HEIGHT_PX,
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

const GRID_LINE_CLASS = 'border-t border-foreground/15'

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
      className="relative border-r border-foreground/15 bg-black/20"
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
            <span className="text-[10px] font-medium tracking-wide text-foreground/60 uppercase tabular-nums">
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
  stageTheme,
  onToggleFavourite,
  compact,
}: {
  event: TimetableEvent
  stageTheme: StageTheme
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
        'h-full cursor-pointer gap-0.5 rounded-none border py-1 ring-0 transition-[background-color,filter,box-shadow,border-color] [--card-spacing:--spacing(2)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        !favourited &&
          'border-foreground/15 bg-black/40 shadow-none hover:bg-black/55 active:bg-black/65',
        favourited && 'hover:brightness-105 active:brightness-95',
      )}
      style={
        favourited
          ? {
              backgroundColor: stageTheme.favourited,
              borderColor: stageTheme.favouritedBorder,
              boxShadow:
                'inset 0 0 0 1px color-mix(in oklch, var(--foreground) 14%, transparent)',
            }
          : undefined
      }
      onClick={() => onToggleFavourite(event.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggleFavourite(event.id)
        }
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col justify-start gap-0.5 overflow-hidden px-2">
        <p
          className={cn(
            'leading-tight tracking-wide uppercase',
            compact ? 'text-[11px]' : 'text-xs',
            favourited ? 'font-semibold' : 'font-medium',
          )}
        >
          {event.artist}
        </p>
        <p
          className={cn(
            'font-medium tracking-wide uppercase tabular-nums leading-tight',
            compact ? 'text-[9px]' : 'text-[10px]',
            favourited ? 'text-foreground/75' : 'text-foreground/50',
          )}
        >
          {timeLabel}
        </p>
        {event.notes && !compact && (
          <Badge
            variant="secondary"
            className={cn(
              'h-4 rounded-none border px-1.5 text-[9px] tracking-wide uppercase',
              favourited
                ? 'border-foreground/20 bg-black/20 text-foreground/80'
                : 'border-foreground/15 bg-foreground/8 text-foreground/70',
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
      className={cn('grid w-full', !isFirst && 'border-t border-foreground/20')}
      style={{
        gridTemplateColumns: gridTemplateColumns(showDayColumn, stages.length),
      }}
    >
      {showDayColumn && (
        <div
          className="relative border-r border-foreground/15 bg-black/25"
          style={{ height }}
        >
          <div className="sticky top-0 z-10 bg-black/50 px-2 py-2 shadow-[0_1px_0_0_oklch(0.97_0.01_95/18%)]">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-foreground uppercase">
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
        const stageTheme = getStageTheme(stage)

        return (
          <div
            key={stage}
            className="relative border-l border-foreground/15"
            style={{ height, backgroundColor: stageTheme.column }}
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
                    stageTheme={stageTheme}
                    onToggleFavourite={onToggleFavourite}
                    compact={heightPx < MIN_TWO_LINE_EVENT_HEIGHT_PX}
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
        'flex min-h-0 flex-col overflow-hidden rounded-none border border-foreground/20 bg-black/35',
        className,
      )}
    >
      <div
        className="grid w-full shrink-0 border-b border-foreground/20 bg-black/55"
        style={{
          gridTemplateColumns: gridTemplateColumns(
            showDayColumn,
            stages.length,
          ),
        }}
      >
        {showDayColumn && (
          <div className="border-r border-foreground/15 px-2 py-2.5 text-[10px] font-semibold tracking-[0.14em] text-foreground/50 uppercase">
            Day
          </div>
        )}
        <div className="border-r border-foreground/15 px-2 py-2.5 text-[10px] font-semibold tracking-[0.14em] text-foreground/50 uppercase">
          Time
        </div>
        {stages.map((stage) => {
          const stageTheme = getStageTheme(stage)

          return (
            <div
              key={stage}
              className="truncate border-l border-foreground/15 px-2 py-2.5 text-center text-xs font-bold tracking-widest text-foreground uppercase"
              style={{ backgroundColor: stageTheme.column }}
              title={stage}
            >
              {stage}
            </div>
          )
        })}
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
