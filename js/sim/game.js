import { clamp, chance, dateOf, fmtMonth, random, bindRng, seedFrom } from './util.js';
import { newGame, syncRegions } from './state.js';
import { dailyModel, snapshot, gdppc, costMultiplier, efficiencyFactor, debtRatio, collectMods, computeSectors, computeBudget, militaryPower } from './model.js';
import { pickIssue, pickEvent, applyEffects, eligible, setIssueData, instantiate } from './issues.js';
import { monthlyDiplomacy, doPartnerAction, joinOrg, leaveOrg, imfLoan, partnerName, executeAct, createBloc, inviteToBloc, expelFromBloc, orgDef } from './diplomacy.js';
import { milAction } from './military.js';
import { dailyRegime, checkVictories, resign, endGame } from './regime.js';
import { prepareWorld, weeklyWorld, provincesOf, territoryChanged, computeRankings, PLY, setOwner, aiPower, playerNeighbors, shiftRelAI, ownerOf } from './world.js';
import { fabricatePretext } from './war.js';
import { weeklyWar, startWar, canDeclareOn, warAction, proposeCeasefire, availableTerms, applyTerms, transfer, imposeDefeat, relocateCapital, ent } from './war.js';
import { weeklyCast, initCast, advice, applyCast } from './characters.js';
import { initMissions, monthlyMissions, weeklyMissions } from './missions.js';
import { weeklyWorldWar } from './worldwar.js';
import { weeklyCovert, weeklyAiWarFronts, covertOptions, doCovert, inciteTargets, incite, sponsorInsurgency } from './covert.js';
import { weeklyNuclear, startNukeProgram, nukeProgramBlock, playerThreat, nuclearStrike } from './nuclear.js';
import { weeklyPrograms, startProgram, cancelProgram } from './programs.js';
import { advisorAlerts, advisorPick, weeklyPoll } from './advisor.js';
import { playerCulture } from './names.js';
import { initSociety, weeklySociety, pressAction } from './society.js';
import { initMode, weeklyMode, score, loadMeta, saveMeta, ascentFirstCard } from './modes.js';
import { weeklyWorldLife, setWorldData, remember, summitEval, summitApply, spyAct, setResearch } from './worldlife.js';
import { initForces, weeklyForces, assign, recruitCorps, buyNavy, buyAir, replaceGeneral, airCampaign, blockade, customPeace, peaceCandidates } from './armies.js';
import { initMarkets, weeklyMarkets, startBuilding, privatize, nationalize, setFx, devalue } from './markets.js';
import { macrosOf, saveMacro, deleteMacro } from './macros.js';
import { weeklyExtras, installExtras } from './extras.js';
import { weeklyWorldHealth } from './health.js';
import { weeklyWorldTrade } from './tariffs.js';
import { weeklyWorldMinorities } from './minority.js';
import { genderize } from './names.js';
import { weeklyWarDip } from './wardip.js';
import { ensureRights, weeklyRights, rightsAct, deport, naturalize, arrest, banParty, unbanParty, amnesty, crushRegion, concedeRegion, setIccRecognition } from './rights.js';
import { legacy as buildLegacy, comebackInfo, tryComeback } from './legacy.js';
import { wrOfIds } from './worldregions.js';
import { worldData, initWorldScenario, weeklyWorldScenario } from './worldscen.js';
import { applySplits } from './munis.js';
import { initGeopol, weeklyGeopol, labAct, computeMeters } from './geopol.js';
import { weeklyAttrition } from './attrition.js';
import { weeklyGovernors, initGovernors, setGovMode, setAutonomy, removeLeader, appointNew, fundWork } from './governors.js';
import { initCabinet2, weeklyCabinet, cabinetAct, setMandate, hireAdvisor, fireAdvisor, advisorCandidates, train, notePolicyChange, noteEconChange } from './cabinet.js';
import { initFinance, weeklyFinance, investCash, payInvest, raiseFunds, sectorInvest } from './finance.js';
import { weeklyChaos, weeklySeparatist, separatistCard, foundState, playerMovement, MOVEMENTS, movementProvinces } from './newstates.js';
import { initPolitics, weeklyPolitics, startUprising, lawVote, candidates, appoint, amendConstitution, succeed, uprisingCard, PORTFOLIOS } from './politics.js';

const SAVE_KEY = 'ironstate.v3';
const rivalOfAny = s => Object.keys(s.partners).filter(id => s.world.c[id]?.nuclear).sort((a, b) => s.partners[a].rel - s.partners[b].rel)[0] || Object.keys(s.world.c)[0];
function weeklyAscentCard(g) { g.s.ascent.week = 0; return ascentFirstCard(g.s); }
export const SAVE_VERSION = 3;
const WEEK = 10080;
const DEFAULT_SLOTS = [0.06, 0.3, 0.55, 0.8];
const MAX_PENDING = 6;

export function prepareData(raw) {
  const d = { ...raw };
  d.initById = Object.fromEntries(raw.initiatives.map(i => [i.id, i]));
  d.events = raw.events || [];
  d.worldScenarios = raw.worldScenarios?.scenarios || [];
  d.regionalFlags = raw.regionalFlags || null;
  d.health = raw.health || null;
  d.minorities = raw.minorities || null;
  d.issueById = Object.fromEntries([...raw.issues, ...d.events.filter(e => e.options)].map(i => [i.id, i]));
  // Desdobramentos declarados com "after" são anexados às opções de origem.
  for (const x of raw.issues) for (const a of x.after || []) { const o = d.issueById[a.issue]?.options?.[a.option]; if (o && !(o.next || []).some(n => n.id === x.id)) (o.next ||= []).push({ id: x.id, days: a.days ?? 30, p: a.p ?? 1 }); }
  prepareWorld(d, raw);
  setIssueData(d);
  setWorldData(d);
  return d;
}

export class Game {
  constructor(data, storage = globalThis.localStorage) {
    this.data = data; this.baseData = data; this.s = null; this.storage = storage; this.handlers = {};
  }
  // Aplica (ou remove) a reescrita do mundo inteiro por um cenário mundial.
  // splits: províncias divididas por seleção de municípios (ver munis.js); por padrão vêm do estado da partida.
  useWorld(id, splits, custom) {
    const cw = custom !== undefined ? custom : this.s?.world?.cwdef;
    let d = (cw || (id && id !== 'custom')) ? worldData(this.baseData, id, cw) : this.baseData;
    const sp = splits !== undefined ? splits : this.s?.world?.splits;
    if (sp?.length) d = applySplits(d, sp);
    this.data = d; setIssueData(d); setWorldData(d);
  }
  on(ev, fn) { (this.handlers[ev] ||= []).push(fn); }
  emit(ev, ...a) { for (const fn of this.handlers[ev] || []) fn(...a); }
  get day() { return Math.floor(this.s.time.min / 1440); }
  getIssue(id) { return this.data.issueById[id] || this.s.issues.dyn?.[id]; }

  start(cfg) {
    const seed = cfg.seed != null ? (typeof cfg.seed === 'number' ? cfg.seed >>> 0 : seedFrom(cfg.seed)) : (Math.random() * 4294967296) >>> 0;
    const holder = { rng: seed | 0 };
    bindRng(holder);
    this.useWorld(cfg.worldScenario || null, cfg.splits || [], cfg.customWorld || null);
    if (cfg.nation?.leader) cfg = { ...cfg, nation: { ...cfg.nation, leader: genderize(cfg.nation.leader) } };
    this.s = newGame(cfg, this.data);
    if (cfg.spectator) { this.s.spectator = true; this.s.mode = 'observer'; }
    this.s.world.splits = cfg.splits || [];
    this.s.world.cwdef = cfg.customWorld || null;
    initWorldScenario(this.s, this.data);
    const s = this.s, data = this.data;
    s.seed = seed; s.rng = holder.rng; s.mode = cfg.mode || s.mode || 'sandbox';
    s.world.chaos = !!cfg.chaos;
    bindRng(s);
    s.nation.regions = [...new Set(s.nation.components.flatMap(c => data.reg[c.id]?.regions || []))];
    s.nation.wregions = wrOfIds(s.nation.components.map(c => c.id));
    s.nation.resources = [...new Set(s.nation.components.flatMap(c => data.reg[c.id]?.profile?.resources || []))];
    s.nation.startGdppc = gdppc(s);
    this.warmUp();
    initCast(s, data);
    initPolitics(s);
    initCabinet2(s);
    ensureRights(s, data);
    initMarkets(s);
    initForces(s);
    initMissions(s, data);
    // Guerras reais em curso passam ao jogador quando ele governa um dos lados por inteiro.
    for (const w of data.claimsDb.wars || []) {
      const mineA = s.nation.components.some(c => c.id === w.a && c.full), mineB = s.nation.components.some(c => c.id === w.b && c.full);
      const foe = mineA ? w.b : mineB ? w.a : null;
      if (foe && s.world.c[foe]) { const pw = startWar(s, data, foe, { aggressor: mineA, goal: mineA ? 'border' : 'defend' }, (t, k) => this.log(t, k)); pw.inherited = true; for (const p in s.world.occ) { if (s.world.occ[p] === PLY && mineA) pw.gained.push(p); else if (s.world.occ[p] === foe) pw.lost.push(p); } }
    }
    initGeopol(s, data, cfg.lab || {});
    if (s.spectator) this.initObserver();
    this.rank();
    s.monthStart = snapshot(s);
    s.yearStart = s.monthStart;
    s.history.push(s.monthStart);
    if (!s.spectator) this.log(`${cfg.nation.leader} assume o governo de ${cfg.nation.officialName}.`, 'info');
    initSociety(s, data);
    initMode(s, cfg);
    if (data.scenarios.find(x => x.id === cfg.scenario)?.secession) this.separatistStart();
    if (s.spectator) { /* Observatório: sem questões */ } else if (s.ascent) this.pushIssue(weeklyAscentCard(this), { event: true }); else for (let i = 0; i < 4; i++) this.issueArrives();
    const lost = s.world.claims.filter(c => c.src === 'generated');
    for (const c of lost.slice(0, 3)) this.log(`${partnerName(s, data, c.claimant)} protesta contra a perda de território e não reconhece as novas fronteiras.`, 'warn');
    this.save();
  }

