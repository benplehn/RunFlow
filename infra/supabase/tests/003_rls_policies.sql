-- Test Row Level Security (RLS) is enabled and policies are defined
DISCARD ALL;
BEGIN;
SELECT plan(16);

-- Test RLS is enabled on all tables (8 tables)
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles' AND relnamespace = 'public'::regnamespace),
  true,
  'RLS is enabled on profiles'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'training_plans' AND relnamespace = 'public'::regnamespace),
  true,
  'RLS is enabled on training_plans'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'plan_weeks' AND relnamespace = 'public'::regnamespace),
  true,
  'RLS is enabled on plan_weeks'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'plan_sessions' AND relnamespace = 'public'::regnamespace),
  true,
  'RLS is enabled on plan_sessions'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'workouts' AND relnamespace = 'public'::regnamespace),
  true,
  'RLS is enabled on workouts'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'workout_feedback' AND relnamespace = 'public'::regnamespace),
  true,
  'RLS is enabled on workout_feedback'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'clubs' AND relnamespace = 'public'::regnamespace),
  true,
  'RLS is enabled on clubs'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'club_members' AND relnamespace = 'public'::regnamespace),
  true,
  'RLS is enabled on club_members'
);

-- Test that policies exist (count > 0) for each table (8 tables)
SELECT ok(
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') > 0,
  'profiles has RLS policies defined'
);

SELECT ok(
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'training_plans') > 0,
  'training_plans has RLS policies defined'
);

SELECT ok(
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plan_weeks') > 0,
  'plan_weeks has RLS policies defined'
);

SELECT ok(
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plan_sessions') > 0,
  'plan_sessions has RLS policies defined'
);

SELECT ok(
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'workouts') > 0,
  'workouts has RLS policies defined'
);

SELECT ok(
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'workout_feedback') > 0,
  'workout_feedback has RLS policies defined'
);

SELECT ok(
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clubs') > 0,
  'clubs has RLS policies defined'
);

SELECT ok(
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'club_members') > 0,
  'club_members has RLS policies defined'
);

SELECT * FROM finish();
ROLLBACK;
