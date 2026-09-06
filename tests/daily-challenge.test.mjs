import assert from 'node:assert/strict';
import test from 'node:test';

// daily-challenge.js reads localStorage and Date.now from scope; install stubs
// on globalThis before importing (module assigns to module.exports too).

function installStubs() {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); }
  };
  // Fixed local noon so day-key math is stable regardless of the host timezone.
  let clock = new Date(2026, 8, 6, 12, 0, 0).getTime(); // 2026-09-06 local
  const realNow = Date.now;
  Date.now = () => clock;
  return {
    set(ms) { clock = ms; },
    advanceDays(days) { clock += days * 24 * 60 * 60 * 1000; },
    restore() { Date.now = realNow; }
  };
}

const clock = installStubs();
const daily = (await import('../daily-challenge.js')).default;

const IDS = Array.from({ length: 50 }, (_, i) => i + 1);

test('selectDailySet is deterministic within a day and changes across days', () => {
  const a = daily.selectDailySet(IDS, 10);
  const b = daily.selectDailySet(IDS, 10);
  assert.equal(a.length, 10);
  assert.deepEqual(a, b, 'same day yields the same set');
  assert.ok(a.every((id) => IDS.includes(id)), 'picks come from the supplied pool');
  assert.equal(new Set(a).size, a.length, 'no duplicate picks');

  clock.advanceDays(1);
  const tomorrow = daily.selectDailySet(IDS, 10);
  assert.notDeepEqual(a, tomorrow, 'a new day yields a different set');
  clock.advanceDays(-1);
});

test('selectDailySet is safe on empty pool or zero size', () => {
  assert.deepEqual(daily.selectDailySet([], 10), []);
  assert.deepEqual(daily.selectDailySet(IDS, 0), []);
});

test('recordCompletion marks today done and starts a streak', () => {
  daily.reset();
  assert.equal(daily.isCompletedToday(), false);
  assert.deepEqual(daily.getStreak(), { streak: 0 });

  const result = daily.recordCompletion({ score: 120, correct: 8, total: 10 });
  assert.equal(result.streak, 1);
  assert.equal(result.alreadyDone, false);
  assert.equal(daily.isCompletedToday(), true);
  assert.deepEqual(daily.getStreak(), { streak: 1 });
});

test('recordCompletion is idempotent on the same day', () => {
  daily.reset();
  daily.recordCompletion({ score: 100, correct: 7, total: 10 });
  const again = daily.recordCompletion({ score: 130, correct: 9, total: 10 });
  assert.equal(again.streak, 1, 'streak does not double-count the same day');
  assert.equal(again.alreadyDone, true);
});

test('consecutive days extend the streak; a gap resets it', () => {
  daily.reset();
  daily.recordCompletion({ score: 100, correct: 7, total: 10 }); // day 1 -> streak 1
  clock.advanceDays(1);
  const day2 = daily.recordCompletion({ score: 110, correct: 8, total: 10 });
  assert.equal(day2.streak, 2, 'a next-day completion extends the streak');

  clock.advanceDays(2); // skip a day
  assert.deepEqual(daily.getStreak(), { streak: 0 }, 'a missed day lapses the streak');
  const afterGap = daily.recordCompletion({ score: 90, correct: 6, total: 10 });
  assert.equal(afterGap.streak, 1, 'the streak restarts at 1 after a gap');
});

test('getStreak stays live the day after completion but not longer', () => {
  daily.reset();
  daily.recordCompletion({ score: 100, correct: 7, total: 10 });
  clock.advanceDays(1);
  assert.deepEqual(daily.getStreak(), { streak: 1 }, 'yesterday counts as still-live');
  assert.equal(daily.isCompletedToday(), false, 'but today is not yet completed');
});

test.after(() => clock.restore());
