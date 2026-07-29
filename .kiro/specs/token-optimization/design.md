# Design Document: Token Optimization

## Overview

This is a behavior-preserving source reorganization of the checked-in static GeoWars application. Its objective is lower maintenance context through explicit boundaries, not a promised percentage reduction. It preserves direct `file://` use, static-host use, the existing game contract, and the existing HTML/Node/browser test style.

The design deliberately rejects assumptions in the previous design: there is no runtime country chunking, dynamic import, wildcard event system, framework, package-manager migration, invented mode, invented base-score table, or broad dependency addition. `data/countries.js` remains one statically loaded file containing the canonical 195 ordered records. All production JavaScript remains ordinary browser scripts using IIFEs and a small `window.GeoWars` namespace; this pattern is already used by `AssetFallbacks`, `AudioEngine`, `BackgroundMusic`, and `GeoWarsDB`, requires no build, and works from a file URL.

`core/state.js` and `core/events.js` are untracked audit candidates. Current evidence shows neither is loaded by `index.html` nor referenced by production or tests. They are not approved architecture. Their state duplicates `app.js` lifecycle state, and their singleton/wildcard EventBus conflicts with one Game Session owner and explicit Function Interfaces. They must not be loaded, adapted, or used as extraction targets unless the Audit Record finds contrary production evidence and the requirements are formally revised. If confirmed superseded or dead, they are removed in an audit-controlled cleanup phase.

## Evidence and Architectural Decisions

Current repository evidence establishes:

- `index.html` statically loads `data/countries.js`, `anthems.js`, `supabase-client.js`, `audio-engine.js`, `background-music.js`, `asset-fallbacks.js`, and `app.js`, in that order.
- `data/countries.js` evaluates to 195 records, from ID 1 United States through ID 195 Tuvalu, and is read by `app.js` as the complete `countryCards` collection.
- `app.js` currently owns lifecycle state, rules, screen rendering, accessibility transitions, persistence adapters, and bootstrap work; extraction therefore starts only after characterization.
- Existing tests are standalone browser HTML harnesses that iframe `../index.html`, expose pass/fail state, and use direct DOM assertions, plus standalone Node scripts with small inline test/property harnesses.
- `supabase-client.js` already uses an IIFE/global API and performs local-first session aggregation before remote insertion.
- The working tree contains pre-existing modified and untracked paths. Migration records and preserves them; this design regeneration changes only this file.

## Target Architecture

```text
index.html
  ├─ ordered static CSS: shared → landing → round → results
  └─ ordered classic scripts
       data/countries.js (one canonical 195-record source)
       existing canonical audio/asset/persistence support
       game-rules.js      (pure calculations and selection)
       game-session.js    (only mutable game/round lifecycle owner)
       game-ui.js         (LandingUI + RoundUI + ResultsUI)
       app.js             (thin bootstrap and direct callback wiring)
```

The target uses a small number of coarse, cohesive modules. It does not create a file for each timer action, hint, autocomplete helper, or visual effect. Focused audio and asset files remain separate only when the Audit Record confirms they are canonical production implementations.


### Static Namespace and Load Contract

Each new file is a classic script with an IIFE such as `(function (root) { ... }(window.GeoWars = window.GeoWars || {}));`. It publishes one frozen API object and performs no startup work at evaluation time. `index.html` loads files with ordinary `<script src>` elements after the markup; no `type="module"`, `import()`, fetch-based code loading, runtime script injection for local modules, bundler, or transpiler is introduced.

Final production order is:

1. `data/countries.js` — canonical data is fully evaluated first.
2. Existing audit-approved support: `anthems.js`, `supabase-client.js`, audio, music, and assets.
3. `game-rules.js` — `GeoWars.GameRules`.
4. `game-session.js` — `GeoWars.createGameSession`.
5. `game-ui.js` — `GeoWars.LandingUI`, `GeoWars.RoundUI`, `GeoWars.ResultsUI`.
6. `app.js` — validates required globals, creates one session, binds callbacks, reads stats, and enables Start.

The bootstrap must not permit Start until `countryCards` and all required APIs exist. Remote SDK availability is not a startup prerequisite; the existing stats fallback remains available. Cache-busting query strings may remain, but they do not alter static loading semantics.

## Components and Function Interfaces

