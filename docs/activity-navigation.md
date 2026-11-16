# Activity navigation

The initial screen contains Country Hunt and Shape Quiz cards. Both offer a
Practise path and a Play path. Practise opens the existing globe or shape
library without a timer. Play starts a 60-second game, without duration badges
on the launch buttons.
A compact shared settings row above both cards shows labeled
Difficulty and Region controls. These shared settings apply to both games.
New players default to Auto, with “Adjusts as you play.” shown in settings.
Auto offers four answer choices and uses the easiest available countries until
the player has four correct answers, then adapts using their learning progress.
Returning players retain their saved difficulty and region on every screen size.
Each control opens a compact picker showing only its own choices, focused on
the selected value. Selecting an option applies it and closes the picker.
The X, Escape, and backdrop dismiss without changes and return focus to the
opening control. Home selections do not start a game. During play the timer
pauses; changing the selection restarts the game, while dismissal or selecting
the current value resumes it. Daily
challenge remains available above the cards with a calendar icon and visible label.

The shared placement follows the compact difficulty selector beside the puzzle
collection in [Google Arts & Culture](https://mobbin.com/screens/9414f65f-fef5-41e7-88aa-cbc55f64816c).
Detailed choices remain in a focused picker, comparable to the difficulty choices within
[Abode trivia setup](https://mobbin.com/screens/a327db81-ca41-4554-8bca-302a0679926f).
These are design references; the placement decision also reflects EARTHLING's
single shared setting and mobile viewport checks.

Homepage action buttons show an open book for Practise and a controller for Play.
They retain targets at least 44 pixels high, explicit accessible names, and
visible action labels on touch and keyboard. Play uses orange in both cards;
Practise uses a quiet outlined treatment. Small activity names remain visible to
identify each game without adding instructions.

The atlas visual direction uses Inter headings, warm-white text and outlines,
forest-green surfaces, and matching quiet card borders. The orange wordmark and
primary Play buttons remain. Daily challenge uses the same orange treatment as
Play; preview artwork has no decorative glow.

A muted home-only footer credits Collin-Edward Dillon and links to his LinkedIn
profile alongside Privacy. The creator link opens in a new tab; Privacy opens a
closable in-app dialog. Both links have visible keyboard focus. The footer stays
with the activity home, outside active gameplay.

Quiz feedback exposes Next country in timed and untimed play. Timed feedback
continues automatically after three seconds if untouched. Interacting with
Country facts cancels that timeout and leaves the game clock paused until the
player continues. Feedback retains the exact question outline beside the answer,
without duplicate element IDs. Facts and other interactive controls keep their native pointer
and keyboard actions; they do not trigger the panel's continue shortcut.

A plain Sign in entry in the utility header opens the player chooser. Google is
an option inside that dialog. For an authenticated player the header shows their
name and opens their profile controls instead.

The chooser places Google's official Continue with Google button above the
device-player list and nickname form. A separate neutral retry action appears
only if the provider button cannot load. It is hidden during loading and once
the official button is ready; failed credential verification leaves the official
button available to try again. The modal opens with its heading focused, without
opening the phone keyboard, and keeps the title/close row visible while scrolling.
This separates provider sign-in from the local alternative, as in the
[Skillshare sign-in reference](https://mobbin.com/screens/2c5dbeb5-3ea3-4e37-89d0-3851ceab244f).

The EARTHLING logo returns home. Daily Puzzle omits the secondary back row and
visible puzzle-number caption. Its guidance shows distance, direction, whether
the latest guess is closer, and the closest guess so far.

The audience is geography enthusiasts and capable children. Keep copy factual
and brief. The globe and outlines lead the home screen, with small activity names
and compact Practise/Play buttons. Avoid promotional headlines and extra
onboarding explanations.

Visible copy is limited to actions, identifiers, rules, values, feedback, and
actionable errors. Do not add slogans, repeated headings, motivational sentences,
or descriptions of obvious controls. Keep essential accessible descriptions and
country facts. Use short, consistent labels that can be translated without idioms.

Home actions provide a brief synthesized tap sound on trusted clicks and native
keyboard activation. Hover, focus, startup, and programmatic clicks are silent.
Play retains its existing round-start cue without an extra tap sound. The player
menu's Sound effects switch shares the game's mute preference and remembers it
on this device. Music remains separate and starts only when explicitly requested;
starting a game does not start a music download.

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
The same intrinsic sizing applies to every flag, including square Swiss and
Vatican flags and Qatar's wide flag. Flag images have sharp corners; a neutral
layout slot must not crop or recolour their edges. The hidden quiz hint retains
its cover until reveal. Remote fallback artwork must preserve original
proportions; standardized 4:3 icon variants are not used.

Result screens put Replay and Home directly after the completed score, before
next-game difficulty and answer history. Country Hunt hides its globe while
results are visible and focuses the results heading; Home returns to the activity
home. Starting or practising another Hunt restores the globe.

The Daily attempt badge counts the next attempt while playing and the actual
number of guesses after completion. Home shows Solved or Completed with the
guess count, retaining the result link. Completion survives reloads and clears
for the next local day, including when home stays open across midnight.

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
