// Acessibilidade: teclado em elementos clicáveis, atalhos, anúncios para leitores de tela (aria-live) e foco nos diálogos.
import { $, announce, modal, esc } from './dom.js';

// Elementos que respondem a clique mas não são botões nativos: ganham foco, papel de botão e Enter/Espaço.
const CLICKABLE = '.scen, [data-wscn], [data-cw], [data-ogo], [data-pick], [data-go]:not(a):not(button), .card[data-id], .issue-card, .opt[data-opt], [data-open-issue]:not(button):not(a), .toast, [data-regf], [data-iso], [data-hist]:not(button)';
function enhance(root = document.body) {
  for (const el of root.querySelectorAll?.(CLICKABLE) || []) {
    if (el.tabIndex >= 0 && el.getAttribute('role')) continue;
    if (el.matches('button, a[href], input, select, textarea')) continue;
    el.tabIndex = 0; el.setAttribute('role', 'button');
    if (el.classList.contains('on')) el.setAttribute('aria-pressed', 'true');
  }
}

export function installA11y({ go, nextWeek, pageName }) {
  // Observa novos elementos desenhados pelas páginas.
  let queued = false;
  new MutationObserver(() => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; enhance(); }); }).observe(document.body, { childList: true, subtree: true });
  enhance();
  // Enter e Espaço ativam elementos com papel de botão que não são nativos.
  document.addEventListener('keydown', e => {
    const t = e.target;
    if ((e.key === 'Enter' || e.key === ' ') && t?.getAttribute?.('role') === 'button' && !t.matches('button, a, input, select, textarea')) { e.preventDefault(); t.click(); return; }
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t?.tagName) || t?.isContentEditable || e.ctrlKey || e.metaKey) return;
    if ($('#app')?.hidden) return;
    if (e.key === '?' || (e.key === 'h' && e.altKey)) { e.preventDefault(); help(); return; }
    if (!$('#modal').hidden) return;
    const map = { q: 'issues', b: 'budget', e: 'economy', m: 'map', p: 'politics', d: 'diplomacy', s: 'stats', o: 'order', h: 'health', t: 'tax', n: 'ethnic' };
    const k = e.key.toLowerCase();
    if (e.altKey && map[k]) { e.preventDefault(); go(map[k]); announce(`Página: ${pageName(map[k])}.`); }
  });
  // Mensagens importantes são anunciadas mesmo sem foco (ver toast em dom.js).
  $('#ticker')?.setAttribute('aria-live', 'off');
}

function help() {
  const m = modal(`<h2>Atalhos de teclado</h2><table class="data small">
    <tr><td><kbd>Enter</kbd></td><td>Próxima semana</td></tr>
    <tr><td><kbd>Tab</kbd> / <kbd>Shift+Tab</kbd></td><td>Navegar entre botões, cartões e menus</td></tr>
    <tr><td><kbd>Enter</kbd> / <kbd>Espaço</kbd></td><td>Ativar o item em foco (cenários, bandeiras, cartões)</td></tr>
    <tr><td><kbd>Esc</kbd></td><td>Fechar janelas</td></tr>
    <tr><td><kbd>Alt</kbd>+<kbd>Q</kbd></td><td>Questões</td></tr><tr><td><kbd>Alt</kbd>+<kbd>B</kbd></td><td>Orçamento</td></tr><tr><td><kbd>Alt</kbd>+<kbd>E</kbd></td><td>Economia</td></tr>
    <tr><td><kbd>Alt</kbd>+<kbd>M</kbd></td><td>Mapa</td></tr><tr><td><kbd>Alt</kbd>+<kbd>P</kbd></td><td>Política</td></tr><tr><td><kbd>Alt</kbd>+<kbd>D</kbd></td><td>Diplomacia</td></tr>
    <tr><td><kbd>Alt</kbd>+<kbd>S</kbd></td><td>Estatísticas</td></tr><tr><td><kbd>Alt</kbd>+<kbd>O</kbd></td><td>Ordem e êxodo</td></tr><tr><td><kbd>Alt</kbd>+<kbd>H</kbd></td><td>Saúde e saneamento</td></tr>
    <tr><td><kbd>Alt</kbd>+<kbd>T</kbd></td><td>Impostos e tarifas</td></tr><tr><td><kbd>Alt</kbd>+<kbd>N</kbd></td><td>Povos e minorias</td></tr>
    <tr><td>Mapa em foco: <kbd>←↑↓→</kbd>, <kbd>+</kbd>/<kbd>−</kbd>, <kbd>0</kbd></td><td>Mover, aproximar/afastar e reiniciar a vista</td></tr>
    <tr><td><kbd>?</kbd></td><td>Esta ajuda</td></tr></table><div class="right"><button class="primary" data-close>Fechar</button></div>`);
  return m;
}
