import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const explorerSource = fs.readFileSync(path.join(testDirectory, '..', 'globe-explorer.js'), 'utf8');

function sourceWithApprovedCandidates(input) {
  const candidateMap = JSON.stringify(input.candidateMap || {
    [input.label]: input.candidates.map(candidatePlan => candidatePlan.title)
  });
  const source = explorerSource.replace(
    'getApprovedLandmarkCandidates(label).forEach(addCandidate);',
    `(${candidateMap}[label] || getApprovedLandmarkCandidates(label)).forEach(addCandidate);`
  );
  assert.notEqual(source, explorerSource, 'fixture must inject its approved candidate list');
  return source;
}

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

function responseFor(outcome) {
  if (!outcome || outcome.response === 'fetch-error') return Promise.reject(new Error('fixture fetch failure'));
  if (outcome.response === 'http-error') return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
  if (outcome.response === 'missing-thumbnail') {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ query: { pages: { 1: { title: outcome.responseTitle } } } }) });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      query: { pages: { 1: {
        title: outcome.responseTitle,
        thumbnail: { source: outcome.imageUrl },
        fullurl: outcome.sourceUrl
      } } }
    })
  });
}

function responseForSearch(fallbackResponse) {
  if (fallbackResponse === 'fetch-error') return Promise.reject(new Error('fixture search failure'));
  if (fallbackResponse === 'http-error') return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(fallbackResponse || { query: { pages: {} } })
  });
}

function createHarness(input) {
  const elements = new Map();
  const getElement = id => {
    if (!elements.has(id)) {
      const classes = id === 'explorer-landmark-media' ? 'explorer-landmark-media hidden' : '';
      elements.set(id, new FakeElement('div', id, classes));
    }
    return elements.get(id);
  };
  const document = {
    readyState: 'complete',
    hidden: false,
    getElementById: getElement,
    querySelector: selector => selector.startsWith('#') ? getElement(selector.slice(1)) : null,
    querySelectorAll: () => [],
    createElement: tag => new FakeElement(tag),
    addEventListener() {}
  };
  const requestedTitles = [];
  const requestedSearches = [];
  const directCandidates = input.candidates || Object.values(input.candidateMap || {}).flat();
  const outcomeByTitle = new Map(directCandidates.map(candidate => [candidate.title, candidate]));
  const root = {
    document,
    performance: { now: () => 0 },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    requestAnimationFrame: () => 1,
    addEventListener() {},
    dispatchEvent() {},
    fetch(endpoint) {
      if (endpoint.includes('&generator=search')) {
        requestedSearches.push(endpoint);
        return responseForSearch(input.fallbackResponse);
      }
      const match = endpoint.match(/[?&]titles=([^&]+)/);
      const title = decodeURIComponent(match?.[1] ?? '');
      requestedTitles.push(title);
      return responseFor(outcomeByTitle.get(title));
    }
  };
  class ResizeObserver { observe() {} disconnect() {} }
  class CustomEvent { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } }
  const country = {
    id: input.id,
    name: input.country,
    flag: '🏳️',
    continent: 'Africa',
    subregion: 'Fixture region',
    landmarks: input.landmarks || [input.label],
    main_languages: ['Fixture'],
    neighbors: []
  };
  const sandbox = { window: root, document, countryCards: [country], ResizeObserver, CustomEvent, console };
  vm.runInNewContext(sourceWithApprovedCandidates(input), sandbox, { filename: 'globe-explorer.js' });
  return {
    requestedTitles,
    requestedSearches,
    country,
    image: getElement('explorer-landmark-media-image'),
    figure: getElement('explorer-landmark-media'),
    toggle: getElement('explorer-landmark-media-toggle'),
    learnMore: getElement('explorer-landmark-learn-more'),
    source: getElement('explorer-landmark-media-source'),
    select: () => root.GeoWars.explorer.selectCountry(country.id, { animate: false })
  };
}

function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

async function settle() {
  for (let turn = 0; turn < 6; turn += 1) await Promise.resolve();
}

async function driveImageEvents(harness) {
  const emittedSources = new Set();
  for (let turn = 0; turn < 24; turn += 1) {
    await settle();
    if (!harness.image.src || emittedSources.has(harness.image.src)) continue;
    emittedSources.add(harness.image.src);
    assert.ok(harness.figure.classList.contains('hidden'), 'media must remain hidden until its image load event');
    const handler = harness.image.onerror && harness.image.src.includes('error-image')
      ? harness.image.onerror
      : harness.image.onload;
    handler?.({ type: handler === harness.image.onload ? 'load' : 'error', target: harness.image });
  }
}

