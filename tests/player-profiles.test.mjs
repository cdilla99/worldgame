import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import vm from 'node:vm';

function client({ failUpload = false, googleReturn = false, failGoogle = false, restoredSession = false, failSignOut = false, idTokenExchange } = {}) {
  const data = new Map();
  const localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) };
  const uploads = new Map();
  let attempted = 0;
  let allowUploads = !failUpload;
  let testNow = Date.now();
  class Clock extends Date { static now() { return testNow; } }
  const user = { id: randomUUID(), email: 'player@example.test', is_anonymous: false };
  let session = restoredSession ? { user } : null;
  const tokenRequests = [];
  const auth = {
    onAuthStateChange() {}, getSession: async () => ({ data: { session } }),
    signInAnonymously: async () => ({ error: { message: 'disabled' } }),
    signInWithOtp: async () => ({ data: {} }), signOut: async () => ({ error: failSignOut ? { message: 'offline' } : null }),
    signInWithOAuth: async () => ({ data: {} }),
    signInWithIdToken: async args => {
      tokenRequests.push(args);
      if (idTokenExchange) return idTokenExchange(args, user);
      if (failGoogle) return { error: { message: 'invalid identity token' } };
      session = { user };
      return { data: { user, session } };
    },
    exchangeCodeForSession: async () => {
      if (failGoogle) return { error: { message: 'invalid code' } };
      session = { user };
      return { data: { user, session } };
    }
  };
  const supabase = { auth, rpc: async (name, args) => {
    if (name === 'save_player_game') {
      attempted++;
      // Simulate a server commit whose response was lost.
      uploads.set(args.game.id, args.game);
      if (!allowUploads) return { error: { message: 'network failure' } };
      return { data: null };
    }
    return { data: { learning: args.incoming_learning, daily: args.incoming_daily } };
  } };
  const context = vm.createContext({ localStorage, URL, URLSearchParams, Date: Clock, console: { log() {}, warn() {} }, crypto: { randomUUID } });
  context.window = context;
  context.supabase = { createClient: () => supabase };
  context.location = { protocol: 'https:', href: 'https://example.test/', search: googleReturn ? '?player_auth=google&code=example' : '' };
  for (const file of ['player-profiles.js', 'supabase-client.js']) vm.runInContext(readFileSync(new URL('../' + file, import.meta.url), 'utf8'), context);
  return { db: context.GeoWarsDB, profiles: context.GeoWarsProfiles, localStorage, uploads, user, context, tokenRequests,
    attempted: () => attempted, allowUploads: () => { allowUploads = true; }, advance: ms => { testNow += ms; } };
}

test('nicknames isolate scores and transfer guest history exactly once', async () => {
  const { db, profiles, localStorage } = client();
  localStorage.setItem('geowars-stats', JSON.stringify({ played: 3, totalScore: 250, totalCorrect: 8, bestStreak: 4 }));
  const first = profiles.create('Ada', '🦊', true);
  assert.equal((await db.getStats()).played, 3);
  assert.equal(localStorage.getItem('geowars-stats'), null);
  const second = profiles.create('Ben', '🚀', false);
  assert.equal((await db.getStats()).played, 0);
  await db.saveGameSession({ mode: 'practice', score: 20, correct: 1, total: 1, bestStreak: 1 });
  profiles.select(first.id);
  assert.equal((await db.getStats()).played, 3);
  profiles.select(second.id);
  assert.equal((await db.getStats()).played, 1);
  profiles.select('guest');
  assert.equal((await db.getStats()).played, 0);
});

test('Google return preserves the selected nickname and uploads only after PKCE verification', async () => {
  const c = client({ googleReturn: true });
  const selected = c.profiles.create('Ada', '🦊', false);
  c.localStorage.setItem('earthling-google-signin', JSON.stringify({ profileId: selected.id }));
  await c.db.saveGameSession({ mode: 'practice', score: 100, correct: 1, total: 1, bestStreak: 1 });
  assert.equal(c.uploads.size, 0);
  await c.db.init();
  assert.equal(c.db.isClaimed(), true);
  assert.equal(c.profiles.active().name, 'Ada');
  assert.equal(c.profiles.active().cloudUserId, c.user.id);
  assert.equal(c.uploads.size, 1);
  assert.equal(c.localStorage.getItem('earthling-google-signin'), null);
});

