// Tutorial guiado: destaca partes da tela e explica o essencial nas primeiras semanas.
import { esc } from './dom.js';
import { go } from './app.js';

const STEPS = [
  { sel: '[data-endturn]', title: 'O tempo anda quando você quer', text: 'Cada clique em "Próxima semana" (ou Enter) simula sete dias, traz o jornal da semana e novas questões. Não há relógio correndo.' },
  { sel: '#sidebar [data-go="issues"]', title: 'Questões', text: 'Toda semana chegam decisões. Cada opção agrada uns grupos e irrita outros; algumas têm desdobramentos semanas depois. Em Opções você escolhe quantas questões por semana e pode deixar o gabinete decidir as menores.' },
  { sel: '.adv-alert, [data-nmap]', page: 'overview', title: 'Conselheiros', text: 'Os conselheiros avisam com antecedência quando o caixa vai acabar, a inflação dispara ou um golpe se aproxima — e sugerem caminhos.' },
  { sel: '#sidebar [data-go="budget"]', title: 'Orçamento', text: 'Impostos e gastos por área. Cortar demais de uma vez gera greves; gastar abaixo do mínimo sucateia hospitais, escolas e estradas.' },
  { sel: '#sidebar [data-go="economy"]', title: 'Economia', text: 'Programas econômicos, obras em cada província (fábricas, portos, usinas, universidades), mercados mundiais, empresas e câmbio.' },
  { sel: '#sidebar [data-go="politics"]', title: 'Política', text: 'Parlamento e eleições, gabinete por pasta, facções do regime, o governante (idade, saúde, herdeiro) e a constituição.' },
  { sel: '#sidebar [data-go="diplomacy"]', title: 'Diplomacia', text: 'Cada país tem um líder com personalidade e memória do que você fez. Proponha cúpulas, espione, financie aliados — e acompanhe a tensão mundial.' },
  { sel: '#sidebar [data-go="military"]', title: 'Forças armadas', text: 'Corpos de exército com generais, marinha e aviação. Em guerra, dê ordens de ofensiva ou defesa e, na vitória, desenhe a paz no mapa.' },
  { sel: '#sidebar [data-go="research"]', title: 'Pesquisa', text: 'Tecnologias de três eras mudam a economia e a guerra. Universidades e parques tecnológicos aceleram a pesquisa.' },
  { sel: '#sidebar [data-go="encyclopedia"]', title: 'Dúvidas?', text: 'A Enciclopédia explica cada indicador e mecânica e permite buscar qualquer questão do jogo. Bom governo!' },
];

let idx = 0, box = null;
export function startTutorial(game) { idx = 0; game.s.settings.tutorialSeen = true; game.save(); show(game); }
function clear() { document.querySelectorAll('.tut-hi').forEach(e => e.classList.remove('tut-hi')); box?.remove(); box = null; }
function show(game) {
  clear();
  const st = STEPS[idx]; if (!st) return;
  if (st.page) go(st.page);
  const target = st.sel.split(',').map(x => document.querySelector(x.trim())).find(Boolean);
  target?.classList.add('tut-hi'); target?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  box = document.createElement('div');
  box.className = 'tut-box';
  box.innerHTML = `<div class="small muted">Tutorial ${idx + 1}/${STEPS.length}</div><b>${esc(st.title)}</b><p class="small">${esc(st.text)}</p>
    <div class="row" style="justify-content:space-between"><button class="small" data-tskip>Pular tutorial</button><span>${idx ? '<button class="small" data-tprev>← Voltar</button> ' : ''}<button class="small primary" data-tnext>${idx === STEPS.length - 1 ? 'Concluir' : 'Próximo →'}</button></span></div>`;
  document.body.appendChild(box);
  const r = target?.getBoundingClientRect();
  if (r && window.innerWidth > 720) { box.style.left = Math.min(window.innerWidth - 330, Math.max(10, r.right + 12)) + 'px'; box.style.top = Math.min(window.innerHeight - 180, Math.max(10, r.top)) + 'px'; }
  box.onclick = e => {
    if (e.target.closest('[data-tskip]')) return clear();
    if (e.target.closest('[data-tprev]')) { idx--; return show(game); }
    if (e.target.closest('[data-tnext]')) { idx++; if (idx >= STEPS.length) return clear(); show(game); }
  };
}
