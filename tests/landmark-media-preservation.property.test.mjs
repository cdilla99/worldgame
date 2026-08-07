import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const explorerSource = fs.readFileSync(path.join(testDirectory, '..', 'globe-explorer.js'), 'utf8');

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

async function runProperty({ name, seed, cases, generate, verify }) {
  const random = createRandom(seed);
  for (let iteration = 0; iteration < cases; iteration += 1) {
    const input = generate(random, iteration);
    try {
      await verify(input);
    } catch (error) {
      error.message = `${name} failed (seed=0x${seed.toString(16)}, iteration=${iteration}, input=${JSON.stringify(input)}): ${error.message}`;
      throw error;
    }
  }
  console.log(`${name} passed (${cases} cases, seed=0x${seed.toString(16)})`);
}

class FakeClassList {
  constructor(...names) { this.names = new Set(names); }
  add(...names) { names.forEach(name => this.names.add(name)); }
  remove(...names) { names.forEach(name => this.names.delete(name)); }
  contains(name) { return this.names.has(name); }
  toggle(name, force) {
    const next = force === undefined ? !this.names.has(name) : !!force;
    if (next) this.names.add(name); else this.names.delete(name);
    return next;
  }
}

class FakeElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.id = '';
    this.classList = new FakeClassList();
    this.attributes = new Map();
    this.listeners = new Map();
    this.children = [];
    this.parentNode = null;
    this.textContent = '';
    this.value = '';
    this.src = '';
    this.alt = '';
    this.href = '';
    this.open = false;
    this.dataset = {};
    this.clickCount = 0;
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) {
    this.attributes.delete(name);
    if (name === 'src' || name === 'alt' || name === 'href') this[name] = '';
  }
  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) ?? [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }
  dispatch(type, event = {}) {
    const delivered = { type, target: this, preventDefault() { this.defaultPrevented = true; }, ...event };
    for (const handler of this.listeners.get(type) ?? []) handler(delivered);
    return delivered;
  }
  click() { this.clickCount += 1; return this.dispatch('click'); }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
  replaceChildren(...children) {
    this.children.forEach(child => { child.parentNode = null; });
    this.children = [];
    children.forEach(child => this.appendChild(child));
  }
  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter(child => child !== this);
    this.parentNode = null;
  }
  querySelector(selector) {
    if (selector === 'summary') return this.children.find(child => child.tagName === 'SUMMARY') ?? null;
    return null;
  }
  querySelectorAll(selector) {
    return selector === '[role="option"]'
      ? this.children.filter(child => child.getAttribute('role') === 'option')
      : [];
  }
  closest() { return null; }
  focus() {}
  scrollIntoView() {}
}

class FakeCanvas extends FakeElement {
  constructor() { super('canvas'); this.width = 560; this.height = 560; }
  getContext() {
    const context = { getImageData: () => ({ data: [0, 0, 0, 0] }) };
    return new Proxy(context, {
      get(target, key) {
        if (key in target) return target[key];
        return () => ({ addColorStop() {} });
      }
    });
  }
  getBoundingClientRect() { return { left: 0, top: 0, width: 560, height: 560 }; }
  setPointerCapture() {}
  releasePointerCapture() {}
  hasPointerCapture() { return false; }
}

function country({ id, name, landmark, continent = 'Africa', salt = 0 }) {
  return {
    id, name, landmark, continent,
    subregion: `Region ${salt}`,
    capital: `Capital ${salt}`,
    population_hint: `Population ${salt}`,
    main_languages: [`Language ${salt}`],
    currency: `Currency ${salt}`,
    area_hint: `Area ${salt}`,
    neighbors: [`Neighbor ${salt}`],
    landmarks: [landmark],
    fun_facts: [`Fact ${salt}`],
    built_in_clue: `Clue ${salt}`,
    flag: `Flag ${salt}`
  };
}

