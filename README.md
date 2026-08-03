# GeoWars

GeoWars is a browser-based world geography game with two connected experiences:

- Shape Challenge: identify countries from silhouette outlines.
- World Explorer: rotate an interactive globe, browse country facts, and play Country Hunt.

The app is static-first and runs without a JavaScript build step.

## Current gameplay

### 1) Shape Challenge

- Sprint mode: 60-second timed run.
- Practice mode: untimed learning loop.
- Difficulty and region filters.
- Multiple answer paths (typed answer, options), with hint controls.
- Session results and local best-stat tracking.

### 2) World Explorer

- Interactive globe with drag, zoom, keyboard support, and search.
- Country and territory detail panel (flag, capital, population, languages, currency, facts).
- Country Hunt: 60-second find-the-country challenge on the globe.
- Distance and direction guidance after misses.
- Optional haptics on supported mobile devices.

## Data scope

- Canonical dataset: 195 countries.
- Explorer also includes territory records for map browsing.
- Globe geometry is bundled locally in the repository and loaded lazily when Explorer opens.

## Identity and stats

- Guest play works offline with device-local stats.
- Optional Supabase-backed profile flow is available through magic links.
- Guest device stats can be reset from the landing experience without mutating claimed profile totals.

## Run locally

Open index.html directly in a modern browser.

For mobile QA and cleaner asset behavior, run a simple local static server if preferred.

## Tests

Run the automated Node test suite:

node --test tests/*.test.mjs

The suite covers core modules, compatibility facades, gameplay flows, explorer behavior, and property-based checks.

## Deploy

Netlify configuration is in netlify.toml.

- Build command: echo 'Static site - no build needed'
- Publish directory: .

Because this is a static app, production deploys are branch/push driven.

## Project structure highlights

- index.html: app shell and screen markup.
- app.js: primary gameplay and screen orchestration.
- globe-explorer.js: explorer and Country Hunt controller.
- styles.css, globe-explorer.css, ux-polish.css: visual layers.
- data/: country and territory records.
- assets/: bundled globe geometry and SVG assets.
- src/: modular core and feature units used by compatibility facades.
- supabase/: local Supabase config and migrations.
- tests/: Node tests and lightweight HTML/manual QA fixtures.

## Notes for contributors

- Preserve compatibility-facade behavior unless intentionally refactoring both runtime and tests.
- Keep Explorer and Shape Challenge UX parity across desktop and mobile.
- Prefer small, validated changes and run the test suite before merging.
