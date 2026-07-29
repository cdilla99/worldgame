import '../../../data/countries.js';

const SILHOUETTE_BASE_URL = 'https://raw.githubusercontent.com/djaiss/mapsicon/master/all/';

function getSilhouetteUrl(flag) {
  const code = Array.from(flag, symbol => String.fromCharCode(symbol.codePointAt(0) - 0x1F1E6 + 97)).join('');
  return `${SILHOUETTE_BASE_URL}${code}/vector.svg`;
}

const canonicalCountries = globalThis.countryCards;

if (!Array.isArray(canonicalCountries)) {
  throw new Error('Canonical country data must be loaded before the Asia chunk');
}

export const asiaCountries = Object.freeze(canonicalCountries
  .filter(country => country.continent === 'Asia')
  .map(country => Object.freeze({
    ...country,
    silhouette_url: getSilhouetteUrl(country.flag)
  })));

if (asiaCountries.length !== 48) {
  throw new Error(`Asia chunk expected 48 countries, received ${asiaCountries.length}`);
}

export default asiaCountries;
