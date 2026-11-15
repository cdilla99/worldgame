# Player accounts

Players can create a player name without an email or password. Each
device profile has separate quiz totals, country-review history and Daily Puzzle
records. Device profiles are shared-browser conveniences, not private accounts.
Clearing browser storage removes device-only progress.

"Continue with Google" optionally connects the selected profile to a Supabase
account. Google's official Identity Services button opens sign-in directly from
the game site. Supabase validates the returned Google ID token and nonce before
the local profile can be attached or any progress uploaded. The Google request
gets a SHA-256 nonce; Supabase receives the original random nonce. Tokens and
nonces are never logged or stored by the application. Switching to
another device profile signs out the current Supabase session in this browser.
Selecting an account-linked device profile lets players use its cached records;
Google sign-in is required again for cloud access.

Guest records move into a new local profile when “Keep my guest progress” is
selected. Linking to an existing account on another device imports this device's
quiz records once. If that account already has a local profile in this browser,
sign-in selects that profile and leaves the other local profile's history intact.

## Google provider setup

The database sync migration is `20261108000000_player_profile_sync.sql`.
The write restrictions and upload limits are in
`20261110000000_harden_player_writes.sql`; see [security hardening](security-hardening.md).

1. In [Google Auth Platform](https://console.cloud.google.com/auth/overview), select
   the existing project and configure branding and audience for EARTHLING.
2. Use the existing OAuth **Web application** client:
   `923544522831-kvvqtalqdhflur58g0e8kdrat6smsmm8.apps.googleusercontent.com`.
   The same public ID is in `google-signin.js`; reuse this client so existing
   Google identities continue to match their Supabase accounts.
3. Confirm the client's **Authorized JavaScript origins** includes
   `https://earthlinggame.netlify.app` (no trailing path). Add local development
   origins separately if needed: `http://localhost:5173` and
   `http://127.0.0.1:4173`. Never put a client secret in browser code.
4. Keep that client's ID and Client Secret in
   [Supabase's Google provider settings](https://supabase.com/dashboard/project/njlklquuzrezqheikcxp/auth/providers).
   Enable Google. Never commit the client secret or put it in browser code.
5. The new button uses `signInWithIdToken`, not `signInWithOAuth`: it does not
   navigate through the `supabase.co` callback and needs no Supabase custom-domain
   add-on. Keep the existing callback URI
   `https://njlklquuzrezqheikcxp.supabase.co/auth/v1/callback` and the Supabase return
   URL `https://earthlinggame.netlify.app/?player_auth=google` during rollout so
   sign-ins already started in the old version can finish. The PKCE return handler
   is retained only for that compatibility.
6. If Google is in Testing mode, add your testing accounts to the audience. For
   public sign-in, publish the OAuth app for the intended audience. Request only
   basic sign-in scopes: `openid`, email and profile.

This route does not require SMTP, a paid Supabase plan, or a permanent domain.
Netlify continues to host the game. Google's library loads only when the player
chooser opens; a blocked script shows a retry action and never falls back to the
old redirect flow. The button requires a user click; unsolicited callbacks and
callbacks after the chooser closes are ignored. A changed player during token
verification cannot receive the account link or another player's uploads.

Follow the
[Supabase Google guide](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)
for current console labels and publishing requirements.

### Branding and a later domain change

The public privacy page is `https://earthlinggame.netlify.app/privacy.html`.
Use that exact URL in Google Auth Platform's privacy policy field. It is linked
from the home footer and sign-in chooser. Privacy and cloud-deletion requests
go to `info@thinkabacus.ca`; a browser reset does not delete hosted records.

Google controls the appearance of its sign-in UI: some browser/FedCM dialogs show
the site's domain, others show approved application branding. Direct sign-in
removes the Supabase callback from that flow but does not automatically verify an
app name or logo. Configure the homepage, support email, logo and publicly
accessible privacy policy in Google Auth Platform and submit for brand verification
when ready. Google's review is external to deployment and can take a few business
days. Do not promise a specific screen appearance until checked in a real browser.

When a permanent domain is chosen, add its exact HTTPS origin to the same Google
client **before** redirecting traffic there. Update Google branding links and
Supabase's Site URL/allowed return URLs. Configure the domain on the existing
Netlify site; do not replace the Supabase project or Google client. Existing cloud
accounts stay in the same project. Browser-local profiles and guest records are
origin-specific: sync account-linked progress from the old address before moving.
Guest-only progress does not transfer automatically to a new domain.

## Sync and recovery

Each completed quiz receives a UUID and is queued locally before upload. The
`save_player_game` RPC inserts that ID once, so a lost response can be retried
without counting the game twice. Legacy aggregates are imported with their
original game count. Only verified accounts upload records.

The `sync_player_progress` RPC serializes updates for each player. The newest
country review wins. For each Daily Puzzle date, a completed record wins over
unfinished records; otherwise the longer guess sequence wins. Daily totals are
rebuilt from the merged dates. Simultaneous conflicting play on two devices uses
one record per date, rather than combining incompatible guess sequences.

Failed saves stay on the device and retry on the next progress change, stats
refresh, or browser `online` event. An account connection can be restored later
through Google. Cloud totals cannot be reset using the device-only reset button.

## Verification

- `npm run check`
- `npm run test:e2e -- --workers=2` (external services are mocked/blocked)
- PostgreSQL migration and RLS checks without production access:
  `npm install --prefix .scratch/db-check --no-save @electric-sql/pglite@0.3.14`,
  then `node tests/manual/scripts/check-player-sync.mjs`.

Live OAuth must be checked with a real Google account after its provider is
configured. Automated tests never create accounts in the production project.
