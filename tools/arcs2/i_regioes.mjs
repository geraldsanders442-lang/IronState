export const PREFIX = 'vc_', CAT = 'Regiões';
const P = (t, d, o, tpl) => ({ t, d, o, tpl });
const R = { region: 'any' };
const A = (op, extra = {}) => ({ act: { type: 'extra', op, id: '$region' }, ...extra });
export const ARCS = [
  { id: 'autonomy', sched: true, role: 'region', spec: 'any', parts: [
    P('{region} pede autonomia', 'Com as obras e o investimento recebidos, {region} cresceu e agora exige um estatuto de autonomia, com orçamento e polícia próprios.', [
      ['Conceder o estatuto.', A('autGrant', { hint: 'A região fica mais autônoma e leal; o centro perde controle.', now: { control: -2, legitimacy: 1 }, groups: { regional: 4 } })],
      ['Campanha de unidade nacional.', A('autPropaganda', { hint: 'Propaganda para reforçar a identidade nacional: custa e funciona devagar.', now: { treasury: -0.15 } })],
      ['Recusar e reforçar o controle.', A('autDeny', { hint: 'Controle imediato; ressentimento regional.', now: { control: 1, stability: -1 }, groups: { regional: -4 } })],
      ['Apagar o nacionalismo regional (educação e mídia).', A('autErase', { hint: 'Pode cortar o separatismo, mas gera revolta e violações.', now: { civil: -2, reputation: -2 } })]]),
    P('A resposta de {region}', 'As elites e os jovens da região reagem à sua decisão, e a imprensa local publica pesquisas sobre a independência.', [['Abrir negociações.', 'D'], ['Mandar mais obras.', 'S'], ['Endurecer.', 'R']])] },
];
