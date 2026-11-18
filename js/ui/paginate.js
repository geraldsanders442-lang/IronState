// Paginação e carregamento preguiçoso para listas grandes: renderiza em blocos, busca em todos os itens e
// carrega o bloco seguinte ao chegar ao fim da lista (ou pelo botão "Mostrar mais").
// Uso: const pg = pagedGrid(container, itens, { size: 60, item: it => '<button …>', name: it => 'texto para busca' });
//      pg.reset('busca')  → refaz a lista filtrada;  pg.destroy() → solta o observador.
export function pagedGrid(box, items, { size = 60, item, name = it => it.name || '', cls = 'flag-grid', max = 'none' } = {}) {
  box.innerHTML = `<div class="${cls}" data-pgrid style="max-height:${max}"></div><div class="row" style="justify-content:center;margin:6px 0"><button class="small" data-pmore hidden></button></div>`;
  const grid = box.querySelector('[data-pgrid]'), more = box.querySelector('[data-pmore]');
  let list = items, shown = 0, obs = null;
  const draw = () => {
    const next = list.slice(shown, shown + size);
    grid.insertAdjacentHTML('beforeend', next.map(item).join(''));
    shown += next.length;
    const left = list.length - shown;
    more.hidden = left <= 0; more.textContent = `Mostrar mais (${left})`;
    if (!list.length) grid.innerHTML = '<p class="small muted">Nada encontrado.</p>';
  };
  more.onclick = draw;
  if ('IntersectionObserver' in window) { obs = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting) && !more.hidden) draw(); }, { rootMargin: '300px' }); obs.observe(more); }
  draw();
  return {
    reset(q) { const s = String(q || '').toLowerCase().trim(); list = s ? items.filter(it => name(it).toLowerCase().includes(s)) : items; grid.innerHTML = ''; shown = 0; draw(); },
    destroy() { obs?.disconnect(); },
    get count() { return list.length; },
  };
}

// Lista de cartões em blocos (por exemplo, cenários): devolve o HTML do bloco atual e do botão.
export function chunkInfo(total, shown) { return { more: total > shown, left: Math.max(0, total - shown) }; }