function mediaSnapshot(fixture) {
  const { media, image, toggle, learnMore, source } = fixture.elements;
  return {
    visible: !media.classList.contains('hidden'),
    expanded: media.classList.contains('is-expanded'),
    src: image.src,
    alt: image.alt,
    ariaExpanded: toggle.getAttribute('aria-expanded'),
    ariaLabel: toggle.getAttribute('aria-label'),
    learnHref: learnMore.href,
    learnText: learnMore.textContent,
    sourceHref: source.href
  };
}

function cardSnapshot(fixture) {
  const { countryCard, flag, name, region, capital, landmark, fact, details, practice } = fixture.elements;
  return {
    visible: !countryCard.classList.contains('hidden'),
    flagFallback: flag.textContent,
    name: name.textContent,
    region: region.textContent,
    capital: capital.textContent,
    landmark: landmark.textContent,
    fact: fact.textContent,
    detailsOpen: details.open,
    practice: practice.textContent
  };
}

function page({ title, imageUrl, sourceUrl }) {
  return { query: { pages: { 1: { title, thumbnail: imageUrl ? { source: imageUrl } : undefined, fullurl: sourceUrl } } } };
}

async function settle() {
  for (let index = 0; index < 6; index += 1) await Promise.resolve();
}

function createFixture(cards) {
  const elements = {};
  const ids = [
    'explorer', 'btn-open-explorer', 'btn-open-explorer-hunt', 'explorer-globe-canvas',
    'explorer-globe-frame', 'explorer-globe-status', 'explorer-globe-loading',
    'explorer-globe-error', 'explorer-globe-error-title', 'explorer-globe-error-copy',
    'btn-explorer-globe-retry', 'btn-explorer-search-fallback', 'explorer-live',
    'explorer-country-search', 'explorer-search-results', 'explorer-empty-card',
    'explorer-country-card', 'explorer-country-flag', 'explorer-country-name',
    'explorer-country-region', 'explorer-country-kicker', 'explorer-country-status',
    'explorer-country-capital', 'explorer-country-population', 'explorer-country-languages',
    'explorer-country-currency', 'explorer-country-area', 'explorer-country-neighbors',
    'explorer-country-landmark', 'explorer-country-fact', 'btn-explorer-practice',
    'explorer-more-details', 'explorer-landmark-media', 'explorer-landmark-media-image',
    'explorer-landmark-media-toggle', 'explorer-landmark-learn-more',
    'explorer-landmark-media-source', 'btn-explorer-zoom-in', 'btn-explorer-zoom-out',
    'btn-explorer-reset', 'btn-explorer-music', 'btn-explorer-haptics',
    'btn-explorer-free', 'btn-explorer-hunt', 'explorer-hunt-hud', 'explorer-hunt-time',
    'explorer-hunt-target', 'explorer-hunt-target-flag', 'explorer-hunt-score',
    'btn-explorer-hunt-exit', 'explorer-hunt-compare', 'explorer-hunt-panel-target',
    'explorer-hunt-panel-target-flag', 'explorer-hunt-selection-card',
    'explorer-hunt-selected-flag', 'explorer-hunt-selection-label',
    'explorer-hunt-selected-country', 'explorer-hunt-selection-feedback',
    'explorer-hunt-feedback', 'explorer-hunt-feedback-flag', 'explorer-hunt-feedback-outcome',
    'explorer-hunt-feedback-selected', 'explorer-hunt-feedback-arrow',
    'explorer-hunt-feedback-distance', 'explorer-hunt-feedback-direction',
    'explorer-hunt-guidance', 'explorer-hunt-direction-arrow', 'explorer-hunt-distance',
    'explorer-hunt-direction', 'explorer-hunt-celebration', 'explorer-hunt-celebration-country',
    'explorer-hunt-summary', 'explorer-hunt-final-score', 'btn-explorer-hunt-again',
    'btn-explorer-hunt-free', 'explorer-stage-title', 'btn-showoff', 'btn-start-game'
  ];
  for (const id of ids) {
    const element = id === 'explorer-globe-canvas' ? new FakeCanvas() : new FakeElement();
    element.id = id;
    elements[id] = element;
  }
  elements['explorer-landmark-media'].classList.add('hidden');
  elements['explorer-country-card'].classList.add('hidden');
  elements['explorer-empty-card'].classList.add('hidden');
  const summary = new FakeElement('summary');
  elements['explorer-more-details'].appendChild(summary);
  const stageCopy = new FakeElement('p');
  const homeButtons = [];
  const regionButton = new FakeElement('button');
  const requests = [];
  const document = {
    readyState: 'complete',
    hidden: false,
    getElementById(id) { return elements[id] ?? null; },
    createElement(tag) { return tag === 'canvas' ? new FakeCanvas() : new FakeElement(tag); },
    querySelector(selector) {
      if (selector === '.explorer-stage-heading > p') return stageCopy;
      if (selector === '#continent-row [data-continent="Africa"]') return regionButton;
      return null;
    },
    querySelectorAll(selector) { return selector === '[data-explorer-home]' ? homeButtons : []; },
    addEventListener() {}
  };
  const root = {
    GeoWars: { navigate: { showExplorer() {}, showHome() {} } },
    matchMedia: () => ({ matches: true }),
    performance: { now: () => 0 },
    requestAnimationFrame(callback) { callback(0); return 1; },
    cancelAnimationFrame() {},
    setTimeout() { return 1; }, clearTimeout() {}, setInterval() { return 1; }, clearInterval() {},
    addEventListener() {}, dispatchEvent() {},
    fetch(endpoint) {
      let resolve;
      const promise = new Promise(complete => { resolve = complete; });
      const isSearch = endpoint.includes('&generator=search');
      const encodedTitle = isSearch ? '' : endpoint.split('&titles=')[1].split('&')[0];
      requests.push({ endpoint, kind: isSearch ? 'search' : 'direct', title: decodeURIComponent(encodedTitle), resolve });
      return promise;
    }
  };
  class ResizeObserver { observe() {} }
  class CustomEvent { constructor(type, options) { this.type = type; this.detail = options?.detail; } }
  const context = vm.createContext({
    window: root, document, ResizeObserver, CustomEvent, console, Promise, Object, Map, Set, Math, Date
  });
  vm.runInContext(`const countryCards = ${JSON.stringify(cards)};`, context);
  vm.runInContext(explorerSource, context);
  return {
    requests,
    elements: {
      media: elements['explorer-landmark-media'], image: elements['explorer-landmark-media-image'],
      toggle: elements['explorer-landmark-media-toggle'], learnMore: elements['explorer-landmark-learn-more'],
      source: elements['explorer-landmark-media-source'], countryCard: elements['explorer-country-card'],
      flag: elements['explorer-country-flag'], name: elements['explorer-country-name'], region: elements['explorer-country-region'],
      capital: elements['explorer-country-capital'], landmark: elements['explorer-country-landmark'],
      fact: elements['explorer-country-fact'], details: elements['explorer-more-details'],
      practice: elements['btn-explorer-practice'], search: elements['explorer-country-search'],
      searchList: elements['explorer-search-results'], zoomIn: elements['btn-explorer-zoom-in'],
      zoomOut: elements['btn-explorer-zoom-out'], reset: elements['btn-explorer-reset'],
      regionButton, showoff: elements['btn-showoff'], start: elements['btn-start-game']
    },
    select(id) { root.GeoWars.explorer.selectCountry(id, { animate: false, source: 'test' }); },
    state() { return root.GeoWars.explorer.getState(); }
  };
}

