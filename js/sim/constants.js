export const REGIONS = {
  north_america: { name: 'América do Norte', climate: 'Temperado/frio', coast: true, res: { food: 1.25, energy: 1.2, raw: 1.15 }, trade: 1.15, threat: 0.5, power: 'usa', orgs: ['pad', 'atp'], neighbors: ['Nova Acádia', 'Columbária', 'Lakeland'] },
  central_america: { name: 'América Central e Caribe', climate: 'Tropical', coast: true, res: { food: 1.1, energy: 0.8, raw: 0.9 }, trade: 1.05, threat: 0.8, power: 'usa', orgs: ['mca'], neighbors: ['Costa Morena', 'San Lázaro', 'Islas Verdes'] },
  south_america: { name: 'América do Sul', climate: 'Tropical/temperado', coast: true, res: { food: 1.35, energy: 1.0, raw: 1.25 }, trade: 0.95, threat: 0.6, power: 'brazil', orgs: ['mca'], neighbors: ['Andéria', 'Rio Plateado', 'Guaiará'] },
  europe: { name: 'Europa', climate: 'Temperado', coast: true, res: { food: 1.0, energy: 0.7, raw: 0.8 }, trade: 1.3, threat: 0.5, power: 'germany', orgs: ['uc', 'pad'], neighbors: ['Vestmark', 'Carpátia', 'Lusória'] },
  north_asia: { name: 'Eurásia Setentrional', climate: 'Frio continental', coast: false, res: { food: 0.8, energy: 1.5, raw: 1.4 }, trade: 0.8, threat: 1.1, power: 'russia', orgs: ['ase'], neighbors: ['Volgária', 'Sibéria Livre', 'Tunguska'] },
  central_asia: { name: 'Ásia Central', climate: 'Árido continental', coast: false, res: { food: 0.75, energy: 1.35, raw: 1.2 }, trade: 0.75, threat: 1.15, power: 'russia', orgs: ['ase'], neighbors: ['Turanistão', 'Kazari', 'Alay'] },
  middle_east: { name: 'Oriente Médio', climate: 'Desértico', coast: true, res: { food: 0.6, energy: 1.7, raw: 0.9 }, trade: 1.1, threat: 1.35, power: 'russia', orgs: [], neighbors: ['Qadira', 'Emirado de Sahl', 'Mesopotâmia Nova'] },
  africa: { name: 'África', climate: 'Tropical/árido', coast: true, res: { food: 0.9, energy: 1.15, raw: 1.45 }, trade: 0.85, threat: 1.2, power: 'china', orgs: [], neighbors: ['Ubanda', 'Sahelia', 'Costa do Marfim Novo'] },
  south_asia: { name: 'Sul da Ásia', climate: 'Monção', coast: true, res: { food: 1.0, energy: 0.8, raw: 1.0 }, trade: 1.05, threat: 1.0, power: 'india', orgs: [], neighbors: ['Gandharia', 'Bengala Oriental', 'Serendib'] },
  east_asia: { name: 'Leste Asiático', climate: 'Temperado/monção', coast: true, res: { food: 0.85, energy: 0.75, raw: 0.9 }, trade: 1.3, threat: 1.0, power: 'china', orgs: ['atp', 'ase'], neighbors: ['Goryeon', 'Manchúria', 'Formosa Livre'] },
  southeast_asia: { name: 'Sudeste Asiático', climate: 'Tropical', coast: true, res: { food: 1.2, energy: 1.0, raw: 1.1 }, trade: 1.25, threat: 0.85, power: 'china', orgs: ['atp'], neighbors: ['Malaya', 'Sião Novo', 'Ilhas Sunda'] },
  oceania: { name: 'Oceania', climate: 'Variado', coast: true, res: { food: 1.3, energy: 1.1, raw: 1.4 }, trade: 1.0, threat: 0.35, power: 'usa', orgs: ['atp', 'pad'], neighbors: ['Nova Tasmânia', 'Kiribasu', 'Arquipélago Coral'] },
};

export const SIZES = {
  small: { name: 'Pequeno', area: 40000, pop: 4, admin: 0.85, control: 8, market: -0.4, res: 0.8, sep: 0, power: 0.7 },
  medium: { name: 'Médio', area: 300000, pop: 18, admin: 1.0, control: 0, market: 0, res: 1.0, sep: 4, power: 1.0 },
  large: { name: 'Grande', area: 1300000, pop: 55, admin: 1.15, control: -6, market: 0.25, res: 1.2, sep: 10, power: 1.3 },
  continental: { name: 'Continental', area: 5000000, pop: 140, admin: 1.35, control: -14, market: 0.5, res: 1.45, sep: 18, power: 1.6 },
};

