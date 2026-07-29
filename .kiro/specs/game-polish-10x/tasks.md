# Implementation Plan: Game Polish 10x

## Overview

Replace the narrow desktop app-card with a responsive, full-page GeoWars experience while preserving the existing single-player silhouette quiz, Sprint/Practice rules, scoring, streaks, hints, stats, and results. The work is limited to product code and automated test code; it does not implement the feature.

This plan supersedes the legacy audio-and-celebration task list. Its completed confetti, praise-text, dark-mode, globe-animation, and decorative-animation work is not retained because it conflicts with Requirements 2.6–2.7, 5.4–5.6, and 9.3–9.5. Existing core quiz behavior remains in scope and is covered by regression tasks below.

## Tasks

- [x] 1. Create a local, purpose-built GeoWars icon and asset-fallback foundation
  - [x] 1.1 Create `assets/geowars-icons.svg` and `asset-fallbacks.js` for the GeoWars visual language
    - Define a consistent stroke-based SVG set for brand mark, mode, timer, score, streak, flag, region, sound, quit, next, and retry actions; do not use emoji as the sole action label.
    - Define the silhouette and flag source/fallback metadata and local text/SVG fallback renderers so the UI can reserve space and communicate the state without a remote image.
    - _Requirements: 1.7, 2.1–2.7, 5.4–5.6, 8.6, 10.1–10.7, 13.1–13.2_

- [x] 2. Rebuild the landing markup and start-state behavior around one explicit primary action
  - [x] 2.1 Replace the landing section in `index.html` with semantic utility-header, proposition, setup-panel, and subdued-statistics regions
    - Keep the GeoWars name and the silhouette-guessing objective in the first viewport; remove the rotating remote hero globe and decorative hero silhouette.
    - Make Sprint and Practice selectable controls rather than immediate start controls, keep their timing/answer descriptions adjacent to selection, and retain visible difficulty and region controls.
    - Add one persistent `#btn-start-game` action after settings, a selected-mode/status summary, accessible SVG icon labels, and headings/landmarks that establish reading order.
    - Stop loading the obsolete particle and celebration-text modules from this screen; retain existing gameplay and audio scripts only where they still serve the baseline.
    - _Requirements: 1.1–1.7, 2.3–2.7, 3.1–3.7, 4.1–4.8, 5.4–5.6, 8.1–8.8, 9.3–9.5, 10.1_

  - [x] 2.2 Modify landing-state handling in `app.js` so mode selection, summaries, and the Start action remain synchronized
    - Replace direct start handlers on `#btn-sprint` and `#btn-showoff` with selected-state updates (`aria-pressed`, visible mode description, and dynamic Start label such as “Start Sprint”).
    - Preserve valid default mode/difficulty/region selections and have `#btn-start-game` read the currently displayed selections immediately before `startGame()`.
    - Keep filter summaries and deck filtering correct, including the existing Americas mapping, without reintroducing legacy multiplayer or round-limit concepts.
    - _Requirements: 1.4–1.6, 3.5–3.7, 4.2–4.8, 8.1–8.3_

  - [x] 2.3 Add `tests/landing-start-flow.html` regression tests for the selected-mode start contract
    - Verify defaults are valid, changing mode/difficulty/region updates the visible summaries and Start label, and invoking the sole Start action passes the displayed selections into session initialization.
    - Verify mode controls do not begin a session by themselves.
    - _Requirements: 3.3–3.7, 4.2–4.8_

- [x] 3. Establish the restrained design system and responsive full-page landing composition in `styles.css`
  - [x] 3.1 Define semantic tokens, typography roles, spacing scale, focus treatment, and SVG icon rules in `styles.css`
    - Replace ad-hoc gradient, glow, and decoration rules with named color roles for page, surface, primary action, text, muted text, success, error, warning, and focus; preserve contrast thresholds without color-only meaning.
    - Define display, heading, body, label, numeric-data, and control-text roles; use a consistent geographic contour/grid-line motif only where it clarifies hierarchy or country-shape recognition.
    - Remove the dot-grid texture, animated gradient headline, continuous globe rotation, silhouette pulsing, routine entrance motion, heavy glows, particle styles, celebration-text styles, and generic confetti keyframes.
    - _Requirements: 2.2, 2.5–2.7, 5.1–5.9, 8.2, 9.1–9.5, 11.2–11.5_

  - [x] 3.2 Replace the 720px desktop card rules with responsive landing layouts in `styles.css`
    - At widths of at least 1024px, make `.app` a full-page shell and implement a composed landing grid: quiet utility header, generous proposition/artwork region, persistent setup/start panel, and visually subordinate statistics/player context.
    - Keep the Start action visible without scrolling at 1024×768 and 1440×900; use reserved artwork dimensions rather than remote image dimensions to avoid layout shift.
    - At widths below 768px, retain one intentional stacked column, preserve document order and all setup choices, and prevent horizontal overflow at every Representative_Viewport.
    - Supply hover, active, selected, disabled, loading, and `:focus-visible` states with at least 44×44px primary/navigation targets; use only brief state-change transitions and disable them under reduced motion.
    - _Requirements: 3.1–3.7, 4.1–4.5, 5.1–5.9, 8.2–8.8, 9.1–9.4, 11.1–11.5_

