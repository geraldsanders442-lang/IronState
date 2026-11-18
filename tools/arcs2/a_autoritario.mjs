export const PREFIX = 'au_', CAT = 'Arte e censura';
const P = (t, d, o) => ({ t, d, o });
const AU = { state: ['authoritarian', 'dystopia'] }, DY = { state: 'dystopia' };
export const ARCS = [
  { id: 'film', cond: AU, parts: [
    P('O filme que o censor não viu', 'Um cineasta premiado rodou um filme sobre desaparecidos e a pré-estreia lotou. O censor chegou tarde: a cópia já circula em festivais.', [['Proibir e apreender as cópias.', 'L'], ['Deixar passar com cortes.', 'D'], ['Premiar o filme e usá-lo como prova de abertura.', 'E']]),
    P('Festival no exterior', 'O filme ganha um prêmio no exterior. Jornais estrangeiros perguntam por que o diretor está proibido de viajar.', [['Manter a proibição de viagem.', 'R'], ['Liberar a viagem sob vigilância.', 'T'], ['Pressionar o festival a retirar o prêmio.', 'V']]),
    P('O diretor volta', 'O cineasta volta ao país e dá entrevistas. Jovens fazem fila para ouvi-lo. A polícia pergunta o que fazer.', [['Prender por "difamação".', 'R'], ['Convidar para ministro da Cultura.', 'B'], ['Ignorar e acompanhar de longe.', 'I']])] },
  { id: 'cartoon', cond: AU, parts: [
    P('A charge', 'Um cartunista desenha o líder como marionete de generais. A charge viraliza e o gabinete exige providências.', [['Processar o jornal.', 'L'], ['Rir e responder com humor.', 'E'], ['Obrigar o jornal a pedir desculpas.', 'N']]),
    P('Fechamento do jornal', 'Pressionado, o dono do jornal demite o cartunista. Os colegas organizam um ato silencioso.', [['Prender os organizadores.', 'R'], ['Tolerar o ato.', 'I'], ['Cooptar o cartunista com um cargo.', 'B']]),
    P('Charges anônimas', 'Charges anônimas aparecem em muros e redes. A polícia pergunta o que fazer.', [['Criar um departamento anti-sátira.', 'L'], ['Ignorar.', 'I'], ['Propor um prêmio de humor oficial.', 'E']])] },
  { id: 'museum', cond: AU, parts: [
    P('Museu da história oficial', 'O partido quer reescrever o museu nacional: sai a seção sobre as repressões, entra a "memória gloriosa".', [['Reescrever tudo.', 'N'], ['Manter com ressalvas.', 'D'], ['Entregar a curadoria a historiadores.', 'E']]),
    P('Curadores demitidos', 'Curadores se demitem em protesto e levam arquivos para o exterior.', [['Acusar de roubo.', 'R'], ['Negociar a devolução.', 'D'], ['Ignorar.', 'I']]),
    P('Visitas escolares obrigatórias', 'A nova exposição vira visita obrigatória nas escolas. Professores reclamam em segredo.', [['Manter obrigatório.', 'N'], ['Tornar opcional.', 'E'], ['Premiar escolas que aderirem.', 'S']])] },
  { id: 'music', cond: AU, parts: [
    P('Rock proibido', 'Uma banda de rock lota estádios com letras que lembram a liberdade. O ministério vê "subversão".', [['Proibir os shows.', 'L'], ['Permitir e monitorar.', 'T'], ['Contratar a banda para eventos oficiais.', 'B']]),
    P('Show clandestino', 'Milhares de jovens aparecem num show clandestino. A polícia cerca o local.', [['Dispersar à força.', 'R'], ['Deixar acontecer.', 'I'], ['Negociar o fim do show.', 'D']]),
    P('O vocalista', 'O vocalista pede asilo no exterior e acusa o governo de perseguição.', [['Revogar a cidadania.', 'R'], ['Responder publicamente.', 'D'], ['Silenciar a imprensa.', 'L']])] },
  { id: 'books', cond: AU, parts: [
    P('Lista de livros proibidos', 'Uma comissão apresenta uma lista de 300 livros "nocivos". Bibliotecas devem retirá-los das estantes.', [['Aprovar a lista.', 'L'], ['Reduzir a lista.', 'D'], ['Rejeitar a lista.', 'E']]),
    P('Fogueira na praça', 'Grupos militantes queimam livros em praça pública, e as cenas aparecem no exterior.', [['Condenar os militantes.', 'E'], ['Silenciar.', 'I'], ['Elogiar o gesto.', 'F']]),
    P('Mercado de livros proibidos', 'Livros proibidos viram objeto de luxo no mercado negro e a procura explode.', [['Combater o contrabando.', 'R'], ['Liberar parte dos títulos.', 'D'], ['Lançar edições "autorizadas".', 'B']])] },
  { id: 'internet', cond: AU, parts: [
    P('A grande muralha digital', 'Técnicos propõem filtrar a internet e exigir cadastro com documento para publicar.', [['Aprovar o filtro total.', 'L'], ['Filtro só para temas políticos.', 'N'], ['Rejeitar.', 'E']]),
    P('VPN e fuga digital', 'Jovens usam VPNs em massa; o tráfego cai e as empresas reclamam da lentidão.', [['Criminalizar VPNs.', 'R'], ['Tolerar para empresas.', 'M'], ['Liberar o tráfego.', 'E']]),
    P('Cadastro vazado', 'O cadastro de usuários é vazado: milhares de nomes de críticos do governo viram lista pública.', [['Prender hackers.', 'R'], ['Pedir desculpas.', 'D'], ['Negar o vazamento.', 'L']])] },
  { id: 'theater', cond: AU, parts: [
    P('Peça de teatro', 'Uma companhia teatral encena uma peça sobre um tirano. Todos sabem a quem se refere.', [['Fechar o teatro.', 'L'], ['Assistir e aplaudir.', 'E'], ['Exigir alterações no texto.', 'N']]),
    P('Plateias lotadas', 'A proibição só aumenta o interesse. As sessões clandestinas lotam.', [['Prender atores.', 'R'], ['Liberar.', 'D'], ['Patrocinar uma peça oficial concorrente.', 'B']]),
    P('Anistia aos artistas', 'Entidades pedem anistia aos artistas processados.', [['Conceder.', 'E'], ['Negar.', 'N'], ['Condicionar a uma retratação.', 'C']])] },
  { id: 'ministry', cond: DY, ctx: 'Numa distopia, o Estado tenta controlar a verdade.', parts: [
    P('O Ministério da Verdade', 'Assessores propõem um órgão para corrigir "informações falsas" em jornais, livros e arquivos.', [['Criar o ministério.', 'L'], ['Criar só uma comissão.', 'N'], ['Rejeitar.', 'E']]),
    P('Fotos apagadas', 'Fotos de dissidentes são retiradas dos arquivos. Familiares denunciam que parentes "nunca existiram".', [['Continuar apagando.', 'L'], ['Parar com a prática.', 'E'], ['Perseguir quem denunciou.', 'R']]),
    P('A verdade oficial', 'Pesquisas internas mostram que muitos já repetem a versão oficial sem questionar.', [['Ampliar o programa.', 'L'], ['Frear o projeto.', 'E'], ['Lançar uma campanha de unidade.', 'H']])] },
  { id: 'informers', cond: DY, parts: [
    P('Delatores premiados', 'O ministério propõe pagar quem denunciar "pensamentos desleais" de vizinhos e colegas.', [['Criar o programa.', 'L'], ['Limitar a casos de segurança.', 'N'], ['Rejeitar.', 'E']]),
    P('Famílias divididas', 'Filhos denunciam pais, e vizinhos desaparecem. A população fala baixo.', [['Manter o programa.', 'R'], ['Suspender.', 'E'], ['Premiar quem não denunciar.', 'S']]),
    P('Revolta silenciosa', 'Greves de silêncio e atrasos em fábricas aparecem em todo o país.', [['Castigar as fábricas.', 'R'], ['Negociar com os operários.', 'S'], ['Abrir uma investigação.', 'T']])] },
  { id: 'mural', cond: AU, parts: [
    P('O mural', 'Artistas de rua pintam um mural gigante criticando a polícia. A prefeitura quer cobri-lo de tinta.', [['Cobrir o mural.', 'L'], ['Deixar.', 'E'], ['Encomendar outro mural, oficial.', 'B']]),
    P('Muros em branco', 'Os artistas retornam e escrevem o mesmo slogan em toda a cidade.', [['Prender os grafiteiros.', 'R'], ['Criar áreas legais de grafite.', 'D'], ['Ignorar.', 'I']]),
    P('Reconhecimento internacional', 'Um prêmio internacional é dado aos artistas.', [['Atacar o prêmio.', 'V'], ['Reconhecer o mérito.', 'E'], ['Ignorar.', 'I']])] },
  { id: 'anthem', cond: AU, parts: [
    P('O novo hino', 'Compositores oficiais propõem trocar o hino por uma versão exaltando o líder. Há quem torça o nariz.', [['Trocar o hino.', 'H'], ['Manter o antigo.', 'D'], ['Convocar concurso público.', 'E']]),
    P('Estudantes calados', 'Estudantes se recusam a cantar o novo hino numa cerimônia.', [['Punir a escola.', 'R'], ['Perdoar.', 'D'], ['Premiar os que cantarem.', 'B']]),
    P('Estádio vaia', 'A torcida de um jogo vaia o hino diante das câmeras.', [['Proibir torcidas.', 'L'], ['Diálogo com a torcida.', 'E'], ['Ignorar.', 'I']])] },
];
