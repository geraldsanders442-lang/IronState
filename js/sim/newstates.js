// Estados novos criados durante a campanha (movimentos separatistas, fragmentação, guerras civis):
// nome, bandeira e políticas no estilo da região, com movimentos reais conhecidos e um gerador genérico.
import { clamp, chance, rand, pick, random } from './util.js';
import { PLY, entOf, ownerOf, provincesOf, isAlive, components, relAI, shiftRelAI } from './world.js';
import { transfer } from './war.js';
import { cultureOf } from './names.js';
import { regionalFlagFor } from './regflags.js';
import { nationalVariant } from './flagstyle.js';

const day = s => Math.floor(s.time.min / 1440);
const norm = x => String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Emblema com reserva: se o símbolo do Commons não estiver carregado, usa o desenho local.
const em = (type, alt, color, x, y, sz, more = {}) => ({ type, alt, color, x, y, s: sz, ...more });

// ---------- Movimentos reais conhecidos ----------
// where: { país: [nomes de províncias] } ou { país: { rg: [regiões administrativas] } }.
// Nomes e bandeiras seguem os símbolos usados pelos próprios movimentos; é história alternativa de sandbox.
export const MOVEMENTS = [
  { id: 'kurdistan', name: 'República do Curdistão', short: 'Curdistão', culture: 'fa', ideo: 'Nacionalismo curdo', where: { TUR: ['Hakkari', 'Sirnak', 'Van', 'Mardin', 'Diyarbakir', 'Batman', 'Siirt', 'Bitlis', 'Mus', 'Agri', 'Tunceli', 'Bingöl'], IRQ: ['Dihok', 'Arbil', 'As-Sulaymaniyah'], SYR: ['Hasaka (Al Haksa)'], IRN: ['Kordestan', 'Kermanshah'] },
    flag: { layout: 'h3', colors: ['#ed2024', '#ffffff', '#278e43'], emblems: [em('sun', null, '#febd11', 0.5, 0.5, 0.42)] }, profile: { liberty: 55, market: 45, religiosity: 35, align: 'W', milIntensity: 1.3, regime: 'hybrid' } },
  { id: 'catalonia', name: 'República Catalã', short: 'Catalunha', culture: 'es', ideo: 'Independentismo catalão', where: { ESP: { rg: ['Cataluña'] } },
    flag: { layout: 'chevron', colors: ['#fcdd09', '#da121a', '#0f47af'], emblems: [em('star', null, '#ffffff', 0.15, 0.5, 0.26)] }, profile: { liberty: 82, market: 55, religiosity: 20, align: 'WL', milIntensity: 0.4, regime: 'dem' } },
  { id: 'basque', name: 'República Basca (Euskal Herria)', short: 'País Basco', culture: 'es', ideo: 'Nacionalismo basco', where: { ESP: { rg: ['País Vasco', 'Foral de Navarra'] } },
    flag: { layout: 'saltire', colors: ['#d52b1e', '#009b48', '#009b48'], emblems: [em('cross', null, '#ffffff', 0.5, 0.5, 1, { sx: 1.5 })] }, profile: { liberty: 80, market: 50, religiosity: 30, align: 'WL', milIntensity: 0.4, regime: 'dem' } },
  { id: 'scotland', name: 'Escócia', short: 'Escócia', culture: 'en', ideo: 'Nacionalismo cívico escocês', where: { GBR: { rg: ['Highlands and Islands', 'North Eastern', 'South Western', 'Eastern'] } },
    flag: { layout: 'saltire', colors: ['#005eb8', '#ffffff', '#ffffff'], emblems: [] }, profile: { liberty: 88, market: 52, religiosity: 20, align: 'W', milIntensity: 0.5, regime: 'dem' } },
  { id: 'flanders', name: 'República da Flandres', short: 'Flandres', culture: 'nl', ideo: 'Nacionalismo flamengo', where: { BEL: { rg: ['Flemish'] } },
    flag: { layout: 'solid', colors: ['#fcdd09'], emblems: [em('r_flanders', 'lionr', '#111111', 0.5, 0.5, 0.8)] }, profile: { liberty: 85, market: 62, religiosity: 30, align: 'W', milIntensity: 0.4, regime: 'dem' } },
  { id: 'quebec', name: 'República do Québec', short: 'Québec', culture: 'fr', ideo: 'Soberanismo quebequense', where: { CAN: ['Québec'] },
    flag: { layout: 'cross', colors: ['#003da5', '#ffffff'], emblems: [0.2, 0.8].flatMap(x => [0.2, 0.8].map(y => em('fleur', null, '#ffffff', x, y, 0.28))) }, profile: { liberty: 88, market: 50, religiosity: 20, align: 'W', milIntensity: 0.4, regime: 'dem' } },
  { id: 'tibet', name: 'Tibete', short: 'Tibete', culture: 'zh', ideo: 'Nacionalismo tibetano budista', where: { CHN: ['Xizang'] },
    flag: { layout: 'rays', colors: ['#c8102e', '#0b3d91'], emblems: [em('mountain', null, '#ffffff', 0.5, 0.8, 0.5), em('sun', null, '#f2c400', 0.5, 0.33, 0.3), em('r_snowlion', 'lionr', '#ffffff', 0.5, 0.6, 0.38)] }, profile: { liberty: 45, market: 40, religiosity: 85, align: 'N', milIntensity: 0.6, regime: 'hybrid' } },
  { id: 'eturkestan', name: 'Turquestão Oriental', short: 'Turquestão Oriental', culture: 'ca', ideo: 'Nacionalismo uigur', where: { CHN: ['Xinjiang'] },
    flag: { layout: 'solid', colors: ['#75aadb'], emblems: [em('crescentstar', null, '#ffffff', 0.45, 0.5, 0.6)] }, profile: { liberty: 40, market: 45, religiosity: 70, align: 'N', milIntensity: 0.9, regime: 'hybrid' } },
  { id: 'smongolia', name: 'Mongólia do Sul', short: 'Mongólia do Sul', culture: 'mn', ideo: 'Pan-mongolismo', where: { CHN: ['Inner Mongol'] },
    flag: { layout: 'v3', colors: ['#c4272f', '#015197', '#c4272f'], emblems: [em('r_soyombo', 'flame', '#f9cf02', 0.17, 0.5, 0.55)] }, profile: { liberty: 50, market: 45, religiosity: 40, align: 'N', milIntensity: 0.8, regime: 'hybrid' } },
  { id: 'biafra', name: 'República de Biafra', short: 'Biafra', culture: 'af_w', ideo: 'Nacionalismo igbo', where: { NGA: ['Anambra', 'Enugu', 'Imo', 'Abia', 'Ebonyi', 'Rivers'] },
    flag: { layout: 'h3', colors: ['#e40f13', '#000000', '#088c00'], emblems: [em('sunrise', null, '#f2c400', 0.5, 0.48, 0.4)] }, profile: { liberty: 50, market: 55, religiosity: 70, align: 'N', milIntensity: 1, regime: 'hybrid' } },
  { id: 'azawad', name: 'Estado do Azawad', short: 'Azawad', culture: 'ar', ideo: 'Nacionalismo tuaregue', where: { MLI: ['Kidal', 'Gao', 'Timbuktu'] },
    flag: { layout: 'triangle', colors: ['#0b7a3e', '#c8102e', '#111111', '#f2c400'], emblems: [em('crosscoptic', null, '#111111', 0.12, 0.5, 0.18)] }, profile: { liberty: 30, market: 45, religiosity: 75, align: 'N', milIntensity: 1.4, regime: 'auth' } },
  { id: 'cabinda', name: 'República de Cabinda', short: 'Cabinda', culture: 'af_s', ideo: 'Separatismo cabindês', where: { AGO: ['Cabinda'] },
    flag: { layout: 'h3', colors: ['#002c6a', '#f2c400', '#00843d'], emblems: [em('star', null, '#c8102e', 0.5, 0.5, 0.3)] }, profile: { liberty: 40, market: 50, religiosity: 60, align: 'N', milIntensity: 0.9, regime: 'hybrid' } },
  { id: 'ambazonia', name: 'República Federal da Ambazônia', short: 'Ambazônia', culture: 'af_w', ideo: 'Separatismo anglófono', where: { CMR: ['Nord-Ouest', 'Sud-Ouest'] },
    flag: { layout: 'cantonstripes', colors: ['#ffffff', '#0b3d91', '#0b3d91'], emblems: [em('dove', null, '#ffffff', 0.22, 0.27, 0.3)] }, profile: { liberty: 50, market: 55, religiosity: 70, align: 'W', milIntensity: 1, regime: 'hybrid' } },
  { id: 'zanzibar', name: 'República de Zanzibar', short: 'Zanzibar', culture: 'af_e', ideo: 'Nacionalismo zanzibarita', where: { TZA: ['Zanzibar South and Central', 'Kaskazini-Unguja', 'Zanzibar West', 'Kusini-Pemba', 'Kaskazini-Pemba'] },
    flag: { layout: 'h3', colors: ['#00a3dd', '#111111', '#1eb53a'], emblems: [] }, profile: { liberty: 45, market: 55, religiosity: 80, align: 'N', milIntensity: 0.5, regime: 'hybrid' } },
  { id: 'darfur', name: 'República do Darfur', short: 'Darfur', culture: 'ar', ideo: 'Rebelião darfuri', where: { SDN: { rg: ['Darfur'] } },
    flag: { layout: 'h3', colors: ['#c8102e', '#ffffff', '#111111'], emblems: [em('stars3', null, '#078930', 0.5, 0.5, 0.35)] }, profile: { liberty: 25, market: 40, religiosity: 75, align: 'N', milIntensity: 1.6, regime: 'auth' } },
  { id: 'oromia', name: 'República de Oromia', short: 'Oromia', culture: 'et', ideo: 'Nacionalismo oromo', where: { ETH: ['Oromiya'] },
    flag: { layout: 'h3', colors: ['#c8102e', '#078930', '#c8102e'], emblems: [em('tree', null, '#ffffff', 0.5, 0.5, 0.45)] }, profile: { liberty: 45, market: 45, religiosity: 65, align: 'N', milIntensity: 1.1, regime: 'hybrid' } },
  { id: 'tigray', name: 'Estado de Tigré', short: 'Tigré', culture: 'et', ideo: 'Nacionalismo tigrínia', where: { ETH: ['Tigray'] },
    flag: { layout: 'solid', colors: ['#c8102e'], emblems: [em('circle', null, '#f2c400', 0.5, 0.5, 0.42), em('star', null, '#c8102e', 0.5, 0.5, 0.3)] }, profile: { liberty: 35, market: 40, religiosity: 75, align: 'N', milIntensity: 1.7, regime: 'auth' } },
  { id: 'balochistan', name: 'Baluchistão Livre', short: 'Baluchistão', culture: 'ur', ideo: 'Nacionalismo baloche', where: { PAK: ['Baluchistan'], IRN: ['Sistan and Baluchestan'] },
    flag: { layout: 'triangle', colors: ['#c8102e', '#c8102e', '#078930', '#0b3d91'], emblems: [em('star', null, '#ffffff', 0.11, 0.5, 0.2)] }, profile: { liberty: 35, market: 45, religiosity: 70, align: 'N', milIntensity: 1.3, regime: 'auth' } },
  { id: 'bangsamoro', name: 'Bangsamoro', short: 'Bangsamoro', culture: 'ms', ideo: 'Autonomismo moro islâmico', where: { PHL: { rg: ['Autonomous Region in Muslim Mindanao (ARMM)'] } },
    flag: { layout: 'h3', colors: ['#ffffff', '#078930', '#c8102e'], emblems: [em('crescentstar', null, '#ffffff', 0.5, 0.5, 0.36), em('dagger', null, '#111111', 0.5, 0.82, 0.28, { r: 90 })] }, profile: { liberty: 35, market: 45, religiosity: 85, align: 'N', milIntensity: 1.2, regime: 'hybrid' } },
  { id: 'aceh', name: 'Estado de Aceh', short: 'Aceh', culture: 'ms', ideo: 'Nacionalismo achém', where: { IDN: ['Aceh'] },
    flag: { layout: 'hborder', colors: ['#c8102e', '#111111'], emblems: [em('bar', null, '#ffffff', 0, 0.2, 0.04), em('bar', null, '#ffffff', 0, 0.8, 0.04), em('crescentstar', null, '#ffffff', 0.5, 0.5, 0.42)] }, profile: { liberty: 30, market: 45, religiosity: 90, align: 'N', milIntensity: 1, regime: 'auth' } },
  { id: 'wpapua', name: 'Papua Ocidental', short: 'Papua Ocidental', culture: 'pac', ideo: 'Nacionalismo papua', where: { IDN: ['Papua', 'Papua Barat'] },
    flag: { layout: 'stripes13', colors: ['#ffffff', '#0b3d91'], emblems: [em('square', null, '#c8102e', 0.15, 0.5, 1, { sx: 0.44 }), em('star', null, '#ffffff', 0.15, 0.5, 0.3)] }, profile: { liberty: 50, market: 40, religiosity: 70, align: 'N', milIntensity: 0.8, regime: 'hybrid' } },
  { id: 'ichkeria', name: 'República Chechena de Ichkéria', short: 'Ichkéria', culture: 'cau', ideo: 'Nacionalismo checheno', where: { RUS: ['Chechnya', 'Ingush'] },
    flag: { layout: 'h3', colors: ['#078930', '#ffffff', '#c8102e'], emblems: [em('r_wolf_ichkeria', 'wolf', '#ffffff', 0.25, 0.3, 0.32)] }, profile: { liberty: 30, market: 45, religiosity: 85, align: 'N', milIntensity: 1.8, regime: 'auth' } },
  { id: 'tatarstan', name: 'República do Tartaristão', short: 'Tartaristão', culture: 'tr', ideo: 'Nacionalismo tártaro', where: { RUS: ['Tatarstan', 'Bashkortostan'] },
    flag: { layout: 'h3', colors: ['#00a651', '#ffffff', '#c8102e'], emblems: [] }, profile: { liberty: 50, market: 55, religiosity: 55, align: 'N', milIntensity: 0.9, regime: 'hybrid' } },
  { id: 'siberia', name: 'República Siberiana', short: 'Sibéria', culture: 'ru', ideo: 'Regionalismo siberiano', where: { RUS: { rg: ['Siberian'] } },
    flag: { layout: 'h2', colors: ['#ffffff', '#078930'], emblems: [em('stag', null, '#ffffff', 0.5, 0.72, 0.3)] }, profile: { liberty: 45, market: 55, religiosity: 40, align: 'N', milIntensity: 1, regime: 'hybrid' } },
  { id: 'corsica', name: 'Nação Corsa', short: 'Córsega', culture: 'it', ideo: 'Nacionalismo corso', where: { FRA: { rg: ['Corse'] } },
    flag: { layout: 'solid', colors: ['#ffffff'], emblems: [em('r_moor', 'shield', '#111111', 0.5, 0.5, 0.7)] }, profile: { liberty: 75, market: 50, religiosity: 45, align: 'WL', milIntensity: 0.6, regime: 'dem' } },
  { id: 'brittany', name: 'Bretanha', short: 'Bretanha', culture: 'fr', ideo: 'Regionalismo bretão', where: { FRA: { rg: ['Bretagne'] } },
    flag: { layout: 'cantonstripes', colors: ['#ffffff', '#111111', '#ffffff'], emblems: [] }, profile: { liberty: 85, market: 52, religiosity: 40, align: 'W', milIntensity: 0.4, regime: 'dem' } },
  { id: 'sardinia', name: 'República da Sardenha', short: 'Sardenha', culture: 'it', ideo: 'Sardismo', where: { ITA: { rg: ['Sardegna'] } },
    flag: { layout: 'cross', colors: ['#ffffff', '#c8102e'], emblems: [0.22, 0.78].flatMap(x => [0.22, 0.78].map(y => em('r_moor', 'circle', '#111111', x, y, 0.26))) }, profile: { liberty: 80, market: 48, religiosity: 50, align: 'WL', milIntensity: 0.4, regime: 'dem' } },
  { id: 'sicily', name: 'Reino da Sicília', short: 'Sicília', culture: 'it', ideo: 'Indipendentismo siciliano', where: { ITA: { rg: ['Sicily'] } },
    flag: { layout: 'diag2', colors: ['#f2c400', '#c8102e'], emblems: [em('r_trinacria', 'n_triskele', '#f2c400', 0.5, 0.5, 0.55, { ow: 1, oc: '#7a1d12' })] }, profile: { liberty: 70, market: 50, religiosity: 60, align: 'WL', milIntensity: 0.5, regime: 'flawed' } },
  { id: 'padania', name: 'República Federal da Padânia', short: 'Padânia', culture: 'it', ideo: 'Federalismo setentrional', where: { ITA: { rg: ['Lombardia', 'Veneto', 'Piemonte', 'Liguria', 'Emilia-Romagna', 'Friuli-Venezia Giulia', 'Trentino-Alto Adige', "Valle d'Aosta"] } },
    flag: { layout: 'solid', colors: ['#ffffff'], emblems: [em('sunwheel', null, '#078930', 0.5, 0.5, 0.62)] }, profile: { liberty: 75, market: 68, religiosity: 45, align: 'W', milIntensity: 0.5, regime: 'dem' } },
  { id: 'bavaria', name: 'Estado Livre da Baviera', short: 'Baviera', culture: 'de', ideo: 'Regionalismo bávaro', where: { DEU: ['Bayern'] },
    flag: { layout: 'checker', colors: ['#ffffff', '#0098d4'], emblems: [em('lionr', null, '#f2c400', 0.5, 0.5, 0.55, { ow: 1, oc: '#111111' })] }, profile: { liberty: 85, market: 62, religiosity: 55, align: 'W', milIntensity: 0.5, regime: 'dem' } },
  { id: 'silesia', name: 'Silésia', short: 'Silésia', culture: 'pl', ideo: 'Autonomismo silesiano', where: { POL: ['Silesian', 'Opole'] },
    flag: { layout: 'h2', colors: ['#f2c400', '#0b3d91'], emblems: [em('eagle', null, '#f2c400', 0.5, 0.5, 0.45, { ow: 1, oc: '#111111' })] }, profile: { liberty: 75, market: 60, religiosity: 60, align: 'W', milIntensity: 0.5, regime: 'dem' } },
  { id: 'szekely', name: 'Terra Sícula (Székelyföld)', short: 'Terra Sícula', culture: 'hu', ideo: 'Autonomismo húngaro', where: { ROU: ['Harghita', 'Covasna'] },
    flag: { layout: 'solid', colors: ['#0b3d91'], emblems: [em('bar', null, '#c9a227', 0, 0.5, 0.14), em('sun', null, '#c9a227', 0.18, 0.22, 0.22), em('moon', null, '#c9a227', 0.82, 0.22, 0.2)] }, profile: { liberty: 70, market: 55, religiosity: 55, align: 'W', milIntensity: 0.5, regime: 'flawed' } },
  { id: 'gagauzia', name: 'República da Gagaúzia', short: 'Gagaúzia', culture: 'tr', ideo: 'Autonomismo gagauz', where: { MDA: ['Comrat', 'Taraclia'] },
    flag: { layout: 'h3', colors: ['#0b3d91', '#ffffff', '#c8102e'], emblems: [em('stars3', null, '#f2c400', 0.2, 0.17, 0.25)] }, profile: { liberty: 45, market: 45, religiosity: 60, align: 'E', milIntensity: 0.7, regime: 'hybrid' } },
  { id: 'transnistria', name: 'República Moldava Pridnestroviana', short: 'Transnístria', culture: 'ru', ideo: 'Separatismo pró-russo', where: { MDA: ['Stîngă Nistrului', 'Transnistria', 'Grigoriopol', 'Bender', 'Camenca'] },
    flag: { layout: 'hcenter', colors: ['#c8102e', '#078930', '#c8102e'], emblems: [em('hammersickle', null, '#f2c400', 0.15, 0.13, 0.18)] }, profile: { liberty: 30, market: 35, religiosity: 50, align: 'E', milIntensity: 1.3, regime: 'auth' } },
  { id: 'riograndense', name: 'República Rio-Grandense', short: 'Rio Grande do Sul', culture: 'pt_br', ideo: 'Federalismo gaúcho', where: { BRA: ['Rio Grande do Sul'] },
    flag: { layout: 'bend', colors: ['#078930', '#c8102e'], emblems: [em('triangle', null, '#f2c400', 0.85, 0.85, 0.5, { r: 180 })] }, profile: { liberty: 72, market: 60, religiosity: 50, align: 'WL', milIntensity: 0.7, regime: 'flawed' } },
  { id: 'brasul', name: 'República do Sul', short: 'Sul', culture: 'pt_br', ideo: 'Separatismo sulista', where: { BRA: ['Rio Grande do Sul', 'Santa Catarina', 'Paraná'] },
    flag: { layout: 'h3', colors: ['#078930', '#ffffff', '#c8102e'], emblems: [em('stars3', null, '#f2c400', 0.5, 0.5, 0.35)] }, profile: { liberty: 70, market: 66, religiosity: 55, align: 'WL', milIntensity: 0.7, regime: 'flawed' } },
  { id: 'medialuna', name: 'Nação Camba (Meia-Lua)', short: 'Meia-Lua', culture: 'es', ideo: 'Autonomismo oriental', where: { BOL: ['Santa Cruz', 'El Beni', 'Pando', 'Tarija'] },
    flag: { layout: 'h3', colors: ['#078930', '#ffffff', '#078930'], emblems: [] }, profile: { liberty: 60, market: 70, religiosity: 60, align: 'WL', milIntensity: 0.6, regime: 'flawed' } },
  { id: 'texas', name: 'República do Texas', short: 'Texas', culture: 'en', ideo: 'Nacionalismo texano', where: { USA: ['Texas'] },
    flag: { layout: 'h2', colors: ['#ffffff', '#bf0a30'], emblems: [em('square', null, '#002868', 0.166, 0.5, 1, { sx: 0.5 }), em('star', null, '#ffffff', 0.166, 0.5, 0.36)] }, profile: { liberty: 72, market: 80, religiosity: 65, align: 'W', milIntensity: 1.2, regime: 'dem' } },
  { id: 'california', name: 'República da Califórnia', short: 'Califórnia', culture: 'en', ideo: 'Independentismo californiano', where: { USA: ['California'] },
    flag: { layout: 'solid', colors: ['#ffffff'], emblems: [em('bar', null, '#bf0a30', 0, 0.93, 0.12), em('bear', null, '#7a4b00', 0.5, 0.55, 0.5), em('star', null, '#bf0a30', 0.13, 0.2, 0.2)] }, profile: { liberty: 88, market: 60, religiosity: 25, align: 'W', milIntensity: 0.6, regime: 'dem' } },
  { id: 'cascadia', name: 'Cascádia', short: 'Cascádia', culture: 'en', ideo: 'Biorregionalismo', where: { USA: ['Washington', 'Oregon'] },
    flag: { layout: 'h3', colors: ['#0b3d91', '#ffffff', '#078930'], emblems: [em('tree', null, '#3d2b1f', 0.5, 0.5, 0.6)] }, profile: { liberty: 88, market: 55, religiosity: 20, align: 'W', milIntensity: 0.4, regime: 'dem' } },
  { id: 'hawaii', name: 'Reino do Havaí', short: 'Havaí', culture: 'pac', ideo: 'Soberanismo havaiano', where: { USA: ['Hawaii'] },
    flag: { layout: 'cantonstripes', colors: ['#ffffff', '#c8102e', '#00247d'], emblems: [em('crown', null, '#f2c400', 0.22, 0.27, 0.3)] }, profile: { liberty: 75, market: 55, religiosity: 40, align: 'W', milIntensity: 0.3, regime: 'dem' } },
  { id: 'ryukyu', name: 'República de Ryukyu', short: 'Ryukyu', culture: 'ja', ideo: 'Independentismo okinawano', where: { JPN: ['Okinawa'] },
    flag: { layout: 'solid', colors: ['#ffffff'], emblems: [em('yinyang', null, '#c8102e', 0.5, 0.5, 0.5)] }, profile: { liberty: 80, market: 55, religiosity: 30, align: 'N', milIntensity: 0.2, regime: 'dem' } },
  { id: 'cyrenaica', name: 'Emirado da Cirenaica', short: 'Cirenaica', culture: 'ar', ideo: 'Federalismo cirenaico', where: { LBY: ['Al Butnan', 'Al Qubbah', 'Al Jabal al Akhdar', 'Al Marj', 'Benghazi', 'Ajdabiya', 'Al Kufrah'] },
    flag: { layout: 'solid', colors: ['#111111'], emblems: [em('crescentstar', null, '#ffffff', 0.5, 0.5, 0.5)] }, profile: { liberty: 25, market: 50, religiosity: 85, align: 'N', milIntensity: 1.3, regime: 'auth' } },
  { id: 'syemen', name: 'Iêmen do Sul', short: 'Iêmen do Sul', culture: 'ar', ideo: 'Movimento do Sul', where: { YEM: ['`Adan', 'Lahij', 'Abyan', "Al Dali'", 'Shabwah', 'Hadramawt', 'Al Mahrah'] },
    flag: { layout: 'triangle', colors: ['#c8102e', '#ffffff', '#111111', '#0b6eb8'], emblems: [em('star', null, '#c8102e', 0.12, 0.5, 0.2)] }, profile: { liberty: 30, market: 40, religiosity: 80, align: 'N', milIntensity: 1.4, regime: 'auth' } },
  { id: 'shan', name: 'Estado Shan', short: 'Shan', culture: 'th', ideo: 'Nacionalismo shan', where: { MMR: ['Shan'] },
    flag: { layout: 'h3', colors: ['#f2c400', '#078930', '#c8102e'], emblems: [em('circle', null, '#ffffff', 0.5, 0.5, 0.35)] }, profile: { liberty: 35, market: 40, religiosity: 80, align: 'N', milIntensity: 1.5, regime: 'auth' } },
  { id: 'puntland', name: 'Puntlândia', short: 'Puntlândia', culture: 'so', ideo: 'Federalismo somali', where: { SOM: ['Bari', 'Nugaal', 'Mudug'] },
    flag: { layout: 'h3', colors: ['#0b3d91', '#ffffff', '#078930'], emblems: [em('star', null, '#ffffff', 0.16, 0.17, 0.24)] }, profile: { liberty: 30, market: 50, religiosity: 90, align: 'N', milIntensity: 1.3, regime: 'auth' } },
];

