'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'

/**
 * Beeps via the Web Audio API. Call `unlock()` from a tap handler first —
 * iOS Safari only allows audio from a context created/resumed in a user gesture.
 */
export function useBeeper() {
  const ctxRef = useRef<AudioContext | null>(null)

  const unlock = useCallback(() => {
    try {
      if (!ctxRef.current) {
        const Ctor = window.AudioContext || (window as any).webkitAudioContext
        ctxRef.current = new Ctor()
      }
      if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    } catch (error) {
      console.warn('Audio not supported:', error)
    }
  }, [])

  useEffect(() => () => void ctxRef.current?.close(), [])

  const tone = useCallback((frequency: number, duration: number) => {
    const ctx = ctxRef.current
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(frequency, ctx.currentTime)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration)
    } catch (error) {
      console.warn('Error playing sound:', error)
    }
  }, [])

  const countdown = useCallback(
    (n: number) => tone(({ 3: 700, 2: 600, 1: 500 } as Record<number, number>)[n] ?? 600, 0.25),
    [tone],
  )
  const start = useCallback(() => tone(880, 0.35), [tone])
  const rest = useCallback(() => tone(440, 0.5), [tone])
  const finish = useCallback(() => {
    tone(660, 0.25)
    setTimeout(() => tone(880, 0.25), 250)
    setTimeout(() => tone(1100, 0.5), 500)
  }, [tone])

  return useMemo(() => ({ unlock, countdown, start, rest, finish }), [unlock, countdown, start, rest, finish])
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern)
}
