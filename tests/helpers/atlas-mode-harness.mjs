/**
 * Atlas mode controller test harness.
 *
 * Provides minimal DOM fakes, a fake GeoWars.explorer with hunt lifecycle,
 * and a reference state model implementing the design's state diagram.
 *
 * **Validates: Requirements 6.6, 7.3, 8.6, 9.1, 9.2**
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(testDirectory, '..', '..');
const atlasSource = fs.readFileSync(path.join(rootDirectory, 'atlas.js'), 'utf8');

// ============================================================================
// DOM FAKES
// ============================================================================

export class FakeClassList {
  constructor(initial = '') {
    this.values = new Set(initial.split(/\s+/).filter(Boolean));
  }
  add(...names) { names.forEach(name => this.values.add(name)); }
  remove(...names) { names.forEach(name => this.values.delete(name)); }
  contains(name) { return this.values.has(name); }
  toggle(name, force) {
    const next = force === undefined ? !this.values.has(name) : Boolean(force);
    if (next) this.values.add(name); else this.values.delete(name);
    return next;
  }
}

export class FakeElement {
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
    this.disabled = false;
    this.ariaHidden = null;
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    const index = listeners.indexOf(listener);
    if (index >= 0) listeners.splice(index, 1);
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name === 'hidden') this.hidden = true;
    if (name === 'inert') this.inert = true;
    if (name === 'aria-hidden') this.ariaHidden = String(value);
  }

  getAttribute(name) {
    if (name === 'hidden') return this.hidden ? '' : null;
    if (name === 'inert') return this.inert ? '' : null;
    if (name === 'aria-hidden') return this.ariaHidden;
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
    if (name === 'hidden') this.hidden = false;
    if (name === 'inert') this.inert = false;
    if (name === 'aria-hidden') this.ariaHidden = null;
  }

  hasAttribute(name) {
    if (name === 'hidden') return this.hidden;
    if (name === 'inert') return this.inert;
    if (name === 'aria-hidden') return this.ariaHidden !== null;
    return this.attributes.has(name);
  }

  appendChild(child) {
    this.children.push(child);
    child.parentNode = this;
    return child;
  }

  replaceChildren(...children) {
    this.children = [];
    children.forEach(child => this.appendChild(child));
  }

  focus() {
    // Track focus for activeElement
    if (this._document) this._document._activeElement = this;
  }

  blur() {
    if (this._document?._activeElement === this) {
      this._document._activeElement = null;
    }
  }

  click() {
    this.dispatchEvent('click', {});
  }

  dispatchEvent(type, event = {}) {
    const dispatched = {
      preventDefault() {},
      stopPropagation() {},
      target: this,
      currentTarget: this,
      ...event
    };
    (this.listeners.get(type) ?? []).forEach(listener => listener(dispatched));
    return true;
  }

  querySelector() { return null; }
  querySelectorAll() { return []; }
  closest() { return null; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 560, height: 560 }; }
}

// ============================================================================
// FAKE EXPLORER (Hunt lifecycle)
// ============================================================================

export class FakeExplorer {
  constructor(root) {
    this._root = root;
    this._huntActive = false;
    this._summaryVisible = false;
    this._listeners = new Map();
  }

  getState() {
    return {
      huntActive: this._huntActive,
      summaryVisible: this._summaryVisible
    };
  }

  startHunt() {
    this._huntActive = true;
    this._summaryVisible = false;
    this._emitModeEvent('hunt', false);
  }

  endHunt(showSummary) {
    this._huntActive = false;
    this._summaryVisible = Boolean(showSummary);
    this._emitModeEvent('free', this._summaryVisible);
  }

  dismissHuntSummary() {
    if (!this._summaryVisible) return false;
    this._summaryVisible = false;
    return true;
  }

  renderCountry() {
    // No-op for harness
  }

  _emitModeEvent(mode, summary) {
    if (typeof this._root.dispatchEvent !== 'function') return;
    if (typeof this._root.CustomEvent !== 'function') return;
    const event = new this._root.CustomEvent('geowars:explorer-mode', {
      detail: { mode, summary: Boolean(summary) }
    });
    this._root.dispatchEvent(event);
  }
}

// ============================================================================
// FAKE WORLDLE
// ============================================================================

export class FakeWorldle {
  constructor() {
    this.openCalls = 0;
  }

  open() {
    this.openCalls++;
  }
}

// ============================================================================
// RANDOM AND PROPERTY RUNNER
// ============================================================================

export function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function runProperty({ name, seed, cases, generate, verify }) {
  const random = createRandom(seed);
  for (let iteration = 0; iteration < cases; iteration += 1) {
    const input = generate(random);
    try {
      verify(input);
    } catch (error) {
      error.message = `${name} failed (seed=0x${seed.toString(16)}, iteration=${iteration}, input=${JSON.stringify(input)}): ${error.message}`;
      throw error;
    }
  }
  console.log(`${name} passed (${cases} cases, seed=0x${seed.toString(16)})`);
}

// ============================================================================
// REFERENCE STATE MODEL
// ============================================================================

/**
 * Reference model implementing the mode state diagram from the design.
 * States: Explore_Globe, Explore_Shapes, Challenge_Panel, Challenge_Hunt,
 *         Hunt_Summary, Daily_Puzzle
 *
 * This model is used for property-based verification that the implementation
 * matches the spec's state transitions.
 */
