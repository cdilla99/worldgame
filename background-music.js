/* Global background music controller. Audio failures must never affect gameplay. */
(function () {
  'use strict';

  var TRACKS = ['Dune 1.ogg', 'Dune 2.ogg', 'Soup 1.ogg', 'Soup 2.ogg', 'Soup 3.ogg'];
  var VOLUME = 0.12;
  var currentAudio = null;
  var lastTrackIndex = -1;
  var muted = false;

  function chooseTrackIndex() {
    if (TRACKS.length < 2) return 0;

    var index = Math.floor(Math.random() * TRACKS.length);
    while (index === lastTrackIndex) {
      index = Math.floor(Math.random() * TRACKS.length);
    }
    return index;
  }

  function createAudio(track) {
    try {
      if (typeof window.Audio !== 'function') return null;

      var audio = new window.Audio('sounds/' + encodeURIComponent(track));
      audio.loop = true;
      audio.volume = VOLUME;
      audio.muted = muted;
      audio.addEventListener('error', function () {});
      return audio;
    } catch (error) {
      return null;
    }
  }

  function stop() {
    var audio = currentAudio;
    currentAudio = null;
    if (!audio) return;

    try { audio.pause(); } catch (error) {}
    try { audio.currentTime = 0; } catch (error) {}
  }

  function start() {
    stop();

    var trackIndex = chooseTrackIndex();
    lastTrackIndex = trackIndex;
    var audio = createAudio(TRACKS[trackIndex]);
    if (!audio) return;

    currentAudio = audio;
    try {
      var playback = audio.play();
      if (playback && typeof playback.catch === 'function') playback.catch(function () {});
    } catch (error) {}
  }

  function setMuted(value) {
    muted = !!value;
    if (!currentAudio) return;
    try { currentAudio.muted = muted; } catch (error) {}
  }

  window.BackgroundMusic = { start: start, stop: stop, setMuted: setMuted };
})();