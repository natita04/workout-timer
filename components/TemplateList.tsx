'use client'

import type { WorkoutTemplate } from '@/types'
import { SECTION_LABELS, buildTimeline, formatTime, totalSeconds } from '@/lib/timeline'

interface TemplateListProps {
  templates: WorkoutTemplate[]
  loaded: boolean
  onNew: () => void
  onPlay: (t: WorkoutTemplate) => void
  onEdit: (t: WorkoutTemplate) => void
  onDelete: (t: WorkoutTemplate) => void
}

function summary(t: WorkoutTemplate): string {
  const { warmup, main, cooldown } = t.plan
  const parts = [
    warmup.enabled && `${SECTION_LABELS.warmup} ${warmup.reps}×`,
    `${main.reps}× ${formatTime(main.workSeconds)}`,
    cooldown.enabled && `${SECTION_LABELS.cooldown} ${cooldown.reps}×`,
  ]
  return parts.filter(Boolean).join(' · ')
}

export default function TemplateList({ templates, loaded, onNew, onPlay, onEdit, onDelete }: TemplateListProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="mx-auto w-full max-w-lg px-4 pb-2 pt-safe">
        <h1 className="pt-6 text-3xl font-bold text-gray-900">Workout Timer</h1>
        <p className="text-gray-600">Build interval workouts and save them as templates.</p>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 space-y-3 px-4 py-4 pb-32">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Saved templates</h2>

        {loaded && templates.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
            No templates yet. Create a workout and tap <span className="font-medium">Save template</span> to keep it here.
          </div>
        )}

        <ul className="space-y-3">
          {templates.map((t) => (
            <li key={t.id} className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
              <button
                type="button"
                onClick={() => onEdit(t)}
                className="min-w-0 flex-1 rounded-lg p-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label={`Edit ${t.name}`}
              >
                <p className="truncate font-semibold text-gray-900">{t.name}</p>
                <p className="truncate text-sm text-gray-500">
                  {formatTime(totalSeconds(buildTimeline(t.plan)))} · {summary(t)}
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete "${t.name}"?`)) onDelete(t)
                }}
                className="icon-btn text-gray-400 hover:text-danger-600"
                aria-label={`Delete ${t.name}`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onPlay(t)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                aria-label={`Start ${t.name}`}
              >
                <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6" fill="currentColor" aria-hidden>
                  <path d="M7 4v16l13-8z" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-white/95 pb-safe backdrop-blur">
        <div className="mx-auto max-w-lg px-4 py-3">
          <button type="button" onClick={onNew} className="btn-primary w-full">
            + New workout
          </button>
        </div>
      </footer>
    </div>
  )
}
