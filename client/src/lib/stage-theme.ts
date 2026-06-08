export type StageTheme = {
  accent: string
  column: string
  favourited: string
  favouritedBorder: string
}

const STAGE_THEMES: Record<string, StageTheme> = {
  'DAAD Stage': {
    accent: 'var(--stage-daad)',
    column: 'var(--stage-daad-column)',
    favourited: 'var(--stage-daad-favourite)',
    favouritedBorder: 'var(--stage-daad-favourite-border)',
  },
  'The Dome': {
    accent: 'var(--stage-dome)',
    column: 'var(--stage-dome-column)',
    favourited: 'var(--stage-dome-favourite)',
    favouritedBorder: 'var(--stage-dome-favourite-border)',
  },
  'Dragon Nest': {
    accent: 'var(--stage-dragon)',
    column: 'var(--stage-dragon-column)',
    favourited: 'var(--stage-dragon-favourite)',
    favouritedBorder: 'var(--stage-dragon-favourite-border)',
  },
  'Cooking Groove': {
    accent: 'var(--stage-cooking)',
    column: 'var(--stage-cooking-column)',
    favourited: 'var(--stage-cooking-favourite)',
    favouritedBorder: 'var(--stage-cooking-favourite-border)',
  },
  'AM/Beach': {
    accent: 'var(--stage-beach)',
    column: 'var(--stage-beach-column)',
    favourited: 'var(--stage-beach-favourite)',
    favouritedBorder: 'var(--stage-beach-favourite-border)',
  },
}

const FALLBACK_THEME: StageTheme = {
  accent: 'var(--primary)',
  column: 'var(--muted)',
  favourited: 'var(--primary)',
  favouritedBorder: 'var(--primary)',
}

export function getStageTheme(stage: string): StageTheme {
  return STAGE_THEMES[stage] ?? FALLBACK_THEME
}
