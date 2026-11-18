// Diplomacia de guerra: propostas de tratado com cláusulas, ofertas do inimigo e de mediadores, contrapropostas,
// tréguas e tratados pós-guerra (não agressão). Substitui o "cessar-fogo sim/não" por uma negociação de verdade.
import { clamp, chance, pick } from './util.js';
import { PLY, addLoan, territoryChanged } from './world.js';
import { ceasefireChance, endWar, transfer, entName } from './war.js';

const day = s => Math.floor(s.time.min / 1440);
const st = (s, k, v) => { s.st[k] = clamp((s.st[k] ?? 0) + v, 0, 100); };

export const CLAUSES = {
  freeze: ['Congelar as linhas', 'Cessar-fogo mantendo o território controlado por cada lado.', 'settle'],
  return_occ: ['Devolver territórios ocupados', 'Os dois lados devolvem o que ocuparam (status quo anterior).', 'settle'],
  cede_lost: ['Reconhecer a perda das províncias ocupadas', 'Você cede formalmente o que o inimigo ocupa.', 'settle'],
  rep_pay: ['Pagar reparações (2% do PIB)', 'Você paga reparações ao inimigo.', 'extra'],
  rep_get: ['Receber reparações', 'O inimigo paga reparações a você.', 'extra'],
  pow: ['Troca total de prisioneiros', 'Todos os prisioneiros são devolvidos.', 'extra'],
  dmz: ['Zona desmilitarizada', 'Uma faixa de fronteira fica sem tropas.', 'extra'],
  relief: ['Levantar sanções', 'Suspende as sanções ao inimigo.', 'extra'],
  nonagg: ['Pacto de não agressão (5 anos)', 'Nenhum dos lados pode declarar guerra ao outro.', 'extra'],
  guarantor: ['Garantia de uma terceira potência', 'Um país neutro garante o acordo.', 'extra'],
};
const lostOcc = (s, w) => (w.lost || []).filter(p => s.world.occ[p] === w.enemy);
const gainedOcc = (s, w) => (w.gained || []).filter(p => s.world.occ[p] === PLY);

export function treatyChance(s, data, w, clauses, mediator = false) {
  let p = ceasefireChance(s, data, w, false);
  const lost = lostOcc(s, w).length, gained = gainedOcc(s, w).length;
  const adj = { freeze: 0, return_occ: gained ? -0.18 : 0.05, cede_lost: lost ? 0.28 : 0, rep_pay: 0.2, rep_get: -0.3, pow: 0.05, dmz: 0.03, relief: 0.1, nonagg: 0.04, guarantor: 0.05 };
  for (const c of clauses) p += adj[c] ?? 0;
  if (mediator) p += 0.12;
  return clamp(p, 0.03, 0.95);
}
export function isSettlement(clauses) { return clauses.some(c => CLAUSES[c]?.[2] === 'settle'); }
export const treatyBlocks = (s, id) => (s.treaties || []).some(t => t.with === id && t.kind === 'nonagg' && t.until > day(s));

export function applyTreaty(s, data, w, clauses, ctx) {
  const c = s.world.c[w.enemy], nm = entName(s, data, w.enemy), notes = [];
  if (clauses.includes('cede_lost')) { transfer(s, data, lostOcc(s, w), w.enemy); st(s, 'legitimacy', -5); s.groups.military = clamp((s.groups.military ?? 50) - 3, 0, 100); notes.push('você reconhece a perda das províncias ocupadas'); }
  if (clauses.includes('return_occ')) { for (const p of [...lostOcc(s, w), ...gainedOcc(s, w)]) delete s.world.occ[p]; territoryChanged(s); notes.push('territórios ocupados são devolvidos'); }
  if (clauses.includes('rep_pay')) { s.econ.treasury -= s.econ.gdp * 0.02; st(s, 'legitimacy', -1.5); notes.push('você paga reparações'); }
  if (clauses.includes('rep_get') && c) { addLoan(s, { lender: PLY, borrower: w.enemy, principal: c.gdp * 0.03, rate: 0, weeks: 52, kind: 'reparations' }); notes.push('o inimigo paga reparações'); }
  if (clauses.includes('pow')) { st(s, 'warWeariness', -3); st(s, 'reputation', 1.5); s.groups.military = clamp((s.groups.military ?? 50) + 1, 0, 100); notes.push('prisioneiros trocados'); }
  if (clauses.includes('dmz')) { st(s, 'readiness', -3); notes.push('zona desmilitarizada'); }
  if (clauses.includes('relief')) { w.sanc = 0; notes.push('sanções levantadas'); }
  if (clauses.includes('nonagg')) { (s.treaties ||= []).push({ with: w.enemy, kind: 'nonagg', until: day(s) + 1825 }); if (s.partners[w.enemy]) s.partners[w.enemy].rel = Math.min(100, s.partners[w.enemy].rel + 15); notes.push('pacto de não agressão'); }
  if (clauses.includes('guarantor')) { st(s, 'reputation', 1); notes.push('garantia internacional'); }
  const msg = `Tratado com ${nm}: ${notes.join('; ') || 'trégua'}.`;
  if (isSettlement(clauses)) { st(s, 'warWeariness', -8); st(s, 'reputation', 1); endWar(s, data, w, 'ceasefire', ctx); }
  ctx.log?.(msg, 'good');
  return msg;
}

