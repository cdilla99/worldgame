# Requirements Document

## Introduction

This specification defines a behavior-preserving context-efficiency and maintainability refactor for GeoWars. The Refactor reduces the source context required for bounded maintenance tasks, establishes explicit responsibility boundaries, removes only evidence-backed dead or duplicate code, and reduces `app.js` while preserving the current static browser product. The scope excludes runtime lazy loading, new gameplay, new persistence semantics, and broad platform changes.

## Glossary

- **GeoWars**: The country-silhouette browser game delivered by the checked-in `index.html` file.
- **Refactor**: The behavior-preserving source reorganization covered by this specification.
- **Production Entry Point**: A checked-in file loaded directly or transitively by `index.html` during normal game operation.
- **Audit Record**: A review artifact containing source evidence, classifications, conflicts, and dispositions used to control the Refactor.
- **Source Evidence**: A file path, reference or load relationship, and observable behavior that supports an Audit Record classification.
- **Characterization Case**: A check that records preconditions and inputs, player or system actions, and observable outcomes.
- **Characterization Suite**: The browser and Node checks composed of Characterization Cases.
- **Characterization Baseline**: The approved pre-refactor results of the Characterization Suite.
- **Thin Bootstrap**: The reduced `app.js` responsibility that initializes dependencies, connects top-level interactions, and starts GeoWars without owning feature rules, Game Session state, or screen rendering details.
- **Game Rules**: Deterministic calculations and selections for scoring, filters, answer evaluation, and related behavior, without document, network, timer, or persistence access.
- **Game Session**: The single authoritative owner of mutable game and round lifecycle state, including mode, filters, deck, current card, timer values, score, streak, history, asset-failure state, and transitions.
- **Function Interface**: A named callable contract that identifies inputs, returned or emitted outputs, state effects, document effects, and failure outcomes.
- **Landing UI**: The boundary responsible for mode and filter selection, player context, statistics, and game-start interactions.
- **Round UI**: The boundary responsible for the active country prompt, answer controls, hints, timer display, feedback, quit flow, and asset recovery presentation.
- **Results UI**: The boundary responsible for session summaries, round review, replay, home navigation, and save-progress presentation.
- **Player Stats Service**: The boundary responsible for the existing player identity and statistics operations, including remote recording and browser-storage behavior.
- **Country Data Source**: The single canonical, statically loaded ordered collection of 195 complete country records used at runtime.
- **Canonical Country Snapshot**: The pre-refactor sequence of Country Data Source records, including every record field, value, order position, and continent classification.
- **Sprint Mode**: The `sprint` mode with a 60-second countdown.
- **Practice Mode**: The user-facing Practice mode represented internally by the existing `showoff` identifier and operated without a countdown.
- **Answer Multiplier**: The existing multiplier selected by an answer path: 3 for an exact typed answer, 2 for an accepted spelling near miss or after switching from typed entry to options, and 1 for direct options.
- **Accepted Spelling Near Miss**: A typed country name whose trimmed, case-insensitive Levenshtein distance from the canonical country name is at most 2.
- **Current Continent Classification**: The continent value in the Canonical Country Snapshot, including the Americas filter behavior that selects both North America and South America.
- **Static Operation**: Execution from a browser file URL or a static HTTP host without a build step, package installation, server-side rendering, or runtime module transformation.
- **Asset Recovery**: The current silhouette, flag, font, and local-icon failure behavior that preserves comprehension, layout, statistics, and safe continuation.
- **Stylesheet Set**: The statically linked shared and screen-level CSS files produced by the Refactor.
- **Representative Visual State**: A characterized landing, round, feedback, recovery, modal, or results state at a supported desktop or mobile viewport.
- **Context Guide**: One concise architecture and task-to-context guide activated manually or by a relevant condition.
- **Representative Task**: A bounded maintenance scenario selected by responsibility or behavior boundary for context measurement.
- **Primary Source Context**: The production files that must be read to understand and implement a Representative Task, excluding test fixtures and validation output.
- **Validation Process**: The recorded checks used to establish regression safety, context-surface improvement, source reduction, and deployment-review readiness.
- **Default Branch**: The repository branch designated as the primary integration branch.

## Requirements
### Requirement 1: Evidence-Driven Audit

**User Story:** As a maintainer, I want an evidence-driven audit before extraction, so that the Refactor removes obsolete structure without relying on stale assumptions.

#### Acceptance Criteria

