// Baixa bandeiras regionais/imperiais do Wikimedia Commons (só licenças livres) para tools/raw/regional/.
// Uso: node tools/fetch-regional-flags.mjs   — depois: node tools/build-regional-flags.mjs
// Consulta títulos em lote (50 por chamada), com busca como reserva e pausas generosas (política de bots do Commons).
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { LIST } from './regional-flags.list.mjs';

const OUT = new URL('./raw/regional/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const UA = 'IronStateGame/1.0 (offline hobby strategy game; regional flag import script)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const api = async q => {
  for (let i = 0; i < 6; i++) {
    await sleep(900 + i * 3000);
    let txt = '';
    try { txt = await (await fetch('https://commons.wikimedia.org/w/api.php?format=json&maxlag=5&redirects=1&' + q, { headers: { 'User-Agent': UA } })).text(); } catch (e) { console.log('  (rede indisponível, aguardando)'); await sleep(15000); continue; }
    try { return JSON.parse(txt); } catch { console.log('  (limite da API, aguardando)'); }
  }
  throw new Error('API indisponível');
};
const FREE = /public domain|^pd|cc0|cc[- ]by|gfdl|attribution|free art|free use|no restrictions|copyrighted free/i;
const strip = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const asc = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

const manPath = new URL('manifest.json', OUT);
const manifest = existsSync(manPath) ? JSON.parse(readFileSync(manPath, 'utf8')) : {};
const save = () => writeFileSync(manPath, JSON.stringify(manifest, null, 1));
const fileOf = key => new URL(key + '.svg', OUT);
const validSvg = f => existsSync(f) && /<svg[\s>]/i.test(readFileSync(f, 'utf8').slice(0, 6000)) && !/<html/i.test(readFileSync(f, 'utf8').slice(0, 300));

const candidates = row => {
  const out = [...(row.t || [])];
  for (const n of row.names || []) {
    const the = /^the /i.test(n);
    out.push(`Flag of ${n}.svg`, `Flag of ${n} (${row.ctx}).svg`, `Flag of ${n}, ${row.ctx}.svg`);
    if (!the) out.push(`Flag of the ${n}.svg`);
  }
  return [...new Set(out)];
};

const MAXPRI = +(process.env.MAXPRI || 2);
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const todo = LIST.filter(r => r.pri <= MAXPRI && (!ONLY || ONLY.test(r.key)) &&  !(manifest[r.key] && validSvg(fileOf(r.key))) && !manifest[r.key]?.failed);
console.log(LIST.length, 'entradas;', todo.length, 'a buscar');

// 1) Resolve títulos em lote.
const info = {}; // título (normalizado) -> imageinfo
const allTitles = [...new Set(todo.flatMap(candidates))];
for (let i = 0; i < allTitles.length; i += 40) {
  const chunk = allTitles.slice(i, i + 40);
  const r = await api('action=query&prop=imageinfo&iiprop=url|size|extmetadata&titles=' + encodeURIComponent(chunk.map(t => 'File:' + t).join('|')));
  const q = r.query || {};
  const norm = {}; for (const n of q.normalized || []) norm[n.from] = n.to;
  const redir = {}; for (const n of q.redirects || []) redir[n.from] = n.to;
  const byTitle = {}; for (const p of Object.values(q.pages || {})) if (p.imageinfo?.[0]) byTitle[p.title] = p.imageinfo[0];
  for (const t of chunk) { let k = 'File:' + t; k = norm[k] || k; k = redir[k] || k; if (byTitle[k]) info[t] = { title: k, ...byTitle[k] }; }
  console.log(`  títulos ${Math.min(i + 40, allTitles.length)}/${allTitles.length}`);
}

const searchFor = async row => {
  for (const n of row.names || []) {
    const r = await api('action=query&list=search&srnamespace=6&srlimit=12&srsearch=' + encodeURIComponent(`${n} flag filemime:image/svg+xml`));
    const keys = (row.names || []).map(asc).filter(Boolean);
    const hit = (r.query?.search || []).map(x => x.title).find(t => /\.svg$/i.test(t) && /flag|bandeira|drapeau|flagge|lippu|bandera|vlag|banner|estelada|standard|ensign|vexill|morning star/i.test(t) && !/map|location|coat|seal|arms|logo|icon|proposed|circle|button|waving|rectangular|locator|blank|template|former|historical|fictional|academy|force|navy|army|brigade|regiment|school|universit|club|party|police|airline|company/i.test(t) && keys.some(k => asc(t).includes(k.slice(0, 6))));
    if (hit) {
      const g = await api('action=query&prop=imageinfo&iiprop=url|size|extmetadata&titles=' + encodeURIComponent(hit));
      const p = Object.values(g.query?.pages || {})[0];
      if (p?.imageinfo?.[0]) return { title: p.title, ...p.imageinfo[0], viaSearch: true };
    }
  }
  return null;
};

// 2) Para cada entrada: título direto -> busca -> download.
let done = 0;
for (const row of todo) {
  let hit = null;
  for (const t of candidates(row)) if (info[t]) { hit = info[t]; break; }
  if (!hit) hit = await searchFor(row);
  if (!hit) { console.log('não encontrada:', row.key); manifest[row.key] = { failed: 'não encontrada', name: row.name }; save(); continue; }
  const m = hit.extmetadata || {}, lic = strip(m.LicenseShortName?.value);
  if (!FREE.test(lic)) { console.log('licença recusada:', row.key, hit.title, '|', lic); manifest[row.key] = { failed: 'licença ' + lic, title: hit.title, name: row.name }; save(); continue; }
  if (hit.size > 900000) { console.log('grande demais:', row.key, hit.title, hit.size); manifest[row.key] = { failed: 'grande ' + hit.size, title: hit.title, name: row.name }; save(); continue; }
  const fu = fileOf(row.key);
  for (let i = 0; i < 5 && !validSvg(fu); i++) {
    await sleep(6500 + Math.random() * 3000 + i * 4000);
    let res; try { res = await fetch(hit.url, { headers: { 'User-Agent': UA } }); } catch (e) { console.log('  (rede indisponível)'); await sleep(15000); continue; }
    if (res.status === 429) { const wait = (+res.headers.get('retry-after') || 120) + 10; console.log(`  (pausa de ${wait}s)`); await sleep(wait * 1000); i--; continue; }
    writeFileSync(fu, await res.text());
  }
  if (!validSvg(fu)) { console.log('falhou o download:', row.key); manifest[row.key] = { failed: 'download', title: hit.title, name: row.name }; save(); continue; }
  manifest[row.key] = { name: row.name, title: hit.title.replace(/^File:/, ''), url: hit.descriptionurl, license: lic, artist: strip(m.Artist?.value).slice(0, 160), bytes: hit.size, viaSearch: !!hit.viaSearch };
  save(); done++;
  if (done % 20 === 0) console.log(`  ${done} baixadas`);
}
save();
console.log('ok:', Object.values(manifest).filter(x => !x.failed).length, '| falhas:', Object.values(manifest).filter(x => x.failed).length);