function candidate(title, response, imageOutcome = 'load', resolvedTitle = title) {
  return {
    title,
    response,
    imageOutcome,
    responseTitle: resolvedTitle,
    imageUrl: `https://images.test/${encodeURIComponent(title)}-${imageOutcome === 'error' ? 'error-image' : 'load-image'}.jpg`,
    sourceUrl: `https://source.test/wiki/${encodeURIComponent(resolvedTitle.replace(/\s+/g, '_'))}`
  };
}

function plannedInput({ id, country, label, titles, winnerIndex, failureKinds = [], redirect = false }) {
  const candidates = titles.map((title, index) => {
    if (index === winnerIndex) {
      return candidate(title, 'success', 'load', redirect ? `${title} resolved` : title);
    }
    const failure = failureKinds[index] ?? (index % 3 === 0 ? 'missing-thumbnail' : index % 3 === 1 ? 'http-error' : 'image-error');
    return failure === 'image-error'
      ? candidate(title, 'success', 'error', title)
      : candidate(title, failure, 'load', title);
  });
  return { id, country, label, candidates, winnerIndex };
}

const namedCounterexamples = [
  plannedInput({ id: 1, country: 'Iraq', label: 'Tigris and Euphrates marshes', titles: ['Mesopotamian Marshes'], winnerIndex: 0 }),
  plannedInput({ id: 2, country: 'Libya', label: 'Leptis Magna Roman ruins', titles: ['Leptis Magna'], winnerIndex: 0 }),
  plannedInput({ id: 3, country: 'Algeria', label: 'Sahara oases', titles: ['Sahara'], winnerIndex: 0 }),
  plannedInput({ id: 4, country: 'Niger', label: 'Sahara dunes of the Tenere', titles: ['Ténéré'], winnerIndex: 0 }),
  plannedInput({ id: 5, country: 'Tanzania', label: 'Serengeti plains', titles: ['Serengeti'], winnerIndex: 0 }),
  plannedInput({
    id: 6,
    country: 'Response Fallbackia',
    label: 'Response fallback landmark',
    titles: ['Response fallback landmark', 'Approved response fallback'],
    winnerIndex: 1,
    failureKinds: ['missing-thumbnail']
  }),
  plannedInput({
    id: 7,
    country: 'Image Fallbackia',
    label: 'Image fallback landmark',
    titles: ['Image fallback landmark', 'Approved image fallback'],
    winnerIndex: 1,
    failureKinds: ['image-error']
  })
];

const aliasRoutes = [
  ['Iraq', 'Tigris and Euphrates marshes', 'Mesopotamian Marshes'],
  ['Libya', 'Leptis Magna Roman ruins', 'Leptis Magna'],
  ['Algeria', 'Sahara oases', 'Sahara'],
  ['Niger', 'Sahara dunes of the Tenere', 'Ténéré'],
  ['Tanzania', 'Serengeti plains', 'Serengeti']
];

function generateCase(random, iteration) {
  const isAlias = random() < 0.7;
  const route = isAlias
    ? aliasRoutes[Math.floor(random() * aliasRoutes.length)]
    : ['Egypt', 'Nile River', 'Nile River'];
  const candidateCount = 1 + Math.floor(random() * 4);
  const titles = Array.from({ length: candidateCount }, (_, index) =>
    index === 0 ? route[2] : `${route[2]} approved fallback ${iteration}-${index}`
  );
  const winnerIndex = Math.floor(random() * candidateCount);
  const failureKinds = titles.map((_, index) => index % 3 === 0 ? 'missing-thumbnail' : index % 3 === 1 ? 'http-error' : 'image-error');
  return plannedInput({
    id: 100 + iteration,
    country: route[0],
    label: route[1],
    titles,
    winnerIndex,
    failureKinds,
    redirect: random() < 0.5
  });
}