  warmUp() {
    const s = this.s;
    for (let i = 0; i < 6; i++) {
      dailyModel(s, this.data);
      for (const k in s.d.targets) if (k in s.st && k !== 'troops') s.st[k] = s.d.targets[k];
      s.st.coupRisk = Math.min(s.st.coupRisk, 25); s.st.revoRisk = Math.min(s.st.revoRisk, 25);
    }
    s.nation.base = { industry: s.st.industry, tech: s.st.tech, productivity: s.st.productivity, infra: s.d.infra };
    s.econ.gdp = s.econ.pop * s.nation.startGdppc / 1e3;
    dailyModel(s, this.data);
  }

  log(text, type = 'info') {
    if (!text) return;
    this.s.log.unshift({ day: this.day, min: this.s.time.min % 1440, text, type });
    if (this.s.log.length > 400) this.s.log.length = 400;
    this.emit('log', text, type);
  }
  notify(title, text, kind = 'warn') { this.emit('notify', title, text, kind); }

  // ---------- Turnos semanais ----------
  get week() { return Math.floor(this.s.time.min / WEEK); }
  weekFrac() { return (this.s.time.min % WEEK) / WEEK; }
  slots() { return this.s.settings.weekSlots || DEFAULT_SLOTS; }
  nextEvent() {
    const m = this.s.time.min % WEEK;
    const slot = this.slots().map(f => Math.round(f * WEEK)).find(x => x > m);
    return slot != null ? { at: slot, label: 'Nova questão' } : { at: WEEK, label: 'Fim do turno' };
  }
  advance(minutes) {
    let left = minutes;
    while (left > 0 && !this.s.over) {
      const m = this.s.time.min % WEEK, ev = this.nextEvent();
      const stepMin = Math.min(left, ev.at - m);
      this.s.time.min += stepMin; left -= stepMin;
      if (stepMin === ev.at - m) {
        if (ev.at === WEEK) { if (this.endOfWeek()) return true; }
        else if (this.issueArrives() && this.s.settings.autoPause) return true;
      }
    }
    return !!this.s.over;
  }
  skipToNext() { bindRng(this.s); return this.advance(this.nextEvent().at - this.s.time.min % WEEK); }
  // Turno por botão: processa a semana inteira e entrega as quatro questões da semana seguinte.
  nextWeek() {
    bindRng(this.s);
    const s = this.s;
    if (s.spectator) s.over = null; // o Observatório nunca termina
    if (s.over) return null;
    s.time.min = (this.week + 1) * WEEK;
    this._inNextWeek = true;
    try { this.endOfWeek(); } finally { this._inNextWeek = false; }
    if (s.over) return s.turns[0];
    const n = s.spectator ? 0 : s.nukeCrisis?.weeks > 0 ? 4 : clamp(s.settings.cardsPerWeek ?? 3, 1, 6);
    for (let i = 0; i < n; i++) this.issueArrives();
    if (s.nukeCrisis?.weeks > 0) this.crisisTick();
    if (s.chief?.on) this.chiefDecide();
    if (s.settings.autoMinor) this.autoDecideMinor();
    this.save();
    return s.turns[0];
  }
  endTurnNow() {
    let guard = 0;
    while (!this.s.over && guard++ < 8) {
      const ev = this.nextEvent(), m = this.s.time.min % WEEK;
      this.s.time.min += ev.at - m;
      if (ev.at === WEEK) { this.endOfWeek(); break; }
      this.issueArrives();
    }
  }

  pushIssue(iss, extra = {}) {
    const s = this.s;
    if (iss.dyn) s.issues.dyn[iss.id] = iss;
    const ttl = iss.deadline ?? (iss.crisis ? 7 : 14);
    s.issues.pending.push({ id: iss.id, day: this.day, min: s.time.min % 1440, deadline: this.day + ttl, ...extra });
    s.issues.last[iss.base || iss.id] = this.day;
    while (s.issues.pending.length > MAX_PENDING) this.expireIssue(s.issues.pending.find(p => !this.getIssue(p.id).crisis) || s.issues.pending[0], 'Fila cheia');
    this.emit('issue', iss);
  }
  issueArrives() {
    bindRng(this.s);
    const s = this.s;
    const due = s.nukeCrisis?.weeks > 0 ? -1 : s.issues.scheduled.findIndex(x => x.day <= this.day && !s.issues.pending.some(p => p.id === x.id));
    if (due >= 0) {
      const [x] = s.issues.scheduled.splice(due, 1);
      let iss = this.getIssue(x.id);
      if (iss?.tpl || iss?.fillOnly) iss = x.bind ? instantiate(s, iss, x.bind) : eligible(s, iss) ? instantiate(s, iss) : null;
      if (iss && eligible(s, iss)) { this.pushIssue(iss, { chain: true, ...(x.origin ? { origin: x.origin } : {}) }); return true; }
    }
    const iss = pickIssue(s, this.data);
    if (!iss) return false;
    this.pushIssue(iss);
    return true;
  }
  expireIssue(p, why) {
    const s = this.s, iss = this.getIssue(p.id);
    s.issues.pending = s.issues.pending.filter(x => x !== p);
    s.issues.ignored++;
    if (iss.default != null) {
      this.applyOption(iss, iss.options[iss.default]);
      this.log(`${why}: "${iss.title}" — sem decisão, prevaleceu: ${iss.options[iss.default].text}`, 'warn');
    } else {
      s.st.legitimacy = clamp(s.st.legitimacy - (iss.crisis ? 4 : 1.5), 0, 100);
      for (const g in s.groups) s.groups[g] = clamp(s.groups[g] - (iss.crisis ? 2 : 0.5), 0, 100);
      this.log(`${why}: "${iss.title}" ficou sem resposta. O governo pareceu omisso.`, 'warn');
    }
    if (iss.dyn) delete s.issues.dyn[iss.id];
  }
  applyOption(iss, opt) {
    if (opt.risk) opt = this.riskOpt(opt);
    const changes = applyEffects(this.s, opt, this.data, iss.title, iss.dyn ? iss.base : iss.id);
    for (const n of opt.next || []) if (random() < (n.p ?? 1)) this.s.issues.scheduled.push({ id: n.id, day: this.day + (n.days ?? 21), origin: { title: iss.title, opt: opt.text, day: this.day }, ...(iss.bind ? { bind: iss.bind } : {}) });
    if (opt.act?.type === 'rights') { const msg = rightsAct(this.s, this.data, opt.act, this.ctx()); if (msg) { changes.push([msg, '', 'policy']); this.log(msg, 'decision'); } }
    else if (opt.act) { const msg = executeAct(this.s, this.data, opt.act, this.ctx()); if (msg) { changes.push([msg, '', 'policy']); this.log(msg, 'decision'); } }
    applyCast(this.s, opt, (t, k) => this.log(t, k));
    return changes;
  }
  answerIssue(id, optIdx, { auto = false } = {}) {
    bindRng(this.s);
    const s = this.s, iss = this.getIssue(id), opt = iss.options[optIdx];
    const before = this.keyStats();
    s.issues.pending = s.issues.pending.filter(p => p.id !== id);
    const changes = this.applyOption(iss, opt);
    s.issues.answered++;
    s.decisions.push({ day: this.day, id, title: iss.title, cat: iss.cat, opt: optIdx, text: opt.text, ...(auto ? { auto: true } : {}) });
    if (s.decisions.length > 600) s.decisions.shift();
    this.log(auto ? `Gabinete decidiu: "${iss.title}" — ${opt.text}` : opt.headline || `${iss.title}: governo decide — ${opt.text}`, 'decision');
    if (iss.dyn) delete s.issues.dyn[id];
    this.afterTerritory();
    this.recalc();
    this.save();
    const res = { changes, delta: this.diffStats(before) };
    this.emit('answered', res);
    if (s.over) this.finish();
    return res;
  }
  advice(iss) { return advice(this.s, this.data, iss); }

