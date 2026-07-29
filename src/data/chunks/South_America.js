import '../../../data/countries.js';

const SILHOUETTE_BASE_URL = 'https://raw.githubusercontent.com/djaiss/mapsicon/master/all/';

function getSilhouetteUrl(flag) {
  const code = Array.from(flag, symbol => String.fromCharCode(symbol.codePointAt(0) - 0x1F1E6 + 97)).join('');
  return `${SILHOUETTE_BASE_URL}${code}/vector.svg`;
}

const canonicalCountries = globalThis.countryCards;

if (!Array.isArray(canonicalCountries)) {
  throw new Error('Canonical country data must be loaded before the South America chunk');
}

export const southAmericaCountries = Object.freeze(canonicalCountries
  .filter(country => country.continent === 'South America')
  .map(country => Object.freeze({
    ...country,
    silhouette_url: getSilhouetteUrl(country.flag)
  })));

if (southAmericaCountries.length !== 12) {
  throw new Error(`South America chunk expected 12 countries, received ${southAmericaCountries.length}`);
}

export default southAmericaCountries;