1. THE Audit Record SHALL identify every Production Entry Point and the observed load order of scripts, country data, stylesheets, and external assets.
2. THE Audit Record SHALL assign each reviewed source module exactly one classification of production-used, test-only, duplicate candidate, dead candidate, or unresolved.
3. THE Audit Record SHALL include Source Evidence and a proposed disposition for each classification.
4. THE Audit Record SHALL compare timer, streak, state, event, persistence, asset, and visual-effect implementations before selecting canonical production behavior.
5. THE Audit Record SHALL classify each reviewed documentation conflict as current, stale, or unresolved and include Source Evidence for the classification.
6. WHILE a duplicate candidate, dead candidate, or documentation conflict remains unresolved, THE Refactor SHALL preserve the Characterization Baseline for the affected behavior.
7. WHEN Source Evidence establishes that a module is dead or superseded, THE Refactor SHALL remove the module and the stale production references identified by the Audit Record.
8. WHEN Source Evidence establishes that documentation is stale, THE Refactor SHALL update or remove the conflicting statement.

### Requirement 2: Characterization Before Extraction

**User Story:** As a maintainer, I want observable regression coverage before source extraction, so that structural changes can be checked against current product behavior.

#### Acceptance Criteria

1. THE Characterization Suite SHALL establish a Characterization Baseline before the Refactor extracts a production responsibility from `app.js`.
2. THE Characterization Suite SHALL record preconditions and inputs, actions, and observable outcomes for every Characterization Case.
3. THE Characterization Suite SHALL include Characterization Cases for mode selection, difficulty and region filtering, game start, round progression, answer paths, scoring, streaks, timer expiration, quit behavior, results, replay, and home navigation.
4. THE Characterization Suite SHALL include Characterization Cases for exact typed answers, Accepted Spelling Near Misses, switched-to-options answers, direct-option answers, and Practice Mode reveals.
5. THE Characterization Suite SHALL include Characterization Cases for direct-file startup, static-host startup, keyboard and assistive-technology state, persistence success and fallback, and Asset Recovery.
6. WHEN a characterization outcome conflicts with stale documentation, THE Audit Record SHALL identify observed production behavior and approved requirements as the authoritative baseline.
7. IF a proposed extraction changes a Characterization Baseline outcome without an approved product change, THEN THE Validation Process SHALL reject the extraction.

### Requirement 3: Explicit Responsibility and State Boundaries

**User Story:** As a maintainer, I want focused boundaries and one state owner, so that bounded changes require less unrelated source context and do not create conflicting lifecycle control.

#### Acceptance Criteria

1. THE Refactor SHALL reduce `app.js` to a Thin Bootstrap.
2. THE Refactor SHALL isolate Game Rules as deterministic functions with explicit inputs and outputs.
3. THE Refactor SHALL assign all mutable game and round lifecycle state to exactly one Game Session owner.
4. THE Refactor SHALL provide Function Interfaces between the Thin Bootstrap, Game Rules, Game Session, Landing UI, Round UI, Results UI, and Player Stats Service.
5. THE Function Interfaces SHALL identify inputs, outputs, state effects, document effects, and failure outcomes for each callable boundary operation.
6. THE Landing UI, Round UI, and Results UI SHALL render state received through Function Interfaces without creating another authoritative Game Session state store.
7. THE Refactor SHALL assign identity and statistics persistence operations to the Player Stats Service.
8. THE Refactor SHALL retain focused audio and asset modules that the Audit Record classifies as canonical production implementations.
9. WHEN timer, streak, persistence, asset, or visual-effect responsibilities exist in more than one production location, THE Refactor SHALL retain one characterized canonical implementation and remove only the superseded production paths.

### Requirement 4: Current Game Contract Preservation

**User Story:** As a player, I want the Refactor to preserve current rules and flows, so that source reorganization does not alter gameplay.

#### Acceptance Criteria

