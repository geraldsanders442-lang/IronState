export const PREFIX = 'ic_', CAT = 'Crimes de guerra';
const P = (t, d, o) => ({ t, d, o });
export const ARCS = [
  { id: 'warn', sched: true, parts: [
    P('Advertência por crimes de guerra', 'Vizinhos e a ONU emitem uma advertência formal sobre abusos de suas tropas: civis mortos, prisioneiros maltratados e bombardeios indiscriminados.', [['Prometer investigação.', '1'], ['Negar tudo.', '2'], ['Retirar as tropas envolvidas.', { hint: 'Reduz as acusações; custa na guerra.', now: { readiness: -2, reputation: 2 }, act: { type: 'peaceKeep', op: 'trial' } }]]),
    P('Ameaça de missão de paz', 'O Conselho de Segurança ameaça enviar uma missão de paz e pede que o Tribunal Penal Internacional investigue.', [['Aceitar a missão.', 'U'], ['Recusar e desafiar a ONU.', 'O'], ['Fazer julgamentos domésticos.', '1']])] },
  { id: 'peace', sched: true, parts: [
    P('Tropas de paz à porta', 'A ONU aprova o envio de tropas de paz ao seu território por violações graves. Vizinhos preparam um mandado para prender seus comandantes.', [['Aceitar as tropas de paz.', 'U'], ['Recusar a missão.', 'O'], ['Julgar os oficiais acusados.', '1']]),
    P('Mandado de prisão', 'Um tribunal emite mandados de prisão contra altos oficiais e contra o chefe de governo. Viagens ao exterior ficam arriscadas.', [['Cooperar com o tribunal.', { hint: 'Reputação sobe; militares se revoltam.', now: { reputation: 4, coupRisk: 4 }, groups: { military: -6 } }], ['Obstruir e proteger os oficiais.', { hint: 'Militares aplaudem; sanções crescem.', now: { reputation: -4 }, groups: { military: 4 } }], ['Retirar-se do tribunal.', { hint: 'Fim do processo; isolamento.', now: { reputation: -6, legitimacy: 1 } }]])] },
];
