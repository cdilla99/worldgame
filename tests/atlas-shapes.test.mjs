import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(testDirectory, '..');
const read = file => fs.readFileSync(path.join(rootDirectory, file), 'utf8');
const atlasSource = read('atlas.js');
const indexHtml = read('index.html');

class FakeClassList {
  constructor(initial = '') { this.values = new Set(initial.split(/\s+/).filter(Boolean)); }
  add(...names) { names.forEach(name => this.values.add(name)); }
  remove(...names) { names.forEach(name => this.values.delete(name)); }
  contains(name) { return this.values.has(name); }
  toggle(name, force) {
    const next = force === undefined ? !this.values.has(name) : Boolean(force);
    if (next) this.values.add(name); else this.values.delete(name);
    return next;
  }
}

class FakeElement {
  constructor(tag = 'div', id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.classList = new FakeClassList('');
    this.attributes = new Map();
    this.listeners = new Map();
    this.children = [];
    this.parentNode = null;
    this.dataset = {};
    this.hidden = false;
    this.inert = false;
    this.value = '';
    this.textContent = '';
  }
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
  append(...children) { children.forEach(child => this.appendChild(child)); }
  focus() {}
  dispatch(type, event = {}) {
    const dispatched = { preventDefault() {}, target: this, ...event };
    (this.listeners.get(type) ?? []).forEach(listener => listener(dispatched));
  }
}

function createHarness(randomValues = [0]) {
  const elements = new Map();
  const timers = new Map();
  const cleared = [];
  let nextTimerId = 1;
  let randomIndex = 0;
  const math = Object.create(Math);
  math.random = () => randomValues[Math.min(randomIndex++, randomValues.length - 1)] ?? 0;

  const getElement = id => {
    if (!elements.has(id)) elements.set(id, new FakeElement('div', id));
    return elements.get(id);
  };
  const infoPanel = getElement('explorer-info-panel');
  infoPanel.classList.add('explorer-info-panel');
  const screen = getElement('explorer');
  screen.dataset.atlasView = 'globe';
  const globeWorkspace = getElement('atlas-globe-workspace');
  const shapesWorkspace = getElement('atlas-shapes-workspace');
  const globeButton = getElement('btn-atlas-globe');
  const shapesButton = getElement('btn-atlas-shapes');
  const shapeSelect = getElement('atlas-shape-country');
  const shapeArt = getElement('atlas-shape-art');
  const shapeStatus = getElement('atlas-shape-status');
  getElement('atlas-shapes-title');
  getElement('atlas-shape-index');
  getElement('btn-atlas-shape-previous');
  getElement('btn-atlas-shape-next');
  getElement('atlas-shape-region');
  getElement('atlas-shape-name');
  getElement('atlas-shape-capital');
  getElement('atlas-shape-borders');
  getElement('atlas-shape-area');
  getElement('atlas-shape-info-slot');
  getElement('btn-atlas-shape-explore');
  getElement('btn-atlas-shape-challenge');
  const metaTheme = new FakeElement('meta');

  const document = {
    readyState: 'complete',
    body: { dataset: {} },
    getElementById: getElement,
    querySelector(selector) {
      if (selector === '.explorer-info-panel') return infoPanel;
      if (selector === 'meta[name="theme-color"]') return metaTheme;
      return null;
    },
    createElement: tag => new FakeElement(tag),
    addEventListener() {}
  };
  const cards = [1, 2, 3, 4].map(id => ({
    id,
    name: `Country ${id}`,
    continent: 'Africa',
    subregion: 'Fixture region',
    capital: 'Fixture capital',
    neighbors: [],
    area_hint: 'Fixture area'
  }));
  const root = {
    document,
    setInterval(callback, milliseconds) {
      const id = nextTimerId++;
      timers.set(id, { callback, milliseconds });
      return id;
    },
    clearInterval(id) { timers.delete(id); cleared.push(id); },
    addEventListener() {},
    GeoWars: {
      explorer: {
        getState: () => ({ huntActive: false }),
        renderCountry() {},
        endHunt() {}
      },
      shapes: { setQuizSetupOpen() {} }
    },
    GeoWarsShapeGeometry: {
      render(container) {
        container.textContent = '';
        return Promise.resolve(container);
      }
    }
  };
  const sandbox = {
    window: root,
    document,
    countryCards: cards,
    Math: math,
    console
  };
  vm.runInNewContext(atlasSource, sandbox, { filename: 'atlas.js' });

  return {
    atlas: root.GeoWars.atlas,
    elements,
    timers,
    cleared,
    showShapes: () => root.GeoWars.atlas.showShapes({ focus: false, announce: false }),
    showGlobe: () => root.GeoWars.atlas.showGlobe({ focus: false, announce: false }),
    runTimer() {
      const timer = [...timers.values()][0];
      assert.ok(timer, 'a demo timer should be registered');
      timer.callback();
    },
    get shapesWorkspace() { return shapesWorkspace; },
    get shapeStatus() { return shapeStatus; },
    get shapeSelect() { return shapeSelect; },
    get previousButton() { return getElement('btn-atlas-shape-previous'); },
    get nextButton() { return getElement('btn-atlas-shape-next'); },
    get globeButton() { return globeButton; },
    get shapesButton() { return shapesButton; }
  };
}

