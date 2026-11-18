// Gera data/world/registry.json: registro completo de entidades a partir do Natural Earth + perfis curados.
import { readFileSync, writeFileSync } from 'node:fs';
const j = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const geo = j('../data/geo/countries.geo.json');
const prof = j('../data/world/profiles.json');

const SOV_MAIN = { FR1: 'FRA', GB1: 'GBR', US1: 'USA', NL1: 'NLD', DN1: 'DNK', FI1: 'FIN', CH1: 'CHN', AU1: 'AUS', NZ1: 'NZL', KA1: 'KAZ', CU1: 'CUB', IS1: 'ISR' };
const SOVEREIGN_COUNTRY_TYPE = ['CHN', 'FRA', 'FIN', 'DNK', 'GBR', 'NLD', 'USA', 'AUS', 'NZL'];
const CONSTITUENT = ['SXM', 'CUW', 'ABW', 'GRL', 'FRO'];
const PARTIAL = { KOS: 'Reconhecido por parte dos membros da ONU', PSX: 'Estado observador na ONU, reconhecido pela maioria dos membros', TWN: 'Governo autônomo de facto com reconhecimento formal limitado', CYN: 'Reconhecido apenas pela Turquia', SOL: 'Independente de facto, sem reconhecimento internacional amplo', SAH: 'Território não autônomo (ONU); RASD reconhecida por parte dos Estados' };
const DISPUTED_AREA = ['KAS', 'SPI', 'BRT', 'PGA', 'BJN', 'SER', 'SCR', 'CNM', 'BRI'];
const LEASE = ['USG', 'KAB'];

const REGION_NAMES = {
  europe: 'Europa', eastern_europe: 'Europa Oriental', balkans: 'Bálcãs', caucasus: 'Cáucaso', central_asia: 'Ásia Central', east_asia: 'Leste Asiático',
  southeast_asia: 'Sudeste Asiático', south_asia: 'Sul da Ásia', middle_east: 'Oriente Médio', north_africa: 'Norte da África', sub_saharan_africa: 'África Subsaariana',
  north_america: 'América do Norte', central_america: 'América Central', caribbean: 'Caribe', south_america: 'América do Sul', oceania: 'Oceania', other: 'Outros / oceanos',
};
const SUB = {
  'Northern Europe': ['europe'], 'Western Europe': ['europe'], 'Southern Europe': ['europe'], 'Eastern Europe': ['eastern_europe'], 'Central Asia': ['central_asia'],
  'Eastern Asia': ['east_asia'], 'South-Eastern Asia': ['southeast_asia'], 'Southern Asia': ['south_asia'], 'Western Asia': ['middle_east'], 'Northern Africa': ['north_africa'],
  'Eastern Africa': ['sub_saharan_africa'], 'Middle Africa': ['sub_saharan_africa'], 'Southern Africa': ['sub_saharan_africa'], 'Western Africa': ['sub_saharan_africa'],
  'Northern America': ['north_america'], 'Central America': ['central_america'], 'Caribbean': ['caribbean'], 'South America': ['south_america'],
  'Australia and New Zealand': ['oceania'], 'Melanesia': ['oceania'], 'Micronesia': ['oceania'], 'Polynesia': ['oceania'], 'Antarctica': ['other'], 'Seven seas (open ocean)': ['other'],
};
const OVERRIDE = {
  SRB: ['balkans', 'europe'], HRV: ['balkans', 'europe'], BIH: ['balkans', 'europe'], SVN: ['balkans', 'europe'], MNE: ['balkans', 'europe'], MKD: ['balkans', 'europe'], KOS: ['balkans', 'europe'],
  ALB: ['balkans', 'europe'], GRC: ['europe', 'balkans'], BGR: ['eastern_europe', 'balkans'], ROU: ['eastern_europe', 'balkans'], MDA: ['eastern_europe'],
  ARM: ['caucasus'], AZE: ['caucasus'], GEO: ['caucasus'], RUS: ['eastern_europe', 'central_asia', 'caucasus'], TUR: ['middle_east', 'europe', 'caucasus'],
  CYP: ['europe', 'middle_east'], CYN: ['europe', 'middle_east'], ESB: ['europe', 'middle_east'], WSB: ['europe', 'middle_east'], CNM: ['europe', 'middle_east'],
  IRN: ['middle_east', 'south_asia'], AFG: ['south_asia', 'central_asia'], EGY: ['north_africa', 'middle_east'], SDN: ['north_africa', 'sub_saharan_africa'],
  MEX: ['north_america', 'central_america'], KAZ: ['central_asia'], KAB: ['central_asia'], MNG: ['east_asia', 'central_asia'],
  ATF: ['other'], IOT: ['other'], SHN: ['other'], SGS: ['south_america', 'other'], FLK: ['south_america'], BVT: ['other'], ATA: ['other'], HMD: ['other'], IOA: ['oceania'], CSI: ['oceania'],
};
const GOV = { pres: 'República presidencialista', parl: 'República parlamentarista', semi: 'República semipresidencialista', cmon: 'Monarquia constitucional', amon: 'Monarquia absoluta', party: 'Estado de partido único', mil: 'Junta militar', theo: 'República teocrática', dir: 'República diretorial', trans: 'Governo de transição' };
const REGIME = { dem: 'Democracia', flawed: 'Democracia imperfeita', hybrid: 'Regime híbrido', auth: 'Autoritário' };
const RES = { o: 'oil', g: 'gas', c: 'coal', m: 'metals', f: 'farmland', t: 'timber', u: 'uranium', d: 'diamonds', r: 'rare_earths', h: 'hydro' };

