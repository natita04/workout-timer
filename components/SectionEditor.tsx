'use client'

import type { MainSectionConfig, SectionConfig, SectionKey } from '@/types'
import { SECTION_LABELS, formatTime, sectionIntervals, totalSeconds } from '@/lib/timeline'
import Stepper from './Stepper'

const ACCENTS: Record<SectionKey, string> = {
  warmup: 'border-l-orange-500',
  main: 'border-l-success-500',
  cooldown: 'border-l-indigo-500',
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
        </div>
      )}
    </section>
  )
}
