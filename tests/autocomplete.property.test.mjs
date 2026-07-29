import assert from 'node:assert/strict';
import { countries } from '../src/data/index.js';
import { MAX_SUGGESTIONS, getCountrySuggestions } from '../src/features/autocomplete/index.js';

function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function normalize(value) {
  return value.trim().toLocaleLowerCase('en');
}

function matchingCountries(query) {
  const normalizedQuery = normalize(query);
  return countries.filter(country => normalize(country.name).includes(normalizedQuery));
}

function randomCase(value, random) {
  return [...value].map(character => random() < 0.5 ? character.toUpperCase() : character.toLowerCase()).join('');
}

function runProperty({ name, seed, cases, generate, verify }) {
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

function generateBoundedCountryQuery(random) {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const country = countries[Math.floor(random() * countries.length)];
    const start = Math.floor(random() * (country.name.length - 1));
    const length = 2 + Math.floor(random() * (country.name.length - start - 1));
    const query = country.name.slice(start, start + length);
    const matches = matchingCountries(query);
    if (matches.length <= MAX_SUGGESTIONS) return { country, query: ` ${randomCase(query, random)} `, matches };
  }
  throw new Error('Unable to generate a bounded matching query');
}

const broadQueries = [...new Set(countries.flatMap(country => {
  const name = normalize(country.name);
  const queries = [];
  for (let start = 0; start < name.length - 1; start += 1) {
    for (let length = 2; start + length <= name.length; length += 1) queries.push(name.slice(start, start + length));
  }
  return queries;
}))].filter(query => normalize(query).length >= 2 && matchingCountries(query).length > MAX_SUGGESTIONS);

assert.ok(broadQueries.length > 0, 'the country index provides queries with more than five matches');

// Property 12: All matching countries returned for 2+ char input
// **Validates: Requirements 4.2**
runProperty({
  name: 'Property 12: All matching countries returned for 2+ char input',
  seed: 0xac120402,
  cases: 300,
  generate: generateBoundedCountryQuery,
  verify: ({ country, query, matches }) => {
    assert.ok(normalize(query).length >= 2);
    const suggestions = getCountrySuggestions(query, countries);
    assert.deepEqual(suggestions, matches, 'every matching country is returned in index order');
    assert.ok(suggestions.includes(country), `${country.name} is returned for its generated partial name`);
  }
});

// Property 13: Exactly 5 results when matches exceed limit
// **Validates: Requirements 4.7**
runProperty({
  name: 'Property 13: Exactly 5 results when matches exceed limit',
  seed: 0xac130407,
  cases: 300,
  generate: random => {
    const query = broadQueries[Math.floor(random() * broadQueries.length)];
    return { query: randomCase(query, random), matches: matchingCountries(query) };
  },
  verify: ({ query, matches }) => {
    assert.ok(matches.length > MAX_SUGGESTIONS, 'generated query has more than five matches');
    const suggestions = getCountrySuggestions(query, countries);
    assert.equal(suggestions.length, MAX_SUGGESTIONS);
    assert.deepEqual(suggestions, matches.slice(0, MAX_SUGGESTIONS));
  }
});

console.log('Autocomplete properties 12-13 passed (600 generated cases total)');