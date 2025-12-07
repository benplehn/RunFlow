import { describe, it, expect } from 'vitest';
import {
  splitPhases,
  buildWeeks,
  buildSessions,
  generateTrainingPlan
} from '../training-plan';
import { GeneratePlanInput } from '@runflow/schemas';

describe('Training Plan Domain Logic', () => {
  describe('splitPhases', () => {
    it('should split 12 weeks correctly', () => {
      const phases = splitPhases(12);
      // 15% taper = 1.8 -> 1
      // 20% peak = 2.4 -> 2
      // 30% build = 3.6 -> 3
      // Base = 12 - 1 - 2 - 3 = 6
      expect(phases).toEqual({ base: 6, build: 3, peak: 2, taper: 1 });
      expect(phases.base + phases.build + phases.peak + phases.taper).toBe(12);
    });

    it('should split 4 weeks (minimum)', () => {
      const phases = splitPhases(4);
      // taper=1, peak=1, build=1
      // base = 4 - 3 = 1
      expect(phases).toEqual({ base: 1, build: 1, peak: 1, taper: 1 });
    });

    it('should throw error for invalid duration', () => {
      expect(() => splitPhases(3)).toThrow();
    });
  });

  describe('buildWeeks', () => {
    it('should generate correct number of weeks', () => {
      const input: GeneratePlanInput = {
        objective: 'half-marathon',
        level: 'intermediate',
        durationWeeks: 12,
        sessionsPerWeek: 4,
        startDate: '2025-01-01'
      };
      const weeks = buildWeeks(input);
      expect(weeks).toHaveLength(12);
      expect(weeks[0].weekNumber).toBe(1);
      expect(weeks[11].weekNumber).toBe(12);
      expect(weeks[0].phase).toBe('Base');
      expect(weeks[11].phase).toBe('Taper');
    });
  });

  describe('buildSessions', () => {
    it('should distribute sessions correctly', () => {
      const input: GeneratePlanInput = {
        objective: '10k',
        level: 'beginner',
        durationWeeks: 8,
        sessionsPerWeek: 3,
        startDate: '2025-01-01'
      };
      const rawWeeks = buildWeeks(input);
      const fullWeeks = buildSessions(rawWeeks, input);

      const week1 = fullWeeks[0];
      expect(week1.sessions).toHaveLength(3);

      // Check session types: 1 Long Run, others usually runs for simplification
      const longRun = week1.sessions.find((s) => s.dayOfWeek === 7);
      expect(longRun).toBeDefined();
      expect(longRun?.sessionType).toBe('run');
      expect(longRun?.description).toContain('Long Run');
    });
  });

  describe('generateTrainingPlan', () => {
    it('should generate a full plan structure', () => {
      const input: GeneratePlanInput = {
        objective: 'marathon',
        level: 'advanced',
        durationWeeks: 16,
        sessionsPerWeek: 5,
        startDate: '2025-01-01'
      };
      const plan = generateTrainingPlan(input);

      expect(plan.name).toContain('MARATHON');
      expect(plan.durationWeeks).toBe(16);
      expect(plan.weeks).toHaveLength(16);
      expect(plan.weeks[0].sessions).toHaveLength(5);
    });
  });
});
