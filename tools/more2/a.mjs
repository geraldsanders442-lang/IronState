// Questões novas (parte A): gabinete e autonomia dos ministros, saúde e saneamento, impostos e tarifas, povos e minorias.
// Formato: Q(id, cat, título, descrição, contexto, condição, [ [texto, dica, now, groups, long], ... ], { cd, w })
export const Q = [];
const q = (id, cat, title, desc, context, cond, options, x = {}) => Q.push({ id, cat, title, desc, context, cond, options, ...x });

// ===== Gabinete e autonomia dos ministros =====
q('mx_min_popular', 'Gabinete', 'O ministro mais popular que o governante', 'Pesquisas mostram que um ministro tem mais aprovação do que você. Jornais já o chamam de "o verdadeiro presidente" e ele não desmente.', 'Quanto mais poder você delega, mais ele cresce.', { min: { delegated: 3, minAmb: 40 } }, [
  ['Elogiar o ministro e dividir o palco.', 'Ele fica leal por ora, mas ganha ainda mais projeção.', { legitimacy: -0.6 }, { bureaucracy: 3 }, [{ k: 'coupRisk', v: 1.5, d: 90 }]],
  ['Tirar dele as áreas mais visíveis.', 'Corta o brilho dele, mas ele fica ressentido.', { stability: -0.8 }, { bureaucracy: -3 }],
  ['Ignorar e seguir o jogo.', 'O ministro continua crescendo.', { }, {}, [{ k: 'coupRisk', v: 2.5, d: 120 }]],
  ['Promover para vice e dividir responsabilidades.', 'Transforma o rival em sócio, e em herdeiro.', { efficiency: 1 }, { bureaucracy: 4 }, [{ k: 'coupRisk', v: 1, d: 120 }]],
], { cd: 400 });
q('mx_min_interview', 'Gabinete', 'Ministro critica o governo em entrevista', 'Em um programa de TV, um ministro de sua confiança diz que "a política do governo está errada" e que, se dependesse dele, mudaria tudo. A oposição vibra.', 'Ele tem carta branca e se sente à vontade.', { min: { delegated: 2 } }, [
  ['Exigir retratação pública.', 'Afirma autoridade; ele pode se ressentir.', { legitimacy: 0.5 }, { opposition: -1 }],
  ['Demitir na hora.', 'Corta o problema, mas cria um adversário solto.', { stability: -1 }, { bureaucracy: -2 }, [{ k: 'coupRisk', v: 1, d: 60 }]],
  ['Convocar um debate interno e mudar um ponto da política.', 'Absorve a crítica, mas o governo parece fraco.', { legitimacy: -0.8 }, { opposition: 2 }],
  ['Fingir que foi combinado.', 'Evita crise, mas ele se fortalece.', {}, { business: 1 }, [{ k: 'coupRisk', v: 1, d: 90 }]],
], { cd: 300 });
q('mx_min_unions', 'Gabinete', 'Ministro fecha acordo com os sindicatos sem avisar', 'Sem consultá-lo, o ministro negociou aumento salarial e estabilidade no emprego com as centrais sindicais, em troca de apoio. O custo bate no orçamento.', '', { min: { delegated: 3 } }, [
  ['Honrar o acordo.', 'Paz social; o caixa sente.', { treasury: -0.5, stability: 1 }, { workers: 6, business: -3 }],
  ['Rever o acordo e pagar o custo político.', 'Mantém as contas, mas queima a relação com os sindicatos.', { protest: 2 }, { workers: -6, business: 2 }],
  ['Renegociar metade.', 'Meio-termo.', { treasury: -0.2 }, { workers: 2, business: -1 }],
], { cd: 400 });
q('mx_min_foreign_gift', 'Gabinete', 'Presente de uma potência estrangeira ao ministro', 'Uma embaixada deu uma viagem de luxo e um fundo "de consultoria" ao seu ministro das Relações Exteriores. Ele passou a defender a aproximação com essa potência.', '', { min: { delegated: 2, ministerLoyalty: 0 }, max: { ministerLoyalty: 62 } }, [
  ['Abrir investigação.', 'Pode revelar influência externa; a potência se ofende.', { reputation: 1 }, {}, [{ k: 'corruption', v: -1, d: 120 }]],
  ['Afastá-lo da pasta.', 'Reduz o risco; ele vira um inimigo dentro do governo.', { stability: -0.5 }, { bureaucracy: -2 }],
  ['Aproveitar a aproximação.', 'Ganha parceiro poderoso, perde independência.', { reputation: 1 }, { military: -2 }, [{ k: 'influence', v: -1, d: 180 }]],
], { cd: 500 });
q('mx_min_resign', 'Gabinete', 'Ministros ameaçam renunciar em bloco', 'Cansados de serem desautorizados ou ignorados, os ministros avisam que renunciarão juntos se você não garantir mais espaço para decidir.', '', { max: { ministerLoyalty: 55 }, min: { day: 200 } }, [
  ['Dar mais autonomia a todos.', 'Aplaca o gabinete e aumenta a ambição de cada um.', { efficiency: 1 }, { bureaucracy: 4 }, [{ k: 'coupRisk', v: 2, d: 150 }]],
  ['Chamar o blefe.', 'Se renunciarem, o governo para; se não, você sai mais forte.', { legitimacy: 0.5 }, {}, [{ k: 'stability', v: -1, d: 60 }]],
  ['Trocar os mais barulhentos e premiar os leais.', 'Racha o grupo e enfraquece a ameaça.', { stability: -1 }, { bureaucracy: -2 }],
], { cd: 500 });
q('mx_chief_power', 'Gabinete', 'O chefe de gabinete virou o centro do governo', 'Diplomatas, ministros e empresários procuram agora o chefe de gabinete, não você. Ele decide quem entra, o que chega à sua mesa e quem é ouvido.', '', { min: { delegated: 5 } }, [
  ['Reduzir o nível de delegação.', 'Retoma o comando; o governo fica mais lento.', { efficiency: -1.5 }, { bureaucracy: -2 }],
  ['Fortalecê-lo ainda mais.', 'Mais eficiência, menos você.', { efficiency: 1.5 }, { bureaucracy: 3 }, [{ k: 'legitimacy', v: -1, d: 180 }]],
  ['Criar um conselho para vigiá-lo.', 'Equilíbrio, com mais burocracia.', { efficiency: -0.5 }, { bureaucracy: 1 }],
], { cd: 600 });
q('mx_min_decree', 'Gabinete', 'Ministro assina decreto em seu nome', 'Um ministro assinou um decreto polêmico alegando que seguia "o espírito do seu governo". Você só soube pelo Diário Oficial.', '', { min: { delegated: 3, minAmb: 35 } }, [
  ['Revogar o decreto.', 'Reafirma o seu controle e irrita o ministro.', { legitimacy: 0.4 }, { bureaucracy: -2 }],
  ['Manter e assumir a autoria.', 'Evita rachar o governo; perde coerência.', { legitimacy: -0.8 }, { opposition: 3 }],
  ['Exigir que passe pela Casa Civil.', 'Cria um filtro; a máquina diminui o ritmo.', { efficiency: -0.8 }, {}],
], { cd: 400 });
q('mx_min_general', 'Gabinete', 'O general no ministério quer mais voz', 'O ministro da Defesa, um general respeitado, avisa que os quartéis só aceitam as próximas decisões se ele participar de todas as reuniões sobre política externa.', '', { min: { delegated: 2, g_military: 40 } }, [
  ['Aceitar: ele entra no conselho de segurança.', 'Os militares se acalmam; a política fica mais dura.', { stability: 1 }, { military: 5 }, [{ k: 'civil', v: -1, d: 180 }]],
  ['Recusar com firmeza.', 'Afirma o controle civil, com risco de atrito.', { }, { military: -4 }, [{ k: 'coupRisk', v: 2, d: 120 }]],
  ['Oferecer uma comissão consultiva sem poder real.', 'Dribla o pedido.', {}, { military: 1 }],
], { cd: 500 });
q('mx_min_leak', 'Gabinete', 'Vazamento: ministro negocia emprego futuro com empresas', 'Reportagem mostra um ministro que trabalhava com autonomia total negociando um cargo em uma grande empresa que depende das decisões da pasta dele.', '', { min: { corruption: 35, delegated: 2 } }, [
  ['Demitir e abrir inquérito.', 'Fecha a crise e dá um recado ao gabinete.', { legitimacy: 1, reputation: 1 }, { business: -2 }],
  ['Pedir explicações e manter.', 'O escândalo se arrasta.', { legitimacy: -1 }, { opposition: 2 }],
  ['Criar um código de conduta para ministros.', 'Resposta institucional, com resistência dos próprios ministros.', { corruption: -1 }, { bureaucracy: -2 }],
], { cd: 500 });
q('mx_min_ideology', 'Gabinete', 'Um ministro dissidente na sua ideologia', 'O ministro de uma pasta-chave defende abertamente uma linha ideológica oposta à sua e usa a autonomia para encher os cargos intermediários com aliados.', '', { min: { delegated: 3 } }, [
  ['Substituí-lo por alguém alinhado.', 'Reforça a sua linha; a facção dele reage.', { stability: -1 }, { bureaucracy: -2 }],
  ['Governar de forma pluralista: manter e ouvir.', 'Melhora a imagem de diálogo, mas sua agenda se dilui.', { legitimacy: 0.5 }, { opposition: -2 }, [{ k: 'efficiency', v: -0.5, d: 180 }]],
  ['Limitar o mandato dele a funções técnicas.', 'Tira o poder de decisão, mantém o nome.', {}, { bureaucracy: -1 }],
], { cd: 500 });
q('mx_min_sabotage', 'Gabinete', 'Ministro sabota a sua agenda', 'Uma política que você anunciou emperra em silêncio: o ministro encarregado a atrasa, "interpreta" as regras e cria obstáculos.', '', { min: { delegated: 3, minAmb: 45 } }, [
  ['Expor o boicote publicamente.', 'Pressiona o ministro; expõe a divisão do governo.', { legitimacy: -0.5 }, { opposition: 2 }],
  ['Trocar o ministro.', 'Resolve; abre brecha para a facção dele.', { stability: -1 }, { bureaucracy: -2 }],
  ['Assumir você mesmo a pasta por um tempo.', 'Retoma o controle e cansa o governante.', { efficiency: 1 }, {}, [{ k: 'protest', v: 0.5, d: 90 }]],
], { cd: 500 });
q('mx_min_coalition', 'Gabinete', 'Partidos aliados exigem mais ministérios', 'Os partidos da base querem ministérios com orçamento e poder. Dizem que, sem isso, votam com a oposição.', '', { min: { day: 200 } }, [
  ['Entregar um ministério com mandato amplo.', 'Compra paz e perde controle.', { stability: 1 }, { bureaucracy: 3 }, [{ k: 'coupRisk', v: 1, d: 150 }]],
  ['Oferecer cargos menores.', 'Satisfaz parcialmente.', { treasury: -0.2 }, { bureaucracy: 1 }],
  ['Recusar e governar sem a base.', 'Mantém a coerência; o Congresso pode travar.', { stability: -1 }, { opposition: 2 }],
], { cd: 500 });