  recalc() {
    const s = this.s, M = collectMods(s, this.data);
    s.sector = computeSectors(s, this.data, M);
    s.d.budget = computeBudget(s, this.data, M, s.sector);
    s.d.mods = M;
  }
  keyStats() {
    const s = this.s, inf = s.d.influence || {};
    let sw = 0, si = 0;
    for (const g in s.groups) { sw += s.groups[g] * (inf[g] || 1); si += inf[g] || 1; }
    const rel = Object.values(s.partners).reduce((a, p) => a + p.rel, 0) / Math.max(1, Object.keys(s.partners).length);
    return { Apoio: sw / si, Tesouro: s.econ.treasury, Estabilidade: s.st.stability, Inflação: s.st.inflation, Legitimidade: s.st.legitimacy, Reputação: s.st.reputation, Protestos: s.st.protest, Dívida: s.econ.debt, 'Confiança diplomática': rel, mods: collectMods(s, this.data) };
  }
  diffStats(b) {
    const a = this.keyStats(), out = [];
    for (const k in b) if (k !== 'mods' && Math.abs(a[k] - b[k]) > 0.05) out.push([k, a[k] - b[k]]);
    for (const k of ['growth', 'inflation', 'corruption', 'civil', 'reputation', 'legitimacy']) {
      const d = (a.mods[k] || 0) - (b.mods[k] || 0);
      if (Math.abs(d) > 0.05) out.push([k, d, 'trend']);
    }
    return out;
  }

  // Contexto usado pelos módulos de mundo, guerra e diplomacia para agir sobre a partida.
  ctx() {
    const s = this.s, data = this.data, g = this;
    return {
      day: this.day, playerPower: militaryPower(s),
      log: (t, k) => g.log(t, k), news: (t, k) => g.log(t, k || 'info'), notify: (t, x) => g.notify(t, x),
      card: iss => { if (g.s.spectator) return; if (g.s.flags.micronation && !String(iss.id).startsWith('bt')) return; if (g.s.ascent && !iss.keepInCrisis) return; if (g.s.nukeCrisis?.weeks > 0 && !iss.nukeOk && !iss.keepInCrisis && !String(iss.id).startsWith('dyn_nuke') && !String(iss.id).startsWith('dyn_siege')) return; g.pushIssue(iss, { event: true }); },
      transfer: (pids, to) => { transfer(s, data, pids, to); g.afterTerritory(); },
      secede: r => { const nm = g.secede(r); g.afterTerritory(); return nm; },
      declareWarOnPlayer: (id, claim) => { if (s.spectator) return null; const w = startWar(s, data, id, { aggressor: false, goal: 'defend', claim }, (t, k) => g.log(t, k)); g.notify('Invasão!', `${partnerName(s, data, id)} declarou guerra a ${s.nation.shortName}. Organize a defesa na página Forças armadas.`); return w; },
      peaceOffer: id => g.peaceOfferCard(id),
      siegeCard: w => g.siegeCard(w),
      terms: () => g.emit('terms'),
      forcedPeace: w => { imposeDefeat(s, data, w, g.ctx()); g.afterTerritory(); },
      joinAllyWar: (warId, side) => g.joinAllyWar(warId, side),
      acceptPeace: act => { const w = s.wars.find(x => x.id === act.war); if (w) { proposeCeasefire(s, data, w, act.concede, g.ctx()); g.afterTerritory(); } },
      siegeChoice: act => g.siegeChoice(act),
      onAiWar: w => g.allyAttacked(w),
      leaderDies: cause => g.leaderDies(cause),
      electionResult: r => g.emit('election', r),
      uprisingEnd: res => g.uprisingEnd(res),
      modeEnd: res => endGame(s, res === 'win' ? 'modeWin' : res === 'lose' ? 'modeLose' : 'modeEnd', s.modeCfg?.name ? `${s.modeCfg.name}: ${s.modeCfg.goalText || ''}` : 'Fim da temporada'),
      nuclearStrike: by => nuclearStrike(s, data, by, g.ctx()),
      declareWar: (id, goal) => { const r = g.declareWar(id, goal); return r.ok ? `${s.nation.shortName} declara guerra a ${partnerName(s, data, id)}.` : r.msg; },
    };
  }

  afterTerritory() {
    const s = this.s, data = this.data;
    if (!s.regionsDirty && s.world.ver === this._ver) return;
    this._ver = s.world.ver;
    s.regionsDirty = false;
    const mine = provincesOf(s, data, PLY);
    if (!mine.length) { endGame(s, 'occupation', 'Território inteiramente perdido'); return; }
    syncRegions(s, data, mine);
    if (!mine.includes(s.nation.capitalProv)) relocateCapital(s, data, null);
    const occ = new Set(Object.keys(s.world.occ).filter(p => s.world.occ[p] !== PLY));
    for (const r of s.regions) r.occupiedShare = r.provinces.filter(p => occ.has(p)).length / r.provinces.length;
    s.nation.area = mine.reduce((a, p) => a + data.geo.prov[p].a, 0);
  }

  endOfWeek() {
    bindRng(this.s);
    const s = this.s, data = this.data, log = (t, k) => this.log(t, k);
    const before = snapshot(s);
    const crisis = s.nukeCrisis?.weeks > 0;
    for (const p of [...s.issues.pending]) { const iss = this.getIssue(p.id); if (crisis && !iss?.cond?.nukeCrisis) { p.deadline += 7; continue; } if (p.deadline <= this.day) this.expireIssue(p, 'Prazo esgotado'); }
    let monthTurn = false;
    const hooks = { secede: r => this.secede(r), uprising: (kind, p) => { if (!s.pol || s.pol.uprising) return false; startUprising(s, kind, p); this.pushIssue(uprisingCard(s), { event: true }); this.notify(kind === 'coup' ? 'Golpe de Estado!' : 'Revolução!', kind === 'coup' ? 'Tropas rebeldes avançam sobre a capital. Você tem 4 semanas para virar o jogo.' : 'Multidões tomaram as ruas e exigem a sua queda. Você tem 4 semanas para virar o jogo.'); return true; } };
    for (let i = 6; i >= 0 && !s.over; i--) {
      const d = this.day - i;
      dailyModel(s, data);
      for (const id in s.initiatives) {
        const it = s.initiatives[id];
        if (it.status !== 'building') continue;
        it.progress += 0.7 + efficiencyFactor(s) * 0.4;
        if (it.progress >= data.initById[id].days) { it.status = 'active'; it.done = d; this.log(`Iniciativa concluída: ${data.initById[id].name}.`, 'good'); }
      }
      if (s.mobilized > 0) s.mobilized--;
      if (!s.spectator) dailyRegime(s, data, log, (t, x) => this.notify(t, x), hooks);
      if (dateOf(d).d === 1 && d > 0) { this.monthly(); monthTurn = true; }
    }
    if (!s.over) {
      const c = this.ctx();
      weeklyWorld(s, data, c);
      const micro = !!s.flags.micronation; // Bir Tawil: sem crises mundiais sérias
      if (micro) for (const id in s.partners) { const p = s.partners[id]; p.rel = Math.min(p.rel, -2); p.pact = false; }
      if (!micro) weeklyChaos(s, data, c);
      if (!micro) { weeklyGeopol(s, data, c); weeklyWorldHealth(s, data, c); weeklyWorldTrade(s, data, c); weeklyWorldMinorities(s, data, c); }
      weeklySeparatist(s, data, c);
      if (!micro) weeklyWorldLife(s, data, c);
      weeklyWar(s, data, c);
      weeklyWarDip(s, data, c);
      weeklyForces(s, data, c);
      weeklyAiWarFronts(s, data, c);
      weeklyAttrition(s, data, c);
      if (!micro) weeklyWorldWar(s, data, c);
      weeklyWorldScenario(s, data, c);
      weeklyCovert(s, data, c);
      if (!micro && !s.spectator) weeklyNuclear(s, data, c);
      weeklyPrograms(s, c);
      weeklyMarkets(s, data, c);
      if (!s.spectator) { weeklySociety(s, data, c); weeklyRights(s, data, c); weeklyExtras(s, data, c); weeklyMode(s, c); }
      this.afterTerritory();
      if (!s.spectator) {
        weeklyCast(s, data, c);
        weeklyPolitics(s, data, c);
        weeklyCabinet(s, data, c);
        weeklyGovernors(s, data, c);
        weeklyFinance(s);
        weeklyMissions(s, data, c);
        if (!(s.nukeCrisis?.weeks > 0)) this.weeklyEvents();
      } else this.observerWeek();
    }
    if (!this._inNextWeek && s.nukeCrisis?.weeks > 0 && s.nukeCrisis.day < this.day - 2) this.crisisTick();
    if (s.wars.some(w => w.pendingTerms)) this.emit('terms');
    weeklyPoll(s);
    s.history.push(snapshot(s));
    if (s.history.length > 900) s.history = s.history.filter((h, i) => i >= 450 || i % 2 === 0);
    const turn = { week: this.week, day: this.day, from: before, to: s.history.at(-1), decisions: s.decisions.filter(x => x.day > this.day - 7).length,
      news: s.log.filter(x => x.day > this.day - 7 && x.type !== 'decision').slice(0, 8).map(x => x.text),
      items: s.log.filter(x => x.day > this.day - 7).slice(0, 30).map(x => ({ text: x.text, type: x.type, day: x.day })) };
    s.turns.unshift(turn);
    if (s.turns.length > 156) s.turns.length = 156;
    this.emit('turn', turn);
    if (s.spectator) s.over = null;
    if (s.over) { this.finish(); return true; }
    this.save();
    return monthTurn && !!s.settings.pauseMonthly;
  }

