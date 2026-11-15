import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

test('Antarctica has separate polar geometry and never enters the 197-country dataset', () => {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(readFileSync('data/geographic-features.js', 'utf8'), context);
  vm.runInContext(readFileSync('assets/globe-features.js', 'utf8'), context);
  vm.runInContext(readFileSync('data/countries.js', 'utf8') + ';globalThis.testCountries=countryCards;', context);
  const feature = context.window.GeoWarsExplorerFeatures[0];
  const geometry = context.window.GeoWarsGlobeFeatures[0];
  assert.equal(feature.kind, 'continent');
  assert.equal(feature.flag, null);
  assert.equal(feature.id, geometry.i);
  assert.equal(geometry.y, -90);
  assert.equal(context.testCountries.length, 197);
  assert.ok(!context.testCountries.some(country => country.id === feature.id));
  for (const polygon of geometry.p) for (const ring of polygon) {
    assert.ok(ring.length >= 4);
    assert.equal(JSON.stringify(ring[0]), JSON.stringify(ring.at(-1)));
    assert.ok(ring.every(([longitude, latitude]) => longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude < -60));
  }
});

test('background music creates no audio or network work until start is requested', async () => {
  let created = 0;
  let loaded = 0;
  class Audio {
    paused = true;
    constructor() { created++; }
    addEventListener() {}
    load() { loaded++; }
    pause() { this.paused = true; }
    play() { this.paused = false; return Promise.resolve(); }
  }
  const context = { window: { Audio } };
  vm.createContext(context);
  vm.runInContext(readFileSync('background-music.js', 'utf8'), context);
  assert.equal(created, 0);
  assert.equal(loaded, 0);
  assert.equal(await context.window.BackgroundMusic.start(), true);
  assert.equal(created, 1);
  assert.equal(loaded, 1);
});
