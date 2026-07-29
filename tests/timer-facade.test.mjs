import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const markerStart = '/* TIMER_FACADE_START */';
const markerEnd = '/* TIMER_FACADE_END */';
const start = appSource.indexOf(markerStart);
const end = appSource.indexOf(markerEnd) + markerEnd.length;
assert.ok(start >= 0 && end > start, 'app.js contains the timer compatibility facade');
const facadeSource = appSource.slice(start, end);

const calls = [];
const snapshots = [
  Object.freeze({ timer: 17, remaining: 60 }),
  Object.freeze({ timer: 18, remaining: 42 })
];
let snapshotIndex = 0;
const timer = {
  start(mode) {
    calls.push(['start', mode]);
    snapshotIndex = 0;
    return snapshots[snapshotIndex];
  },
  getState() { return snapshots[snapshotIndex]; }
};
const eventBus = {
  emit(name, payload) {
    calls.push(['emit', name, payload]);
    if (name === 'game:resume') snapshotIndex = 1;
  }
};
const timerRing = { update() {} };
const streakTracker = { increment() {} };
const legacy = {
  startTimer() { calls.push(['legacy', 'start']); },
  resumeTimer() { calls.push(['legacy', 'resume']); },
  updateTimerDisplay() { calls.push(['legacy', 'display']); }
};
const window = {
  GeoWars: { existingExport: true, ready: Promise.resolve() },
  GeoWarsTimer: { timerModule: { timer }, eventsModule: { eventBus } },
  TimerRing: timerRing,
  StreakTracker: streakTracker,
  ...legacy
};

vm.runInNewContext(facadeSource, { window, Promise });
await window.GeoWars.timerReady;

assert.equal(window.GeoWars.existingExport, true, 'existing GeoWars exports are retained');
assert.strictEqual(window.GeoWars.timer, timer, 'facade exposes the canonical timer instance');
assert.strictEqual(window.TimerRing, timerRing, 'TimerRing global is retained');
assert.strictEqual(window.StreakTracker, streakTracker, 'StreakTracker global is retained');
assert.strictEqual(window.startTimer, legacy.startTimer, 'legacy startTimer global is retained');
assert.strictEqual(window.resumeTimer, legacy.resumeTimer, 'legacy resumeTimer global is retained');
assert.strictEqual(window.updateTimerDisplay, legacy.updateTimerDisplay, 'legacy display global is retained');

for (const name of ['startTimer', 'resumeTimer', 'updateTimerDisplay']) {
  assert.equal(typeof window.GeoWars[name], 'function', `${name} is exported`);
  assert.equal(window.GeoWars[name].length, 0, `${name} keeps its no-argument signature`);
}

assert.strictEqual(window.GeoWars.startTimer(), snapshots[0]);
assert.strictEqual(window.GeoWars.resumeTimer(), snapshots[1]);
assert.strictEqual(window.GeoWars.updateTimerDisplay(), snapshots[1]);
assert.deepEqual(calls.slice(0, 2), [
  ['start', 'blitz'],
  ['emit', 'game:resume', undefined]
]);
assert.equal(calls[2][0], 'emit');
assert.equal(calls[2][1], 'timer:tick');
assert.equal(calls[2][2].remaining, 42, 'display facade emits the module timer state');

const fallbackCalls = [];
const fallbackWindow = {
  GeoWars: {},
  GeoWarsTimer: { timerModule: {}, eventsModule: {} },
  startTimer() { fallbackCalls.push('start'); return 'legacy-start'; },
  resumeTimer() { fallbackCalls.push('resume'); return 'legacy-resume'; },
  updateTimerDisplay() { fallbackCalls.push('display'); return 'legacy-display'; }
};
vm.runInNewContext(facadeSource, { window: fallbackWindow, Promise });
await fallbackWindow.GeoWars.timerReady;
assert.equal(fallbackWindow.GeoWars.startTimer(), 'legacy-start');
assert.equal(fallbackWindow.GeoWars.resumeTimer(), 'legacy-resume');
assert.equal(fallbackWindow.GeoWars.updateTimerDisplay(), 'legacy-display');
assert.deepEqual(fallbackCalls, ['start', 'resume', 'display'], 'classic globals remain the fallback');

console.log('timer facade compatibility tests passed (module delegation + classic fallback)');