// Campanha: versão reduzida de um wargame de grande estratégia (inspirado em Strategy & Tactics: WWII).
// Um único recurso (suprimentos), pontos de ciência com melhorias, ordens por frente, medalhas por objetivos
// e três modos de comando: automático, estrategista ou general/conselheiro.
import { clamp, rand, chance } from './util.js';

const day = s => Math.floor(s.time.min / 1440);

export const UPGRADES = {
  infantry: ['Infantaria', 'users', '+4% de poder de combate por nível.'],
  armor: ['Blindados', 'truck', '+5% ao atacar e flanquear por nível.'],
  artillery: ['Artilharia', 'target', '+5% contra posições fortificadas por nível.'],
  air: ['Força aérea', 'plane', '+4% de supremacia aérea por nível.'],
  logistics: ['Logística', 'package', '+12% de suprimentos por nível.'],
  medicine: ['Medicina de campanha', 'heart-pulse', '-8% de baixas por nível.'],
  intel: ['Inteligência', 'eye', 'Revela a postura do inimigo e reduz a variação dos flancos.'],
};
export const TACTICS = {
  assault: ['Assalto frontal', 'swords', 'Rápido e caro: +25% de avanço, +35% de baixas. Ruim contra inimigo entrincheirado.'],
  flank: ['Flanqueamento', 'move-up-right', 'Depende de blindados e de sorte: avanço variável, baixas normais. Ótimo contra inimigo em surto.'],
  siege: ['Cerco e desgaste', 'ring', 'Lento, mas poupa tropas e esgota o inimigo a cada semana.'],
};
export const DEFENSE = {
  hold: ['Manter a linha', 'shield', '+10% de defesa; baixas normais.'],
  elastic: ['Defesa elástica', 'waves', '-5% de defesa, mas -25% de baixas.'],
  counter: ['Contra-ataque', 'zap', '-10% de defesa, +30% de baixas; esgota o inimigo.'],
};
export const PLANS = {
  balanced: ['Equilibrado', 'scale', 'Sem viés: generais executam por conta própria.'],
  capital: ['Golpe na capital', 'crown', '+8% de avanço, +15% de baixas; prioriza a capital inimiga.'],
  attrition: ['Guerra de desgaste', 'hourglass', '-10% de avanço, -20% de baixas; o inimigo se esgota.'],
  defense: ['Defesa em profundidade', 'castle', '+15% de defesa, -20% de avanço.'],
};

