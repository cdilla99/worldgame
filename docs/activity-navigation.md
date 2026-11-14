# Activity navigation

The initial screen contains Country Hunt and Shape Quiz cards. Both offer an
Explore path and a Challenge path. Explore opens the existing globe or shape
library without a timer. Challenge starts a 60-second game. Daily Puzzle remains
available above the cards as a compact calendar SVG button, with an accessible
Daily Puzzle name and hover/keyboard-focus tooltip.

Homepage action buttons show an open book for Explore and a controller for Challenge.
They use 48 by 44 pixel targets, retain explicit accessible names, and show the
action word on hover or keyboard focus. Small activity names remain visible to
identify each game without adding instructions.

A plain Sign in entry in the utility header opens the player chooser. Google is
an option inside that dialog. For an authenticated player the header shows their
name and opens their profile controls instead.

The EARTHLING logo returns home. Daily Puzzle omits the secondary back row and
visible puzzle-number caption. Its guidance shows distance, direction, whether
the latest guess is closer, and the closest guess so far.

The audience is geography enthusiasts and capable children. Keep copy factual
and brief. The globe and outlines lead the home screen, with small activity names
and compact Explore/Challenge buttons. Avoid promotional headlines and extra
onboarding explanations.

Visible copy is limited to actions, identifiers, rules, values, feedback, and
actionable errors. Do not add slogans, repeated headings, motivational sentences,
or descriptions of obvious controls. Keep essential accessible descriptions and
country facts. Use short, consistent labels that can be translated without idioms.

Difficulty and region are available through the Difficulty button inside an
active challenge. Its dialog pauses the timer. Cancel restores the prior
selection and resumes play; Apply and restart starts a fresh challenge. Country
Hunt uses the same canonical difficulty pools and region rules as Shape Quiz.
An empty combination cannot be applied.

Both challenge result screens offer the four difficulty levels for the next
run. The selection applies on replay, preserving the completed run's level and
stats. Unavailable levels for the current region are disabled. During active quizzes, the
flag stays behind a neutral cover until the player uses the hint or sees the
answer, so its colours and symbols cannot identify the country in advance.

The homepage Shape Quiz demo shows an outline for 2 seconds, then its flag and
country name for 4 seconds before advancing. A compact centred panel reveals the
flag and name with a short fade/scale animation and an 80% opaque dark background.
The layout stays fixed through both phases. Its timer runs only while at least
half the preview is visible and the tab is active. Reduced motion shows one
static outline, flag, and name.

The Country Hunt demo turns toward a readable country, highlights it for 2
seconds, then shows its flag and name for 4 seconds. The compact answer sits
at the globe's centre, matching Shape Quiz's reveal. Turns take the
shortest longitude route and allow more time for distant countries. It reuses
the existing country geometry and flag fallback; no new map service is used.
Its initial turn offsets the reveal from Shape Quiz. Motion pauses while less
than half the globe is visible or the tab is hidden. Reduced motion keeps one
highlighted country and answer still, including preference changes at runtime.

Globe reveal flags use intrinsic image proportions within fixed slots, so wide
and square flags remain complete. Nepal uses the bundled native pennant SVG
through the shared asset pipeline, with transparent surroundings, no rounded
clipping, and contain sizing across previews, Explore, quiz, and Daily views.

`activities.js` owns this navigation surface. It relocates the existing settings
controls and quiz preview instead of duplicating their IDs or engine state.
`atlas.js` still owns workspace and hunt transitions, including confirmation
before leaving an active hunt. Its prior APIs remain available. Untimed quiz
review also remains supported by the game engine.

`activities.css` scopes the current layout under `body.activity-navigation`.
The app has automatic side margins, previews scale with available width and
height, and short landscape screens use compact layouts. The globe preview's
ResizeObserver updates its drawing resolution when its display size changes.

Verification covers phone portrait and landscape, desktop up to 1920px,
keyboard navigation, reduced motion, profile switching, Google callbacks,
difficulty cancellation/restarts, and existing country-data rendering flows.
