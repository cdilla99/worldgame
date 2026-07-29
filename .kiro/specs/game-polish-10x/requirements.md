# Requirements Document

## Introduction

This specification defines an elite visual and user-experience redesign of the current geography game before further sound work. The redesign shall replace the existing narrow, decoration-led presentation with a decisive branded product experience that uses desktop space intentionally and remains complete on mobile. The product should feel confident, focused, and energetic rather than cute.

The implemented application is the functional baseline: a single-player country-silhouette quiz with Sprint and Practice modes, difficulty filtering, typed and multiple-choice answers, hints, scoring, streaks, local statistics, feedback, and results. README descriptions of pass-and-play multiplayer, player setup, question limits, and race-to-points gameplay are legacy descriptions and are not part of this redesign baseline.

Generic confetti, emoji-led praise, generic gradients, and dark mode do not constitute acceptance evidence for this milestone. Existing useful behavior may remain, but decoration shall support hierarchy, comprehension, and game state rather than substitute for product identity. Sound design is a separate subsequent milestone; this document records only the intended future sound direction.

## Glossary

- **Product_Experience**: The complete player-facing geography game across landing, game, feedback, and results screens.
- **Product_Baseline**: The gameplay behavior confirmed in the current `index.html`, `app.js`, and supporting files.
- **Brand_System**: The approved product name, wordmark or mark direction, visual principles, and rules that make the product identifiable across screens.
- **Design_System**: The shared typography, spacing, color, iconography, artwork, control, and surface rules used by the Product_Experience.
- **Landing_Experience**: The initial screen containing product identity, product proposition, mode selection, difficulty selection, player statistics, and the primary action.
- **Desktop_Composition**: A landing layout for viewports at least 1024 CSS pixels wide that organizes content into intentional spatial regions rather than placing the entire experience in a permanent phone-width column.
- **Mobile_Composition**: A landing layout for viewports below 768 CSS pixels wide that preserves hierarchy, content, and operability without horizontal scrolling.
- **Primary_Action**: The single visually dominant control that starts a game using the currently selected mode and difficulty.
- **Game_Screen**: The active-round interface containing the country silhouette, score, streak, timer when applicable, answer paths, hints, and quit control.
- **Feedback_State**: The post-answer or reveal presentation that communicates outcome, country identity, earned points when applicable, and supporting country information.
- **Results_Screen**: The end-of-session presentation containing score, best streak, answer accuracy, replay, and return-home actions.
- **Core_Gameplay**: Sprint mode, Practice mode, difficulty filtering, silhouette prompts, typed answers, multiple-choice answers, flag and region hints, scoring multipliers, streak tracking, session results, and locally stored aggregate statistics.
- **Representative_Viewports**: 1440×900, 1024×768, 768×1024, 390×844, and 360×800 CSS pixels at 100% browser zoom.
- **Reduced_Motion_Mode**: The presentation used when the operating system reports `prefers-reduced-motion: reduce`.
- **Essential_Asset**: A silhouette, flag, icon, font, or artwork required to understand the current screen or complete the current interaction.
- **Fallback_Asset**: A local or embedded substitute that preserves meaning and layout when a remote asset cannot load.
- **Performance_Profile**: A cold-cache browser run using a mid-range mobile device profile, four-times CPU slowdown, and simulated slow 4G networking.
- **Visual_QA**: A documented review of every Representative_Viewport covering layout, hierarchy, assets, interaction states, and accessibility states.
- **Sound_Milestone**: A future, separately approved body of work for the product sound language and audio interactions.

## Requirements

### Requirement 1: Authoritative Product Baseline

**User Story:** As a product owner, I want the redesign grounded in the game that exists, so that visual work preserves useful functionality and does not revive obsolete concepts.

#### Acceptance Criteria

1. THE Product_Baseline SHALL define the current product as a single-player country-silhouette quiz.
2. THE Product_Baseline SHALL include Sprint mode with a 60-second session.
3. THE Product_Baseline SHALL include Practice mode with untimed answer reveal and round advancement.
4. THE Product_Experience SHALL preserve Core_Gameplay through the visual redesign.
5. WHEN README content conflicts with implemented gameplay, THE Product_Baseline SHALL use behavior confirmed in the current application files as the redesign authority.
6. THE Product_Baseline SHALL classify pass-and-play multiplayer, player-name setup, clue-giver turns, ten-question rounds, and race-to-points mode as outside the current redesign scope.
7. THE Product_Experience SHALL use one player-facing product name consistently across browser title, landing screen, game screen, and results screen.

### Requirement 2: Distinctive Product Identity

