'use client'

import { formatTime } from '@/lib/timeline'

interface StepperProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Show the value as m:ss instead of a plain number. */
  isDuration?: boolean
  /** Text shown instead of the value when it equals `min` (e.g. "Off"). */
  minLabel?: string
  /** Unit shown after a plain number (e.g. "reps"). */
  suffix?: string
  disabled?: boolean
}

export default function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  isDuration = false,
  minLabel,
  suffix,
  disabled = false,
}: StepperProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  const display = minLabel && value === min ? minLabel : isDuration ? formatTime(value) : suffix ? `${value} ${suffix}` : String(value)

  return (
    <div className={`flex items-center justify-between gap-3 py-2 ${disabled ? 'opacity-40' : ''}`}>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-1" role="group" aria-label={label}>
        <button
          type="button"
          className="stepper-btn"
          onClick={() => onChange(clamp(value - step))}
          disabled={disabled || value <= min}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <output
          className="min-w-[4.5rem] px-1 text-center font-mono text-base font-semibold tabular-nums text-gray-900"
          aria-live="polite"
        >
          {display}
        </output>
        <button
          type="button"
          className="stepper-btn"
          onClick={() => onChange(clamp(value + step))}
          disabled={disabled || value >= max}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}
