
-- Profiles mirror auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  country text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

-- Training plans (high level)
-- A plan belongs to a single user; the application enforces one "active" plan at a time.
create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  plan_type text not null check (plan_type in ('5k','10k','half-marathon','marathon')),
  distance_goal_km numeric(6,2),
  target_race_date date,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_training_plans_updated_at
before update on public.training_plans
for each row execute procedure public.set_updated_at();

create index if not exists training_plans_user_id_idx on public.training_plans (user_id);

-- Weeks inside a plan
create table if not exists public.plan_weeks (
  id uuid primary key default gen_random_uuid(),
  training_plan_id uuid not null references public.training_plans (id) on delete cascade,
  week_index integer not null,
  start_date date,
  focus text,
  planned_volume_km numeric(6,2),
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists plan_weeks_unique_idx
  on public.plan_weeks (training_plan_id, week_index);

-- Sessions inside a week/plan
create table if not exists public.plan_sessions (
  id uuid primary key default gen_random_uuid(),
  training_plan_id uuid not null references public.training_plans (id) on delete cascade,
  plan_week_id uuid references public.plan_weeks (id) on delete cascade,
  session_index integer not null,
  name text not null,
  description text,
  intensity text,
  target_distance_km numeric(6,2),
  target_duration interval,
  scheduled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists plan_sessions_unique_idx
  on public.plan_sessions (training_plan_id, session_index);

-- Actual workouts logged by the athlete
-- plan_session_id is nullable because athletes may free-train without a plan.
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_session_id uuid references public.plan_sessions (id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  distance_km numeric(7,3),
  moving_time interval,
  elapsed_time interval,
  rpe smallint check (rpe between 1 and 10),
  notes text,
  gps_trace jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists workouts_user_id_idx on public.workouts (user_id);

-- Clubs (clans)
-- We store privacy at the club row level so RLS can filter without joins for public data.
create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users (id) on delete set null,
  name text not null unique,
  description text,
  is_private boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.club_members (
  club_id uuid references public.clubs (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (club_id, user_id)
);

create index if not exists club_members_user_idx on public.club_members (user_id);

-- Session feedback linked to a workout
create table if not exists public.workout_feedback (
  workout_id uuid primary key references public.workouts (id) on delete cascade,
  mood text,
  surface text,
  weather text,
  pain_level smallint check (pain_level between 0 and 10),
  sleep_quality smallint check (sleep_quality between 0 and 10),
  created_at timestamptz not null default timezone('utc', now())
);

-- Security: enable RLS
-- RLS is the primary guardrail; service role connections are reserved for workers/cron.
alter table public.profiles enable row level security;
alter table public.training_plans enable row level security;
alter table public.plan_weeks enable row level security;
alter table public.plan_sessions enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_feedback enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;

-- Profiles policies
create policy "Users can manage their profile" on public.profiles
  for select using (id = auth.uid())
  with check (id = auth.uid());

create policy "Insert profile matches auth uid" on public.profiles
  for insert with check (id = auth.uid());

-- Training plan policies
create policy "Plan owners can manage plans" on public.training_plans
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Plan week policies
create policy "Plan owner can manage weeks" on public.plan_weeks
  for all using (
    exists (
      select 1 from public.training_plans tp
      where tp.id = training_plan_id and tp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.training_plans tp
      where tp.id = training_plan_id and tp.user_id = auth.uid()
    )
  );

-- Plan session policies
create policy "Plan owner can manage sessions" on public.plan_sessions
  for all using (
    exists (
      select 1 from public.training_plans tp
      where tp.id = training_plan_id and tp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.training_plans tp
      where tp.id = training_plan_id and tp.user_id = auth.uid()
    )
  );

-- Workout policies
create policy "Users manage their workouts" on public.workouts
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Workout feedback policies
create policy "Feedback matches workout owner" on public.workout_feedback
  for all using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  );

-- Clubs policies
create policy "Public clubs are viewable" on public.clubs
  for select using (not is_private);

create policy "Members can view private clubs" on public.clubs
  for select using (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = id and cm.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create clubs" on public.clubs
  for insert with check (auth.uid() is not null);

create policy "Club admins manage clubs" on public.clubs
  for update using (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = id and cm.user_id = auth.uid() and cm.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = id and cm.user_id = auth.uid() and cm.role in ('owner','admin')
    )
  );

-- Club members policies
-- NOTE: we do not enforce "at least one owner" here to keep the policy small; the
-- application/worker layer should prevent orphaned clubs when demoting/removing users.
create policy "Members can view membership" on public.club_members
  for select using (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = club_members.club_id and cm.user_id = auth.uid()
    )
  );

create policy "Users can join a club for themselves" on public.club_members
  for insert with check (user_id = auth.uid());

create policy "Admins manage membership" on public.club_members
  for update using (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = club_members.club_id and cm.user_id = auth.uid() and cm.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = club_members.club_id and cm.user_id = auth.uid() and cm.role in ('owner','admin')
    )
  );

create policy "Admins can remove members" on public.club_members
  for delete using (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = club_members.club_id and cm.user_id = auth.uid() and cm.role in ('owner','admin')
    )
  );

-- Helpers: ensure at least one owner remains? (leave to application logic)
