'use strict';

/**
 * GeoWars landing globe
 *
 * The geometry is bundled in assets/globe-data.js so the landing page keeps
 * working without a CDN or build step. Motion is direct-manipulation only:
 * the globe redraws after drag, keyboard input, resize, or region selection.
 */
(function installInteractiveGlobe(root) {
  const REGION_CENTERS = {
    'Africa': [20, 4],
    'Asia': [88, 32],
    'Europe': [16, 51],
    'North America': [-102, 43],
    'South America': [-61, -18],
    'Oceania': [143, -24]
  };
  const REGION_LABELS = {
    'North America': 'Americas',
    'South America': 'Americas'
  };
  const HIT_COLORS = {
    'Africa': [231, 71, 98],
    'Asia': [64, 180, 255],
    'Europe': [255, 201, 71],
    'North America': [110, 240, 172],
    'South America': [185, 105, 255],
    'Oceania': [255, 139, 65]
  };
  const HIT_LOOKUP = Object.fromEntries(
    Object.entries(HIT_COLORS).map(([region, color]) => [color.join(','), region])
  );

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const toRadians = degrees => degrees * Math.PI / 180;
  const normalizeLongitude = longitude => {
    let result = longitude % 360;
    if (result > 180) result -= 360;
    if (result < -180) result += 360;
    return result;
  };

  function initializeGlobe() {
    const regions = root.GeoWarsGlobeRegions;
    const globe = document.getElementById('landing-globe');
    const canvas = document.getElementById('landing-globe-canvas');
    const status = document.getElementById('landing-globe-status');
    const selectionCard = document.getElementById('globe-selection-card');
    const resetButton = document.getElementById('btn-globe-worldwide');
    const regionModeButton = document.getElementById('btn-globe-region-mode');
    const regionModeLabel = document.getElementById('globe-region-toggle-label');
    const regionButtons = Array.from(document.querySelectorAll('#continent-row [data-continent]'));
    if (!regions || !globe || !canvas || !status || !resetButton || !regionModeButton || !regionModeLabel || !regionButtons.length) return;

    const context = canvas.getContext('2d');
    const hitCanvas = document.createElement('canvas');
    const hitContext = hitCanvas.getContext('2d', { willReadFrequently: true });
    if (!context || !hitContext) return;

    const prefersReducedMotion = root.matchMedia('(prefers-reduced-motion: reduce)');
    let size = 320;
    let radius = 142;
    let center = 160;
    let longitude = -16;
    let latitude = 12;
    let hoveredRegion = null;
    let keyboardRegion = 'Africa';
    let selectedRegion = 'all';
    let dragging = false;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let dragDistance = 0;
    let velocityLongitude = 0;
    let velocityLatitude = 0;
    let animationFrame = 0;
    let resizeFrame = 0;

    let idleRotationFrame = 0;
    let idleRotationActive = !prefersReducedMotion.matches;
    let idleRotationLastTime = 0;
    function project(longitudeValue, latitudeValue) {
      const lambda = toRadians(normalizeLongitude(longitudeValue - longitude));
      const phi = toRadians(latitudeValue);
      const phi0 = toRadians(latitude);
      const cosPhi = Math.cos(phi);
      const visibility = Math.sin(phi0) * Math.sin(phi) +
        Math.cos(phi0) * cosPhi * Math.cos(lambda);
      return {
        x: center + radius * cosPhi * Math.sin(lambda),
        y: center - radius * (
          Math.cos(phi0) * Math.sin(phi) -
          Math.sin(phi0) * cosPhi * Math.cos(lambda)
        ),
        visible: visibility >= -0.012,
        visibility
      };
    }

    function stopIdleRotation() {
      idleRotationActive = false;
      if (idleRotationFrame) root.cancelAnimationFrame(idleRotationFrame);
      idleRotationFrame = 0;
    }

    function startIdleRotation() {
      if (!idleRotationActive || idleRotationFrame || prefersReducedMotion.matches) return;
      const step = now => {
        if (!idleRotationActive || prefersReducedMotion.matches) {
          idleRotationFrame = 0;
          return;
        }
        if (idleRotationLastTime) {
          const elapsed = Math.min(now - idleRotationLastTime, 34);
          longitude = normalizeLongitude(longitude + elapsed * 0.0022);
          draw();
        }
        idleRotationLastTime = now;
        idleRotationFrame = root.requestAnimationFrame(step);
      };
      idleRotationFrame = root.requestAnimationFrame(step);
    }

    function appendProjectedLine(targetContext, points) {
      let drawing = false;
      points.forEach(point => {
        const projected = project(point[0], point[1]);
        if (!projected.visible) {
          drawing = false;
          return;
        }
        if (!drawing) targetContext.moveTo(projected.x, projected.y);
        else targetContext.lineTo(projected.x, projected.y);
        drawing = true;
      });
    }

    function drawGraticule(targetContext) {
      targetContext.save();
      targetContext.beginPath();
      for (let meridian = -180; meridian < 180; meridian += 30) {
        const points = [];
        for (let parallel = -90; parallel <= 90; parallel += 3) {
          points.push([meridian, parallel]);
        }
        appendProjectedLine(targetContext, points);
      }
      for (let parallel = -60; parallel <= 60; parallel += 30) {
        const points = [];
        for (let meridian = -180; meridian <= 180; meridian += 3) {
          points.push([meridian, parallel]);
        }
        appendProjectedLine(targetContext, points);
      }
      targetContext.strokeStyle = 'rgba(198, 224, 255, 0.18)';
      targetContext.lineWidth = 0.8;
      targetContext.stroke();
      targetContext.restore();
    }

    function isSelectedRegion(region) {
      if (selectedRegion === 'North America') {
        return region === 'North America' || region === 'South America';
      }
      return selectedRegion === region;
    }

    function drawRegion(targetContext, region, isHitTarget) {
      const isSelected = isSelectedRegion(region);
      const isHovered = hoveredRegion === region ||
        (hoveredRegion === 'South America' && region === 'North America') ||
        (hoveredRegion === 'North America' && region === 'South America');
      targetContext.save();
      targetContext.beginPath();
      regions[region].forEach(ring => appendProjectedLine(targetContext, ring));

      if (isHitTarget) {
        const color = HIT_COLORS[region];
        targetContext.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        targetContext.strokeStyle = targetContext.fillStyle;
        targetContext.lineWidth = 2.5;
      } else {
        const landGradient = targetContext.createLinearGradient(
          center - radius,
          center - radius,
          center + radius,
          center + radius
        );
        if (isSelected) {
          landGradient.addColorStop(0, '#d7ffe4');
          landGradient.addColorStop(0.52, '#7ef0b9');
          landGradient.addColorStop(1, '#28a77d');
        } else if (isHovered) {
          landGradient.addColorStop(0, '#baffd5');
          landGradient.addColorStop(0.58, '#55dca5');
          landGradient.addColorStop(1, '#208d70');
        } else {
          landGradient.addColorStop(0, '#88e8bd');
          landGradient.addColorStop(0.6, '#35b98c');
          landGradient.addColorStop(1, '#17705e');
        }
        targetContext.fillStyle = landGradient;
        targetContext.strokeStyle = isSelected
          ? 'rgba(239, 255, 246, 0.94)'
          : isHovered
            ? 'rgba(218, 255, 235, 0.82)'
            : 'rgba(3, 38, 52, 0.68)';
        targetContext.lineWidth = isSelected ? 1.4 : isHovered ? 1.1 : 0.78;
        if (isSelected) {
          targetContext.shadowColor = 'rgba(91, 242, 170, 0.52)';
          targetContext.shadowBlur = 9;
        }
      }

      targetContext.fill();
      targetContext.stroke();
      targetContext.restore();
    }

    function drawOcean(targetContext) {
      targetContext.save();
      targetContext.beginPath();
      targetContext.arc(center, center, radius, 0, Math.PI * 2);
      const ocean = targetContext.createRadialGradient(
        center - radius * 0.38,
        center - radius * 0.4,
        radius * 0.05,
        center,
        center,
        radius * 1.08
      );
      ocean.addColorStop(0, '#66adff');
      ocean.addColorStop(0.32, '#2469c7');
      ocean.addColorStop(0.7, '#123d78');
      ocean.addColorStop(1, '#061a3c');
      targetContext.fillStyle = ocean;
      targetContext.fill();
      targetContext.restore();
    }

    function drawAtmosphere(targetContext) {
      targetContext.save();
      targetContext.beginPath();
      targetContext.arc(center, center, radius, 0, Math.PI * 2);
      const shade = targetContext.createRadialGradient(
        center - radius * 0.18,
        center - radius * 0.2,
        radius * 0.36,
        center,
        center,
        radius
      );
      shade.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
      shade.addColorStop(0.62, 'rgba(4, 15, 38, 0)');
      shade.addColorStop(1, 'rgba(1, 7, 22, 0.68)');
      targetContext.fillStyle = shade;
      targetContext.fill();
      targetContext.strokeStyle = 'rgba(182, 224, 255, 0.72)';
      targetContext.lineWidth = 1.2;
      targetContext.stroke();
      targetContext.restore();
    }

    function updateKeyboardRegion() {
      let nearest = null;
      let nearestDistance = Number.POSITIVE_INFINITY;
      Object.entries(REGION_CENTERS).forEach(([region, coordinates]) => {
        const projected = project(coordinates[0], coordinates[1]);
        if (!projected.visible) return;
        const distance = Math.hypot(projected.x - center, projected.y - center);
        if (distance < nearestDistance) {
          nearest = region;
          nearestDistance = distance;
        }
      });
      if (nearest) keyboardRegion = nearest;
    }

    function draw() {
      const devicePixelRatio = Math.min(root.devicePixelRatio || 1, 2);
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      context.clearRect(0, 0, size, size);
      hitContext.setTransform(1, 0, 0, 1, 0, 0);
      hitContext.clearRect(0, 0, size, size);

      drawOcean(context);
      drawGraticule(context);
      Object.keys(REGION_CENTERS).forEach(region => drawRegion(context, region, false));
      drawAtmosphere(context);

      hitContext.save();
      hitContext.beginPath();
      hitContext.arc(center, center, radius, 0, Math.PI * 2);
      hitContext.clip();
      Object.keys(REGION_CENTERS).forEach(region => drawRegion(hitContext, region, true));
      hitContext.restore();

      updateKeyboardRegion();
      canvas.setAttribute(
        'aria-label',
        `Interactive globe. ${REGION_LABELS[keyboardRegion] || keyboardRegion} is centered. ` +
        'Use arrow keys to rotate and press Enter to choose it.'
      );
    }

    function resize() {
      const rect = globe.getBoundingClientRect();
      size = Math.max(220, Math.round(Math.min(rect.width, rect.height || rect.width)));
      center = size / 2;
      radius = size * 0.405;
      const devicePixelRatio = Math.min(root.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * devicePixelRatio);
      canvas.height = Math.round(size * devicePixelRatio);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      hitCanvas.width = size;
      hitCanvas.height = size;
      draw();
    }

    function readRegionAt(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((clientX - rect.left) * size / rect.width);
      const y = Math.floor((clientY - rect.top) * size / rect.height);
      if (x < 0 || y < 0 || x >= size || y >= size) return null;
      const pixel = hitContext.getImageData(x, y, 1, 1).data;
      return HIT_LOOKUP[`${pixel[0]},${pixel[1]},${pixel[2]}`] || null;
    }

    function updateStatus(message) {
      status.textContent = message;
    }

    function confirmSelection() {
      if (!selectionCard) return;
      selectionCard.classList.remove('is-confirmed');
      void selectionCard.offsetWidth;
      selectionCard.classList.add('is-confirmed');
      root.setTimeout(() => selectionCard.classList.remove('is-confirmed'), 620);
    }

    function selectedLabel(region) {
      return REGION_LABELS[region] || region;
    }

    function selectRegion(region) {
      const buttonValue = region === 'South America' ? 'North America' : region;
      stopIdleRotation();
      const button = regionButtons.find(candidate => candidate.dataset.continent === buttonValue);
      if (!button) return;
      button.click();
      syncSelectedRegion({ animate: false });
      updateStatus(`${selectedLabel(region)} selected.`);
      confirmSelection();
      animateToRegion(region);
    }

    function setRotation(nextLongitude, nextLatitude) {
      longitude = normalizeLongitude(nextLongitude);
      latitude = clamp(nextLatitude, -52, 66);
      draw();
    }

    function stopAnimation() {
      if (animationFrame) root.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }

    function animateToRegion(region) {
      const target = REGION_CENTERS[region];
      if (!target) return;
      stopAnimation();
      if (prefersReducedMotion.matches) {
        setRotation(target[0], clamp(target[1], -38, 48));
        return;
      }
      const startLongitude = longitude;
      const startLatitude = latitude;
      let deltaLongitude = normalizeLongitude(target[0] - startLongitude);
      const targetLatitude = clamp(target[1], -38, 48);
      const started = root.performance.now();
      const duration = 440;
      const step = now => {
        const progress = clamp((now - started) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setRotation(
          startLongitude + deltaLongitude * eased,
          startLatitude + (targetLatitude - startLatitude) * eased
        );
        if (progress < 1) animationFrame = root.requestAnimationFrame(step);
        else animationFrame = 0;
      };
      animationFrame = root.requestAnimationFrame(step);
    }

    function runInertia() {
      stopAnimation();
      if (prefersReducedMotion.matches) return;
      const step = () => {
        velocityLongitude *= 0.9;
        velocityLatitude *= 0.9;
        if (Math.abs(velocityLongitude) + Math.abs(velocityLatitude) < 0.04) {
          animationFrame = 0;
          return;
        }
        setRotation(longitude + velocityLongitude, latitude + velocityLatitude);
        animationFrame = root.requestAnimationFrame(step);
      };
      animationFrame = root.requestAnimationFrame(step);
    }

    function syncSelectedRegion(options = {}) {
      const active = regionButtons.find(button => button.getAttribute('aria-pressed') === 'true');
      const nextSelected = active ? active.dataset.continent : 'all';
      const changed = nextSelected !== selectedRegion;
      selectedRegion = nextSelected;
      const isWorldwide = selectedRegion === 'all';
      resetButton.classList.toggle('is-active', isWorldwide);
      resetButton.setAttribute('aria-pressed', String(isWorldwide));
      regionModeButton.classList.toggle('is-active', !isWorldwide);
      regionModeButton.setAttribute('aria-pressed', String(!isWorldwide));
      regionModeLabel.textContent = isWorldwide ? 'Regions' : selectedLabel(selectedRegion);
      if (isWorldwide) {
        if (changed) updateStatus('Worldwide selected.');
      } else {
        updateStatus(`${selectedLabel(selectedRegion)} selected.`);
        if (changed && options.animate !== false) animateToRegion(selectedRegion);
      }
      draw();
    }

    canvas.addEventListener('pointerdown', event => {
      stopAnimation();
      stopIdleRotation();
      dragging = true;
      pointerId = event.pointerId;
      startX = lastX = event.clientX;
      startY = lastY = event.clientY;
      dragDistance = 0;
      velocityLongitude = 0;
      velocityLatitude = 0;
      canvas.setPointerCapture(pointerId);
      globe.classList.add('is-dragging');
    });

    canvas.addEventListener('pointermove', event => {
      if (!dragging) {
        const nextHovered = readRegionAt(event.clientX, event.clientY);
        if (nextHovered !== hoveredRegion) {
          hoveredRegion = nextHovered;
          globe.dataset.hoveredRegion = selectedLabel(hoveredRegion || '');
          updateStatus(hoveredRegion
            ? `${selectedLabel(hoveredRegion)}. Select this region.`
            : 'Drag to rotate. Select a continent.');
          draw();
        }
        return;
      }
      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      dragDistance = Math.max(dragDistance, Math.hypot(event.clientX - startX, event.clientY - startY));
      velocityLongitude = -deltaX * 0.42;
      velocityLatitude = deltaY * 0.28;
      setRotation(longitude + velocityLongitude, latitude + velocityLatitude);
      lastX = event.clientX;
      lastY = event.clientY;
    });

    function finishPointer(event) {
      if (!dragging || event.pointerId !== pointerId) return;
      dragging = false;
      globe.classList.remove('is-dragging');
      if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
      pointerId = null;
      if (dragDistance < 7) {
        const region = readRegionAt(event.clientX, event.clientY);
        if (region) selectRegion(region);
      } else {
        updateStatus(`${selectedLabel(keyboardRegion)} centered. Press Enter to select.`);
        runInertia();
      }
    }

    canvas.addEventListener('pointerup', finishPointer);
    canvas.addEventListener('pointercancel', finishPointer);
    canvas.addEventListener('pointerleave', () => {
      if (dragging) return;
      hoveredRegion = null;
      globe.dataset.hoveredRegion = '';
      updateStatus(selectedRegion === 'all'
        ? 'Drag to rotate. Select a continent.'
        : `${selectedLabel(selectedRegion)} selected.`);
      draw();
    });

    canvas.addEventListener('keydown', event => {
      const keySteps = {
        ArrowLeft: [-12, 0],
        ArrowRight: [12, 0],
        ArrowUp: [0, 8],
        ArrowDown: [0, -8]
      };
      if (keySteps[event.key]) {
        event.preventDefault();
        stopIdleRotation();
        stopAnimation();
        setRotation(longitude + keySteps[event.key][0], latitude + keySteps[event.key][1]);
        updateStatus(`${selectedLabel(keyboardRegion)} centered. Press Enter to select.`);
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        stopIdleRotation();
        selectRegion(keyboardRegion);
      }
    });

    regionModeButton.addEventListener('click', () => {
      stopIdleRotation();
      canvas.focus({ preventScroll: true });
      if (selectedRegion === 'all') {
        updateStatus('Select a continent on the globe.');
        return;
      }
      stopAnimation();
      animateToRegion(selectedRegion);
      updateStatus(`${selectedLabel(selectedRegion)} selected. Choose another on the globe.`);
      confirmSelection();
    });
    resetButton.addEventListener('click', () => {
      stopIdleRotation();
      const worldwide = regionButtons.find(button => button.dataset.continent === 'all');
      if (worldwide) worldwide.click();
      syncSelectedRegion({ animate: false });
      confirmSelection();
      stopAnimation();
      if (prefersReducedMotion.matches) setRotation(-16, 12);
      else {
        const startLongitude = longitude;
        const startLatitude = latitude;
        const deltaLongitude = normalizeLongitude(-16 - startLongitude);
        const started = root.performance.now();
        const step = now => {
          const progress = clamp((now - started) / 420, 0, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setRotation(
            startLongitude + deltaLongitude * eased,
            startLatitude + (12 - startLatitude) * eased
          );
          if (progress < 1) animationFrame = root.requestAnimationFrame(step);
          else animationFrame = 0;
        };
        animationFrame = root.requestAnimationFrame(step);
      }
    });

    const observer = new MutationObserver(() => syncSelectedRegion());
    regionButtons.forEach(button => observer.observe(button, {
      attributes: true,
      attributeFilter: ['aria-pressed']
    }));

    const resizeObserver = new ResizeObserver(() => {
      root.cancelAnimationFrame(resizeFrame);
      resizeFrame = root.requestAnimationFrame(resize);
    });
    resizeObserver.observe(globe);

    root.GeoWars = root.GeoWars || {};
    root.GeoWars.globe = {
      selectRegion,
      reset: () => resetButton.click(),
      getState: () => ({
        selectedRegion,
        centeredRegion: keyboardRegion,
        longitude,
        latitude
      })
    };

    globe.classList.add('is-enhanced');
    syncSelectedRegion({ animate: false });
    resize();
    startIdleRotation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGlobe, { once: true });
  } else {
    initializeGlobe();
  }
}(window));
