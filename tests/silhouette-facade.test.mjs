import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const startMarker = '/* SILHOUETTE_FACADE_START */';
const endMarker = '/* SILHOUETTE_FACADE_END */';
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker) + endMarker.length;
assert.ok(start >= 0 && end > start, 'app.js contains the silhouette compatibility facade');
const facadeSource = source.slice(start, end);

const calls = [];
const element = { id: 'silhouette-img' };
const silhouette = {
  load(card) { calls.push(['load', card]); return element; },
  getElement() { calls.push(['element']); return element; }
};
const module = {
  silhouette,
  createSilhouette(options) { calls.push(['create', options]); return { options }; }
};
const legacyRender = () => 'legacy-global';
const window = {
  GeoWars: { existingExport: true, ready: Promise.resolve() },
  GeoWarsSilhouette: module,
  renderSilhouetteAsset: legacyRender
};
vm.runInNewContext(facadeSource, { window, Promise });
await window.GeoWars.silhouetteReady;

assert.equal(window.GeoWars.existingExport, true, 'existing GeoWars exports are retained');
assert.strictEqual(window.GeoWars.silhouette, silhouette, 'canonical silhouette instance is exposed');
assert.strictEqual(window.renderSilhouetteAsset, legacyRender, 'legacy global is not overwritten');
assert.equal(window.GeoWars.renderSilhouetteAsset.length, 1);
assert.equal(window.GeoWars.createSilhouette.length, 1);
assert.equal(window.GeoWars.getSilhouetteElement.length, 0);
const card = { id: 7, silhouette_url: 'country.svg' };
assert.strictEqual(window.GeoWars.renderSilhouetteAsset(card), element);
assert.deepEqual(window.GeoWars.createSilhouette({ test: true }), { options: { test: true } });
assert.strictEqual(window.GeoWars.getSilhouetteElement(), element);
assert.deepEqual(calls, [['load', card], ['create', { test: true }], ['element']]);

const fallbackCalls = [];
const fallbackWindow = { GeoWars: {}, GeoWarsSilhouette: {},
  renderSilhouetteAsset: card => { fallbackCalls.push(['load', card]); return card; },
  createSilhouette: options => { fallbackCalls.push(['create', options]); return options; },
  getSilhouetteElement: () => { fallbackCalls.push(['element']); return element; } };
vm.runInNewContext(facadeSource, { window: fallbackWindow, Promise });
await fallbackWindow.GeoWars.silhouetteReady;
assert.strictEqual(fallbackWindow.GeoWars.renderSilhouetteAsset(card), card);
assert.deepEqual(fallbackWindow.GeoWars.createSilhouette({ fallback: true }), { fallback: true });
assert.strictEqual(fallbackWindow.GeoWars.getSilhouetteElement(), element);
assert.deepEqual(fallbackCalls, [['load', card], ['create', { fallback: true }], ['element']]);
console.log('silhouette facade compatibility tests passed (module delegation + classic fallback)');