function resolveRequest(request, response) { request.resolve(response); }

async function loadCurrentRequest(fixture, response) {
  resolveRequest(fixture.requests.at(-1), response);
  await settle();
}

function assertNileSnapshot(fixture, { name, imageUrl, sourceUrl }) {
  assert.deepEqual(mediaSnapshot(fixture), {
    visible: true, expanded: false, src: imageUrl, alt: `Nile River in ${name}`,
    ariaExpanded: 'false', ariaLabel: 'Expand image of Nile River',
    learnHref: sourceUrl, learnText: 'Learn about Nile River', sourceHref: sourceUrl
  });
}

function assertCardFor(fixture, selected) {
  assert.deepEqual(cardSnapshot(fixture), {
    visible: true, flagFallback: selected.flag, name: selected.name, region: `${selected.continent} · ${selected.subregion}`,
    capital: selected.capital, landmark: selected.landmarks[0] || '—', fact: selected.fun_facts[0],
    detailsOpen: true, practice: `Practice ${selected.continent}`
  });
}

const NILE_SEED = 0x4e494c45;
const FAILURE_SEED = 0x4641494c;
const RACE_SEED = 0x52414345;

// Snapshot observed on the unfixed baseline after a successful direct Nile request:
// visible media, Nile River accessible text, collapsed control, and matching links.
// **Validates: Requirements 3.1, 3.4**
await runProperty({
  name: 'Property 2: Preservation - direct Nile media and independent explorer actions',
  seed: NILE_SEED,
  cases: 320,
  generate: (random, iteration) => ({
    iteration, salt: Math.floor(random() * 1_000_000),
    actions: Array.from({ length: 1 + Math.floor(random() * 4) }, () => Math.floor(random() * 5))
  }),
  verify: async ({ iteration, salt, actions }) => {
    const nile = country({ id: 31, name: 'Egypt', landmark: 'Nile River', salt });
    const other = country({ id: 32, name: `Other ${salt}`, landmark: `Other landmark ${salt}`, salt: salt + 1 });
    const fixture = createFixture([nile, other]);
    const imageUrl = `https://images.example.test/nile-${iteration}.jpg`;
    const sourceUrl = `https://en.wikipedia.org/wiki/Nile_River_${salt}`;
    fixture.select(nile.id);
    assert.deepEqual(fixture.requests.map(request => request.title), ['Nile River']);
    await loadCurrentRequest(fixture, { ok: true, json: async () => page({ title: 'Nile River', imageUrl, sourceUrl }) });
    assert.equal(mediaSnapshot(fixture).visible, false, 'the direct image remains hidden until its load event');
    fixture.elements.image.onload();
    assertNileSnapshot(fixture, { name: nile.name, imageUrl, sourceUrl });
    assertCardFor(fixture, nile);

    for (const action of actions) {
      if (action === 0) fixture.elements.zoomIn.click();
      if (action === 1) fixture.elements.zoomOut.click();
      if (action === 2) fixture.elements.reset.click();
      if (action === 3) {
        fixture.elements.toggle.click();
        assert.equal(fixture.elements.toggle.getAttribute('aria-label'), 'Collapse image of Nile River');
        fixture.elements.toggle.click();
      }
      if (action === 4) {
        fixture.elements.search.value = 'Egypt';
        fixture.elements.search.dispatch('input');
        assert.equal(fixture.elements.searchList.children.length, 1, 'search retains the direct country result');
        fixture.elements.searchList.children[0].click();
        await loadCurrentRequest(fixture, { ok: true, json: async () => page({ title: 'Nile River', imageUrl, sourceUrl }) });
        fixture.elements.image.onload();
      }
      assertCardFor(fixture, nile);
      assert.equal(fixture.state().selectedCountryId, nile.id, 'non-media actions retain the selected country');
    }
    fixture.elements.practice.click();
    assert.equal(fixture.elements.regionButton.clickCount, 1, 'practice still triggers the regional game control');
    assert.equal(fixture.elements.showoff.clickCount, 1, 'practice still selects the practice mode');
    assert.equal(fixture.elements.start.clickCount, 1, 'practice still starts the selected game flow');
  }
});

