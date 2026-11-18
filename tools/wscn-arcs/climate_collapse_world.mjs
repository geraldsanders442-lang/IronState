export const WORLD = 'climate_collapse_world', CAT = 'Colapso Climático';
const P = (t, d, o) => ({ t, d, o });
const COAST = { coast: true }, COLD = { cold: true }, ECO = { min: { ax_eco: 10 } }, IND = { max: { ax_eco: -10 } };
export const ARCS = [
  { id: 'coastflood', cond: COAST, ctx: 'O mar sobe e as cidades litorâneas pagam o preço.', parts: [
    P('O mar avança', 'Marés altas inundam bairros inteiros no litoral. Famílias pedem diques ou realocação.', [['Construir diques.', 'G'], ['Realocar populações.', 'S'], ['Esperar.', 'I']]),
    P('Refugiados do litoral', 'Milhares de deslocados dormem em ginásios e escolas. Há tensão com moradores do interior.', [['Reassentar no interior.', 'B'], ['Cidades novas.', 'G'], ['Acampamentos.', 'I']]),
    P('Seguro e reconstrução', 'As seguradoras cancelam apólices no litoral. Empresas ameaçam sair.', [['Seguro estatal.', 'S'], ['Deixar ao mercado.', 'M'], ['Zona de exclusão.', 'N']])] },
  { id: 'norte', cond: COLD, role: 'power', spec: 'hostile', ctx: 'Países frios são destinos disputados num mundo em colapso.', parts: [
    P('Pedido de acolhida', '{power}, devastado pelo calor, pede para realocar milhões de pessoas em seu território.', [['Aceitar parcialmente.', 'D'], ['Aceitar com condições.', 'B'], ['Recusar.', 'F']]),
    P('Fronteira fechada', 'Multidões se aproximam da sua fronteira. Há tensão e incidentes.', [['Fechar com militares.', 'W'], ['Corredores humanitários.', 'S'], ['Pedir ajuda ao bloco.', 'D']]),
    P('Ultimato', '{power} ameaça tomar território "vazio" por motivos humanitários.', [['Mobilizar forças.', 'W'], ['Conceder terra.', 'C'], ['Negociar.', 'D']])] },
  { id: 'drought', parts: [
    P('Seca prolongada', 'Rios secam e as colheitas falham pelo terceiro ano. Fazendeiros pedem socorro.', [['Subsidiar irrigação.', 'G'], ['Importar comida.', 'A'], ['Racionar água.', 'N']]),
    P('Guerra da água', 'Duas províncias disputam o mesmo rio e há mortes.', [['Intervir.', 'N'], ['Mediar.', 'D'], ['Desviar o rio.', 'W']]),
    P('Desalinização', 'Engenheiros propõem usinas de desalinização, caras e energéticas.', [['Construir.', 'G'], ['Esperar.', 'I'], ['Parceria privada.', 'M']])] },
  { id: 'hurricane', cond: COAST, parts: [
    P('Furacão devastador', 'Um furacão recorde destrói portos e cidades. O governo é cobrado a agir.', [['Socorro total.', 'S'], ['Socorro limitado.', 'D'], ['Pedir ajuda externa.', 'A']]),
    P('Saque e ordem', 'Saques e gangues surgem nos bairros destruídos.', [['Toque de recolher.', 'R'], ['Distribuir comida.', 'S'], ['Dialogar.', 'D']]),
    P('Reconstrução', 'A reconstrução pode ser mais resistente ou mais barata.', [['Mais resistente.', 'G'], ['Mais barata.', 'M'], ['Mudar de lugar.', 'N']])] },
  { id: 'climaterefs', role: 'nb', spec: 'any', parts: [
    P('Migração climática', 'Milhões de pessoas deixam {nb} em busca de terra fértil e chegam à sua fronteira.', [['Receber.', 'S'], ['Selecionar.', 'D'], ['Fechar.', 'W']]),
    P('Campos de refugiados', 'Os campos crescem e sofrem com doenças e fome.', [['Investir em ajuda.', 'S'], ['Reduzir custos.', 'M'], ['Pedir ajuda ao bloco.', 'D']]),
    P('Acordo com {nb}', '{nb} propõe um tratado para repatriar parte dos migrantes com ajuda financeira.', [['Aceitar.', 'D'], ['Recusar.', 'F'], ['Exigir mais.', 'B']])] },
  { id: 'geoeng', role: 'power', spec: 'any', parts: [
    P('Geoengenharia', '{power} planeja lançar aerossóis na atmosfera para esfriar o planeta, alterando chuvas de todos.', [['Apoiar.', 'D'], ['Protestar.', 'F'], ['Exigir compensação.', 'B']]),
    P('Chuvas alteradas', 'As chuvas mudam: seu país ganha áreas férteis, mas perde outras.', [['Adaptar a agricultura.', 'G'], ['Culpar {power}.', 'F'], ['Aceitar.', 'I']]),
    P('Tribunal do clima', 'Países prejudicados pedem um tribunal internacional contra {power}.', [['Apoiar.', 'D'], ['Ficar neutro.', 'I'], ['Defender {power}.', 'C']])] },
  { id: 'carbonwar', cond: IND, parts: [
    P('Carbono e indústria', 'Países pedem sanções a quem ainda usa carvão. Sua indústria depende dele.', [['Resistir.', 'F'], ['Transição.', 'X'], ['Negociar.', 'D']]),
    P('Greve dos mineiros', 'Mineiros bloqueiam estradas contra o fechamento das minas.', [['Compensar.', 'S'], ['Reprimir.', 'R'], ['Adiar.', 'I']]),
    P('Fim do carvão', 'O mercado externo fecha as portas ao seu carvão.', [['Investir em renováveis.', 'G'], ['Vender barato.', 'M'], ['Contrabando.', 'T']])] },
  { id: 'ecoauth', cond: ECO, parts: [
    P('Estado de emergência climática', 'Cientistas pedem poderes extraordinários para impor racionamentos.', [['Aprovar.', 'N'], ['Aprovar com limites.', 'D'], ['Rejeitar.', 'E']]),
    P('Cartões de carbono', 'Cada cidadão recebe uma cota de carbono. O mercado paralelo surge.', [['Fiscalizar.', 'R'], ['Flexibilizar.', 'M'], ['Cortar cotas.', 'N']]),
    P('Rebelião', 'Rurais e industriais se recusam a cumprir as cotas.', [['Impor.', 'R'], ['Negociar.', 'D'], ['Recuar.', 'C']])] },
  { id: 'seeds', parts: [
    P('Banco de sementes', 'Cientistas encontram variedades resistentes ao calor e pedem verba para espalhá-las.', [['Financiar.', 'G'], ['Vender para exportar.', 'M'], ['Ignorar.', 'I']]),
    P('Biopirataria', 'Empresas estrangeiras tentam patentear as sementes.', [['Proibir a exportação.', 'N'], ['Aceitar acordo.', 'B'], ['Registrar patente.', 'P']]),
    P('Colheita surpresa', 'A nova variedade salva a colheita. Países vizinhos pedem sementes.', [['Compartilhar.', 'D'], ['Vender.', 'M'], ['Proibir.', 'N']])] },
  { id: 'wildfire', parts: [
    P('Incêndios', 'Incêndios gigantes cobrem florestas e cidades de fumaça por semanas.', [['Mobilizar o exército.', 'W'], ['Pedir ajuda externa.', 'A'], ['Esperar a chuva.', 'I']]),
    P('Fumaça e saúde', 'Hospitais lotam de casos respiratórios.', [['Distribuir máscaras.', 'S'], ['Evacuar cidades.', 'G'], ['Nada.', 'I']]),
    P('Culpados', 'Investigadores acusam madeireiras de provocar parte dos incêndios.', [['Punir.', 'N'], ['Proteger.', 'B'], ['Investigar.', 'E']])] },
  { id: 'heatdeath', parts: [
    P('Onda de calor mortal', 'Uma onda de calor mata milhares em poucos dias, sobretudo idosos.', [['Abrigos climatizados.', 'S'], ['Feriados forçados.', 'N'], ['Campanha de alerta.', 'D']]),
    P('Energia no limite', 'A demanda por ar-condicionado quebra a rede elétrica.', [['Racionar.', 'N'], ['Importar energia.', 'A'], ['Construir usinas.', 'G']]),
    P('Cidades-refúgio', 'Planejadores propõem cidades subterrâneas e refrigeradas.', [['Construir.', 'G'], ['Rejeitar.', 'I'], ['Parceria privada.', 'M']])] },
  { id: 'fishcollapse', cond: COAST, parts: [
    P('Pesca em colapso', 'Os oceanos aquecem e a pesca desaba. Vilas costeiras ficam sem sustento.', [['Auxílio.', 'S'], ['Criar aquicultura.', 'G'], ['Deixar.', 'I']]),
    P('Frotas estrangeiras', 'Frotas estrangeiras pescam em suas águas à noite.', [['Patrulhar.', 'W'], ['Negociar cotas.', 'D'], ['Ignorar.', 'I']]),
    P('Acordo oceânico', 'Países propõem cotas de pesca e áreas protegidas.', [['Assinar.', 'D'], ['Rejeitar.', 'F'], ['Assinar com ressalvas.', 'B']])] },
  { id: 'arcticrush', cond: COLD, parts: [
    P('Corrida ao gelo derretido', 'O degelo abre minas, portos e terras no norte. Empresas e países correm para reivindicá-las.', [['Reivindicar.', 'F'], ['Licitar.', 'M'], ['Proteger.', 'X']]),
    P('Povos nativos', 'Povos do norte reclamam seus direitos sobre as terras.', [['Respeitar.', 'E'], ['Negociar.', 'D'], ['Ignorar.', 'I']]),
    P('Bases militares', 'Rivais instalam bases no gelo e a tensão cresce.', [['Responder.', 'W'], ['Tratado.', 'D'], ['Recuar.', 'C']])] },
  { id: 'climateaid', role: 'power', spec: 'friendly', parts: [
    P('Fundo de adaptação', '{power} oferece verba para obras de adaptação, mas quer influência nas decisões.', [['Aceitar.', 'A'], ['Recusar.', 'F'], ['Negociar.', 'D']]),
    P('Fiscais do clima', 'Auditores acompanham gastos e reclamam de desvios.', [['Cooperar.', 'D'], ['Limitar.', 'N'], ['Punir os culpados.', 'E']]),
    P('Cláusula', '{power} propõe cláusula de acesso a recursos como pagamento.', [['Aceitar.', 'C'], ['Recusar.', 'F'], ['Negociar.', 'D']])] },
  { id: 'techhope', parts: [
    P('Captura de carbono', 'Uma startup promete capturar carbono em escala industrial, com subsídios.', [['Subsidiar.', 'G'], ['Deixar ao mercado.', 'M'], ['Rejeitar.', 'I']]),
    P('Resultado duvidoso', 'Cientistas independentes dizem que a tecnologia é um embuste.', [['Suspender.', 'N'], ['Continuar.', 'B'], ['Auditar.', 'E']]),
    P('Esperança ou ilusão', 'Os primeiros resultados mostram reduções modestas.', [['Ampliar.', 'G'], ['Redirecionar verbas.', 'S'], ['Manter.', 'I']])] },
];
