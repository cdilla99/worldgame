-- Public leaderboard reads exposed player_id and complete session rows.
-- The application currently writes sessions but does not read a public leaderboard.
drop policy if exists "Anyone can view leaderboard scores"
  on public.game_sessions;

comment on table public.game_sessions is
  'Game sessions are readable by their owning player and insertable by that player.';