function assertClearedMedia(fixture) {
  assert.deepEqual(mediaSnapshot(fixture), {
    visible: false, expanded: false, src: '', alt: '', ariaExpanded: 'false', ariaLabel: null,
    learnHref: '', learnText: 'Learn about this landmark', sourceHref: ''
  });
}

// Every exhausted-media branch, including image errors, must leave no pending
// metadata or functional-looking controls while preserving the selected card.
// **Validates: Requirements 2.4, 3.3**
await runProperty({
  name: 'Property 3: Failure containment - exhausted media preserves the card',
  seed: FAILURE_SEED,
  cases: 320,
  generate: (random, iteration) => ({
    iteration, salt: Math.floor(random() * 1_000_000), mode: Math.floor(random() * 4)
  }),
  verify: async ({ iteration, salt, mode }) => {
    const nile = country({ id: 31, name: 'Egypt', landmark: 'Nile River', salt });
    const unavailable = country({
      id: 32, name: `Unavailable ${iteration}`, landmark: `Unavailable landmark ${salt}`, salt: salt + 1
    });
    const clearSelection = country({ id: 33, name: `Cleared ${iteration}`, landmark: '', salt: salt + 2 });
    const fixture = createFixture([nile, unavailable, clearSelection]);
    fixture.select(nile.id);
    await loadCurrentRequest(fixture, {
      ok: true,
      json: async () => page({
        title: 'Nile River', imageUrl: `https://images.example.test/previous-${iteration}.jpg`,
        sourceUrl: `https://en.wikipedia.org/wiki/Nile_River_${salt}`
      })
    });
    fixture.elements.image.onload();
    fixture.select(unavailable.id);
    assertClearedMedia(fixture);
    assertCardFor(fixture, unavailable);

    if (mode === 0) await loadCurrentRequest(fixture, { ok: false, json: async () => ({}) });
    if (mode === 1) await loadCurrentRequest(fixture, { ok: true, json: async () => ({ query: {} }) });
    if (mode === 2) await loadCurrentRequest(fixture, {
      ok: true,
      json: async () => page({ title: unavailable.landmarks[0], sourceUrl: `https://example.test/${salt}` })
    });
    if (mode < 3) {
      assertClearedMedia(fixture);
      assertCardFor(fixture, unavailable);
      return;
    }

    const failedImageUrl = `https://images.example.test/error-${iteration}.jpg`;
    const failedSourceUrl = `https://en.wikipedia.org/wiki/Unavailable_${salt}`;
    await loadCurrentRequest(fixture, {
      ok: true,
      json: async () => page({ title: unavailable.landmarks[0], imageUrl: failedImageUrl, sourceUrl: failedSourceUrl })
    });
    fixture.elements.image.onerror();
    await loadCurrentRequest(fixture, { ok: false, json: async () => ({}) });
    assertClearedMedia(fixture);
    assertCardFor(fixture, unavailable);
    fixture.select(clearSelection.id);
    assertClearedMedia(fixture);
    assertCardFor(fixture, clearSelection);
  }
});