Every interface below states inputs, output, state effects, document effects, and failure outcome. Direct function calls and narrowly scoped callbacks replace implicit global events. There are no wildcard events and no global EventBus.

### Game Rules (`game-rules.js`)

`GeoWars.GameRules` contains no mutable module state and does not access `window`, `document`, storage, network, clocks, or timers.

| Function | Inputs and output | State/DOM effects | Failure outcome |
|---|---|---|---|
| `filterCountries(countries, filters)` | Complete country array and `{difficulty, continent}`; returns a new filtered array | None | Returns empty array for a valid filter with no matches; rejects malformed arguments without mutating input |
| `shuffleCountries(countries, random)` | Array and injected `[0,1)` random function; returns shuffled copy | None | Invalid random output is rejected; source array remains unchanged |
| `pickDistractors(card, pool, random)` | Correct card, complete pool, injected random; returns characterized distinct alternatives | None | Returns only available valid alternatives; never duplicates the correct card |
| `evaluateTypedAnswer(input, canonicalName)` | Strings; returns `{correct, multiplier}` | None | Non-string/empty input is incorrect; no exception leaks to UI |
| `evaluateOption(selectedId, correctId, path)` | IDs and `path` of `direct` or `switched`; returns `{correct, multiplier}` | None | Unknown path is rejected rather than assigned a new multiplier |
| `evaluateReveal(mode)` | Supported mode; returns `{correct:false, multiplier:0, points:0, revealed:true}` for `showoff` | None | Reveal in unsupported mode is rejected |
| `calculatePoints(stars, multiplier)` | Existing card stars and characterized multiplier; returns product | None | Non-finite/negative inputs are rejected |
| `applyRegionFilter(record, selectedContinent)` | Record and filter; returns boolean | None | Unknown/missing classification does not match a specific region |

Typed comparison trims and compares case-insensitively. Exact matches use multiplier 3; a non-exact value with Levenshtein distance at most 2 uses multiplier 2; switched options use 2; direct options use 1; Practice reveal awards zero. No separate base-point table is introduced.

### Game Session (`game-session.js`)

`GeoWars.createGameSession(options)` returns the sole owner of mutable game and round lifecycle state. Its private closure owns mode, filters, deck, current card, choices, score, streaks, counts, countdown values and handles, hints, answered/game-over flags, answer path, feedback timing, round history, counted status, and asset-failure state. Neither UIs nor bootstrap retain a writable copy. `getSnapshot()` returns a detached read model; arrays are copied and consumers must treat it as immutable.

Dependencies are explicit: `{countries, rules, clock, random, callbacks}`. `clock` wraps interval/timeout operations for deterministic tests. `callbacks` is a fixed object (`onChanged`, `onRoundStarted`, `onFeedback`, `onTimerWarning`, `onEnded`) supplied by the bootstrap; missing optional callbacks are no-ops. This is not a publish/subscribe bus.

| Function | Inputs and output | State/DOM effects | Failure outcome |
|---|---|---|---|
| `start({mode,difficulty,continent})` | Valid visible selection; returns snapshot | Atomically resets and starts one session; no DOM | Rejects invalid mode/filter or empty deck without partial start |
| `getSnapshot()` | None; detached session/round read model | None | Always returns the current valid phase |
| `chooseTypedPath()` / `chooseOptionsPath()` / `switchToOptions()` | None; returns snapshot | Updates only answer-path state | No-op result when phase disallows action |
| `submitTyped(text)` / `submitOption(cardId)` / `reveal()` | Answer action; returns outcome and snapshot | Uses Game Rules, records at most one outcome, updates score/streak/history | Duplicate/late actions are idempotently rejected |
| `useHint(kind)` | `flag` or `region`; returns snapshot | Marks characterized hint state | Unknown/already-used hint is rejected |
| `advance()` | None; returns next-round snapshot | Advances according to current phase and preserves timer rules | Rejected while recovery/session-end blocks progression |
| `tick()` | Clock callback; returns snapshot | Decrements active Sprint countdown; ends once at zero | Ignored outside active Sprint or while paused |
| `reportSilhouetteFailure(cardId)` | Current card ID; returns recovery snapshot | Pauses timer and excludes failed round | Stale card failures are ignored |
| `retrySilhouette()` / `confirmSilhouetteLoaded(cardId)` / `skipFailedRound()` / `returnHomeFromFailure()` | Recovery command; returns snapshot/destination | Performs only characterized recovery transitions | Stale or duplicate recovery commands are rejected |
| `quit()` | None; returns terminal destination and optional summary | Stops timing; emits end once only when counted total is positive | Repeated quit/end cannot save twice |
| `dispose()` | None | Clears owned timers/callback references | Safe to repeat |