// Quem está ganhando? Índice de -100 (derrota) a +100 (vitória) com os fatores que o compõem.
export function warStanding(s, data, w) {
  const occ = s.world.occ, gained = (w.gained || []).filter(p => occ[p] === 'PLY').length, lost = (w.lost || []).filter(p => occ[p] === w.enemy).length;
  const rep = (w.reports || []).slice(0, 8);
  const mom = rep.reduce((a, r) => a + (r.side === 'atk' ? r.dp : -r.dp), 0);
  const parts = [
    ['Placar de guerra', clamp((w.score || 0) * 0.35, -35, 35)],
    ['Território', clamp((gained - lost) * 6, -24, 24)],
    ['Momentum (últimas semanas)', clamp(mom * 0.5, -18, 18)],
    ['Razão de forças', clamp(Math.log2(Math.max(0.05, w.ratio || 1)) * 7, -18, 18)],
    ['Baixas', clamp(((w.enemyCas || 0) - (w.cas || 0)) / Math.max(1, (w.cas || 0) + (w.enemyCas || 0)) * 15, -15, 15)],
    ['Desgaste', clamp(((w.enemyExh || 0) - (s.st.warWeariness || 0)) * 0.2, -12, 12)],
  ];
  const total = clamp(parts.reduce((a, p) => a + p[1], 0), -100, 100);
  const verdict = total > 45 ? ['Vencendo com folga', 'good'] : total > 15 ? ['Vencendo', 'good'] : total > -15 ? ['Equilibrado', 'warn'] : total > -45 ? ['Perdendo', 'bad'] : ['À beira da derrota', 'bad'];
  return { total, parts, verdict: verdict[0], tone: verdict[1], gained, lost };
}
// Conselheiro de guerra: sugestões curtas conforme a situação.
export function warAdvice(s, data, w) {
  const out = [], r = w.ratio || 1, K = s.camp, st = warStanding(s, data, w);
  if (!w.target && !w.etarget && w.stance === 'offensive') out.push(['alert', 'Não há frente terrestre: você precisa de fronteira ou projeção externa (≥ 12; hoje ' + Math.round(s.st.projection) + ') para atacar. Invista em marinha ou apoie aliados.']);
  if (r < 0.5 && w.stance === 'offensive') out.push(['shield', 'Você está em grande desvantagem (' + r.toFixed(2) + '×): mude para Defensiva, peça trégua e busque ajuda externa.']);
  if (r > 2 && w.stance !== 'offensive' && w.target !== null) out.push(['swords', 'Você tem superioridade (' + r.toFixed(2) + '×): considere passar à Ofensiva.']);
  if (K && K.supply < 3) out.push(['package', 'Suprimentos baixos: reduza a parte da produção para ciência.']);
  if (st.total < -45) out.push(['scale', 'Derrota iminente: negocie um tratado antes de perder mais território.']);
  if ((s.rights?.warCrimes || 0) > 6) out.push(['skull', 'Crimes de guerra acumulados: arrisque menos civis ou a ONU vai intervir.']);
  if (st.total > 45 && !w.pendingTerms) out.push(['crown', 'Você está vencendo: é um bom momento para propor um tratado favorável.']);
  return out.slice(0, 3);
}

export function ensureCamp(s) {
  if (s.camp) return s.camp;
  s.camp = { supply: 8, sci: 0, alloc: 20, up: Object.fromEntries(Object.keys(UPGRADES).map(k => [k, 0])), medals: 0, spent: 0, log: [] };
  return s.camp;
}
export const upCost = lvl => 6 + lvl * 6;
const lv = (s, k) => s.camp?.up?.[k] || 0;

export function ensureCmd(w) {
  w.cmd ||= { mode: 'auto', plan: 'balanced', orders: { target: 'assault', target2: 'flank', def: 'hold' }, obj: null };
  return w.cmd;
}

// Multiplicadores usados pelo motor de guerra (war.js) a cada semana.
export function commandMods(s, data, w, pure = false) {
  const K = s.camp; if (!K) return { atk: 1, def: 1, loss: 1, front: () => 1 };
  const c = ensureCmd(w);
  let atk = 1 + lv(s, 'infantry') * 0.04, def = 1 + lv(s, 'infantry') * 0.02 + lv(s, 'artillery') * 0.02, loss = 1 - lv(s, 'medicine') * 0.08;
  const air = lv(s, 'air') * 0.04; atk *= 1 + air; def *= 1 + air * 0.5;
  def *= 1 + (w.guer || 0) / 450; // a resistência nas terras ocupadas fortalece a defesa
  const arm = 1 + lv(s, 'armor') * 0.05, art = 1 + lv(s, 'artillery') * 0.05;
  const ent = w.estance === 'entrenched', surge = w.estance === 'surge';
  let frontMul = () => art;
  if (c.mode === 'strategist') {
    const p = c.plan;
    if (p === 'capital') { atk *= 1.08; loss *= 1.15; }
    if (p === 'attrition') { atk *= 0.9; loss *= 0.8; if (!pure) w.enemyExh = Math.min(100, w.enemyExh + 0.5); }
    if (p === 'defense') { def *= 1.15; atk *= 0.8; }
    const gens = (s.forces?.corps || []).filter(x => x.war === w.id).map(x => x.gen?.skill || 50);
    if (gens.length) atk *= 0.94 + (gens.reduce((a, b) => a + b, 0) / gens.length) / 800;
  } else if (c.mode === 'general') {
    const noise = lv(s, 'intel') >= 2 ? 0.12 : 0.25;
    frontMul = key => {
      const t = c.orders[key] || 'assault';
      if (t === 'assault') return art * 1.25 * (ent ? 0.8 : 1);
      if (t === 'flank') return arm * (1.05 + (pure ? 0 : rand(-noise, noise)) + (surge ? 0.15 : 0)) * (ent ? 1.05 : 1);
      return art * 0.82;
    };
    const tt = [c.orders.target, w.target2 ? c.orders.target2 : null].filter(Boolean);
    for (const t of tt) { if (t === 'assault') loss *= 1.2; if (t === 'siege') { loss *= 0.88; if (!pure) w.enemyExh = Math.min(100, w.enemyExh + 0.5); } }
    const d = c.orders.def;
    if (d === 'hold') def *= 1.1; if (d === 'elastic') { def *= 0.95; loss *= 0.85; } if (d === 'counter') { def *= 0.9; loss *= 1.15; if (!pure) w.enemyExh = Math.min(100, w.enemyExh + 0.8); }
    atk *= 1.03; // atenção pessoal do comandante
  }
  return { atk, def, loss: Math.max(0.3, loss), front: frontMul };
}

