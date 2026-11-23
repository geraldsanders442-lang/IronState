// Tipos de Estado (autoritário, distopia, utopia, paraíso fiscal, falido, rico...) e valores extras para condições das questões.
import { gdppc } from './model.js';
import { liberty } from './rights.js';

// Estado social do país (ordem, fuga, alienação, propaganda): criado sob demanda em order.js; aqui só leitura segura.
const O = s => s.ord || {};
const P = s => s.prop || {};

const CACHE = new WeakMap();
export function stateKinds(s) {
  const c = CACHE.get(s);
  const dayN = Math.floor(s.time.min / 1440);
  if (c && c.d === dayN) return c.set;
  const st = s.st, lib = liberty(s), pc = gdppc(s), ord = O(s), set = new Set();
  const control = st.control, alien = ord.alien || 0;
  if (lib < 32 || (st.control > 68 && st.political < 38)) set.add('authoritarian');
  if (lib < 30 && st.control > 72 && (st.qol < 40 || alien > 55) && (s.d?.repression || 0) > 40) set.add('dystopia');
  if (st.qol > 78 && st.stability > 66 && st.poverty < 18 && lib > 62 && st.corruption < 30) set.add('utopia');
  if (s.budget?.tax != null && s.budget.tax < 18 && st.market > 65 && (st.corruption > 35 || (s.econ?.pop || 99) < 15)) set.add('taxhaven');
  if ((st.stability < 28 && st.legitimacy < 30) || (st.control < 25 && st.coupRisk > 55) || (st.hunger > 45 && st.stability < 40)) set.add('failed');
  if (pc > 32000 && st.qol > 60) set.add('rich');
  if (pc < 3500 && st.poverty > 45) set.add('poor');
  if (st.crime > 65 && st.control < 45) set.add('lawless');
  if (st.corruption > 65) set.add('kleptocracy');
  if (lib > 70 && st.civil > 70) set.add('free');
  CACHE.set(s, { d: dayN, set });
  return set;
}

export function extraValue(s, k) {
  const o = O(s), p = P(s);
  switch (k) {
    case 'alien': return o.alien ?? 20;
    case 'patriot': return o.patriot ?? 40;
    case 'policeAuto': return o.police ?? 30;
    case 'crimeViolent': return o.crime?.violent ?? 0;
    case 'crimeTheft': return o.crime?.theft ?? 0;
    case 'crimeGang': return o.crime?.gang ?? 0;
    case 'crimeCorrupt': return o.crime?.corrupt ?? 0;
    case 'crimeState': return o.crime?.state ?? 0;
    case 'fleeing': return o.fleeRate ?? 0;
    case 'fledTotal': return (o.fled?.total || 0) / 1000;
    case 'fledDead': return o.fled?.dead || 0;
    case 'armed': return (s.armed || []).filter(g => g.active).length;
    case 'armedPower': return Math.max(0, ...(s.armed || []).filter(g => g.active).map(g => g.power));
    case 'warCrimes': return s.rights?.warCrimes || 0;
    case 'propSpend': return p.spendPct ?? 0;
    case 'brokenPromises': return (p.promises || []).filter(x => x.status === 'broken').length;
    case 'openPromises': return (p.promises || []).filter(x => x.status === 'open').length;
    case 'baseAliada': return o.base ?? 20;
    case 'devQ': return s.dev?.q ?? 50;
    case 'peacekeepers': return s.peace?.troops || 0;
    // Saúde e saneamento
    case 'sanitation': return s.hlt?.san ?? 70;
    case 'water': return s.hlt?.water ?? 85;
    case 'hygiene': return s.hlt?.hyg ?? 60;
    case 'openDef': return s.hlt?.od ?? 5;
    case 'lifeExp': return s.hlt?.le ?? 72;
    case 'hdi': return (s.hlt?.hdi ?? 0.7) * 100;
    case 'u5m': return s.hlt?.u5m ?? 20;
    case 'outbreak': return s.hlt?.outbreak ? 1 : 0;
    // Impostos e tarifas
    case 'taxMeasures': return Object.values(s.tx?.m || {}).filter(Boolean).length;
    case 'tariffs': return (s.tx?.tar || []).filter(t => t.level).length;
    case 'taxRevenue': return (s.tx?.rev || 0) / Math.max(0.01, s.econ.gdp) * 100;
    case 'taxLobby': return Math.max(0, ...Object.values(s.tx?.lobby || {}), ...(s.tx?.tar || []).map(t => t.lobby || 0));
    case 'retaliation': return Object.keys(s.tx?.retal || {}).length;
    // Povos e minorias
    case 'minPers': return Math.max(0, ...(s.min?.groups || []).filter(g => g.id !== s.min.favored).map(g => g.pers));
    case 'minTension': return Math.max(0, ...(s.min?.groups || []).filter(g => g.id !== s.min.favored).map(g => g.tension));
    case 'minKilled': return (s.min?.killed || 0) / 1000;
    case 'minExpelled': return ((s.min?.expelled || 0) + (s.min?.fled || 0)) / 1000;
    case 'minOutrage': return s.min?.outrage ?? 0;
    // Gabinete
    case 'minAmb': return Math.max(0, ...Object.values(s.pol?.cabinet || {}).map(m => m.amb ?? 20));
    case 'delegated': return Object.values(s.pol?.mandates || {}).filter(v => v && v !== 'off').length + (s.chief?.on ? 2 : 0);
    case 'cabinetPlot': return s.pol?.plot ? 1 : 0;
    case 'ministerLoyalty': { const v = Object.values(s.pol?.cabinet || {}).map(m => m.loyalty); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 60; }
  }
  return undefined;
}

// Condição c.state: 'authoritarian' | ['dystopia','utopia'] (qualquer) ; c.notState: nenhuma
export function stateOk(s, c) {
  if (!c.state && !c.notState) return true;
  const K = stateKinds(s);
  if (c.state && ![].concat(c.state).some(x => K.has(x))) return false;
  if (c.notState && [].concat(c.notState).some(x => K.has(x))) return false;
  return true;
}
