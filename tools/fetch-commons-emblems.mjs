// Baixa SVGs de símbolos do Wikimedia Commons (com licença e autoria) para tools/raw/commons/.
// Uso: node tools/fetch-commons-emblems.mjs   — depois: node tools/build-emblems.mjs
// Só arquivos em domínio público ou licenças livres (CC0, CC BY, CC BY-SA, GFDL) são aceitos.
import { writeFileSync, readFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { LIST } from './commons-emblems.list.mjs';

const OUT = new URL('./raw/commons/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const UA = 'IronStateGame/1.0 (offline hobby strategy game; emblem import script)';
const sleep = ms => new Promise(res => setTimeout(res, ms));
const api = async q => {
  for (let i = 0; i < 6; i++) {
    await sleep(1500 + i * 4000);
    const txt = await (await fetch('https://commons.wikimedia.org/w/api.php?format=json&maxlag=5&' + q, { headers: { 'User-Agent': UA } })).text();
    try { return JSON.parse(txt); } catch { console.log('  (limite da API, aguardando)'); }
  }
  throw new Error('API indisponível');
};
const FREE = /public domain|^pd|cc0|cc[- ]by|gfdl|attribution|free art/i;
const strip = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const prev = existsSync(new URL('manifest.json', OUT)) ? JSON.parse(readFileSync(new URL('manifest.json', OUT), 'utf8')) : [];
const manifest = [];
for (const it of LIST) {
  const okFile = f => existsSync(f) && /<svg[\s>]/i.test(readFileSync(f, 'utf8').slice(0, 5000)) && !/<html/i.test(readFileSync(f, 'utf8').slice(0, 300));
  const done = prev.find(x => x.key === it.key && (!it.title || x.title === it.title) && okFile(new URL(it.key + '.svg', OUT)));
  if (done) { manifest.push({ ...done, cat: it.cat, name: it.name }); continue; }
  let title = it.title ? 'File:' + it.title : null;
  if (!title) {
    const r = await api('action=query&list=search&srnamespace=6&srlimit=10&srsearch=' + encodeURIComponent(it.q.replace(/ svg$/i, '') + ' filemime:image/svg+xml'));
    it._alts = (r.query?.search?.map(x => x.title) || []).filter(t => /\.svg$/i.test(t) && !/^File:(Flag|Bandera|Drapeau|Flaga)\b/i.test(t));
    title = it._alts.shift();
  }
  if (!title) { console.log('não encontrado:', it.key); continue; }
  const r = await api('action=query&prop=imageinfo&iiprop=url|size|extmetadata&titles=' + encodeURIComponent(title));
  const page = Object.values(r.query.pages)[0], ii = page.imageinfo?.[0];
  if (!ii) { console.log('sem arquivo:', it.key, title); continue; }
  const m = ii.extmetadata || {}, lic = strip(m.LicenseShortName?.value);
  if (!FREE.test(lic) || ii.size > (it.cat === 'arms' ? 1500000 : 400000)) { console.log(!FREE.test(lic) ? 'licença recusada:' : 'grande demais:', it.key, title, ii.size); if (it._alts?.length) { it.title = null; it.q = null; LIST.splice(LIST.indexOf(it) + 1, 0, { ...it, title: it._alts.shift().slice(5), _alts: it._alts }); } continue; }
  const file = it.key + '.svg';
  const valid = f => existsSync(f) && /<svg[\s>]/i.test(readFileSync(f, 'utf8').slice(0, 5000)) && !/<html/i.test(readFileSync(f, 'utf8').slice(0, 300));
  const fu = new URL(file, OUT);
  // Arquivo de outra versão da lista (título mudou): apaga para não creditar um arquivo e usar outro.
  if (existsSync(fu) && prev.find(x => x.key === it.key)?.title !== title.slice(5)) unlinkSync(fu);
  for (let i = 0; i < 5 && !valid(fu); i++) {
    await sleep(7000 + i * 8000);
    const res = await fetch(ii.url, { headers: { 'User-Agent': UA } });
    if (res.status === 429) { const wait = (+res.headers.get('retry-after') || 600) + 15; console.log(`  (servidor pediu pausa de ${wait}s)`); await sleep(wait * 1000); i--; continue; }
    writeFileSync(fu, await res.text());
  }
  if (!valid(fu)) { console.log('falhou o download:', it.key); continue; }
  manifest.push({ ...it, title: title.slice(5), url: ii.descriptionurl, license: lic, artist: strip(m.Artist?.value).slice(0, 160), bytes: ii.size });
  writeFileSync(new URL('manifest.json', OUT), JSON.stringify(manifest, null, 1));
  console.log('ok', it.key, '←', title, '|', lic, '|', ii.size);
}
writeFileSync(new URL('manifest.json', OUT), JSON.stringify(manifest, null, 1));
console.log(manifest.length, 'arquivos');
