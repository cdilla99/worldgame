import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// Minimal SVG-ish element so buildOutline/render can run without a real DOM.
function makeElement() {
  return {
    attrs: {},
    children: [],
    text: '',
    setAttribute(key, value) { this.attrs[key] = String(value); },
    appendChild(child) { this.children.push(child); return child; },
    set textContent(value) { this.text = value; this.children = []; },
    get textContent() { return this.text; }
  };
}

function loadModule() {
  const context = {
    window: {},
    document: { createElementNS: () => makeElement() },
    Promise, Math, Array, Infinity, Error, console
  };
  vm.createContext(context);
  vm.runInContext(read('shape-geometry.js'), context);
  // Load the real bundled geometry into the same global the module reads.
  vm.runInContext(read('assets/globe-countries.js'), context);
  return context;
}

test('review outline wraps date-line islands without dropping polygons or mutating data', () => {
  const api = loadModule().window.GeoWarsShapeGeometry;
  const geometry = { p: [[[[179, 0], [179.5, 0], [179.5, 1], [179, 0]]], [[[-179, 0], [-178.5, 0], [-178.5, 1], [-179, 0]]]] };
  const before = JSON.stringify(geometry);
  const svg = api.buildOutline(geometry, { compactBounds: true, padding: 0 });
  assert.equal(Number(svg.attrs.viewBox.split(' ')[2]), 2.5);
  assert.equal((svg.children[0].attrs.d.match(/M/g) || []).length, 2);
  assert.equal(JSON.stringify(geometry), before);
});

test('review outline fits microstates instead of forcing a one-degree frame', () => {
  const api = loadModule().window.GeoWarsShapeGeometry;
  const geometry = { p: [[[[7, 43], [7.02, 43], [7.02, 43.01], [7, 43]]]] };
  const svg = api.buildOutline(geometry, { compactBounds: true, padding: 0 });
  assert.ok(Number(svg.attrs.viewBox.split(' ')[2]) < 0.03);
});

test('all 197 compact outlines fit the smallest longitude arc without dropping vertices or changing source geometry', () => {
  const context = loadModule();
  const geometry = context.window.GeoWarsGlobeCountries;
  const api = context.window.GeoWarsShapeGeometry;
  const before = JSON.stringify(geometry);
  assert.equal(geometry.length, 197);
  for (const country of geometry) {
    const points = country.p.flat(2);
    const angles = [...new Set(points.map(point => (point[0] + 360) % 360))].sort((a, b) => a - b);
    const gaps = angles.map((angle, index) => (angles[(index + 1) % angles.length] + (index === angles.length - 1 ? 360 : 0)) - angle);
    const latitudes = points.map(point => point[1]);
    const scale = Math.max(0.25, Math.round(Math.cos((Math.min(...latitudes) + Math.max(...latitudes)) / 2 * Math.PI / 180) * 1000) / 1000);
    const expectedWidth = Math.max(0.0001, (360 - Math.max(...gaps)) * scale);
    const svg = api.buildOutline(country, { compactBounds: true, padding: 0 });
    const [, , width, height] = svg.attrs.viewBox.split(' ').map(Number);
    assert.ok(Math.abs(width - expectedWidth) < 0.00001, `country ${country.i} must not stretch across the longitude seam`);
    assert.ok(Number.isFinite(height) && height > 0, `country ${country.i} has a usable height`);
    const d = svg.children[0].attrs.d;
    assert.equal((d.match(/[ML]/g) || []).length, points.length, `country ${country.i} preserves every vertex`);
    assert.doesNotMatch(d, /NaN|Infinity/);
  }
  assert.equal(JSON.stringify(geometry), before, 'framing must not mutate globe or country data');
});

test('outline longitude is scaled by latitude so northern countries are not stretched', () => {
  const api = loadModule().window.GeoWarsShapeGeometry;
  const ring = (west, south, east, north) => [[[[west, south], [east, south], [east, north], [west, north], [west, south]]]];
  const viewBox = svg => svg.attrs.viewBox.split(' ').map(Number);

  const northern = viewBox(api.buildOutline({ p: ring(-140, 40, -50, 80) }, { padding: 0 }));
  assert.ok(Math.abs(northern[2] / northern[3] - 90 * 0.5 / 40) < 0.02, 'a 90 by 40 degree box at 60N is about 1.1:1');

  const equatorial = viewBox(api.buildOutline({ p: ring(10, -20, 40, 20) }, { padding: 0 }));
  assert.ok(Math.abs(equatorial[2] / equatorial[3] - 30 / 40) < 0.02, 'equatorial shapes keep their degree proportions');
});

