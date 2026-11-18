// Gera questões de direitos, minorias, imigração, repressão, justiça internacional, riqueza/pobreza e leis penais.
// Uso: node tools/gen-rights.mjs   (reescreve data/issues_rights.json e o registra em data/content.json)
import { writeFileSync, readFileSync } from 'node:fs';
const out = f => new URL('../data/' + f, import.meta.url);
const o = (text, hint, e = {}) => ({ text, hint, ...e });
const I = (id, cat, title, desc, context, cond, options, extra = {}) => ({ id, cat, title, desc, context, cond, w: 1, cd: 200, options, ...extra });
const R = (op, e = {}) => ({ type: 'rights', op, ...e }); // ação do módulo de direitos
const ICC_CLEAR = flag => ({ flagOff: flag });

const L = [
  // ================= RIQUEZA =================
  I('rt_rich_magnet', 'Imigração', 'O país virou ímã de talentos', 'Engenheiros, médicos e investidores do mundo todo querem se mudar para cá: a renda alta e a vida estável atraem milhares de pedidos de visto por semana.', 'Imigrantes elevam a produtividade, mas pressionam moradia e serviços.',
    { min: { gdppc: 28000, liberty: 45 }, max: { imm: 22 } }, [
      o('Abrir vistos para profissionais qualificados.', 'Mais produtividade e crescimento; aluguéis sobem.', { now: { housing: -2, productivity: 1.5 }, long: [{ k: 'growth', v: 0.25, d: 365 }], groups: { business: 4, workers: -2 }, act: R('x', { imm: 1.2 }) }),
      o('Aceitar todos que vierem.', 'Fluxo máximo; grandes ganhos e grandes tensões.', { now: { housing: -4, productivity: 1 }, long: [{ k: 'growth', v: 0.35, d: 365 }], groups: { business: 5, workers: -4, rural: -4 }, act: R('x', { imm: 3 }) }),
      o('Criar cotas rígidas.', 'Controle; menos benefício.', { now: { reputation: -1 }, groups: { rural: 2, business: -2 }, act: R('x', { imm: 0.3 }) })]),
  I('rt_rich_gap', 'Sociedade', 'Riqueza demais, moradia de menos', 'A prosperidade do país fez os aluguéis dispararem. Trabalhadores de serviços não conseguem mais morar nas cidades onde trabalham.', 'Muitos dos que mais perdem são imigrantes e jovens.',
    { min: { gdppc: 30000, inequality: 45 } }, [
      o('Controlar aluguéis e construir moradia pública.', 'Alívio para os pobres; investidores reclamam.', { now: { treasury: -0.3, housing: 5, inequality: -2 }, groups: { workers: 4, youth: 4, business: -5 } }),
      o('Liberar construção e esperar o mercado.', 'Oferta cresce devagar.', { now: { housing: 2, growth: 0.2 }, groups: { business: 3, workers: -2 } }),
      o('Nada. Mercado é mercado.', 'A tensão social aumenta.', { now: { protest: 3, inequality: 1 }, groups: { youth: -4, workers: -3 } })]),
  I('rt_rich_donor', 'Mundo', 'País rico, conta alta: pedem que você pague mais', 'Organismos internacionais e vizinhos pobres pedem que o país rico financie refugiados e clima. A opinião pública está dividida.', 'Doar melhora a imagem; reter dinheiro agrada eleitores.',
    { min: { gdppc: 32000, reputation: 40 } }, [
      o('Ampliar a ajuda externa.', 'Reputação e influência sobem; custa caro.', { now: { treasury: -0.5, reputation: 4, influence: 2 }, groups: { rural: -3, youth: 3 }, act: R('x', { relLib: 3 }) }),
      o('Ajuda só em troca de acordos migratórios.', 'Barganha dura.', { now: { treasury: -0.2, reputation: 1 }, groups: { rural: 2 }, act: R('x', { imm: -0.3 }) }),
      o('Recusar.', 'Poupa dinheiro; imagem de egoísta.', { now: { reputation: -2 }, groups: { rural: 2, youth: -3 } })]),
  I('rt_rich_residency', 'Economia', 'Vistos dourados para milionários', 'Um fundo propõe vender cidadania a quem investir um bilhão no país. A medida traria capital, mas expõe o governo a acusações de lavagem de dinheiro.', 'Bilionários estrangeiros também elevam os preços e a corrupção.',
    { min: { gdppc: 12000 }, max: { corruption: 55 } }, [
      o('Aprovar o programa.', 'Entrada de capital; mais corrupção.', { now: { treasury: 0.5, corruption: 3, inequality: 1 }, groups: { business: 4, workers: -3 }, act: R('x', { imm: 0.2 }) }),
      o('Aprovar com auditoria rigorosa.', 'Menos dinheiro, menos risco.', { now: { treasury: 0.2, reputation: 1 }, groups: { business: 1 } }),
      o('Rejeitar.', 'Mantém a imagem limpa.', { groups: { business: -2 } })]),

  // ================= POBREZA / ÊXODO =================
  I('rt_poor_exodus', 'Imigração', 'Êxodo dos jovens', 'Filas de jovens nos consulados: quem tem diploma quer ir embora. Ônibus lotados partem toda semana para os países vizinhos e mais ricos.', 'A fuga de cérebros reduz a arrecadação e a produtividade futura.',
    { max: { gdppc: 6500 }, min: { poverty: 25 } }, [
      o('Proibir a saída de profissionais essenciais.', 'Segura médicos e engenheiros; repressão e fuga clandestina.', { now: { civil: -4, reputation: -3 }, groups: { youth: -6, bureaucracy: 2 }, policy: { emigration: 'banned' }, act: R('x', { abuse: 6 }) }),
      o('Cobrar taxa de formação de quem emigrar.', 'Arrecada; irrita os jovens.', { now: { treasury: 0.15 }, groups: { youth: -4 }, policy: { emigration: 'taxed' } }),
      o('Criar incentivos para ficar.', 'Salários e bolsas de retorno.', { now: { treasury: -0.4, education: 1 }, long: [{ k: 'emigration', v: -0.8, d: 365 }], groups: { youth: 5, bureaucracy: 3 } }),
      o('Aceitar: as remessas compensam.', 'Dinheiro externo; perda de capital humano.', { now: { treasury: 0.2, education: -1 }, groups: { youth: 1 }, act: R('x', { popPct: -0.1 }) })]),
  I('rt_poor_remit', 'Economia', 'As remessas sustentam as famílias', 'Emigrantes enviam bilhões para casa; em algumas cidades, metade da renda vem de fora. Bancos cobram taxas altas.', 'Remessas reduzem a pobreza, mas criam dependência.',
    { max: { gdppc: 7000 } }, [
      o('Baratear as remessas e criar fundo de investimento.', 'Mais renda e poupança.', { now: { poverty: -1, treasury: 0.1 }, long: [{ k: 'growth', v: 0.15, d: 365 }], groups: { rural: 3, business: -1 } }),
      o('Tributar as remessas.', 'Arrecada; castiga os pobres.', { now: { treasury: 0.25, poverty: 0.5 }, groups: { rural: -4, workers: -3 } }),
      o('Deixar como está.', 'Sem custo.', {})]),
  I('rt_poor_brain', 'Sociedade', 'Médicos e professores partem', 'Hospitais e escolas perdem pessoal para países ricos. Alguns municípios ficaram sem médico.', 'Cada vaga vazia piora os serviços básicos.',
    { max: { gdppc: 8000 }, min: { education: 30 } }, [
      o('Dobrar o salário do setor público essencial.', 'Segura profissionais; custa caro.', { now: { treasury: -0.6, health: 2, education: 2 }, groups: { bureaucracy: 5, workers: 2 } }),
      o('Importar profissionais de países aliados.', 'Alívio rápido.', { now: { treasury: -0.2, health: 1 }, groups: { youth: -2 }, act: R('x', { imm: 0.2 }), rel: { neighbors: 3 } }),
      o('Exigir serviço obrigatório de 5 anos.', 'Prende gente; impopular.', { now: { health: 1, civil: -2 }, groups: { youth: -5, bureaucracy: -2 }, act: R('x', { abuse: 3 }) })]),
  I('rt_poor_boats', 'Imigração', 'Barcos lotados partem da costa', 'Centenas de pessoas arriscam a vida em travessias clandestinas. Há mortes em cada viagem e os vizinhos acusam o governo de omissão.', 'A tragédia chama atenção do mundo.',
    { max: { gdppc: 7000 }, min: { poverty: 30 } }, [
      o('Reprimir os atravessadores e patrulhar a costa.', 'Reduz as saídas; custa e gera críticas.', { now: { treasury: -0.2, reputation: -1 }, act: R('x', { abuse: 2 }) }),
      o('Pedir ajuda internacional e abrir vias legais.', 'Reputação; custa político.', { now: { reputation: 3, treasury: -0.1 }, rel: { all: 2 } }),
      o('Ignorar. Quem parte, parte.', 'Tragédias aumentam.', { now: { reputation: -4 }, groups: { youth: -3 }, act: R('x', { popPct: -0.05 }) })]),

  // ================= AUTORITÁRIO =================
  I('rt_auth_list', 'Direitos', 'Lista de presos políticos chega à ONU', 'Uma organização internacional divulgou uma lista com centenas de nomes de presos políticos do país. A imprensa estrangeira pede explicações.', 'O governo pode ceder, negar ou usar a lista como pretexto para mais prisões.',
    { min: { abuse: 35, prisoners: 1 } }, [
      o('Libertar os nomes mais conhecidos.', 'Alívio diplomático; a oposição reanima.', { now: { reputation: 3, legitimacy: 1 }, groups: { opposition: 4, youth: 3, military: -2 }, act: R('releaseAll', { pct: 0.3 }) }),
      o('Negar tudo e chamar de campanha de calúnia.', 'Sem custo imediato; o escrutínio cresce.', { now: { reputation: -2 }, groups: { military: 2 }, act: R('x', { abuse: 3, heat: 0.5 }) }),
      o('Prender quem vazou a lista.', 'Cala as fontes; o mundo vê a escalada.', { now: { reputation: -4, civil: -3, opposition: -2 }, groups: { opposition: -5 }, act: R('x', { abuse: 9, prisoners: 40, heat: 1 }) })]),
  I('rt_auth_journalist', 'Direitos', 'Jornalista estrangeiro detido', 'Um correspondente de uma grande agência foi preso sob acusação de espionagem enquanto cobria protestos.', 'O embaixador do país dele exige a libertação imediata.',
    { max: { liberty: 40 } }, [
      o('Libertar e expulsar.', 'Resolve a crise; a imprensa continua hostil.', { now: { reputation: 1 }, rel: { west: 3 } }),
      o('Levá-lo a julgamento.', 'Mostra firmeza; o conflito diplomático cresce.', { now: { reputation: -4 }, groups: { military: 2 }, rel: { west: -8 }, act: R('x', { abuse: 4 }) }),
      o('Trocá-lo por um prisioneiro nosso no exterior.', 'Barganha.', { now: { reputation: 0 }, groups: { military: 1 }, rel: { west: 1 } })]),
  I('rt_auth_exiles', 'Direitos', 'A oposição no exílio forma um governo paralelo', 'Líderes exilados se reúnem em uma capital europeia e anunciam um "governo em exílio" com apoio de ONGs e deputados estrangeiros.', 'O movimento cresce nas redes e dentro do país.',
    { min: { abuse: 45 } }, [
      o('Negociar uma transição com os exilados.', 'Risco político; reputação alta.', { now: { reputation: 4, political: 3, legitimacy: -1 }, groups: { opposition: 6, military: -4 }, act: R('x', { abuse: -6 }) }),
      o('Cassar a cidadania dos exilados.', 'Agrava a imagem.', { now: { reputation: -3, civil: -2 }, groups: { opposition: -2 }, act: R('x', { abuse: 5 }) }),
      o('Perseguir parentes e financiadores no país.', 'Rápido e brutal.', { now: { reputation: -5, opposition: -3, civil: -4 }, groups: { opposition: -6 }, act: R('x', { abuse: 11, prisoners: 30, heat: 1 }) })]),
  I('rt_auth_ngo', 'Direitos', 'Observadores pedem acesso às prisões', 'Uma ONG respeitada pede para visitar presídios e delegacias. Há denúncias de tortura e superlotação.', 'Aceitar abre uma janela de transparência; recusar sinaliza que há o que esconder.',
    { min: { abuse: 30 } }, [
      o('Aceitar a visita sem restrições.', 'A imagem melhora, mas o relatório pode ser duro.', { now: { reputation: 3, civil: 2 }, groups: { military: -2, youth: 3 }, act: R('x', { abuse: -4 }), policy: { prisons: 'standard' } }),
      o('Aceitar uma visita guiada.', 'Aparência de abertura.', { now: { reputation: 1 }, groups: { bureaucracy: 1 } }),
      o('Recusar e acusar a ONG de espionagem.', 'Aumenta as suspeitas.', { now: { reputation: -3 }, groups: { military: 2 }, act: R('x', { abuse: 2, heat: 0.5 }) })]),
  I('rt_auth_death', 'Direitos', 'Dissidente morre sob custódia', 'Um opositor conhecido morreu em uma delegacia. A versão oficial fala em "mal súbito", mas fotos do corpo circulam nas redes.', 'Multidões saem às ruas e embaixadas exigem investigação independente.',
    { min: { abuse: 55, prisoners: 1 } }, [
      o('Abrir investigação independente e punir os responsáveis.', 'Custa a lealdade dos aparelhos de segurança.', { now: { reputation: 4, legitimacy: 3, civil: 2 }, groups: { military: -5, opposition: 4 }, act: R('x', { abuse: -8 }) }),
      o('Manter a versão oficial.', 'Os protestos crescem.', { now: { protest: 6, reputation: -4, legitimacy: -3 }, groups: { opposition: -3, youth: -5 }, act: R('x', { abuse: 4, heat: 1 }) }),
      o('Declarar estado de emergência e dispersar as ruas.', 'Repressão aberta.', { now: { protest: -3, civil: -7, reputation: -7, control: 4 }, groups: { military: 2, opposition: -7 }, act: R('x', { abuse: 14, prisoners: 60, heat: 2 }) })]),
  I('rt_auth_visit', 'Direitos', 'Relator da ONU quer visitar o país', 'Um relator especial para tortura e detenções arbitrárias pediu uma visita oficial.', 'Os países ocidentais cobram resposta.',
    { min: { abuse: 35 } }, [
      o('Convidá-lo oficialmente.', 'Transparência.', { now: { reputation: 3 }, groups: { military: -1 }, act: R('x', { abuse: -3 }) }),
      o('Aceitar com agenda controlada.', 'Meio-termo.', { now: { reputation: 1 } }),
      o('Recusar o pedido.', 'Reduz o risco imediato; sinal ruim.', { now: { reputation: -3 }, act: R('x', { heat: 0.5 }) })]),
  I('rt_sanctions_pack', 'Mundo', 'Os países democráticos fecham o cerco', 'As sanções por direitos humanos já afetam o comércio. Embaixadores sugerem que só uma gesto de distensão destrava as negociações.', 'Cada semana de impasse custa caro.',
    { flag: 'rt_sanc_card' }, [
      o('Libertar presos políticos e permitir observadores.', 'Alívio gradual; risco de dissidência.', { now: { reputation: 4, legitimacy: 1 }, groups: { opposition: 5, military: -3 }, act: R('releaseAll', { pct: 0.5, flagOff: 'rt_sanc_card' }) }),
      o('Retaliar com restrições ao comércio e aos diplomatas.', 'Mostra força.', { now: { reputation: -2, legitimacy: 2 }, groups: { military: 3, business: -4 }, act: R('x', { relAuth: 5, relLib: -5, flagOff: 'rt_sanc_card' }) }),
      o('Buscar alívio com aliados autoritários.', 'Novas parcerias.', { now: { reputation: -1 }, act: R('x', { relAuth: 8, relLib: -2, flagOff: 'rt_sanc_card' }) })],
    { default: 2 }),

  // ================= TRIBUNAL INTERNACIONAL =================
  I('rt_icc_inquiry', 'Justiça internacional', 'O tribunal abre um exame preliminar', 'A promotoria do Tribunal Penal Internacional anunciou exame preliminar sobre supostos crimes contra a humanidade cometidos no país.', 'Cooperar reduz a pressão e o risco de acusação, mas pode expor ministros e generais.',
    { flag: 'rt_icc_inquiry' }, [
      o('Cooperar plenamente com a investigação.', 'Reputação sobe; ministros ficam expostos.', { now: { reputation: 3 }, groups: { military: -4, bureaucracy: -2 }, act: R('iccCooperate', ICC_CLEAR('rt_icc_inquiry')) }),
      o('Contestar a jurisdição e atrasar.', 'Reduz o ritmo; o mundo desconfia.', { now: { reputation: -2 }, act: R('iccObstruct', ICC_CLEAR('rt_icc_inquiry')) }),
      o('Deixar de reconhecer o tribunal.', 'Corta o risco formal; vira pária.', { now: { legitimacy: 1 }, groups: { military: 3 }, act: R('iccWithdraw', ICC_CLEAR('rt_icc_inquiry')) })], { default: 1 }),
  I('rt_icc_indict', 'Justiça internacional', 'O tribunal formaliza acusações', 'Altos funcionários do governo foram formalmente acusados de crimes contra a humanidade. Sanções individuais e congelamento de bens já estão em estudo.', 'O próximo passo pode ser um mandado de prisão contra o chefe de governo.',
    { flag: 'rt_icc_indict' }, [
      o('Entregar os acusados ao tribunal.', 'Preserva você; custa o apoio do aparato de segurança.', { now: { reputation: 6, legitimacy: -2, stability: -3 }, groups: { military: -8, bureaucracy: -3 }, act: R('iccCooperate', { abuse: -8, heat: -4, ...ICC_CLEAR('rt_icc_indict') }) }),
      o('Julgá-los no país, com um tribunal próprio.', 'Salva a face; observadores podem chamar de farsa.', { now: { reputation: 1, legitimacy: 2 }, groups: { military: -1 }, act: R('trialSelf', { heat: -2, ...ICC_CLEAR('rt_icc_indict') }) }),
      o('Ignorar e dobrar a aposta.', 'O mandado fica mais próximo.', { now: { reputation: -4 }, groups: { military: 3 }, act: R('iccObstruct', { heat: 1.5, ...ICC_CLEAR('rt_icc_indict') }) }),
      o('Deixar de reconhecer o tribunal.', 'Corta a jurisdição formal.', { now: { legitimacy: 1 }, groups: { military: 3 }, act: R('iccWithdraw', ICC_CLEAR('rt_icc_indict')) })], { default: 2 }),
  I('rt_icc_warrant', 'Justiça internacional', 'Mandado de prisão contra o governante', 'O Tribunal Penal Internacional expediu mandado de prisão contra você. Aliados começam a recusar convites; algumas fronteiras já estão fechadas.', 'Cada semana de poder aumenta o risco de ser entregue por um aliado cansado ou por um golpe.',
    { flag: 'rt_icc_warrant' }, [
      o('Entregar-se ao tribunal e negociar a pena.', 'Fim do governo; evita um final pior.', { act: R('iccSurrender', ICC_CLEAR('rt_icc_warrant')) }),
      o('Renunciar e partir para o exílio.', 'Foge antes de ser capturado.', { act: R('exile', ICC_CLEAR('rt_icc_warrant')) }),
      o('Não reconhecer o tribunal e buscar proteção de aliados.', 'Segue no poder; sempre sob ameaça.', { now: { reputation: -6, legitimacy: 1 }, groups: { military: 3 }, act: R('iccWithdraw', { relAuth: 6, ...ICC_CLEAR('rt_icc_warrant') }) }),
      o('Oferecer uma libertação em massa e uma anistia.', 'Pode desarmar o processo; a oposição se fortalece.', { now: { reputation: 3 }, groups: { opposition: 6, military: -4 }, act: R('releaseAll', { pct: 1, unban: true, heat: -5, abuse: -8, ...ICC_CLEAR('rt_icc_warrant') }) })], { default: 2 }),

  // ================= LIBERAL =================
  I('rt_lib_hate', 'Direitos', 'Discurso de ódio nas redes', 'Grupos extremistas usam as redes para atacar minorias e imigrantes. Parte do público pede censura; outra parte defende a liberdade total.', 'Qualquer lei de moderação será usada como argumento nas eleições.',
    { min: { liberty: 60 } }, [
      o('Criminalizar discurso de ódio com supervisão judicial.', 'Protege as minorias; críticos falam em censura.', { now: { civil: -1, reputation: 2 }, groups: { youth: 2, rural: -3 }, act: R('x', { ethnic: -2 }) }),
      o('Exigir transparência das plataformas.', 'Meio-termo.', { now: { reputation: 1 }, groups: { business: -1 } }),
      o('Não intervir.', 'Liberdade total; clima mais tenso.', { now: { civil: 1 }, groups: { youth: -1 }, act: R('x', { ethnic: 3 }) })]),
  I('rt_lib_sanctuary', 'Imigração', 'Cidades-santuário para imigrantes', 'Prefeitos de várias cidades prometem não colaborar com a polícia de imigração e dar documentos locais a estrangeiros sem papéis.', 'O interior e as grandes cidades discordam.',
    { min: { liberty: 55, imm: 5 } }, [
      o('Apoiar as cidades.', 'Integração, mas atrito com o interior.', { now: { civil: 2, reputation: 2 }, groups: { youth: 4, rural: -5 }, act: R('x', { ethnic: -3 }) }),
      o('Ameaçar cortar verbas.', 'Aplica a lei; custa popularidade nas cidades.', { now: { civil: -1 }, groups: { rural: 3, youth: -4, regional: -3 } }),
      o('Aprovar uma anistia de documentos.', 'Legaliza milhares.', { now: { reputation: 2, productivity: 0.5 }, groups: { rural: -4, business: 3 }, act: R('naturalizePct', { pct: 0.3 }) })]),
  I('rt_lib_prize', 'Direitos', 'Prêmio internacional de direitos humanos', 'Uma fundação reconheceu o país como exemplo de respeito às liberdades e à integração de imigrantes.', 'O prêmio rende prestígio e pede que você mantenha o padrão.',
    { min: { liberty: 70 }, max: { abuse: 20 } }, [
      o('Receber o prêmio em cerimônia pública.', 'Prestígio.', { now: { reputation: 5, legitimacy: 2 }, groups: { youth: 3 } }),
      o('Usar o prêmio para abrir um fundo de apoio a refugiados.', 'Mais imagem; mais gastos.', { now: { reputation: 4, treasury: -0.15 }, groups: { youth: 4, rural: -2 }, act: R('x', { imm: 0.3 }) })]),
  I('rt_lib_repar', 'Direitos', 'Ex-presos políticos pedem reparação', 'Sobreviventes de governos anteriores exigem indenização e um memorial. O tema divide militares e a sociedade civil.', 'Reparar é caro, mas fecha feridas.',
    { min: { liberty: 50 }, max: { abuse: 25 } }, [
      o('Criar comissão da verdade e pagar reparações.', 'Reconciliação; atrito com militares.', { now: { treasury: -0.3, legitimacy: 3, reputation: 3 }, groups: { military: -4, youth: 3, opposition: 3 } }),
      o('Apenas um memorial simbólico.', 'Barato.', { now: { reputation: 1 }, groups: { military: -1 } }),
      o('Decretar o fim das investigações ("virar a página").', 'Agrada aos militares.', { now: { legitimacy: -1 }, groups: { military: 3, youth: -3, opposition: -3 } })]),

  // ================= ÉTNICO =================
  I('rt_eth_uprising', 'Minorias', 'Rebelião em região de minoria', 'Milícias de uma região de minoria étnica tomaram delegacias e hastearam uma bandeira própria. Exigem autonomia e o fim da discriminação.', 'O que você fizer vai definir a relação com todas as minorias do país.',
    { min: { ethnic: 62 } }, [
      o('Negociar: autonomia cultural e anistia.', 'Pode acalmar o conflito; nacionalistas reclamam.', { now: { reputation: 3 }, groups: { regional: 6, military: -3 }, act: R('concedeWorst', { abuse: -3 }), policy: { autonomy: 'federal' } }),
      o('Esmagar a rebelião com o exército.', 'Rápido e sangrento.', { now: { control: 3, reputation: -4 }, groups: { military: 4, regional: -6 }, act: R('crushWorst') }),
      o('Cortar verbas e isolar a região.', 'Pressão sem tiros.', { now: { treasury: 0.2 }, groups: { regional: -4 }, act: R('x', { ethnic: 4, abuse: 3 }) })], { crisis: true }),
  I('rt_eth_language', 'Minorias', 'Disputa pela língua oficial', 'Representantes de uma minoria exigem que sua língua seja oficial nas escolas e tribunais da região.', 'Línguas viram política.',
    { min: { minorities: 8 } }, [
      o('Reconhecer a língua como cooficial.', 'Reduz a tensão; custo administrativo.', { now: { treasury: -0.15, reputation: 2 }, groups: { regional: 5, rural: -2 }, act: R('x', { ethnic: -8 }) }),
      o('Permitir só no ensino básico.', 'Compromisso.', { now: { treasury: -0.05 }, act: R('x', { ethnic: -3 }) }),
      o('Manter uma língua única.', 'Nacionalismo; ressentimento.', { groups: { rural: 2, regional: -3 }, act: R('x', { ethnic: 5 }) })]),
  I('rt_eth_kin', 'Minorias', 'O vizinho se diz protetor da minoria', 'Um país vizinho passou a oferecer passaportes e apoio político à minoria que vive na sua fronteira, dizendo defendê-la.', 'O discurso lembra pretextos históricos para intervenções.',
    { min: { ethnic: 45, minorities: 6 } }, [
      o('Proibir passaportes estrangeiros.', 'Afirma soberania; ressentimento.', { now: { civil: -1 }, groups: { military: 2, regional: -3 }, act: R('x', { ethnic: 4 }), rel: { neighbors: -6 } }),
      o('Oferecer à minoria direitos e investimentos.', 'Tira o argumento do vizinho.', { now: { treasury: -0.3 }, groups: { regional: 4 }, act: R('concedeWorst'), rel: { neighbors: 2 } }),
      o('Reforçar a fronteira.', 'Dissuasão.', { now: { treasury: -0.2 }, groups: { military: 3 }, rel: { neighbors: -3 } })]),
  I('rt_eth_violence', 'Minorias', 'Violência contra uma minoria', 'Uma multidão queimou lojas e casas de uma comunidade minoritária depois de um boato nas redes. A polícia chegou tarde.', 'O país observa como o governo vai reagir.',
    { min: { ethnic: 55 } }, [
      o('Prender os agressores e proteger a comunidade.', 'Reafirma a lei; parte do público reclama.', { now: { reputation: 3, civil: 1 }, groups: { rural: -3, regional: 3 }, act: R('x', { ethnic: -6, abuse: -2 }) }),
      o('Minimizar o episódio e pedir calma.', 'Evita atritos; a minoria perde confiança.', { now: { reputation: -2 }, act: R('x', { ethnic: 5 }) }),
      o('Apoiar discretamente a maioria nativista.', 'Colhe votos; o episódio se repete.', { now: { reputation: -5, civil: -3 }, groups: { rural: 4 }, act: R('x', { ethnic: 10, abuse: 8 }) })]),
  I('rt_eth_refugees', 'Minorias', 'A minoria foge para o país vizinho', 'Depois da repressão, milhares de membros da minoria cruzam a fronteira. Campos de refugiados surgem do outro lado.', 'A imagem do país no exterior despenca.',
    { min: { ethnic: 55, abuse: 45 } }, [
      o('Permitir o retorno com garantias.', 'Reduz a crise; custa político.', { now: { reputation: 4, treasury: -0.1 }, act: R('x', { ethnic: -6, popPct: 0.05 }) }),
      o('Declarar que são "traidores" e confiscar seus bens.', 'Pune; aumenta a revolta.', { now: { reputation: -6, treasury: 0.15 }, groups: { rural: 3 }, act: R('x', { ethnic: 6, abuse: 8, popPct: -0.08 }) }),
      o('Ignorar a crise.', 'Silêncio.', { now: { reputation: -3 }, act: R('x', { popPct: -0.06 }) })]),

  // ================= IMIGRAÇÃO =================
  I('rt_imm_tension', 'Imigração', 'Cresce a tensão contra imigrantes', 'Um partido nativista ganha as ruas com o lema "o país primeiro". Há ataques a abrigos e discursos duros no parlamento.', 'O assunto domina o debate nacional.',
    { min: { imm: 8 } }, [
      o('Deportar uma parte dos imigrantes irregulares.', 'Agrada nativistas; custo humano e imagem.', { now: { civil: -2 }, groups: { rural: 4 }, act: R('deportPct', { pct: 0.12 }) }),
      o('Lançar programa de integração e naturalização.', 'Melhora a convivência a longo prazo.', { now: { treasury: -0.3, civil: 2 }, groups: { rural: -3, youth: 3 }, act: R('naturalizePct', { pct: 0.25 }) }),
      o('Ficar em silêncio.', 'Tensão sobe.', { now: { protest: 2 }, act: R('x', { ethnic: 4 }) })]),
  I('rt_imm_riot', 'Imigração', 'Distúrbios em bairro de imigrantes', 'Uma ação policial violenta acendeu protestos em um bairro popular onde vive grande parte da comunidade imigrante.', 'Carros queimados, saques e confrontos nas ruas.',
    { min: { imm: 9 } }, [
      o('Conter com polícia e prisões em massa.', 'Restaura a ordem; gera ressentimento.', { now: { protest: -3, civil: -3, reputation: -3 }, groups: { rural: 3, youth: -4 }, act: R('x', { abuse: 8, prisoners: 25 }) }),
      o('Dialogar com lideranças e investir no bairro.', 'Mais lento e caro.', { now: { treasury: -0.4, protest: -1, qol: 1 }, groups: { youth: 3, rural: -2 }, act: R('x', { ethnic: -3 }) }),
      o('Deportar os líderes dos protestos.', 'Bode expiatório; cria um mártir.', { now: { reputation: -4 }, groups: { rural: 3, youth: -3 }, act: R('deportPct', { pct: 0.03 }) })]),
  I('rt_imm_party', 'Imigração', 'Partido anti-imigração cresce nas pesquisas', 'Um novo partido que promete "fechar as fronteiras" dobra o apoio em seis meses. Os partidos tradicionais debatem se copiam o discurso.', 'A política migratória virou o tema decisivo.',
    { min: { imm: 10 }, policy: { elections: 'multiparty' } }, [
      o('Endurecer as regras migratórias.', 'Rouba o discurso; reputação cai.', { now: { reputation: -2 }, groups: { rural: 4, business: -2 }, policy: { immigration: 'restricted' } }),
      o('Defender a imigração controlada e a integração.', 'Mantém os valores; arrisca votos.', { now: { reputation: 2 }, groups: { rural: -3, youth: 3 } }),
      o('Cercar o partido com acusações judiciais.', 'Risco de escândalo.', { now: { civil: -2, reputation: -3, legitimacy: -2 }, groups: { opposition: -3 }, act: R('x', { abuse: 5 }) })]),
  I('rt_imm_wave', 'Imigração', 'Onda de refugiados na fronteira', 'Milhares de refugiados de uma guerra vizinha se aglomeram na fronteira. Faltam abrigos, comida e médicos.', 'O mundo olha como o país vai reagir.',
    { max: { imm: 22 } }, [
      o('Abrir a fronteira e organizar acolhida.', 'Reputação e mão de obra; custa caro e gera tensão.', { now: { treasury: -0.5, reputation: 5, housing: -2 }, groups: { youth: 3, rural: -4 }, act: R('x', { imm: 1.8 }) }),
      o('Aceitar por cotas e com triagem.', 'Equilíbrio.', { now: { treasury: -0.2, reputation: 1 }, act: R('x', { imm: 0.7 }) }),
      o('Fechar a fronteira.', 'Poupa recursos; imagem de dureza.', { now: { reputation: -4 }, groups: { rural: 3 }, act: R('x', { abuse: 6 }), policy: { refugees: 'refuse' } })]),
  I('rt_imm_labor', 'Imigração', 'Empresários pedem mais imigrantes', 'Setores inteiros enfrentam falta de mão de obra. A associação empresarial exige vistos de trabalho e criação de um programa temporário.', 'Os sindicatos temem a queda de salários.',
    { max: { imm: 6, unemployment: 6.5 }, min: { gdppc: 8000 } }, [
      o('Criar vistos temporários de trabalho.', 'Mais produção; mais imigrantes.', { now: { growth: 0.3, productivity: 0.5 }, groups: { business: 5, workers: -3 }, act: R('x', { imm: 0.9 }) }),
      o('Primeiro requalificar os desempregados locais.', 'Bom para os trabalhadores; mais lento.', { now: { treasury: -0.3, unemployment: -0.3 }, groups: { workers: 4, business: -2 } }),
      o('Recusar.', 'Sem mudança.', { groups: { business: -3 } })]),
  I('rt_imm_ghetto', 'Imigração', 'Guetos urbanos', 'Bairros inteiros viraram enclaves isolados, com escolas precárias e pouca presença do Estado. Os moradores se sentem abandonados.', 'Sem integração, o isolamento alimenta o radicalismo.',
    { min: { imm: 11 } }, [
      o('Plano de obras, escolas e transporte.', 'Integra; custa caro.', { now: { treasury: -0.7, housing: 4, education: 1, crime: -1 }, groups: { youth: 3, rural: -2 }, act: R('x', { ethnic: -4 }) }),
      o('Policiamento intensivo.', 'Controle rápido.', { now: { crime: -2, civil: -2 }, groups: { rural: 2 }, act: R('x', { abuse: 4, ethnic: 3 }) }),
      o('Dispersar os moradores por todo o país.', 'Polêmico; reduz o isolamento.', { now: { civil: -2, treasury: -0.2 }, groups: { youth: -2 }, act: R('x', { abuse: 3, ethnic: -2 }) })]),
  I('rt_imm_remittance_ban', 'Imigração', 'Imigrantes querem votar', 'Residentes estrangeiros de longa data exigem direito de voto nas eleições locais.', 'A medida divide a política.',
    { min: { imm: 5, liberty: 50 } }, [
      o('Conceder voto local.', 'Integração política; nativistas protestam.', { now: { civil: 2, reputation: 2 }, groups: { rural: -4, youth: 3 }, act: R('naturalizePct', { pct: 0.15 }) }),
      o('Exigir 10 anos de residência.', 'Meio-termo.', { now: { reputation: 0 } }),
      o('Negar.', 'Segue o status quo.', { groups: { rural: 2, youth: -2 } })]),

  // ================= FUGITIVOS E TRIBUNAIS =================
  I('rt_fug_warcrim', 'Justiça internacional', 'Criminoso de guerra pede asilo', 'Um ex-comandante de um país vizinho, procurado pelo tribunal internacional por massacres, chegou ao país e pede asilo político.', 'Os aliados do comandante o veem como herói; o mundo, como criminoso.',
    { max: { imm: 40 } }, [
      o('Abrigá-lo e recusar a extradição.', 'Agrada ao aparato militar; custa reputação.', { now: { reputation: -5 }, groups: { military: 3 }, act: R('harbor', { name: 'O comandante foragido' }) }),
      o('Entregá-lo ao tribunal internacional.', 'Reputação e boas relações com democracias.', { now: { reputation: 6 }, groups: { military: -3 }, act: R('extradite', { name: 'O comandante' }) }),
      o('Julgá-lo no país, com tribunal próprio.', 'Mostra soberania; precisa de um julgamento crível.', { now: { treasury: -0.15 }, act: R('trialSelf') }),
      o('Expulsá-lo para um terceiro país.', 'Evita o problema; críticas dos dois lados.', { now: { reputation: -1 } })], { cd: 365 }),
  I('rt_fug_dictator', 'Justiça internacional', 'Ditador deposto aterrissa na capital', 'Um ex-ditador, expulso do poder em seu país, desembarca de jatinho com malas de dinheiro e pede refúgio.', 'Seu novo governo exige a extradição para um julgamento.',
    { max: { imm: 40 } }, [
      o('Abrigá-lo (e ficar com o dinheiro).', 'Cofres cheios; reputação cai.', { now: { treasury: 0.6, reputation: -5, corruption: 2 }, groups: { military: 2 }, act: R('harbor', { name: 'O ex-ditador' }) }),
      o('Entregar a seu país.', 'Reputação e melhores relações regionais.', { now: { reputation: 4 }, rel: { neighbors: 4 }, act: R('extradite', { name: 'O ex-ditador' }) }),
      o('Aceitá-lo apenas como residente discreto.', 'Meio-termo.', { now: { reputation: -2, treasury: 0.2 }, act: R('harbor', { name: 'O ex-ditador' }) }),
      o('Recusar o pouso.', 'Evita o problema.', { now: { reputation: 0 } })], { cd: 365 }),
  I('rt_fug_extradite', 'Justiça internacional', 'Aliado exige a entrega de um opositor', 'Um governo autoritário aliado pede a extradição de um jornalista asilado, acusando-o de terrorismo.', 'A decisão testa os seus valores.',
    { min: { gdppc: 3000 } }, [
      o('Entregar o jornalista.', 'Agrada o aliado; imagem arranhada.', { now: { reputation: -4 }, rel: { all: 0 }, act: R('x', { abuse: 6, relAuth: 5, relLib: -4 }) }),
      o('Recusar e conceder asilo.', 'Reputação sobe; o aliado fica irritado.', { now: { reputation: 4 }, act: R('x', { relAuth: -6, relLib: 4 }) }),
      o('Adiar com recursos judiciais.', 'Ganha tempo.', { now: { reputation: 0 } })], { cd: 300 }),
  I('rt_fug_visit', 'Justiça internacional', 'Chefe de Estado com mandado visita o país', 'Um chefe de Estado procurado pelo tribunal internacional pretende participar de uma cúpula regional no seu país.', 'Como membro do tribunal, o país seria obrigado a prendê-lo.',
    { min: { gdppc: 2000 } }, [
      o('Prendê-lo, como manda o tratado.', 'Honra o direito internacional; crise diplomática.', { now: { reputation: 6 }, groups: { military: -2 }, act: R('x', { relLib: 5, relAuth: -8, heat: -1 }) }),
      o('Deixá-lo entrar e ignorar o mandado.', 'Preserva o aliado; a reputação cai.', { now: { reputation: -4 }, act: R('x', { relAuth: 5, relLib: -5, heat: 1 }) }),
      o('Mudar o local da cúpula.', 'Evita o dilema.', { now: { reputation: -1 } })], { cd: 365 }),
  I('rt_fug_asylum', 'Justiça internacional', 'Dissidente do país vizinho pede asilo', 'Uma ativista fugida de um regime vizinho bate à porta da embaixada. Se aceitar, o vizinho promete represálias comerciais.', 'Direitos humanos ou conveniência diplomática.',
    { min: { gdppc: 2000 } }, [
      o('Conceder asilo.', 'Reputação sobe; atrito com o vizinho.', { now: { reputation: 4 }, rel: { neighbors: -6 } }),
      o('Aceitar em segredo e negar publicamente.', 'Gestão de risco.', { now: { reputation: 1 }, rel: { neighbors: -2 } }),
      o('Recusar.', 'Segue a conveniência.', { now: { reputation: -2 } })], { cd: 300 }),

  // ================= LEIS PENAIS =================
  I('rt_dp_wrongful', 'Direitos', 'Condenado executado era inocente', 'Novas provas de DNA mostraram que um homem executado no ano passado era inocente. O caso reabre o debate sobre a pena de morte.', 'Organizações e a imprensa exigem mudança.',
    { policy: { deathpenalty: ['exceptional', 'routine'] } }, [
      o('Abolir a pena de morte.', 'Reputação sobe; parte do público reclama.', { now: { reputation: 5, civil: 4 }, groups: { rural: -4, youth: 3 }, policy: { deathpenalty: 'abolished' }, act: R('x', { abuse: -5 }) }),
      o('Moratória e revisão de todos os casos.', 'Meio-termo.', { now: { reputation: 3, civil: 2 }, groups: { rural: -1 }, policy: { deathpenalty: 'exceptional' } }),
      o('Manter a lei e reforçar as perícias.', 'Sem mudança.', { now: { treasury: -0.1 }, groups: { rural: 2 } })]),
  I('rt_dp_referendum', 'Direitos', 'Plebiscito sobre a pena de morte', 'Após uma série de crimes brutais, a população pede um plebiscito sobre o retorno da pena capital.', 'A maioria parece a favor. As ONGs alertam para o risco.',
    { policy: { deathpenalty: 'abolished' }, min: { crime: 55 } }, [
      o('Convocar o plebiscito e respeitar o resultado.', 'Restabelece a pena; a reputação cai.', { now: { legitimacy: 2, reputation: -5, crime: -1, civil: -3 }, groups: { rural: 5, youth: -3 }, policy: { deathpenalty: 'exceptional' } }),
      o('Recusar e reforçar a polícia.', 'Mantém o padrão; críticas dos conservadores.', { now: { treasury: -0.3, crime: -1 }, groups: { rural: -3, business: 2 } }),
      o('Reintroduzir de forma ampla (rotineira).', 'Populista.', { now: { legitimacy: 3, reputation: -9, crime: -3, civil: -7 }, groups: { rural: 6, youth: -5 }, policy: { deathpenalty: 'routine' } })]),
  I('rt_pol_brutality', 'Direitos', 'Vídeo de violência policial viraliza', 'Um vídeo mostra policiais espancando um homem rendido. Protestos explodem em várias cidades.', 'A política de segurança é a questão.',
    { policy: { policing: ['tough', 'ruthless'] } }, [
      o('Punir os policiais e criar corregedoria externa.', 'Reduz o abuso; atrito com a polícia.', { now: { legitimacy: 3, reputation: 3, civil: 2 }, groups: { military: -3, youth: 3 }, policy: { policing: 'standard' }, act: R('x', { abuse: -6 }) }),
      o('Defender a polícia.', 'Agrada à base conservadora; protestos crescem.', { now: { protest: 4, reputation: -3 }, groups: { military: 3, youth: -5 }, act: R('x', { abuse: 3 }) }),
      o('Mandar a tropa de choque às ruas.', 'Escalada.', { now: { protest: -2, civil: -5, reputation: -6 }, groups: { youth: -6 }, act: R('x', { abuse: 11, prisoners: 30 }) })]),
  I('rt_pol_soft', 'Segurança', 'Onda de crimes e polícia tolerante', 'Assaltos e roubos explodem nos bairros ricos e comerciantes pedem mão de ferro. A polícia só aplica advertências.', 'A tolerância aparente virou tema nas eleições.',
    { policy: { policing: 'tolerant' }, min: { crime: 52 } }, [
      o('Endurecer o policiamento.', 'Crime cai; direitos sofrem.', { now: { crime: -3, civil: -2 }, groups: { business: 4, youth: -3 }, policy: { policing: 'standard' } }),
      o('Investir em prevenção e inteligência.', 'Mais lento, mais barato em direitos.', { now: { treasury: -0.3, crime: -1.5 }, groups: { bureaucracy: 2 } }),
      o('Manter a linha tolerante.', 'Sem mudança.', { now: { crime: 1 }, groups: { business: -3, rural: -2 } })]),
  I('rt_prison_riot', 'Segurança', 'Rebelião em presídio superlotado', 'Presos tomaram um pavilhão em protesto contra as condições. Há reféns.', 'O sistema prisional está no limite.',
    { min: { crime: 45 } }, [
      o('Negociar e reformar o presídio.', 'Evita mortes; custa dinheiro.', { now: { treasury: -0.4, reputation: 2, civil: 1 }, policy: { prisons: 'humane' }, act: R('x', { abuse: -4 }) }),
      o('Invadir com forças especiais.', 'Encerra rápido; há mortos.', { now: { crime: -1, reputation: -3 }, groups: { military: 3 }, act: R('x', { abuse: 7 }) }),
      o('Cortar água e comida até a rendição.', 'Brutal.', { now: { reputation: -4 }, act: R('x', { abuse: 8 }), policy: { prisons: 'harsh' } })]),
  I('rt_gambling', 'Economia', 'Cassino lava dinheiro de cartel', 'Uma investigação mostrou que os cassinos lavam dinheiro de grupos criminosos e financiam políticos.', 'Fechar os jogos custa receita.',
    { policy: { gambling: ['licensed', 'free'] }, min: { corruption: 35 } }, [
      o('Fechar os cassinos.', 'Combate o crime; perde-se receita.', { now: { corruption: -3, treasury: -0.1 }, groups: { rural: 3, business: -3 }, policy: { gambling: 'banned' } }),
      o('Auditoria rigorosa e licenças novas.', 'Mantém o setor.', { now: { corruption: -1, treasury: -0.05 }, groups: { bureaucracy: 2 } }),
      o('Ignorar. É dinheiro demais.', 'Corrupção sobe.', { now: { corruption: 2, treasury: 0.2 }, groups: { business: 2 } })]),
  I('rt_drugs_cartel', 'Segurança', 'Cartel desafia o Estado', 'Um cartel de drogas assumiu bairros inteiros, cobra "impostos" e executa policiais. O debate sobre a política de drogas voltou.', 'Qualquer resposta é controversa.',
    { policy: { drugs: ['war', 'prohibited'] }, min: { crime: 48 } }, [
      o('Descriminalizar o uso e tratar como saúde.', 'Tira o mercado do cartel; críticas morais.', { now: { civil: 3, health: 2, reputation: 2 }, groups: { youth: 4, rural: -4 }, policy: { drugs: 'decriminalized' } }),
      o('Declarar guerra total às drogas.', 'Operações militares; abusos e baixas.', { now: { crime: -3, civil: -6, reputation: -3 }, groups: { military: 4, youth: -4 }, policy: { drugs: 'war' }, act: R('x', { abuse: 9 }) }),
      o('Negociar com chefes locais.', 'Paz frágil; corrupção.', { now: { crime: -1.5, corruption: 4, reputation: -2 }, groups: { military: -2 } })]),
  I('rt_drugs_results', 'Segurança', 'Balanço da descriminalização', 'Relatórios mostram queda nas overdoses e nas prisões por posse, mas moradores reclamam de cenas de uso nas praças.', 'O debate sobre a política de drogas segue aceso.',
    { policy: { drugs: ['decriminalized', 'legal'] } }, [
      o('Ampliar tratamento e redução de danos.', 'Resultados melhores; custa caro.', { now: { treasury: -0.3, health: 2, crime: -1 }, groups: { youth: 3 } }),
      o('Endurecer em espaços públicos.', 'Meio-termo.', { now: { civil: -1, crime: -1 }, groups: { rural: 2 } }),
      o('Retroceder para a proibição.', 'Agrada aos conservadores; mais prisões.', { now: { civil: -3 }, groups: { rural: 4, youth: -4 }, policy: { drugs: 'prohibited' } })]),
  I('rt_alcohol', 'Sociedade', 'Lei seca e mercado ilegal', 'Destilarias clandestinas crescem; envenenamentos por bebidas adulteradas viram notícia.', 'Os religiosos defendem a proibição; a saúde pública vê o risco.',
    { policy: { alcohol: 'banned' } }, [
      o('Regulamentar o álcool.', 'Tira o mercado do crime.', { now: { crime: -1, corruption: -2 }, groups: { youth: 4, rural: -3 }, policy: { alcohol: 'regulated' } }),
      o('Endurecer a fiscalização.', 'Mantém a linha.', { now: { treasury: -0.15, civil: -1 }, groups: { rural: 2 } }),
      o('Ignorar.', 'Sem mudança.', { now: { health: -1 } })]),
];

// Evitar chaves inválidas no 'extra'
const clean = L.map(x => { if (x.cond === undefined) delete x.cond; return x; });
writeFileSync(out('issues_rights.json'), JSON.stringify(clean, null, 1));
const cp = out('content.json'), c = JSON.parse(readFileSync(cp, 'utf8'));
if (!c.issues.includes('issues_rights')) { c.issues.push('issues_rights'); writeFileSync(cp, JSON.stringify(c, null, 1)); }
console.log('questões de direitos:', clean.length);
