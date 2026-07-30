/* Global background music controller. Audio failures must never affect gameplay. */
(function () {
  'use strict';

  var TRACKS = ['Dune 1.ogg', 'Dune 2.ogg', 'Soup 1.ogg', 'Soup 2.ogg', 'Soup 3.ogg'];
  var VOLUME = 0.12;
  var currentAudio = null;
  var preparedAudio = null;
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
      audio.preload = 'auto';
      audio.volume = VOLUME;
      audio.muted = muted;
      audio.addEventListener('error', function () {});
      return audio;
    } catch (error) {
      return null;
    }
  }

  function prepare() {
    if (preparedAudio) return preparedAudio;
    var trackIndex = chooseTrackIndex();
    lastTrackIndex = trackIndex;
    preparedAudio = createAudio(TRACKS[trackIndex]);
    if (preparedAudio) {
      try { preparedAudio.load(); } catch (error) {}
    }
    return preparedAudio;
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

    var audio = preparedAudio || prepare();
    preparedAudio = null;
    if (!audio) return Promise.resolve(false);

    currentAudio = audio;
    audio.muted = muted;
    try {
      var playback = audio.play();
      if (playback && typeof playback.then === 'function') {
        return playback.then(function () { return true; }).catch(function () {
          if (currentAudio === audio) currentAudio = null;
          return false;
        });
      }
      return Promise.resolve(!audio.paused);
    } catch (error) {
      if (currentAudio === audio) currentAudio = null;
      return Promise.resolve(false);
    }
  }
  function setMuted(value) {
    muted = !!value;
    if (!currentAudio) return;
    try { currentAudio.muted = muted; } catch (error) {}
  }

  function isMuted() {
    return muted;
  }

  function isPlaying() {
    return !!currentAudio && !currentAudio.paused;
  }

  window.BackgroundMusic = Object.freeze({
    prepare: prepare,
    start: start,
    stop: stop,
    setMuted: setMuted,
    isMuted: isMuted,
    isPlaying: isPlaying
  });

  prepare();
})();
