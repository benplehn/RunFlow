-- Rename full_name to display_name to match requirements
alter table public.profiles 
  rename column full_name to display_name;

-- Ensure RLS is still active (redundant but safe)
alter table public.profiles enable row level security;
