/**
 * Core State Module
 * Singleton state object with setState helper and immutability support.
 * 
 * @module core/state
 */

// ============================================================
// EVENT EMISSION (simple callback-based for state changes)
// ============================================================

const stateListeners = new Set();

/**
 * Subscribe to state changes.
 * @param {Function} handler - Callback receiving (changes, newState)
 * @returns {Function} Unsubscribe function
 */
function onStateChange(handler) {
  stateListeners.add(handler);
  return () => stateListeners.delete(handler);
}

/**
 * Emit state change to all listeners.
 * @param {Object} changes - The changed properties
 * @param {Object} newState - The full new state object
 */
function emitStateChange(changes, newState) {
  for (const handler of stateListeners) {
    try {
      handler(changes, newState);
    } catch (error) {
      console.error('[State] Handler error:', error);
    }
  }
  
  // Dispatch custom event for DOM-level subscribers
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('state:change', { 
      detail: { changes, state: newState } 
    }));
  }
}

// ============================================================
// STATE DEFINITION
// ============================================================

/**
 * Initial state factory - creates fresh state object.
 * @returns {Object} Initial state
 */
function createInitialState() {
  return {
    // Game configuration
    mode: 'sprint',           // 'sprint' or 'showoff'
    difficulty: 'all',        // 'all', 'easy', 'medium', 'hard'
    continent: 'all',         // 'all', 'Africa', 'Asia', 'Europe', etc.
    
    // Deck and current round
    deck: [],                 // Array of country cards remaining
    currentCard: null,        // Current country card object
    choices: [],              // Multiple choice options for current round
    
    // Score tracking
    score: 0,                 // Current score
    streak: 0,                // Current answer streak
    bestStreak: 0,            // Best streak this session
    
    // Statistics
    correct: 0,               // Correct answers count
    total: 0,                 // Total rounds attempted
    
    // Timer state
    timer: null,              // Timer interval reference
    timeLeft: 60,             // Seconds remaining (sprint mode)
    
    // Hint state
    flagRevealed: false,      // Flag hint shown this round
    regionRevealed: false,    // Region hint shown this round
    
    // Round state
    answered: false,          // Answer submitted this round
    gameOver: false,          // Game has ended
    lastMultiplier: 1,        // Points multiplier (3=typed, 2=bail, 1=options)
    feedbackTimeout: null,    // Feedback display timeout reference
    
    // History
    roundHistory: [],         // Array of round result objects
    roundCounted: false,      // Whether current round counted toward total
    
    // Asset recovery
    assetFailure: null        // { cardId, type } if asset failed to load
  };
}

// ============================================================
// SINGLETON STATE INSTANCE
// ============================================================

/**
 * Singleton state object.
 * @type {Object}
 */
const state = createInitialState();

// ============================================================
// SETSTATE HELPER
// ============================================================

/**
 * Update state properties and emit change event.
 * Merges provided updates into state and notifies all subscribers.
 * 
 * @param {Object} updates - Properties to update
 * @returns {Object} The updated state object
 * 
 * @example
 * setState({ score: 100, streak: 3 });
 * setState({ gameOver: true });
 */
function setState(updates) {
  if (!updates || typeof updates !== 'object') {
    console.warn('[State] setState requires an object');
    return state;
  }
  
  const changes = {};
  
  for (const key of Object.keys(updates)) {
    if (key in state) {
      if (state[key] !== updates[key]) {
        changes[key] = { from: state[key], to: updates[key] };
        state[key] = updates[key];
      }
    } else {
      console.warn(`[State] Unknown state property: ${key}`);
    }
  }
  
  // Only emit if there were actual changes
  if (Object.keys(changes).length > 0) {
    emitStateChange(changes, state);
  }
  
  return state;
}

// ============================================================
// STATE RESET
// ============================================================

/**
 * Reset state to initial values.
 * Clears all properties back to defaults.
 * 
 * @param {boolean} emitEvent - Whether to emit state:change event
 * @returns {Object} The reset state object
 */
function resetState(emitEvent = true) {
  const initialState = createInitialState();
  const changes = {};
  
  for (const key of Object.keys(initialState)) {
    if (state[key] !== initialState[key]) {
      changes[key] = { from: state[key], to: initialState[key] };
    }
    state[key] = initialState[key];
  }
  
  if (emitEvent && Object.keys(changes).length > 0) {
    emitStateChange(changes, state);
  }
  
  return state;
}

// ============================================================
// DEEP FREEZE (Development Mode Immutability)
// ============================================================

/**
 * Deep freeze an object for immutability in development.
 * Recursively freezes all nested objects and arrays.
 * 
 * @param {*} obj - Object to freeze
 * @returns {*} The frozen object
 */
function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      if (typeof item === 'object' && item !== null) {
        deepFreeze(item);
      }
    });
  } else {
    // Handle objects
    const keys = Object.keys(obj);
    for (const key of keys) {
      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        deepFreeze(value);
      }
    }
  }
  
  return Object.freeze(obj);
}

/**
 * Freeze state for immutability (development mode only).
 * Note: This makes state read-only. Use setState() for updates.
 */
function freezeState() {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    console.warn('[State] freezeState() skipped in production');
    return;
  }
  
  try {
    deepFreeze(state);
    console.log('[State] State frozen for immutability (development mode)');
  } catch (error) {
    console.error('[State] Failed to freeze state:', error);
  }
}

// ============================================================
// GETTER HELPERS
// ============================================================

/**
 * Get a copy of the current state (safe for inspection).
 * @returns {Object} Shallow copy of state
 */
function getState() {
  return { ...state };
}

/**
 * Get a specific state property.
 * @param {string} key - Property name
 * @returns {*} Property value or undefined
 */
function getStateProperty(key) {
  return state[key];
}

// ============================================================
// EXPORTS
// ============================================================

export {
  // Singleton state object
  state,
  
  // Update helpers
  setState,
  resetState,
  
  // Access helpers
  getState,
  getStateProperty,
  
  // Immutability
  deepFreeze,
  freezeState,
  
  // Event subscription
  onStateChange
};

// Default export for convenience
export default state;
