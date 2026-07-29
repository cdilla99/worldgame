import assert from 'node:assert/strict';
import { countries } from '../src/data/index.js';
import dataApi, { getCountry, getContinentCountries } from '../src/data/api.js';

assert.strictEqual(dataApi.getCountry, getCountry, 'default API exposes getCountry');
assert.strictEqual(dataApi.getContinentCountries, getContinentCountries, 'default API exposes continent lookup');

const unitedStates = await getCountry(1);
assert.equal(unitedStates.name, 'United States', 'getCountry resolves an index ID');
assert.equal(unitedStates.capital, 'Washington, D.C.', 'getCountry returns full data');
assert.ok(unitedStates.silhouette_url, 'full data includes the lazy chunk silhouette URL');
assert.strictEqual(await getCountry(1), unitedStates, 'loaded country records are reused');
assert.equal(await getCountry(999), undefined, 'unknown IDs do not trigger a chunk load');

const southAmerica = await getContinentCountries('South_America');
assert.equal(southAmerica.length, 12, 'underscore chunk IDs are accepted');
assert.ok(southAmerica.every(country => country.continent === 'South America'), 'continent lookup returns only that continent');
assert.strictEqual(await getContinentCountries('south america'), southAmerica, 'loader aliases reuse the loaded chunk');

const requiredFullFields = ['capital', 'neighbors', 'flag', 'silhouette_url'];
const canonicalIndex = countries.slice(0, 195);
let randomState = 0xDA7A;

// Property: every indexed canonical ID resolves to matching full lazy-loaded data.
// **Validates: Requirements 1.2**
for (let iteration = 0; iteration < 200; iteration += 1) {
  randomState = (randomState * 1664525 + 1013904223) >>> 0;
  const indexedCountry = canonicalIndex[randomState % canonicalIndex.length];
  const fullCountry = await getCountry(indexedCountry.id);
  assert.ok(fullCountry, `${indexedCountry.name} resolves from its continent chunk`);
  assert.deepEqual(
    { id: fullCountry.id, name: fullCountry.name, continent: fullCountry.continent, difficulty: fullCountry.difficulty },
    indexedCountry,
    `${indexedCountry.name} full data matches the minimal index`
  );
  for (const field of requiredFullFields) assert.ok(Object.hasOwn(fullCountry, field), `${indexedCountry.name} includes ${field}`);
}

console.log('data API unit and property tests passed');
