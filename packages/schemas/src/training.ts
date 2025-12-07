import { z } from 'zod';

export const TrainingCategorySchema = z.enum([
  '5k',
  '10k',
  'half-marathon',
  'marathon'
]);

export const TrainingLevelSchema = z.enum([
  'beginner',
  'intermediate',
  'advanced'
]);

export const GeneratePlanInputSchema = z.object({
  objective: TrainingCategorySchema,
  level: TrainingLevelSchema,
  durationWeeks: z.number().int().min(4).max(52),
  sessionsPerWeek: z.number().int().min(2).max(7),
  startDate: z
    .string()
    .datetime()
    .or(
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD or ISO datetime')
    )
});

export type GeneratePlanInput = z.infer<typeof GeneratePlanInputSchema>;

// DTOs for the generated plan structure (matching DB schema loosely but structured for API response)

export const SessionTypeSchema = z.enum([
  'run',
  'strength',
  'rest',
  'cross_training'
]);

export const PlannedSessionSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7), // 1=Monday
  sessionType: SessionTypeSchema,
  targetDuration: z.number().int().optional(), // minutes
  targetDistance: z.number().optional(), // km
  description: z.string().optional()
});

export type PlannedSessionDTO = z.infer<typeof PlannedSessionSchema>;

export const PlannedWeekSchema = z.object({
  weekNumber: z.number().int().min(1),
  phase: z.string().optional(), // e.g., 'Base', 'Build' - optional for now as it's not in DB yet explicitly
  volumeDistance: z.number().default(0),
  volumeDuration: z.number().default(0),
  sessions: z.array(PlannedSessionSchema)
});

export type PlannedWeekDTO = z.infer<typeof PlannedWeekSchema>;

export const TrainingPlanSchema = z.object({
  id: z.string().uuid().optional(), // Optional because it might be a preview before saving
  userId: z.string().uuid().optional(),
  name: z.string(),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived']).default('active'),
  startDate: z.string(),
  durationWeeks: z.number(),
  weeks: z.array(PlannedWeekSchema)
});

export type TrainingPlanDTO = z.infer<typeof TrainingPlanSchema>;

export interface GeneratePlanJobData {
  userId: string;
  planId: string;
  params: GeneratePlanInput;
}
