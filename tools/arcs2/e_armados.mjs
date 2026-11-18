export const PREFIX = 'ar_', CAT = 'Grupos armados';
const P = (t, d, o) => ({ t, d, o });
export const ARCS = [
  { id: 'sep', sched: true, parts: [
    P('Uma frente armada na região', 'Um movimento separatista armado aparece numa região periférica: ataques a postos policiais, bandeira própria e uma rádio clandestina.', [['Ofensiva militar.', 'K'], ['Abrir negociação.', 'Y'], ['Anistia e autonomia ampliada.', 'Z'], ['Cooptar os líderes com cargos.', 'Q']]),
    P('A resposta da região', 'A população local se divide: parte apoia os rebeldes, parte teme represálias do exército.', [['Concentrar tropas e fechar estradas.', 'K'], ['Enviar obras e hospitais.', 'S'], ['Mesa de diálogo com chefes locais.', 'Y']]),
    P('Cessar-fogo ou escalada', 'Os rebeldes oferecem um cessar-fogo temporário; os generais pedem a ofensiva final.', [['Aceitar o cessar-fogo.', 'Y'], ['Ofensiva final.', 'K'], ['Integrar os rebeldes ao exército.', 'J']])] },
  { id: 'eth', sched: true, parts: [
    P('Milícia étnica em armas', 'Uma milícia nasce em bairros de uma minoria perseguida e promete "proteger o povo" contra a polícia e vizinhos.', [['Desarmar à força.', 'K'], ['Negociar com anciãos e líderes.', 'Y'], ['Programa de desarmamento com direitos de minoria.', 'Z']]),
    P('Vingança e ressentimento', 'Dois ataques mútuos deixam mortos. Jornais divulgam as vítimas de cada lado.', [['Enviar tropas de interposição.', 'W'], ['Mediar com líderes religiosos.', 'D'], ['Armar o lado "legalista".', { hint: 'Controle imediato; futura guerra civil.', now: { stability: -2 }, act: { type: 'armed', op: 'fund' } }]]),
    P('Cidade dividida', 'A cidade fica dividida em bairros étnicos com barricadas.', [['Remover as barricadas.', 'K'], ['Reconhecer os bairros.', 'C'], ['Criar polícia mista.', 'E']])] },
  { id: 'pro', sched: true, parts: [
    P('A milícia que "defende" o governo', 'Grupos leais ao governo, com bastões e camisas de uma cor, patrulham as ruas e intimidam opositores.', [['Dissolver o grupo.', { hint: 'Perde apoio da base; ganha respeito.', now: { civil: 1, legitimacy: -1 }, act: { type: 'armed', op: 'dissolve', kind: 'progov' } }], ['Integrá-lo à polícia.', 'J'], ['Deixar atuar.', { hint: 'A base se arma; a violência política cresce.', now: { protest: -3, civil: -2, reputation: -2 }, act: { type: 'armed', op: 'fund', kind: 'progov' } }]]),
    P('Ataque a uma redação', 'A milícia depreda a sede de um jornal crítico. Colunistas pedem proteção.', [['Prender os atacantes.', 'E'], ['Culpar o jornal.', 'L'], ['Reforçar a segurança da imprensa.', 'S']]),
    P('Fora de controle', 'Parte da milícia se recusa a obedecer e passa a extorquir comerciantes.', [['Desarmar o grupo.', 'K'], ['Pagar para manter a lealdade.', 'Q'], ['Dissolver e reintegrar.', 'J']])] },
  { id: 'gang', sched: true, parts: [
    P('Chefes do crime dominam os presídios', 'Uma facção comanda presídios e bairros, e já atacou ônibus e delegacias numa semana de terror.', [['Intervenção militar nos bairros.', 'K'], ['Negociar com a cúpula.', 'Q'], ['Reforma penal e social profunda.', { hint: 'Caro e demorado; reduz o poder da facção.', now: { treasury: -0.4, crime: -2 }, act: { type: 'armed', op: 'disarm', kind: 'gang' } }]]),
    P('Toque de recolher da facção', 'A facção impõe toque de recolher em bairros inteiros.', [['Reocupar as ruas.', 'K'], ['Fechar acordos locais.', 'Y'], ['Convocar a população à resistência.', 'H']]),
    P('Acordo secreto', 'Um intermediário oferece um acordo: segurança nas ruas em troca de benefícios aos presos.', [['Aceitar em segredo.', 'Q'], ['Recusar.', 'F'], ['Tornar público.', 'E']])] },
  { id: 'rel', sched: true, parts: [
    P('Guarda da Fé', 'Um grupo radical religioso fiscaliza roupas, bebidas e comportamento nas ruas, e passa a atacar quem desobedece.', [['Banir o grupo.', 'K'], ['Negociar com os clérigos.', 'Y'], ['Cooptar com um conselho de moralidade.', 'Q']]),
    P('Ataque a um café', 'O grupo ataca um café e fere vários jovens, entre eles estrangeiros.', [['Prender os culpados.', 'E'], ['Elogiar o zelo religioso.', 'H'], ['Fechar o café por "perturbar a ordem".', 'C']]),
    P('Cerco à universidade', 'Grupos radicais cercam a universidade e exigem a demissão de professores.', [['Proteger a universidade.', 'E'], ['Ceder às exigências.', 'C'], ['Mediar.', 'D']])] },
  { id: 'war', sched: true, parts: [
    P('Senhor da guerra', 'Um comandante local assumiu o controle de uma região, cobra impostos e comanda soldados próprios.', [['Atacar antes que cresça.', 'K'], ['Nomeá-lo governador.', 'Q'], ['Integrar suas tropas.', 'J']]),
    P('Minas e contrabando', 'O comandante controla uma mina e vende minérios para grupos estrangeiros.', [['Bloquear as rotas.', 'W'], ['Dividir os lucros.', 'B'], ['Pedir ajuda militar externa.', 'A']]),
    P('O último aviso', 'O comandante pede uma reunião e fala em independência.', [['Prender na reunião.', 'T'], ['Aceitar autonomia.', 'C'], ['Mandar ultimato.', 'F']])] },
];
