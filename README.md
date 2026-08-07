# EARTHLING

EARTHLING is a browser-based world geography game with two connected experiences:

- Shape Challenge: identify countries from silhouette outlines.
- World Explorer: rotate an interactive globe, browse country facts, and play Country Hunt.

The app uses Vite with a vanilla JavaScript/TypeScript runtime. Existing gameplay remains in ordered classic scripts while typed data accessors are bundled as modules.

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

Install exactly from the lockfile and start Vite:

```text
npm ci
npm run dev
```

## Validation

Run the complete source-quality check:

```text
npm run check
```

This runs the TypeScript check, Node test suite, and production build. Individual commands are also available:

```text
npm run typecheck
npm test
npm run build
```

For browser-facing changes, install Chromium once and run the Explorer smoke test:

```text
npx playwright install chromium
npm run test:e2e
```

Run the existing visual acceptance matrix against the production build with:

```text
npm run test:visual
```

Browser reports are written to `playwright-report/` and `test-results/`. Visual captures are written to `tests/manual/visual-qa-artifacts/`. Lighthouse reports are written to `.lighthouseci/`; all are generated and Git-ignored.

## GitHub Actions

- **CI** runs type checking, Node tests, and the Vite production build on pushes and pull requests.
- **Browser smoke** installs pinned Playwright Chromium, tests Explorer economics behavior, and uploads failure reports for 14 days.
- **Lighthouse** records initially nonblocking performance, accessibility, best-practices, and SEO baselines on pull requests.
- **Supabase migrations** runs only for Supabase/workflow changes and validates migrations, lint, RLS pgTAP tests, and local reset behavior using Docker-backed Supabase services.

The Node suite covers core modules, compatibility facades, gameplay flows, explorer behavior, and property-based checks.

## Deploy

Netlify configuration is in netlify.toml.

- Build command: `npm run build`
- Publish directory: `dist`

Production deploys remain branch/push driven.

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