1. WHEN a player starts Sprint Mode, THE Game Session SHALL initialize a 60-second countdown and expose the timer to the Round UI.
2. WHEN a player starts Practice Mode, THE Game Session SHALL use the `showoff` mode identifier and expose an untimed round with answer-reveal and manual-progression actions.
3. WHEN GeoWars evaluates a correct answer, THE Game Rules SHALL calculate awarded points as the current card stars multiplied by the Answer Multiplier.
4. WHEN a player submits an exact typed country name after case-insensitive comparison, THE Game Rules SHALL apply an Answer Multiplier of 3.
5. WHEN a player submits an Accepted Spelling Near Miss, THE Game Rules SHALL accept the answer as correct and apply an Answer Multiplier of 2.
6. WHEN a player switches from typed entry to answer options, THE Game Rules SHALL apply an Answer Multiplier of 2 to a correct option.
7. WHEN a player opens answer options directly, THE Game Rules SHALL apply an Answer Multiplier of 1 to a correct option.
8. WHEN a player reveals an answer in Practice Mode, THE Game Rules SHALL award zero points.
9. WHEN a player answers correctly, THE Game Session SHALL increment the current streak, retain the greater of the prior best streak and current streak, and record the round outcome.
10. WHEN a player answers incorrectly, THE Game Session SHALL reset the current streak to zero and record the round outcome.
11. WHEN the Sprint Mode timer reaches zero, THE Game Session SHALL end the session and provide the session summary to the Results UI.
12. WHEN the Americas filter is selected, THE Game Rules SHALL include records classified as North America or South America.
13. THE Characterization Suite SHALL verify hint use, autocomplete keyboard behavior, feedback timing, round review, and existing keyboard shortcuts against the Characterization Baseline.
### Requirement 5: Canonical Static Country Data

**User Story:** As a maintainer, I want one exact canonical country dataset, so that reorganization does not alter content, ordering, filtering, or startup behavior.

#### Acceptance Criteria

1. THE Country Data Source SHALL contain exactly 195 canonical country records.
2. THE Country Data Source SHALL preserve the Canonical Country Snapshot record order.
3. THE Country Data Source SHALL preserve every Canonical Country Snapshot record field and value.
4. THE Country Data Source SHALL preserve the Current Continent Classification for all 195 records.
5. THE Country Data Source SHALL be available before the Thin Bootstrap permits a game to start.
6. WHEN Game Rules filter, select, or score a country record, THE Game Rules SHALL consume the complete Country Data Source without runtime chunk loading.
7. IF an approved maintenance task excludes country-content changes, THEN THE Validation Process SHALL verify the post-refactor Country Data Source against the Canonical Country Snapshot.

### Requirement 6: Direct-File and Static-Host Operation

**User Story:** As a player or deployer, I want static operation preserved, so that GeoWars remains usable without a build pipeline.

#### Acceptance Criteria

1. WHEN a browser opens the checked-in `index.html` through a file URL, THE Static Operation SHALL display the Landing UI with Sprint Mode, any difficulty, and worldwide region selected.
2. WHEN a player changes mode, difficulty, or region during direct-file access, THE Static Operation SHALL update the visible selection state without starting a session.
3. WHEN a player activates the primary start action during direct-file access, THE Static Operation SHALL open the Round UI with the selected mode and filters.
4. WHEN a static HTTP host serves GeoWars, THE Static Operation SHALL support the characterized landing-to-round-to-feedback-to-results-to-home flow.
5. THE Static Operation SHALL load production JavaScript, the Country Data Source, local icons, and the Stylesheet Set through browser-supported static references in the required startup order.
6. IF a remote service or remote asset is unavailable during Static Operation, THEN THE GeoWars SHALL keep local gameplay entry available and expose the characterized persistence fallback or Asset Recovery outcome.
7. WHEN production references or startup order change, THE Validation Process SHALL run direct-file and static-host startup and flow checks.

### Requirement 7: Concrete Accessibility Preservation

**User Story:** As a keyboard or assistive-technology user, I want accessible state and focus behavior preserved, so that the Refactor does not reduce access to game functions or status information.

#### Acceptance Criteria

1. THE GeoWars SHALL expose each visible Landing UI, Round UI, and Results UI screen as a named landmark associated with a non-empty heading.
2. WHILE a screen or interaction region is hidden, THE GeoWars SHALL expose the region as hidden and prevent controls in the region from receiving focus.
3. WHEN GeoWars changes from Landing UI to Round UI, THE GeoWars SHALL move focus to the game heading.
4. WHEN GeoWars presents round feedback, THE GeoWars SHALL expose a named status region, move focus to the feedback outcome heading, and prevent background game controls from receiving focus.
5. WHEN GeoWars changes to Results UI, THE GeoWars SHALL move focus to the results heading.
6. WHEN a player returns from Results UI to Landing UI, THE GeoWars SHALL move focus to the landing heading.
7. WHEN GeoWars opens a modal dialog, THE GeoWars SHALL move focus into the dialog, contain keyboard focus within the dialog, and restore focus to the invoking control when the dialog closes.
8. WHEN autocomplete suggestions are visible, THE Round UI SHALL expose expanded listbox state, an active suggestion relationship, Arrow key traversal, Enter selection, and Escape dismissal.
9. THE GeoWars SHALL provide a non-empty accessible name for each interactive control, including icon-bearing controls.
10. WHEN feedback, results, persistence, or Asset Recovery status changes, THE GeoWars SHALL expose the changed text through the characterized status or live-region relationship.
11. THE Validation Process SHALL execute the existing browser accessibility checks and targeted checks for any changed accessibility boundary.

