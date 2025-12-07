import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';

export type NewTrainingPlan =
  Database['public']['Tables']['user_training_plans']['Insert'];
export type TrainingPlan =
  Database['public']['Tables']['user_training_plans']['Row'];

/**
 * Create a new training plan for the current user.
 * RLS ensures the user can only create for themselves (or we explicitly check auth).
 */
export async function createTrainingPlan(
  client: SupabaseClient<Database>,
  planData: NewTrainingPlan
) {
  const { data, error } = await client
    .from('user_training_plans')
    .insert(planData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get a training plan by ID.
 * RLS ensures users only see their own plans.
 */
export async function getTrainingPlanById(
  client: SupabaseClient<Database>,
  planId: string
) {
  const { data, error } = await client
    .from('user_training_plans')
    .select(
      `
      *,
      planned_weeks (
        *,
        planned_sessions (*)
      )
    `
    )
    .eq('id', planId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * List all training plans for the current user.
 */
export async function listTrainingPlans(
  client: SupabaseClient<Database>,
  userId: string
) {
  const { data, error } = await client
    .from('user_training_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
// Export persistence helper
export * from './persistence';
