# Third-Party Attributions and Data Sources

EARTHLING uses third-party data and assets. This file documents the origin and
licensing status of each, as required by their respective licenses and to
support due-diligence review.

> Status legend: **OK** = clear for commercial use; **REVIEW** = commercial
> rights not yet established; **BLOCKER** = current license prohibits resale or
> otherwise blocks a commercial sale of this product until resolved.

---

## Map / geographic data

### Natural Earth — country and continent geometry — OK
- Used for: bundled globe geometry (`assets/globe-data.js`, `assets/globe-countries.js`, `assets/globe-territories.js`) and derived country silhouettes (see `scripts/build-globe-country-data.mjs`).
- Source: Natural Earth 1:110m and 1:50m Admin 0 boundaries — https://www.naturalearthdata.com/
- License: Public domain. Free for any use, including commercial, with no attribution required (attribution appreciated).

## Country silhouettes (Shape Challenge)

### MapsIcon country outlines — BLOCKER (being replaced)
- Used for: country outline images in the Shape Challenge, referenced via
  `SILHOUETTE_BASE_URL` in `src/data/chunks/*.js` and the silhouette URL template
  in `asset-fallbacks.js`.
- Source: https://github.com/djaiss/mapsicon
- License: The author permits use with attribution but **explicitly forbids
  reselling** the maps. This is incompatible with selling a product that depends
  on them.
- Resolution: EARTHLING is migrating the Shape Challenge to silhouettes rendered
  from public-domain Natural Earth geometry, removing this dependency. Until that
  migration is complete and the MapsIcon references are removed, this project is
  not clear for resale.

## Flags

### FlagCDN / Flagpedia.net — OK
- Used for: country flag images (`asset-fallbacks.js` flag URL template, landing
  preview in `index.html` and `app.js`).
- Source: https://flagcdn.com (service of https://flagpedia.net)
- License: Flag images are in the public domain and are stated to be free for
  commercial and non-commercial use, including in software and mobile apps.
- Note: These are loaded at runtime from a third-party CDN. Licensing is clear,
  but availability depends on the external host. Consider self-hosting for
  production resilience.

### flag-icons (mirror fallback) — OK
- Used for: flag fallback mirror in `asset-fallbacks.js`
  (`cdn.jsdelivr.net/npm/flag-icons`).
- Source: https://github.com/lipis/flag-icons
- License: MIT (code) with flag images in the public domain.

## Landmark images

### Wikipedia / Wikimedia — REVIEW
- Used for: optional landmark thumbnails in World Explorer, fetched live from the
  Wikipedia API (`globe-explorer.js`). Displayed with a "Learn about this
  landmark" link and an "Image from Wikipedia" source link.
- Source: https://en.wikipedia.org/w/api.php
- License: Varies per image. Most Wikimedia media is CC-BY-SA or public domain,
  but some files carry non-commercial or fair-use restrictions. Because images
  are fetched at runtime (not bundled or redistributed), exposure is limited, but
  per-image commercial-use rights have not been individually verified.

## Economics data

### Country Economics 2026 — REVIEW
- Used for: economic comparison callout (`data/country-economics-2026.min.json`).
- Provenance (see `data/README.md`): average gross salary compiled from wage.is
  (which attributes national statistics offices, ILO/OECD, and other official
  sources), plus Big Mac and Coca-Cola reference prices. USD conversions use 2026
  exchange rates.
- License: Underlying figures derive from public statistics, but redistribution
  rights for the compiled/derived dataset from its aggregators have not been
  formally established for commercial use.

## Audio

### Sound effects — REVIEW
- Used for: UI and gameplay sounds (`sounds/`).
- Source and license: **Not yet documented.** Provenance must be established or
  the files replaced with clearly licensed (e.g. CC0) audio before sale.

## Backend / SDK

### Supabase JS SDK — OK
- Used for: optional profile/auth via magic links, loaded from
  `cdn.jsdelivr.net/npm/@supabase/supabase-js`.
- License: MIT.
- Note: The Supabase anon key in `supabase-client.js` is a public browser key by
  design. Security depends on Row-Level Security being correctly enforced on the
  backend; review RLS policies before relying on it in production.

---

## Original EARTHLING assets

The following are original project assets and are owned by the project:
`assets/geowars-icons.svg`, `assets/geowars-logo.svg`, `assets/landing-globe.svg`,
and all first-party source code. The "EARTHLING" name is not a registered
trademark unless separately secured.
