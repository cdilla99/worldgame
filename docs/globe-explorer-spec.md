# Globe Explorer â€” Product and Technical Specification

Status: Proposed
Decision: Feasible
Estimated complexity: Moderate (approximately 6/10)
Recommended delivery: Dedicated Explore mode, separate from the landing-page region selector

## 1. Executive summary

Globe Explorer lets a user rotate a globe and select an individual country with a mouse, finger, or stylus. Selecting a country highlights it and opens a concise information card containing its flag, name, capital, region, population, languages, currency, and one memorable fact.

The concept is feasible with the application's existing architecture. The current landing globe already:

- projects geographic polygons onto a rotating orthographic globe;
- distinguishes dragging from tapping;
- performs reliable pointer hit-testing through a hidden color-coded canvas;
- supports mouse, touch, stylus-compatible Pointer Events, and keyboard rotation;
- renders without a framework, CDN, or build step.

The primary technical change is moving from continent-grouped geometry to country-identified geometry. The canonical country dataset already contains 195 complete records and all information required for the first version of the country card.

Globe Explorer should be a dedicated product surface. Adding country selection directly to the compact landing globe would conflict with its current jobâ€”choosing a game regionâ€”and would make small countries difficult or impossible to target on mobile.

## 2. Product opportunity

### Current product role

The current game tests whether players can recognize country shapes. It is strongest for players who already possess some geography knowledge.

### New product role

Globe Explorer introduces a low-pressure learning and discovery mode:

1. Explore the world.
2. Select a country.
3. Learn its identity and a few memorable facts.
4. Continue exploring or enter Practice.
5. Recognize the country more easily when it appears in the game.

This turns the product from a single quiz loop into a learning system with both acquisition and recall.

### Expected value

- **Broader audience:** More welcoming to children, families, classrooms, and beginners.
- **Better onboarding:** Users can understand the globe and country content before facing a timed challenge.
- **More session depth:** Exploration provides a reason to remain in the application after a run.
- **Stronger educational positioning:** The app becomes useful for learning as well as assessment.
- **Content discoverability:** Existing capitals, languages, currencies, landmarks, neighbors, and facts become reusable product content.
- **Retention opportunities:** Future extensions could include saved countries, recently explored countries, collections, and daily discovery.
- **Brand differentiation:** The interactive globe becomes a functional product signature rather than decorative artwork.

### Product risk

The explorer must not weaken the primary game proposition. It should be presented as a clear secondary pathâ€”â€œExplore the globeâ€â€”while â€œStart sprintâ€ remains the dominant landing-page action.

## 3. Goals

1. Let users select a country directly from a rotatable globe.
2. Return visible feedback within 100 milliseconds of a completed selection on supported devices.
3. Present a concise, readable country summary without leaving the explorer.
4. Support mouse, touch, pen/stylus, and keyboard-accessible alternatives.
5. Work on desktop and mobile without requiring precise taps on tiny polygons.
6. Reuse the canonical 195-country dataset without duplicating country facts.
7. Keep country geometry out of the initial landing-page payload until Explore is opened.
8. Preserve the existing region-selection and game behavior.

## 4. Non-goals for the first release

- Satellite imagery, terrain, elevation, weather, or street-level photography.
- Real-time population or political data.
- Spoken narration or country-name pronunciation.
- A fully free-roaming 3D engine with perspective camera controls.
- Editing borders or representing every disputed territorial claim.
- Scoring exploration as a game.
- Replacing Sprint or Practice.
- Making every microstate selectable as a literal polygon at the globe's default scale.

Spoken narration, pronunciation, collections, achievements, and classroom modes are reasonable later phases.

## 5. Recommended experience

### Entry point

Add a secondary landing-page action labeled **Explore the globe**. It should be visually subordinate to **Start sprint** but more prominent than settings or statistics.

Selecting the globe on the landing page should continue to choose a game region. It should not silently change into a country explorer.

### Explorer screen

