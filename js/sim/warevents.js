// Eventos de campanha: cartas dinâmicas que interrompem a guerra com decisões táticas,
// e a guerrilha nas províncias ocupadas.
import { clamp, chance, pick, random } from './util.js';
import { addWarCrime } from './order.js';
import { EVENTS2 } from './warevents2.js';
import { PLY, territoryChanged, hash } from './world.js';
import { entName, joinCoalitions } from './war.js';

const day = s => Math.floor(s.time.min / 1440);
const gdpPct = (s, p) => s.econ.gdp * p;
const spend = (s, p) => { s.econ.treasury -= gdpPct(s, p); };
const corpsOf = (s, w) => (s.forces?.corps || []).filter(c => c.war === w.id);
const occupied = (s, w) => w.gained.filter(p => s.world.occ[p] === PLY);
const hit = (s, w, role, d) => { for (const c of corpsOf(s, w)) if (!role || c.role === role) c.strength = clamp(c.strength + d, 5, 100); };

// ---------- Pool de eventos ----------
const EVENTS = {
  surprise: {
    ok: (s, w) => !!(w.etarget || w.stance !== 'offensive') && (w.ratio || 1) < 1.6,
    w: (s, w) => 1 + Math.max(0, 1.3 - (w.ratio || 1)),
    card: (s, data, w, nm) => ({
      title: `Ofensiva surpresa de ${nm}`, desc: `Divisões blindadas de ${nm} romperam a linha de contato numa frente que ninguém esperava. O estado-maior pede ordens em horas.`,
      context: `Força relativa atual: ${(w.ratio || 1).toFixed(2)}×. A reação decide se a linha segura ou se o avanço vira colapso.`, default: 1,
      options: [
        { text: 'Reforçar a linha ameaçada com reservas.', hint: 'Custa 0,2% do PIB; o avanço inimigo recua.', k: 'hold' },
        { text: 'Recuo elástico, preservando as tropas.', hint: 'Cede terreno (o inimigo avança), mas poupa homens.', k: 'fallback' },
        { text: 'Contra-atacar de imediato.', hint: 'Aposta alta: pode quebrar o ímpeto inimigo ou custar caro.', k: 'counter' }] }),
    res: (s, data, w, k) => {
      if (k === 'hold') { spend(s, 0.002); if (w.etarget) w.etarget.p = Math.max(0, w.etarget.p - 25); w.reinforce = Math.max(w.reinforce, 2); return 'Reservas seguram a linha; o avanço inimigo estanca.'; }
      if (k === 'fallback') { if (w.etarget) w.etarget.p = Math.min(95, w.etarget.p + 15); hit(s, w, null, 4); return 'O recuo preserva as divisões, mas o inimigo ganha terreno.'; }
      const win = chance(clamp(0.4 + ((w.ratio || 1) - 1) * 0.25, 0.2, 0.75));
      if (win) { w.enemyExh = clamp(w.enemyExh + 8, 0, 100); if (w.etarget) w.etarget.p = 0; return 'O contra-ataque pega o inimigo exposto: perdas pesadas para ele e a ofensiva se desfaz.'; }
      hit(s, w, null, -12); if (w.etarget) w.etarget.p = Math.min(95, w.etarget.p + 20); return 'O contra-ataque fracassa em emboscada; corpos perdem muita força e o inimigo avança.';
    } },
  supply: {
    ok: (s, w) => w.stance === 'offensive' && !!w.target,
    w: s => 1 + (s.st.logistics < 45 ? 1.2 : 0),
    card: (s, data, w, nm) => ({
      title: 'Colapso logístico na linha de frente', desc: `As colunas avançaram mais rápido que os comboios. Há falta de combustível e munição perto de ${data.geo.prov[w.target.pid].n}.`,
      context: `Logística nacional: ${Math.round(s.st.logistics)}. Parar preserva a tropa; forçar a marcha custa força dos corpos.`, default: 0,
      options: [
        { text: 'Pausar a ofensiva até reabastecer.', hint: 'Postura passa a "manter posições".', k: 'pause' },
        { text: 'Forçar a marcha com o que há.', hint: 'Avanço imediato; corpos de ataque e logística sofrem.', k: 'force' },
        { text: 'Ponte aérea de suprimentos (0,3% do PIB).', hint: 'Avanço moderado sem desgaste.', k: 'airlift' }] }),
    res: (s, data, w, k) => {
      if (k === 'pause') { w.stance = 'hold'; w.reinforce = Math.max(w.reinforce, 2); return 'A ofensiva faz uma pausa para reabastecer.'; }
      if (k === 'force') { if (w.target) w.target.p = Math.min(95, w.target.p + 18); hit(s, w, 'attack', -10); s.st.logistics = clamp(s.st.logistics - 3, 0, 100); return 'A marcha forçada rende terreno, mas os corpos de ataque chegam exaustos.'; }
      spend(s, 0.003); if (w.target) w.target.p = Math.min(95, w.target.p + 6); return 'A ponte aérea mantém o ritmo sem desgastar as tropas.';
    } },
  mutiny: {
    ok: s => s.st.warWeariness > 35,
    w: s => 1 + s.st.warWeariness / 40,
    card: (s, data, w, nm) => ({
      title: 'Motim em unidades do front', desc: 'Batalhões exaustos se recusam a voltar às trincheiras. Soldados exigem rodízio, soldo atrasado e notícias de casa.',
      context: `Cansaço de guerra: ${Math.round(s.st.warWeariness)}. A resposta marca o moral das tropas e a imagem do governo.`, default: 1,
      options: [
        { text: 'Reprimir: tribunais militares e fuzilamentos.', hint: 'Restaura a disciplina; legitimidade e militares sofrem.', k: 'repress' },
        { text: 'Pagar o soldo e conceder licenças.', hint: 'Custa 0,2% do PIB; acalma a tropa.', k: 'pay' },
        { text: 'Ignorar.', hint: 'A indisciplina se espalha.', k: 'ignore' }] }),
    res: (s, data, w, k) => {
      if (k === 'repress') { s.st.warWeariness = clamp(s.st.warWeariness - 8, 0, 100); s.st.legitimacy = clamp(s.st.legitimacy - 3, 0, 100); s.groups.military = clamp(s.groups.military - 5, 0, 100); return 'O motim é esmagado; o medo mantém a disciplina.'; }
      if (k === 'pay') { spend(s, 0.002); s.st.warWeariness = clamp(s.st.warWeariness - 6, 0, 100); s.groups.military = clamp(s.groups.military + 4, 0, 100); return 'Soldos pagos e licenças concedidas; as tropas voltam ao front.'; }
      s.st.stability = clamp(s.st.stability - 4, 0, 100); s.st.readiness = clamp(s.st.readiness - 6, 0, 100); s.st.warWeariness = clamp(s.st.warWeariness + 4, 0, 100); hit(s, w, null, -6); return 'A indisciplina se alastra: unidades perdem eficácia e a estabilidade cai.';
    } },
  volunteers: {
    ok: s => s.st.reputation >= 35,
    w: () => 0.8,
    card: (s, data, w, nm) => ({
      title: 'Voluntários estrangeiros', desc: `Veteranos de vários países oferecem-se para lutar contra ${nm}, por ideologia ou por dinheiro. Há também empresas de mercenários com propostas.`,
      context: 'Reforços rápidos, mas o inimigo faz propaganda do uso de "estrangeiros".', default: 2,
      options: [
        { text: 'Aceitar os voluntários.', hint: 'Reforço por 5 semanas; pequena perda de reputação.', k: 'accept' },
        { text: 'Contratar mercenários (0,3% do PIB).', hint: 'Reforço maior por 8 semanas; sem custo de reputação.', k: 'hire' },
        { text: 'Recusar.', hint: 'Sem efeitos.', k: 'refuse' }] }),
    res: (s, data, w, k) => {
      if (k === 'accept') { w.reinforce = Math.max(w.reinforce, 5); s.st.reputation = clamp(s.st.reputation - 2, 0, 100); return 'Voluntários chegam ao front.'; }
      if (k === 'hire') { spend(s, 0.003); w.reinforce = Math.max(w.reinforce, 8); return 'Mercenários contratados reforçam as linhas.'; }
      return '';
    } },
  atrocity: {
    ok: (s, w) => day(s) - w.start > 14 && w.cas > 0 && (w.gained.length > 0 || w.stance === 'offensive'),
    w: () => 0.7,
    card: (s, data, w, nm) => ({
      title: 'Denúncia de crimes de guerra', desc: `Jornalistas estrangeiros divulgam imagens de civis mortos numa operação de suas tropas contra ${nm}. A imprensa internacional exige explicações.`,
      context: 'Investigar protege a imagem, mas irrita os militares. Acobertar arrisca um escândalo maior.', default: 1,
      options: [
        { text: 'Abrir investigação independente.', hint: 'Reputação sobe; militares e nacionalistas reclamam.', k: 'investigate' },
        { text: 'Negar tudo e acusar propaganda inimiga.', hint: 'Sem custo imediato; chance de a verdade vazar.', k: 'deny' },
        { text: 'Elogiar publicamente as tropas.', hint: 'Militares aplaudem; condenação internacional.', k: 'praise' }] }),
    res: (s, data, w, k) => {
      if (k === 'investigate') { addWarCrime(s, 0.5); s.st.reputation = clamp(s.st.reputation + 2, 0, 100); s.st.legitimacy = clamp(s.st.legitimacy - 1, 0, 100); s.groups.military = clamp(s.groups.military - 4, 0, 100); return 'A investigação é aberta; o caso perde fôlego lá fora.'; }
      if (k === 'deny') { addWarCrime(s, 2); if (chance(0.4)) { s.st.reputation = clamp(s.st.reputation - 6, 0, 100); return 'Novas provas vazam: a negativa desmorona e a imagem do país sofre.'; } return 'A negativa cola; a história some das manchetes.'; }
      addWarCrime(s, 4); s.st.reputation = clamp(s.st.reputation - 5, 0, 100); s.groups.military = clamp(s.groups.military + 5, 0, 100); return 'As tropas ficam orgulhosas; o mundo condena.';
    } },
  // Disparado por weeklyManpower, nunca sorteado.
  manpower: {
    ok: () => false, w: () => 0,
    res: (s, data, w, k) => {
      const peak = s.manpowerPeak || s.st.troops;
      if (k === 'draft') { s.st.troops += peak * 0.1; s.groups.youth = clamp(s.groups.youth - 8, 0, 100); s.groups.workers = clamp(s.groups.workers - 3, 0, 100); s.st.warWeariness = clamp(s.st.warWeariness + 5, 0, 100); s.longMods.push({ k: 'laborSupply', v: -0.3, d: 0, left: 0, src: 'Nova convocação' }); return 'Nova classe de conscritos é convocada; fábricas e universidades sentem a falta de braços.'; }
      if (k === 'reserve') { s.st.troops += peak * 0.05; s.st.legitimacy = clamp(s.st.legitimacy - 1, 0, 100); return 'Reservistas mais velhos e voluntárias reforçam as unidades.'; }
      return '';
    } },
  breakthrough: {
    ok: (s, w) => w.stance === 'offensive' && !!w.target && (w.ratio || 1) > 0.9,
    w: (s, w) => 1 + Math.max(0, (w.ratio || 1) - 1),
    card: (s, data, w, nm) => ({
      title: `Brecha na linha de ${nm}`, desc: `Reconhecimento aponta um buraco na defesa inimiga perto de ${data.geo.prov[w.target.pid].n}. A janela de oportunidade dura poucos dias.`,
      context: 'Explorar acelera a conquista, mas estica as tropas além do planejado.', default: 1,
      options: [
        { text: 'Explorar a brecha a todo custo.', hint: 'Avanço grande; corpos de ataque perdem força.', k: 'exploit' },
        { text: 'Avançar com cautela, consolidando.', hint: 'Avanço moderado, sem desgaste.', k: 'consolidate' },
        { text: 'Manter o plano original.', hint: 'Nada muda.', k: 'ignore' }] }),
    res: (s, data, w, k) => {
      if (k === 'exploit') { if (w.target) w.target.p = Math.min(95, w.target.p + 25); hit(s, w, 'attack', -8); return 'A brecha é explorada: as colunas avançam profundamente, mas chegam esgotadas.'; }
      if (k === 'consolidate') { if (w.target) w.target.p = Math.min(95, w.target.p + 9); return 'O avanço consolidado ganha terreno de forma segura.'; }
      return '';
    } },
};

