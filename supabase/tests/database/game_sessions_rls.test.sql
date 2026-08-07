begin;
select plan(3);

select policies_are(
  'public',
  'game_sessions',
  array['Players can insert their own sessions', 'Players can view their own sessions'],
  'game_sessions exposes only owner-scoped policies'
);

select is(
  (select count(*)::integer from pg_policies
   where schemaname = 'public'
     and tablename = 'game_sessions'
     and cmd = 'SELECT'
     and qual = 'true'),
  0,
  'no unconditional session read policy remains'
);

select is(
  (select relrowsecurity from pg_class
   where oid = 'public.game_sessions'::regclass),
  true,
  'row level security remains enabled'
);

select * from finish();
rollback;