The session summary shape is `{mode, score, correct, total, bestStreak, difficulty, duration, roundHistory}` using only currently persisted/rendered fields. A private terminal flag gives timer expiration, quit, and repeated UI signals exactly-once end semantics.

### Screen UI Boundaries (`game-ui.js`)

One cohesive file owns DOM lookup, rendering helpers, visibility/inert handling, focus movement, modal trapping, and listener cleanup. It exposes three separate frozen interfaces. The screen modules receive snapshots/read models and callbacks; they never mutate Game Session objects or persist data.

**`GeoWars.LandingUI`**

| Function | Inputs and output | State/DOM effects | Failure outcome |
|---|---|---|---|
| `bind({onSelectionChanged,onStart,onChoosePlayer})` | Explicit callbacks; returns `dispose()` | Adds landing listeners only | Missing required controls produces a reported bootstrap error and leaves Start disabled |
| `readSelection()` | None; returns `{mode,difficulty,continent}` from visible controls | None | Uses characterized Sprint/any/worldwide defaults only when controls expose no selection |
| `render({selection,stats,identity,profileState})` | Landing read model | Updates selection, summaries, stats, identity/modal status | Missing optional profile data renders existing guest fallback |
| `show({focus})` | Focus flag | Exposes landing, hides/inerts other screens, optionally focuses heading | Missing heading is reported and no arbitrary focus target is invented |

**`GeoWars.RoundUI`**

| Function | Inputs and output | State/DOM effects | Failure outcome |
|---|---|---|---|
| `bind(callbacks)` | Named answer, hint, quit, autocomplete, and recovery callbacks; returns `dispose()` | Adds Round UI listeners and keyboard handling | Missing required round control blocks game start with diagnostic status |
| `render(snapshot)` | Session snapshot | Renders card prompt, controls, hints, timer, score, streak, paths, and ARIA state | Unknown phase fails closed by disabling answer controls |
| `renderFeedback(outcome, snapshot)` | Outcome/read model | Renders status/live region, inerts background, focuses outcome heading | Failed flag delegates to existing Asset Recovery and preserves text |
| `renderAssetRecovery(snapshot)` | Recovery read model | Preserves stage, hides answer interactions, exposes Retry/Next/Home | Repeated render preserves pending disabled state |
| `show({focus})` | Focus flag | Exposes Round UI and focuses game heading when requested | Missing heading is reported |
| `requestSilhouette(card, callbacks)` | Card plus loaded/failed callbacks | Uses canonical `AssetFallbacks`; image effects only | Failure calls the explicit failure callback once |

Autocomplete remains in this boundary because it is an answer-control interaction, while matching against country names can use a local pure helper or a Game Rules function if characterization shows shared rule value. Its current combobox/listbox relationships, Arrow traversal, Enter selection, Escape dismissal, and focus behavior are preserved.

**`GeoWars.ResultsUI`**

| Function | Inputs and output | State/DOM effects | Failure outcome |
|---|---|---|---|
| `bind({onReplay,onHome,onClaim,onDismissSave})` | Named callbacks; returns `dispose()` | Adds results/profile listeners only | Missing optional claim controls disables claim without blocking results |
| `render({summary,saveState,identity})` | Existing session summary and service state | Renders totals, review, save status, and live text | Persistence failure keeps summary visible and renders characterized fallback status |
| `show({focus})` | Focus flag | Exposes Results UI, hides/inerts others, focuses results heading | Missing heading is reported |

Screen exclusivity is centralized in `game-ui.js`; `show` applies `hidden`, `aria-hidden`, and `inert` consistently. Modal helpers preserve focus containment and restoration. This is document state, not Game Session state.

### Player Stats Service (`supabase-client.js`)

The existing file evolves in place into the Player Stats Service rather than adding a competing persistence module. It retains `window.GeoWarsDB` during migration and may additionally expose `GeoWars.PlayerStats`. The remote client and browser storage are dependencies behind the service; no UI performs direct `localStorage` or remote-table operations.