  weeklyEvents() {
    const s = this.s, data = this.data;
    const n = (random() < 0.75 ? 1 : 0) + (random() < 0.2 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const ev = pickEvent(s, data);
      if (!ev) break;
      s.events.last[ev.id] = this.day;
      if (ev.options) { this.pushIssue(ev, { event: true }); continue; }
      applyEffects(s, { ...ev, raw: true }, data, ev.title, 'ev_' + ev.id);
      for (const n2 of ev.next || []) if (random() < (n2.p ?? 1)) s.issues.scheduled.push({ id: n2.id, day: this.day + (n2.days ?? 14) });
      this.log(ev.headline || ev.title, ev.tone || 'info');
      this.emit('event', ev);
    }
  }

  rank() {
    const s = this.s;
    computeRankings(s, this.data, {
      gdp: s.econ.gdp, gdppc: gdppc(s), growth: s.st.growth, military: militaryPower(s), authoritarian: 100 - (s.st.civil + s.st.political) / 2, liberty: (s.st.civil + s.st.political) / 2,
      pop: s.econ.pop, poverty: s.st.poverty, inequality: s.st.inequality, influence: Math.log10(s.econ.gdp + 1) * 15 + militaryPower(s) * 0.6 + Object.keys(s.orgs).length * 2 + s.st.influence * 0.2,
      area: s.nation.area, approval: s.d.support, debt: debtRatio(s),
    });
  }

  monthly() {
    const s = this.s, data = this.data, log = (t, k) => this.log(t, k);
    monthlyDiplomacy(s, data, log);
    this.rank();
    if (s.spectator) { s.monthStart = snapshot(s); return; } // Observatório: sem conquistas, missões nem relatórios do país-fantasma
    const got = checkVictories(s, data, log);
    for (const id of got) this.emit('victory', id);
    monthlyMissions(s, data, this.ctx());
    const now = snapshot(s);
    const rep = this.buildReport(s.monthStart, now, 'month');
    s.reports.unshift(rep);
    if (s.reports.length > 72) s.reports.length = 72;
    s.monthStart = now;
    if (dateOf(this.day).m === 0) { s.reports.unshift(this.buildReport(s.yearStart, now, 'year')); s.yearStart = now; }
    this.emit('report', rep);
  }

  buildReport(a, b, type) {
    const s = this.s;
    const decisions = s.decisions.filter(x => x.day >= a.day && x.day < b.day + 1);
    const events = s.log.filter(x => x.day >= a.day && x.day <= b.day && x.type !== 'decision').map(x => ({ text: x.text, type: x.type }));
    const T = s.d.targets || {};
    const fc = k => s.st[k] + ((T[k] ?? s.st[k]) - s.st[k]) * 0.6;
    const bud = s.d.budget;
    const R = s.world.rankings || {};
    return {
      type, day: b.day, title: type === 'year' ? `Relatório anual de ${dateOf(a.day).y}` : type === 'final' ? 'Relatório final' : `Relatório de ${fmtMonth(a.day)}`,
      from: a, to: b, decisions: decisions.map(x => ({ title: x.title, text: x.text, day: x.day })),
      good: events.filter(e => e.type === 'good').map(e => e.text).slice(0, 12),
      bad: events.filter(e => ['bad', 'war', 'warn'].includes(e.type)).map(e => e.text).slice(0, 12),
      budget: { revenue: bud.revenue, expense: bud.expense, balance: bud.balance },
      wars: s.wars.filter(w => w.active).map(w => `${partnerName(s, this.data, w.enemy)}: placar ${Math.round(w.score)}`),
      sanctions: Object.keys(s.partners).filter(id => s.partners[id].sanctionsBy).map(id => partnerName(s, this.data, id)),
      ranks: { gdp: R.gdp?.pos, military: R.military?.pos, influence: R.influence?.pos, authoritarian: R.authoritarian?.pos },
      forecast: { growth: fc('growth'), inflation: fc('inflation'), unemployment: fc('unemployment'), poverty: fc('poverty'), stability: fc('stability'), coupRisk: fc('coupRisk'), revoRisk: fc('revoRisk') },
    };
  }

  finish() {
    const s = this.s;
    this.s.final = this.buildReport(this.s.history[0], snapshot(this.s), 'final');
    s.score = score(s);
    if (this.storage && !s.scored) {
      s.scored = true;
      const M = loadMeta(this.storage);
      M.runs++;
      const key = s.mode === 'daily' ? 'daily-' + (s.modeCfg?.key || '') : s.mode + (s.modeCfg?.challenge ? '-' + s.modeCfg.challenge : '');
      M.best[key] = Math.max(M.best[key] || 0, s.score);
      (M.history ||= []).unshift({ day: Date.now(), mode: s.mode, name: s.nation.shortName, score: s.score, ending: s.over?.ending, key }); if (M.history.length > 50) M.history.length = 50;
      if (s.mode === 'roguelite') { s.legacyGain = Math.round(s.score / 20); M.legacy += s.legacyGain; }
      saveMeta(this.storage, M);
    }
    this.save();
    this.emit('over', this.s.over);
  }

  // ---------- Secessão: a região vira um Estado no mapa ----------
  secede(r) {
    const s = this.s, data = this.data;
    const mine = new Set(r.provinces);
    const mv = MOVEMENTS.find(m => { const p = movementProvinces(data, m); return p.length && p.filter(x => mine.has(x)).length >= p.length * 0.5; });
    const base = data.reg[r.key];
    const movement = mv || (base && !r.annexed ? { name: base.name, short: base.name, culture: s.nation.culture, ideo: 'Restauração da independência', flag: base.iso2 ? { iso: base.iso2 } : undefined, profile: { ...(base.profile || {}) } } : null);
    if (movement && !movement.flag) delete movement.flag;
    const id = foundState(s, data, this.ctx(), { pids: r.provinces, from: PLY, movement: movement?.flag ? movement : null, why: 'proclama independência' });
    if (!id) return r.name;
    const e = s.world.ents[id];
    if (movement && !movement.flag) e.name = e.nameEn = movement.name;
    s.world.c[id].equip = s.st.equipment * 0.6;
    this.afterTerritory();
    return e.name;
  }

  // Cenário "Crise separatista": uma região (movimento real, se houver) se declara independente no início.
  separatistStart() {
    const s = this.s, data = this.data, mine = provincesOf(s, data, PLY);
    const mv = playerMovement(s, data);
    let pids = mv?.pids, movement = mv?.m || null;
    if (!pids) {
      const r = s.regions.filter(r => !r.cap && r.provinces.length < mine.length * 0.5).sort((a, b) => (b.sep || 0) - (a.sep || 0) || b.provinces.length - a.provinces.length)[0];
      if (!r) return;
      pids = r.provinces;
    }
    const id = foundState(s, data, this.ctx(), { pids, from: PLY, movement, why: 'proclama independência' });
    if (!id) return;
    const c = s.world.c[id], popM = pids.reduce((a, p) => a + (data.geo.prov[p].pop || 0), 0) / 1e6;
    c.troops = Math.max(5, popM * 3); c.equip = s.st.equipment * 0.55; c.ready = 55; c.stab = 50;
    const nb = [...playerNeighbors(s, data)].filter(x => s.partners[x] && x !== id && s.world.c[x] && !s.world.c[x].dep).sort((a, b) => s.partners[a].rel - s.partners[b].rel)[0];
    if (nb) { shiftRelAI(s, nb, id, 50); this.log(`${partnerName(s, data, nb)} declara simpatia pelo novo governo de ${s.world.ents[id].name}.`, 'warn'); }
    this.afterTerritory();
    this.pushIssue(separatistCard(s, data, id), { event: true });
  }

