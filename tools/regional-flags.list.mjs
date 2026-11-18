// Lista de bandeiras regionais, de movimentos e imperiais a importar do Wikimedia Commons.
// Cada linha: { key, name, a3?, n?:[nomes de província do jogo], rg?:[regiões do jogo], ent?:id de entidade, names:[nomes em inglês para buscar], t?:[títulos exatos], q?:busca, pri:1|2|3 }
// pri 1 = sempre mantida; pri 2/3 entram enquanto couberem no orçamento de tamanho (tools/build-regional-flags.mjs).
import { lote2 } from './regional-flags.lote2.mjs';
const rows = [];
const add = (o) => rows.push({ pri: 2, ...o });
const country = (a3, C, list, pri = 2) => { for (const [n, en, extra] of list) add({ key: `${a3.toLowerCase()}_${String(en || n).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`, name: n, a3, n: [n], names: [].concat(en || n), ctx: C, pri, ...(extra || {}) }); };
const regions = (a3, C, list, pri = 2) => { for (const [rg, en, extra] of list) add({ key: `${a3.toLowerCase()}_${String(en || rg).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`, name: rg, a3, rg: [rg], names: [].concat(en || rg), ctx: C, pri, ...(extra || {}) }); };

// ---------- Estados Unidos (51) ----------
country('USA', 'United States', ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'].map(x => [x, x]), 1);
country('USA', 'United States', [['District of Columbia', 'the District of Columbia']], 2);

// ---------- Brasil (27) ----------
const BR = [['Acre', 'do Acre'], ['Alagoas', 'de Alagoas'], ['Amapá', 'do Amapá'], ['Amazonas', 'do Amazonas'], ['Bahia', 'da Bahia'], ['Ceará', 'do Ceará'], ['Distrito Federal', 'do Distrito Federal (Brasil)'], ['Espírito Santo', 'do Espírito Santo'], ['Goiás', 'de Goiás'], ['Maranhão', 'do Maranhão'], ['Mato Grosso', 'de Mato Grosso'], ['Mato Grosso do Sul', 'de Mato Grosso do Sul'], ['Minas Gerais', 'de Minas Gerais'], ['Pará', 'do Pará'], ['Paraíba', 'da Paraíba'], ['Paraná', 'do Paraná'], ['Pernambuco', 'de Pernambuco'], ['Piauí', 'do Piauí'], ['Rio de Janeiro', 'do estado do Rio de Janeiro'], ['Rio Grande do Norte', 'do Rio Grande do Norte'], ['Rio Grande do Sul', 'do Rio Grande do Sul'], ['Rondônia', 'de Rondônia'], ['Roraima', 'de Roraima'], ['Santa Catarina', 'de Santa Catarina'], ['São Paulo', 'do estado de São Paulo'], ['Sergipe', 'de Sergipe'], ['Tocantins', 'do Tocantins']];
for (const [n, p] of BR) add({ key: 'bra_' + n.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_'), name: n, a3: 'BRA', n: [n], names: [n], ctx: 'Brazil', t: [`Bandeira ${p}.svg`, `Bandeira ${p.replace(/^do estado /, 'do ').replace(/^de estado /, 'de ')}.svg`, `Flag of ${n}.svg`], pri: 1 });

// ---------- Finlândia (17 regiões) ----------
country('FIN', 'Finland', [['Lapland', ['Lapland', 'Lappi']], ['Northern Ostrobothnia', ['Northern Ostrobothnia', 'Pohjois-Pohjanmaa']], ['Kainuu', 'Kainuu'], ['North Karelia', ['North Karelia', 'Pohjois-Karjala']], ['South Karelia', ['South Karelia', 'Etelä-Karjala']], ['Kymenlaakso', 'Kymenlaakso'], ['Uusimaa', ['Uusimaa', 'Nyland']], ['Finland Proper', ['Southwest Finland', 'Finland Proper', 'Varsinais-Suomi']], ['Satakunta', 'Satakunta'], ['Ostrobothnia', ['Ostrobothnia', 'Pohjanmaa']], ['Central Ostrobothnia', ['Central Ostrobothnia', 'Keski-Pohjanmaa']], ['Northern Savonia', ['North Savo', 'Northern Savonia', 'Pohjois-Savo']], ['Southern Savonia', ['South Savo', 'Southern Savonia', 'Etelä-Savo']], ['Central Finland', ['Central Finland', 'Keski-Suomi']], ['Southern Ostrobothnia', ['South Ostrobothnia', 'Southern Ostrobothnia', 'Etelä-Pohjanmaa']], ['Pirkanmaa', 'Pirkanmaa'], ['Tavastia Proper', ['Kanta-Häme', 'Tavastia Proper']], ['Päijät-Häme', ['Päijät-Häme', 'Päijänne Tavastia']]], 1);

// ---------- Rússia: sujeitos federais ----------
country('RUS', 'Russia', [
  ['Gorno-Altay', 'Altai Republic'], ['Karelia', ['Karelia', 'Republic of Karelia']], ['Komi', ['Komi Republic', 'Komi']], ['Sakha (Yakutia)', ['Sakha (Yakutia)', 'Sakha Republic', 'Yakutia']], ['Tuva', 'Tuva'], ['Buryat', ['Buryatia', 'Republic of Buryatia']], ['Crimea', ['Crimea', 'Republic of Crimea']], ['Sevastopol', 'Sevastopol'], ['Kaliningrad', 'Kaliningrad Oblast'],
  ['Chuvash', ['Chuvashia', 'Chuvash Republic']], ['Dagestan', 'Dagestan'], ['Ingush', ['Ingushetia', 'Republic of Ingushetia']], ['North Ossetia', ['North Ossetia-Alania', 'North Ossetia']], ['Kabardin-Balkar', 'Kabardino-Balkaria'], ['Karachay-Cherkess', 'Karachay-Cherkessia'], ['Adygey', 'Adygea'], ['Kalmyk', ['Kalmykia', 'Republic of Kalmykia']], ['Mariy-El', 'Mari El'], ['Mordovia', 'Mordovia'], ['Udmurt', ['Udmurtia', 'Udmurt Republic']], ['Khakass', 'Khakassia'], ['Chechnya', ['Chechnya', 'Chechen Republic']], ['Tatarstan', 'Tatarstan'], ['Bashkortostan', 'Bashkortostan'],
  ['City of St. Petersburg', ['Saint Petersburg', 'St. Petersburg']], ['Moskva', 'Moscow'], ['Moskovskaya', 'Moscow Oblast'], ['Leningrad', 'Leningrad Oblast'], ['Murmansk', 'Murmansk Oblast'], ['Arkhangel\'sk', 'Arkhangelsk Oblast'], ['Pskov', 'Pskov Oblast'], ['Novgorod', 'Novgorod Oblast'], ['Smolensk', 'Smolensk Oblast'], ['Bryansk', 'Bryansk Oblast'], ['Kursk', 'Kursk Oblast'], ['Belgorod', 'Belgorod Oblast'], ['Voronezh', 'Voronezh Oblast'], ['Rostov', 'Rostov Oblast'], ['Krasnodar', 'Krasnodar Krai'], ['Stavropol\'', 'Stavropol Krai'], ['Astrakhan\'', 'Astrakhan Oblast'], ['Volgograd', 'Volgograd Oblast'], ['Saratov', 'Saratov Oblast'], ['Samara', 'Samara Oblast'], ['Orenburg', 'Orenburg Oblast'], ['Perm\'', 'Perm Krai'], ['Kirov', 'Kirov Oblast'], ['Nizhegorod', 'Nizhny Novgorod Oblast'], ['Ul\'yanovsk', 'Ulyanovsk Oblast'], ['Penza', 'Penza Oblast'], ['Tambov', 'Tambov Oblast'], ['Lipetsk', 'Lipetsk Oblast'], ['Orel', 'Oryol Oblast'], ['Tula', 'Tula Oblast'], ['Kaluga', 'Kaluga Oblast'], ['Ryazan\'', 'Ryazan Oblast'], ['Vladimir', 'Vladimir Oblast'], ['Ivanovo', 'Ivanovo Oblast'], ['Kostroma', 'Kostroma Oblast'], ['Yaroslavl\'', 'Yaroslavl Oblast'], ['Tver\'', 'Tver Oblast'], ['Vologda', 'Vologda Oblast'],
  ['Sverdlovsk', 'Sverdlovsk Oblast'], ['Chelyabinsk', 'Chelyabinsk Oblast'], ['Kurgan', 'Kurgan Oblast'], ['Tyumen\'', 'Tyumen Oblast'], ['Khanty-Mansiy', ['Khanty-Mansi Autonomous Okrug', 'Khanty-Mansi']], ['Yamal-Nenets', ['Yamalo-Nenets Autonomous Okrug', 'Yamalo-Nenets']], ['Nenets', ['Nenets Autonomous Okrug', 'Nenets']], ['Omsk', 'Omsk Oblast'], ['Novosibirsk', 'Novosibirsk Oblast'], ['Tomsk', 'Tomsk Oblast'], ['Kemerovo', 'Kemerovo Oblast'], ['Altay', 'Altai Krai'], ['Krasnoyarsk', 'Krasnoyarsk Krai'], ['Irkutsk', 'Irkutsk Oblast'], ['Chita', ['Zabaykalsky Krai', 'Zabaykalsky']], ['Amur', 'Amur Oblast'], ['Yevrey', 'Jewish Autonomous Oblast'], ['Khabarovsk', 'Khabarovsk Krai'], ['Primor\'ye', ['Primorsky Krai', 'Primorsky']], ['Sakhalin', 'Sakhalin Oblast'], ['Kamchatka', 'Kamchatka Krai'], ['Maga Buryatdan', 'Magadan Oblast'], ['Chukchi Autonomous Okrug', ['Chukotka Autonomous Okrug', 'Chukotka']],
], 1);

// ---------- Alemanha, Canadá, Austrália, Áustria, Suíça, México, Argentina ----------
country('DEU', 'Germany', [['Sachsen', 'Saxony'], ['Bayern', ['Bavaria (lozengy)', 'Bavaria (striped)', 'Bavaria']], ['Rheinland-Pfalz', 'Rhineland-Palatinate'], ['Saarland', 'Saarland'], ['Schleswig-Holstein', 'Schleswig-Holstein'], ['Niedersachsen', 'Lower Saxony'], ['Nordrhein-Westfalen', 'North Rhine-Westphalia'], ['Baden-Württemberg', 'Baden-Württemberg'], ['Brandenburg', 'Brandenburg'], ['Mecklenburg-Vorpommern', 'Mecklenburg-Vorpommern'], ['Bremen', 'Bremen'], ['Hamburg', 'Hamburg'], ['Hessen', 'Hesse'], ['Thüringen', 'Thuringia'], ['Sachsen-Anhalt', 'Saxony-Anhalt'], ['Berlin', 'Berlin']], 1);
country('CAN', 'Canada', [['British Columbia', 'British Columbia'], ['Alberta', 'Alberta'], ['Saskatchewan', 'Saskatchewan'], ['Manitoba', 'Manitoba'], ['Ontario', 'Ontario'], ['Québec', 'Quebec'], ['New Brunswick', 'New Brunswick'], ['Yukon', 'Yukon'], ['Nunavut', 'Nunavut'], ['Newfoundland and Labrador', 'Newfoundland and Labrador'], ['Nova Scotia', 'Nova Scotia'], ['Northwest Territories', 'the Northwest Territories'], ['Prince Edward Island', 'Prince Edward Island']], 1);
country('AUS', 'Australia', [['Western Australia', 'Western Australia'], ['Northern Territory', 'the Northern Territory'], ['South Australia', 'South Australia'], ['Queensland', 'Queensland'], ['New South Wales', 'New South Wales'], ['Victoria', 'Victoria (Australia)'], ['Tasmania', 'Tasmania'], ['Australian Capital Territory', 'the Australian Capital Territory']], 2);
country('AUT', 'Austria', [['Niederösterreich', 'Lower Austria'], ['Oberösterreich', 'Upper Austria'], ['Burgenland', 'Burgenland'], ['Vorarlberg', 'Vorarlberg'], ['Tirol', 'Tyrol'], ['Salzburg', 'Salzburg (state)'], ['Kärnten', 'Carinthia'], ['Steiermark', 'Styria'], ['Wien', 'Vienna']], 2);
country('CHE', 'Switzerland', ['Valais', 'Ticino', 'Graubünden', 'Schaffhausen', 'Thurgau', 'Zürich', 'Aargau', 'Basel-Stadt', 'Basel-Landschaft', 'Jura', 'Genève', 'Vaud', 'Neuchâtel', 'Bern', 'Zug', 'Uri', 'Schwyz', 'Glarus', 'Nidwalden', 'Fribourg', 'Obwalden'].map(x => [x, x]), 3);
country('MEX', 'Mexico', ['Sonora', 'Chihuahua', 'Coahuila', 'Tamaulipas', 'Nuevo León', 'Quintana Roo', 'Campeche', 'Tabasco', 'Chiapas', 'Colima', 'Nayarit', 'Sinaloa', 'Yucatán', 'Veracruz', 'Jalisco', 'Michoacán', 'Guerrero', 'Oaxaca', 'Puebla', 'Morelos', 'Querétaro', 'Hidalgo', 'Guanajuato', 'Zacatecas', 'Aguascalientes', 'Durango', 'Tlaxcala'].map(x => [x, x]), 3);
country('ARG', 'Argentina', ['Entre Ríos', 'Salta', 'Jujuy', 'Formosa', 'Misiones', 'Chaco', 'Corrientes', 'Catamarca', 'La Rioja', 'San Juan', 'Mendoza', 'Neuquén', 'Chubut', 'Río Negro', 'Santa Cruz', 'Tierra del Fuego', 'Buenos Aires', 'Santa Fe', 'Tucumán', 'Santiago del Estero', 'San Luis', 'La Pampa', 'Córdoba'].map(x => [x, x]), 3);

// ---------- Europa: comunidades e regiões (por rg) ----------
regions('ESP', 'Spain', [['Cataluña', ['Catalonia']], ['País Vasco', ['the Basque Country', 'Basque Country']], ['Foral de Navarra', ['Navarre']], ['Galicia', 'Galicia'], ['Andalucía', 'Andalusia'], ['Aragón', 'Aragon'], ['Asturias', 'Asturias'], ['Cantabria', 'Cantabria'], ['Castilla y León', 'Castile and León'], ['Castilla-La Mancha', 'Castilla–La Mancha'], ['Valenciana', ['the Valencian Community', 'the Land of Valencia (official)']], ['Murcia', 'the Region of Murcia'], ['Extremadura', 'Extremadura'], ['Islas Baleares', 'the Balearic Islands'], ['Canary Is.', 'the Canary Islands'], ['La Rioja', 'La Rioja (Spain)'], ['Madrid', 'the Community of Madrid'], ['Ceuta', 'Ceuta'], ['Melilla', 'Melilla']], 1);
regions('ITA', 'Italy', [['Valle d\'Aosta', 'Aosta Valley'], ['Piemonte', 'Piedmont'], ['Lombardia', 'Lombardy'], ['Trentino-Alto Adige', ['South Tyrol', 'Trentino-Alto Adige']], ['Liguria', 'Liguria'], ['Emilia-Romagna', 'Emilia-Romagna'], ['Marche', 'Marche'], ['Veneto', 'Veneto'], ['Friuli-Venezia Giulia', 'Friuli-Venezia Giulia'], ['Abruzzo', 'Abruzzo'], ['Molise', 'Molise'], ['Apulia', 'Apulia'], ['Basilicata', 'Basilicata'], ['Calabria', 'Calabria'], ['Campania', 'Campania'], ['Lazio', 'Lazio'], ['Toscana', 'Tuscany'], ['Sicily', 'Sicily'], ['Sardegna', ['Sardinia, Italy', 'Sardinia']], ['Umbria', 'Umbria']], 1);
regions('FRA', 'France', [['Bretagne', ['Brittany (Gwenn ha du)', 'Brittany']], ['Corse', 'Corsica'], ['Normandie', 'Normandy'], ['Hauts-de-France', 'Hauts-de-France'], ['Grand Est', 'Grand Est'], ['Occitanie', 'Occitania'], ['Auvergne-Rhône-Alpes', 'Auvergne-Rhône-Alpes'], ['Nouvelle-Aquitaine', 'Nouvelle-Aquitaine'], ['Pays de la Loire', 'Pays de la Loire'], ['Provence-Alpes-Côte-d\'Azur', 'Provence-Alpes-Côte d\'Azur'], ['Bourgogne-Franche-Comté', 'Bourgogne-Franche-Comté'], ['Centre-Val de Loire', 'Centre-Val de Loire'], ['Île-de-France', 'Île-de-France (region)']], 1);
add({ key: 'fra_alsace', name: 'Alsácia', a3: 'FRA', n: ['Bas-Rhin', 'Haute-Rhin'], names: ['Alsace'], ctx: 'France', pri: 1 });
regions('GBR', 'United Kingdom', [['Northern Ireland', ['Northern Ireland', 'the Ulster Banner'], { t: ['Ulster Banner.svg'] }]], 1);
add({ key: 'gbr_scotland', name: 'Escócia', a3: 'GBR', rg: ['Highlands and Islands', 'North Eastern', 'South Western', 'Eastern'], names: ['Scotland'], ctx: 'United Kingdom', pri: 1 });
add({ key: 'gbr_wales', name: 'País de Gales', a3: 'GBR', rg: ['West Wales and the Valleys', 'East Wales'], names: ['Wales'], t: ['Flag of Wales.svg'], ctx: 'United Kingdom', pri: 1 });
add({ key: 'gbr_england', name: 'Inglaterra', a3: 'GBR', rg: ['North West', 'West Midlands', 'South West', 'North East', 'Yorkshire and the Humber', 'East Midlands', 'East', 'South East', 'Greater London'], names: ['England'], t: ['Flag of England.svg'], ctx: 'United Kingdom', pri: 1 });
regions('BEL', 'Belgium', [['Flemish', 'Flanders'], ['Walloon', 'Wallonia'], ['Capital Region', ['the Brussels-Capital Region', 'Brussels']]], 1);

// ---------- Outros movimentos e regiões com bandeira própria ----------
const mv = (key, name, a3, match, names, pri = 1, extra = {}) => add({ key, name, a3, ...match, names: [].concat(names), pri, ...extra });
mv('rus_ichkeria', 'Ichkéria', null, {}, ['the Chechen Republic of Ichkeria', 'Chechen Republic of Ichkeria'], 1, { t: ['Flag of Ichkeria.svg', 'Flag of the Chechen Republic of Ichkeria.svg'] });
mv('cyn_flag', 'Chipre do Norte', 'CYN', { ent: 'CYN', n: ['Northern Cyprus'] }, ['the Turkish Republic of Northern Cyprus', 'Northern Cyprus'], 1, { t: ['Flag of the Turkish Republic of Northern Cyprus.svg', 'Flag of Northern Cyprus.svg'] });
mv('xx_catalonia_estelada', 'Estelada (independentismo catalão)', null, {}, ['Estelada blava', 'Estelada'], 1, { t: ['Estelada blava.svg', 'Flag of Catalonia independence.svg'] });
mv('xx_tibet', 'Tibete (Leão das Neves)', 'CHN', { n: ['Xizang'] }, ['Tibet', 'Tibet (1912–1950)'], 1, { t: ['Flag of Tibet.svg'] });
mv('xx_east_turkestan', 'Turquestão Oriental', 'CHN', { n: ['Xinjiang'] }, ['East Turkestan', 'the Second East Turkestan Republic'], 1, { t: ['Flag of East Turkestan.svg', 'Flag of Second East Turkestan Republic.svg'] });
mv('xx_kurdistan', 'Curdistão', 'IRQ', { n: ['Dihok', 'Arbil', 'As-Sulaymaniyah'] }, ['Kurdistan'], 1, { t: ['Flag of Kurdistan.svg'] });
mv('xx_vojvodina', 'Voivodina', 'SRB', { n: ['Severno-Backi', 'Zapadno-Backi', 'Severno-Banatski', 'Srednje-Banatski', 'Južno-Banatski', 'Južno-Backi', 'Sremski'] }, ['Vojvodina'], 1);
mv('xx_republika_srpska', 'República Sérvia', 'BIH', { n: ['Banja Luka', 'Doboj', 'Bijeljina', 'Vlasenica', 'Sarajevo-romanija', 'Foča', 'Trebinje'] }, ['Republika Srpska'], 1);
mv('xx_abkhazia', 'Abecásia', 'GEO', { n: ['Abkhazia'] }, ['Abkhazia'], 1);
mv('xx_adjara', 'Adjara', 'GEO', { n: ['Ajaria'] }, ['Adjara'], 2);
mv('xx_transnistria', 'Transnístria', 'MDA', { n: ['Stîngă Nistrului', 'Transnistria', 'Grigoriopol', 'Bender', 'Camenca'] }, ['Transnistria'], 1);
mv('xx_gagauzia', 'Gagaúzia', 'MDA', { n: ['Comrat', 'Taraclia'] }, ['Gagauzia'], 1);
mv('xx_szekely', 'Terra Sícula', 'ROU', { n: ['Harghita', 'Covasna'] }, ['the Székely Land', 'Székely Land'], 1, { t: ['Flag of the Székely Land.svg'] });
mv('xx_silesia', 'Silésia', 'POL', { n: ['Silesian', 'Opole'] }, ['Upper Silesia', 'Silesia'], 1);
mv('xx_okinawa', 'Okinawa / Ryukyu', 'JPN', { n: ['Okinawa'] }, ['the Ryukyu Kingdom', 'Okinawa Prefecture'], 1, { t: ['Flag of the Ryukyu Kingdom.svg', 'Flag of Okinawa Prefecture.svg'] });
mv('xx_hawaii_kingdom', 'Reino do Havaí', 'USA', { n: [] }, ['the Hawaiian Kingdom', 'Hawaii'], 2, { t: ['Flag of Hawaii.svg'] });
mv('xx_cascadia', 'Cascádia (Doug)', 'USA', { n: [] }, ['Cascadia (Doug flag)', 'Cascadia'], 1, { t: ['Flag of Cascadia (Doug Flag).svg', 'Flag of Cascadia.svg'] });
mv('xx_biafra', 'Biafra', 'NGA', { n: ['Anambra', 'Enugu', 'Imo', 'Abia', 'Ebonyi', 'Rivers'] }, ['Biafra'], 1);
mv('xx_azawad', 'Azawad', 'MLI', { n: ['Kidal', 'Gao', 'Timbuktu'] }, ['Azawad'], 1);
mv('xx_cabinda', 'Cabinda', 'AGO', { n: ['Cabinda'] }, ['Cabinda', 'the Republic of Cabinda'], 1);
mv('xx_ambazonia', 'Ambazônia', 'CMR', { n: ['Nord-Ouest', 'Sud-Ouest'] }, ['Ambazonia'], 1);
mv('xx_zanzibar', 'Zanzibar', 'TZA', { n: ['Zanzibar South and Central', 'Kaskazini-Unguja', 'Zanzibar West', 'Kusini-Pemba', 'Kaskazini-Pemba'] }, ['Zanzibar'], 1);
mv('xx_oromia', 'Oromia', 'ETH', { n: ['Oromiya'] }, ['Oromia', 'the Oromia Region'], 1);
mv('xx_tigray', 'Tigré', 'ETH', { n: ['Tigray'] }, ['Tigray', 'the Tigray Region'], 1);
mv('xx_somaliland', 'Somalilândia', 'SOM', { ent: 'SOL' }, ['Somaliland'], 2);
mv('xx_puntland', 'Puntlândia', 'SOM', { n: ['Bari', 'Nugaal', 'Mudug'] }, ['Puntland'], 1);
mv('xx_cyrenaica', 'Cirenaica', 'LBY', { n: ['Al Butnan', 'Al Qubbah', 'Al Jabal al Akhdar', 'Al Marj', 'Benghazi', 'Ajdabiya', 'Al Kufrah'] }, ['Cyrenaica'], 1);
mv('xx_south_yemen', 'Iêmen do Sul', 'YEM', { n: ['`Adan', 'Lahij', 'Abyan', 'Al Dali\'', 'Shabwah', 'Hadramawt', 'Al Mahrah'] }, ['South Yemen'], 1);
mv('xx_shan', 'Estado Shan', 'MMR', { n: ['Shan'] }, ['Shan State'], 1);
mv('xx_aceh', 'Aceh', 'IDN', { n: ['Aceh'] }, ['Aceh'], 1);
mv('xx_west_papua', 'Papua Ocidental (Estrela da Manhã)', 'IDN', { n: ['Papua', 'Papua Barat'] }, ['West Papua', 'Morning Star'], 1, { t: ['Morning Star flag.svg', 'Flag of West Papua.svg'] });
mv('xx_bangsamoro', 'Bangsamoro', 'PHL', { rg: ['Autonomous Region in Muslim Mindanao (ARMM)'] }, ['Bangsamoro'], 1);
mv('xx_karnataka', 'Karnataka', 'IND', { n: ['Karnataka'] }, ['Karnataka'], 2);
mv('xx_nagaland', 'Nagalândia', 'IND', { n: ['Nagaland'] }, ['Nagaland'], 2);
mv('xx_siberia', 'Sibéria (regionalismo)', null, {}, ['Siberia'], 2, { t: ['Flag of Siberia.svg', 'Siberian flag.svg'] });
mv('xx_cyprus_greek', 'Chipre', 'CYP', {}, ['Cyprus'], 2);
mv('xx_kosovo', 'Kosovo', 'XKX', { ent: 'KOS' }, ['Kosovo'], 2);
mv('xx_donetsk', 'Donetsk', 'UKR', { n: ['Donets\'k'] }, ['the Donetsk People\'s Republic'], 3);
mv('xx_alaska_native', 'Groenlândia (Kalaallit)', 'GRL', {}, ['Greenland'], 3);

// ---------- Imperiais e dinásticas ----------
const imp = (key, name, names, t, extra = {}) => add({ key, name, imperial: true, names, t, pri: 1, ...extra });
imp('imp_brazil', 'Império do Brasil', ['the Empire of Brazil', 'Empire of Brazil'], ['Flag of Brazil (1822–1853).svg', 'Flag of Brazil (1853-1889).svg', 'Flag of the Kingdom of Brazil (1822).svg']);
imp('imp_brazil_1870', 'Império do Brasil (1870–1889)', ['the Empire of Brazil (1870–1889)'], ['Flag of Brazil (1870–1889).svg']);
imp('imp_mexico_1', '1º Império Mexicano', ['the First Mexican Empire'], ['Bandera del Primer Imperio Mexicano.svg', 'Flag of Mexico (1821-1823).svg', 'First flag of the Mexican Empire.svg']);
imp('imp_mexico_2', '2º Império Mexicano', ['the Second Mexican Empire'], ['Flag of the Second Mexican Empire.svg']);
imp('imp_russia_tri', 'Império Russo (tricolor)', ['Russia (1883–1896)'], ['Flag of Russia (1883-1896).svg', 'Flag of Russia (1914-1917).svg']);
imp('imp_germany', 'Império Alemão', ['the German Empire'], ['Flag of the German Empire.svg']);
imp('imp_austria_hungary', 'Áustria-Hungria', ['Austria-Hungary'], ['Flag of Austria-Hungary (1867-1918).svg', 'Flag of the Habsburg Monarchy.svg']);
imp('imp_qing', 'Dinastia Qing', ['the Qing dynasty'], ['Flag of the Qing Dynasty (1889-1912).svg', 'Flag of the Qing dynasty.svg']);
imp('imp_korea', 'Império Coreano', ['the Korean Empire'], ['Flag of Korea (1882-1910).svg', 'Flag of the Korean Empire.svg']);
imp('imp_japan_navy', 'Japão Imperial (Sol Nascente)', ['the Imperial Japanese Navy'], ['Naval Ensign of Japan.svg', 'Flag of the Imperial Japanese Navy.svg']);
imp('imp_ethiopia', 'Império Etíope', ['the Ethiopian Empire'], ['Flag of Ethiopia (1897-1936; 1941-1974).svg', 'Flag of Ethiopia (1941-1974).svg']);
imp('imp_iran', 'Império do Irã (Pahlavi)', ['Imperial Iran'], ['Flag of Iran (1964-1980).svg', 'Flag of Iran (1925-1964).svg']);
imp('imp_france2', 'Segundo Império Francês', ['the Second French Empire'], ['Imperial Standard of Napoleon III.svg', 'Flag of the French Second Empire.svg']);
imp('imp_hre', 'Sacro Império Romano', ['the Holy Roman Empire'], ['Flag of the Holy Roman Empire (1400-1806).svg', 'Flag of the Holy Roman Empire.svg']);
imp('imp_byzantine', 'Império Bizantino', ['the Byzantine Empire'], ['Flag of the Palaiologos Dynasty.svg', 'Byzantine Empire flag.svg']);
imp('imp_italy_kingdom', 'Reino da Itália', ['the Kingdom of Italy'], ['Flag of Italy (1861-1946) crowned.svg', 'Flag of Italy (1861-1946).svg']);
imp('imp_portugal', 'Reino de Portugal', ['the Kingdom of Portugal'], ['Flag of Portugal (1830).svg', 'Flag of Portugal (1830).svg']);
imp('imp_haiti', 'Império do Haiti', ['the Empire of Haiti', 'the Haitian Empire'], ['Imperial Flag of Haiti (1849-1859).svg', 'Flag of the First Empire of Haiti.svg', 'Flag of Haiti (1849–1859).svg']);
imp('imp_car', 'Império Centro-Africano', ['the Central African Empire'], ['Flag of the Central African Republic.svg'], { pri: 3 });
imp('imp_vietnam', 'Império do Vietnã', ['the Empire of Vietnam', 'Nguyen dynasty'], ['Flag of the Empire of Vietnam (1945).svg', 'Flag of Vietnam (1890-1920).svg']);
imp('imp_mughal', 'Império Mogol', ['the Mughal Empire'], ['Flag of the Mughal Empire.svg'], { pri: 3 });
imp('imp_rome', 'Roma Imperial (Vexillum SPQR)', ['the Roman Empire'], ['Vexillum with SPQR.svg', 'Vexilloid of the Roman Empire.svg']);
imp('imp_hawaii', 'Reino do Havaí (histórico)', ['the Kingdom of Hawaii'], ['Flag of Hawaii.svg'], { pri: 3 });
imp('imp_ottoman', 'Império Otomano', ['the Ottoman Empire'], ['Flag of the Ottoman Empire.svg']);
imp('imp_spain', 'Império Espanhol (Cruz de Borgonha)', ['the Spanish Empire'], ['Flag of Cross of Burgundy.svg']);
imp('imp_britain_red_ensign', 'Império Britânico (Red Ensign)', ['the British Empire'], ['Civil Ensign of the United Kingdom.svg', 'British Red Ensign.svg']);

// Correções de correspondência (nomes ambíguos no Commons).
const FIX = {
  usa_georgia: { t: ['Flag of Georgia (U.S. state).svg'] },
  rus_sakha_yakutia_sakha_republic_yakutia: { t: ['Flag of Sakha.svg', 'Flag of the Sakha Republic.svg'] },
  fin_southwest_finland_finland_proper_varsinais_suomi: { t: ['Flag of Southwest Finland.svg', 'Varsinais-Suomi.lippu.svg', 'Varsinais-Suomen lippu.svg'] },
};
for (const r of rows) if (FIX[r.key]) Object.assign(r, FIX[r.key]);
// Movimentos do jogo (js/sim/newstates.js MOVEMENTS) -> bandeira real. [a3, nome] procura por província (n) ou região (rg); string = chave direta.
// Lote 2: bandeiras adicionais (ver regional-flags.lote2.mjs). Duplicatas por chave são descartadas.
lote2(add, country);
{ const seen = new Set(); const out = rows.filter(r => !seen.has(r.key) && seen.add(r.key)); rows.length = 0; rows.push(...out); }

const MV = {
  catalonia: ['ESP', 'Cataluña'], basque: ['ESP', 'País Vasco'], scotland: 'gbr_scotland', flanders: ['BEL', 'Flemish'], quebec: ['CAN', 'Québec'], corsica: ['FRA', 'Corse'], brittany: ['FRA', 'Bretagne'],
  sardinia: ['ITA', 'Sardegna'], sicily: ['ITA', 'Sicily'], bavaria: ['DEU', 'Bayern'], silesia: 'xx_silesia', szekely: 'xx_szekely', gagauzia: 'xx_gagauzia', transnistria: 'xx_transnistria',
  riograndense: ['BRA', 'Rio Grande do Sul'], texas: ['USA', 'Texas'], california: ['USA', 'California'], cascadia: 'xx_cascadia', hawaii: ['USA', 'Hawaii'], ryukyu: 'xx_okinawa', cyrenaica: 'xx_cyrenaica',
  syemen: 'xx_south_yemen', shan: 'xx_shan', puntland: 'xx_puntland', tibet: 'xx_tibet', eturkestan: 'xx_east_turkestan', kurdistan: 'xx_kurdistan', biafra: 'xx_biafra', azawad: 'xx_azawad', cabinda: 'xx_cabinda',
  ambazonia: 'xx_ambazonia', zanzibar: 'xx_zanzibar', oromia: 'xx_oromia', tigray: 'xx_tigray', aceh: 'xx_aceh', wpapua: 'xx_west_papua', bangsamoro: 'xx_bangsamoro', ichkeria: 'rus_ichkeria', tatarstan: ['RUS', 'Tatarstan'],
  siberia: 'xx_siberia',
};
for (const [id, ref] of Object.entries(MV)) {
  const row = typeof ref === 'string' ? rows.find(r => r.key === ref) : rows.find(r => r.a3 === ref[0] && (r.rg?.includes(ref[1]) || r.n?.includes(ref[1])));
  if (row) row.mv = id;
}
export const LIST = rows;
