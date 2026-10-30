'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Interval, WorkoutPlan } from '@/types'
import { SECTION_LABELS, buildTimeline, formatTime, intervalLabel, totalSeconds } from '@/lib/timeline'
import { vibrate, type useBeeper } from '@/lib/audio'

type Status = 'running' | 'paused' | 'done'

interface WorkoutPlayerProps {
  name: string
  plan: WorkoutPlan
  beeper: ReturnType<typeof useBeeper>
  onExit: () => void
}

function background(i: Interval | undefined, status: Status): string {
  if (status === 'done' || !i) return 'bg-primary-700'
  switch (i.kind) {
    case 'prep':
      return 'bg-gray-800'
    case 'rest':
      return 'bg-sky-600'
    case 'longBreak':
      return 'bg-teal-700'
    case 'work':
      return i.section === 'warmup' ? 'bg-orange-500' : i.section === 'cooldown' ? 'bg-indigo-600' : 'bg-success-600'
  }
}

/**
 * What the voice says when an interval starts. Each section is announced once, on its first rep;
 * rests name the upcoming exercise when it has one.
 */
function spokenCue(i: Interval, next: Interval | undefined): string | null {
  switch (i.kind) {
    case 'work':
      if (i.rep !== 1) return null
      return i.section === 'warmup' ? 'Warm up' : i.section === 'cooldown' ? 'Wind down' : 'Start workout'
    case 'rest':
    case 'longBreak': {
      const phrase = i.kind === 'rest' ? 'Rest.' : 'Long rest.'
      return next?.exercise ? `${phrase} Next up: ${next.exercise}` : phrase
    }
    case 'prep':
      return null
  }
}

/** Seconds before the end of an interval to announce the next exercise when no rest will do it. */
const HEADS_UP_SECONDS = 10

/**
 * Spoken near the end of a work interval that runs straight into a named exercise
 * (e.g. the last warm-up rep before the main workout), since there's no rest to announce it.
 */
function headsUpCue(i: Interval, next: Interval | undefined): string | null {
  if (i.kind !== 'work' || next?.kind !== 'work' || !next.exercise) return null
  return `Next up: ${next.exercise}`
}

/** Keeps the screen awake while the timer runs (supported on most modern mobile browsers). */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
        if (cancelled) lock.release()
      } catch {
        // Denied (e.g. low battery); the timer still works.
      }
    }
    // The lock is dropped whenever the page is hidden, so re-acquire on return.
    const onVisible = () => document.visibilityState === 'visible' && acquire()
    acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release()
    }
  }, [active])
}

