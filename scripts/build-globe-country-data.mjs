import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const sourcePath = path.resolve(process.argv[2] || '');
const outputPath = path.resolve(
  process.argv[3] || path.join(projectRoot, 'assets', 'globe-countries.js')
);
const territoryOutputPath = path.resolve(
  process.argv[4] || path.join(projectRoot, 'assets', 'globe-territories.js')
);

if (!process.argv[2] || !fs.existsSync(sourcePath)) {
  throw new Error(
    'Usage: node scripts/build-globe-country-data.mjs <natural-earth-map-units.geojson> [country-output.js] [territory-output.js]'
  );
}

const countryContext = {};
vm.createContext(countryContext);
vm.runInContext(
  `${fs.readFileSync(path.join(projectRoot, 'data', 'countries.js'), 'utf8')}
globalThis.__countryCards = countryCards;`,
  countryContext
);

const countryCards = countryContext.__countryCards;
const territoryContext = { window: {} };
vm.createContext(territoryContext);
vm.runInContext(
  fs.readFileSync(path.join(projectRoot, 'data', 'territories.js'), 'utf8'),
  territoryContext
);
const territoryCards = territoryContext.window.GeoWarsExplorerTerritories;
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const tolerance = 0.11;

function flagToIso2(flag) {
  return Array.from(flag, symbol =>
    String.fromCharCode(symbol.codePointAt(0) - 0x1F1E6 + 65)
  ).join('');
}

function squareDistance(first, second) {
  const dx = first[0] - second[0];
  const dy = first[1] - second[1];
  return dx * dx + dy * dy;
}

function squareSegmentDistance(point, first, second) {
  let x = first[0];
  let y = first[1];
  let dx = second[0] - x;
  let dy = second[1] - y;

  if (dx !== 0 || dy !== 0) {
    const projection = (
      (point[0] - x) * dx +
      (point[1] - y) * dy
    ) / (dx * dx + dy * dy);

    if (projection > 1) {
      x = second[0];
      y = second[1];
    } else if (projection > 0) {
      x += dx * projection;
      y += dy * projection;
    }
  }

  dx = point[0] - x;
  dy = point[1] - y;
  return dx * dx + dy * dy;
}

function simplifyRadialDistance(points, squareTolerance) {
  let previous = points[0];
  const simplified = [previous];

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    if (squareDistance(point, previous) > squareTolerance) {
      simplified.push(point);
      previous = point;
    }
  }

  if (previous !== points[points.length - 1]) {
    simplified.push(points[points.length - 1]);
  }

  return simplified;
}

function simplifyDouglasPeucker(points, squareTolerance) {
  const lastIndex = points.length - 1;
  const markers = new Uint8Array(points.length);
  const stack = [0, lastIndex];
  const simplified = [];
  markers[0] = 1;
  markers[lastIndex] = 1;

  while (stack.length) {
    const last = stack.pop();
    const first = stack.pop();
    let maximumDistance = 0;
    let maximumIndex = 0;

    for (let index = first + 1; index < last; index += 1) {
      const distance = squareSegmentDistance(points[index], points[first], points[last]);
      if (distance > maximumDistance) {
        maximumIndex = index;
        maximumDistance = distance;
      }
    }

    if (maximumDistance > squareTolerance) {
      markers[maximumIndex] = 1;
      stack.push(first, maximumIndex, maximumIndex, last);
    }
  }

  for (let index = 0; index < points.length; index += 1) {
    if (markers[index]) simplified.push(points[index]);
  }
  return simplified;
}

