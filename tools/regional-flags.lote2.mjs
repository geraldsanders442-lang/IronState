// Lote 2 de bandeiras regionais (baixadas do Wikimedia Commons pelo fetch-regional-flags.mjs).
const slug = s => s.toLowerCase().normalize('NFD').replace(/[^a-z]+/g, '_').replace(/^_|_$/g, '');
export function lote2(add, country) {
  const T = (a3, ctx, key, name, n, names, t) => add({ key, name, a3, n, names, ctx, ...(t ? { t } : {}) });
  // Alemanha (16 estados)
  country('DEU', 'Germany', [['Bayern', 'Bavaria'], ['Sachsen', 'Saxony'], ['Rheinland-Pfalz', 'Rhineland-Palatinate'], ['Saarland', 'Saarland'], ['Schleswig-Holstein', 'Schleswig-Holstein'], ['Niedersachsen', 'Lower Saxony'], ['Nordrhein-Westfalen', 'North Rhine-Westphalia'], ['Baden-Württemberg', 'Baden-Württemberg'], ['Brandenburg', 'Brandenburg'], ['Mecklenburg-Vorpommern', 'Mecklenburg-Vorpommern'], ['Bremen', 'Bremen'], ['Hamburg', 'Hamburg'], ['Hessen', 'Hesse'], ['Thüringen', 'Thuringia'], ['Sachsen-Anhalt', 'Saxony-Anhalt'], ['Berlin', 'Berlin']]);
  // Canadá
  country('CAN', 'Canada', [['British Columbia', 'British Columbia'], ['Alberta', 'Alberta'], ['Saskatchewan', 'Saskatchewan'], ['Manitoba', 'Manitoba'], ['Ontario', 'Ontario'], ['New Brunswick', 'New Brunswick'], ['Yukon', 'Yukon'], ['Nunavut', 'Nunavut'], ['Newfoundland and Labrador', 'Newfoundland and Labrador'], ['Nova Scotia', 'Nova Scotia'], ['Northwest Territories', 'the Northwest Territories'], ['Prince Edward Island', 'Prince Edward Island']]);
  // Austrália
  country('AUS', 'Australia', [['Western Australia', 'Western Australia'], ['Northern Territory', 'the Northern Territory'], ['South Australia', 'South Australia'], ['Queensland', 'Queensland'], ['New South Wales', 'New South Wales'], ['Victoria', 'Victoria (Australia)'], ['Tasmania', 'Tasmania'], ['Australian Capital Territory', 'the Australian Capital Territory']]);
  // Suíça (cantões principais)
  for (const [n, en] of [['Zürich', 'Zürich'], ['Bern', 'Bern'], ['Genève', 'Geneva'], ['Vaud', 'Vaud'], ['Ticino', 'Ticino'], ['Basel-Stadt', 'Basel-Stadt'], ['Valais', 'Valais'], ['Jura', 'Jura'], ['Graubünden', 'Graubünden'], ['Lucerne', 'Lucerne']]) T('CHE', 'Switzerland', 'che_' + slug(en), n, [n], [en], ['Flag of Canton of ' + en + '.svg', 'Flag of Canton of ' + n + '.svg', 'Flag of ' + en + '.svg']);
  // Áustria (9 estados)
  country('AUT', 'Austria', [['Niederösterreich', 'Lower Austria'], ['Oberösterreich', 'Upper Austria'], ['Burgenland', 'Burgenland'], ['Vorarlberg', 'Vorarlberg'], ['Tirol', 'Tyrol (state)'], ['Salzburg', 'Salzburg (state)'], ['Kärnten', 'Carinthia'], ['Steiermark', 'Styria'], ['Wien', 'Vienna']]);
  // Países Baixos (12 províncias)
  country('NLD', 'Netherlands', [['Groningen', 'Groningen (province)'], ['Drenthe', 'Drenthe'], ['Overijssel', 'Overijssel'], ['Gelderland', 'Gelderland'], ['Limburg', 'Limburg (Netherlands)'], ['Zeeland', 'Zeeland'], ['Noord-Brabant', 'North Brabant'], ['Zuid-Holland', 'South Holland'], ['Noord-Holland', 'North Holland'], ['Friesland', 'Friesland'], ['Flevoland', 'Flevoland'], ['Utrecht', 'Utrecht (province)']]);
  // Argentina (24 províncias)
  for (const [n, en] of [['Entre Ríos', 'Entre Ríos'], ['Salta', 'Salta'], ['Jujuy', 'Jujuy'], ['Formosa', 'Formosa'], ['Misiones', 'Misiones'], ['Chaco', 'Chaco'], ['Corrientes', 'Corrientes'], ['Catamarca', 'Catamarca'], ['La Rioja', 'La Rioja (Argentina)'], ['San Juan', 'San Juan (Argentina)'], ['Mendoza', 'Mendoza'], ['Neuquén', 'Neuquén'], ['Chubut', 'Chubut'], ['Río Negro', 'Río Negro (Argentina)'], ['Santa Cruz', 'Santa Cruz (Argentina)'], ['Tierra del Fuego', 'Tierra del Fuego'], ['Buenos Aires', 'Buenos Aires Province'], ['Ciudad de Buenos Aires', 'Buenos Aires'], ['Santa Fe', 'Santa Fe (Argentina)'], ['Tucumán', 'Tucumán'], ['Santiago del Estero', 'Santiago del Estero'], ['San Luis', 'San Luis (Argentina)'], ['La Pampa', 'La Pampa'], ['Córdoba', 'Córdoba (Argentina)']]) T('ARG', 'Argentina', 'arg_' + slug(en), n, [n], [en], ['Flag of ' + n + ' Province, Argentina.svg', 'Bandera de la Provincia de ' + n + '.svg', 'Flag of ' + en + '.svg', 'Bandera de ' + n + '.svg']);
  // Espanha (comunidades autônomas agrupando províncias)
  T('ESP', 'Spain', 'esp_andalusia', 'Andalucía', ['Huelva', 'Sevilla', 'Cádiz', 'Córdoba', 'Málaga', 'Granada', 'Jaén', 'Almería'], ['Andalusia'], ['Flag of Andalucía.svg', 'Flag of Andalusia.svg']);
  T('ESP', 'Spain', 'esp_valencia', 'Comunidade Valenciana', ['Castellón', 'Valencia', 'Alicante'], ['Valencian Community'], ['Flag of the Land of Valencia (official).svg', 'Flag of the Valencian Community (2x3).svg']);
  T('ESP', 'Spain', 'esp_canarias', 'Canárias', ['Las Palmas', 'Santa Cruz de Tenerife'], ['the Canary Islands'], ['Flag of the Canary Islands.svg']);
  T('ESP', 'Spain', 'esp_baleares', 'Ilhas Baleares', ['Baleares'], ['the Balearic Islands'], ['Flag of the Balearic Islands.svg']);
  T('ESP', 'Spain', 'esp_aragon', 'Aragão', ['Huesca', 'Zaragoza', 'Teruel'], ['Aragon'], ['Flag of Aragon.svg']);
  T('ESP', 'Spain', 'esp_navarra', 'Navarra', ['Navarra'], ['Navarre'], ['Flag of Navarre.svg']);
  T('ESP', 'Spain', 'esp_asturias', 'Astúrias', ['Asturias'], ['Asturias'], ['Flag of Asturias.svg']);
  T('ESP', 'Spain', 'esp_cantabria', 'Cantábria', ['Cantabria'], ['Cantabria'], ['Flag of Cantabria.svg']);
  T('ESP', 'Spain', 'esp_murcia', 'Múrcia', ['Murcia'], ['the Region of Murcia'], ['Flag of the Region of Murcia.svg']);
  T('ESP', 'Spain', 'esp_la_rioja', 'La Rioja', ['La Rioja'], ['La Rioja (Spain)'], ['Flag of La Rioja (with coat of arms).svg']);
  T('ESP', 'Spain', 'esp_madrid', 'Madri', ['Madrid'], ['the Community of Madrid'], ['Flag of the Community of Madrid.svg']);
  // França
  T('FRA', 'France', 'fra_brittany', 'Bretanha', ['Ille-et-Vilaine', 'Morbihan', 'Finistère', "Côtes-d'Armor"], ['Brittany'], ['Flag of Brittany (Gwenn ha du).svg', 'Flag of Brittany.svg']);
  T('FRA', 'France', 'fra_corsica', 'Córsega', ['Haute-Corse', 'Corse-du-Sud'], ['Corsica'], ['Flag of Corsica.svg']);
  T('FRA', 'France', 'fra_alsace', 'Alsácia', ['Bas-Rhin', 'Haute-Rhin'], ['Alsace'], ['Flag of Alsace.svg']);
  T('FRA', 'France', 'fra_savoie', 'Saboia', ['Savoie', 'Haute-Savoie'], ['Savoy'], ['Flag of Savoie.svg', 'Flag of Savoy.svg']);
  T('FRA', 'France', 'fra_normandy', 'Normandia', ['Manche', 'Calvados', 'Eure', 'Orne', 'Seine-Maritime'], ['Normandy'], ['Flag of Normandy.svg']);
  // Itália
  T('ITA', 'Italy', 'ita_aosta', 'Vale de Aosta', ['Aoste'], ['Aosta Valley'], ['Flag of Aosta Valley.svg']);
  T('ITA', 'Italy', 'ita_south_tyrol', 'Tirol do Sul', ['Bozen'], ['South Tyrol'], ['Flag of South Tyrol.svg']);
  T('ITA', 'Italy', 'ita_sardinia', 'Sardenha', ['Sassari', 'Nuoro', 'Cagliari'], ['Sardinia'], ['Flag of Sardinia, Italy.svg', 'Flag of Sardinia.svg']);
  T('ITA', 'Italy', 'ita_sicily', 'Sicília', ['Messina', 'Palermo', 'Caltanissetta', 'Ragusa', 'Siracusa', 'Catania'], ['Sicily'], ['Flag of Sicily.svg']);
  // Polônia (voivodias)
  for (const [n, en] of [['Lesser Poland', 'Lesser Poland'], ['Subcarpathian', 'Subcarpathian'], ['Lower Silesian', 'Lower Silesian'], ['Opole', 'Opole'], ['Podlachian', 'Podlaskie'], ['Warmian-Masurian', 'Warmian-Masurian'], ['Lubusz', 'Lubusz'], ['West Pomeranian', 'West Pomeranian'], ['Lublin', 'Lublin'], ['Pomeranian', 'Pomeranian'], ['Masovian', 'Masovian'], ['Łódź', 'Łódź'], ['Kuyavian-Pomeranian', 'Kuyavian-Pomeranian'], ['Greater Poland', 'Greater Poland'], ['Świętokrzyskie', 'Świętokrzyskie']]) T('POL', 'Poland', 'pol_' + slug(n), n, [n], [en], ['Flag of ' + en + ' Voivodeship.svg', 'Flag of ' + n + ' Voivodeship.svg']);
  // Etiópia
  for (const [n, en] of [['Afar', 'the Afar Region'], ['Amhara', 'the Amhara Region'], ['Somali', 'the Somali Region'], ['Southern Nations, Nationalities and Peoples', 'the Southern Nations, Nationalities, and Peoples Region'], ['Benshangul-Gumaz', 'Benishangul-Gumuz Region'], ['Gambela Peoples', 'the Gambela Region'], ['Harari People', 'the Harari Region'], ['Dire Dawa', 'Dire Dawa'], ['Addis Ababa', 'Addis Ababa']]) T('ETH', 'Ethiopia', 'eth_' + slug(n).slice(0, 20), n, [n], [en]);
  // África do Sul
  country('ZAF', 'South Africa', [['Western Cape', 'the Western Cape'], ['Gauteng', 'Gauteng'], ['KwaZulu-Natal', 'KwaZulu-Natal'], ['Eastern Cape', 'the Eastern Cape'], ['Northern Cape', 'the Northern Cape'], ['Free State', 'the Free State'], ['Limpopo', 'Limpopo'], ['Mpumalanga', 'Mpumalanga'], ['North West', 'North West (South African province)']]);
  // Colômbia (departamentos principais)
  for (const n of ['Antioquia', 'Valle del Cauca', 'Atlántico', 'Santander', 'Bolívar', 'Cundinamarca', 'Boyacá', 'Nariño', 'Cauca', 'Magdalena', 'Meta', 'Tolima', 'Bogota']) { const en = n === 'Bogota' ? 'Bogotá' : n; T('COL', 'Colombia', 'col_' + slug(n), n, [n], [en], ['Flag of ' + n + ' Department.svg', 'Flag of ' + en + '.svg', 'Bandera de ' + n + '.svg']); }
  // Venezuela
  for (const n of ['Zulia', 'Miranda', 'Táchira', 'Mérida', 'Nueva Esparta', 'Carabobo', 'Lara', 'Bolívar', 'Anzoátegui', 'Falcón', 'Aragua', 'Amazonas']) T('VEN', 'Venezuela', 'ven_' + slug(n), n, [n], [n], ['Flag of ' + n + ' State.svg', 'Flag of ' + n + '.svg', 'Bandera del Estado ' + n + '.svg']);
  // Japão
  for (const [n, en] of [['Hokkaidō', 'Hokkaido Prefecture'], ['Okinawa', 'Okinawa Prefecture'], ['Tokyo', 'Tokyo Metropolis'], ['Ōsaka', 'Osaka Prefecture'], ['Kyōto', 'Kyoto Prefecture']]) T('JPN', 'Japan', 'jpn_' + slug(en.split(' ')[0]), n, [n], [en]);
  // Rússia (repúblicas e regiões que faltavam)
  for (const [n, en] of [['Chechnya', 'Chechnya'], ['Sakha (Yakutia)', 'Sakha'], ['Bashkortostan', 'Bashkortostan'], ['City of St. Petersburg', 'Saint Petersburg'], ['Moskva', 'Moscow'], ['Chukchi Autonomous Okrug', 'Chukotka Autonomous Okrug'], ['Khanty-Mansiy', 'Khanty-Mansi Autonomous Okrug'], ['Yamal-Nenets', 'Yamalo-Nenets Autonomous Okrug'], ['Krasnodar', 'Krasnodar Krai'], ['Novosibirsk', 'Novosibirsk Oblast'], ['Sverdlovsk', 'Sverdlovsk Oblast'], ['Rostov', 'Rostov Oblast']]) T('RUS', 'Russia', 'rus_' + slug(en.split(' ')[0]), n, [n], [en]);
}
