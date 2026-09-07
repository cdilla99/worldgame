# Task 01: restore Shapes facts and navigation contrast

For Kiro. Execute this bounded task now; do not redesign the screen.

Read AGENTS.md and docs/earthling-design-brief.md. Confirm the actual branch and status before editing. Expected branch is earthling2. Existing local changes in atlas.js, atlas.css, index.html and tests/atlas-shapes.test.mjs must be preserved. If the branch differs, report it before changing branch or editing.

## Defects and investigation leads
1. Shapes displays its outline but the adjacent facts panel stays empty, including after manual Next. atlas.js renderSharedCard calls GeoWars.explorer.renderCountry. A text search of globe-explorer.js finds an internal renderCountryCard but no renderCountry method. Verify the exported API and initialization lifecycle; this is a lead, not a confirmed complete diagnosis.
2. Hovering the selected Shapes navigation button darkens its background while its text stays dark. Inspect atlas.css hover versus active selector specificity and any other matching styles.

## Implementation requirements
- Repair the shared country-card integration using the existing renderer and canonical data. Do not create a second facts renderer or duplicate data.
- Country selection in Shapes must update the visible name, capital, and available facts to match the outline, including automatic preview changes. Missing data must retain existing honest fallback behavior.
- Preserve economics integration and existing Globe selection behavior. Rendering Shapes facts must not unexpectedly rotate the Globe or enter a game.
- Repair selected and unselected navigation readability across default, hover, focus, and disabled states, keeping a clear active indication.
- Keep the change narrow. Do not change preview timing, introduce new feature behavior, restyle the page, or refactor unrelated code.

## Verify
- Fresh load -> Shapes without first selecting a Globe country shows facts.
- Previous, Next, and dropdown update matching facts; observe one automatic preview change as well.
- Shapes -> Globe -> Shapes restores panel ownership correctly without duplicate cards or IDs.
- Check the navigation hover and keyboard focus in both views.
- Inspect 1440 x 900 and 390 x 844. Capture screenshots outside tracked source files.
- Add focused regression coverage for the broken integration, exercising the real API contract rather than a mock that invents the missing method.
- Run node --check atlas.js, npm run typecheck, npm test, npm run build, npm run test:e2e, and git diff --check. Follow AGENTS.md for reproducible installation if installation is necessary. Separate pre-existing failures from introduced ones with evidence; do not expand scope to fix unrelated failures.

## Return and stop
No commit, push, merge, or deployment. Return at most 250 words plus screenshot paths: root cause, changed files, validation results, and unresolved issues. State browser checks not performed. Stop after this task; the user will bring the result to the coordinating Codex task for review.