  // ---------- Diplomacia dinâmica ----------
  peaceOfferCard(id) {
    const s = this.s, w = s.wars.find(x => x.active && x.enemy === id);
    if (!w) return;
    const nm = partnerName(s, this.data, id);
    const losing = w.score < -20;
    this.pushIssue({ id: `dyn_peace_${id}_${this.day}`, dyn: true, cat: 'Guerra', title: `${nm} propõe paz`, desc: losing ? `${nm} oferece encerrar a guerra se ${s.nation.shortName} ceder as províncias que ocupa.` : `${nm} propõe um cessar-fogo nas linhas atuais e a troca de prisioneiros.`, context: `Placar de guerra: ${Math.round(w.score)}. Exaustão inimiga: ${Math.round(w.enemyExh)}.`, crisis: true, deadline: 7, default: 1,
      options: [{ text: losing ? 'Aceitar e ceder as províncias ocupadas.' : 'Aceitar o cessar-fogo.', hint: 'A guerra termina.', act: { type: 'peace', id, war: w.id, concede: losing } }, { text: 'Rejeitar e continuar lutando.', hint: 'A guerra continua.', rel: { [id]: -3 } }] }, { event: true });
  }
  siegeCard(w) {
    const s = this.s, nm = partnerName(s, this.data, w.enemy);
    this.notify('Capital sitiada', `Tropas de ${nm} cercam ${s.nation.capital}. Decida como reagir antes que a cidade caia.`);
    this.pushIssue({ id: `dyn_siege_${this.day}`, dyn: true, cat: 'Guerra', title: `Cerco a ${s.nation.capital}`, desc: `As forças de ${nm} chegaram aos subúrbios da capital. Os ministros discutem reforçar a defesa, evacuar o governo, negociar ou resistir até o fim.`, context: `Progresso do cerco: ${Math.round(w.mySiege?.p || 0)}%. Se a capital cair sem evacuação, há risco real de captura do governante.`, crisis: true, deadline: 7, default: 3,
      options: [
        { text: 'Reforçar a capital com todas as reservas.', hint: 'Custo alto; o cerco recua.', act: { type: 'siege', war: w.id, choice: 'reinforce' } },
        { text: 'Evacuar o governo para o interior.', hint: 'Garante a continuidade do governo; perde legitimidade.', act: { type: 'siege', war: w.id, choice: 'evacuate' } },
        { text: 'Negociar um cessar-fogo imediato.', hint: 'Pode exigir concessões.', act: { type: 'siege', war: w.id, choice: 'negotiate' } },
        { text: 'Resistir: o governante fica na capital.', hint: 'Moral alto; risco pessoal.', act: { type: 'siege', war: w.id, choice: 'resist' } }] }, { event: true });
  }
  siegeChoice(act) {
    const s = this.s, w = s.wars.find(x => x.id === act.war);
    if (!w) return;
    const c = this.ctx();
    if (act.choice === 'reinforce') { s.econ.treasury -= s.econ.gdp * 0.004; w.reinforce = 6; if (w.etarget) w.etarget.p = Math.max(0, w.etarget.p - 40); s.st.readiness = clamp(s.st.readiness + 5, 0, 100); }
    if (act.choice === 'evacuate') warAction(s, this.data, w, 'evacuate', c);
    if (act.choice === 'negotiate') proposeCeasefire(s, this.data, w, true, c);
    if (act.choice === 'resist') { s.st.legitimacy = clamp(s.st.legitimacy + 4, 0, 100); for (const g in s.groups) s.groups[g] = clamp(s.groups[g] + 2, 0, 100); }
    this.afterTerritory();
  }
  allyAttacked(w) {
    const s = this.s;
    const victims = w.b.filter(id => s.partners[id]?.pact || s.world.blocs.some(b => b.defense === 'collective' && b.members.includes(id)));
    if (!victims.length || s.wars.some(x => x.active)) return;
    const v = victims[0], nm = partnerName(s, this.data, v), ag = partnerName(s, this.data, w.a[0]);
    this.pushIssue({ id: `dyn_ally_${v}_${this.day}`, dyn: true, cat: 'Alianças', title: `${ag} atacou ${nm}`, desc: `${nm}, com quem ${s.nation.shortName} tem compromisso de defesa, foi atacado por ${ag} e pede que você cumpra o tratado.`, context: 'Honrar a aliança significa entrar na guerra; recusar abala sua credibilidade com todos os aliados.', crisis: true, deadline: 7, default: 1,
      options: [{ text: `Declarar guerra a ${ag}.`, hint: 'Cumpre o tratado.', act: { type: 'joinAllyWar', id: v, war: w.id, side: 'b' } }, { text: 'Enviar apenas armas e dinheiro.', hint: 'Meio-termo.', act: { type: 'refuseAllyWar', id: v, allies: [] }, now: { treasury: -0.2 }, rel: { [v]: 5 } }, { text: 'Recusar.', hint: 'Fica fora; aliados se ressentem.', act: { type: 'refuseAllyWar', id: v, allies: victims } }] }, { event: true });
  }
  joinAllyWar(warId, side) {
    const s = this.s, w = s.world.wars.find(x => x.id === warId);
    if (!w) return;
    const enemy = (side === 'b' ? w.a : w.b)[0];
    const pw = startWar(s, this.data, enemy, { aggressor: false, goal: 'defend' }, (t, k) => this.log(t, k));
    pw.allies.push(...(side === 'b' ? w.b : w.a));
  }

