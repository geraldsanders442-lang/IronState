// Idioma da interface. Português é o idioma de origem; o inglês traduz a interface (menus, painéis, botões,
// rótulos). O conteúdo narrativo (questões, eventos e notícias) continua em português nesta versão.
const EN = {
  // Navegação
  'Nação': 'Nation', 'Visão geral': 'Overview', 'Questões': 'Issues', 'Estatísticas': 'Statistics', 'Gráficos e plano': 'Charts & plan',
  'Governo': 'Government', 'Orçamento': 'Budget', 'Iniciativas': 'Initiatives', 'Economia': 'Economy', 'Leis e direitos': 'Laws & rights', 'Desenvolvimento urbano': 'Urban development', 'Pesquisa': 'Research',
  'Poder': 'Power', 'Política': 'Politics', 'Sociedade e gabinete': 'Society & cabinet', 'Diplomacia': 'Diplomacy', 'Forças armadas': 'Armed forces', 'Mapa-múndi': 'World map', 'Rankings': 'Rankings',
  'Arquivo': 'Archive', 'Relatórios': 'Reports', 'Opções': 'Options', 'Enciclopédia': 'Encyclopedia', 'Editor e mods': 'Editor & mods',
  // Topo
  'Próxima semana ▶': 'Next week ▶', 'Tesouro': 'Treasury', 'Saldo/ano': 'Balance/yr', 'Dívida': 'Debt', 'Estabilidade': 'Stability', 'Apoio': 'Support', 'MANCHETES': 'HEADLINES',
  'GUERRA': 'WAR', 'CRISE': 'CRISIS', 'INFLAÇÃO': 'INFLATION', 'Inflação': 'Inflation', 'FOME': 'FAMINE', 'REVOLTA': 'REVOLT', 'GOLPE': 'COUP', 'Protestos': 'Protests', 'Emissão de moeda': 'Money printing', 'Sanções': 'Sanctions', 'SEM CAPITAL': 'NO CAPITAL',
  // Botões comuns
  'Decidir': 'Decide', 'Decidir depois': 'Decide later', 'Continuar': 'Continue', 'Fechar': 'Close', 'Cancelar': 'Cancel', 'Executar': 'Execute', 'Confirmar': 'Confirm', 'Lançar': 'Launch', 'Construir': 'Build', 'Trocar': 'Replace', 'Nomear': 'Appoint', 'Convidar': 'Invite', 'Impor': 'Impose', 'Declarar': 'Declare', 'Ordenar': 'Order', 'Salvar aqui': 'Save here', 'Carregar': 'Load',
  'Avançar →': 'Next →', '← Voltar': '← Back', 'Começar a campanha': 'Start the campaign', 'Começar': 'Start', 'Nova partida': 'New game', 'Exportar arquivo': 'Export file', 'Importar arquivo': 'Import file', 'Ver questões': 'See issues', 'Próximo →': 'Next →', 'Concluir': 'Finish', 'Pular tutorial': 'Skip tutorial', 'Ver tutorial': 'Show tutorial',
  // Painéis
  'Mapa nacional': 'National map', 'Questões e crises': 'Issues & crises', 'Riscos': 'Risks', 'Guerras': 'Wars', 'Missões': 'Missions', 'Finanças': 'Finances', 'Sociedade': 'Society', 'Manchetes': 'Headlines', 'Conselheiros': 'Advisors',
  'Receita/ano': 'Revenue/yr', 'Despesa/ano': 'Spending/yr', 'Saldo': 'Balance', 'Parlamento e eleições': 'Parliament & elections', 'Gabinete': 'Cabinet', 'Facções do regime': 'Regime factions', 'Governante': 'Ruler', 'Constituição': 'Constitution', 'Opinião pública': 'Public opinion',
  'Partidos': 'Parties', 'Partido': 'Party', 'Líder': 'Leader', 'Intenção de voto': 'Voting intention', 'Cadeiras': 'Seats', 'Pasta': 'Portfolio', 'Ministro(a)': 'Minister', 'Competência': 'Competence', 'Lealdade': 'Loyalty', 'Corrupção': 'Corruption', 'Perfil': 'Profile', 'Facção': 'Faction', 'Poder ': 'Power ', 'Satisfação': 'Satisfaction',
  'Idade': 'Age', 'Saúde': 'Health', 'Carisma': 'Charisma', 'Traços': 'Traits', 'Herdeiro(a)': 'Heir', 'Geração': 'Generation', 'Linhagem': 'Lineage', 'Aprovação do governo': 'Government approval', 'Por grupo': 'By group', 'Por região': 'By region',
  'Visão geral e programas': 'Overview & programs', 'Obras no mapa': 'Map projects', 'Mercados e empresas': 'Markets & companies', 'Moeda e câmbio': 'Currency & exchange', 'Obras nas províncias': 'Provincial projects', 'Tipos de obra': 'Project types', 'Mercados mundiais e empresas': 'World markets & companies', 'Grandes empresas': 'Major companies', 'Regime cambial': 'Exchange-rate regime', 'Programas econômicos': 'Economic programs',
  'Macroeconomia': 'Macroeconomy', 'Comércio exterior': 'Foreign trade', 'Produção e consumo por setor (bi/ano)': 'Production and consumption by sector (bn/yr)', 'Economia nacional': 'National economy', 'Orçamento nacional': 'National budget', 'Impostos e gastos': 'Taxes & spending', 'Contas públicas': 'Public accounts', 'Dívida e crédito': 'Debt & credit', 'Composição das despesas': 'Spending breakdown',
  'Países': 'Countries', 'Organizações': 'Organizations', 'Blocos próprios': 'Own blocs', 'Empréstimos e ajuda': 'Loans & aid', 'Mundo e ONU': 'World & UN', 'Ações': 'Actions', 'Operações secretas': 'Covert operations', 'Espionagem': 'Espionage', 'Tensão mundial': 'World tension', 'Mudanças de regime no mundo': 'Regime changes worldwide', 'Votações na ONU': 'UN votes',
  'Capacidades': 'Capabilities', 'Equilíbrio regional': 'Regional balance', 'Ameaças': 'Threats', 'Ordens permanentes': 'Standing orders', 'Declarar guerra': 'Declare war', 'Armas nucleares': 'Nuclear weapons', 'Comando: corpos de exército': 'Command: army corps', 'Marinha e aviação': 'Navy & air force', 'Guerras no mundo': 'Wars in the world', 'Histórico': 'History', 'Operações': 'Operations',
  'Pesquisa e tecnologia': 'Research & technology', 'Turnos': 'Turns', 'Imagens e som': 'Images & sound', 'Acessibilidade': 'Accessibility', 'Salvamento': 'Saving', 'Bandeira nacional': 'National flag', 'Sobre o conteúdo': 'About the content', 'Idioma': 'Language',
  'Grupos sociais': 'Social groups', 'Gabinete e figuras públicas': 'Cabinet & public figures', 'Estabilidade do regime': 'Regime stability', 'Metas de governo': 'Government goals', 'Deixar o poder': 'Leave power', 'Povos e religiões por região': 'Peoples & religions by region', 'Imprensa': 'Press',
  'Modo de jogo': 'Game mode', 'Escolha um cenário': 'Choose a scenario', 'Dificuldade': 'Difficulty', 'Continuar ': 'Continue ', 'Cenário': 'Scenario', 'Território': 'Territory', 'Identidade': 'Identity', 'Questionário': 'Questionnaire', 'Resultado': 'Result',
  'Sandbox': 'Sandbox', 'Ironman': 'Ironman', 'Dinastia': 'Dynasty', 'Desafio': 'Challenge', 'Desafio diário': 'Daily challenge', 'Roguelite': 'Roguelite', 'Ascensão ao poder': 'Rise to power',
  'Indicadores': 'Indicators', 'Mecânicas': 'Mechanics', 'Catálogo de questões': 'Issue catalog', 'Minhas decisões': 'My decisions', 'Nova questão': 'New issue', 'Indicadores da semana': 'This week\'s indicators', 'Pesquisa da semana': 'Poll of the week', 'Gabinete alerta': 'Cabinet warns', 'Em resumo': 'In brief', 'Atos do governo': 'Government acts',
};
const EN_PREFIX = [[/^Semana (\d+)/, 'Week $1'], [/^(\d+) questão\(ões\)/, '$1 issue(s)'], [/^Ver questões \((\d+)\)/, 'See issues ($1)'], [/^Questões e crises \((\d+)\)/, 'Issues & crises ($1)'], [/^Notícias da semana/, 'News of the week']];

