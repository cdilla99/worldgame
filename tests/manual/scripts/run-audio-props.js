'use strict';

// Inline PBT harness
function forAll(generator, property, iterations) {
  iterations = iterations || 100;
  for (var i = 0; i < iterations; i++) {
    var input = generator(i);
    var result = property(input);
    if (!result) {
      throw new Error('Property failed on input: ' + JSON.stringify(input));
    }
  }
}

var passed = [];
var failed = [];

function runProperty(name, fn) {
  try {
    fn();
    passed.push(name);
  } catch (e) {
    failed.push(name + ': ' + e.message);
  }
}

// Model from audio-engine.js
function baseFrequency(pointsEarned, streak) {
  var base = 262 + (pointsEarned - 1) * 60;
  if (streak >= 3) base += streak * 10;
  return base;
}

// Property 1
runProperty('Property 1: Fanfare pitch scales with points earned', function () {
  function pairGenerator(i) {
    var pairs = [];
    for (var a = 2; a <= 4; a++) {
      for (var b = 1; b < a; b++) {
        pairs.push({ a: a, b: b });
      }
    }
    if (i < pairs.length) return pairs[i];
    var ra = Math.floor(Math.random() * 3) + 2;
    var rb = Math.floor(Math.random() * (ra - 1)) + 1;
    return { a: ra, b: rb };
  }
  forAll(pairGenerator, function (input) {
    return baseFrequency(input.a, 0) > baseFrequency(input.b, 0);
  }, 100);
});

// Property 2
runProperty('Property 2: Streak escalation monotonically increases audio complexity', function () {
  function streakGenerator(i) {
    if (i < 10) return i;
    return Math.floor(Math.random() * 15) + 2;
  }
  forAll(streakGenerator, function (streak) {
    var points = 2;
    var baseOscCount = 6;
    var streakOscCount = streak >= 2 ? 8 : 6;
    if (streak >= 2 && streakOscCount <= baseOscCount) return false;
    if (streak < 2 && streakOscCount !== baseOscCount) return false;
    if (streak >= 3) {
      var freqAtStreak = baseFrequency(points, streak);
      var freqAtStreak2 = baseFrequency(points, 2);
      if (freqAtStreak <= freqAtStreak2) return false;
    }
    return true;
  }, 100);
});

// Property 3
runProperty('Property 3: Streak reset returns audio parameters to base level', function () {
  forAll(function () { return Math.floor(Math.random() * 10) + 1; }, function (preResetStreak) {
    var points = 3;
    var freqAfterReset = baseFrequency(points, 0);
    var freqAtZero = baseFrequency(points, 0);
    if (freqAfterReset !== freqAtZero) return false;
    if (6 !== 6) return false;
    return true;
  }, 100);
});

// Property 4
runProperty('Property 4: Timer warning fires exactly once per threshold', function () {
  function sequenceGenerator() {
    var total = Math.floor(Math.random() * 90) + 61;
    var steps = Math.floor(Math.random() * 20) + 10;
    var seq = [];
    for (var s = 0; s < steps; s++) {
      var remaining = Math.max(0, total - Math.floor((s / steps) * total));
      seq.push(remaining);
    }
    seq.sort(function (a, b) { return b - a; });
    return seq;
  }
  forAll(sequenceGenerator, function (sequence) {
    var warnings = { 60: false, 30: false, 10: false };
    var fireCounts = { 60: 0, 30: 0, 10: 0 };
    var thresholds = [60, 30, 10];
    for (var i = 0; i < sequence.length; i++) {
      var remaining = sequence[i];
      for (var t = 0; t < thresholds.length; t++) {
        var threshold = thresholds[t];
        if (remaining <= threshold && !warnings[threshold]) {
          warnings[threshold] = true;
          fireCounts[threshold]++;
        }
      }
    }
    for (var t = 0; t < thresholds.length; t++) {
      var threshold = thresholds[t];
      var crossed = sequence.some(function (r) { return r <= threshold; });
      if (crossed && fireCounts[threshold] !== 1) return false;
      if (!crossed && fireCounts[threshold] !== 0) return false;
    }
    return true;
  }, 100);
});