// ---------- Estilos regionais (para Estados sem movimento conhecido) ----------
const STYLES = {
  arab: { cultures: ['ar'], pre: ['Emirado de', 'República Árabe de', 'Sultanato de', 'Estado de'], pal: [['#111111', '#ffffff', '#007a3d', '#ce1126'], ['#ce1126', '#ffffff', '#111111', '#007a3d'], ['#007a3d', '#ffffff', '#111111', '#ce1126']], lay: ['triangle', 'h3', 'v3', 'pall'], ems: ['crescentstar', 'stars3', 'a_egypt|star', 'a_iraq|stars3', 'r_shahada|crescentstar', 'palm', 'swords'] },
  persian: { cultures: ['fa'], pre: ['República de', 'Estado Livre de', 'Xadado de'], pal: [['#239f40', '#ffffff', '#da0000'], ['#da0000', '#ffffff', '#239f40']], lay: ['h3', 'hcenter'], ems: ['a_persia|sun', 'a_iran|sun', 'r_faravahar|sun', 'sun'] },
  turkic: { cultures: ['tr', 'ca'], pre: ['República de', 'Canato de', 'Estado de'], pal: [['#e30a17', '#ffffff', '#e30a17'], ['#00afca', '#f2c400', '#00afca'], ['#0099b5', '#ffffff', '#1eb53a']], lay: ['solid', 'h3', 'v2'], ems: ['crescentstar', 'crescentstar', 'n_tamga|sunwheel', 'sun', 'bowarrow'] },
  caucasus: { cultures: ['cau'], pre: ['República de', 'República Montanhesa de', 'Principado de'], pal: [['#ffffff', '#e8112d', '#e8112d'], ['#078930', '#ffffff', '#c8102e'], ['#0b3d91', '#ffffff', '#c8102e']], lay: ['cross', 'h3', 'v3'], ems: ['r_bolnisi|crosspattee', 'r_circassian|bowarrow', 'n_arevakhach|sunwheel', 'a_armenia|crosspattee', 'a_georgia|crosspattee', 'stars3'] },
  slavic: { cultures: ['ru', 'uk', 'pl', 'cz', 'yu', 'bg'], pre: ['República Popular de', 'República de', 'Federação de', 'Estado Livre de'], pal: [['#ffffff', '#0039a6', '#d52b1e'], ['#d52b1e', '#ffffff', '#0039a6'], ['#0057b7', '#ffd700', '#0057b7'], ['#ffffff', '#d52b1e', '#d52b1e']], lay: ['h3', 'h2', 'triangle'], ems: ['a_serbia|crossortho', 'a_poland|crossortho', 'a_russia|crossortho', 'n_tryzub|trident', 'crossortho', 'a_czech|crossortho', 'a_montenegro|crossortho', 'a_belarus|crossortho'] },
  germanic: { cultures: ['de', 'nl', 'nordic', 'fi', 'bal'], pre: ['República de', 'Estado Livre de', 'Grão-Ducado de', 'Confederação de'], pal: [['#005293', '#fecb00', '#ffffff'], ['#d52b1e', '#ffffff', '#ffffff'], ['#000000', '#dd0000', '#ffce00'], ['#ffffff', '#002f6c', '#002f6c']], lay: ['nordic', 'h3', 'h2', 'v3'], ems: ['a_germany|crown', 'a_austria|crown', 'oak', 'n_vegvisir|sunwheel', 'crown'] },
  latin_eu: { cultures: ['fr', 'it', 'es', 'pt', 'ro', 'el', 'sq', 'hu'], pre: ['República de', 'Estado Livre de', 'Principado de', 'Comunidade de'], pal: [['#0055a4', '#ffffff', '#ef4135'], ['#009246', '#ffffff', '#ce2b37'], ['#c60b1e', '#ffc400', '#c60b1e'], ['#0d5eaf', '#ffffff', '#0d5eaf']], lay: ['v3', 'h3', 'cross', 'hcenter'], ems: ['fleur', 'r_trinacria|n_triskele', 'a_spain|castle', 'a_portugal|castle', 'a_romania|crown', 'castle', 'crown', 'n_vergina|sun', 'laurel'] },
  anglo: { cultures: ['en'], pre: ['República de', 'Commonwealth de', 'Estado Livre de', 'Federação de'], pal: [['#00247d', '#ffffff', '#cf142b'], ['#bf0a30', '#ffffff', '#002868'], ['#078930', '#ffffff', '#f2c400']], lay: ['canton', 'saltire', 'cantonstripes', 'h3'], ems: ['star', 'stars3', 'starring', 'knot', 'tree', 'n_thistle|flower'] },
  south_asia: { cultures: ['hi', 'bn', 'ur'], pre: ['República de', 'Estado de', 'União de'], pal: [['#ff9933', '#ffffff', '#138808'], ['#01411c', '#ffffff', '#01411c'], ['#006a4e', '#f42a41', '#006a4e']], lay: ['h3', 'v2', 'disc'], ems: ['r_ashoka|dharma', 'r_khanda|swords', 'om', 'crescentstar', 'lotus'] },
  east_asia: { cultures: ['zh', 'ja', 'ko', 'mn', 'vi'], pre: ['República Popular de', 'Estado de', 'República de'], pal: [['#de2910', '#ffde00', '#de2910'], ['#ffffff', '#bc002d', '#bc002d'], ['#c4272f', '#015197', '#c4272f'], ['#da251d', '#ffff00', '#da251d']], lay: ['solid', 'v3', 'canton', 'disc'], ems: ['star', 'stars3', 'r_soyombo|flame', 'n_taegeuk|yinyang', 'n_chrysanthemum|flower', 'r_lotus|lotus'] },
  se_asia: { cultures: ['th', 'ms', 'fil'], pre: ['Sultanato de', 'República de', 'Estado de'], pal: [['#c8102e', '#ffffff', '#c8102e'], ['#0038a8', '#ffffff', '#ce1126'], ['#ed1c24', '#ffffff', '#241d4f']], lay: ['h2', 'h3', 'triangle'], ems: ['crescentstar', 'dagger', 'sun', 'lotus', 'star'] },
  africa: { cultures: ['af_e', 'af_w', 'af_s', 'et', 'so'], pre: ['República Federal de', 'República Democrática de', 'República de', 'Estado Livre de'], pal: [['#078930', '#fcdd09', '#da121a'], ['#da121a', '#000000', '#078930'], ['#007a5e', '#ce1126', '#fcd116'], ['#000000', '#ffffff', '#078930']], lay: ['h3', 'v3', 'diag', 'pall'], ems: ['star', 'r_gyenyame|sunwheel', 'a_namibia|shield', 'a_ghana|star', 'shieldswords', 'crosscoptic', 'spears'] },
  latam: { cultures: ['pt_br', 'es'], pre: ['República de', 'Estado Livre de', 'República Federal de'], pal: [['#75aadb', '#ffffff', '#75aadb'], ['#f2c400', '#0b3d91', '#c8102e'], ['#078930', '#ffffff', '#c8102e'], ['#0b3d91', '#ffffff', '#0b3d91']], lay: ['h3', 'v3', 'hcenter', 'canton'], ems: ['sunface', 'a_mexico|sun', 'a_bolivia|sun', 'a_colombia|star', 'star', 'r_chakana|cross', 'sun', 'laurel'] },
  pacific: { cultures: ['pac'], pre: ['República de', 'Reino de', 'Estado de'], pal: [['#00247d', '#ffffff', '#cf142b'], ['#c8102e', '#ffffff', '#0b3d91']], lay: ['canton', 'diag', 'h3'], ems: ['wave', 'star', 'stars3', 'palm'] },
};
const styleOf = c => Object.values(STYLES).find(x => x.cultures.includes(c)) || STYLES.anglo;
const IDEOS = [
  { name: 'Nacionalismo de libertação', d: { liberty: 0, market: -5, religiosity: 0 }, emblem: 'star', regime: 'hybrid' },
  { name: 'Democracia liberal', d: { liberty: 30, market: 15, religiosity: -15 }, regime: 'dem' },
  { name: 'Junta militar', d: { liberty: -30, market: 0, religiosity: 0 }, emblem: 'swords', regime: 'auth', mil: 0.6 },
  { name: 'Socialismo revolucionário', d: { liberty: -15, market: -40, religiosity: -30 }, emblem: 'gear', regime: 'auth' },
  { name: 'Teocracia', d: { liberty: -25, market: -5, religiosity: 40 }, regime: 'auth' },
  { name: 'Federalismo regional', d: { liberty: 15, market: 5, religiosity: 0 }, regime: 'flawed' },
];

