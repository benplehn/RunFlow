-- Test schema structure, tables, indexes, and constraints
BEGIN;
SELECT plan(37);

-- Test table existence (8 tables)
SELECT has_table('public', 'profiles', 'profiles table exists');
SELECT has_table('public', 'training_plans', 'training_plans table exists');
SELECT has_table('public', 'plan_weeks', 'plan_weeks table exists');
SELECT has_table('public', 'plan_sessions', 'plan_sessions table exists');
SELECT has_table('public', 'workouts', 'workouts table exists');
SELECT has_table('public', 'clubs', 'clubs table exists');
SELECT has_table('public', 'club_members', 'club_members table exists');
SELECT has_table('public', 'workout_feedback', 'workout_feedback table exists');

-- Test primary keys (8 tables)
SELECT has_pk('public', 'profiles', 'profiles has primary key');
SELECT has_pk('public', 'training_plans', 'training_plans has primary key');
SELECT has_pk('public', 'plan_weeks', 'plan_weeks has primary key');
SELECT has_pk('public', 'plan_sessions', 'plan_sessions has primary key');
SELECT has_pk('public', 'workouts', 'workouts has primary key');
SELECT has_pk('public', 'clubs', 'clubs has primary key');
SELECT has_pk('public', 'club_members', 'club_members has primary key');
SELECT has_pk('public', 'workout_feedback', 'workout_feedback has primary key');

-- Test foreign keys (key relationships)
SELECT has_fk('public', 'profiles', 'profiles has foreign key to auth.users');
SELECT has_fk('public', 'training_plans', 'training_plans has foreign key to users');
SELECT has_fk('public', 'plan_weeks', 'plan_weeks has foreign key to training_plans');
SELECT has_fk('public', 'plan_sessions', 'plan_sessions has foreign key to training_plans');
SELECT has_fk('public', 'workouts', 'workouts has foreign key to users');
SELECT has_fk('public', 'club_members', 'club_members has foreign key to clubs');

-- Test indexes
SELECT has_index('public', 'training_plans', 'training_plans_user_id_idx', 'training_plans has user_id index');
SELECT has_index('public', 'plan_weeks', 'plan_weeks_unique_idx', 'plan_weeks has unique constraint on training_plan_id + week_index');
SELECT has_index('public', 'plan_sessions', 'plan_sessions_unique_idx', 'plan_sessions has unique constraint on training_plan_id + session_index');
SELECT has_index('public', 'workouts', 'workouts_user_id_idx', 'workouts has user_id index');
SELECT has_index('public', 'club_members', 'club_members_user_idx', 'club_members has user_id index');

-- Test check constraints
SELECT col_has_check('public', 'training_plans', 'plan_type', 'training_plans.plan_type has check constraint');
SELECT col_has_check('public', 'training_plans', 'status', 'training_plans.status has check constraint');
SELECT col_has_check('public', 'workouts', 'rpe', 'workouts.rpe has check constraint');
SELECT col_has_check('public', 'workout_feedback', 'pain_level', 'workout_feedback.pain_level has check constraint');
SELECT col_has_check('public', 'workout_feedback', 'sleep_quality', 'workout_feedback.sleep_quality has check constraint');
SELECT col_has_check('public', 'club_members', 'role', 'club_members.role has check constraint');

-- Test triggers (updated_at triggers)
SELECT has_trigger('public', 'profiles', 'set_profiles_updated_at', 'profiles has updated_at trigger');
SELECT has_trigger('public', 'training_plans', 'set_training_plans_updated_at', 'training_plans has updated_at trigger');

-- Test critical columns exist
SELECT has_column('public', 'training_plans', 'plan_type', 'training_plans has plan_type column');
SELECT has_column('public', 'clubs', 'is_private', 'clubs has is_private column');

SELECT * FROM finish();
ROLLBACK;