| Function | Inputs and output | State/DOM effects | Failure outcome |
|---|---|---|---|
| `init()` | None; Promise | Initializes existing anonymous/claimed remote identity state; no DOM | Resolves in offline mode when SDK/auth fails |
| `getIdentity()` | None; Promise of current identity shape | May read cached/remote profile | Returns characterized Guest identity when unavailable |
| `getStats()` | None; Promise of `{played,bestStreak,totalCorrect,totalScore,displayName}` | Remote read, then browser-storage read as fallback; no DOM | Missing/unreadable storage returns zero Guest stats |
| `saveSession(summary)` | Existing summary fields; Promise of result | Attempts characterized local aggregation first, then remote insert regardless of local-write success | Remote failure retains local result; both failures return failure status without throwing away in-memory results |
| `sendPlayerMagicLink(email,name)` / `claimWithEmail(email,name)` | Existing values; Promise result | Existing remote identity effects; no DOM | Returns existing offline/validation/error result |
| `isOnline()` / `isClaimed()` / `getEmail()` / `getPlayer()` | None; existing values | None | Existing null/false fallback |

`saveSession` submits mode, score, correct count, total count, best streak, difficulty, and duration. It does not add new persistence fields or semantics. The session owner prevents duplicate terminal summaries; the bootstrap invokes `saveSession` once for each emitted save-bearing summary.

### Thin Bootstrap (`app.js`)

Final `app.js` may only: validate required static globals; create the service, UI bindings, clock adapter, and exactly one Game Session; connect named callbacks; initialize stats/identity; coordinate canonical audio/music calls at callback boundaries; and start the landing screen. It contains no scoring/filter/near-miss logic, writable session fields, detailed screen rendering, direct storage/remote operations, or asset recovery transitions.

Startup failure handling is conservative: missing canonical data or required local API keeps Start disabled, writes a concise status/console diagnostic, and does not attempt dynamic loading. Remote failure does not block local play. Callback errors are caught at the direct call boundary and routed to an explicit failure UI where one already exists; errors are not hidden by a global bus.

## Data Models

- **Country record:** the complete existing record object. The migration does not redefine, trim, normalize, reorder, or split its fields.
- **Selection:** `{mode: 'sprint'|'showoff', difficulty, continent}` using existing identifiers.
- **Session snapshot:** detached read model of existing session and current-round fields; it is not a second state store.
- **Answer outcome:** `{correct, multiplier, points, revealed}` plus the current card reference needed for existing feedback.
- **Round history item:** preserves the characterized current shape unless the Audit Record and baseline establish a more precise existing shape.
- **Session summary:** exactly the fields listed under Game Session and consumed by current Results UI/service contracts.

### Canonical Country Data

`data/countries.js` remains a single ordinary script and the only runtime country source. Before any country-content-neutral refactor, validation captures an ordered deep snapshot (and reproducible byte/hash evidence) of all 195 records. Post-change validation compares count, index order, every field/value, and continent at every index. No country index, continent chunks, fetch, lazy loading, or duplicate summary dataset is introduced.


## Evidence-Driven Audit

Before extraction, create an Audit Record beside the spec. Inventory every file loaded directly by `index.html` and every transitive remote/local asset load. For each reviewed source, assign exactly one of: production-used, test-only, duplicate candidate, dead candidate, or unresolved. Record path, load/reference evidence, observable behavior, conflicts, proposed disposition, reviewer/date, and affected characterization cases.

The responsibility comparison must explicitly cover timer code, streak tracking, lifecycle state, events, persistence, assets, and visual effects. Compare `app.js` with `timer-ring.js`, `streak-tracker.js`, `core/state.js`, `core/events.js`, `supabase-client.js`, `asset-fallbacks.js`, and effect files rather than assuming filenames identify canonical behavior. Documentation claims are separately marked current, stale, or unresolved with evidence.

Audit rules:

1. Unresolved, duplicate-candidate, and dead-candidate paths remain behaviorally untouched while their affected baseline cases are protected.
2. A file is removed only when reference/load evidence and characterization establish that it is dead or superseded.
3. A production reference is removed in the same auditable change as its superseded file.
4. Stale documentation is corrected only after evidence resolves the conflict.
5. `core/state.js` and `core/events.js` begin as duplicate/dead candidates. They cannot become production dependencies merely because they already exist in the working tree.
6. Any evidence that would favor duplicate state or a global EventBus is escalated as a requirements conflict; it does not silently overturn the one-owner/direct-interface design.

