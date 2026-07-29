const COUNTRY_ROWS = [
  ["United States","North America","easy"],["Canada","North America","easy"],["Mexico","North America","easy"],["Brazil","South America","easy"],["Argentina","South America","easy"],["United Kingdom","Europe","easy"],["France","Europe","easy"],["Germany","Europe","easy"],
  ["Italy","Europe","easy"],["Spain","Europe","easy"],["Portugal","Europe","easy"],["Australia","Oceania","easy"],["New Zealand","Oceania","easy"],["Japan","Asia","easy"],["China","Asia","easy"],["India","Asia","easy"],
  ["Russia","Asia","easy"],["South Africa","Africa","easy"],["Nigeria","Africa","easy"],["Kenya","Africa","easy"],["Ethiopia","Africa","easy"],["Turkey","Asia","easy"],["Saudi Arabia","Asia","easy"],["Indonesia","Asia","easy"],
  ["Thailand","Asia","easy"],["Vietnam","Asia","medium"],["Philippines","Asia","medium"],["Malaysia","Asia","medium"],["Singapore","Asia","medium"],["South Korea","Asia","medium"],["Egypt","Africa","medium"],["Morocco","Africa","medium"],
  ["Algeria","Africa","medium"],["Tunisia","Africa","medium"],["Ghana","Africa","medium"],["Tanzania","Africa","medium"],["Uganda","Africa","medium"],["Democratic Republic of the Congo","Africa","medium"],["Angola","Africa","medium"],["Peru","South America","medium"],
  ["Chile","South America","medium"],["Colombia","South America","medium"],["Venezuela","South America","medium"],["Bolivia","South America","medium"],["Ecuador","South America","medium"],["Paraguay","South America","medium"],["Uruguay","South America","medium"],["Guatemala","North America","medium"],
  ["Cuba","North America","medium"],["Dominican Republic","North America","medium"],["Costa Rica","North America","medium"],["Panama","North America","medium"],["Haiti","North America","medium"],["Jamaica","North America","medium"],["Iceland","Europe","medium"],["Ireland","Europe","medium"],
  ["Sweden","Europe","medium"],["Norway","Europe","medium"],["Finland","Europe","medium"],["Denmark","Europe","medium"],["Netherlands","Europe","medium"],["Belgium","Europe","medium"],["Switzerland","Europe","medium"],["Austria","Europe","medium"],
  ["Greece","Europe","medium"],["Poland","Europe","medium"],["Czechia","Europe","medium"],["Hungary","Europe","medium"],["Israel","Asia","medium"],["Jordan","Asia","medium"],["United Arab Emirates","Asia","medium"],["Qatar","Asia","medium"],
  ["Iran","Asia","medium"],["Pakistan","Asia","medium"],["Bangladesh","Asia","medium"],["Iraq","Asia","hard"],["Syria","Asia","hard"],["Lebanon","Asia","hard"],["Armenia","Asia","hard"],["Georgia","Asia","hard"],
  ["Azerbaijan","Asia","hard"],["Oman","Asia","hard"],["Kuwait","Asia","hard"],["Bahrain","Asia","hard"],["Yemen","Asia","hard"],["Afghanistan","Asia","hard"],["Nepal","Asia","hard"],["Bhutan","Asia","hard"],
  ["Sri Lanka","Asia","hard"],["Maldives","Asia","hard"],["Cambodia","Asia","hard"],["Laos","Asia","hard"],["Myanmar","Asia","hard"],["Brunei","Asia","hard"],["Timor-Leste","Asia","hard"],["Mongolia","Asia","hard"],
  ["Kazakhstan","Asia","hard"],["Uzbekistan","Asia","hard"],["Kyrgyzstan","Asia","hard"],["Tajikistan","Asia","hard"],["Turkmenistan","Asia","hard"],["North Korea","Asia","hard"],["Botswana","Africa","hard"],["Namibia","Africa","hard"],
  ["Zimbabwe","Africa","hard"],["Zambia","Africa","hard"],["Malawi","Africa","hard"],["Mozambique","Africa","hard"],["Rwanda","Africa","hard"],["Burundi","Africa","hard"],["Madagascar","Africa","hard"],["Mauritius","Africa","hard"],
  ["Seychelles","Africa","hard"],["Cape Verde","Africa","hard"],["Senegal","Africa","hard"],["Mali","Africa","hard"],["Niger","Africa","hard"],["Burkina Faso","Africa","hard"],["Sierra Leone","Africa","hard"],["Liberia","Africa","hard"],
  ["Ivory Coast","Africa","hard"],["Central African Republic","Africa","hard"],["Gabon","Africa","hard"],["Republic of the Congo","Africa","hard"],["Equatorial Guinea","Africa","hard"],["Ukraine","Europe","easy"],["Romania","Europe","easy"],["Belarus","Europe","medium"],
  ["Bulgaria","Europe","medium"],["Croatia","Europe","medium"],["Serbia","Europe","medium"],["Slovakia","Europe","medium"],["Slovenia","Europe","medium"],["Latvia","Europe","medium"],["Lithuania","Europe","medium"],["Estonia","Europe","medium"],
  ["Albania","Europe","medium"],["Bosnia and Herzegovina","Europe","medium"],["North Macedonia","Europe","medium"],["Montenegro","Europe","medium"],["Moldova","Europe","medium"],["Malta","Europe","hard"],["Luxembourg","Europe","hard"],["Liechtenstein","Europe","expert"],
  ["Monaco","Europe","expert"],["Andorra","Europe","expert"],["San Marino","Europe","expert"],["Vatican City","Europe","expert"],["Kosovo","Europe","medium"],["Trinidad and Tobago","North America","medium"],["Barbados","North America","medium"],["Bahamas","North America","medium"],
  ["Belize","North America","medium"],["Guyana","South America","medium"],["Suriname","South America","hard"],["Honduras","North America","medium"],["El Salvador","North America","medium"],["Nicaragua","North America","medium"],["Grenada","North America","hard"],["Saint Lucia","North America","hard"],
  ["Antigua and Barbuda","North America","hard"],["Saint Kitts and Nevis","North America","expert"],["Dominica","North America","hard"],["Saint Vincent and the Grenadines","North America","hard"],["Cameroon","Africa","medium"],["Benin","Africa","hard"],["Togo","Africa","hard"],["Guinea","Africa","hard"],
  ["Guinea-Bissau","Africa","hard"],["Gambia","Africa","hard"],["Somalia","Africa","medium"],["Sudan","Africa","medium"],["South Sudan","Africa","hard"],["Libya","Africa","medium"],["Eritrea","Africa","hard"],["Djibouti","Africa","hard"],
  ["Comoros","Africa","hard"],["Mauritania","Africa","hard"],["Chad","Africa","hard"],["Lesotho","Africa","hard"],["Eswatini","Africa","hard"],["Sao Tome and Principe","Africa","expert"],["Taiwan","Asia","medium"],["Papua New Guinea","Oceania","medium"],
  ["Fiji","Oceania","medium"],["Samoa","Oceania","hard"],["Tonga","Oceania","expert"],["Solomon Islands","Oceania","hard"],["Vanuatu","Oceania","hard"],["Kiribati","Oceania","expert"],["Micronesia","Oceania","expert"],["Palau","Oceania","expert"],
  ["Marshall Islands","Oceania","expert"],["Nauru","Oceania","expert"],["Tuvalu","Oceania","expert"],["Cyprus","Europe","hard"],["Palestine","Asia","hard"]
];