function roundCoordinate(value, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function simplifyRing(sourceRing) {
  if (!Array.isArray(sourceRing) || sourceRing.length < 4) return null;
  const openRing = sourceRing.slice(0, -1);
  const longitudes = openRing.map(point => point[0]);
  const latitudes = openRing.map(point => point[1]);
  const span = Math.max(
    Math.max(...longitudes) - Math.min(...longitudes),
    Math.max(...latitudes) - Math.min(...latitudes)
  );
  const preserveSmallRing = span < 0.5;
  const squareTolerance = tolerance * tolerance;
  let simplified = preserveSmallRing
    ? openRing
    : simplifyRadialDistance(openRing, squareTolerance);
  if (!preserveSmallRing && simplified.length > 4) {
    simplified = simplifyDouglasPeucker(simplified, squareTolerance);
  }
  if (simplified.length < 3) simplified = openRing;

  const rounded = [];
  simplified.forEach(point => {
    const precision = preserveSmallRing ? 3 : 2;
    const next = [roundCoordinate(point[0], precision), roundCoordinate(point[1], precision)];
    const previous = rounded[rounded.length - 1];
    if (!previous || previous[0] !== next[0] || previous[1] !== next[1]) {
      rounded.push(next);
    }
  });
  if (rounded.length < 3) return null;
  rounded.push([...rounded[0]]);
  return rounded;
}

function geometryToPolygons(geometry) {
  if (!geometry) return [];
  const sourcePolygons = geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : [];

  return sourcePolygons
    .map(polygon => polygon.map(simplifyRing).filter(Boolean))
    .filter(polygon => polygon.length && polygon[0].length >= 4);
}

function ringArea(ring) {
  let area = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    area += ring[index][0] * ring[index + 1][1] -
      ring[index + 1][0] * ring[index][1];
  }
  return Math.abs(area / 2);
}

function countryArea(polygons) {
  return polygons.reduce((total, polygon) => {
    const outerArea = ringArea(polygon[0]);
    const holeArea = polygon.slice(1).reduce((sum, ring) => sum + ringArea(ring), 0);
    return total + Math.max(0, outerArea - holeArea);
  }, 0);
}

function featureCodes(feature) {
  return new Set([
    feature.properties?.ISO_A2,
    feature.properties?.ISO_A2_EH
  ].filter(code => code && code !== '-99').map(code => code.toUpperCase()));
}

function featureGeometryCodes(feature) {
  return new Set([
    feature.properties?.GU_A3,
    feature.properties?.SU_A3,
    feature.properties?.ADM0_A3
  ].filter(code => code && code !== '-99').map(code => code.toUpperCase()));
}

function polygonBounds(polygon) {
  return polygon.flat().reduce((bounds, point) => [
    Math.min(bounds[0], point[0]), Math.min(bounds[1], point[1]),
    Math.max(bounds[2], point[0]), Math.max(bounds[3], point[1])
  ], [Infinity, Infinity, -Infinity, -Infinity]);
}

function boundsOverlap(first, second) {
  return first[0] <= second[2] && first[2] >= second[0] &&
    first[1] <= second[3] && first[3] >= second[1];
}

const claimedTerritoryFeatures = new Set();
const territories = territoryCards.map(card => {
  const matchingFeatures = (source.features || []).filter(feature =>
    featureGeometryCodes(feature).has(card.geometryCode)
  );
  matchingFeatures.forEach(feature => claimedTerritoryFeatures.add(feature));

  let polygons = matchingFeatures.flatMap(feature => geometryToPolygons(feature.geometry));
  if (card.geometryBounds) {
    polygons = polygons.filter(polygon => boundsOverlap(polygonBounds(polygon), card.geometryBounds));
  }
  if (!polygons.length) {
    throw new Error(`No usable territory geometry for ${card.name} (${card.geometryCode})`);
  }

  const primaryFeature = matchingFeatures.find(feature =>
    Number.isFinite(feature.properties?.LABEL_X) &&
    Number.isFinite(feature.properties?.LABEL_Y)
  ) || matchingFeatures[0];
  const combinedBounds = polygons.map(polygonBounds).reduce((bounds, next) => [
    Math.min(bounds[0], next[0]), Math.min(bounds[1], next[1]),
    Math.max(bounds[2], next[2]), Math.max(bounds[3], next[3])
  ], [Infinity, Infinity, -Infinity, -Infinity]);
  const longitude = card.geometryBounds
    ? (combinedBounds[0] + combinedBounds[2]) / 2
    : Number(primaryFeature.properties?.LABEL_X);
  const latitude = card.geometryBounds
    ? (combinedBounds[1] + combinedBounds[3]) / 2
    : Number(primaryFeature.properties?.LABEL_Y);

  return {
    i: card.id, c: card.iso2,
    x: roundCoordinate(longitude, 3), y: roundCoordinate(latitude, 3),
    s: 1, t: 1, p: polygons
  };
});

