-- Add new status values to the enum
ALTER TYPE "public"."training_plan_status" ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE "public"."training_plan_status" ADD VALUE IF NOT EXISTS 'generated';
ALTER TYPE "public"."training_plan_status" ADD VALUE IF NOT EXISTS 'failed';
