// Crônica por país (Observatório): cada notícia que cita um país vai para a lista dele.
// As notícias comuns ficam só por um tempo (as mais recentes) e vão sendo apagadas; as importantes (guerras, golpes, independências,
// anexações, genocídios, colapsos...) vão também para um arquivo permanente, limitado em tamanho (as menos importantes saem primeiro).
const RECENT_DAYS = 150, RECENT_MAX = 30, ARCH_MAX = 60;
const day = s => Math.floor(s.time.min / 1440);

// Peso da notícia: tipo + palavras-chave. Passou de 4 = importante.
const KEYS = [
  [3, /independ[eê]ncia|proclama|golpe|revolu[cç][aã]o|guerra civil|deixa de existir|renasce|nasce |capital cai|armas nucleares|bomba at[oô]mica|genoc[ií]dio|limpeza [eé]tnica/i],
  [2, /invade|invas[aã]o|anexa|ocupa|declara guerra|guerra!|cessar-fogo|tratado de paz|assassin|colapso|derrub|sa[ií]da da uni[aã]o|expuls[õo]es|pogrom|fome|san[cç][õo]es|transi[cç][aã]o|desmembra|une-se|funda/i],
  [1, /alian[cç]a|acordo|c[uú]pula|elei[cç][aã]o|ultimato|tens[aã]o|protestos|greve|refugiados|surto/i],
];
const KIND_W = { war: 3, bad: 2, good: 1, warn: 1, info: 0 };
export function importance(text, kind) {
  let v = KIND_W[kind] ?? 0;
  for (const [w, re] of KEYS) if (re.test(text)) v += w;
  return v;
}
export const IMPORTANT = 4;

const IDX = new WeakMap();
function nameIndex(s, data) {
  const W = s.world, sig = Object.keys(W.ents || {}).length + ':' + Object.keys(W.c).length, hit = IDX.get(W);
  if (hit && hit.sig === sig) return hit;
  const map = new Map();
  for (const id of Object.keys(W.c)) {
    const e = W.ents?.[id] || data.reg?.[id]; if (!e || id === 'PLY') continue;
    for (const nm of [e.name, e.short]) if (nm && nm.length >= 4) map.set(nm.toLowerCase(), id);
  }
  // Também países que deixaram de existir (para notícias sobre eles) — só os do registro.
  const names = [...map.keys()].sort((a, b) => b.length - a.length).map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = names.length ? new RegExp('(?<![\\p{L}])(' + names.join('|') + ')(?![\\p{L}])', 'giu') : null;
  const out = { sig, map, re }; IDX.set(W, out); return out;
}
export const chron = s => (s.world.chron ||= {});

// Registra uma notícia nas crônicas dos países citados. Devolve a lista de ids tocados.
export function recordNews(s, data, text, kind = 'info') {
  if (!s.spectator || !s.world?.c) return [];
  const { map, re } = nameIndex(s, data); if (!re) return [];
  const ids = new Set(); re.lastIndex = 0;
  for (const m of text.matchAll(re)) { const id = map.get(m[1].toLowerCase()); if (id) ids.add(id); }
  if (!ids.size) return [];
  const d = day(s), w = importance(text, kind), C = chron(s);
  for (const id of ids) {
    const c = C[id] ||= { r: [], a: [] };
    if (c.r[0] && c.r[0][0] === d && c.r[0][1] === text) continue;
    c.r.unshift([d, text, kind, w]);
    if (w >= IMPORTANT && !c.a.some(x => x[0] === d && x[1] === text)) { c.a.push([d, text, kind, w]); trimArchive(c); }
    trimRecent(c, d);
  }
  return [...ids];
}
function trimRecent(c, d) {
  while (c.r.length && (c.r.length > RECENT_MAX || d - c.r.at(-1)[0] > RECENT_DAYS)) c.r.pop();
}
function trimArchive(c) {
  while (c.a.length > ARCH_MAX) { // sai a menos importante; empatando, a mais antiga
    let k = 0; for (let i = 1; i < c.a.length; i++) if (c.a[i][3] < c.a[k][3] || (c.a[i][3] === c.a[k][3] && c.a[i][0] < c.a[k][0])) k = i;
    c.a.splice(k, 1);
  }
}
// Envelhecimento semanal: apaga o que passou do prazo (as notícias importantes já estão no arquivo).
export function ageChronicles(s) {
  const C = s.world.chron; if (!C) return; const d = day(s);
  for (const id in C) { trimRecent(C[id], d); if (!C[id].r.length && !C[id].a.length) delete C[id]; }
}
// Para a página do país: recentes (mais novas primeiro) e marcos (arquivo, em ordem cronológica).
export const recentOf = (s, id) => (s.world.chron?.[id]?.r || []).map(([d, t, k, w]) => ({ day: d, text: t, kind: k, w }));
export const archiveOf = (s, id) => [...(s.world.chron?.[id]?.a || [])].sort((a, b) => a[0] - b[0]).map(([d, t, k, w]) => ({ day: d, text: t, kind: k, w }));
// Notícias importantes de vários países, mais recentes primeiro (para o acompanhamento e o diário).
export function feedOf(s, ids, { onlyImportant = false, limit = 60 } = {}) {
  const seen = new Set(), out = [];
  for (const id of ids) {
    const c = s.world.chron?.[id]; if (!c) continue;
    for (const x of onlyImportant ? c.a : [...c.r, ...c.a]) { const k = x[0] + '|' + x[1]; if (seen.has(k)) continue; seen.add(k); out.push({ day: x[0], text: x[1], kind: x[2], w: x[3], id }); }
  }
  return out.sort((a, b) => b.day - a.day || b.w - a.w).slice(0, limit);
}
