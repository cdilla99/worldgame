import { countries } from './index.js';
import { loadChunk } from './loader.js';

const indexedCountriesById = new Map(countries.map(country => [country.id, country]));
const loadedCountriesById = new Map();

export async function getContinentCountries(continent) {
  const continentCountries = await loadChunk(continent);

  for (const country of continentCountries) {
    loadedCountriesById.set(country.id, country);
  }

  return continentCountries;
}

export async function getCountry(id) {
  const indexedCountry = indexedCountriesById.get(id);
  if (!indexedCountry) return undefined;

  const loadedCountry = loadedCountriesById.get(id);
  if (loadedCountry) return loadedCountry;

  const continentCountries = await getContinentCountries(indexedCountry.continent);
  return continentCountries.find(country => country.id === id);
}

export default Object.freeze({ getCountry, getContinentCountries });
