const initialState = {
  mode: 'sprint', difficulty: 'all', continent: 'all', deck: [], currentCard: null,
  score: 0, streak: 0, bestStreak: 0, timeRemaining: 60, timerPaused: false,
  hintsUsed: { flag: false, region: false }, roundHistory: [], player: null, isOnline: false
};

const development = typeof process === 'undefined' || process.env.NODE_ENV !== 'production';
const listeners = new Set();

export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Reflect.ownKeys(value).forEach((key) => deepFreeze(value[key]));
    Object.freeze(value);
  }
  return value;
}

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Reflect.ownKeys(value).map((key) => [key, clone(value[key])]));
  }
  return value;
}

function prepare(value) {
  const copy = clone(value);
  return development ? deepFreeze(copy) : copy;
}

let currentState = prepare(initialState);

export const state = new Proxy({}, {
  get: (_target, property) => currentState[property],
  set: () => false,
  deleteProperty: () => false,
  ownKeys: () => Reflect.ownKeys(currentState),
  has: (_target, property) => property in currentState,
  getOwnPropertyDescriptor: (_target, property) => property in currentState
    ? { enumerable: true, configurable: true, value: currentState[property] }
    : undefined
});

export function getState() { return prepare(currentState); }
export function onStateChange(handler) {
  if (typeof handler !== 'function') throw new TypeError('State change handler must be a function');
  listeners.add(handler);
  return () => listeners.delete(handler);
}
export function setState(updates) {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) throw new TypeError('State updates must be an object');
  const safeUpdates = prepare(updates);
  currentState = prepare({ ...currentState, ...safeUpdates });
  const snapshot = getState();
  listeners.forEach((handler) => handler(safeUpdates, snapshot));
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof window.CustomEvent === 'function') {
    window.dispatchEvent(new window.CustomEvent('state:change', { detail: { updates: safeUpdates, state: snapshot } }));
  }
  return snapshot;
}

export default state;
