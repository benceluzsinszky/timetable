import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check, ChevronDown } from 'lucide-react'

export type FilterPreset = {
  label: string
  values: string[]
}

type FilterMultiSelectProps = {
  emptyLabel: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  getOptionLabel?: (option: string) => string
  presets?: FilterPreset[]
  className?: string
}

function toggleSelected(selected: string[], option: string): string[] {
  return selected.includes(option)
    ? selected.filter((value) => value !== option)
    : [...selected, option]
}

function isPresetSelected(selected: string[], values: string[]): boolean {
  return values.length > 0 && values.every((value) => selected.includes(value))
}

function togglePreset(selected: string[], values: string[]): string[] {
  if (isPresetSelected(selected, values)) {
    const excluded = new Set(values)
    return selected.filter((value) => !excluded.has(value))
  }

  return [...new Set([...selected, ...values])]
}

function formatSummary(
  emptyLabel: string,
  selected: string[],
  options: string[],
  getOptionLabel?: (option: string) => string,
): string {
  if (selected.length === 0 || selected.length === options.length) {
    return emptyLabel
  }

  if (selected.length === 1) {
    const option = selected[0]!
    return getOptionLabel?.(option) ?? option
  }

  return `${selected.length} selected`
}

export function FilterMultiSelect({
  emptyLabel,
  options,
  selected,
  onChange,
  getOptionLabel,
  presets,
  className,
}: FilterMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const summary = formatSummary(emptyLabel, selected, options, getOptionLabel)

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        className="h-7 w-full justify-between rounded-none border-foreground/20 bg-black/35 px-2.5 text-xs font-normal uppercase tracking-wide text-foreground hover:bg-black/50 sm:text-sm"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </Button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-multiselectable
          className="absolute top-full right-0 z-50 mt-1 max-h-60 min-w-full overflow-y-auto rounded-none border border-foreground/20 bg-card py-1 shadow-md"
        >
          {presets?.map((preset) => {
            const isSelected = isPresetSelected(selected, preset.values)

            return (
              <button
                key={preset.label}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={cn(
                  'flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium uppercase tracking-wide transition-colors hover:bg-muted sm:text-sm',
                  isSelected && 'bg-muted/60 text-foreground',
                )}
                onClick={() => onChange(togglePreset(selected, preset.values))}
              >
                <span className="flex size-3.5 shrink-0 items-center justify-center">
                  {isSelected && <Check className="size-3" />}
                </span>
                <span className="truncate">{preset.label}</span>
              </button>
            )
          })}
          {presets && presets.length > 0 && options.length > 0 && (
            <div
              role="separator"
              className="my-1 border-t border-foreground/15"
            />
          )}
          {options.map((option) => {
            const isSelected = selected.includes(option)
            const label = getOptionLabel?.(option) ?? option

            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={cn(
                  'flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs uppercase tracking-wide transition-colors hover:bg-muted sm:text-sm',
                  isSelected && 'bg-muted/60 text-foreground',
                )}
                onClick={() => onChange(toggleSelected(selected, option))}
              >
                <span className="flex size-3.5 shrink-0 items-center justify-center">
                  {isSelected && <Check className="size-3" />}
                </span>
                <span className="truncate">{label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
