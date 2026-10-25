'use client'

import { useMemo, useState } from 'react'
import type { WorkoutPlan } from '@/types'
import { buildTimeline, formatTime, totalSeconds } from '@/lib/timeline'
import SectionEditor from './SectionEditor'
import Stepper from './Stepper'

interface WorkoutBuilderProps {
  initialPlan: WorkoutPlan
  initialName: string
  /** Set when editing an existing template. */
  templateId?: string
  onBack: () => void
  onStart: (plan: WorkoutPlan, name: string, templateId?: string) => void
  /** Returns the saved template's id. */
  onSave: (plan: WorkoutPlan, name: string, templateId?: string) => string
}

export default function WorkoutBuilder({
  initialPlan,
  initialName,
  templateId,
  onBack,
  onStart,
  onSave,
}: WorkoutBuilderProps) {
  const [plan, setPlan] = useState<WorkoutPlan>(initialPlan)
  const [name, setName] = useState(initialName)
  // Tracks the id after the first save so later saves update instead of duplicating.
  const [savedId, setSavedId] = useState(templateId)
  const [savedFlash, setSavedFlash] = useState(false)

  const total = useMemo(() => totalSeconds(buildTimeline(plan)), [plan])

  const handleSave = () => {
    setSavedId(onSave(plan, name, savedId))
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1500)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 pt-safe backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-3">
          <button type="button" onClick={onBack} className="icon-btn" aria-label="Back to workouts">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="flex-1 text-lg font-semibold">{templateId ? 'Edit workout' : 'New workout'}</h1>
          <span className="rounded-full bg-gray-100 px-3 py-1 font-mono text-sm tabular-nums text-gray-700">
            {formatTime(total)}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 space-y-4 px-4 py-4 pb-32">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <label htmlFor="workout-name" className="mb-1 block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="workout-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning HIIT"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoComplete="off"
          />
          <Stepper
            label="Get-ready countdown"
            value={plan.prepSeconds}
            min={0}
            max={30}
            isDuration
            minLabel="None"
            onChange={(prepSeconds) => setPlan({ ...plan, prepSeconds })}
          />
        </div>

        <SectionEditor section="warmup" optional value={plan.warmup} onChange={(warmup) => setPlan({ ...plan, warmup })} />
        <SectionEditor section="main" value={plan.main} onChange={(main) => setPlan({ ...plan, main })} />
        <SectionEditor
          section="cooldown"
          optional
          value={plan.cooldown}
          onChange={(cooldown) => setPlan({ ...plan, cooldown })}
        />
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-white/95 pb-safe backdrop-blur">
        <div className="mx-auto flex max-w-lg gap-3 px-4 py-3">
          <button type="button" onClick={handleSave} className="btn-secondary flex-1" aria-live="polite">
            {savedFlash ? 'Saved ✓' : savedId ? 'Save changes' : 'Save template'}
          </button>
          <button type="button" onClick={() => onStart(plan, name, savedId)} className="btn-primary flex-1" disabled={total === 0}>
            Start now
          </button>
        </div>
      </footer>
    </div>
  )
}
