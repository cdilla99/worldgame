import assert from 'node:assert/strict';
import { EventBus } from '../src/core/events.js';
import { createTimer, TIMER_DURATIONS } from '../src/features/timer/index.js';

const tests = [];
function test(name, run) { tests.push({ name, run }); }

function createFakeClock() {
  let nextId = 1;
  const intervals = new Map();
  const cleared = [];
  return {
    intervals,
    cleared,
    setInterval(callback, milliseconds) {
      const id = nextId++;
      intervals.set(id, { callback, milliseconds });
      return id;
    },
    clearInterval(id) {
      cleared.push(id);
      intervals.delete(id);
    },
    advance(seconds = 1) {
      for (let second = 0; second < seconds; second += 1) {
        for (const { callback } of [...intervals.values()]) callback();
      }
    }
  };
}

function setup() {
  const events = new EventBus();
  const clock = createFakeClock();
  const timer = createTimer({ events, clock });
  return { events, clock, timer };
}

test('exports the configured duration for every timer mode', () => {
  assert.deepEqual(TIMER_DURATIONS, { blitz: 60, sprint: 120, zen: null });
  assert.ok(Object.isFrozen(TIMER_DURATIONS));
});

test('subscribes to all game lifecycle events', () => {
  const { events, timer } = setup();
  for (const name of ['game:start', 'game:pause', 'game:resume', 'game:end']) {
    assert.equal(events.handlerCount(name), 1, `subscribed to ${name}`);
  }
  timer.dispose();
});

test('game:start initializes blitz and emits a tick after one second', () => {
  const { events, clock, timer } = setup();
  const ticks = [];
  events.on('timer:tick', payload => ticks.push(payload));
  events.emit('game:start', { mode: 'blitz' });

  assert.equal(timer.getState().remaining, 60);
  assert.notEqual(timer.getState().timer, null);
  assert.equal([...clock.intervals.values()][0].milliseconds, 1000);
  clock.advance();
  assert.equal(timer.getState().remaining, 59);
  assert.deepEqual(ticks, [{ remaining: 59 }]);
  timer.dispose();
});

test('game:start initializes sprint at 120 and emits decreasing ticks', () => {
  const { events, clock, timer } = setup();
  const ticks = [];
  events.on('timer:tick', ({ remaining }) => ticks.push(remaining));
  events.emit('game:start', { mode: 'sprint' });
  clock.advance(3);
  assert.equal(timer.getState().remaining, 117);
  assert.deepEqual(ticks, [119, 118, 117]);
  timer.dispose();
});

test('game:start initializes zen without scheduling a countdown', () => {
  const { events, clock, timer } = setup();
  events.emit('game:start', { mode: 'zen' });
  assert.deepEqual(timer.getState(), { timer: null, remaining: null });
  assert.equal(clock.intervals.size, 0);
  timer.dispose();
});

test('starting a new game replaces the existing countdown', () => {
  const { events, clock, timer } = setup();
  events.emit('game:start', { mode: 'blitz' });
  const firstTimer = timer.getState().timer;
  events.emit('game:start', { mode: 'sprint' });
  assert.deepEqual(clock.cleared, [firstTimer]);
  assert.equal(clock.intervals.size, 1);
  assert.equal(timer.getState().remaining, 120);
  timer.dispose();
});

test('the countdown emits medium and high warnings only at their specified times', () => {
  const { events, clock, timer } = setup();
  const warnings = [];
  events.on('timer:warning', (payload) => {
    warnings.push({ remaining: timer.getState().remaining, payload });
  });

  events.emit('game:start', { mode: 'blitz' });
  clock.advance(60);

  assert.deepEqual(warnings, [
    { remaining: 9, payload: { level: 'medium' } },
    { remaining: 8, payload: { level: 'medium' } },
    { remaining: 7, payload: { level: 'medium' } },
    { remaining: 6, payload: { level: 'medium' } },
    { remaining: 5, payload: { level: 'high' } },
    { remaining: 4, payload: { level: 'high' } },
    { remaining: 3, payload: { level: 'high' } },
    { remaining: 2, payload: { level: 'high' } },
    { remaining: 1, payload: { level: 'high' } },
    { remaining: 0, payload: { level: 'high' } }
  ]);
  timer.dispose();
});

