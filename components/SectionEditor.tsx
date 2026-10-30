'use client'

import { useState } from 'react'
import type { MainSectionConfig, SectionConfig, SectionKey } from '@/types'
import { SECTION_LABELS, formatTime, sectionIntervals, totalSeconds } from '@/lib/timeline'
import Stepper from './Stepper'

const ACCENTS: Record<SectionKey, string> = {
  warmup: 'border-l-orange-500',
  main: 'border-l-success-500',
  cooldown: 'border-l-indigo-500',
}

interface ExerciseNamesProps {
  section: SectionKey
  reps: number
  names: string[]
  onChange: (names: string[]) => void
}

/** Optional per-rep exercise names. Names past the rep count are kept, so lowering then raising reps doesn't lose them. */
function ExerciseNames({ section, reps, names, onChange }: ExerciseNamesProps) {
  const named = names.slice(0, reps).filter((n) => n.trim()).length
  // Start expanded when the template already has names; after that the user controls it.
  const [open, setOpen] = useState(named > 0)
  const setName = (index: number, name: string) => {
    const next = [...names]
    while (next.length < index) next.push('')
    next[index] = name
    onChange(next)
  }

  return (
    <details className="group py-2" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-gray-700">
        <span>Exercise names</span>
        <span className="flex items-center gap-2 text-xs text-gray-500">
          {named > 0 ? `${named} of ${reps}` : 'Optional'}
          <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>
      <ol className="mt-1 space-y-2">
        {Array.from({ length: reps }, (_, index) => {
          const id = `${section}-exercise-${index}`
          return (
            <li key={index} className="flex items-center gap-3">
              <label htmlFor={id} className="w-6 shrink-0 text-right font-mono text-sm tabular-nums text-gray-500">
                <span className="sr-only">Exercise for rep </span>
                {index + 1}
              </label>
              <input
                id={id}
                type="text"
                value={names[index] ?? ''}
                onChange={(e) => setName(index, e.target.value)}
                placeholder="e.g. Squats"
                autoCapitalize="words"
                enterKeyHint="next"
                className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </li>
          )
        })}
      </ol>
    </details>
  )
}

interface SectionEditorProps<T extends SectionConfig> {
  section: SectionKey
  value: T
  onChange: (value: T) => void
  /** Warm-up and wind-down can be switched off; the main workout can't. */
  optional?: boolean
}

export default function SectionEditor<T extends SectionConfig>({
  section,
  value,
  onChange,
  optional = false,
}: SectionEditorProps<T>) {
  const set = (patch: Partial<T>) => onChange({ ...value, ...patch })
  const isMain = section === 'main'
  const main = value as unknown as MainSectionConfig
  const switchId = `${section}-enabled`

  return (
    <section
      className={`rounded-2xl border-l-4 bg-white p-4 shadow-sm ${ACCENTS[section]}`}
      aria-labelledby={`${section}-title`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id={`${section}-title`} className="text-base font-semibold text-gray-900">
            {SECTION_LABELS[section]}
          </h2>
          <p className="text-xs text-gray-500">
            {value.enabled ? formatTime(totalSeconds(sectionIntervals(section, value))) : 'Skipped'}
          </p>
        </div>
        {optional && (
          <label htmlFor={switchId} className="relative inline-flex cursor-pointer items-center">
            <span className="sr-only">Include {SECTION_LABELS[section]}</span>
            <input
              id={switchId}
              type="checkbox"
              role="switch"
              className="peer sr-only"
              checked={value.enabled}
              onChange={(e) => set({ enabled: e.target.checked } as Partial<T>)}
            />
            <span className="h-7 w-12 rounded-full bg-gray-300 transition-colors peer-checked:bg-primary-600 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2" />
            <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
          </label>
        )}
      </div>

      {value.enabled && (
        <div className="mt-2 divide-y divide-gray-100">
          <Stepper label="Repetitions" value={value.reps} min={1} max={50} onChange={(reps) => set({ reps } as Partial<T>)} />
          <Stepper
            label="Length of each"
            value={value.workSeconds}
            min={5}
            max={600}
            step={5}
            isDuration
            onChange={(workSeconds) => set({ workSeconds } as Partial<T>)}
          />
          <Stepper
            label="Break between"
            value={value.restSeconds}
            min={0}
            max={300}
            step={5}
            isDuration
            minLabel="None"
            disabled={value.reps < 2}
            onChange={(restSeconds) => set({ restSeconds } as Partial<T>)}
          />
          {isMain && (
            <>
              <Stepper
                label="Long break every"
                value={main.longBreakEvery}
                min={0}
                max={Math.max(1, value.reps - 1)}
                minLabel="Off"
                suffix="reps"
                disabled={value.reps < 2}
                onChange={(longBreakEvery) => set({ longBreakEvery } as unknown as Partial<T>)}
              />
              {main.longBreakEvery > 0 && (
                <Stepper
                  label="Long break length"
                  value={main.longBreakSeconds}
                  min={15}
                  max={900}
                  step={15}
                  isDuration
                  onChange={(longBreakSeconds) => set({ longBreakSeconds } as unknown as Partial<T>)}
                />
              )}
            </>
          )}
          <ExerciseNames section={section} reps={value.reps} names={value.exercises} onChange={(exercises) => set({ exercises } as Partial<T>)} />
        </div>
      )}
    </section>
  )
}