  // ---------- Ações do jogador ----------
  initiativeCost(id) { return this.s.econ.gdp * this.data.initById[id].cost / 100 * costMultiplier(this.s); }
  initiativeBlock(id) {
    const s = this.s, def = this.data.initById[id];
    if (s.initiatives[id]) return s.initiatives[id].status === 'building' ? 'Em construção' : 'Ativa';
    if (def.coast && !s.nation.coastal) return 'Exige litoral';
    for (const r of def.req || []) if (s.initiatives[r]?.status !== 'active') return 'Requer: ' + this.data.initById[r].name;
    if (investCash(s) < this.initiativeCost(id)) return 'Sem recursos (tesouro + carteira de investimentos)';
    return null;
  }
  buyInitiative(id) {
    const block = this.initiativeBlock(id);
    if (block) return { ok: false, msg: block };
    const s = this.s, cost = this.initiativeCost(id);
    payInvest(s, cost);
    s.initiatives[id] = { status: 'building', progress: 0, start: this.day, cost };
    s.counters.costPressure += 0.07;
    if (random() < s.st.corruption / 400) { s.econ.treasury -= cost * 0.15; this.log(`Superfaturamento descoberto em "${this.data.initById[id].name}": 15% extra perdidos.`, 'bad'); }
    this.log(`Iniciativa iniciada: ${this.data.initById[id].name}.`, 'decision');
    this.recalc(); this.save();
    return { ok: true, msg: 'Projeto iniciado.' };
  }
  cancelInitiative(id) { delete this.s.initiatives[id]; this.log(`Iniciativa encerrada: ${this.data.initById[id].name}.`, 'decision'); this.recalc(); this.save(); }
  setTax(v) { this.s.budget.tax = clamp(v, 5, 60); this.recalc(); }
  setSpend(k, v) { this.s.budget.spend[k] = clamp(v, 0, 15); this.recalc(); }
  setRegionInvest(id, v) { this.s.regions.find(r => r.id === id).invest = clamp(v, 0, 100); }
  setPolicy(id, lvl, { buy = false } = {}) {
    const s = this.s, pol = this.data.policies.find(p => p.id === id);
    s.counters.polCd ||= {};
    const cd = s.counters.polCd[id] || 0;
    if (cd > this.day) return { ok: false, msg: `Mudança recente; aguarde ${cd - this.day} dias.` };
    if (s.policies[id] === lvl) return { ok: false, msg: 'Já em vigor.' };
    const vote = s.pol ? lawVote(s, buy) : { ok: true };
    if (!vote.ok) return vote;
    notePolicyChange(s, this.data, id, s.policies[id], lvl);
    s.policies[id] = lvl;
    s.counters.polCd[id] = this.day + 20;
    s.st.stability = clamp(s.st.stability - 1.5, 0, 100);
    this.log(`Nova lei — ${pol.name}: ${pol.levels.find(l => l.id === lvl).name}.`, 'decision');
    s.decisions.push({ day: this.day, id: 'law_' + id, title: 'Lei: ' + pol.name, text: pol.levels.find(l => l.id === lvl).name });
    this.recalc(); this.save();
    return { ok: true, msg: 'Lei alterada.' };
  }
  rightsDeport(n) { return this.wrap(deport(this.s, this.data, n)); }
  rightsNaturalize(f) { return this.wrap(naturalize(this.s, this.data, f)); }
  rightsArrest(l) { return this.wrap(arrest(this.s, this.data, l)); }
  rightsBan(id) { return this.wrap(banParty(this.s, this.data, id)); }
  rightsUnban(id) { return this.wrap(unbanParty(this.s, this.data, id)); }
  rightsAmnesty(f, unban) { return this.wrap(amnesty(this.s, this.data, f, { unban })); }
  rightsCrush(r) { return this.wrap(crushRegion(this.s, this.data, r)); }
  rightsConcede(r) { return this.wrap(concedeRegion(this.s, this.data, r)); }
  rightsIcc(on) { return this.wrap(setIccRecognition(this.s, this.data, on)); }
  partnerAction(id, key) {
    const r = doPartnerAction(this.s, this.data, id, key);
    const M = { sanction: ['Nos impôs sanções', -12], grant: ['Nos deu uma doação', 6], cancelPact: ['Rompeu nosso tratado de defesa', -15], pact: ['Assinou um tratado de defesa conosco', 8], trade: ['Abriu comércio conosco', 3], break: ['Rompeu relações conosco', -20], infra: ['Financiou obras no nosso país', 6], aid: ['Nos ajudou numa crise', 6], cancelTrade: ['Cancelou nosso acordo comercial', -6] }[key];
    if (r.ok && M) remember(this.s, id, M[0], M[1]);
    return this.wrap(r);
  }
  summitEval(id, offer, ask) { return summitEval(this.s, id, offer, ask); }
  summit(id, offer, ask) { const ev = summitEval(this.s, id, offer, ask); if (!ev.accept) { this.s.partners[id].trust = Math.max(0, this.s.partners[id].trust - 2); return { ok: false, msg: ev.reply }; } summitApply(this.s, id, offer, ask); return this.wrap({ ok: true, msg: ev.reply, log: true }); }
  spy(id, op) { return this.wrap(spyAct(this.s, id, op)); }
  setResearch(id) { return this.wrap(setResearch(this.s, id)); }
  joinOrg(id) { return this.wrap(joinOrg(this.s, this.data, id)); }
  leaveOrg(id) {
    const b = this.s.world.blocs.find(x => x.id === id);
    if (b && b.leave === 'forbidden' && b.members[0] !== PLY) return { ok: false, msg: 'As regras do bloco proíbem a saída.' };
    if (b && b.members[0] === PLY) { this.s.world.blocs = this.s.world.blocs.filter(x => x !== b); delete this.s.orgs[id]; for (const m of b.members) if (this.s.partners[m]) this.s.partners[m].rel -= 10; return this.wrap({ ok: true, msg: `${b.name} foi dissolvido.`, log: true }); }
    return this.wrap(leaveOrg(this.s, this.data, id));
  }
  imfLoan() { return this.wrap(imfLoan(this.s)); }
  createBloc(spec) { const r = createBloc(this.s, this.data, spec); for (const x of r.results) this.log(x.msg, x.ok ? 'good' : 'info'); return this.wrap(r); }
  inviteToBloc(bid, id) { const b = this.s.world.blocs.find(x => x.id === bid); const r = inviteToBloc(this.s, this.data, b, id); return this.wrap({ ...r, log: r.ok }); }
  expelFromBloc(bid, id) { const b = this.s.world.blocs.find(x => x.id === bid); return this.wrap(expelFromBloc(this.s, this.data, b, id)); }
  crisisTick() { const s = this.s; s.nukeCrisis.weeks--; s.nukeCrisis.round = (s.nukeCrisis.round || 0) + 1; s.nukeCrisis.roundDay = this.day; if (!s.nukeCrisis.weeks) this.log('Três semanas depois do ataque, o país tenta voltar à vida normal.', 'info'); }
  // Após a destruição da capital, o jogador aponta no mapa a nova sede do governo.
  canBeCapital(pid) { const s = this.s; return provincesOf(s, this.data, PLY).includes(pid) && !s.world.occ[pid] && !(pid in (s.nuked || {})); }
  setCapital(pid) {
    const s = this.s;
    if (!this.canBeCapital(pid)) return { ok: false, msg: 'Escolha uma província sua, não ocupada e não atingida.' };
    s.nation.capitalProv = pid; s.nation.capital = this.data.geo.prov[pid].n;
    delete s.flags.needCapital;
    syncRegions(s, this.data, provincesOf(s, this.data, PLY));
    this.log(`O governo se instala em ${s.nation.capital}, a nova capital de ${s.nation.shortName}.`, 'decision');
    this.save();
    return { ok: true, msg: `${s.nation.capital} é a nova capital.` };
  }
  debugNuke(capital) { const r = nuclearStrike(this.s, this.data, rivalOfAny(this.s), this.ctx(), capital ? { prov: this.s.nation.capitalProv } : {}); if (this.s.over) this.finish(); this.save(); return r; }
  advisorAlerts() { return advisorAlerts(this.s); }
  // Questões menores (sem crise, sem desdobramento) são resolvidas pelo gabinete com a opção recomendada.
  autoDecideMinor() {
    const s = this.s;
    for (const p of [...s.issues.pending]) {
      const iss = this.getIssue(p.id);
      if (!iss || iss.crisis || p.chain || p.event || iss.cond?.nukeCrisis || p.day !== this.day) continue;
      const i = advisorPick(iss);
      this.answerIssue(p.id, i, { auto: true });
    }
  }
  pressAction(id, act) { return this.wrap(pressAction(this.s, id, act)); }
  // ---------- Forças ----------
  assignCorps(cid, wid, role) { return this.wrap(assign(this.s, cid, wid, role)); }
  recruitCorps() { return this.wrap(recruitCorps(this.s)); }
  buyNavy() { return this.wrap(buyNavy(this.s)); }
  buyAir() { return this.wrap(buyAir(this.s)); }
  replaceGeneral(cid) { return this.wrap(replaceGeneral(this.s, cid)); }
  airCampaign(wid) { return this.wrap(airCampaign(this.s, this.data, this.s.wars.find(w => w.id === wid))); }
  blockade(wid) { return this.wrap(blockade(this.s, this.data, this.s.wars.find(w => w.id === wid))); }
  peaceCandidates(wid) { return peaceCandidates(this.s, this.data, this.s.wars.find(w => w.id === wid)); }
  customPeace(wid, terms) { const r = customPeace(this.s, this.data, this.s.wars.find(w => w.id === wid), terms, this.ctx()); this.afterTerritory(); this.recalc(); this.save(); return r; }
  // ---------- Economia ativa ----------
  build(pid, type) { return this.wrap(startBuilding(this.s, this.data, pid, type)); }
  privatize(id) { const r = privatize(this.s, id); if (r.ok) noteEconChange(this.s, 'privatizar uma grande estatal sem debate', 1, 1); return this.wrap(r); }
  nationalize(id) { const r = nationalize(this.s, id); if (r.ok) noteEconChange(this.s, 'nacionalizar uma grande empresa por decreto', -1, 1); return this.wrap(r); }
  setFx(r) { const x = setFx(this.s, r); if (x.ok) noteEconChange(this.s, 'mudar o regime de câmbio de uma hora para outra', 0, 0.8); return this.wrap(x); }
  devalue() { const x = devalue(this.s); if (x.ok) noteEconChange(this.s, 'desvalorizar a moeda de surpresa', 0, 0.8); return this.wrap(x); }
  // Gabinete autônomo, conselheiros e financiamento
  setMandate(port, mode) { return this.wrap(setMandate(this.s, port, mode)); }
  macros() { return macrosOf(this.s); }
  saveMacro(m) { const r = saveMacro(this.s, m); this.save(); return r; }
  deleteMacro(id) { const r = deleteMacro(this.s, id); this.save(); return r; }
  setWarMacro(wid, mid) { const w = this.s.wars.find(x => x.id === wid); if (!w) return { ok: false, msg: '?' }; w.macro = mid || null; this.save(); return { ok: true, msg: mid ? 'Foco da ofensiva definido.' : 'Foco removido.' }; }
  // ---------- Legado e retorno ao poder ----------
  legacy() { return buildLegacy(this.s, this.data); }
  comebackInfo() { return comebackInfo(this.s); }
  tryComeback() {
    bindRng(this.s);
    const r = tryComeback(this.s, this.data, this.ctx());
    if (r.ok) { this.afterTerritory(); this.recalc(); this.log(r.text, 'good'); }
    this.save();
    return r;
  }
  govInit() { initGovernors(this.s, this.data); return this.s.gov; }
  setGovMode(mode) { const r = setGovMode(this.s, this.data, mode, this.ctx()); this.recalc(); this.save(); return this.wrap(r); }
  setGovAutonomy(rid, d) { return this.wrap(setAutonomy(this.s, rid, d)); }
  removeGovernor(rid) { const r = removeLeader(this.s, this.data, rid, 'decisão do governo central', this.ctx()); this.recalc(); this.save(); return this.wrap(r); }
  appointGovernor(rid) { const r = appointNew(this.s, this.data, rid); this.save(); return this.wrap(r); }
  fundGovWork(rid, type) { const r = fundWork(this.s, this.data, rid, type); this.recalc(); this.save(); return this.wrap(r); }
  advisorCandidates(role) { return advisorCandidates(this.s, role); }
  hireAdvisor(role, idx) { return this.wrap(hireAdvisor(this.s, role, idx)); }
  fireAdvisor(role) { return this.wrap(fireAdvisor(this.s, role)); }
  train(kind, key) { return this.wrap(train(this.s, kind, key)); }
  raiseFunds(source, pct) { return this.wrap(raiseFunds(this.s, source, pct)); }
  sectorInvest(key, pct) { return this.wrap(sectorInvest(this.s, key, pct)); }
  // ---------- Política ----------
  candidates(port) { return candidates(this.s, port); }
  appoint(port, idx) { return this.wrap(appoint(this.s, port, idx)); }
  amendConstitution(change) { return this.wrap(amendConstitution(this.s, change)); }
  leaderDies(cause) {
    const s = this.s, L = s.pol.leader;
    if (s.mode === 'dynasty' || L.heirReady) { const old = L.name; succeed(s, cause); this.log(`${old} morreu. ${s.nation.leader} assume o governo.`, 'bad'); this.notify('Morte do governante', `${old} morreu aos ${Math.floor(L.age)} anos. ${s.nation.leader} (${L.heir.rel}) assume o poder.`); return; }
    this.pushIssue({ id: `dyn_death_${this.day}`, dyn: true, crisis: true, cat: 'Governante', title: `${L.name} morreu`, desc: `${L.name} morreu aos ${Math.floor(L.age)} anos. O país está de luto, e o palácio, em disputa.`, context: `Herdeiro político: ${L.heir.name} (${L.heir.rel}).`, deadline: 3, default: 0,
      options: [{ text: `Continuar como ${L.heir.name}.`, hint: 'A partida segue com o sucessor; legitimidade cai.', act: { type: 'leader', choice: 'succeed', how: cause } }, { text: 'Encerrar a partida aqui.', hint: 'Fim da história deste governo.', act: { type: 'endgame', ending: 'death' } }] }, { event: true });
  }
  uprisingEnd(res) {
    const s = this.s, U = s.pol.uprising; if (!U) return;
    s.pol.uprising = null;
    s.issues.pending = s.issues.pending.filter(p => !String(p.id).startsWith('dyn_uprising'));
    if (res === 'win') {
      if (s.flags.fled) return endGame(s, 'exile', U.kind === 'coup' ? 'Fuga durante o golpe' : 'Fuga durante a revolução');
      if (U.kind === 'coup') return endGame(s, s.d.repression > 30 || chance(0.3) ? 'killed' : 'junta', `Golpe liderado por ${U.leader}`);
      return endGame(s, s.d.repression > 35 ? 'executed' : chance(0.5) ? 'trial' : 'exile', `Revolução liderada por ${U.leader}`);
    }
    if (res === 'crushed') {
      s.st.coupRisk = clamp(s.st.coupRisk - 30, 0, 100); s.st.revoRisk = clamp(s.st.revoRisk - 25, 0, 100); s.st.legitimacy = clamp(s.st.legitimacy + 5, 0, 100);
      this.log(U.kind === 'coup' ? `O golpe de ${U.leader} fracassou. Os conspiradores estão presos.` : `A revolução de ${U.leader} foi derrotada.`, 'good');
      this.notify('O governo resistiu', U.kind === 'coup' ? 'O golpe fracassou. Os quartéis voltaram à obediência, mas o medo ficou.' : 'O levante perdeu força e as ruas se esvaziaram. O ressentimento continua.');
      return;
    }
    this.civilWar(U);
  }
  // O país racha: as regiões rebeldes formam um Estado e começa a guerra pela reunificação.
  civilWar(U) {
    const s = this.s, data = this.data;
    const regs = s.regions.filter(r => !r.cap).sort((a, b) => (b.unrest + (b.sep || 0) * 30) - (a.unrest + (a.sep || 0) * 30));
    const take = []; let share = 0;
    for (const r of regs) { if (share > 0.45) break; take.push(r); share += r.popShare; }
    if (!take.length) return endGame(s, 'civilwar', 'Guerra civil');
    s.world.ents ||= {};
    const id = 'CIV' + (Object.keys(s.world.ents).length + 1);
    const pids = take.flatMap(r => r.provinces);
    const big = pids.reduce((b, p) => (data.geo.prov[p].pop || 0) > (data.geo.prov[b].pop || 0) ? p : b, pids[0]);
    const coup = U.kind === 'coup';
    const name = coup ? `Junta de Salvação Nacional (${data.geo.prov[big].n})` : `República Popular de ${data.geo.prov[big].n}`;
    const ax = s.nation.ideology?.axes || {};
    s.world.ents[id] = { id, name, nameEn: name, iso2: null, cat: 'partially_recognized', parent: null, capital: { name: data.geo.prov[big].n, prov: big }, recognition: `Lado rebelde da guerra civil de ${s.nation.shortName}`,
      profile: coup ? { liberty: 15, market: 50, religiosity: 40, align: 'N', milIntensity: 1.6, regime: 'auth', regimeName: 'Junta militar' } : { liberty: clamp(100 - (50 + (ax.auth || 0) / 2), 5, 95), market: clamp(50 - (ax.econ || 0) / 2, 5, 95), religiosity: 30, align: 'N', milIntensity: 1, regime: 'hybrid', regimeName: 'Governo revolucionário' },
      flag: { layout: coup ? 'h3' : 'diag', colors: coup ? ['#3d4a2a', '#111111', '#3d4a2a'] : ['#c8102e', '#111111', '#111111'], emblems: [{ type: coup ? 'swords' : 'star', color: '#f2c400', x: 0.5, y: 0.5, s: 0.45 }] }, regions: s.nation.regions, secededFrom: PLY };
    const popM = pids.reduce((a, p) => a + (data.geo.prov[p].pop || 0), 0) / 1e6;
    s.world.c[id] = { id, pop: 0, gdp: 0, troops: s.st.troops * share * (coup ? 0.9 : 0.5), equip: s.st.equipment * (coup ? 0.9 : 0.5), ready: 60, logi: 35, intel: 30, stab: 45, growth: 0, share: 1, dep: false, aggr: 80, nego: 25, mobil: true, debt: 30, capitalProv: big };
    s.partners[id] = { rel: -95, trust: 0, trade: false, pact: false, sanctionsOn: false, sanctionsBy: false, broken: true, cd: {} };
    transfer(s, data, pids, id);
    s.st.troops *= 1 - share * (coup ? 0.5 : 0.25);
    s.world.claims.push({ id: 'civ_' + id, claimant: PLY, holder: id, provs: [...pids], type: 'sovereignty', just: 'Reunificação do país após a guerra civil.', strat: 90, dom: 100, risk: 90, status: 'active', src: 'civilwar' });
    this.afterTerritory();
    const w = startWar(s, data, id, { aggressor: false, goal: 'annex' }, (t, k) => this.log(t, k));
    w.civil = true;
    s.flags.civilWar = 1;
    this.log(`GUERRA CIVIL: ${name} controla ${take.map(r => r.name).join(', ')}.`, 'war');
    this.notify('Guerra civil', `O país rachou. ${name} controla ${take.length} região(ões) com ${Math.round(share * 100)}% da população. Reconquiste o território na página Forças armadas.`);
  }
  setFlag(f) {
    const s = this.s;
    s.nation.flag = f;
    const heavy = (f.emblems || []).some(e => String(e.type).startsWith('f_') || ['skull', 'skullbones', 'skullhelm', 'skullswords', 'nuke', 'mushroom', 'noose', 'guillotine', 'devil', 'bones', 'gasmask', 'biohazard'].includes(e.type));
    s.st.legitimacy = clamp(s.st.legitimacy - 1, 0, 100);
    if (heavy) s.flags.heavyFlag = 1; else delete s.flags.heavyFlag;
    const TOTAL = ['swastika', 'swastikaL', 'sigrunes', 'wolfsangel', 'reichseagle', 'totenkopf', 'arrowcross', 'ironguard', 'ustase', 'blacksun', 'triskelionsw'];
    const total = (f.emblems || []).some(e => TOTAL.includes(e.type));
    if (total && !s.flags.totalFlag) {
      s.flags.totalFlag = 1; s.flags.heavyFlag = 1;
      s.st.reputation = clamp(s.st.reputation - 15, 0, 100);
      for (const id in s.partners) { const lib = this.data.reg[id]?.profile?.liberty ?? 50; s.partners[id].rel = clamp(s.partners[id].rel - (lib > 60 ? 18 : lib > 40 ? 8 : 3), -100, 100); }
      s.groups.youth = clamp(s.groups.youth - 6, 0, 100); s.groups.opposition = clamp(s.groups.opposition - 8, 0, 100); s.groups.military = clamp(s.groups.military + 2, 0, 100);
      s.longMods.push({ k: 'protest', v: 6, d: 180, left: 180, src: 'Bandeira com símbolos totalitários' }, { k: 'emigration', v: 1.5, d: 365, left: 365, src: 'Bandeira com símbolos totalitários' });
    } else if (!total) delete s.flags.totalFlag;
    if (heavy) { s.st.reputation = clamp(s.st.reputation - 4, 0, 100); s.groups.military = clamp(s.groups.military + 3, 0, 100); s.groups.youth = clamp(s.groups.youth - 2, 0, 100); }
    this.log(heavy ? 'Nova bandeira nacional com símbolos sombrios choca a imprensa estrangeira.' : 'Nova bandeira nacional hasteada em cerimônia oficial.', 'decision');
    this.save();
    return { ok: true, msg: 'Nova bandeira adotada.' };
  }
  covertOptions(id) { return covertOptions(this.s, this.data, id); }
  covert(id, key) { return this.wrap({ ...doCovert(this.s, this.data, id, key), log: true }); }
  inciteTargets(id) { return inciteTargets(this.s, this.data, id); }
  incite(id, target) { const r = incite(this.s, this.data, id, target, this.ctx()); return this.wrap(r); }
  startProgram(id) { return this.wrap(startProgram(this.s, id)); }
  cancelProgram(id) { return this.wrap(cancelProgram(this.s, id)); }
  nukeBlock() { return nukeProgramBlock(this.s); }
  startNuke() { return this.wrap(startNukeProgram(this.s)); }
  nuclearThreat(wid) { const w = this.s.wars.find(x => x.id === wid); const r = playerThreat(this.s, this.data, w, this.ctx()); if (this.s.over) { this.finish(); } return this.wrap(r); }
  milAction(key) { return this.wrap(milAction(this.s, key, (t, k) => this.log(t, k))); }
  canDeclare(id) { return canDeclareOn(this.s, this.data, id); }
  fabricatePretext(id) { return this.wrap(fabricatePretext(this.s, this.data, id)); }
  declareWar(id, goal, macro) {
    const b = canDeclareOn(this.s, this.data, id);
    if (b) return { ok: false, msg: b };
    startWar(this.s, this.data, id, { aggressor: true, goal, macro: macro || null }, (t, k) => this.log(t, k));
    remember(this.s, id, 'Nos invadiu', -30);
    this.recalc(); this.save();
    return { ok: true, msg: 'Guerra declarada.' };
  }
  warAction(wid, key) { const w = this.s.wars.find(x => x.id === wid); const r = warAction(this.s, this.data, w, key, this.ctx()); this.afterTerritory(); return this.wrap(r); }
  negotiate(wid, concede = false) {
    const s = this.s, w = s.wars.find(x => x.id === wid);
    if ((s.counters.negCd || 0) > this.day) return { ok: false, msg: 'Aguarde a resposta da última proposta.' };
    s.counters.negCd = this.day + 14;
    const ok = proposeCeasefire(s, this.data, w, concede, this.ctx());
    this.afterTerritory(); this.save();
    return { ok, msg: ok ? 'Acordo de paz assinado.' : 'Proposta rejeitada.' };
  }
  availableTerms(wid) { return availableTerms(this.s, this.data, this.s.wars.find(x => x.id === wid)); }
  terms(wid, key) { applyTerms(this.s, this.data, this.s.wars.find(x => x.id === wid), { key }, this.ctx()); this.afterTerritory(); this.recalc(); this.save(); }
  wrap(r) { if (r.log) this.log(r.msg, r.ok ? 'decision' : 'warn'); this.recalc(); this.save(); return r; }
  resign() { resign(this.s); this.finish(); }