// ===== Saúde e saneamento =====
q('mx_hlt_cholera', 'Saúde', 'Surto de diarreia infantil nos bairros sem esgoto', 'Hospitais recebem dezenas de crianças com diarreia grave. Equipes de saúde apontam água contaminada e falta de esgoto nos bairros mais pobres.', '', { max: { sanitation: 75 }, min: { day: 100 } }, [
  ['Distribuir cloro e água tratada e abrir postos de reidratação.', 'Resposta rápida; salva vidas, custa pouco.', { treasury: -0.2, health: 1.5 }, { workers: 2 }],
  ['Lançar um plano de esgoto para os bairros afetados.', 'Resolve a causa, em anos.', { treasury: -0.6 }, { workers: 3, business: -1 }, [{ k: 'health', v: 1, d: 365 }]],
  ['Culpar o prefeito e a população.', 'Sem custo, com revolta.', { legitimacy: -1 }, { workers: -3 }],
], { cd: 300 });
q('mx_hlt_water_rural', 'Saúde', 'Poços contaminados no campo', 'No interior, famílias bebem água de poços rasos próximos às fossas. Exames mostram contaminação fecal em quase todos.', '', { max: { water: 88 }, min: { day: 120 } }, [
  ['Programa de poços protegidos e cloração.', 'Barato e eficaz.', { treasury: -0.4, health: 1 }, { rural: 5 }],
  ['Cisternas e caminhões-pipa emergenciais.', 'Alivia agora; depende de custeio.', { treasury: -0.5 }, { rural: 3 }],
  ['Esperar o plano de longo prazo.', 'Nada muda por ora.', { }, { rural: -3 }],
], { cd: 400 });
q('mx_hlt_handwash', 'Saúde', 'Campanha de lavagem de mãos nas escolas', 'Especialistas propõem instalar pias com sabão em todas as escolas e treinar professores: a medida mais barata contra doenças infantis.', '', { max: { hygiene: 80 } }, [
  ['Aprovar a campanha completa.', 'Barata e popular entre pais; efeito lento.', { treasury: -0.15, health: 0.8 }, { youth: 2 }],
  ['Fazer só nas escolas mais pobres.', 'Focaliza o gasto.', { treasury: -0.07, health: 0.4 }, { rural: 1 }],
  ['Priorizar obras visíveis, não "pias".', 'Perde um ganho barato de saúde.', {}, { business: 1 }],
], { cd: 500 });
q('mx_hlt_privatize_water', 'Saúde', 'Privatizar a água e o esgoto?', 'Uma empresa estrangeira oferece investir bilhões na rede de água e esgoto em troca de uma concessão de 30 anos, com reajuste automático das tarifas.', '', { max: { sanitation: 85 } }, [
  ['Aceitar a concessão.', 'Cobertura sobe com capital externo; tarifas também.', { treasury: 0.8, health: 1 }, { business: 4, workers: -4 }, [{ k: 'poverty', v: 0.4, d: 365 }]],
  ['Manter público e investir com dívida.', 'Mais controle, menos capital.', { treasury: -0.6 }, { workers: 3, business: -2 }, [{ k: 'health', v: 0.7, d: 365 }]],
  ['Parceria público-privada com metas.', 'Cobertura com teto de tarifa; negociação longa.', { treasury: 0.2 }, { business: 2 }, [{ k: 'health', v: 0.5, d: 365 }]],
], { cd: 600 });
q('mx_hlt_vaccine_refusal', 'Saúde', 'Movimento contra a vacinação ganha força', 'Boatos nas redes derrubam a cobertura vacinal. Casos de doenças já controladas reaparecem em algumas cidades.', '', { min: { day: 150 } }, [
  ['Campanha nacional com agentes de saúde nas casas.', 'Recupera cobertura; custa tempo e dinheiro.', { treasury: -0.4, health: 1.2 }, { youth: 1 }],
  ['Tornar a vacinação obrigatória para matrícula escolar.', 'Eficaz e polêmico.', { health: 1.5, civil: -1 }, { rural: -2 }],
  ['Confiar na informação e não intervir.', 'Surtos e mortes crescem.', { health: -1.5 }, {}],
], { cd: 700 });
q('mx_hlt_slum_toilets', 'Saúde', 'Banheiros públicos nas favelas', 'Moradores de uma grande favela dividem poucos banheiros. ONGs propõem construí-los com a comunidade, com gestão local.', '', { max: { openDef: 100, sanitation: 80 } }, [
  ['Financiar o programa com a comunidade.', 'Reduz a defecação a céu aberto e dá voz aos moradores.', { treasury: -0.3, health: 1 }, { workers: 3, regional: 2 }],
  ['Contratar uma empreiteira.', 'Mais rápido, menos engajamento.', { treasury: -0.5 }, { business: 2 }],
  ['Adiar: prioridade é o centro da cidade.', 'Os bairros pobres seguem esquecidos.', {}, { workers: -3 }],
], { cd: 500 });
q('mx_hlt_hospital_overload', 'Saúde', 'Hospitais lotados', 'Prontos-socorros operam acima do limite e pacientes esperam em corredores por dias. Médicos ameaçam entrar em greve.', '', { max: { health: 55 } }, [
  ['Contratar mais médicos e abrir leitos.', 'Alívio sustentado, custo alto.', { treasury: -0.8, health: 1.5 }, { workers: 3 }],
  ['Convênio com hospitais privados.', 'Rápido, caro e controverso.', { treasury: -0.5, health: 0.8 }, { business: 3, workers: -2 }],
  ['Pedir paciência.', 'A greve sai.', { health: -1, protest: 1.5 }, {}],
], { cd: 400 });
q('mx_hlt_drought_water', 'Saúde', 'Racionamento de água em tempos de seca', 'A seca esvazia os reservatórios. Bairros inteiros ficam dias sem água e a higiene doméstica despenca.', '', { min: { day: 200 }, max: { water: 95 } }, [
  ['Racionamento justo e obras emergenciais.', 'Distribui o custo; ninguém fica sem.', { treasury: -0.5 }, { workers: 1 }],
  ['Priorizar a indústria e a agroexportação.', 'Protege a produção; a população sofre.', { health: -1, protest: 1.5 }, { business: 3, workers: -3 }],
  ['Dessalinização e reuso: investir pesado.', 'Resolve a longo prazo; muito caro.', { treasury: -1.2 }, {}, [{ k: 'health', v: 0.8, d: 365 }]],
], { cd: 600 });

