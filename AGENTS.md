# Agent Guide

## Communication
- Be direct and results-first. Omit pleasantries and repeated plans.
- Report changed files, validation results, failures, and decisions concisely.
- Do not compress code, commands, errors, accessibility text, or safety warnings.

## Architecture
- Vite builds the app, but most runtime files remain ordered classic scripts.
- Preserve the script order in `index.html` unless migrating all affected globals.
- `data/countries.js` is the canonical 195-country model.
- `data/country-economics-2026.min.json` is the sole economics data source. Never paste, regenerate, normalize, or duplicate it.
- Use `data/country-economics.ts` for economics access and preserve `null` values.
- Explorer-only territories must not display country economics.

## Validation
- Install reproducibly with `npm ci`.
- Run `npm run typecheck`, `npm test`, and `npm run build` after source changes.
- Run `npm run test:e2e` for browser-facing flows.
- Keep generated `dist`, reports, screenshots, and dependencies out of Git.

## Change discipline
- Prefer small, dependency-aware edits over rewrites.
- Preserve compatibility facades and existing global APIs.
- Never expose secrets or connect tests to production services.
- Treat Supabase RLS and migration changes as security-sensitive.
