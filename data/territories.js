/* Explorer-only geographic territories and dependencies. These do not change the canonical 195-country game. */
(function installExplorerTerritories(global) {
  'use strict';

  function flagFor(code) {
    return Array.from(code.toUpperCase(), letter =>
      String.fromCodePoint(0x1F1E6 + letter.charCodeAt(0) - 65)
    ).join('');
  }

  const territories = [
    {
      id: 1001, name: 'French Guiana', iso2: 'GF', countryCode: 'GF', geometryCode: 'GUF',
      kind: 'territory', parentId: 7, parentName: 'France', status: 'Overseas department and region of France',
      flagNote: 'Regional flag shown. The French tricolour is the official national flag.',
      continent: 'South America', subregion: 'South America', capital: 'Cayenne',
      population_hint: 'about 300,000 people', area_hint: 'around 83,500 square kilometers',
      main_languages: ['French', 'French Guianese Creole'], currency: 'Euro',
      neighbors: ['Brazil', 'Suriname'], landmarks: ['Guiana Space Centre'],
      fun_facts: ['A South American territory that is also an outermost region of the European Union']
    },
    {
      id: 1002, name: 'Guadeloupe', iso2: 'GP', countryCode: 'GP', geometryCode: 'GLP',
      kind: 'territory', parentId: 7, parentName: 'France', status: 'Overseas department and region of France',
      flagNote: 'Local flag shown. The French tricolour is the official national flag.',
      continent: 'North America', subregion: 'Caribbean', capital: 'Basse-Terre',
      population_hint: 'about 380,000 people', area_hint: 'around 1,630 square kilometers',
      main_languages: ['French', 'Guadeloupean Creole'], currency: 'Euro', neighbors: [],
      landmarks: ['La Soufrière volcano'], fun_facts: ['Its butterfly-shaped main islands sit in the Lesser Antilles']
    },
    {
      id: 1003, name: 'Martinique', iso2: 'MQ', countryCode: 'MQ', geometryCode: 'MTQ',
      kind: 'territory', parentId: 7, parentName: 'France', status: 'Territorial collectivity of France',
      flagNote: 'Martinique’s territorial flag is shown.',
      continent: 'North America', subregion: 'Caribbean', capital: 'Fort-de-France',
      population_hint: 'about 350,000 people', area_hint: 'around 1,130 square kilometers',
      main_languages: ['French', 'Martinican Creole'], currency: 'Euro', neighbors: [],
      landmarks: ['Mount Pelée'], fun_facts: ['Mount Pelée rises above an island shaped by volcanic activity']
    },
    {
      id: 1004, name: 'Réunion', iso2: 'RE', countryCode: 'RE', geometryCode: 'REU',
      kind: 'territory', parentId: 7, parentName: 'France', status: 'Overseas department and region of France',
      flagNote: 'Local flag shown. The French tricolour is the official national flag.',
      continent: 'Africa', subregion: 'Indian Ocean', capital: 'Saint-Denis',
      population_hint: 'about 880,000 people', area_hint: 'around 2,510 square kilometers',
      main_languages: ['French', 'Réunion Creole'], currency: 'Euro', neighbors: [],
      landmarks: ['Piton de la Fournaise'], fun_facts: ['One of the world’s most active volcanoes rises from this Indian Ocean island']
    },
    {
      id: 1005, name: 'Mayotte', iso2: 'YT', countryCode: 'YT', geometryCode: 'MYT',
      kind: 'territory', parentId: 7, parentName: 'France', status: 'Overseas department and region of France',
      flagNote: 'Local emblem shown. The French tricolour is the official national flag.',
      continent: 'Africa', subregion: 'Indian Ocean', capital: 'Mamoudzou',
      population_hint: 'about 320,000 people', area_hint: 'around 374 square kilometers',
      main_languages: ['French', 'Shimaore', 'Kibushi'], currency: 'Euro', neighbors: [],
      landmarks: ['Mount Choungui'], fun_facts: ['A vast coral lagoon surrounds much of the island group']
    },
    {
      id: 1006, name: 'Bonaire', iso2: 'BQ', countryCode: 'BQ', geometryCode: 'NLY',
      geometryBounds: [-69.0, 11.8, -67.8, 12.6], kind: 'territory', parentName: 'Netherlands',
      status: 'Caribbean public body of the Netherlands', flagNote: 'A shared Caribbean Netherlands flag asset is shown; Bonaire also has a distinct island flag.',
      continent: 'North America', subregion: 'Caribbean', capital: 'Kralendijk',
      population_hint: 'about 25,000 people', area_hint: 'around 288 square kilometers',
      main_languages: ['Dutch', 'Papiamentu'], currency: 'US dollar', neighbors: [],
      landmarks: ['Washington Slagbaai National Park'], fun_facts: ['Protected reefs make the island a renowned shore-diving destination']
    },
    {
      id: 1007, name: 'Sint Eustatius', iso2: 'BQ', countryCode: 'BQ', geometryCode: 'NLY',
      geometryBounds: [-63.1, 17.4, -62.8, 17.7], kind: 'territory', parentName: 'Netherlands',
      status: 'Caribbean public body of the Netherlands', flagNote: 'A shared Caribbean Netherlands flag asset is shown; Sint Eustatius also has a distinct island flag.',
      continent: 'North America', subregion: 'Caribbean', capital: 'Oranjestad',
      population_hint: 'about 3,200 people', area_hint: 'around 21 square kilometers',
      main_languages: ['Dutch', 'English'], currency: 'US dollar', neighbors: [],
      landmarks: ['The Quill volcano'], fun_facts: ['The island was once one of the Caribbean’s busiest trading ports']
    },
    {
      id: 1008, name: 'Saba', iso2: 'BQ', countryCode: 'BQ', geometryCode: 'NLY',
      geometryBounds: [-63.4, 17.5, -63.1, 17.8], kind: 'territory', parentName: 'Netherlands',
      status: 'Caribbean public body of the Netherlands', flagNote: 'A shared Caribbean Netherlands flag asset is shown; Saba also has a distinct island flag.',
      continent: 'North America', subregion: 'Caribbean', capital: 'The Bottom',
      population_hint: 'about 2,000 people', area_hint: 'around 13 square kilometers',
      main_languages: ['Dutch', 'English'], currency: 'US dollar', neighbors: [],
      landmarks: ['Mount Scenery'], fun_facts: ['The highest point in the European Netherlands rises on this tiny volcanic island']
    },
    {
      id: 1009, name: 'Christmas Island', iso2: 'CX', countryCode: 'CX', geometryCode: 'CXR',
      kind: 'territory', parentName: 'Australia', status: 'External territory of Australia',
      flagNote: 'Christmas Island’s territory flag is shown.', continent: 'Asia', subregion: 'Indian Ocean',
      capital: 'Flying Fish Cove', population_hint: 'about 1,700 people', area_hint: 'around 135 square kilometers',
      main_languages: ['English', 'Malay', 'Mandarin Chinese'], currency: 'Australian dollar', neighbors: [],
      landmarks: ['Christmas Island National Park'], fun_facts: ['Millions of red crabs migrate from the forest to the sea each year']
    },
    {
      id: 1010, name: 'Cocos (Keeling) Islands', iso2: 'CC', countryCode: 'CC', geometryCode: 'CCK',
      kind: 'territory', parentName: 'Australia', status: 'External territory of Australia',
      flagNote: 'The Cocos (Keeling) Islands territory flag is shown.', continent: 'Asia', subregion: 'Indian Ocean',
      capital: 'West Island', population_hint: 'about 600 people', area_hint: 'around 14 square kilometers',
      main_languages: ['Cocos Malay', 'English'], currency: 'Australian dollar', neighbors: [],
      landmarks: ['Direction Island lagoon'], fun_facts: ['Two coral atolls contain 27 islands, but only two are inhabited']
    },
    {
      id: 1011, name: 'Svalbard', iso2: 'SJ', countryCode: 'NO', geometryCode: 'NSV',
      kind: 'territory', parentName: 'Norway', status: 'Norwegian Arctic archipelago under the Svalbard Treaty',
      flagNote: 'Svalbard uses the Norwegian flag.', continent: 'Europe', subregion: 'Arctic',
      capital: 'Longyearbyen', population_hint: 'about 2,500 residents', area_hint: 'around 61,000 square kilometers',
      main_languages: ['Norwegian', 'Russian'], currency: 'Norwegian krone', neighbors: [],
      landmarks: ['Svalbard Global Seed Vault'], fun_facts: ['Polar night and midnight sun divide the year at this High Arctic archipelago']
    },
    {
      id: 1012, name: 'Jan Mayen', iso2: 'SJ', countryCode: 'NO', geometryCode: 'NJM',
      kind: 'territory', parentName: 'Norway', status: 'Norwegian volcanic island in the Arctic Ocean',
      flagNote: 'Jan Mayen uses the Norwegian flag.', continent: 'Europe', subregion: 'Arctic',
      capital: 'Olonkinbyen', population_hint: 'a rotating staff of about 20 people', area_hint: 'around 377 square kilometers',
      main_languages: ['Norwegian'], currency: 'Norwegian krone', neighbors: [],
      landmarks: ['Beerenberg volcano'], fun_facts: ['The world’s northernmost active volcano dominates this remote island']
    },
    {
      id: 1013, name: 'Western Sahara', iso2: 'EH', countryCode: 'EH', geometryCode: 'SAH',
      kind: 'territory', parentName: null, status: 'Disputed, UN-listed Non-Self-Governing Territory',
      flagNote: 'The Sahrawi flag is shown; sovereignty remains disputed.', continent: 'Africa', subregion: 'Northern Africa',
      capital: 'El Aaiún / Laayoune (disputed)', population_hint: 'about 600,000 people',
      area_hint: 'around 266,000 square kilometers', main_languages: ['Arabic', 'Hassaniya Arabic', 'Spanish'],
      currency: 'Moroccan dirham and Sahrawi peseta', neighbors: ['Morocco', 'Algeria', 'Mauritania'],
      landmarks: ['Atlantic Sahara coast'], fun_facts: ['A long sand berm crosses much of this disputed desert territory']
    }
  ].map(territory => Object.freeze({ ...territory, flag: flagFor(territory.iso2) }));

  global.GeoWarsExplorerTerritories = Object.freeze(territories);
}(window));