test('a failed Google exchange cannot attach a device profile to a pre-existing session', async () => {
  const c = client({ googleReturn: true, failGoogle: true, restoredSession: true });
  const selected = c.profiles.create('Ben', '🚀', false);
  c.localStorage.setItem('earthling-google-signin', JSON.stringify({ profileId: selected.id }));
  await c.db.init();
  assert.equal(c.db.isClaimed(), false);
  assert.equal(c.profiles.active().cloudUserId, undefined);
  assert.equal(c.uploads.size, 0);
  assert.match((await c.db.getIdentity()).signInError, /did not complete/);
});

test('learning and Daily records are scoped to the selected profile', () => {
  const c = client();
  for (const file of ['learning-progress.js', 'daily-worldle.js']) vm.runInContext(readFileSync(new URL('../' + file, import.meta.url), 'utf8'), c.context);
  const first = c.profiles.create('Ada', '🦊', false);
  c.context.GeoWarsLearning.record(124, true);
  c.localStorage.setItem(c.profiles.storageKey('geowars-daily-worldle'), JSON.stringify({ stats: { played: 2 } }));
  c.profiles.create('Ben', '🚀', false);
  assert.equal(c.context.GeoWarsLearning.getSummary([124]).seen, 0);
  assert.equal(c.context.GeoWarsDailyWorldle.getStats().played, 0);
  assert.equal(c.localStorage.getItem(c.profiles.storageKey('geowars-learning')), null);
  c.profiles.select(first.id);
  assert.equal(JSON.parse(c.localStorage.getItem(c.profiles.storageKey('geowars-learning')))['124'].seen, 1);
  assert.equal(c.context.GeoWarsDailyWorldle.getStats().played, 2);
});

test('switching to Guest offline removes the stored cloud session', async () => {
  const c = client({ restoredSession: true, failSignOut: true });
  await c.db.init();
  assert.equal(c.db.isClaimed(), true);
  c.localStorage.setItem('sb-njlklquuzrezqheikcxp-auth-token', 'mock-session');
  assert.equal((await c.db.switchLocalPlayer('guest')).success, true);
  assert.equal(c.localStorage.getItem('sb-njlklquuzrezqheikcxp-auth-token'), null);
  assert.equal(c.profiles.active(), null);
  assert.equal(c.db.isClaimed(), false);
});

test('Google sign-in without a verified credential cannot grant cloud access', async () => {
  const { db, profiles, attempted, localStorage, tokenRequests } = client();
  profiles.create('Ada', '🦊', false);
  await db.init();
  assert.match((await db.signInWithGoogle()).error, /Google sign-in button/);
  assert.equal(localStorage.getItem('earthling-google-signin'), null);
  assert.equal(tokenRequests.length, 0);
  assert.equal(db.isClaimed(), false);
  assert.equal(attempted(), 0);
});

test('direct Google sign-in verifies the token and nonce before linking and uploading', async () => {
  const c = client();
  const selected = c.profiles.create('Ada', '🦊', false);
  await c.db.saveGameSession({ mode: 'practice', score: 100, correct: 1, total: 1, bestStreak: 1 });
  assert.equal(c.uploads.size, 0);
  const result = await c.db.signInWithGoogle({ token: 'google-id-token', nonce: 'random-nonce', profileId: selected.id });
  assert.equal(result.success, true);
  assert.deepEqual(JSON.parse(JSON.stringify(c.tokenRequests)), [{ provider: 'google', token: 'google-id-token', nonce: 'random-nonce' }]);
  assert.equal(c.profiles.active().cloudUserId, c.user.id);
  assert.equal(c.profiles.active().name, 'Ada');
  assert.equal(c.uploads.size, 1);
  assert.equal(c.localStorage.getItem('earthling-google-signin'), null);
});

test('rejected direct Google credentials cannot link a profile using a restored session', async () => {
  const c = client({ failGoogle: true, restoredSession: true });
  c.profiles.create('Ben', '🚀', false);
  const result = await c.db.signInWithGoogle({ token: 'invalid-token', nonce: 'random-nonce', profileId: c.profiles.active().id });
  assert.match(result.error, /did not complete/);
  assert.equal(c.db.isClaimed(), false);
  assert.equal(c.profiles.active().cloudUserId, undefined);
  assert.equal(c.uploads.size, 0);
});

