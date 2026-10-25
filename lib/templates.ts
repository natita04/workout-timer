'use client'

import { useCallback, useEffect, useState } from 'react'
import type { WorkoutPlan, WorkoutTemplate } from '@/types'
import { DEFAULT_PLAN } from './timeline'

// Templates live in the browser's localStorage, so they persist per device.
// Swap this module for an API client if cross-device sync is ever needed.
const STORAGE_KEY = 'workout-timer:templates:v1'

function read(): WorkoutTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as WorkoutTemplate[]
    // Merge with defaults so templates saved by older versions stay valid.
    return parsed.map((t) => ({
      ...t,
      plan: {
        ...DEFAULT_PLAN,
        ...t.plan,
        warmup: { ...DEFAULT_PLAN.warmup, ...t.plan.warmup },
        main: { ...DEFAULT_PLAN.main, ...t.plan.main },
        cooldown: { ...DEFAULT_PLAN.cooldown, ...t.plan.cooldown },
      },
    }))
  } catch {
    return []
  }
}

function write(templates: WorkoutTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useTemplates() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setTemplates(read())
    setLoaded(true)
  }, [])

  const commit = useCallback((next: WorkoutTemplate[]) => {
    write(next)
    setTemplates(next)
  }, [])

  /** Creates a template, or updates it when `id` matches an existing one. Returns the id. */
  const save = useCallback(
    (name: string, plan: WorkoutPlan, id?: string): string => {
      const current = read()
      const existing = id ? current.find((t) => t.id === id) : undefined
      const template: WorkoutTemplate = {
        id: existing?.id ?? newId(),
        name: name.trim() || 'Untitled workout',
        plan,
        updatedAt: Date.now(),
      }
      commit(existing ? current.map((t) => (t.id === template.id ? template : t)) : [template, ...current])
      return template.id
    },
    [commit],
  )

  const remove = useCallback((id: string) => commit(read().filter((t) => t.id !== id)), [commit])

  return { templates, loaded, save, remove }
}
