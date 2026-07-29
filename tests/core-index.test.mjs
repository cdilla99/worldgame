import assert from 'node:assert/strict';
import * as core from '../src/core/index.js';
import state, { getState } from '../src/core/state.js';
import eventBus, { EventBus } from '../src/core/events.js';
import domRefs from '../src/core/dom-refs.js';

assert.strictEqual(core.state, state, 'unified entry exports the singleton state');
assert.strictEqual(core.getState, getState, 'unified entry exports state operations');
assert.strictEqual(core.eventBus, eventBus, 'unified entry exports the singleton EventBus');
assert.strictEqual(core.domRefs, domRefs, 'unified entry exports the DOM registry');
assert.ok(core.createEventBus() instanceof EventBus, 'factory creates isolated EventBus instances');
assert.notStrictEqual(core.createEventBus(), core.createEventBus(), 'factory returns a new bus each time');
assert.ok(Object.isFrozen(core.CORE_EVENTS), 'event name catalog is immutable');
assert.equal(new Set(core.CORE_EVENTS).size, core.CORE_EVENTS.length, 'event names are unique');
for (const name of ['game:start', 'timer:tick', 'answer:correct', 'silhouette:error']) {
  assert.ok(core.CORE_EVENTS.includes(name), `event catalog includes ${name}`);
}
assert.strictEqual(core.default.state, core.state, 'default API exposes state');
assert.strictEqual(core.default.eventBus, core.eventBus, 'default API exposes EventBus');
assert.strictEqual(core.default.domRefs, core.domRefs, 'default API exposes DOM registry');

console.log('core unified export unit tests passed');
