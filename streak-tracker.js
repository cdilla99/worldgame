/**
 * Streak Tracker Module
 * Tracks consecutive correct guesses and provides escalating visual feedback.
 * Standalone IIFE — no external dependencies.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */
(function () {
  'use strict';

  var streak = 0;
  var pillEl = null;
  var resetTimeout = null;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Initialize streak UI element.
   * @param {HTMLElement} container - HUD row element to append the pill into
   */
  function init(container) {
    if (!container) {
      console.warn('StreakTracker.init: container is missing');
      return;
    }

    // Create pill element
    pillEl = document.createElement('div');
    pillEl.className = 'pill streak-pill';
    pillEl.id = 'streak-display';
    pillEl.style.display = 'none';
    pillEl.textContent = '';
    container.appendChild(pillEl);

    streak = 0;
  }

  /**
   * Increment streak and trigger visual/audio escalation.
   * @returns {number} new streak count
   */
  function increment() {
    streak++;

    // Clear any pending reset timeout
    if (resetTimeout) {
      clearTimeout(resetTimeout);
      resetTimeout = null;
    }

    updateDisplay();
    applyPulse();
    applyGlow();

    return streak;
  }

  /**
   * Reset streak to zero with de-escalation animation.
   */
  function reset() {
    if (streak === 0) return;

    streak = 0;

    // Remove glow immediately but transition handles the visual fade
    removeGlow();

    // Transition pill back to default over 500ms
    if (pillEl) {
      pillEl.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      pillEl.style.opacity = '0';

      resetTimeout = setTimeout(function () {
        if (pillEl) {
          pillEl.style.display = 'none';
          pillEl.style.opacity = '';
          pillEl.style.transition = '';
          pillEl.textContent = '';
        }
        resetTimeout = null;
      }, 500);
    }
  }

  /**
   * Get current streak count.
   * @returns {number}
   */
  function getCount() {
    return streak;
  }

  // --- Internal helpers ---

  function updateDisplay() {
    if (!pillEl) return;

    // Show the pill (hidden when streak = 0)
    pillEl.style.display = '';
    pillEl.style.opacity = '1';
    pillEl.style.transition = '';

    // Build text content with fire emoji prefix at streak >= 3
    var text = '';
    if (streak >= 3) {
      var emojiCount = Math.min(streak, 5);
      for (var i = 0; i < emojiCount; i++) {
        text += '\u{1F525}';
      }
      text += ' ';
    }
    text += streak;

    pillEl.textContent = text;
  }

  function applyPulse() {
    if (!pillEl || reducedMotion) return;

    // Remove class first to allow re-trigger
    pillEl.classList.remove('streak-pulse');
    // Force reflow to restart animation
    void pillEl.offsetWidth;
    pillEl.classList.add('streak-pulse');

    // Clean up class after animation completes
    setTimeout(function () {
      if (pillEl) {
        pillEl.classList.remove('streak-pulse');
      }
    }, 200);
  }

  function applyGlow() {
    var gamePanel = document.getElementById('game');
    if (!gamePanel) return;

    if (streak >= 3) {
      gamePanel.classList.add('streak-hot');
      // Dynamic glow intensity based on streak level
      var spread = 8 + streak * 4;
      var alpha = Math.min(0.2 + streak * 0.05, 1.0);
      gamePanel.style.boxShadow = '0 0 ' + spread + 'px rgba(255,194,51,' + alpha + ')';
    } else {
      removeGlow();
    }
  }

  function removeGlow() {
    var gamePanel = document.getElementById('game');
    if (!gamePanel) return;

    gamePanel.classList.remove('streak-hot');
    gamePanel.style.boxShadow = '';
  }

  // Expose public API
  window.StreakTracker = {
    init: init,
    increment: increment,
    reset: reset,
    getCount: getCount
  };
})();