- [x] 4. Compose the active game screen as a prompt stage plus answer interaction panel
  - [x] 4.1 Restructure the game and results markup in `index.html` into named desktop and mobile regions
    - Create a game utility/HUD region that separates score, streak, timer, sound, and quit from gameplay controls; keep the timer element hidden in Practice mode.
    - Wrap the silhouette, prompt context, revealed flag, and fallback/recovery affordance in a `game-stage`; group answer-path controls, text input, autocomplete, choices, hints, reveal/skip, and feedback-next action in an `answer-interaction-panel`.
    - Replace emoji-only labels in mute, quit, typed answer, flag hint, region hint, skip, feedback facts, and navigation controls with text plus the SVG icon system, preserving accessible names for icon-only controls.
    - Ensure feedback and results use headings, status text, and controls that can receive programmatic focus without placing hidden screen controls in the tab order.
    - _Requirements: 2.4–2.7, 5.4–5.9, 6.1–6.8, 7.1–7.8, 8.1–8.10, 9.3–9.5, 10.2–10.6_

  - [x] 4.2 Implement desktop stage/panel and mobile one-column game layouts in `styles.css`
    - At desktop widths, place the silhouette stage and answer interaction panel in distinct, visually balanced regions while retaining a separate utility HUD; do not obscure the silhouette when choices, feedback, or hints are available.
    - At tablet and mobile widths, collapse deliberately into the same one-column task order with no clipped primary controls, minimum touch targets, and no horizontal scrolling.
    - Make correctness, selected choices, hint-consumed state, score, and timer legible through text, borders, icons, and semantic color roles; remove routine celebration spectacle and nonessential movement.
    - _Requirements: 5.1–5.9, 6.1–6.8, 7.1–7.8, 8.2–8.8, 9.1–9.5, 11.3–11.6_

  - [x] 4.3 Update `app.js` screen, round, HUD, and hint rendering for the new composition
    - Continue to render Sprint’s timer and Practice’s reveal/advance path exactly as the Product_Baseline defines, while moving state updates to the new stage/panel elements.
    - Render icon-bearing control labels through safe DOM APIs, keep used-hint controls visibly and programmatically disabled, and remove `Particles.burst()` and `CelebrationText.show()` calls from correct-answer handling.
    - Preserve score, multiplier, streak, near-miss, choice, typed-answer, skip, and timer behavior; replace praise/emoji feedback with concise outcome-specific language.
    - _Requirements: 1.1–1.6, 2.5–2.7, 6.2–6.7, 7.1–7.4, 8.1–8.10, 9.2–9.5, 13.1–13.2_

- [x] 5. Harden screen transitions, keyboard answer flow, and asset failure recovery
  - [x] 5.1 Implement focus and hidden-state management in `app.js`
    - Update `showScreen`, feedback presentation, results presentation, quit confirmation, and return-home paths to set `aria-hidden`/inert state consistently and focus the new screen heading or its first required action.
    - Add an assertive/polite live outcome region that announces correct/incorrect results and scoring without unexpectedly moving focus, and restore focus when dialogs close.
    - _Requirements: 7.1–7.8, 8.1–8.8, 8.10_

  - [x] 5.2 Make the autocomplete and answer paths fully keyboard-operable in `app.js`
    - Implement combobox/listbox semantics and keyboard traversal for suggestions (Arrow keys, Enter selection, Escape dismissal, and return to the input); preserve pointer operation and avoid hover-only discovery.
    - Keep typed-answer submission, fallback-to-options, choices, hints, reveal, skip, and quit in logical visible-task order across all game states.
    - _Requirements: 6.4–6.6, 8.1–8.5, 8.8–8.10_

  - [x] 5.3 Integrate `asset-fallbacks.js` into `app.js` and `index.html` for resilient silhouette, flag, font, and artwork states
    - Reserve image space before loading, replace failed silhouette/flag images with the corresponding fallback UI, and expose retry, advance, and return-home recovery actions without saving a failed round to statistics.
    - Ensure a missing flag leaves the country name and outcome intact, remote landing assets are never essential, and the defined system-font stack keeps controls readable if custom fonts are unavailable.
    - _Requirements: 6.8, 7.3–7.4, 10.1–10.7, 11.2–11.6_

