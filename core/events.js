/**
 * EventBus - Publish-subscribe event system for module communication
 * 
 * Provides loose coupling between modules through named events.
 * Supports wildcards, error isolation, and ordered handler invocation.
 * 
 * @module core/events
 */

/**
 * @typedef {function(object): void} EventHandler
 */

/**
 * EventBus class implementing publish-subscribe pattern
 */
class EventBus {
  constructor() {
    /** @type {Map<string, EventHandler[]>} Map of event names to handler arrays */
    this._handlers = new Map();
    /** @type {Map<string, EventHandler[]>} Map of wildcard patterns to handler arrays */
    this._wildcards = new Map();
  }

  /**
   * Emit an event to all registered handlers
   * @param {string} event - The event name to emit
   * @param {object} [payload={}] - The payload to pass to handlers
   * @returns {void}
   */
  emit(event, payload = {}) {
    const fullEvent = event;
    
    // Invoke exact-match handlers first (in registration order)
    const exactHandlers = this._handlers.get(fullEvent);
    if (exactHandlers) {
      for (const handler of exactHandlers) {
        this._invokeHandler(handler, fullEvent, payload);
      }
    }

    // Invoke wildcard handlers that match (in registration order)
    for (const [pattern, handlers] of this._wildcards) {
      if (this._matchesPattern(pattern, fullEvent)) {
        for (const handler of handlers) {
          this._invokeHandler(handler, fullEvent, payload);
        }
      }
    }
  }

  /**
   * Register a handler for an event
   * @param {string} event - The event name or wildcard pattern (e.g., 'timer:*')
   * @param {EventHandler} handler - The handler function to register
   * @returns {function(): void} Unsubscribe function
   */
  on(event, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('Handler must be a function');
    }

    const isWildcard = event.includes('*');
    const targetMap = isWildcard ? this._wildcards : this._handlers;

    if (!targetMap.has(event)) {
      targetMap.set(event, []);
    }

    const handlers = targetMap.get(event);
    handlers.push(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Remove a previously registered handler
   * @param {string} event - The event name or wildcard pattern
   * @param {EventHandler} handler - The handler function to remove
   * @returns {boolean} True if handler was found and removed
   */
  off(event, handler) {
    const isWildcard = event.includes('*');
    const targetMap = isWildcard ? this._wildcards : this._handlers;
    const handlers = targetMap.get(event);

    if (!handlers) {
      return false;
    }

    const index = handlers.indexOf(handler);
    if (index === -1) {
      return false;
    }

    handlers.splice(index, 1);

    // Clean up empty arrays
    if (handlers.length === 0) {
      targetMap.delete(event);
    }

    return true;
  }

  /**
   * Register a handler to be called exactly once
   * @param {string} event - The event name or wildcard pattern
   * @param {EventHandler} handler - The handler function to register
   * @returns {function(): void} Unsubscribe function
   */
  once(event, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('Handler must be a function');
    }

    /** @type {EventHandler} */
    const wrappedHandler = (payload) => {
      this.off(event, wrappedHandler);
      handler(payload);
    };

    return this.on(event, wrappedHandler);
  }

  /**
   * Invoke a handler with error isolation
   * @private
   * @param {EventHandler} handler - The handler to invoke
   * @param {string} event - The event name (for error logging)
   * @param {object} payload - The payload to pass
   */
  _invokeHandler(handler, event, payload) {
    try {
      handler(payload);
    } catch (error) {
      console.error(`EventBus: Handler error for event "${event}":`, error);
    }
  }

  /**
   * Check if an event name matches a wildcard pattern
   * @private
   * @param {string} pattern - The wildcard pattern (e.g., 'timer:*')
   * @param {string} event - The event name to check
   * @returns {boolean} True if the event matches the pattern
   */
  _matchesPattern(pattern, event) {
    // Convert wildcard pattern to regex
    // Supports single '*' for any characters, '**' is treated same as '*'
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
      .replace(/\*/g, '.*'); // Convert * to .* (match any characters)

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(event);
  }

  /**
   * Get the count of handlers for an event (useful for testing)
   * @param {string} event - The event name or wildcard pattern
   * @returns {number} Number of registered handlers
   */
  handlerCount(event) {
    const isWildcard = event.includes('*');
    const targetMap = isWildcard ? this._wildcards : this._handlers;
    const handlers = targetMap.get(event);
    return handlers ? handlers.length : 0;
  }

  /**
   * Remove all handlers for all events (useful for cleanup/testing)
   * @returns {void}
   */
  clear() {
    this._handlers.clear();
    this._wildcards.clear();
  }
}

// Export singleton instance
const eventBus = new EventBus();

export { EventBus, eventBus };
export default eventBus;
