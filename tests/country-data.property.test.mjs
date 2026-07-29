import assert from 'node:assert/strict';
import { countries } from '../src/data/index.js';

const REQUIRED_FULL_FIELDS = Object.freeze([
  'id', 'name', 'difficulty', 'stars', 'continent', 'subregion', 'capital',
  'population_hint', 'size_category', 'area_hint', 'hemisphere', 'coastline_type',
  'neighbors', 'main_languages', 'currency', 'landmarks', 'fun_facts',
  'built_in_clue', 'nearby_country_clue', 'flag', 'silhouette_url'
]);

const CHUNK_LOADERS = Object.freeze({
  Africa: () => import('../src/data/chunks/Africa.js'),
  Asia: () => import('../src/data/chunks/Asia.js'),
  Europe: () => import('../src/data/chunks/Europe.js'),
  'North America': () => import('../src/data/chunks/North_America.js'),
  'South America': () => import('../src/data/chunks/South_America.js'),
  Oceania: () => import('../src/data/chunks/Oceania.js')
});

const canonicalIndex = countries.slice(0, 195);
const seed = 0xC017DA7A;
let randomState = seed;

function random() {
  randomState = (randomState * 1664525 + 1013904223) >>> 0;
  return randomState / 0x100000000;
}

function integer(max) {
  return Math.floor(random() * max);
}

function shuffle(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = integer(index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

async function loadChunk(continent) {
  const load = CHUNK_LOADERS[continent];
  assert.equal(typeof load, 'function', `a chunk loader exists for ${continent}`);
  const chunkModule = await load();
  assert.ok(Array.isArray(chunkModule.default), `${continent} chunk has a default array export`);
  return chunkModule.default;
}

async function runProperty(name, iterations, generate, verify) {
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const input = generate();
    try {
      await verify(input);
    } catch (error) {
      error.message = `${name} failed (seed=${seed}, iteration=${iteration}, input=${JSON.stringify(input)}): ${error.message}`;
      throw error;
    }
  }
  console.log(`${name} passed (${iterations} cases, seed=${seed})`);
}

assert.equal(canonicalIndex.length, 195, 'the chunked dataset covers the 195 canonical country records');

const iterations = 250;

// Property 1: Lazy loading retrieves full country data
// **Validates: Requirements 1.2**
await runProperty(
  'Property 1: Lazy loading retrieves full country data',
  iterations,
  () => canonicalIndex[integer(canonicalIndex.length)],
  async (indexCountry) => {
    const chunk = await loadChunk(indexCountry.continent);
    const fullCountry = chunk.find(country => country.id === indexCountry.id);

    assert.ok(fullCountry, `country ID ${indexCountry.id} is retrieved from the ${indexCountry.continent} chunk`);
    for (const field of REQUIRED_FULL_FIELDS) {
      assert.ok(Object.hasOwn(fullCountry, field), `${indexCountry.name} includes ${field}`);
      assert.notEqual(fullCountry[field], undefined, `${indexCountry.name}.${field} is defined`);
    }
    assert.deepEqual(
      {
        id: fullCountry.id,
        name: fullCountry.name,
        continent: fullCountry.continent,
        difficulty: fullCountry.difficulty
      },
      indexCountry,
      `${indexCountry.name} full data matches its index entry`
    );
  }
);

// Property 2: Each country appears in exactly one chunk
// **Validates: Requirements 1.6**
await runProperty(
  'Property 2: Each country appears in exactly one chunk',
  iterations,
  () => shuffle(Object.keys(CHUNK_LOADERS)),
  async (continentOrder) => {
    const chunks = await Promise.all(continentOrder.map(loadChunk));
    const occurrences = new Map();

    for (const country of chunks.flat()) {
      occurrences.set(country.id, (occurrences.get(country.id) ?? 0) + 1);
    }

    for (const country of canonicalIndex) {
      assert.equal(occurrences.get(country.id), 1, `${country.name} appears in exactly one chunk`);
    }
    assert.equal(occurrences.size, canonicalIndex.length, 'chunks contain no non-canonical or duplicate country IDs');
  }
);

console.log(`country data properties 1-2 passed (${iterations * 2} generated cases total)`);