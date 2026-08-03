/**
 * GeoWars optional haptics
 *
 * Opt-in, persisted, and deliberately redundant with visual/audio feedback.
 * Unsupported browsers and reduced-motion environments always no-op.
 */
(function installHaptics(root) {
  'use strict';

  var STORAGE_KEY = 'geowars-haptics-enabled';
  var enabled = readPreference();

  function readPreference() {
    try {
      return root.localStorage?.getItem(STORAGE_KEY) === 'true';
    } catch (storageError) {
      return false;
    }
  }

  function writePreference(value) {
    try {
      root.localStorage?.setItem(STORAGE_KEY, String(value));
    } catch (storageError) {}
  }

  function isSupported() {
    return typeof root.navigator?.vibrate === 'function'
      && Number(root.navigator?.maxTouchPoints || 0) > 0;
  }

  function prefersReducedMotion() {
    try {
      return !!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    } catch (mediaError) {
      return false;
    }
  }

  function setEnabled(nextEnabled) {
    enabled = !!nextEnabled;
    writePreference(enabled);
    if (!enabled && isSupported()) {
      try { root.navigator.vibrate(0); } catch (vibrationError) {}
    }
    return enabled;
  }

  function play(pattern) {
    if (!enabled || !isSupported() || prefersReducedMotion()) return false;
    var vibrationPattern = pattern === 'correct'
      ? [18, 32, 28]
      : pattern === 'near'
        ? 10
        : 14;
    try {
      return root.navigator.vibrate(vibrationPattern) !== false;
    } catch (vibrationError) {
      return false;
    }
  }

  root.GeoWarsHaptics = {
    isSupported: isSupported,
    isEnabled: function () { return enabled; },
    setEnabled: setEnabled,
    toggle: function () { return setEnabled(!enabled); },
    play: play
  };
})(window);
