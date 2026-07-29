/**
 * Dark Mode Module
 * Standalone IIFE — no external dependencies.
 * Exposes window.DarkMode = { init(), toggle(), isActive() }
 *
 * - Checks localStorage key "geo-game-dark-mode" first
 * - Falls back to prefers-color-scheme: dark system preference
 * - Adds/removes .dark class on <body>
 * - Inserts a moon/sun emoji toggle button into the .hero header
 * - Wraps localStorage access in try/catch for private browsing resilience
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'geo-game-dark-mode';
  var toggleBtn = null;

  /**
   * Safely read from localStorage.
   * Returns null if storage is unavailable (e.g. private browsing).
   */
  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  /**
   * Safely write to localStorage.
   * Fails silently if storage is unavailable.
   */
  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Private browsing or quota exceeded — ignore
    }
  }

  /**
   * Determine the initial dark mode state.
   * Priority: localStorage > system preference > false
   */
  function getInitialState() {
    var stored = storageGet(STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;

    // No stored preference — check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    return false;
  }

  /**
   * Apply the dark mode state to the DOM.
   */
  function applyState(active) {
    if (active) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    updateButtonLabel(active);
  }

  /**
   * Update the toggle button emoji/label.
   * 🌙 shown when in light mode (click to go dark)
   * ☀️ shown when in dark mode (click to go light)
   */
  function updateButtonLabel(active) {
    if (!toggleBtn) return;
    if (active) {
      toggleBtn.textContent = '☀️';
      toggleBtn.setAttribute('aria-label', 'Switch to light mode');
    } else {
      toggleBtn.textContent = '🌙';
      toggleBtn.setAttribute('aria-label', 'Switch to dark mode');
    }
  }

  /**
   * Create and insert the toggle button into the .hero header.
   */
  function createToggleButton() {
    var hero = document.querySelector('.hero');
    if (!hero) return;

    toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'dark-mode-toggle';
    toggleBtn.addEventListener('click', function () {
      window.DarkMode.toggle();
    });

    hero.appendChild(toggleBtn);
  }

  // Public API
  window.DarkMode = {
    /**
     * Initialize dark mode from localStorage or system preference.
     * Inserts toggle button into header.
     */
    init: function () {
      var active = getInitialState();
      createToggleButton();
      applyState(active);
    },

    /**
     * Toggle dark mode on/off.
     * Updates body class, localStorage, and button label.
     */
    toggle: function () {
      var active = !document.body.classList.contains('dark');
      applyState(active);
      storageSet(STORAGE_KEY, String(active));
    },

    /**
     * Check current dark mode state.
     * @returns {boolean}
     */
    isActive: function () {
      return document.body.classList.contains('dark');
    }
  };
})();