// **Validates: Requirements 2.4, 3.2**
await runProperty({
  name: 'Property 4: Latest selection wins across two-selection event permutations',
  seed: RACE_SEED,
  cases: 320,
  generate: (random, iteration) => ({
    iteration,
    firstLoadBeforeSecond: random() < 0.5,
    firstImageBeforeSecond: random() < 0.5,
    latestOutcome: random() < 0.5 ? 'load' : 'error',
    salt: Math.floor(random() * 1_000_000)
  }),
  verify: async ({ iteration, firstLoadBeforeSecond, firstImageBeforeSecond, latestOutcome, salt }) => {
    const first = country({ id: 31, name: `First ${iteration}`, landmark: `First landmark ${salt}`, salt });
    const second = country({ id: 32, name: `Second ${iteration}`, landmark: `Second landmark ${salt}`, salt: salt + 1 });
    const fixture = createFixture([first, second]);
    const firstImageUrl = `https://images.example.test/first-${iteration}.jpg`;
    const secondImageUrl = `https://images.example.test/second-${iteration}.jpg`;
    const firstSourceUrl = `https://en.wikipedia.org/wiki/First_${salt}`;
    const secondSourceUrl = `https://en.wikipedia.org/wiki/Second_${salt}`;
    fixture.select(first.id);
    const firstRequest = fixture.requests[0];
    let firstImageOnload = null;
    if (firstLoadBeforeSecond) {
      resolveRequest(firstRequest, { ok: true, json: async () => page({
        title: first.landmarks[0], imageUrl: firstImageUrl, sourceUrl: firstSourceUrl
      }) });
      await settle();
      firstImageOnload = fixture.elements.image.onload;
    }

    fixture.select(second.id);
    const secondRequest = fixture.requests[1];
    if (firstLoadBeforeSecond && firstImageBeforeSecond) firstImageOnload();
    if (!firstLoadBeforeSecond) {
      resolveRequest(firstRequest, { ok: true, json: async () => page({
        title: first.landmarks[0], imageUrl: firstImageUrl, sourceUrl: firstSourceUrl
      }) });
      await settle();
    }
    if (firstLoadBeforeSecond && !firstImageBeforeSecond) firstImageOnload();

    resolveRequest(secondRequest, { ok: true, json: async () => page({
      title: second.landmarks[0], imageUrl: secondImageUrl, sourceUrl: secondSourceUrl
    }) });
    await settle();
    if (latestOutcome === 'load') fixture.elements.image.onload();
    else {
      fixture.elements.image.onerror();
      await loadCurrentRequest(fixture, { ok: false, json: async () => ({}) });
    }

    assert.equal(fixture.state().selectedCountryId, second.id);
    assertCardFor(fixture, second);
    const snapshot = mediaSnapshot(fixture);
    if (latestOutcome === 'load') {
      assert.equal(snapshot.visible, true);
      assert.equal(snapshot.src, secondImageUrl);
      assert.equal(snapshot.alt, `${second.landmarks[0]} in ${second.name}`);
      assert.equal(snapshot.learnHref, secondSourceUrl);
      assert.equal(snapshot.sourceHref, secondSourceUrl);
    } else {
      assertClearedMedia(fixture);
    }
    assert.ok(!snapshot.alt.includes(first.name), 'late first-selection events never own the final media state');
  }
});

