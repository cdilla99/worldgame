import assert from 'node:assert/strict';
import { EventBus } from '../src/core/events.js';
import {
  BASE_POINTS,
  MULTIPLIERS,
  calculatePoints,
  createScoring
} from '../src/features/scoring/index.js';

const tests = [];
function test(name, run) { tests.push({ name, run }); }

function setup() {
  const events = new EventBus();
  const scoring = createScoring({ events });
  const updates = [];
  events.on('score:update', update => updates.push(update));
  return { events, scoring, updates };
}

test('exports the configured base points and answer multipliers', () => {
  assert.deepEqual(BASE_POINTS, { easy: 100, medium: 150, hard: 200 });
  assert.deepEqual(MULTIPLIERS, { typed: 3, bail: 2, options: 1 });
  assert.ok(Object.isFrozen(BASE_POINTS));
  assert.ok(Object.isFrozen(MULTIPLIERS));
});

test('calculates base points times the answer multiplier', () => {
  assert.equal(calculatePoints('easy', 'typed'), 300);
  assert.equal(calculatePoints('medium', 'bail'), 300);
  assert.equal(calculatePoints('hard', 'options'), 200);
});

test('subscribes to answer and game-end events', () => {
  const { events, scoring } = setup();
  assert.equal(events.handlerCount('answer:correct'), 1);
  assert.equal(events.handlerCount('answer:incorrect'), 1);
  assert.equal(events.handlerCount('game:end'), 1);
  scoring.dispose();
});

test('game:end emits complete final session statistics', () => {
  const { events, scoring } = setup();
  const finalEvents = [];
  events.on('score:final', stats => finalEvents.push(stats));

  events.emit('answer:correct', { difficulty: 'easy', answerType: 'typed' });
  events.emit('answer:incorrect');
  events.emit('answer:correct', { difficulty: 'hard', answerType: 'bail' });
  events.emit('game:end');

  assert.deepEqual(finalEvents, [{
    totalScore: 700,
    correctCount: 2,
    totalRounds: 3,
    bestStreak: 1
  }]);
  assert.ok(Object.isFrozen(finalEvents[0]));
  scoring.dispose();
});

test('game:end emits zero-valued statistics when no rounds were answered', () => {
  const { events, scoring } = setup();
  const finalEvents = [];
  events.on('score:final', stats => finalEvents.push(stats));

  events.emit('game:end');

  assert.deepEqual(finalEvents, [{
    totalScore: 0,
    correctCount: 0,
    totalRounds: 0,
    bestStreak: 0
  }]);
  scoring.dispose();
});

test('correct answers emit cumulative score, delta, and streak', () => {
  const { events, scoring, updates } = setup();
  events.emit('answer:correct', { difficulty: 'easy', answerType: 'typed' });
  events.emit('answer:correct', { difficulty: 'medium', answerType: 'bail' });
  events.emit('answer:correct', { difficulty: 'hard', answerType: 'options' });

  assert.deepEqual(updates, [
    { score: 300, delta: 300, streak: 1 },
    { score: 600, delta: 300, streak: 2 },
    { score: 800, delta: 200, streak: 3 }
  ]);
  assert.deepEqual(scoring.getState(), { score: 800, streak: 3, bestStreak: 3 });
  assert.ok(updates.every(Object.isFrozen));
  scoring.dispose();
});

test('incorrect answers preserve score, emit zero delta, and reset streak', () => {
  const { events, scoring, updates } = setup();
  events.emit('answer:correct', { difficulty: 'easy', type: 'options' });
  events.emit('answer:incorrect');
  events.emit('answer:correct', { difficulty: 'hard', method: 'bail' });

  assert.deepEqual(updates, [
    { score: 100, delta: 100, streak: 1 },
    { score: 100, delta: 0, streak: 0 },
    { score: 500, delta: 400, streak: 1 }
  ]);
  assert.deepEqual(scoring.getState(), { score: 500, streak: 1, bestStreak: 1 });
  scoring.dispose();
});

test('rejects unsupported scoring values without emitting an update', () => {
  assert.throws(() => calculatePoints('expert', 'typed'), RangeError);
  assert.throws(() => calculatePoints('easy', 'guess'), RangeError);
  assert.throws(() => createScoring({ events: {} }), TypeError);
});

test('emits streak:hot when streak reaches 3 consecutive correct answers', () => {
  const events = new EventBus();
  const scoring = createScoring({ events });
  const hotEvents = [];
  events.on('streak:hot', payload => hotEvents.push(payload));
  
  events.emit('answer:correct', { difficulty: 'easy', answerType: 'typed' });
  events.emit('answer:correct', { difficulty: 'medium', answerType: 'bail' });
  events.emit('answer:correct', { difficulty: 'hard', answerType: 'options' });
  
  assert.deepEqual(hotEvents, [{ streak: 3 }]);
  assert.deepEqual(scoring.getState(), { score: 800, streak: 3, bestStreak: 3 });
  scoring.dispose();
});