function expand(arr) {
  const [gov, regime, lib, mkt, rel, align, mil, nuke, res] = arr;
  const [g, fed] = gov.split('-');
  return { gov: g, govName: GOV[g] + (fed ? ' (federal)' : ''), federal: !!fed, regime, regimeName: REGIME[regime], liberty: lib, market: mkt, religiosity: rel, align, milIntensity: mil, nuclear: !!nuke, resources: [...res].map(c => RES[c]).filter(Boolean) };
}

const parentOf = c => {
  if (c.id === 'ISR' || c.id === 'PSX') return null;
  const main = SOV_MAIN[c.sov] || c.sov;
  return main === c.id ? null : main;
};

const entities = {};
for (const c of Object.values(geo.countries)) {
  let cat;
  if (DISPUTED_AREA.includes(c.id)) cat = 'disputed_area';
  else if (LEASE.includes(c.id)) cat = 'lease';
  else if (c.id === 'ATA') cat = 'international';
  else if (PARTIAL[c.id]) cat = 'partially_recognized';
  else if (CONSTITUENT.includes(c.id)) cat = 'constituent';
  else if (c.type === 'Sovereign country' || c.type === 'Sovereignty' || SOVEREIGN_COUNTRY_TYPE.includes(c.id) || c.id === 'ISR') cat = 'sovereign';
  else cat = 'dependency';
  const parent = ['sovereign', 'partially_recognized'].includes(cat) ? null : parentOf(c);
  let profile = null, profileSource = 'default';
  if (prof[c.id]) { profile = expand(prof[c.id]); profileSource = 'curated'; }
  else if (parent && prof[parent]) { profile = { ...expand(prof[parent]), gov: 'dep', govName: 'Território dependente', federal: false, milIntensity: 0, nuclear: false }; profileSource = 'inherited'; }
  entities[c.id] = {
    id: c.id, mapId: c.id, name: c.name, nameEn: c.nameEn, formal: c.formal, iso2: c.iso2, iso3: c.iso3, cat, neType: c.type,
    parent, recognition: PARTIAL[c.id] || null, regions: OVERRIDE[c.id] || SUB[c.subregion] || ['other'], continent: c.continent, subregion: c.subregion,
    pop: c.pop, gdp: c.gdp, income: c.income, economy: c.economy, area: c.area, coast: c.coast, nb: c.nb, sea: c.sea, capital: c.capital, provinces: c.provinces.length,
    wikidata: c.wikidata, profile, profileSource, playable: !['disputed_area', 'international'].includes(cat),
  };
}
const meta = { source: 'Natural Earth 10m Admin 0 (domínio público) + data/world/profiles.json', built: new Date().toISOString().slice(0, 10), total: Object.keys(entities).length };
writeFileSync(new URL('../data/world/registry.json', import.meta.url), JSON.stringify({ meta, regions: REGION_NAMES, entities }));
const cats = {};
for (const e of Object.values(entities)) cats[e.cat] = (cats[e.cat] || 0) + 1;
console.log(meta, cats);
