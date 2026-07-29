/**
 * Audio Engine v4 — Warm, satisfying synthesized sounds
 * 
 * Inspired by Duolingo, Wordle, and Nintendo feedback sounds.
 * The secret: sine waves with soft harmonics, musical intervals that
 * resolve pleasantly, gentle attack/release curves (no clicks), and
 * layered voices that feel "warm" rather than harsh.
 *
 * Key techniques:
 * - Sine waves as base (warm, not harsh like square)
 * - Soft triangle sub-oscillators for body
 * - Musical intervals: major thirds, perfect fifths, octaves
 * - Exponential gain ramps (no clicks/pops)
 * - Subtle detuning for chorus/shimmer
 * - Filtered noise for percussive texture
 * - Each sound tells a micro-story (tension → resolution)
 */
(function () {
  'use strict';

  var ctx = null;
  var master = null;
  var compressor = null;
  var enabled = true;
  var nodes = 0;
  var MAX = 32;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      ctx = new C();
    } catch (e) { return; }

    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 8;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;
    compressor.connect(ctx.destination);

    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(compressor);
  }

  function ok() { return ctx && master && enabled; }
  function tick() { if (nodes >= MAX) return false; nodes++; return true; }
  function release() { nodes = Math.max(0, nodes - 1); }

  /**
   * Core voice — warm sine with optional harmonics.
   * Uses smooth exponential ramps to avoid clicks.
   */
  function voice(freq, start, dur, type, vol, detune) {
    if (!ok() || !tick()) return;
    var t = ctx.currentTime + start;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (detune) o.detune.setValueAtTime(detune, t);

    var v = vol || 0.15;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.008);
    g.gain.setValueAtTime(v, t + dur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.02);
    o.onended = function () { release(); try { o.disconnect(); g.disconnect(); } catch (e) {} };
  }

  /**
   * Pad voice — longer, softer, for chords and ambiance.
   */
  function pad(freq, start, dur, vol, detune) {
    if (!ok() || !tick()) return;
    var t = ctx.currentTime + start;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (detune) o.detune.setValueAtTime(detune, t);

    var v = vol || 0.08;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.04);
    g.gain.setValueAtTime(v, t + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.02);
    o.onended = function () { release(); try { o.disconnect(); g.disconnect(); } catch (e) {} };
  }

  /**
   * Filtered noise — soft percussive texture.
   */
  function noise(start, dur, vol, freq) {
    if (!ok() || !tick()) return;
    var t = ctx.currentTime + start;
    var bufSize = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    var src = ctx.createBufferSource();
    src.buffer = buf;

    var flt = ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.value = freq || 3000;
    flt.Q.value = 2;

    var g = ctx.createGain();
    g.gain.setValueAtTime(vol || 0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(flt);
    flt.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.01);
    src.onended = function () { release(); try { src.disconnect(); flt.disconnect(); g.disconnect(); } catch (e) {} };
  }

  /**
   * Pitch sweep — for swoops and transitions.
   */
  function bend(startFreq, endFreq, start, dur, type, vol) {
    if (!ok() || !tick()) return;
    var t = ctx.currentTime + start;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(startFreq, t);
    o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);

    var v = vol || 0.1;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.005);
    g.gain.setValueAtTime(v * 0.8, t + dur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.02);
    o.onended = function () { release(); try { o.disconnect(); g.disconnect(); } catch (e) {} };
  }

  // Musical frequencies (equal temperament)
  var NOTE = {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
    C6: 1046.50, D6: 1174.66, E6: 1318.51
  };

  window.AudioEngine = {

    init: function () { init(); },

    /**
     * Round start — bright two-note chime. Anticipation.
     */
    playRoundStart: function (streak) {
      if (!ok()) return;
      if (ctx.state === 'suspended') ctx.resume();
      streak = streak || 0;

      voice(NOTE.G5, 0, 0.12, 'sine', 0.14);
      voice(NOTE.G5, 0, 0.12, 'triangle', 0.05);
      voice(NOTE.C6, 0.08, 0.18, 'sine', 0.16);
      voice(NOTE.C6, 0.08, 0.18, 'triangle', 0.05);
      noise(0.02, 0.06, 0.02, 6000);

      if (streak >= 3) {
        voice(NOTE.C6 * 2, 0.12, 0.1, 'sine', 0.05, 6);
      }
    },

    /**
     * Submit click — soft tactile tap.
     */
    playSubmitClick: function () {
      if (!ok()) return;
      if (ctx.state === 'suspended') ctx.resume();
      voice(1400, 0, 0.025, 'sine', 0.07);
      noise(0, 0.015, 0.03, 8000);
    },

    /**
     * Correct answer — warm, triumphant major chord bloom.
     */
    playCorrect: function (pointsEarned, streak) {
      if (!ok()) return;
      if (ctx.state === 'suspended') ctx.resume();
      pointsEarned = Math.max(1, Math.min(4, pointsEarned || 1));
      streak = streak || 0;

      var base = 523 + (pointsEarned - 1) * 50;
      if (streak >= 3) base += streak * 8;

      var third = base * 1.26;
      var fifth = base * 1.5;
      var oct = base * 2;

      voice(base, 0, 0.2, 'sine', 0.16);
      voice(base, 0, 0.15, 'triangle', 0.06);
      voice(third, 0.07, 0.2, 'sine', 0.15);
      voice(third, 0.07, 0.15, 'triangle', 0.05);
      voice(fifth, 0.14, 0.2, 'sine', 0.15);

      voice(oct, 0.21, 0.4, 'sine', 0.14);
      voice(oct, 0.21, 0.35, 'sine', 0.06, 7);
      voice(oct, 0.21, 0.35, 'sine', 0.06, -7);
      pad(base * 0.5, 0.21, 0.4, 0.07);
      noise(0.21, 0.08, 0.03, 5000);

      if (streak >= 2) {
        voice(oct * 1.5, 0.28, 0.2, 'sine', 0.04, 12);
      }
      if (streak >= 4) {
        voice(oct * 2, 0.32, 0.15, 'sine', 0.03);
      }
    },

    /**
     * Wrong answer — gentle descending minor third. Non-punishing.
     */
    playWrong: function () {
      if (!ok()) return;
      if (ctx.state === 'suspended') ctx.resume();

      voice(311, 0, 0.15, 'sine', 0.1);
      voice(311, 0, 0.12, 'triangle', 0.04);
      voice(262, 0.1, 0.22, 'sine', 0.09);
      voice(262, 0.1, 0.18, 'triangle', 0.04);
      noise(0.05, 0.04, 0.02, 800);
    },

    /**
     * Near miss — ascending but unresolved (lands on leading tone).
     */
    playNearMiss: function () {
      if (!ok()) return;
      if (ctx.state === 'suspended') ctx.resume();

      voice(NOTE.C4, 0, 0.1, 'sine', 0.1);
      voice(NOTE.E4, 0.08, 0.1, 'sine', 0.1);
      voice(NOTE.G4, 0.16, 0.1, 'sine', 0.11);
      voice(NOTE.B4, 0.24, 0.25, 'sine', 0.12);
      voice(NOTE.B4, 0.24, 0.2, 'sine', 0.04, 8);
      bend(NOTE.B4, NOTE.B4 * 1.02, 0.35, 0.1, 'sine', 0.05);
    },

    /**
     * Reveal clue — mysterious descending shimmer then upward pop.
     */
    playReveal: function () {
      if (!ok()) return;
      if (ctx.state === 'suspended') ctx.resume();

      voice(NOTE.E6, 0, 0.06, 'sine', 0.08);
      voice(NOTE.C6, 0.04, 0.06, 'sine', 0.08);
      voice(NOTE.G5, 0.08, 0.06, 'sine', 0.09);
      voice(NOTE.C5, 0.12, 0.15, 'sine', 0.1);
      pad(NOTE.C4, 0.1, 0.2, 0.04);
      noise(0.05, 0.04, 0.02, 4000);
    },

    /**
     * Speed bonus — cascading sparkle pings.
     */
    playSpeedBonus: function () {
      if (!ok()) return;
      if (ctx.state === 'suspended') ctx.resume();

      var pings = [NOTE.E5, NOTE.G5, NOTE.A5, NOTE.C6, NOTE.E6];
      for (var i = 0; i < pings.length; i++) {
        voice(pings[i], i * 0.045, 0.08, 'sine', 0.09);
        voice(pings[i] * 2, i * 0.045, 0.05, 'sine', 0.03);
      }
      pad(NOTE.E6, 0.22, 0.25, 0.06, 5);
      pad(NOTE.E6, 0.22, 0.25, 0.06, -5);
    },

    /**
     * Game end — ascending pentatonic scale into held major chord.
     */
    playGameEnd: function () {
      if (!ok()) return;
      if (ctx.state === 'suspended') ctx.resume();

      var scale = [NOTE.C4, NOTE.D4, NOTE.E4, NOTE.G4, NOTE.A4, NOTE.C5];
      for (var i = 0; i < scale.length; i++) {
        voice(scale[i], i * 0.09, 0.14, 'sine', 0.11);
        voice(scale[i], i * 0.09, 0.1, 'triangle', 0.04);
      }

      var ct = 0.6;
      pad(NOTE.C5, ct, 0.9, 0.1);
      pad(NOTE.E5, ct, 0.9, 0.08);
      pad(NOTE.G5, ct, 0.9, 0.08);
      pad(NOTE.C6, ct + 0.1, 0.8, 0.07, 5);
      pad(NOTE.C6, ct + 0.1, 0.8, 0.07, -5);
      pad(NOTE.C4 * 0.5, ct, 1.0, 0.06);
      noise(ct, 0.1, 0.03, 6000);
      noise(ct + 0.4, 0.08, 0.02, 5000);
    },

    /**
     * Timer warning — clean pips.
     */
    playTimerWarning: function (level) {
      if (!ok()) return;
      if (ctx.state === 'suspended') ctx.resume();

      var beats = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
      var freq = level === 'high' ? NOTE.A5 : level === 'medium' ? NOTE.E5 : NOTE.A4;
      var vol = level === 'high' ? 0.1 : 0.07;

      for (var i = 0; i < beats; i++) {
        voice(freq, i * 0.09, 0.05, 'sine', vol);
      }
    },

    /**
     * National anthem — sine lead with triangle bass.
     */
    playAnthem: function (countryName) {
      if (!ok()) return;
      if (ctx.state === 'suspended') ctx.resume();

      var notes = window.Anthems && window.Anthems.get(countryName);
      if (!notes || !notes.length) return;

      var offset = 0;
      for (var i = 0; i < notes.length; i++) {
        var freq = notes[i][0];
        var dur = notes[i][1];
        voice(freq, offset, dur * 0.9, 'sine', 0.14);
        voice(freq, offset, dur * 0.85, 'sine', 0.04, 5);
        pad(freq * 0.5, offset, dur * 0.7, 0.05);
        offset += dur;
      }
      var lastFreq = notes[notes.length - 1][0];
      pad(lastFreq, offset, 0.4, 0.08);
      pad(lastFreq * 1.5, offset, 0.35, 0.05);
      pad(lastFreq * 0.5, offset, 0.5, 0.05);
    },

    getActiveNodeCount: function () { return nodes; },

    setVolume: function (v) {
      if (!master || !ctx) return;
      master.gain.setValueAtTime(Math.max(0, Math.min(1, v)) * 0.6, ctx.currentTime);
    },

    setEnabled: function (v) {
      enabled = !!v;
      if (master && ctx) {
        master.gain.setValueAtTime(enabled ? 0.6 : 0, ctx.currentTime);
      }
    }
  };
})();
