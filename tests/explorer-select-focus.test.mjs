import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

// Regression coverage for decoupling selection from camera movement in the
// World Explorer. Before this change, a single tap/selection immediately
// re-centered and auto-zoomed the globe, yanking the view away from the
// surrounding countries. Now selection only shows the info card; centering +
// auto-zoom is an explicit action (the "Zoom to country" card button, a second
// activation of the already-selected country, or a second keyboard Enter),
// exposed as explorer.focusSelectedCountry().
//
// animateToCountry() requires loaded geometry and RAF, neither of which the
// minimal fixture provides, so camera math is asserted at the source level
// (mirroring tests/country-hunt.test.mjs). The observable focus-button state
// and the select-does-not-animate contract are asserted behaviorally.

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');
const explorerSource = fs.readFileSync(path.join(root, 'globe-explorer.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

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
    this.dataset = {};
    this.textContent = '';
    this.value = '';
    this.disabled = false;
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
  replaceChildren(...children) { this.children = []; children.forEach(child => this.appendChild(child)); }
  remove() {}
  querySelector() { return null; }
  querySelectorAll() { return []; }
  closest() { return null; }
  focus() {}
  scrollIntoView() {}
  click() { (this.listeners.get('click') ?? []).forEach(listener => listener({ preventDefault() {} })); }
  dispatch(type, event = {}) {
    const dispatched = { preventDefault() {}, target: this, ...event };
    (this.listeners.get(type) ?? []).forEach(listener => listener(dispatched));
  }
  getContext() { return createCanvasContext(); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 560, height: 560 }; }
  setPointerCapture() {}
  releasePointerCapture() {}
  hasPointerCapture() { return false; }
}

function createCanvasContext() {
  return new Proxy({}, {
    get(target, property) {
      if (property === 'getImageData') return () => ({ data: [0, 0, 0, 0] });
      return target[property] ?? (() => {});
    },
    set(target, property, value) { target[property] = value; return true; }
  });
}

function createHarness() {
  const elements = new Map();
  const homeButtons = [];
  const getElement = id => {
    if (!elements.has(id)) {
      const element = new FakeElement('div', id);
      if (id === 'explorer-empty-card' || id === 'explorer-landmark-media') element.classList.add('hidden');
      if (id === 'btn-explorer-home') homeButtons.push(element);
      elements.set(id, element);
    }
    return elements.get(id);
  };
  const document = {
    readyState: 'complete',
    hidden: false,
    getElementById: getElement,
    querySelector: selector => selector.startsWith('#') ? getElement(selector.slice(1)) : null,
    querySelectorAll: selector => selector === '[data-explorer-home]' ? [getElement('btn-explorer-home')] : [],
    createElement: tag => new FakeElement(tag),
    head: { appendChild() {} },
    addEventListener() {}
  };
  const country = {
    id: 42,
    name: 'Fixture Country',
    flag: '🏳️',
    continent: 'Africa',
    subregion: 'Fixture region',
    landmarks: [],
    main_languages: ['Fixture'],
    neighbors: [],
    kind: 'country'
  };
  class ResizeObserver { observe() {} disconnect() {} }
  class CustomEvent { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } }
  const root = {
    document,
    performance: { now: () => 0 },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    requestAnimationFrame: () => 1,
    cancelAnimationFrame() {},
    setTimeout: () => 0,
    clearTimeout() {},
    setInterval: () => 0,
    clearInterval() {},
    addEventListener() {},
    dispatchEvent() {},
    fetch() { return Promise.reject(new Error('network access is not used by this fixture')); },
    BackgroundMusic: { stop() {} },
    GeoWars: { navigate: { showHome() {}, showExplorer() {} } }
  };
  const sandbox = { window: root, document, countryCards: [country], ResizeObserver, CustomEvent, console };
  vm.runInNewContext(explorerSource, sandbox, { filename: 'globe-explorer.js' });
  return {
    explorer: root.GeoWars.explorer,
    country,
    focusButton: getElement('btn-explorer-focus-country'),
    countryCard: getElement('explorer-country-card')
  };
}

test('the country card markup includes a Zoom to country control', () => {
  assert.match(indexHtml, /id="btn-explorer-focus-country"/);
  assert.match(indexHtml, /Zoom to country/);
});

test('selectCountry no longer moves the camera unless animate is explicitly true', () => {
  // Selection must default to a calm, camera-preserving update; the auto-fit
  // animation is opt-in via { animate: true }.
  assert.match(
    explorerSource,
    /function selectCountry\(countryId, options = \{\}\)[\s\S]*if \(options\.animate === true\) animateToCountry\(country\);\s*else draw\(\);/,
    'selectCountry must only animate when options.animate === true'
  );
});

test('focusSelectedCountry is the explicit center + zoom action and is exposed on the API', () => {
  assert.match(explorerSource, /function focusSelectedCountry\(\) \{[\s\S]*animateToCountry\(country\);/);
  // No-op guard so it cannot fight the hunt camera or run without a selection.
  assert.match(explorerSource, /function focusSelectedCountry\(\) \{\s*if \(huntActive \|\| !selectedCountryId\) return;/);
  assert.match(explorerSource, /focusSelectedCountry,/);
});

test('activating the already-selected country focuses it instead of re-selecting', () => {
  assert.match(
    explorerSource,
    /if \(Number\(countryId\) === selectedCountryId\) \{\s*focusSelectedCountry\(\);\s*\} else \{\s*selectCountry\(countryId, options\);\s*\}/
  );
});

test('the Zoom to country button is disabled until a country is selected', () => {
  const harness = createHarness();
  const { explorer, focusButton } = harness;

  explorer.open();
  assert.equal(focusButton.disabled, true, 'focus button must start disabled with no selection');

  explorer.selectCountry(harness.country.id, { animate: false });
  assert.equal(focusButton.disabled, false, 'focus button must enable once a country is selected');
});

test('the Zoom to country button is disabled during a hunt', () => {
  const harness = createHarness();
  const { explorer, focusButton } = harness;

  explorer.open();
  explorer.selectCountry(harness.country.id, { animate: false });
  assert.equal(focusButton.disabled, false, 'precondition: focus button enabled before the hunt');

  explorer.startHunt();
  assert.equal(focusButton.disabled, true, 'focus button must be disabled while a hunt is active');
});
