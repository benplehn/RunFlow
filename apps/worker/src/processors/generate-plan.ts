import { Job } from 'bullmq';
import { GeneratePlanJobResult } from '../queues/generate-plan';
import { generateTrainingPlan } from '@runflow/domain';
import { GeneratePlanInput, GeneratePlanJobData } from '@runflow/schemas';
import { createServiceClient, saveGeneratedPlan } from '@runflow/db';
import { config, logger } from '../config';

/**
 * Processor for the 'generate-plan' job.
 *
 * 1. Generates the plan using the domain logic.
 * 2. Persists the plan to the database.
 * 3. Updates the status to 'generated'.
 */
export async function generatePlanProcessor(
  job: Job<GeneratePlanJobData, GeneratePlanJobResult>
): Promise<GeneratePlanJobResult> {
  const { userId, planId, params } = job.data;

  logger.info({
    msg: 'Processing generate-plan job',
    jobId: job.id,
    planId,
    userId
  });

  // 1. Generate Domain Plan
  // Map params to domain input types
  // 1. Generate Domain Plan
  // Map params to domain input types
  const domainInput: GeneratePlanInput = {
    ...params
    // We trust validation from API.
    // If params are missing fields that GeneratePlanInput requires, we will fail at runtime or domain will throw.
    // But since we share the schema, it should be fine.
  };

  // Real implementation should pass everything from API.

  // NOTE: params in job.data should match what GeneratePlanInput needs.
  // We'll trust the API to validate this, or validate here.

  try {
    const generatedPlan = generateTrainingPlan(domainInput);

    // 2. Persist to DB
    const db = createServiceClient({
      supabaseUrl: config.supabase.url,
      supabaseAnonKey: config.supabase.anonKey,
      supabaseServiceRoleKey: config.supabase.serviceRoleKey
    });

    await saveGeneratedPlan(db, planId, generatedPlan);

    logger.info({ msg: 'Plan generated and saved', planId });

    return { success: true, planId };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error({
      msg: 'Failed to generate plan',
      planId,
      error: errorMessage
    });

    // Update DB status to failed
    const db = createServiceClient({
      supabaseUrl: config.supabase.url,
      supabaseAnonKey: config.supabase.anonKey,
      supabaseServiceRoleKey: config.supabase.serviceRoleKey
    });

    await db
      .from('user_training_plans')
      .update({ status: 'failed', description: `Error: ${errorMessage}` })
      .eq('id', planId);

    throw err; // Allow BullMQ to handle retry/failure
  }
}