// Objetivos / medalhas
export function objectivesOf(s, data, w) {
  const c = ensureCmd(w);
  c.start ??= day(s);
  if (!c.obj) c.obj = [
    { id: 'cap', text: 'Capturar a capital inimiga', done: false },
    { id: 'fast', text: 'Vencer em até 40 semanas', done: false },
    { id: 'light', text: 'Perder menos de 3% da tropa inicial', done: false, start: s.st.troops },
  ];
  return c.obj;
}

function medal(s, o, ctx) { o.done = true; const K = s.camp; K.medals++; K.sci += 6; s.st.legitimacy = clamp(s.st.legitimacy + 1.5, 0, 100); ctx?.news?.(`Medalha de campanha: ${o.text}.`, 'good'); }
// Chamado quando a guerra termina com vitória.
export function settleMedals(s, data, w, ctx) {
  if (!s.camp || !w.cmd?.obj) return;
  for (const o of w.cmd.obj) {
    if (o.done) continue;
    if (o.id === 'fast' && (day(s) - w.cmd.start) / 7 <= 40) medal(s, o, ctx);
    if (o.id === 'light' && (w.cas || 0) < o.start * 0.03) medal(s, o, ctx);
  }
}

// Renda semanal de suprimentos e seus fatores (para a mesa de operações).
export function supplyIncome(s) {
  const wars = s.wars.filter(w => w.active), d = day(s);
  const prov = wars.reduce((t, w) => t + (w.gained?.length || 0), 0);
  const base = 1.4 + Math.sqrt(Math.max(0.1, s.econ.gdp)) * 0.07 * (0.5 + s.st.industry / 100) + prov * 0.2;
  const parts = [['Base industrial', 1]];
  let m = 1 + lv(s, 'logistics') * 0.12; if (lv(s, 'logistics')) parts.push(['Logística pesquisada', 1 + lv(s, 'logistics') * 0.12]);
  let rail = 0, port = 0; for (const pid in s.buildings || {}) for (const b of s.buildings[pid]) { if (b.done > d) continue; if (b.type === 'railway') rail++; if (b.type === 'port') port++; }
  if (rail) { const f = 1 + Math.min(0.3, rail * 0.06); m *= f; parts.push([rail + ' ferrovia(s)', f]); }
  if (port) { const f = 1 + Math.min(0.2, port * 0.04); m *= f; parts.push([port + ' porto(s)', f]); }
  const mo = new Date(Date.UTC(2030, 0, 1) + d * 86400000).getUTCMonth(), winter = mo === 11 || mo <= 1, cold = !!s.nation._cold?.v;
  if (winter && cold) { m *= 0.75; parts.push(['Inverno rigoroso', 0.75]); } else if (winter) { m *= 0.92; parts.push(['Inverno', 0.92]); }
  if (s.st.logistics < 30) { m *= 0.9; parts.push(['Logística fraca', 0.9]); }
  return { inc: base * m * (wars.length ? 1 : 0.4), parts };
}
export function weeklyCampaign(s, data, ctx) {
  const K = ensureCamp(s), d = day(s);
  const wars = s.wars.filter(w => w.active);
  const inc = supplyIncome(s).inc;
  K.supply = clamp(K.supply + inc * (1 - K.alloc / 100), 0, 120);
  K.sci = clamp(K.sci + inc * (K.alloc / 100) * 0.6, 0, 200);
  for (const w of wars) {
    const objs = objectivesOf(s, data, w);
    for (const o of objs) {
      if (o.done || o.id !== 'cap') continue;
      if (w.log?.some(l => /capital/i.test(l.text) && /tomam|caiu/i.test(l.text))) medal(s, o, ctx);
    }
  }
}

