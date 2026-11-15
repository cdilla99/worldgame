/* Explorer-only geographic features; never part of the country quiz pool. */
(function (root) {
  'use strict';
  root.GeoWarsExplorerFeatures = Object.freeze([Object.freeze({
    id: 2001, name: 'Antarctica', kind: 'continent',
    aliases: ['South Pole', 'Antarctic'],
    continent: 'Antarctica', subregion: 'Southern polar region',
    status: 'A continent governed through the Antarctic Treaty System.',
    capital: null, population_hint: 'No permanent population',
    area_hint: 'about 14 million square kilometers', main_languages: [], currency: null, neighbors: [],
    landmarks: ['Geographic South Pole · 90°S'],
    fun_facts: ['The geographic South Pole is where every line of longitude meets in the Southern Hemisphere.'],
    flag: null, flagNote: 'Antarctica has no national flag.'
  })]);
})(window);
