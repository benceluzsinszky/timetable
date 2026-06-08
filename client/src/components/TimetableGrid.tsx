import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  getStageShortName,
  getStageTheme,
  type StageTheme,
} from '../lib/stage-theme'
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
import { useEffect, useRef, useState } from 'react'
import { useFavourites } from '../lib/use-favourites'
import { useMediaQuery } from '../lib/use-media-query'

export type DayBlock = {
  label: string
  events: TimetableEvent[]
}

type TimetableGridProps = {
  stages: string[]
  dayBlocks: DayBlock[]
  showDayColumn: boolean
  onToggleFavourite: (eventId: string) => void
  scrollToEventId?: string | null
  onScrolledToEvent?: () => void
  className?: string
}

const DESKTOP_TIME_COLUMN_WIDTH = '4.5rem'
const MOBILE_TIME_COLUMN_WIDTH = '2.35rem'
const MOBILE_STAGE_COLUMN_WIDTH = '6.25rem'

function gridTemplateColumns(stageCount: number, isMobile: boolean): string {
  if (isMobile) {
    return `${MOBILE_TIME_COLUMN_WIDTH} repeat(${stageCount}, minmax(${MOBILE_STAGE_COLUMN_WIDTH}, 1fr))`
  }

  return `${DESKTOP_TIME_COLUMN_WIDTH} repeat(${stageCount}, minmax(0, 1fr))`
}

function DayLabelBar({
  label,
  showTopBorder,
}: {
  label: string
  showTopBorder: boolean
}) {
  return (
    <div
      className={cn(
        'sticky top-0 z-30 flex items-center justify-start border-b border-foreground/15 px-2 py-1 backdrop-blur-sm md:justify-center md:px-3 md:py-1.5',
        SOFT_SURFACE_CLASS,
        showTopBorder && 'border-t border-foreground/15',
      )}
    >
      <span
        className={cn(
          'text-left text-[10px] md:text-center md:text-[11px]',
          SOFT_LABEL_CLASS,
        )}
      >
        {label}
      </span>
    </div>
  )
}

function gridMinWidth(
  stageCount: number,
  isMobile: boolean,
): string | undefined {
  if (!isMobile) return undefined

  return `calc(${MOBILE_TIME_COLUMN_WIDTH} + ${stageCount} * ${MOBILE_STAGE_COLUMN_WIDTH})`
}

const GRID_LINE_CLASS = 'border-t border-foreground/15'
const SOFT_SURFACE_CLASS = 'bg-black/20'
const HEADER_SURFACE_CLASS = 'bg-black/[0.01]'
const SOFT_LABEL_CLASS =
  'font-medium text-foreground/60 uppercase tracking-wide'
const STICKY_HEADER_HEIGHT_CLASS = 'h-8 md:h-9'