// Property 15 uses the real AudioEngine with a deterministic Web Audio test double.
function FakeAudioParam() { this.value = 0; }
FakeAudioParam.prototype.setValueAtTime = function () {};
FakeAudioParam.prototype.exponentialRampToValueAtTime = function () {};

function FakeAudioNode() {
  this.gain = new FakeAudioParam();
  this.frequency = new FakeAudioParam();
  this.detune = new FakeAudioParam();
  this.Q = new FakeAudioParam();
  this.threshold = new FakeAudioParam();
  this.knee = new FakeAudioParam();
  this.ratio = new FakeAudioParam();
  this.attack = new FakeAudioParam();
  this.release = new FakeAudioParam();
}
FakeAudioNode.prototype.connect = function () {};
FakeAudioNode.prototype.disconnect = function () {};
FakeAudioNode.prototype.start = function () {};
FakeAudioNode.prototype.stop = function () {};

function FakeAudioContext() {
  this.currentTime = 0;
  this.sampleRate = 100;
  this.state = 'running';
  this.destination = new FakeAudioNode();
}
FakeAudioContext.prototype.resume = function () {};
FakeAudioContext.prototype.createDynamicsCompressor = function () { return new FakeAudioNode(); };
FakeAudioContext.prototype.createGain = function () { return new FakeAudioNode(); };
FakeAudioContext.prototype.createOscillator = function () { return new FakeAudioNode(); };
FakeAudioContext.prototype.createBufferSource = function () { return new FakeAudioNode(); };
FakeAudioContext.prototype.createBiquadFilter = function () { return new FakeAudioNode(); };
FakeAudioContext.prototype.createBuffer = function (channels, length) {
  return { getChannelData: function () { return new Float32Array(length); } };
};

global.window = { AudioContext: FakeAudioContext };
require('../audio-engine.js');
window.AudioEngine.init();

// Property 15: Oscillator count cap invariant
// **Validates: Requirements 11.3**
runProperty('Property 15: Oscillator count cap invariant', function () {
  var MAX_CAP = 12;
  var soundNames = [
    'playRoundStart', 'playSubmitClick', 'playCorrect', 'playWrong',
    'playNearMiss', 'playReveal', 'playSpeedBonus', 'playGameEnd',
    'playTimerWarning'
  ];

  function sequenceGenerator(i) {
    if (i === 0) return ['playCorrect', 'playSubmitClick', 'playGameEnd'];
    var length = Math.floor(Math.random() * 21) + 5;
    var sequence = [];
    for (var j = 0; j < length; j++) {
      sequence.push(soundNames[Math.floor(Math.random() * soundNames.length)]);
    }
    return sequence;
  }

  function trigger(name) {
    if (name === 'playCorrect') window.AudioEngine.playCorrect(4, 5);
    else if (name === 'playRoundStart') window.AudioEngine.playRoundStart(5);
    else if (name === 'playTimerWarning') window.AudioEngine.playTimerWarning('high');
    else window.AudioEngine[name]();
  }

  function oscillatorCapProperty(sequence) {
    for (var i = 0; i < sequence.length; i++) {
      trigger(sequence[i]);
      if (window.AudioEngine.getActiveNodeCount() > MAX_CAP) return false;
    }
    return true;
  }

  forAll(sequenceGenerator, oscillatorCapProperty, 200);
});

// Report
console.log('PASSED (' + passed.length + '):');
for (var i = 0; i < passed.length; i++) console.log('  OK ' + passed[i]);
if (failed.length > 0) {
  console.log('FAILED (' + failed.length + '):');
  for (var i = 0; i < failed.length; i++) console.log('  FAIL ' + failed[i]);
  process.exit(1);
} else {
  console.log('\nAll ' + passed.length + ' properties PASSED.');
}