function expectedBehavior(harness, input) {
  const winner = input.candidates[input.winnerIndex];
  assert.deepEqual(
    harness.requestedTitles,
    input.candidates.slice(0, input.winnerIndex + 1).map(candidatePlan => candidatePlan.title),
    'approved candidates must be requested strictly in order through the first loaded image'
  );
  assert.equal(harness.figure.classList.contains('hidden'), false, 'a usable approved thumbnail must become visible after load');
  assert.equal(harness.image.src, winner.imageUrl, 'the displayed image must belong to the first successful candidate');
  assert.equal(harness.image.alt, `${winner.responseTitle} in ${input.country}`, 'accessible media text must use the resolved title');
  assert.equal(harness.toggle.getAttribute('aria-expanded'), 'false', 'loaded media remains initially collapsed');
  assert.equal(harness.toggle.getAttribute('aria-label'), `Expand image of ${winner.responseTitle}`, 'toggle metadata uses the resolved title');
  assert.equal(harness.learnMore.href, winner.sourceUrl, 'learn-more link uses the resolved source URL');
  assert.equal(harness.source.href, winner.sourceUrl, 'source link uses the resolved source URL');
}

async function verify(input) {
  const harness = createHarness(input);
  harness.select();
  await driveImageEvents(harness);
  expectedBehavior(harness, input);
  return harness.requestedTitles;
}

async function runProperty({ name, seed, cases, generate, fixedCases }) {
  const random = createRandom(seed);
  const counterexamples = [];
  const inputs = [...fixedCases, ...Array.from({ length: cases }, (_, iteration) => generate(random, iteration))];
  for (let iteration = 0; iteration < inputs.length; iteration += 1) {
    const input = inputs[iteration];
    try {
      const requestedTitles = await verify(input);
      assert.deepEqual(requestedTitles, input.candidates.slice(0, input.winnerIndex + 1).map(candidatePlan => candidatePlan.title));
    } catch (error) {
      const harness = createHarness(input);
      harness.select();
      await settle();
      counterexamples.push({
        seed: `0x${seed.toString(16)}`,
        iteration,
        input,
        requestedTitles: harness.requestedTitles,
        failure: error.message
      });
    }
  }
  assert.equal(
    counterexamples.length,
    0,
    `${name} found ${counterexamples.length} counterexample(s). ` +
      `seed=0x${seed.toString(16)}; counterexamples=${JSON.stringify(counterexamples.slice(0, 12))}`
  );
  console.log(`${name} passed (${inputs.length} cases, seed=0x${seed.toString(16)})`);
}

// Property 1: Bug Condition — Approved Landmark Resolutions Display
// **Validates: Requirements 2.1, 2.2, 2.3**
await runProperty({
  name: 'Property 1: Bug Condition — Approved Landmark Resolutions Display',
  seed: 0x1A4D5EED,
  cases: 300,
  fixedCases: namedCounterexamples,
  generate: generateCase
});

function searchPage({ title, imageUrl, sourceUrl, index, canonical = false }) {
  return {
    title,
    index,
    thumbnail: imageUrl ? { source: imageUrl } : undefined,
    ...(canonical ? { canonicalurl: sourceUrl } : { fullurl: sourceUrl })
  };
}

function assertTargetedSearch(harness, searchText) {
  assert.equal(harness.requestedSearches.length, 1, 'fallback search is issued at most once');
  const requestUrl = new URL(harness.requestedSearches[0]);
  assert.equal(requestUrl.hostname, 'en.wikipedia.org');
  assert.equal(requestUrl.searchParams.get('action'), 'query');
  assert.equal(requestUrl.searchParams.get('generator'), 'search');
  assert.equal(requestUrl.searchParams.get('gsrsearch'), searchText);
  assert.equal(requestUrl.searchParams.get('gsrnamespace'), '0');
  assert.equal(requestUrl.searchParams.get('gsrlimit'), '10');
  assert.equal(requestUrl.searchParams.has('titles'), false, 'fallback must not guess a title');
}

function assertUnavailable(harness) {
  assert.equal(harness.figure.classList.contains('hidden'), true);
  assert.equal(harness.image.src, '');
  assert.equal(harness.image.alt, '');
  assert.equal(harness.toggle.getAttribute('aria-label'), null);
  assert.equal(harness.learnMore.href, '');
  assert.equal(harness.source.href, '');
}

