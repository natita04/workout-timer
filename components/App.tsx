'use client'

import { useState } from 'react'
import type { WorkoutPlan, WorkoutTemplate } from '@/types'
import { DEFAULT_PLAN } from '@/lib/timeline'
import { useTemplates } from '@/lib/templates'
import { useBeeper } from '@/lib/audio'
import TemplateList from './TemplateList'
import WorkoutBuilder from './WorkoutBuilder'
import WorkoutPlayer from './WorkoutPlayer'

interface Draft {
  plan: WorkoutPlan
  name: string
  templateId?: string
}

type View =
  | { screen: 'home' }
  | { screen: 'builder'; draft: Draft }
  | { screen: 'player'; plan: WorkoutPlan; name: string; returnTo: View }

export default function App() {
  const { templates, loaded, save, remove } = useTemplates()
  const beeper = useBeeper()
  const [view, setView] = useState<View>({ screen: 'home' })

  const play = (plan: WorkoutPlan, name: string, returnTo: View) => {
    // Must run inside the tap handler so iOS lets us play sound.
    beeper.unlock()
    window.scrollTo(0, 0)
    setView({ screen: 'player', plan, name, returnTo })
  }

  const edit = (t?: WorkoutTemplate) =>
    setView({
      screen: 'builder',
      draft: t ? { plan: t.plan, name: t.name, templateId: t.id } : { plan: DEFAULT_PLAN, name: '' },
    })

  switch (view.screen) {
    case 'home':
      return (
        <TemplateList
          templates={templates}
          loaded={loaded}
          onNew={() => edit()}
          onEdit={edit}
          onPlay={(t) => play(t.plan, t.name, view)}
          onDelete={(t) => remove(t.id)}
        />
      )
    case 'builder': {
      const { draft } = view
      return (
        <WorkoutBuilder
          key={draft.templateId ?? 'new'}
          initialPlan={draft.plan}
          initialName={draft.name}
          templateId={draft.templateId}
          onBack={() => setView({ screen: 'home' })}
          onSave={(plan, name, id) => save(name, plan, id)}
          // Come back to the builder with the edits intact after playing.
          onStart={(plan, name, templateId) => play(plan, name, { screen: 'builder', draft: { plan, name, templateId } })}
        />
      )
    }
    case 'player':
      return <WorkoutPlayer name={view.name} plan={view.plan} beeper={beeper} onExit={() => setView(view.returnTo)} />
  }
}
