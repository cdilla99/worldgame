# EARTHLING quiz-loop review

Reviewed 14 November 2026. Scope: Shape Quiz answers, feedback, results and replay; Country Hunt results checked for consistency. This is a review and proposed implementation order. No gameplay or production code changed during this review.

## Recommendation

Fix the feedback interaction first, then make the results screen a clearer route into another run. Preserve accurate geography, short factual copy, existing scoring and the agreed Practise behaviour: untimed globe/shape browsing.

## Evidence

Inspected current runtime source, existing browser captures, and new controlled browser captures at 320 × 568, 390 × 844 and 844 × 390. The new captures invoke the existing feedback renderer and use a simulated 12-answer run to inspect layout; they are not natural completed-game sessions. HTTPS requests were blocked so the review did not contact live account services. No page errors were reported in the final capture run.

- [Incorrect-answer feedback](../.scratch/quiz-loop-review/incorrect-390.png)
- [Small-phone correct-answer feedback](../.scratch/quiz-loop-review/correct-320.png)
- [Small-phone results fixture](../.scratch/quiz-loop-review/results-12-320.png)
- [Landscape results fixture](../.scratch/quiz-loop-review/results-12-844.png)
- [Recorded observations](../.scratch/quiz-loop-review/observations.json)

Captures and the capture script are local, Git-ignored working artifacts.

## Findings and changes

### 1. High priority: Country facts advances the quiz

Confirmed in all three viewports: clicking the feedback facts summary changes `state.total` from 1 to 2. The click bubbles into the feedback panel's advance handler. The global Enter/Space shortcut also advances timed feedback without excluding interactive controls, so the keyboard route needs the same protection.

Change: provide an explicit Next country button in timed feedback. Exclude summaries, buttons, links and other interactive descendants from panel and global-key advancement. Preserve one idempotent advance operation so a tap, key and pending timeout cannot skip multiple countries.

Acceptance: opening/closing facts by pointer or keyboard never changes country; Next advances exactly once; replay starts on its first country.

### 2. High priority: feedback competes with an automatic deadline

Timed-game feedback disappears after three seconds. The game clock already pauses during feedback. On phones, facts start collapsed; opening them should give the player time to read. Current wrong-answer feedback names the correct country but does not retain the silhouette in the phone layout, weakening the visual association the game teaches.

Change: keep automatic advancement for an untouched quick-play state if desired, but stop its timeout when the player opens facts or interacts with feedback. Show a real continuation action. Consider a small copy of the current accurate silhouette beside the answer; use the existing geometry or asset, with no invented outline.

Acceptance: opened facts remain available beyond three seconds; the game clock resumes only on the next question; the correct answer and continuation control fit at 320 × 568 and 844 × 390.

Reference: [Uxcel incorrect-answer feedback](https://mobbin.com/screens/5741d712-664a-4362-a0d0-ef51695884ca) visibly separates its verdict, optional explanation and Continue. [Brilliant incorrect-answer feedback](https://mobbin.com/screens/53d96faf-91a1-4af0-a917-53dc15960836) offers deliberate Try again and See answer choices. These are interaction references, not evidence that a particular design improves learning outcomes.

### 3. High priority: results put configuration ahead of continuation

The results screen gives Level, Score, Best streak and Correct similar weight, then shows five difficulty options and an answer list before Replay. In the 12-answer fixture, Replay begins at approximately y=783 on a 568px-high phone and y=677 on a 390px-high landscape viewport. At 390 × 844 it only just fits. The answer list is capped at 200px and scrolls internally; it does not grow indefinitely with the number of rounds.

Change: show Correct and Score first, then Replay and Home, followed by Next game difficulty and an expandable answer review. Keep completed-run difficulty next to the completed-run summary. Use ordinary body typography for the primary action label. A normal-flow action row above optional content is the first choice; sticky positioning is only needed if layout checks justify it.

Acceptance: Replay is visible in the opening short-phone and landscape view; selecting the next difficulty leaves completed results unchanged; answer review remains reachable with large text and keyboard navigation.

Reference: [Uxcel lesson results](https://mobbin.com/screens/b133afa4-f09c-4997-8dee-4cb2114f9b58) pairs a compact metrics group with a clear primary continuation action.

### 4. Medium priority: answer review has no next learning action

The answer list identifies correct/incorrect countries and their continents. It cannot show the player's mistaken answer because round history currently retains the country and outcome, but not the selected or typed guess. Replay starts another ordinary run.

Change in a later slice: add Review missed when there are missed countries, using unique country IDs from the completed run and the existing finite-review engine. Keep Practise as browsing. Recording the player's actual guess would support a later Your answer / Correct answer comparison, but is a separate data/state change.

Acceptance: a missed-country review contains only those countries; it does not rewrite the completed run's statistics; all-correct and empty runs omit the action honestly.

Reference: [Babbel answer review](https://mobbin.com/screens/00c43458-c5b4-4e0f-9223-f5a933ccc59e) groups incorrect and correct responses. [Codecademy's quiz completion flow](https://mobbin.com/flows/b192900c-261e-4393-be74-b1926ffd8abf?tab=screens) distinguishes the summary, answer review and retake/practice actions.

### 5. Medium priority: Country Hunt results still use the older treatment

The current captured Country Hunt summary retains a green replay action and an Explore secondary action, while the home now uses orange Play and Practise. It also leaves the large globe ahead of the summary on a phone.

Change: use the shared orange replay treatment and Practise label for the existing browsing destination. Collapse or reduce the globe once results appear so the result and replay lead the screen.

## Suggested implementation order

1. Repair pointer/keyboard facts interaction and make timed continuation explicit; verify timeout cancellation and single advancement.
2. Reorder results, label next-run difficulty, and align Country Hunt results with Practise/Play styling.
3. Add missed-country review separately, with tests for history, finite-deck completion and unchanged saved results.

The first two slices address confirmed interaction and layout problems without changing scoring or introducing a new public game mode. Retain current country-name, flag, region and correct/incorrect cues; do not add promotional copy, extra reward currencies or sign-in barriers to replay.
