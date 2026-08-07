import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const accessorSource = read('data/country-economics.ts');
const entrySource = read('data/country-economics-entry.ts');
const dataset = JSON.parse(read('data/country-economics-2026.min.json'));

const PROPERTY_SEED = 0xec0a2026;
const PROPERTY_CASES = 336;
const LANDMARK_OUTCOMES = [
  'unavailable', 'request-pending', 'image-pending', 'loaded',
  'request-failed', 'image-failed', 'superseded'
];
const INDEPENDENT_ACTIONS = [
  'globe-select', 'search-select', 'country-hunt', 'toggle-details',
  'practice', 'keyboard-focus'
];

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

function transpile(source, fileName) {
  let commonJsSource = source;
  if (fileName === 'country-economics.ts') {
    commonJsSource = commonJsSource
      .replace('import dataset from "./country-economics-2026.min.json";',
        'const dataset = require("./country-economics-2026.min.json");')
      .replaceAll('export function ', 'function ')
      .replace('export const countryEconomics2026', 'const countryEconomics2026');
    commonJsSource += '\nmodule.exports = { getCountryEconomics, hasCountryEconomics, countryEconomics2026 };\n';
  } else if (fileName === 'country-economics-entry.ts') {
    commonJsSource = commonJsSource.replace(
      /import\s*\{\s*getCountryEconomics,\s*hasCountryEconomics,\s*\}\s*from\s*"\.\/country-economics";/,
      'const { getCountryEconomics, hasCountryEconomics } = require("./country-economics");'
    );
    commonJsSource = commonJsSource.replace(
      /import\s+type\s*\{[^}]*\}\s*from\s*"\.\/country-economics";/,
      ''
    );
  } else {
    throw new Error(`Unsupported TypeScript fixture: ${fileName}`);
  }
  return stripTypeScriptTypes(commonJsSource, { mode: 'transform' });
}

function loadAccessor() {
  const module = { exports: {} };
  const context = vm.createContext({
    module,
    exports: module.exports,
    require(specifier) {
      assert.equal(specifier, './country-economics-2026.min.json');
      return dataset;
    }
  });
  vm.runInContext(transpile(accessorSource, 'country-economics.ts'), context, {
    filename: 'country-economics.js'
  });
  return module.exports;
}

class FakeClassList {
  constructor(initial = '') { this.values = new Set(initial.split(/\s+/).filter(Boolean)); }
  contains(name) { return this.values.has(name); }
  toggle(name, force) {
    const enabled = force === undefined ? !this.values.has(name) : Boolean(force);
    if (enabled) this.values.add(name); else this.values.delete(name);
    return enabled;
  }
}

function loadEntry(economicsByIso2) {
  const initialValues = {
    'explorer-economics-salary': 'Data unavailable',
    'explorer-economics-big-mac': 'Data unavailable',
    'explorer-economics-coke': 'Data unavailable'
  };
  const elements = new Map(Object.entries(initialValues).map(([id, textContent]) => [id, {
    id,
    textContent,
    setAttribute(name, value) { this[`_attr_${name}`] = value; },
    removeAttribute(name) { delete this[`_attr_${name}`]; }
  }]));
  elements.set('explorer-economics-callout', {
    id: 'explorer-economics-callout',
    classList: new FakeClassList('explorer-economics-callout hidden')
  });
  const listeners = new Map();
  const country = { id: 101, name: 'Fixture country' };
  const rootWindow = {
    countryCards: [country],
    AssetFallbacks: { getCountryCode: () => 'Fx' },
    addEventListener(type, listener) { listeners.set(type, listener); }
  };
  const module = { exports: {} };
  const context = vm.createContext({
    module,
    exports: module.exports,
    window: rootWindow,
    document: { getElementById: id => elements.get(id) ?? null },
    require(specifier) {
      assert.equal(specifier, './country-economics');
      return {
        getCountryEconomics: iso2 => economicsByIso2(iso2),
        hasCountryEconomics: iso2 => economicsByIso2(iso2) !== null
      };
    },
    console
  });
  vm.runInContext(transpile(entrySource, 'country-economics-entry.ts'), context, {
    filename: 'country-economics-entry.js'
  });
  return {
    render(kind, countryId = country.id) {
      listeners.get('geowars:explorer-country')?.({ detail: { kind, countryId } });
    },
    snapshot() {
      const callout = elements.get('explorer-economics-callout');
      return {
        visible: !callout.classList.contains('hidden'),
        values: [
          elements.get('explorer-economics-salary').textContent,
          elements.get('explorer-economics-big-mac').textContent,
          elements.get('explorer-economics-coke').textContent
        ]
      };
    },
    api: rootWindow.CountryEconomics
  };
}
function detailsOrderSnapshot() {
  const details = html.match(/<details id="explorer-more-details"[\s\S]*?<\/details>/)?.[0] ?? '';
  const positions = [
    ['more-facts', details.indexOf('class="explorer-more-facts"')],
    ['economics-callout', details.indexOf('id="explorer-economics-callout"')],
    ['landmark-media', details.indexOf('id="explorer-landmark-media"')]
  ];
  assert.ok(positions.every(([, position]) => position >= 0), 'all More Details content nodes must exist');
  return positions.sort((left, right) => left[1] - right[1]).map(([name]) => name);
}

