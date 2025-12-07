import { z } from 'zod';

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().min(1).nullable(), // Renamed from full_name
  avatar_url: z.string().url().nullable(),
  country: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type Profile = z.infer<typeof ProfileSchema>;

export const UpdateProfileSchema = z.object({
  display_name: z.string().min(1).optional(),
  avatar_url: z.string().url().optional(),
  country: z.string().optional()
});

export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
