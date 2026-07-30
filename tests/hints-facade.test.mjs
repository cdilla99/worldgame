import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const start = source.indexOf('/* HINTS_FACADE_START */');
const end = source.indexOf('/* HINTS_FACADE_END */') + '/* HINTS_FACADE_END */'.length;
assert.ok(start >= 0 && end > start, 'app.js contains the hints compatibility facade');
const facadeSource = source.slice(start, end);

const calls = [];
const state = Object.freeze({ flagUsed: true, regionUsed: false });
const hints = {
  reveal(type) { calls.push(['reveal', type]); return { type }; },
  getState() { calls.push(['state']); return state; }
};
const module = {
  hints,
  createHints(options) { calls.push(['create', options]); return { options }; }
};
const legacyReveal = () => 'legacy-global';
const window = {
  GeoWars: { existingExport: true, ready: Promise.resolve() },
  GeoWarsHints: module,
  revealHint: legacyReveal
};
vm.runInNewContext(facadeSource, { window, Promise });
await window.GeoWars.hintsReady;

assert.equal(window.GeoWars.existingExport, true, 'existing GeoWars exports are retained');
assert.strictEqual(window.GeoWars.hints, hints, 'canonical hints instance is exposed');
assert.strictEqual(window.revealHint, legacyReveal, 'legacy globals are not overwritten');
assert.equal(window.GeoWars.revealHint.length, 1);
assert.equal(window.GeoWars.createHints.length, 1);
assert.equal(window.GeoWars.getHintsState.length, 0);
assert.deepEqual(window.GeoWars.revealHint('flag'), { type: 'flag' });
assert.deepEqual(window.GeoWars.createHints({ test: true }), { options: { test: true } });
assert.strictEqual(window.GeoWars.getHintsState(), state);
assert.deepEqual(calls, [['reveal', 'flag'], ['create', { test: true }], ['state']]);

const fallbackCalls = [];
const fallbackWindow = { GeoWars: {}, GeoWarsHints: {},
  revealHint: type => { fallbackCalls.push(['reveal', type]); return type; },
  createHints: options => { fallbackCalls.push(['create', options]); return options; },
  getHintsState: () => { fallbackCalls.push(['state']); return { fallback: true }; } };
vm.runInNewContext(facadeSource, { window: fallbackWindow, Promise });
await fallbackWindow.GeoWars.hintsReady;
assert.equal(fallbackWindow.GeoWars.revealHint('region'), 'region');
assert.deepEqual(fallbackWindow.GeoWars.createHints({ fallback: true }), { fallback: true });
assert.equal(fallbackWindow.GeoWars.getHintsState().fallback, true);
assert.deepEqual(fallbackCalls, [['reveal', 'region'], ['create', { fallback: true }], ['state']]);
console.log('hints facade compatibility tests passed (module delegation + classic fallback)');