test('the countdown emits zero, high warning, and expiration in order exactly once', () => {
  const { events, clock, timer } = setup();
  const emitted = [];
  const ticks = [];
  events.on('timer:tick', ({ remaining }) => {
    ticks.push(remaining);
    if (remaining === 0) emitted.push('tick:0');
  });
  events.on('timer:warning', ({ level }) => {
    if (timer.getState().remaining === 0) emitted.push(`warning:${level}`);
  });
  events.on('timer:expired', (payload) => emitted.push({ event: 'expired', payload }));

  events.emit('game:start', { mode: 'blitz' });
  clock.advance(61);

  assert.equal(timer.getState().remaining, 0);
  assert.equal(timer.getState().timer, null);
  assert.equal(clock.intervals.size, 0);
  assert.equal(ticks.length, 60);
  assert.equal(ticks.at(-1), 0);
  assert.deepEqual(emitted, [
    'tick:0',
    'warning:high',
    { event: 'expired', payload: {} }
  ]);
  timer.dispose();
});

test('game:pause stops the interval and preserves remaining time', () => {
  const { events, clock, timer } = setup();
  const ticks = [];
  events.on('timer:tick', ({ remaining }) => ticks.push(remaining));

  events.emit('game:start', { mode: 'blitz' });
  clock.advance(7);
  const activeTimer = timer.getState().timer;
  events.emit('game:pause');

  assert.deepEqual(timer.getState(), { timer: null, remaining: 53 });
  assert.deepEqual(clock.cleared, [activeTimer]);
  clock.advance(5);
  assert.equal(timer.getState().remaining, 53);
  assert.equal(ticks.length, 7);
  timer.dispose();
});

test('game:resume restarts one interval from the preserved time', () => {
  const { events, clock, timer } = setup();
  events.emit('game:start', { mode: 'sprint' });
  clock.advance(4);
  const originalTimer = timer.getState().timer;
  events.emit('game:pause');
  events.emit('game:resume');

  const resumedTimer = timer.getState().timer;
  assert.notEqual(resumedTimer, null);
  assert.notEqual(resumedTimer, originalTimer);
  assert.equal(timer.getState().remaining, 116);
  assert.equal(clock.intervals.size, 1);

  events.emit('game:resume');
  assert.equal(clock.intervals.size, 1, 'repeated resume must not create another interval');
  clock.advance(2);
  assert.equal(timer.getState().remaining, 114);
  timer.dispose();
});

test('game:end clears the interval, resets state, and prevents a later resume', () => {
  const { events, clock, timer } = setup();
  events.emit('game:start', { mode: 'blitz' });
  clock.advance(3);
  const activeTimer = timer.getState().timer;
  events.emit('game:end');

  assert.deepEqual(timer.getState(), { timer: null, remaining: null });
  assert.deepEqual(clock.cleared, [activeTimer]);
  assert.equal(clock.intervals.size, 0);

  events.emit('game:resume');
  clock.advance(5);
  assert.deepEqual(timer.getState(), { timer: null, remaining: null });
  assert.equal(clock.intervals.size, 0);
  timer.dispose();
});

test('dispose clears the countdown and all lifecycle subscriptions', () => {
  const { events, clock, timer } = setup();
  events.emit('game:start', { mode: 'blitz' });
  timer.dispose();
  assert.equal(clock.intervals.size, 0);
  for (const name of ['game:start', 'game:pause', 'game:resume', 'game:end']) {
    assert.equal(events.handlerCount(name), 0, `unsubscribed from ${name}`);
  }
});

test('factory rejects invalid dependencies and direct start rejects unknown modes', () => {
  assert.throws(() => createTimer({ events: {} }), TypeError);
  assert.throws(() => createTimer({ clock: {} }), TypeError);
  const { timer } = setup();
  assert.throws(() => timer.start('marathon'), RangeError);
  timer.dispose();
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

console.log(`timer unit tests passed (${passed}/${tests.length})`);
