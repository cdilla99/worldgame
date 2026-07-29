import '../../../data/countries.js';

const SILHOUETTE_BASE_URL = 'https://raw.githubusercontent.com/djaiss/mapsicon/master/all/';

function getSilhouetteUrl(flag) {
  const code = Array.from(flag, symbol => String.fromCharCode(symbol.codePointAt(0) - 0x1F1E6 + 97)).join('');
  return `${SILHOUETTE_BASE_URL}${code}/vector.svg`;
}

const canonicalCountries = globalThis.countryCards;

if (!Array.isArray(canonicalCountries)) {
  throw new Error('Canonical country data must be loaded before the Oceania chunk');
}

export const oceaniaCountries = Object.freeze(canonicalCountries
  .filter(country => country.continent === 'Oceania')
  .map(country => Object.freeze({
    ...country,
    silhouette_url: getSilhouetteUrl(country.flag)
  })));

if (oceaniaCountries.length !== 14) {
  throw new Error(`Oceania chunk expected 14 countries, received ${oceaniaCountries.length}`);
}

export default oceaniaCountries;