Object.assign(EVENTS, EVENTS2);
function cardFor(s, data, w, kind) {
  const nm = entName(s, data, w.enemy), E = EVENTS[kind], c = E.card(s, data, w, nm);
  return { id: `dyn_wev_${kind}_${w.id}_${day(s)}`, dyn: true, cat: 'Guerra', crisis: false, deadline: 7, ...c,
    options: c.options.map(o => ({ text: o.text, hint: o.hint, act: { type: 'warEvent', war: w.id, kind, choice: o.k } })) };
}

// ---------- Guerrilha nas províncias ocupadas ----------
function guerrillaCard(s, data, w) {
  const nm = entName(s, data, w.enemy), occ = occupied(s, w);
  const names = occ.map(p => data.geo.prov[p].n).slice(0, 3).join(', ');
  return { id: `dyn_wev_guerrilla_${w.id}_${day(s)}`, dyn: true, cat: 'Guerra', crisis: false, deadline: 7, default: 3,
    title: `Resistência armada em ${names}`, desc: `Células clandestinas atacam comboios e postos nos territórios ocupados de ${nm}. A população recusa-se a colaborar e as guarnições estão esticadas.`,
    context: `Nível de resistência: ${Math.round(w.resist)}/100 · ${occ.length} província(s) ocupada(s). Corpos na reserva reduzem a resistência.`,
    options: [
      { text: 'Reprimir com dureza.', hint: 'Custa 0,3% do PIB e homens; reputação cai; resistência diminui muito.', act: { type: 'warEvent', war: w.id, kind: 'guerrilla', choice: 'crush' } },
      { text: 'Reforçar as guarnições.', hint: 'Corpos perdem força; resistência cai.', act: { type: 'warEvent', war: w.id, kind: 'guerrilla', choice: 'garrison' } },
      { text: 'Oferecer autonomia local aos ocupados.', hint: 'Resistência cai bastante; o inimigo ganha esperança.', act: { type: 'warEvent', war: w.id, kind: 'guerrilla', choice: 'autonomy' } },
      { text: 'Ignorar.', hint: 'Os rebeldes podem libertar uma província.', act: { type: 'warEvent', war: w.id, kind: 'guerrilla', choice: 'ignore' } }] };
}
function guerrillaRes(s, data, w, k) {
  if (k === 'crush') { spend(s, 0.003); s.st.troops = Math.max(1, s.st.troops * 0.99); w.resist = clamp(w.resist - 35, 0, 100); s.st.reputation = clamp(s.st.reputation - 3, 0, 100); return 'A repressão esmaga as células, ao custo de homens e de imagem.'; }
  if (k === 'garrison') { hit(s, w, 'reserve', -5); w.resist = clamp(w.resist - 25, 0, 100); return 'Guarnições reforçadas controlam as áreas ocupadas.'; }
  if (k === 'autonomy') { w.resist = clamp(w.resist - 40, 0, 100); w.enemyExh = clamp(w.enemyExh - 3, 0, 100); return 'A autonomia local desarma parte da resistência.'; }
  const occ = occupied(s, w);
  if (occ.length && chance(0.5)) {
    const pid = pick(occ);
    delete s.world.occ[pid]; w.gained = w.gained.filter(x => x !== pid); territoryChanged(s); w.resist = clamp(w.resist - 30, 0, 100);
    w.log.unshift({ day: day(s), text: `Rebeldes libertam ${data.geo.prov[pid].n}.` });
    return `Insurgentes expulsam a guarnição e libertam ${data.geo.prov[pid].n}.`;
  }
  return 'A resistência continua, sem grandes mudanças.';
}

