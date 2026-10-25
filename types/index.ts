export type SectionKey = 'warmup' | 'main' | 'cooldown';

/** A block of repeated work intervals, optionally separated by rests. */
export interface SectionConfig {
  enabled: boolean;
  reps: number;
  workSeconds: number;
  /** Rest between reps. 0 = no rest. */
  restSeconds: number;
}

export interface MainSectionConfig extends SectionConfig {
  /** Insert a long break after every N reps. 0 = off. */
  longBreakEvery: number;
  longBreakSeconds: number;
}

export interface WorkoutPlan {
  /** Countdown before the first interval. 0 = start immediately. */
  prepSeconds: number;
  warmup: SectionConfig;
  main: MainSectionConfig;
  cooldown: SectionConfig;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  plan: WorkoutPlan;
  updatedAt: number;
}

export type IntervalKind = 'prep' | 'work' | 'rest' | 'longBreak';

/** One step of the flattened timeline the player walks through. */
export interface Interval {
  kind: IntervalKind;
  section: SectionKey | null;
  seconds: number;
  /** 1-based rep within the section (for work/rest). */
  rep: number;
  totalReps: number;
}
