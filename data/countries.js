// Core country card data. Flags use emoji for quick visuals.
const countryCards = [
  { id: 1, name: 'United States', difficulty: 'easy', stars: 1, continent: 'North America', subregion: 'Northern America', capital: 'Washington, D.C.', population_hint: 'about 330 million people', size_category: 'large', area_hint: 'around 9.8 million square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Canada', 'Mexico'], main_languages: ['English', 'Spanish'], currency: 'US dollar', landmarks: ['Grand Canyon', 'Statue of Liberty', 'Yellowstone geysers'], 
    fun_facts: [
      'Yellowstone became the world’s first national park in 1872',
      'Death Valley is the lowest point in North America at 282 feet below sea level',
      'Its territory stretches across eleven different climate zones, from Arctic tundra to tropical islands'
    ], 
    built_in_clue: 'A large North American republic with 50 states, stretching from the Atlantic to the Pacific.', nearby_country_clue: 'Borders Canada to the north and Mexico to the south.', flag: '🇺🇸' },

  { id: 2, name: 'Canada', difficulty: 'easy', stars: 1, continent: 'North America', subregion: 'Northern America', capital: 'Ottawa', population_hint: 'about 40 million people', size_category: 'large', area_hint: 'around 9.9 million square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['United States'], main_languages: ['English', 'French'], currency: 'Canadian dollar', landmarks: ['Niagara Falls', 'Banff peaks', 'CN Tower'], 
    fun_facts: [
      'Has over two million lakes, holding more natural freshwater than any other country on Earth',
      'Its coastline stretches over 125,000 miles, making it the longest in the world',
      'The Canadian Shield covers nearly half the country with bedrock that is billions of years old'
    ], 
    built_in_clue: 'The second-largest country by area in the world, famous for vast boreal forests and millions of freshwater lakes.', nearby_country_clue: 'Shares the world’s longest undefended border with the United States.', flag: '🇨🇦' },

  { id: 3, name: 'Mexico', difficulty: 'easy', stars: 1, continent: 'North America', subregion: 'Central America', capital: 'Mexico City', population_hint: 'about 125 million people', size_category: 'large', area_hint: 'around 1.9 million square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['United States', 'Guatemala', 'Belize'], main_languages: ['Spanish'], currency: 'Mexican peso', landmarks: ['Chichen Itza pyramid', 'Copper Canyon', 'Monarch butterfly forests'], 
    fun_facts: [
      'The Great Pyramid of Cholula is the largest pyramid on Earth by total volume',
      'Mexico City was built on an island in the middle of an ancient lake high in the mountains',
      'Millions of monarch butterflies migrate thousands of miles every winter to rest in its mountain forests'
    ], 
    built_in_clue: 'A North American nation known for ancient pyramids, high mountain valleys, and long Pacific and Gulf coasts.', nearby_country_clue: 'Sits south of the United States and north of Guatemala and Belize.', flag: '🇲🇽' },

  { id: 4, name: 'Brazil', difficulty: 'easy', stars: 1, continent: 'South America', subregion: 'South America', capital: 'Brasília', population_hint: 'about 215 million people', size_category: 'large', area_hint: 'around 8.5 million square kilometers', hemisphere: 'Southern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Argentina', 'Uruguay', 'Paraguay', 'Bolivia', 'Peru', 'Colombia', 'Venezuela', 'Guyana', 'Suriname', 'France (French Guiana)'], main_languages: ['Portuguese'], currency: 'Brazilian real', landmarks: ['Christ the Redeemer', 'Amazon River', 'Iguaçu Falls'], 
    fun_facts: [
      'The Pantanal is the planet’s largest tropical wetland, flooding seasonally across western Brazil',
      'Most of the Amazon Rainforest lies within Brazil',
      'Shares a border with ten different South American nations and territories'
    ], 
    built_in_clue: 'The largest country in South America, covering most of the Amazon River Basin.', nearby_country_clue: 'It borders every South American nation except Chile and Ecuador.', flag: '🇧🇷' },

  { id: 5, name: 'Argentina', difficulty: 'easy', stars: 1, continent: 'South America', subregion: 'South America', capital: 'Buenos Aires', population_hint: 'about 45 million people', size_category: 'large', area_hint: 'around 2.8 million square kilometers', hemisphere: 'Southern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Chile', 'Bolivia', 'Paraguay', 'Brazil', 'Uruguay'], main_languages: ['Spanish'], currency: 'Argentine peso', landmarks: ['Iguazú Falls', 'Perito Moreno Glacier', 'Patagonia steppe'], 
    fun_facts: [
      'Mount Aconcagua here is the tallest mountain peak in both the Western and Southern Hemispheres',
      'Features the Southern Patagonian Ice Field, one of the world’s largest expanses of ice outside the poles',
      'Contains the lowest land point in South America at Laguna del Carbón, 344 feet below sea level'
    ], 
    built_in_clue: 'A long Southern Cone country stretching from warm northern forests down to icy southern glaciers.', nearby_country_clue: 'Hugs the Andes beside Chile and meets Uruguay at the Río de la Plata.', flag: '🇦🇷' },

  { id: 6, name: 'United Kingdom', difficulty: 'easy', stars: 1, continent: 'Europe', subregion: 'Northern Europe', capital: 'London', population_hint: 'about 67 million people', size_category: 'medium', area_hint: 'around 243,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'island nation', neighbors: ['Ireland'], main_languages: ['English'], currency: 'Pound sterling', landmarks: ['Stonehenge', 'Loch Ness', 'Snowdonia'], 
    fun_facts: [
      'The Prime Meridian line, which sets 0° longitude for the world, passes through Greenwich in London',
      'Made up of four historical nations: England, Scotland, Wales, and Northern Ireland',
      'The Giant’s Causeway on its coast was formed by over 40,000 interlocking volcanic basalt columns'
    ], 
    built_in_clue: 'An island nation off northwestern Europe that houses the official Prime Meridian line.', nearby_country_clue: 'Shares its main island with Scotland and Wales, and a western neighbor across the Irish border.', flag: '🇬🇧' },

  { id: 7, name: 'France', difficulty: 'easy', stars: 1, continent: 'Europe', subregion: 'Western Europe', capital: 'Paris', population_hint: 'about 68 million people', size_category: 'medium', area_hint: 'around 551,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Spain', 'Italy', 'Germany', 'Belgium', 'Luxembourg', 'Switzerland', 'Andorra', 'Monaco'], main_languages: ['French'], currency: 'Euro', landmarks: ['Mont Saint-Michel', 'Loire châteaux', 'Verdon Gorge'], 
    fun_facts: [
      'France spans twelve time zones when its overseas territories are included',
      'Mont Blanc on France’s southeastern border is the tallest peak in Western Europe at 15,774 feet',
      'The Canal du Midi built here in the 1600s is one of Europe’s oldest working canal systems'
    ], 
    built_in_clue: 'A Western European nation stretching from high Alpine peaks to the Atlantic Ocean and Mediterranean Sea.', nearby_country_clue: 'Touches both the Mediterranean and the Atlantic, nestled between Spain and Germany.', flag: '🇫🇷' },

  { id: 8, name: 'Germany', difficulty: 'easy', stars: 1, continent: 'Europe', subregion: 'Western Europe', capital: 'Berlin', population_hint: 'about 84 million people', size_category: 'medium', area_hint: 'around 357,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Denmark', 'Poland', 'Czechia', 'Austria', 'Switzerland', 'France', 'Belgium', 'Luxembourg', 'Netherlands'], main_languages: ['German'], currency: 'Euro', landmarks: ['Neuschwanstein Castle', 'Black Forest', 'Rhine Valley'], 
    fun_facts: [
      'The Wadden Sea’s vast tidal mudflats shelter exceptionally rich coastal wildlife',
      'The Rhine River flows over 760 miles through the country, serving as a vital waterway for centuries',
      'Germany spans low northern plains, forested central hills, and the foothills of the southern Alps'
    ], 
    built_in_clue: 'A Central European country shaped by major river valleys, dense central forests, and foothills near the Alps.', nearby_country_clue: 'Sits between France to the west and Poland to the east in central Europe.', flag: '🇩🇪' },

  { id: 9, name: 'Italy', difficulty: 'easy', stars: 1, continent: 'Europe', subregion: 'Southern Europe', capital: 'Rome', population_hint: 'about 59 million people', size_category: 'medium', area_hint: 'around 301,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['France', 'Switzerland', 'Austria', 'Slovenia', 'San Marino', 'Vatican City'], main_languages: ['Italian'], currency: 'Euro', landmarks: ['Dolomites', 'Amalfi Coast', 'Etna volcano'], 
    fun_facts: [
      'Italy completely surrounds two independent countries: San Marino and Vatican City',
      'Mount Etna on Sicily is the tallest active volcano in Europe',
      'Contains more protected UNESCO World Heritage Sites than any other country in the world'
    ], 
    built_in_clue: 'A boot-shaped Southern European peninsula reaching into the Mediterranean, framed by the high Alps.', nearby_country_clue: 'Touches the Alps with France and Switzerland before stretching toward Sicily.', flag: '🇮🇹' },

  { id: 10, name: 'Spain', difficulty: 'easy', stars: 1, continent: 'Europe', subregion: 'Southern Europe', capital: 'Madrid', population_hint: 'about 47 million people', size_category: 'medium', area_hint: 'around 505,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['France', 'Portugal', 'Andorra', 'Gibraltar'], main_languages: ['Spanish'], currency: 'Euro', landmarks: ['Sagrada Família', 'Alhambra', 'Camino de Santiago'], 
    fun_facts: [
      'Mount Teide is Spain’s highest point, rising from the volcanic Canary Islands',
      'Spain covers most of the Iberian Peninsula and includes Mediterranean and Atlantic islands',
      'Its interior is dominated by the Meseta Central, a high plateau surrounded by mountain ranges'
    ], 
    built_in_clue: 'A Southwestern European country featuring a vast central plateau, Pyrenees borders, and Atlantic beaches.', nearby_country_clue: 'Shares the Iberian Peninsula with Portugal and touches France at the Pyrenees.', flag: '🇪🇸' },

  { id: 11, name: 'Portugal', difficulty: 'easy', stars: 1, continent: 'Europe', subregion: 'Southern Europe', capital: 'Lisbon', population_hint: 'about 10 million people', size_category: 'small', area_hint: 'around 92,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Spain'], main_languages: ['Portuguese'], currency: 'Euro', landmarks: ['Pena Palace', 'Douro Valley terraces', 'Azores lagoons'], 
    fun_facts: [
      'Cabo da Roca on its coast marks the westernmost point of continental Europe',
      'The Azores island chain includes Mount Pico, a volcanic peak rising straight out of the ocean floor',
      'The Douro River valley here was established in 1756 as one of the world’s first protected farming regions'
    ], 
    built_in_clue: 'The westernmost nation of mainland Europe, situated along the Atlantic coast of the Iberian Peninsula.', nearby_country_clue: 'Only land neighbor is Spain; the Atlantic handles the rest.', flag: '🇵🇹' },

  { id: 12, name: 'Australia', difficulty: 'easy', stars: 1, continent: 'Oceania', subregion: 'Australia and New Zealand', capital: 'Canberra', population_hint: 'about 26 million people', size_category: 'large', area_hint: 'around 7.7 million square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['English'], currency: 'Australian dollar', landmarks: ['Great Barrier Reef', 'Uluru', 'Great Ocean Road'], 
    fun_facts: [
      'The Great Barrier Reef is the largest coral reef system on Earth',
      'Australia is the only sovereign state occupying an entire continental mainland',
      'More than 80% of its native plants and animals are found nowhere else on the planet'
    ], 
    built_in_clue: 'An island continent known for its vast desert Outback, ancient geological rocks, and unique wildlife.', nearby_country_clue: 'Closest big neighbor is Indonesia to the northwest and New Zealand far southeast.', flag: '🇦🇺' },

  { id: 13, name: 'New Zealand', difficulty: 'easy', stars: 1, continent: 'Oceania', subregion: 'Australia and New Zealand', capital: 'Wellington', population_hint: 'about 5 million people', size_category: 'small', area_hint: 'around 268,000 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['English', 'Māori'], currency: 'New Zealand dollar', landmarks: ['Fiordland sounds', 'Tongariro volcanoes', 'Glowworm caves'], 
    fun_facts: [
      'Sits directly on a major tectonic plate boundary, creating active geysers, hot springs, and volcanoes',
      'Wellington is the southernmost national capital city in the world',
      'The Southern Alps range runs down its South Island, peaking at Mount Cook at 12,218 feet'
    ], 
    built_in_clue: 'A South Pacific nation made of two main mountainous islands shaped by volcanic and glacial power.', nearby_country_clue: 'Sits southeast of Australia across the Tasman Sea.', flag: '🇳🇿' },

  { id: 14, name: 'Japan', difficulty: 'easy', stars: 1, continent: 'Asia', subregion: 'Eastern Asia', capital: 'Tokyo', population_hint: 'about 125 million people', size_category: 'medium', area_hint: 'around 378,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Japanese'], currency: 'Japanese yen', landmarks: ['Mount Fuji', 'Arashiyama bamboo groves', 'Himeji Castle'], 
    fun_facts: [
      'Traditional wooden buildings use interlocking joints designed to flex during earthquakes',
      'Mount Fuji is an active volcano and the country’s tallest peak at 12,388 feet',
      'Japan is an island chain of more than 14,000 islands along the Pacific Ring of Fire'
    ], 
    built_in_clue: 'An East Asian island nation along the Pacific Ring of Fire, known for steep mountains and volcanoes.', nearby_country_clue: 'Lies east of the Korean Peninsula across the sea.', flag: '🇯🇵' },

  { id: 15, name: 'China', difficulty: 'easy', stars: 1, continent: 'Asia', subregion: 'Eastern Asia', capital: 'Beijing', population_hint: 'about 1.4 billion people', size_category: 'large', area_hint: 'around 9.6 million square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['India', 'Russia', 'Mongolia', 'Pakistan', 'Nepal', 'Bhutan', 'Myanmar', 'Laos', 'Vietnam', 'North Korea', 'Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Afghanistan'], main_languages: ['Mandarin Chinese'], currency: 'Renminbi (yuan)', landmarks: ['Great Wall', 'Guilin karsts', 'Terracotta Army'], 
    fun_facts: [
      'Shares land borders with fourteen different nations, tying for the most neighbors in the world',
      'The Yangtze River is the longest river in the world that flows inside a single country',
      'Home to the Tibetan Plateau, known as the "Roof of the World," averaging 14,800 feet high'
    ], 
    built_in_clue: 'A vast East Asian country stretching from high mountain plateaus to eastern coastal plains.', nearby_country_clue: 'Borders fourteen nations, including India and Russia.', flag: '🇨🇳' },

  { id: 16, name: 'India', difficulty: 'easy', stars: 1, continent: 'Asia', subregion: 'Southern Asia', capital: 'New Delhi', population_hint: 'about 1.4 billion people', size_category: 'large', area_hint: 'around 3.3 million square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Pakistan', 'China', 'Nepal', 'Bhutan', 'Bangladesh', 'Myanmar'], main_languages: ['Hindi', 'English'], currency: 'Indian rupee', landmarks: ['Taj Mahal', 'Himalayan foothills', 'Backwaters of Kerala'], 
    fun_facts: [
      'Mawsynram receives the world’s highest average annual rainfall',
      'Kangchenjunga on India’s northern border is the third-highest mountain on Earth',
      'Framed by the Himalayas in the north and surrounded by three major bodies of water in the south'
    ], 
    built_in_clue: 'A South Asian peninsula bordered by Himalayan mountain ranges and tropical ocean coastlines.', nearby_country_clue: 'Shares the Himalayas with Nepal and Bhutan and river plains with Bangladesh.', flag: '🇮🇳' },

  { id: 17, name: 'Russia', difficulty: 'easy', stars: 1, continent: 'Asia', subregion: 'Eastern Europe', capital: 'Moscow', population_hint: 'about 145 million people', size_category: 'large', area_hint: 'over 17 million square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['China', 'Mongolia', 'Kazakhstan', 'Ukraine', 'Belarus', 'Latvia', 'Estonia', 'Lithuania', 'Poland', 'Finland', 'Norway', 'Georgia', 'Azerbaijan', 'North Korea'], main_languages: ['Russian'], currency: 'Russian ruble', landmarks: ['Lake Baikal', 'Kamchatka volcanoes', 'Caucasus peaks'], 
    fun_facts: [
      'The largest country on Earth by land area, spanning eleven different time zones',
      'Lake Baikal here is the world’s deepest lake and holds about 20% of Earth’s unfrozen liquid freshwater',
      'The Siberian forest here is the largest continuous forest area anywhere on the planet'
    ], 
    built_in_clue: 'The largest country in the world, stretching all the way from Eastern Europe to the Pacific Ocean.', nearby_country_clue: 'Bridges Europe and Asia, bordering Norway in the west and China in the east.', flag: '🇷🇺' },

  { id: 18, name: 'South Africa', difficulty: 'easy', stars: 1, continent: 'Africa', subregion: 'Southern Africa', capital: 'Pretoria (administrative)', population_hint: 'about 60 million people', size_category: 'large', area_hint: 'around 1.2 million square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Namibia', 'Botswana', 'Zimbabwe', 'Mozambique', 'Eswatini', 'Lesotho'], main_languages: ['Zulu', 'English'], currency: 'South African rand', landmarks: ['Table Mountain', 'Kruger savanna', 'Drakensberg'], 
    fun_facts: [
      'South Africa completely surrounds the mountain kingdom of Lesotho',
      'Tugela Falls in the Drakensberg is one of the world’s highest cascading waterfalls',
      'Its southern Cape area holds thousands of unique plant species found nowhere else in Africa'
    ], 
    built_in_clue: 'The southernmost country on mainland Africa, featuring a high interior plateau framed by mountains.', nearby_country_clue: 'Wrapped around the enclaved Lesotho and sharing long borders with Namibia and Mozambique.', flag: '🇿🇦' },

  { id: 19, name: 'Nigeria', difficulty: 'easy', stars: 1, continent: 'Africa', subregion: 'Western Africa', capital: 'Abuja', population_hint: 'about 220 million people', size_category: 'large', area_hint: 'around 923,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Benin', 'Niger', 'Chad', 'Cameroon'], main_languages: ['English'], currency: 'Nigerian naira', landmarks: ['Zuma Rock', 'Yankari savanna', 'Niger Delta'], 
    fun_facts: [
      'Zuma Rock rises more than 2,300 feet near Nigeria’s capital',
      'Africa’s most populous country, located along the warm waters of the Gulf of Guinea',
      'The Niger Delta is one of Africa’s largest river-delta wetlands'
    ], 
    built_in_clue: 'A West African country featuring grassy savannas in the north and the huge Niger Delta on the coast.', nearby_country_clue: 'Borders Benin on the west and Cameroon on the east with the Gulf of Guinea to the south.', flag: '🇳🇬' },

  { id: 20, name: 'Kenya', difficulty: 'easy', stars: 1, continent: 'Africa', subregion: 'Eastern Africa', capital: 'Nairobi', population_hint: 'about 54 million people', size_category: 'medium', area_hint: 'around 580,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Tanzania', 'Uganda', 'South Sudan', 'Ethiopia', 'Somalia'], main_languages: ['Swahili', 'English'], currency: 'Kenyan shilling', landmarks: ['Maasai Mara savanna', 'Mount Kenya', 'Great Rift Valley lakes'], 
    fun_facts: [
      'Mount Kenya is the second-highest peak in Africa and has glaciers sitting right near the equator',
      'Cut directly in half by the equator, giving it landscapes ranging from coastal mangroves to cool highlands',
      'The Great Rift Valley passes through the country, forming a chain of deep freshwater and salt lakes'
    ], 
    built_in_clue: 'An East African equatorial nation cut by the Great Rift Valley and anchored by Mount Kenya.', nearby_country_clue: 'East African nation between Tanzania and Ethiopia with Indian Ocean beaches.', flag: '🇰🇪' },

  { id: 21, name: 'Ethiopia', difficulty: 'easy', stars: 1, continent: 'Africa', subregion: 'Eastern Africa', capital: 'Addis Ababa', population_hint: 'about 120 million people', size_category: 'medium', area_hint: 'around 1.1 million square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Eritrea', 'Djibouti', 'Somalia', 'Kenya', 'South Sudan', 'Sudan'], main_languages: ['Amharic'], currency: 'Ethiopian birr', landmarks: ['Lalibela rock churches', 'Simien Mountains', 'Danakil Depression'], 
    fun_facts: [
      'The Danakil Depression here is one of the lowest, hottest, and most active volcanic areas on Earth',
      'Its mountain highlands contain most of the high-altitude land found across the entire African continent',
      'The Blue Nile River begins here at Lake Tana, supplying most of the Nile’s total water volume'
    ], 
    built_in_clue: 'A landlocked Horn of Africa nation dominated by a high volcanic plateau and mountain ranges.', nearby_country_clue: 'Landlocked between Sudan, Kenya, and Somalia with a short outlet via Djibouti.', flag: '🇪🇹' },

  { id: 22, name: 'Turkey', difficulty: 'easy', stars: 1, continent: 'Asia', subregion: 'Western Asia', capital: 'Ankara', population_hint: 'about 85 million people', size_category: 'medium', area_hint: 'around 783,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Greece', 'Bulgaria', 'Georgia', 'Armenia', 'Iran', 'Iraq', 'Syria'], main_languages: ['Turkish'], currency: 'Turkish lira', landmarks: ['Cappadocia fairy chimneys', 'Pamukkale terraces', 'Mount Ararat'], 
    fun_facts: [
      'The Bosphorus Strait running through the country forms the geographic boundary between Europe and Asia',
      'Mount Ararat is an inactive volcanic mountain and the country’s highest point at 16,854 feet',
      'Pamukkale features bright white terraces created over thousands of years by warm mineral springs'
    ], 
    built_in_clue: 'A transcontinental nation straddling the Bosphorus Strait between Europe and Asia.', nearby_country_clue: 'Borders Greece and Bulgaria to the west and Iran to the east.', flag: '🇹🇷' },

  { id: 23, name: 'Saudi Arabia', difficulty: 'easy', stars: 1, continent: 'Asia', subregion: 'Western Asia', capital: 'Riyadh', population_hint: 'about 36 million people', size_category: 'large', area_hint: 'around 2.1 million square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Jordan', 'Iraq', 'Kuwait', 'Qatar', 'United Arab Emirates', 'Oman', 'Yemen', 'Bahrain (sea bridge)'], main_languages: ['Arabic'], currency: 'Saudi riyal', landmarks: ['Empty Quarter dunes', 'Al-Ula rock tombs', 'Red Sea coral coasts'], 
    fun_facts: [
      'The Empty Quarter is the world’s largest continuous sand desert',
      'Saudi Arabia covers roughly four-fifths of the Arabian Peninsula',
      'It is the largest country on Earth without any permanent natural surface rivers'
    ], 
    built_in_clue: 'The main sovereign nation on the Arabian Peninsula, bounded by the Red Sea and Persian Gulf.', nearby_country_clue: 'Shares long borders with Yemen and Oman to the south and Jordan to the north.', flag: '🇸🇦' },

  { id: 24, name: 'Indonesia', difficulty: 'easy', stars: 1, continent: 'Asia', subregion: 'South-Eastern Asia', capital: 'Jakarta', population_hint: 'about 275 million people', size_category: 'large', area_hint: 'around 1.9 million square kilometers (land and water)', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: ['Malaysia', 'Papua New Guinea', 'Timor-Leste'], main_languages: ['Indonesian'], currency: 'Indonesian rupiah', landmarks: ['Borobudur temple', 'Komodo National Park', 'Bali rice terraces'], 
    fun_facts: [
      'Komodo National Park is the only wild home of the world’s largest lizard',
      'Indonesia is the world’s largest island country, with more than 17,000 islands',
      'Lake Toba fills an ancient supervolcanic caldera formed during a major eruption about 74,000 years ago'
    ], 
    built_in_clue: 'An equatorial island country between the Indian and Pacific Oceans, home to hundreds of volcanoes.', nearby_country_clue: 'Shares Borneo with Malaysia and New Guinea island with Papua New Guinea.', flag: '🇮🇩' },

  { id: 25, name: 'Thailand', difficulty: 'easy', stars: 1, continent: 'Asia', subregion: 'South-Eastern Asia', capital: 'Bangkok', population_hint: 'about 70 million people', size_category: 'medium', area_hint: 'around 513,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Myanmar', 'Laos', 'Cambodia', 'Malaysia'], main_languages: ['Thai'], currency: 'Thai baht', landmarks: ['Phuket beaches', 'Ayutthaya ruins', 'Chiang Mai temples'], 
    fun_facts: [
      'Thailand shelters the bumblebee bat, one of Earth’s smallest mammals by body size',
      'The fertile Chao Phraya River valley forms Thailand’s agricultural heart',
      'Its southern coast features tall limestone rock towers rising straight out of the ocean'
    ], 
    built_in_clue: 'A Southeast Asian country featuring northern mountain ridges, central river plains, and southern coasts.', nearby_country_clue: 'Nestled between Myanmar and Laos with peninsular ties to Malaysia.', flag: '🇹🇭' },

  { id: 26, name: 'Vietnam', difficulty: 'medium', stars: 2, continent: 'Asia', subregion: 'South-Eastern Asia', capital: 'Hanoi', population_hint: 'about 98 million people', size_category: 'medium', area_hint: 'around 331,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['China', 'Laos', 'Cambodia'], main_languages: ['Vietnamese'], currency: 'Vietnamese dong', landmarks: ['Ha Long Bay karsts', 'Mekong Delta', 'Phong Nha caves'], 
    fun_facts: [
      'Ha Long Bay contains over 1,600 tall limestone islands rising out of the sea',
      'Son Doong Cave here is recognized as the largest cave passage in the world by volume',
      'Forms a narrow S-shape stretching over 1,000 miles from north to south'
    ], 
    built_in_clue: 'A narrow, S-shaped Southeast Asian coastal nation with famous limestone bays and river deltas.', nearby_country_clue: 'Hugs the South China Sea between China and Cambodia.', flag: '🇻🇳' },

  { id: 27, name: 'Philippines', difficulty: 'medium', stars: 2, continent: 'Asia', subregion: 'South-Eastern Asia', capital: 'Manila', population_hint: 'about 115 million people', size_category: 'medium', area_hint: 'around 300,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Filipino', 'English'], currency: 'Philippine peso', landmarks: ['Chocolate Hills', 'Banaue rice terraces', 'Palawan lagoons'], 
    fun_facts: [
      'Bohol’s Chocolate Hills comprise over 1,200 symmetrical dome-shaped limestone mounds',
      'The Philippines comprises 7,641 islands in the western Pacific',
      'The Puerto Princesa Subterranean River runs for miles through an underground cave directly to the sea'
    ], 
    built_in_clue: 'A Western Pacific island country known for thousands of tropical islands, ocean trenches, and limestone hills.', nearby_country_clue: 'North of Indonesia and east of Vietnam across the sea.', flag: '🇵🇭' },

  { id: 28, name: 'Malaysia', difficulty: 'medium', stars: 2, continent: 'Asia', subregion: 'South-Eastern Asia', capital: 'Kuala Lumpur', population_hint: 'about 33 million people', size_category: 'medium', area_hint: 'around 330,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Thailand', 'Singapore', 'Indonesia', 'Brunei'], main_languages: ['Malay'], currency: 'Malaysian ringgit', landmarks: ['Petronas Towers', 'Borneo rainforests', 'Langkawi beaches'], 
    fun_facts: [
      'Split into two regions separated by hundreds of miles of ocean: Peninsular Malaysia and Malaysian Borneo',
      'Mount Kinabalu on the island of Borneo is one of the tallest mountains in Southeast Asia at 13,435 feet',
      'Taman Negara National Park here contains one of the oldest tropical rainforests on the planet'
    ], 
    built_in_clue: 'A Southeast Asian country split between the Malay Peninsula and the northern portion of Borneo island.', nearby_country_clue: 'Borders Thailand in the north and wraps around tiny Brunei on Borneo.', flag: '🇲🇾' },

  { id: 29, name: 'Singapore', difficulty: 'medium', stars: 2, continent: 'Asia', subregion: 'South-Eastern Asia', capital: 'Singapore', population_hint: 'about 6 million people', size_category: 'small', area_hint: 'around 728 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: ['Malaysia', 'Indonesia'], main_languages: ['English', 'Malay'], currency: 'Singapore dollar', landmarks: ['Marina Bay skyline', 'Gardens by the Bay', 'Sentosa beaches'], 
    fun_facts: [
      'Singapore has expanded its land area by over 25 percent through reclamation',
      'Singapore is an island city-state just 85 miles north of the equator',
      'The Singapore Strait on its coast is one of the busiest shipping lanes in the world'
    ], 
    built_in_clue: 'A small island city-state located right at the southern tip of the Malay Peninsula.', nearby_country_clue: 'Linked by causeway to Malaysia and across straits from Indonesia.', flag: '🇸🇬' },

  { id: 30, name: 'South Korea', difficulty: 'medium', stars: 2, continent: 'Asia', subregion: 'Eastern Asia', capital: 'Seoul', population_hint: 'about 52 million people', size_category: 'small', area_hint: 'around 100,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['North Korea'], main_languages: ['Korean'], currency: 'South Korean won', landmarks: ['Jeju volcano', 'Gyeongbokgung Palace', 'DMZ viewpoints'], 
    fun_facts: [
      'The Korean Demilitarized Zone has unintentionally become a valuable wildlife refuge',
      'Mountain ranges cover roughly 70% of the country’s land area',
      'Jeju Island’s Hallasan volcano is South Korea’s highest point at 6,388 feet'
    ], 
    built_in_clue: 'A mountainous East Asian nation occupying the southern half of the Korean Peninsula.', nearby_country_clue: 'Shares its peninsula with a northern neighbor across the DMZ.', flag: '🇰🇷' },

  { id: 31, name: 'Egypt', difficulty: 'medium', stars: 2, continent: 'Africa', subregion: 'Northern Africa', capital: 'Cairo', population_hint: 'about 110 million people', size_category: 'medium', area_hint: 'around 1 million square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Libya', 'Sudan', 'Israel'], main_languages: ['Arabic'], currency: 'Egyptian pound', landmarks: ['Nile River', 'Red Sea reefs', 'White Desert'], 
    fun_facts: [
      'The Suez Canal connects the Mediterranean and Red seas for global shipping',
      'The Sinai Peninsula forms a land bridge between Africa and Asia',
      'More than 90% of the country consists of dry desert plains outside the Nile River valley'
    ], 
    built_in_clue: 'A transcontinental North African country centered on the fertile Nile River and Suez Canal.', nearby_country_clue: 'Sits northeast of Sudan and west of Israel, touching both Mediterranean and Red Seas.', flag: '🇪🇬' },

  { id: 32, name: 'Morocco', difficulty: 'medium', stars: 2, continent: 'Africa', subregion: 'Northern Africa', capital: 'Rabat', population_hint: 'about 37 million people', size_category: 'medium', area_hint: 'around 446,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Algeria', 'Western Sahara', 'Spain (Ceuta/Melilla)'], main_languages: ['Arabic', 'Tamazight'], currency: 'Moroccan dirham', landmarks: ['Atlas Mountains', 'Sahara dunes', 'Blue alleys of Chefchaouen'], 
    fun_facts: [
      'The High Atlas mountain range includes Mount Toubkal, the tallest peak in North Africa at 13,671 feet',
      'One of only two African nations to feature both Atlantic and Mediterranean coastlines',
      'The Strait of Gibraltar separates its northern tip from continental Europe by only 9 miles'
    ], 
    built_in_clue: 'A North African country known for high Atlas mountain ranges and dual Atlantic and Mediterranean coasts.', nearby_country_clue: 'Touches the Atlantic and Mediterranean and borders Algeria to the east.', flag: '🇲🇦' },

  { id: 33, name: 'Algeria', difficulty: 'medium', stars: 2, continent: 'Africa', subregion: 'Northern Africa', capital: 'Algiers', population_hint: 'about 45 million people', size_category: 'large', area_hint: 'around 2.4 million square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Tunisia', 'Libya', 'Niger', 'Mali', 'Mauritania', 'Western Sahara', 'Morocco'], main_languages: ['Arabic'], currency: 'Algerian dinar', landmarks: ['Sahara oases', 'Hoggar Mountains', 'Roman ruins of Timgad'], 
    fun_facts: [
      'The largest country by land area on the entire African continent',
      'The Sahara Desert covers over 80% of its total territory',
      'Tassili n\'Ajjer is a giant sandstone plateau featuring ancient rock carvings from prehistoric times'
    ], 
    built_in_clue: 'The largest country in Africa, dominated by vast Saharan sand seas and a northern Mediterranean coast.', nearby_country_clue: 'North of the Sahara between Morocco and Tunisia.', flag: '🇩🇿' },

  { id: 34, name: 'Tunisia', difficulty: 'medium', stars: 2, continent: 'Africa', subregion: 'Northern Africa', capital: 'Tunis', population_hint: 'about 12 million people', size_category: 'small', area_hint: 'around 164,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Algeria', 'Libya'], main_languages: ['Arabic'], currency: 'Tunisian dinar', landmarks: ['Amphitheater of El Jem', 'Sahara salt flats', 'Carthage ruins'], 
    fun_facts: [
      'Cape Angela here forms the absolute northernmost point of mainland Africa',
      'Chott el Djerid is a massive salt flat in its interior covering over 1,900 square miles',
      'Home to the coastal ruins of ancient Carthage on the Mediterranean'
    ], 
    built_in_clue: 'A North African coastal country holding mainland Africa’s northernmost point and large salt lakes.', nearby_country_clue: 'Wedged between Algeria and Libya with Mediterranean beaches to the north.', flag: '🇹🇳' },

  { id: 35, name: 'Ghana', difficulty: 'medium', stars: 2, continent: 'Africa', subregion: 'Western Africa', capital: 'Accra', population_hint: 'about 33 million people', size_category: 'small', area_hint: 'around 239,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Ivory Coast', 'Burkina Faso', 'Togo'], main_languages: ['English'], currency: 'Ghanaian cedi', landmarks: ['Cape Coast castles', 'Volta Lake', 'Kakum canopy walkway'], 
    fun_facts: [
      'Lake Volta here is the largest human-made reservoir in the world by surface area',
      'Sits on the Gulf of Guinea and is directly crossed by the Prime Meridian line at Tema',
      'Kakum National Park protects a dense tropical rainforest with a suspended canopy walkway'
    ], 
    built_in_clue: 'A West African nation on the Gulf of Guinea, home to Lake Volta and crossed by the Prime Meridian.', nearby_country_clue: 'Between Ivory Coast and Togo on West Africa’s coast.', flag: '🇬🇭' },

  { id: 36, name: 'Tanzania', difficulty: 'medium', stars: 2, continent: 'Africa', subregion: 'Eastern Africa', capital: 'Dodoma', population_hint: 'about 65 million people', size_category: 'large', area_hint: 'around 947,000 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Kenya', 'Uganda', 'Rwanda', 'Burundi', 'DR Congo', 'Zambia', 'Malawi', 'Mozambique'], main_languages: ['Swahili', 'English'], currency: 'Tanzanian shilling', landmarks: ['Serengeti plains', 'Mount Kilimanjaro', 'Zanzibar beaches'], 
    fun_facts: [
      'Mount Kilimanjaro here is the highest peak in Africa, standing 19,341 feet above sea level',
      'Lake Victoria on its northern border is the largest natural lake on the African continent',
      'The Ngorongoro Crater here is the world’s largest intact, unfilled, inactive volcanic caldera'
    ], 
    built_in_clue: 'An East African country containing Africa’s tallest peak and the vast Serengeti ecosystem.', nearby_country_clue: 'South of Kenya and north of Mozambique with big lakes on its western edge.', flag: '🇹🇿' },

  { id: 37, name: 'Uganda', difficulty: 'medium', stars: 2, continent: 'Africa', subregion: 'Eastern Africa', capital: 'Kampala', population_hint: 'about 48 million people', size_category: 'small', area_hint: 'around 241,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Kenya', 'South Sudan', 'DR Congo', 'Rwanda', 'Tanzania'], main_languages: ['English', 'Swahili'], currency: 'Ugandan shilling', landmarks: ['Lake Victoria shores', 'Rwenzori Mountains', 'Bwindi gorilla forests'], 
    fun_facts: [
      'The Rwenzori Mountains have snow-capped peaks almost directly on the equator',
      'The White Nile flows out of Lake Victoria at Jinja',
      'Bwindi Impenetrable Forest protects nearly half of all remaining mountain gorillas in the wild'
    ], 
    built_in_clue: 'A landlocked East African country located in the African Great Lakes region along the Nile River headwaters.', nearby_country_clue: 'Landlocked between Kenya and DR Congo, hugging Lake Victoria.', flag: '🇺🇬' },

  { id: 38, name: 'Democratic Republic of the Congo', difficulty: 'medium', stars: 2, continent: 'Africa', subregion: 'Middle Africa', capital: 'Kinshasa', population_hint: 'about 100 million people', size_category: 'large', area_hint: 'around 2.3 million square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Republic of the Congo', 'Central African Republic', 'South Sudan', 'Uganda', 'Rwanda', 'Burundi', 'Tanzania', 'Zambia', 'Angola'], main_languages: ['French', 'Lingala'], currency: 'Congolese franc', landmarks: ['Congo River', 'Virunga volcanoes', 'Okapi forests'], 
    fun_facts: [
      'Holds most of the Congo Basin, the second-largest tropical rainforest ecosystem on Earth',
      'The Congo River running through it is the deepest measured river in the world, over 700 feet deep',
      'Virunga National Park here is Africa’s oldest official protected national park, established in 1925'
    ], 
    built_in_clue: 'A vast Central African country centered around the huge Congo River Basin rainforests.', nearby_country_clue: 'Hugs nine neighbors including Angola and Uganda with a tiny Atlantic window.', flag: '🇨🇩' },

  { id: 39, name: 'Angola', difficulty: 'medium', stars: 2, continent: 'Africa', subregion: 'Middle Africa', capital: 'Luanda', population_hint: 'about 35 million people', size_category: 'large', area_hint: 'around 1.2 million square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Namibia', 'Zambia', 'DR Congo', 'Republic of the Congo'], main_languages: ['Portuguese'], currency: 'Angolan kwanza', landmarks: ['Kalandula Falls', 'Namibe desert', 'Okavango source highlands'], 
    fun_facts: [
      'Angola’s Welwitschia plants can survive for more than 1,000 years',
      'Kalandula Falls is one of Africa’s largest waterfalls by volume',
      'Includes Cabinda, a small oil-rich province separated from the rest of the country by the Congo River'
    ], 
    built_in_clue: 'A Southern Central African nation with a long Atlantic coast, high interior plateaus, and northern river forests.', nearby_country_clue: 'South of DR Congo and north of Namibia, with an exclave beyond the Congo River.', flag: '🇦🇴' },

  { id: 40, name: 'Peru', difficulty: 'medium', stars: 2, continent: 'South America', subregion: 'South America', capital: 'Lima', population_hint: 'about 34 million people', size_category: 'large', area_hint: 'around 1.3 million square kilometers', hemisphere: 'Southern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Ecuador', 'Colombia', 'Brazil', 'Bolivia', 'Chile'], main_languages: ['Spanish', 'Quechua'], currency: 'Peruvian sol', landmarks: ['Machu Picchu', 'Nazca Lines', 'Colca Canyon'], 
    fun_facts: [
      'Huascarán in the Andes range is the highest tropical mountain peak on Earth at 22,205 feet',
      'Lake Titicaca, shared with Bolivia, is the highest lake in the world used for commercial boat travel',
      'Colca Canyon here is more than twice as deep as the Grand Canyon in the United States'
    ], 
    built_in_clue: 'A South American country with Pacific coastal deserts, high Andean mountains, and eastern Amazon jungles.', nearby_country_clue: 'Between Ecuador and Chile along the Andes with Brazil to the east.', flag: '🇵🇪' },

  { id: 41, name: 'Chile', difficulty: 'medium', stars: 2, continent: 'South America', subregion: 'South America', capital: 'Santiago', population_hint: 'about 19 million people', size_category: 'large', area_hint: 'around 756,000 square kilometers', hemisphere: 'Southern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Peru', 'Bolivia', 'Argentina'], main_languages: ['Spanish'], currency: 'Chilean peso', landmarks: ['Atacama Desert', 'Torres del Paine', 'Easter Island moai'], 
    fun_facts: [
      'Parts of the Atacama Desert can go decades without measurable rainfall',
      'Stretches over 2,600 miles from north to south while averaging only 110 miles wide',
      'Ojos del Salado on its eastern border is the highest active volcano on the planet at 22,615 feet'
    ], 
    built_in_clue: 'An unusually long and narrow South American nation squeezed between the Andes Mountains and the Pacific Ocean.', nearby_country_clue: 'Runs along Argentina’s western flank with Bolivia and Peru at its northern tip.', flag: '🇨🇱' },

  { id: 42, name: 'Colombia', difficulty: 'medium', stars: 2, continent: 'South America', subregion: 'South America', capital: 'Bogotá', population_hint: 'about 52 million people', size_category: 'medium', area_hint: 'around 1.1 million square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Venezuela', 'Brazil', 'Peru', 'Ecuador', 'Panama'], main_languages: ['Spanish'], currency: 'Colombian peso', landmarks: ['Cocora Valley wax palms', 'Tayrona beaches', 'Coffee axis hills'], 
    fun_facts: [
      'The only country in South America with coastlines on both the Pacific Ocean and Caribbean Sea',
      'Home to the Quindío wax palm, the world’s tallest species of palm tree, growing up to 200 feet high',
      'Ranks as one of the most biodiverse countries on Earth, holding the highest number of bird species'
    ], 
    built_in_clue: 'A South American country known for dual ocean coastlines, high Andean valleys, and extreme biodiversity.', nearby_country_clue: 'Sits west of Venezuela and shares the Darien with Panama.', flag: '🇨🇴' },

  { id: 43, name: 'Venezuela', difficulty: 'medium', stars: 2, continent: 'South America', subregion: 'South America', capital: 'Caracas', population_hint: 'about 28 million people', size_category: 'medium', area_hint: 'around 916,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Colombia', 'Brazil', 'Guyana'], main_languages: ['Spanish'], currency: 'Venezuelan bolívar', landmarks: ['Angel Falls', 'Los Roques islands', 'Gran Sabana tepuis'], 
    fun_facts: [
      'Angel Falls here is the tallest uninterrupted waterfall in the world, dropping 3,212 feet',
      'Lake Maracaibo experiences the Catatumbo lightning storm, the most frequent lightning display on Earth',
      'Features unique flat-topped tabletop mountains in its south called tepuis'
    ], 
    built_in_clue: 'A northern South American nation featuring Caribbean shores, tabletop mountains, and Angel Falls.', nearby_country_clue: 'East of Colombia and north of Brazil with Guyana on its eastern edge.', flag: '🇻🇪' },

  { id: 44, name: 'Bolivia', difficulty: 'medium', stars: 2, continent: 'South America', subregion: 'South America', capital: 'Sucre (constitutional)', population_hint: 'about 12 million people', size_category: 'medium', area_hint: 'around 1.1 million square kilometers', hemisphere: 'Southern and Western Hemisphere', coastline_type: 'landlocked', neighbors: ['Brazil', 'Paraguay', 'Argentina', 'Chile', 'Peru'], main_languages: ['Spanish', 'Quechua'], currency: 'Boliviano', landmarks: ['Salar de Uyuni', 'Lake Titicaca', 'Yungas Road'], 
    fun_facts: [
      'Salar de Uyuni is the largest salt flat on Earth, covering over 3,800 square miles high in the Andes',
      'La Paz sits in a mountain canyon at 11,942 feet, making it the highest seat of government in the world',
      'Holds vast natural reserves of lithium stored beneath its high-altitude salt crusts'
    ], 
    built_in_clue: 'A landlocked South American nation dominated by the high Andean plateau and giant salt flats.', nearby_country_clue: 'Hugs Peru in the northwest and stretches beside Brazil and Chile.', flag: '🇧🇴' },

  { id: 45, name: 'Ecuador', difficulty: 'medium', stars: 2, continent: 'South America', subregion: 'South America', capital: 'Quito', population_hint: 'about 18 million people', size_category: 'small', area_hint: 'around 283,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Colombia', 'Peru'], main_languages: ['Spanish'], currency: 'US dollar', landmarks: ['Galápagos Islands', 'Avenue of Volcanoes', 'Cloud forests of Mindo'], 
    fun_facts: [
      'Mount Chimborazo’s peak is the furthest point from the center of the Earth due to the planet’s equatorial bulge',
      'The Galápagos Islands here are home to rare giant tortoises and marine iguanas found nowhere else',
      'Quito is the closest national capital city to the equator, sitting just 15 miles south of the line'
    ], 
    built_in_clue: 'An equatorial South American country made of high Andean volcanoes and the distant Galápagos Islands.', nearby_country_clue: 'Between Colombia and Peru on the Pacific coast.', flag: '🇪🇨' },

  { id: 46, name: 'Paraguay', difficulty: 'medium', stars: 2, continent: 'South America', subregion: 'South America', capital: 'Asunción', population_hint: 'about 7 million people', size_category: 'small', area_hint: 'around 406,000 square kilometers', hemisphere: 'Southern and Western Hemisphere', coastline_type: 'landlocked', neighbors: ['Brazil', 'Argentina', 'Bolivia'], main_languages: ['Spanish', 'Guaraní'], currency: 'Paraguayan guaraní', landmarks: ['Itaipu Dam', 'Chaco plains', 'Jesuit Missions ruins'], 
    fun_facts: [
      'The Itaipu Dam on its border is one of the largest hydroelectric clean energy producers on Earth',
      'Divided into two distinct regions by the Paraguay River: the dry Chaco plains and fertile eastern forests',
      'One of only two completely landlocked countries located in South America'
    ], 
    built_in_clue: 'A landlocked South American country bisected by the Paraguay River and bounded by major hydro dams.', nearby_country_clue: 'Nestled between Brazil and Argentina with Bolivia to the northwest.', flag: '🇵🇾' },

  { id: 47, name: 'Uruguay', difficulty: 'medium', stars: 2, continent: 'South America', subregion: 'South America', capital: 'Montevideo', population_hint: 'about 3.5 million people', size_category: 'small', area_hint: 'around 176,000 square kilometers', hemisphere: 'Southern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Brazil', 'Argentina'], main_languages: ['Spanish'], currency: 'Uruguayan peso', landmarks: ['Punta del Este beaches', 'Colonia cobblestones', 'Pampas ranches'], 
    fun_facts: [
      'The Río de la Plata forms one of the world’s widest estuaries along Uruguay',
      'Uruguay is South America’s second-smallest country and is largely rolling grassland',
      'Over 80% of its land is rich, fertile soil drained by interconnected river networks'
    ], 
    built_in_clue: 'A small Atlantic South American nation made almost entirely of fertile lowland rolling plains.', nearby_country_clue: 'Between southern Brazil and Argentina’s Buenos Aires estuary.', flag: '🇺🇾' },

  { id: 48, name: 'Guatemala', difficulty: 'medium', stars: 2, continent: 'North America', subregion: 'Central America', capital: 'Guatemala City', population_hint: 'about 18 million people', size_category: 'small', area_hint: 'around 109,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Mexico', 'Belize', 'Honduras', 'El Salvador'], main_languages: ['Spanish'], currency: 'Guatemalan quetzal', landmarks: ['Tikal pyramids', 'Lake Atitlán', 'Pacaya volcano'], 
    fun_facts: [
      'Lake Atitlán here is a deep mountain lake filling a massive extinct volcanic crater',
      'Volcán Tajumulco here is the highest mountain peak in all of Central America at 13,845 feet',
      'Tikal National Park protects the stone temples of an ancient Lowland Maya city hidden in the jungle'
    ], 
    built_in_clue: 'A Central American country known for high volcanic ranges, deep crater lakes, and Maya ruins.', nearby_country_clue: 'Between Mexico and Honduras with Belize on the east.', flag: '🇬🇹' },

  { id: 49, name: 'Cuba', difficulty: 'medium', stars: 2, continent: 'North America', subregion: 'Caribbean', capital: 'Havana', population_hint: 'about 11 million people', size_category: 'small', area_hint: 'around 110,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Spanish'], currency: 'Cuban peso', landmarks: ['Viñales mogotes', 'Malecón seawall', 'Trinidad cobblestones'], 
    fun_facts: [
      'Cuba is the largest Caribbean island by land area',
      'The Viñales Valley is famous for steep limestone hills rising straight out of the ground called mogotes',
      'Humboldt National Park protects rare species like the Bee Hummingbird, the world’s smallest bird'
    ], 
    built_in_clue: 'The largest island nation in the Caribbean, sitting at the entrance to the Gulf of Mexico.', nearby_country_clue: 'South of Florida and west of Hispaniola across warm waters.', flag: '🇨🇺' },

  { id: 50, name: 'Dominican Republic', difficulty: 'medium', stars: 2, continent: 'North America', subregion: 'Caribbean', capital: 'Santo Domingo', population_hint: 'about 11 million people', size_category: 'small', area_hint: 'around 48,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'island nation', neighbors: ['Haiti'], main_languages: ['Spanish'], currency: 'Dominican peso', landmarks: ['Punta Cana beaches', 'Damajagua waterfalls', 'Colonial Zone'], 
    fun_facts: [
      'Pico Duarte here is the tallest mountain peak in the entire Caribbean at 10,164 feet',
      'Lake Enriquillo is the lowest land point in the Caribbean at 151 feet below sea level',
      'Occupies the eastern two-thirds of Hispaniola, the second-largest island in the region'
    ], 
    built_in_clue: 'A Caribbean country occupying the eastern side of Hispaniola island, holding the region’s highest peak.', nearby_country_clue: 'Shares the island with Haiti, east of Cuba and Jamaica.', flag: '🇩🇴' },

  { id: 51, name: 'Costa Rica', difficulty: 'medium', stars: 2, continent: 'North America', subregion: 'Central America', capital: 'San José', population_hint: 'about 5 million people', size_category: 'small', area_hint: 'around 51,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Nicaragua', 'Panama'], main_languages: ['Spanish'], currency: 'Costa Rican colón', landmarks: ['Arenal Volcano', 'Monteverde cloud forest', 'Tortuguero canals'], 
    fun_facts: [
      'Holds roughly 5% of all estimated plant and animal species on Earth in a small area',
      'Over 25% of its total land area is preserved inside national parks and nature reserves',
      'Arenal Volcano is one of several active volcanoes forming its high central mountain chain'
    ], 
    built_in_clue: 'A Central American country famous for high cloud forests, protected wildlife, and volcanoes.', nearby_country_clue: 'Between Nicaragua and Panama with both Pacific and Caribbean shores.', flag: '🇨🇷' },

  { id: 52, name: 'Panama', difficulty: 'medium', stars: 2, continent: 'North America', subregion: 'Central America', capital: 'Panama City', population_hint: 'about 4.5 million people', size_category: 'small', area_hint: 'around 75,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Costa Rica', 'Colombia'], main_languages: ['Spanish'], currency: 'Balboa and US dollar', landmarks: ['Panama Canal', 'San Blas Islands', 'Darien rainforest'], 
    fun_facts: [
      'The Panama Canal allows ships to pass directly between the Atlantic and Pacific Oceans',
      'Forms the narrow land bridge physically connecting North America to South America',
      'The Darién Gap on its border is a roadless, wild tropical rainforest connecting two continents'
    ], 
    built_in_clue: 'An isthmus country uniting North and South America, famous for its major shipping canal.', nearby_country_clue: 'Borders Costa Rica to the west and Colombia to the east.', flag: '🇵🇦' },

  { id: 53, name: 'Haiti', difficulty: 'medium', stars: 2, continent: 'North America', subregion: 'Caribbean', capital: 'Port-au-Prince', population_hint: 'about 11 million people', size_category: 'small', area_hint: 'around 27,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'island nation', neighbors: ['Dominican Republic'], main_languages: ['Haitian Creole', 'French'], currency: 'Haitian gourde', landmarks: ['Citadelle Laferrière', 'Labadee coast', 'Jacmel carnival'], 
    fun_facts: [
      'Citadelle Laferrière is a massive nineteenth-century stone fortress crowning a mountain peak',
      'Haiti occupies the mountainous western third of Hispaniola',
      'Its terrain is dominated by steep mountain chains and horseshoe-shaped ocean bays'
    ], 
    built_in_clue: 'A Caribbean island country occupying the western side of Hispaniola, known for steep mountain ranges.', nearby_country_clue: 'Shares its island with the Dominican Republic, east of Cuba.', flag: '🇭🇹' },

  { id: 54, name: 'Jamaica', difficulty: 'medium', stars: 2, continent: 'North America', subregion: 'Caribbean', capital: 'Kingston', population_hint: 'about 3 million people', size_category: 'small', area_hint: 'around 11,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['English'], currency: 'Jamaican dollar', landmarks: ['Blue Mountains', 'Dunn’s River Falls', 'Seven Mile Beach'], 
    fun_facts: [
      'Cockpit Country is a rugged limestone landscape filled with sinkholes and caves',
      'The Blue Mountains reach 7,402 feet at Blue Mountain Peak',
      'The third-largest island by land area in the Caribbean Sea'
    ], 
    built_in_clue: 'An island nation in the Caribbean marked by interior mountain ranges and rugged limestone hills.', nearby_country_clue: 'South of Cuba and west of Hispaniola in the Caribbean Sea.', flag: '🇯🇲' },

  { id: 55, name: 'Iceland', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Northern Europe', capital: 'Reykjavík', population_hint: 'about 400,000 people', size_category: 'small', area_hint: 'around 103,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Icelandic'], currency: 'Icelandic króna', landmarks: ['Geysir hot springs', 'Vatnajökull glaciers', 'Black Sand Beaches'], 
    fun_facts: [
      'Iceland heats almost all its homes with geothermal energy from underground',
      'Sits directly on the Mid-Atlantic Ridge where two major tectonic plates pull apart',
      'Vatnajökull is Europe’s largest glacier by volume, covering more than 3,000 square miles'
    ], 
    built_in_clue: 'A volcanic North Atlantic island featuring giant ice caps, active geysers, and geothermal fields.', nearby_country_clue: 'Northwest of the UK between Greenland and Norway.', flag: '🇮🇸' },

  { id: 56, name: 'Ireland', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Northern Europe', capital: 'Dublin', population_hint: 'about 5 million people', size_category: 'small', area_hint: 'around 70,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'island nation', neighbors: ['United Kingdom'], main_languages: ['English', 'Irish'], currency: 'Euro', landmarks: ['Cliffs of Moher', 'Giant’s Causeway', 'Ring of Kerry'], 
    fun_facts: [
      'The Cliffs of Moher drop over 700 feet straight down into the Atlantic Ocean',
      'Features The Burren, a unique coastal region made of giant exposed limestone pavements',
      'The Shannon is Ireland’s longest river, flowing about 224 miles'
    ], 
    built_in_clue: 'An island nation in Northwestern Europe defined by ocean cliffs, limestone plains, and green valleys.', nearby_country_clue: 'Shares the island with Northern Ireland to the northeast.', flag: '🇮🇪' },

  { id: 57, name: 'Sweden', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Northern Europe', capital: 'Stockholm', population_hint: 'about 10 million people', size_category: 'medium', area_hint: 'around 450,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Norway', 'Finland'], main_languages: ['Swedish'], currency: 'Swedish krona', landmarks: ['Stockholm archipelago', 'Icehotel in Jukkasjärvi', 'Abisko aurora parks'], 
    fun_facts: [
      'The Stockholm Archipelago off its coast is made of roughly 30,000 individual islands and rocks',
      'Boreal forest covers nearly 70% of the entire country',
      'Extends far north of the Arctic Circle, experiencing 24-hour daylight during midsummer'
    ], 
    built_in_clue: 'A Nordic country covering the eastern half of the Scandinavian Peninsula with dense forests.', nearby_country_clue: 'Borders Norway to the west and Finland to the east across Lapland forests.', flag: '🇸🇪' },

  { id: 58, name: 'Norway', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Northern Europe', capital: 'Oslo', population_hint: 'about 5.5 million people', size_category: 'medium', area_hint: 'around 385,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Sweden', 'Finland', 'Russia'], main_languages: ['Norwegian'], currency: 'Norwegian krone', landmarks: ['Geirangerfjord', 'Lofoten peaks', 'Svalbard glaciers'], 
    fun_facts: [
      'Deep glaciers carved steep ocean inlets along its coast, including Sognefjord, which is over 4,000 feet deep',
      'Hornindalsvatnet here is the deepest natural lake in Europe at 1,686 feet deep',
      'Includes the Arctic island archipelago of Svalbard, located halfway between the mainland and the North Pole'
    ], 
    built_in_clue: 'A Scandinavian coastal country famous for deep ocean fjords carved into steep mountain coastlines.', nearby_country_clue: 'Hugs the North Sea west of Sweden with Russia touching its far north.', flag: '🇳🇴' },

  { id: 59, name: 'Finland', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Northern Europe', capital: 'Helsinki', population_hint: 'about 5.5 million people', size_category: 'medium', area_hint: 'around 338,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Sweden', 'Norway', 'Russia'], main_languages: ['Finnish', 'Swedish'], currency: 'Euro', landmarks: ['Lakeland', 'Santa’s Village in Rovaniemi', 'Saimaa ringed seals'], 
    fun_facts: [
      'Lake Saimaa is the only home of the rare Saimaa ringed seal',
      'Finland contains more than 187,000 lakes',
      'Boreal taiga forest covers more than 75% of the country’s total land area'
    ], 
    built_in_clue: 'A Northern European nation characterized by dense pine forests and thousands of interconnected glacial lakes.', nearby_country_clue: 'Between Sweden and Russia with Norway to the north.', flag: '🇫🇮' },

  { id: 60, name: 'Denmark', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Northern Europe', capital: 'Copenhagen', population_hint: 'about 6 million people', size_category: 'small', area_hint: 'around 43,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Germany', 'Sweden'], main_languages: ['Danish'], currency: 'Danish krone', landmarks: ['Nyhavn harbor', 'Kronborg Castle', 'Jutland dunes'], 
    fun_facts: [
      'Greenland, the world’s largest non-continental island, is self-governing within the Kingdom of Denmark',
      'Very flat country, with its highest natural geographical point rising only 561 feet above sea level',
      'Denmark comprises the Jutland Peninsula and more than 400 named islands'
    ], 
    built_in_clue: 'A low-lying Nordic peninsula and island chain bridging the North Sea and Baltic Sea.', nearby_country_clue: 'Linked to Sweden by bridge and borders Germany to the south.', flag: '🇩🇰' },

  { id: 61, name: 'Netherlands', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Western Europe', capital: 'Amsterdam', population_hint: 'about 18 million people', size_category: 'small', area_hint: 'around 42,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Germany', 'Belgium'], main_languages: ['Dutch'], currency: 'Euro', landmarks: ['Kinderdijk windmills', 'Keukenhof tulip fields', 'Delta Works'], 
    fun_facts: [
      'Roughly 26% of the country’s land area lies below sea level',
      'The Delta Works barrier system built here protects low delta lands from ocean storm surges',
      'Formed largely by the river deltas of three major European rivers: the Rhine, Meuse, and Scheldt'
    ], 
    built_in_clue: 'A coastal Western European country made of reclaimed lowlands, protective dikes, and river deltas.', nearby_country_clue: 'Between Belgium and Germany along the North Sea.', flag: '🇳🇱' },

  { id: 62, name: 'Belgium', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Western Europe', capital: 'Brussels', population_hint: 'about 12 million people', size_category: 'small', area_hint: 'around 30,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['France', 'Germany', 'Netherlands', 'Luxembourg'], main_languages: ['Dutch', 'French'], currency: 'Euro', landmarks: ['Grand Place', 'Ardennes forests', 'Atomium'], 
    fun_facts: [
      'Brussels hosts NATO headquarters and the principal institutions of the European Union',
      'Signal de Botrange in the High Fens is the country’s highest point at 2,277 feet',
      'Belgium rises from northern coastal plains to the forested Ardennes in the south'
    ], 
    built_in_clue: 'A Western European country transitioning from coastal lowlands to the forested Ardennes hills.', nearby_country_clue: 'Between France and the Netherlands with Germany to the east.', flag: '🇧🇪' },

  { id: 63, name: 'Switzerland', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Western Europe', capital: 'Bern', population_hint: 'about 9 million people', size_category: 'small', area_hint: 'around 41,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['France', 'Germany', 'Austria', 'Italy', 'Liechtenstein'], main_languages: ['German', 'French'], currency: 'Swiss franc', landmarks: ['Matterhorn', 'Lake Geneva', 'Jungfrau peaks'], 
    fun_facts: [
      'Contains 48 mountain peaks that rise over 13,000 feet high, including the Matterhorn',
      'The Aletsch Glacier here is the longest glacier in the European Alps, stretching 12 miles',
      'Serves as Europe’s water tower, holding the mountain sources of major rivers like the Rhine and Rhône'
    ], 
    built_in_clue: 'A landlocked Alpine country in Central Europe, home to giant glaciers and river sources.', nearby_country_clue: 'Between France and Austria with Italy to the south and Germany to the north.', flag: '🇨🇭' },

  { id: 64, name: 'Austria', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Western Europe', capital: 'Vienna', population_hint: 'about 9 million people', size_category: 'small', area_hint: 'around 84,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Germany', 'Czechia', 'Slovakia', 'Hungary', 'Slovenia', 'Italy', 'Switzerland', 'Liechtenstein'], main_languages: ['German'], currency: 'Euro', landmarks: ['Alpine lakes', 'Schönbrunn Palace', 'Grossglockner road'], 
    fun_facts: [
      'The Danube crosses northern Austria for 217 miles on its eastward journey',
      'Grossglockner is the tallest mountain peak in the country, reaching 12,461 feet',
      'The Eastern Alps cover roughly two-thirds of Austria'
    ], 
    built_in_clue: 'A landlocked Central European country covered mostly by the high mountain ranges of the Alps.', nearby_country_clue: 'Sits between Germany and Hungary with Italy touching its south.', flag: '🇦🇹' },

  { id: 65, name: 'Greece', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Southern Europe', capital: 'Athens', population_hint: 'about 10 million people', size_category: 'small', area_hint: 'around 132,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Albania', 'North Macedonia', 'Bulgaria', 'Turkey'], main_languages: ['Greek'], currency: 'Euro', landmarks: ['Meteora cliffs', 'Santorini caldera', 'Olympus massif'], 
    fun_facts: [
      'Has over 8,000 miles of coastline due to thousands of islands scattered across the sea',
      'Mount Olympus is the highest mountain massif in the country, peaking at 9,573 feet',
      'Santorini is an island group surrounding a flooded volcanic caldera formed by ancient eruptions'
    ], 
    built_in_clue: 'A Southern European nation made of a mountainous mainland peninsula and thousands of islands.', nearby_country_clue: 'Between Albania and Turkey with the Aegean dotted by its islands.', flag: '🇬🇷' },

  { id: 66, name: 'Poland', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Eastern Europe', capital: 'Warsaw', population_hint: 'about 38 million people', size_category: 'medium', area_hint: 'around 313,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Germany', 'Czechia', 'Slovakia', 'Ukraine', 'Belarus', 'Lithuania', 'Russia (Kaliningrad)'], main_languages: ['Polish'], currency: 'Polish złoty', landmarks: ['Masurian Lakes', 'Wieliczka Salt Mine', 'Tatra Mountains'], 
    fun_facts: [
      'Białowieża Forest on its border is an ancient primeval forest home to wild European bison',
      'The Masurian Lake District here contains over 2,000 natural lakes formed by melting glaciers',
      'Slopes gently from the southern Tatra Mountains down to sandy Baltic Sea beaches in the north'
    ], 
    built_in_clue: 'A Central European nation stretching from the high Tatra Mountains down to Baltic Sea plains.', nearby_country_clue: 'Between Germany and Ukraine with Lithuania to the northeast.', flag: '🇵🇱' },

  { id: 67, name: 'Czechia', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Eastern Europe', capital: 'Prague', population_hint: 'about 11 million people', size_category: 'small', area_hint: 'around 79,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Germany', 'Poland', 'Slovakia', 'Austria'], main_languages: ['Czech'], currency: 'Czech koruna', landmarks: ['Bohemian Switzerland cliffs', 'Karlovy Vary spas', 'Prague bridges'], 
    fun_facts: [
      'Czechia’s waters drain toward the North, Baltic, and Black seas',
      'Sněžka is the highest peak in the country at 5,259 feet, sitting on the northern border',
      'Mountain ranges ring much of Czechia’s outer border'
    ], 
    built_in_clue: 'A landlocked Central European basin completely surrounded by border mountain ranges.', nearby_country_clue: 'Between Germany and Slovakia with Poland to the north.', flag: '🇨🇿' },

  { id: 68, name: 'Hungary', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Eastern Europe', capital: 'Budapest', population_hint: 'about 10 million people', size_category: 'small', area_hint: 'around 93,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Austria', 'Slovakia', 'Ukraine', 'Romania', 'Serbia', 'Croatia', 'Slovenia'], main_languages: ['Hungarian'], currency: 'Hungarian forint', landmarks: ['Thermal baths', 'Lake Balaton', 'Danube Bend'], 
    fun_facts: [
      'Budapest is famous for thermal baths fed by natural hot springs beneath the city',
      'Lake Balaton is Central Europe’s largest freshwater lake, covering 228 square miles',
      'Dominated by the flat alluvial river plains of the Great Hungarian Plain'
    ], 
    built_in_clue: 'A landlocked Central European nation centered in the Carpathian Basin along the Danube River.', nearby_country_clue: 'Between Austria and Romania with Slovakia to the north.', flag: '🇭🇺' },

  { id: 69, name: 'Israel', difficulty: 'medium', stars: 2, continent: 'Asia', subregion: 'Western Asia', capital: 'Jerusalem', population_hint: 'about 9 million people', size_category: 'small', area_hint: 'around 22,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Lebanon', 'Syria', 'Jordan', 'Egypt'], main_languages: ['Hebrew', 'Arabic'], currency: 'Israeli new shekel', landmarks: ['Dead Sea', 'Negev desert craters', 'Sea of Galilee'], 
    fun_facts: [
      'The Dead Sea shore here is the lowest dry land point on Earth at over 1,400 feet below sea level',
      'The Negev Desert covers more than half of the country’s total land area',
      'Makhtesh Ramon is the world’s largest makhtesh, an erosion basin carved through layered rock'
    ], 
    built_in_clue: 'A country on the eastern Mediterranean coast holding the lowest dry land point on Earth.', nearby_country_clue: 'Borders Lebanon in the north and Jordan in the east with Egypt to the southwest.', flag: '🇮🇱' },

  { id: 70, name: 'Jordan', difficulty: 'medium', stars: 2, continent: 'Asia', subregion: 'Western Asia', capital: 'Amman', population_hint: 'about 11 million people', size_category: 'small', area_hint: 'around 89,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Israel', 'Saudi Arabia', 'Iraq', 'Syria'], main_languages: ['Arabic'], currency: 'Jordanian dinar', landmarks: ['Petra canyons', 'Wadi Rum desert', 'Dead Sea coast'], 
    fun_facts: [
      'Wadi Rum features giant sandstone and granite rock valleys cut into the southern desert',
      'Petra is an ancient city carved directly into red sandstone cliff faces in desert canyons',
      'Has a short 16-mile coastline on the Gulf of Aqaba providing access to the Red Sea'
    ], 
    built_in_clue: 'A Middle Eastern desert plateau country with sandstone canyons and a short Red Sea coastline.', nearby_country_clue: 'Sits between Israel and Saudi Arabia with Syria to the north.', flag: '🇯🇴' },

  { id: 71, name: 'United Arab Emirates', difficulty: 'medium', stars: 2, continent: 'Asia', subregion: 'Western Asia', capital: 'Abu Dhabi', population_hint: 'about 10 million people', size_category: 'small', area_hint: 'around 84,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Saudi Arabia', 'Oman'], main_languages: ['Arabic'], currency: 'UAE dirham', landmarks: ['Dune seas of Liwa', 'Hajar Mountains', 'Palm-shaped islands'], 
    fun_facts: [
      'Home to the Burj Khalifa, the tallest human-made structure in the world at 2,717 feet',
      'Its coastal salt flats along the Persian Gulf form rare coastal mineral plains',
      'The Rub\' al Khali desert reaches into its south, forming massive shifting sand dunes'
    ], 
    built_in_clue: 'A Persian Gulf country on the Arabian Peninsula made of desert sand seas and coastal plains.', nearby_country_clue: 'Borders Saudi Arabia to the south and west and Oman to the east.', flag: '🇦🇪' },

  { id: 72, name: 'Qatar', difficulty: 'medium', stars: 2, continent: 'Asia', subregion: 'Western Asia', capital: 'Doha', population_hint: 'about 3 million people', size_category: 'small', area_hint: 'around 11,500 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Saudi Arabia', 'Bahrain (bridge)'], main_languages: ['Arabic'], currency: 'Qatari riyal', landmarks: ['Corniche bay curve', 'Inland Sea dunes', 'Pearl artificial islands'], 
    fun_facts: [
      'Khor Al Adaid brings Gulf waters deep among Qatar’s surrounding desert dunes',
      'Qatar occupies a low desert peninsula extending 100 miles into the Persian Gulf',
      'Sits above parts of the world’s largest single natural gas field'
    ], 
    built_in_clue: 'A flat desert peninsula extending into the Persian Gulf, bordered by shallow coastal waters.', nearby_country_clue: 'Projects off Saudi Arabia’s east coast with Bahrain connected by bridge.', flag: '🇶🇦' },

  { id: 73, name: 'Iran', difficulty: 'medium', stars: 2, continent: 'Asia', subregion: 'Southern Asia', capital: 'Tehran', population_hint: 'about 88 million people', size_category: 'large', area_hint: 'around 1.6 million square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Iraq', 'Turkey', 'Armenia', 'Azerbaijan', 'Turkmenistan', 'Afghanistan', 'Pakistan'], main_languages: ['Persian'], currency: 'Iranian rial', landmarks: ['Persepolis ruins', 'Dasht-e Kavir desert', 'Caspian forests'], 
    fun_facts: [
      'Mount Damavand here is the tallest volcano in all of Asia at 18,406 feet high',
      'The high Iranian Plateau forms the interior of the country, surrounded by steep mountain chains',
      'The Dasht-e Lut desert here has recorded some of the hottest surface ground temperatures on Earth'
    ], 
    built_in_clue: 'A large high-plateau country situated between the Caspian Sea and the Persian Gulf.', nearby_country_clue: 'Between Iraq and Afghanistan with Turkey and Armenia to the northwest.', flag: '🇮🇷' },

  { id: 74, name: 'Pakistan', difficulty: 'medium', stars: 2, continent: 'Asia', subregion: 'Southern Asia', capital: 'Islamabad', population_hint: 'about 240 million people', size_category: 'large', area_hint: 'around 881,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['India', 'Afghanistan', 'Iran', 'China'], main_languages: ['Urdu', 'English'], currency: 'Pakistani rupee', landmarks: ['Karakoram peaks', 'Badshahi Mosque', 'Indus River valley'], 
    fun_facts: [
      'Home to K2, the second-highest mountain peak on Earth at 28,251 feet',
      'The Indus River valley runs down the center of the country, providing water for farming',
      'Contains Baltoro Glacier, one of the longest mountain valley glaciers outside the polar regions'
    ], 
    built_in_clue: 'A South Asian country stretching from Karakoram mountain peaks down to Arabian Sea beaches.', nearby_country_clue: 'Between India and Iran with Afghanistan and China on its northern arc.', flag: '🇵🇰' },

  { id: 75, name: 'Bangladesh', difficulty: 'medium', stars: 2, continent: 'Asia', subregion: 'Southern Asia', capital: 'Dhaka', population_hint: 'about 170 million people', size_category: 'small', area_hint: 'around 148,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['India', 'Myanmar'], main_languages: ['Bengali'], currency: 'Taka', landmarks: ['Sundarbans mangroves', 'Padma River delta', 'Cox’s Bazar beach'], 
    fun_facts: [
      'The Sundarbans form the world’s largest continuous coastal mangrove forest',
      'Bangladesh sits on the Bengal Delta, the world’s largest river-delta deposit area',
      'Cox’s Bazar features a natural sandy ocean beach stretching unbroken over 75 miles'
    ], 
    built_in_clue: 'A low-lying South Asian nation dominated by the massive river delta of the Ganges River system.', nearby_country_clue: 'Almost surrounded by India with Myanmar on its southeast edge.', flag: '🇧🇩' },

  { id: 76, name: 'Iraq', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Western Asia', capital: 'Baghdad', population_hint: 'about 43 million people', size_category: 'medium', area_hint: 'around 438,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Turkey', 'Iran', 'Kuwait', 'Saudi Arabia', 'Jordan', 'Syria'], main_languages: ['Arabic', 'Kurdish'], currency: 'Iraqi dinar', landmarks: ['Tigris and Euphrates marshes', 'Ziggurat of Ur', 'Citadel of Erbil'], 
    fun_facts: [
      'Encompasses the fertile river basin of the Tigris and Euphrates rivers, known historically as Mesopotamia',
      'The Mesopotamian Marshes in the south form a rare wetland sanctuary in a dry desert region',
      'Has a short 36-mile coastline opening onto the northern head of the Persian Gulf'
    ], 
    built_in_clue: 'A Middle Eastern country defined by the twin river basins of the Tigris and Euphrates rivers.', nearby_country_clue: 'Between Iran and Syria with a tiny Persian Gulf outlet.', flag: '🇮🇶' },

  { id: 77, name: 'Syria', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Western Asia', capital: 'Damascus', population_hint: 'about 22 million people', size_category: 'medium', area_hint: 'around 185,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Turkey', 'Iraq', 'Jordan', 'Israel', 'Lebanon'], main_languages: ['Arabic'], currency: 'Syrian pound', landmarks: ['Euphrates valley', 'Krak des Chevaliers', 'Palmyra ruins'], 
    fun_facts: [
      'Damascus is documented as one of the world’s oldest continuously inhabited cities',
      'The Euphrates River crosses eastern Syria as a major water source',
      'Transitions from Mediterranean coastal mountains in the west to dry interior desert plateaus'
    ], 
    built_in_clue: 'A Levantine nation stretching from Mediterranean coastal hills to the Syrian Desert and Euphrates River.', nearby_country_clue: 'North of Jordan and west of Iraq with Turkey at its northern border.', flag: '🇸🇾' },

  { id: 78, name: 'Lebanon', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Western Asia', capital: 'Beirut', population_hint: 'about 5.5 million people', size_category: 'small', area_hint: 'around 10,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Syria', 'Israel'], main_languages: ['Arabic'], currency: 'Lebanese pound', landmarks: ['Cedars of Lebanon', 'Jeita Grotto', 'Baalbek Roman temples'], 
    fun_facts: [
      'Protected groves preserve the ancient Cedar of Lebanon, the country’s national emblem',
      'The Mount Lebanon range parallels the coast and rises above 10,000 feet',
      'The Beqaa Valley forms a fertile interior mountain valley sitting between two mountain ranges'
    ], 
    built_in_clue: 'A small Mediterranean coastal nation framed by two parallel mountain ranges and the Beqaa Valley.', nearby_country_clue: 'Between Syria and Israel on the eastern Mediterranean.', flag: '🇱🇧' },

  { id: 79, name: 'Armenia', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Western Asia', capital: 'Yerevan', population_hint: 'about 3 million people', size_category: 'small', area_hint: 'around 29,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Turkey', 'Georgia', 'Azerbaijan', 'Iran'], main_languages: ['Armenian'], currency: 'Dram', landmarks: ['Mount Ararat views', 'Geghard Monastery', 'Lake Sevan'], 
    fun_facts: [
      'Lake Sevan here is one of the largest high-altitude freshwater mountain lakes in Eurasia',
      'Highly mountainous country, with an average land elevation over 5,900 feet above sea level',
      'Craftsmen here have carved detailed art into solid volcanic stone for over a thousand years, passing the skill down through generations'
    ], 
    built_in_clue: 'A landlocked Caucasus mountain nation marked by extinct volcanic peaks and high alpine lakes.', nearby_country_clue: 'Between Turkey and Azerbaijan with Georgia to the north.', flag: '🇦🇲' },

  { id: 80, name: 'Georgia', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Western Asia', capital: 'Tbilisi', population_hint: 'about 3.7 million people', size_category: 'small', area_hint: 'around 69,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Russia', 'Azerbaijan', 'Armenia', 'Turkey'], main_languages: ['Georgian'], currency: 'Lari', landmarks: ['Caucasus mountains', 'Kazbegi Church', 'Batumi Black Sea coast'], 
    fun_facts: [
      'The Greater Caucasus Range along its border includes Mount Shkhara, standing 17,037 feet high',
      'Contains Veryovkina Cave, recognized as the deepest known cave passage on Earth at 7,257 feet deep',
      'Bounded by the Black Sea coastline in the west, supporting warm humid valleys'
    ], 
    built_in_clue: 'A Caucasus mountain country framed by high northern peaks and a western Black Sea coast.', nearby_country_clue: 'North of Armenia and east of the Black Sea with Russia atop the range.', flag: '🇬🇪' },

  { id: 81, name: 'Azerbaijan', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Western Asia', capital: 'Baku', population_hint: 'about 10 million people', size_category: 'small', area_hint: 'around 86,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Russia', 'Georgia', 'Armenia', 'Iran', 'Turkey (Nakhchivan)'], main_languages: ['Azerbaijani'], currency: 'Manat', landmarks: ['Caspian Sea coast', 'Mud volcano fields', 'Flame Towers skyline'], 
    fun_facts: [
      'Home to more than half of all the active geological mud volcanoes on Earth',
      'The Absheron Peninsula reaches out into the Caspian Sea, the largest inland lake on Earth',
      'Yanar Dag is a natural gas fire along a hillside that has burned continuously for years'
    ], 
    built_in_clue: 'A Caspian Sea nation in the Caucasus known for mud volcanoes and natural gas reserves.', nearby_country_clue: 'Between Russia and Iran with Armenia wedged in the middle.', flag: '🇦🇿' },

  { id: 82, name: 'Oman', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Western Asia', capital: 'Muscat', population_hint: 'about 4.6 million people', size_category: 'medium', area_hint: 'around 310,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['United Arab Emirates', 'Saudi Arabia', 'Yemen'], main_languages: ['Arabic'], currency: 'Omani rial', landmarks: ['Wahiba Sands', 'Musandam fjords', 'Jebel Akhdar terraces'], 
    fun_facts: [
      'Seasonal monsoon rains turn the mountains of southern Oman green',
      'Jebel Shams in the Al Hajar Mountains is the country’s highest peak at 9,872 feet',
      'Oman’s Musandam Peninsula has steep, fjord-like inlets overlooking the Strait of Hormuz'
    ], 
    built_in_clue: 'An Arabian Peninsula nation shaped by the Al Hajar Mountains, coastal dunes, and strategic sea straits.', nearby_country_clue: 'South of the UAE and east of Saudi Arabia with Yemen to the southwest.', flag: '🇴🇲' },

  { id: 83, name: 'Kuwait', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Western Asia', capital: 'Kuwait City', population_hint: 'about 4.5 million people', size_category: 'small', area_hint: 'around 17,800 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Iraq', 'Saudi Arabia'], main_languages: ['Arabic'], currency: 'Kuwaiti dinar', landmarks: ['Kuwait Towers', 'Failaka Island ruins', 'Arabian Gulf coast'], 
    fun_facts: [
      'Failaka Island preserves archaeological sites spanning thousands of years of Gulf history',
      'Kuwait consists mostly of flat, gravelly desert plains',
      'The Burgan Field here is one of the largest single oil reserves on Earth'
    ], 
    built_in_clue: 'A small Persian Gulf state located at the northern head of the gulf between Iraq and Saudi Arabia.', nearby_country_clue: 'Between southern Iraq and northeastern Saudi Arabia on the Persian Gulf.', flag: '🇰🇼' },

  { id: 84, name: 'Bahrain', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Western Asia', capital: 'Manama', population_hint: 'about 1.5 million people', size_category: 'small', area_hint: 'around 780 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: ['Saudi Arabia', 'Qatar (bridge planned)'], main_languages: ['Arabic'], currency: 'Bahraini dinar', landmarks: ['Qal’at al-Bahrain fort', 'Tree of Life desert tree', 'Amwaj Islands'], 
    fun_facts: [
      'The 15-mile King Fahd Causeway links Bahrain directly to mainland Saudi Arabia',
      'Bahrain is an island nation of natural and engineered islands in the Persian Gulf',
      'The “Tree of Life” is a centuries-old desert tree sustained by deep groundwater'
    ], 
    built_in_clue: 'A Persian Gulf island nation linked to the Arabian mainland by a major bridge causeway.', nearby_country_clue: 'Sits between Qatar and Saudi Arabia in the Persian Gulf.', flag: '🇧🇭' },

  { id: 85, name: 'Yemen', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Western Asia', capital: 'Sanaʽa', population_hint: 'about 34 million people', size_category: 'medium', area_hint: 'around 528,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Saudi Arabia', 'Oman'], main_languages: ['Arabic'], currency: 'Yemeni rial', landmarks: ['Socotra dragon trees', 'Old City of Sanaʽa', 'Hadhramaut cliffs'], 
    fun_facts: [
      'The Socotra Island chain here is famous for rare plant species like the dragon’s blood tree',
      'Sanaʽa sits in a high mountain valley at an altitude over 7,200 feet high',
      'Yemen’s coast borders the Bab-el-Mandeb Strait opposite Djibouti and Eritrea'
    ], 
    built_in_clue: 'A southern Arabian country controlling the strategic Bab-el-Mandeb water strait and Socotra Island.', nearby_country_clue: 'South of Saudi Arabia and west of Oman with the Gulf of Aden along its shore.', flag: '🇾🇪' },

  { id: 86, name: 'Afghanistan', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Southern Asia', capital: 'Kabul', population_hint: 'about 40 million people', size_category: 'medium', area_hint: 'around 652,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Pakistan', 'Iran', 'Turkmenistan', 'Uzbekistan', 'Tajikistan', 'China'], main_languages: ['Pashto', 'Dari'], currency: 'Afghan afghani', landmarks: ['Hindu Kush mountains', 'Band-e Amir lakes', 'Bamiyan cliffs'], 
    fun_facts: [
      'Band-e Amir’s six vivid blue lakes formed behind natural mineral dams',
      'The Hindu Kush forms a steep mountain backbone through Afghanistan',
      'The Wakhan Corridor is a long, narrow strip of land reaching east to border China'
    ], 
    built_in_clue: 'A landlocked mountain country dominated by the high peaks of the Hindu Kush range.', nearby_country_clue: 'Between Iran and Pakistan with narrow Wakhan finger touching China.', flag: '🇦🇫' },

  { id: 87, name: 'Nepal', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Southern Asia', capital: 'Kathmandu', population_hint: 'about 30 million people', size_category: 'small', area_hint: 'around 147,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['India', 'China'], main_languages: ['Nepali'], currency: 'Nepalese rupee', landmarks: ['Mount Everest', 'Chitwan jungles', 'Phewa Lake'], 
    fun_facts: [
      'Home to Mount Everest, the tallest mountain peak on Earth at 29,031 feet high',
      'Contains eight of the world’s fourteen tallest mountain peaks over 26,000 feet high',
      'Steps upward from warm southern plains up to the highest mountain wall on the planet'
    ], 
    built_in_clue: 'A landlocked Himalayan country containing eight of the world’s ten highest mountain peaks.', nearby_country_clue: 'Wedged between India and China along the Himalayas.', flag: '🇳🇵' },

  { id: 88, name: 'Bhutan', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Southern Asia', capital: 'Thimphu', population_hint: 'about 800,000 people', size_category: 'small', area_hint: 'around 38,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['India', 'China'], main_languages: ['Dzongkha'], currency: 'Ngultrum', landmarks: ['Tiger’s Nest Monastery', 'Punakha Dzong', 'Black Mountain range'], 
    fun_facts: [
      'Gangkhar Puensum here is the highest unclimbed mountain peak on Earth at 24,836 feet',
      'Its national constitution mandates that at least 60% of the country remain forested forever',
      'Climbs over 23,000 feet from subtropical southern valleys up to icy Himalayan peaks'
    ], 
    built_in_clue: 'A landlocked Eastern Himalayan kingdom marked by steep valleys, high forests, and protected peaks.', nearby_country_clue: 'Between Tibet and India with steep valleys shielding it.', flag: '🇧🇹' },

  { id: 89, name: 'Sri Lanka', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Southern Asia', capital: 'Sri Jayawardenepura Kotte', population_hint: 'about 22 million people', size_category: 'small', area_hint: 'around 65,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: ['India (sea channel)'], main_languages: ['Sinhala', 'Tamil'], currency: 'Sri Lankan rupee', landmarks: ['Sigiriya rock fortress', 'Tea country hills', 'Yala wildlife park'], 
    fun_facts: [
      'Adam’s Bridge is a chain of natural shallow limestone shoals linking it toward the Indian mainland',
      'Pidurutalagala is the tallest peak in the country, reaching 8,281 feet in its Central Highlands',
      'Sigiriya is a massive 600-foot granite rock column with ancient palace ruins on its flat top'
    ], 
    built_in_clue: 'A teardrop-shaped island nation in the Indian Ocean, located directly off the southeastern tip of India.', nearby_country_clue: 'Separated from India by the Palk Strait in the Indian Ocean.', flag: '🇱🇰' },

  { id: 90, name: 'Maldives', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Southern Asia', capital: 'Malé', population_hint: 'about 500,000 people', size_category: 'small', area_hint: 'around 300 square kilometers of land', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Dhivehi'], currency: 'Rufiyaa', landmarks: ['Coral atolls', 'Underwater reefs', 'Bioluminescent beaches'], 
    fun_facts: [
      'The lowest-lying country on Earth, with an average ground height of just 4.9 feet above sea level',
      'Made of 26 natural ring-shaped coral atolls containing over 1,100 small islands',
      'Its tiny land area is scattered across 35,000 square miles of the Indian Ocean'
    ], 
    built_in_clue: 'An Indian Ocean coral atoll country holding the record for the lowest land elevation on Earth.', nearby_country_clue: 'Southwest of Sri Lanka and India in open ocean.', flag: '🇲🇻' },

  { id: 91, name: 'Cambodia', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'South-Eastern Asia', capital: 'Phnom Penh', population_hint: 'about 17 million people', size_category: 'small', area_hint: 'around 181,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Thailand', 'Laos', 'Vietnam'], main_languages: ['Khmer'], currency: 'Cambodian riel', landmarks: ['Angkor temple complex', 'Tonlé Sap lake', 'Cardamom Mountains'], 
    fun_facts: [
      'The Tonlé Sap River reverses direction seasonally as Mekong water levels rise and fall',
      'Angkor Wat is recognized as the largest stone religious monument structure in the world',
      'Its interior is a flat river plain bowl surrounded by mountain ranges'
    ], 
    built_in_clue: 'A Southeast Asian country centered on the low plains of the Mekong River and Tonlé Sap Lake.', nearby_country_clue: 'Between Thailand and Vietnam with Laos touching the north.', flag: '🇰🇭' },

  { id: 92, name: 'Laos', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'South-Eastern Asia', capital: 'Vientiane', population_hint: 'about 7.5 million people', size_category: 'small', area_hint: 'around 237,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['China', 'Vietnam', 'Cambodia', 'Thailand', 'Myanmar'], main_languages: ['Lao'], currency: 'Kip', landmarks: ['Mekong riverbanks', 'Plain of Jars', 'Kuang Si Falls'], 
    fun_facts: [
      'The only landlocked country located in all of Southeast Asia',
      'The Mekong River forms a major portion of its western border with Thailand',
      'The Annamite Range runs along its eastern border, forming a steep mountain wall'
    ], 
    built_in_clue: 'Southeast Asia’s only landlocked country, dominated by the Mekong River valley and steep mountains.', nearby_country_clue: 'Squeezed between Thailand and Vietnam with China touching the north.', flag: '🇱🇦' },

  { id: 93, name: 'Myanmar', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'South-Eastern Asia', capital: 'Naypyidaw', population_hint: 'about 55 million people', size_category: 'medium', area_hint: 'around 676,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['India', 'China', 'Laos', 'Thailand', 'Bangladesh'], main_languages: ['Burmese'], currency: 'Kyat', landmarks: ['Bagan temples', 'Inle Lake stilt villages', 'Golden Rock'], 
    fun_facts: [
      'Inle Lake supports endemic fish adapted to its highland freshwater ecosystem',
      'Hkakabo Razi on its northern border is the tallest mountain peak in Southeast Asia at 19,295 feet',
      'The Irrawaddy River flows through central Myanmar as a major transport route'
    ], 
    built_in_clue: 'A Southeast Asian country defined by the Irrawaddy River valley and Bay of Bengal coastlines.', nearby_country_clue: 'Between India and Thailand with China along its northeast highlands.', flag: '🇲🇲' },

  { id: 94, name: 'Brunei', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'South-Eastern Asia', capital: 'Bandar Seri Begawan', population_hint: 'about 450,000 people', size_category: 'small', area_hint: 'around 5,700 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Malaysia'], main_languages: ['Malay'], currency: 'Brunei dollar', landmarks: ['Ulu Temburong rainforest', 'Kampong Ayer stilt village', 'Omar Ali Saifuddien Mosque'], 
    fun_facts: [
      'A narrow strip of Malaysia divides Brunei into two separate parts',
      'Ulu Temburong National Park here protects over 200 square miles of untouched primary rainforest',
      'Malaysia’s Sarawak state surrounds Brunei on land'
    ], 
    built_in_clue: 'A tiny sovereign coastal enclave located on the northern shore of Borneo island.', nearby_country_clue: 'Surrounded by Malaysia on Borneo’s north coast.', flag: '🇧🇳' },

  { id: 95, name: 'Timor-Leste', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'South-Eastern Asia', capital: 'Dili', population_hint: 'about 1.3 million people', size_category: 'small', area_hint: 'around 15,000 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Indonesia'], main_languages: ['Tetum', 'Portuguese'], currency: 'US dollar', landmarks: ['Atauro reefs', 'Mount Ramelau', 'Jaco Island'], 
    fun_facts: [
      'Ataúro Island’s surrounding reefs support exceptionally rich fish diversity',
      'Mount Ramelau is the tallest peak in the country, reaching 9,721 feet high',
      'Timor-Leste occupies eastern Timor and includes Ataúro and other small islands'
    ], 
    built_in_clue: 'A nation covering the eastern half of Timor island in the Lesser Sunda archipelago.', nearby_country_clue: 'Shares its island with Indonesia in the eastern Lesser Sundas.', flag: '🇹🇱' },

  { id: 96, name: 'Mongolia', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Eastern Asia', capital: 'Ulaanbaatar', population_hint: 'about 3 million people', size_category: 'large', area_hint: 'around 1.5 million square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Russia', 'China'], main_languages: ['Mongolian'], currency: 'Tögrög', landmarks: ['Gobi Desert dunes', 'Khövsgöl Lake', 'Orkhon Valley'], 
    fun_facts: [
      'The most sparsely populated independent country in the world relative to its size',
      'The Gobi Desert covers its south, containing famous fossil beds of ancient dinosaurs',
      'Ulaanbaatar is recognized as the coldest national capital city on Earth by average year-round temperature'
    ], 
    built_in_clue: 'A vast landlocked East Asian plateau country of rolling grasslands and high deserts.', nearby_country_clue: 'Landlocked between Russia to the north and China to the south.', flag: '🇲🇳' },

  { id: 97, name: 'Kazakhstan', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Central Asia', capital: 'Astana (Nur-Sultan)', population_hint: 'about 19 million people', size_category: 'large', area_hint: 'around 2.7 million square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Russia', 'China', 'Kyrgyzstan', 'Uzbekistan', 'Turkmenistan'], main_languages: ['Kazakh', 'Russian'], currency: 'Kazakhstani tenge', landmarks: ['Caspian steppe', 'Charyn Canyon', 'Altai Mountains'], 
    fun_facts: [
      'Baikonur Cosmodrome is the world’s oldest operational spaceport',
      'Contains the Kazakh Steppe, one of the largest continuous dry grassland plains on Earth',
      'Kazakhstan is the world’s largest landlocked country by area'
    ], 
    built_in_clue: 'The world’s largest landlocked country, dominating the dry grassy steppes of Central Asia.', nearby_country_clue: 'Sits south of Russia and west of China with the Caspian Sea to the southwest.', flag: '🇰🇿' },

  { id: 98, name: 'Uzbekistan', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Central Asia', capital: 'Tashkent', population_hint: 'about 36 million people', size_category: 'medium', area_hint: 'around 448,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Afghanistan', 'Turkmenistan'], main_languages: ['Uzbek'], currency: 'Uzbekistani soʻm', landmarks: ['Samarkand Registan', 'Bukhara minarets', 'Aral Sea remnants'], 
    fun_facts: [
      'One of only two double-landlocked countries, meaning every neighbor is also landlocked',
      'Contains the Kyzylkum Desert, a massive dry plain covering much of its interior',
      'River diversions deprived the Aral Sea of inflow, causing much of it to shrink'
    ], 
    built_in_clue: 'A double-landlocked Central Asian nation situated along historic interior trade routes.', nearby_country_clue: 'Between Kazakhstan and Turkmenistan, north of Afghanistan.', flag: '🇺🇿' },

  { id: 99, name: 'Kyrgyzstan', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Central Asia', capital: 'Bishkek', population_hint: 'about 7 million people', size_category: 'small', area_hint: 'around 199,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Kazakhstan', 'Uzbekistan', 'Tajikistan', 'China'], main_languages: ['Kyrgyz', 'Russian'], currency: 'Kyrgyzstani som', landmarks: ['Issyk-Kul Lake', 'Tien Shan ranges', 'Ala-Archa gorge'], 
    fun_facts: [
      'Over 80% of the entire country is covered by the Tian Shan mountain system',
      'Lake Issyk-Kul here is the second-largest high-altitude mountain lake on Earth at 5,272 feet high',
      'Victory Peak is the country’s tallest mountain, rising to 24,406 feet'
    ], 
    built_in_clue: 'A high-altitude landlocked Central Asian country dominated by the Tian Shan mountain range.', nearby_country_clue: 'Between Kazakhstan and Tajikistan with China to the east.', flag: '🇰🇬' },

  { id: 100, name: 'Tajikistan', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Central Asia', capital: 'Dushanbe', population_hint: 'about 10 million people', size_category: 'small', area_hint: 'around 143,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Afghanistan', 'China', 'Kyrgyzstan', 'Uzbekistan'], main_languages: ['Tajik'], currency: 'Tajikistani somoni', landmarks: ['Pamir Mountains', 'Iskanderkul Lake', 'Fann peaks'], 
    fun_facts: [
      'Over 90% of its land area is mountainous, dominated by the Pamir Mountain range',
      'Ismoil Somoni Peak is the tallest mountain peak in Central Asia at 24,590 feet',
      'Contains Fedchenko Glacier, the longest mountain glacier outside the polar regions at 48 miles long'
    ], 
    built_in_clue: 'A high landlocked Central Asian country anchored by the giant Pamir mountain knot.', nearby_country_clue: 'Touches Afghanistan to the south and Kyrgyzstan to the north.', flag: '🇹🇯' },

  { id: 101, name: 'Turkmenistan', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Central Asia', capital: 'Ashgabat', population_hint: 'about 6 million people', size_category: 'medium', area_hint: 'around 491,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Kazakhstan', 'Uzbekistan', 'Afghanistan', 'Iran'], main_languages: ['Turkmen'], currency: 'Manat', landmarks: ['Darvaza gas crater', 'Karakum Desert', 'Köw Ata cave lake'], 
    fun_facts: [
      'The Darvaza gas crater has burned in the Karakum Desert for decades',
      'The Karakum Desert covers roughly 80 percent of Turkmenistan',
      'Ashgabat holds a record for having the world’s highest density of white marble buildings'
    ], 
    built_in_clue: 'A Central Asian desert country bounded by the Caspian Sea and Karakum sand plains.', nearby_country_clue: 'Between the Caspian Sea and Uzbekistan with Iran to the south.', flag: '🇹🇲' },

  { id: 102, name: 'North Korea', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Eastern Asia', capital: 'Pyongyang', population_hint: 'about 25 million people', size_category: 'small', area_hint: 'around 120,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['South Korea', 'China', 'Russia'], main_languages: ['Korean'], currency: 'North Korean won', landmarks: ['Paektu Mountain', 'Arch of Triumph', 'Juche Tower'], 
    fun_facts: [
      'Mount Paektu on its border is an active stratovolcano and the highest Korean peak at 9,003 feet',
      'Bounded by the Yellow Sea to the west and the Sea of Japan to the east',
      'Its terrain is mostly rugged mountains covering 80% of the country’s interior'
    ], 
    built_in_clue: 'An East Asian country covering the northern half of the Korean Peninsula, anchored by Mount Paektu.', nearby_country_clue: 'Borders China and Russia to the north and its southern neighbor across the DMZ.', flag: '🇰🇵' },

  { id: 103, name: 'Botswana', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Southern Africa', capital: 'Gaborone', population_hint: 'about 2.6 million people', size_category: 'medium', area_hint: 'around 582,000 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Namibia', 'Zimbabwe', 'South Africa'], main_languages: ['English', 'Setswana'], currency: 'Pula', landmarks: ['Okavango Delta', 'Kalahari Desert', 'Makgadikgadi pans'], 
    fun_facts: [
      'The Okavango Delta here is one of the world’s largest interior river deltas, emptying into desert sand',
      'The Kalahari Desert covers roughly 70% of the country’s land surface',
      'The Makgadikgadi Pans here form one of the largest salt flat areas on Earth'
    ], 
    built_in_clue: 'A landlocked Southern African nation defined by the Kalahari Desert and the Okavango inland delta.', nearby_country_clue: 'Between Namibia and Zimbabwe just north of South Africa.', flag: '🇧🇼' },

  { id: 104, name: 'Namibia', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Southern Africa', capital: 'Windhoek', population_hint: 'about 2.5 million people', size_category: 'large', area_hint: 'around 825,000 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Angola', 'Zambia', 'Botswana', 'South Africa'], main_languages: ['English'], currency: 'Namibian dollar', landmarks: ['Namib Desert dunes', 'Skeleton Coast', 'Etosha salt pan'], 
    fun_facts: [
      'The Namib Desert along its ocean coast is considered the oldest desert on Earth',
      'Home to Fish River Canyon, the largest natural canyon on the African continent',
      'Etosha National Park centers on a giant salt pan so big it can be seen from space'
    ], 
    built_in_clue: 'An arid Atlantic coastal country of Southern Africa home to the ancient Namib sand dunes.', nearby_country_clue: 'South of Angola and west of Botswana with a short border on Zambia.', flag: '🇳🇦' },

  { id: 105, name: 'Zimbabwe', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Southern Africa', capital: 'Harare', population_hint: 'about 16 million people', size_category: 'medium', area_hint: 'around 390,000 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Zambia', 'Mozambique', 'South Africa', 'Botswana'], main_languages: ['English', 'Shona'], currency: 'Zimbabwean dollar', landmarks: ['Victoria Falls', 'Great Zimbabwe ruins', 'Matobo Hills'], 
    fun_facts: [
      'Great Zimbabwe’s ancient stone walls were built without mortar',
      'Zimbabwe shares Victoria Falls, one of the world’s largest curtains of falling water',
      'Sits on a high interior plateau averaging over 3,900 feet in elevation'
    ], 
    built_in_clue: 'A landlocked Southern African plateau nation situated between the Zambezi and Limpopo rivers.', nearby_country_clue: 'Between Zambia and South Africa with Mozambique to the east.', flag: '🇿🇼' },

  { id: 106, name: 'Zambia', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Eastern Africa', capital: 'Lusaka', population_hint: 'about 20 million people', size_category: 'medium', area_hint: 'around 752,000 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Angola', 'DR Congo', 'Tanzania', 'Malawi', 'Mozambique', 'Zimbabwe', 'Botswana', 'Namibia'], main_languages: ['English'], currency: 'Zambian kwacha', landmarks: ['Victoria Falls', 'South Luangwa savanna', 'Lake Kariba'], 
    fun_facts: [
      'Lake Kariba on its border is the largest human-made reservoir in the world by water volume',
      'The Zambezi River begins in the high wet hills of its northwestern corner',
      'Made mostly of high rolling plateau country cut by deep river valleys'
    ], 
    built_in_clue: 'A landlocked Southern African plateau country anchored by the Zambezi River Basin.', nearby_country_clue: 'Surrounded by eight countries including Angola to the west and Tanzania to the northeast.', flag: '🇿🇲' },

  { id: 107, name: 'Malawi', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Eastern Africa', capital: 'Lilongwe', population_hint: 'about 20 million people', size_category: 'small', area_hint: 'around 118,000 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Tanzania', 'Mozambique', 'Zambia'], main_languages: ['English', 'Chichewa'], currency: 'Malawian kwacha', landmarks: ['Lake Malawi', 'Mount Mulanje', 'Nyika Plateau'], 
    fun_facts: [
      'Lake Malawi contains more endemic fish species than any other lake',
      'Lake Malawi covers roughly one-fifth of Malawi’s surface area',
      'Mount Mulanje in its south is a massive granite mountain reaching 9,849 feet high'
    ], 
    built_in_clue: 'A narrow East African Rift Valley country stretching along the shores of Lake Malawi.', nearby_country_clue: 'Between Tanzania and Mozambique with Zambia at its western tip.', flag: '🇲🇼' },

  { id: 108, name: 'Mozambique', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Eastern Africa', capital: 'Maputo', population_hint: 'about 33 million people', size_category: 'large', area_hint: 'around 801,000 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Tanzania', 'Malawi', 'Zambia', 'Zimbabwe', 'South Africa', 'Eswatini'], main_languages: ['Portuguese'], currency: 'Mozambican metical', landmarks: ['Bazaruto Archipelago', 'Gorongosa Park', 'Ilha de Moçambique'], 
    fun_facts: [
      'The Bazaruto Archipelago protects five coral barrier islands off Mozambique’s coast',
      'The Zambezi River splits the country into high northern plateaus and low southern plains',
      'Mozambique has more than 1,500 miles of Indian Ocean coastline'
    ], 
    built_in_clue: 'A Southeastern African country with a long Indian Ocean coast, barrier reefs, and the Zambezi River mouth.', nearby_country_clue: 'East of Zimbabwe and south of Tanzania with South Africa to the southwest.', flag: '🇲🇿' },

  { id: 109, name: 'Rwanda', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Eastern Africa', capital: 'Kigali', population_hint: 'about 13 million people', size_category: 'small', area_hint: 'around 26,000 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Uganda', 'Tanzania', 'Burundi', 'DR Congo'], main_languages: ['Kinyarwanda', 'English'], currency: 'Rwandan franc', landmarks: ['Volcanoes National Park', 'Lake Kivu', 'Nyungwe Forest'], 
    fun_facts: [
      'Lake Kivu is a deep volcanic lake containing substantial dissolved natural gases',
      'Volcanoes National Park includes five of the high volcanic peaks in the Virunga chain',
      'Rwanda is known as the “Land of a Thousand Hills” for its steep, rolling terrain'
    ], 
    built_in_clue: 'A compact landlocked nation in the Great Rift Valley, dominated by high volcanic mountains.', nearby_country_clue: 'Between Uganda and Burundi with DR Congo on its western lake shore.', flag: '🇷🇼' },

  { id: 110, name: 'Burundi', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Eastern Africa', capital: 'Gitega', population_hint: 'about 12 million people', size_category: 'small', area_hint: 'around 28,000 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Rwanda', 'Tanzania', 'DR Congo'], main_languages: ['Kirundi', 'French'], currency: 'Burundian franc', landmarks: ['Lake Tanganyika', 'Kibira Forest', 'Karera Falls'], 
    fun_facts: [
      'Sits right on the high mountain divide separating the Congo and Nile River basins',
      'Bordered on the southwest by Lake Tanganyika, the second-deepest lake on Earth',
      'A mountainous landlocked country with a central ridge plateau rising over 6,500 feet'
    ], 
    built_in_clue: 'A small landlocked Great Lakes nation perched on the watershed divide of the Nile and Congo rivers.', nearby_country_clue: 'South of Rwanda and west of Tanzania with DR Congo across the lake.', flag: '🇧🇮' },

  { id: 111, name: 'Madagascar', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Eastern Africa', capital: 'Antananarivo', population_hint: 'about 30 million people', size_category: 'large', area_hint: 'around 587,000 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Malagasy', 'French'], currency: 'Ariary', landmarks: ['Avenue of the Baobabs', 'Tsingy de Bemaraha', 'Ranomafana rainforest'], 
    fun_facts: [
      'Madagascar evolved in isolation for more than 80 million years',
      'A very high share of Madagascar’s native species, including most lemurs, occurs nowhere else',
      'Tsingy de Bemaraha is a giant natural "forest" made of razor-sharp limestone needles'
    ], 
    built_in_clue: 'An isolated Indian Ocean island continent known for unique endemic wildlife like lemurs.', nearby_country_clue: 'Off the coast of Mozambique in the Indian Ocean.', flag: '🇲🇬' },

  { id: 112, name: 'Mauritius', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Eastern Africa', capital: 'Port Louis', population_hint: 'about 1.3 million people', size_category: 'small', area_hint: 'around 2,040 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['English', 'French'], currency: 'Mauritian rupee', landmarks: ['Le Morne Brabant', 'Seven Colored Earths', 'Coral reefs'], 
    fun_facts: [
      'The Seven Colored Earths display dunes tinted by seven distinct mineral colors',
      'Mauritius is a volcanic island ringed by coral reefs and calm lagoons',
      'Historically, the only known natural home of the flightless dodo bird before it went extinct'
    ], 
    built_in_clue: 'A volcanic island nation in the Indian Ocean ringed by protective barrier coral reefs.', nearby_country_clue: 'East of Madagascar in the southwest Indian Ocean.', flag: '🇲🇺' },

  { id: 113, name: 'Seychelles', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Eastern Africa', capital: 'Victoria', population_hint: 'about 100,000 people', size_category: 'small', area_hint: 'around 460 square kilometers of land', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Seychellois Creole', 'English'], currency: 'Seychellois rupee', landmarks: ['Granite boulders of La Digue', 'Vallée de Mai palms', 'Outer coral atolls'], 
    fun_facts: [
      'An archipelago of 115 islands, including the only mid-ocean granite islands on Earth',
      'Vallée de Mai on Praslin Island is the native home of the rare coco de mer palm tree',
      'Aldabra Atoll here is one of the largest raised coral atolls on Earth, home to giant tortoises'
    ], 
    built_in_clue: 'An Indian Ocean island chain made of granite peaks and remote outer coral atolls.', nearby_country_clue: 'Northeast of Madagascar in the Indian Ocean.', flag: '🇸🇨' },

  { id: 114, name: 'Cape Verde', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Western Africa', capital: 'Praia', population_hint: 'about 600,000 people', size_category: 'small', area_hint: 'around 4,000 square kilometers of land', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Portuguese', 'Cape Verdean Creole'], currency: 'Cape Verdean escudo', landmarks: ['Fogo volcano', 'Sal beaches', 'Mindelo bay'], 
    fun_facts: [
      'Pico do Fogo is Cape Verde’s active volcano and highest point at 9,281 feet',
      'Cape Verde is a ten-island volcanic archipelago 350 miles off West Africa',
      'Divided into two main island groups based on wind patterns: Barlavento and Sotavento'
    ], 
    built_in_clue: 'An Atlantic Ocean volcanic archipelago nation located off the western coast of Senegal.', nearby_country_clue: 'Far west of Senegal in the Atlantic Ocean.', flag: '🇨🇻' },

  { id: 115, name: 'Senegal', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Western Africa', capital: 'Dakar', population_hint: 'about 18 million people', size_category: 'medium', area_hint: 'around 197,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Mauritania', 'Mali', 'Guinea', 'Guinea-Bissau', 'Gambia'], main_languages: ['French'], currency: 'West African CFA franc', landmarks: ['Pink Lake Retba', 'Djoudj bird sanctuary', 'Gorée Island'], 
    fun_facts: [
      'Senegal nearly surrounds The Gambia along its narrow river corridor',
      'Lake Retba here has a bright bubblegum pink color caused by salt-loving algae',
      'Pointe des Almadies is the westernmost point of continental Africa'
    ], 
    built_in_clue: 'A West African nation occupying the Cap-Vert Peninsula, the westernmost point of continental Africa.', nearby_country_clue: 'Wraps around The Gambia with Mauritania to the north and Mali to the east.', flag: '🇸🇳' },

  { id: 116, name: 'Mali', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Western Africa', capital: 'Bamako', population_hint: 'about 22 million people', size_category: 'large', area_hint: 'around 1.2 million square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'landlocked', neighbors: ['Mauritania', 'Algeria', 'Niger', 'Burkina Faso', 'Ivory Coast', 'Guinea', 'Senegal'], main_languages: ['French'], currency: 'West African CFA franc', landmarks: ['Timbuktu', 'Bandiagara cliffs', 'Niger River bend'], 
    fun_facts: [
      'The Inner Niger Delta here forms a giant inland seasonal wetland in the dry Sahel',
      'The Bandiagara Escarpment is a sandstone cliff wall rising 1,600 feet along a high plateau',
      'Divided between the dry northern Sahara, central Sahel plains, and southern savannas'
    ], 
    built_in_clue: 'A landlocked West African country covered by the Sahara Desert, the Sahel, and the Niger River bend.', nearby_country_clue: 'Between Mauritania and Niger with Algeria to the north.', flag: '🇲🇱' },

  { id: 117, name: 'Niger', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Western Africa', capital: 'Niamey', population_hint: 'about 26 million people', size_category: 'large', area_hint: 'around 1.27 million square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'landlocked', neighbors: ['Algeria', 'Libya', 'Chad', 'Nigeria', 'Benin', 'Burkina Faso', 'Mali'], main_languages: ['French'], currency: 'West African CFA franc', landmarks: ['Sahara dunes of the Tenere', 'Air Mountains', 'Niger River'], 
    fun_facts: [
      'The Aïr Mountains rise like a highland island from Niger’s surrounding Sahara',
      'The Sahara covers more than 80 percent of Niger',
      'The Ténéré desert region here features giant shifting sand dunes'
    ], 
    built_in_clue: 'A large landlocked Sahel nation named after the main river flowing through its southwest corner.', nearby_country_clue: 'Between Algeria and Nigeria with Chad to the east.', flag: '🇳🇪' },

  { id: 118, name: 'Burkina Faso', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Western Africa', capital: 'Ouagadougou', population_hint: 'about 22 million people', size_category: 'small', area_hint: 'around 274,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'landlocked', neighbors: ['Mali', 'Niger', 'Benin', 'Togo', 'Ghana', 'Ivory Coast'], main_languages: ['French'], currency: 'West African CFA franc', landmarks: ['Sindou Peaks', 'Banfora cascades', 'Nazinga Reserve'], 
    fun_facts: [
      'The Sindou Peaks form narrow sandstone spires sculpted by wind and erosion',
      'Burkina Faso is largely a broad, gently rolling plateau',
      'Serves as the headwater origin for the Black Volta, White Volta, and Red Volta rivers'
    ], 
    built_in_clue: 'A landlocked West African plateau country located at the sources of the Volta River system.', nearby_country_clue: 'Between Mali and Benin with Ghana and Ivory Coast to the south.', flag: '🇧🇫' },

  { id: 119, name: 'Sierra Leone', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Western Africa', capital: 'Freetown', population_hint: 'about 8 million people', size_category: 'small', area_hint: 'around 72,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Guinea', 'Liberia'], main_languages: ['English'], currency: 'Leone', landmarks: ['Freetown beaches', 'Tacugama chimpanzee sanctuary', 'Loma Mountains'], 
    fun_facts: [
      'Mount Bintumani in its Loma Mountains is the highest point in West Africa at 6,381 feet',
      'The Freetown Peninsula contains coastal rainforest mountains running parallel to ocean beaches',
      'Features extensive coastal mangrove swamps along its broken Atlantic coastline'
    ], 
    built_in_clue: 'A coastal West African country marked by coastal mangroves, lowland forests, and the Loma Mountains.', nearby_country_clue: 'Between Guinea and Liberia on the Atlantic coast.', flag: '🇸🇱' },

  { id: 120, name: 'Liberia', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Western Africa', capital: 'Monrovia', population_hint: 'about 5 million people', size_category: 'small', area_hint: 'around 111,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Sierra Leone', 'Guinea', 'Ivory Coast'], main_languages: ['English'], currency: 'Liberian dollar', landmarks: ['Sapo rainforest', 'Providence Island', 'Cape Palmas'], 
    fun_facts: [
      'Contains Sapo National Park, protecting the second-largest primary tropical rainforest block in West Africa',
      'Transitions from coastal mangrove swamps up to a heavily forested interior plateau',
      'Features nine major river systems flowing parallel toward the Atlantic Ocean'
    ], 
    built_in_clue: 'A coastal West African country made of dense tropical rainforests and coastal lagoons.', nearby_country_clue: 'Between Sierra Leone and Ivory Coast with Guinea to the north.', flag: '🇱🇷' },

  { id: 121, name: 'Ivory Coast', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Western Africa', capital: 'Yamoussoukro', population_hint: 'about 28 million people', size_category: 'medium', area_hint: 'around 322,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Liberia', 'Guinea', 'Mali', 'Burkina Faso', 'Ghana'], main_languages: ['French'], currency: 'West African CFA franc', landmarks: ['Basilica of Our Lady of Peace', 'Taï rainforest', 'Grand-Bassam beaches'], 
    fun_facts: [
      'Taï National Park protects one of the last major primary rainforest blocks in West Africa',
      'Mount Nimba on its western border rises sharply above surrounding plains to 5,748 feet',
      'Transitions from coastal lagoons in the south to interior tropical forests and northern savannas'
    ], 
    built_in_clue: 'A West African Gulf of Guinea country stepping up from coastal lagoons to primary rainforest and savannas.', nearby_country_clue: 'Between Ghana and Liberia with Mali to the north.', flag: '🇨🇮' },

  { id: 122, name: 'Central African Republic', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Middle Africa', capital: 'Bangui', population_hint: 'about 6 million people', size_category: 'medium', area_hint: 'around 623,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Chad', 'Sudan', 'South Sudan', 'Cameroon', 'Republic of the Congo', 'DR Congo'], main_languages: ['French', 'Sango'], currency: 'Central African CFA franc', landmarks: ['Dzanga-Sangha rainforest', 'Manovo-Gounda St Floris savanna', 'Ubangi River'], 
    fun_facts: [
      'Dzanga-Sangha protects lowland rainforest and forest elephant habitat',
      'Sits almost entirely within the interior watershed divide separating the Congo and Lake Chad basins',
      'Dominated by vast savanna plateaus averaging 2,000 feet above sea level'
    ], 
    built_in_clue: 'A landlocked Central African country occupying a large interior savanna plateau between river basins.', nearby_country_clue: 'Between Cameroon and South Sudan with Chad to the north.', flag: '🇨🇫' },

  { id: 123, name: 'Gabon', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Middle Africa', capital: 'Libreville', population_hint: 'about 2.4 million people', size_category: 'medium', area_hint: 'around 268,000 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Equatorial Guinea', 'Cameroon', 'Republic of the Congo'], main_languages: ['French'], currency: 'Central African CFA franc', landmarks: ['Loango National Park', 'Ivindo waterfalls', 'Ogooué River'], 
    fun_facts: [
      'At Loango National Park, tropical rainforest reaches the Atlantic Ocean',
      'Forests cover more than 85 percent of Gabon',
      'The Ogooué River is its main river, draining most of the national territory'
    ], 
    built_in_clue: 'An equatorial West African country covered almost entirely by Atlantic primary rainforests.', nearby_country_clue: 'Between Equatorial Guinea and Republic of the Congo on the west coast.', flag: '🇬🇦' },

  { id: 124, name: 'Republic of the Congo', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Middle Africa', capital: 'Brazzaville', population_hint: 'about 6 million people', size_category: 'medium', area_hint: 'around 342,000 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Gabon', 'Cameroon', 'Central African Republic', 'DR Congo', 'Angola (Cabinda)'], main_languages: ['French'], currency: 'Central African CFA franc', landmarks: ['Odzala-Kokoua forests', 'Congo River rapids', 'Lefini Reserve'], 
    fun_facts: [
      'Brazzaville and Kinshasa are the closest national capitals separated by an international border',
      'Odzala-Kokoua National Park is an important sanctuary for wild western lowland gorillas',
      'Contains giant swamp forest regions in its north inside the Congo Basin'
    ], 
    built_in_clue: 'A Central African nation defined by the right bank of the Congo River and northern tropical forests.', nearby_country_clue: 'North of Angola’s Cabinda and west of DR Congo with Gabon on its coast.', flag: '🇨🇬' },

  { id: 125, name: 'Equatorial Guinea', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Middle Africa', capital: 'Malabo', population_hint: 'about 1.7 million people', size_category: 'small', area_hint: 'around 28,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Cameroon', 'Gabon'], main_languages: ['Spanish'], currency: 'Central African CFA franc', landmarks: ['Bioko volcano', 'Monte Alén rainforest', 'Bata beaches'], 
    fun_facts: [
      'Pico Basile, an active Bioko volcano, rises 9,878 feet above sea level',
      'Malabo lies on the northern coast of Bioko, a volcanic island',
      'Equatorial Guinea is split between a mainland territory and offshore volcanic islands'
    ], 
    built_in_clue: 'A Central African country split between a mainland Atlantic section and offshore volcanic islands.', nearby_country_clue: 'Mainland sits between Cameroon and Gabon; island capital lies off Cameroon’s coast.', flag: '🇬🇶' },

  { id: 126, name: 'Ukraine', difficulty: 'easy', stars: 1, continent: 'Europe', subregion: 'Eastern Europe', capital: 'Kyiv', population_hint: 'about 44 million people', size_category: 'medium', area_hint: 'around 604,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Russia', 'Belarus', 'Poland', 'Slovakia', 'Hungary', 'Romania', 'Moldova'], main_languages: ['Ukrainian'], currency: 'Ukrainian hryvnia', landmarks: ['Carpathian highlands', 'Kyiv Pechersk Lavra', 'Odesa Black Sea coast'], 
    fun_facts: [
      'Ukraine contains vast belts of fertile chernozem, or “black soil”',
      'Ukraine is the largest country located entirely within continental Europe',
      'Hoverla in the Carpathian Mountains is the country’s highest peak at 6,761 feet'
    ], 
    built_in_clue: 'The largest entirely European country, marked by flat agricultural plains and Black Sea ports.', nearby_country_clue: 'Between Poland and Russia with the Black Sea to the south.', flag: '🇺🇦' },

  { id: 127, name: 'Romania', difficulty: 'easy', stars: 1, continent: 'Europe', subregion: 'Eastern Europe', capital: 'Bucharest', population_hint: 'about 19 million people', size_category: 'medium', area_hint: 'around 238,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Ukraine', 'Moldova', 'Bulgaria', 'Serbia', 'Hungary'], main_languages: ['Romanian'], currency: 'Romanian leu', landmarks: ['Bran Castle', 'Danube Delta', 'Painted monasteries of Bukovina'], 
    fun_facts: [
      'The Carpathian Mountain arc forms a giant natural horseshoe curve through its center',
      'The Danube Delta here is the second-largest and best-preserved river delta wetland in Europe',
      'Moldoveanu Peak in the Făgăraș Mountains is the country’s tallest peak at 8,346 feet'
    ], 
    built_in_clue: 'An Eastern European nation anchored by the Carpathian Mountain horseshoe and the Danube River mouth.', nearby_country_clue: 'Between Hungary and the Black Sea, sharing borders with Bulgaria and Ukraine.', flag: '🇷🇴' },

  { id: 128, name: 'Belarus', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Eastern Europe', capital: 'Minsk', population_hint: 'about 9 million people', size_category: 'medium', area_hint: 'around 208,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Russia', 'Ukraine', 'Poland', 'Lithuania', 'Latvia'], main_languages: ['Belarusian', 'Russian'], currency: 'Belarusian ruble', landmarks: ['Białowieża bison reserve', 'Mir Castle', 'Braslav Lakes'], 
    fun_facts: [
      'Dzyarzhynskaya Hara is Belarus’s highest natural point, only 1,130 feet above sea level',
      'Forests cover roughly 40% of its land area, including protected primeval woods',
      'Belarus is a flat lowland country containing more than 10,000 glacial lakes'
    ], 
    built_in_clue: 'A landlocked Eastern European lowland country defined by flat plains, marshes, and dense forests.', nearby_country_clue: 'Between Poland and Russia with Lithuania and Latvia to the north.', flag: '🇧🇾' },

  { id: 129, name: 'Bulgaria', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Eastern Europe', capital: 'Sofia', population_hint: 'about 7 million people', size_category: 'small', area_hint: 'around 111,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Romania', 'Serbia', 'North Macedonia', 'Greece', 'Turkey'], main_languages: ['Bulgarian'], currency: 'Bulgarian lev', landmarks: ['Rila Monastery', 'Valley of Roses', 'Plovdiv Roman theater'], 
    fun_facts: [
      'Bulgaria’s Rose Valley has ideal conditions for cultivating fragrant roses',
      'The Balkan Mountains run horizontally straight across the middle of the country',
      'Musala is the Balkans’ highest mountain peak at 9,596 feet'
    ], 
    built_in_clue: 'A Balkan country shaped by parallel east-west mountain ranges and a Black Sea eastern coast.', nearby_country_clue: 'Between Romania and Greece with the Black Sea coast to the east.', flag: '🇧🇬' },

  { id: 130, name: 'Croatia', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Southern Europe', capital: 'Zagreb', population_hint: 'about 4 million people', size_category: 'small', area_hint: 'around 57,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Slovenia', 'Hungary', 'Serbia', 'Bosnia and Herzegovina', 'Montenegro'], main_languages: ['Croatian'], currency: 'Euro', landmarks: ['Plitvice Lakes', 'Dubrovnik walls', 'Diocletian\'s Palace in Split'], 
    fun_facts: [
      'Plitvice Lakes links sixteen terraced lakes through a chain of natural waterfalls',
      'Croatia’s crescent-shaped mainland borders a deeply indented Adriatic coast',
      'The Dinaric Alps run along its coast, creating limestone caves and sinkholes'
    ], 
    built_in_clue: 'An Adriatic coastal country featuring a crescent shape, thousands of islands, and limestone lakes.', nearby_country_clue: 'Wraps around Bosnia and Herzegovina with Slovenia and Hungary to the north.', flag: '🇭🇷' },

  { id: 131, name: 'Serbia', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Southern Europe', capital: 'Belgrade', population_hint: 'about 7 million people', size_category: 'small', area_hint: 'around 88,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Hungary', 'Romania', 'Bulgaria', 'North Macedonia', 'Kosovo', 'Montenegro', 'Bosnia and Herzegovina', 'Croatia'], main_languages: ['Serbian'], currency: 'Serbian dinar', landmarks: ['Belgrade Fortress', 'Đavolja Varoš rock pillars', 'Drina River house'], 
    fun_facts: [
      'Belgrade sits directly at the spot where the Danube and Sava rivers meet',
      'The Iron Gates is a dramatic Danube River canyon located on its eastern border with Romania',
      'Đavolja Varoš features over 200 unusual naturally eroded stone-capped dirt towers'
    ], 
    built_in_clue: 'A landlocked Balkan crossroads nation centered on the fertile Danube River plain and deep gorges.', nearby_country_clue: 'Landlocked between Hungary, Romania, Bulgaria, and Bosnia.', flag: '🇷🇸' },

  { id: 132, name: 'Slovakia', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Eastern Europe', capital: 'Bratislava', population_hint: 'about 5.4 million people', size_category: 'small', area_hint: 'around 49,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Poland', 'Ukraine', 'Hungary', 'Austria', 'Czechia'], main_languages: ['Slovak'], currency: 'Euro', landmarks: ['High Tatras peaks', 'Spiš Castle', 'Dobšinská Ice Cave'], 
    fun_facts: [
      'Slovakia contains more than 6,000 mapped natural caves',
      'The High Tatras contain the tallest Carpathian peaks, reaching 8,710 feet',
      'Mountainous in the north and center, sloping down to Danube River plains in the south'
    ], 
    built_in_clue: 'A landlocked Central European country centered on the High Tatras mountains and Carpathian arc.', nearby_country_clue: 'Between Czechia and Hungary with Poland to the north and Austria nearby.', flag: '🇸🇰' },

  { id: 133, name: 'Slovenia', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Southern Europe', capital: 'Ljubljana', population_hint: 'about 2.1 million people', size_category: 'small', area_hint: 'around 20,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Italy', 'Austria', 'Hungary', 'Croatia'], main_languages: ['Slovenian'], currency: 'Euro', landmarks: ['Lake Bled island church', 'Postojna Cave', 'Julian Alps'], 
    fun_facts: [
      'Slovenia’s Karst Plateau gave the world the geological term for limestone cave landscapes',
      'Mount Triglav in the Julian Alps is the country’s highest peak at 9,396 feet',
      'Forests cover more than half of Slovenia'
    ], 
    built_in_clue: 'A Central European nation located where the Alps, the Mediterranean coast, and limestone plateaus meet.', nearby_country_clue: 'Tiny nation tucked between Italy, Austria, Hungary, and Croatia.', flag: '🇸🇮' },

  { id: 134, name: 'Latvia', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Northern Europe', capital: 'Riga', population_hint: 'about 1.8 million people', size_category: 'small', area_hint: 'around 65,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Estonia', 'Lithuania', 'Russia', 'Belarus'], main_languages: ['Latvian'], currency: 'Euro', landmarks: ['Riga Art Nouveau district', 'Gauja National Park', 'Jūrmala beaches'], 
    fun_facts: [
      'Ventas Rumba spans up to 885 feet, making it Europe’s widest natural waterfall',
      'Pine forests cover more than half of low-lying Latvia',
      'Features a 300-mile sandy Baltic Sea coastline around the Gulf of Riga'
    ], 
    built_in_clue: 'A Baltic country defined by flat coastal plains, extensive pine forests, and the Gulf of Riga.', nearby_country_clue: 'Between Estonia to the north and Lithuania to the south on the Baltic Sea.', flag: '🇱🇻' },

  { id: 135, name: 'Lithuania', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Northern Europe', capital: 'Vilnius', population_hint: 'about 2.8 million people', size_category: 'small', area_hint: 'around 65,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Latvia', 'Belarus', 'Poland', 'Russia (Kaliningrad)'], main_languages: ['Lithuanian'], currency: 'Euro', landmarks: ['Vilnius Old Town', 'Curonian Spit dunes', 'Hill of Crosses'], 
    fun_facts: [
      'Shares the Curonian Spit, a narrow 60-mile sand dune peninsula separating a lagoon from the sea',
      'Aukštojas Hill is the country’s highest point at only 964 feet above sea level',
      'One 1989 calculation placed a geographic centre of Europe near Vilnius'
    ], 
    built_in_clue: 'The southernmost Baltic state, marked by flat glaciated plains and the Curonian Spit sand dunes.', nearby_country_clue: 'South of Latvia, east of the Baltic Sea, and north of Poland.', flag: '🇱🇹' },

  { id: 136, name: 'Estonia', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Northern Europe', capital: 'Tallinn', population_hint: 'about 1.3 million people', size_category: 'small', area_hint: 'around 45,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Latvia', 'Russia'], main_languages: ['Estonian'], currency: 'Euro', landmarks: ['Tallinn medieval Old Town', 'Lahemaa bogs', 'Saaremaa island'], 
    fun_facts: [
      'Includes over 2,200 islands and islets in the Baltic Sea, such as Saaremaa',
      'Bogs and peatlands cover more than 20% of the entire land area',
      'Suur Munamägi in the south is the highest point in the Baltic region at 1,043 feet'
    ], 
    built_in_clue: 'The northernmost Baltic country, defined by thousands of Baltic islands, flat land, and peat bogs.', nearby_country_clue: 'Northernmost Baltic state, south of Finland across the gulf and north of Latvia.', flag: '🇪🇪' },

  { id: 137, name: 'Albania', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Southern Europe', capital: 'Tirana', population_hint: 'about 2.8 million people', size_category: 'small', area_hint: 'around 29,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Montenegro', 'Kosovo', 'North Macedonia', 'Greece'], main_languages: ['Albanian'], currency: 'Albanian lek', landmarks: ['Berat white houses', 'Albanian Riviera', 'Butrint ruins'], 
    fun_facts: [
      'The Strait of Otranto separates Albania from Italy by only 45 miles',
      'Rugged mountains cover more than 70 percent of Albania',
      'Shares three major ancient tectonic lakes: Lake Ohrid, Lake Prespa, and Lake Shkodra'
    ], 
    built_in_clue: 'A mountainous Balkan nation situated along the Adriatic and Ionian coastal seas.', nearby_country_clue: 'Between Montenegro and Greece on the Adriatic, east of Italy across the strait.', flag: '🇦🇱' },

  { id: 138, name: 'Bosnia and Herzegovina', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Southern Europe', capital: 'Sarajevo', population_hint: 'about 3.2 million people', size_category: 'small', area_hint: 'around 51,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Croatia', 'Serbia', 'Montenegro'], main_languages: ['Bosnian', 'Serbian', 'Croatian'], currency: 'Convertible mark', landmarks: ['Stari Most bridge in Mostar', 'Sarajevo bazaar', 'Una River waterfalls'], 
    fun_facts: [
      'Perućica protects one of Europe’s last remaining primeval forests',
      'The Dinaric Alps dominate its land, forming high limestone plateaus and deep river canyons',
      'Bosnia and Herzegovina has a 12-mile Adriatic coastline at Neum'
    ], 
    built_in_clue: 'A mountainous Balkan nation in the Dinaric Alps, holding a short coastal strip at Neum.', nearby_country_clue: 'Nearly surrounded by Croatia with Serbia and Montenegro to the east.', flag: '🇧🇦' },

  { id: 139, name: 'North Macedonia', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Southern Europe', capital: 'Skopje', population_hint: 'about 2 million people', size_category: 'small', area_hint: 'around 25,700 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Serbia', 'Kosovo', 'Albania', 'Greece', 'Bulgaria'], main_languages: ['Macedonian'], currency: 'Macedonian denar', landmarks: ['Lake Ohrid', 'Matka Canyon', 'Skopje Stone Bridge'], 
    fun_facts: [
      'Lake Ohrid here is one of the oldest natural lakes on Earth, formed over two million years ago',
      'Landlocked country surrounded by high mountain ranges like the Šar Mountains',
      'Mount Korab on its western border is its tallest mountain peak at 9,068 feet'
    ], 
    built_in_clue: 'A landlocked Balkan nation centered on the Vardar River basin and ancient mountain lakes.', nearby_country_clue: 'Between Serbia and Greece with Albania and Bulgaria on either side.', flag: '🇲🇰' },

  { id: 140, name: 'Montenegro', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Southern Europe', capital: 'Podgorica', population_hint: 'about 620,000 people', size_category: 'tiny', area_hint: 'around 14,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Croatia', 'Bosnia and Herzegovina', 'Serbia', 'Kosovo', 'Albania'], main_languages: ['Montenegrin'], currency: 'Euro', landmarks: ['Bay of Kotor', 'Durmitor peaks', 'Tara River Canyon'], 
    fun_facts: [
      'The Tara River Canyon here is one of the deepest river canyons in Europe at 4,300 feet deep',
      'The Bay of Kotor is a dramatic submerged river valley forming a deep natural ocean bay',
      'Durmitor National Park features glaciated peaks, limestone canyons, and 18 mountain lakes'
    ], 
    built_in_clue: 'A small, rugged Balkan country defined by coastal bays, deep limestone canyons, and high peaks.', nearby_country_clue: 'Adriatic sliver between Croatia and Albania with Serbia inland.', flag: '🇲🇪' },

  { id: 141, name: 'Moldova', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Eastern Europe', capital: 'Chișinău', population_hint: 'about 2.6 million people', size_category: 'small', area_hint: 'around 34,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Romania', 'Ukraine'], main_languages: ['Romanian'], currency: 'Moldovan leu', landmarks: ['Mileștii Mici wine cellars', 'Orheiul Vechi monastery', 'Soroca fortress'], 
    fun_facts: [
      'Mileștii Mici holds a world record for its vast underground wine-cellar tunnels',
      'Moldova lies between the Prut and Dniester rivers',
      'Made mostly of rolling, gently sloping hills with rich black agricultural soils'
    ], 
    built_in_clue: 'A landlocked Eastern European country occupying the fertile hilly plateau between two rivers.', nearby_country_clue: 'Squeezed between Romania and Ukraine in eastern Europe.', flag: '🇲🇩' },

  { id: 142, name: 'Malta', difficulty: 'hard', stars: 3, continent: 'Europe', subregion: 'Southern Europe', capital: 'Valletta', population_hint: 'about 520,000 people', size_category: 'tiny', area_hint: 'around 316 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Maltese', 'English'], currency: 'Euro', landmarks: ['Valletta fortifications', 'Megalithic temples', 'Blue Grotto'], 
    fun_facts: [
      'Malta’s prehistoric megalithic temples rank among the world’s oldest free-standing structures',
      'Malta is a central Mediterranean archipelago with three main inhabited islands',
      'Has no natural permanent surface rivers or lakes across its limestone land area'
    ], 
    built_in_clue: 'A central Mediterranean island archipelago made of low limestone plateaus and natural harbors.', nearby_country_clue: 'Island south of Sicily in the central Mediterranean.', flag: '🇲🇹' },

  { id: 143, name: 'Luxembourg', difficulty: 'hard', stars: 3, continent: 'Europe', subregion: 'Western Europe', capital: 'Luxembourg City', population_hint: 'about 650,000 people', size_category: 'tiny', area_hint: 'around 2,586 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Belgium', 'France', 'Germany'], main_languages: ['Luxembourgish', 'French', 'German'], currency: 'Euro', landmarks: ['Bock Casemates', 'Mullerthal rock trails', 'Grand Ducal Palace'], 
    fun_facts: [
      'Luxembourg City’s historic fortress crowns steep sandstone cliffs above two river valleys',
      'Kneiff is the highest point in the country at 1,837 feet high',
      'Luxembourg comprises the forested Ösling and the more fertile Gutland'
    ], 
    built_in_clue: 'A landlocked Western European microstate transitioning from northern forested hills to southern plains.', nearby_country_clue: 'Nestled between Belgium, France, and Germany.', flag: '🇱🇺' },

  { id: 144, name: 'Liechtenstein', difficulty: 'expert', stars: 4, continent: 'Europe', subregion: 'Western Europe', capital: 'Vaduz', population_hint: 'about 39,000 people', size_category: 'tiny', area_hint: 'around 160 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Switzerland', 'Austria'], main_languages: ['German'], currency: 'Swiss franc', landmarks: ['Vaduz Castle', 'Malbun ski slopes', 'Rhine Valley vineyards'], 
    fun_facts: [
      'One of only two double-landlocked countries, surrounded entirely by other landlocked countries',
      'Bounded on the west by the Alpine Rhine River, which forms its entire border with Switzerland',
      'Grauspitz in the Alps range is the highest mountain in the country at 8,526 feet'
    ], 
    built_in_clue: 'A double-landlocked Alpine microstate situated along the eastern bank of the Rhine River.', nearby_country_clue: 'Squeezed between Switzerland and Austria along the Rhine.', flag: '🇱🇮' },

  { id: 145, name: 'Monaco', difficulty: 'expert', stars: 4, continent: 'Europe', subregion: 'Western Europe', capital: 'Monaco', population_hint: 'about 40,000 people', size_category: 'tiny', area_hint: 'around 2 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['France'], main_languages: ['French'], currency: 'Euro', landmarks: ['Monte Carlo Casino', 'Prince\'s Palace', 'Oceanographic Museum'], 
    fun_facts: [
      'The second-smallest independent country in the world, measuring less than one square mile',
      'Ranks as the most densely populated independent nation on Earth',
      'Has expanded its total land area by over 20% by building out into the Mediterranean Sea'
    ], 
    built_in_clue: 'The world’s most densely populated coastal city-state, situated on the French Riviera.', nearby_country_clue: 'Entirely surrounded by France on three sides with the Mediterranean on the fourth.', flag: '🇲🇨' },

  { id: 146, name: 'Andorra', difficulty: 'expert', stars: 4, continent: 'Europe', subregion: 'Southern Europe', capital: 'Andorra la Vella', population_hint: 'about 80,000 people', size_category: 'tiny', area_hint: 'around 468 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['France', 'Spain'], main_languages: ['Catalan'], currency: 'Euro', landmarks: ['Grandvalira ski resort', 'Romanesque churches', 'Madriu-Perafita-Claror valley'], 
    fun_facts: [
      'Andorra la Vella is the highest capital city in Europe at 3,356 feet above sea level',
      'Made entirely of rugged mountain terrain in the Pyrenees cut by steep river valleys',
      'Coma Pedrosa is the tallest mountain peak in the country at 9,652 feet'
    ], 
    built_in_clue: 'A landlocked Pyrenean microstate situated in a high mountain basin between France and Spain.', nearby_country_clue: 'Tucked in the Pyrenees between France and Spain.', flag: '🇦🇩' },

  { id: 147, name: 'San Marino', difficulty: 'expert', stars: 4, continent: 'Europe', subregion: 'Southern Europe', capital: 'San Marino', population_hint: 'about 34,000 people', size_category: 'tiny', area_hint: 'around 61 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Italy'], main_languages: ['Italian'], currency: 'Euro', landmarks: ['Three Towers of San Marino', 'Mount Titano', 'Palazzo Pubblico'], 
    fun_facts: [
      'San Marino’s three medieval towers crown Mount Titano’s steep limestone ridge',
      'San Marino traditionally dates its founding to 301 CE and preserves one of the oldest republican traditions',
      'Mount Titano, a steep limestone ridge peaking at 2,425 feet, dominates the landscape'
    ], 
    built_in_clue: 'A landlocked enclave microstate perched on the slopes of Mount Titano inside central Italy.', nearby_country_clue: 'Completely enclaved by Italy near the Adriatic coast.', flag: '🇸🇲' },

  { id: 148, name: 'Vatican City', difficulty: 'expert', stars: 4, continent: 'Europe', subregion: 'Southern Europe', capital: 'Vatican City', population_hint: 'about 800 people', size_category: 'tiny', area_hint: 'around 0.44 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Italy'], main_languages: ['Italian', 'Latin'], currency: 'Euro', landmarks: ['St. Peter\'s Basilica', 'Sistine Chapel', 'Vatican Museums'], 
    fun_facts: [
      'The smallest independent country on Earth by both land area and population',
      'Completely enclosed within the city boundaries of Rome, Italy',
      'Contains St. Peter’s Basilica, historic palaces, and protected stone garden grounds'
    ], 
    built_in_clue: 'The world’s smallest independent country, entirely enclosed within the city of Rome.', nearby_country_clue: 'Entirely enclosed within the city of Rome, Italy.', flag: '🇻🇦' },

  { id: 149, name: 'Kosovo', difficulty: 'medium', stars: 2, continent: 'Europe', subregion: 'Southern Europe', capital: 'Pristina', population_hint: 'about 1.8 million people', size_category: 'small', area_hint: 'around 10,887 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Serbia', 'Albania', 'North Macedonia', 'Montenegro'], main_languages: ['Albanian', 'Serbian'], currency: 'Euro', landmarks: ['Gračanica Monastery', 'Rugova Canyon', 'Bear Sanctuary'], 
    fun_facts: [
      'Rugova Canyon is a 15-mile mountain gorge carved deeply by river water',
      'Mountain ranges frame landlocked Kosovo in the central Balkans',
      'Velika Rudoka is the highest point in the nation at 8,720 feet in the Šar range'
    ], 
    built_in_clue: 'A landlocked Balkan country encompassing central mountain basins and deep river gorges.', nearby_country_clue: 'Landlocked between Serbia, Albania, North Macedonia, and Montenegro.', flag: '🇽🇰' },

  { id: 150, name: 'Trinidad and Tobago', difficulty: 'medium', stars: 2, continent: 'North America', subregion: 'Caribbean', capital: 'Port of Spain', population_hint: 'about 1.4 million people', size_category: 'tiny', area_hint: 'around 5,131 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['English'], currency: 'Trinidad and Tobago dollar', landmarks: ['Pitch Lake', 'Maracas Bay', 'Caroni Bird Sanctuary'], 
    fun_facts: [
      'Pitch Lake on Trinidad is the world’s largest natural deposit of liquid asphalt',
      'Sits on the continental shelf of South America, just 7 miles off the coast of Venezuela',
      'Holds diverse wildlife because it was once physically connected to mainland South America'
    ], 
    built_in_clue: 'A twin-island Caribbean country sitting on the South American continental shelf, home to Pitch Lake.', nearby_country_clue: 'Just off the coast of Venezuela in the southern Caribbean.', flag: '🇹🇹' },

  { id: 151, name: 'Barbados', difficulty: 'medium', stars: 2, continent: 'North America', subregion: 'Caribbean', capital: 'Bridgetown', population_hint: 'about 288,000 people', size_category: 'tiny', area_hint: 'around 430 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['English'], currency: 'Barbadian dollar', landmarks: ['Harrison\'s Cave', 'Bridgetown boardwalk', 'Bathsheba rock formations'], 
    fun_facts: [
      'Formed mostly by the gradual tectonic uplift of coral limestone rather than volcanoes',
      'Harrison’s Cave is a giant underground limestone cavern system with active water streams',
      'Sits further east into the Atlantic Ocean than any other island in the Caribbean chain'
    ], 
    built_in_clue: 'The easternmost island of the Lesser Antilles, made of elevated coral limestone plateaus.', nearby_country_clue: 'Eastern Caribbean island east of Saint Vincent and the Grenadines.', flag: '🇧🇧' },

  { id: 152, name: 'Bahamas', difficulty: 'medium', stars: 2, continent: 'North America', subregion: 'Caribbean', capital: 'Nassau', population_hint: 'about 400,000 people', size_category: 'small', area_hint: 'around 13,900 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['English'], currency: 'Bahamian dollar', landmarks: ['Exuma swimming pigs', 'Andros blue holes', 'Pink sand beaches of Harbour Island'], 
    fun_facts: [
      'Dean’s Blue Hole descends 663 feet, ranking among the deepest marine sinkholes',
      'The Bahamas comprises more than 700 islands and 2,000 cays on shallow ocean banks',
      'Andros Island features one of the longest continuous barrier reefs in the world'
    ], 
    built_in_clue: 'A coral archipelago nation of shallow ocean banks, underwater blue holes, and barrier reefs.', nearby_country_clue: 'Southeast of Florida and north of Cuba in the Atlantic.', flag: '🇧🇸' },

  { id: 153, name: 'Belize', difficulty: 'medium', stars: 2, continent: 'North America', subregion: 'Central America', capital: 'Belmopan', population_hint: 'about 430,000 people', size_category: 'small', area_hint: 'around 23,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Mexico', 'Guatemala'], main_languages: ['English'], currency: 'Belize dollar', landmarks: ['Great Blue Hole', 'Belize Barrier Reef', 'Xunantunich Maya ruins'], 
    fun_facts: [
      'The Belize Barrier Reef is the largest double-barrier reef system in the Northern Hemisphere',
      'The Great Blue Hole is a circular ocean sinkhole measuring nearly 1,000 feet wide',
      'Over 60% of its land is covered by primary forest, including protected wildlife corridors'
    ], 
    built_in_clue: 'A Central American coastal country home to the Great Blue Hole and extensive barrier reefs.', nearby_country_clue: 'Between Mexico and Guatemala on the Caribbean coast.', flag: '🇧🇿' },

  { id: 154, name: 'Guyana', difficulty: 'medium', stars: 2, continent: 'South America', subregion: 'South America', capital: 'Georgetown', population_hint: 'about 800,000 people', size_category: 'medium', area_hint: 'around 215,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Venezuela', 'Brazil', 'Suriname'], main_languages: ['English'], currency: 'Guyanese dollar', landmarks: ['Kaieteur Falls', 'Iwokrama Rainforest', 'Shell Beach'], 
    fun_facts: [
      'Kaieteur Falls here is the world’s largest single-drop waterfall by water volume, plunging 741 feet',
      'Over 80% of its land remains covered by untouched primary tropical rainforests',
      'Mount Roraima on its border is an ancient tabletop mountain rising 9,219 feet high'
    ], 
    built_in_clue: 'A northern South American country situated on the Guiana Shield featuring Kaieteur Falls.', nearby_country_clue: 'Between Venezuela and Suriname on South America\'s northern coast.', flag: '🇬🇾' },

  { id: 155, name: 'Suriname', difficulty: 'hard', stars: 3, continent: 'South America', subregion: 'South America', capital: 'Paramaribo', population_hint: 'about 620,000 people', size_category: 'medium', area_hint: 'around 164,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Guyana', 'Brazil', 'France (French Guiana)'], main_languages: ['Dutch'], currency: 'Surinamese dollar', landmarks: ['Central Suriname Nature Reserve', 'Paramaribo wooden cathedral', 'Brownsberg Nature Park'], 
    fun_facts: [
      'Holds the highest proportion of forest cover on Earth, with about 93% covered by trees',
      'The Central Suriname Reserve protects nearly 4 million acres of primary tropical rainforest',
      'Julianatop in the Wilhelmina Mountains is the highest point in the nation at 4,200 feet'
    ], 
    built_in_clue: 'The smallest independent country in South America, covered almost entirely by primary rainforest.', nearby_country_clue: 'Between Guyana and French Guiana on the northern coast of South America.', flag: '🇸🇷' },

  { id: 156, name: 'Honduras', difficulty: 'medium', stars: 2, continent: 'North America', subregion: 'Central America', capital: 'Tegucigalpa', population_hint: 'about 10 million people', size_category: 'small', area_hint: 'around 112,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Guatemala', 'El Salvador', 'Nicaragua'], main_languages: ['Spanish'], currency: 'Honduran lempira', landmarks: ['Copan Maya ruins', 'Bay Islands coral reefs', 'Rio Platano Biosphere'], 
    fun_facts: [
      'Río Plátano protects extensive primary rainforest in the remote Mosquitia region',
      'The Bay Islands off its coast sit directly on the Mesoamerican Barrier Reef',
      'Highly mountainous interior, with mountain peaks rising up to 9,416 feet high'
    ], 
    built_in_clue: 'A Central American country featuring barrier reefs and mountainous rainforest reserves.', nearby_country_clue: 'Between Guatemala, El Salvador, and Nicaragua with both Caribbean and Pacific coasts.', flag: '🇭🇳' },

  { id: 157, name: 'El Salvador', difficulty: 'medium', stars: 2, continent: 'North America', subregion: 'Central America', capital: 'San Salvador', population_hint: 'about 6.5 million people', size_category: 'small', area_hint: 'around 21,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Guatemala', 'Honduras'], main_languages: ['Spanish'], currency: 'US dollar', landmarks: ['Joya de Ceren Maya village', 'Santa Ana volcano', 'El Tunco surf beaches'], 
    fun_facts: [
      'The smallest country by land area in all of Central America',
      'The only country in Central America without a coastline on the Caribbean Sea',
      'Known as the "Land of Volcanoes" due to its dense volcanic mountain chain along the Pacific Coast'
    ], 
    built_in_clue: 'The smallest Central American country, bounded exclusively by the Pacific Ocean and volcanic chains.', nearby_country_clue: 'Between Guatemala and Honduras with only a Pacific coastline.', flag: '🇸🇻' },

  { id: 158, name: 'Nicaragua', difficulty: 'medium', stars: 2, continent: 'North America', subregion: 'Central America', capital: 'Managua', population_hint: 'about 7 million people', size_category: 'medium', area_hint: 'around 130,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Honduras', 'Costa Rica'], main_languages: ['Spanish'], currency: 'Nicaraguan cordoba', landmarks: ['Ometepe island volcanoes', 'Granada colonial streets', 'Corn Islands'], 
    fun_facts: [
      'Ometepe Island is formed by two volcanoes joined within Lake Nicaragua',
      'Lake Nicaragua is Central America’s largest freshwater lake',
      'The largest country by land area in Central America'
    ], 
    built_in_clue: 'The largest Central American country, centered around Lake Nicaragua and volcanic island chains.', nearby_country_clue: 'Between Honduras and Costa Rica with both Caribbean and Pacific shores.', flag: '🇳🇮' },

  { id: 159, name: 'Grenada', difficulty: 'hard', stars: 3, continent: 'North America', subregion: 'Caribbean', capital: 'St. George\'s', population_hint: 'about 125,000 people', size_category: 'tiny', area_hint: 'around 344 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['English'], currency: 'East Caribbean dollar', landmarks: ['Grand Anse Beach', 'Underwater sculpture park', 'Fort George'], 
    fun_facts: [
      'Grand Etang is a crater lake occupying the basin of an extinct volcano',
      'Grenada comprises its main island and six smaller northern Grenadine islands',
      'Mount Saint Catherine forms the tallest volcanic peak on the island at 2,756 feet'
    ], 
    built_in_clue: 'A volcanic southern Caribbean island nation centered on crater lakes and marine reserves.', nearby_country_clue: 'Southern Caribbean island north of Trinidad and south of Saint Vincent.', flag: '🇬🇩' },

  { id: 160, name: 'Saint Lucia', difficulty: 'hard', stars: 3, continent: 'North America', subregion: 'Caribbean', capital: 'Castries', population_hint: 'about 180,000 people', size_category: 'tiny', area_hint: 'around 616 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['English'], currency: 'East Caribbean dollar', landmarks: ['Pitons volcanic peaks', 'Sulphur Springs', 'Marigot Bay'], 
    fun_facts: [
      'The Pitons (Gros Piton and Petit Piton) are two giant volcanic spires rising straight out of the ocean',
      'Sulphur Springs at Soufrière is an active geothermal field with steam vents and boiling mud',
      'Mount Gimie is the highest mountain peak on the island, peaking at 3,117 feet'
    ], 
    built_in_clue: 'A mountainous volcanic island country in the Lesser Antilles defined by the twin Piton spires.', nearby_country_clue: 'Between Martinique to the north and Saint Vincent to the south.', flag: '🇱🇨' },

  { id: 161, name: 'Antigua and Barbuda', difficulty: 'hard', stars: 3, continent: 'North America', subregion: 'Caribbean', capital: 'St. John\'s', population_hint: 'about 100,000 people', size_category: 'tiny', area_hint: 'around 442 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['English'], currency: 'East Caribbean dollar', landmarks: ['Nelson\'s Dockyard', '365 beaches', 'Devil\'s Bridge limestone arch'], 
    fun_facts: [
      'Barbuda is a flat coral limestone island holding a large frigate bird sanctuary lagoon',
      'Devil’s Bridge is a natural limestone arch carved over time by Atlantic sea waves',
      'Boggy Peak is the highest volcanic point on Antigua island at 1,319 feet'
    ], 
    built_in_clue: 'A twin-island Caribbean country made of Antigua’s volcanic hills and Barbuda’s coral lagoons.', nearby_country_clue: 'In the Leeward Islands between Montserrat and Barbuda.', flag: '🇦🇬' },

  { id: 162, name: 'Saint Kitts and Nevis', difficulty: 'expert', stars: 4, continent: 'North America', subregion: 'Caribbean', capital: 'Basseterre', population_hint: 'about 55,000 people', size_category: 'tiny', area_hint: 'around 261 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['English'], currency: 'East Caribbean dollar', landmarks: ['Brimstone Hill Fortress', 'Mount Liamuiga crater', 'Scenic Railway'], 
    fun_facts: [
      'Recognized as the smallest sovereign country by land area and population in the Americas',
      'Mount Liamuiga on Saint Kitts is an active volcano featuring a half-mile wide crater lake',
      'Nevis Peak forms a single volcanic mountain dominating the center of Nevis island'
    ], 
    built_in_clue: 'The smallest independent country in the Americas, consisting of two volcanic Caribbean islands.', nearby_country_clue: 'Leeward Islands pair north of Antigua in the eastern Caribbean.', flag: '🇰🇳' },

  { id: 163, name: 'Dominica', difficulty: 'hard', stars: 3, continent: 'North America', subregion: 'Caribbean', capital: 'Roseau', population_hint: 'about 72,000 people', size_category: 'tiny', area_hint: 'around 751 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['English'], currency: 'East Caribbean dollar', landmarks: ['Boiling Lake', 'Trafalgar Falls', 'Morne Trois Pitons'], 
    fun_facts: [
      'Boiling Lake here is the second-largest flooded hot-spring fumarole lake in the world',
      'Features active geothermal vents driven by nine distinct volcanic centers',
      'Covered almost entirely by dense, high-mountain tropical rainforest'
    ], 
    built_in_clue: 'A rugged volcanic island nation in the Caribbean known for steep relief and active thermal lakes.', nearby_country_clue: 'Between Guadeloupe and Martinique in the Windward Islands.', flag: '🇩🇲' },

  { id: 164, name: 'Saint Vincent and the Grenadines', difficulty: 'hard', stars: 3, continent: 'North America', subregion: 'Caribbean', capital: 'Kingstown', population_hint: 'about 110,000 people', size_category: 'tiny', area_hint: 'around 389 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['English'], currency: 'East Caribbean dollar', landmarks: ['Tobago Cays marine park', 'La Soufriere volcano', 'Mustique beaches'], 
    fun_facts: [
      'La Soufrière is an active volcano occupying the northern part of Saint Vincent island',
      'The Tobago Cays Marine Park protects a cluster of five uninhabited coral cays and reefs',
      'Comprises the main island of Saint Vincent and 32 smaller islands in the Grenadines'
    ], 
    built_in_clue: 'A volcanic Caribbean nation featuring active stratovolcanoes and the coral Tobago Cays.', nearby_country_clue: 'South of Saint Lucia and north of Grenada in the Windward Islands.', flag: '🇻🇨' },

  { id: 165, name: 'Cameroon', difficulty: 'medium', stars: 2, continent: 'Africa', subregion: 'Middle Africa', capital: 'Yaounde', population_hint: 'about 28 million people', size_category: 'medium', area_hint: 'around 475,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Nigeria', 'Chad', 'Central African Republic', 'Republic of the Congo', 'Gabon', 'Equatorial Guinea'], main_languages: ['French', 'English'], currency: 'Central African CFA franc', landmarks: ['Mount Cameroon', 'Waza National Park', 'Kribi waterfalls'], 
    fun_facts: [
      'Mount Cameroon is an active volcano and the highest peak in West-Central Africa at 13,255 feet',
      'Cameroon’s coast, forests, mountains, savannas, and dry north create exceptional ecological diversity',
      'Lake Nyos here is a volcanic crater lake known for rare natural gas release events'
    ], 
    built_in_clue: 'A Central-West African nation encompassing all major African biomes and Mount Cameroon.', nearby_country_clue: 'Between Nigeria and Gabon with Chad to the north.', flag: '🇨🇲' },

  { id: 166, name: 'Benin', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Western Africa', capital: 'Porto-Novo', population_hint: 'about 13 million people', size_category: 'small', area_hint: 'around 115,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Togo', 'Burkina Faso', 'Niger', 'Nigeria'], main_languages: ['French'], currency: 'West African CFA franc', landmarks: ['Royal Palaces of Abomey', 'Pendjari National Park', 'Ganvie stilt village'], 
    fun_facts: [
      'Ganvié is a historic village built on wooden stilts across Lake Nokoué',
      'Pendjari National Park protects important West African savanna wildlife',
      'Extends as a narrow strip of land north from the Gulf of Guinea to the Niger River'
    ], 
    built_in_clue: 'A narrow West African coastal country stretching from Lake Nokoué stilt villages north to the Niger River.', nearby_country_clue: 'Between Togo and Nigeria with Niger and Burkina Faso to the north.', flag: '🇧🇯' },

  { id: 167, name: 'Togo', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Western Africa', capital: 'Lome', population_hint: 'about 9 million people', size_category: 'small', area_hint: 'around 57,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Ghana', 'Burkina Faso', 'Benin'], main_languages: ['French'], currency: 'West African CFA franc', landmarks: ['Koutammakou clay towers', 'Mount Agou', 'Lome Grand Marche'], 
    fun_facts: [
      'Koutammakou preserves traditional clay tower-houses built by the Batammariba people',
      'Togo measures less than 70 miles across at its widest point',
      'Mount Agou is the highest point in the country at 3,234 feet in the Togo Mountains'
    ], 
    built_in_clue: 'A thin, long West African country bounded by coastal lagoons and the northern Togo Mountains.', nearby_country_clue: 'Squeezed between Ghana and Benin from the Gulf of Guinea northward.', flag: '🇹🇬' },

  { id: 168, name: 'Guinea', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Western Africa', capital: 'Conakry', population_hint: 'about 14 million people', size_category: 'medium', area_hint: 'around 246,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Senegal', 'Mali', 'Ivory Coast', 'Liberia', 'Sierra Leone', 'Guinea-Bissau'], main_languages: ['French'], currency: 'Guinean franc', landmarks: ['Fouta Djallon highlands', 'Mount Nimba', 'Iles de Los'], 
    fun_facts: [
      'The Fouta Djallon highlands act as West Africa’s water tower, originating the Niger, Gambia, and Senegal rivers',
      'Holds roughly one-third of the world’s total reserves of bauxite ore',
      'Mount Nimba Reserve protects high mountain ridge ecosystems rising above surrounding savannas'
    ], 
    built_in_clue: 'A West African highland nation originating the mountain sources of major continental rivers.', nearby_country_clue: 'Between Senegal, Mali, and Sierra Leone on the Atlantic coast.', flag: '🇬🇳' },

  { id: 169, name: 'Guinea-Bissau', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Western Africa', capital: 'Bissau', population_hint: 'about 2 million people', size_category: 'small', area_hint: 'around 36,000 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Senegal', 'Guinea'], main_languages: ['Portuguese'], currency: 'West African CFA franc', landmarks: ['Bijagos Archipelago', 'Cacheu mangroves', 'Cantanhez Forest'], 
    fun_facts: [
      'The Bijagós Archipelago consists of 88 offshore islands designated as a biosphere sanctuary',
      'Low-lying terrain with deep coastal river mangrove estuaries penetrating inland',
      'Its highest geographic point reaches only 984 feet in the far eastern hills'
    ], 
    built_in_clue: 'A low coastal West African country marked by Atlantic mangroves and the Bijagós Archipelago.', nearby_country_clue: 'Between Senegal and Guinea on the Atlantic coast.', flag: '🇬🇼' },

  { id: 170, name: 'Gambia', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Western Africa', capital: 'Banjul', population_hint: 'about 2.5 million people', size_category: 'small', area_hint: 'around 11,300 square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Senegal'], main_languages: ['English'], currency: 'Gambian dalasi', landmarks: ['River Gambia', 'Kunta Kinteh Island', 'Abuko Nature Reserve'], 
    fun_facts: [
      'The smallest independent country in mainland Africa by land area',
      'Forms a narrow strip of land mirroring the path of the Gambia River for 200 miles',
      'Except for its short Atlantic coastline, it is entirely surrounded by Senegal'
    ], 
    built_in_clue: 'Mainland Africa’s smallest nation, forming a narrow river corridor surrounded by Senegal.', nearby_country_clue: 'Almost entirely surrounded by Senegal except for its short Atlantic coast.', flag: '🇬🇲' },

  { id: 171, name: 'Somalia', difficulty: 'medium', stars: 2, continent: 'Africa', subregion: 'Eastern Africa', capital: 'Mogadishu', population_hint: 'about 17 million people', size_category: 'medium', area_hint: 'around 638,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Djibouti', 'Ethiopia', 'Kenya'], main_languages: ['Somali', 'Arabic'], currency: 'Somali shilling', landmarks: ['Laas Geel cave paintings', 'Cape Guardafui', 'Lido Beach'], 
    fun_facts: [
      'Has the longest coastline of any country on mainland continental Africa, stretching 2,071 miles',
      'Laas Geel features prehistoric cave paintings estimated to date back thousands of years',
      'Occupies the easternmost tip of the Horn of Africa at Cape Guardafui'
    ], 
    built_in_clue: 'A Horn of Africa country possessing mainland Africa’s longest continuous ocean coastline.', nearby_country_clue: 'Occupies the Horn of Africa between Djibouti, Ethiopia, and Kenya.', flag: '🇸🇴' },

  { id: 172, name: 'Sudan', difficulty: 'medium', stars: 2, continent: 'Africa', subregion: 'Northern Africa', capital: 'Khartoum', population_hint: 'about 46 million people', size_category: 'large', area_hint: 'around 1.9 million square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Egypt', 'Libya', 'Chad', 'Central African Republic', 'South Sudan', 'Ethiopia', 'Eritrea'], main_languages: ['Arabic', 'English'], currency: 'Sudanese pound', landmarks: ['Meroe pyramids', 'Confluence of the Niles', 'Jebel Barkal'], 
    fun_facts: [
      'Sudan’s Meroë complex contains more ancient Nubian pyramids than Egypt',
      'Khartoum stands where the White Nile and Blue Nile meet',
      'Made of wide arid desert plains framed by distant mountain ranges'
    ], 
    built_in_clue: 'A large North African river nation centered at the junction of the Blue and White Nile rivers.', nearby_country_clue: 'South of Egypt with Chad to the west and Ethiopia to the east.', flag: '🇸🇩' },

  { id: 173, name: 'South Sudan', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Eastern Africa', capital: 'Juba', population_hint: 'about 11 million people', size_category: 'medium', area_hint: 'around 619,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Sudan', 'Ethiopia', 'Kenya', 'Uganda', 'DR Congo', 'Central African Republic'], main_languages: ['English'], currency: 'South Sudanese pound', landmarks: ['Sudd wetland', 'Boma National Park', 'White Nile stretches'], 
    fun_facts: [
      'Gained independence in 2011, making it the youngest sovereign country on Earth',
      'The Sudd is one of the world’s largest freshwater wetlands, fed by the White Nile',
      'Boma National Park protects huge annual mammal migrations across grasslands'
    ], 
    built_in_clue: 'The world’s newest landlocked country, centered around the vast Sudd Nile wetland plain.', nearby_country_clue: 'Between Sudan and Uganda with Ethiopia and Kenya to the east.', flag: '🇸🇸' },

  { id: 174, name: 'Libya', difficulty: 'medium', stars: 2, continent: 'Africa', subregion: 'Northern Africa', capital: 'Tripoli', population_hint: 'about 7 million people', size_category: 'large', area_hint: 'around 1.8 million square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Tunisia', 'Algeria', 'Niger', 'Chad', 'Sudan', 'Egypt'], main_languages: ['Arabic'], currency: 'Libyan dinar', landmarks: ['Leptis Magna Roman ruins', 'Sahara sand seas', 'Akakus rock art'], 
    fun_facts: [
      'The Great Man-Made River carries fossil groundwater through a vast desert pipeline network',
      'Leptis Magna is one of the best-preserved ancient coastal Roman city ruins',
      'Desert covers more than 90 percent of Libya'
    ], 
    built_in_clue: 'A large North African country bounded by the Mediterranean Sea and deep Saharan sand seas.', nearby_country_clue: 'Between Tunisia and Egypt across North Africa with Chad and Niger to the south.', flag: '🇱🇾' },

  { id: 175, name: 'Eritrea', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Eastern Africa', capital: 'Asmara', population_hint: 'about 3.6 million people', size_category: 'small', area_hint: 'around 118,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Sudan', 'Ethiopia', 'Djibouti'], main_languages: ['Tigrinya', 'Arabic'], currency: 'Eritrean nakfa', landmarks: ['Asmara Art Deco architecture', 'Dahlak Archipelago', 'Dankalia salt flats'], 
    fun_facts: [
      'Includes the Dahlak Archipelago, a group of over 120 coral reef islands in the Red Sea',
      'Asmara sits at an altitude over 7,500 feet on the edge of the mountain highlands',
      'Eritrea’s coast approaches the Bab-el-Mandeb corridor at the southern entrance to the Red Sea'
    ], 
    built_in_clue: 'A Red Sea coastal country marked by high interior plateaus and the Dahlak Archipelago.', nearby_country_clue: 'North of Ethiopia and Djibouti along the Red Sea coast.', flag: '🇪🇷' },

  { id: 176, name: 'Djibouti', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Eastern Africa', capital: 'Djibouti', population_hint: 'about 1 million people', size_category: 'small', area_hint: 'around 23,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Eritrea', 'Ethiopia', 'Somalia'], main_languages: ['French', 'Arabic'], currency: 'Djiboutian franc', landmarks: ['Lake Assal salt lake', 'Ardoukoba volcano', 'Day Forest'], 
    fun_facts: [
      'Lake Assal is a salt crater lake sitting at 508 feet below sea level, the lowest point in Africa',
      'Djibouti occupies a strategic shore beside the Bab-el-Mandeb Strait',
      'Sits where three major tectonic plates pull apart from each other'
    ], 
    built_in_clue: 'A small Horn of Africa coastal nation sitting on a tectonic junction, holding Africa’s lowest land point.', nearby_country_clue: 'Between Eritrea and Somalia at the strait where the Red Sea meets the Gulf of Aden.', flag: '🇩🇯' },

  { id: 177, name: 'Comoros', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Eastern Africa', capital: 'Moroni', population_hint: 'about 900,000 people', size_category: 'tiny', area_hint: 'around 1,862 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Comorian', 'French', 'Arabic'], currency: 'Comorian franc', landmarks: ['Mount Karthala volcano', 'Moheli marine park', 'Medina of Moroni'], 
    fun_facts: [
      'Deep waters around Comoros are home to the rare coelacanth fish',
      'A volcanic island state sitting in the northern Mozambique Channel in the Indian Ocean',
      'Mount Karthala is an active shield volcano with a vast summit crater'
    ], 
    built_in_clue: 'A volcanic island nation located in the Mozambique Channel between mainland Africa and Madagascar.', nearby_country_clue: 'In the Mozambique Channel between Mozambique and Madagascar.', flag: '🇰🇲' },

  { id: 178, name: 'Mauritania', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Western Africa', capital: 'Nouakchott', population_hint: 'about 4.8 million people', size_category: 'large', area_hint: 'around 1 million square kilometers', hemisphere: 'Northern and Western Hemisphere', coastline_type: 'coastal', neighbors: ['Western Sahara', 'Algeria', 'Mali', 'Senegal'], main_languages: ['Arabic'], currency: 'Mauritanian ouguiya', landmarks: ['Richat Structure (Eye of the Sahara)', 'Banc d\'Arguin bird reserve', 'Chinguetti ancient library'], 
    fun_facts: [
      'Contains the Richat Structure ("Eye of the Sahara"), a 25-mile wide circular rock dome visible from space',
      'Banc d\'Arguin National Park is a major coastal UNESCO site protecting migratory Atlantic bird mudflats',
      'Over 75% of its land area is covered by Saharan desert or dry plains'
    ], 
    built_in_clue: 'A West African Saharan nation containing the Richat Structure and coastal bird mudflats.', nearby_country_clue: 'Between Western Sahara and Senegal with Mali and Algeria inland.', flag: '🇲🇷' },

  { id: 179, name: 'Chad', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Middle Africa', capital: 'N\'Djamena', population_hint: 'about 17 million people', size_category: 'large', area_hint: 'around 1.3 million square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['Libya', 'Sudan', 'Central African Republic', 'Cameroon', 'Nigeria', 'Niger'], main_languages: ['French', 'Arabic'], currency: 'Central African CFA franc', landmarks: ['Lake Chad', 'Ennedi Plateau arches', 'Zakouma National Park'], 
    fun_facts: [
      'The Ennedi Plateau in the northeast features natural sandstone towers, arches, and desert canyons',
      'Emi Koussi in the Tibesti Mountains is an extinct volcano and the highest peak in the Sahara at 11,302 feet',
      'Lake Chad on its western border is an endorheic lake that expands and shrinks with rainfall'
    ], 
    built_in_clue: 'A large landlocked Central African country stretching from Saharan mountains down to Lake Chad.', nearby_country_clue: 'Between Libya and Central African Republic with Nigeria and Niger to the west.', flag: '🇹🇩' },

  { id: 180, name: 'Lesotho', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Southern Africa', capital: 'Maseru', population_hint: 'about 2.3 million people', size_category: 'small', area_hint: 'around 30,000 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['South Africa'], main_languages: ['Sesotho', 'English'], currency: 'Lesotho loti', landmarks: ['Maletsunyane Falls', 'Thabana Ntlenyana peak', 'Sani Pass'], 
    fun_facts: [
      'The only independent country on Earth situated entirely above 3,280 feet in elevation',
      'Completely surrounded on all sides by South Africa',
      'Thabana Ntlenyana is the highest peak in Southern Africa at 11,423 feet high'
    ], 
    built_in_clue: 'A high mountain country completely enclosed within the borders of South Africa.', nearby_country_clue: 'Completely surrounded by South Africa in the Drakensberg highlands.', flag: '🇱🇸' },

  { id: 181, name: 'Eswatini', difficulty: 'hard', stars: 3, continent: 'Africa', subregion: 'Southern Africa', capital: 'Mbabane', population_hint: 'about 1.2 million people', size_category: 'small', area_hint: 'around 17,000 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'landlocked', neighbors: ['South Africa', 'Mozambique'], main_languages: ['Swazi', 'English'], currency: 'Swazi lilangeni', landmarks: ['Sibebe Rock', 'Mlilwane Wildlife Sanctuary', 'Mantenga Cultural Village'], 
    fun_facts: [
      'Sibebe Rock is a vast exposed granite dome northeast of Mbabane',
      'Topographically divided into four climatic zones running north to south',
      'A landlocked country located in Southeastern Africa along the Lubombo mountain range'
    ], 
    built_in_clue: 'A small landlocked Southern African country anchored by the Lubombo Mountains and granite domes.', nearby_country_clue: 'Landlocked between South Africa and Mozambique.', flag: '🇸🇿' },

  { id: 182, name: 'Sao Tome and Principe', difficulty: 'expert', stars: 4, continent: 'Africa', subregion: 'Middle Africa', capital: 'Sao Tome', population_hint: 'about 220,000 people', size_category: 'tiny', area_hint: 'around 964 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Portuguese'], currency: 'Sao Tome and Principe dobra', landmarks: ['Pico Cao Grande needle rock', 'Obo National Park', 'Roca plantations'], 
    fun_facts: [
      'Pico Cão Grande is a dramatic volcanic rock needle rising over 1,000 feet straight up out of the jungle',
      'The second-smallest independent country in Africa by land area',
      'An equatorial volcanic island chain sitting in the Gulf of Guinea'
    ], 
    built_in_clue: 'An equatorial island country in the Gulf of Guinea defined by volcanic spires and rainforests.', nearby_country_clue: 'In the Gulf of Guinea off the coast of Gabon and Cameroon.', flag: '🇸🇹' },

  { id: 183, name: 'Taiwan', difficulty: 'medium', stars: 2, continent: 'Asia', subregion: 'Eastern Asia', capital: 'Taipei', population_hint: 'about 23 million people', size_category: 'small', area_hint: 'around 36,000 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Mandarin Chinese'], currency: 'New Taiwan dollar', landmarks: ['Taroko Gorge', 'Sun Moon Lake', 'Taipei 101'], 
    fun_facts: [
      'Yu Shan (Jade Mountain) is the tallest peak on the island, rising 12,966 feet high',
      'Taroko Gorge is a dramatic 12-mile long canyon cut through solid marble mountains',
      'Sits on a major tectonic plate boundary, creating high mountain peaks and seismic activity'
    ], 
    built_in_clue: 'An East Asian island nation marked by high central mountain ridges and marble gorges.', nearby_country_clue: 'Across the strait from mainland China, north of the Philippines.', flag: '🇹🇼' },

  { id: 184, name: 'Papua New Guinea', difficulty: 'medium', stars: 2, continent: 'Oceania', subregion: 'Melanesia', capital: 'Port Moresby', population_hint: 'about 10 million people', size_category: 'medium', area_hint: 'around 463,000 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: ['Indonesia'], main_languages: ['English', 'Tok Pisin', 'Hiri Motu'], currency: 'Papua New Guinean kina', landmarks: ['Kokoda Track', 'Sepik River carvings', 'Rabaul volcanic harbor'], 
    fun_facts: [
      'Papua New Guinea has over 840 living languages, more than any other country',
      'Mount Wilhelm is the highest mountain peak in the country, reaching 14,793 feet',
      'Papua New Guinea occupies eastern New Guinea and numerous offshore islands'
    ], 
    built_in_clue: 'A Melanesian island nation occupying the eastern half of New Guinea, featuring high mountain spines.', nearby_country_clue: 'Shares the island of New Guinea with Indonesia; north of Australia.', flag: '🇵🇬' },

  { id: 185, name: 'Fiji', difficulty: 'medium', stars: 2, continent: 'Oceania', subregion: 'Melanesia', capital: 'Suva', population_hint: 'about 900,000 people', size_category: 'small', area_hint: 'around 18,300 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['English', 'Fijian', 'Hindi'], currency: 'Fijian dollar', landmarks: ['Yasawa Islands', 'Bouma National Heritage Park', 'Sigatoka Sand Dunes'], 
    fun_facts: [
      'The Great Sea Reef is among the world’s longest continuous barrier-reef systems',
      'Viti Levu Island contains Mount Tomanivi, the tallest peak in the country at 4,344 feet',
      'Fiji comprises more than 330 islands and 500 islets'
    ], 
    built_in_clue: 'A South Pacific island archipelago centered on Viti Levu and extensive barrier coral reefs.', nearby_country_clue: 'East of Vanuatu and west of Tonga in the South Pacific.', flag: '🇫🇯' },

  { id: 186, name: 'Samoa', difficulty: 'hard', stars: 3, continent: 'Oceania', subregion: 'Polynesia', capital: 'Apia', population_hint: 'about 220,000 people', size_category: 'tiny', area_hint: 'around 2,842 square kilometers', hemisphere: 'Southern and Western Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Samoan', 'English'], currency: 'Samoan tala', landmarks: ['To Sua Ocean Trench', 'Papapapaitai Falls', 'Piula Cave Pool'], 
    fun_facts: [
      'To Sua Ocean Trench here is a natural 100-foot deep seawater swimming hole formed by a collapsed lava tube',
      'Made of two main volcanic islands, Upolu and Savai\'i, surrounded by barrier reefs',
      'Mount Silisili on Savai\'i Island is an active volcano rising 6,095 feet high'
    ], 
    built_in_clue: 'A Polynesian volcanic island country made mostly of the mountainous landmasses of Savai\'i and Upolu.', nearby_country_clue: 'West of American Samoa in the central South Pacific.', flag: '🇼🇸' },

  { id: 187, name: 'Tonga', difficulty: 'expert', stars: 4, continent: 'Oceania', subregion: 'Polynesia', capital: 'Nuku\'alofa', population_hint: 'about 106,000 people', size_category: 'tiny', area_hint: 'around 747 square kilometers', hemisphere: 'Southern and Western Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Tongan', 'English'], currency: 'Tongan pa\'anga', landmarks: ['Ha\'amonga \'a Maui trilithon', 'Mapu\'a \'a Vaea blowholes', '\'Eua National Park'], 
    fun_facts: [
      'The 2022 Hunga Tonga–Hunga Haʻapai eruption produced a plume visible from space',
      'Tonga’s 171 islands are spread across 270,000 square miles of the South Pacific',
      'Mapu\'a \'a Vaea blowholes feature hundreds of natural seawater spouts cut into coastal limestone'
    ], 
    built_in_clue: 'A Polynesian archipelago located directly along an active underwater volcanic arc.', nearby_country_clue: 'East of Fiji and south of Samoa in the South Pacific.', flag: '🇹🇴' },

  { id: 188, name: 'Solomon Islands', difficulty: 'hard', stars: 3, continent: 'Oceania', subregion: 'Melanesia', capital: 'Honiara', population_hint: 'about 720,000 people', size_category: 'small', area_hint: 'around 28,900 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['English'], currency: 'Solomon Islands dollar', landmarks: ['Marovo Lagoon', 'Guadalcanal WWII sites', 'Rennell Island coral atoll'], 
    fun_facts: [
      'Marovo Lagoon here is the largest double-barrier saltwater lagoon system in the world',
      'Rennell Island is the world’s largest raised coral atoll, and East Rennell is its protected eastern portion',
      'Mount Popomanaseu on Guadalcanal is the highest mountain peak in the country at 7,660 feet'
    ], 
    built_in_clue: 'A Melanesian island chain defined by volcanic peaks, raised coral atolls, and barrier lagoons.', nearby_country_clue: 'Southeast of Papua New Guinea and northwest of Vanuatu.', flag: '🇸🇧' },

  { id: 189, name: 'Vanuatu', difficulty: 'hard', stars: 3, continent: 'Oceania', subregion: 'Melanesia', capital: 'Port Vila', population_hint: 'about 320,000 people', size_category: 'small', area_hint: 'around 12,200 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Bislama', 'English', 'French'], currency: 'Vanuatu vatu', landmarks: ['Mount Yasur active volcano', 'Blue Holes', 'Pentecost land diving'], 
    fun_facts: [
      'Mount Yasur on Tanna Island is one of the most accessible continuously erupting active volcanoes on Earth',
      'A volcanic Y-shaped island chain made of 83 islands in the South Pacific Ocean',
      'Features natural blue holes, deep freshwater sinkholes formed by underwater limestone rivers'
    ], 
    built_in_clue: 'A Melanesian volcanic island chain featuring active volcanoes and coastal limestone blue holes.', nearby_country_clue: 'Between Solomon Islands and New Caledonia in the South Pacific.', flag: '🇻🇺' },

  { id: 190, name: 'Kiribati', difficulty: 'expert', stars: 4, continent: 'Oceania', subregion: 'Micronesia', capital: 'Tarawa', population_hint: 'about 120,000 people', size_category: 'tiny', area_hint: 'around 811 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Gilbertese', 'English'], currency: 'Australian dollar', landmarks: ['Christmas Island (Kiritimati)', 'Tarawa atoll', 'Phoenix Islands Protected Area'], 
    fun_facts: [
      'The only country on Earth situated in all four global hemispheres: North, South, East, and West',
      'Kiritimati (Christmas Island) has the largest land area of any pure coral atoll in the world',
      'The Phoenix Islands Protected Area here is one of the largest marine conservation reserves'
    ], 
    built_in_clue: 'A Pacific coral atoll country spanning all four geographic hemispheres along the equator.', nearby_country_clue: 'Spread across the central Pacific near the equator and International Date Line.', flag: '🇰🇮' },

  { id: 191, name: 'Micronesia', difficulty: 'expert', stars: 4, continent: 'Oceania', subregion: 'Micronesia', capital: 'Palikir', population_hint: 'about 115,000 people', size_category: 'tiny', area_hint: 'around 702 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['English'], currency: 'US dollar', landmarks: ['Nan Madol stone city ruins', 'Chuuk Lagoon WWII wrecks', 'Yap stone money'], 
    fun_facts: [
      'Nan Madol is an ancient basalt city built across coral-islet canals on Pohnpei',
      'Micronesia comprises 607 islands across four states',
      'Chuuk Lagoon features a massive natural harbor protected by outer coral reefs'
    ], 
    built_in_clue: 'A Western Pacific island country made of volcanic peaks, coral atolls, and basalt canal ruins.', nearby_country_clue: 'North of Papua New Guinea and east of Palau in the western Pacific.', flag: '🇫🇲' },

  { id: 192, name: 'Palau', difficulty: 'expert', stars: 4, continent: 'Oceania', subregion: 'Micronesia', capital: 'Ngerulmud', population_hint: 'about 18,000 people', size_category: 'tiny', area_hint: 'around 459 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Palauan', 'English'], currency: 'US dollar', landmarks: ['Rock Islands jellyfish lake', 'Ngardmau Waterfall', 'Blue Corner dive site'], 
    fun_facts: [
      'The Rock Islands here consist of over 300 mushroom-shaped limestone islets surrounded by lagoons',
      'Jellyfish Lake on Eil Malk contains millions of weak-stinging golden jellyfish',
      'Created the world’s first official shark sanctuary in 2009, protecting sea life in its waters'
    ], 
    built_in_clue: 'A Micronesian island nation defined by limestone Rock Islands and protected marine sanctuaries.', nearby_country_clue: 'West of Micronesia and north of Indonesia in the western Pacific.', flag: '🇵🇼' },

  { id: 193, name: 'Marshall Islands', difficulty: 'expert', stars: 4, continent: 'Oceania', subregion: 'Micronesia', capital: 'Majuro', population_hint: 'about 42,000 people', size_category: 'tiny', area_hint: 'around 181 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Marshallese', 'English'], currency: 'US dollar', landmarks: ['Bikini Atoll', 'Majuro lagoon', 'Arno Atoll'], 
    fun_facts: [
      'Kwajalein Atoll encloses one of the world’s largest ocean lagoons by area',
      'The Marshall Islands comprises 29 coral atolls and five low islands',
      'Bikini Atoll here is a protected UNESCO historical site'
    ], 
    built_in_clue: 'A Micronesian coral atoll country featuring Kwajalein Lagoon and low ocean reefs.', nearby_country_clue: 'East of Micronesia and north of Kiribati in the central Pacific.', flag: '🇲🇭' },

  { id: 194, name: 'Nauru', difficulty: 'expert', stars: 4, continent: 'Oceania', subregion: 'Micronesia', capital: 'Yaren (de facto)', population_hint: 'about 12,000 people', size_category: 'tiny', area_hint: 'around 21 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Nauruan', 'English'], currency: 'Australian dollar', landmarks: ['Phosphate pinnacles', 'Anibare Bay', 'Buada Lagoon'], 
    fun_facts: [
      'The world’s smallest island country, measuring just 8 square miles in size',
      'Consists of a single raised coral limestone island encircled by an outer reef',
      'Phosphate mining left Nauru’s central plateau covered with jagged limestone pinnacles'
    ], 
    built_in_clue: 'The smallest independent island republic on Earth, consisting of a single raised coral island.', nearby_country_clue: 'Isolated in the central Pacific, closest neighbors are Kiribati and Solomon Islands.', flag: '🇳🇷' },

  { id: 195, name: 'Tuvalu', difficulty: 'expert', stars: 4, continent: 'Oceania', subregion: 'Polynesia', capital: 'Funafuti', population_hint: 'about 11,000 people', size_category: 'tiny', area_hint: 'around 26 square kilometers', hemisphere: 'Southern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Tuvaluan', 'English'], currency: 'Australian dollar', landmarks: ['Funafuti Conservation Area', 'Nanumea atoll', 'Te Namo lagoon'], 
    fun_facts: [
      'The fourth-smallest independent country on Earth, with a highest land point of just 15 feet',
      'Comprises three reef islands and six coral atolls in the South Pacific Ocean',
      'Funafuti Atoll features a central lagoon (Te Namo) covering over 100 square miles'
    ], 
    built_in_clue: 'A low-lying South Pacific coral atoll country highly sensitive to ocean tides and sea levels.', nearby_country_clue: 'Between Kiribati and Fiji in the South Pacific.', flag: '🇹🇻' },

  { id: 196, name: 'Cyprus', difficulty: 'hard', stars: 3, continent: 'Europe', subregion: 'Southern Europe', capital: 'Nicosia', population_hint: 'about 1.3 million people', size_category: 'small', area_hint: 'around 9,250 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'island nation', neighbors: [], main_languages: ['Greek', 'Turkish'], currency: 'Euro', landmarks: ['Tombs of the Kings', 'Troodos Mountains', 'Aphrodite\u2019s Rock'], 
    fun_facts: [
      'The third-largest island in the Mediterranean Sea after Sicily and Sardinia',
      'Nicosia is the last divided capital in Europe, split by a United Nations buffer zone',
      'Legend holds the goddess Aphrodite was born from the sea foam off its southwest coast'
    ], 
    built_in_clue: 'An eastern Mediterranean island nation with a divided capital and the Troodos Mountains.', nearby_country_clue: 'South of Turkey and west of Syria and Lebanon in the eastern Mediterranean.', flag: '🇨🇾' },

  { id: 197, name: 'Palestine', difficulty: 'hard', stars: 3, continent: 'Asia', subregion: 'Western Asia', capital: 'Ramallah (de facto)', population_hint: 'about 5.5 million people', size_category: 'small', area_hint: 'around 6,020 square kilometers', hemisphere: 'Northern and Eastern Hemisphere', coastline_type: 'coastal', neighbors: ['Israel', 'Egypt', 'Jordan'], main_languages: ['Arabic'], currency: 'Israeli shekel', landmarks: ['Church of the Nativity', 'Old City of Hebron', 'Dead Sea shore'], 
    fun_facts: [
      'Comprises two separate areas, the West Bank and the Gaza Strip, on either side of Israel',
      'Bethlehem in the West Bank is home to the Church of the Nativity, one of the oldest churches in the world',
      'The West Bank shoreline reaches the Dead Sea, the lowest land elevation on Earth'
    ], 
    built_in_clue: 'A Western Asian territory of two parts, the West Bank and Gaza Strip, along the eastern Mediterranean.', nearby_country_clue: 'Bordered by Israel with Egypt at Gaza and Jordan across the West Bank.', flag: '🇵🇸' }
];