## Characterization and Test Architecture

No npm infrastructure is assumed or added. Characterization extends the repository's established styles:

- **Browser HTML harnesses:** self-contained files under `tests/`, iframe `../index.html`, use DOM assertions and deterministic fakes, render PASS/FAIL, set `document.body.dataset.testStatus`, and expose a named `window.__...RESULT__` object.
- **Node scripts:** run directly with `node tests/<runner>.js`, use `require`/VM evaluation and small inline assertion/property helpers. Production IIFEs should allow injected dependencies or expose pure APIs so tests do not need a bundler.
- **Direct-file smoke:** open the checked-in test harness and `index.html` by file URL in a supported browser; record startup and required flow outcomes.
- **Static-host smoke:** the maintainer manually starts a simple static server (for example, `python -m http.server 8000`) and runs the same startup/flow cases over HTTP. The server is not test infrastructure committed to the product.

Every Characterization Case records ID, requirements, preconditions/fixture, inputs, actions, observable DOM/service/storage/audio outcome, environment, and baseline result. Cases cover mode/filter/start, progression, all answer paths, scoring/streaks/timer, hints, autocomplete, feedback timing, quit, results/review/replay/home, file and HTTP startup, keyboard/assistive state, persistence success/fallback, and asset recovery. Tests control random selection and clocks where needed; they do not make remote network success a prerequisite.

The baseline is captured before the first production extraction. After each phase, targeted cases compare normalized observable results to the baseline. An approved requirement is authoritative when stale comments/docs disagree. An unexplained outcome difference rejects the phase.

## Conservative CSS Separation

Final CSS uses four coarse files loaded by ordered static links in `<head>`:

```html
<link rel="stylesheet" href="styles/shared.css">
<link rel="stylesheet" href="styles/landing.css">
<link rel="stylesheet" href="styles/round.css">
<link rel="stylesheet" href="styles/results.css">
```

`shared.css` contains reset/foundation, custom properties, typography, common controls, shared screen visibility/accessibility utilities, common modals/status patterns, shared asset fallbacks, and global reduced-motion rules. `landing.css`, `round.css`, and `results.css` contain selectors owned primarily by those major screen boundaries. Feedback, autocomplete, hints, timer, and recovery stay in `round.css`; they do not become tiny standalone files. Cross-screen rules move to shared only once, while source-order-sensitive exceptions remain in the later screen file and are documented.

The split is mechanical and conservative: preserve declaration text, selector specificity, media-query scope, custom-property values, source order within each boundary, focus states, and reduced-motion rules. First classify every existing rule by ownership and dependency, then move contiguous rule groups. Do not dynamically add stylesheets. Validate ordered links and representative landing, round, feedback, recovery, dialog, results, desktop, and mobile states after each CSS move; reject unexplained computed-style, overflow, focus, responsive, or visual-evidence changes.

## Context Guide

Create one concise manual/conditional guide, not multiple always-loaded instructions. The guide lists production entry points, canonical sources, the interfaces above, validation commands, and a task-to-context table. Its inclusion is manual or conditioned on GeoWars maintenance/refactor tasks.

Each Representative Task names its boundary and initial Primary Source Context. A scoring task starts with `game-rules.js` and its tests; session lifecycle with `game-session.js`; a screen task with `game-ui.js` plus the relevant CSS; persistence with `supabase-client.js`; bootstrap/load order with `index.html` and `app.js`. `data/countries.js` is excluded unless country content/schema/order is being changed. Cross-boundary rows explain why and list each additional path. Any entry-point, canonical-source, interface, or responsibility change updates this same guide or blocks review.

## Migration Plan and Rollback Boundaries

Each phase is a reviewable boundary with pre/post status capture, targeted validation, and a rollback that removes only that phase's wiring. No phase leaves two production state owners or two persistence paths active.