### Requirement 8: Existing Persistence Behavior Preservation

**User Story:** As a player, I want identity and statistics behavior preserved, so that the Refactor neither loses current progress nor invents new persistence semantics.

#### Acceptance Criteria

1. THE Player Stats Service SHALL preserve the existing identity, statistics-read, session-save, online-state, claimed-state, email, magic-link, and claim operations consumed by the user interfaces.
2. WHEN a statistics read succeeds through the existing remote contract, THE Player Stats Service SHALL return games played, best streak, total correct answers, total score, and display name from the current player record.
3. IF a remote statistics read is unavailable or fails, THEN THE Player Stats Service SHALL return the values available in the existing `geowars-stats` browser-storage record.
4. WHEN GeoWars saves a completed session, THE Player Stats Service SHALL attempt to update the existing `geowars-stats` browser-storage record using the characterized aggregation rules before attempting remote session recording.
5. WHEN remote session recording is available, THE Player Stats Service SHALL submit mode, score, correct count, total count, best streak, difficulty, and duration through the existing remote contract regardless of the browser-storage attempt outcome.
6. IF remote session recording is unavailable or fails, THEN THE GeoWars SHALL retain the browser-storage update and keep the in-memory results available.
7. WHEN GeoWars ends a Sprint Mode session through timer expiration, THE GeoWars SHALL invoke the characterized session-save path once.
8. WHEN a player quits with at least one counted round, THE GeoWars SHALL invoke the characterized session-save path once and display Results UI.
9. WHEN a player quits with zero counted rounds, THE GeoWars SHALL return to Landing UI without incrementing stored games played.
10. WHEN browser statistics exist at startup, THE Landing UI SHALL display the stored games-played, best-streak, and total-correct values.
11. IF browser storage contains absent or unreadable statistics, THEN THE Player Stats Service SHALL return the characterized zero-value guest statistics without blocking gameplay.
### Requirement 9: Observable Asset Recovery Preservation

**User Story:** As a player, I want failed assets to recover safely, so that asset failures remain understandable and do not corrupt a session or stored statistics.

#### Acceptance Criteria

1. IF a country silhouette fails to load, THEN THE Asset Recovery SHALL replace the broken image with a visible status that retains usable silhouette-stage dimensions.
2. IF a country silhouette fails during Sprint Mode, THEN THE Game Session SHALL pause the countdown and exclude the failed round from counted totals and round history.
3. WHEN silhouette recovery is active, THE Round UI SHALL hide answer interactions and expose Retry, Next country, and Return home actions with status text stating that the failed round will not be saved.
4. WHEN a player activates Retry, THE Asset Recovery SHALL provide immediate disabled-state acknowledgement while another silhouette load is pending.
5. WHEN a silhouette retry succeeds, THE Game Session SHALL restore the failed round to counted status, preserve the remaining Sprint Mode time, and expose the answer interactions and characterized focus target.
6. WHEN a player activates Next country during silhouette recovery, THE Game Session SHALL begin another round without recording or persisting the failed round.
7. WHEN a player activates Return home during silhouette recovery, THE Game Session SHALL stop active timing and audio, preserve stored statistics, and display Landing UI.
8. IF a feedback flag fails to load, THEN THE Asset Recovery SHALL replace the broken image with visible text that preserves the country name, answer outcome, score comprehension, reserved layout area, and remaining controls.
9. IF a custom font or remote artwork is unavailable, THEN THE Asset Recovery SHALL preserve readable controls, the text-first landing proposition, and the checked-in system-font and local-icon fallbacks.
10. WHILE no characterized session-save event has occurred, THE GeoWars SHALL keep the pre-failure `geowars-stats` record unchanged during silhouette retry, next-country recovery, return-home recovery, and feedback flag failure.

### Requirement 10: Conservative Static Stylesheet Separation

**User Story:** As a maintainer, I want styles separated by stable visual boundaries, so that screen changes require less unrelated CSS context without changing presentation.

#### Acceptance Criteria

