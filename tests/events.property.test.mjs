import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/core/events.js', import.meta.url), 'utf8');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const { EventBus } = await import(moduleUrl);

const seed = 0xE71B05;
let randomState = seed;
function random() {
  randomState = (randomState * 1664525 + 1013904223) >>> 0;
  return randomState / 0x100000000;
}

function integer(min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

function token(prefix = 'event') {
  return `${prefix}-${integer(0, 0xFFFFFF).toString(36)}`;
}

function runProperty(name, iterations, generate, verify) {
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const input = generate();
    try {
      verify(input);
    } catch (error) {
      error.message = `${name} failed (seed=${seed}, iteration=${iteration}, input=${JSON.stringify(input)}): ${error.message}`;
      throw error;
    }
  }
  console.log(`${name} passed (${iterations} cases, seed=${seed})`);
}

const iterations = 250;

// Property 3: Handler invocation order
// **Validates: Requirements 14.1, 14.2, 14.7**
runProperty(
  'Property 3: Handler invocation order',
  iterations,
  () => Array.from({ length: integer(1, 40) }, (_, id) => ({
    id,
    event: random() < 0.5 ? 'timer:tick' : 'timer:*'
  })),
  (registrations) => {
    const bus = new EventBus();
    const calls = [];
    for (const registration of registrations) {
      bus.on(registration.event, () => calls.push(registration.id));
    }
    bus.emit('timer:tick', { remaining: integer(0, 60) });
    assert.deepEqual(calls, registrations.map(({ id }) => id));
  }
);

// Property 4: Handler removal prevents invocation
// **Validates: Requirements 14.3**
runProperty(
  'Property 4: Handler removal prevents invocation',
  iterations,
  () => {
    const suffix = token('removed');
    const wildcard = random() < 0.5;
    return {
      registeredEvent: wildcard ? 'timer:*' : `timer:${suffix}`,
      emittedEvent: `timer:${suffix}`,
      payload: { value: integer(-1000, 1000) }
    };
  },
  ({ registeredEvent, emittedEvent, payload }) => {
    const bus = new EventBus();
    let calls = 0;
    const handler = () => { calls += 1; };
    bus.on(registeredEvent, handler);
    assert.equal(bus.off(registeredEvent, handler), true);
    bus.emit(emittedEvent, payload);
    assert.equal(calls, 0);
  }
);

// Property 5: Once handlers fire exactly once
// **Validates: Requirements 14.4**
runProperty(
  'Property 5: Once handlers fire exactly once',
  iterations,
  () => ({
    wildcard: random() < 0.5,
    emissions: integer(1, 50)
  }),
  ({ wildcard, emissions }) => {
    const bus = new EventBus();
    let calls = 0;
    bus.once(wildcard ? 'timer:*' : 'timer:tick', () => { calls += 1; });
    for (let index = 0; index < emissions; index += 1) {
      bus.emit(index % 2 === 0 ? 'timer:tick' : 'timer:warning', { index });
    }
    assert.equal(calls, 1);
  }
);

// Property 6: Error isolation between handlers
// **Validates: Requirements 14.5**
runProperty(
  'Property 6: Error isolation between handlers',
  iterations,
  () => {
    const count = integer(2, 40);
    return { count, throwingIndex: integer(0, count - 1) };
  },
  ({ count, throwingIndex }) => {
    const bus = new EventBus();
    const calls = [];
    const originalError = console.error;
    console.error = () => {};
    try {
      for (let id = 0; id < count; id += 1) {
        bus.on(id % 2 === 0 ? 'timer:tick' : 'timer:*', () => {
          if (id === throwingIndex) throw new Error(`generated failure ${id}`);
          calls.push(id);
        });
      }
      assert.doesNotThrow(() => bus.emit('timer:tick'));
      assert.deepEqual(
        calls,
        Array.from({ length: count }, (_, id) => id).filter((id) => id !== throwingIndex)
      );
    } finally {
      console.error = originalError;
    }
  }
);

// Property 7: Wildcard pattern matching
// **Validates: Requirements 14.6**
runProperty(
  'Property 7: Wildcard pattern matching',
  iterations,
  () => ({
    timerEvents: Array.from(
      { length: integer(1, 30) },
      () => `timer:${token('signal')}`
    ),
    unrelatedEvents: Array.from(
      { length: integer(0, 10) },
      () => `game:${token('signal')}`
    )
  }),
  ({ timerEvents, unrelatedEvents }) => {
    const bus = new EventBus();
    const matched = [];
    bus.on('timer:*', (payload) => matched.push(payload.event));

    for (const event of timerEvents) bus.emit(event, { event });
    for (const event of unrelatedEvents) bus.emit(event, { event });

    assert.deepEqual(matched, timerEvents);
  }
);

console.log(`EventBus properties 3-7 passed (${iterations * 5} generated cases total)`);