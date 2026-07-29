import assert from 'node:assert/strict';
import europeCountries, { europeCountries as namedEuropeCountries } from '../src/data/chunks/Europe.js';

const canonicalEurope = globalThis.countryCards.filter(country => country.continent === 'Europe');
const requiredFields = [
  'id', 'name', 'difficulty', 'stars', 'continent', 'subregion', 'capital',
  'population_hint', 'size_category', 'area_hint', 'hemisphere', 'coastline_type',
  'neighbors', 'main_languages', 'currency', 'landmarks', 'fun_facts',
  'built_in_clue', 'nearby_country_clue', 'flag', 'silhouette_url'
];

assert.strictEqual(europeCountries, namedEuropeCountries, 'default and named exports reference the same chunk');
assert.equal(europeCountries.length, 44, 'Europe chunk contains all 44 countries');
assert.ok(Object.isFrozen(europeCountries), 'Europe chunk array is immutable');
assert.deepEqual(
  europeCountries.map(country => country.id),
  canonicalEurope.map(country => country.id),
  'Europe chunk preserves canonical ordering'
);
assert.equal(europeCountries.some(country => country.name === 'Russia'), false, 'Russia remains assigned to Asia');

for (const [index, country] of europeCountries.entries()) {
  const canonical = canonicalEurope[index];
  assert.ok(Object.isFrozen(country), `${country.name} record is immutable`);
  assert.equal(country.continent, 'Europe', `${country.name} is classified as Europe`);
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

console.log('Europe chunk unit tests passed');
