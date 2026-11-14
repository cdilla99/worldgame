-- Authenticated, owner-only progress. Device profiles never grant cloud access.
create table public.player_progress (
  player_id uuid primary key references public.players(id) on delete cascade,
  learning jsonb not null default '{}'::jsonb,
  daily jsonb not null default '{}'::jsonb
);
alter table public.player_progress enable row level security;
create policy "Players own their progress" on public.player_progress
  for all to authenticated
  using (auth.uid() = player_id and (auth.jwt()->>'is_anonymous') is distinct from 'true')
  with check (auth.uid() = player_id and (auth.jwt()->>'is_anonymous') is distinct from 'true');
grant select, insert, update on public.player_progress to authenticated;

-- Stable client game IDs make retries idempotent. Importing an old device's
-- aggregate preserves its game count, with the insert + adjustment atomic.
create function public.save_player_game(game jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  inserted_id uuid;
  imported integer := coalesce((game->>'imported_games')::integer, 1);
begin
  if auth.uid() is null or (auth.jwt()->>'is_anonymous') = 'true' then
    raise exception 'Sign in to sync progress';
  end if;
  if imported < 0 or imported > 1000000
    or (game->>'score')::integer < 0 or (game->>'correct_count')::integer < 0
    or (game->>'total_count')::integer < 0 or (game->>'best_streak')::integer < 0 then
    raise exception 'Invalid game totals';
  end if;
  insert into public.game_sessions
    (id, player_id, mode, score, correct_count, total_count, best_streak, difficulty, duration_seconds)
  values ((game->>'id')::uuid, auth.uid(), game->>'mode', (game->>'score')::integer,
    (game->>'correct_count')::integer, (game->>'total_count')::integer,
    (game->>'best_streak')::integer, coalesce(game->>'difficulty', 'all'),
    (game->>'duration_seconds')::integer)
  on conflict (id) do nothing returning id into inserted_id;
  if inserted_id is not null and imported <> 1 then
    update public.players set games_played = games_played + imported - 1 where id = auth.uid();
  end if;
end;
$$;
revoke all on function public.save_player_game(jsonb) from public, anon;
grant execute on function public.save_player_game(jsonb) to authenticated;

-- Serialize merges per player. Newer country reviews win; completed Daily
-- puzzles cannot be overwritten by an older device's unfinished copy.
create function public.sync_player_progress(incoming_learning jsonb, incoming_daily jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  saved public.player_progress;
  entry record;
  previous jsonb;
begin
  if auth.uid() is null or (auth.jwt()->>'is_anonymous') = 'true' then
    raise exception 'Sign in to sync progress';
  end if;
  if jsonb_typeof(incoming_learning) <> 'object' or jsonb_typeof(incoming_daily) <> 'object'
    or octet_length(incoming_learning::text) + octet_length(incoming_daily::text) > 2000000 then
    raise exception 'Invalid progress';
  end if;
  insert into public.player_progress(player_id) values(auth.uid()) on conflict do nothing;
  select * into saved from public.player_progress where player_id = auth.uid() for update;
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
  update public.player_progress set learning = saved.learning, daily = saved.daily where player_id = auth.uid();
  return jsonb_build_object('learning', saved.learning, 'daily', saved.daily);
end;
$$;
revoke all on function public.sync_player_progress(jsonb, jsonb) from public, anon;
grant execute on function public.sync_player_progress(jsonb, jsonb) to authenticated;
