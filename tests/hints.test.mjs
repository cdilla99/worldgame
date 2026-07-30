import assert from 'node:assert/strict';
import { EventBus } from '../src/core/events.js';
import {
  HINT_TYPES,
  createHints,
  hints
} from '../src/features/hints/index.js';

class FakeButton {
  constructor() {
    this.listeners = new Map();
    this.attributes = new Map();
    this.disabled = false;
  }
  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) ?? [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }
  removeEventListener(type, handler) {
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter(item => item !== handler));
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  click() {
    for (const handler of [...(this.listeners.get('click') ?? [])]) handler({ type: 'click' });
  }
}

function setup() {
  const events = new EventBus();
  const flagButton = new FakeButton();
  const regionButton = new FakeButton();
  const feature = createHints({ events, flagButton, regionButton });
  const reveals = [];
  events.on('hint:reveal', payload => reveals.push(payload));
  return { events, feature, flagButton, regionButton, reveals };
}

const tests = [];
function test(name, run) { tests.push({ name, run }); }

function assertAvailable(button) {
  assert.equal(button.disabled, false);
  assert.equal(button.getAttribute('aria-disabled'), 'false');
  assert.equal(button.getAttribute('aria-pressed'), 'false');
}

function assertConsumed(button) {
  assert.equal(button.disabled, true);
  assert.equal(button.getAttribute('aria-disabled'), 'true');
  assert.equal(button.getAttribute('aria-pressed'), 'true');
}

test('exports supported types and initializes both buttons as available', () => {
  const { feature, flagButton, regionButton } = setup();
  assert.deepEqual(HINT_TYPES, ['flag', 'region']);
  assert.ok(Object.isFrozen(HINT_TYPES));
  assert.deepEqual(feature.getState(), { flagUsed: false, regionUsed: false });
  assert.ok(Object.isFrozen(feature.getState()));
  assertAvailable(flagButton);
  assertAvailable(regionButton);
  feature.dispose();
});

test('button clicks consume and disable each hint independently', () => {
  const { feature, flagButton, regionButton, reveals } = setup();
  flagButton.click();
  flagButton.click();
  assert.deepEqual(reveals, [{ type: 'flag' }]);
  assert.deepEqual(feature.getState(), { flagUsed: true, regionUsed: false });
  assertConsumed(flagButton);
  assertAvailable(regionButton);

  regionButton.click();
  regionButton.click();
  assert.deepEqual(reveals, [{ type: 'flag' }, { type: 'region' }]);
  assert.deepEqual(feature.getState(), { flagUsed: true, regionUsed: true });
  assertConsumed(regionButton);
  assert.ok(reveals.every(Object.isFrozen));
  feature.dispose();
});

test('reveal updates button state for explicit callers', () => {
  const { feature, flagButton, regionButton, reveals } = setup();
  assert.deepEqual(feature.reveal('region'), { type: 'region' });
  assert.equal(feature.reveal('region'), null);
  assertConsumed(regionButton);
  assertAvailable(flagButton);
  assert.deepEqual(feature.reveal('flag'), { type: 'flag' });
  assertConsumed(flagButton);
  assert.deepEqual(reveals, [{ type: 'region' }, { type: 'flag' }]);
  assert.throws(() => feature.reveal('capital'), RangeError);
  feature.dispose();
});

test('round:start resets state, re-enables buttons, and permits both hints again', () => {
  const { events, feature, flagButton, regionButton, reveals } = setup();
  flagButton.click();
  regionButton.click();
  assertConsumed(flagButton);
  assertConsumed(regionButton);

  events.emit('round:start', { round: 2 });
  assert.deepEqual(feature.getState(), { flagUsed: false, regionUsed: false });
  assertAvailable(flagButton);
  assertAvailable(regionButton);

  flagButton.click();
  regionButton.click();
  assert.deepEqual(reveals, [
    { type: 'flag' }, { type: 'region' },
    { type: 'flag' }, { type: 'region' }
  ]);
  feature.dispose();
});

test('dispose removes click and round subscriptions and is idempotent', () => {
  const { events, feature, flagButton, regionButton, reveals } = setup();
  assert.equal(flagButton.listeners.get('click').length, 1);
  assert.equal(regionButton.listeners.get('click').length, 1);
  assert.equal(events.handlerCount('round:start'), 1);
  feature.dispose();
  feature.dispose();
  assert.equal(flagButton.listeners.get('click').length, 0);
  assert.equal(regionButton.listeners.get('click').length, 0);
  assert.equal(events.handlerCount('round:start'), 0);
  flagButton.click();
  regionButton.click();
  events.emit('round:start');
  assert.equal(feature.reveal('flag'), null);
  assert.deepEqual(reveals, []);
  assert.deepEqual(feature.getState(), { flagUsed: false, regionUsed: false });
});

test('rejects invalid event and button dependencies', () => {
  const button = new FakeButton();
  assert.throws(
    () => createHints({ events: {}, flagButton: button, regionButton: button }),
    TypeError
  );
  assert.throws(
    () => createHints({ events: { emit() {} }, flagButton: button, regionButton: button }),
    TypeError
  );
  assert.throws(
    () => createHints({ events: new EventBus(), flagButton: {}, regionButton: button }),
    TypeError
  );
});

test('does not bind a default instance when hint buttons are unavailable', () => {
  assert.equal(hints, null);
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

console.log(`hints unit tests passed (${passed}/${tests.length})`);