#### Desktop

- Large globe occupying approximately 60â€“65% of the available width.
- Country information panel occupying approximately 35â€“40%.
- Search control above or beside the globe.
- Persistent â€œBack to homeâ€ and â€œStart practiceâ€ actions.

#### Mobile

- Globe uses the full content width and at least 320 CSS pixels when space permits.
- Country information opens in a bottom sheet beneath or over the lower portion of the globe.
- The sheet supports collapsed and expanded states.
- Search remains reachable without covering the selected country.

### Empty state

Instruction: **Drag to explore. Select a country to learn more.**

Do not present a large empty information card before the first selection.

### Country selection

1. Pointer movement may show a subtle hover outline on devices that support hover.
2. A tap/click that moves fewer than the drag threshold selects the country under the pointer.
3. The selected country receives a persistent highlight and boundary treatment.
4. The globe may gently center the selected country unless reduced motion is enabled.
5. The country information card updates immediately.
6. Selecting ocean clears hover but does not clear the last deliberate country selection.

### Country information card

The collapsed/default card should contain:

- flag;
- country name;
- capital;
- continent and subregion;
- population;
- primary language or languages;
- currency;
- one memorable fact.

Expanded details may contain:

- area;
- neighboring countries;
- hemisphere;
- coastline type;
- one landmark;
- additional facts.

The first card should remain concise. The explorer should feel responsive and browsable, not like reading a database record.

### Product connections

Initial release:

- **Start practice** uses the currently selected countryâ€™s continent as the Practice filter.
- **Explore another country** returns focus to the globe/search control.

Future release:

- **Practice this country** adds the selected country to a review queue.
- **Save country** adds it to a personal collection.
- **Compare** places two countries side by side.

## 6. Interaction requirements

### Pointer, touch, and stylus

- Use Pointer Events so mouse, touch, and pen share one interaction path.
- Preserve the existing distinction between a tap and a drag.
- A selection must occur on pointer release, not pointer down.
- Pinch zoom should be supported on touch devices in the polished release.
- Mouse-wheel zoom should require pointer presence over the globe and must not unexpectedly trap page scrolling.
- Double tap/click may zoom toward a country.

### Small-country handling

Natural Earth 1:110m geometry is not sufficient for reliable selection of every microstate and island. The explorer must use one or more of:

1. Natural Earth 1:50m country geometry, simplified for the application.
2. A minimum interactive target of approximately 10â€“14 CSS pixels.
3. Point markers for countries whose visible polygon is below the target threshold.
4. Automatic zoom when a dense area is selected.
5. A short nearby-country chooser when multiple microstates share a target area.
6. Search as an equal, fully supported selection path.

The visual country shape and the interactive hit area may differ, but the enlarged target must not visually misrepresent the border.

### Search

- Search all 195 canonical country names.
- Reuse the existing accessible autocomplete behavior.
- Selecting a search result rotates/zooms the globe to the country and opens its card.
- Search is the primary accessibility fallback and the most reliable path to microstates.

### Keyboard and assistive technology

A canvas alone is not an accessible country picker. The feature must provide:

- arrow-key globe rotation;
- Enter/Space activation for the centered or focused country;
- a searchable combobox with the same 195 countries;
- a synchronized country list or logical next/previous-country controls;
- an `aria-live` announcement such as â€œJapan selected. Capital: Tokyoâ€;
- visible focus states;
- non-color selection indicators;
- reduced-motion behavior;
- country-card headings and facts exposed as normal semantic HTML.

## 7. Technical design

### Recommended architecture

Retain the current event-driven Canvas 2D renderer and orthographic projection for the first release. A WebGL globe or mapping framework is not required for 195 countries and would add dependency, bundle, maintenance, and accessibility costs.

Create a separate explorer controller rather than expanding the landing globe into two modes.

Suggested boundaries:

- `globe-explorer.js`: screen state, interaction, rendering, and selection.
- `assets/globe-countries.js`: simplified geometry keyed by canonical country ID.
- canonical `data/countries.js`: the only source for names and country facts.
- explorer HTML/CSS: semantic information panel, search, and responsive layout.

These filenames are illustrative and are not implementation requirements.

### Geometry asset

The current globe asset is approximately 65 KB and groups Natural Earth polygons into six continent arrays. Country identity was intentionally discarded during generation.

The explorer geometry asset should retain:

- canonical country ID;
- ISO alpha-2 or alpha-3 identifier for source matching and diagnostics;
- one or more polygon rings;
- label/center coordinates;
- continent;
- optional small-country marker coordinates;
- optional bounding box or approximate projected area.

The production asset should be generated offline from a pinned Natural Earth Admin 0 dataset. Runtime code must not download source GeoJSON.

### Canonical country mapping

Geometry must join to country facts through the canonical numeric country ID. Name-based runtime matching is too fragile because geographic sources and the product use different names for countries such as:

- United States / United States of America;
- Russia / Russian Federation;
- Czechia / Czech Republic;
- Ivory Coast / CÃ´te dâ€™Ivoire;
- Democratic Republic of the Congo;
- Palestine;
- Taiwan;
- Kosovo.

The offline generation process should contain an explicit, reviewed source-name-to-country-ID mapping. It should fail if geometry is unmapped or mapped more than once.

### Hit-testing

Extend the proven hidden-canvas technique:

1. Assign every selectable country a unique RGB color derived from its canonical ID.
2. Draw visible country polygons on the main canvas.
3. Draw the same polygons with flat unique colors on an offscreen hit canvas.
4. Read the pixel under the released pointer.
5. Translate RGB to canonical country ID.
6. Apply enlarged marker hit areas for small countries after polygon hit-testing.

This approach avoids expensive point-in-polygon calculations on every pointer movement and matches the existing renderer.

### State

Minimum explorer state:

- longitude;
- latitude;
- zoom;
- hovered country ID;
- selected country ID;
- pointer/drag state;
- reduced-motion preference;
- information-card expansion state;
- geometry load state/error.

Explorer state must not mutate active game score, round, timer, filters, or statistics.

### Loading and performance

- Keep the existing continent geometry for the landing page.
- Load country-level geometry only after the user enters Explore.
- Display the static globe or a lightweight loading state while geometry initializes.
- Generate simplified coordinates offline and cap device-pixel ratio as the existing globe does.
- Redraw only after interaction, resize, selection, or animationâ€”not continuously.
- Target under 150 KB compressed for the first country-geometry payload where practical.
- Cache the generated asset using the application's existing static-asset strategy.

### Flags

The first version can use the existing flag pipeline and text fallback. For a fully offline educational experience, local or cached flag assets should be evaluated separately because the current visual flag source may require the Flag CDN.

## 8. Data requirements

The existing canonical dataset already contains 195 records with complete values for:

- name;
- flag;
- capital;
- continent and subregion;
- population hint;
- area hint;
- hemisphere;
- coastline type;
- neighbors;
- languages;
- currency;
- landmarks;
- facts and clues.

No new content schema is required for the first explorer release.

Before release, content should receive an editorial review for:

- current country names and capitals;
- population wording and age;
- territorial and political sensitivity;
- consistent diacritics and encoding;
- age-appropriate facts;
- flag correctness;
- language and currency changes.

## 9. Error and edge-case behavior

- Geometry load failure: retain search and country cards; show â€œThe interactive globe is unavailable. Search for a country instead.â€
- Flag failure: retain country name and facts with the existing text fallback.
- Ocean selection: no destructive state change.
- Overlapping small-country targets: open a nearby-country chooser.
- Reduced motion: center immediately without animated rotation.
- Offline mode: country facts and geometry remain available; remote flag imagery falls back safely.
- Resize/orientation change: preserve selected country and rotation.
- Rapid selections: latest selection wins; stale animations are cancelled.

## 10. Analytics and success measures