export default function WorkoutPlayer({ name, plan, beeper, onExit }: WorkoutPlayerProps) {
  const timeline = useMemo(() => buildTimeline(plan), [plan])
  const total = useMemo(() => totalSeconds(timeline), [timeline])
  // Seconds before each interval starts, for the overall progress bar.
  const offsets = useMemo(() => {
    let acc = 0
    return timeline.map((i) => ((acc += i.seconds), acc - i.seconds))
  }, [timeline])

  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState<Status>('running')
  const [remainingMs, setRemainingMs] = useState(() => (timeline[0]?.seconds ?? 0) * 1000)

  // Deadline-based timing: stays accurate when mobile browsers throttle timers in the background.
  const endsAtRef = useRef(Date.now() + remainingMs)
  const indexRef = useRef(0)
  const lastBeepRef = useRef<number | null>(null)
  const headsUpDoneRef = useRef(false)

  const cue = useCallback(
    (index: number) => {
      const i: Interval | undefined = timeline[index]
      if (!i) {
        beeper.finish()
        vibrate([200, 100, 200, 100, 400])
      } else if (i.kind === 'work' || i.kind === 'prep') {
        beeper.start()
        vibrate(250)
      } else {
        beeper.rest()
        vibrate([120, 80, 120])
      }
      const phrase = i && spokenCue(i, timeline[index + 1])
      if (phrase) beeper.say(phrase)
    },
    [timeline, beeper],
  )

  const goTo = useCallback(
    (next: number, keepStatus: Status) => {
      const i = timeline[next]
      indexRef.current = next
      lastBeepRef.current = null
      headsUpDoneRef.current = false
      setIndex(next)
      setRemainingMs(i.seconds * 1000)
      endsAtRef.current = Date.now() + i.seconds * 1000
      setStatus(keepStatus)
      if (keepStatus === 'running') cue(next)
    },
    [timeline, cue],
  )

  // Cue the first interval once on mount.
  useEffect(() => {
    if (timeline.length === 0) setStatus('done')
    else cue(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status !== 'running') return
    const id = setInterval(() => {
      const now = Date.now()
      let i = indexRef.current
      let left = endsAtRef.current - now
      // Loop in case several intervals elapsed while the tab was in the background.
      while (left <= 0) {
        i += 1
        if (i >= timeline.length) {
          setStatus('done')
          setRemainingMs(0)
          cue(i)
          return
        }
        endsAtRef.current += timeline[i].seconds * 1000
        left = endsAtRef.current - now
      }
      if (i !== indexRef.current) {
        indexRef.current = i
        lastBeepRef.current = null
        headsUpDoneRef.current = false
        setIndex(i)
        cue(i)
      }
      const secs = Math.ceil(left / 1000)
      // Only for intervals long enough that the heads-up doesn't talk over the interval's own cue.
      if (secs <= HEADS_UP_SECONDS && timeline[i].seconds > HEADS_UP_SECONDS && !headsUpDoneRef.current) {
        headsUpDoneRef.current = true
        const phrase = headsUpCue(timeline[i], timeline[i + 1])
        if (phrase) beeper.say(phrase, 0)
      }
      if (secs <= 3 && timeline[i].seconds > 3 && lastBeepRef.current !== secs) {
        lastBeepRef.current = secs
        beeper.countdown(secs)
      }
      setRemainingMs(left)
    }, 200)
    return () => clearInterval(id)
  }, [status, timeline, cue, beeper])

  useWakeLock(status === 'running')

  const togglePause = () => {
    beeper.unlock()
    if (status === 'running') {
      setRemainingMs(endsAtRef.current - Date.now())
      setStatus('paused')
    } else if (status === 'paused') {
      endsAtRef.current = Date.now() + remainingMs
      setStatus('running')
    }
  }

  const skipBack = () => {
    const elapsed = timeline[index].seconds * 1000 - remainingMs
    // Like a music player: restart the current interval unless you're right at its start.
    goTo(elapsed > 2000 || index === 0 ? index : index - 1, status === 'done' ? 'paused' : status)
  }

  const skipForward = () => {
    if (index + 1 >= timeline.length) {
      setStatus('done')
      setRemainingMs(0)
      cue(timeline.length)
    } else {
      goTo(index + 1, status)
    }
  }

  const restart = () => {
    beeper.unlock()
    goTo(0, 'running')
  }

  const current = status === 'done' ? undefined : timeline[index]
  const next = timeline[index + 1]
  const secondsLeft = Math.ceil(remainingMs / 1000)
  const elapsedTotal = status === 'done' ? total : offsets[index] + (timeline[index]?.seconds ?? 0) - remainingMs / 1000
  const intervalProgress = current ? 1 - remainingMs / (current.seconds * 1000) : 1

  return (
    <div
      className={`flex min-h-[100dvh] flex-col text-white transition-colors duration-500 ${background(current, status)}`}
    >
      <header className="mx-auto flex w-full max-w-lg items-center gap-2 px-4 pt-safe">
        <button type="button" onClick={onExit} className="icon-btn text-white hover:bg-white/15" aria-label="Exit workout">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
        <p className="flex-1 truncate py-3 text-center text-sm font-medium text-white/80">{name || 'Workout'}</p>
        <span className="w-11 text-right font-mono text-sm tabular-nums text-white/80" aria-label="Time remaining in workout">
          {formatTime(total - elapsedTotal)}
        </span>
      </header>

      <div className="mx-auto w-full max-w-lg px-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25" aria-hidden>
          <div className="h-full rounded-full bg-white transition-[width] duration-200" style={{ width: `${(elapsedTotal / Math.max(1, total)) * 100}%` }} />
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 text-center" aria-live="polite">
        {status === 'done' ? (
          <>
            <p className="text-5xl font-bold">Done! 🎉</p>
            <p className="mt-3 text-lg text-white/80">{formatTime(total)} of training</p>
          </>
        ) : (
          current && (
            <>
              <p className="text-sm font-semibold uppercase tracking-widest text-white/75">
                {current.section ? SECTION_LABELS[current.section] : 'Starting soon'}
              </p>
              <p className="mt-1 text-4xl font-bold sm:text-5xl">{intervalLabel(current)}</p>
              {current.kind === 'work' && (
                <p className="mt-2 text-lg text-white/85">
                  Rep {current.rep} of {current.totalReps}
                </p>
              )}
              <p
                className={`mt-4 font-mono text-[28vw] font-bold leading-none tabular-nums sm:text-[10rem] ${
                  status === 'running' && secondsLeft <= 3 ? 'animate-pulse' : ''
                }`}
                role="timer"
              >
                {formatTime(secondsLeft)}
              </p>
              <div className="mt-6 h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/25" aria-hidden>
                <div className="h-full bg-white/90 transition-[width] duration-200" style={{ width: `${intervalProgress * 100}%` }} />
              </div>
              <p className="mt-6 text-base text-white/80">
                {next ? (
                  <>
                    Up next: <span className="font-semibold text-white">{intervalLabel(next)}</span> · {formatTime(next.seconds)}
                  </>
                ) : (
                  'Last one — finish strong!'
                )}
              </p>
              {status === 'paused' && <p className="mt-4 rounded-full bg-black/25 px-4 py-1 text-sm font-semibold">Paused</p>}
            </>
          )
        )}
      </main>

      <footer className="mx-auto w-full max-w-lg px-4 pb-safe">
        {status === 'done' ? (
          <div className="flex gap-3 py-6">
            <button type="button" onClick={restart} className="player-btn flex-1 bg-white/20">
              Do it again
            </button>
            <button type="button" onClick={onExit} className="player-btn flex-1 bg-white text-gray-900">
              Finish
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-6 py-6">
            <button type="button" onClick={skipBack} className="player-round h-16 w-16 bg-white/20" aria-label="Previous interval">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
                <path d="M6 6h2v12H6zM9.5 12L18 18V6z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={togglePause}
              className="player-round h-24 w-24 bg-white text-gray-900"
              aria-label={status === 'running' ? 'Pause' : 'Resume'}
            >
              {status === 'running' ? (
                <svg viewBox="0 0 24 24" className="h-10 w-10" fill="currentColor" aria-hidden>
                  <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="ml-1 h-10 w-10" fill="currentColor" aria-hidden>
                  <path d="M7 4v16l13-8z" />
                </svg>
              )}
            </button>
            <button type="button" onClick={skipForward} className="player-round h-16 w-16 bg-white/20" aria-label="Next interval">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
                <path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" />
              </svg>
            </button>
          </div>
        )}
      </footer>
    </div>
  )
}
