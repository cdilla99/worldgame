// Run with a temporary PGlite install: npm install --prefix .scratch/db-check --no-save @electric-sql/pglite@0.3.14
// Then: node tests/manual/scripts/check-player-sync.mjs
import { PGlite } from '../../../.scratch/db-check/node_modules/@electric-sql/pglite/dist/index.js';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db = new PGlite();
await db.exec(`
  create role anon; create role authenticated;
  create schema auth;
  create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  grant usage on schema auth, public to authenticated;
  grant execute on all functions in schema auth to authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
`);
for (const file of ['20260718224628_create_players_schema.sql', '20260806000000_restrict_game_sessions_read.sql', '20261108000000_player_profile_sync.sql', '20261110000000_harden_player_writes.sql']) {
  await db.exec(await readFile(new URL('../../../supabase/migrations/' + file, import.meta.url), 'utf8'));
}
await db.exec(`
  insert into auth.users(id) values ('11111111-1111-4111-8111-111111111111'), ('22222222-2222-4222-8222-222222222222');
  set role authenticated;
  select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
`);
const game = { id: '33333333-3333-4333-8333-333333333333', mode: 'practice', score: 700, correct_count: 10, total_count: 12, best_streak: 4, imported_games: 7, difficulty: 'local-import' };
await db.query('select public.save_player_game($1)', [game]);
await db.query('select public.save_player_game($1)', [game]);
assert.deepEqual((await db.query('select games_played, total_score from public.players')).rows, [{ games_played: 7, total_score: 700 }]);
await db.query('select public.sync_player_progress($1, $2)', [{ 124: { last: 200, seen: 3 } }, { '2026-11-08': { completed: true, won: true, guesses: [1, 2] } }]);
const result = await db.query('select public.sync_player_progress($1, $2) as value', [{ 124: { last: 100, seen: 1 } }, { '2026-11-08': { completed: false, guesses: [1] } }]);
assert.equal(result.rows[0].value.learning['124'].last, 200);
assert.equal(result.rows[0].value.daily['2026-11-08'].completed, true);
await db.exec("select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false)");
assert.equal((await db.query('select * from public.player_progress')).rows.length, 0);
assert.equal((await db.query('select * from public.game_sessions')).rows.length, 0);
await assert.rejects(db.query("insert into public.player_progress(player_id) values ('11111111-1111-4111-8111-111111111111')"), /permission denied|row-level security/);
await assert.rejects(db.query('update public.players set total_score = 99999'), /permission denied/);
await assert.rejects(db.query('truncate public.players cascade'), /permission denied/);
await assert.rejects(db.query('truncate public.game_sessions'), /permission denied/);
await assert.rejects(db.query('truncate public.player_progress'), /permission denied/);
await assert.rejects(db.query("insert into public.game_sessions(player_id,mode) values ('22222222-2222-4222-8222-222222222222','practice')"), /permission denied/);
await assert.rejects(db.query('select * from earthling_private.upload_limits'), /permission denied/);
await db.query("update public.players set display_name = 'Ben' where id = '22222222-2222-4222-8222-222222222222'");
assert.equal((await db.query('select display_name from public.players')).rows[0].display_name, 'Ben');
await assert.rejects(db.query('update public.players set display_name=$1', ['x'.repeat(81)]), /players_display_name_length/);
const otherUpdate = await db.query("update public.players set display_name = 'Spoofed' where id = '11111111-1111-4111-8111-111111111111' returning id");
assert.equal(otherUpdate.rows.length, 0);
const normal = { id: '44444444-4444-4444-8444-444444444444', mode: 'practice', score: 9, correct_count: 1, total_count: 2, best_streak: 1 };
for (const invalid of [null, {}, { ...normal, score: -1 }, { ...normal, score: 16 }, { ...normal, total_count: 0 }, { ...normal, best_streak: 3 }, { ...normal, total_count: 10001 }, { ...normal, duration_seconds: -1 }, { ...normal, imported_games: 1000 }]) {
  await assert.rejects(db.query('select public.save_player_game($1)', [invalid]), /Invalid game totals/);
}
await assert.rejects(db.query('select public.sync_player_progress($1, $2)', [null, {}]), /Invalid progress/);
await assert.rejects(db.query('select public.sync_player_progress($1, $2)', [{ '__bad': { seen: 1 } }, {}]), /Invalid progress/);
await assert.rejects(db.query('select public.sync_player_progress($1, $2)', [{}, { '2026-11-10': { guesses: Array(7).fill({}) } }]), /Invalid progress/);
await db.query('select public.save_player_game($1)', [{ ...normal, player_id: '11111111-1111-4111-8111-111111111111' }]);
assert.equal((await db.query('select player_id from public.game_sessions')).rows[0].player_id, '22222222-2222-4222-8222-222222222222');

await db.exec("reset role; update earthling_private.upload_limits set game_count=119,progress_count=59 where player_id='22222222-2222-4222-8222-222222222222'; set role authenticated;");
const boundary = { ...normal, id: '55555555-5555-4555-8555-555555555555' };
await db.query('select public.save_player_game($1)', [boundary]);
await db.query('select public.save_player_game($1)', [boundary]); // Idempotent retry even at the limit.
await assert.rejects(db.query('select public.save_player_game($1)', [{ ...normal, id: '66666666-6666-4666-8666-666666666666' }]), /Upload limit reached/);
await db.query('select public.sync_player_progress($1, $2)', [{}, {}]);
await assert.rejects(db.query('select public.sync_player_progress($1, $2)', [{}, {}]), /Upload limit reached/);
await db.exec("reset role; update earthling_private.upload_limits set window_start=now()-interval '61 seconds' where player_id='22222222-2222-4222-8222-222222222222'; set role authenticated;");
await db.query('select public.sync_player_progress($1, $2)', [{}, {}]);
await db.exec("reset role; update earthling_private.upload_limits set day_count=10000 where player_id='22222222-2222-4222-8222-222222222222'; set role authenticated;");
await assert.rejects(db.query('select public.sync_player_progress($1, $2)', [{}, {}]), /Upload limit reached/);
await db.exec(`select set_config('request.jwt.claims', '{"is_anonymous":true}', false)`);
await assert.rejects(db.query('select public.save_player_game($1)', [game]), /Sign in to sync/);
await assert.rejects(db.query('select public.sync_player_progress($1, $2)', [{}, {}]), /Sign in to sync/);
await db.close();
console.log('Player sync PostgreSQL checks passed: owner isolation, direct-write/truncate denial, nickname updates, validated scores, bounded progress, upload limits, retry deduplication, legacy imports and anonymous denial.');
