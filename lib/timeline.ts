import type { Interval, MainSectionConfig, SectionConfig, SectionKey, WorkoutPlan } from '@/types'

export const DEFAULT_PLAN: WorkoutPlan = {
  prepSeconds: 5,
  warmup: { enabled: true, reps: 3, workSeconds: 30, restSeconds: 10, exercises: [] },
  main: {
    enabled: true,
    reps: 8,
    workSeconds: 40,
    restSeconds: 20,
    longBreakEvery: 4,
    longBreakSeconds: 60,
    exercises: [],
  },
  cooldown: { enabled: true, reps: 2, workSeconds: 45, restSeconds: 0, exercises: [] },
}

export const SECTION_LABELS: Record<SectionKey, string> = {
  warmup: 'Warm-up',
  main: 'Main workout',
  cooldown: 'Wind-down',
}

/** Intervals for a single section. Long-break fields are only read for the main section. */
export function sectionIntervals(section: SectionKey, cfg: SectionConfig | MainSectionConfig): Interval[] {
  const out: Interval[] = []
  if (!cfg.enabled || cfg.reps < 1 || cfg.workSeconds < 1) return out
  const { longBreakEvery = 0, longBreakSeconds = 0 } = section === 'main' ? (cfg as MainSectionConfig) : {}
  for (let rep = 1; rep <= cfg.reps; rep++) {
    const names = cfg.exercises ?? []
    const exercise = names.length ? names[(rep - 1) % names.length]?.trim() || undefined : undefined
    out.push({ kind: 'work', section, seconds: cfg.workSeconds, rep, totalReps: cfg.reps, exercise })
    if (rep === cfg.reps) break
    const isLongBreak = longBreakEvery > 0 && longBreakSeconds > 0 && rep % longBreakEvery === 0
    if (isLongBreak) {
      out.push({ kind: 'longBreak', section, seconds: longBreakSeconds, rep, totalReps: cfg.reps })
    } else if (cfg.restSeconds > 0) {
      out.push({ kind: 'rest', section, seconds: cfg.restSeconds, rep, totalReps: cfg.reps })
    }
  }
  return out
}

/** Flattens a plan into the ordered list of intervals the player runs. */
export function buildTimeline(plan: WorkoutPlan): Interval[] {
  const out: Interval[] = []
  if (plan.prepSeconds > 0) {
    out.push({ kind: 'prep', section: null, seconds: plan.prepSeconds, rep: 0, totalReps: 0 })
  }
  out.push(
    ...sectionIntervals('warmup', plan.warmup),
    ...sectionIntervals('main', plan.main),
    ...sectionIntervals('cooldown', plan.cooldown),
  )
  return out
}

export function totalSeconds(intervals: Interval[]): number {
  return intervals.reduce((sum, i) => sum + i.seconds, 0)
}

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = h > 0 ? m.toString().padStart(2, '0') : m.toString()
  return `${h > 0 ? `${h}:` : ''}${mm}:${sec.toString().padStart(2, '0')}`
}

export function intervalLabel(i: Interval): string {
  switch (i.kind) {
    case 'prep':
      return 'Get ready'
    case 'work':
      return i.exercise ?? (i.section === 'main' ? 'Work' : SECTION_LABELS[i.section!])
    case 'rest':
      return 'Rest'
    case 'longBreak':
      return 'Long break'
  }
}
