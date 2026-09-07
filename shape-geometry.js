/**
 * Shape geometry renderer — window.GeoWarsShapeGeometry
 *
 * Renders a country's border outline as an inline SVG from the bundled
 * Natural Earth geometry (assets/globe-countries.js, exposed as
 * window.GeoWarsGlobeCountries). Used by the Playable Atlas "Shapes" view
 * (see atlas.js) to draw the silhouette for the country being studied.
 *
 * The projection matches app.js#createLocalSilhouette (equirectangular,
 * latitude flipped so north is up) so the atlas outline is visually
 * consistent with the Shape Challenge silhouette. Geometry is the sole
 * source; nothing here duplicates or regenerates country data.
 *
 * Contract expected by atlas.js:
 *   GeoWarsShapeGeometry.render(container, card, options) -> Promise<SVGElement|null>
 *   - container: element whose contents are replaced with the outline
 *   - card:      country card; card.id maps to the geometry "i" field
 *   - options.padding: fraction of the larger dimension to pad (default 0.08)
 */
(function (root) {
  'use strict';

  var GEOMETRY_URL = 'assets/globe-countries.js?v=20260831-cy-ps197';
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var geometryPromise = null;

  // Lazily load the bundled country geometry once. Resolves to the shared
  // window.GeoWarsGlobeCountries array. Mirrors app.js#loadLocalSilhouetteGeometry
  // so both features share the same cached global rather than re-fetching.
  function loadGeometry() {
    if (Array.isArray(root.GeoWarsGlobeCountries)) {
      return Promise.resolve(root.GeoWarsGlobeCountries);
    }
    if (geometryPromise) return geometryPromise;

    geometryPromise = new Promise(function (resolve, reject) {
      if (typeof document === 'undefined' || !document.createElement) {
        reject(new Error('Country geometry cannot be loaded in this environment.'));
        return;
      }
      var script = document.createElement('script');
      script.src = GEOMETRY_URL;
      script.async = true;
      script.onload = function () {
        if (Array.isArray(root.GeoWarsGlobeCountries)) {
          resolve(root.GeoWarsGlobeCountries);
        } else {
          reject(new Error('Country geometry was incomplete.'));
        }
      };
      script.onerror = function () {
        reject(new Error('Country geometry failed to load.'));
      };
      (document.head || document.documentElement).appendChild(script);
    }).catch(function (error) {
      // Allow a later retry if the asset failed to arrive.
      geometryPromise = null;
      throw error;
    });

    return geometryPromise;
  }

  // Build an inline SVG outline for one country's polygons. Returns null when
  // the country has no geometry so callers can show their own fallback.
  function buildOutline(country, options) {
    if (!country || !Array.isArray(country.p) || !country.p.length) return null;

    var polygons = country.p;
    if (options.compactBounds) {
      // Place the seam in the largest empty longitude interval. This preserves
      // island positions while avoiding a nearly world-wide date-line box.
      var longitudes = Array.from(new Set(polygons.flat(2).map(function (p) { return (p[0] + 360) % 360; }))).sort(function (a, b) { return a - b; });
      var start = longitudes[0];
      var largestGap = -1;
      longitudes.forEach(function (value, index) {
        var next = index + 1 < longitudes.length ? longitudes[index + 1] : longitudes[0] + 360;
        if (next - value > largestGap) { largestGap = next - value; start = next % 360; }
      });
      polygons = polygons.map(function (polygon) { return polygon.map(function (ring) { return ring.map(function (point) {
        var longitude = (point[0] + 360) % 360;
        return [longitude < start ? longitude + 360 : longitude, point[1]];
      }); }); });
    }
    var points = polygons.flat ? polygons.flat(2) : flattenDeep(polygons);
    if (!points.length) return null;

    var minLongitude = Infinity;
    var maxLongitude = -Infinity;
    var minLatitude = Infinity;
    var maxLatitude = -Infinity;
    for (var i = 0; i < points.length; i++) {
      var lng = points[i][0];
      var lat = points[i][1];
      if (lng < minLongitude) minLongitude = lng;
      if (lng > maxLongitude) maxLongitude = lng;
      if (lat < minLatitude) minLatitude = lat;
      if (lat > maxLatitude) maxLatitude = lat;
    }

    var minimumSpan = options.compactBounds ? 0.0001 : 1;
    var width = Math.max(minimumSpan, maxLongitude - minLongitude);
    var height = Math.max(minimumSpan, maxLatitude - minLatitude);
    var paddingFraction = typeof options.padding === 'number' ? options.padding : 0.08;
    var padding = Math.max(width, height) * paddingFraction;
    var viewBoxWidth = width + padding * 2;
    var viewBoxHeight = height + padding * 2;

    var pathData = polygons.map(function (polygon) {
      return polygon.map(function (ring) {
        return ring.map(function (point, index) {
          var x = point[0] - minLongitude + padding;
          // Flip latitude so north renders at the top of the SVG.
          var y = maxLatitude - point[1] + padding;
          return (index === 0 ? 'M' : 'L') + x.toFixed(3) + ' ' + y.toFixed(3);
        }).join(' ') + ' Z';
      }).join(' ');
    }).join(' ');

    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + viewBoxWidth + ' ' + viewBoxHeight);
    svg.setAttribute('role', 'img');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('class', 'atlas-shape-outline');
    if (options.label) svg.setAttribute('aria-label', options.label);

    var path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'currentColor');
    path.setAttribute('fill-rule', 'evenodd');
    svg.appendChild(path);
    return svg;
  }

  // Minimal deep flatten for environments without Array.prototype.flat.
  function flattenDeep(value) {
    var out = [];
    (function walk(node) {
      if (Array.isArray(node) && node.length && Array.isArray(node[0])) {
        for (var i = 0; i < node.length; i++) walk(node[i]);
      } else if (Array.isArray(node)) {
        out.push(node);
      }
    })(value);
    return out;
  }

  // Render the outline for `card` into `container`. Resolves to the SVG element
  // on success, or rejects so atlas.js can render its fallback text.
  function render(container, card, options) {
    options = options || {};
    if (!container || !card) return Promise.resolve(null);

    return loadGeometry().then(function (geometry) {
      var country = null;
      for (var i = 0; i < geometry.length; i++) {
        if (geometry[i] && geometry[i].i === card.id) {
          country = geometry[i];
          break;
        }
      }

      var label = card.name ? card.name + ' border outline' : 'Country border outline';
      var svg = buildOutline(country, { padding: options.padding, label: label, compactBounds: options.compactBounds });
      if (!svg) {
        throw new Error('No geometry for country id ' + card.id);
      }

      container.textContent = '';
      container.appendChild(svg);
      return svg;
    });
  }

  root.GeoWarsShapeGeometry = {
    render: render,
    // Exposed for tests and reuse; renders straight from a supplied geometry
    // array without touching the DOM loader.
    buildOutline: buildOutline
  };
})(typeof window !== 'undefined' ? window : this);