const fallbackCases = [
  {
    name: 'Sudan exact label resolves Pyramids of Meroë',
    input: {
      id: 501,
      country: 'Sudan',
      label: 'Meroe pyramids',
      candidates: [candidate('Meroe pyramids', 'missing-thumbnail')],
      fallbackResponse: {
        query: { pages: {
          first: searchPage({ title: 'Meroe pyramids', index: 1 }),
          second: searchPage({
            title: 'Pyramids of Meroë',
            imageUrl: 'https://images.test/meroe-pyramids.jpg',
            sourceUrl: 'https://en.wikipedia.org/wiki/Pyramids_of_Meroë',
            index: 2,
            canonical: true
          })
        } }
      },
      expectedTitle: 'Pyramids of Meroë',
      expectedImage: 'https://images.test/meroe-pyramids.jpg',
      expectedSource: 'https://en.wikipedia.org/wiki/Pyramids_of_Meroë'
    }
  },
  {
    name: 'generic fallback skips unusable pages in response order',
    input: {
      id: 502,
      country: 'Fallbackia',
      label: 'Descriptive landmark',
      candidates: [candidate('Descriptive landmark', 'http-error')],
      fallbackResponse: {
        query: { pages: {
          first: searchPage({ title: 'First result', imageUrl: '', sourceUrl: 'https://source.test/first', index: 1 }),
          second: searchPage({ title: 'Second result', imageUrl: 'https://images.test/second.jpg', sourceUrl: '', index: 2 }),
          third: searchPage({ title: 'First usable result', imageUrl: 'https://images.test/usable.jpg', sourceUrl: 'https://source.test/usable', index: 3 })
        } }
      },
      expectedTitle: 'First usable result',
      expectedImage: 'https://images.test/usable.jpg',
      expectedSource: 'https://source.test/usable'
    }
  },
  {
    name: 'direct image failure reaches one fallback',
    input: {
      id: 503,
      country: 'Image Fallbackia',
      label: 'Image fallback landmark',
      candidates: [candidate('Image fallback landmark', 'success', 'error')],
      fallbackResponse: {
        query: { pages: {
          usable: searchPage({ title: 'Fallback image article', imageUrl: 'https://images.test/fallback.jpg', sourceUrl: 'https://source.test/fallback', index: 1 })
        } }
      },
      expectedTitle: 'Fallback image article',
      expectedImage: 'https://images.test/fallback.jpg',
      expectedSource: 'https://source.test/fallback'
    }
  }
];

for (const { name, input } of fallbackCases) {
  const harness = createHarness(input);
  harness.select();
  await driveImageEvents(harness);
  assertTargetedSearch(harness, `${input.label} ${input.country}`);
  assert.equal(harness.figure.classList.contains('hidden'), false, `${name}: fallback media becomes visible after load`);
  assert.equal(harness.image.alt, `${input.expectedTitle} in ${input.country}`);
  assert.equal(harness.image.src, input.expectedImage);
  assert.equal(harness.toggle.getAttribute('aria-label'), `Expand image of ${input.expectedTitle}`);
  assert.equal(harness.learnMore.href, input.expectedSource);
  assert.equal(harness.source.href, input.expectedSource);
  assert.equal(harness.requestedSearches.every(endpoint => endpoint.startsWith('https://en.wikipedia.org/w/api.php')), true);
}

const noSuitableFallback = createHarness({
  id: 504,
  country: 'No Resultia',
  label: 'Unavailable landmark',
  candidates: [candidate('Unavailable landmark', 'missing-thumbnail')],
  fallbackResponse: {
    query: { pages: {
      noImage: searchPage({ title: 'No image', sourceUrl: 'https://source.test/no-image', index: 1 }),
      noSource: searchPage({ title: 'No source', imageUrl: 'https://images.test/no-source.jpg', index: 2 }),
      noTitle: searchPage({ title: '', imageUrl: 'https://images.test/no-title.jpg', sourceUrl: 'https://source.test/no-title', index: 3 })
    } }
  }
});
noSuitableFallback.select();
await settle();
assertTargetedSearch(noSuitableFallback, 'Unavailable landmark No Resultia');
assertUnavailable(noSuitableFallback);

const fallbackImageFailure = createHarness({
  id: 506,
  country: 'Broken Media',
  label: 'Broken fallback landmark',
  candidates: [candidate('Broken fallback landmark', 'http-error')],
  fallbackResponse: {
    query: { pages: { broken: searchPage({
      title: 'Broken fallback article',
      imageUrl: 'https://images.test/fallback-error-image.jpg',
      sourceUrl: 'https://source.test/broken-fallback',
      index: 1
    }) } }
  }
});
fallbackImageFailure.select();
await driveImageEvents(fallbackImageFailure);
assertTargetedSearch(fallbackImageFailure, 'Broken fallback landmark Broken Media');
assertUnavailable(fallbackImageFailure);