const featuresByCode = new Map();
for (const feature of source.features || []) {
  if (claimedTerritoryFeatures.has(feature)) continue;
  const codes = featureCodes(feature);

  for (const code of codes) {
    const normalizedCode = code.toUpperCase();
    if (!featuresByCode.has(normalizedCode)) featuresByCode.set(normalizedCode, []);
    featuresByCode.get(normalizedCode).push(feature);
  }
}

const missing = [];
const countries = countryCards.map(card => {
  const code = flagToIso2(card.flag);
  const features = featuresByCode.get(code) || [];
  if (!features.length) {
    missing.push(`${card.name} (${code})`);
    return null;
  }

  const polygons = features.flatMap(feature => geometryToPolygons(feature.geometry));
  const primaryFeature = features.find(feature =>
    Number.isFinite(feature.properties?.LABEL_X) &&
    Number.isFinite(feature.properties?.LABEL_Y)
  ) || features[0];
  const longitude = Number(primaryFeature.properties?.LABEL_X);
  const latitude = Number(primaryFeature.properties?.LABEL_Y);
  const area = countryArea(polygons);

  return {
    i: card.id,
    c: code,
    x: Math.round(longitude * 1000) / 1000,
    y: Math.round(latitude * 1000) / 1000,
    s: area < 1.2 || Number(primaryFeature.properties?.LABELRANK) >= 6 ? 1 : 0,
    p: polygons
  };
});

if (missing.length) {
  throw new Error(`Natural Earth mapping is incomplete:\n${missing.join('\n')}`);
}

const unusable = countries
  .map((country, index) => (!country || !country.p.length ? countryCards[index].name : null))
  .filter(Boolean);
if (unusable.length) {
  throw new Error(`Mapped countries without usable polygon geometry:\n${unusable.join('\n')}`);
}

const serialized = JSON.stringify(countries);
const banner = [
  '/*',
  ' * Natural Earth 1:50m Admin 0 country geometry, public domain.',
  ' * Generated by scripts/build-globe-country-data.mjs.',
  ' * Fields: i=canonical country ID, c=ISO alpha-2, x/y=label point,',
  ' * s=small-country marker, p=polygons containing outer and hole rings.',
  ' */',
  `window.GeoWarsGlobeCountries=${serialized};`,
  ''
].join('\n');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, banner, 'utf8');

const territorySerialized = JSON.stringify(territories);
const territoryBanner = [
  '/*',
  ' * Natural Earth 1:50m Admin 0 map-unit geometry, public domain.',
  ' * Explorer-only territories generated by scripts/build-globe-country-data.mjs.',
  ' * Fields: i=Explorer entity ID, c=ISO alpha-2, x/y=label point,',
  ' * s=small-place marker, t=territory marker, p=polygon rings.',
  ' */',
  `window.GeoWarsGlobeTerritories=${territorySerialized};`,
  ''
].join('\n');
fs.writeFileSync(territoryOutputPath, territoryBanner, 'utf8');

const totalPoints = countries.reduce((countryTotal, country) =>
  countryTotal + country.p.reduce((polygonTotal, polygon) =>
    polygonTotal + polygon.reduce((ringTotal, ring) => ringTotal + ring.length, 0), 0), 0);

console.log(JSON.stringify({
  source: sourcePath,
  output: outputPath,
  territoryOutput: territoryOutputPath,
  countries: countries.length,
  territories: territories.length,
  bytes: Buffer.byteLength(banner),
  territoryBytes: Buffer.byteLength(territoryBanner),
  points: totalPoints,
  smallCountryMarkers: countries.filter(country => country.s).length
}, null, 2));
