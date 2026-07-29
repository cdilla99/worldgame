import assert from 'node:assert/strict';
import southAmericaCountries, { southAmericaCountries as namedExport } from '../src/data/chunks/South_America.js';

const canonicalSouthAmerica = globalThis.countryCards.filter(country => country.continent === 'South America');
const requiredFields = [
  'id', 'name', 'difficulty', 'stars', 'continent', 'subregion', 'capital',
  'population_hint', 'size_category', 'area_hint', 'hemisphere', 'coastline_type',
  'neighbors', 'main_languages', 'currency', 'landmarks', 'fun_facts',
  'built_in_clue', 'nearby_country_clue', 'flag', 'silhouette_url'
];

assert.strictEqual(southAmericaCountries, namedExport, 'default and named exports reference the same chunk');
assert.equal(southAmericaCountries.length, 12, 'South America chunk contains all 12 countries');
assert.ok(Object.isFrozen(southAmericaCountries), 'South America chunk array is immutable');
assert.deepEqual(
  southAmericaCountries.map(country => country.id),
  canonicalSouthAmerica.map(country => country.id),
  'South America chunk preserves canonical ordering'
);
assert.equal(new Set(southAmericaCountries.map(country => country.id)).size, 12, 'country IDs are unique within the chunk');
assert.equal(new Set(southAmericaCountries.map(country => country.name)).size, 12, 'country names are unique within the chunk');

for (const [index, country] of southAmericaCountries.entries()) {
  const canonical = canonicalSouthAmerica[index];
  assert.ok(Object.isFrozen(country), `${country.name} record is immutable`);
  assert.equal(country.continent, 'South America', `${country.name} is classified as South America`);
  for (const field of requiredFields) {
    assert.ok(Object.hasOwn(country, field), `${country.name} includes ${field}`);
  }
  for (const [field, value] of Object.entries(canonical)) {
    assert.deepEqual(country[field], value, `${country.name} preserves canonical ${field}`);
  }
  assert.match(
    country.silhouette_url,
    /^https:\/\/raw\.githubusercontent\.com\/djaiss\/mapsicon\/master\/all\/[a-z]{2}\/vector\.svg$/,
    `${country.name} has a flag-derived silhouette URL`
  );
}

console.log('South America chunk unit tests passed');
