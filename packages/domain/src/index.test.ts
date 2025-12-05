import { describe, expect, it } from 'vitest';
import { calculateTrainingLoad } from './index';

describe('calculateTrainingLoad', () => {
  it('computes totals and weighted average RPE for multiple sessions', () => {
    const result = calculateTrainingLoad([
      { distanceKm: 5, durationMinutes: 30, rpe: 6 },
      { distanceKm: 12, durationMinutes: 65, rpe: 7 }
    ]);

    expect(result.totalLoad).toBeCloseTo(5 * 6 + 12 * 7);
    expect(result.totalDurationMinutes).toBe(95);
    expect(result.averageRpe).toBeCloseTo((6 * 30 + 7 * 65) / 95);
  });

  it('returns zeros when no sessions are provided', () => {
    expect(calculateTrainingLoad([])).toEqual({
      totalLoad: 0,
      averageRpe: 0,
      totalDurationMinutes: 0
    });
  });

  it('throws when input is not an array', () => {
    expect(() => calculateTrainingLoad(null as unknown as [])).toThrow(
      TypeError
    );
  });

  it('rejects negative or zero values', () => {
    expect(() =>
      calculateTrainingLoad([{ distanceKm: -1, durationMinutes: 30, rpe: 5 }])
    ).toThrow(RangeError);
    expect(() =>
      calculateTrainingLoad([{ distanceKm: 5, durationMinutes: 0, rpe: 5 }])
    ).toThrow(RangeError);
    expect(() =>
      calculateTrainingLoad([{ distanceKm: 5, durationMinutes: 30, rpe: 0 }])
    ).toThrow(RangeError);
  });
});