Recommended privacy-conscious events:

- `explorer_opened`;
- `country_selected` with country ID and input method;
- `country_searched`;
- `country_details_expanded`;
- `explorer_practice_started`;
- `explorer_load_failed`.

Initial product measures:

- percentage of visitors opening Explore;
- countries selected per explorer session;
- percentage moving from Explore into Practice;
- repeat explorer sessions;
- reduction in immediate landing-page exits;
- improvement in Practice completion among users who explored first.

Do not collect raw pointer paths or unnecessary location/device identifiers.

## 11. Testing strategy

### Data and geometry

- Every geometry record maps to exactly one canonical country.
- Every canonical country is selectable by polygon, marker, or search.
- No country ID is duplicated.
- Country-card fields always come from the canonical dataset.
- The generated geometry asset is deterministic from its pinned source and mapping.

### Interaction

- Tap selects; drag rotates without accidental selection.
- Hover and selection survive redraws.
- Mouse, touch, and pen follow equivalent paths.
- Search selection centers and opens the correct country.
- Tiny countries remain selectable through a documented fallback.
- Resize and orientation changes preserve state.

### Accessibility

- Complete selection is possible without the canvas.
- Focus order is logical on desktop and mobile.
- Screen readers announce the selected country and core facts.
- Selection is recognizable without color.
- Reduced motion prevents animated centering.

### Regression

- Landing globe still selects regions.
- Worldwide remains the default game scope.
- Sprint and Practice behavior are unchanged.
- Explorer activity does not modify scores or statistics.
- Existing country-data integrity and asset-recovery tests continue to pass.

## 12. Acceptance criteria

The first release is complete when:

1. A user can open Explore from the home page.
2. A user can rotate the globe using mouse, touch, or pen.
3. A tap/click on a supported country highlights it and shows the matching name and flag.
4. The country card shows capital, region, population, languages, currency, and one fact.
5. All 195 countries are reachable through geometry, a small-country target, or search.
6. Search selection centers the correct country.
7. The experience works at representative 390 px mobile and 1440 px desktop viewports.
8. Keyboard and screen-reader users can select any country without relying on canvas hit-testing.
9. Reduced-motion behavior is respected.
10. Explorer geometry can fail without blocking country search or the main game.
11. The explorer does not change game filters, score, timer, rounds, or stored records.
12. Automated data, interaction, accessibility, and regression checks pass.

## 13. Delivery estimate

For one experienced front-end engineer familiar with the project:

### Proof of concept: 1â€“3 days

- country-keyed sample geometry;
- click/tap selection;
- basic country card;
- desktop only;
- no microstate, accessibility, or production-quality data pipeline.

### Polished MVP: approximately 2â€“4 weeks

- pinned geometry generation and canonical ID mapping;
- complete country rendering and hit-testing;
- zoom and small-country strategy;
- responsive desktop/mobile explorer;
- search and semantic country card;
- accessibility alternatives;
- fallback and loading states;
- automated tests and cross-device QA.

### Enhanced educational release: approximately 4â€“7 weeks total

- spoken country names and narration;
- local/offline flags;
- review queues or saved countries;
- achievements and progression;
- classroom-oriented controls;
- deeper editorial and internationalization review.

The largest uncertainty is not drawing the globe. It is making all 195 countries reliably selectable and accessibleâ€”especially microstates and island nationsâ€”without compromising geographic integrity or mobile usability.

## 14. Recommendation

Proceed with a small interaction prototype before committing to the polished MVP. The prototype should validate:

1. country-level geometry size;
2. country ID mapping;
3. tap accuracy on a 390 px device;
4. microstate targeting;
5. the mobile bottom-sheet interaction;
6. performance on a mid-range phone.

If those tests meet the acceptance thresholds, the feature is a strong strategic addition. It directly reinforces the gameâ€™s core learning mechanic, reuses the existing content investment, and gives the interactive globe a meaningful role beyond selecting a region.