**User Story:** As a player, I want a memorable and credible product identity, so that the game feels authored rather than assembled from generic interface trends.

#### Acceptance Criteria

1. THE Brand_System SHALL define one approved Product_Name and one corresponding mark or wordmark direction before final visual acceptance.
2. THE Brand_System SHALL define visual principles that communicate geographic competition, speed, knowledge, or discovery without relying on generic game decoration.
3. THE Landing_Experience SHALL present the approved product identity within the first visible viewport at every Representative_Viewport.
4. THE Product_Experience SHALL apply the approved product identity consistently to the Landing_Experience, Game_Screen, Feedback_State, and Results_Screen.
5. THE Brand_System SHALL use concise, confident player-facing language without diminutive, childish, or praise-pool phrasing.
6. THE Product_Experience SHALL use text or purpose-built icons rather than emoji as the sole label for an action.
7. THE Product_Experience SHALL reserve celebratory decoration for communicating a meaningful game outcome.

### Requirement 3: Responsive Desktop-First Landing Composition

**User Story:** As a desktop player, I want the landing screen to use the available display area intentionally, so that the product does not look like a phone interface floating in a computer browser.

#### Acceptance Criteria

1. WHILE the viewport width is at least 1024 CSS pixels, THE Landing_Experience SHALL use a Desktop_Composition.
2. WHILE the viewport width is at least 1024 CSS pixels, THE Desktop_Composition SHALL present the product proposition and game setup as distinct but visually related regions.
3. WHILE the viewport width is at least 1024 CSS pixels, THE Desktop_Composition SHALL keep the Primary_Action visible without vertical scrolling at 1024×768 and 1440×900.
4. WHILE the viewport width is below 768 CSS pixels, THE Landing_Experience SHALL use a Mobile_Composition.
5. THE Landing_Experience SHALL preserve all required setup choices at every Representative_Viewport.
6. THE Landing_Experience SHALL render without horizontal page scrolling at every Representative_Viewport.
7. WHEN the viewport changes between Representative_Viewports, THE Landing_Experience SHALL preserve reading order and control relationships.

### Requirement 4: Clear Hierarchy and Start Flow

**User Story:** As a new player, I want to understand the game and start with confidence, so that setup requires no trial and error.

#### Acceptance Criteria

1. THE Landing_Experience SHALL communicate the silhouette-guessing objective before secondary statistics or supporting details in visual and document order.
2. THE Landing_Experience SHALL present exactly one Primary_Action as the dominant action after game settings.
3. THE Landing_Experience SHALL distinguish the Primary_Action from mode choices, difficulty choices, and statistics through at least two non-motion visual cues.
4. WHEN a player changes the mode, THE Landing_Experience SHALL display the selected mode before game start.
5. WHEN a player changes the difficulty, THE Landing_Experience SHALL display the selected difficulty before game start.
6. WHEN the player invokes the Primary_Action, THE Product_Experience SHALL start a session using the displayed mode and difficulty.
7. WHEN the Landing_Experience first loads, THE Landing_Experience SHALL provide valid default selections for mode and difficulty.
8. THE Landing_Experience SHALL describe the timing and answer behavior of each mode before selection.

### Requirement 5: Intentional Visual Language

**User Story:** As a player, I want every visual choice to feel deliberate, so that the interface has premium clarity and a coherent point of view.

#### Acceptance Criteria

1. THE Design_System SHALL define named roles for display text, headings, body text, labels, numeric game data, and control text.
2. THE Design_System SHALL define a spacing scale used for screen margins, section gaps, control groups, and component interiors.
3. THE Design_System SHALL define semantic color roles for background, surface, primary action, text, muted text, success, error, warning, and focus.
4. THE Design_System SHALL provide a consistent icon style for navigation, hints, status, and utility actions.
5. THE Design_System SHALL define an artwork direction that supports country-shape recognition and the approved Brand_System.
6. THE Product_Experience SHALL use gradients only when a gradient communicates depth, focus, state, or brand identity defined by the Design_System.
7. THE Product_Experience SHALL maintain a minimum 4.5:1 contrast ratio for body text and control labels.
8. THE Product_Experience SHALL maintain a minimum 3:1 contrast ratio for large text, component boundaries, and focus indicators.
9. THE Product_Experience SHALL preserve information meaning without requiring color perception alone.

### Requirement 6: Cohesive Game Screen

**User Story:** As a player in an active round, I want the prompt and answer choices to dominate the screen, so that I can act quickly without searching the interface.

#### Acceptance Criteria

