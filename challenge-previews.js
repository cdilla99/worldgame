/**
 * Challenge card previews: window.GeoWarsChallengePreviews
 *
 * - Country Hunt: turn toward a country, highlight it for two seconds, then
 *   show its flag and name for four seconds using the existing map geometry.
 * - Shape Quiz: show an outline for two seconds, then its flag and name for
 *   four seconds before moving to the next country.
 *
 * Both are decorative (aria-hidden). They only animate while their card is on
 * screen and the tab is visible, and stay still under prefers-reduced-motion.
 */
(function (root) {
  'use strict';

  var GLOBE_TURN_MS = 1800;
  var SHAPE_GUESS_MS = 2000;
  var SHAPE_ANSWER_MS = 4000;
  var SHAPE_FADE_MS = 280;
  // Russia wraps the date line and Portugal is too small to read at this size.
  var EXCLUDED_IDS = { 11: true, 17: true, 126: true, 127: true };

  function toRadians(value) { return value * Math.PI / 180; }
  function normalizeLongitude(value) {
    var result = ((value + 180) % 360 + 360) % 360 - 180;
    return result;
  }

  function onScreen(element, callback, threshold) {
    threshold = threshold || 0.2;
    if (!('IntersectionObserver' in root)) { callback(true); return; }
    new root.IntersectionObserver(function (entries) {
      var entry = entries[entries.length - 1];
      callback(entry.isIntersecting && entry.intersectionRatio >= threshold);
    }, { threshold: threshold }).observe(element);
  }

  function reducedMotion() {
    return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function prepareFlag(card) {
    var slot = root.document.createElement('span');
    slot.className = 'atlas-quiz-answer-flag';
    if (root.AssetFallbacks && root.AssetFallbacks.prepareImage) {
      var image = root.document.createElement('img');
      image.alt = '';
      image.decoding = 'async';
      slot.appendChild(image);
      root.AssetFallbacks.prepareImage(image, 'flag', card, { countryName: card.name, variant: 'compact' });
    } else slot.textContent = card.flag || '';
    return slot;
  }

  function createGlobeCycler(canvas) {
    var regions = root.GeoWarsGlobeRegions;
    var context = canvas && canvas.getContext && canvas.getContext('2d');
    if (!regions || !context) return null;

    var container = canvas.parentNode;
    var geometry = root.GeoWarsShapeGeometry;
    var size = 160;
    var center = 80;
    var radius = 66;
    var longitude = -20;
    var latitude = 14;
    var frame = 0;
    var timer = 0;
    var startedAt = 0;
    var duration = GLOBE_TURN_MS;
    var remaining = duration;
    var visible = false;
    var phase = 'loading';
    var targets = [];
    var index = 0;
    var selected = null;
    var fromLongitude = longitude;
    var fromLatitude = latitude;
    var motion = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var answer = root.document.createElement('div');
    var flagSlot = root.document.createElement('span');
    var countryName = root.document.createElement('strong');
    answer.className = 'atlas-quiz-answer atlas-hunt-answer';
    countryName.className = 'atlas-quiz-answer-name';
    answer.appendChild(flagSlot);
    answer.appendChild(countryName);
    container.appendChild(answer);
    container.dataset.previewPhase = phase;

    function now() { return root.performance.now(); }

    function showPhase(value) {
      phase = value;
      container.dataset.previewPhase = phase;
    }

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

      if (selected && (phase === 'shape' || phase === 'answer')) {
        context.save();
        context.beginPath();
        context.arc(center, center, radius, 0, Math.PI * 2);
        context.clip();
        context.beginPath();
        selected.rings.forEach(function (ring) { line(ring); context.closePath(); });
        context.fillStyle = 'rgba(191, 250, 222, 0.62)';
        context.fill('evenodd');
        context.strokeStyle = 'rgba(233, 255, 245, 0.95)';
        context.lineWidth = Math.max(0.9, size / 260);
        context.lineJoin = 'round';
        context.stroke();
        context.restore();
      }

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

    function orient(elapsed) {
      var progress = Math.min(1, elapsed / duration);
      var eased = (1 - Math.cos(progress * Math.PI)) / 2;
      longitude = normalizeLongitude(fromLongitude + normalizeLongitude(selected.map.x - fromLongitude) * eased);
      latitude = fromLatitude + (selected.map.y - fromLatitude) * eased;
    }

    function pause() {
      if (frame) root.cancelAnimationFrame(frame);
      if (timer) root.clearTimeout(timer);
      if (frame || timer) {
        var elapsed = now() - startedAt;
        if (phase === 'turn') { orient(duration - remaining + elapsed); draw(); }
        remaining = Math.max(0, remaining - elapsed);
      }
      frame = 0;
      timer = 0;
    }

    function select(target, first) {
      pause();
      selected = target;
      container.dataset.previewCountry = String(target.card.id);
      var nextFlag = prepareFlag(target.card);
      flagSlot.replaceWith(nextFlag);
      flagSlot = nextFlag;
      countryName.textContent = target.card.name;
      if (first) { longitude = normalizeLongitude(target.map.x - 24); latitude = target.map.y + 8; }
      fromLongitude = longitude;
      fromLatitude = latitude;
      // Use the short route around the globe, with longer turns for distant targets.
      duration = Math.max(GLOBE_TURN_MS, Math.hypot(normalizeLongitude(target.map.x - longitude), target.map.y - latitude) / 0.025);
      remaining = duration;
      showPhase('turn');
      if (reducedMotion()) {
        longitude = target.map.x;
        latitude = target.map.y;
        showPhase('answer');
      }
      draw();
      sync();
    }

    function advance() {
      if (phase === 'turn') {
        longitude = selected.map.x;
        latitude = selected.map.y;
        showPhase('shape');
        remaining = SHAPE_GUESS_MS;
      } else if (phase === 'shape') {
        showPhase('answer');
        remaining = SHAPE_ANSWER_MS;
      } else {
        index = (index + 1) % targets.length;
        select(targets[index], false);
        return;
      }
      draw();
      sync();
    }

    function step(time) {
      if (!visible || root.document.hidden || reducedMotion()) {
        pause();
        if (reducedMotion()) syncMotion();
        return;
      }
      frame = 0;
      var elapsed = time - startedAt;
      orient(duration - remaining + elapsed);
      draw();
      if (elapsed >= remaining) advance();
      else frame = root.requestAnimationFrame(step);
    }

    function sync() {
      if (!visible || root.document.hidden || reducedMotion()) { pause(); return; }
      if (!selected || frame || timer) return;
      startedAt = now();
      if (phase === 'turn') frame = root.requestAnimationFrame(step);
      else timer = root.setTimeout(function () {
        if (!visible || root.document.hidden || reducedMotion()) {
          pause();
          if (reducedMotion()) syncMotion();
          return;
        }
        timer = 0;
        advance();
      }, remaining);
    }

    function syncMotion() {
      pause();
      if (!selected) return;
      // A preference change never picks another country or starts motion while reduced.
      longitude = selected.map.x;
      latitude = selected.map.y;
      showPhase(reducedMotion() ? 'answer' : 'shape');
      remaining = reducedMotion() ? SHAPE_ANSWER_MS : SHAPE_GUESS_MS;
      draw();
      sync();
    }

    resize();
    root.addEventListener('resize', resize);
    if (root.ResizeObserver) new root.ResizeObserver(resize).observe(canvas);
    root.document.addEventListener('visibilitychange', sync);
    onScreen(canvas, function (isVisible) {
      visible = isVisible;
      if (isVisible) resize();
      sync();
    }, 0.5);
    if (motion && motion.addEventListener) motion.addEventListener('change', syncMotion);
    else if (motion && motion.addListener) motion.addListener(syncMotion);

    if (geometry && geometry.loadGeometry) geometry.loadGeometry().then(function (countries) {
      var cards = root.countryCards || [];
      targets = countries.map(function (map) {
        var card = cards.find(function (candidate) { return candidate.id === map.i; });
        if (!card || card.difficulty !== 'easy' || EXCLUDED_IDS[card.id] || map.s) return null;
        var area = 0;
        var rings = [];
        map.p.forEach(function (polygon) {
          var exterior = polygon[0];
          var signed = 0;
          exterior.forEach(function (point, i) {
            var next = exterior[(i + 1) % exterior.length];
            signed += point[0] * next[1] - next[0] * point[1];
          });
          area = Math.max(area, Math.abs(signed / 2) * Math.cos(toRadians(map.y)));
          polygon.forEach(function (ring) {
            // Subpixel simplification for this small decorative canvas only.
            var previous = ring[0];
            var simplified = ring.filter(function (point, i) {
              if (i && i !== ring.length - 1 && Math.hypot(point[0] - previous[0], point[1] - previous[1]) <= 0.15) return false;
              previous = point;
              return true;
            });
            if (simplified.length >= 4) rings.push(simplified);
          });
        });
        return area >= 90 ? { card: card, map: map, rings: rings } : null;
      }).filter(Boolean);
      if (!targets.length) return;
      // Start near Africa; shuffle later countries without changing canonical data.
      var first = targets.find(function (target) { return target.card.id === 18; }) || targets[0];
      var rest = targets.filter(function (target) { return target !== first; });
      for (var i = rest.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var swap = rest[i]; rest[i] = rest[j]; rest[j] = swap;
      }
      targets = [first].concat(rest);
      select(first, true);
    }).catch(function () { /* Keep the original globe if country geometry is unavailable. */ });
    return { redraw: draw };
  }

  function createShapeCycler(container, fallback) {
    var geometry = root.GeoWarsShapeGeometry;
    var cards = (root.countryCards || []).filter(function (card) {
      return card.difficulty === 'easy' && !EXCLUDED_IDS[card.id];
    });
    if (!container || !geometry || !geometry.render || cards.length < 2) return null;

    // Lead with Brazil's clear, contiguous outline before cycling the existing pool.
    var first = cards.find(function (card) { return card.id === 4; }) || cards[0];
    var order = [first].concat(cards.filter(function (card) { return card.id !== first.id; }).sort(function () { return Math.random() - 0.5; }));
    var index = 0;
    var timer = 0;
    var startedAt = 0;
    var remaining = SHAPE_GUESS_MS;
    var phase = 'shape';
    var visible = false;
    var ready = false;
    var current = null;
    var generation = 0;
    var motion = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var answer = root.document.createElement('div');
    var flagSlot = root.document.createElement('span');
    var countryName = root.document.createElement('strong');
    answer.className = 'atlas-quiz-answer';
    countryName.className = 'atlas-quiz-answer-name';
    answer.appendChild(flagSlot);
    answer.appendChild(countryName);
    container.classList.add('has-preview-answer');
    container.dataset.previewPhase = 'loading';
    container.appendChild(answer);

    function now() {
      return root.performance && root.performance.now ? root.performance.now() : Date.now();
    }

    function pause() {
      if (!timer) return;
      root.clearTimeout(timer);
      timer = 0;
      remaining = Math.max(0, remaining - (now() - startedAt));
    }

    function renderPhase() {
      container.dataset.previewPhase = ready ? phase : 'loading';
    }

    function show(card) {
      pause();
      ready = false;
      renderPhase();
      var version = ++generation;
      // Begin loading the flag while the outline is still unrevealed.
      var nextFlag = prepareFlag(card);
      var holder = root.document.createElement('div');
      holder.className = 'atlas-quiz-shape';
      return geometry.render(holder, card, { padding: 0.06, compactBounds: true, label: 'Country outline' })
        .then(function (svg) {
          if (version !== generation) return;
          if (!svg) throw new Error('Shape unavailable');
          svg.setAttribute('aria-hidden', 'true');
          svg.removeAttribute('role');
          svg.removeAttribute('aria-label');
          if (fallback && fallback.parentNode) fallback.parentNode.removeChild(fallback);
          var previous = current;
          current = holder;
          container.appendChild(holder);
          flagSlot.replaceWith(nextFlag);
          flagSlot = nextFlag;
          countryName.textContent = card.name;
          phase = reducedMotion() ? 'answer' : 'shape';
          remaining = phase === 'shape' ? SHAPE_GUESS_MS : SHAPE_ANSWER_MS;
          root.requestAnimationFrame(function () {
            if (version !== generation) return;
            holder.classList.add('is-visible');
            ready = true;
            renderPhase();
            sync();
          });
          if (previous) {
            previous.classList.remove('is-visible');
            root.setTimeout(function () { if (previous.parentNode) previous.parentNode.removeChild(previous); }, SHAPE_FADE_MS + 40);
          }
        })
        .catch(function () {
          // Keep the previous country and its matching answer if rendering fails.
          if (version !== generation || !current) return;
          ready = true;
          phase = 'answer';
          remaining = SHAPE_ANSWER_MS;
          renderPhase();
          sync();
        });
    }

    function next() {
      index = (index + 1) % order.length;
      return show(order[index]);
    }

    function sync() {
      var shouldRun = ready && visible && !root.document.hidden && !reducedMotion();
      if (!shouldRun) { pause(); return; }
      if (timer) return;
      startedAt = now();
      timer = root.setTimeout(function () {
        timer = 0;
        remaining = 0;
        if (!visible || root.document.hidden || reducedMotion()) { sync(); return; }
        if (phase === 'shape') {
          phase = 'answer';
          remaining = SHAPE_ANSWER_MS;
          renderPhase();
          sync();
        } else next();
      }, remaining);
    }

    function syncMotion() {
      pause();
      phase = reducedMotion() ? 'answer' : 'shape';
      remaining = phase === 'shape' ? SHAPE_GUESS_MS : SHAPE_ANSWER_MS;
      renderPhase();
      sync();
    }

    show(order[0]);
    root.document.addEventListener('visibilitychange', sync);
    onScreen(container, function (isVisible) { visible = isVisible; sync(); }, 0.5);
    if (motion && motion.addEventListener) motion.addEventListener('change', syncMotion);
    else if (motion && motion.addListener) motion.addListener(syncMotion);
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
      if (createGlobeCycler(canvas)) huntImage.parentNode.removeChild(huntImage);
      else canvas.parentNode.removeChild(canvas);
    }
    var art = document.getElementById('quiz-preview-art');
    if (art) createShapeCycler(art, art.querySelector('.atlas-quiz-preview'));
  }

  root.GeoWarsChallengePreviews = Object.freeze({ init: init });
  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : this);