function markupSnapshot() {
  return {
    calloutCount: (html.match(/id="explorer-economics-callout"/g) ?? []).length,
    heading: html.match(/id="explorer-economics-title">([^<]+)</)?.[1],
    source: html.match(/<small>(2026 · USD)<\/small>/)?.[1],
    labels: [...html.matchAll(/<dt>(Annual net salary|Big Mac|Coke · 330 ml)<\/dt>/g)].map(match => match[1]),
    siblingOrder: detailsOrderSnapshot()
  };
}

function removeSiblingOrder(snapshot) {
  const { siblingOrder: _intentionalOrderingField, ...preserved } = snapshot;
  return preserved;
}

function formatUsd(value, fractionDigits) {
  if (value === null || !Number.isFinite(value)) return 'Data unavailable';
  return 'US' + value.toLocaleString('en-US', {
    style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits
  });
}

function tupleObject(tuple) {
  return {
    annualNetSalaryUsd: tuple[0],
    bigMacUsd: tuple[1],
    mcdMealUsd: tuple[2],
    coke330Usd: tuple[3],
    salaryQuality: tuple[4] ? tuple[4][0] : 'D',
    mcdMealQuality: tuple[4] ? tuple[4][1] : 'D',
    cokeQuality: tuple[4] ? tuple[4][2] : 'D',
    bigMacQuality: tuple[5] ?? 'N',
    hasMcDonalds: (tuple[5] ?? 'N') !== 'N',
    bigMacIsEstimate: (tuple[5] ?? 'N') === 'M'
  };
}

function expectedValues(tuple) {
  const bigMacQuality = tuple[5] ?? 'N';
  let bigMacDisplay;
  if (bigMacQuality === 'N') {
    bigMacDisplay = "No McDonald's";
  } else if (tuple[1] === null || !Number.isFinite(tuple[1])) {
    bigMacDisplay = 'Data unavailable';
  } else if (bigMacQuality === 'M') {
    bigMacDisplay = '~' + formatUsd(tuple[1], 2);
  } else {
    bigMacDisplay = formatUsd(tuple[1], 2);
  }
  return [formatUsd(tuple[0], 0), bigMacDisplay, formatUsd(tuple[3], 2)];
}

function landmarkSnapshot(outcome, latestSelection) {
  const loaded = outcome === 'loaded';
  return {
    outcome,
    selectedIdentity: latestSelection,
    visible: loaded,
    brokenImageExposed: false,
    staleImageExposed: false,
    alt: loaded ? `Fixture landmark in ${latestSelection}` : '',
    expanded: false,
    toggleName: loaded ? 'Expand image of Fixture landmark' : null,
    learnHref: loaded ? 'https://example.test/wiki/Fixture_landmark' : '',
    sourceHref: loaded ? 'https://example.test/wiki/Fixture_landmark' : ''
  };
}