1. **Safety record and audit:** record branch/default branch/commit/status and fingerprints for pre-existing changes; work on a non-default branch; create Audit Record. Validation: inventory completeness and no production changes. Rollback: remove audit artifacts only.
2. **Characterization baseline:** add/extend HTML and Node harnesses and capture baseline. Validation: all baseline cases pass in applicable file/HTTP environments. Rollback: tests only; production unchanged.
3. **Pure Game Rules:** add `game-rules.js`, static tag, and tests; replace one characterized rule family at a time with direct calls. Validation: 100+ iteration properties plus affected answer/filter browser cases. Rollback: restore direct functions and remove one script tag/file.
4. **Player Stats boundary:** move remaining `app.js` storage behavior behind the existing `supabase-client.js` API without changing contract. Validation: fake remote/storage Node cases and browser stats/save cases. Rollback: restore characterized adapter while keeping data unchanged.
5. **Single Game Session cutover:** add `game-session.js` and atomically move lifecycle state/transitions/timers. Do not use `core/state.js` or `core/events.js`; do not run old and new state in parallel. Validation: session properties and complete gameplay/asset/persistence characterization. Rollback: revert the single wiring cutover.
6. **Cohesive UI extraction and thin bootstrap:** add `game-ui.js`, move DOM/listener/render/focus concerns by screen boundary, and reduce `app.js` to wiring. Validation after each screen extraction: targeted HTML harnesses; final validation includes full flows. Rollback: restore that screen's handlers to `app.js` without changing session APIs.
7. **Audit-controlled cleanup:** remove only evidence-approved dead/duplicate modules and stale references/docs. Validation: search inventory plus affected full characterization. Rollback: restore removed files/references from the phase diff.
8. **Static CSS split:** move shared foundation, then each major screen boundary, preserving ordered static links. Validation after every move: desktop/mobile representative states and accessibility checks. Rollback: restore `styles.css` and its single link.
9. **Guide, measurement, and final gate:** publish one guide, collect post-measures, run all Node/browser/file/HTTP checks, and reconcile Audit Record. Rollback: no product rollback required; failures return to the responsible earlier phase.

Country data is not a migration phase because it is not split. Unless an independently approved content task exists, the file remains byte/record equivalent apart from any explicitly justified global wrapper needed for namespace publication; even such a wrapper requires snapshot equality and file startup validation.


## Error Handling

- **Invalid rule input:** return a documented rejection/result or throw a boundary-specific `TypeError` caught by the caller; never mutate source arrays or session state partially.
- **Session command in wrong phase:** return `{accepted:false, reason}` and do not emit callbacks, add history, or save.
- **Missing local startup dependency/data:** keep Start disabled and expose a concise diagnostic; never fetch replacement code/data dynamically.
- **Remote identity/stats failure:** resolve to the existing offline/local behavior. Remote errors do not block landing or gameplay.
- **Unreadable/absent browser stats:** return characterized zero Guest stats.
- **Local save failure:** still attempt the existing remote session contract; report status without losing Results UI.
- **Remote save failure:** preserve any local aggregate and in-memory summary.
- **Silhouette failure:** session pauses/excludes the round; Round UI renders existing recovery actions. Stale load/error callbacks are ignored by card ID.
- **Flag/font/art failure:** canonical Asset Recovery preserves text, layout, controls, and local gameplay.
- **UI element absence:** fail the affected boundary closed with a diagnostic rather than binding partially or inventing fallback controls.

## Objective Context-Surface Evaluation

The Validation Process records reproducible pre/post measurements using the same script or shell method on both revisions:

1. `app.js` line count, byte count, and responsibility inventory against the Thin Bootstrap definition.
2. A fixed set of identical Representative Task statements collectively covering Game Rules, Game Session, Landing UI, Round UI, Results UI, Player Stats Service, Asset Recovery, Country Data Source, and Stylesheet Set.
3. For each task: responsibility boundary, Primary Source Context paths, number of primary files, and aggregate line/byte count. Test fixtures and generated validation output are excluded.
4. Per-boundary and aggregate pre/post comparisons. There is no arbitrary 70% target. `app.js` must be smaller in both lines and bytes and must be thin; context improvement is reported as evidence, not guaranteed by a slogan.
5. Every increase records the cross-boundary reason and exact source paths. An increase is reviewable, but an unexplained increase blocks acceptance.
6. The final record lists every resolved/unresolved duplicate, dead, and documentation conflict and confirms pre-existing working-tree paths remain preserved.

A measurement helper may be a checked-in standalone Node script if useful, but it must accept explicit path lists and require no dependency installation. Measurements are not allowed to encourage copying interfaces or country data into duplicate files.

## Deployment Review Gates

