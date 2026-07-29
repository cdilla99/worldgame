/**
 * Near Miss Detector Module
 * Calculates Levenshtein distance between strings to detect close guesses.
 * Exposes window.NearMiss = { levenshtein(a, b), isNearMiss(guess, answer) }
 */
(function () {
  'use strict';

  /**
   * Compute Levenshtein distance between two strings.
   * Uses iterative single-row optimization: O(m×n) time, O(n) space.
   * Case-insensitive, trimmed comparison.
   * Null/undefined inputs are coerced to empty string.
   * @param {string} a
   * @param {string} b
   * @returns {number} edit distance
   */
  function levenshtein(a, b) {
    a = (a == null ? '' : String(a)).trim().toLowerCase();
    b = (b == null ? '' : String(b)).trim().toLowerCase();

    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    var prev = Array.from({ length: b.length + 1 }, function (_, i) { return i; });
    var curr = new Array(b.length + 1);

    for (var i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (var j = 1; j <= b.length; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(
          prev[j] + 1,        // deletion
          curr[j - 1] + 1,    // insertion
          prev[j - 1] + cost  // substitution
        );
      }
      var temp = prev;
      prev = curr;
      curr = temp;
    }
    return prev[b.length];
  }

  /**
   * Check if a guess is a near miss (Levenshtein distance ≤ 2).
   * Case-insensitive, trimmed comparison.
   * @param {string} guess - player's guess
   * @param {string} answer - correct country name
   * @returns {boolean} true if distance ≤ 2
   */
  function isNearMiss(guess, answer) {
    return levenshtein(guess, answer) <= 2;
  }

  window.NearMiss = {
    levenshtein: levenshtein,
    isNearMiss: isNearMiss
  };
})();