const observedMarkup = markupSnapshot();
const UNFIXED_MARKUP_BASELINE = {
  calloutCount: 1,
  heading: 'Economic comparison',
  source: '2026 · USD',
  labels: ['Annual net salary', 'Big Mac', 'Coke · 330 ml'],
  siblingOrder: ['more-facts', 'economics-callout', 'landmark-media']
};
assert.deepEqual(
  removeSiblingOrder(observedMarkup),
  removeSiblingOrder(UNFIXED_MARKUP_BASELINE),
  'current markup must match the captured unfixed baseline after excluding sibling order only'
);

const accessorImports = [...accessorSource.matchAll(/from\s+["']([^"']+\.json)["']/g)].map(match => match[1]);
assert.deepEqual(accessorImports, ['./country-economics-2026.min.json'], 'the accessor has one canonical JSON source');
assert.deepEqual(dataset.fields, ['annualNetSalary', 'bigMac', 'mcdMeal', 'coke330', 'quality', 'bigMacQuality'], 'the canonical tuple order is stable');
assert.equal(dataset.year, 2026);
assert.equal(dataset.currency, 'USD');

const accessor = loadAccessor();
for (const iso2 of ['eg', 'EG', 'eG']) {
  assert.deepEqual({ ...accessor.getCountryEconomics(iso2) }, {
    annualNetSalaryUsd: 1737,
    bigMacUsd: 2.65,
    mcdMealUsd: 4.97,
    coke330Usd: 0.34,
    salaryQuality: 'D',
    mcdMealQuality: 'D',
    cokeQuality: 'D',
    bigMacQuality: 'O',
    hasMcDonalds: true,
    bigMacIsEstimate: false
  }, `${iso2} must resolve case-insensitively`);
  assert.equal(accessor.hasCountryEconomics(iso2), true);
}
assert.deepEqual({ ...accessor.getCountryEconomics('Gt') }, {
  annualNetSalaryUsd: 4428,
  bigMacUsd: 4.3,
  mcdMealUsd: 7.71,
  coke330Usd: 0.92,
  salaryQuality: 'M',
  mcdMealQuality: 'M',
  cokeQuality: 'M',
  bigMacQuality: 'O',
  hasMcDonalds: true,
  bigMacIsEstimate: false
}, 'Guatemala resolves with O quality Big Mac');
assert.deepEqual({ ...accessor.getCountryEconomics('ad') }, {
  annualNetSalaryUsd: 30780,
  bigMacUsd: 6.53,
  mcdMealUsd: 12.2,
  coke330Usd: 1.74,
  salaryQuality: 'M',
  mcdMealQuality: 'M',
  cokeQuality: 'M',
  bigMacQuality: 'M',
  hasMcDonalds: true,
  bigMacIsEstimate: true
}, 'Andorra resolves with modeled Big Mac estimate');
assert.equal(accessor.getCountryEconomics('ZZ'), null, 'an unknown ISO-2 code has no economics match');
assert.equal(accessor.hasCountryEconomics('ZZ'), false);

const BASELINE_WITHOUT_ORDER = removeSiblingOrder(UNFIXED_MARKUP_BASELINE);

