-- Test custom database functions and their behavior
DISCARD ALL;
BEGIN;
SELECT plan(3);

-- Test set_updated_at function exists
SELECT has_function(
  'public',
  'set_updated_at',
  'set_updated_at function exists'
);

-- Test function returns trigger type
SELECT function_returns(
  'public',
  'set_updated_at',
  'trigger',
  'set_updated_at returns trigger'
);

-- Test function exists exactly once (no duplicates)
SELECT is(
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'set_updated_at' AND pronamespace = 'public'::regnamespace),
  1::bigint,
  'set_updated_at function exists exactly once'
);

SELECT * FROM finish();
ROLLBACK;