1. THE Stylesheet Set SHALL separate shared foundations from Landing UI, Round UI, and Results UI styles.
2. THE Stylesheet Set SHALL preserve the characterized cascade order, selector effects, custom-property values, responsive layout behavior, focus visibility, reduced-motion behavior, and visible interaction states.
3. THE Stylesheet Set SHALL use ordered static `<link rel="stylesheet">` references in `index.html` that load during startup.
4. WHEN a CSS rule serves more than one screen boundary, THE Stylesheet Set SHALL place the rule in a shared stylesheet or retain one characterized canonical declaration.
5. WHEN stylesheet files are split or reordered, THE Validation Process SHALL exercise Representative Visual States at supported desktop and mobile viewports.
6. WHEN validating a Representative Visual State, THE Validation Process SHALL check stylesheet order, required visible states, focus indicators, text and control readability, layout overflow, and available visual-regression evidence.
7. IF a stylesheet change alters a characterized layout, responsive transition, focus indicator, reduced-motion outcome, or visible interaction state without an approved product change, THEN THE Validation Process SHALL reject the change.

### Requirement 11: Selective Context Guidance

**User Story:** As a developer or AI assistant, I want concise architecture guidance, so that a bounded task can begin with relevant source context instead of broad repository reading.

#### Acceptance Criteria

1. THE Context Guide SHALL consist of one concise guide covering Production Entry Points, responsibility boundaries, canonical sources, Function Interfaces, and validation commands.
2. THE Context Guide SHALL use manual activation or a task-relevant inclusion condition.
3. THE Context Guide SHALL map Representative Tasks to the Primary Source Context selected by behavior or responsibility boundary.
4. WHEN a Representative Task crosses a boundary, THE Context Guide SHALL identify the cross-boundary reason and the additional source files required.
5. WHEN a Representative Task excludes country-content changes, THE Context Guide SHALL direct initial source selection away from the 195 Country Data Source records.
6. WHEN a Representative Task changes country content, THE Context Guide SHALL include the Country Data Source in Primary Source Context.
7. THE Context Guide SHALL define context efficiency as selective source reading supported by explicit boundaries and interfaces.
8. WHEN a Production Entry Point, canonical source, Function Interface, or responsibility boundary changes, THE Refactor SHALL update the Context Guide in the same change.
9. WHILE the Context Guide is stale relative to a changed Production Entry Point, canonical source, Function Interface, or responsibility boundary, THE Validation Process SHALL classify the Refactor as blocked.

### Requirement 12: Objective Validation and Delivery Safety

**User Story:** As a maintainer, I want objective measurements and safe delivery conditions, so that context improvements do not trade away regression safety or pre-existing work.

#### Acceptance Criteria

1. WHEN Refactor implementation changes are about to begin, THE Validation Process SHALL record the current branch, Default Branch, current commit, and pre-existing working-tree changes.
2. WHEN Refactor implementation changes are about to begin, THE Validation Process SHALL use a non-default working branch.
3. IF pre-existing working-tree changes are present, THEN THE Validation Process SHALL record the affected paths and preserve the changes throughout Refactor work.
4. THE Validation Process SHALL record the pre-refactor and post-refactor line count and byte count of `app.js` using the same measurement method.
5. THE Validation Process SHALL record the pre-refactor and post-refactor responsibilities remaining in `app.js` against the Thin Bootstrap definition.
6. WHEN the Refactor is complete, THE Validation Process SHALL verify that post-refactor `app.js` has fewer lines and bytes than the pre-refactor `app.js` and satisfies the Thin Bootstrap responsibility.
7. THE Validation Process SHALL select Representative Tasks that collectively cover Game Rules, Game Session, Landing UI, Round UI, Results UI, Player Stats Service, Asset Recovery, Country Data Source, and Stylesheet Set boundaries.
8. THE Validation Process SHALL record each Representative Task boundary, identical pre-refactor and post-refactor task statement, Primary Source Context paths, primary-file count, and total line and byte count of the Primary Source Context.
9. WHEN evaluating context efficiency, THE Validation Process SHALL compare pre-refactor and post-refactor Representative Task measurements by boundary and across the measured set.
10. WHEN a Representative Task measurement increases, THE Validation Process SHALL record the boundary reason and the source paths responsible for the increase.
11. THE Validation Process SHALL record resolved and unresolved duplicate candidates, dead candidates, and documentation conflicts from the Audit Record.
12. WHEN a changed boundary has targeted browser or Node checks, THE Validation Process SHALL pass the targeted checks before accepting the boundary change.
13. WHEN all boundary changes are complete, THE Validation Process SHALL pass the full existing regression suite and the direct-file and static-host smoke checks.
14. WHILE a required gameplay, accessibility, persistence, Asset Recovery, stylesheet, country-data, or Static Operation check is unrun or failing, THE Validation Process SHALL classify deployment review as blocked.
15. WHEN every required check has run and passed, THE Validation Process SHALL classify the Refactor as eligible for deployment review.