export const DEVELOPMENT = {
  low: { name: 'Baixo', gdppc: 2200, debt: 55, health: 32, education: 30, corruption: 62, efficiency: 30, infra: 25, industry: 25, tech: 12 },
  medium: { name: 'Médio', gdppc: 9000, debt: 50, health: 50, education: 50, corruption: 45, efficiency: 45, infra: 45, industry: 45, tech: 35 },
  high: { name: 'Alto', gdppc: 28000, debt: 65, health: 68, education: 68, corruption: 30, efficiency: 60, infra: 65, industry: 55, tech: 60 },
};

export const DIFFICULTY = {
  easy: { name: 'Fácil', treasury: 8, discr: 0.045, mood: 8, risk: 0.6 },
  normal: { name: 'Normal', treasury: 5, discr: 0.035, mood: 0, risk: 1.0 },
  hard: { name: 'Difícil', treasury: 2, discr: 0.022, mood: -8, risk: 1.4 },
};

export const GROUPS = {
  workers: { name: 'Trabalhadores', inf: 1.2, wants: 'Emprego, salários estáveis, assistência social e sindicatos.' },
  business: { name: 'Empresários', inf: 1.0, wants: 'Impostos baixos, crescimento, mercado aberto e ordem.' },
  military: { name: 'Militares', inf: 1.4, wants: 'Orçamento militar, prestígio, vitórias e respeito à hierarquia.' },
  bureaucracy: { name: 'Funcionalismo', inf: 0.8, wants: 'Verbas administrativas, estabilidade e algum espaço para privilégios.' },
  youth: { name: 'Jovens', inf: 0.8, wants: 'Liberdades, educação, empregos e nada de serviço militar.' },
  rural: { name: 'População rural', inf: 0.8, wants: 'Comida barata, apoio agrícola e inflação baixa.' },
  regional: { name: 'Elites regionais', inf: 0.8, wants: 'Autonomia, obras nas regiões e pouca fiscalização.' },
  opposition: { name: 'Oposição política', inf: 0.6, wants: 'Liberdade política e de imprensa; a sua queda.' },
};

export const SPEND = {
  health: { name: 'Saúde', def: 3.5 },
  education: { name: 'Educação', def: 3.5 },
  welfare: { name: 'Assistência social', def: 3.5 },
  security: { name: 'Polícia e justiça', def: 1.5 },
  military: { name: 'Defesa', def: 2 },
  admin: { name: 'Administração', def: 2.5 },
  infra: { name: 'Infraestrutura (manutenção)', def: 2 },
};

export const SECTORS = {
  food: { name: 'Alimentos', share: 0.08, cons: 0.06, perCap: 0.00035 },
  energy: { name: 'Energia', share: 0.06, cons: 0.06, perCap: 0.00025 },
  raw: { name: 'Matérias-primas', share: 0.07, cons: 0.07, perCap: 0 },
  industrial: { name: 'Bens industriais', share: 0.2, cons: 0.2, perCap: 0 },
  tech: { name: 'Tecnologia', share: 0.06, cons: 0.08, perCap: 0 },
  services: { name: 'Serviços', share: 0.53, cons: 0.53, perCap: 0 },
};