export class ModelState {
  constructor() {
    this.mode = 'explore';
    this.exploreView = 'globe';
    this.challengeStage = 'panel';
    this.dailyReturn = null;
    this.huntSwitchDialogOpen = false;
    this.pendingSwitch = null;
  }

  getState() {
    return {
      mode: this.mode,
      exploreView: this.exploreView,
      challengeStage: this.challengeStage,
      dailyReturn: this.dailyReturn
        ? { mode: this.dailyReturn.mode, exploreView: this.dailyReturn.exploreView }
        : null,
      huntSwitchDialogOpen: this.huntSwitchDialogOpen,
      pendingSwitch: this.pendingSwitch
    };
  }

  getEffectiveState() {
    if (this.mode === 'explore') {
      return this.exploreView === 'shapes' ? 'Explore_Shapes' : 'Explore_Globe';
    }
    // Challenge mode
    if (this.challengeStage === 'panel') return 'Challenge_Panel';
    if (this.challengeStage === 'hunt') return 'Challenge_Hunt';
    if (this.challengeStage === 'summary') return 'Hunt_Summary';
    return 'Challenge_Panel';
  }

  // Actions from the design's state diagram
  showGlobe() {
    if (this.mode === 'challenge' && this.challengeStage === 'hunt') {
      // Needs confirmation dialog - stays in current state
      return false;
    }
    this.mode = 'explore';
    this.dailyReturn = null;
    this.exploreView = 'globe';
    this.challengeStage = 'panel';
    return true;
  }

  showShapes() {
    if (this.mode === 'challenge' && this.challengeStage === 'hunt') {
      return false;
    }
    this.mode = 'explore';
    this.dailyReturn = null;
    this.exploreView = 'shapes';
    this.challengeStage = 'panel';
    return true;
  }

  showExplore() {
    if (this.mode === 'challenge' && this.challengeStage === 'hunt') {
      return false;
    }
    this.mode = 'explore';
    this.dailyReturn = null;
    this.challengeStage = 'panel';
    return true;
  }

  showChallenge() {
    if (this.mode === 'challenge' && this.challengeStage === 'hunt') {
      // Running hunt stays running
      return false;
    }
    this.mode = 'challenge';
    this.dailyReturn = null;
    this.challengeStage = 'panel';
    return true;
  }

  startHunt() {
    this.mode = 'challenge';
    this.challengeStage = 'hunt';
  }

  endHunt(showSummary) {
    this.mode = 'challenge';
    this.challengeStage = showSummary ? 'summary' : 'panel';
  }

  dismissSummary() {
    if (this.challengeStage !== 'summary') return false;
    this.challengeStage = 'panel';
    return true;
  }

