// Simulador de balanceamento: roda muitas partidas automáticas e resume quanto o jogo é difícil.
// Uso: node tools/balance.mjs [partidas por cenário=6] [semanas=104]  → docs/balance-report.md
import { writeFileSync } from 'node:fs';
import { Game } from '../js/sim/game.js';
import { loadData } from '../tests/sim-data.mjs';
import { advisorPick } from '../js/sim/advisor.js';
import { score } from '../js/sim/modes.js';

const runs = +(process.argv[2] || 6), weeks = +(process.argv[3] || 104);
const data = loadData();
const CASES = [['existing', 'BRA'], ['existing', 'POL'], ['existing', 'NGA'], ['existing', 'ARG'], ['existing', 'DEU'], ['ussr'], ['roman_empire'], ['megali_hellas'], ['sahel_confederation'], ['catalonia']];
const STRATS = { conselheiro: iss => advisorPick(iss), aleatória: iss => Math.floor(Math.random() * iss.options.length) };
const rows = [], endings = {};
for (const [scen, country] of CASES) {
  const sc = data.scenarios.find(s => s.id === scen);
  const provinces = sc.territory ? [...(sc.territory.entities || []).flatMap(e => data.geo.byCountry[e] || []), ...(sc.territory.provinces || [])] : data.geo.byCountry[country];
  for (const [sname, strat] of Object.entries(STRATS)) {
    const res = [];
    for (let r = 0; r < runs; r++) {
      const g = new Game(data, null);
      g.start({ seed: `bal-${scen}-${country}-${sname}-${r}`, scenario: scen, provinces, answers: sc.answers || data.identity.questions.map((_, i) => (i + r) % 4), difficulty: 'normal', flag: sc.flag || {}, nation: sc.nation || { officialName: 'T', shortName: 'T', leader: 'L', currency: 'x', motto: '', regime: 'R' } });
      const g0 = g.s.econ.gdp;
      let w = 0;
      for (; w < weeks && !g.s.over; w++) { g.nextWeek(); for (const p of [...g.s.issues.pending]) { const iss = g.getIssue(p.id); if (iss && !g.s.over) g.answerIssue(p.id, strat(iss)); } }
      const s = g.s;
      res.push({ over: !!s.over, ending: s.over?.ending || 'vivo', weeks: w, growth: (s.econ.gdp / g0 - 1) * 100, approval: s.d?.support ?? 0, score: score(s) });
      const k = s.over?.ending || 'sobreviveu'; endings[k] = (endings[k] || 0) + 1;
    }
    const avg = k => res.reduce((a, x) => a + x[k], 0) / res.length;
    rows.push({ name: (sc.name || scen) + (country && scen === 'existing' ? ' (' + (data.reg[country]?.name || country) + ')' : ''), strat: sname, survive: res.filter(x => !x.over).length / res.length * 100, weeks: avg('weeks'), growth: avg('growth'), approval: avg('approval'), score: avg('score'), ends: [...new Set(res.filter(x => x.over).map(x => x.ending))].join(', ') });
    console.log(rows.at(-1).name, sname, 'sobrevivência', rows.at(-1).survive.toFixed(0) + '%');
  }
}
const md = [`# Relatório de balanceamento`, '', `Gerado por \`node tools/balance.mjs ${runs} ${weeks}\`: ${runs} partidas por cenário e estratégia, até ${weeks} semanas. "Conselheiro" escolhe a opção recomendada pelo gabinete; "aleatória" sorteia.`, '',
  '| Cenário | Estratégia | Sobrevivência | Semanas (média) | Crescimento do PIB | Aprovação final | Pontuação | Finais |', '|---|---|---:|---:|---:|---:|---:|---|',
  ...rows.map(r => `| ${r.name} | ${r.strat} | ${r.survive.toFixed(0)}% | ${r.weeks.toFixed(0)} | ${r.growth.toFixed(1)}% | ${r.approval.toFixed(0)} | ${r.score.toFixed(0)} | ${r.ends || '—'} |`), '',
  '## Finais', '', ...Object.entries(endings).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`), ''];
writeFileSync(new URL('../docs/balance-report.md', import.meta.url), md.join('\n'));
console.log('docs/balance-report.md gravado');
