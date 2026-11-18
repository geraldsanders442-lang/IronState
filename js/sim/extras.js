// Agregador dos módulos novos: ordem e êxodo, propaganda, vocações regionais, desenvolvimento e campanha.
import { weeklyOrder, orderPanelAct, ensureOrd } from './order.js';
import { weeklyPropaganda, propAct, propActExtra, deliverSpeech, ensureProp } from './propaganda.js';
import { weeklyVocations, ensureVoc } from './vocations.js';
import { weeklyDev, ensureDev, riskCheck } from './dev.js';
import { weeklyCampaign, campAct, ensureCamp } from './campaign.js';
import { ascAction } from './ascent2.js';
import { dipAct, treatyAct } from './wardip.js';
import { chiefAct, chiefPick, delegable, noteDecision, weeklyChief } from './chief.js';
import { weeklyShocks, shockAct } from './shocks.js';

export function weeklyExtras(s, data, ctx) {
  if (s.flags.micronation || s.ascent) return;
  ensureDev(s); ensureProp(s); ensureOrd(s); ensureCamp(s);
  for (const r of s.regions) ensureVoc(r, s);
  weeklyDev(s);
  weeklyOrder(s, data, ctx);
  weeklyPropaganda(s, data, ctx);
  weeklyVocations(s, data, ctx);
  weeklyCampaign(s, data, ctx);
  weeklyChief(s);
  weeklyShocks(s, data, ctx);
}

export function extraAct(s, data, act, ctx) {
  if (act.op === 'treaty') return treatyAct(s, data, act, ctx);
  if (act.op === 'shock') return shockAct(s, act);
  const reg = s.regions.find(r => r.id === act.id);
  if (reg && act.op.startsWith('aut')) {
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    switch (act.op) {
      case 'autGrant': reg.aut = clamp((reg.aut || 0) + 25, 0, 100); reg.sep = Math.max(0, (reg.sep || 0) - 0.01); reg.unrest = clamp(reg.unrest - 12, 0, 100); return `${reg.name} recebe um estatuto de autonomia.`;
      case 'autDeny': reg.unrest = clamp(reg.unrest + 8, 0, 100); reg.sep = (reg.sep || 0) + 0.004; return `O governo nega autonomia a ${reg.name}.`;
      case 'autPropaganda': { const P = ensureProp(s); P.goal = 'unity'; P.region = reg.id; P.pct = Math.max(P.pct, 0.3); return `Campanha de unidade nacional em ${reg.name}.`; }
      case 'autErase': { const P = ensureProp(s); P.goal = 'erase_nat'; P.region = reg.id; P.pct = Math.max(P.pct, 0.4); if (s.rights) s.rights.abuse = clamp(s.rights.abuse + 4, 0, 100); return `Campanha para apagar o nacionalismo regional em ${reg.name}.`; }
    }
  }
  return propActExtra(s, data, act) || '';
}

// Métodos do jogo (UI -> simulação)
export function installExtras(Game) {
  const P = Game.prototype;
  P.orderAct = function (op, arg) { return this.wrap(orderPanelAct(this.s, this.data, op, arg)); };
  P.propAct = function (op, arg) { return this.wrap(propAct(this.s, this.data, op, arg)); };
  P.giveSpeech = function (sp) { const r = deliverSpeech(this.s, this.data, sp, this.ctx()); return this.wrap(r); };
  P.ascAct = function (op, arg) { return this.wrap(ascAction(this.s, this.data, op, arg)); };
  P.dipAct = function (op, arg) { return this.wrap(dipAct(this.s, this.data, op, arg, this.ctx())); };
  P.chiefAct = function (op, arg) { return this.wrap(chiefAct(this.s, this.data, op, arg)); };
  // O chefe de gabinete decide as questões delegadas.
  P.chiefDecide = function () {
    const s = this.s; if (!s.chief?.on || !s.chief.chief) return 0; let n = 0;
    for (const p of [...s.issues.pending]) {
      const iss = this.getIssue(p.id); if (!delegable(s, iss, p)) continue;
      const d = chiefPick(s, iss); noteDecision(s, iss, d.idx, d.reason); this.answerIssue(p.id, d.idx, { auto: true }); n++;
    }
    return n;
  };
  P.campAct = function (op, arg) { return this.wrap(campAct(this.s, this.data, op, arg)); };
  // Reformas com risco: troca a opção por seu resultado de fracasso, se o dado cair mal.
  P.riskOpt = function (opt) {
    if (!opt.risk) return opt;
    const r = riskCheck(this.s, opt.risk);
    if (!r.fail) return opt.risk.okNext ? { ...opt, next: [...(opt.next || []), ...opt.risk.okNext] } : opt;
    this.log(opt.risk.text || 'A reforma fracassou: o país ainda não tinha estrutura para sustentá-la.', 'bad');
    return { ...opt, ...opt.risk.fail, risk: null, next: opt.risk.failNext || [] };
  };
}
