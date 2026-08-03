# EARTHLING visual assets

- `geowars-icons.svg` is the local EARTHLING interface icon sprite.
- `geowars-logo.svg` is the responsive EARTHLING globe-orbit lockup used on the
  landing page and as the in-game home control.
- `landing-globe.svg` is the static fallback shown when the interactive canvas
  cannot initialize.
- `globe-data.js` contains simplified continent geometry derived from Natural
  Earth 1:110m Admin 0 country boundaries:
  https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson

Natural Earth data is public domain. The geometry is rounded and simplified for
the landing-page globe, grouped into the six regions supported by EARTHLING, and
bundled locally so the page makes no runtime map-data request.
## World Explorer geometry

- `globe-countries.js` contains simplified country-level geometry derived from
  Natural Earth 1:50m Admin 0 boundaries. It is lazy-loaded only when the
  World Explorer opens.
- Rebuild it with
  `node scripts/build-globe-country-data.mjs <path-to-ne_50m_admin_0_countries.geojson>`.
- The generator joins geometry to the canonical EARTHLING records through the
  ISO alpha-2 code encoded in each flag. All 195 game countries are covered,
  including visible markers and larger hit targets for small countries.