test('emits streak:reset with previous streak on incorrect answer', () => {
  const events = new EventBus();
  const scoring = createScoring({ events });
  const resetEvents = [];
  events.on('streak:reset', payload => resetEvents.push(payload));
  
  events.emit('answer:correct', { difficulty: 'easy', answerType: 'typed' });
  events.emit('answer:correct', { difficulty: 'medium', answerType: 'bail' });
  events.emit('answer:incorrect');
  
  assert.deepEqual(resetEvents, [{ previousStreak: 2 }]);
  assert.deepEqual(scoring.getState(), { score: 600, streak: 0, bestStreak: 2 });
  scoring.dispose();
});

test('bestStreak tracks maximum streak achieved in session', () => {
  const events = new EventBus();
  const scoring = createScoring({ events });
  
  events.emit('answer:correct', { difficulty: 'easy', answerType: 'typed' });
  events.emit('answer:correct', { difficulty: 'medium', answerType: 'bail' });
  events.emit('answer:incorrect');
  events.emit('answer:correct', { difficulty: 'easy', answerType: 'options' });
  events.emit('answer:correct', { difficulty: 'medium', answerType: 'typed' });
  events.emit('answer:correct', { difficulty: 'hard', answerType: 'bail' });
  events.emit('answer:correct', { difficulty: 'easy', answerType: 'options' });
  
  // Max streak was 2, then reset, then built to 4
  assert.deepEqual(scoring.getState(), { score: 1650, streak: 4, bestStreak: 4 });
  scoring.dispose();
});

test('bestStreak is preserved across streak resets', () => {
  const events = new EventBus();
  const scoring = createScoring({ events });
  
  events.emit('answer:correct', { difficulty: 'easy', answerType: 'typed' });
  events.emit('answer:correct', { difficulty: 'easy', answerType: 'typed' });
  events.emit('answer:incorrect');
  
  assert.deepEqual(scoring.getState(), { score: 600, streak: 0, bestStreak: 2 });
  
  events.emit('answer:correct', { difficulty: 'easy', answerType: 'typed' });
  events.emit('answer:correct', { difficulty: 'easy', answerType: 'typed' });
  events.emit('answer:correct', { difficulty: 'easy', answerType: 'typed' });
  
  // New streak of 3, best streak updates to 3
  assert.deepEqual(scoring.getState(), { score: 1500, streak: 3, bestStreak: 3 });
  scoring.dispose();
});

test('streak:hot only fires once per streak (not on every answer >= 3)', () => {
  const events = new EventBus();
  const scoring = createScoring({ events });
  const hotEvents = [];
  events.on('streak:hot', payload => hotEvents.push(payload));
  
  events.emit('answer:correct', { difficulty: 'easy', answerType: 'typed' });
  events.emit('answer:correct', { difficulty: 'easy', answerType: 'typed' });
  events.emit('answer:correct', { difficulty: 'easy', answerType: 'typed' });
  events.emit('answer:correct', { difficulty: 'easy', answerType: 'typed' });
  events.emit('answer:correct', { difficulty: 'easy', answerType: 'typed' });
  
  // Only one hot event when streak reaches 3
  assert.deepEqual(hotEvents, [{ streak: 3 }]);
  assert.deepEqual(scoring.getState(), { score: 1500, streak: 5, bestStreak: 5 });
  scoring.dispose();
});

test('streak:reset only fires when streak was positive (not on initial incorrect)', () => {
  const events = new EventBus();
  const scoring = createScoring({ events });
  const resetEvents = [];
  events.on('streak:reset', payload => resetEvents.push(payload));
  
  events.emit('answer:incorrect');
  events.emit('answer:correct', { difficulty: 'easy', answerType: 'typed' });
  events.emit('answer:incorrect');
  
  // Only one reset event (after the streak of 1)
  assert.deepEqual(resetEvents, [{ previousStreak: 1 }]);
  assert.deepEqual(scoring.getState(), { score: 300, streak: 0, bestStreak: 1 });
  scoring.dispose();
});

test('dispose removes all scoring subscriptions', () => {
  const { events, scoring, updates } = setup();
  const finalEvents = [];
  events.on('score:final', stats => finalEvents.push(stats));
  scoring.dispose();
  scoring.dispose();
  events.emit('answer:correct', { difficulty: 'easy', answerType: 'typed' });
  events.emit('answer:incorrect');
  events.emit('game:end');
  assert.deepEqual(updates, []);
  assert.deepEqual(finalEvents, []);
  assert.equal(events.handlerCount('answer:correct'), 0);
  assert.equal(events.handlerCount('answer:incorrect'), 0);
  assert.equal(events.handlerCount('game:end'), 0);
});

let passed = 0;
for (const { name, run } of tests) {
  try {
    await run();
    passed += 1;
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  }
}

console.log(`scoring unit tests passed (${passed}/${tests.length})`);
