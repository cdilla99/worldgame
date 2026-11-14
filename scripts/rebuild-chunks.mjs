import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = fs.readFileSync(path.join(root, 'data', 'countries.js'), 'utf8');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(`${src}; globalThis.cards = countryCards;`, ctx);

const CONTINENT_MAP = {
  'Africa': 'Africa',
  'Asia': 'Asia',
  'Europe': 'Europe',
  'North America': 'North_America',
  'South America': 'South_America',
  'Oceania': 'Oceania'
};

const HEADER = `import '../../../data/countries.js';

const SILHOUETTE_BASE_URL = 'https://raw.githubusercontent.com/djaiss/mapsicon/master/all/';

function getSilhouetteUrl(flag) {
  const code = Array.from(flag, symbol => String.fromCharCode(symbol.codePointAt(0) - 0x1F1E6 + 97)).join('');
  return \`\${SILHOUETTE_BASE_URL}\${code}/vector.svg\`;
}

`;

for (const [continent, dir] of Object.entries(CONTINENT_MAP)) {
  const countries = ctx.cards.filter(c => c.continent === continent);
  const varName = dir.charAt(0).toLowerCase() + dir.slice(1).replace('_', '') + 'Countries';
  const entries = countries.map(c => '  ' + JSON.stringify(c)).join(',\n');
  const chunk = `${HEADER}export const ${varName} = Object.freeze([\n${entries}\n].map(country => Object.freeze({ ...country, silhouette_url: getSilhouetteUrl(country.flag) })));

export default ${varName};
`;
  fs.writeFileSync(path.join(root, 'src', 'data', 'chunks', `${dir}.js`), chunk, 'utf8');
  console.log(`${dir}: ${countries.length} countries`);
}
