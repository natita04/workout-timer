'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { TimerSettings, TimerPhase } from '@/types'

const DEFAULT_SETTINGS: TimerSettings = {
  workoutDuration: 40,
  breakDuration: 20,
  rounds: 3,
}

export default function WorkoutTimer() {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS)
  const [phase, setPhase] = useState<TimerPhase>('idle')
  const [currentRound, setCurrentRound] = useState<number>(1)
  const [timeRemaining, setTimeRemaining] = useState<number>(DEFAULT_SETTINGS.workoutDuration)
  
  const PREP_DURATION = 5
  const [isRunning, setIsRunning] = useState<boolean>(false)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize audio context
  useEffect(() => {
    const initAudio = () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (error) {
        console.warn('Audio context not supported:', error)
      }
    }
    initAudio()
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Play sound cue
  const playSound = useCallback((frequency: number, duration: number) => {
    if (!audioContextRef.current) return
    
    try {
      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)
      
      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration)
      
      oscillator.start(audioContextRef.current.currentTime)
      oscillator.stop(audioContextRef.current.currentTime + duration)
    } catch (error) {
      console.warn('Error playing sound:', error)
    }
  }, [])

  // Sound cues
  const playStartSound = useCallback(() => playSound(800, 0.3), [playSound])
  const playEndSound = useCallback(() => playSound(400, 0.5), [playSound])
  const playCountdownSound = useCallback((count: number) => {
    // Inverted frequencies for 3, 2, 1 countdown (high to low)
    const frequencies = { 3: 700, 2: 600, 1: 500 }
    const frequency = frequencies[count as keyof typeof frequencies]
    playSound(frequency, 0.25)
  }, [playSound])

  // Timer logic
  useEffect(() => {
    if (!isRunning) return

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1

        // Countdown sounds at 3, 2, 1 seconds
        if (newTime === 3 || newTime === 2 || newTime === 1) {
          playCountdownSound(newTime)
        }

        // Phase transition
        if (newTime <= 0) {
          playEndSound()
          
          if (phase === 'prep') {
            // Switch from prep to first workout
            setPhase('workout')
            setTimeRemaining(settings.workoutDuration)
            setTimeout(playStartSound, 100)
            return settings.workoutDuration
          } else if (phase === 'workout') {
            if (currentRound < settings.rounds) {
              // Switch to break
              setPhase('break')
              setTimeRemaining(settings.breakDuration)
              setTimeout(playStartSound, 100)
              return settings.breakDuration
            } else {
              // Workout completed
              setPhase('completed')
              setIsRunning(false)
              return 0
            }
          } else if (phase === 'break') {
            // Switch to next workout round
            setPhase('workout')
            setCurrentRound((prev) => prev + 1)
            setTimeRemaining(settings.workoutDuration)
            setTimeout(playStartSound, 100)
            return settings.workoutDuration
          }
        }

        return newTime
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, phase, currentRound, settings, playStartSound, playEndSound, playCountdownSound])

  const handleStart = useCallback(() => {
    if (phase === 'idle' || phase === 'completed') {
      // Start new session with prep time
      setPhase('prep')
      setCurrentRound(1)
      setTimeRemaining(PREP_DURATION)
      playStartSound()
    }
    setIsRunning(true)
  }, [phase, playStartSound])

  const handlePause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const handleReset = useCallback(() => {
    setIsRunning(false)
    setPhase('idle')
    setCurrentRound(1)
    setTimeRemaining(settings.workoutDuration)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }, [settings.workoutDuration])

  const handleSettingsChange = useCallback((newSettings: Partial<TimerSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    
    if (phase === 'idle') {
      setTimeRemaining(updatedSettings.workoutDuration)
    }
  }, [settings, phase])

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const getPhaseDisplay = useCallback(() => {
    switch (phase) {
      case 'prep':
        return 'Get Ready!'
      case 'workout':
        return 'Workout'
      case 'break':
        return 'Break'
      case 'completed':
        return 'Completed!'
      default:
        return 'Ready'
    }
  }, [phase])

  const getPhaseColor = useCallback(() => {
    switch (phase) {
      case 'prep':
        return 'text-primary-600'
      case 'workout':
        return 'text-success-600'
      case 'break':
        return 'text-warning-600'
      case 'completed':
        return 'text-primary-600'
      default:
        return 'text-gray-600'
    }
  }, [phase])

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
      {/* Settings */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="workout-duration" className="block text-sm font-medium text-gray-700 mb-1">
              Workout Duration (seconds)
            </label>
            <input
              id="workout-duration"
              type="number"
              min="5"
              max="300"
              value={settings.workoutDuration}
              onChange={(e) => handleSettingsChange({ workoutDuration: parseInt(e.target.value) })}
              disabled={isRunning}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              aria-label="Set workout duration in seconds"
            />
          </div>
          <div>
            <label htmlFor="break-duration" className="block text-sm font-medium text-gray-700 mb-1">
              Break Duration (seconds)
            </label>
            <input
              id="break-duration"
              type="number"
              min="5"
              max="300"
              value={settings.breakDuration}
              onChange={(e) => handleSettingsChange({ breakDuration: parseInt(e.target.value) })}
              disabled={isRunning}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              aria-label="Set break duration in seconds"
            />
          </div>
          <div>
            <label htmlFor="rounds" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Rounds
            </label>
            <input
              id="rounds"
              type="number"
              min="1"
              max="20"
              value={settings.rounds}
              onChange={(e) => handleSettingsChange({ rounds: parseInt(e.target.value) })}
              disabled={isRunning}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              aria-label="Set number of rounds"
            />
          </div>
        </div>
      </div>

      {/* Timer Display */}
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <div className={`text-2xl font-bold ${getPhaseColor()}`}>
            {getPhaseDisplay()}
          </div>
          <div className="text-6xl font-mono font-bold text-gray-900">
            {formatTime(timeRemaining)}
          </div>
          <div className="text-lg text-gray-600">
            Round {currentRound} of {settings.rounds}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${
              phase === 'prep' ? 'bg-primary-500' : 
              phase === 'workout' ? 'bg-success-500' : 'bg-warning-500'
            }`}
            style={{
              width: `${
                phase === 'prep'
                  ? ((PREP_DURATION - timeRemaining) / PREP_DURATION) * 100
                  : phase === 'workout'
                  ? ((settings.workoutDuration - timeRemaining) / settings.workoutDuration) * 100
                  : phase === 'break'
                  ? ((settings.breakDuration - timeRemaining) / settings.breakDuration) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col space-y-3">
        {phase === 'idle' || phase === 'completed' ? (
          <button
            onClick={handleStart}
            className="btn-primary w-full"
            aria-label="Start workout timer"
            tabIndex={0}
          >
            {phase === 'completed' ? 'Start New Session' : 'Start'}
          </button>
        ) : (
          <div className="flex space-x-3">
            {isRunning ? (
              <button
                onClick={handlePause}
                className="btn-secondary flex-1"
                aria-label="Pause timer"
                tabIndex={0}
              >
                Pause
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="btn-success flex-1"
                aria-label="Resume timer"
                tabIndex={0}
              >
                Resume
              </button>
            )}
            <button
              onClick={handleReset}
              className="btn-danger flex-1"
              aria-label="Reset timer"
              tabIndex={0}
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Status Info */}
      {phase !== 'idle' && (
        <div className="text-center text-sm text-gray-500 space-y-1">
          <div>
            {phase === 'completed' 
              ? 'Workout session completed!' 
              : phase === 'prep'
              ? 'Prepare for your workout!'
              : `Next: ${phase === 'workout' ? 'Break' : 'Workout'}`
            }
          </div>
          {timeRemaining <= 3 && timeRemaining > 0 && phase !== 'completed' && (
            <div className="text-danger-600 font-bold animate-pulse text-lg">
              {timeRemaining}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 