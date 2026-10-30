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

/** Optional exercise names. The list repeats in order across the reps, so a 6-move circuit is entered once. */
function ExerciseNames({ section, reps, names, onChange }: ExerciseNamesProps) {
  // Start expanded when the template already has names; after that the user controls it.
  const [open, setOpen] = useState(names.length > 0)
  const setName = (index: number, name: string) => onChange(names.map((n, i) => (i === index ? name : n ?? '')))
  const add = () => {
    onChange([...names, ''])
    // Focus the new field once it renders.
    requestAnimationFrame(() => document.getElementById(`${section}-exercise-${names.length}`)?.focus())
  }
  const remove = (index: number) => onChange(names.filter((_, i) => i !== index))

  const count = names.length
  const rounds = count ? Math.floor(reps / count) : 0
  const extra = count ? reps % count : 0
  const plan =
    count === 0
      ? null
      : count >= reps
        ? count > reps
          ? `Only the first ${reps} are used — raise Repetitions to ${count} to do them all.`
          : 'Each exercise once.'
        : `Repeats ${rounds} ${rounds === 1 ? 'time' : 'times'}${extra ? `, plus the first ${extra}` : ''} over ${reps} reps.`

  return (
    <details className="group py-2" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-gray-700">
        <span>Exercise names</span>
        <span className="flex items-center gap-2 text-xs text-gray-500">
          {count > 0 ? `${count} ${count === 1 ? 'exercise' : 'exercises'}` : 'Optional'}
          <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>
      {count === 0 && <p className="mt-1 text-xs text-gray-500">Doing a circuit? Add each exercise once — the list repeats for every round.</p>}
      <ol className="mt-1 space-y-2">
        {names.map((name, index) => {
          const id = `${section}-exercise-${index}`
          return (
            <li key={index} className="flex items-center gap-2">
              <label htmlFor={id} className="w-6 shrink-0 text-right font-mono text-sm tabular-nums text-gray-500">
                <span className="sr-only">Exercise </span>
                {index + 1}
              </label>
              <input
                id={id}
                type="text"
                value={name ?? ''}
                onChange={(e) => setName(index, e.target.value)}
                placeholder="e.g. Squats"
                autoCapitalize="words"
                enterKeyHint="next"
                className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
              <button type="button" onClick={() => remove(index)} className="icon-btn text-gray-500" aria-label={`Remove exercise ${index + 1}`}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          )
        })}
      </ol>
      <button
        type="button"
        onClick={add}
        className="mt-2 min-h-[44px] w-full rounded-xl border border-dashed border-gray-300 text-sm font-semibold text-primary-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        + Add exercise
      </button>
      {plan && <p className="mt-2 text-xs text-gray-500">{plan}</p>}
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