console.log(`Landmark preservation baseline snapshots passed (seeds: Nile=0x${NILE_SEED.toString(16)}, failure=0x${FAILURE_SEED.toString(16)}, race=0x${RACE_SEED.toString(16)})`);


// Deterministic integration matrix for the approved named routes. The globe path
// invokes the same public selection controller reached after a globe hit, while
// the search path drives the rendered result's click listener.
const NAMED_MEDIA_ROUTES = [
  ['Iraq', 'Tigris and Euphrates marshes', 'Mesopotamian Marshes'],
  ['Libya', 'Leptis Magna Roman ruins', 'Leptis Magna'],
  ['Algeria', 'Sahara oases', 'Sahara'],
  ['Niger', 'Sahara dunes of the Tenere', 'Ténéré'],
  ['Tanzania', 'Serengeti plains', 'Serengeti']
];

async function assertNamedRoute({ fixture, selected, resolvedTitle, path: selectionPath }) {
  if (selectionPath === 'globe') {
    fixture.select(selected.id);
  } else {
    fixture.elements.search.value = selected.name;
    fixture.elements.search.dispatch('input');
    assert.equal(fixture.elements.searchList.children.length, 1, 'search exposes the selected country');
    fixture.elements.searchList.children[0].click();
  }

  assert.deepEqual(fixture.requests.map(request => request.title), [resolvedTitle]);
  const sourceUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(resolvedTitle)}`;
  const imageUrl = `https://images.example.test/${encodeURIComponent(selected.name)}.jpg`;
  await loadCurrentRequest(fixture, {
    ok: true,
    json: async () => page({ title: `${resolvedTitle} resolved`, imageUrl, sourceUrl })
  });
  assert.equal(mediaSnapshot(fixture).visible, false, 'media waits for a successful image load');
  fixture.elements.image.onload();

  assertCardFor(fixture, selected);
  assert.deepEqual(mediaSnapshot(fixture), {
    visible: true, expanded: false, src: imageUrl, alt: `${resolvedTitle} resolved in ${selected.name}`,
    ariaExpanded: 'false', ariaLabel: `Expand image of ${resolvedTitle} resolved`,
    learnHref: sourceUrl, learnText: `Learn about ${resolvedTitle} resolved`, sourceHref: sourceUrl
  });
  fixture.elements.toggle.click();
  assert.equal(fixture.elements.media.classList.contains('is-expanded'), true, 'details image expands');
  fixture.elements.toggle.click();
  assert.equal(fixture.elements.media.classList.contains('is-expanded'), false, 'details image collapses');
  fixture.elements.practice.click();
  assert.equal(fixture.elements.regionButton.clickCount, 1, 'practice remains usable with loaded media');
}

