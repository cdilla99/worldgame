import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

process.env.NODE_ENV = 'development';
const source = await readFile(new URL('../src/core/state.js', import.meta.url), 'utf8');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const store = await import(moduleUrl);

// Property: State mutations through setState only
// **Validates: Requirements 2.1**
const seed = 0x5E7A7E;
let randomState = seed;
function random() {
  randomState = (randomState * 1664525 + 1013904223) >>> 0;
  return randomState / 0x100000000;
}

function integer(max) {
  return Math.floor(random() * max);
}

function randomText(prefix) {
  return `${prefix}-${integer(1_000_000)}`;
}

const generators = {
  mode: () => ['sprint', 'showoff'][integer(2)],
  difficulty: () => ['all', 'easy', 'medium', 'hard'][integer(4)],
  continent: () => ['all', 'Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'][integer(7)],
  deck: () => Array.from({ length: integer(5) }, (_, index) => ({ id: integer(500), name: randomText(`card-${index}`) })),
  currentCard: () => random() < 0.25 ? null : { id: integer(500), name: randomText('current'), metadata: { stars: integer(6) } },
  score: () => integer(100_000),
  streak: () => integer(100),
  bestStreak: () => integer(100),
  timeRemaining: () => integer(601),
  timerPaused: () => random() < 0.5,
  hintsUsed: () => ({ flag: random() < 0.5, region: random() < 0.5 }),
  roundHistory: () => Array.from({ length: integer(5) }, () => ({ correct: random() < 0.5, points: integer(20) })),
  player: () => random() < 0.25 ? null : { id: randomText('player'), profile: { displayName: randomText('name') } },
  isOnline: () => random() < 0.5
};
const keys = Object.keys(generators);

function clone(value) {
  return structuredClone(value);
}

function generateUpdates() {
  const available = [...keys];
  const updates = {};
  const count = 1 + integer(available.length);
  for (let index = 0; index < count; index += 1) {
    const selected = integer(available.length);
    const key = available.splice(selected, 1)[0];
    updates[key] = generators[key]();
  }
  return updates;
}

function attemptUnauthorizedMutations(snapshot) {
  const scoreBefore = store.getState().score;
  assert.throws(() => { store.state.score = scoreBefore + 1; }, TypeError);
  assert.throws(() => { delete store.state.score; }, TypeError);
  assert.throws(() => { snapshot.score = scoreBefore + 1; }, TypeError);
  assert.throws(() => { store.state.hintsUsed.flag = !store.state.hintsUsed.flag; }, TypeError);
  assert.throws(() => { snapshot.hintsUsed.flag = !snapshot.hintsUsed.flag; }, TypeError);
  assert.deepEqual(store.getState(), snapshot, 'direct and snapshot mutations must leave state unchanged');
}

const iterations = 250;
for (let iteration = 0; iteration < iterations; iteration += 1) {
  const before = store.getState();
  try {
    attemptUnauthorizedMutations(before);

    const updates = generateUpdates();
    const expectedUpdates = clone(updates);
    const expected = { ...before, ...expectedUpdates };
    const after = store.setState(updates);

    assert.deepEqual(after, expected, 'setState must apply exactly the generated update');
    assert.deepEqual(store.getState(), expected, 'setState must be the observable mutation path');
    for (const key of keys) {
      if (!(key in updates)) {
        assert.deepEqual(after[key], before[key], `setState must preserve untouched key ${key}`);
      }
    }

    for (const value of Object.values(updates)) {
      if (Array.isArray(value)) value.push({ mutated: true });
      else if (value && typeof value === 'object') value.externalMutation = true;
    }
    assert.deepEqual(store.getState(), expected, 'caller-owned update objects must not mutate stored state');
    attemptUnauthorizedMutations(store.getState());
  } catch (error) {
    error.message = `Property failed (seed=${seed}, iteration=${iteration}): ${error.message}`;
    throw error;
  }
}

console.log(`state immutability property passed (${iterations} generated updates, seed=${seed})`);
