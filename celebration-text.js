/**
 * Celebration Text Module
 * Displays random animated praise phrases on correct guesses.
 * Standalone IIFE — no external dependencies.
 * Requirements: 9.1, 9.2, 9.3, 11.2
 */
(function () {
  'use strict';

  var phrases = [
    'Got it.',
    'Clean.',
    'Easy money.',
    'There it is.',
    'Knew it.',
    'Smooth.',
    'That\'s the one.',
    'Done.',
    'Locked.',
    'Beautiful.'
  ];

  var lastIndex = null;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Pick a random phrase index that differs from lastIndex.
   * @returns {number}
   */
  function pickIndex() {
    if (phrases.length <= 1) return 0;
    var idx;
    do {
      idx = Math.floor(Math.random() * phrases.length);
    } while (idx === lastIndex);
    lastIndex = idx;
    return idx;
  }

  /**
   * Show a random celebration phrase with animation inside the given container.
   * Respects prefers-reduced-motion: shows static text briefly without animation.
   * @param {HTMLElement} container - positioned parent element
   */
  function show(container) {
    if (!container) return;

    var idx = pickIndex();
    var phrase = phrases[idx];

    var el = document.createElement('div');
    el.className = 'celebration-text';
    el.textContent = phrase;
    el.style.position = 'absolute';

    container.appendChild(el);

    if (reducedMotion) {
      // Static display for reduced motion — show briefly then remove
      setTimeout(function () {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }, 1500);
    } else {
      // Animated display — auto-remove after animation completes (~1.5s)
      el.addEventListener('animationend', function handler(e) {
        // Remove after the final animation (celebrate-out) ends
        if (e.animationName === 'celebrate-out') {
          el.removeEventListener('animationend', handler);
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        }
      });

      // Fallback removal in case animationend doesn't fire
      setTimeout(function () {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }, 2000);
    }
  }

  window.CelebrationText = {
    show: show,
    // Expose for testing purposes
    _getPhrases: function () { return phrases; },
    _getLastIndex: function () { return lastIndex; }
  };
})();