  // ---------- Salvamento ----------
  key(slot) { return `${SAVE_KEY}.${slot}`; }
  serialize() {
    const W = this.s.world;
    const { _own, _nb, ...rest } = W;
    return JSON.stringify({ ...this.s, world: rest });
  }
  save(slot = 'auto') {
    if (!this.storage || !this.s) return false;
    try { this.s.savedAt = Date.now(); this.storage.setItem(this.key(slot), this.serialize()); return true; }
    catch (e) { console.warn('save failed', e); this.emit('saveError', e); return false; }
  }
  load(slot = 'auto') {
    try {
      const raw = this.storage?.getItem(this.key(slot));
      if (!raw) return false;
      const s = JSON.parse(raw);
      if (s.v !== SAVE_VERSION) return false;
      this.s = s;
      this.useWorld(s.world?.wscn || null);
      if (!s.nation.wregions) s.nation.wregions = wrOfIds((s.nation.components || []).map(c => c.id));
      if (s.rng == null) s.rng = (Math.random() * 4294967296) | 0;
      bindRng(s);
      s.nation.culture ||= playerCulture(s, this.data);
      if (!s.pol) initPolitics(s);
      initCabinet2(s);
      ensureRights(s, this.data);
      initMarkets(s);
      initForces(s);
      if (!s.press) initSociety(s, this.data);
      territoryChanged(s);
      dailyModel(s, this.data);
      this.recalc();
      if (slot !== 'auto') this.save();
      return true;
    } catch (e) { console.warn('load failed', e); return false; }
  }
  listSaves() {
    return ['auto', '1', '2', '3'].map(slot => {
      try {
        const raw = this.storage?.getItem(this.key(slot));
        if (!raw) return { slot, empty: true };
        const s = JSON.parse(raw);
        return { slot, v: s.v, name: s.nation?.shortName, leader: s.nation?.leader, day: Math.floor(s.time.min / 1440), savedAt: s.savedAt, over: !!s.over, ok: s.v === SAVE_VERSION };
      } catch { return { slot, empty: true }; }
    });
  }
  hasSave() { return this.listSaves().some(x => !x.empty && x.ok); }
  deleteSave(slot) { this.storage?.removeItem(this.key(slot)); }
  // ---------- Observatório (modo espectador) ----------
  initObserver() {
    const s = this.s, data = this.data;
    for (const id in s.partners) { const p = s.partners[id]; p.rel = 0; p.pact = false; p.trade = false; }
    s.settings.popupIssues = false; s.settings.autoPause = false;
    s.world.claims = s.world.claims.filter(c => c.holder !== PLY && c.claimant !== PLY);
    const owner = {}; for (const pid in data.geo.prov) { const o = ownerOf(s, data, pid); if (o !== data.geo.prov[pid].a3) owner[pid] = o; }
    s.world.obsStart = { day: this.day, owner, countries: Object.keys(s.world.c).filter(id => !s.world.c[id].dep), fam: {}, gdp: Object.values(s.world.c).filter(c => !c.dep).sort((a, b) => b.gdp - a.gdp).slice(0, 10).map(c => [c.id, c.gdp]), names: {} };
    for (const id of s.world.obsStart.countries) { s.world.obsStart.names[id] = this.data.reg[id]?.name || s.world.ents?.[id]?.name || id; }
    s.world.editions = [];
  }
  observerWeek() {
    const s = this.s;
    // O observador não governa: o país-fantasma nunca entra em crise.
    s.over = null; s.flags.needCapital = false; s.issues.pending = [];
    s.st.stability = 70; s.st.revoRisk = 5; s.st.coupRisk = 5; s.st.protest = 5; s.econ.treasury = Math.max(s.econ.treasury, 1);
    for (const id in s.partners) { const p = s.partners[id]; p.rel = 0; p.pact = false; }
  }
  labAct(act) { bindRng(this.s); const r = labAct(this.s, this.data, act, this.ctx()); computeMeters(this.s, this.data); this.afterTerritory(); this.save(); return r; }
  exportSave() { return this.serialize(); }
  importSave(txt) { const s = JSON.parse(txt); if (s.v !== SAVE_VERSION) throw new Error('Versão de save incompatível'); this.s = s; this.useWorld(s.world?.wscn || null); if (s.rng == null) s.rng = 1; bindRng(s); territoryChanged(s); this.recalc(); this.save(); }
  newCampaign() { this.s = null; this.useWorld(null, []); }
  wipe() { this.deleteSave('auto'); this.s = null; this.useWorld(null, []); }
}