// ===== Impostos e tarifas =====
q('mx_tax_lobby_tobacco', 'Economia', 'A indústria do cigarro ataca o imposto', 'Fabricantes de cigarro bancam estudos que apontam "explosão do contrabando" e ameaçam demitir milhares de trabalhadores se a carga tributária subir.', '', { min: { taxMeasures: 1 } }, [
  ['Manter e combater o contrabando na fronteira.', 'Saúde pública e receita; exige polícia e controle.', { treasury: -0.1, health: 0.6 }, { business: -2 }],
  ['Reduzir o imposto em um nível.', 'Acalma o setor; perde saúde e receita.', { treasury: -0.2 }, { business: 3 }],
  ['Destinar a receita à saúde e ao combate ao tabagismo.', 'Vincula o dinheiro e ganha apoio.', { health: 0.8 }, { youth: 1 }],
], { cd: 500 });
q('mx_tax_steel_tariff', 'Economia', 'Pedido de tarifa contra o aço importado', 'Siderúrgicas e sindicatos pedem tarifa alta sobre o aço estrangeiro barato. Construtoras e montadoras se opõem: o aço vai ficar caro.', '', { min: { day: 150 } }, [
  ['Aplicar tarifa de 25%.', 'Protege a siderurgia; encarece obras e carros.', { inflation: 0.4 }, { workers: 3, business: -2 }, [{ k: 's_industrial', v: 1, d: 365 }]],
  ['Negociar cotas com os exportadores.', 'Equilibra; demora e irrita os dois lados.', {}, { workers: 1, business: 1 }],
  ['Recusar: manter o mercado aberto.', 'Aço barato; fábricas locais sofrem.', { unemployment: 0.5 }, { workers: -3, business: 2 }],
], { cd: 500 });
q('mx_tax_retaliation', 'Economia', 'Retaliação comercial contra as nossas exportações', 'Um grande parceiro responde às suas tarifas com tarifas próprias sobre produtos do seu país. Exportadores de carne, soja e manufaturas veem pedidos sumirem.', '', { min: { retaliation: 1 } }, [
  ['Suspender as tarifas para reabrir o comércio.', 'Alívio imediato; parece recuo.', { growth: 0.3 }, { business: 4, workers: -1 }],
  ['Apelar a organismos internacionais e buscar novos mercados.', 'Estratégia de longo prazo; lenta.', { reputation: 1 }, { business: 1 }],
  ['Dobrar a aposta com mais tarifas.', 'Escalada e dor para todos.', { growth: -0.4, inflation: 0.5 }, { workers: 2, business: -4 }],
], { cd: 400 });
q('mx_tax_wealth_flight', 'Economia', 'Fuga de capitais após o imposto sobre fortunas', 'Grandes patrimônios migram para paraísos fiscais. Bancos avisam que a saída de dinheiro pressiona o câmbio e o crédito.', '', { min: { taxMeasures: 1 } }, [
  ['Controlar a saída de capitais.', 'Segura o dinheiro; afasta investidores.', { reputation: -1, civil: -0.5 }, { business: -3 }],
  ['Reduzir a alíquota e dar anistia a quem repatriar.', 'Recupera parte do dinheiro e perde o discurso.', { treasury: 0.4 }, { business: 3, workers: -2 }],
  ['Manter e aprofundar a fiscalização.', 'Mais receita no longo prazo; mais lobby agora.', {}, { workers: 2, business: -2 }],
], { cd: 600 });
q('mx_tax_vat_regressive', 'Economia', 'O imposto sobre o consumo pesa mais sobre os pobres', 'Estudos mostram que o IVA consome 20% da renda de famílias pobres, contra 8% das ricas. Movimentos sociais pedem isenção de itens básicos.', '', { min: { taxMeasures: 1 } }, [
  ['Isentar alimentos, remédios e transporte.', 'Alívio para os pobres; perde receita.', { treasury: -0.5, poverty: -0.6 }, { workers: 3, rural: 3 }],
  ['Devolver parte do imposto às famílias de baixa renda.', 'Focalizado; burocrático.', { treasury: -0.3, poverty: -0.4 }, { workers: 2 }],
  ['Manter: é a base da arrecadação.', 'Receita estável; protesto contido.', { protest: 1 }, { workers: -3, business: 1 }],
], { cd: 600 });
q('mx_tax_smuggling', 'Economia', 'Contrabando cresce na fronteira', 'Quadrilhas passam cigarros, bebidas e combustíveis pela fronteira para fugir dos impostos. Comerciantes locais pedem ação.', '', { min: { taxMeasures: 2 } }, [
  ['Reforçar a fiscalização e a polícia de fronteira.', 'Reduz o contrabando; custa e pode abusar.', { treasury: -0.3, control: 1 }, { regional: -2 }],
  ['Reduzir os impostos nas regiões de fronteira.', 'Tira o incentivo; perde receita.', { treasury: -0.2 }, { regional: 3 }],
  ['Acordo com o país vizinho para harmonizar as taxas.', 'Resolve a longo prazo.', { reputation: 1 }, {}],
], { cd: 500 });
q('mx_tax_bigtech', 'Economia', 'Big techs ameaçam deixar o país', 'As plataformas digitais dizem que o imposto sobre serviços digitais inviabiliza o negócio local. O governo do país de origem ameaça tarifas.', '', { min: { day: 200 } }, [
  ['Manter o imposto.', 'Receita e soberania; risco de retaliação.', { treasury: 0.4 }, { youth: -1, business: -1 }],
  ['Suspender até a OCDE definir uma regra global.', 'Alivia a tensão e perde receita.', { reputation: 1 }, { business: 2 }],
  ['Trocar o imposto por regras de dados e concorrência.', 'Mudança de abordagem; resultado incerto.', {}, { youth: 1 }],
], { cd: 600 });
q('mx_tax_carbon', 'Meio ambiente', 'O imposto de carbono e os caminhoneiros', 'Transportadoras bloqueiam estradas contra o aumento do diesel causado pelo imposto de carbono. O abastecimento começa a falhar.', '', { min: { taxMeasures: 1 } }, [
  ['Compensar os caminhoneiros e manter o imposto.', 'Verde e caro.', { treasury: -0.4, pollution: -0.5 }, { business: 1, rural: -1 }],
  ['Suspender o aumento por um ano.', 'Estrada liberada; meta ambiental adiada.', { reputation: -0.5, pollution: 0.3 }, { business: 2, rural: 2 }],
  ['Reprimir o bloqueio.', 'Destrava as estradas; piora a imagem.', { civil: -1.5, protest: 1 }, { military: 1, workers: -3 }],
], { cd: 600 });
q('mx_tax_inheritance', 'Economia', 'Imposto sobre grandes heranças', 'Uma comissão propõe taxar heranças acima de um valor alto para financiar educação. Famílias empresárias falam em "confisco".', '', { min: { day: 250 } }, [
  ['Aprovar com isenção para pequenos patrimônios.', 'Mais igualdade; resistência dos ricos.', { treasury: 0.3, inequality: -0.5 }, { workers: 2, business: -3 }],
  ['Adiar para depois da eleição.', 'Evita o confronto por ora.', {}, { business: 1 }],
  ['Engavetar.', 'Sem mudança.', { inequality: 0.2 }, { business: 2, workers: -2 }],
], { cd: 700 });

