// Imagens vindas de APIs públicas, sem chave:
//  • Fotos de notícias: Wikimedia Commons (miniaturas, com autor e licença na legenda).
// Tudo é opcional (Opções › Imagens da internet) e tem reserva offline desenhada localmente.
import { esc } from './dom.js';

let ONLINE = true;
export function setOnlineImages(v) { ONLINE = v !== false; }
export const onlineImages = () => ONLINE && typeof navigator !== 'undefined' && navigator.onLine !== false;

const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const store = (() => { try { return window.localStorage; } catch { return null; } })();

// ---------- Fotos de notícias ----------
// Tema → busca em inglês no Commons (temas neutros; nada de imagens de vítimas).
const TOPICS = [
  [/nuclear|ogiva|radioativ|☢/i, 'nuclear test explosion mushroom cloud'],
  [/invad|guerra|ofensiva|tropas|front|ataca|conquista|ocupa|exército|bombard/i, 'military parade tanks soldiers'],
  [/golpe|junta|militares tomaram/i, 'military tanks street city'],
  [/protest|greve|manifesta|marcha|acampa|saque|revolta|levante/i, 'protest crowd demonstration street'],
  [/eleiç|urna|plebiscit|referend|votação|votos/i, 'ballot box election voting'],
  [/parlament|congresso|senado|deputad|coalizão|partido/i, 'parliament chamber session'],
  [/inflaç|bolsa|mercado|banco central|juros|dívida|calote|fmi|moeda/i, 'stock exchange trading floor'],
  [/sanç|comércio|exporta|importa|porto|acordo comercial|tarifa/i, 'container ship port cargo'],
  [/cúpula|diplomat|embaixad|tratado|aliança|visita|bloco/i, 'diplomatic summit flags meeting'],
  [/refugiad|deslocad|fronteira/i, 'border crossing checkpoint'],
  [/hospital|saúde|epidemia|vírus|médic|vacina/i, 'hospital ward medical'],
  [/escola|professor|universidade|estudante|educaç/i, 'classroom school students'],
  [/terremoto|enchente|seca|queimad|desastre|furacão/i, 'disaster relief rescue workers'],
  [/espi|intelig|hacker|agente/i, 'surveillance cameras city'],
  [/fome|aliment|colheita|agricult|trigo/i, 'wheat field harvest farmers'],
  [/energia|apagão|petróleo|usina|gás/i, 'power plant energy'],
  [/polícia|crime|facç|prisão|presídio/i, 'police officers city street'],
  [/igreja|religi|clérig|mesquita|templo/i, 'cathedral interior'],
  [/estátua|bandeira|hino|memorial|museu/i, 'national monument flags'],
];
export function topicOf(text, fallback) {
  for (const [re, q] of TOPICS) if (re.test(text)) return q;
  return fallback;
}
const BAD = /corpse|dead body|bodies|massacre|execution|gore|nude|naked|wounded|injured|victim|blood|map|flag of|coat of arms|logo|diagram|chart|stamp/i;
const mem = {};
async function search(query) {
  if (mem[query]) return mem[query];
  const key = 'ironstate.img.' + query;
  try { const c = JSON.parse(store?.getItem(key) || 'null'); if (c && Date.now() - c.t < 14 * 864e5) return (mem[query] = c.list); } catch {}
  const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ action: 'query', format: 'json', origin: '*', generator: 'search', gsrnamespace: '6', gsrlimit: '24', gsrsearch: query + ' filetype:bitmap', prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '640' });
  const res = await fetch(url);
  if (!res.ok) throw new Error('commons ' + res.status);
  const js = await res.json();
  const strip = h => String(h || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const list = Object.values(js.query?.pages || {}).map(p => ({ p, ii: p.imageinfo?.[0] })).filter(x => x.ii?.thumburl && !BAD.test(x.p.title) && /\.(jpe?g|png|webp)$/i.test(x.p.title))
    .map(({ p, ii }) => ({ src: ii.thumburl, page: ii.descriptionurl, title: p.title.replace(/^File:/, '').replace(/\.\w+$/, ''), author: strip(ii.extmetadata?.Artist?.value).slice(0, 60) || 'autor desconhecido', license: strip(ii.extmetadata?.LicenseShortName?.value) || 'licença no Commons' }))
    .filter(x => !/^$/.test(x.license));
  mem[query] = list;
  try { store?.setItem(key, JSON.stringify({ t: Date.now(), list })); } catch {}
  return list;
}
export async function newsPhoto(query, seed) {
  if (!onlineImages()) return null;
  try {
    const list = await search(query);
    return list.length ? list[hash(seed) % list.length] : null;
  } catch { return null; }
}
// Desenho de reserva (offline): faixa colorida com ícone do tema.
export function photoFallback(query, h = 180) {
  const hue = hash(query) % 360;
  return `<div class="photo-fb" style="height:${h}px;background:linear-gradient(135deg,hsl(${hue} 25% 35%),hsl(${(hue + 40) % 360} 30% 22%))"><span>${esc(query.split(' ')[0])}</span></div>`;
}
// Preenche todos os [data-photo] de um elemento com fotos (assíncrono).
export function fillPhotos(root) {
  for (const el of root.querySelectorAll('[data-photo]')) {
    const q = el.dataset.photo, h = +el.dataset.h || 180;
    el.innerHTML = photoFallback(q, h);
    newsPhoto(q, el.dataset.seed || q).then(ph => {
      if (!ph || !el.isConnected) return;
      el.innerHTML = `<img src="${esc(ph.src)}" alt="${esc(ph.title)}" style="height:${h}px" loading="lazy"><figcaption>Foto: <a href="${esc(ph.page)}" target="_blank" rel="noopener">${esc(ph.title.slice(0, 50))}</a> — ${esc(ph.author)} · ${esc(ph.license)} · Wikimedia Commons</figcaption>`;
      el.querySelector('img').onerror = () => { el.innerHTML = photoFallback(q, h); };
    });
  }
}