function newOffer(s, w, from, clauses, extra = {}) {
  const D = (w.dip ||= { offers: [], cd: 0 });
  const o = { id: 'o' + day(s) + '_' + D.offers.length, from, clauses, exp: day(s) + 14, ...extra };
  D.offers.push(o); return o;
}
function offerCard(s, data, w, o) {
  const nm = entName(s, data, w.enemy), who = o.from === 'mediator' ? 'Um mediador internacional' : nm;
  const terms = o.clauses.map(c => CLAUSES[c][0]).join('; ');
  return { id: `dyn_offer_${w.id}_${o.id}`, dyn: true, cat: 'Diplomacia de guerra', crisis: false, deadline: 10,
    title: o.from === 'mediator' ? 'Proposta de mediação' : o.counter ? `Contraproposta de ${nm}` : `${nm} propõe um tratado`,
    desc: `${who} apresenta as condições para encerrar a guerra: ${terms}.`, context: o.from === 'mediator' ? 'Se você aceitar, ainda será preciso convencer o inimigo.' : 'Aceitar encerra a guerra nesses termos; você também pode contra-propor no painel da guerra.', default: 2,
    options: [{ text: 'Aceitar os termos.', hint: 'Executa o tratado.', act: { type: 'extra', op: 'treaty', war: w.id, offer: o.id, choice: 'accept' } }, { text: 'Contra-propor (abrir a mesa de negociação).', hint: 'Você ajusta as cláusulas na mesa de operações.', act: { type: 'extra', op: 'treaty', war: w.id, offer: o.id, choice: 'counter' } }, { text: 'Recusar.', hint: 'A guerra continua.', act: { type: 'extra', op: 'treaty', war: w.id, offer: o.id, choice: 'reject' } }] };
}

export function treatyAct(s, data, act, ctx) {
  const w = s.wars.find(x => x.id === act.war && x.active); if (!w) return '';
  const D = (w.dip ||= { offers: [], cd: 0 }), o = D.offers.find(x => x.id === act.offer);
  if (!o) return '';
  D.offers = D.offers.filter(x => x !== o);
  if (act.choice === 'accept') {
    if (o.from === 'mediator' && !chance(treatyChance(s, data, w, o.clauses, true))) return 'O inimigo recusa a proposta do mediador.';
    return applyTreaty(s, data, w, o.clauses, ctx);
  }
  if (act.choice === 'counter') { D.open = o.clauses; return 'Você abre a mesa de negociação; ajuste as cláusulas na mesa de operações.'; }
  st(s, 'reputation', o.from === 'mediator' ? -1 : 0); return 'Você recusa a proposta.';
}

// Ações do jogador (painel): propose | truce | accept | reject
export function dipAct(s, data, op, arg, ctx) {
  const w = s.wars.find(x => x.active && x.id === arg?.war) || s.wars.find(x => x.active); if (!w) return { ok: false, msg: 'Sem guerra ativa.' };
  const D = (w.dip ||= { offers: [], cd: 0 }), d = day(s);
  if (op === 'accept' || op === 'reject') { const m = treatyAct(s, data, { war: w.id, offer: arg.offer, choice: op }, ctx); return { ok: !!m, log: true, msg: m }; }
  if ((D.cd || 0) > d) return { ok: false, msg: `Aguarde ${Math.ceil((D.cd - d) / 7)} semana(s) para outra proposta.` };
  if (op === 'truce') {
    D.cd = d + 14;
    if (chance(clamp(treatyChance(s, data, w, ['freeze']) * 0.8 + 0.1, 0.05, 0.9))) { w.truce = 8; return { ok: true, log: true, msg: 'Trégua de 8 semanas acordada: os combates param, a guerra continua formalmente.' }; }
    return { ok: false, msg: 'O inimigo recusa a trégua.' };
  }
  if (op === 'propose') {
    const cl = (arg.clauses || []).filter(c => CLAUSES[c]); if (!cl.length) return { ok: false, msg: 'Escolha ao menos uma cláusula.' };
    D.cd = d + 14;
    const p = treatyChance(s, data, w, cl);
    if (chance(p)) return { ok: true, log: true, msg: applyTreaty(s, data, w, cl, ctx) };
    if (p > 0.25 && !cl.includes('rep_pay') && isSettlement(cl)) { const o = newOffer(s, w, 'enemy', [...new Set([...cl, lostOcc(s, w).length ? 'cede_lost' : 'rep_pay'])], { counter: true }); ctx.card?.(offerCard(s, data, w, o)); return { ok: false, msg: 'O inimigo rejeita e faz uma contraproposta.' }; }
    return { ok: false, msg: `O inimigo rejeita os termos (chance era ${Math.round(p * 100)}%).` };
  }
  return { ok: false, msg: '' };
}

// Semana: ofertas do inimigo e de mediadores
export function weeklyWarDip(s, data, ctx) {
  for (const w of s.wars) {
    if (!w.active) continue;
    const D = (w.dip ||= { offers: [], cd: 0 }), d = day(s);
    D.offers = D.offers.filter(o => o.exp > d);
    if (D.offers.length || d - w.start < 28 || w.pendingTerms) continue;
    const c = s.world.c[w.enemy], p0 = ceasefireChance(s, data, w, false);
    if (w.score < -30 && chance(0.12)) { const o = newOffer(s, w, 'enemy', lostOcc(s, w).length ? ['cede_lost', 'rep_pay'] : ['freeze', 'rep_pay']); ctx.card?.(offerCard(s, data, w, o)); }
    else if ((p0 > 0.4 || w.enemyExh > 45 || (c?.nego ?? 0) > 60) && chance(0.06)) { const o = newOffer(s, w, 'enemy', pick([['freeze', 'pow'], ['freeze', 'pow', 'nonagg'], ['return_occ', 'pow']])); ctx.card?.(offerCard(s, data, w, o)); }
    else if (chance(0.05)) { const o = newOffer(s, w, 'mediator', ['freeze', 'pow', 'guarantor']); ctx.card?.(offerCard(s, data, w, o)); }
  }
}