let LANG = 'pt';
export function setLang(l) { LANG = l === 'en' ? 'en' : 'pt'; document.documentElement.lang = LANG === 'en' ? 'en' : 'pt-BR'; if (LANG === 'en') startObserver(); else stopObserver(); }
export const lang = () => LANG;
function tr(text) {
  const t = text.trim(); if (!t) return null;
  if (EN[t]) return text.replace(t, EN[t]);
  for (const [re, rep] of EN_PREFIX) if (re.test(t)) return text.replace(t, t.replace(re, rep));
  return null;
}
export function translateDOM(root = document.body) {
  if (LANG !== 'en' || !root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
  for (const n of nodes) { const p = n.parentElement; if (!p || p.closest('script,style,textarea,[data-notr]')) continue; const v = tr(n.nodeValue); if (v != null && v !== n.nodeValue) n.nodeValue = v; }
  for (const el of root.querySelectorAll?.('[placeholder],[title]') || []) { for (const a of ['placeholder', 'title']) { const v = el.getAttribute(a); const x = v && tr(v); if (x) el.setAttribute(a, x); } }
}
let obs = null, pending = false;
function startObserver() {
  if (obs) return;
  obs = new MutationObserver(() => { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; obs.disconnect(); translateDOM(document.body); obs.observe(document.body, { childList: true, subtree: true }); }); });
  obs.observe(document.body, { childList: true, subtree: true });
  translateDOM(document.body);
}
function stopObserver() { obs?.disconnect(); obs = null; }
