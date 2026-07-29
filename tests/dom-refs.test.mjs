import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

process.env.NODE_ENV = 'development';
const source = await readFile(new URL('../src/core/dom-refs.js', import.meta.url), 'utf8');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const { get, clear, preload, default: domRefs } = await import(moduleUrl);

const elements = new Map();
const queries = [];
globalThis.document = {
  getElementById(id) {
    queries.push(id);
    return elements.get(id) ?? null;
  }
};

const originalWarn = console.warn;
const warnings = [];
console.warn = (...args) => warnings.push(args);

try {
  const startButton = { id: 'start-button' };
  elements.set('start-button', startButton);

  assert.equal(queries.length, 0, 'the registry does not query eagerly');
  assert.strictEqual(get('start-button'), startButton, 'get returns the queried element');
  assert.strictEqual(get('start-button'), startButton, 'get returns the cached element');
  assert.deepEqual(queries, ['start-button'], 'an existing element is queried only once');

  assert.strictEqual(get('missing'), null, 'a missing element returns null');
  assert.doesNotThrow(() => get('missing'), 're-reading a missing element remains null-safe');
  assert.deepEqual(queries, ['start-button', 'missing'], 'a missing result is cached');
  assert.equal(warnings.length, 1, 'a cached missing element warns only on its first lookup');
  assert.match(warnings[0][0], /missing/, 'the development warning identifies the missing id');

  const replacement = { id: 'start-button', replacement: true };
  elements.set('start-button', replacement);
  clear();
  assert.strictEqual(get('start-button'), replacement, 'clear causes the next get to query again');
  assert.deepEqual(queries, ['start-button', 'missing', 'start-button']);

  const score = { id: 'score' };
  elements.set('score', score);
  clear();
  const loaded = preload(['start-button', 'score', 'absent']);
  assert.deepEqual(loaded, [replacement, score, null], 'preload returns references in input order');
  assert.deepEqual(queries.slice(-3), ['start-button', 'score', 'absent'], 'preload queries every uncached id');
  assert.strictEqual(get('score'), score, 'preloaded references are cached');
  assert.equal(queries.at(-1), 'absent', 'a preloaded cache hit does not query again');

  assert.throws(() => preload('score'), TypeError, 'preload rejects a string instead of treating it as an id list');
  assert.strictEqual(domRefs.get, get, 'the default registry exposes get');
  assert.strictEqual(domRefs.clear, clear, 'the default registry exposes clear');
  assert.strictEqual(domRefs.preload, preload, 'the default registry exposes preload');

  clear();
  delete globalThis.document;
  assert.doesNotThrow(() => get('without-document'), 'get is safe when no document is available');
  assert.strictEqual(get('without-document'), null, 'missing document returns null');
} finally {
  console.warn = originalWarn;
  delete globalThis.document;
}

console.log('DOM registry unit tests passed');