  openDailyPuzzle() {
    if (this.mode === 'challenge' && this.challengeStage === 'hunt') {
      return false;
    }
    if (this.mode !== 'daily') {
      this.dailyReturn = {
        mode: this.mode,
        exploreView: this.exploreView
      };
    }
    this.mode = 'daily';
    this.challengeStage = 'panel';
    return true;
  }

  returnFromDailyPuzzle() {
    const returnState = this.dailyReturn;
    this.dailyReturn = null;
    if (returnState) {
      this.mode = returnState.mode;
      if (returnState.mode === 'challenge') {
        this.challengeStage = 'panel';
      } else {
        this.exploreView = returnState.exploreView || 'globe';
      }
    } else {
      this.mode = 'explore';
      this.exploreView = 'globe';
    }
  }

  openHuntSwitchDialog(target) {
    this.huntSwitchDialogOpen = true;
    this.pendingSwitch = { target };
  }

  cancelHuntSwitch() {
    this.huntSwitchDialogOpen = false;
    this.pendingSwitch = null;
  }

  confirmHuntSwitch() {
    const pending = this.pendingSwitch;
    this.huntSwitchDialogOpen = false;
    this.pendingSwitch = null;
    if (!pending) return;

    this.endHunt(false);
    const target = pending.target;

    if (target === 'daily') {
      this.dailyReturn = { mode: this.mode, exploreView: this.exploreView };
      this.mode = 'daily';
      this.challengeStage = 'panel';
    } else if (target === 'shapes') {
      this.mode = 'explore';
      this.exploreView = 'shapes';
    } else {
      this.mode = 'explore';
    }
  }
}

// ============================================================================
// ACTIONS TABLE (Design "Correctness Properties" activations)
// ============================================================================

/**
 * Actions table covering every activation and API call from the design's
 * Correctness Properties section.
 */
export const ACTIONS = {
  // Explore view activations
  showGlobe: harness => harness.atlas.showGlobe({ focus: false, announce: false }),
  showShapes: harness => harness.atlas.showShapes({ focus: false, announce: false }),
  showExplore: harness => harness.atlas.showExplore({ focus: false, announce: false }),
  showChallenge: harness => harness.atlas.showChallenge({ focus: false, announce: false }),

  // Globe and Shapes view buttons
  clickGlobeButton: harness => harness.globeButton.click(),
  clickShapesButton: harness => harness.shapesButton.click(),

  // Mode nav buttons
  clickExploreMode: harness => harness.exploreModeButton?.click(),
  clickChallengeMode: harness => harness.challengeModeButton?.click(),

  // Hunt lifecycle
  startHunt: harness => harness.explorer.startHunt(),
  endHunt: harness => harness.explorer.endHunt(true),
  endHuntNoSummary: harness => harness.explorer.endHunt(false),

  // Daily Puzzle
  openDailyPuzzle: harness => harness.atlas.openDailyPuzzle(),
  returnFromDailyPuzzle: harness => harness.atlas.returnFromDailyPuzzle(),

  // Hunt switch dialog
  confirmHuntSwitch: harness => harness.huntSwitchYes?.click(),
  cancelHuntSwitch: harness => harness.huntSwitchNo?.click(),
  escapeHuntSwitch: harness => {
    harness.huntSwitchDialog?.dispatchEvent('keydown', { key: 'Escape' });
  }
};

// ============================================================================
// HARNESS FACTORY
// ============================================================================