1. THE Game_Screen SHALL make the country silhouette the primary visual focus of each unanswered round.
2. THE Game_Screen SHALL group score, streak, timer, and quit controls separately from answer actions and hints.
3. THE Game_Screen SHALL show the timer only during a timed mode.
4. WHEN the player chooses the typed-answer path, THE Game_Screen SHALL expose the text field, submission action, and fallback-to-options action as one interaction group.
5. WHEN the player chooses the multiple-choice path, THE Game_Screen SHALL expose all available choices without obscuring the silhouette.
6. WHEN a hint has been used, THE Game_Screen SHALL expose the revealed information and the consumed state of the corresponding hint control.
7. THE Game_Screen SHALL maintain the same Design_System and Brand_System as the Landing_Experience.
8. THE Game_Screen SHALL render without clipped primary controls or horizontal page scrolling at every Representative_Viewport.

### Requirement 7: Cohesive Feedback and Results

**User Story:** As a player, I want feedback and results to be immediate and informative, so that I understand the outcome and know what to do next.

#### Acceptance Criteria

1. WHEN an answer is evaluated, THE Feedback_State SHALL identify the answer as correct or incorrect before presenting supporting country information.
2. WHEN points are awarded, THE Feedback_State SHALL display the awarded point value and resulting score change.
3. WHEN an answer is revealed, THE Feedback_State SHALL display the country name and flag when a flag is available.
4. THE Feedback_State SHALL distinguish correctness without relying on color, sound, or motion alone.
5. WHEN a timed session ends, THE Results_Screen SHALL display score, best streak, and correct-answer count relative to attempted rounds.
6. WHEN a player completes Practice mode, THE Product_Experience SHALL provide an explicit route to the Results_Screen or Landing_Experience.
7. THE Results_Screen SHALL make replay the primary action and return-home the secondary action.
8. THE Feedback_State and Results_Screen SHALL use the same typography, color roles, iconography, and surface language as the Game_Screen.

### Requirement 8: Keyboard, Focus, and Touch Accessibility

**User Story:** As a player using a keyboard, touch device, or assistive technology, I want every game action to remain perceivable and operable, so that input method does not block play.

#### Acceptance Criteria

1. THE Product_Experience SHALL make every interactive control operable with a keyboard.
2. WHEN an interactive control receives keyboard focus, THE Product_Experience SHALL display a focus indicator with at least 3:1 contrast against adjacent colors.
3. THE Product_Experience SHALL maintain a logical focus order that follows the visible task sequence on each screen.
4. WHEN the Product_Experience opens a new screen or Feedback_State, THE Product_Experience SHALL move focus to the new screen heading or the first required action.
5. WHEN dynamic answer feedback appears, THE Product_Experience SHALL expose the outcome to assistive technology without requiring focus movement.
6. THE Product_Experience SHALL provide an accessible name for every icon-only control.
7. THE Product_Experience SHALL provide touch targets measuring at least 44×44 CSS pixels for primary game and navigation controls.
8. THE Product_Experience SHALL complete all gameplay paths without hover-only information or hover-only actions.
9. WHEN autocomplete suggestions are visible, THE Product_Experience SHALL support keyboard traversal, selection, dismissal, and return to the answer field.
10. THE Product_Experience SHALL prevent keyboard focus from entering hidden screens or hidden controls.

### Requirement 9: Motion and Feedback Restraint

**User Story:** As a motion-sensitive player, I want state changes to remain understandable without animated spectacle, so that the game is comfortable and focused.

#### Acceptance Criteria

1. WHEN Reduced_Motion_Mode is active, THE Product_Experience SHALL remove non-essential translation, scaling, rotation, parallax, particle, and confetti motion.
2. WHEN Reduced_Motion_Mode is active, THE Product_Experience SHALL preserve immediate non-motion feedback for navigation, selection, correctness, scoring, and completion.
3. THE Product_Experience SHALL use motion only to explain hierarchy, continuity, direct manipulation, or game-state change.
4. THE Product_Experience SHALL avoid continuous decorative animation on the Landing_Experience and Game_Screen.
5. WHEN a repeated game event occurs, THE Product_Experience SHALL keep the event feedback legible without stacking overlapping praise text or decorative effects.

### Requirement 10: Asset Resilience

**User Story:** As a player on an unreliable connection, I want the interface and game flow to survive asset failures, so that a missing remote file does not produce a broken or confusing screen.

#### Acceptance Criteria

