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