- [x] 6. Rework feedback and results into concise, information-first GeoWars states
  - [x] 6.1 Update feedback/results styling and `app.js` renderers for outcome-first hierarchy
    - Render “Correct” or “Incorrect” in text and an SVG status treatment before country information; show awarded points and resulting score change when applicable, then name, flag/fallback, region, and optional fact.
    - Remove emoji prefixes, routine praise, confetti, and celebratory overlays; reserve any static completion accent for a meaningful session outcome and keep it legible without motion or color alone.
    - Preserve Practice’s explicit next/results/home route and make replay the single dominant Results action, with Home visually secondary.
    - _Requirements: 2.4–2.7, 5.1–5.9, 7.1–7.8, 8.3–8.8, 9.1–9.5, 10.4–10.6_

- [ ] 7. Add automated regression, resilience, performance, and visual-QA coverage
  - [x] 7.1 Add `tests/game-layout-accessibility.html` for screen semantics and complete keyboard-flow regression
    - Assert visible screens expose the expected landmark/heading, hidden screens do not accept focus, icon controls have accessible names, focus moves at each screen/feedback transition, and one complete keyboard round returns to Landing.
    - _Requirements: 6.1–6.8, 7.1–7.8, 8.1–8.10, 12.5_

  - [x] 7.2 Add `tests/asset-resilience.html` to simulate failed silhouette, flag, and font resources
    - Assert reserved layout areas remain usable, no broken-image indicator remains player-facing, recovery actions do not mutate stored statistics, and fallback text maintains answer/feedback comprehension.
    - _Requirements: 10.1–10.7, 11.2–11.6_

  - [x] 7.3 Add `tests/performance-assertions.html` for layout-reservation and interaction acknowledgement budgets
    - Instrument largest above-fold landing content, cumulative layout shifts, and local-control visual acknowledgement; make the harness fail when measurements exceed Requirements 11.1–11.4 under the configured profile.
    - _Requirements: 11.1–11.6_

  - [x] 7.4 Add `tests/visual-qa-game-polish-10x.js` and state fixtures that capture required screen states
    - Drive Landing, unanswered stage, typed answer, choices, correct feedback, incorrect feedback, and Results at 1440×900, 1024×768, 768×1024, 390×844, 360×800, and 200% zoom at 1280/390 widths.
    - Assert no horizontal page overflow, clipped primary control, overlapping text, failed asset, or missing required control state; include reduced-motion variants for every motion-bearing state.
    - _Requirements: 3.1–3.7, 6.8, 7.1–7.8, 8.1–8.10, 9.1–9.5, 10.1–10.7, 12.1–12.8_

- [ ] 8. Checkpoint - Ensure all tests pass, ask the user if questions arise.

## Notes

- This is a planning-only revision; no product code was changed.
- Tasks marked with `*` are optional automated-test sub-tasks; all non-optional tasks are implementation work.
- The current design document’s Properties 1–15 describe the superseded audio, particle, praise-text, timer-ring, and dark-mode proposal. They are not traceable to the current requirements and several directly conflict with this plan, so no property-based test task claims to validate them. The optional tests above instead cover the applicable deterministic UI, accessibility, resilience, performance, and visual requirements.
- Existing working baseline modules (scoring, timers, near-miss acceptance, stats, and audio availability/muting) must be preserved unless a task above explicitly changes their presentation. No new sound-language work is planned.
- The plan deliberately uses local SVG and fallback code rather than DeepSeek branding, copy, assets, or visual treatment.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "3.2"] },
    { "id": 3, "tasks": ["2.3", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3"] },
    { "id": 5, "tasks": ["5.1"] },
    { "id": 6, "tasks": ["5.2"] },
    { "id": 7, "tasks": ["5.3"] },
    { "id": 8, "tasks": ["6.1"] },
    { "id": 9, "tasks": ["7.1", "7.2", "7.3", "7.4"] }
  ]
}
```