// ---------- Resolução e sorteio ----------
export function warEventAct(s, data, act) {
  const w = s.wars.find(x => x.id === act.war);
  if (!w || !w.active) return '';
  const msg = act.kind === 'guerrilla' ? guerrillaRes(s, data, w, act.choice) : EVENTS[act.kind]?.res(s, data, w, act.choice) || '';
  if (msg) w.log.unshift({ day: day(s), text: msg });
  return msg;
}

export function weeklyOccupation(s, data, w, ctx) {
  const occN = occupied(s, w).length;
  if (!occN) { w.resist = Math.max(0, (w.resist || 0) - 2); return; }
  const gar = (s.forces?.corps || []).filter(c => c.role === 'reserve' && c.strength > 40).length;
  w.resist = clamp((w.resist || 0) + occN * 1.0 - gar * 1.2 - 0.6, 0, 100);
  const c = s.econ.gdp * 0.0002 * occN;
  s.econ.treasury -= c; w.cost += c;
  if (w.resist > 50) { s.st.stability = clamp(s.st.stability - 0.1, 0, 100); s.st.troops = Math.max(1, s.st.troops * (1 - 0.0005 * occN * w.resist / 100)); }
  if (w.resist > 60 && (w.guerCd || 0) <= day(s) && chance(0.35)) { w.guerCd = day(s) + 28; ctx.card(guerrillaCard(s, data, w)); }
}

