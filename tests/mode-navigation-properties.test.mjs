import assert from 'node:assert/strict';
import test from 'node:test';
import { createHarness, runProperty } from './helpers/atlas-mode-harness.mjs';

const viewStates = ['globe', 'shapes', 'challenge'];

test('Property: one activation moves between every pair of Atlas modes', () => {
  runProperty({
    name: 'one activation moves between every pair of Atlas modes',
    seed: 0x4d4f4445,
    cases: 100,
    generate: random => ({
      from: viewStates[Math.floor(random() * viewStates.length)],
      to: viewStates[Math.floor(random() * viewStates.length)],
      challengeView: random() < 0.5 ? 'globe' : 'shapes'
    }),
    verify: ({ from, to, challengeView }) => {
      const harness = createHarness();
      if (from === 'shapes' || (from === 'challenge' && challengeView === 'shapes')) {
        harness.showShapes();
      }
      if (from === 'challenge') harness.showChallenge();

      const target = to === 'globe'
        ? harness.globeButton
        : to === 'shapes'
          ? harness.shapesButton
          : harness.challengeModeButton;
      let activations = 0;
      activations += 1;
      target.click();

      assert.equal(activations, 1);
      const state = harness.modelState;
      if (to === 'challenge') {
        assert.equal(state.mode, 'challenge');
        assert.equal(state.challengeStage, 'panel');
        assert.equal(harness.challengePanel.hidden, false);
      } else {
        assert.equal(state.mode, 'explore');
        assert.equal(state.exploreView, to);
        assert.equal(state.view, to);
      }
    }
  });
});

test('Property: layout and pressed controls stay consistent after mode changes', () => {
  runProperty({
    name: 'layout and pressed controls stay consistent',
    seed: 0x4d4f4446,
    cases: 100,
    generate: random => Array.from(
      { length: 1 + Math.floor(random() * 30) },
      () => viewStates[Math.floor(random() * viewStates.length)]
    ),
    verify: sequence => {
      const harness = createHarness();
      for (const mode of sequence) {
        if (mode === 'globe') harness.globeButton.click();
        if (mode === 'shapes') harness.shapesButton.click();
        if (mode === 'challenge') harness.challengeModeButton.click();

        const state = harness.modelState;
        const exploring = state.mode === 'explore';
        const shapes = exploring && state.exploreView === 'shapes';
        const challenge = !exploring;

        assert.equal(harness.exploreSwitch.hidden, !exploring);
        assert.equal(harness.globeWorkspace.hidden, exploring ? shapes : true);
        assert.equal(harness.shapesWorkspace.hidden, !shapes);
        assert.equal(harness.challengePanel.hidden, !challenge);
        assert.equal(harness.exploreModeButton.getAttribute('aria-pressed'), String(exploring));
        assert.equal(harness.challengeModeButton.getAttribute('aria-pressed'), String(challenge));
        assert.equal(harness.globeButton.getAttribute('aria-pressed'), String(state.exploreView === 'globe'));
        assert.equal(harness.shapesButton.getAttribute('aria-pressed'), String(state.exploreView === 'shapes'));
      }
    }
  });
});

test('Property: hunt-switch confirmation guards every mode and Daily Puzzle target', () => {
  runProperty({
    name: 'hunt-switch confirmation guards every mode and Daily Puzzle target',
    seed: 0x4d4f4447,
    cases: 100,
    generate: random => ({
      target: ['explore', 'shapes', 'daily'][Math.floor(random() * 3)],
      exploreView: random() < 0.5 ? 'globe' : 'shapes'
    }),
    verify: ({ target, exploreView }) => {
      const harness = createHarness();
      if (exploreView === 'shapes') harness.showShapes();
      harness.showChallenge();
      harness.explorer.startHunt();

      const requestSwitch = () => {
        if (target === 'explore') harness.showExplore();
        if (target === 'shapes') harness.showShapes();
        if (target === 'daily') harness.atlas.openDailyPuzzle();
      };

      requestSwitch();
      assert.equal(harness.huntSwitchDialog.hidden, false);
      assert.equal(harness.explorer.getState().huntActive, true);
      assert.equal(harness.huntSwitchMessage.textContent.includes('Country Hunt'), true);

      harness.huntSwitchNo.click();
      assert.equal(harness.huntSwitchDialog.hidden, true);
      assert.equal(harness.explorer.getState().huntActive, true);

      requestSwitch();
      harness.huntSwitchYes.click();
      assert.equal(harness.huntSwitchDialog.hidden, true);
      assert.equal(harness.explorer.getState().huntActive, false);
      assert.equal(harness.explorer.getState().summaryVisible, false);

      if (target === 'daily') {
        assert.equal(harness.worldle.openCalls, 1);
        harness.atlas.returnFromDailyPuzzle();
        assert.equal(harness.modelState.mode, 'challenge');
        assert.equal(harness.modelState.challengeStage, 'panel');
      } else if (target === 'shapes') {
        assert.equal(harness.modelState.mode, 'explore');
        assert.equal(harness.modelState.exploreView, 'shapes');
      } else {
        assert.equal(harness.modelState.mode, 'explore');
        assert.equal(harness.modelState.exploreView, exploreView);
      }
    }
  });
});
