import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/core/events.js', import.meta.url), 'utf8');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const { EventBus, eventBus, default: defaultBus } = await import(moduleUrl);

const tests = [];
function test(name, run) { tests.push({ name, run }); }

test('emit passes the supplied payload to an exact handler', () => {
  const bus = new EventBus();
  const payload = { remaining: 10 };
  let received;
  bus.on('timer:tick', (value) => { received = value; });
  bus.emit('timer:tick', payload);
  assert.strictEqual(received, payload);
});

test('emit supplies an empty object when payload is omitted', () => {
  const bus = new EventBus();
  let received;
  bus.on('game:start', (value) => { received = value; });
  bus.emit('game:start');
  assert.deepEqual(received, {});
});

test('emit invokes every handler registered for the event', () => {
  const bus = new EventBus();
  const calls = [];
  bus.on('round:start', () => calls.push(1));
  bus.on('round:start', () => calls.push(2));
  bus.emit('round:start');
  assert.deepEqual(calls, [1, 2]);
});

test('emit does not invoke handlers for unrelated events', () => {
  const bus = new EventBus();
  let calls = 0;
  bus.on('game:end', () => { calls += 1; });
  bus.emit('game:start');
  assert.equal(calls, 0);
});

test('exact handlers retain registration order', () => {
  const bus = new EventBus();
  const calls = [];
  for (let index = 0; index < 5; index += 1) bus.on('score:update', () => calls.push(index));
  bus.emit('score:update');
  assert.deepEqual(calls, [0, 1, 2, 3, 4]);
});

test('exact and wildcard handlers share global registration order', () => {
  const bus = new EventBus();
  const calls = [];
  bus.on('timer:*', () => calls.push('wildcard-first'));
  bus.on('timer:tick', () => calls.push('exact'));
  bus.on('*:tick', () => calls.push('wildcard-last'));
  bus.emit('timer:tick');
  assert.deepEqual(calls, ['wildcard-first', 'exact', 'wildcard-last']);
});

test('timer:* matches timer:tick and timer:warning', () => {
  const bus = new EventBus();
  const calls = [];
  bus.on('timer:*', (payload) => calls.push(payload));
  bus.emit('timer:tick', 'tick');
  bus.emit('timer:warning', 'warning');
  assert.deepEqual(calls, ['tick', 'warning']);
});

test('timer:* does not match a different namespace', () => {
  const bus = new EventBus();
  let calls = 0;
  bus.on('timer:*', () => { calls += 1; });
  bus.emit('game:tick');
  assert.equal(calls, 0);
});

test('wildcards are supported at multiple pattern positions', () => {
  const bus = new EventBus();
  const calls = [];
  bus.on('*:warning', () => calls.push('suffix'));
  bus.on('asset:*:failed', () => calls.push('middle'));
  bus.emit('timer:warning');
  bus.emit('asset:flag:failed');
  assert.deepEqual(calls, ['suffix', 'middle']);
});

test('non-wildcard regular-expression characters are matched literally', () => {
  const bus = new EventBus();
  let calls = 0;
  bus.on('round.[1]:*', () => { calls += 1; });
  bus.emit('round.[1]:start');
  bus.emit('roundX1:start');
  assert.equal(calls, 1);
});

test('off removes a registered handler and reports success', () => {
  const bus = new EventBus();
  let calls = 0;
  const handler = () => { calls += 1; };
  bus.on('game:end', handler);
  assert.equal(bus.off('game:end', handler), true);
  bus.emit('game:end');
  assert.equal(calls, 0);
});

test('off reports false when no matching registration exists', () => {
  const bus = new EventBus();
  assert.equal(bus.off('missing', () => {}), false);
});

test('off removes duplicate registrations of the same handler', () => {
  const bus = new EventBus();
  let calls = 0;
  const handler = () => { calls += 1; };
  bus.on('duplicate', handler);
  bus.on('duplicate', handler);
  assert.equal(bus.off('duplicate', handler), true);
  bus.emit('duplicate');
  assert.equal(calls, 0);
});

test('on returns an idempotent unsubscribe function', () => {
  const bus = new EventBus();
  let calls = 0;
  const unsubscribe = bus.on('round:end', () => { calls += 1; });
  assert.equal(unsubscribe(), true);
  assert.equal(unsubscribe(), false);
  bus.emit('round:end');
  assert.equal(calls, 0);
});

