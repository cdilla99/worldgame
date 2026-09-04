import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

// Focused regression coverage for the World Explorer logo/home control
// ([data-explorer-home] -> returnHome()) documented in
// .kiro/specs/explorer-home-reset-fix. Before the fix, activating the home
// control while a country was selected left selectedCountryId set and the
// globe panned/zoomed away from its default view, so the control appeared
// to do nothing. This suite drives the real globe-explorer.js source
// through a minimal fake DOM/window and asserts the reset behavior.

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');
const explorerSource = fs.readFileSync(path.join(root, 'globe-explorer.js'), 'utf8');

const DEFAULT_LONGITUDE = -16;
const DEFAULT_LATITUDE = 12;
const DEFAULT_ZOOM = 1;
const DEFAULT_STATUS = 'Drag to explore. Select a country or territory to learn more.';

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
  constructor(tag = 'div', id = '', classes = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.classList = new FakeClassList(classes);
    this.attributes = new Map();
    this.listeners = new Map();
    this.children = [];
    this.dataset = {};
    this.textContent = '';
    this.value = '';
    this.src = '';
    this.alt = '';
    this.href = '';
    this.open = false;
    this.disabled = false;
  }
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  setAttribute(name, value) {
    const stringValue = String(value);
    this.attributes.set(name, stringValue);
    if (name === 'src' || name === 'alt' || name === 'href') this[name] = stringValue;
  }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) {
    this.attributes.delete(name);
    if (name === 'src' || name === 'alt' || name === 'href') this[name] = '';
  }
  appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
  replaceChildren(...children) { this.children = []; children.forEach(child => this.appendChild(child)); }
  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter(child => child !== this);
    this.parentNode = null;
  }
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
      const classes = id === 'explorer-empty-card' || id === 'explorer-landmark-media' ? 'hidden' : '';
      const element = new FakeElement('div', id, classes);
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
    querySelectorAll: selector => selector === '[data-explorer-home]' ? homeButtons.length ? homeButtons : [getElement('btn-explorer-home')] : [],
    createElement: tag => new FakeElement(tag),
    head: { appendChild() {} },
    addEventListener() {}
  };
  const navigateCalls = { showHome: 0, showExplorer: 0 };
  const musicCalls = { stop: 0 };
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
    BackgroundMusic: { stop() { musicCalls.stop += 1; } },
    GeoWars: {
      navigate: {
        showHome() { navigateCalls.showHome += 1; },
        showExplorer() { navigateCalls.showExplorer += 1; }
      }
    }
  };
  const sandbox = { window: root, document, countryCards: [country], ResizeObserver, CustomEvent, console };
  vm.runInNewContext(explorerSource, sandbox, { filename: 'globe-explorer.js' });
  return {
    explorer: root.GeoWars.explorer,
    getElement,
    country,
    navigateCalls,
    musicCalls,
    homeButton: getElement('btn-explorer-home'),
    canvas: getElement('explorer-globe-canvas'),
    emptyCard: getElement('explorer-empty-card'),
    countryCard: getElement('explorer-country-card'),
    live: getElement('explorer-live'),
    status: getElement('explorer-globe-status')
  };
}

test('activating the home control after a selection resets selection, view, and status', () => {
  const harness = createHarness();
  const { explorer } = harness;

  explorer.open();
  explorer.selectCountry(harness.country.id, { animate: false });

  let state = explorer.getState();
  assert.equal(state.selectedCountryId, harness.country.id, 'selection must be set before activating home');
  assert.equal(harness.countryCard.classList.contains('hidden'), false, 'country card must be visible before activating home');

  harness.homeButton.click();

  state = explorer.getState();
  assert.equal(state.selectedCountryId, null, 'home control must clear the selected country');
  assert.equal(state.hoveredCountryId, null, 'home control must clear the hovered country');
  assert.equal(state.centeredCountryId, null, 'home control must clear the centered country');
  assert.equal(state.longitude, DEFAULT_LONGITUDE, 'home control must reset longitude to the default view');
  assert.equal(state.latitude, DEFAULT_LATITUDE, 'home control must reset latitude to the default view');
  assert.equal(state.zoom, DEFAULT_ZOOM, 'home control must reset zoom to the default view');
  assert.equal(harness.emptyCard.classList.contains('hidden'), false, 'the empty-state card must be shown after returning home');
  assert.equal(harness.countryCard.classList.contains('hidden'), true, 'the country card must be hidden after returning home');
  assert.equal(harness.status.textContent, DEFAULT_STATUS, 'status text must match the pre-selection default message');
  assert.equal(harness.live.textContent, DEFAULT_STATUS, 'live region must match the default explorer announcement');
  assert.equal(harness.musicCalls.stop, 1, 'background music must still be stopped on activation');
  assert.equal(harness.navigateCalls.showHome, 1, 'navigation.showHome must still be invoked exactly once');
});

test('activating the home control resets a panned and zoomed globe', () => {
  const harness = createHarness();
  const { explorer } = harness;

  explorer.open();
  explorer.selectCountry(harness.country.id, { animate: false });

  harness.canvas.dispatch('keydown', { key: 'ArrowRight' });
  harness.canvas.dispatch('keydown', { key: '+' });
  const pannedAndZoomed = explorer.getState();
  assert.notEqual(pannedAndZoomed.longitude, DEFAULT_LONGITUDE, 'fixture must pan before testing reset');
  assert.equal(pannedAndZoomed.latitude, DEFAULT_LATITUDE, 'horizontal pan should preserve latitude');
  assert.notEqual(pannedAndZoomed.zoom, DEFAULT_ZOOM, 'fixture must zoom before testing reset');

  harness.homeButton.click();

  const state = explorer.getState();
  assert.equal(state.longitude, DEFAULT_LONGITUDE);
  assert.equal(state.latitude, DEFAULT_LATITUDE);
  assert.equal(state.zoom, DEFAULT_ZOOM);
});

test('activating the home control mid-hunt ends the hunt and clears any prior selection', () => {
  const harness = createHarness();
  const { explorer } = harness;

  explorer.open();
  explorer.selectCountry(harness.country.id, { animate: false });
  explorer.startHunt();

  let state = explorer.getState();
  assert.equal(state.huntActive, true, 'hunt must be active before activating home');

  harness.homeButton.click();

  state = explorer.getState();
  assert.equal(state.huntActive, false, 'home control must end the active hunt');
  assert.equal(state.selectedCountryId, null, 'home control must clear any pre-hunt selection');
  assert.equal(harness.emptyCard.classList.contains('hidden'), false, 'the empty-state card must be shown, not a stale hunt summary card');
  assert.equal(harness.countryCard.classList.contains('hidden'), true);
});

test('activating the home control with no prior selection stays in the default state', () => {
  const harness = createHarness();
  const { explorer } = harness;

  explorer.open();
  harness.homeButton.click();

  const state = explorer.getState();
  assert.equal(state.selectedCountryId, null);
  assert.equal(state.longitude, DEFAULT_LONGITUDE);
  assert.equal(state.latitude, DEFAULT_LATITUDE);
  assert.equal(state.zoom, DEFAULT_ZOOM);
  assert.equal(harness.emptyCard.classList.contains('hidden'), false);
  assert.equal(harness.countryCard.classList.contains('hidden'), true);
});
