import assert from 'node:assert/strict';
import { EventBus } from '../src/core/events.js';
import { createTimer } from '../src/features/timer/index.js';

function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function createFakeClock() {
  let nextId = 1;
  const intervals = new Map();
  return {
    setInterval(callback) {
      const id = nextId++;
      intervals.set(id, callback);
      return id;
    },
    clearInterval(id) {
      intervals.delete(id);
    },
    advance(seconds) {
      for (let second = 0; second < seconds; second += 1) {
        for (const callback of [...intervals.values()]) callback();
      }
    }
  };
}

function setup() {
  const events = new EventBus();
  const clock = createFakeClock();
  return { events, clock, timer: createTimer({ events, clock }) };
}

function runProperty({ name, seed, cases, generate, verify }) {
  const random = createRandom(seed);
  for (let iteration = 0; iteration < cases; iteration += 1) {
    const input = generate(random);
    try {
      verify(input);
    } catch (error) {
      error.message = `${name} failed (seed=0x${seed.toString(16)}, iteration=${iteration}, input=${JSON.stringify(input)}): ${error.message}`;
      throw error;
    }
  }
  console.log(`${name} passed (${cases} cases, seed=0x${seed.toString(16)})`);
}
const durations = { blitz: 60, sprint: 120, zen: null };
const modes = Object.keys(durations);

// Property 9: Timer initializes with correct duration per mode
// **Validates: Requirements 3.1**
runProperty({
  name: 'Property 9: Timer initializes with correct duration per mode',
  seed: 0x71090301,
  cases: 300,
  generate: random => ({ mode: modes[Math.floor(random() * modes.length)] }),
  verify: ({ mode }) => {
    const { events, timer } = setup();
    try {
      events.emit('game:start', { mode });
      assert.equal(timer.getState().remaining, durations[mode]);
    } finally {
      timer.dispose();
    }
  }
});

// Property 10: Tick events have monotonically decreasing times
// **Validates: Requirements 3.2**
runProperty({
  name: 'Property 10: Tick events have monotonically decreasing times',
  seed: 0x710a0302,
  cases: 300,
  generate: random => {
    const mode = random() < 0.5 ? 'blitz' : 'sprint';
    return { mode, seconds: 1 + Math.floor(random() * durations[mode]) };
  },
  verify: ({ mode, seconds }) => {
    const { events, clock, timer } = setup();
    const ticks = [];
    events.on('timer:tick', ({ remaining }) => ticks.push(remaining));
    try {
      events.emit('game:start', { mode });
      clock.advance(seconds);
      assert.equal(ticks.length, seconds);
      const sequence = [durations[mode], ...ticks];
      for (let index = 1; index < sequence.length; index += 1) {
        assert.ok(
          sequence[index] < sequence[index - 1],
          `remaining time did not decrease at index ${index}: ${JSON.stringify(sequence)}`
        );
      }
    } finally {
      timer.dispose();
    }
  }
});

console.log('Timer properties 9-10 passed (600 generated cases total)');
