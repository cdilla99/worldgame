import assert from 'node:assert/strict';
import test from 'node:test';

// The module assigns to module.exports (Node) and window.GeoWarsLearning (browser).
// It reads localStorage and Date.now from the surrounding scope, so we install
// in-memory stubs on globalThis before importing.

function installStubs() {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); }
  };
  let clock = 1_000_000_000_000; // fixed epoch
  const realNow = Date.now;
  Date.now = () => clock;
  return {
    advanceDays(days) { clock += days * 24 * 60 * 60 * 1000; },
    store: map,
    restore() { Date.now = realNow; }
  };
}

const clock = installStubs();
const learning = (await import('../learning-progress.js')).default;

test('record promotes correct answers up the Leitner boxes and schedules review', () => {
  learning.reset();
  const first = learning.record(1, true);
  assert.equal(first.seen, 1);
  assert.equal(first.correct, 1);
  assert.equal(first.box, 1, 'a correct answer moves to box 1');
  assert.ok(first.due > Date.now(), 'next review is scheduled in the future');

  const missed = learning.record(1, false);
  assert.equal(missed.box, 0, 'a miss resets to box 0');
  assert.equal(missed.seen, 2);
  assert.equal(missed.correct, 1, 'correct count is unchanged by a miss');
});

test('record rejects non-numeric ids without throwing', () => {
  learning.reset();
  assert.equal(learning.record(undefined, true), null);
  assert.equal(learning.record('nope', true), null);
});

test('getSummary counts seen, learning, mastered, and due across a universe', () => {
  learning.reset();
  const ids = [1, 2, 3, 4, 5];

  // Country 1: answer correctly enough times to reach the mastered box.
  for (let i = 0; i < learning.MASTERED_BOX; i++) {
    learning.record(1, true);
    clock.advanceDays(60); // let each review come due before the next
  }
  // Country 2: seen once but still learning.
  learning.record(2, true);

  const summary = learning.getSummary(ids, { groupOf: (id) => (id <= 2 ? 'Europe' : 'Asia') });
  assert.equal(summary.total, 5);
  assert.equal(summary.seen, 2);
  assert.equal(summary.mastered, 1, 'country 1 reached the mastered box');
  assert.equal(summary.learning, 1, 'country 2 is in progress');
  assert.equal(summary.groups.Europe.total, 2);
  assert.equal(summary.groups.Europe.mastered, 1);
  assert.equal(summary.groups.Asia.total, 3);
  assert.equal(summary.groups.Asia.mastered, 0);
});

test('selectStudyBatch prioritizes due countries, then unseen, capped at size', () => {
  learning.reset();
  const ids = [10, 11, 12, 13];

  // 10 and 11 become due (answered, then time passes well beyond box 1).
  learning.record(10, true);
  learning.record(11, true);
  clock.advanceDays(10);
  // 12 answered but NOT yet due (just answered now, box 1 = 1 day out).
  learning.record(12, true);
  // 13 never seen.

  const batch = learning.selectStudyBatch(ids, 3);
  assert.equal(batch.length, 3, 'respects the size cap');
  assert.ok(batch.includes(10) && batch.includes(11), 'due countries are included');
  assert.ok(batch.includes(13), 'an unseen country fills remaining slots');
  assert.ok(!batch.includes(12), 'a not-yet-due country is skipped');
});

test('selectStudyBatch and getSummary are safe on empty input', () => {
  learning.reset();
  assert.deepEqual(learning.selectStudyBatch([], 5), []);
  assert.deepEqual(learning.selectStudyBatch([1, 2], 0), []);
  const summary = learning.getSummary([], {});
  assert.equal(summary.total, 0);
  assert.equal(summary.mastered, 0);
  assert.deepEqual(summary.groups, {});
});

test.after(() => clock.restore());
