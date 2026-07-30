import assert from 'node:assert/strict';
import { createScoring } from '../src/features/scoring/index.js';
import { EventBus } from '../src/core/events.js';
import { BASE_POINTS, MULTIPLIERS, calculatePoints } from '../src/features/scoring/index.js';

function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

// Property 14: Points = base × multiplier for any difficulty and answerType
// **Validates: Requirements 5.1**
function runProperty14({ seed, cases }) {
  const random = createRandom(seed);
  const difficulties = Object.keys(BASE_POINTS);
  const answerTypes = Object.keys(MULTIPLIERS);

  for (let iteration = 0; iteration < cases; iteration += 1) {
    const difficulty = difficulties[Math.floor(random() * difficulties.length)];
    const answerType = answerTypes[Math.floor(random() * answerTypes.length)];
    const expectedPoints = BASE_POINTS[difficulty] * MULTIPLIERS[answerType];

    try {
      const points = calculatePoints(difficulty, answerType);
      assert.equal(points, expectedPoints, `points should equal base(${BASE_POINTS[difficulty]}) × multiplier(${MULTIPLIERS[answerType]}) = ${expectedPoints}`);
    } catch (error) {
      error.message = `Property 14 failed (seed=0x${seed.toString(16)}, iteration=${iteration}, difficulty=${difficulty}, answerType=${answerType}): ${error.message}`;
      throw error;
    }
  }
  console.log(`Property 14 passed (${cases} cases, seed=0x${seed.toString(16)})`);
}

// Property 15: Cumulative scores correct in score:update events
// **Validates: Requirements 5.2**
function runProperty15({ seed, cases, roundsPerGame }) {
  const random = createRandom(seed);
  for (let iteration = 0; iteration < cases; iteration += 1) {
    const events = new EventBus();
    const scoring = createScoring({ events });
    const updates = [];
    events.on('score:update', update => updates.push(update));

    let expectedScore = 0;
    let expectedStreak = 0;
    const difficulties = Object.keys(BASE_POINTS);
    const answerTypes = Object.keys(MULTIPLIERS);

    // Simulate random round sequence
    for (let round = 0; round < roundsPerGame; round += 1) {
      // Randomly choose correct/incorrect answer
      const isCorrect = random() > 0.2; // 80% correct rate
      const difficulty = difficulties[Math.floor(random() * difficulties.length)];
      const answerType = answerTypes[Math.floor(random() * answerTypes.length)];

      if (isCorrect) {
        events.emit('answer:correct', { difficulty, answerType });
        expectedScore += BASE_POINTS[difficulty] * MULTIPLIERS[answerType];
        expectedStreak += 1;
      } else {
        events.emit('answer:incorrect');
        expectedStreak = 0;
      }
    }

    try {
      const finalUpdate = updates[updates.length - 1];
      assert.equal(finalUpdate.score, expectedScore, `cumulative score should equal sum of all deltas`);
      
      // Verify the score in scoring state matches
      const state = scoring.getState();
      assert.equal(state.score, expectedScore, `scoring.getState().score should match cumulative score`);
      assert.equal(state.streak, expectedStreak, `final streak matches expected streak`);
    } catch (error) {
      error.message = `Property 15 failed (seed=0x${seed.toString(16)}, iteration=${iteration}): ${error.message}`;
      throw error;
    } finally {
      scoring.dispose();
    }
  }
  console.log(`Property 15 passed (${cases} games, ${roundsPerGame} rounds each, seed=0x${seed.toString(16)})`);
}

// Property 16: Best streak = max achieved streak
// **Validates: Requirements 5.5**
function runProperty16({ seed, cases, maxSequenceLength }) {
  const random = createRandom(seed);

  for (let iteration = 0; iteration < cases; iteration += 1) {
    const events = new EventBus();
    const scoring = createScoring({ events });
    const sequenceLength = Math.floor(random() * (maxSequenceLength + 1));
    const answerSequence = [];
    let currentStreak = 0;
    let expectedBestStreak = 0;

    for (let round = 0; round < sequenceLength; round += 1) {
      const isCorrect = random() < 0.6;
      answerSequence.push(isCorrect);

      if (isCorrect) {
        events.emit('answer:correct', {
          difficulty: 'easy',
          answerType: 'options'
        });
        currentStreak += 1;
        expectedBestStreak = Math.max(expectedBestStreak, currentStreak);
      } else {
        events.emit('answer:incorrect');
        currentStreak = 0;
      }
    }

    try {
      assert.equal(
        scoring.getState().bestStreak,
        expectedBestStreak,
        'best streak should equal the longest consecutive run of correct answers'
      );
    } catch (error) {
      const counterexample = answerSequence.map(answer => answer ? 'correct' : 'incorrect').join(',');
      error.message = `Property 16 failed (seed=0x${seed.toString(16)}, iteration=${iteration}, sequence=[${counterexample}]): ${error.message}`;
      throw error;
    } finally {
      scoring.dispose();
    }
  }

  console.log(`Property 16 passed (${cases} sequences, max length ${maxSequenceLength}, seed=0x${seed.toString(16)})`);
}

console.log('Running Property 14: Points = base × multiplier for any difficulty and answerType');
runProperty14({ seed: 0x7213040f, cases: 500 });

console.log('Running Property 15: Cumulative scores correct in score:update events');
runProperty15({ seed: 0x72150417, cases: 200, roundsPerGame: 10 });

console.log('Running Property 16: Best streak = max achieved streak');
runProperty16({ seed: 0x72160505, cases: 300, maxSequenceLength: 50 });

console.log('Scoring properties 14-16 passed (1,000 generated cases total)');