A phase is accepted only when its targeted existing/new HTML or Node checks pass and its baseline comparison has no unapproved difference. Final deployment review remains blocked until all of the following are recorded as run and passing:

- audit reconciliation and preservation of pre-existing work;
- canonical 195-record ordered deep snapshot;
- Game Rules and Game Session unit/property checks;
- full existing browser and Node regression suite;
- direct-file and static-host startup/flow checks;
- gameplay, accessibility, persistence, Asset Recovery, and CSS representative-state checks;
- ordered static script/link inspection with no dynamic local loading;
- thin/smaller `app.js` measurements and complete context-surface report;
- current single Context Guide.

Eligibility means ready for deployment review, not automatically deployed. Any required check that is failing, missing, or not applicable without a recorded reason keeps the result blocked.

## Property Reflection

The prework identified overlapping testable rules. The final set consolidates: exact/near-miss/option/reveal multipliers with score calculation into one answer-evaluation property; correct/incorrect streak behavior into one outcome-transition property; all indexed country count/order/field/continent checks into one deep snapshot property; remote mapping/fallback into one read property; local/remote save behavior into one save property; terminal pathways into one cardinality property; and recovery transitions into one recovery property. EventBus, lazy-loading, invented mode, base-score, and country-chunk properties from the old design are removed because they conflict with the revised requirements. UI rendering, CSS layout, infrastructure startup, and audit-document checks remain example/integration/smoke tests rather than being mislabeled as randomized PBT.

## Correctness Properties

*A property is a behavior that must hold across all valid generated inputs or every member of a defined set. These properties are executable with the repository's standalone Node/browser harnesses and bridge the requirements to regression checks.*

### Property 1: Characterized outcomes remain equivalent

For every Characterization Case affected by an unresolved audit item or completed extraction, the normalized post-change observable outcome must equal the approved Characterization Baseline unless an approved product change is attached.

**Validates: Requirements 1.6, 2.7**

### Property 2: Game Rules are deterministic and side-effect free

For all valid Game Rules inputs, repeated calls with equivalent inputs and deterministic random collaborators return equivalent outputs, leave input objects unchanged, and perform no document, storage, network, clock, or timer operation.

**Validates: Requirements 3.2**

### Property 3: Supported mode initialization preserves the contract

For all valid difficulty/region selections, starting `sprint` creates an active session with 60 seconds exposed, while starting `showoff` creates an untimed session with reveal and manual progression available.

**Validates: Requirements 4.1, 4.2**

### Property 4: Answer evaluation and scoring use the characterized multiplier

For any canonical country card and valid answer action, exact typed names under trim/case normalization are correct at multiplier 3, accepted non-exact names at Levenshtein distance at most 2 are correct at multiplier 2, correct switched options use 2, correct direct options use 1, Practice reveals award zero, and every correct non-reveal award equals card stars multiplied by that action's multiplier.

**Validates: Requirements 4.3, 4.4, 4.5, 4.6, 4.7, 4.8**

### Property 5: Answer transitions preserve streak and history invariants

For any valid active session snapshot and answer outcome, a correct answer increments current streak, sets best streak to the maximum of prior best and new current streak, and appends exactly one round outcome; an incorrect answer resets current streak to zero and appends exactly one round outcome.

**Validates: Requirements 4.9, 4.10**

### Property 6: Sprint expiration terminates once

For any active Sprint session at its final positive second, the tick that reaches zero ends the session, supplies one summary to the Results boundary, and subsequent ticks or terminal commands do not emit another terminal summary.

**Validates: Requirements 4.11**

### Property 7: Americas filtering is exact

For any collection of records with valid continent classifications, selecting Americas returns exactly records classified as North America or South America and does not mutate or reorder the source collection beyond the characterized filter behavior.

**Validates: Requirements 4.12**

### Property 8: Canonical country snapshot is preserved

For every index in the Canonical Country Snapshot, the post-refactor Country Data Source contains one deeply equal record at that index—including every field, value, and continent—and the complete collection length is exactly 195.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.7**


### Property 9: Visible controls have accessible names

For every interactive control visible in any characterized Landing, Round, feedback, recovery, modal, or Results state, the browser-computed accessible name is non-empty.

**Validates: Requirements 7.9**

### Property 10: Statistics reads select the characterized source