const directSuccess = createHarness({
  id: 505,
  country: 'Egypt',
  label: 'Nile River',
  candidates: [candidate('Nile River', 'success')],
  fallbackResponse: {
    query: { pages: { shouldNotBeUsed: searchPage({
      title: 'Should not be used', imageUrl: 'https://images.test/not-used.jpg', sourceUrl: 'https://source.test/not-used', index: 1
    }) } }
  }
});
directSuccess.select();
await settle();
assert.equal(directSuccess.requestedSearches.length, 0, 'direct success does not call fallback');
directSuccess.image.onload();
assert.equal(directSuccess.figure.classList.contains('hidden'), false);
assert.equal(directSuccess.image.alt, 'Nile River in Egypt');
console.log('Focused bounded landmark fallback fixtures passed (Sudan, generic selection, image failure, no-result cleanup, and direct fast path).');


function canonicalCountry(id) {
  const dataSource = fs.readFileSync(path.join(testDirectory, '..', 'data', 'countries.js'), 'utf8');
  const context = {};
  vm.runInNewContext(`${dataSource}\nthis.__countryCards = countryCards;`, context, { filename: 'countries.js' });
  return context.__countryCards.find(country => country.id === id);
}

for (const [id, name, label, wikipediaTitle] of [
  [4, 'Brazil', 'Christ the Redeemer', 'Christ the Redeemer (statue)'],
  [172, 'Sudan', 'Meroe pyramids', 'Pyramids of Meroë']
]) {
  const country = canonicalCountry(id);
  assert.equal(country?.name, name, `canonical country ${id} is present`);
  assert.equal(country?.landmarks[0], label, `canonical ${name} primary landmark is preserved`);
  const harness = createHarness({
    id: country.id,
    country: country.name,
    label: country.landmarks[0],
    candidates: [candidate(wikipediaTitle, 'success')]
  });
  harness.select();
  await driveImageEvents(harness);
  assert.deepEqual(harness.requestedTitles, [wikipediaTitle], `${name} uses its alias fast path`);
  assert.equal(harness.requestedSearches.length, 0, `${name} direct alias success does not search`);
  assert.equal(harness.image.alt, `${wikipediaTitle} in ${name}`);
}

const secondaryLandmarkHarness = createHarness({
  id: 701,
  country: 'Sequentialia',
  label: 'First landmark',
  landmarks: ['First landmark', 'Second landmark'],
  candidateMap: {
    'First landmark': ['First landmark'],
    'Second landmark': ['Second resolved landmark']
  },
  candidates: [
    candidate('First landmark', 'missing-thumbnail'),
    candidate('Second resolved landmark', 'success')
  ]
});
secondaryLandmarkHarness.select();
await driveImageEvents(secondaryLandmarkHarness);
assert.deepEqual(
  secondaryLandmarkHarness.requestedTitles,
  ['First landmark', 'Second resolved landmark'],
  'a failed first landmark advances to the next landmark direct candidate'
);
assert.equal(secondaryLandmarkHarness.requestedSearches.length, 0, 'second-landmark direct success does not search');
assert.equal(secondaryLandmarkHarness.image.alt, 'Second resolved landmark in Sequentialia');

const fallbackSecondImageHarness = createHarness({
  id: 702,
  country: 'Fallbackia',
  label: 'Fallback landmark',
  candidates: [candidate('Fallback landmark', 'http-error')],
  fallbackResponse: {
    query: { pages: {
      first: searchPage({
        title: 'First fallback result',
        imageUrl: 'https://images.test/first-error-image.jpg',
        sourceUrl: 'https://source.test/first-fallback',
        index: 1
      }),
      second: searchPage({
        title: 'Second fallback result',
        imageUrl: 'https://images.test/second-load-image.jpg',
        sourceUrl: 'https://source.test/second-fallback',
        index: 2
      })
    } }
  }
});
fallbackSecondImageHarness.select();
await driveImageEvents(fallbackSecondImageHarness);
assertTargetedSearch(fallbackSecondImageHarness, 'Fallback landmark Fallbackia');
assert.equal(fallbackSecondImageHarness.image.src, 'https://images.test/second-load-image.jpg');
assert.equal(fallbackSecondImageHarness.image.alt, 'Second fallback result in Fallbackia');
assert.equal(fallbackSecondImageHarness.figure.classList.contains('hidden'), false);
console.log('Brazil/Sudan aliases, secondary direct landmarks, ordered fallback image retry, direct fast path, and stale-event fixtures passed offline.');