const COUNTRY_INDEX_KEY = Symbol.for('GeoWars.countryIndex');
const generatedCountries = Object.freeze(COUNTRY_ROWS.map(([name, continent, difficulty], index) =>
  Object.freeze({ id: index + 1, name, continent, difficulty })
));
const sharedCountries = globalThis[COUNTRY_INDEX_KEY];

export const countries = Array.isArray(sharedCountries) && sharedCountries.length === generatedCountries.length
  ? sharedCountries
  : generatedCountries;
globalThis[COUNTRY_INDEX_KEY] = countries;

export function getIndex() {
  return countries;
}

export function filterIndex(predicate) {
  if (typeof predicate === 'function') return countries.filter(predicate);
  if (!predicate || typeof predicate !== 'object' || Array.isArray(predicate)) {
    throw new TypeError('filterIndex expects a predicate function or filter object');
  }

  const { continent, difficulty } = predicate;
  return countries.filter(country =>
    (!continent || continent === 'all' || country.continent === continent) &&
    (!difficulty || difficulty === 'all' || country.difficulty === difficulty)
  );
}

export function findCountryByName(name) {
  if (typeof name !== 'string') return undefined;
  const normalizedName = name.trim().toLocaleLowerCase('en');
  if (!normalizedName) return undefined;
  return countries.find(country => country.name.toLocaleLowerCase('en') === normalizedName);
}
