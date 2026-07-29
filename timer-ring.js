/**
 * Timer Ring Module
 * Creates and manages an SVG circular progress indicator that depletes as time passes.
 * Color transitions: green (>50%) → yellow (20–50%) → red (<20%)
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
(function () {
  'use strict';

  var RADIUS = 24;
  var CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 150.796

  var state = {
    totalSeconds: 0,
    svgCircle: null,
    svgElement: null,
  };

  /**
   * Create the SVG ring element and insert into DOM.
   * @param {HTMLElement} container - where to insert the ring
   * @param {number} totalSeconds - total timer duration
   */
  function create(container, totalSeconds) {
    if (!container) {
      console.warn('TimerRing.create: container is missing, no-op.');
      return;
    }

    state.totalSeconds = totalSeconds;

    // Remove existing ring if any
    if (state.svgElement && state.svgElement.parentNode) {
      state.svgElement.parentNode.removeChild(state.svgElement);
    }

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'timer-ring timer-ring--green');
    svg.setAttribute('width', '56');
    svg.setAttribute('height', '56');
    svg.setAttribute('viewBox', '0 0 56 56');

    var bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('class', 'timer-ring__bg');
    bgCircle.setAttribute('cx', '28');
    bgCircle.setAttribute('cy', '28');
    bgCircle.setAttribute('r', '24');
    bgCircle.setAttribute('fill', 'none');
    bgCircle.setAttribute('stroke', '#e5eaf0');
    bgCircle.setAttribute('stroke-width', '4');

    var progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    progressCircle.setAttribute('class', 'timer-ring__progress');
    progressCircle.setAttribute('cx', '28');
    progressCircle.setAttribute('cy', '28');
    progressCircle.setAttribute('r', '24');
    progressCircle.setAttribute('fill', 'none');
    progressCircle.setAttribute('stroke', 'var(--timer-color)');
    progressCircle.setAttribute('stroke-width', '4');
    progressCircle.setAttribute('stroke-dasharray', CIRCUMFERENCE.toString());
    progressCircle.setAttribute('stroke-dashoffset', '0');
    progressCircle.setAttribute('stroke-linecap', 'round');
    progressCircle.setAttribute('transform', 'rotate(-90 28 28)');

    svg.appendChild(bgCircle);
    svg.appendChild(progressCircle);
    container.appendChild(svg);

    state.svgCircle = progressCircle;
    state.svgElement = svg;
  }

  /**
   * Update the ring's fill percentage and color phase.
   * Called once per second from the timer interval.
   * @param {number} remainingSeconds
   */
  function update(remainingSeconds) {
    if (!state.svgCircle || !state.svgElement) {
      return;
    }

    var total = state.totalSeconds;
    if (total <= 0) return;

    // Clamp remaining to valid range
    var remaining = Math.max(0, Math.min(remainingSeconds, total));

    // Compute stroke-dashoffset: circumference × (1 - remaining/total)
    var offset = CIRCUMFERENCE * (1 - remaining / total);
    state.svgCircle.setAttribute('stroke-dashoffset', offset.toString());

    // Compute percentage remaining
    var percentage = (remaining / total) * 100;

    // Apply color class based on percentage thresholds
    var svg = state.svgElement;
    svg.classList.remove('timer-ring--green', 'timer-ring--yellow', 'timer-ring--red');

    if (percentage > 50) {
      svg.classList.add('timer-ring--green');
    } else if (percentage >= 20) {
      svg.classList.add('timer-ring--yellow');
    } else {
      svg.classList.add('timer-ring--red');
    }
  }

  /**
   * Reset ring to full for a new game.
   * @param {number} totalSeconds
   */
  function reset(totalSeconds) {
    if (!state.svgCircle || !state.svgElement) {
      return;
    }

    state.totalSeconds = totalSeconds;
    state.svgCircle.setAttribute('stroke-dashoffset', '0');

    var svg = state.svgElement;
    svg.classList.remove('timer-ring--green', 'timer-ring--yellow', 'timer-ring--red');
    svg.classList.add('timer-ring--green');
  }

  // Preserve the classic-script global. A side-effect module import must not
  // replace an instance that was already created by an earlier script tag.
  var root = typeof window !== 'undefined' ? window : globalThis;
  if (!root.TimerRing
    || typeof root.TimerRing.create !== 'function'
    || typeof root.TimerRing.update !== 'function'
    || typeof root.TimerRing.reset !== 'function') {
    root.TimerRing = {
      create: create,
      update: update,
      reset: reset,
    };
  }
})();
