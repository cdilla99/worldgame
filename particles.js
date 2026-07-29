/**
 * Particle System — CSS-driven confetti burst
 * Creates lightweight div particles with randomized CSS custom properties.
 * All motion is CSS keyframe-driven (no requestAnimationFrame loops).
 * Respects prefers-reduced-motion and enforces a global cap of 30 active particles.
 */
(function () {
  'use strict';

  const COLORS = ['#ff6b6b', '#6b9eff', '#ffb833', '#2ee89a', '#ffc233', '#ff5277'];
  const MAX_ACTIVE = 30;
  const DEFAULT_COUNT = 25;
  const DEFAULT_DURATION = 1800;

  let activeCount = 0;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randomInt(min, max) {
    return Math.floor(randomBetween(min, max + 1));
  }

  function pickColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  /**
   * Emit a confetti burst in the given container.
   * @param {HTMLElement} container - parent element for particles
   * @param {object} [options]
   * @param {number} [options.count=25] - number of particles (20–25 range)
   * @param {number} [options.duration=1800] - animation duration in ms
   */
  function burst(container, options) {
    // No-op if reduced motion is preferred
    if (reducedMotion) return;

    if (!container) return;

    var opts = options || {};
    var count = opts.count != null ? opts.count : DEFAULT_COUNT;
    var duration = opts.duration != null ? opts.duration : DEFAULT_DURATION;

    // Clamp count to what the cap allows
    var available = MAX_ACTIVE - activeCount;
    if (available <= 0) return;
    count = Math.min(count, available);

    for (var i = 0; i < count; i++) {
      createParticle(container, duration);
    }
  }

  function createParticle(container, duration) {
    var el = document.createElement('div');
    el.className = 'particle';

    // Randomized CSS custom properties
    var x = randomBetween(-150, 150);
    var y = randomBetween(-200, -50);
    var r = randomBetween(0, 720);
    var color = pickColor();
    var size = randomInt(6, 12);

    el.style.setProperty('--x', x + 'px');
    el.style.setProperty('--y', y + 'px');
    el.style.setProperty('--r', r + 'deg');
    el.style.setProperty('--color', color);
    el.style.setProperty('--size', size + 'px');
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.backgroundColor = color;
    el.style.animationDuration = duration + 'ms';

    activeCount++;

    var removed = false;

    function cleanup() {
      if (removed) return;
      removed = true;
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
      activeCount--;
    }

    // Clean up on animation end
    el.addEventListener('animationend', cleanup);

    // Safety fallback: remove after 2 seconds even if animationend doesn't fire
    setTimeout(cleanup, 2000);

    container.appendChild(el);
  }

  window.Particles = {
    burst: burst
  };
})();
