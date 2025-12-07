DISCARD ALL;
BEGIN;
SELECT plan(9);

-- 1. Check Tables Exist
SELECT has_table('user_training_plans');
SELECT has_table('planned_weeks');
SELECT has_table('planned_sessions');

-- 2. Check RLS Enabled
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_training_plans' AND relnamespace = 'public'::regnamespace),
  true,
  'RLS is enabled on user_training_plans'
);
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'planned_weeks' AND relnamespace = 'public'::regnamespace),
  true,
  'RLS is enabled on planned_weeks'
);
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'planned_sessions' AND relnamespace = 'public'::regnamespace),
  true,
  'RLS is enabled on planned_sessions'
);

-- 3. Check Policies Defined
SELECT ok(
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_training_plans') > 0,
  'user_training_plans has RLS policies defined'
);
SELECT ok(
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'planned_weeks') > 0,
  'planned_weeks has RLS policies defined'
);
SELECT ok(
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'planned_sessions') > 0,
  'planned_sessions has RLS policies defined'
);

SELECT * FROM finish();
ROLLBACK;