test('tiny countries stay centred inside the minimum outline frame', () => {
  const api = loadModule().window.GeoWarsShapeGeometry;
  const island = { p: [[[[10, 10], [10.2, 10], [10.2, 10.1], [10, 10.1], [10, 10]]]] };
  const svg = api.buildOutline(island, { padding: 0 });
  const [, , frameWidth, frameHeight] = svg.attrs.viewBox.split(' ').map(Number);
  const numbers = svg.children[0].attrs.d.match(/-?\d+(\.\d+)?/g).map(Number);
  const xs = numbers.filter((_, index) => index % 2 === 0);
  const ys = numbers.filter((_, index) => index % 2 === 1);
  assert.ok(Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - frameWidth / 2) < 0.01);
  assert.ok(Math.abs((Math.min(...ys) + Math.max(...ys)) / 2 - frameHeight / 2) < 0.01);
});

test('shape-geometry exposes the render/buildOutline contract atlas.js depends on', () => {
  const context = loadModule();
  const api = context.window.GeoWarsShapeGeometry;
  assert.ok(api, 'GeoWarsShapeGeometry global must exist');
  assert.equal(typeof api.render, 'function');
  assert.equal(typeof api.buildOutline, 'function');

  // Only the geometry data and the renderer API should reach the global scope.
  assert.deepEqual(
    Object.keys(context.window).sort(),
    ['GeoWarsGlobeCountries', 'GeoWarsShapeGeometry']
  );
});

test('buildOutline projects a real country into a valid SVG path', () => {
  const context = loadModule();
  const geometry = context.window.GeoWarsGlobeCountries;
  const api = context.window.GeoWarsShapeGeometry;

  const country = geometry.find(entry => entry.i === 1); // United States
  const svg = api.buildOutline(country, { padding: 0.1, label: 'United States border outline' });

  assert.ok(svg, 'a country with polygons should produce an SVG');
  assert.match(svg.attrs.viewBox, /^0 0 \d/);
  assert.equal(svg.attrs['aria-label'], 'United States border outline');
  assert.equal(svg.attrs.role, 'img');

  const pathEl = svg.children[0];
  assert.ok(pathEl, 'outline should contain a path');
  assert.equal(pathEl.attrs.d[0], 'M', 'path data should start with a moveto');
  assert.equal(pathEl.attrs['fill-rule'], 'evenodd', 'holes must render correctly');
});

test('buildOutline returns null when a country has no geometry', () => {
  const context = loadModule();
  const api = context.window.GeoWarsShapeGeometry;
  assert.equal(api.buildOutline(null, {}), null);
  assert.equal(api.buildOutline({ i: 0, p: [] }, {}), null);
});

test('render appends one outline for a known country and rejects unknown ids', async () => {
  const context = loadModule();
  const api = context.window.GeoWarsShapeGeometry;

  const container = makeElement();
  container.textContent = 'Loading border…';
  const element = await api.render(container, { id: 195, name: 'Tuvalu' }, { padding: 0.1 });
  assert.ok(element, 'render resolves to the SVG element');
  assert.equal(container.children.length, 1, 'container holds exactly one outline');
  assert.equal(container.text, '', 'the loading placeholder is cleared');

  await assert.rejects(
    api.render(makeElement(), { id: 999999, name: 'Nowhere' }, {}),
    /No geometry for country id 999999/
  );
});

test('index.html loads shape-geometry.js before app.js so the atlas can render outlines', () => {
  const html = read('index.html');
  const shapeGeometryScript = html.indexOf('shape-geometry.js?v=');
  const appScript = html.indexOf('app.js?v=');
  const atlasScript = html.indexOf('atlas.js?v=');

  assert.ok(shapeGeometryScript > -1, 'shape-geometry.js must be referenced');
  assert.ok(atlasScript > -1, 'atlas.js must be referenced');
  assert.ok(shapeGeometryScript < appScript, 'shape-geometry.js should load before app.js');
});
