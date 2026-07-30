import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function loadWindowScript(file, property) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(read(file), context);
  return context.window[property];
}

function ringContains([longitude, latitude], ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[previous];
    const intersects = (y1 > latitude) !== (y2 > latitude) &&
      longitude < ((x2 - x1) * (latitude - y1)) / (y2 - y1) + x1;
    if (intersects) inside = !inside;
  }
  return inside;
}

function geometryContains(record, point) {
  return record.p.some(polygon =>
    ringContains(point, polygon[0]) && !polygon.slice(1).some(ring => ringContains(point, ring))
  );
}

test('World Explorer includes 13 separately identified territory records', () => {
  const records = loadWindowScript('data/territories.js', 'GeoWarsExplorerTerritories');
  assert.equal(records.length, 13);
  assert.equal(new Set(records.map(record => record.id)).size, 13);
  assert.ok(records.every(record => record.kind === 'territory'));
  assert.ok(records.every(record => record.status && record.flagNote));
  assert.deepEqual(
    Array.from(records.filter(record => record.parentName === 'France'), record => record.name).sort(),
    ['French Guiana', 'Guadeloupe', 'Martinique', 'Mayotte', 'Réunion'].sort()
  );
});

test('territory geometry is complete and does not remain inside parent-country hit areas', () => {
  const countries = loadWindowScript('assets/globe-countries.js', 'GeoWarsGlobeCountries');
  const territories = loadWindowScript('assets/globe-territories.js', 'GeoWarsGlobeTerritories');
  const france = countries.find(record => record.i === 7);
  const frenchGuiana = territories.find(record => record.i === 1001);
  const westernSahara = territories.find(record => record.i === 1013);

  assert.equal(territories.length, 13);
  assert.ok(territories.every(record => record.t === 1 && record.p.length));
  assert.ok(geometryContains(frenchGuiana, [-53.2, 3.9]));
  assert.ok(!geometryContains(france, [-53.2, 3.9]));
  assert.ok(geometryContains(westernSahara, [-13.2, 24.2]));
});

test('Explorer loads and searches territory entities while Country Hunt remains canonical', () => {
  const html = read('index.html');
  const script = read('globe-explorer.js');

  assert.match(html, /data\/territories\.js\?v=/);
  assert.match(html, /id="explorer-country-status"/);
  assert.match(script, /GeoWarsGlobeTerritories/);
  assert.match(script, /const explorerCards = \[\.\.\.cards, \.\.\.territoryCards\]/);
  assert.match(script, /searchMatches = explorerCards/);
  assert.match(script, /const candidates = cards\.filter/);
  assert.match(script, /Territory selected/);
});