export function createHarness(options = {}) {
  const {
    randomValues = [0],
    initialView = 'globe',
    countryCards = [
      { id: 1, name: 'Afghanistan', continent: 'Asia', subregion: 'Southern Asia', capital: 'Kabul', neighbors: [], area_hint: 'Large' },
      { id: 2, name: 'Canada', continent: 'North America', subregion: 'Northern America', capital: 'Ottawa', neighbors: [3], area_hint: 'Very large' },
      { id: 3, name: 'United States', continent: 'North America', subregion: 'Northern America', capital: 'Washington', neighbors: [2], area_hint: 'Large' },
      { id: 4, name: 'Mexico', continent: 'North America', subregion: 'Central America', capital: 'Mexico City', neighbors: [3], area_hint: 'Large' }
    ]
  } = options;

  const elements = new Map();
  const timers = new Map();
  const cleared = [];
  const events = [];
  let nextTimerId = 1;
  let randomIndex = 0;

  const math = Object.create(Math);
  math.random = () => randomValues[Math.min(randomIndex++, randomValues.length - 1)] ?? 0;

  // Pre-create the document object so getElement can reference it
  const documentObj = {
    readyState: 'complete',
    hidden: false,
    body: {
      dataset: {},
      classList: new FakeClassList('')
    },
    getElementById: null, // Set below after getElement is defined
    querySelector(selector) {
      if (selector === '.explorer-info-panel') return elements.get('explorer-info-panel');
      if (selector === 'meta[name="theme-color"]') return null;
      return null;
    },
    querySelectorAll() { return []; },
    createElement: tag => {
      const element = new FakeElement(tag);
      element._document = documentObj;
      return element;
    },
    head: { appendChild() {} },
    addEventListener() {},
    _activeElement: null
  };

  Object.defineProperty(documentObj, 'activeElement', {
    get() { return documentObj._activeElement; },
    set(value) { documentObj._activeElement = value; }
  });

  const getElement = id => {
    if (!elements.has(id)) {
      const element = new FakeElement('div', id);
      element._document = documentObj;
      elements.set(id, element);
    }
    return elements.get(id);
  };

  // Now connect documentObj.getElementById to getElement
  documentObj.getElementById = getElement;

  // Build the minimal DOM structure needed for atlas.js
  const screen = getElement('explorer');
  screen.dataset.atlasView = initialView;
  screen.dataset.atlasMode = 'explore';

  const infoPanel = getElement('explorer-info-panel');
  infoPanel.classList.add('explorer-info-panel');
  const infoHome = new FakeElement('div');
  infoHome.appendChild(infoPanel);

  const globeWorkspace = getElement('atlas-globe-workspace');
  const shapesWorkspace = getElement('atlas-shapes-workspace');
  const challengePanel = getElement('atlas-challenge-panel');
  challengePanel.hidden = true;
  challengePanel.inert = true;
  challengePanel.classList.add('hidden');

  const globeButton = getElement('btn-atlas-globe');
  const shapesButton = getElement('btn-atlas-shapes');
  const exploreModeButton = getElement('btn-mode-explore');
  exploreModeButton.classList.add('is-active');
  const challengeModeButton = getElement('btn-mode-challenge');

  const globeTitle = getElement('atlas-globe-title');
  const shapeTitle = getElement('atlas-shapes-title');
  const challengeTitle = getElement('atlas-challenge-title');
  const challengeHuntButton = getElement('btn-challenge-hunt');

  const shapeSelect = getElement('atlas-shape-country');
  const shapeArt = getElement('atlas-shape-art');
  const shapeStatus = getElement('atlas-shape-status');
  const live = getElement('explorer-live');

  const exploreSwitch = getElement('atlas-explore-switch');

  // Hunt switch dialog
  const huntSwitchDialog = getElement('hunt-switch-confirm');
  huntSwitchDialog.classList.add('hidden');
  huntSwitchDialog.hidden = true;
  const huntSwitchTitle = getElement('hunt-switch-title');
  huntSwitchTitle.tabIndex = -1;
  const huntSwitchMessage = getElement('hunt-switch-message');
  const huntSwitchYes = getElement('btn-hunt-switch-yes');
  const huntSwitchNo = getElement('btn-hunt-switch-no');

  // Info panel slot for Shapes view
  const infoSlot = getElement('atlas-shape-info-slot');

  const document = documentObj;

  class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail ?? null;
    }
  }

  // Build the root object
  const rootElement = {
    addEventListener(type, listener) {
      const listeners = elements.get('__root_listeners__')?.listeners?.get(type) ?? [];
      listeners.push(listener);
      if (!elements.has('__root_listeners__')) {
        const el = new FakeElement('div');
        el.listeners = new Map();
        elements.set('__root_listeners__', el);
      }
      const rootListeners = elements.get('__root_listeners__').listeners;
      rootListeners.set(type, listeners);
    },
    dispatchEvent(event) {
      events.push(event);
      const listeners = elements.get('__root_listeners__')?.listeners?.get(event.type) ?? [];
      listeners.forEach(listener => listener(event));
    },
    clearInterval(id) {
      timers.delete(id);
      cleared.push(id);
    },
    scrollTo() {},
    CustomEvent
  };

  const explorer = new FakeExplorer(rootElement);
  const worldle = new FakeWorldle();

  const shapes = {
    setQuizSetupOpen() {}
  };

  rootElement.GeoWars = {
    explorer,
    shapes,
    worldle,
    navigate: {
      showExplorer() {}
    }
  };

  rootElement.GeoWarsShapeGeometry = {
    render(container) {
      container.textContent = '';
      return Promise.resolve(container);
    }
  };

  rootElement.setInterval = (callback, milliseconds) => {
    const id = nextTimerId++;
    timers.set(id, { callback, milliseconds });
    return id;
  };

  // Execute atlas.js in the sandbox
  const sandbox = {
    window: rootElement,
    document,
    countryCards,
    Math: math,
    console
  };

  try {
    vm.runInNewContext(atlasSource, sandbox, { filename: 'atlas.js' });
  } catch (error) {
    // If atlas fails to initialize, provide a minimal mock
    console.error('Atlas initialization failed:', error.message);
  }

  const atlas = rootElement.GeoWars?.atlas;

  return {
    atlas,
    elements,
    timers,
    cleared,
    events,
    document,
    root: rootElement,
    explorer,
    worldle,
    live,

    // Convenience element accessors
    get screen() { return screen; },
    get globeWorkspace() { return globeWorkspace; },
    get shapesWorkspace() { return shapesWorkspace; },
    get challengePanel() { return challengePanel; },
    get globeButton() { return globeButton; },
    get shapesButton() { return shapesButton; },
    get exploreModeButton() { return exploreModeButton; },
    get challengeModeButton() { return challengeModeButton; },
    get exploreSwitch() { return exploreSwitch; },
    get globeTitle() { return globeTitle; },
    get shapeTitle() { return shapeTitle; },
    get challengeTitle() { return challengeTitle; },
    get huntSwitchDialog() { return huntSwitchDialog; },
    get huntSwitchYes() { return huntSwitchYes; },
    get huntSwitchNo() { return huntSwitchNo; },
    get huntSwitchMessage() { return huntSwitchMessage; },
    get huntSwitchTitle() { return huntSwitchTitle; },
    get shapeStatus() { return shapeStatus; },
    get infoPanel() { return infoPanel; },
    get infoHome() { return infoHome; },
    get infoSlot() { return infoSlot; },
    get challengeHuntButton() { return challengeHuntButton; },

    // Action helpers
    showGlobe(opts = {}) {
      return atlas?.showGlobe?.({ focus: false, announce: false, ...opts });
    },
    showShapes(opts = {}) {
      return atlas?.showShapes?.({ focus: false, announce: false, ...opts });
    },
    showExplore(opts = {}) {
      return atlas?.showExplore?.({ focus: false, announce: false, ...opts });
    },
    showChallenge(opts = {}) {
      return atlas?.showChallenge?.({ focus: false, announce: false, ...opts });
    },

    // Timer control for demo mode
    runTimer() {
      const timer = [...timers.values()][0];
      assert.ok(timer, 'a demo timer should be registered');
      timer.callback();
    },

    // Model state helper
    get modelState() {
      return atlas?.getState?.() ?? null;
    },

    // Active element tracking
    get activeElement() {
      return document._activeElement;
    }
  };
}

// Re-export commonly used utilities
export default createHarness;
