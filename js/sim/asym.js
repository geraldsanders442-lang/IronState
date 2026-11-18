// Assimetria (fase 4): resistência/guerrilha em províncias perdidas, sanções ao agressor, ajuda estrangeira por pedido,
// recuo estratégico e simpatia internacional. Dá ferramentas a quem está em desvantagem.
import { clamp, chance, rand } from './util.js';
import { PLY, territoryChanged } from './world.js';

const day = s => Math.floor(s.time.min / 1440);
const st = (s, k, v) => { s.st[k] = clamp((s.st[k] ?? 0) + v, 0, 100); };

export function ensureAsym(w) { w.guer ??= 0; w.sanc ??= 0; w.sym ??= 40; w.acd ||= {}; return w; }
export const lostOccupied = (s, w) => (w.lost || []).filter(p => s.world.occ[p] === w.enemy);
export const isUnder = w => (w.ratio || 1) < 0.95 || !w.aggressor;

export function weeklyAsym(s, data, w, ctx) {
  ensureAsym(w);
  const E = s.world.c[w.enemy], lost = lostOccupied(s, w), d = day(s);
  // Simpatia internacional: vítimas ganham; agressores e quem comete crimes de guerra perdem.
  w.sym = clamp(w.sym + (w.aggressor ? -0.3 : 0.35) - (s.rights?.warCrimes || 0) * 0.04, 0, 100);
  // Resistência
  w.guer = clamp(w.guer + lost.length * 0.5 - (lost.length ? 0.8 : 1.5), 0, 100);
  if (w.guer > 20 && E) {
    E.troops = Math.max(1, E.troops * (1 - 0.0003 * w.guer / 20));
    w.enemyExh = Math.min(100, w.enemyExh + w.guer * 0.004);
    if (chance(w.guer / 700)) { w.sym = clamp(w.sym + 2, 0, 100); st(s, 'reputation', 0.3); ctx.news('Represálias do ocupante contra civis alimentam a resistência e chocam o mundo.', 'info'); w.guer = clamp(w.guer + 3, 0, 100); }
    if (w.guer > 65 && lost.length && chance(0.08)) {
      const pid = lost[Math.floor(rand(0, lost.length))]; delete s.world.occ[pid]; territoryChanged(s); w.lost = w.lost.filter(x => x !== pid); w.guer = clamp(w.guer - 15, 0, 100);
      w.log.unshift({ day: d, text: `A resistência liberta ${data.geo.prov[pid].n}.` }); ctx.news(`A resistência liberta ${data.geo.prov[pid].n}.`, 'good');
    }
  }
  // Sanções ao agressor
  if (w.sanc > 0 && E) {
    E.stab = clamp(E.stab - 0.25 * w.sanc, 5, 95); E.gdp *= 1 - 0.0006 * w.sanc; w.enemyExh = Math.min(100, w.enemyExh + 0.35 * w.sanc);
    if (w.sym < 25 && chance(0.05)) { w.sanc = Math.max(0, w.sanc - 1); ctx.news('Parte dos países recua e afrouxa as sanções ao agressor.', 'warn'); }
  }
  // Ajuda espontânea quando se é a vítima e o mundo simpatiza
  if (!w.aggressor && w.sym > 55 && chance(0.12) && s.camp) { s.camp.supply = clamp(s.camp.supply + 4, 0, 120); st(s, 'equipment', 0.4); ctx.news('Países amigos enviam armas e munição, movidos pela simpatia internacional.', 'good'); }
}

export function asymAct(s, data, op, arg) {
  const w = s.wars.find(x => x.active && x.id === arg?.war) || s.wars.find(x => x.active); if (!w) return { ok: false, msg: 'Sem guerra ativa.' };
  ensureAsym(w); const K = s.camp, d = day(s), wait = k => Math.max(0, Math.ceil(((w.acd[k] || 0) - d) / 7)), lost = lostOccupied(s, w);
  switch (op) {
    case 'resist': {
      if (!lost.length && w.guer <= 0) return { ok: false, msg: 'Não há províncias ocupadas onde organizar resistência.' };
      if (!K || K.supply < 3) return { ok: false, msg: 'Faltam suprimentos (3).' };
      K.supply -= 3; w.guer = clamp(w.guer + 14, 0, 100);
      if (chance(0.3)) { w.sym = clamp(w.sym + 1.5, 0, 100); return { ok: true, log: true, msg: 'Armas e instrutores chegam à resistência; o ocupante reage com represálias.' }; }
      return { ok: true, log: true, msg: 'Células de resistência são armadas nas províncias ocupadas.' };
    }
    case 'sanctions': {
      if (wait('sanc')) return { ok: false, msg: `Aguarde ${wait('sanc')} semana(s).` };
      w.acd.sanc = d + 28;
      const friends = Object.values(s.partners).filter(p => p.rel > 25).length;
      if (chance(clamp(w.sym / 100 + friends * 0.03 - (w.aggressor ? 0.35 : 0), 0.1, 0.9))) { w.sanc = Math.min(3, w.sanc + 1); return { ok: true, log: true, msg: `Sanções ao agressor ampliadas (nível ${w.sanc}).` }; }
      return { ok: false, msg: 'O pedido de sanções é barrado por vetos e interesses comerciais.' };
    }
    case 'aid': {
      if (wait('aid')) return { ok: false, msg: `Aguarde ${wait('aid')} semana(s).` };
      w.acd.aid = d + 21;
      const best = Object.entries(s.partners).filter(([id, p]) => p.rel > 15 && s.world.c[id] && !s.world.c[id].dep && id !== w.enemy).sort((a, b) => b[1].rel - a[1].rel)[0];
      if (!best) return { ok: false, msg: 'Nenhum país amigo pode ajudar agora.' };
      if (chance(clamp(best[1].rel / 100 + w.sym / 220, 0.15, 0.9))) { if (K) K.supply = clamp(K.supply + 7, 0, 120); st(s, 'equipment', 1); s.partners[best[0]].rel -= 2; return { ok: true, log: true, msg: 'Um país amigo envia armas e munição.' }; }
      return { ok: false, msg: 'O pedido de ajuda é recusado por temor de retaliação.' };
    }
    case 'withdraw': {
      if (wait('wd')) return { ok: false, msg: `Aguarde ${wait('wd')} semana(s).` };
      if (!w.etarget) return { ok: false, msg: 'Não há frente ameaçada para recuar.' };
      w.acd.wd = d + 28; w.etarget.p = 0; w.enemyExh = Math.min(100, w.enemyExh + 6);
      for (const c of (s.forces?.corps || [])) if (c.war === w.id) c.strength = clamp(c.strength - 3, 5, 100);
      s.econ.gdp *= 0.9985; st(s, 'warWeariness', 1);
      return { ok: true, log: true, msg: 'Recuo estratégico: você cede espaço, ganha tempo e desgasta o inimigo.' };
    }
  }
  return { ok: false, msg: '' };
}
