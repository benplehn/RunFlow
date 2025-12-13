import { z } from 'zod';

export const CreateGroupSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().optional(),
  visibility: z.enum(['public', 'private']).default('public')
});

export const CreateGroupEventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  location: z.string().optional()
});

export const GroupIdParamSchema = z.object({
  id: z.string().uuid()
});