export function weeklyWarEvents(s, data, w, ctx) {
  const dueI = (w.evq || []).findIndex(x => x.at <= day(s));
  if (dueI >= 0) { const [x] = w.evq.splice(dueI, 1); ctx.card(cardFor(s, data, w, x.kind)); w.evCd = day(s) + 3; return; }
  if ((w.evCd || 0) > day(s) || day(s) - w.start < 7) return;
  if (!chance(0.55)) return;
  const pool = Object.keys(EVENTS).filter(k => EVENTS[k].ok(s, w) && day(s) - ((w.evLast ||= {})[k] ?? -99) > 42);
  if (!pool.length) return;
  const tot = pool.reduce((a, k) => a + EVENTS[k].w(s, w), 0);
  let r = random() * tot, kind = pool[0];
  for (const k of pool) { r -= EVENTS[k].w(s, w); if (r <= 0) { kind = k; break; } }
  w.evCd = day(s) + 6; w.evLast[kind] = day(s);
  ctx.card(cardFor(s, data, w, kind));
}

// ---------- Mão de obra ----------
export function manpowerMult(s) {
  const peak = s.manpowerPeak || s.st.troops, r = s.st.troops / Math.max(1, peak);
  return clamp(0.6 + 0.5 * r, 0.7, 1);
}
function weeklyManpower(s, data, w, ctx) {
  s.manpowerPeak = Math.max(s.st.troops, (s.manpowerPeak || s.st.troops) * 0.998);
  if (s.mobilized > 0) s.econ.treasury -= s.econ.gdp * 0.0004; // economia de guerra
  const r = s.st.troops / s.manpowerPeak;
  if (r < 0.65 && (w.manCd || 0) <= day(s) && chance(0.4)) {
    w.manCd = day(s) + 60;
    ctx.card({ id: `dyn_wev_manpower_${w.id}_${day(s)}`, dyn: true, cat: 'Guerra', crisis: false, deadline: 7, default: 2,
      title: 'Escassez de efetivos', desc: 'As baixas esvaziaram os quartéis. Os comandantes avisam que sem reposição as unidades vão combater com metade do efetivo.',
      context: `Efetivo atual: ${Math.round(r * 100)}% do pico da guerra. Isso reduz o poder de combate (×${manpowerMult(s).toFixed(2)}).`,
      options: [
        { text: 'Convocar uma nova classe de conscritos.', hint: '+10% do efetivo de pico; jovens e trabalhadores descontentes; falta de mão de obra.', act: { type: 'warEvent', war: w.id, kind: 'manpower', choice: 'draft' } },
        { text: 'Chamar reservistas e voluntárias.', hint: '+5% do efetivo; pequeno custo político.', act: { type: 'warEvent', war: w.id, kind: 'manpower', choice: 'reserve' } },
        { text: 'Aceitar o desgaste.', hint: 'Nada muda; o poder de combate continua reduzido.', act: { type: 'warEvent', war: w.id, kind: 'manpower', choice: 'accept' } }] });
  }
}

