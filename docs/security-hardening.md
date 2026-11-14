# Player security hardening

The game keeps its static Netlify frontend and Google/Supabase browser sessions.
The public Google client ID and Supabase browser key are identifiers, not secrets.
Server permissions and verified user tokens authorize data access.

## Browser protections

`security-headers.mjs` is the single policy source. Vite serves the same headers
used by the deployed `dist/_headers` generated during build. The default is an
enforced Content Security Policy. Report-only checks can be run by setting
`EARTHLING_CSP_REPORT_ONLY=1` for that test process; never deploy that test build.

Scripts are limited to this site and Google's official Identity Services client.
The existing inline design-mode switch is allowed only by its exact SHA-256 hash.
Inline handlers, other inline scripts, and string evaluation are not allowed.
Inline styles remain allowed for the game's progress bars and Google's button.
Connections, frames, fonts, flags and Wikipedia images have explicit sources.
Object embeds, framing by other sites, and changes to the document base are denied.
Additional headers disable MIME sniffing, limit referrers and deny unused device
permissions without blocking Google popup/FedCM sign-in.

The Supabase SDK is pinned to `2.119.0` in package.json/package-lock.json. Vite
copies its UMD build and MIT license from the installed package into `dist/vendor`.
There is no floating CDN script. For an SDK upgrade, change both the exact package
version and the versioned path in vite.config.mjs/supabase-client.js, then test.

Profile names and restored Daily/quiz text are rendered using textContent.
Landmark media responses must use HTTPS Wikimedia images and Wikipedia article
links. External API text cannot supply arbitrary script links or image hosts.

## Database permissions and uploads

Migration `20261110000000_harden_player_writes.sql` retains owner-only reads and
adds the following protections without deleting existing progress:

- Browser roles cannot insert/update game rows, directly write progress JSON,
  update aggregate totals, or truncate any player table.
- Authenticated players can update only their own display_name column (at most
  80 characters). The new constraint preserves existing rows without rewriting them.
- Cloud writes use save_player_game/sync_player_progress. Both are SECURITY
  DEFINER with an empty search_path, explicit auth.uid() ownership and anonymous
  rejection. Their private helper and quota table are inaccessible to browser roles.
- A normal game must have valid integers, supported mode, nonnegative duration,
  correct_count <= total_count, best_streak <= correct_count, at most 10,000 answers
  and at most 15 points per correct answer. This is a broad sanity bound, not
  verification that the answers were played honestly.
- Legacy local-import aggregates retain separate, bounded import handling for
  cross-device history. All existing client/offline scores remain unverified and
  must not be used for prizes or a trusted leaderboard.
- Each account may upload 120 game records and 60 progress snapshots per minute,
  and 10,000 combined writes per day. Committed game IDs retry idempotently without
  consuming quota again. Quota updates lock one private row per account.
- Game payloads are at most 4 KiB. Combined incoming and merged progress are at
  most 2,000,000 bytes. Progress keys, object types, counters and Daily guess counts
  are checked before saving.

The browser batches at most 30 game records per flush, coalesces progress uploads
to at most one flush every five seconds, and backs off for one minute after a
failure. Queued records stay on the device. These client measures improve normal
traffic; database functions enforce limits even if browser checks are bypassed.

## Hosted authentication settings

Guests create no anonymous cloud accounts. Existing signed-in accounts restore
normally. Google is the supported public sign-in route. Before disabling another
provider, inspect auth.identities provider counts without retrieving user data.
At this rollout, no email identities exist. Email signup/magic-link endpoints
are disabled; the legacy hidden email UI is retained for compatibility.

Keep anonymous and phone authentication disabled, Google nonce checking enabled,
and refresh-token rotation enabled. Retain the existing token endpoint limit of
150 requests per five minutes per IP and verification limit of 30 per five minutes
per IP. Lower shared-IP limits can prevent a school class from signing in. Auth
limits and database upload limits cover different endpoints.

Public APIs can still receive unwanted requests; these changes do not promise
DDoS protection. Review Supabase usage and authentication failures as traffic grows.
No paid custom-domain add-on is needed for these protections.

## Verification and deployment

Run npm run check, npm run test:e2e -- --workers=2, and
node tests/manual/scripts/check-player-sync.mjs with the documented temporary
PGlite dependency. Browser services are mocked; SQL adversarial tests use two
local test users and never create production accounts. Tests cover owner isolation,
direct-write/truncate denial, supported nickname updates, forged totals, quotas,
legacy imports, retry behavior, CSP blocking and saved-text injection.

Apply the migration in a transaction and record it in Supabase migration history.
Verify hosted table/column privileges, RLS, function owner/search_path and migration
version using read-only metadata queries. Verify provider flags with a filtered
Management API response; never print tokens, client secrets or full auth config.
Deploy the enforced build, then verify the public headers, bundled SDK and runtime
files. A real-account Google sign-in remains a manual check; automated tests must
not use the production authentication service.

Session credentials remain accessible to browser JavaScript by design. HttpOnly
sessions would require a backend API and CSRF protections; the current scope
reduces XSS exposure without introducing that architectural change.

## Rollout evidence — November 10, 2026

- 216 unit tests and the complete 105-test browser suite passed. The security
  tests also passed in report-only mode before enforcement.
- Local PostgreSQL checks passed for account isolation, grants, nickname length,
  validation, quotas, historical imports and retry deduplication.
- Migration 20261110000000 is recorded in the hosted project. Live metadata
  confirms owner-only RLS, denied direct inserts/truncates/aggregate updates,
  allowed nickname updates, and postgres-owned save functions with empty
  search_path settings. Browser roles cannot access the private quota schema.
- Filtered hosted auth settings confirm Google only, nonce checking, token
  rotation and the existing 150/30 token/verification limits.
- Netlify deploy 6af39ec227e41df2d5b10549 serves the enforced headers and the
  exact checked runtime/SDK files. Unsigned data requests are denied with HTTP
  401; the admin user-list request is denied with HTTP 403. No secret-key patterns
  were found in the 41 scanned text build files.
- Real-account Google login has not been automated or completed as part of this
  rollout; it remains a manual confirmation.
