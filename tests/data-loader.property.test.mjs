import assert from 'node:assert/strict';
import { createChunkLoader } from '../src/data/loader.js';

const seed = 0xDA7AE110;
let randomState = seed;
function random() {
  randomState = (randomState * 1664525 + 1013904223) >>> 0;
  return randomState / 0x100000000;
}

function integer(min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

const continents = Object.freeze([
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania'
]);

function inputVariant(continent) {
  const variants = [
    continent,
    continent.toLocaleLowerCase('en'),
    continent.replaceAll(' ', '_'),
    `  ${continent.toLocaleUpperCase('en')}  `
  ];
  return variants[integer(0, variants.length - 1)];
}

const iterations = 250;

// Property 11: Error events contain chunk identifier
// **Validates: Requirements 1.4**
for (let iteration = 0; iteration < iterations; iteration += 1) {
  const continent = continents[integer(0, continents.length - 1)];
  const requestedContinent = inputVariant(continent);
  const maxRetries = integer(0, 3);
  const failure = new Error(`simulated ${continent} chunk failure ${iteration}`);
  const emitted = [];
  const loader = createChunkLoader({
    importers: { [continent]: async () => { throw failure; } },
    events: { emit: (name, payload) => emitted.push({ name, payload }) },
    delay: async () => {},
    maxRetries
  });

  try {
    await assert.rejects(loader.loadChunk(requestedContinent), error => error === failure);
    const errorEvents = emitted.filter(event => event.name === 'data:error');
    assert.equal(errorEvents.length, 1);
    assert.equal(errorEvents[0].payload.continent, continent);
    assert.equal(errorEvents[0].payload.chunkId, continent.replaceAll(' ', '_'));
  } catch (error) {
    error.message = `Property 11 failed (seed=${seed}, iteration=${iteration}, input=${JSON.stringify({ continent, requestedContinent, maxRetries })}): ${error.message}`;
    throw error;
  }
}

console.log(`Property 11: Error events contain chunk identifier passed (${iterations} cases, seed=${seed})`);