function resolve(data, where) {
  const out = [];
  for (const a3 in where) {
    const list = data.geo.byCountry[a3] || [], spec = where[a3];
    if (Array.isArray(spec)) { const want = new Set(spec.map(norm)); for (const p of list) if (want.has(norm(data.geo.prov[p].n))) out.push(p); }
    else if (spec.rg) { const want = new Set(spec.rg.map(norm)); for (const p of list) if (want.has(norm(data.geo.prov[p].rg))) out.push(p); }
  }
  return out;
}
export const movementProvinces = (data, m) => (m._pids ||= resolve(data, m.where));

// Nome de uma região a partir das províncias: região administrativa comum ou a província mais populosa.
function regionName(data, pids) {
  const P = data.geo.prov, rgs = new Set(pids.map(p => P[p].rg).filter(Boolean));
  const rg = [...rgs][0];
  if (rgs.size === 1 && pids.length > 1 && !/(ern|ian)\b|Region|North|South|East|West|Central|Capital|\(/i.test(rg)) return rg;
  return P[pids.reduce((b, p) => (P[p].pop || 0) > (P[b].pop || 0) ? p : b, pids[0])].n;
}
function biggest(data, pids) { const P = data.geo.prov; return pids.reduce((b, p) => (P[p].pop || 0) > (P[b].pop || 0) ? p : b, pids[0]); }

// rnd opcional: com uma função determinística (ex.: hash do id) a mesma região sempre ganha a mesma bandeira.
export function regionalFlag(culture, ideoEmblem, rnd = random) {
  const pk = a => a[Math.floor(rnd() * a.length) % a.length], ch = p => rnd() < p;
  const S = styleOf(culture), pal = pk(S.pal), layout = pk(S.lay);
  const [type, alt] = (ideoEmblem && ch(0.4) ? ideoEmblem : pk(S.ems)).split('|');
  const light = c => parseInt(c.slice(1), 16) > 0xaaaaaa;
  const bg = pal[0], col = light(bg) ? (pal.find(c => !light(c)) || '#111111') : (pal.find(c => light(c)) || '#ffffff');
  const pos = ['triangle', 'pall', 'chevron'].includes(layout) ? [0.12, 0.5, 0.22] : ['canton', 'cantonstripes'].includes(layout) ? [0.2, 0.25, 0.3] : ['nordic'].includes(layout) ? [0.17, 0.2, 0.18] : [0.5, 0.5, 0.42];
  const big = type.startsWith('a_') ? 1.25 : 1;
  return { layout, colors: [...pal], emblems: (layout === 'nordic' && ch(0.6)) || (!ideoEmblem && ch(0.45)) ? [] : [{ type, alt, color: col, x: pos[0], y: pos[1], s: +(pos[2] * big).toFixed(2), ow: 0.6, oc: light(col) ? '#111111' : '#ffffff' }] };
}

function genericProfile(base, culture) {
  const I = pick(IDEOS), p = base?.profile || { liberty: 50, market: 50, religiosity: 40, align: 'N', milIntensity: 0.8 };
  return { ideo: I.name, emblem: I.emblem, profile: { liberty: clamp((p.liberty ?? 50) + I.d.liberty + rand(-10, 10), 5, 95), market: clamp((p.market ?? 50) + I.d.market + rand(-10, 10), 5, 95), religiosity: clamp((p.religiosity ?? 40) + I.d.religiosity + rand(-10, 10), 0, 100), align: chance(0.3) ? pick(['W', 'E', 'N']) : (p.align || 'N'), milIntensity: clamp((p.milIntensity ?? 0.8) + (I.mil || 0) + rand(-0.2, 0.3), 0.2, 2.2), regime: I.regime, resources: p.resources || [] } };
}

// ---------- Criação ----------
// Já existe um país vivo com esse nome ou com a mesma bandeira regional? (evita duas "Sakha", dois "Curdistão"...)
export function stateExists(s, data, name, regKey, movementId) {
  const n = norm(name);
  for (const id in s.world.c) {
    const e = entOf(s, data, id); if (!e) continue;
    if (movementId && e.movement === movementId) return id;
    if (n && (norm(e.name) === n || norm(e.short) === n)) return id;
    if (regKey && (e.flag?.reg === regKey || e.region === regKey)) return id;
  }
  return null;
}
export function foundState(s, data, ctx, { pids, from, movement, why = 'declara independência' }) {
  const W = s.world;
  pids = pids.filter(p => ownerOf(s, data, p) === from);
  if (!pids.length) return null;
  if (from !== PLY && movement && stateExists(s, data, movement.name, regionalFlagFor(data, pids, movement.id), movement.id)) return null;
  W.ents ||= {}; W.newStates ||= [];
  const id = 'NEW' + (W.newStates.length + 1);
  const base = entOf(s, data, from), culture = movement?.culture || base?.culture || (from === PLY ? s.nation.culture : cultureOf(data, base?.origin || base?.secededFrom || from)) || 'en';
  const cap = biggest(data, pids), rgName = regionName(data, pids);
  let name, flag, profile, ideo;
  if (movement) ({ name, flag, profile, ideo } = { name: movement.name, flag: structuredClone(movement.flag), profile: { ...movement.profile, resources: base?.profile?.resources || [] }, ideo: movement.ideo });
  else { const g = genericProfile(base, culture); ideo = g.ideo; profile = g.profile; name = `${pick(styleOf(culture).pre)} ${rgName}`; const o3 = base?.origin || (from === PLY ? s.nation.components?.[0]?.id : from); flag = (chance(0.6) && nationalVariant(o3)) || regionalFlag(culture, g.emblem); }
  // Bandeira real da região (Commons), quando existe; a gerada fica de reserva.
  const rk = regionalFlagFor(data, pids, movement?.id);
  if (rk) flag = { reg: rk, alt: flag };
  // Mesmo nome ou mesma bandeira regional de um país que já existe: não cria uma república repetida.
  if (from !== PLY && stateExists(s, data, name, rk, movement?.id)) return null;
  if (Object.values(W.ents).some(e => e.name === name)) name += ' ' + ['Livre', 'Unida', 'Nova'][W.newStates.length % 3];
  W.ents[id] = { id, name, nameEn: name, short: movement?.short || rgName, iso2: null, cat: 'partially_recognized', parent: null, capital: { name: data.geo.prov[cap].n, prov: cap }, profile, flag, culture, ideo,
    region: rk || null, origin: base?.origin || (from === PLY ? null : from), regions: base?.regions || s.nation.regions, recognition: `Proclamou independência de ${base?.name || s.nation.shortName}`, secededFrom: from, born: day(s), movement: movement?.id };
  const popM = pids.reduce((a, p) => a + (data.geo.prov[p].pop || 0), 0) / 1e6;
  const pc = s.world.c[from];
  W.c[id] = { id, pop: 0, gdp: 0, troops: Math.max(1, popM * 2.5 * profile.milIntensity), equip: pc ? pc.equip * 0.6 : s.st.equipment * 0.6, ready: 45, logi: 25, intel: 20, stab: 38, growth: pc ? pc.growth + 0.5 : 2.5, share: 1, dep: false,
    aggr: 25, nego: 30 + profile.liberty / 3, mobil: true, debt: 30, capitalProv: cap, ax: null, expansionist: profile.milIntensity > 1.4 && chance(0.4) };
  const P = s.partners;
  P[id] = { rel: from === PLY ? -40 : clamp(relAI(s, data, PLY, from) * -0.3 + rand(-10, 20), -60, 60), trust: 25, trade: false, pact: false, sanctionsOn: false, sanctionsBy: false, broken: false, cd: {}, unrecognized: true };
  transfer(s, data, pids, id);
  W.claims.push({ id: 'ind_' + id, claimant: from, holder: id, provs: [...pids], type: 'sovereignty', just: `${base?.name || s.nation.shortName} não reconhece a independência de ${name}.`, strat: 55, dom: 85, risk: 75, status: 'active', src: 'secession' });
  shiftRelAI(s, id, from, -60);
  W.newStates.push({ id, day: day(s), from, name });
  ctx.news?.(`${name} ${why} e se separa de ${base?.name || s.nation.shortName}. Nova bandeira: ${ideo}.`, 'war');
  return id;
}

// ---------- Candidatos à fragmentação ----------
function aiNeighborsOf(s, data, id) {
  const W = s.world; W._aiNb ||= {};
  const key = id + ':' + (W.ver || 0);
  if (W._aiNb[key]) return W._aiNb[key];
  const out = new Set();
  for (const p of provincesOf(s, data, id)) for (const n of data.geo.prov[p].nb) { const o = ownerOf(s, data, n); if (o !== id) out.add(o); }
  return (W._aiNb[key] = [...out]);
}
export { aiNeighborsOf };

function pickSecession(s, data) {
  const W = s.world, done = new Set(Object.values(W.ents || {}).map(e => e.movement).filter(Boolean));
  const opts = [];
  for (const m of MOVEMENTS) {
    if (done.has(m.id)) continue;
    const pids = movementProvinces(data, m);
    if (!pids.length) continue;
    const by = {};
    for (const p of pids) { const o = ownerOf(s, data, p); by[o] = (by[o] || 0) + 1; }
    const [owner, n] = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
    if (owner === PLY || !W.c[owner] || W.c[owner].dep || n < pids.length * 0.5) continue;
    const c = W.c[owner], left = provincesOf(s, data, owner).length;
    if (left - n < 2) continue;
    opts.push({ m, from: owner, pids: pids.filter(p => ownerOf(s, data, p) === owner), w: 1 + (60 - c.stab) / 20 + (W.wars.some(w => w.active && [...w.a, ...w.b].includes(owner)) ? 2 : 0) });
  }
  // Genérico: países instáveis e grandes perdem uma periferia.
  for (const id in W.c) {
    const c = W.c[id], e = entOf(s, data, id);
    if (c.dep || !e || id.startsWith('NEW') || c.stab > 56) continue;
    const mine = provincesOf(s, data, id);
    if (mine.length < 8) continue;
    const capP = c.capitalProv || e.capital?.prov || mine[0];
    const cc = data.geo.prov[capP]?.c || [0, 0];
    const far = [...mine].sort((a, b) => Math.hypot(...data.geo.prov[b].c.map((v, i) => v - cc[i])) - Math.hypot(...data.geo.prov[a].c.map((v, i) => v - cc[i])));
    const seed = far[0], rg = data.geo.prov[seed].rg;
    let group = rg ? mine.filter(p => data.geo.prov[p].rg === rg) : [];
    if (group.length < 1 || group.length > mine.length * 0.45) {
      const sc = data.geo.prov[seed].c;
      group = [...mine].sort((a, b) => Math.hypot(data.geo.prov[a].c[0] - sc[0], data.geo.prov[a].c[1] - sc[1]) - Math.hypot(data.geo.prov[b].c[0] - sc[0], data.geo.prov[b].c[1] - sc[1])).slice(0, Math.max(1, Math.round(mine.length * rand(0.1, 0.25))));
    }
    group = components(data, group)[0];
    if (group.includes(capP)) continue;
    opts.push({ m: null, from: id, pids: group, w: 0.3 + (56 - c.stab) / 25 });
  }
  if (!opts.length) return null;
  let r = random() * opts.reduce((a, o) => a + o.w, 0);
  for (const o of opts) { r -= o.w; if (r <= 0) return o; }
  return opts.at(-1);
}

// ---------- Rodada semanal do mundo caótico ----------
export function initChaos(s, data) {
  const W = s.world;
  if (W.chaosInit) return;
  W.chaosInit = true; W.alliances ||= [];
  const list = Object.values(W.c).filter(c => !c.dep);
  for (const c of list) {
    const p = entOf(s, data, c.id)?.profile || {};
    const claims = W.claims.filter(x => x.claimant === c.id && x.status === 'active').length;
    if ((p.milIntensity ?? 0.6) > 1.3 && (p.liberty ?? 50) < 45 || claims >= 2 || chance(0.04)) { c.expansionist = true; c.aggr = clamp((c.aggr || 0) + 35, 0, 100); }
  }
}

export function weeklyChaos(s, data, ctx) {
  const W = s.world;
  if (!W.chaos) return;
  initChaos(s, data);
  const d = day(s);
  // 1) Fragmentação: movimentos proclamam independência.
  if (d - (W.lastSecession || -999) > 28 && chance(0.09)) {
    const o = pickSecession(s, data);
    if (o) {
      const id = foundState(s, data, ctx, { pids: o.pids, from: o.from, movement: o.m });
      if (id) {
        W.lastSecession = d;
        const parent = W.c[o.from];
        if (parent && aiPowerLite(parent) > aiPowerLite(W.c[id]) * 0.6 && chance(0.6)) startAiWar(s, data, ctx, o.from, id, `${entOf(s, data, o.from)?.name} tenta esmagar a secessão`);
        if (playerNear(s, data, id) || chance(0.35)) ctx.card(recognitionCard(s, data, id, o.from));
      }
    }
  }
  // 2) Expansionismo entre IAs.
  for (const c of Object.values(W.c)) {
    if (!c.expansionist || c.dep || inWar(W, c.id) || (c.posture && c.posture !== 'expansionist' && chance(0.75)) || !chance(0.012) || W.wars.filter(w => w.active && w.ai).length >= 12) continue;
    const targets = aiNeighborsOf(s, data, c.id).filter(t => t !== PLY && W.c[t] && !W.c[t].dep && aiPowerLite(W.c[t]) < aiPowerLite(c) * 0.9 && !allied(W, c.id, t));
    if (!targets.length) continue;
    const t = pick(targets);
    startAiWar(s, data, ctx, c.id, t, `${entOf(s, data, c.id)?.name} invade ${entOf(s, data, t)?.name} em busca de expansão`);
  }
  // 2b) Vizinhos expansionistas fabricam reivindicações contra o jogador (abre caminho para ultimatos e guerra).
  for (const id of aiNeighborsOf(s, data, PLY)) {
    const c = W.c[id], p = s.partners[id];
    if (!c?.expansionist || c.dep || !p || p.pact || inWar(W, id)) continue;
    if (W.claims.some(x => x.claimant === id && x.holder === PLY && x.status === 'active')) { p.rel = clamp(p.rel - 1.2, -90, 100); continue; }
    if (!chance(0.035)) continue;
    if (aiPowerLite(c) < (ctx.playerPower || 1) * 0.6) continue;
    const mine = new Set(provincesOf(s, data, PLY));
    const border = [...mine].filter(pp => data.geo.prov[pp].nb.some(n => ownerOf(s, data, n) === id)).slice(0, 1 + Math.floor(random() * 3));
    if (!border.length) continue;
    W.claims.push({ id: 'chaos_' + id + '_' + d, claimant: id, holder: PLY, provs: border, type: 'expansionist', just: `${entOf(s, data, id)?.name} alega direitos históricos sobre ${border.map(pp => data.geo.prov[pp].n).join(', ')}.`, strat: 60, dom: 70, risk: 80, status: 'active', src: 'chaos' });
    p.rel = clamp(p.rel - 25, -100, 100); c.aggr = clamp((c.aggr || 0) + 20, 0, 100);
    ctx.news?.(`${entOf(s, data, id)?.name} passa a reivindicar ${border.map(pp => data.geo.prov[pp].n).join(', ')} e mobiliza tropas na fronteira.`, 'war');
    break;
  }
  // 3) Alianças regionais.
  if (chance(0.05)) formAlliance(s, data, ctx);
  // 4) Convites ao jogador.
  const offer = W.alliances.find(a => !a.members.includes(PLY) && !a.invited && a.members.some(m => (s.partners[m]?.rel || 0) > 30) && a.members.every(m => (s.partners[m]?.rel ?? 0) > -10));
  if (offer && chance(0.15)) { offer.invited = d; ctx.card(allianceCard(s, data, offer)); }
}

const aiPowerLite = c => Math.sqrt(Math.max(1, c?.troops || 1)) * (0.3 + (c?.equip || 30) / 100) * (0.3 + (c?.ready || 30) / 100);
const inWar = (W, id) => W.wars.some(w => w.active && [...w.a, ...w.b].includes(id));
const allied = (W, a, b) => (W.alliances || []).some(x => x.members.includes(a) && x.members.includes(b));
const playerNear = (s, data, id) => aiNeighborsOf(s, data, id).includes(PLY);

export function startAiWar(s, data, ctx, a, b, note) {
  const W = s.world;
  if (W.wars.some(w => w.active && ((w.a.includes(a) && w.b.includes(b)) || (w.a.includes(b) && w.b.includes(a))))) return null;
  const w = { id: 'ai_' + a + '_' + b + '_' + day(s), ai: true, a: [a], b: [b], since: day(s), front: 0, active: true, note, chaos: true };
  for (const al of W.alliances || []) {
    if (al.members.includes(b)) for (const m of al.members) if (m !== b && m !== PLY && W.c[m] && !w.a.includes(m) && !w.b.includes(m)) w.b.push(m);
    if (al.members.includes(a)) for (const m of al.members) if (m !== a && m !== PLY && W.c[m] && !w.a.includes(m) && !w.b.includes(m)) w.a.push(m);
  }
  W.wars.push(w);
  shiftRelAI(s, a, b, -40);
  ctx.news?.(`Guerra! ${note}.`, 'war');
  ctx.onAiWar?.(w);
  return w;
}

const ALLY_NAMES = { arab: ['Liga do {r}', 'Conselho de Cooperação do {r}'], slavic: ['Pacto de {c}', 'União Eurasiática do {r}'], germanic: ['Liga Hanseática do {r}', 'Pacto de {c}'], latin_eu: ['Entente de {c}', 'Aliança Latina'], anglo: ['Tratado de {c}', 'Commonwealth do {r}'], africa: ['União Africana do {r}', 'Pacto de {c}'], latam: ['Pacto de {c}', 'Aliança Bolivariana do {r}'], east_asia: ['Pacto de {c}', 'Esfera do {r}'], default: ['Pacto de {c}', 'Aliança do {r}', 'Liga de Defesa do {r}'] };
function formAlliance(s, data, ctx) {
  const W = s.world;
  const pool = Object.values(W.c).filter(c => !c.dep && !(W.alliances || []).some(a => a.members.includes(c.id)));
  const lead = pick(pool.filter(c => aiPowerLite(c) > 6));
  if (!lead) return;
  const cand = aiNeighborsOf(s, data, lead.id).filter(id => id !== PLY && W.c[id] && !W.c[id].dep && relAI(s, data, lead.id, id) > 25 && !(W.alliances || []).some(a => a.members.includes(id)));
  if (cand.length < 1) return;
  const members = [lead.id, ...cand.sort((a, b) => relAI(s, data, lead.id, b) - relAI(s, data, lead.id, a)).slice(0, 3)];
  const e = entOf(s, data, lead.id), st = Object.entries(STYLES).find(([, v]) => v.cultures.includes(cultureOf(data, lead.id) || e?.culture))?.[0] || 'default';
  const reg = { europe: 'Ocidente', eastern_europe: 'Leste', middle_east: 'Oriente', north_africa: 'Magrebe', sub_saharan_africa: 'Continente', south_america: 'Sul', central_america: 'Istmo', east_asia: 'Oriente', southeast_asia: 'Sudeste', south_asia: 'Subcontinente', central_asia: 'Estepe', caucasus: 'Cáucaso', balkans: 'Bálcãs' }[e?.regions?.[0]] || 'Norte';
  const used = new Set((W.alliances || []).map(a => a.name));
  let name = pick(ALLY_NAMES[st] || ALLY_NAMES.default).replace('{c}', e?.capital?.name || e?.name || lead.id).replace('{r}', reg);
  if (used.has(name)) name = `Pacto de ${e?.capital?.name || e?.name || lead.id}`;
  for (let i = 2; used.has(name); i++) name = name.replace(/ \d+$/, '') + ' ' + i;
  W.alliances.push({ id: 'al' + (W.alliances.length + 1), name, members, leader: lead.id, since: day(s) });
  for (const a of members) for (const b of members) if (a < b) shiftRelAI(s, a, b, 15);
  ctx.news?.(`Nasce a ${name}: ${members.map(m => entOf(s, data, m)?.name || m).join(', ')} firmam aliança militar.`, 'info');
}

function recognitionCard(s, data, id, from) {
  const e = entOf(s, data, id), pe = entOf(s, data, from);
  return { id: `dyn_recog_${id}_${day(s)}`, dyn: true, cat: 'Mundo caótico', title: `${e.name} pede reconhecimento`, desc: `${e.short || e.name} proclamou independência de ${pe?.name || from} (${e.ideo}). O novo governo pede que ${s.nation.shortName} o reconheça como Estado soberano.`,
    context: `Reconhecer agrada ao novo país e irrita ${pe?.name || from}. Apoiar com armas cria um aliado, mas pode arrastar você para a guerra.`, deadline: 14, default: 2,
    options: [
      { text: `Reconhecer ${e.name}.`, hint: 'Novo parceiro; o país de origem se irrita.', act: { type: 'recognize', id, from } },
      { text: 'Reconhecer e enviar armas.', hint: 'Aliado leal; custo e risco de conflito.', act: { type: 'recognize', id, from, arms: true }, now: { treasury: -0.15 } },
      { text: 'Aguardar e ver como a situação evolui.', hint: 'Neutralidade.' },
      { text: `Condenar a secessão e apoiar ${pe?.name || from}.`, hint: `${pe?.name || from} agradece; o novo país vira inimigo.`, rel: { [from]: 10, [id]: -30 } },
    ] };
}
function allianceCard(s, data, al) {
  const names = al.members.map(m => entOf(s, data, m)?.name || m);
  return { id: `dyn_alliance_${al.id}_${day(s)}`, dyn: true, cat: 'Mundo caótico', title: `A ${al.name} convida ${s.nation.shortName}`, desc: `Os membros da ${al.name} (${names.join(', ')}) convidam você para a aliança militar.`,
    context: 'Membros se defendem mutuamente: você pode ser arrastado para as guerras deles — e eles para as suas.', deadline: 14, default: 1,
    options: [{ text: 'Entrar na aliança.', hint: 'Pactos de defesa com todos os membros.', act: { type: 'joinAlliance', id: al.id } }, { text: 'Recusar.', hint: 'Mantém a liberdade de ação.', rel: Object.fromEntries(al.members.map(m => [m, -3])) }] };
}

export function separatistCard(s, data, id) {
  const e = entOf(s, data, id), c = s.world.c[id];
  return { id: `dyn_sep_${id}_${day(s)}`, dyn: true, crisis: true, cat: 'Crise separatista', title: `${e.short || e.name} proclama independência`, desc: `O governo regional de ${e.short || e.name} declarou a ${e.name} independente de ${s.nation.shortName}, hasteou bandeira própria e assumiu o controle de ${provincesOf(s, data, id).length} província(s). Milícias locais ocupam quartéis e o novo governo pede reconhecimento internacional. Ideologia do movimento: ${e.ideo}.`,
    context: `Forças rebeldes: cerca de ${Math.round(c?.troops || 0)} mil combatentes. O mundo está de olho: força bruta custa reputação; ceder custa legitimidade com os nacionalistas.`, deadline: 7, default: 1,
    options: [
      { text: 'Retomar a região pela força.', hint: 'Guerra de reunificação; risco de longo conflito.', act: { type: 'separatist', id, choice: 'force' } },
      { text: 'Negociar um referendo daqui a um ano.', hint: 'Ganha tempo para investir na região e convencer os eleitores.', act: { type: 'separatist', id, choice: 'referendum' } },
      { text: 'Oferecer autonomia ampla para que voltem já.', hint: 'Pode funcionar se o movimento for moderado; vira federação.', act: { type: 'separatist', id, choice: 'autonomy' } },
      { text: 'Reconhecer a independência.', hint: 'Paz e reputação; os nacionalistas e militares não perdoam.', act: { type: 'separatist', id, choice: 'recognize' } },
    ] };
}
function rejoin(s, data, ctx, id) {
  const pids = provincesOf(s, data, id);
  ctx.transfer(pids, PLY);
  delete s.world.c[id];
  for (const c of s.world.claims) if (c.holder === id || c.claimant === id) c.status = 'resolved';
  return pids.length;
}
export function weeklySeparatist(s, data, ctx) {
  const R = s.world.referendum; if (!R || R.done || day(s) < R.day) return;
  R.done = true;
  const e = entOf(s, data, R.id); if (!s.world.c[R.id]) return;
  const rel = s.partners[R.id]?.rel ?? 0, sup = s.d?.support ?? 50;
  const yesIndep = clamp(55 - (rel + 40) * 0.25 - (sup - 50) * 0.4 + ((e.profile?.liberty ?? 50) < 40 ? 6 : 0) + rand(-8, 8), 15, 85);
  if (yesIndep > 50) { s.partners[R.id].unrecognized = false; s.partners[R.id].rel = clamp(rel + 20, -100, 100); for (const c of s.world.claims) if (c.holder === R.id && c.claimant === PLY) c.status = 'resolved'; s.st.legitimacy = clamp(s.st.legitimacy - 5, 0, 100); ctx.news(`Referendo: ${yesIndep.toFixed(0)}% votam pela independência. ${e.name} se separa de forma definitiva e pacífica.`, 'bad'); }
  else { const n = rejoin(s, data, ctx, R.id); s.st.legitimacy = clamp(s.st.legitimacy + 8, 0, 100); if (s.policies.autonomy === 'centralized') s.policies.autonomy = 'administrative'; ctx.news(`Referendo: ${(100 - yesIndep).toFixed(0)}% votam por continuar em ${s.nation.shortName}. ${n} província(s) voltam ao país.`, 'good'); }
}

export function chaosAct(s, data, act, ctx) {
  const P = s.partners;
  if (act.type === 'separatist') {
    const e = entOf(s, data, act.id), c = s.world.c[act.id];
    if (!c) return '';
    if (act.choice === 'force') { if (P[act.id]) P[act.id].rel = Math.min(P[act.id].rel, -50); const r = ctx.declareWar?.(act.id, 'annex'); s.st.reputation = clamp(s.st.reputation + 12, 0, 100); s.groups.military = clamp(s.groups.military + 6, 0, 100); return r || `As tropas avançam sobre ${e.short || e.name}.`; }
    if (act.choice === 'referendum') { s.world.referendum = { id: act.id, day: day(s) + 364 }; P[act.id].rel = clamp(P[act.id].rel + 25, -100, 100); return `Acordo: referendo sobre a independência de ${e.short || e.name} em um ano. Melhorar a relação e a aprovação do governo ajudam o "não".`; }
    if (act.choice === 'autonomy') {
      if (chance(clamp(0.25 + ((e.profile?.liberty ?? 50) - 50) / 120 + (s.d?.support ?? 50) / 300, 0.1, 0.7))) { const n = rejoin(s, data, ctx, act.id); s.policies.autonomy = 'federal'; s.st.separatism = clamp(s.st.separatism - 10, 0, 100); return `O movimento aceita a autonomia: ${n} província(s) voltam como região autônoma.`; }
      P[act.id].rel = clamp(P[act.id].rel + 8, -100, 100); return `${e.name} recusa a autonomia: "só aceitamos a independência".`;
    }
    if (act.choice === 'recognize') { P[act.id].unrecognized = false; P[act.id].rel = clamp(P[act.id].rel + 50, -100, 100); P[act.id].trade = true; for (const cl of s.world.claims) if (cl.holder === act.id && cl.claimant === PLY) cl.status = 'resolved'; s.st.legitimacy = clamp(s.st.legitimacy - 8, 0, 100); s.groups.military = clamp(s.groups.military - 10, 0, 100); s.st.reputation = clamp(s.st.reputation + 6, 0, 100); return `${s.nation.shortName} reconhece a independência de ${e.name}.`; }
  }
  if (act.type === 'recognize') {
    if (P[act.id]) { P[act.id].rel = clamp(P[act.id].rel + (act.arms ? 45 : 28), -100, 100); P[act.id].unrecognized = false; P[act.id].trade = true; if (act.arms) { P[act.id].pact = true; const c = s.world.c[act.id]; if (c) { c.equip = clamp(c.equip + 12, 0, 95); c.troops *= 1.2; } } }
    if (P[act.from]) P[act.from].rel = clamp(P[act.from].rel - (act.arms ? 30 : 15), -100, 100);
    return `${s.nation.shortName} reconhece ${entOf(s, data, act.id)?.name}.`;
  }
  if (act.type === 'joinAlliance') {
    const al = s.world.alliances?.find(a => a.id === act.id);
    if (!al) return '';
    al.members.push(PLY);
    for (const m of al.members) if (P[m]) { P[m].pact = true; P[m].rel = clamp(P[m].rel + 10, -100, 100); }
    return `${s.nation.shortName} entra na ${al.name}.`;
  }
  return '';
}

// Estados que se separam do próprio jogador (mundo caótico ou cenário separatista).
export function playerMovement(s, data) {
  const mine = new Set(provincesOf(s, data, PLY));
  return MOVEMENTS.map(m => ({ m, pids: movementProvinces(data, m).filter(p => mine.has(p)) })).filter(x => x.pids.length && x.pids.length < mine.size * 0.6).sort((a, b) => b.pids.length - a.pids.length)[0] || null;
}
export const isNewState = (s, id) => !!s.world?.ents?.[id]?.born;
export { isAlive };
