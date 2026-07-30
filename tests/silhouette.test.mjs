import assert from 'node:assert/strict';
import { EventBus } from '../src/core/events.js';
import { createSilhouette, silhouette } from '../src/features/silhouette/index.js';

class FakeElement {
  constructor(tag = 'div') {
    this.tag = tag; this.id = ''; this.alt = ''; this.src = ''; this.parentNode = null; this.children = []; this.listeners = new Map();
    this.attributes = new Map(); this.classes = new Set(); this.dataset = {}; this.inert = false; this.disabled = false; this.textContent = '';
    this.classList = { toggle: (name, force) => force ? this.classes.add(name) : this.classes.delete(name), contains: name => this.classes.has(name) };
  }
  addEventListener(type, fn) { const list = this.listeners.get(type) ?? []; list.push(fn); this.listeners.set(type, list); }
  removeEventListener(type, fn) { this.listeners.set(type, (this.listeners.get(type) ?? []).filter(item => item !== fn)); }
  dispatch(type, error) { for (const fn of [...(this.listeners.get(type) ?? [])]) fn({ type, target: this, error }); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  toggleAttribute(name, force) { if (force) this.attributes.set(name, ''); else this.attributes.delete(name); }
  querySelector(selector) {
    if (selector === '#silhouette-img') return this.children.find(child => child.id === 'silhouette-img') ?? null;
    if (selector === '[data-asset-fallback="silhouette"]') return this.children.find(child => child.dataset.assetFallback === 'silhouette') ?? null;
    return null;
  }
  insertBefore(child, reference) { child.parentNode = this; const index = reference ? this.children.indexOf(reference) : -1; index < 0 ? this.children.push(child) : this.children.splice(index, 0, child); return child; }
  replaceWith(replacement) { if (!this.parentNode) return; const parent = this.parentNode; const index = parent.children.indexOf(this); parent.children.splice(index, 1, replacement); replacement.parentNode = parent; this.parentNode = null; }
  remove() { if (!this.parentNode) return; this.parentNode.children = this.parentNode.children.filter(child => child !== this); this.parentNode = null; }
}

const document = { createElement: tag => new FakeElement(tag) };
const container = new FakeElement();
const initial = new FakeElement('img'); initial.id = 'silhouette-img'; container.insertBefore(initial, null);
const flagHint = new FakeElement(); flagHint.id = 'flag-hint'; container.insertBefore(flagHint, null);
const recovery = new FakeElement('section'); recovery.classes.add('hidden');
const recoveryMessage = new FakeElement('p');
const retryButton = new FakeElement('button'); retryButton.disabled = true;
const answerPanel = new FakeElement('section');
const fallbackCalls = [];
const assetFallbacks = {
  prepareImage(image, type, country, options) {
    fallbackCalls.push({ method: 'prepareImage', image, type, country, options });
    image.src = country.silhouette_url;
    return { url: image.src };
  },
  replaceImageWithFallback(image, type) {
    fallbackCalls.push({ method: 'replaceImageWithFallback', image, type });
    const fallback = new FakeElement('section'); fallback.dataset.assetFallback = type; image.replaceWith(fallback); return fallback;
  }
};
const events = new EventBus();
const feature = createSilhouette({ document, container, flagHint, events, assetFallbacks, recovery, recoveryMessage, retryButton, answerPanel });
const ready = []; events.on('silhouette:ready', payload => ready.push(payload));
const errors = []; events.on('silhouette:error', payload => errors.push(payload));
const canada = { id: 1, name: 'Canada', silhouette_url: 'https://example.test/ca.svg' };
const japan = { id: 2, name: 'Japan', silhouette_url: 'https://example.test/jp.svg' };

assert.equal(silhouette, null, 'Node import does not create a DOM-bound default instance');
assert.equal(events.handlerCount('round:start'), 1, 'feature subscribes to round:start');
events.emit('round:start', { country: canada });
const first = feature.getElement();
assert.notStrictEqual(first, initial); assert.equal(initial.parentNode, null, 'previous silhouette is removed');
assert.equal(first.id, 'silhouette-img'); assert.equal(first.alt, 'Guess this country'); assert.equal(first.src, canada.silhouette_url);
assert.deepEqual(container.children, [first, flagHint], 'silhouette is inserted before the flag hint');
first.dispatch('load');
assert.equal(ready.length, 1); assert.equal(ready[0].countryId, canada.id); assert.strictEqual(ready[0].country, canada); assert.strictEqual(ready[0].element, first); assert.ok(Object.isFrozen(ready[0]));
events.emit('round:start', { card: japan });
const second = feature.getElement();
assert.notStrictEqual(second, first); assert.equal(first.parentNode, null); assert.deepEqual(container.children, [second, flagHint], 'only the latest silhouette remains');
first.dispatch('load'); first.dispatch('error', new Error('stale failure'));
assert.equal(ready.length, 1, 'a removed silhouette cannot emit ready');
assert.equal(errors.length, 0, 'a removed silhouette cannot emit an error');
second.dispatch('load'); assert.equal(ready.length, 2); assert.equal(ready[1].countryId, japan.id);

const mexico = { id: 3, name: 'Mexico', silhouette_url: 'https://example.test/mx.svg' };
const failed = feature.load(mexico);
const loadError = new Error('network unavailable');
failed.dispatch('error', loadError);
assert.equal(errors.length, 1, 'a load failure emits one silhouette:error event');
assert.equal(errors[0].countryId, mexico.id); assert.strictEqual(errors[0].error, loadError); assert.ok(Object.isFrozen(errors[0]));
assert.equal(fallbackCalls.filter(call => call.method === 'prepareImage').length, 3, 'all images are prepared through AssetFallbacks');
assert.equal(fallbackCalls.filter(call => call.method === 'replaceImageWithFallback').length, 1, 'the failed image is replaced through AssetFallbacks');
assert.ok(container.querySelector('[data-asset-fallback="silhouette"]'), 'a visible silhouette fallback replaces the broken image');
assert.equal(recovery.classList.contains('hidden'), false); assert.equal(recovery.getAttribute('aria-hidden'), 'false'); assert.equal(recovery.inert, false);
assert.equal(answerPanel.classList.contains('hidden'), true); assert.equal(answerPanel.getAttribute('aria-hidden'), 'true'); assert.equal(answerPanel.inert, true);
assert.equal(retryButton.disabled, false); assert.match(recoveryMessage.textContent, /will not be saved/);
failed.dispatch('error', new Error('duplicate failure')); assert.equal(errors.length, 1, 'a failed image emits at most one error');

const retried = feature.load(mexico);
assert.deepEqual(container.children, [retried, flagHint], 'retry removes the prior fallback before loading');
retried.dispatch('load');
assert.equal(ready.length, 3); assert.equal(recovery.classList.contains('hidden'), true); assert.equal(answerPanel.classList.contains('hidden'), false);
assert.throws(() => feature.load({ id: 4 }), TypeError, 'countries without a silhouette URL are rejected');
feature.dispose(); feature.dispose();
assert.equal(events.handlerCount('round:start'), 0); assert.equal(feature.getElement(), null); assert.deepEqual(container.children, [flagHint]);
events.emit('round:start', { country: canada }); assert.deepEqual(container.children, [flagHint], 'disposed feature ignores later rounds');
assert.throws(() => createSilhouette({ document: {}, container, flagHint, events }), TypeError);
assert.throws(() => createSilhouette({ document, container: {}, flagHint, events }), TypeError);
assert.throws(() => createSilhouette({ document, container, flagHint, events: {} }), TypeError);
console.log('silhouette unit tests passed');