export { debtRatio, endGame, PLY, orgDef };

installExtras(Game);
// Ascensão ao poder: enquanto o jogador lidera a oposição, quem governa é o regime atual —
// orçamento, leis, diplomacia, forças armadas e economia ficam fora do alcance dele.
export const ASCENT_LOCK_MSG = 'Você ainda não governa: conquiste o poder (eleição, golpe ou revolução) para comandar o país.';
for (const m of 'healthAct taxAct minAct rightsDeport rightsNaturalize rightsArrest rightsBan rightsUnban rightsAmnesty rightsCrush rightsConcede rightsIcc setMandate hireAdvisor fireAdvisor train raiseFunds sectorInvest covert incite startProgram cancelProgram startNuke nuclearThreat milAction declareWar warAction negotiate buyInitiative cancelInitiative setTax setSpend setRegionInvest setPolicy partnerAction summit spy setResearch joinOrg leaveOrg imfLoan createBloc inviteToBloc expelFromBloc joinAllyWar pressAction assignCorps recruitCorps buyNavy buyAir replaceGeneral airCampaign blockade customPeace build privatize nationalize setFx devalue appoint amendConstitution'.split(' ')) {
  const f = Game.prototype[m];
  if (f) Game.prototype[m] = function (...a) { if (this.s?.ascent) { this.notify?.('Na oposição', ASCENT_LOCK_MSG, 'warn'); return { ok: false, msg: ASCENT_LOCK_MSG }; } return f.apply(this, a); };
}
