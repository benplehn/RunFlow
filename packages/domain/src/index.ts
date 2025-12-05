export type TrainingCategory = '5k' | '10k' | 'half-marathon' | 'marathon';

export interface TrainingSessionInput {
  distanceKm: number;
  durationMinutes: number;
  rpe: number; // 1-10 perceived effort
}

export interface TrainingLoadBreakdown {
  totalLoad: number;
  averageRpe: number;
  totalDurationMinutes: number;
}

export const domainPlaceholder = {
  description: 'Core business logic for training plans will live here.',
  supportedCategories: ['5k', '10k', 'half-marathon', 'marathon'] as TrainingCategory[]
};

/**
 * Simple training load calculator to support early feature tests.
 *
 * Rationale:
 * - We keep the formula intentionally transparent (distance * RPE) to match early
 *   RunFlow screens and to make debugging easy for coaches.
 * - Average RPE is duration-weighted so a 30min jog does not skew the perception
 *   of a 2h long run that happened the same week.
 * - Input validation stays narrow: negative values or zero-duration sessions are
 *   rejected early so downstream aggregates are not silently wrong.
 */
export function calculateTrainingLoad(sessions: TrainingSessionInput[]): TrainingLoadBreakdown {
  if (!Array.isArray(sessions)) {
    throw new TypeError('sessions must be an array');
  }

  if (sessions.length === 0) {
    return { totalLoad: 0, averageRpe: 0, totalDurationMinutes: 0 };
  }

  let totalLoad = 0;
  let weightedRpeAccumulator = 0;
  let totalDurationMinutes = 0;

  for (const session of sessions) {
    if (session.distanceKm < 0 || session.durationMinutes <= 0 || session.rpe <= 0) {
      throw new RangeError('session values must be positive');
    }

    totalLoad += session.distanceKm * session.rpe;
    weightedRpeAccumulator += session.rpe * session.durationMinutes;
    totalDurationMinutes += session.durationMinutes;
  }

  return {
    totalLoad,
    averageRpe: weightedRpeAccumulator / totalDurationMinutes,
    totalDurationMinutes
  };
}
