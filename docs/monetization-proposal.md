# EARTHLING — Monetization Proposal

Status: proposal / design only. No payment, ad, or analytics code is included in
this change. This document exists to make the sequencing and tradeoffs explicit
before any monetization work is scheduled as its own spec.

## Guiding principle: retention before revenue

You cannot monetize an app people do not return to. Both ad revenue and
subscription revenue are downstream of engaged sessions, so the work is ordered
to protect and grow engagement first, then layer revenue on top of a healthy
loop. Monetization that degrades the core experience usually nets less money,
not more.

## Phase 0 — Fix the core interaction (largely done)

Silent conversion killers were addressed in this branch:

- Over-zoom on country select: selecting a country now frames it by its real
  extent instead of slamming to a fixed deep zoom, and no longer ratchets so it
  can ease back out. (`globe-explorer.js` `fitZoomForCountry`)
- Far-away mis-selection: the hit-buffer marker dots for small countries no
  longer overlap neighbours at low zoom, so clicks land where the user tapped.
  (`globe-explorer.js` `drawSmallCountryMarkers`)
- Mobile density and a single clear Explore/Country Hunt mode toggle at the top,
  removing the redundant floating entry point.

A broken core loop poisons every downstream metric, so this comes first.

## Phase 1 — Instrument before monetizing

Do not add a paywall or ads blind. Add lightweight, privacy-respecting
analytics first and watch the funnel for a few weeks:

- Session opened; explorer reached.
- Country opened (selection made); countries viewed per session.
- Search used; Country Hunt started; Hunt completed.
- Drop-off points (where sessions end).
- Signal for classroom/education traffic (repeat sessions, referrers).

Candidate approach: a privacy-first analytics option (e.g. Plausible) or a
minimal first-party event log. Consent handling (GDPR/CCPA) must be part of this
phase, not an afterthought. Without this data, model choice is a guess.

## Phase 2 — Choose a model that fits the product

The product is an educational geography explorer/game with broad casual traffic.
Realistic models, roughly in order of fit:

1. Tasteful ads. Highest-volume fit for a free educational game. Placement
   matters: an interstitial between Country Hunt rounds is acceptable; anything
   over the globe or the learning card is not. Poorly placed ads reduce
   retention and net less overall.
2. Freemium ("remove ads + extras"). A cheap one-time unlock or low subscription
   that removes ads and unlocks features the data already supports:
   - Economics / cost-of-living comparison (see below) — the strongest premium
     candidate because the data already ships.
   - Advanced challenge modes, stats history, offline country packs.
3. Education tier. If analytics show classroom traffic, a teacher/school tier
   (bulk, ad-free, progress tracking) typically monetizes far better per user
   than consumer ads. Validate demand from Phase 1 data before investing.

## The clearest premium asset: the economics dataset

The app already ships `data/country-economics-2026.min.json` (v4: gross salary,
Big Mac, McMeal, Coke). A "compare cost of living / salaries between any two
countries" feature is a natural premium unlock that requires no new data
sourcing — only UI and gating. This is the most obvious first premium feature
and pairs well with a freemium model.

Constraint from `AGENTS.md`: this dataset is the sole economics source and must
not be regenerated, normalized, or duplicated. A premium feature reads it
through the existing accessor, preserving `null` values; it does not reshape the
data. Explorer-only territories must continue to show no economics.

## Phase 3 — Build monetization as its own spec

Ad SDKs and payment flows carry privacy, consent, performance, and security
weight, and touch shared/live systems. Per `AGENTS.md`, Supabase and data
concerns are security-sensitive. Therefore monetization should be:

- Scoped as a dedicated spec (requirements → design → tasks), not a bolt-on edit.
- Rolled out behind a flag with a staged plan and review.
- Kept off any uncommitted feature branch until the current UX work is committed.

Third-party ad scripts and payment providers also introduce outbound data flows;
these must be reviewed against the project's data-handling rules before adoption.

## Recommended next steps (in order)

1. Commit the current UX fixes (this branch) so there is a clean baseline.
2. Add privacy-respecting analytics + consent (Phase 1); collect ~2–4 weeks.
3. Review the funnel; confirm whether ads, freemium, or an edu tier fits best.
4. Open a monetization spec for the chosen model, starting with the economics
   cost-of-living comparison as the first premium feature if freemium is chosen.

## Explicitly out of scope for this change

- No ad SDK, ad markup, or ad placement code.
- No payment provider, checkout, or subscription code.
- No analytics library wired in yet.
- No changes to the economics dataset or its accessor.
