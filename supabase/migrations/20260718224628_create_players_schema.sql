-- GeoWars Player Identity & Stats Schema
-- Uses anonymous auth for frictionless play, upgradeable to email later

-- Players table: stores aggregate stats
create table public.players (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  games_played integer not null default 0,
  best_streak integer not null default 0,
  total_correct integer not null default 0,
  total_score integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Game sessions: individual game records for history/leaderboards
create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  mode text not null check (mode in ('sprint', 'practice')),
  score integer not null default 0,
  correct_count integer not null default 0,
  total_count integer not null default 0,
  best_streak integer not null default 0,
  difficulty text not null default 'all',
  duration_seconds integer,
  played_at timestamptz not null default now()
);

-- Indexes for leaderboard queries
create index idx_game_sessions_score on public.game_sessions(score desc);
create index idx_game_sessions_player on public.game_sessions(player_id);
create index idx_game_sessions_played_at on public.game_sessions(played_at desc);

-- RLS: players can only read/write their own data
alter table public.players enable row level security;
alter table public.game_sessions enable row level security;

-- Players policies
create policy "Players can view their own profile"
  on public.players for select
  using (auth.uid() = id);

create policy "Players can update their own profile"
  on public.players for update
  using (auth.uid() = id);

create policy "Players can insert their own profile"
  on public.players for insert
  with check (auth.uid() = id);

-- Game sessions policies
create policy "Players can view their own sessions"
  on public.game_sessions for select
  using (auth.uid() = player_id);

create policy "Players can insert their own sessions"
  on public.game_sessions for insert
  with check (auth.uid() = player_id);

-- Public leaderboard: anyone can read top scores (anonymized)
create policy "Anyone can view leaderboard scores"
  on public.game_sessions for select
  using (true);

-- Function to auto-create player profile on first sign-in
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.players (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', 'Player'));
  return new;
end;
$$;

-- Trigger: auto-create player on auth signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Function to update player aggregate stats after a game session
create or replace function public.update_player_stats()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.players
  set
    games_played = games_played + 1,
    total_correct = total_correct + new.correct_count,
    total_score = total_score + new.score,
    best_streak = greatest(best_streak, new.best_streak),
    updated_at = now()
  where id = new.player_id;
  return new;
end;
$$;

-- Trigger: update aggregate stats when a game session is inserted
create trigger on_game_session_inserted
  after insert on public.game_sessions
  for each row execute function public.update_player_stats();
