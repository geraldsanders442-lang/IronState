export const PREFIX = 'rf_', CAT = 'Reformas importadas';
const P = (t, d, o) => ({ t, d, o });
const FAIL = (now, groups) => ({ now, groups });
export const ARCS = [
  { id: 'prison', cond: { min: { crime: 25 } }, ctx: 'Reformas copiadas de países ricos podem fracassar onde faltam educação, instituições e dinheiro.', parts: [
    P('Presídios ao modelo nórdico', 'Consultores propõem trocar as grades por presídios abertos e programas de educação, como na Escandinávia, onde a reincidência é baixa.', [
      ['Aplicar o modelo nórdico completo.', { hint: 'Pode reduzir o crime a longo prazo; em países pobres e com educação baixa, o risco de fracasso é alto.', now: { treasury: -0.5, civil: 1 }, long: [{ k: 'crime', v: -0.2, d: 120 }], risk: { need: { education: 58, corruption: -45 }, p: 0.12, text: 'A reforma prisional fracassa: sem professores, orçamento e controle, os presídios "abertos" viram escritórios das facções.', fail: FAIL({ crime: 4, corruption: 2, legitimacy: -3, treasury: -0.3 }, { military: -1, workers: -2 }) } }],
      ['Piloto em um presídio.', { hint: 'Menos risco; resultados lentos.', now: { treasury: -0.15 }, long: [{ k: 'crime', v: -0.06, d: 120 }], risk: { need: { education: 45, corruption: -55 }, p: 0.08, fail: FAIL({ crime: 1, legitimacy: -1 }) } }],
      ['Manter o modelo atual.', { hint: 'Sem mudança.', now: { legitimacy: -0.5 } }]]),
    P('Primeiros resultados', 'Meses depois, relatórios independentes mostram o resultado. Jornais abrem as manchetes e a oposição pede explicações.', [['Ampliar o que deu certo.', 'G'], ['Rever o modelo e corrigir.', 'E'], ['Interromper o programa.', 'I']]),
    P('O debate nacional', 'Familiares de vítimas e defensores de direitos humanos se enfrentam em audiências públicas.', [['Defender a ressocialização.', 'E'], ['Endurecer as penas.', 'R'], ['Plebiscito.', 'D']])] },
  { id: 'edu', ctx: 'Reformas copiadas de países ricos podem fracassar onde faltam educação, instituições e dinheiro.', parts: [
    P('Educação ao estilo finlandês', 'Especialistas propõem acabar com provas padronizadas e dar autonomia total a professores, como na Finlândia.', [
      ['Adotar o modelo completo.', { hint: 'Grande ganho em países com professores bem formados; fracasso provável onde faltam.', now: { treasury: -0.4 }, long: [{ k: 'education', v: 0.4, d: 180 }], risk: { need: { education: 55, corruption: -45, devQ: 52 }, p: 0.1, text: 'A autonomia total vira bagunça: escolas sem professores formados e sem fiscalização pioram os resultados.', fail: FAIL({ education: -3, legitimacy: -2, treasury: -0.2 }, { youth: -3, workers: -2 }) } }],
      ['Reformar com formação de professores primeiro.', { hint: 'Mais lento e seguro.', now: { treasury: -0.3 }, long: [{ k: 'education', v: 0.25, d: 240 }], risk: { need: { education: 40 }, p: 0.05, fail: FAIL({ education: -1 }) } }],
      ['Manter o sistema.', { hint: 'Sem mudança.', now: { legitimacy: -0.5 } }]]),
    P('Greve de professores', 'Sindicatos de professores dividem-se: uns apoiam a reforma, outros pedem mais salário e estrutura.', [['Aumentar salários.', 'S'], ['Reprimir a greve.', 'R'], ['Negociar uma agenda gradual.', 'D']]),
    P('Resultados nas provas', 'Os resultados de uma prova internacional vêm à tona e viram tema nacional.', [['Divulgar tudo.', 'E'], ['Esconder.', 'L'], ['Culpar o antecessor.', 'V']])] },
  { id: 'anticorr', ctx: 'Reformas copiadas de países ricos podem fracassar onde faltam educação, instituições e dinheiro.', parts: [
    P('Agência anticorrupção independente', 'Doadores e especialistas propõem uma agência autônoma, com poder de investigar o próprio governo.', [
      ['Criar com total independência.', { hint: 'Reduz a corrupção; em ambientes muito corruptos, a agência pode ser capturada.', now: { treasury: -0.2, corruption: -3 }, risk: { need: { stability: 45, corruption: -75 }, p: 0.1, text: 'A agência é capturada por interesses políticos e vira arma de perseguição.', fail: FAIL({ corruption: 3, legitimacy: -2, political: -1 }, { opposition: -3 }) } }],
      ['Criar subordinada ao Executivo.', { hint: 'Menos risco de crise; menos credibilidade.', now: { treasury: -0.1, corruption: -1 } }],
      ['Não criar.', { hint: 'Sem mudança.', now: { legitimacy: -0.5 } }]]),
    P('O primeiro caso', 'A agência abre uma investigação contra um aliado seu. Seu partido exige que você a trave.', [['Apoiar a agência.', 'E'], ['Frear a investigação.', 'B'], ['Trocar o chefe da agência.', 'N']]),
    P('Efeito dominó', 'Outros casos aparecem e o noticiário se enche de escândalos. A economia sente a incerteza.', [['Seguir adiante.', 'E'], ['Acordos de leniência.', 'D'], ['Cortar os poderes da agência.', 'L']])] },
  { id: 'health', ctx: 'Reformas copiadas de países ricos podem fracassar onde faltam educação, instituições e dinheiro.', parts: [
    P('Saúde universal ao estilo europeu', 'Técnicos propõem um sistema único gratuito com médicos de família, como em países ricos.', [
      ['Implantar em todo o país.', { hint: 'Grande ganho; falta de médicos e de infraestrutura pode causar o colapso do sistema.', now: { treasury: -0.6, health: 1 }, long: [{ k: 'health', v: 0.5, d: 180 }], risk: { need: { devQ: 50, corruption: -50, education: 45 }, p: 0.12, text: 'O sistema único colapsa: sem médicos e verbas, filas imensas e hospitais sem remédio.', fail: FAIL({ health: -3, legitimacy: -3, treasury: -0.3 }, { workers: -3, rural: -2 }) } }],
      ['Implantar por regiões, começando pelas mais estruturadas.', { hint: 'Mais lento e seguro.', now: { treasury: -0.3, health: 0.4 }, risk: { need: { devQ: 40 }, p: 0.05, fail: FAIL({ health: -1 }) } }],
      ['Manter o sistema atual.', { hint: 'Sem mudança.', now: { legitimacy: -0.5 } }]]),
    P('Médicos em fuga', 'Médicos, desmotivados, buscam empregos no exterior ou no setor privado.', [['Reajustar salários.', 'S'], ['Obrigar o serviço público.', 'R'], ['Contratar médicos estrangeiros.', 'A']]),
    P('Fila e propaganda', 'A oposição mostra filas e a base mostra casos de sucesso. A população decide em quem acreditar.', [['Publicar os números reais.', 'E'], ['Esconder as filas.', 'L'], ['Fazer um mutirão.', 'S']])] },
];
