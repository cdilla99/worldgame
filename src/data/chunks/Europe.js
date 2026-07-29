import '../../../data/countries.js';

const SILHOUETTE_BASE_URL = 'https://raw.githubusercontent.com/djaiss/mapsicon/master/all/';

function getSilhouetteUrl(flag) {
  const code = Array.from(flag, symbol => String.fromCharCode(symbol.codePointAt(0) - 0x1F1E6 + 97)).join('');
  return `${SILHOUETTE_BASE_URL}${code}/vector.svg`;
}

const canonicalCountries = globalThis.countryCards;

if (!Array.isArray(canonicalCountries)) {
  throw new Error('Canonical country data must be loaded before the Europe chunk');
}

export const europeCountries = Object.freeze(canonicalCountries
  .filter(country => country.continent === 'Europe')
  .map(country => Object.freeze({
    ...country,
    silhouette_url: getSilhouetteUrl(country.flag)
  })));

if (europeCountries.length !== 44) {
  throw new Error(`Europe chunk expected 44 countries, received ${europeCountries.length}`);
}

export default europeCountries;
