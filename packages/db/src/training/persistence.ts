import type { TrainingPlanDTO } from '@runflow/schemas';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';

/**
 * Persists a generated training plan into the database, including weeks and sessions.
 * Assumes the plan record already exists (e.g. created with 'pending' status) or creates it if not.
 * If planId is provided, it updates the status to 'generated' and inserts children.
 */
export async function saveGeneratedPlan(
  client: SupabaseClient<Database>,
  planId: string,
  dto: TrainingPlanDTO
) {
  // 1. Insert weeks
  // We need to map weeks and insert them, retrieving IDs
  const weeksToInsert = dto.weeks.map((week) => ({
    plan_id: planId,
    week_number: week.weekNumber,
    volume_distance: week.volumeDistance,
    volume_duration: week.volumeDuration
    // focus: week.phase // 'focus' column in schema? Schema says 'focus' string | null. DTO has 'phase'.
    // Let's assume phase maps to focus or we add it.
    // Schema: focus string. DTO: phase string.
  }));

  // Note: perform sequential or bulk insert.
  // With Supabase/Postgres we can return IDs.
  const { data: insertedWeeks, error: weeksError } = await client
    .from('planned_weeks')
    .insert(weeksToInsert)
    .select();

  if (weeksError) throw weeksError;
  if (!insertedWeeks) throw new Error('No weeks inserted');

  // 2. Insert sessions
  // We need to map sessions to the correct week_id
  const sessionsToInsert = [];

  for (const weekDto of dto.weeks) {
    const insertedWeek = insertedWeeks.find(
      (w) => w.week_number === weekDto.weekNumber
    );
    if (!insertedWeek) continue;

    for (const session of weekDto.sessions) {
      sessionsToInsert.push({
        week_id: insertedWeek.id,
        day_of_week: session.dayOfWeek,
        session_type: session.sessionType,
        target_distance: session.targetDistance,
        target_duration: session.targetDuration,
        description: session.description
      });
    }
  }

  if (sessionsToInsert.length > 0) {
    const { error: sessionsError } = await client
      .from('planned_sessions')
      .insert(sessionsToInsert);

    if (sessionsError) throw sessionsError;
  }

  // 3. Update the main plan status and details (FINAL STEP)
  const { error: planError } = await client
    .from('user_training_plans')
    .update({
      status: 'generated',
      name: dto.name,
      description: dto.description,
      // start_date: dto.startDate, // Assuming this was set on creation, but can update if needed
      updated_at: new Date().toISOString()
    })
    .eq('id', planId);

  if (planError) throw planError;
}