// ===== Povos e minorias =====
q('mx_min_language', 'Direitos', 'Língua minoritária nas escolas', 'Uma minoria pede aulas na sua língua e documentos oficiais traduzidos. Setores nacionalistas veem ameaça à unidade.', '', { min: { minorities: 3 } }, [
  ['Reconhecer a língua como oficial regional.', 'Reduz a tensão; a maioria nacionalista reclama.', { civil: 1, separatism: -1 }, { regional: 4, rural: -2 }],
  ['Permitir aulas só em escolas privadas.', 'Meio-termo que desagrada a ambos.', {}, { regional: 1 }],
  ['Proibir e reforçar o idioma oficial.', 'Mais coesão na superfície; ressentimento.', { civil: -1.5, separatism: 1.5 }, { regional: -4, military: 1 }],
], { cd: 600 });
q('mx_min_indigenous_land', 'Direitos', 'Terras indígenas e mineração', 'Uma mineradora quer explorar uma área reivindicada por um povo indígena. A região tem ouro, e a empresa promete empregos e royalties.', '', { min: { day: 150 } }, [
  ['Demarcar a terra e vetar a mineração.', 'Direitos e imagem; menos receita.', { reputation: 1.5, civil: 1 }, { business: -3, regional: 2 }],
  ['Autorizar com consulta e participação nos lucros.', 'Meio-termo com fiscalização.', { treasury: 0.4 }, { business: 2, regional: 1 }],
  ['Liberar a mineração sem consulta.', 'Receita e conflito.', { treasury: 0.8, reputation: -2, civil: -1 }, { business: 4, regional: -4 }],
], { cd: 600 });
q('mx_min_roma_raids', 'Direitos', 'Operações policiais em bairros de minorias', 'A polícia faz batidas violentas em bairros de uma minoria depois de um crime atribuído a um de seus membros. Vídeos circulam e a comunidade ameaça ir às ruas.', '', { min: { policeAuto: 50 } }, [
  ['Suspender a operação e investigar os policiais.', 'Controla a polícia; a base reclama.', { civil: 1.5, legitimacy: 0.5 }, { military: -2, opposition: -1 }],
  ['Apoiar a polícia.', 'Agrada parte da população; tensão alta.', { civil: -1.5, protest: 1.5 }, { military: 3, regional: -3 }],
  ['Criar uma ouvidoria independente.', 'Mudança institucional lenta.', { civil: 1 }, { military: -1 }],
], { cd: 400 });
q('mx_min_immigrant_work', 'Direitos', 'Imigrantes explorados em fábricas e fazendas', 'Fiscais encontram imigrantes em condições análogas à escravidão em fábricas e plantações. Empresários dizem que sem eles a produção para.', '', { min: { imm: 3 } }, [
  ['Autuar as empresas e regularizar os trabalhadores.', 'Justiça; custo e lobby.', { reputation: 1.5, civil: 1 }, { business: -3, workers: 1 }],
  ['Aumentar a fiscalização, sem regularizar.', 'Solução parcial; imigrantes ficam vulneráveis.', {}, { business: -1 }],
  ['Ignorar: a produção importa.', 'Mantém o custo baixo; imagem manchada.', { reputation: -2 }, { business: 2 }],
], { cd: 500 });
q('mx_min_hate_speech', 'Direitos', 'Discurso de ódio nas redes contra uma minoria', 'Contas anônimas espalham ataques e mentiras contra uma minoria. Há agressões nas ruas depois de uma onda de postagens.', '', { min: { day: 150 } }, [
  ['Criar uma lei contra o discurso de ódio.', 'Protege a minoria; críticos falam em censura.', { civil: -0.5 }, { youth: 2, opposition: 1 }],
  ['Exigir que as plataformas removam o conteúdo.', 'Mais rápido; pressão sobre as empresas.', { reputation: 1 }, { business: -1 }],
  ['Não intervir: liberdade de expressão.', 'A violência continua.', { civil: 0.3 }, {}],
], { cd: 500 });
q('mx_min_segregated_schools', 'Direitos', 'Escolas segregadas de fato', 'Um relatório mostra que crianças de uma minoria estudam em escolas pior equipadas e distantes. Prefeitos locais culpam o "padrão natural".', '', { min: { minorities: 4 } }, [
  ['Integrar as escolas com transporte e reforço.', 'Educação mais justa; briga com pais e prefeitos.', { education: 1, treasury: -0.4 }, { rural: -2, youth: 2 }],
  ['Investir nas escolas das minorias.', 'Menos conflito, mais gasto.', { education: 0.8, treasury: -0.5 }, { youth: 1 }],
  ['Nada a fazer: é questão local.', 'Desigualdade persiste.', { inequality: 0.4 }, {}],
], { cd: 600 });
q('mx_min_pogrom', 'Segurança', 'Multidão ataca bairros de uma minoria', 'Depois de boatos, multidões queimam casas e comércios de uma minoria. A polícia local demora a agir.', '', { min: { minPers: 45 } }, [
  ['Enviar tropas e proteger o bairro.', 'Salva vidas e frustra os agressores; atrito com a polícia local.', { control: 2, civil: 1 }, { military: -1, regional: 2 }],
  ['Pedir calma sem agir.', 'A violência segue; sua imagem desaba.', { legitimacy: -2, reputation: -2 }, {}],
  ['Culpar a minoria pelas provocações.', 'Agrada agressores; crime internacional em potencial.', { reputation: -4, civil: -3 }, { military: 2, rural: 2 }],
], { cd: 300 });
q('mx_min_refugee_camp', 'Direitos', 'Campo de refugiados na fronteira', 'Milhares de pessoas de uma minoria perseguida chegam à sua fronteira, vindas de um vizinho. Cidades locais pedem ajuda.', '', { min: { day: 200 } }, [
  ['Abrir as fronteiras e criar abrigos.', 'Humanitário e caro; tensão com o vizinho.', { treasury: -0.7, reputation: 3 }, { rural: -2, workers: -1 }],
  ['Aceitar um número limitado.', 'Meio-termo.', { reputation: 1 }, { rural: 1 }],
  ['Fechar a fronteira.', 'Evita custos e gera uma crise humanitária.', { reputation: -3 }, { military: 2, rural: 2 }],
], { cd: 600 });
q('mx_min_kin_pressure', 'Crise internacional', 'Um país vizinho se diz protetor da minoria', 'O governo vizinho afirma que protegerá "seus irmãos" que vivem no seu território e envia ajuda direta a líderes da comunidade.', '', { min: { minorities: 4 } }, [
  ['Acusar interferência e expulsar diplomatas.', 'Firmeza; tensão sobe.', { reputation: -0.5 }, { military: 2 }, [{ k: 'separatism', v: 1, d: 180 }]],
  ['Oferecer direitos culturais à minoria.', 'Tira o argumento do vizinho.', { civil: 1 }, { regional: 3, rural: -1 }, [{ k: 'separatism', v: -1, d: 180 }]],
  ['Negociar um acordo bilateral de proteção.', 'Diplomacia lenta.', { reputation: 1 }, {}],
], { cd: 700 });
