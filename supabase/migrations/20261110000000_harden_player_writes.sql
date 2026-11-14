-- Keep account isolation, remove direct score/progress writes, and bound uploads.
-- No existing player progress is deleted or rewritten.
create schema if not exists earthling_private;
revoke all on schema earthling_private from public, anon, authenticated;

create table earthling_private.upload_limits (
  player_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null default now(),
  game_count integer not null default 0,
  progress_count integer not null default 0,
  day_start date not null default current_date,
  day_count integer not null default 0
);
alter table earthling_private.upload_limits enable row level security;
revoke all on earthling_private.upload_limits from public, anon, authenticated;

create function earthling_private.consume_upload(upload_kind text) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  limits earthling_private.upload_limits;
begin
  insert into earthling_private.upload_limits(player_id) values(auth.uid()) on conflict do nothing;
  select * into limits from earthling_private.upload_limits where player_id = auth.uid() for update;
  if limits.window_start <= statement_timestamp() - interval '1 minute' then
    limits.window_start := statement_timestamp();
    limits.game_count := 0;
    limits.progress_count := 0;
  end if;
  if limits.day_start <> current_date then
    limits.day_start := current_date;
    limits.day_count := 0;
  end if;
  if limits.day_count >= 10000
    or (upload_kind = 'game' and limits.game_count >= 120)
    or (upload_kind = 'progress' and limits.progress_count >= 60) then
    raise exception 'Upload limit reached. Your device progress is safe. Please retry later.';
  end if;
  update earthling_private.upload_limits set
    window_start = limits.window_start, day_start = limits.day_start,
    game_count = limits.game_count + case when upload_kind = 'game' then 1 else 0 end,
    progress_count = limits.progress_count + case when upload_kind = 'progress' then 1 else 0 end,
    day_count = limits.day_count + 1
    where player_id = auth.uid();
end;
$$;
revoke all on function earthling_private.consume_upload(text) from public, anon, authenticated;

-- Table grants are deliberate: RLS does not protect TRUNCATE or validate totals.
revoke all on public.players, public.game_sessions, public.player_progress from public, anon, authenticated;
grant select on public.players, public.game_sessions, public.player_progress to authenticated;
grant update(display_name) on public.players to authenticated;
alter table public.players add constraint players_display_name_length
  check (display_name is null or char_length(display_name) <= 80) not valid;

drop policy "Players can view their own profile" on public.players;
drop policy "Players can update their own profile" on public.players;
drop policy "Players can insert their own profile" on public.players;
create policy "Players can view their own profile" on public.players for select to authenticated
  using (auth.uid() = id and (auth.jwt()->>'is_anonymous') is distinct from 'true');
create policy "Players can update their own profile" on public.players for update to authenticated
  using (auth.uid() = id and (auth.jwt()->>'is_anonymous') is distinct from 'true')
  with check (auth.uid() = id and (auth.jwt()->>'is_anonymous') is distinct from 'true');
drop policy "Players can insert their own sessions" on public.game_sessions;
drop policy "Players can view their own sessions" on public.game_sessions;
create policy "Players can view their own sessions" on public.game_sessions for select to authenticated
  using (auth.uid() = player_id and (auth.jwt()->>'is_anonymous') is distinct from 'true');
drop policy "Players own their progress" on public.player_progress;
create policy "Players own their progress" on public.player_progress for select to authenticated
  using (auth.uid() = player_id and (auth.jwt()->>'is_anonymous') is distinct from 'true');

