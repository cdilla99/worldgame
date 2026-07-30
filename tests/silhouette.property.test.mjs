import assert from 'node:assert/strict';
import { EventBus } from '../src/core/events.js';
import { createSilhouette } from '../src/features/silhouette/index.js';

class FakeElement {
  constructor(tag = 'div') {
    this.tag = tag;
    this.id = '';
    this.alt = '';
    this.src = '';
    this.parentNode = null;
    this.children = [];
    this.listeners = new Map();
  }
  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) ?? [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }
  removeEventListener(type, handler) {
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter(item => item !== handler));
  }
  querySelector(selector) {
    return selector === '#silhouette-img'
      ? this.children.find(child => child.id === 'silhouette-img') ?? null
      : null;
  }
  insertBefore(child, reference) {
    child.parentNode = this;
    const index = reference ? this.children.indexOf(reference) : -1;
    if (index < 0) this.children.push(child);
    else this.children.splice(index, 0, child);
    return child;
  }
  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter(child => child !== this);
    this.parentNode = null;
  }
}

function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function setup({ withExisting = false } = {}) {
  const events = new EventBus();
  const container = new FakeElement();
  const flagHint = new FakeElement();
  flagHint.id = 'flag-hint';
  if (withExisting) {
    const existing = new FakeElement('img');
    existing.id = 'silhouette-img';
    container.insertBefore(existing, null);
  }
  container.insertBefore(flagHint, null);
  const created = [];
  const document = {
    createElement(tag) {
      const element = new FakeElement(tag);
      created.push(element);
      return element;
    }
  };
  const feature = createSilhouette({ document, container, flagHint, events });
  return { events, container, flagHint, created, feature };
}

function country(id, salt) {
  return {
    id,
    name: `Country ${id}-${salt}`,
    silhouette_url: `https://example.test/silhouettes/${id}-${salt}.svg`
  };
}

function runProperty({ name, seed, cases, generate, verify }) {
  const random = createRandom(seed);
  for (let iteration = 0; iteration < cases; iteration += 1) {
    const input = generate(random, iteration);
    try {
      verify(input);
    } catch (error) {
      error.message = `${name} failed (seed=0x${seed.toString(16)}, iteration=${iteration}, input=${JSON.stringify(input)}): ${error.message}`;
      throw error;
    }
  }
  console.log(`${name} passed (${cases} cases, seed=0x${seed.toString(16)})`);
}

const payloadKeys = ['country', 'card', 'currentCard'];

// Property 17: round:start triggers silhouette load
// **Validates: Requirements 7.1**
runProperty({
  name: 'Property 17: round:start triggers silhouette load',
  seed: 0x51170701,
  cases: 300,
  generate: (random, iteration) => {
    const card = country(iteration + 1, Math.floor(random() * 1_000_000));
    const payloadKey = payloadKeys[Math.floor(random() * payloadKeys.length)];
    return { card, payloadKey };
  },
  verify: ({ card, payloadKey }) => {
    const { events, container, flagHint, created, feature } = setup();
    try {
      events.emit('round:start', { [payloadKey]: card });
      const image = feature.getElement();
      assert.equal(created.length, 1, 'one image load is initiated');
      assert.strictEqual(image, created[0]);
      assert.equal(image.src, card.silhouette_url);
      assert.equal(image.parentNode, container);
      assert.deepEqual(container.children, [image, flagHint]);
    } finally {
      feature.dispose();
    }
  }
});


// Property 18: Error events contain country ID
// **Validates: Requirements 7.3**
runProperty({
  name: 'Property 18: Error events contain country ID',
  seed: 0x51180703,
  cases: 300,
  generate: (random, iteration) => ({
    card: country(1 + Math.floor(random() * 195), `${iteration}-${Math.floor(random() * 1_000_000)}`),
    errorMessage: `silhouette failure ${iteration}-${Math.floor(random() * 1_000_000)}`
  }),
  verify: ({ card, errorMessage }) => {
    const { events, feature } = setup();
    const errors = [];
    const unsubscribe = events.on('silhouette:error', payload => errors.push(payload));
    try {
      events.emit('round:start', { country: card });
      const image = feature.getElement();
      const failure = new Error(errorMessage);
      for (const handler of [...(image.listeners.get('error') ?? [])]) {
        handler({ type: 'error', target: image, error: failure });
      }
      assert.equal(errors.length, 1, 'one error event is emitted per failed load');
      assert.equal(errors[0].countryId, card.id, 'error payload contains the failed country ID');
    } finally {
      unsubscribe();
      feature.dispose();
    }
  }
});

// Property 19: Only one silhouette element exists at a time
// **Validates: Requirements 7.6**
runProperty({
  name: 'Property 19: Only one silhouette element exists at a time',
  seed: 0x51190706,
  cases: 300,
  generate: (random, iteration) => {
    const length = 2 + Math.floor(random() * 24);
    const cards = Array.from(
      { length },
      (_, index) => country(iteration * 100 + index + 1, Math.floor(random() * 1_000_000))
    );
    return { cards, withExisting: random() < 0.5 };
  },
  verify: ({ cards, withExisting }) => {
    const { events, container, feature } = setup({ withExisting });
    let previous = container.querySelector('#silhouette-img');
    try {
      for (const card of cards) {
        events.emit('round:start', { country: card });
        const silhouettes = container.children.filter(child => child.id === 'silhouette-img');
        assert.equal(silhouettes.length, 1, 'exactly one silhouette remains after each round start');
        assert.strictEqual(feature.getElement(), silhouettes[0]);
        assert.equal(silhouettes[0].src, card.silhouette_url);
        if (previous) assert.equal(previous.parentNode, null, 'the previous silhouette is detached');
        previous = silhouettes[0];
      }
    } finally {
      feature.dispose();
    }
  }
});

console.log('Silhouette properties 17, 18, and 19 passed (900 generated cases total)');