/**
 * Ordered publish/subscribe event bus with wildcard support.
 * The module is intentionally independent of the DOM and production bootstrap.
 */
export class EventBus {
  constructor() {
    this._registrations = [];
  }

  /** Register a handler and return an idempotent unsubscribe function. */
  on(event, handler) {
    this._validateRegistration(event, handler);
    return this._add(event, handler, false);
  }

  /** Register a handler that is removed before its first invocation. */
  once(event, handler) {
    this._validateRegistration(event, handler);
    return this._add(event, handler, true);
  }

  /** Remove all registrations for the supplied event/handler pair. */
  off(event, handler) {
    if (typeof event !== 'string' || typeof handler !== 'function') return false;

    let removed = false;
    for (const registration of this._registrations) {
      if (registration.active && registration.event === event && registration.handler === handler) {
        registration.active = false;
        removed = true;
      }
    }
    if (removed) this._compact();
    return removed;
  }

  /** Emit to matching handlers in global registration order. */
  emit(event, payload = {}) {
    if (typeof event !== 'string' || event.length === 0) {
      throw new TypeError('Event name must be a non-empty string');
    }

    const pending = this._registrations.filter(
      (registration) => registration.active && registration.matches(event)
    );

    for (const registration of pending) {
      if (!registration.active) continue;
      if (registration.once) registration.active = false;
      try {
        registration.handler(payload);
      } catch (error) {
        console.error(`EventBus: handler error for event "${event}"`, error);
      }
    }

    this._compact();
  }

  /** Return the number of active handlers registered for an exact name/pattern. */
  handlerCount(event) {
    return this._registrations.reduce(
      (count, registration) => count + Number(registration.active && registration.event === event),
      0
    );
  }

  /** Remove every registered handler. */
  clear() {
    for (const registration of this._registrations) registration.active = false;
    this._registrations = [];
  }

  _add(event, handler, once) {
    const registration = {
      event,
      handler,
      once,
      active: true,
      matches: event.includes('*')
        ? EventBus._wildcardMatcher(event)
        : (emittedEvent) => emittedEvent === event
    };
    this._registrations.push(registration);

    return () => {
      if (!registration.active) return false;
      registration.active = false;
      this._compact();
      return true;
    };
  }

  _validateRegistration(event, handler) {
    if (typeof event !== 'string' || event.length === 0) {
      throw new TypeError('Event name must be a non-empty string');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('Event handler must be a function');
    }
  }

  _compact() {
    this._registrations = this._registrations.filter((registration) => registration.active);
  }

  static _wildcardMatcher(pattern) {
    const escaped = pattern.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
    const expression = new RegExp(`^${escaped.replace(/\*/g, '.*')}$`);
    return (event) => expression.test(event);
  }
}

export const eventBus = new EventBus();
export default eventBus;