// [label, unit, tooltip, higherIsBetter]
export const STAT_INFO = {
  pop: ['População', 'mi', 'Habitantes, em milhões.', null],
  popGrowth: ['Crescimento populacional', '%/ano', 'Natalidade menos mortalidade mais migração líquida.', null],
  poverty: ['Pobreza', '%', 'Parcela da população abaixo da linha de pobreza. Depende da renda per capita, desigualdade, desemprego, inflação e assistência social.', false],
  hunger: ['Fome', '%', 'População em insegurança alimentar grave. Sobe com pobreza e escassez de alimentos.', false],
  unemployment: ['Desemprego', '%', 'Desempregados na força de trabalho. Cai com crescimento econômico e educação.', false],
  inequality: ['Desigualdade', '0-100', 'Índice de concentração de renda (tipo Gini). Sobe com corrupção e mercado desregulado; cai com assistência social.', false],
  health: ['Acesso à saúde', '0-100', 'Cobertura e qualidade do sistema de saúde. Afeta mortalidade e qualidade de vida.', true],
  education: ['Acesso à educação', '0-100', 'Escolaridade e qualidade do ensino. Eleva produtividade e reduz desemprego a longo prazo.', true],
  qol: ['Qualidade de vida', '0-100', 'Combina saúde, educação, pobreza, infraestrutura, poluição e fome.', true],
  satisfaction: ['Satisfação popular', '0-100', 'Média da satisfação dos grupos populares (trabalhadores, jovens, rurais, funcionalismo, oposição).', true],
  support: ['Apoio ao regime', '0-100', 'Satisfação de todos os grupos sociais ponderada pela influência de cada um.', true],
  protest: ['Protestos', '0-100', 'Intensidade de manifestações e greves. Repressão reduz o visível, mas acumula ressentimento.', false],
  migration: ['Migração líquida', '‰/ano', 'Imigrantes menos emigrantes por mil habitantes ao ano.', null],
  civil: ['Direitos civis', '0-100', 'Liberdades individuais: expressão, culto, privacidade e devido processo.', null],
  political: ['Liberdade política', '0-100', 'Pluralismo, imprensa e participação política. Eixo X do plano político.', null],
  gdp: ['PIB', 'bi', 'Produto Interno Bruto anual.', true],
  gdppc: ['PIB per capita', '', 'Renda média anual por habitante.', true],
  growth: ['Crescimento econômico', '%/ano', 'Variação anualizada do PIB. Depende de produtividade, estabilidade, corrupção, impostos, comércio, sanções e guerras.', true],
  inflation: ['Inflação', '%/ano', 'Alta dos preços. Sobe com déficit, emissão de moeda, escassez e superaquecimento.', false],
  debtRatio: ['Dívida pública', '% PIB', 'Estoque de dívida em relação ao PIB.', false],
  interestRate: ['Juros da dívida', '%/ano', 'Taxa média paga pelo governo. Sobe com dívida, inflação, má reputação e sanções.', false],
  productivity: ['Produtividade', '0-100', 'Eficiência produtiva da economia: educação, infraestrutura e tecnologia.', true],
  industry: ['Capacidade industrial', '0-100', 'Base manufatureira. Influencia exportações e indústria militar.', true],
  tech: ['Tecnologia', '0-100', 'Nível tecnológico e de inovação.', true],
  reserves: ['Reservas', 'bi', 'Reservas internacionais. Caem com déficit comercial; reservas baixas pressionam a inflação.', true],
  energyDep: ['Dependência energética', '%', 'Parte do consumo de energia coberta por importações.', false],
  foodDep: ['Dependência alimentar', '%', 'Parte do consumo de alimentos coberta por importações.', false],
  stability: ['Estabilidade política', '0-100', 'Combina legitimidade, controle territorial, protestos e cansaço de guerra.', true],
  legitimacy: ['Legitimidade', '0-100', 'Aceitação do direito do regime de governar.', true],
  corruption: ['Corrupção', '0-100', 'Desvio de recursos. Reduz arrecadação, eficiência das iniciativas e crescimento.', false],
  efficiency: ['Eficiência administrativa', '0-100', 'Capacidade da máquina pública de executar políticas.', true],
  taxCapacity: ['Capacidade de arrecadação', '0-100', 'Quanto dos impostos devidos é realmente cobrado.', true],
  control: ['Controle territorial', '0-100', 'Presença efetiva do Estado no território.', true],
  elites: ['Influência das elites', '0-100', 'Peso de empresários, militares e elites regionais nas decisões.', null],
  opposition: ['Força da oposição', '0-100', 'Capacidade de organização dos opositores.', false],
  coupRisk: ['Risco de golpe', '0-100', 'Sobe com militares e elites insatisfeitos e baixa legitimidade.', false],
  revoRisk: ['Risco de revolução', '0-100', 'Sobe com fome, pobreza, insatisfação e ressentimento contra a repressão.', false],
  troops: ['Efetivo militar', 'mil', 'Militares na ativa, em milhares.', null],
  readiness: ['Prontidão', '0-100', 'Preparação para combate imediato.', true],
  logistics: ['Logística', '0-100', 'Capacidade de abastecer tropas. Depende de infraestrutura.', true],
  equipment: ['Equipamentos', '0-100', 'Qualidade e quantidade de material bélico.', true],
  milIndustry: ['Indústria militar', '0-100', 'Produção nacional de armamentos.', true],
  intel: ['Inteligência', '0-100', 'Serviços de informação civis e militares. Ajuda contra golpes e na guerra.', true],
  defense: ['Defesa territorial', '0-100', 'Capacidade de resistir a uma invasão.', true],
  projection: ['Projeção externa', '0-100', 'Capacidade de operar fora das fronteiras.', true],
  warWeariness: ['Cansaço de guerra', '0-100', 'Desgaste da população com conflitos.', false],
  reputation: ['Reputação internacional', '0-100', 'Imagem do país. Afeta juros, acordos e sanções.', true],
  influence: ['Influência regional', '0-100', 'Peso econômico, militar e diplomático na região.', true],
  infra: ['Infraestrutura', '0-100', 'Média ponderada da infraestrutura das regiões.', true],
  pollution: ['Poluição', '0-100', 'Degradação ambiental. Reduz saúde e qualidade de vida.', false],
  market: ['Modelo econômico', '0-100', '0 = economia estatal planificada; 100 = livre mercado. Eixo Y do plano político.', null],
};
