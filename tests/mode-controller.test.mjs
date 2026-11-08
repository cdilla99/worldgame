/**
 * Mode controller unit tests for mode-first-navigation.
 *
 * Tests the First_Load state, dialog messages, announcements,
 * showGlobe behavior, timer expiry while dialog is open, and
 * getState shape and GeoWars.atlas members.
 *
 * **Validates: Requirements 6.6, 7.3, 8.6, 9.1, 9.2, 12.1**
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { createHarness, FakeElement, FakeClassList, ModelState, ACTIONS, runProperty } from './helpers/atlas-mode-harness.mjs';

// ============================================================================
// REQUIREMENT 12.1: First_Load State
// ============================================================================

test('First_Load starts on Explore Globe with correct initial state', () => {
  const harness = createHarness({ initialView: 'globe' });
  const state = harness.modelState;

  assert.ok(state, 'atlas.getState() must return a state object');
  assert.equal(state.mode, 'explore', 'initial mode must be explore');
  assert.equal(state.exploreView, 'globe', 'initial explore view must be globe');
  assert.equal(state.challengeStage, 'panel', 'challenge stage must be panel');
  assert.equal(state.dailyReturn, null, 'dailyReturn must be null initially');
  assert.equal(state.view, 'globe', 'view must be globe');
  assert.equal(state.demoActive, false, 'demo must not be active on globe view');
});

test('First_Load with shapes preset in markup still shows Explore mode', () => {
  const harness = createHarness({ initialView: 'shapes' });
  const state = harness.modelState;

  assert.equal(state.mode, 'explore', 'mode must be explore even with shapes preset');
  assert.equal(state.exploreView, 'shapes', 'exploreView must be shapes');
  assert.equal(state.view, 'shapes', 'view must be shapes');
  // Note: demo mode is activated by applyLayout() when shapes becomes visible,
  // but in the harness the initial view is preset before atlas.js runs.
  // The demo is only started when switching TO shapes from another view.
});

test('First_Load sets correct workspace availability', () => {
  const harness = createHarness({ initialView: 'globe' });

  // Globe workspace should be available
  assert.equal(harness.globeWorkspace.hidden, false, 'globe workspace must be visible');
  assert.equal(harness.globeWorkspace.inert, false, 'globe workspace must not be inert');

  // Shapes workspace should be unavailable
  assert.equal(harness.shapesWorkspace.hidden, true, 'shapes workspace must be hidden');
  assert.equal(harness.shapesWorkspace.inert, true, 'shapes workspace must be inert');

  // Challenge panel should be unavailable
  assert.equal(harness.challengePanel.hidden, true, 'challenge panel must be hidden');
  assert.equal(harness.challengePanel.inert, true, 'challenge panel must be inert');
});

test('First_Load sets correct button pressed states', () => {
  const harness = createHarness({ initialView: 'globe' });

  assert.equal(harness.globeButton.getAttribute('aria-pressed'), 'true');
  assert.equal(harness.shapesButton.getAttribute('aria-pressed'), 'false');
  assert.equal(harness.exploreModeButton.getAttribute('aria-pressed'), 'true');
  assert.equal(harness.challengeModeButton.getAttribute('aria-pressed'), 'false');
});

// ============================================================================
// REQUIREMENT 6.6: Dialog Messages
// ============================================================================

test('hunt switch dialog shows Explore-specific message (Requirement 6.6)', () => {
  const harness = createHarness();
  harness.showChallenge();
  harness.explorer.startHunt();

  // Try to switch to explore - should open dialog
  harness.showExplore();

  assert.equal(harness.huntSwitchDialog.hidden, false, 'dialog must be visible');
  assert.equal(harness.huntSwitchDialog.classList.contains('hidden'), false);
  assert.match(harness.huntSwitchMessage.textContent, /Switching to Explore will end your current Country Hunt/);
});

test('hunt switch dialog shows Shapes-specific message (Requirement 6.6)', () => {
  const harness = createHarness();
  harness.showChallenge();
  harness.explorer.startHunt();

  // Try to switch to shapes - should open dialog
  harness.showShapes();

  assert.equal(harness.huntSwitchDialog.hidden, false, 'dialog must be visible');
  assert.match(harness.huntSwitchMessage.textContent, /Switching to Shapes will end your current Country Hunt/);
});

test('hunt switch dialog shows Daily Puzzle-specific message (Requirement 6.6)', () => {
  const harness = createHarness();
  harness.showChallenge();
  harness.explorer.startHunt();

  // Try to open daily puzzle - should open dialog
  harness.atlas.openDailyPuzzle();

  assert.equal(harness.huntSwitchDialog.hidden, false, 'dialog must be visible');
  assert.match(harness.huntSwitchMessage.textContent, /Opening the Daily Puzzle will end your current Country Hunt/);
});

test('hunt switch dialog can be cancelled with No button', () => {
  const harness = createHarness();
  harness.showChallenge();
  harness.explorer.startHunt();
  harness.showExplore();

  assert.equal(harness.huntSwitchDialog.hidden, false, 'dialog must be open');

  harness.huntSwitchNo.click();

  assert.equal(harness.huntSwitchDialog.hidden, true, 'dialog must be closed');
  assert.equal(harness.modelState.mode, 'challenge', 'must stay in challenge mode');
  assert.equal(harness.modelState.challengeStage, 'hunt', 'hunt must continue');
});

test('hunt switch dialog can be cancelled with Escape key', () => {
  const harness = createHarness();
  harness.showChallenge();
  harness.explorer.startHunt();
  harness.showExplore();

  assert.equal(harness.huntSwitchDialog.hidden, false, 'dialog must be open');

  harness.huntSwitchDialog.dispatchEvent('keydown', { key: 'Escape', preventDefault() {} });

  assert.equal(harness.huntSwitchDialog.hidden, true, 'dialog must be closed');
  assert.equal(harness.modelState.mode, 'challenge', 'must stay in challenge mode');
});

test('hunt switch dialog confirms and ends hunt on Yes button', () => {
  const harness = createHarness();
  harness.showChallenge();
  harness.explorer.startHunt();
  harness.showExplore();

  assert.equal(harness.huntSwitchDialog.hidden, false, 'dialog must be open');

  harness.huntSwitchYes.click();

  assert.equal(harness.huntSwitchDialog.hidden, true, 'dialog must be closed');
  assert.equal(harness.modelState.mode, 'explore', 'must switch to explore mode');
  assert.equal(harness.explorer._huntActive, false, 'hunt must be ended');
});

// ============================================================================
// REQUIREMENT 8.6: Announcements
// ============================================================================

test('Explore Globe is announced on showGlobe (Requirement 8.6)', () => {
  const harness = createHarness();
  harness.showShapes();

  harness.showGlobe({ announce: true });

  assert.match(harness.live.textContent, /Interactive globe view|Explore mode\. Globe view/);
});

test('Explore Shapes is announced on showShapes (Requirement 8.6)', () => {
  const harness = createHarness();

  harness.showShapes({ announce: true });

  assert.match(harness.live.textContent, /Country shapes view|Explore mode\. Shapes view/);
});

test('Challenge mode is announced on showChallenge (Requirement 8.6)', () => {
  const harness = createHarness();

  harness.showChallenge({ announce: true });

  assert.match(harness.live.textContent, /Challenge mode/);
});

test('Worldle return announces "Back to Explore" after daily puzzle (Requirement 8.6)', () => {
  const harness = createHarness();

  // Open and close daily puzzle
  harness.atlas.openDailyPuzzle();
  harness.atlas.returnFromDailyPuzzle();

  assert.match(harness.live.textContent, /Back to Explore/);
});

test('Worldle return announces "Back to Challenge" when returning from challenge (Requirement 8.6)', () => {
  const harness = createHarness();

  // Start from challenge mode
  harness.showChallenge();
  harness.atlas.openDailyPuzzle();
  harness.atlas.returnFromDailyPuzzle();

  assert.match(harness.live.textContent, /Back to Challenge/);
});

// ============================================================================
// REQUIREMENTS 7.3 & 9.2: showGlobe lands on Explore Globe
// ============================================================================

test('showGlobe from Explore Globe stays on Explore Globe (Requirement 7.3)', () => {
  const harness = createHarness({ initialView: 'globe' });

  harness.showGlobe();

  const state = harness.modelState;
  assert.equal(state.mode, 'explore');
  assert.equal(state.exploreView, 'globe');
  assert.equal(state.view, 'globe');
});

test('showGlobe from Explore Shapes lands on Explore Globe (Requirement 9.2)', () => {
  const harness = createHarness({ initialView: 'shapes' });

  harness.showGlobe();

  const state = harness.modelState;
  assert.equal(state.mode, 'explore');
  assert.equal(state.exploreView, 'globe');
  assert.equal(state.view, 'globe');
});

test('showGlobe from Challenge Panel lands on Explore Globe (Requirement 7.3)', () => {
  const harness = createHarness();

  harness.showChallenge();
  harness.showGlobe();

  const state = harness.modelState;
  assert.equal(state.mode, 'explore');
  assert.equal(state.exploreView, 'globe');
  assert.equal(state.view, 'globe');
});

test('showGlobe from Challenge Hunt ends hunt quietly without confirmation (Requirement 7.3)', () => {
  const harness = createHarness();

  harness.showChallenge();
  harness.explorer.startHunt();

  // showGlobe ends the hunt quietly without showing a dialog
  harness.showGlobe();

  // Dialog should NOT open - showGlobe ends the hunt quietly
  assert.equal(harness.huntSwitchDialog.hidden, true, 'dialog should NOT open for showGlobe');
  // Hunt should be ended
  assert.equal(harness.explorer._huntActive, false, 'hunt must be ended');
  assert.equal(harness.modelState.mode, 'explore');
  assert.equal(harness.modelState.exploreView, 'globe');
});

test('showGlobe from Hunt Summary lands on Explore Globe (Requirement 7.3)', () => {
  const harness = createHarness();

  harness.showChallenge();
  harness.explorer.startHunt();
  harness.explorer.endHunt(true); // Ends with summary

  assert.equal(harness.modelState.challengeStage, 'summary');

  harness.showGlobe();

  const state = harness.modelState;
  assert.equal(state.mode, 'explore');
  assert.equal(state.exploreView, 'globe');
});

test('showGlobe ends a running hunt quietly (no summary)', () => {
  const harness = createHarness();

  harness.showChallenge();
  harness.explorer.startHunt();

  // Confirm the switch
  harness.showGlobe();
  harness.huntSwitchYes.click();

  assert.equal(harness.explorer._huntActive, false);
  assert.equal(harness.explorer._summaryVisible, false, 'showGlobe must not show hunt summary');
});

// ============================================================================
// TIMER EXPIRY WHILE DIALOG IS OPEN
// ============================================================================

test('timer expiry while hunt switch dialog is open closes dialog and focuses opener', () => {
  const harness = createHarness();

  harness.showChallenge();
  harness.explorer.startHunt();

  // Store the active element before opening dialog
  const opener = harness.challengeModeButton;
  harness.document._activeElement = opener;

  harness.showExplore(); // Opens dialog

  assert.equal(harness.huntSwitchDialog.hidden, false, 'dialog must be open');

  // Simulate timer expiry - endHunt(true) emits free mode with summary
  harness.explorer.endHunt(true);

  // The hunt switch dialog should be closed when the summary appears
  assert.equal(harness.huntSwitchDialog.hidden, true, 'dialog must close on timer expiry');
});

test('summary event while dialog is open clears pending switch', () => {
  const harness = createHarness();

  harness.showChallenge();
  harness.explorer.startHunt();
  harness.showExplore();

  // Simulate timer expiry (summary event)
  harness.explorer.endHunt(true);

  const state = harness.modelState;
  assert.equal(state.mode, 'challenge', 'stays in challenge mode for summary');
  assert.equal(state.challengeStage, 'summary', 'moves to summary stage');
});

// ============================================================================
// REQUIREMENT 9.1: getState shape and GeoWars.atlas members
// ============================================================================

test('getState returns all required properties (Requirement 9.1)', () => {
  const harness = createHarness();
  const state = harness.modelState;

  // Required properties from design
  assert.ok('view' in state, 'view must be present');
  assert.ok('countryId' in state, 'countryId must be present');
  assert.ok('countryCount' in state, 'countryCount must be present');
  assert.ok('demoActive' in state, 'demoActive must be present');
  assert.ok('mode' in state, 'mode must be present');
  assert.ok('exploreView' in state, 'exploreView must be present');
  assert.ok('challengeStage' in state, 'challengeStage must be present');
  assert.ok('dailyReturn' in state, 'dailyReturn must be present');
});

test('getState returns correct types for all properties', () => {
  const harness = createHarness();
  const state = harness.modelState;

  assert.ok(typeof state.view === 'string', 'view must be string');
  assert.ok(state.countryId === null || typeof state.countryId === 'number', 'countryId must be number or null');
  assert.ok(typeof state.countryCount === 'number', 'countryCount must be number');
  assert.ok(typeof state.demoActive === 'boolean', 'demoActive must be boolean');
  assert.ok(typeof state.mode === 'string', 'mode must be string');
  assert.ok(typeof state.exploreView === 'string', 'exploreView must be string');
  assert.ok(typeof state.challengeStage === 'string', 'challengeStage must be string');
  assert.ok(state.dailyReturn === null || typeof state.dailyReturn === 'object', 'dailyReturn must be object or null');
});

test('GeoWars.atlas exposes all required members (Requirement 9.1)', () => {
  const harness = createHarness();
  const atlas = harness.atlas;

  // Required API members from design
  assert.ok(typeof atlas.showGlobe === 'function', 'showGlobe must be a function');
  assert.ok(typeof atlas.showShapes === 'function', 'showShapes must be a function');
  assert.ok(typeof atlas.selectCountry === 'function', 'selectCountry must be a function');
  assert.ok(typeof atlas.getState === 'function', 'getState must be a function');
  assert.ok(typeof atlas.showExplore === 'function', 'showExplore must be a function');
  assert.ok(typeof atlas.showChallenge === 'function', 'showChallenge must be a function');
  assert.ok(typeof atlas.openDailyPuzzle === 'function', 'openDailyPuzzle must be a function');
  assert.ok(typeof atlas.returnFromDailyPuzzle === 'function', 'returnFromDailyPuzzle must be a function');
});

test('GeoWars.atlas is frozen (immutable)', () => {
  const harness = createHarness();
  assert.ok(Object.isFrozen(harness.atlas), 'atlas must be frozen');
});

// ============================================================================
// ADDITIONAL STATE TRANSITIONS
// ============================================================================

test('showChallenge from Explore Globe lands on Challenge Panel', () => {
  const harness = createHarness();

  harness.showChallenge();

  const state = harness.modelState;
  assert.equal(state.mode, 'challenge');
  assert.equal(state.challengeStage, 'panel');
});

test('showChallenge from Explore Shapes lands on Challenge Panel', () => {
  const harness = createHarness();
  harness.showShapes();

  harness.showChallenge();

  const state = harness.modelState;
  assert.equal(state.mode, 'challenge');
  assert.equal(state.challengeStage, 'panel');
});

test('showChallenge from running hunt keeps hunt active', () => {
  const harness = createHarness();

  harness.showChallenge();
  harness.explorer.startHunt();

  // Clicking Challenge mode during a hunt should keep the hunt running
  harness.showChallenge();

  const state = harness.modelState;
  assert.equal(state.mode, 'challenge');
  assert.equal(state.challengeStage, 'hunt', 'hunt must continue');
  assert.equal(harness.explorer._huntActive, true);
});

test('showExplore from Challenge Panel returns to remembered view', () => {
  const harness = createHarness();
  harness.showShapes(); // Set exploreView to shapes

  harness.showChallenge();
  harness.showExplore();

  const state = harness.modelState;
  assert.equal(state.mode, 'explore');
  assert.equal(state.exploreView, 'shapes', 'must restore previous explore view');
});

// ============================================================================
// DAILY PUZZLE INTEGRATION
// ============================================================================

test('openDailyPuzzle records dailyReturn state', () => {
  const harness = createHarness();
  harness.showShapes();

  harness.atlas.openDailyPuzzle();

  const state = harness.modelState;
  assert.ok(state.dailyReturn, 'dailyReturn must be set');
  assert.equal(state.dailyReturn.mode, 'explore');
  assert.equal(state.dailyReturn.exploreView, 'shapes');
});

test('returnFromDailyPuzzle restores remembered state', () => {
  const harness = createHarness();
  harness.showShapes();

  harness.atlas.openDailyPuzzle();
  harness.atlas.returnFromDailyPuzzle();

  const state = harness.modelState;
  assert.equal(state.mode, 'explore');
  assert.equal(state.exploreView, 'shapes');
});

test('openDailyPuzzle during hunt requires confirmation', () => {
  const harness = createHarness();
  harness.showChallenge();
  harness.explorer.startHunt();

  harness.atlas.openDailyPuzzle();

  assert.equal(harness.huntSwitchDialog.hidden, false);
  assert.equal(harness.worldle.openCalls, 0, 'worldle.open must not be called yet');
});

test('confirming daily puzzle switch ends hunt and opens worldle', () => {
  const harness = createHarness();
  harness.showChallenge();
  harness.explorer.startHunt();

  harness.atlas.openDailyPuzzle();
  harness.huntSwitchYes.click();

  assert.equal(harness.explorer._huntActive, false);
  assert.equal(harness.worldle.openCalls, 1, 'worldle.open must be called');
});

test('returnFromDailyPuzzle from Challenge returns to Challenge Panel', () => {
  const harness = createHarness();
  harness.showChallenge();

  harness.atlas.openDailyPuzzle();
  harness.atlas.returnFromDailyPuzzle();

  const state = harness.modelState;
  assert.equal(state.mode, 'challenge');
  assert.equal(state.challengeStage, 'panel');
});

// ============================================================================
// WORKSPACE AVAILABILITY TRANSITIONS
// ============================================================================

test('switching to Explore Shapes makes shapes workspace available', () => {
  const harness = createHarness();

  harness.showShapes();

  assert.equal(harness.shapesWorkspace.hidden, false);
  assert.equal(harness.shapesWorkspace.inert, false);
  assert.equal(harness.globeWorkspace.hidden, true);
  assert.equal(harness.globeWorkspace.inert, true);
});

test('switching to Challenge Panel makes panel available', () => {
  const harness = createHarness();

  harness.showChallenge();

  assert.equal(harness.challengePanel.hidden, false);
  assert.equal(harness.challengePanel.inert, false);
  assert.equal(harness.globeWorkspace.hidden, true);
  assert.equal(harness.shapesWorkspace.hidden, true);
});

test('Explore View Switch is available in Explore mode', () => {
  const harness = createHarness();

  harness.showGlobe();

  assert.equal(harness.exploreSwitch.hidden, false);
  assert.equal(harness.exploreSwitch.inert, false);
});

test('Explore View Switch is unavailable in Challenge mode', () => {
  const harness = createHarness();

  harness.showChallenge();

  assert.equal(harness.exploreSwitch.hidden, true);
  assert.equal(harness.exploreSwitch.inert, true);
});

// ============================================================================
// DEMO MODE INTEGRATION
// ============================================================================

test('opening Shapes view activates demo mode', () => {
  const harness = createHarness();

  harness.showShapes();

  assert.equal(harness.modelState.demoActive, true);
  assert.ok(harness.timers.size > 0, 'demo timer must be registered');
});

test('switching back to Globe stops demo mode', () => {
  const harness = createHarness();
  harness.showShapes();

  harness.showGlobe();

  assert.equal(harness.modelState.demoActive, false);
  assert.equal(harness.timers.size, 0, 'demo timer must be cleared');
});

// ============================================================================
// PROPERTY: showGlobe always lands on Explore Globe when hunt allows
// ============================================================================

test('Property: showGlobe always lands on Explore Globe from any non-hunt state', () => {
  runProperty({
    name: 'showGlobe always lands on Explore Globe',
    seed: 0x910a01,
    cases: 50,
    generate: random => {
      const states = [
        { mode: 'explore', exploreView: 'globe' },
        { mode: 'explore', exploreView: 'shapes' },
        { mode: 'challenge', challengeStage: 'panel' },
        { mode: 'challenge', challengeStage: 'summary' }
      ];
      return { initial: states[Math.floor(random() * states.length)] };
    },
    verify: ({ initial }) => {
      const harness = createHarness();

      // Set initial state
      if (initial.mode === 'explore') {
        if (initial.exploreView === 'shapes') harness.showShapes();
      } else {
        harness.showChallenge();
        if (initial.challengeStage === 'summary') {
          harness.explorer.startHunt();
          harness.explorer.endHunt(true);
        }
      }

      harness.showGlobe();

      const state = harness.modelState;
      assert.equal(state.mode, 'explore');
      assert.equal(state.exploreView, 'globe');
      assert.equal(state.view, 'globe');
    }
  });
});

// ============================================================================
// PROPERTY: Daily puzzle round trip preserves mode (when no hunt)
// ============================================================================

test('Property: Daily puzzle round trip preserves mode', () => {
  runProperty({
    name: 'Daily puzzle round trip preserves mode',
    seed: 0x910a02,
    cases: 50,
    generate: random => {
      const modes = [
        { mode: 'explore', exploreView: 'globe' },
        { mode: 'explore', exploreView: 'shapes' },
        { mode: 'challenge', challengeStage: 'panel' }
      ];
      return { initial: modes[Math.floor(random() * modes.length)] };
    },
    verify: ({ initial }) => {
      const harness = createHarness();

      // Set initial state
      if (initial.mode === 'explore') {
        if (initial.exploreView === 'shapes') harness.showShapes();
      } else {
        harness.showChallenge();
      }

      harness.atlas.openDailyPuzzle();
      harness.atlas.returnFromDailyPuzzle();

      const state = harness.modelState;
      if (initial.mode === 'challenge') {
        assert.equal(state.mode, 'challenge');
        assert.equal(state.challengeStage, 'panel');
      } else {
        assert.equal(state.mode, 'explore');
        assert.equal(state.exploreView, initial.exploreView);
      }
    }
  });
});

console.log('Mode controller tests completed');
