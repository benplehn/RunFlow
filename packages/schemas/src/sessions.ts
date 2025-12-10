import { z } from 'zod';

export const SessionStatusSchema = z.enum([
  'in_progress',
  'completed',
  'aborted'
]);

// Input for creating a session
export const CreateSessionSchema = z.object({
  plannedSessionId: z.string().uuid().optional(),
  startTime: z
    .string()
    .datetime()
    .default(() => new Date().toISOString())
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;

// Input for updating a session
export const UpdateSessionSchema = z.object({
  status: SessionStatusSchema.optional(),
  endTime: z.string().datetime().optional(),
  metrics: z.record(z.string(), z.any()).optional() // Flexible JSON metrics
});

export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>;

// Schema for a single data point
export const SessionPointSchema = z.object({
  timestamp: z.string().datetime(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  alt: z.number().optional(),
  heartRate: z.number().int().min(0).max(250).optional(),
  data: z.record(z.string(), z.any()).optional()
});

export type SessionPointDTO = z.infer<typeof SessionPointSchema>;

// Schema for batch point upload
export const BatchPointsSchema = z.object({
  points: z.array(SessionPointSchema).min(1).max(1000) // Batch size limit
});

export type BatchPointsInput = z.infer<typeof BatchPointsSchema>;