create or replace function public.save_player_game(game jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  game_id uuid;
  imported integer;
  game_score integer;
  correct integer;
  total integer;
  streak integer;
  duration integer;
  inserted_id uuid;
  legacy boolean;
begin
  if owner_id is null or (auth.jwt()->>'is_anonymous') = 'true' then
    raise exception 'Sign in to sync progress';
  end if;
  if game is null or jsonb_typeof(game) <> 'object' or octet_length(game::text) > 4096 then
    raise exception 'Invalid game totals' using errcode = '22023';
  end if;
  -- JSON integer casts reject decimals, missing required values are rejected below.
  game_id := (game->>'id')::uuid;
  game_score := (game->>'score')::integer;
  correct := (game->>'correct_count')::integer;
  total := (game->>'total_count')::integer;
  streak := (game->>'best_streak')::integer;
  duration := (game->>'duration_seconds')::integer;
  legacy := coalesce(game->>'difficulty' = 'local-import', false);
  imported := case when legacy then coalesce((game->>'imported_games')::integer, 1) else 1 end;
  if game_id is null or game_score is null or correct is null or total is null or streak is null
    or (game->>'mode') is null or (game->>'mode') not in ('sprint', 'practice')
    or game_score < 0 or correct < 0 or total < correct or streak < 0 or streak > correct
    or (duration is not null and (duration < 0 or duration > 86400))
    or length(coalesce(game->>'difficulty', 'all')) > 40
    or (not legacy and (total > 10000 or game_score::bigint > correct::bigint * 15
      or (game ? 'imported_games' and (game->>'imported_games')::integer <> 1)))
    or (legacy and (imported < 0 or imported > 1000000 or total > 10000000 or game_score > 1000000000)) then
    raise exception 'Invalid game totals' using errcode = '22023';
  end if;
  -- Retry committed records without incrementing aggregates or consuming quota again.
  if exists(select 1 from public.game_sessions where id = game_id and player_id = owner_id) then return; end if;
  perform earthling_private.consume_upload('game');
  insert into public.game_sessions
    (id, player_id, mode, score, correct_count, total_count, best_streak, difficulty, duration_seconds)
  values (game_id, owner_id, game->>'mode', game_score, correct, total, streak,
    coalesce(game->>'difficulty', 'all'), duration)
  on conflict (id) do nothing returning id into inserted_id;
  if inserted_id is not null and imported <> 1 then
    update public.players set games_played = games_played + imported - 1 where id = owner_id;
  end if;
end;
$$;
revoke all on function public.save_player_game(jsonb) from public, anon;
grant execute on function public.save_player_game(jsonb) to authenticated;

create or replace function public.sync_player_progress(incoming_learning jsonb, incoming_daily jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  saved public.player_progress;
  entry record;
  previous jsonb;
begin
  if owner_id is null or (auth.jwt()->>'is_anonymous') = 'true' then
    raise exception 'Sign in to sync progress';
  end if;
  if incoming_learning is null or incoming_daily is null
    or jsonb_typeof(incoming_learning) <> 'object' or jsonb_typeof(incoming_daily) <> 'object'
    or octet_length(incoming_learning::text) + octet_length(incoming_daily::text) > 2000000 then
    raise exception 'Invalid progress' using errcode = '22023';
  end if;
  if (select count(*) from jsonb_object_keys(incoming_learning)) > 1000
    or (select count(*) from jsonb_object_keys(incoming_daily)) > 4000 then
    raise exception 'Invalid progress' using errcode = '22023';
  end if;
  for entry in select * from jsonb_each(incoming_learning) loop
    if entry.key !~ '^[0-9]{1,6}$' or jsonb_typeof(entry.value) <> 'object'
      or octet_length(entry.value::text) > 1024
      or coalesce((entry.value->>'box')::integer, 0) not between 0 and 5
      or coalesce((entry.value->>'seen')::bigint, 0) not between 0 and 1000000000
      or coalesce((entry.value->>'correct')::bigint, 0) not between 0 and 1000000000
      or coalesce((entry.value->>'last')::bigint, 0) < 0
      or coalesce((entry.value->>'due')::bigint, 0) < 0 then
      raise exception 'Invalid progress' using errcode = '22023';
    end if;
  end loop;
  for entry in select * from jsonb_each(incoming_daily) loop
    if entry.key !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or jsonb_typeof(entry.value) <> 'object'
      or jsonb_typeof(entry.value->'guesses') is distinct from 'array'
      or jsonb_array_length(entry.value->'guesses') > 6
      or jsonb_typeof(coalesce(entry.value->'completed', 'false'::jsonb)) <> 'boolean'
      or jsonb_typeof(coalesce(entry.value->'won', 'false'::jsonb)) <> 'boolean' then
      raise exception 'Invalid progress' using errcode = '22023';
    end if;
  end loop;
  perform earthling_private.consume_upload('progress');
  insert into public.player_progress(player_id) values(owner_id) on conflict do nothing;
  select * into saved from public.player_progress where player_id = owner_id for update;
  for entry in select * from jsonb_each(incoming_learning) loop
    previous := saved.learning->entry.key;
    if previous is null or coalesce((entry.value->>'last')::bigint, 0) > coalesce((previous->>'last')::bigint, 0) then
      saved.learning := jsonb_set(saved.learning, array[entry.key], entry.value);
    end if;
  end loop;
  for entry in select * from jsonb_each(incoming_daily) loop
    previous := saved.daily->entry.key;
    if previous is null or (not coalesce((previous->>'completed')::boolean, false) and
      (coalesce((entry.value->>'completed')::boolean, false) or
       jsonb_array_length(entry.value->'guesses') > jsonb_array_length(previous->'guesses'))) then
      saved.daily := jsonb_set(saved.daily, array[entry.key], entry.value);
    end if;
  end loop;
  if octet_length(saved.learning::text) + octet_length(saved.daily::text) > 2000000 then
    raise exception 'Progress storage limit reached. Your device progress is safe.';
  end if;
  update public.player_progress set learning = saved.learning, daily = saved.daily where player_id = owner_id;
  return jsonb_build_object('learning', saved.learning, 'daily', saved.daily);
end;
$$;
revoke all on function public.sync_player_progress(jsonb, jsonb) from public, anon;
grant execute on function public.sync_player_progress(jsonb, jsonb) to authenticated;
revoke all on function public.handle_new_user(), public.update_player_stats() from public, anon, authenticated;

notify pgrst, 'reload schema';