// Ações do jogador
import { asymAct } from './asym.js';
export function campAct(s, data, op, arg) {
  if (['resist', 'sanctions', 'aid', 'withdraw'].includes(op)) return asymAct(s, data, op, arg);
  const K = ensureCamp(s), w = s.wars.find(x => x.active && x.id === arg?.war) || s.wars.find(x => x.active);
  switch (op) {
    case 'mode': if (!w) return { ok: false, msg: 'Sem guerra ativa.' }; ensureCmd(w).mode = arg.mode; return { ok: true, log: true, msg: `Comando: ${{ auto: 'automático', strategist: 'estrategista de guerra', general: 'general e conselheiro' }[arg.mode]}.` };
    case 'plan': if (!w) return { ok: false, msg: '' }; ensureCmd(w).plan = arg.plan; return { ok: true, log: true, msg: `Plano de guerra: ${PLANS[arg.plan][0]}.` };
    case 'order': if (!w) return { ok: false, msg: '' }; ensureCmd(w).orders[arg.front] = arg.tactic; return { ok: true, msg: '' };
    case 'alloc': K.alloc = clamp(+arg.v, 0, 100); return { ok: true, msg: '' };
    case 'upgrade': { const l = K.up[arg.k] || 0, c = upCost(l); if (l >= 3) return { ok: false, msg: 'Nível máximo.' }; if (K.sci < c) return { ok: false, msg: `Faltam pontos de ciência (${c}).` }; K.sci -= c; K.up[arg.k] = l + 1; return { ok: true, log: true, msg: `Pesquisa concluída: ${UPGRADES[arg.k][0]} nível ${l + 1}.` }; }
    case 'reinforce': if (!w) return { ok: false, msg: '' }; if (K.supply < 3) return { ok: false, msg: 'Faltam suprimentos (3).' }; K.supply -= 3; w.reinforce = 6; return { ok: true, log: true, msg: 'Reforços e munição enviados à frente.' };
    case 'airstrike': { if (!w) return { ok: false, msg: '' }; if (K.supply < 4) return { ok: false, msg: 'Faltam suprimentos (4).' }; const T = w.target; if (!T) return { ok: false, msg: 'Sem alvo de ofensiva.' }; K.supply -= 4; T.p = clamp(T.p + 8 + lv(s, 'air') * 2, 0, 99); w.enemyExh = Math.min(100, w.enemyExh + 2); return { ok: true, log: true, msg: 'Bombardeio aéreo sobre o alvo principal.' }; }
    case 'fortify': if (!w) return { ok: false, msg: '' }; if (K.supply < 3) return { ok: false, msg: 'Faltam suprimentos (3).' }; K.supply -= 3; s.st.defense = clamp(s.st.defense + 1.5, 0, 100); return { ok: true, log: true, msg: 'Linhas fortificadas.' };
  }
  return { ok: false, msg: '' };
}