// ---------- Operações e postura do inimigo ----------
export function weeklyEnemyOps(s, data, w, ctx) {
  const F = w.factors; if (!F) return;
  const nm = entName(s, data, w.enemy), d = day(s), log = ctx.log;
  // Postura: o inimigo reage ao andamento da guerra.
  let st = 'steady';
  if (w.enemyExh > 65 || w.score > 40) st = 'entrenched'; else if ((w.ratio || 1) < 0.95 && w.enemyExh < 45) st = 'surge';
  if (st !== (w.estance || 'steady')) {
    w.estance = st;
    w.log.unshift({ day: d, text: st === 'surge' ? `${nm} lança uma mobilização ofensiva.` : st === 'entrenched' ? `${nm} passa à defesa em profundidade.` : `${nm} estabiliza sua postura.` });
  }
  // Ataques aéreos inimigos quando você perde o céu.
  if (s.forces && F.airSup < 0.5 && chance((0.5 - F.airSup) * 0.7)) {
    w.raids = (w.raids || 0) + 1;
    s.econ.gdp *= 1 - 0.002; s.st.stability = clamp(s.st.stability - 0.5, 0, 100);
    s.forces.air.wings = Math.max(1, s.forces.air.wings - 0.3);
    if (w.raids % 3 === 1) { log(`Bombardeiros de ${nm} atacam ${s.nation.capital} e a indústria. Sem superioridade aérea, o país sofre.`, 'bad'); w.log.unshift({ day: d, text: 'Ataque aéreo inimigo contra cidades e fábricas.' }); }
  }
  // Bloqueio naval inimigo.
  const blocked = !!s.nation.coastal && F.naval < 0.4;
  if (blocked && !w.eBlock) { w.eBlock = true; log(`A frota de ${nm} bloqueia nossos portos: importações e exportações estranguladas.`, 'bad'); w.log.unshift({ day: d, text: 'Bloqueio naval inimigo iniciado.' }); }
  else if (w.eBlock && F.naval > 0.5) { w.eBlock = false; log(`O bloqueio naval de ${nm} foi rompido.`, 'good'); w.log.unshift({ day: d, text: 'Bloqueio inimigo rompido.' }); }
  if (w.eBlock) { s.econ.gdp *= 0.997; s.econ.treasury -= s.econ.gdp * 0.0003; }
}