function TimeMarkersColumn({
  markers,
  rangeEnd,
  height,
  compact,
}: {
  markers: TimeMarker[]
  rangeEnd: number
  height: number
  compact: boolean
}) {
  return (
    <div
      className={cn(
        'relative border-r border-foreground/15',
        SOFT_SURFACE_CLASS,
      )}
      style={{ height }}
    >
      {markers.map((marker) => {
        const isRangeEnd = marker.time === rangeEnd

        return (
          <div
            key={marker.time}
            className={cn(
              'absolute right-0 left-0 flex items-center justify-end',
              compact ? 'pr-0.5' : 'pr-1.5',
              isRangeEnd ? '-translate-y-full' : '-translate-y-1/2',
            )}
            style={{ top: isRangeEnd ? height : marker.topPx }}
          >
            <span
              className={cn(
                'tabular-nums leading-none',
                SOFT_LABEL_CLASS,
                compact
                  ? 'text-[8px] tracking-tight'
                  : 'text-[10px] tracking-wide',
              )}
            >
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
  isMobile,
  highlighted,
}: {
  event: TimetableEvent
  stageTheme: StageTheme
  onToggleFavourite: (eventId: string) => void
  compact: boolean
  isMobile: boolean
  highlighted: boolean
}) {
  const { isFavourited } = useFavourites()
  const favourited = isFavourited(event.id)
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
        'h-full cursor-pointer gap-0.5 rounded-none border ring-0 transition-[background-color,filter,box-shadow,border-color] [--card-spacing:--spacing(2)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        isMobile ? 'py-0.5' : 'py-1',
        !favourited &&
          'border-foreground/15 bg-black/20 shadow-none hover:bg-black/30 active:bg-black/40',
        favourited && 'hover:brightness-105 active:brightness-95',
        highlighted && 'ring-2 ring-primary shadow-[0_0_0_1px_var(--primary)]',
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
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col justify-start overflow-hidden',
          isMobile ? 'gap-0 px-1' : 'gap-0.5 px-1.5 md:px-2',
        )}
      >
        <p
          className={cn(
            'leading-tight uppercase break-words',
            isMobile
              ? 'text-[10px] tracking-tight'
              : compact
                ? 'text-[11px] tracking-wide'
                : 'text-xs tracking-wide',
            favourited
              ? 'font-semibold text-foreground/85'
              : 'font-medium text-foreground/75',
          )}
        >
          {event.artist}
        </p>
        <p
          className={cn(
            'font-medium uppercase tabular-nums leading-tight',
            isMobile
              ? 'text-[8px] tracking-tight'
              : compact
                ? 'text-[9px] tracking-wide'
                : 'text-[10px] tracking-wide',
            favourited ? 'text-foreground/65' : 'text-foreground/50',
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
  highlightedEventId,
  isFirst,
  isLast,
  isMobile,
}: {
  stages: string[]
  events: TimetableEvent[]
  showDayColumn: boolean
  dayLabel: string
  onToggleFavourite: (eventId: string) => void
  highlightedEventId: string | null
  isFirst: boolean
  isLast: boolean
  isMobile: boolean
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
    <div>
      {showDayColumn && (
        <DayLabelBar label={dayLabel} showTopBorder={!isFirst} />
      )}

      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: gridTemplateColumns(stages.length, isMobile),
        }}
      >
        <TimeMarkersColumn
          markers={markers}
          rangeEnd={rangeEnd}
          height={height}
          compact={isMobile}
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
                    data-event-id={event.id}
                    className={cn('absolute z-10', 'inset-x-0.5 py-0.5')}
                    style={{ top: topPx, height: heightPx }}
                  >
                    <EventCard
                      event={event}
                      stageTheme={stageTheme}
                      onToggleFavourite={onToggleFavourite}
                      compact={heightPx < MIN_TWO_LINE_EVENT_HEIGHT_PX}
                      isMobile={isMobile}
                      highlighted={highlightedEventId === event.id}
                    />
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function TimetableGrid({
  stages,
  dayBlocks,
  showDayColumn,
  onToggleFavourite,
  scrollToEventId,
  onScrolledToEvent,
  className,
}: TimetableGridProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(
    null,
  )
  const nonEmptyBlocks = dayBlocks.filter((block) => block.events.length > 0)
  const minWidth = gridMinWidth(stages.length, isMobile)
  const columns = gridTemplateColumns(stages.length, isMobile)

  useEffect(() => {
    if (!scrollToEventId) return

    let cancelled = false
    let attempts = 0

    const tryScroll = () => {
      if (cancelled) return

      const element = scrollContainerRef.current?.querySelector(
        `[data-event-id="${scrollToEventId}"]`,
      )

      if (element) {
        element.scrollIntoView({ block: 'center', behavior: 'smooth' })
        setHighlightedEventId(scrollToEventId)
        onScrolledToEvent?.()
        return
      }

      if (attempts < 12) {
        attempts += 1
        requestAnimationFrame(tryScroll)
      }
    }

    tryScroll()

    return () => {
      cancelled = true
    }
  }, [scrollToEventId, nonEmptyBlocks, stages, onScrolledToEvent])

  useEffect(() => {
    if (!highlightedEventId) return

    const timeout = window.setTimeout(() => {
      setHighlightedEventId(null)
    }, 2000)

    return () => window.clearTimeout(timeout)
  }, [highlightedEventId])

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
        'flex min-h-0 flex-col overflow-hidden rounded-none border border-foreground/15',
        SOFT_SURFACE_CLASS,
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-x-auto overflow-y-hidden">
        <div
          className="flex min-h-0 w-full flex-1 flex-col"
          style={{ minWidth }}
        >
          <div
            className={cn(
              'z-40 grid w-full shrink-0 border-b border-foreground/5 backdrop-blur-sm',
              STICKY_HEADER_HEIGHT_CLASS,
            )}
            style={{ gridTemplateColumns: columns }}
          >
            <div
              className={cn(
                'flex items-center justify-center border-r border-foreground/5 text-center',
                HEADER_SURFACE_CLASS,
                SOFT_LABEL_CLASS,
                isMobile
                  ? 'px-1 py-1.5 text-[8px] tracking-tight'
                  : 'px-2 py-2.5 text-[10px]',
              )}
            >
              Time
            </div>
            {stages.map((stage) => {
              const stageTheme = getStageTheme(stage)

              return (
                <div
                  key={stage}
                  className={cn(
                    'flex items-center justify-center border-l border-foreground/5 text-center px-1 py-1.5 text-[9px] tracking-tight md:px-2 md:py-2.5 md:text-xs md:tracking-wide',
                    SOFT_LABEL_CLASS,
                  )}
                  style={{ backgroundColor: stageTheme.column }}
                  title={stage}
                >
                  <span className="md:hidden">{getStageShortName(stage)}</span>
                  <span className="hidden md:inline">{stage}</span>
                </div>
              )
            })}
          </div>

          <div
            ref={scrollContainerRef}
            className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
          >
            {nonEmptyBlocks.map((block, index) => (
              <DayTimeline
                key={block.label}
                stages={stages}
                events={block.events}
                showDayColumn={showDayColumn}
                dayLabel={block.label}
                onToggleFavourite={onToggleFavourite}
                highlightedEventId={highlightedEventId}
                isFirst={index === 0}
                isLast={index === nonEmptyBlocks.length - 1}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
