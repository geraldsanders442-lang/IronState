export const PREFIX = 'cp2_', CAT = 'País';
const P = (t, d, o) => ({ t, d, o });
const K = (iso, cat) => ({ cond: { countries: [iso] }, cat });
export const ARCS = [
  // ---------------- ALEMANHA ----------------
  { id: 'deu_energy', ...K('DEU', 'Alemanha'), parts: [
    P('Fim da energia nuclear e do carvão', 'Usinas fecham e o preço da energia sobe; a indústria ameaça sair.', [['Subsidiar a indústria.', 'S'], ['Acelerar as renováveis.', 'G'], ['Reativar usinas.', 'M']]),
    P('Dependência do gás', 'Fornecedores externos usam o gás como pressão política.', [['Terminais de GNL.', 'G'], ['Racionamento.', 'N'], ['Acordo bilateral.', 'D']]),
    P('Fábricas migram', 'Empresas químicas abrem plantas nos EUA.', [['Incentivos.', 'M'], ['Preço teto da energia.', 'S'], ['Aceitar.', 'I']])] },
  { id: 'deu_afd', ...K('DEU', 'Alemanha'), parts: [
    P('A extrema-direita sobe', 'Um partido nacionalista lidera as pesquisas no Leste.', [['Cordão sanitário.', 'N'], ['Dialogar com eleitores.', 'D'], ['Adotar parte da agenda.', 'C']]),
    P('Proibir o partido?', 'Juristas pedem que o Tribunal Constitucional o proíba.', [['Pedir proibição.', 'R'], ['Combater nas urnas.', 'E'], ['Ignorar.', 'I']]),
    P('Atentados e radicalização', 'Células radicais se armam.', [['Inteligência.', 'T'], ['Educação cívica.', 'S'], ['Leis duras.', 'R']])] },
  { id: 'deu_migr', ...K('DEU', 'Alemanha'), parts: [
    P('Integração de refugiados', 'Cidades lotadas pedem verbas para escolas e moradia.', [['Fundo federal.', 'S'], ['Cotas por estado.', 'N'], ['Restringir.', 'R']]),
    P('Escassez de mão de obra', 'Hospitais e fábricas precisam de trabalhadores.', [['Visto de trabalho.', 'M'], ['Requalificação.', 'G'], ['Esperar.', 'I']]),
    P('Atentado e debate', 'Um crime comovente reacende o tema.', [['Deportações rápidas.', 'R'], ['Medidas calmas.', 'D'], ['Campanha de integração.', 'S']])] },
  { id: 'deu_auto', ...K('DEU', 'Alemanha'), parts: [
    P('A indústria automotiva', 'Montadoras hesitam entre elétricos e combustão.', [['Meta de elétricos.', 'X'], ['Neutralidade tecnológica.', 'M'], ['Proteger empregos.', 'S']]),
    P('Concorrência chinesa', 'Carros elétricos baratos inundam a Europa.', [['Tarifas.', 'V'], ['Parceria.', 'D'], ['Subsídio.', 'S']]),
    P('Demissões e greves', 'Sindicatos param as fábricas.', [['Negociar.', 'D'], ['Resistir.', 'F'], ['Plano de transição.', 'G']])] },
  { id: 'deu_defense', ...K('DEU', 'Alemanha'), parts: [
    P('Fundo de rearmamento', 'A guerra na Europa pressiona o país a gastar 2% do PIB.', [['Rearmar.', 'W'], ['Gradual.', 'D'], ['Priorizar diplomacia.', 'E']]),
    P('Bundeswehr e recrutamento', 'Faltam soldados e equipamentos.', [['Serviço obrigatório.', 'N'], ['Salários maiores.', 'S'], ['Mercenários e aliados.', 'A']]),
    P('Bomba americana na Alemanha', 'A Otan quer armas nucleares no território.', [['Aceitar.', 'W'], ['Recusar.', 'E'], ['Debate público.', 'D']])] },
  { id: 'deu_east', ...K('DEU', 'Alemanha'), parts: [
    P('Leste e Oeste', 'O Leste se sente cidadão de segunda classe.', [['Fundo de convergência.', 'S'], ['Política cultural.', 'D'], ['Esperar.', 'I']]),
    P('Fábricas no Leste', 'Empresas só vão se houver subsídio.', [['Subsídios.', 'S'], ['Impostos menores.', 'M'], ['Infraestrutura.', 'G']]),
    P('Êxodo de jovens', 'Cidades do Leste envelhecem.', [['Universidades.', 'G'], ['Bônus de permanência.', 'S'], ['Imigração.', 'M']])] },
  { id: 'deu_union', ...K('DEU', 'Alemanha'), parts: [
    P('Liderança na Europa', 'A França e países do sul pedem que Berlim banque a integração.', [['Financiar.', 'D'], ['Exigir disciplina.', 'N'], ['Recusar.', 'F']]),
    P('Regras fiscais', 'O freio da dívida limita o investimento.', [['Reformar.', 'E'], ['Manter.', 'I'], ['Exceções.', 'D']]),
    P('Crise no euro', 'Mercados atacam a dívida de um membro.', [['Resgate.', 'S'], ['Austeridade.', 'N'], ['Reestruturar.', 'D']])] },

  // ---------------- FRANÇA ----------------
  { id: 'fra_pension', ...K('FRA', 'França'), parts: [
    P('Reforma da previdência', 'Subir a idade de aposentadoria incendeia sindicatos.', [['Manter e enfrentar.', 'F'], ['Negociar uma versão suave.', 'D'], ['Retirar.', 'C']]),
    P('Greve geral e lixo nas ruas', 'Ferrovias e refinarias param.', [['Requisitar grevistas.', 'R'], ['Mediar.', 'D'], ['Ceder.', 'C']]),
    P('Decreto sem voto', 'O governo usa um decreto para aprovar a lei.', [['Usar.', 'N'], ['Votar.', 'E'], ['Plebiscito.', 'D']])] },
  { id: 'fra_banlieue', ...K('FRA', 'França'), parts: [
    P('Revolta nos subúrbios', 'Após uma morte pela polícia, bairros pegam fogo.', [['Toque de recolher.', 'R'], ['Plano para os bairros.', 'S'], ['Reforma da polícia.', 'E']]),
    P('Discriminação e emprego', 'Jovens dos subúrbios não conseguem vagas.', [['Cotas.', 'S'], ['Educação.', 'G'], ['Mercado.', 'M']]),
    P('Laicidade e véu', 'O debate sobre símbolos religiosos volta.', [['Proibir.', 'N'], ['Tolerar.', 'D'], ['Diálogo com mesquitas.', 'E']])] },
  { id: 'fra_africa', ...K('FRA', 'França'), parts: [
    P('A França na África', 'Golpes expulsam tropas francesas do Sahel.', [['Retirar.', 'C'], ['Manter bases.', 'W'], ['Cooperação nova.', 'D']]),
    P('Franco CFA', 'A moeda africana é vista como herança colonial.', [['Reformar.', 'E'], ['Manter.', 'I'], ['Encerrar.', 'C']]),
    P('Imigração e vistos', 'Países africanos pedem vistos facilitados.', [['Facilitar.', 'D'], ['Restringir.', 'R'], ['Acordos.', 'B']])] },
  { id: 'fra_farm', ...K('FRA', 'França'), parts: [
    P('Fazendeiros bloqueiam estradas', 'Tratores cercam Paris contra regras ambientais e acordos comerciais.', [['Recuar nas regras.', 'C'], ['Subsídios.', 'S'], ['Manter e dialogar.', 'D']]),
    P('Acordo com o Mercosul', 'Produtores temem concorrência sul-americana.', [['Vetar.', 'F'], ['Salvaguardas.', 'V'], ['Aprovar.', 'M']]),
    P('Água e secas', 'Reservatórios agrícolas geram conflito.', [['Regular.', 'N'], ['Liberar.', 'M'], ['Tecnologia.', 'G']])] },
  { id: 'fra_nuke', ...K('FRA', 'França'), parts: [
    P('Dissuasão nuclear europeia', 'Aliados pedem que o guarda-chuva nuclear francês cubra a Europa.', [['Oferecer.', 'W'], ['Manter nacional.', 'F'], ['Debate europeu.', 'D']]),
    P('Energia nuclear civil', 'Reatores envelhecem e atrasam.', [['Novos reatores.', 'G'], ['Mix renovável.', 'X'], ['Prolongar.', 'M']]),
    P('Autonomia estratégica', 'A França quer reduzir a dependência dos EUA.', [['Fundo de defesa europeu.', 'G'], ['Alinhar com a Otan.', 'A'], ['Neutralidade.', 'E']])] },
  { id: 'fra_polit', ...K('FRA', 'França'), parts: [
    P('Coabitação e impasse', 'O parlamento não dá maioria ao presidente.', [['Governar por decreto.', 'N'], ['Coalizão.', 'D'], ['Dissolver.', 'E']]),
    P('Extrema-direita e esquerda radical', 'Os extremos crescem.', [['Frente republicana.', 'D'], ['Cooptar pautas.', 'C'], ['Combater.', 'V']]),
    P('Corrupção de ministros', 'Escândalos derrubam auxiliares.', [['Demitir.', 'E'], ['Proteger.', 'B'], ['Investigar.', 'N']])] },
  { id: 'fra_culture', ...K('FRA', 'França'), parts: [
    P('A exceção cultural', 'Plataformas globais dominam cinema e música.', [['Cotas e taxas.', 'N'], ['Parceria.', 'M'], ['Ignorar.', 'I']]),
    P('Língua francesa', 'O inglês invade ciência e empresas.', [['Lei da língua.', 'H'], ['Incentivo.', 'S'], ['Tolerar.', 'I']]),
    P('Turismo de massa', 'Monumentos sofrem com filas e preços.', [['Limitar.', 'N'], ['Taxar.', 'M'], ['Expandir.', 'G']])] },

  // ---------------- REINO UNIDO ----------------
  { id: 'gbr_scot', ...K('GBR', 'Reino Unido'), parts: [
    P('Escócia pede novo referendo', 'O governo escocês pressiona por independência.', [['Autorizar.', 'E'], ['Recusar.', 'N'], ['Mais autonomia.', 'D']]),
    P('Petróleo do Mar do Norte', 'O petróleo é central na disputa fiscal.', [['Dividir a receita.', 'D'], ['Manter em Londres.', 'F'], ['Transição verde.', 'X']]),
    P('Fronteira e moeda', 'E se a Escócia sair? Libra, defesa e bases.', [['Negociar.', 'D'], ['Endurecer.', 'F'], ['Plebiscito.', 'E']])] },
  { id: 'gbr_nhs', ...K('GBR', 'Reino Unido'), parts: [
    P('Crise do serviço de saúde', 'Filas de meses e greves de médicos.', [['Mais verbas.', 'S'], ['Mercado interno.', 'M'], ['Reorganizar.', 'N']]),
    P('Greve de enfermeiros', 'Enfermeiros pedem reposição salarial.', [['Conceder.', 'S'], ['Resistir.', 'F'], ['Mediação.', 'D']]),
    P('Seguro privado', 'Cresce a procura por planos privados.', [['Incentivar.', 'M'], ['Limitar.', 'N'], ['Ignorar.', 'I']])] },
  { id: 'gbr_brexit', ...K('GBR', 'Reino Unido'), parts: [
    P('O custo do Brexit', 'Fronteiras e burocracia afetam comércio e pesca.', [['Reaproximar da UE.', 'D'], ['Manter.', 'I'], ['Novos acordos globais.', 'G']]),
    P('Irlanda do Norte', 'O protocolo de fronteira divide unionistas.', [['Renegociar.', 'D'], ['Suspender.', 'F'], ['Compromisso.', 'C']]),
    P('Falta de mão de obra', 'Campos e hospitais sem trabalhadores.', [['Vistos.', 'M'], ['Treinar nacionais.', 'G'], ['Esperar.', 'I']])] },
  { id: 'gbr_monarchy', ...K('GBR', 'Reino Unido'), parts: [
    P('O futuro da monarquia', 'Escândalos e custos reabrem o debate republicano.', [['Reformar.', 'E'], ['Manter.', 'H'], ['Referendo.', 'D']]),
    P('Commonwealth', 'Ex-colônias pedem reparações e saída da coroa.', [['Pedir desculpas.', 'D'], ['Negar.', 'F'], ['Fundo de desenvolvimento.', 'S']]),
    P('Herança colonial', 'Museus são cobrados a devolver tesouros.', [['Devolver.', 'C'], ['Emprestar.', 'D'], ['Recusar.', 'F']])] },
  { id: 'gbr_housing', ...K('GBR', 'Reino Unido'), parts: [
    P('Crise de moradia', 'Aluguéis em Londres batem recordes.', [['Construir.', 'G'], ['Controle de aluguéis.', 'N'], ['Mercado.', 'M']]),
    P('Cinturão verde', 'Construir em áreas verdes divide aldeias.', [['Liberar.', 'M'], ['Proteger.', 'X'], ['Negociar.', 'D']]),
    P('Despejos', 'Famílias são despejadas por reformas.', [['Proteção.', 'S'], ['Mercado.', 'M'], ['Auxílio.', 'D']])] },
  { id: 'gbr_media', ...K('GBR', 'Reino Unido'), parts: [
    P('Tabloides e privacidade', 'A imprensa invade a vida privada de ministros.', [['Lei de privacidade.', 'N'], ['Liberdade total.', 'E'], ['Autorregulação.', 'D']]),
    P('BBC', 'O financiamento público da emissora é questionado.', [['Cortar.', 'M'], ['Manter.', 'S'], ['Reformar.', 'D']]),
    P('Fake news eleitoral', 'Campanhas usam desinformação.', [['Regular plataformas.', 'N'], ['Educação.', 'S'], ['Nada.', 'I']])] },
  { id: 'gbr_finance', ...K('GBR', 'Reino Unido'), parts: [
    P('A City de Londres', 'Bancos ameaçam migrar para Paris e Nova York.', [['Desregular.', 'M'], ['Manter regras.', 'N'], ['Incentivos.', 'S']]),
    P('Paraíso fiscal britânico', 'Territórios ultramarinos escondem fortunas.', [['Transparência.', 'E'], ['Proteger.', 'B'], ['Acordos.', 'D']]),
    P('Crise do câmbio', 'A libra cai depois de um orçamento ousado.', [['Recuar.', 'C'], ['Manter.', 'F'], ['Estabilizar.', 'D']])] },

  // ---------------- JAPÃO ----------------
  { id: 'jpn_age', ...K('JPN', 'Japão'), parts: [
    P('Sociedade envelhecida', 'Há mais idosos que jovens e as cidades rurais morrem.', [['Imigração controlada.', 'M'], ['Robôs de cuidado.', 'G'], ['Incentivos à natalidade.', 'S']]),
    P('Previdência no limite', 'Contribuintes sustentam cada vez mais aposentados.', [['Subir a idade.', 'N'], ['Mais imposto.', 'S'], ['Reforma.', 'D']]),
    P('Aldeias abandonadas', 'Vilas vazias e casas vazias.', [['Atrair jovens.', 'S'], ['Concentrar serviços.', 'M'], ['Ignorar.', 'I']])] },
  { id: 'jpn_pacifism', ...K('JPN', 'Japão'), parts: [
    P('Artigo 9 e a Constituição', 'A ameaça regional reabre o debate sobre forças armadas normais.', [['Reformar.', 'W'], ['Reinterpretar.', 'N'], ['Manter pacifismo.', 'E']]),
    P('Mísseis da Coreia do Norte', 'Lançamentos sobrevoam o país.', [['Contra-ataque.', 'W'], ['Defesa antimíssil.', 'G'], ['Diplomacia.', 'D']]),
    P('Ilhas disputadas', 'Navios chineses rondam as ilhas.', [['Patrulha reforçada.', 'F'], ['Negociar.', 'D'], ['Aliança com os EUA.', 'A']])] },
  { id: 'jpn_work', ...K('JPN', 'Japão'), parts: [
    P('Cultura do excesso de trabalho', 'Mortes por exaustão geram protesto.', [['Limitar horas.', 'N'], ['Incentivos.', 'S'], ['Manter.', 'M']]),
    P('Jovens e a "geração sem filhos"', 'Casamentos e nascimentos caem.', [['Licença paga.', 'S'], ['Creches.', 'G'], ['Campanha cultural.', 'H']]),
    P('Mulheres e carreira', 'Poucas mulheres chegam à diretoria.', [['Cotas.', 'E'], ['Incentivos.', 'S'], ['Esperar.', 'I']])] },
  { id: 'jpn_quake', ...K('JPN', 'Japão'), parts: [
    P('Terremoto e tsunami', 'Um grande abalo atinge a costa e usinas.', [['Evacuar e reconstruir.', 'S'], ['Fechar usinas.', 'X'], ['Minimizar.', 'L']]),
    P('Energia nuclear', 'O país decide se religa os reatores.', [['Religar.', 'G'], ['Eliminar.', 'X'], ['Gradual.', 'D']]),
    P('Reconstrução', 'Cidades costeiras pedem muros e diques.', [['Construir.', 'G'], ['Realocar.', 'S'], ['Compensar.', 'B']])] },
  { id: 'jpn_tech', ...K('JPN', 'Japão'), parts: [
    P('Chips e robótica', 'Empresas japonesas querem voltar ao topo.', [['Subsidiar.', 'G'], ['Parcerias.', 'D'], ['Mercado.', 'M']]),
    P('Rivalidade com a Coreia', 'Disputas históricas travam cooperação.', [['Pedir desculpas.', 'D'], ['Manter.', 'F'], ['Acordo de comércio.', 'M']]),
    P('Fuga de talentos', 'Engenheiros vão para o Vale do Silício.', [['Salários.', 'S'], ['Retorno.', 'G'], ['Aceitar.', 'I']])] },
  { id: 'jpn_yakuza', ...K('JPN', 'Japão'), parts: [
    P('A yakuza', 'Clãs criminosos infiltram construção e cassinos.', [['Lei dura.', 'K'], ['Tolerar com regras.', 'Q'], ['Inteligência.', 'T']]),
    P('Cassinos', 'Resorts integrados prometem receita.', [['Aprovar.', 'M'], ['Vetar.', 'N'], ['Piloto.', 'D']]),
    P('Corrupção local', 'Prefeitos recebem propina.', [['Investigar.', 'E'], ['Abafar.', 'L'], ['Reforma.', 'N']])] },
  { id: 'jpn_monar', ...K('JPN', 'Japão'), parts: [
    P('A sucessão imperial', 'A linha de herdeiros encolhe.', [['Permitir herdeiras.', 'E'], ['Manter a regra.', 'H'], ['Debate nacional.', 'D']]),
    P('Santuário Yasukuni', 'Visitas de ministros irritam vizinhos.', [['Visitar.', 'F'], ['Evitar.', 'D'], ['Memorial neutro.', 'E']]),
    P('Cultura pop como poder', 'Anime e games geram soft power.', [['Apoiar.', 'G'], ['Taxar.', 'M'], ['Deixar.', 'I']])] },

  // ---------------- TURQUIA ----------------
  { id: 'tur_infl', ...K('TUR', 'Turquia'), parts: [
    P('Inflação e juros', 'A lira derrete e o presidente pede juros baixos.', [['Aumentar juros.', 'N'], ['Manter.', 'F'], ['Controle de preços.', 'P']]),
    P('Fuga para o dólar', 'Famílias compram ouro e dólar.', [['Controle de capitais.', 'N'], ['Depósito protegido.', 'S'], ['Nada.', 'I']]),
    P('Aluguéis e despejos', 'Inquilinos não conseguem pagar.', [['Teto.', 'N'], ['Moradia pública.', 'S'], ['Mercado.', 'M']])] },
  { id: 'tur_kurds', ...K('TUR', 'Turquia'), parts: [
    P('A questão curda', 'Grupos armados e partidos curdos pedem direitos.', [['Operação militar.', 'K'], ['Processo de paz.', 'Y'], ['Direitos culturais.', 'E']]),
    P('Fronteira com a Síria', 'Combatentes cruzam a fronteira.', [['Zona-tampão.', 'W'], ['Cooperar.', 'D'], ['Fechar.', 'N']]),
    P('Prisão de prefeitos', 'Prefeitos curdos são detidos.', [['Manter.', 'R'], ['Soltar.', 'E'], ['Julgamento.', 'N']])] },
  { id: 'tur_quake', ...K('TUR', 'Turquia'), parts: [
    P('Terremoto', 'Um tremor destrói cidades inteiras.', [['Mobilizar o Exército.', 'W'], ['Defesa Civil.', 'S'], ['Ajuda internacional.', 'A']]),
    P('Construtoras e corrupção', 'Prédios ruíram por fraudes em alvarás.', [['Prender empreiteiros.', 'E'], ['Anistia de obras.', 'B'], ['Investigar.', 'N']]),
    P('Reconstrução e eleição', 'A resposta vira tema eleitoral.', [['Casas rápidas.', 'G'], ['Adiar eleições.', 'N'], ['Transparência.', 'E']])] },
  { id: 'tur_nato', ...K('TUR', 'Turquia'), parts: [
    P('Otan e Rússia', 'A Turquia negocia com os dois lados.', [['Equilibrar.', 'D'], ['Fechar com a Otan.', 'A'], ['Fechar com Moscou.', 'F']]),
    P('S-400 e F-35', 'A compra de armas russas gera sanções.', [['Manter.', 'F'], ['Devolver.', 'C'], ['Negociar.', 'D']]),
    P('Adesão da Suécia', 'A Turquia veta a entrada de um candidato.', [['Vetar.', 'V'], ['Condicionar.', 'B'], ['Aprovar.', 'D']])] },
  { id: 'tur_secular', ...K('TUR', 'Turquia'), parts: [
    P('Laicidade e islã', 'O governo amplia o ensino religioso.', [['Ampliar.', 'H'], ['Manter laico.', 'E'], ['Equilibrar.', 'D']]),
    P('Hagia Sophia e símbolos', 'Monumentos viram campo de disputa.', [['Culto islâmico.', 'H'], ['Museu.', 'E'], ['Uso misto.', 'D']]),
    P('Oposição secular', 'Manifestações crescem nas cidades.', [['Permitir.', 'E'], ['Reprimir.', 'R'], ['Diálogo.', 'D']])] },
  { id: 'tur_refu', ...K('TUR', 'Turquia'), parts: [
    P('Refugiados sírios', 'Milhões vivem no país e a hostilidade cresce.', [['Retorno voluntário.', 'D'], ['Integração.', 'S'], ['Pressionar a saída.', 'R']]),
    P('Acordo com a UE', 'A Europa paga para a Turquia conter fluxos.', [['Renovar.', 'B'], ['Chantagear.', 'V'], ['Rever.', 'N']]),
    P('Conflitos nas cidades', 'Ataques a lojas de sírios.', [['Proteger.', 'E'], ['Silêncio.', 'I'], ['Reassentar.', 'S']])] },
  { id: 'tur_straits', ...K('TUR', 'Turquia'), parts: [
    P('Controle dos estreitos', 'Navios de guerra querem passar pelo Bósforo.', [['Fechar.', 'N'], ['Abrir.', 'D'], ['Cobrar.', 'M']]),
    P('Canal de Istambul', 'Um megaprojeto promete rota alternativa.', [['Construir.', 'G'], ['Cancelar.', 'X'], ['Parceria privada.', 'M']]),
    P('Chipre e o Egeu', 'A disputa de gás com a Grécia esquenta.', [['Explorar.', 'F'], ['Diálogo.', 'D'], ['Arbitragem.', 'E']])] },

  // ---------------- IRÃ ----------------
  { id: 'irn_hijab', ...K('IRN', 'Irã'), parts: [
    P('Protestos pelo véu', 'Mulheres desafiam o código de vestimenta.', [['Reprimir.', 'R'], ['Flexibilizar.', 'E'], ['Reforma lenta.', 'D']]),
    P('Polícia da moralidade', 'Uma morte sob custódia incendeia as ruas.', [['Dissolver.', 'C'], ['Manter.', 'F'], ['Investigação.', 'N']]),
    P('Internet cortada', 'O governo apaga a rede.', [['Manter o corte.', 'L'], ['Restaurar.', 'E'], ['Filtrar.', 'N']])] },
  { id: 'irn_nuke', ...K('IRN', 'Irã'), parts: [
    P('O programa nuclear', 'Inspetores exigem acesso e Israel ameaça atacar.', [['Aceitar inspeções.', 'D'], ['Enriquecer mais.', 'W'], ['Ambiguidade.', 'T']]),
    P('Sanções e petróleo', 'O petróleo vai para a China com desconto.', [['Contrabando.', 'T'], ['Acordo com o Ocidente.', 'D'], ['Resistir.', 'F']]),
    P('Ataque a instalações', 'Sabotagens atingem centrífugas.', [['Retaliar.', 'F'], ['Negociar.', 'D'], ['Reconstruir em segredo.', 'T']])] },
  { id: 'irn_proxy', ...K('IRN', 'Irã'), parts: [
    P('Aliados regionais', 'Milícias no Líbano, Iraque e Iêmen pedem mais armas.', [['Armar.', 'W'], ['Reduzir.', 'D'], ['Controlar.', 'T']]),
    P('Sanções americanas', 'Mais bancos são isolados.', [['Retaliar no Golfo.', 'F'], ['Diálogo secreto.', 'D'], ['Resistir.', 'I']]),
    P('Mar do Golfo', 'Petroleiros são apreendidos.', [['Escalar.', 'W'], ['Trocar.', 'D'], ['Escolta.', 'F']])] },
  { id: 'irn_clergy', ...K('IRN', 'Irã'), parts: [
    P('O Guia Supremo e a sucessão', 'A saúde do líder reabre a disputa por sua herança.', [['Escolher um aliado.', 'N'], ['Conselho coletivo.', 'D'], ['Esperar.', 'I']]),
    P('Guarda Revolucionária', 'A Guarda domina setores da economia.', [['Limitar.', 'N'], ['Aliança.', 'B'], ['Ignorar.', 'I']]),
    P('Reformistas', 'Candidatos moderados são barrados.', [['Barrar.', 'R'], ['Permitir.', 'E'], ['Negociar.', 'D']])] },
  { id: 'irn_water', ...K('IRN', 'Irã'), parts: [
    P('A crise da água', 'Reservatórios secam e províncias protestam.', [['Transferir água.', 'G'], ['Racionar.', 'N'], ['Reforma agrícola.', 'X']]),
    P('Êxodo rural', 'Camponeses migram para Teerã.', [['Subsídios.', 'S'], ['Moradia.', 'G'], ['Ignorar.', 'I']]),
    P('Apagões', 'Falta de energia para as casas e fábricas.', [['Racionar.', 'N'], ['Importar.', 'A'], ['Usinas.', 'G']])] },
  { id: 'irn_econ', ...K('IRN', 'Irã'), parts: [
    P('Bazaaris e subsídios', 'Comerciantes do bazar pedem alívio de impostos.', [['Atender.', 'S'], ['Taxar.', 'N'], ['Mediar.', 'D']]),
    P('Rial em queda', 'A moeda perde valor.', [['Dolarizar.', 'M'], ['Controle.', 'N'], ['Emitir.', 'I']]),
    P('Greve dos caminhoneiros', 'A logística para.', [['Ceder.', 'C'], ['Reprimir.', 'R'], ['Negociar.', 'D']])] },
  { id: 'irn_kurd', ...K('IRN', 'Irã'), parts: [
    P('Minorias étnicas', 'Curdos e baluches pedem direitos e verbas.', [['Autonomia cultural.', 'E'], ['Repressão.', 'R'], ['Investimento.', 'S']]),
    P('Ataques na fronteira', 'Grupos armados cruzam do Iraque.', [['Operação.', 'K'], ['Diálogo.', 'Y'], ['Fechar fronteira.', 'N']]),
    P('Executados', 'Presos são enforcados e o mundo protesta.', [['Moratória.', 'E'], ['Manter.', 'F'], ['Julgamento.', 'N']])] },

  // ---------------- NIGÉRIA ----------------
  { id: 'nga_oil', ...K('NGA', 'Nigéria'), parts: [
    P('Petróleo do Delta', 'Vazamentos e roubo de petróleo destroem rios e comunidades.', [['Exército no Delta.', 'K'], ['Fundo local.', 'S'], ['Privatizar.', 'M']]),
    P('Subsídio à gasolina', 'Retirar o subsídio dispara os preços.', [['Retirar.', 'N'], ['Manter.', 'S'], ['Gradual.', 'D']]),
    P('Refinaria nacional', 'O país exporta petróleo e importa combustível.', [['Concluir.', 'G'], ['Concessão.', 'M'], ['Ignorar.', 'I']])] },
  { id: 'nga_boko', ...K('NGA', 'Nigéria'), parts: [
    P('Boko Haram no nordeste', 'Ataques e sequestros em massa.', [['Ofensiva militar.', 'K'], ['Anistia e reabilitação.', 'Z'], ['Cooperação regional.', 'D']]),
    P('Sequestro de estudantes', 'Centenas de meninas são levadas.', [['Resgate militar.', 'W'], ['Negociar.', 'Y'], ['Pagar resgate.', 'C']]),
    P('Milícias de defesa', 'Aldeias formam grupos de vigilantes.', [['Integrar.', 'J'], ['Desarmar.', 'K'], ['Tolerar.', 'I']])] },
  { id: 'nga_north_south', ...K('NGA', 'Nigéria'), parts: [
    P('Norte e Sul', 'O Norte muçulmano e o Sul cristão disputam poder e recursos.', [['Rodízio presidencial.', 'D'], ['Mais federalismo.', 'E'], ['Centralizar.', 'N']]),
    P('Sharia nos estados', 'Estados do norte aplicam penas religiosas.', [['Limitar.', 'N'], ['Tolerar.', 'I'], ['Corte federal.', 'E']]),
    P('Biafra', 'Movimentos separatistas voltam.', [['Diálogo.', 'D'], ['Prisões.', 'R'], ['Autonomia.', 'C']])] },
  { id: 'nga_nollywood', ...K('NGA', 'Nigéria'), parts: [
    P('Nollywood e Afrobeats', 'A cultura nigeriana conquista o mundo.', [['Apoiar.', 'G'], ['Taxar.', 'M'], ['Censurar.', 'L']]),
    P('Fuga de cérebros', 'Médicos e engenheiros emigram.', [['Salários.', 'S'], ['Contratos de retorno.', 'G'], ['Ignorar.', 'I']]),
    P('Fintechs', 'Startups financeiras prosperam.', [['Regular.', 'N'], ['Incentivar.', 'M'], ['Estatizar.', 'P']])] },
  { id: 'nga_corr', ...K('NGA', 'Nigéria'), parts: [
    P('Corrupção no petróleo', 'Bilhões somem em contratos.', [['Agência independente.', 'E'], ['Abafar.', 'L'], ['Punir poucos.', 'N']]),
    P('Governadores poderosos', 'Governadores controlam eleições locais.', [['Enfrentar.', 'F'], ['Negociar.', 'B'], ['Federalizar.', 'N']]),
    P('Eleições e fraude', 'Acusações de fraude eleitoral.', [['Biometria.', 'G'], ['Ignorar.', 'I'], ['Auditoria.', 'E']])] },
  { id: 'nga_pop', ...K('NGA', 'Nigéria'), parts: [
    P('Explosão demográfica', 'A população cresce rápido e faltam escolas.', [['Planejamento familiar.', 'S'], ['Escolas.', 'G'], ['Ignorar.', 'I']]),
    P('Lagos', 'A megacidade sufoca.', [['Metrô.', 'G'], ['Cidades satélite.', 'M'], ['Informalidade.', 'I']]),
    P('Desemprego jovem', 'Jovens sem vagas se radicalizam.', [['Programa de empregos.', 'S'], ['Empreendedorismo.', 'M'], ['Serviço militar.', 'R']])] },
  { id: 'nga_farm', ...K('NGA', 'Nigéria'), parts: [
    P('Pastores e agricultores', 'Conflitos por terra deixam milhares de mortos.', [['Corredores de pasto.', 'G'], ['Armar milícias.', 'W'], ['Mediação.', 'D']]),
    P('Desertificação', 'O Lago Chade encolhe.', [['Projeto regional.', 'D'], ['Ajuda.', 'A'], ['Esperar.', 'I']]),
    P('Segurança alimentar', 'A inflação de alimentos dispara.', [['Importar.', 'A'], ['Subsidiar.', 'S'], ['Reforma agrária.', 'N']])] },
];
