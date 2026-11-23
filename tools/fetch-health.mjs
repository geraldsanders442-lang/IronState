// Baixa indicadores de saneamento, água, higiene e saúde do Banco Mundial (séries do JMP OMS/UNICEF e da ONU) e gera data/health.json.
// Uso: node tools/fetch-health.mjs   (país -> último valor disponível desde 2015; ausentes ficam de fora e o jogo usa a média da região)
import { writeFileSync } from 'node:fs';
const IND = {
  san: 'SH.STA.BASS.ZS',      // pelo menos saneamento básico (% da população)
  sanSafe: 'SH.STA.SMSS.ZS',  // saneamento gerido com segurança (%)
  water: 'SH.H2O.BASW.ZS',    // pelo menos água potável básica (%)
  waterSafe: 'SH.H2O.SMDW.ZS',// água gerida com segurança (%)
  hyg: 'SH.STA.HYGN.ZS',      // lavatórios com água e sabão em casa (%)
  od: 'SH.STA.ODFC.ZS',       // defecação a céu aberto (%)
  le: 'SP.DYN.LE00.IN',       // expectativa de vida (anos)
  u5m: 'SH.DYN.MORT',         // mortalidade abaixo de 5 anos (por mil nascidos)
  wash: 'SH.STA.WASH.P5',     // mortes por água/saneamento/higiene inseguros (por 100 mil)
};
const out = {};
for (const [k, code] of Object.entries(IND)) {
  let url = `https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&per_page=20000&date=2012:2024`, r;
  for (let i = 0; i < 4 && !r; i++) { try { r = await (await fetch(url, { headers: { 'User-Agent': 'IronStateGame/1.0 (health data import)' } })).json(); } catch { await new Promise(s => setTimeout(s, 3000)); } }
  const rows = r?.[1] || []; const best = {};
  for (const x of rows) { if (x.value == null || !/^[A-Z]{3}$/.test(x.countryiso3code || '')) continue; const y = +x.date, o = best[x.countryiso3code]; if (!o || y > o.y) best[x.countryiso3code] = { y, v: x.value }; }
  for (const [c, o] of Object.entries(best)) (out[c] ||= {})[k] = Math.round(o.v * 10) / 10;
  console.log(k.padEnd(10), code.padEnd(16), Object.keys(best).length, 'países');
}
writeFileSync(new URL('../data/health.json', import.meta.url), JSON.stringify({ _doc: 'Saneamento, água, higiene e saúde por país (Banco Mundial: JMP OMS/UNICEF, ONU). Último valor desde 2012. Gerado por tools/fetch-health.mjs.', countries: out }));
console.log('países com algum dado:', Object.keys(out).length);