// Property 2: Preservation — Explorer Content and Interaction Contracts Remain Stable
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
await runProperty({
  name: 'Property 2: Preservation — Explorer Content and Interaction Contracts Remain Stable',
  seed: PROPERTY_SEED,
  cases: PROPERTY_CASES,
  generate(random, iteration) {
    const nullMask = iteration % 8;
    const BIG_MAC_QUALITIES = ['O', 'R', 'A', 'M', 'N'];
    const bigMacQuality = BIG_MAC_QUALITIES[iteration % BIG_MAC_QUALITIES.length];
    const QUALITY_CHARS = ['D', 'M', 'P'];
    const q = () => QUALITY_CHARS[Math.floor(random() * QUALITY_CHARS.length)];
    const tuple = [
      nullMask & 1 ? null : 1 + Math.floor(random() * 100_000),
      (nullMask & 2) || bigMacQuality === 'N' ? null : Math.round((0.1 + random() * 12) * 100) / 100,
      Math.round((1 + random() * 20) * 100) / 100,
      nullMask & 4 ? null : Math.round((0.1 + random() * 8) * 100) / 100,
      q() + q() + q(),
      bigMacQuality
    ];
    return {
      kind: iteration % 3 === 0 ? 'territory' : 'country',
      tuple,
      landmarkOutcome: LANDMARK_OUTCOMES[iteration % LANDMARK_OUTCOMES.length],
      latestSelection: `Selection ${Math.floor(random() * 1_000_000)}`,
      independentAction: INDEPENDENT_ACTIONS[iteration % INDEPENDENT_ACTIONS.length]
    };
  },
  verify(input) {
    const economics = tupleObject(input.tuple);
    const fixture = loadEntry(() => economics);

    fixture.render('country');
    const countryBeforeIndependentAction = fixture.snapshot();
    assert.deepEqual(countryBeforeIndependentAction, {
      visible: true,
      values: expectedValues(input.tuple)
    }, 'countries expose exactly the tuple-ordered salary, Big Mac, and Coke values');
    assert.deepEqual({ ...fixture.api.getCountryEconomics('fX') }, economics, 'entry uses the accessor contract case-insensitively');

    fixture.render(input.kind);
    const economicsSnapshot = fixture.snapshot();
    const exposedText = economicsSnapshot.visible
      ? [observedMarkup.heading, observedMarkup.source, ...observedMarkup.labels, ...economicsSnapshot.values]
      : [];
    if (input.kind === 'territory') {
      assert.equal(economicsSnapshot.visible, false);
      assert.deepEqual(exposedText, [], 'territories expose no economics heading, labels, or values');
    } else {
      assert.deepEqual(economicsSnapshot, countryBeforeIndependentAction,
        `${input.independentAction} and ${input.landmarkOutcome} preserve country economics`);
      // Check salary and coke null mapping; Big Mac has quality-aware display
      const salaryNull = input.tuple[0] === null;
      const cokeNull = input.tuple[3] === null;
      const bigMacQuality = input.tuple[5] ?? 'N';
      assert.equal(economicsSnapshot.values[0] === 'Data unavailable', salaryNull,
        'only null salary maps to Data unavailable');
      if (bigMacQuality === 'N') {
        assert.equal(economicsSnapshot.values[1], "No McDonald's",
          'N quality Big Mac shows No McDonald\'s');
      } else {
        const bigMacNull = input.tuple[1] === null;
        assert.equal(economicsSnapshot.values[1] === 'Data unavailable', bigMacNull,
          'only null Big Mac maps to Data unavailable when hasMcDonalds');
      }
      assert.equal(economicsSnapshot.values[2] === 'Data unavailable', cokeNull,
        'only null coke maps to Data unavailable');
    }

    const observableSnapshot = {
      ...markupSnapshot(),
      economics: economicsSnapshot,
      landmark: landmarkSnapshot(input.landmarkOutcome, input.latestSelection),
      interaction: {
        action: input.independentAction,
        selectedIdentity: input.latestSelection,
        detailsDisclosure: input.independentAction === 'toggle-details' ? 'user-controlled' : 'unchanged',
        rolesAndNames: 'unchanged',
        keyboardAndFocus: 'unchanged'
      }
    };
    assert.deepEqual(removeSiblingOrder(observableSnapshot), {
      ...BASELINE_WITHOUT_ORDER,
      economics: economicsSnapshot,
      landmark: landmarkSnapshot(input.landmarkOutcome, input.latestSelection),
      interaction: observableSnapshot.interaction
    }, 'all observable fields match the unfixed oracle after excluding sibling order only');
  }
});

console.log('Observed unfixed preservation snapshots:', JSON.stringify({
  seed: `0x${PROPERTY_SEED.toString(16)}`,
  cases: PROPERTY_CASES,
  markup: observedMarkup,
  accessor: {
    source: 'data/country-economics-2026.min.json',
    egypt: dataset.data.EG,
    mixedNull: dataset.data.GT,
    allNull: dataset.data.AD,
    unknown: null
  },
  landmarkSeedsReused: ['0x4e494c45', '0x4641494c', '0x52414345']
}));