1. THE Landing_Experience SHALL render its brand identity, proposition, settings, and Primary_Action without requiring a remote Essential_Asset.
2. WHEN a remote Essential_Asset fails to load, THE Product_Experience SHALL display a Fallback_Asset or an equivalent text-based presentation in the reserved layout area.
3. WHEN a country silhouette fails to load, THE Game_Screen SHALL provide a recoverable action that advances, retries, or returns home without affecting stored statistics.
4. WHEN a country flag fails to load, THE Feedback_State SHALL preserve the country name and answer outcome.
5. WHEN a custom font fails to load, THE Product_Experience SHALL use a defined fallback font stack without clipping controls or hiding content.
6. WHEN any remote asset fails to load, THE Product_Experience SHALL avoid displaying a broken-image indicator as the final player-facing state.
7. THE Product_Experience SHALL document the source and fallback strategy for every remote Essential_Asset used by an accepted screen.

### Requirement 11: Performance and Interaction Responsiveness

**User Story:** As a player on a mid-range device, I want the game to become usable promptly and respond immediately, so that visual polish does not make play feel heavy.

#### Acceptance Criteria

1. WHILE tested under the Performance_Profile, THE Landing_Experience SHALL render its largest above-the-fold content element within 3.5 seconds of navigation start.
2. WHILE tested under the Performance_Profile, THE Product_Experience SHALL limit cumulative unexpected layout movement to a score of 0.1 or less during initial load.
3. WHEN a player invokes a local control after initial load, THE Product_Experience SHALL present visual acknowledgement within 200 milliseconds.
4. THE Product_Experience SHALL reserve layout space for delayed images and artwork before those assets complete loading.
5. THE Product_Experience SHALL avoid loading an asset on a screen where the asset is not displayed or required for the next player action.
6. THE Product_Experience SHALL preserve answer input and timer updates while non-essential artwork or feedback assets are loading.

### Requirement 12: Representative Visual Quality Assurance

**User Story:** As a product owner, I want repeatable visual review across representative screens and states, so that premium quality is demonstrated rather than assumed.

#### Acceptance Criteria

1. THE Visual_QA SHALL capture the Landing_Experience, unanswered Game_Screen, typed-answer state, multiple-choice state, correct Feedback_State, incorrect Feedback_State, and Results_Screen at every Representative_Viewport.
2. THE Visual_QA SHALL verify that each captured state has no overlapping text, clipped content, unintended horizontal scrolling, broken assets, or unreachable primary actions.
3. THE Visual_QA SHALL verify default, hover where supported, focus-visible, active, selected, disabled, loading, success, and error states for applicable controls.
4. THE Visual_QA SHALL verify the Product_Experience at 200% browser zoom at viewport widths of 1280 and 390 CSS pixels.
5. THE Visual_QA SHALL verify the complete keyboard path from Landing_Experience through one answered round and return to the Landing_Experience.
6. THE Visual_QA SHALL verify each motion-bearing state with Reduced_Motion_Mode active.
7. WHEN Visual_QA identifies a severity-one issue that blocks game start, answer submission, feedback comprehension, replay, or return home, THE Product_Experience SHALL remain unaccepted until the issue is resolved.
8. WHEN Visual_QA identifies a brand, hierarchy, spacing, typography, color, iconography, or artwork inconsistency, THE Visual_QA SHALL record the affected state and Representative_Viewport for correction.

### Requirement 13: Deferred Sound Milestone Direction

**User Story:** As a future player, I want an assertive and original sound language, so that audio reinforces the product identity without making the game feel cute or derivative.

#### Acceptance Criteria

1. THE Product_Experience SHALL treat new sound-language development as outside the visual redesign milestone.
2. THE Product_Experience SHALL remain fully operable when audio is unavailable, muted, suspended, or blocked by the browser.
3. WHERE the Sound_Milestone is approved, THE Sound_Milestone SHALL use Web Audio synthesis as the primary sound-generation method.
4. WHERE the Sound_Milestone is approved, THE Sound_Milestone SHALL define an assertive sound language inspired by the energy and technical constraints of 1980s and 1990s arcade and console games.
5. WHERE the Sound_Milestone is approved, THE Sound_Milestone SHALL use original melodies, rhythms, timbres, and effect sequences.
6. WHERE the Sound_Milestone is approved, THE Sound_Milestone SHALL exclude reproductions or close imitations of identifiable copyrighted music, jingles, or sound effects.
7. WHERE the Sound_Milestone is approved, THE Sound_Milestone SHALL avoid toy-like, novelty, whimsical, or cute sonic treatment.
8. WHERE the Sound_Milestone is approved, THE Sound_Milestone SHALL map distinct sound cues to selection, confirmation, correct answer, incorrect answer, urgency, streak, and session completion states.
9. WHERE the Sound_Milestone is approved, THE Sound_Milestone SHALL provide player controls for muting and output level.
