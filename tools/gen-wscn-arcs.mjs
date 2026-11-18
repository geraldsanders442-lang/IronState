// Gera as 45 questões exclusivas de cada cenário mundial (15 arcos de 3 partes) -> data/issues_wscn_arcs.json
// Cada arco: parte 1 (questão normal, só aparece no cenário e no contexto) -> parte 2 e 3 (desdobramentos encadeados).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const U = f => new URL(f, import.meta.url);
const hash = str => { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; };

// Arquétipos de resposta: efeitos e dica. R = papel estrangeiro ({power}/{nb}) quando houver.
const ARCH = {
  F: (R) => ({ hint: 'Firmeza: apoio interno e militares; a relação esfria.', now: { legitimacy: 2, defense: 1, reputation: -1 }, groups: { military: 2 }, ...(R && { rel: { [R]: -7 } }) }),
  D: (R) => ({ hint: 'Diplomacia: melhora a imagem e a relação; custa algum capital político.', now: { reputation: 2, treasury: -0.05, legitimacy: -0.5 }, ...(R && { rel: { [R]: 8 } }) }),
  S: () => ({ hint: 'Gasto popular: ganha apoio, custa o caixa.', now: { treasury: -0.3, qol: 1, legitimacy: 2 }, groups: { workers: 2, youth: 1 } }),
  R: () => ({ hint: 'Repressão: o controle sobe e as liberdades caem.', now: { control: 2, civil: -2, political: -2, legitimacy: 1, protest: -2 }, groups: { opposition: -3 } }),
  M: () => ({ hint: 'Abertura ao mercado: cresce a economia, a base operária reclama.', now: { growth: 0.2, corruption: -1 }, groups: { business: 3, workers: -1 } }),
  P: () => ({ hint: 'Planejamento estatal: mais eficiência, menos iniciativa privada.', now: { treasury: -0.15, efficiency: 1 }, groups: { bureaucracy: 3, business: -2 } }),
  C: (R) => ({ hint: 'Concessão: acalma a pressão, mas parece fraqueza.', now: { legitimacy: -2, stability: -1, reputation: 1 }, groups: { military: -2 }, ...(R && { rel: { [R]: 12 } }) }),
  I: () => ({ hint: 'Deixar passar: sem custo agora, o problema cresce.', now: { legitimacy: -1, stability: -1 }, groups: { opposition: 1 } }),
  T: (R) => ({ hint: 'Operação discreta: informação e vantagem, com risco de escândalo.', now: { intel: 2, treasury: -0.1, reputation: -1 }, groups: { military: 1 }, ...(R && { rel: { [R]: -4 } }) }),
  A: (R) => ({ hint: 'Pedir ajuda externa: entra dinheiro e aumenta a dependência.', now: { treasury: 0.3, influence: -1, reputation: -1 }, ...(R && { rel: { [R]: 5 } }) }),
  W: (R) => ({ hint: 'Mobilização: o exército se prepara, o caixa sofre.', now: { readiness: 2, treasury: -0.2, projection: 1 }, groups: { military: 3 }, ...(R && { rel: { [R]: -8 } }) }),
  E: () => ({ hint: 'Reforma e abertura: a juventude comemora, o aparato teme.', now: { political: 3, civil: 2, legitimacy: 1 }, groups: { youth: 3, opposition: 2, bureaucracy: -2 } }),
  N: () => ({ hint: 'Expurgo e controle: menos corrupção, mais medo e mais estatismo.', now: { control: 2, corruption: -2, stability: -1 }, groups: { business: -3, bureaucracy: 1 } }),
  G: () => ({ hint: 'Investimento de longo prazo: caro hoje, rende depois.', now: { treasury: -0.3 }, long: [{ k: 'growth', v: 0.12, d: 120 }], groups: { business: 2, workers: 1 } }),
  X: () => ({ hint: 'Medida ecológica/social: custo e popularidade entre jovens.', now: { treasury: -0.2, pollution: -2, reputation: 1 }, groups: { youth: 3, business: -2 } }),
  B: () => ({ hint: 'Barganha local: compra lealdades com dinheiro e favores.', now: { treasury: -0.15, corruption: 1, stability: 1 }, groups: { regional: 2, bureaucracy: 1 } }),
  H: () => ({ hint: 'Apelo à fé e à tradição: coesão, tensão com os progressistas.', now: { legitimacy: 2, stability: 1 }, groups: { rural: 3, youth: -3 } }),
  V: () => ({ hint: 'Sanção ou boicote: pune o adversário e custa comércio.', now: { reputation: 0, growth: -0.1, legitimacy: 1 }, groups: { business: -2, military: 1 } }),
};
const tweak = (obj, k) => { // varia levemente os números por carta (determinístico)
  const f = 0.8 + hash(k) * 0.5, r = n => +(n * f).toFixed(Math.abs(n) < 1 ? 2 : 1), out = {};
  for (const key in obj) { const v = obj[key]; out[key] = (v && typeof v === 'object' && !Array.isArray(v)) ? Object.fromEntries(Object.entries(v).map(([a, b]) => [a, typeof b === 'number' ? r(b) : b])) : v; }
  return out;
};

const files = readdirSync(U('./wscn-arcs/')).filter(f => f.endsWith('.mjs')).sort();
const issues = [];
const stats = {};
for (const f of files) {
  const { WORLD, CAT, ARCS } = await import('./wscn-arcs/' + f);
  if (ARCS.length !== 15) throw new Error(`${WORLD}: ${ARCS.length} arcos (esperado 15)`);
  for (const arc of ARCS) {
    const R = arc.role ? '$' + arc.role : null, tpl = arc.role ? { [arc.role]: arc.spec || 'any' } : undefined;
    arc.parts.forEach((p, i) => {
      const id = `wa_${WORLD}_${arc.id}_${i + 1}`, nextId = i < 2 ? `wa_${WORLD}_${arc.id}_${i + 2}` : null;
      const options = p.o.map(([text, a], j) => {
        const e = tweak(ARCH[a](R), id + j), hint = e.hint; delete e.hint;
        const opt = { text, hint, ...e };
        if (nextId) opt.next = [{ id: nextId, days: 22 + Math.floor(hash(id + 'd' + j) * 40), p: 0.92 }];
        return opt;
      });
      const card = { id, cat: CAT, title: `${p.t} (${i + 1}/3)`, desc: p.d, context: p.c || arc.ctx || '', ...(tpl && { tpl }), w: i === 0 ? (arc.w || 1.2) : 1, options };
      if (i === 0) card.cond = { wscn: WORLD, ...(arc.cond || {}) };
      else { card.chain = true; card.default = options.length - 1; }
      issues.push(card);
    });
  }
  stats[WORLD] = ARCS.length * 3;
}
writeFileSync(U('../data/issues_wscn_arcs.json'), JSON.stringify(issues, null, 1));
const m = JSON.parse(readFileSync(U('../data/content.json'), 'utf8'));
if (!m.issues.includes('issues_wscn_arcs')) { m.issues.push('issues_wscn_arcs'); writeFileSync(U('../data/content.json'), JSON.stringify(m, null, 1)); }
console.log('questões de arco:', issues.length, JSON.stringify(stats));