test('Shapes toolbar markup has the requested controls and unique IDs', () => {
  assert.match(indexHtml, /class="atlas-shape-toolbar"[\s\S]*Shape library[\s\S]*Explore a country outline/);
  assert.match(indexHtml, /id="atlas-shape-status"[^>]*>Preview mode is on - click to take over\.<\/p>/);
  assert.equal((indexHtml.match(/id="btn-atlas-shape-previous"/g) ?? []).length, 1);
  assert.equal((indexHtml.match(/id="atlas-shape-country"/g) ?? []).length, 1);
  assert.equal((indexHtml.match(/id="btn-atlas-shape-next"/g) ?? []).length, 1);
  assert.match(indexHtml, /id="btn-atlas-shape-previous"[^>]*aria-label="Previous country"/);
  assert.match(indexHtml, /id="btn-atlas-shape-next"[^>]*aria-label="Next country"/);
});

test('Globe and Shapes navigation keeps accessible labels, controls, and pressed states', () => {
  assert.match(indexHtml, /id="btn-atlas-globe"[^>]*aria-pressed="true"[^>]*aria-controls="atlas-globe-workspace"[^>]*aria-label="Globe, Explore"/);
  assert.match(indexHtml, /id="btn-atlas-shapes"[^>]*aria-pressed="false"[^>]*aria-controls="atlas-shapes-workspace"[^>]*aria-label="Shapes, Learn outlines"/);
  assert.match(indexHtml, /class="atlas-nav-copy"><strong>Globe<\/strong><small>Explore<\/small>/);
  assert.match(indexHtml, /class="atlas-nav-copy"><strong>Shapes<\/strong><small>Learn outlines<\/small>/);
});

test('opening Shapes selects a random country and starts one five-second demo timer', () => {
  const harness = createHarness([0]);
  assert.equal(harness.atlas.getState().countryId, 1, 'fixture starts on the default country');
  harness.showShapes();
  assert.equal(harness.atlas.getState().view, 'shapes');
  assert.equal(harness.atlas.getState().demoActive, true);
  assert.equal(harness.atlas.getState().countryId, 2, 'demo avoids repeating the current country');
  assert.equal(harness.timers.size, 1);
  assert.equal([...harness.timers.values()][0].milliseconds, 5000);
  assert.equal(harness.shapeStatus.textContent, 'Preview mode is on - click to take over.');
});

test('each demo transition changes country and avoids consecutive repeats', () => {
  const harness = createHarness([0, 0, 0, 0]);
  harness.showShapes();
  const first = harness.atlas.getState().countryId;
  harness.runTimer();
  const second = harness.atlas.getState().countryId;
  harness.runTimer();
  const third = harness.atlas.getState().countryId;
  assert.notEqual(second, first);
  assert.notEqual(third, second);
});

test('first Shapes-workspace interaction stops demo mode and updates status', () => {
  const harness = createHarness([0]);
  harness.showShapes();
  harness.shapesWorkspace.dispatch('keydown', { key: 'ArrowRight' });
  assert.equal(harness.atlas.getState().demoActive, false);
  assert.equal(harness.timers.size, 0);
  assert.equal(harness.cleared.length, 1);
  assert.equal(harness.shapeStatus.textContent, 'Preview paused - use the controls to browse.');
});

test('selector, Previous/Next, and Shape Quiz controls all take over from demo mode', () => {
  for (const interact of [
    harness => harness.shapeSelect.dispatch('change'),
    harness => harness.previousButton.dispatch('click'),
    harness => harness.nextButton.dispatch('click'),
    harness => harness.elements.get('btn-atlas-shape-challenge').dispatch('click')
  ]) {
    const harness = createHarness([0]);
    harness.showShapes();
    interact(harness);
    assert.equal(harness.atlas.getState().demoActive, false);
    assert.equal(harness.timers.size, 0);
  }
});

test('automatic Shapes previews stay quiet while manual browsing announces', () => {
  const harness = createHarness([0, 0]);
  const live = harness.elements.get('explorer-live');
  harness.showShapes();
  const automaticMessage = live.textContent;

  harness.runTimer();
  assert.equal(live.textContent, automaticMessage);

  harness.nextButton.dispatch('click');
  assert.match(live.textContent, /^Studying Country /);
});

test('switching back to Globe clears the demo timer and preserves pressed state', () => {
  const harness = createHarness([0]);
  harness.showShapes();
  harness.showGlobe();
  assert.equal(harness.atlas.getState().view, 'globe');
  assert.equal(harness.atlas.getState().demoActive, false);
  assert.equal(harness.timers.size, 0);
  assert.equal(harness.cleared.length, 1);
  assert.equal(harness.globeButton.getAttribute('aria-pressed'), 'true');
  assert.equal(harness.shapesButton.getAttribute('aria-pressed'), 'false');
});
