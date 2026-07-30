import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import * as scoringModule from '../src/features/scoring/index.js';
import { EventBus } from '../src/core/events.js';

const source = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const markerStart = '/* SCORING_FACADE_START */';
const markerEnd = '/* SCORING_FACADE_END */';
const start = source.indexOf(markerStart);
const end = source.indexOf(markerEnd) + markerEnd.length;
assert.ok(start >= 0 && end > start, 'app.js contains the scoring compatibility facade');
const facadeSource = source.slice(start, end);

const legacyCalculate = () => 'legacy-global';
const window = {
  GeoWars: { existingExport: true, ready: Promise.resolve() },
  GeoWarsScoring: scoringModule,
  calculatePoints: legacyCalculate
};
vm.runInNewContext(facadeSource, { window, Promise });
await window.GeoWars.scoringReady;

assert.equal(window.GeoWars.existingExport, true, 'existing GeoWars exports are retained');
assert.strictEqual(window.GeoWars.scoring, scoringModule.scoring, 'canonical scoring instance is exposed');
assert.strictEqual(window.calculatePoints, legacyCalculate, 'legacy globals are not overwritten');
assert.equal(window.GeoWars.calculatePoints.length, 2, 'point calculation signature is retained');
assert.equal(window.GeoWars.createScoring.length, 1, 'scoring factory accepts its options argument');
assert.equal(window.GeoWars.getScoringState.length, 0, 'state facade keeps its no-argument signature');
assert.equal(window.GeoWars.calculatePoints('medium', 'bail'), 300);
assert.strictEqual(window.GeoWars.getScoringState().score, scoringModule.scoring.getState().score);

const isolated = window.GeoWars.createScoring({ events: new EventBus() });
assert.deepEqual(isolated.getState(), { score: 0, streak: 0, bestStreak: 0 });
isolated.dispose();

const calls = [];
const fallbackWindow = {
  GeoWars: {},
  GeoWarsScoring: {},
  calculatePoints: (...args) => { calls.push(['points', ...args]); return 17; },
  createScoring: options => { calls.push(['create', options]); return options; },
  getScoringState: () => { calls.push(['state']); return { score: 9 }; }
};
vm.runInNewContext(facadeSource, { window: fallbackWindow, Promise });
await fallbackWindow.GeoWars.scoringReady;
assert.equal(fallbackWindow.GeoWars.calculatePoints('easy', 'typed'), 17);
assert.deepEqual(fallbackWindow.GeoWars.createScoring({ test: true }), { test: true });
assert.equal(fallbackWindow.GeoWars.getScoringState().score, 9);
assert.deepEqual(calls, [['points', 'easy', 'typed'], ['create', { test: true }], ['state']]);

console.log('scoring facade compatibility tests passed (module delegation + classic fallback)');