for (const [index, [name, landmark, resolvedTitle]] of NAMED_MEDIA_ROUTES.entries()) {
  const selected = country({ id: 400 + index, name, landmark, salt: index + 100 });
  await assertNamedRoute({
    fixture: createFixture([selected]), selected, resolvedTitle, path: 'globe'
  });
  await assertNamedRoute({
    fixture: createFixture([selected]), selected, resolvedTitle, path: 'search'
  });
}

const unavailableNamedCountry = country({
  id: 499, name: 'Unavailable Iraq', landmark: 'Tigris and Euphrates marshes', salt: 199
});
const unavailableNamedFixture = createFixture([unavailableNamedCountry]);
unavailableNamedFixture.select(unavailableNamedCountry.id);
await loadCurrentRequest(unavailableNamedFixture, { ok: false, json: async () => ({}) });
assertClearedMedia(unavailableNamedFixture);
assertCardFor(unavailableNamedFixture, unavailableNamedCountry);
console.log('Named landmark globe/search integration matrix passed (5 countries × 2 paths; resolved links, disclosure, practice, and unavailable-media preservation).');

const staleFallbackFirst = country({ id: 601, name: 'First Fallback', landmark: 'First fallback landmark', salt: 601 });
const staleFallbackSecond = country({ id: 602, name: 'Second Fallback', landmark: 'Second fallback landmark', salt: 602 });
const staleFallbackFixture = createFixture([staleFallbackFirst, staleFallbackSecond]);
staleFallbackFixture.select(staleFallbackFirst.id);
const staleDirectRequest = staleFallbackFixture.requests[0];
resolveRequest(staleDirectRequest, { ok: false, json: async () => ({}) });
await settle();
const staleFallbackRequest = staleFallbackFixture.requests[1];
assert.equal(staleFallbackRequest.kind, 'search');
resolveRequest(staleFallbackRequest, {
  ok: true,
  json: async () => page({
    title: 'First fallback article',
    imageUrl: 'https://images.example.test/stale-first.jpg',
    sourceUrl: 'https://source.test/stale-first'
  })
});
await settle();
const staleFallbackLoad = staleFallbackFixture.elements.image.onload;
const staleFallbackError = staleFallbackFixture.elements.image.onerror;
staleFallbackFixture.select(staleFallbackSecond.id);
const currentDirectRequest = staleFallbackFixture.requests[2];
resolveRequest(currentDirectRequest, {
  ok: true,
  json: async () => page({
    title: staleFallbackSecond.landmarks[0],
    imageUrl: 'https://images.example.test/current-second.jpg',
    sourceUrl: 'https://source.test/current-second'
  })
});
await settle();
staleFallbackFixture.elements.image.onload();
const currentSnapshot = mediaSnapshot(staleFallbackFixture);
staleFallbackLoad();
staleFallbackError();
assert.deepEqual(mediaSnapshot(staleFallbackFixture), currentSnapshot, 'late fallback image events cannot mutate the latest card');
assert.equal(currentSnapshot.src, 'https://images.example.test/current-second.jpg');
assert.equal(currentSnapshot.alt, `${staleFallbackSecond.landmarks[0]} in ${staleFallbackSecond.name}`);
console.log('Late fallback response/image ownership fixture passed.');
