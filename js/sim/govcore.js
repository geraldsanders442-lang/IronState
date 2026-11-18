// Núcleo (sem dependências) dos líderes regionais: modos e custo anual das transferências.
export const GOV_MODES = {
  none: { name: 'Administração direta', desc: 'Sem líderes regionais: a capital governa tudo. Mais controle e economia no orçamento, mas poucas obras locais, regiões ressentidas e serviços locais piores.' },
  appointed: { name: 'Líderes nomeados', desc: 'Você escolhe os governadores. Tendem a apoiar o país e a unidade nacional, mas podem ser corruptos ou impopulares localmente.' },
  elected: { name: 'Líderes eleitos', desc: 'Os governadores são eleitos pelo povo de cada região. Têm mais legitimidade e obras locais, mas podem ser da oposição e até fomentar o separatismo.' },
};
export const LEADER_TRAITS = {
  tecnocrata: { name: 'Tecnocrata', skill: 12, corrupt: -10, pop: -6, ambition: -5 },
  populista: { name: 'Populista', skill: -4, corrupt: 6, pop: 14, ambition: 12 },
  burocrata: { name: 'Burocrata', skill: 2, corrupt: 8, pop: -4, ambition: -8 },
  empreendedor: { name: 'Empreendedor', skill: 8, corrupt: 4, pop: 4, ambition: 6 },
  regionalista: { name: 'Regionalista', skill: 0, corrupt: 0, pop: 12, ambition: 18 },
  reformista: { name: 'Reformista', skill: 6, corrupt: -14, pop: 2, ambition: 4 },
  caudilho: { name: 'Caudilho local', skill: -6, corrupt: 16, pop: 8, ambition: 20 },
};
export const STANCE_NAMES = { loyal: 'Leal', neutral: 'Neutro', opposition: 'Oposição', separatist: 'Separatista' };
// Custo anual (bi) das transferências a todos os governos regionais; entra no orçamento como despesa.
export function transferAnnual(s) {
  const G = s.gov; if (!G || G.mode === 'none') return 0;
  let t = 0;
  for (const rid in G.leaders) {
    const r = s.regions.find(x => x.id === rid), L = G.leaders[rid];
    if (r) t += s.econ.gdp * 0.004 * r.popShare * (0.5 + L.autonomy / 100) * (L.kind === 'elected' ? 1.25 : 1);
  }
  return t;
}
