export const PREFIX = 'mo_', CAT = 'Dilema moral';
const P = (t, d, o) => ({ t, d, o });
export const ARCS = [
  { id: 'ticking', parts: [
    P('A bomba-relógio', 'A inteligência prendeu um suspeito que, segundo ela, sabe onde há uma bomba numa estação lotada. Há horas para agir e o chefe da polícia pede carta branca.', [['Autorizar o interrogatório duro.', { hint: 'Pode salvar vidas; é tortura.', now: { civil: -2, reputation: -3, intel: 2 }, groups: { military: 2 } }], ['Só interrogatório legal.', { hint: 'Respeita a lei; o risco é real.', now: { reputation: 1, stability: -1 } }], ['Evacuar a estação e esperar.', 'S']]),
    P('O que ele disse', 'Depois do interrogatório, descobre-se que o suspeito não sabia de nada, ou que a bomba era blefe. Advogados e jornais pedem explicações.', [['Admitir o erro e punir os responsáveis.', 'E'], ['Negar que houve tortura.', 'L'], ['Abafar e transferir o preso.', 'T']]),
    P('Comissão da verdade', 'Parlamentares propõem uma comissão para investigar abusos nos interrogatórios.', [['Apoiar a comissão.', 'E'], ['Limitar a comissão.', 'N'], ['Bloquear.', 'R']])] },
  { id: 'transplant', parts: [
    P('Órgãos e filas', 'Pacientes morrem na fila de transplantes. Um projeto propõe doação presumida; outro, usar órgãos de condenados à morte.', [['Doação presumida para todos.', { hint: 'Salva vidas; criticada por tirar o consentimento.', now: { health: 1, civil: -1 }, groups: { youth: -1 } }], ['Só doação voluntária, com campanha.', 'S'], ['Aceitar os órgãos de condenados.', { hint: 'Salva vidas; abre um mercado macabro.', now: { health: 1.5, reputation: -4, civil: -2 } }]]),
    P('O mercado paralelo', 'Quadrilhas passam a vender órgãos a estrangeiros. Reportagens mostram famílias pobres vendendo rins.', [['Reprimir com penas duras.', 'R'], ['Regular um sistema de compensação.', 'M'], ['Ignorar.', 'I']]),
    P('Fila zerada?', 'Os números melhoram, mas ONGs denunciam abusos.', [['Auditar o sistema.', 'E'], ['Comemorar os números.', 'L'], ['Mudar as regras.', 'D']])] },
  { id: 'euthanasia', parts: [
    P('Morrer com dignidade', 'Um paciente terminal, que virou símbolo nacional, pede o direito de encerrar a vida. Igrejas e médicos se dividem.', [['Legalizar a eutanásia.', { hint: 'Reforma liberal; a ala religiosa rompe.', now: { civil: 2, political: 1, legitimacy: -1 }, groups: { youth: 3, rural: -4 } }], ['Cuidados paliativos em vez disso.', 'S'], ['Manter a proibição.', 'H']]),
    P('Uso e abuso', 'Surgem denúncias de pressão sobre idosos e deficientes para "escolher" a morte.', [['Endurecer as regras.', 'N'], ['Manter como está.', 'I'], ['Criar comitês de ética.', 'E']]),
    P('Turismo da morte', 'Estrangeiros viajam para morrer no país. Governos vizinhos protestam.', [['Restringir a cidadãos.', 'C'], ['Manter aberto.', 'M'], ['Negociar um acordo regional.', 'D']])] },
  { id: 'dam', parts: [
    P('A barragem e a cidade', 'Uma barragem fornecerá energia para milhões, mas inundará uma cidade histórica de 40 mil pessoas.', [['Construir e indenizar.', 'G'], ['Mudar o projeto (caro e lento).', 'S'], ['Cancelar.', 'X']]),
    P('Resistência', 'Moradores acorrentam-se às casas. A mídia estrangeira chega.', [['Remover à força.', 'R'], ['Aumentar as indenizações.', 'B'], ['Suspender as obras.', 'C']]),
    P('Nova cidade', 'A cidade nova fica pronta, mas sem a alma da antiga. Os protestos continuam.', [['Reconstruir o centro histórico.', 'S'], ['Seguir adiante.', 'I'], ['Criar um museu da cidade submersa.', 'D']])] },
  { id: 'vaccine', cond: { min: { health: 0 } }, parts: [
    P('Vacina experimental', 'Uma epidemia avança. Uma vacina experimental promete 80% de eficácia, mas sem testes completos.', [['Aplicar em massa.', { hint: 'Salva vidas; risco de efeitos graves.', now: { health: 2, reputation: -1 }, groups: { youth: -1 } }], ['Aplicar só em grupos de risco.', 'D'], ['Esperar os testes.', { hint: 'Seguro; mais mortes agora.', now: { health: -2, legitimacy: -1 } }]]),
    P('Efeitos colaterais', 'Casos graves aparecem entre vacinados. A oposição pede o fim do programa.', [['Suspender e investigar.', 'E'], ['Seguir adiante.', 'F'], ['Indenizar as vítimas.', 'S']]),
    P('Balanço', 'Os números indicam menos mortes do que o esperado, mas famílias exigem justiça.', [['Criar fundo de compensação.', 'S'], ['Declarar vitória.', 'L'], ['Abrir processo contra o laboratório.', 'V']])] },
  { id: 'whistle', parts: [
    P('O denunciante', 'Um servidor vazou documentos mostrando que o governo escondeu mortes numa obra pública. Ele agora pede asilo na embaixada de um vizinho.', [['Prender por vazamento.', 'R'], ['Proteger como denunciante.', 'E'], ['Negociar o silêncio em troca de proteção.', 'B']]),
    P('Os documentos', 'Os jornais publicam o restante dos arquivos. A oposição pede uma CPI.', [['Aceitar a investigação.', 'E'], ['Bloquear.', 'N'], ['Culpar o antecessor.', 'D']]),
    P('Eleição de prefeito', 'O denunciante é lançado candidato a prefeito por uma coalizão cívica.', [['Impugnar a candidatura.', 'R'], ['Deixar disputar.', 'E'], ['Apoiar um adversário.', 'B']])] },
  { id: 'surveil', parts: [
    P('O olho que vê tudo', 'A polícia pede câmeras com reconhecimento facial em toda a cidade. Promete reduzir homicídios em 30%.', [['Instalar nas grandes cidades.', { hint: 'Crime cai; privacidade também.', now: { crime: -4, civil: -2, control: 2 } }], ['Instalar só em pontos críticos.', 'D'], ['Rejeitar.', 'E']]),
    P('Dados vendidos', 'Descobre-se que o sistema revende dados de cidadãos a uma empresa privada.', [['Punir os responsáveis.', 'E'], ['Negar.', 'L'], ['Rescindir contrato.', 'N']]),
    P('Falso positivo', 'O sistema aponta um inocente como assassino e a polícia atira. A família processa o Estado.', [['Indenizar e rever o sistema.', 'S'], ['Defender a polícia.', 'F'], ['Abolir o sistema.', 'E']])] },
  { id: 'lifeboat', parts: [
    P('Falta de remédios', 'Durante uma crise, há doses para apenas metade dos doentes. A comissão técnica pede critérios claros.', [['Priorizar os mais jovens.', 'S'], ['Priorizar quem tem mais chance de sobreviver.', 'N'], ['Sorteio aberto.', 'E']]),
    P('Fura-filas', 'Reportagem mostra que poderosos furaram a fila e receberam doses antes de todos.', [['Demitir os envolvidos.', 'E'], ['Negar.', 'L'], ['Abrir inquérito.', 'T']]),
    P('Luto nacional', 'Há um luto nacional pelas mortes. A população pede um ato de contrição do governo.', [['Pedir perdão.', 'D'], ['Declarar luto oficial e seguir.', 'H'], ['Culpar a crise externa.', 'V']])] },
  { id: 'eco_sacrifice', parts: [
    P('A fábrica que envenena', 'Uma fábrica emprega 8 mil pessoas, mas despeja metais pesados num rio. Crianças adoecem na região.', [['Fechar a fábrica.', { hint: 'Salva crianças; 8 mil desempregos.', now: { pollution: -4, health: 1, unemployment: 0.4, growth: -0.1 }, groups: { workers: -3, youth: 2 } }], ['Exigir filtros e dar prazo.', 'X'], ['Fechar os olhos.', { hint: 'Empregos mantidos; vidas pagam.', now: { health: -2, pollution: 2, growth: 0.1 }, groups: { business: 2 } }]]),
    P('Os doentes', 'Famílias organizam um protesto; a empresa oferece "ajuda humanitária" mas pede silêncio.', [['Recusar o acordo.', 'E'], ['Aceitar e ajudar as famílias.', 'B'], ['Reprimir o protesto.', 'R']]),
    P('Justiça ambiental', 'Um tribunal manda a empresa pagar uma indenização gigante.', [['Aplicar a sentença.', 'E'], ['Negociar redução.', 'D'], ['Anular a decisão.', 'N']])] },
  { id: 'prisonexp', cond: { min: { crime: 20 } }, parts: [
    P('Experimento em presídio', 'Cientistas pedem para testar um medicamento em presos voluntários, com redução de pena em troca.', [['Autorizar o programa.', { hint: 'Avanço científico; risco de coerção.', now: { tech: 0.6, civil: -1, reputation: -2 } }], ['Só com supervisão independente.', 'D'], ['Proibir.', 'E']]),
    P('Os "voluntários"', 'Presos denunciam que foram coagidos a assinar. Há mortes no programa.', [['Suspender e investigar.', 'E'], ['Negar as mortes.', 'L'], ['Trocar a equipe científica.', 'N']]),
    P('Escândalo internacional', 'A mídia estrangeira compara o caso a experimentos de regimes sombrios.', [['Pedir desculpas.', 'D'], ['Atacar a mídia.', 'V'], ['Abrir os arquivos.', 'E']])] },
];
