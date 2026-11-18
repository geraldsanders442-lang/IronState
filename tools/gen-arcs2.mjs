// Gera arcos de questões (2-4 partes) a partir de tools/arcs2/*.mjs -> data/issues_depth.json
// Arquivo: export const PREFIX, CAT, ARCS = [{ id, cond, role, spec, sched, w, parts:[{t,d,o:[[texto, 'X' | {efeitos}]]}] }]
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const U = f => new URL(f, import.meta.url);
const hash = str => { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; };
const ARCH = {
  F: R => ({ hint: 'Firmeza: apoio interno e militares; a relação esfria.', now: { legitimacy: 2, defense: 1, reputation: -1 }, groups: { military: 2 }, ...(R && { rel: { [R]: -6 } }) }),
  D: R => ({ hint: 'Diplomacia: melhora a imagem; custa algum capital político.', now: { reputation: 2, treasury: -0.05, legitimacy: -0.5 }, ...(R && { rel: { [R]: 7 } }) }),
  S: () => ({ hint: 'Gasto popular: ganha apoio, custa o caixa.', now: { treasury: -0.3, qol: 1, legitimacy: 2 }, groups: { workers: 2, youth: 1 } }),
  R: () => ({ hint: 'Repressão: o controle sobe e as liberdades caem.', now: { control: 2, civil: -2, political: -2, legitimacy: 1, protest: -2 }, groups: { opposition: -3 } }),
  M: () => ({ hint: 'Mercado e abertura: cresce a economia, a base operária reclama.', now: { growth: 0.2, corruption: -1 }, groups: { business: 3, workers: -1 } }),
  P: () => ({ hint: 'Planejamento estatal: mais eficiência, menos iniciativa privada.', now: { treasury: -0.15, efficiency: 1 }, groups: { bureaucracy: 3, business: -2 } }),
  C: R => ({ hint: 'Concessão: acalma a pressão, parece fraqueza.', now: { legitimacy: -2, stability: -1, reputation: 1 }, groups: { military: -2 }, ...(R && { rel: { [R]: 10 } }) }),
  I: () => ({ hint: 'Deixar passar: sem custo agora, o problema cresce.', now: { legitimacy: -1, stability: -1 }, groups: { opposition: 1 } }),
  T: () => ({ hint: 'Operação discreta: vantagem com risco de escândalo.', now: { intel: 2, treasury: -0.1, reputation: -1 }, groups: { military: 1 } }),
  A: () => ({ hint: 'Ajuda externa: entra dinheiro, cresce a dependência.', now: { treasury: 0.3, influence: -1, reputation: -1 } }),
  W: () => ({ hint: 'Mobilização: o exército se prepara, o caixa sofre.', now: { readiness: 2, treasury: -0.2, projection: 1 }, groups: { military: 3 } }),
  E: () => ({ hint: 'Reforma e abertura: a juventude comemora, o aparato teme.', now: { political: 3, civil: 2, legitimacy: 1 }, groups: { youth: 3, opposition: 2, bureaucracy: -2 } }),
  N: () => ({ hint: 'Controle e expurgo: menos corrupção, mais medo.', now: { control: 2, corruption: -2, stability: -1 }, groups: { business: -3, bureaucracy: 1 } }),
  G: () => ({ hint: 'Investimento de longo prazo: caro hoje, rende depois.', now: { treasury: -0.3 }, long: [{ k: 'growth', v: 0.12, d: 120 }], groups: { business: 2, workers: 1 } }),
  X: () => ({ hint: 'Medida social/ecológica: custo e simpatia dos jovens.', now: { treasury: -0.2, pollution: -2, reputation: 1 }, groups: { youth: 3, business: -2 } }),
  B: () => ({ hint: 'Barganha: compra lealdades com dinheiro e favores.', now: { treasury: -0.15, corruption: 1, stability: 1 }, groups: { regional: 2, bureaucracy: 1 } }),
  H: () => ({ hint: 'Apelo à tradição: coesão e tensão com progressistas.', now: { legitimacy: 2, stability: 1 }, groups: { rural: 3, youth: -3 } }),
  V: () => ({ hint: 'Punição ou boicote: custo comercial.', now: { growth: -0.1, legitimacy: 1 }, groups: { business: -2, military: 1 } }),
  L: () => ({ hint: 'Censura: silencia o problema e piora a imagem.', now: { civil: -3, political: -2, reputation: -2, stability: 1 }, groups: { youth: -3, opposition: -2 } }),
  K: () => ({ hint: 'Ofensiva contra o grupo armado: risco de baixas civis.', act: { type: 'armed', op: 'crush' }, now: { treasury: -0.2 }, groups: { military: 2 } }),
  Y: () => ({ hint: 'Negociação com o grupo armado: enfraquece-o, custa capital político.', act: { type: 'armed', op: 'negotiate' }, now: { legitimacy: -0.5 } }),
  Z: () => ({ hint: 'Anistia: desmobiliza o grupo e irrita os militares.', act: { type: 'armed', op: 'amnesty' }, groups: { military: -2 } }),
  Q: () => ({ hint: 'Cooptação: cargos e dinheiro para o grupo.', act: { type: 'armed', op: 'coopt' }, now: { corruption: 1 } }),
  J: () => ({ hint: 'Integração às forças armadas: grupo some, mas o risco de golpe cresce.', act: { type: 'armed', op: 'integrate' } }),
  U: () => ({ hint: 'Aceitar a missão de paz da ONU: perde soberania, ganha imagem.', act: { type: 'peaceKeep', op: 'accept' } }),
  O: () => ({ hint: 'Recusar e desafiar a ONU: orgulho nacional e isolamento.', act: { type: 'peaceKeep', op: 'refuse' }, now: { legitimacy: 1 } }),
  '1': () => ({ hint: 'Julgar oficiais acusados: custo com militares, ganho de imagem.', act: { type: 'peaceKeep', op: 'trial' } }),
  '2': () => ({ hint: 'Esconder os fatos: arrisca escândalo maior.', act: { type: 'peaceKeep', op: 'hide' }, now: { reputation: -1 } }),
};
const tweak = (obj, k) => { const f = 0.8 + hash(k) * 0.5, r = n => +(n * f).toFixed(Math.abs(n) < 1 ? 2 : 1), out = {}; for (const key in obj) { const v = obj[key]; out[key] = (v && typeof v === 'object' && !Array.isArray(v) && key !== 'act') ? Object.fromEntries(Object.entries(v).map(([a, b]) => [a, typeof b === 'number' ? r(b) : b])) : v; } return out; };

