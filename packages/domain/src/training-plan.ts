import {
  GeneratePlanInput,
  PlannedSessionDTO,
  PlannedWeekDTO,
  TrainingPlanDTO
} from '@runflow/schemas';

/**
 * Splits the total duration into phases.
 * Standard Periodization: Base (40%) -> Build (30%) -> Peak (20%) -> Taper (10%)
 */
export function splitPhases(durationWeeks: number): {
  base: number;
  build: number;
  peak: number;
  taper: number;
} {
  if (durationWeeks < 4) {
    throw new Error('Minimum plan duration is 4 weeks');
  }

  // Simple allocation strategy
  const taper = Math.max(1, Math.floor(durationWeeks * 0.15)); // At least 1 week taper
  const peak = Math.max(1, Math.floor(durationWeeks * 0.2));
  const build = Math.floor(durationWeeks * 0.3);

  // Remainder goes to Base to ensure sum === durationWeeks
  const base = durationWeeks - build - peak - taper;

  return { base, build, peak, taper };
}

/**
 * Generates weeks with volume progression.
 */
export function buildWeeks(input: GeneratePlanInput): PlannedWeekDTO[] {
  const { durationWeeks, level } = input;
  const phases = splitPhases(durationWeeks);

  // Starting volume based on level (simplified for MVP)
  let currentWeeklyDistance =
    level === 'beginner' ? 20 : level === 'intermediate' ? 35 : 50;

  // Progression factor (10% rule roughly)
  const progression = 1.1;

  const weeks: PlannedWeekDTO[] = [];
  let weekCounter = 1;

  // Helper to generate weeks for a phase
  const generatePhaseWeeks = (
    phaseName: string,
    count: number,
    type: 'build' | 'recover' | 'maintain' | 'taper'
  ) => {
    for (let i = 0; i < count; i++) {
      let volume = currentWeeklyDistance;

      if (type === 'build') {
        // Every 4th week is recovery in Base/Build
        if (weekCounter % 4 === 0) {
          volume = currentWeeklyDistance * 0.7; // Deload
        } else {
          volume = currentWeeklyDistance;
          currentWeeklyDistance *= progression; // Increase for next regular week
        }
      } else if (type === 'taper') {
        volume = currentWeeklyDistance * 0.6;
        currentWeeklyDistance *= 0.7; // Rapid drop
      }

      weeks.push({
        weekNumber: weekCounter,
        phase: phaseName,
        volumeDistance: Math.round(volume),
        volumeDuration: Math.round(volume * 6), // Rough estim: 6 min/km avg
        sessions: [] // will be filled next
      });
      weekCounter++;
    }
  };

  generatePhaseWeeks('Base', phases.base, 'build');
  generatePhaseWeeks('Build', phases.build, 'build');
  generatePhaseWeeks('Peak', phases.peak, 'maintain'); // Peak intensity high, volume steady
  generatePhaseWeeks('Taper', phases.taper, 'taper');

  return weeks;
}

/**
 * Distributes sessions within each week.
 */
export function buildSessions(
  weeks: PlannedWeekDTO[],
  input: GeneratePlanInput
): PlannedWeekDTO[] {
  return weeks.map((week) => {
    const sessions: PlannedSessionDTO[] = [];
    const { volumeDistance } = week;
    const count = input.sessionsPerWeek;

    // Long run takes ~30-40% of weekly volume
    const longRunDist = Math.round(volumeDistance * 0.35);
    const remainingDist = volumeDistance - longRunDist;
    const easyRunDist = Math.round(remainingDist / (count - 1));

    // 1. Long Run (Sunday usually, but let's say Day 7)
    sessions.push({
      dayOfWeek: 7,
      sessionType: 'run',
      targetDistance: longRunDist,
      targetDuration: Math.round(longRunDist * 6.5), // Slower pace
      description: 'Long Run - Easy conversational pace'
    });

    // 2. Easy Runs / Quality
    for (let i = 0; i < count - 1; i++) {
      // Distribute across week safely (e.g. Tue, Thu, Sat)
      // Simplified logic: Fill Mon(1), Wed(3), Fri(5) etc.
      const day = 1 + i * 2;

      const type: 'run' | 'strength' | 'cross_training' | 'rest' = 'run';
      let desc = 'Easy Run';

      // Variable logic based on phase could go here
      if (week.phase === 'Peak' && i === 0) {
        desc = 'Intervals - Hard effort';
      }

      sessions.push({
        dayOfWeek: day > 6 ? 6 : day, // Clamp to Sat
        sessionType: type,
        targetDistance: easyRunDist,
        targetDuration: Math.round(easyRunDist * 6),
        description: desc
      });
    }

    return {
      ...week,
      sessions: sessions.sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    };
  });
}

/**
 * Main coordinator function.
 */
export function generateTrainingPlan(
  input: GeneratePlanInput
): TrainingPlanDTO {
  const rawWeeks = buildWeeks(input);
  const weeksWithSessions = buildSessions(rawWeeks, input);

  return {
    // ID and userId are often set by the caller/DB, but DTO can hold them if needed
    name: `${input.objective.toUpperCase()} Plan (${input.level})`,
    description: `Generated ${input.durationWeeks}-week plan for ${input.objective}.`,
    startDate: input.startDate,
    durationWeeks: input.durationWeeks,
    status: 'active',
    weeks: weeksWithSessions
  };
}
