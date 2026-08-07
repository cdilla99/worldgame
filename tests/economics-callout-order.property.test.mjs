import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(testDirectory, '..', 'index.html'), 'utf8');
const landmarkStates = Object.freeze([
  'unavailable',
  'request pending',
  'image pending',
  'loaded',
  'request failed',
  'image failed',
  'superseded'
]);
const countries = Object.freeze(['Egypt', 'Canada', 'Japan', 'Brazil', 'Kenya', 'Norway']);

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function directContentChildren(source) {
  const body = source.match(/<details\s+id="explorer-more-details"[^>]*>([\s\S]*?)<\/details>/)?.[1];
  assert.ok(body, '#explorer-more-details markup must exist');
  const children = [];
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
  let depth = 0;
  for (const match of body.matchAll(/<\/?([a-z][\w-]*)\b([^>]*)>/gi)) {
    const [token, rawTag, attributes] = match;
    const tag = rawTag.toLowerCase();
    if (token.startsWith('</')) {
      depth -= 1;
      continue;
    }
    if (depth === 0 && tag !== 'summary') {
      const id = attributes.match(/\bid="([^"]+)"/)?.[1] ?? null;
      const classes = attributes.match(/\bclass="([^"]+)"/)?.[1]?.split(/\s+/) ?? [];
      children.push({ tag, id, classes });
    }
    if (!voidTags.has(tag) && !token.endsWith('/>')) depth += 1;
  }
  return children;
}

function keyFor(child) {
  return child.id ? `#${child.id}` : child.classes.includes('explorer-more-facts') ? '.explorer-more-facts' : child.tag;
}

function renderExplorerDetails(input) {
  const directChildIds = directContentChildren(html).map(keyFor);
  const snapshots = [input.landmarkState, ...input.transitions].map(landmarkState => ({
    landmarkState,
    directChildIds: [...directChildIds],
    landmarkVisible: landmarkState === 'loaded'
  }));
  return {
    selectedPlace: { kind: 'country', name: input.country },
    economicsCallout: { visible: true, parent: '#explorer-more-details' },
    landmarkMedia: { parent: '#explorer-more-details' },
    directChildIds,
    lastContentSection: directChildIds.at(-1),
    snapshots
  };
}

function isBugCondition(result) {
  return result.selectedPlace.kind === 'country'
    && result.economicsCallout.visible
    && result.economicsCallout.parent === '#explorer-more-details'
    && result.directChildIds.indexOf('#explorer-landmark-media')
      > result.directChildIds.indexOf('#explorer-economics-callout');
}

function expectedBehavior(result) {
  const landmarkIndex = result.directChildIds.indexOf('#explorer-landmark-media');
  const economicsIndex = result.directChildIds.indexOf('#explorer-economics-callout');
  return result.economicsCallout.visible
    && result.economicsCallout.parent === '#explorer-more-details'
    && landmarkIndex > -1
    && landmarkIndex < economicsIndex
    && result.lastContentSection === '#explorer-economics-callout'
    && result.snapshots.every(snapshot =>
      snapshot.directChildIds.indexOf('#explorer-landmark-media') === landmarkIndex
      && snapshot.directChildIds.indexOf('#explorer-economics-callout') === economicsIndex
    );
}

function generateInput(random, iteration) {
  const landmarkState = landmarkStates[Math.floor(random() * landmarkStates.length)];
  const transitionCount = 1 + Math.floor(random() * 4);
  return {
    country: countries[Math.floor(random() * countries.length)],
    landmarkState,
    transitions: Array.from({ length: transitionCount }, () =>
      landmarkStates[Math.floor(random() * landmarkStates.length)]),
    case: iteration
  };
}

function runProperty({ name, seed, cases, fixedCases, generate, verify }) {
  const random = createRandom(seed);
  const inputs = [...fixedCases, ...Array.from({ length: cases }, (_, iteration) => generate(random, iteration))];
  const counterexamples = [];
  inputs.forEach((input, iteration) => {
    try {
      verify(input);
    } catch (error) {
      const result = renderExplorerDetails(input);
      counterexamples.push({
        seed: `0x${seed.toString(16)}`,
        iteration,
        input,
        directChildIds: result.directChildIds,
        lastContentSection: result.lastContentSection,
        failure: error.message
      });
    }
  });
  assert.equal(
    counterexamples.length,
    0,
    `${name} failed; counterexamples=${JSON.stringify(counterexamples.slice(0, 12))}`
  );
}

const fixedCases = landmarkStates.map((landmarkState, iteration) => ({
  country: landmarkState === 'loaded' ? 'Egypt' : landmarkState === 'unavailable' ? 'Canada' : countries[iteration % countries.length],
  landmarkState,
  transitions: landmarkStates.filter(state => state !== landmarkState),
  case: `fixed-${landmarkState}`
}));

// Property 1: Expected Behavior — Economics Is Final Across Landmark-Media States
// **Validates: Requirements 2.1, 2.2, 2.3**
test('Property 1: Expected Behavior — Economics Is Final Across Landmark-Media States', () => {
  runProperty({
    name: 'Property 1: Expected Behavior — Economics Is Final Across Landmark-Media States',
    seed: 0xEC0F1A1,
    cases: 300,
    fixedCases,
    generate: generateInput,
    verify(input) {
      const result = renderExplorerDetails(input);
      assert.equal(isBugCondition(result), false, 'fixed eligible-country markup must not satisfy the bug condition');
      assert.ok(
        expectedBehavior(result),
        `expected landmark before economics with economics final; observed ${JSON.stringify(result.directChildIds)}`
      );
    }
  });
});
