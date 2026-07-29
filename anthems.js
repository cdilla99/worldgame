/**
 * National Anthem Snippets — first 6 notes of each country's anthem
 * Notes stored as [frequency (Hz), duration (seconds)] pairs
 * Synthesized via Web Audio — no audio files needed
 *
 * Sources: Public domain melodies, transcribed to frequency/duration pairs.
 * Only the opening 4-8 notes — enough to be recognizable, short enough for gameplay.
 */
(function () {
  'use strict';

  // Note frequency reference (middle octave)
  var N = {
    C4: 262, D4: 294, Eb4: 311, E4: 330, F4: 349, Fs4: 370, G4: 392, Ab4: 415, A4: 440, Bb4: 466, B4: 494,
    C5: 523, Cs5: 554, D5: 587, Eb5: 622, E5: 659, F5: 698, Fs5: 740, G5: 784, Ab5: 831, A5: 880, Bb5: 932, B5: 988,
    C6: 1047, D6: 1175, E6: 1319, F6: 1397, G6: 1568
  };

  // Each anthem: array of [frequency, durationInSeconds]
  // Kept to 6 notes max for quick playback (~1.5-2 seconds total)
  var anthems = {
    // Star-Spangled Banner: "Oh say can you see"
    'United States': [[N.G4,0.3],[N.E4,0.2],[N.C4,0.3],[N.E4,0.2],[N.G4,0.3],[N.C5,0.5]],
    // O Canada: "O Ca-na-da"
    'Canada': [[N.G4,0.4],[N.G4,0.15],[N.G4,0.4],[N.C4,0.6],[N.E4,0.3],[N.G4,0.4]],
    // Himno Nacional Mexicano: opening
    'Mexico': [[N.A4,0.2],[N.A4,0.2],[N.A4,0.3],[N.D5,0.4],[N.D5,0.2],[N.Cs5,0.4]],
    // Hino Nacional Brasileiro
    'Brazil': [[N.G4,0.15],[N.E4,0.15],[N.C5,0.3],[N.B4,0.15],[N.A4,0.15],[N.G4,0.4]],
    // Himno Nacional Argentino
    'Argentina': [[N.E5,0.3],[N.E5,0.15],[N.E5,0.15],[N.E5,0.3],[N.F5,0.2],[N.E5,0.4]],
    // God Save the King
    'United Kingdom': [[N.G4,0.3],[N.G4,0.3],[N.A4,0.3],[N.Fs4,0.2],[N.G4,0.3],[N.A4,0.3]],
    // La Marseillaise
    'France': [[N.C5,0.2],[N.C5,0.2],[N.C5,0.3],[N.F5,0.4],[N.F5,0.2],[N.E5,0.3]],
    // Deutschlandlied
    'Germany': [[N.C5,0.3],[N.D5,0.2],[N.E5,0.3],[N.F5,0.3],[N.G5,0.3],[N.A5,0.4]],
    // Il Canto degli Italiani (Fratelli d'Italia)
    'Italy': [[N.E4,0.15],[N.F4,0.15],[N.G4,0.3],[N.G4,0.15],[N.A4,0.15],[N.G4,0.4]],
    // Marcha Real (no lyrics, instrumental)
    'Spain': [[N.C5,0.2],[N.D5,0.2],[N.E5,0.3],[N.C5,0.2],[N.E5,0.2],[N.G5,0.4]],
    // A Portuguesa
    'Portugal': [[N.E5,0.2],[N.E5,0.2],[N.D5,0.2],[N.C5,0.3],[N.D5,0.2],[N.E5,0.4]],
    // Advance Australia Fair
    'Australia': [[N.C5,0.3],[N.C5,0.15],[N.D5,0.15],[N.E5,0.3],[N.E5,0.15],[N.F5,0.15]],
    // God Defend New Zealand
    'New Zealand': [[N.E5,0.3],[N.D5,0.2],[N.C5,0.3],[N.D5,0.2],[N.E5,0.3],[N.F5,0.3]],
    // Kimigayo
    'Japan': [[N.D4,0.4],[N.D4,0.3],[N.E4,0.3],[N.G4,0.4],[N.A4,0.3],[N.G4,0.4]],
    // March of the Volunteers
    'China': [[N.G4,0.15],[N.G4,0.15],[N.G4,0.3],[N.Eb4,0.4],[N.F4,0.2],[N.G4,0.4]],
    // Jana Gana Mana
    'India': [[N.C5,0.3],[N.C5,0.2],[N.C5,0.2],[N.D5,0.3],[N.C5,0.2],[N.B4,0.3]],
    // State Anthem of Russia
    'Russia': [[N.F4,0.3],[N.Bb4,0.4],[N.Bb4,0.2],[N.A4,0.3],[N.Bb4,0.2],[N.C5,0.4]],
    // National Anthem of South Africa (Nkosi Sikelel' iAfrika)
    'South Africa': [[N.E4,0.3],[N.E4,0.2],[N.E4,0.3],[N.G4,0.4],[N.G4,0.2],[N.F4,0.3]],
    // Arise, O Compatriots (Nigeria)
    'Nigeria': [[N.C5,0.3],[N.C5,0.2],[N.D5,0.2],[N.E5,0.4],[N.D5,0.2],[N.C5,0.3]],
    // Ee Mungu Nguvu Yetu (Kenya)
    'Kenya': [[N.G4,0.3],[N.A4,0.2],[N.B4,0.3],[N.C5,0.4],[N.B4,0.2],[N.A4,0.3]],
    // İstiklâl Marşı (Turkey)
    'Turkey': [[N.G4,0.2],[N.G4,0.2],[N.A4,0.3],[N.Bb4,0.3],[N.A4,0.2],[N.G4,0.4]],
    // National Anthem of Saudi Arabia (Royal Salute)
    'Saudi Arabia': [[N.D5,0.3],[N.D5,0.2],[N.E5,0.2],[N.D5,0.3],[N.C5,0.2],[N.Bb4,0.4]],
    // Indonesia Raya
    'Indonesia': [[N.G4,0.3],[N.E4,0.2],[N.E4,0.2],[N.G4,0.3],[N.E4,0.2],[N.C5,0.4]],
    // Phleng Chat Thai
    'Thailand': [[N.G4,0.3],[N.A4,0.3],[N.B4,0.3],[N.C5,0.3],[N.D5,0.3],[N.E5,0.4]],
    // Tiến Quân Ca (Vietnam)
    'Vietnam': [[N.C5,0.2],[N.E5,0.3],[N.E5,0.2],[N.E5,0.2],[N.D5,0.2],[N.C5,0.4]],
    // Lupang Hinirang (Philippines)
    'Philippines': [[N.G4,0.2],[N.C5,0.3],[N.E5,0.4],[N.D5,0.2],[N.C5,0.2],[N.D5,0.3]],
    // Negaraku (Malaysia)
    'Malaysia': [[N.G4,0.3],[N.G4,0.15],[N.A4,0.15],[N.B4,0.3],[N.A4,0.15],[N.G4,0.4]],
    // Majulah Singapura
    'Singapore': [[N.C5,0.3],[N.D5,0.2],[N.E5,0.3],[N.G5,0.4],[N.E5,0.2],[N.D5,0.3]],
    // Aegukga (South Korea)
    'South Korea': [[N.G4,0.3],[N.G4,0.2],[N.A4,0.2],[N.A4,0.3],[N.G4,0.2],[N.E4,0.4]],
    // Egyptian National Anthem
    'Egypt': [[N.C5,0.3],[N.C5,0.2],[N.Bb4,0.2],[N.A4,0.3],[N.G4,0.2],[N.A4,0.4]],
    // Hymne Chérifien (Morocco)
    'Morocco': [[N.D5,0.3],[N.D5,0.2],[N.E5,0.2],[N.F5,0.3],[N.E5,0.2],[N.D5,0.4]],
    // Ethiopia, Wodefit Gesgeshi
    'Ethiopia': [[N.C5,0.3],[N.D5,0.2],[N.E5,0.3],[N.G5,0.3],[N.E5,0.2],[N.D5,0.3]],
  };

  window.Anthems = {
    /**
     * Get anthem notes for a country name.
     * @param {string} countryName
     * @returns {Array|null} array of [freq, duration] pairs, or null if not found
     */
    get: function (countryName) {
      return anthems[countryName] || null;
    },

    /**
     * Check if a country has anthem data.
     * @param {string} countryName
     * @returns {boolean}
     */
    has: function (countryName) {
      return countryName in anthems;
    }
  };
})();
