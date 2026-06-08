import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '../lib/use-media-query'
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

const DESKTOP_TIME_COLUMN_WIDTH = '4.5rem'
const MOBILE_TIME_COLUMN_WIDTH = '2.35rem'
const MOBILE_STAGE_COLUMN_WIDTH = '6.25rem'

function gridTemplateColumns(
  showDayColumn: boolean,
  stageCount: number,
  isMobile: boolean,
): string {
  if (isMobile) {
    return `${MOBILE_TIME_COLUMN_WIDTH} repeat(${stageCount}, minmax(${MOBILE_STAGE_COLUMN_WIDTH}, 1fr))`
  }

  const stageColumns = `repeat(${stageCount}, minmax(0, 1fr))`

  return showDayColumn
    ? `5rem ${DESKTOP_TIME_COLUMN_WIDTH} ${stageColumns}`
    : `${DESKTOP_TIME_COLUMN_WIDTH} ${stageColumns}`
}

function gridMinWidth(
  stageCount: number,
  isMobile: boolean,
): string | undefined {
  if (!isMobile) return undefined

  return `calc(${MOBILE_TIME_COLUMN_WIDTH} + ${stageCount} * ${MOBILE_STAGE_COLUMN_WIDTH})`
}

const GRID_LINE_CLASS = 'border-t border-foreground/15'
const STICKY_TIME_CLASS =
  'sticky left-0 z-20 border-r border-foreground/15 bg-black/55 backdrop-blur-sm'

function TimeMarkersColumn({
  markers,
  rangeEnd,
  height,
  sticky,
  compact,
}: {
  markers: TimeMarker[]
  rangeEnd: number
  height: number
  sticky: boolean
  compact: boolean
}) {
  return (
    <div
      className={cn(
        'relative border-r border-foreground/15 bg-black/20',
        sticky && STICKY_TIME_CLASS,
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
                'font-medium text-foreground/60 uppercase tabular-nums leading-none',
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
}: {
  event: TimetableEvent
  stageTheme: StageTheme
  onToggleFavourite: (eventId: string) => void
  compact: boolean
  isMobile: boolean
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
        'h-full cursor-pointer gap-0.5 rounded-none border ring-0 transition-[background-color,filter,box-shadow,border-color] [--card-spacing:--spacing(2)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        isMobile ? 'py-0.5' : 'py-1',
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
            favourited ? 'font-semibold' : 'font-medium',
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
  isMobile,
}: {
  stages: string[]
  events: TimetableEvent[]
  showDayColumn: boolean
  dayLabel: string
  onToggleFavourite: (eventId: string) => void
  isFirst: boolean
  isLast: boolean
  isMobile: boolean
}) {
  const showDayInGrid = showDayColumn && !isMobile
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
    <div className={cn(!isFirst && 'border-t border-foreground/20')}>
      {isMobile && (
        <div className="border-b border-foreground/15 bg-black/55 px-2 py-1">
          <span className="text-[10px] font-semibold tracking-[0.1em] text-foreground uppercase">
            {dayLabel}
          </span>
        </div>
      )}

      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: gridTemplateColumns(
            showDayInGrid,
            stages.length,
            isMobile,
          ),
        }}
      >
        {showDayInGrid && (
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
          sticky={isMobile}
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
                    className={cn(
                      'absolute z-10',
                      isMobile ? 'inset-x-0 py-0' : 'inset-x-0.5 py-0.5',
                    )}
                    style={{ top: topPx, height: heightPx }}
                  >
                    <EventCard
                      event={event}
                      stageTheme={stageTheme}
                      onToggleFavourite={onToggleFavourite}
                      compact={heightPx < MIN_TWO_LINE_EVENT_HEIGHT_PX}
                      isMobile={isMobile}
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
  className,
}: TimetableGridProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const showDayInGrid = showDayColumn && !isMobile
  const nonEmptyBlocks = dayBlocks.filter((block) => block.events.length > 0)
  const minWidth = gridMinWidth(stages.length, isMobile)
  const columns = gridTemplateColumns(showDayInGrid, stages.length, isMobile)

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
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="w-full" style={{ minWidth }}>
          <div
            className="sticky top-0 z-40 grid w-full shrink-0 border-b border-foreground/20 bg-black/70 backdrop-blur-sm"
            style={{ gridTemplateColumns: columns }}
          >
            {showDayInGrid && (
              <div className="border-r border-foreground/15 px-2 py-2.5 text-[10px] font-semibold tracking-[0.14em] text-foreground/50 uppercase">
                Day
              </div>
            )}
            <div
              className={cn(
                'font-semibold text-foreground/50 uppercase',
                isMobile
                  ? cn(
                      STICKY_TIME_CLASS,
                      'px-1 py-1.5 text-[8px] tracking-tight',
                    )
                  : 'border-r border-foreground/15 px-2 py-2.5 text-[10px] tracking-[0.14em]',
              )}
            >
              Time
            </div>
            {stages.map((stage) => {
              const stageTheme = getStageTheme(stage)

              return (
                <div
                  key={stage}
                  className="border-l border-foreground/15 text-center font-bold text-foreground uppercase md:px-2 md:py-2.5 md:text-xs md:tracking-widest px-1 py-1.5 text-[9px] tracking-tight"
                  style={{ backgroundColor: stageTheme.column }}
                  title={stage}
                >
                  <span className="md:hidden">{getStageShortName(stage)}</span>
                  <span className="hidden md:inline">{stage}</span>
                </div>
              )
            })}
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
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