// ---------- Aliados: entradas tardias, deserções e névoa de guerra ----------
export function weeklyAllies(s, data, w, ctx) {
  const d = day(s), log = ctx.log;
  // Escalada: aliados do inimigo podem entrar mais tarde, se você estiver vencendo.
  if (d > w.start && (d - w.start) % 21 === 0 && (w.score > 30 || w.gained.length >= 3)) joinCoalitions(s, data, w, log, 0.2);
  // Aliados seus podem abandonar a guerra.
  for (const id of [...w.allies]) {
    const rp = s.partners[id]?.rel ?? 0;
    const p = 0.01 + (w.score < -20 ? 0.04 : 0) + (rp < 30 ? 0.03 : 0) + (s.st.reputation < 25 ? 0.02 : 0);
    if (!chance(p)) continue;
    w.allies = w.allies.filter(x => x !== id);
    if (s.partners[id]) s.partners[id].rel = clamp(rp - 12, -100, 100);
    log(`${entName(s, data, id)} firma paz separada e abandona a guerra.`, 'bad');
    w.log.unshift({ day: d, text: `${entName(s, data, id)} abandona a guerra.` });
  }
  // Membros da coalizão inimiga desertam quando o inimigo está perdendo.
  if (w.score > 30) for (const id of w.enemies.slice(1)) if (chance(0.03)) {
    w.enemies = w.enemies.filter(x => x !== id);
    log(`${entName(s, data, id)} abandona a coalizão inimiga.`, 'good');
    w.log.unshift({ day: d, text: `${entName(s, data, id)} deixa a coalizão inimiga.` });
  }
  weeklyManpower(s, data, w, ctx);
}

// Estimativa do poder relativo: quanto pior a inteligência, mais larga e enviesada.
export function fogEstimate(s, w, d) {
  const err = clamp((75 - s.st.intel) / 300, 0.04, 0.3);
  const bias = (hash(w.id + ':' + Math.floor(d / 7)) - 0.5) * 2 * err;
  const mid = (w.ratio || 1) * (1 + bias);
  return { mid, lo: mid * (1 - err), hi: mid * (1 + err), conf: Math.round((1 - err / 0.3) * 100) };
}