const files = readdirSync(U('./arcs2/')).filter(f => f.endsWith('.mjs')).sort();
const issues = []; let nArcs = 0;
for (const f of files) {
  const { PREFIX, CAT, ARCS } = await import('./arcs2/' + f);
  for (const arc of ARCS) {
    nArcs++;
    const R = arc.role && arc.role !== 'region' ? '$' + arc.role : null, tpl = arc.role ? { [arc.role]: arc.spec || 'any' } : undefined, N = arc.parts.length;
    arc.parts.forEach((p, i) => {
      const id = `${PREFIX}${arc.id}_${i + 1}`, nextId = i < N - 1 ? `${PREFIX}${arc.id}_${i + 2}` : null;
      const options = p.o.map(([text, a], j) => {
        let e = typeof a === 'string' ? tweak(ARCH[a](R), id + j) : { ...a };
        if (typeof a === 'object') { e.hint ||= ''; if (a.now) e.now = tweak({ now: a.now }, id + j).now; }
        const { hint, ...rest } = e;
        const opt = { text, hint, ...rest };
        if (nextId) opt.next = [...(opt.next || []), { id: nextId, days: 20 + Math.floor(hash(id + 'd' + j) * 40), p: 0.9 }];
        return opt;
      });
      const card = { id, cat: arc.cat || CAT, title: N > 1 ? `${p.t} (${i + 1}/${N})` : p.t, desc: p.d, context: p.c || arc.ctx || '', ...((tpl || p.tpl) && { tpl: p.tpl || tpl }), w: i === 0 ? (arc.w ?? (arc.cond?.countries ? 3 : arc.cond?.wr ? 2 : 1)) : 1, options };
      if (i === 0 && !arc.sched) card.cond = arc.cond || {};
      else if (i === 0 && arc.sched && arc.cond) card.cond = arc.cond;
      if (i > 0 || arc.sched) { card.chain = true; card.default = options.length - 1; delete card.cond; }
      issues.push(card);
    });
  }
}
writeFileSync(U('../data/issues_depth.json'), JSON.stringify(issues, null, 1));
const m = JSON.parse(readFileSync(U('../data/content.json'), 'utf8'));
if (!m.issues.includes('issues_depth')) { m.issues.push('issues_depth'); writeFileSync(U('../data/content.json'), JSON.stringify(m, null, 1)); }
console.log('arcos:', nArcs, '| cartas:', issues.length);
