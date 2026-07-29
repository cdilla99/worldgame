import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const [appSource, stateModule, eventsModule, domModule] = await Promise.all([
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  import('../src/core/state.js'),
  import('../src/core/events.js'),
  import('../src/core/dom-refs.js')
]);
const start = appSource.indexOf('/* CORE_FACADE_START */');
const end = appSource.indexOf('/* CORE_FACADE_END */') + '/* CORE_FACADE_END */'.length;
assert.ok(start >= 0 && end > start, 'app.js contains the core compatibility facade');

const timerRing = { update() {} };
const streakTracker = { increment() {} };
const window = {
  GeoWars: { existingExport: true },
  GeoWarsCore: { stateModule, eventsModule, domModule },
  TimerRing: timerRing,
  StreakTracker: streakTracker
};
vm.runInNewContext(appSource.slice(start, end), { window, Promise });
await window.GeoWars.ready;

assert.equal(window.GeoWars.state, stateModule.state);
assert.equal(window.GeoWars.eventBus, eventsModule.eventBus);
assert.equal(window.GeoWars.domRefs, domModule.default);
assert.equal(window.GeoWars.existingExport, true, 'existing GeoWars exports are retained');
assert.equal(window.TimerRing, timerRing, 'TimerRing global is retained');
assert.equal(window.StreakTracker, streakTracker, 'StreakTracker global is retained');

window.GeoWars.setState({ score: 27 });
assert.equal(window.GeoWars.getState().score, 27, 'state delegates call the core state module');
let payload;
const unsubscribe = window.GeoWars.on('facade:test', value => { payload = value; });
window.GeoWars.emit('facade:test', { ok: true });
assert.deepEqual(payload, { ok: true }, 'event delegates call the core event bus');
unsubscribe();
assert.equal(window.GeoWars.createEventBus() instanceof eventsModule.EventBus, true);

console.log('app facade unit tests passed');