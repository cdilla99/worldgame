const cache = new Map();
const development = typeof process === 'undefined' || process.env.NODE_ENV !== 'production';

function warnMissing(id) {
  if (development) console.warn(`[DOMRefs] Element not found for id "${String(id)}"`);
}

/**
 * Return the element with the supplied id, querying the document at most once
 * until the registry is cleared. Missing elements are cached as null.
 */
export function get(id) {
  if (cache.has(id)) return cache.get(id);

  let element = null;
  if (typeof id === 'string' && id.length > 0
      && typeof document !== 'undefined'
      && typeof document.getElementById === 'function') {
    element = document.getElementById(id);
  }

  const reference = element ?? null;
  cache.set(id, reference);
  if (reference === null) warnMissing(id);
  return reference;
}

/** Reset all cached references so subsequent access queries the document again. */
export function clear() {
  cache.clear();
}

/**
 * Query and cache a batch of element ids in input order.
 * @returns {Array<Element|null>} references corresponding to the supplied ids
 */
export function preload(ids) {
  if (ids == null || typeof ids === 'string' || typeof ids[Symbol.iterator] !== 'function') {
    throw new TypeError('DOM reference ids must be an iterable of element ids');
  }
  return Array.from(ids, (id) => get(id));
}

const domRefs = Object.freeze({ get, clear, preload });
export default domRefs;