For any valid remote player record and browser-storage record, a successful remote read maps games played, best streak, total correct, total score, and display name exactly from the remote record; if the remote read is unavailable or fails, the result contains the available characterized values from `geowars-stats`.

**Validates: Requirements 8.2, 8.3**

### Property 11: Session saving is local-first and remote-independent

For any valid prior `geowars-stats` record and completed-session summary, saving applies the characterized local aggregation before attempting the remote contract; a local failure does not prevent the exact remote payload attempt, and a remote failure does not undo a successful local update or discard the in-memory summary.

**Validates: Requirements 8.4, 8.5, 8.6**

### Property 12: Terminal pathways save with correct cardinality

For any valid session, timer expiration in Sprint or quit with at least one counted round produces exactly one save-bearing terminal summary despite repeated terminal signals, while quit with zero counted rounds produces no save-bearing summary and returns to Landing.

**Validates: Requirements 8.7, 8.8, 8.9**

### Property 13: Silhouette recovery preserves session invariants

For any active session and current-card silhouette failure, Sprint timing pauses and the failed round is excluded; successful retry restores that round with the same remaining Sprint time, while Next begins another round without recording the failed round.

**Validates: Requirements 9.2, 9.5, 9.6**

### Property 14: Recovery cannot mutate statistics before save

For any serialized pre-failure `geowars-stats` value and any Retry, Next country, Return home, or feedback-flag-failure action before a characterized save event, the stored byte value remains unchanged.

**Validates: Requirements 9.10**

### Property 15: Representative visual states preserve required evidence

For every Representative Visual State and supported viewport, the post-split document has the required ordered stylesheets, visible state, focus indicators, readable text/controls, no new layout overflow, and baseline-equivalent computed or available visual-regression evidence unless an approved visual change exists.

**Validates: Requirements 10.2, 10.7**

### Property 16: Context selection follows country-task scope

For every mapped Representative Task, the initial Primary Source Context excludes `data/countries.js` when country content is out of scope and includes it when country content is in scope.

**Validates: Requirements 11.5, 11.6**

### Property 17: Deployment eligibility is complete and fail-closed

For any Validation Process status set, deployment review eligibility is false when any required gameplay, accessibility, persistence, Asset Recovery, stylesheet, country-data, or Static Operation check is missing or failing, and true only when every required check is recorded and passing.

**Validates: Requirements 12.14, 12.15**

## Testing Strategy

Testing is dual-layered and dependency-free:

- **Standalone Node unit tests** cover concrete normalization boundaries, empty/invalid arguments, zero-round quit, unreadable storage, clock boundaries, service mapping, and interface failure outcomes.
- **Standalone Node property tests** use the repository's inline `forAll` style with at least 100 generated iterations per randomized property. Each test includes a tag comment/name in the format `Feature: token-optimization, Property N: <property title>` and reports the exact failing input.
- **Browser HTML integration tests** cover DOM rendering, screen/focus/inert transitions, autocomplete keys/ARIA, modals, timer/feedback flow, persistence display, asset failures, and CSS states. They retain visible PASS/FAIL and machine-readable result globals.
- **Characterization comparisons** exercise concrete current flows before and after extraction. Property 1 iterates the defined case set; it does not randomize subjective UI appearance.
- **Static operation checks** run both by direct file URL and a manually started static HTTP server. No development server or watcher is introduced into automated commands.
- **Visual checks** combine existing visual evidence, DOM/computed-style assertions, focus/readability/overflow checks, and manual review where pixel evidence is unavailable. UI/CSS is not treated as a high-volume randomized PBT target.

Property generators emphasize meaningful boundaries: Unicode/case/whitespace and edit distances for names; all supported modes/filters; stars and existing multipliers; arbitrary valid streak/history states; valid/invalid storage records; terminal signal repetitions; recovery actions; and required-check status combinations. External network, browser rendering, and real-time waits are replaced with fakes for pure/session/service properties, then covered with a small number of browser integration examples.

## Traceability and Acceptance

Function-interface tables cover responsibility and effect documentation; the Audit Record covers canonical implementation decisions; Characterization Cases cover observable flows; properties cover universal business/state/data invariants; browser tests cover UI/accessibility/static operation; and the Validation Process combines all evidence into deployment gates. No acceptance decision relies solely on line count, and no context claim permits removal of behavior, records, fallbacks, accessibility semantics, or pre-existing user work.