import eventBus from '../core/events.js';

const DEFAULT_IMPORTERS = Object.freeze({
  Africa: () => import('./chunks/Africa.js'),
  Asia: () => import('./chunks/Asia.js'),
  Europe: () => import('./chunks/Europe.js'),
  'North America': () => import('./chunks/North_America.js'),
  'South America': () => import('./chunks/South_America.js'),
  Oceania: () => import('./chunks/Oceania.js')
});

export const MAX_CHUNK_RETRIES = 3;
export const RETRY_BASE_DELAY_MS = 100;

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function normalizeContinent(continent, importers) {
  if (typeof continent !== 'string' || !continent.trim()) return undefined;
  const candidate = continent.trim().replaceAll('_', ' ').toLocaleLowerCase('en');
  return Object.keys(importers).find(name => name.toLocaleLowerCase('en') === candidate);
}

function chunkIdFor(continent) {
  return String(continent ?? '').trim().replaceAll(' ', '_') || 'unknown';
}

export function createChunkLoader({
  importers = DEFAULT_IMPORTERS,
  events = eventBus,
  delay = wait,
  maxRetries = MAX_CHUNK_RETRIES,
  baseDelayMs = RETRY_BASE_DELAY_MS
} = {}) {
  if (!importers || typeof importers !== 'object') throw new TypeError('importers must be an object');
  if (!events || typeof events.emit !== 'function') throw new TypeError('events must provide emit()');
  if (typeof delay !== 'function') throw new TypeError('delay must be a function');
  if (!Number.isInteger(maxRetries) || maxRetries < 0) throw new RangeError('maxRetries must be a non-negative integer');
  if (!Number.isFinite(baseDelayMs) || baseDelayMs < 0) throw new RangeError('baseDelayMs must be non-negative');

  const loadedChunks = new Map();
  const pendingChunks = new Map();

  async function loadChunk(continent) {
    const normalized = normalizeContinent(continent, importers);
    const chunkId = chunkIdFor(normalized ?? continent);

    if (!normalized || typeof importers[normalized] !== 'function') {
      const error = new RangeError(`Unknown country-data chunk: ${String(continent)}`);
      events.emit('data:error', { chunkId, continent, error, attempts: 0 });
      throw error;
    }
    if (loadedChunks.has(normalized)) return loadedChunks.get(normalized);
    if (pendingChunks.has(normalized)) return pendingChunks.get(normalized);

    const loading = (async () => {
      events.emit('data:loading', { chunkId, continent: normalized });

      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        try {
          const chunkModule = await importers[normalized]();
          const countries = chunkModule?.default;
          if (!Array.isArray(countries)) {
            throw new TypeError(`Country-data chunk ${chunkId} must have a default array export`);
          }

          loadedChunks.set(normalized, countries);
          events.emit('data:ready', {
            chunkId,
            continent: normalized,
            countries,
            attempts: attempt + 1
          });
          return countries;
        } catch (error) {
          if (attempt === maxRetries) {
            events.emit('data:error', {
              chunkId,
              continent: normalized,
              error,
              attempts: attempt + 1
            });
            throw error;
          }
          await delay(baseDelayMs * (2 ** attempt));
        }
      }

      throw new Error(`Country-data chunk ${chunkId} failed without an error`);
    })();

    pendingChunks.set(normalized, loading);
    try {
      return await loading;
    } finally {
      pendingChunks.delete(normalized);
    }
  }

  return Object.freeze({ loadChunk });
}

const defaultLoader = createChunkLoader();

export const loadChunk = defaultLoader.loadChunk;
export default loadChunk;