test('once invokes an exact handler exactly once', () => {
  const bus = new EventBus();
  let calls = 0;
  bus.once('ready', () => { calls += 1; });
  bus.emit('ready');
  bus.emit('ready');
  assert.equal(calls, 1);
});

test('once with a wildcard is consumed by its first matching event', () => {
  const bus = new EventBus();
  const calls = [];
  bus.once('timer:*', (payload) => calls.push(payload));
  bus.emit('timer:tick', 1);
  bus.emit('timer:warning', 2);
  assert.deepEqual(calls, [1]);
});

test('once is removed before invocation so recursive emit cannot repeat it', () => {
  const bus = new EventBus();
  let calls = 0;
  bus.once('recursive', () => {
    calls += 1;
    bus.emit('recursive');
  });
  bus.emit('recursive');
  assert.equal(calls, 1);
});

test('a throwing handler does not prevent later handlers', () => {
  const bus = new EventBus();
  const originalError = console.error;
  const calls = [];
  console.error = () => {};
  try {
    bus.on('isolated', () => calls.push('before'));
    bus.on('isolated', () => { throw new Error('expected failure'); });
    bus.on('isolated', () => calls.push('after'));
    assert.doesNotThrow(() => bus.emit('isolated'));
    assert.deepEqual(calls, ['before', 'after']);
  } finally {
    console.error = originalError;
  }
});

test('handler errors are logged with the emitted event and error', () => {
  const bus = new EventBus();
  const originalError = console.error;
  const logged = [];
  const failure = new Error('boom');
  console.error = (...args) => logged.push(args);
  try {
    bus.on('asset:failed', () => { throw failure; });
    bus.emit('asset:failed');
  } finally {
    console.error = originalError;
  }
  assert.equal(logged.length, 1);
  assert.match(logged[0][0], /asset:failed/);
  assert.strictEqual(logged[0][1], failure);
});

test('handlers added during emit wait until the next emit', () => {
  const bus = new EventBus();
  const calls = [];
  let added = false;
  bus.on('change', () => {
    calls.push('original');
    if (!added) {
      added = true;
      bus.on('change', () => calls.push('added'));
    }
  });
  bus.emit('change');
  assert.deepEqual(calls, ['original']);
  bus.emit('change');
  assert.deepEqual(calls, ['original', 'original', 'added']);
});

test('a handler removed during emit is skipped immediately', () => {
  const bus = new EventBus();
  const calls = [];
  const removed = () => calls.push('removed');
  bus.on('change', () => {
    calls.push('remover');
    bus.off('change', removed);
  });
  bus.on('change', removed);
  bus.emit('change');
  assert.deepEqual(calls, ['remover']);
});

test('clear removes every exact and wildcard handler', () => {
  const bus = new EventBus();
  let calls = 0;
  bus.on('timer:tick', () => { calls += 1; });
  bus.on('timer:*', () => { calls += 1; });
  bus.clear();
  bus.emit('timer:tick');
  assert.equal(calls, 0);
});

test('handlerCount tracks active registrations', () => {
  const bus = new EventBus();
  const first = () => {};
  bus.on('counted', first);
  bus.once('counted', () => {});
  assert.equal(bus.handlerCount('counted'), 2);
  bus.off('counted', first);
  assert.equal(bus.handlerCount('counted'), 1);
  bus.emit('counted');
  assert.equal(bus.handlerCount('counted'), 0);
});

test('registration rejects invalid event names and handlers', () => {
  const bus = new EventBus();
  assert.throws(() => bus.on('', () => {}), TypeError);
  assert.throws(() => bus.once(null, () => {}), TypeError);
  assert.throws(() => bus.on('valid', null), TypeError);
});

test('emit rejects invalid event names', () => {
  const bus = new EventBus();
  assert.throws(() => bus.emit(''), TypeError);
  assert.throws(() => bus.emit(null), TypeError);
});

test('the named singleton and default export reference the same EventBus', () => {
  assert.ok(eventBus instanceof EventBus);
  assert.strictEqual(defaultBus, eventBus);
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

console.log(`EventBus unit tests passed (${passed}/${tests.length})`);
