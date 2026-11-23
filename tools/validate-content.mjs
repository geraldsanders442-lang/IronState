// Valida questões, desdobramentos e eventos: chaves de efeito, leis, grupos, países, cadeias e IDs.
import { readFileSync, readdirSync } from 'node:fs';
const j = f => JSON.parse(readFileSync(new URL('../data/' + f + '.json', import.meta.url), 'utf8'));
const manifest = j('content');
const issues = manifest.issues.flatMap(f => j(f)), events = manifest.events.flatMap(f => j(f));
const policies = j('policies'), reg = j('world/registry').entities;

const ST = 'health education inequality poverty hunger qol civil political protest legitimacy stability corruption efficiency taxCapacity control opposition coupRisk revoRisk productivity industry tech readiness equipment logistics intel defense projection milIndustry reputation influence growth inflation unemployment market troops warWeariness pollution migration popGrowth crime housing congestion separatism'.split(' ');
const NOW_SPECIAL = ['treasury', 'debt', 'gdp', 'reserves', 'pop', 'support'];
const GROUPS = ['workers', 'business', 'military', 'bureaucracy', 'youth', 'rural', 'regional', 'opposition'];
const MOD_EXTRA = ['abuse', 's_food', 's_energy', 's_raw', 's_industrial', 's_tech', 's_services', 'exportAccess', 'importAccess', 'laborSupply', 'emigration', 'revenue', 'repression', 'propaganda', 'creditLimit', 'infra', 'birth', 'troopsMult', 'sanctionShield', 'aid', 'aidAccess', ...GROUPS.map(g => 'g_' + g), ...GROUPS.map(g => 'gi_' + g)];
const REL_KEYS = ['all', 'west', 'east', 'sul', 'neighbors', 'rival', 'usa', 'china', 'uk', 'germany', 'russia', 'japan', 'india', 'brazil'];
const COND_KEYS = ['imm', 'abuse', 'prisoners', 'liberty', 'bans', 'ethnic', 'minorities', 'emigrated', ...ST, ...GROUPS.map(g => 'g_' + g), 'support', 'satisfaction', 'debtRatio', 'gdppc', 'treasuryRatio', 'foodShort', 'energyShort', 'sanctions', 'day', 'repression', 'nukeProg', 'tension', 'programs', 'covertOps', 'aiWars', 'newStates', 'chaos', 'alliances', 'alien', 'patriot', 'policeAuto', 'crimeViolent', 'crimeTheft', 'crimeGang', 'crimeCorrupt', 'crimeState', 'fleeing', 'fledTotal', 'fledDead', 'armed', 'armedPower', 'warCrimes', 'propSpend', 'brokenPromises', 'openPromises', 'baseAliada', 'devQ', 'peacekeepers', ...['health', 'education', 'welfare', 'security', 'military', 'admin', 'infra'].map(k => 'under_' + k), ...'econ redist trad relig auth nation mil global expand eco central tech align'.split(' ').map(k => 'ax_' + k)];
const ROLES = { nb: 1, nb2: 1, power: 1, bloc: 1, blocMember: 1, outsideBloc: 1, claimant: 1, target: 1, enemy: 1, ally: 1, sanctioner: 1, aiWar: 1, region: 1, covert: 1, newstate: 1 };
const ACTS = 'armed peaceKeep extra rights trade lend grant arms summit cede negotiateClaim rejectUltimatum joinAllyWar refuseAllyWar peace siege insurgency nuke nukeProgram covert incite partner sanction relAI aiWarSupport program regime declareWar covertBoost nukeBoost cancelProgram nukeRetaliate faction minister leader campaign coalition selfcoup uprising endgame oligarch general unvote ascent expel leaveOrg joinOrg blocMod recognize joinAlliance separatist delegate fund minAdvice pork regionBuild'.split(' ');
const PLACE = 'newstate nb nb2 power bloc outsideBloc aiA aiB region claimant claimProv target targetProv enemy ally sanctioner blocMember covert person person2 nbPerson nation capital leader hitCity hitRegion attacker dead oldCapital'.split(' ');
const all = [...issues, ...events];
const ids = new Map();
const errs = [], warn = [];
for (const x of all) { if (ids.has(x.id)) errs.push(`ID duplicado: ${x.id}`); ids.set(x.id, x); }
const optionsOf = x => x.options || [x];
function checkEff(where, o) {
  for (const k in o.now || {}) if (!ST.includes(k) && !NOW_SPECIAL.includes(k)) errs.push(`${where}: chave now inválida "${k}"`);
  for (const g in o.groups || {}) if (!GROUPS.includes(g)) errs.push(`${where}: grupo inválido "${g}"`);
  for (const m of o.long || []) { if (!ST.includes(m.k) && !MOD_EXTRA.includes(m.k)) errs.push(`${where}: chave long inválida "${m.k}"`); if (typeof m.v !== 'number') errs.push(`${where}: long sem valor numérico`); }
  for (const p in o.policy || {}) { const pol = policies.find(x => x.id === p); if (!pol) errs.push(`${where}: lei inexistente "${p}"`); else if (!pol.levels.some(l => l.id === o.policy[p])) errs.push(`${where}: nível inválido ${p}=${o.policy[p]}`); }
  for (const r in o.rel || {}) if (!REL_KEYS.includes(r) && !reg[r] && !(r.startsWith('$') && ROLES[r.slice(1)] || ['$aiA', '$aiB', '$attacker'].includes(r))) errs.push(`${where}: país/bloco inválido em rel "${r}"`);
  if (o.act && !ACTS.includes(o.act.type)) errs.push(`${where}: act inválido "${o.act.type}"`);
  for (const n of o.next || []) { if (!ids.has(n.id)) errs.push(`${where}: desdobramento para ID inexistente "${n.id}"`); }
  for (const k of Object.keys(o)) if (!['text', 'hint', 'now', 'groups', 'long', 'policy', 'rel', 'flags', 'next', 'headline', 'act', 'cast', 'raw', 'risk'].includes(k) && !['id', 'cat', 'title', 'headline', 'tone', 'w', 'cd', 'cond', 'chain', 'desc', 'context', 'crisis', 'default', 'options', 'after', 'deadline', 'raw', 'tpl'].includes(k)) warn.push(`${where}: campo desconhecido "${k}"`);
}
for (const x of all) {
  if (!x.title) errs.push(`${x.id}: sem título`);
  if (x.options) {
    if (x.options.length < 2 || x.options.length > 5) errs.push(`${x.id}: ${x.options.length} opções (esperado 2-5)`);
    if (x.default != null && !x.options[x.default]) errs.push(`${x.id}: opção padrão inexistente`);
    if (!x.desc) errs.push(`${x.id}: sem descrição`);
  }
  optionsOf(x).forEach((o, i) => checkEff(`${x.id}#${i}`, o));
  for (const r in x.tpl || {}) if (!ROLES[r]) errs.push(`${x.id}: papel de modelo inválido ${r}`);
  for (const m of JSON.stringify(x).match(/\{[a-zA-Z0-9]+\}/g) || []) if (!PLACE.includes(m.slice(1, -1))) errs.push(`${x.id}: marcador desconhecido ${m}`);
  for (const m of new Set((JSON.stringify(x).match(/"\$[a-zA-Z0-9]+"/g) || []).map(z => z.slice(2, -1)))) if (!x.tpl?.[m] && !(['aiA', 'aiB'].includes(m) && x.tpl?.aiWar) && !(m === 'claim' && (x.tpl?.claimant || x.tpl?.target)) && !(m === 'attacker' && (x.cond?.nukeCrisis || x.cond?.flag === 'nuked'))) errs.push(`${x.id}: $${m} sem papel no modelo`);
  for (const m of new Set((JSON.stringify(x).match(/\{(nb|nb2|power|bloc|outsideBloc|claimant|target|enemy|ally|sanctioner|blocMember|covert|region)\}/g) || []).map(z => z.slice(1, -1)))) if (!x.tpl?.[m]) errs.push(`${x.id}: {${m}} sem papel no modelo`);
  const c = x.cond || {};
  for (const k in c.min || {}) if (!COND_KEYS.includes(k)) errs.push(`${x.id}: condição inválida min.${k}`);
  for (const k in c.max || {}) if (!COND_KEYS.includes(k)) errs.push(`${x.id}: condição inválida max.${k}`);
  for (const p in { ...(c.policy || {}), ...(c.notPolicy || {}) }) if (!policies.find(z => z.id === p)) errs.push(`${x.id}: condição de lei inexistente ${p}`);
  for (const a of x.after || []) { const src = ids.get(a.issue); if (!src) errs.push(`${x.id}: after -> questão inexistente ${a.issue}`); else if (!src.options?.[a.option]) errs.push(`${x.id}: after -> opção ${a.option} inexistente em ${a.issue}`); }
}
const chainTargets = new Set([...all.flatMap(x => optionsOf(x).flatMap(o => (o.next || []).map(n => n.id))), ...events.flatMap(e => (e.next || []).map(n => n.id))]);
// Inícios de cadeia disparados direto pelo código da simulação (ordem pública, vocações etc.) não são órfãos.
const simSrc = readdirSync(new URL('../js/sim/', import.meta.url)).filter(f => f.endsWith('.js')).map(f => readFileSync(new URL('../js/sim/' + f, import.meta.url), 'utf8')).join('\n');
for (const x of all) if (x.chain && !chainTargets.has(x.id) && !(x.after || []).length && !simSrc.includes(x.id)) warn.push(`${x.id}: desdobramento nunca disparado`);
const chainsCount = all.filter(x => x.chain && x.options).length;
const report = { issues: issues.filter(x => !x.chain).length, followUps: chainsCount, choiceEvents: events.filter(e => e.options).length, randomEvents: events.filter(e => !e.chain).length, totalDecisions: all.filter(x => x.options).length, errors: errs.length, warnings: warn.length };
console.log(report);
if (warn.length) console.log('Avisos:\n ' + warn.slice(0, 30).join('\n '));
if (errs.length) { console.log('Erros:\n ' + errs.join('\n ')); process.exit(1); }
