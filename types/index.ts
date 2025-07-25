export interface TimerSettings {
  workoutDuration: number; // in seconds
  breakDuration: number; // in seconds
  rounds: number;
}

export type TimerPhase = 'idle' | 'prep' | 'workout' | 'break' | 'completed' | 'paused';

export interface TimerState {
  phase: TimerPhase;
  currentRound: number;
  timeRemaining: number;
  isRunning: boolean;
  settings: TimerSettings;
}

export interface SoundCue {
  type: 'start' | 'end' | 'warning';
  phase: 'workout' | 'break';
} 