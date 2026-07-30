import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function loadGeography() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(read('geography.js'), context);
  return context.window.GeoWarsGeography;
}

function loadGlobeRecords() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(read('assets/globe-countries.js'), context);
  return context.window.GeoWarsGlobeCountries;
}

test('geographic hints calculate approximate distance and initial direction', () => {
  const geography = loadGeography();
  const globe = loadGlobeRecords();
  const canada = globe.find(record => record.i === 2);
  const ireland = globe.find(record => record.i === 56);
  const hint = geography.hintBetween(canada, ireland);

  assert.ok(hint.distanceKm > 5250 && hint.distanceKm < 5350);
  assert.equal(hint.direction, 'NE');
  assert.equal(hint.directionLabel, 'northeast');
  assert.equal(hint.arrow, '↗');
  assert.equal(hint.displayDistance, '5,300 km');
  assert.equal(hint.proximity, 'Very far');
});

test('bearing handles the international date line and all proximity tiers', () => {
  const geography = loadGeography();
  const eastAcrossDateline = geography.hintBetween({ x: 179, y: 0 }, { x: -179, y: 0 });
  const westAcrossDateline = geography.hintBetween({ x: -179, y: 0 }, { x: 179, y: 0 });

  assert.equal(eastAcrossDateline.direction, 'E');
  assert.equal(westAcrossDateline.direction, 'W');
  assert.equal(geography.proximityForDistance(300), 'Nearby');
  assert.equal(geography.proximityForDistance(1200), 'Close');
  assert.equal(geography.proximityForDistance(3000), 'Far');
  assert.equal(geography.proximityForDistance(8000), 'Very far');
});

test('Country Hunt renders responsive and accessible distance guidance after misses', () => {
  const html = read('index.html');
  const script = read('globe-explorer.js');
  const styles = read('globe-explorer.css');

  assert.match(html, /geography\.js\?v=/);
  assert.match(html, /id="explorer-hunt-guidance"[\s\S]*aria-live="polite"/);
  assert.match(html, /Approximate center-to-center distance/);
  assert.match(script, /function renderHuntGuidance/);
  assert.match(script, /geography\?\.hintBetween/);
  assert.match(script, /hint\.displayDistance/);
  assert.match(script, /hint\.directionLabel/);
  assert.match(styles, /\.explorer-hunt-guidance\s*\{[\s\S]*grid-template-columns/);
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*\.explorer-hunt-guidance/);
});