const COUNTRY_INDEX_KEY = Symbol.for('GeoWars.countryIndex');
const generatedCountryIndex = Object.freeze(countryCards
  .map(({ id, name, continent, difficulty }) => Object.freeze({ id, name, continent, difficulty })));
const sharedCountryIndex = typeof globalThis !== 'undefined' && globalThis[COUNTRY_INDEX_KEY];
const countryIndex = Array.isArray(sharedCountryIndex) && sharedCountryIndex.length === generatedCountryIndex.length
  ? sharedCountryIndex
  : generatedCountryIndex;
if (typeof globalThis !== 'undefined') globalThis[COUNTRY_INDEX_KEY] = countryIndex;

function getIndex() {
  return countryIndex;
}

function filterIndex(predicate) {
  if (typeof predicate === 'function') return countryIndex.filter(predicate);
  if (!predicate || typeof predicate !== 'object' || Array.isArray(predicate)) {
    throw new TypeError('filterIndex expects a predicate function or filter object');
  }

  const { continent, difficulty } = predicate;
  return countryIndex.filter(country =>
    (!continent || continent === 'all' || country.continent === continent) &&
    (!difficulty || difficulty === 'all' || country.difficulty === difficulty)
  );
}

function findCountryByName(name) {
  if (typeof name !== 'string') return undefined;
  const normalizedName = name.trim().toLocaleLowerCase('en');
  if (!normalizedName) return undefined;
  return countryIndex.find(country => country.name.toLocaleLowerCase('en') === normalizedName);
}

