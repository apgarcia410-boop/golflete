-- ============================================================
-- Golf Athlete App — Phase 1 schema
-- Every table: uuid pk, created_at, updated_at, user_id + RLS
-- Historical data (workout_sessions/sets) is never overwritten
-- by program edits — programs are versioned instead.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- helper: auto-update updated_at ----------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- PROFILES
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  height_inches numeric,
  current_weight_lb numeric,
  target_weight_lb numeric,
  target_body_fat_low numeric,
  target_body_fat_high numeric,
  schedule_type text default 'standard', -- 'standard' | '48_96_firefighter'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- ============================================================
-- BRAND SETTINGS (one row per user)
-- ============================================================
create table brand_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  preset text default 'performance', -- performance | fairway | carbon | classic | minimal | custom
  color_background text default '#0F1113',
  color_surface text default '#1A1D21',
  color_primary text default '#22C55E',
  color_secondary text default '#3B82F6',
  color_accent text default '#F59E0B',
  color_text text default '#F5F5F4',
  color_success text default '#22C55E',
  color_warning text default '#F59E0B',
  color_error text default '#EF4444',
  theme_mode text default 'dark', -- light | dark | system
  logo_url text,
  card_radius text default '0.5rem',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table brand_settings enable row level security;
create policy "own brand settings" on brand_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger trg_brand_updated before update on brand_settings
  for each row execute function set_updated_at();

-- ============================================================
-- EXERCISE LIBRARY
-- ============================================================
create table exercise_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique -- squat, hinge, push, pull, carry, core, rotation, mobility, conditioning...
);

create table exercise_library (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category_id uuid references exercise_categories(id),
  equipment text, -- dumbbell, barbell, kettlebell, cable, bodyweight, mace, peloton, treadmill...
  instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_exercise_updated before update on exercise_library
  for each row execute function set_updated_at();

-- ============================================================
-- PROGRAMS (versioned — never overwritten)
-- ============================================================
create table programs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '6 Weeks of The Work',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table programs enable row level security;
create policy "own programs" on programs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table program_versions (
  id uuid primary key default uuid_generate_v4(),
  program_id uuid not null references programs(id) on delete cascade,
  version_number int not null,
  label text, -- e.g. "Version 1"
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (program_id, version_number)
);
alter table program_versions enable row level security;
create policy "own program versions" on program_versions for all using (
  auth.uid() = (select user_id from programs where programs.id = program_versions.program_id)
) with check (
  auth.uid() = (select user_id from programs where programs.id = program_versions.program_id)
);

create table program_weeks (
  id uuid primary key default uuid_generate_v4(),
  program_version_id uuid not null references program_versions(id) on delete cascade,
  week_number int not null,
  label text,
  unique (program_version_id, week_number)
);
alter table program_weeks enable row level security;
create policy "own program weeks" on program_weeks for all using (
  auth.uid() = (select p.user_id from program_versions pv join programs p on p.id = pv.program_id where pv.id = program_weeks.program_version_id)
) with check (
  auth.uid() = (select p.user_id from program_versions pv join programs p on p.id = pv.program_id where pv.id = program_weeks.program_version_id)
);

create table program_workouts (
  id uuid primary key default uuid_generate_v4(),
  program_week_id uuid not null references program_weeks(id) on delete cascade,
  day_number int not null, -- 1-7, meaning depends on schedule_type
  title text not null,
  workout_type text, -- station | home | recovery
  notes text
);
alter table program_workouts enable row level security;
create policy "own program workouts" on program_workouts for all using (
  auth.uid() = (
    select p.user_id from program_weeks pw
    join program_versions pv on pv.id = pw.program_version_id
    join programs p on p.id = pv.program_id
    where pw.id = program_workouts.program_week_id
  )
) with check (
  auth.uid() = (
    select p.user_id from program_weeks pw
    join program_versions pv on pv.id = pw.program_version_id
    join programs p on p.id = pv.program_id
    where pw.id = program_workouts.program_week_id
  )
);

create table program_exercises (
  id uuid primary key default uuid_generate_v4(),
  program_workout_id uuid not null references program_workouts(id) on delete cascade,
  exercise_id uuid not null references exercise_library(id),
  order_index int not null default 0,
  target_sets int,
  target_reps text, -- e.g. "8-10"
  target_rpe numeric,
  notes text
);
alter table program_exercises enable row level security;
create policy "own program exercises" on program_exercises for all using (
  auth.uid() = (
    select p.user_id from program_workouts pwk
    join program_weeks pw on pw.id = pwk.program_week_id
    join program_versions pv on pv.id = pw.program_version_id
    join programs p on p.id = pv.program_id
    where pwk.id = program_exercises.program_workout_id
  )
) with check (
  auth.uid() = (
    select p.user_id from program_workouts pwk
    join program_weeks pw on pw.id = pwk.program_week_id
    join program_versions pv on pv.id = pw.program_version_id
    join programs p on p.id = pv.program_id
    where pwk.id = program_exercises.program_workout_id
  )
);

-- ============================================================
-- WORKOUT SESSIONS & SETS (immutable history)
-- ============================================================
create table workout_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_workout_id uuid references program_workouts(id), -- nullable: ad-hoc workouts allowed
  status text not null default 'in_progress', -- in_progress | completed | skipped
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  location text, -- station | home
  duration_minutes int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table workout_sessions enable row level security;
create policy "own workout sessions" on workout_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger trg_sessions_updated before update on workout_sessions
  for each row execute function set_updated_at();

create table workout_sets (
  id uuid primary key default uuid_generate_v4(),
  workout_session_id uuid not null references workout_sessions(id) on delete cascade,
  exercise_id uuid not null references exercise_library(id),
  set_number int not null,
  weight numeric,
  reps int,
  rpe numeric,
  rest_seconds int,
  distance numeric,
  duration_seconds int,
  notes text,
  logged_at timestamptz not null default now()
);
alter table workout_sets enable row level security;
create policy "own workout sets" on workout_sets for all using (
  auth.uid() = (select user_id from workout_sessions where workout_sessions.id = workout_sets.workout_session_id)
) with check (
  auth.uid() = (select user_id from workout_sessions where workout_sessions.id = workout_sets.workout_session_id)
);

-- ============================================================
-- BODY MEASUREMENTS
-- ============================================================
create table body_measurements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_date date not null default current_date,
  weight_lb numeric,
  waist_in numeric,
  body_fat_pct numeric,
  notes text,
  created_at timestamptz not null default now()
);
alter table body_measurements enable row level security;
create policy "own body measurements" on body_measurements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- NUTRITION (basic — expanded in Phase 3)
-- ============================================================
create table nutrition_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_date date not null default current_date,
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  water_oz numeric,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, logged_date)
);
alter table nutrition_logs enable row level security;
create policy "own nutrition logs" on nutrition_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- READINESS
-- ============================================================
create table readiness_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_date date not null default current_date,
  sleep_hours numeric,
  sleep_quality int, -- 1-5
  energy int, -- 1-5
  soreness int, -- 1-5
  stress int, -- 1-5
  source text default 'manual', -- manual | apple_health | whoop | oura | garmin (Phase 5 ready)
  created_at timestamptz not null default now(),
  unique (user_id, logged_date)
);
alter table readiness_logs enable row level security;
create policy "own readiness logs" on readiness_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile + default brand settings on signup
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.brand_settings (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