test('changing the selected profile during verification cannot attach the new profile', async () => {
  let release;
  const c = client({ idTokenExchange: (_args, user) => new Promise(resolve => { release = () => resolve({ data: { session: { user } } }); }) });
  const first = c.profiles.create('Ada', '🦊', false);
  await c.db.init();
  const pending = c.db.signInWithGoogle({ token: 'google-id-token', nonce: 'random-nonce', profileId: first.id });
  await new Promise(resolve => setImmediate(resolve));
  const second = c.profiles.create('Ben', '🚀', false);
  release();
  assert.match((await pending).error, /selected player changed/);
  assert.equal(c.profiles.active().id, second.id);
  assert.equal(c.profiles.list().some(profile => profile.cloudUserId), false);
  assert.equal(c.uploads.size, 0);
});

test('returning Google accounts reuse their profile without importing another player history', async () => {
  const c = client();
  const existing = c.profiles.create('Ada', '🦊', false);
  c.profiles.update(existing.id, { cloudUserId: c.user.id });
  const other = c.profiles.create('Ben', '🚀', false);
  await c.db.saveGameSession({ mode: 'practice', score: 40, correct: 1, total: 1, bestStreak: 1 });
  assert.equal((await c.db.signInWithGoogle({ token: 'google-id-token', nonce: 'random-nonce', profileId: other.id })).success, true);
  assert.equal(c.profiles.active().id, existing.id);
  assert.equal(c.uploads.size, 0);
  c.profiles.select(other.id);
  assert.equal((await c.db.getStats()).totalScore, 40);
  assert.equal(c.db.isClaimed(), false);
});

test('verified profiles retry stable game IDs and preserve imported aggregate counts', async () => {
  const c = client({ failUpload: true, googleReturn: true });
  c.localStorage.setItem('geowars-stats', JSON.stringify({ played: 7, totalScore: 700, totalCorrect: 10, bestStreak: 3 }));
  const first = c.profiles.create('Ada', '🦊', true);
  c.localStorage.setItem('earthling-google-signin', JSON.stringify({ profileId: first.id }));
  await c.db.init();
  assert.equal(c.db.isClaimed(), true);
  assert.equal(c.uploads.size, 1);
  assert.equal([...c.uploads.values()][0].imported_games, 7);
  c.allowUploads();
  c.advance(60001);
  await c.db.syncProgress();
  assert.equal(c.uploads.size, 1, 'retry uses the same game ID');
  assert.equal(c.attempted(), 2);
  assert.equal(JSON.parse(c.localStorage.getItem(c.profiles.storageKey('geowars-session-queue'))).length, 0);
  const second = c.profiles.create('Ben', '🚀', false);
  assert.equal(c.db.isClaimed(), false, 'another local profile cannot use Ada’s cloud session');
  await c.db.saveGameSession({ mode: 'practice', score: 50, correct: 1, total: 1, bestStreak: 1 });
  assert.equal(c.uploads.size, 1);
  c.profiles.select(first.id);
  assert.equal(c.db.isClaimed(), true);
  assert.notEqual(first.id, second.id);
});

test('frequent progress updates are batched and queued records are retained until a flush', async () => {
  const c = client({ restoredSession: true });
  await c.db.init();
  for (let i = 0; i < 31; i++) {
    await c.db.saveGameSession({ mode: 'practice', score: 3, correct: 1, total: 1, bestStreak: 1 });
    await c.db.syncProgress();
  }
  assert.equal(c.attempted(), 0);
  assert.equal(JSON.parse(c.localStorage.getItem(c.profiles.storageKey('geowars-session-queue'))).length, 31);
  c.advance(5001);
  await c.db.syncProgress();
  assert.equal(c.attempted(), 30);
  assert.equal(JSON.parse(c.localStorage.getItem(c.profiles.storageKey('geowars-session-queue'))).length, 1);
  c.advance(5001);
  await c.db.syncProgress();
  assert.equal(c.attempted(), 31);
  assert.equal(JSON.parse(c.localStorage.getItem(c.profiles.storageKey('geowars-session-queue'))).length, 0);
});