let modularDataPromise;
function getModularData() {
  if (!modularDataPromise) {
    modularDataPromise = Promise.all([
      import('../src/data/api.js'),
      import('../src/data/loader.js')
    ]).then(([api, loader]) => ({ api, loader })).catch(error => {
      modularDataPromise = undefined;
      throw error;
    });
  }
  return modularDataPromise;
}

function getCountry(id) {
  return getModularData().then(({ api }) => api.getCountry(id));
}

function getContinentCountries(continent) {
  return getModularData().then(({ api }) => api.getContinentCountries(continent));
}

function loadChunk(continent) {
  return getModularData().then(({ loader }) => loader.loadChunk(continent));
}

const countryDataFacade = Object.freeze({
  countryCards,
  countries: countryIndex,
  getIndex,
  filterIndex,
  findCountryByName,
  getCountry,
  getContinentCountries,
  loadChunk
});

// Preserve the classic-script global while exposing the modular data API through
// the same namespace used by the other compatibility facades.
if (typeof globalThis !== 'undefined') {
  if (!Array.isArray(globalThis.countryCards)) globalThis.countryCards = countryCards;
  globalThis.GeoWars = globalThis.GeoWars || {};

  const publishedFacade = globalThis.GeoWars.data?.countryCards === globalThis.countryCards
    ? globalThis.GeoWars.data
    : countryDataFacade;
  globalThis.GeoWars.data = publishedFacade;
  globalThis.GeoWars.Data = publishedFacade;
  globalThis.GeoWarsData = publishedFacade;
}

// Keep the historical CommonJS array export and add non-enumerable API members
// so existing array iteration/serialization remains unchanged.
Object.defineProperties(countryCards, Object.fromEntries(
  Object.entries(countryDataFacade).map(([name, value]) => [name, { value, enumerable: false }])
));

if (typeof module !== 'undefined') {
  module.exports = countryCards;
}
