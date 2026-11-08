/**
 * Challenge card previews: window.GeoWarsChallengePreviews
 *
 * - Country Hunt: a small canvas globe that turns slowly, drawn from the same
 *   continent data (GeoWarsGlobeRegions) and palette as the main globe.
 * - Shape Quiz: an outline that changes every few seconds, picked from the easy
 *   countries so the preview invites a play rather than intimidating.
 *
 * Both are decorative (aria-hidden). They only animate while their card is on
 * screen and the tab is visible, and stay still under prefers-reduced-motion.
 */
(function (root) {
  'use strict';

  var SPIN_DEGREES_PER_MS = 0.008;
  var SHAPE_INTERVAL_MS = 3500;
  var SHAPE_FADE_MS = 280;
  // Russia wraps the date line and Portugal is too small to read at this size.
  var EXCLUDED_IDS = { 11: true, 17: true, 126: true, 127: true };

  function toRadians(value) { return value * Math.PI / 180; }
  function normalizeLongitude(value) {
    var result = ((value + 180) % 360 + 360) % 360 - 180;
    return result;
  }

  function onScreen(element, callback) {
    if (!('IntersectionObserver' in root)) { callback(true); return; }
    new root.IntersectionObserver(function (entries) {
      callback(entries[entries.length - 1].isIntersecting);
    }, { threshold: 0.2 }).observe(element);
  }

  function reducedMotion() {
    return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function createSpinningGlobe(canvas) {
    var regions = root.GeoWarsGlobeRegions;
    var context = canvas && canvas.getContext && canvas.getContext('2d');
    if (!regions || !context) return null;

    var size = 160;
    var center = 80;
    var radius = 66;
    var longitude = -20;
    var latitude = 14;
    var frame = 0;
    var last = 0;
    var visible = false;

    function project(lon, lat) {
      var lambda = toRadians(normalizeLongitude(lon - longitude));
      var phi = toRadians(lat);
      var phi0 = toRadians(latitude);
      var cosPhi = Math.cos(phi);
      var facing = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * cosPhi * Math.cos(lambda);
      return {
        x: center + radius * cosPhi * Math.sin(lambda),
        y: center - radius * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * cosPhi * Math.cos(lambda)),
        visible: facing >= -0.012
      };
    }

    function line(points) {
      var drawing = false;
      points.forEach(function (point) {
        var p = project(point[0], point[1]);
        if (!p.visible) { drawing = false; return; }
        if (!drawing) context.moveTo(p.x, p.y); else context.lineTo(p.x, p.y);
        drawing = true;
      });
    }

    function draw() {
      var dpr = Math.min(root.devicePixelRatio || 1, 2);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, size, size);

      context.beginPath();
      context.arc(center, center, radius, 0, Math.PI * 2);
      var ocean = context.createRadialGradient(center - radius * 0.38, center - radius * 0.4, radius * 0.05, center, center, radius * 1.08);
      ocean.addColorStop(0, '#66adff');
      ocean.addColorStop(0.32, '#2469c7');
      ocean.addColorStop(0.7, '#123d78');
      ocean.addColorStop(1, '#061a3c');
      context.fillStyle = ocean;
      context.fill();

      context.beginPath();
      for (var meridian = -180; meridian < 180; meridian += 30) {
        var meridianPoints = [];
        for (var parallel = -90; parallel <= 90; parallel += 4) meridianPoints.push([meridian, parallel]);
        line(meridianPoints);
      }
      for (var latitudeLine = -60; latitudeLine <= 60; latitudeLine += 30) {
        var parallelPoints = [];
        for (var lon = -180; lon <= 180; lon += 4) parallelPoints.push([lon, latitudeLine]);
        line(parallelPoints);
      }
      context.strokeStyle = 'rgba(198, 224, 255, 0.18)';
      context.lineWidth = 0.8;
      context.stroke();

      var land = context.createLinearGradient(center - radius, center - radius, center + radius, center + radius);
      land.addColorStop(0, '#88e8bd');
      land.addColorStop(0.6, '#35b98c');
      land.addColorStop(1, '#17705e');
      Object.keys(regions).forEach(function (region) {
        context.beginPath();
        regions[region].forEach(line);
        context.fillStyle = land;
        context.strokeStyle = 'rgba(3, 38, 52, 0.68)';
        context.lineWidth = 0.78;
        context.fill();
        context.stroke();
      });

      context.beginPath();
      context.arc(center, center, radius, 0, Math.PI * 2);
      var shade = context.createRadialGradient(center - radius * 0.18, center - radius * 0.2, radius * 0.36, center, center, radius);
      shade.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
      shade.addColorStop(0.62, 'rgba(4, 15, 38, 0)');
      shade.addColorStop(1, 'rgba(1, 7, 22, 0.68)');
      context.fillStyle = shade;
      context.fill();
      context.strokeStyle = 'rgba(182, 224, 255, 0.72)';
      context.lineWidth = 1.2;
      context.stroke();
    }

    function resize() {
      var width = canvas.clientWidth || 160;
      var dpr = Math.min(root.devicePixelRatio || 1, 2);
      size = Math.round(width);
      center = size / 2;
      radius = size * 0.45;
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      draw();
    }

    function step(now) {
      frame = 0;
      if (!visible || root.document.hidden || reducedMotion()) { last = 0; return; }
      if (last) {
        longitude = normalizeLongitude(longitude + Math.min(now - last, 34) * SPIN_DEGREES_PER_MS);
        draw();
      }
      last = now;
      frame = root.requestAnimationFrame(step);
    }

    function sync() {
      if (visible && !root.document.hidden && !reducedMotion() && !frame) {
        frame = root.requestAnimationFrame(step);
      }
    }

    resize();
    root.addEventListener('resize', resize);
    root.document.addEventListener('visibilitychange', sync);
    onScreen(canvas, function (isVisible) {
      visible = isVisible;
      last = 0;
      if (isVisible) resize();
      sync();
    });
    return { redraw: draw };
  }

  function createShapeCycler(container, fallback) {
    var geometry = root.GeoWarsShapeGeometry;
    var cards = (root.countryCards || []).filter(function (card) {
      return card.difficulty === 'easy' && !EXCLUDED_IDS[card.id];
    });
    if (!container || !geometry || !geometry.render || cards.length < 2) return null;

    var order = cards.slice().sort(function () { return Math.random() - 0.5; });
    var index = 0;
    var timer = 0;
    var visible = false;
    var current = null;

    function show(card) {
      var holder = root.document.createElement('div');
      holder.className = 'atlas-quiz-shape';
      return geometry.render(holder, card, { padding: 0.06, compactBounds: true, label: 'Country outline' })
        .then(function (svg) {
          if (!svg) return;
          svg.setAttribute('aria-hidden', 'true');
          svg.removeAttribute('role');
          svg.removeAttribute('aria-label');
          if (fallback && fallback.parentNode) fallback.parentNode.removeChild(fallback);
          var previous = current;
          current = holder;
          container.appendChild(holder);
          root.requestAnimationFrame(function () { holder.classList.add('is-visible'); });
          if (previous) {
            previous.classList.remove('is-visible');
            root.setTimeout(function () { if (previous.parentNode) previous.parentNode.removeChild(previous); }, SHAPE_FADE_MS + 40);
          }
        })
        .catch(function () { /* keep whatever is showing */ });
    }

    function next() {
      index = (index + 1) % order.length;
      return show(order[index]);
    }

    function sync() {
      var shouldRun = visible && !root.document.hidden && !reducedMotion();
      if (shouldRun && !timer) timer = root.setInterval(next, SHAPE_INTERVAL_MS);
      if (!shouldRun && timer) { root.clearInterval(timer); timer = 0; }
    }

    show(order[0]);
    root.document.addEventListener('visibilitychange', sync);
    onScreen(container, function (isVisible) { visible = isVisible; sync(); });
    return { next: next };
  }

  function init() {
    var document = root.document;
    var huntImage = document.querySelector('.atlas-hunt-preview');
    if (huntImage) {
      var canvas = document.createElement('canvas');
      canvas.className = huntImage.className;
      canvas.setAttribute('aria-hidden', 'true');
      huntImage.parentNode.insertBefore(canvas, huntImage);
      if (createSpinningGlobe(canvas)) huntImage.parentNode.removeChild(huntImage);
      else canvas.parentNode.removeChild(canvas);
    }
    var art = document.getElementById('quiz-preview-art');
    if (art) createShapeCycler(art, art.querySelector('.atlas-quiz-preview'));
  }

  root.GeoWarsChallengePreviews = Object.freeze({ init: init });
  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : this);
