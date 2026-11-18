import { random } from './util.js';
// Nomes de pessoas por cultura, escolhidos pelo país (de jure) da capital ou da província.
const P = (first, last) => ({ first: first.split(' '), last: last.split(' ') });
export const POOLS = {
  pt_br: P('João Ana Pedro Mariana Lucas Juliana Rafael Camila Bruno Larissa Thiago Fernanda Gustavo Beatriz Rodrigo Patrícia', 'Silva Santos Oliveira Souza Lima Pereira Carvalho Ferreira Almeida Ribeiro Gomes Martins Rocha Barbosa Cardoso Teixeira'),
  pt: P('João Inês Miguel Beatriz Tiago Sofia Duarte Leonor Rui Matilde Afonso Catarina Nuno Marta Gonçalo Teresa', 'Costa Ferreira Rodrigues Martins Sousa Pereira Fernandes Gonçalves Lopes Marques Pinto Correia Mendes Nunes Moreira Vieira'),
  es: P('Carlos María José Lucía Javier Carmen Diego Isabel Alejandro Valentina Andrés Paula Fernando Gabriela Ricardo Elena', 'García Rodríguez Martínez López González Pérez Sánchez Ramírez Torres Flores Rivera Gómez Díaz Morales Herrera Castillo'),
  fr: P('Jean Marie Pierre Claire Louis Camille Antoine Juliette Nicolas Élise Philippe Margaux Julien Sophie Mathieu Hélène', 'Martin Bernard Dubois Thomas Robert Richard Petit Durand Leroy Moreau Simon Laurent Lefebvre Michel Garnier Fontaine'),
  it: P('Marco Giulia Luca Francesca Alessandro Chiara Matteo Elena Giovanni Sara Lorenzo Martina Andrea Valentina Stefano Paola', 'Rossi Russo Ferrari Esposito Bianchi Romano Colombo Ricci Marino Greco Bruno Gallo Conti De Luca Costa Mancini'),
  de: P('Lukas Anna Maximilian Lena Jonas Sophie Felix Marie Paul Hannah Leon Laura Tobias Julia Stefan Katrin', 'Müller Schmidt Schneider Fischer Weber Meyer Wagner Becker Schulz Hoffmann Koch Richter Klein Wolf Neumann Braun'),
  nl: P('Daan Emma Sem Julia Lucas Sophie Bram Tess Thijs Lotte Ruben Anouk Jesse Fleur Lars Sanne', 'de Jong Jansen de Vries van den Berg van Dijk Bakker Visser Smit Meijer de Boer Mulder de Groot Bos Vos Peters Hendriks'),
  nordic: P('Erik Ingrid Lars Astrid Johan Sigrid Magnus Freja Olav Karin Nils Elin Henrik Maja Sven Linnea', 'Andersson Johansson Larsen Hansen Nilsson Olsen Eriksson Pedersen Karlsson Nielsen Lindqvist Berg Holm Dahl Lund Strand'),
  fi: P('Mikko Aino Juha Elina Antti Laura Ville Sanna Jari Hanna Timo Kaisa Pekka Riikka Matti Liisa', 'Korhonen Virtanen Mäkinen Nieminen Mäkelä Hämäläinen Laine Heikkinen Koskinen Järvinen Lehtonen Saarinen Salminen Tamm Kask Rebane'),
  en: P('James Mary John Sarah Michael Emily David Olivia Robert Grace William Hannah Thomas Charlotte Daniel Jessica', 'Smith Johnson Williams Brown Jones Miller Davis Wilson Taylor Clarke Walker Wright Hughes Edwards Harris Bennett'),
  pl: P('Piotr Anna Krzysztof Katarzyna Tomasz Małgorzata Paweł Agnieszka Michał Magdalena Marcin Joanna Jakub Zofia Andrzej Ewa', 'Nowak Kowalski Wiśniewski Wójcik Kowalczyk Kamiński Lewandowski Zieliński Szymański Woźniak Dąbrowski Kozłowski Jankowski Mazur Kwiatkowski Krawczyk'),
  cz: P('Jan Tereza Petr Lucie Martin Kateřina Tomáš Veronika Jakub Barbora Lukáš Eva Ondřej Zuzana Marek Jana', 'Novák Svoboda Novotný Dvořák Černý Procházka Kučera Veselý Horák Němec Pokorný Marek Kováč Horváth Varga Tóth'),
  ru: P('Aleksandr Olga Dmitri Natalia Sergei Yelena Andrei Tatiana Mikhail Irina Ivan Svetlana Nikolai Anastasia Vladimir Yulia', 'Ivanov Smirnov Kuznetsov Popov Vasiliev Petrov Sokolov Mikhailov Novikov Fedorov Morozov Volkov Alekseev Lebedev Orlov Pavlov'),
  uk: P('Oleksandr Oksana Andriy Olena Taras Iryna Mykola Nataliya Serhiy Yulia Bohdan Kateryna Yuriy Halyna Vasyl Svitlana', 'Shevchenko Kovalenko Bondarenko Tkachenko Kravchenko Melnyk Boyko Kovalchuk Oliynyk Lysenko Marchenko Savchenko Rudenko Moroz Hnatyuk Pavlenko'),
  yu: P('Marko Ana Nikola Jelena Stefan Milica Luka Ivana Dragan Maja Milan Tamara Nemanja Sanja Goran Vesna', 'Jovanović Petrović Nikolić Marković Đorđević Stojanović Ilić Horvat Kovačević Babić Popović Hodžić Begić Delić Kralj Pavlović'),
  sq: P('Arben Elira Besnik Mimoza Dritan Arta Gentian Teuta Ilir Blerta Fatmir Vjosa Luan Era Agron Drita', 'Hoxha Krasniqi Berisha Gashi Shala Kelmendi Leka Basha Dervishi Rama Morina Thaçi Bytyqi Hasani Kola Dushku'),
  bg: P('Georgi Maria Ivan Elena Dimitar Yordanka Petar Desislava Nikolay Teodora Stoyan Radka Hristo Milena Todor Svetla', 'Ivanov Georgiev Dimitrov Petrov Nikolov Hristov Stoyanov Todorov Iliev Vasilev Atanasov Angelov Kolev Yordanov Marinov Popov'),
  ro: P('Andrei Ioana Mihai Elena Alexandru Maria Cristian Ana Ion Gabriela Bogdan Raluca Vlad Irina Radu Monica', 'Popescu Ionescu Popa Dumitru Stoica Stan Gheorghe Rusu Munteanu Matei Constantin Ciobanu Moldovan Lupu Ungureanu Ceban'),
  hu: P('László Mária István Erzsébet József Katalin Zoltán Éva Gábor Anna Péter Zsófia Tamás Judit Attila Ildikó', 'Nagy Kovács Tóth Szabó Horváth Varga Kiss Molnár Németh Farkas Balogh Papp Takács Juhász Lakatos Mészáros'),
  el: P('Giorgos Maria Dimitris Eleni Nikos Katerina Kostas Sofia Yannis Anna Christos Ioanna Panagiotis Despina Andreas Vasiliki', 'Papadopoulos Pappas Georgiou Nikolaidis Vlachos Konstantinou Dimitriou Oikonomou Karagiannis Makris Papadakis Christodoulou Michailidis Antoniou Theodorou Ioannou'),
  tr: P('Mehmet Ayşe Mustafa Fatma Ahmet Zeynep Ali Elif Hüseyin Emine Murat Hatice Emre Merve Burak Selin', 'Yılmaz Kaya Demir Şahin Çelik Yıldız Yıldırım Öztürk Aydın Özdemir Arslan Doğan Kılıç Aslan Kurt Koç'),
  cau: P('Giorgi Nino Levan Tamar Davit Ana Armen Ani Tigran Mariam Ilham Leyla Rashad Aynur Vugar Narine', 'Beridze Kapanadze Gelashvili Lomidze Hovhannisyan Grigoryan Sargsyan Petrosyan Mammadov Aliyev Hasanov Huseynov Babayan Mikheladze Abashidze Ismayilov'),
  ca: P('Nursultan Aigerim Timur Dilnoza Rustam Gulnara Azamat Madina Bakhtiyar Zarina Erlan Saule Farrukh Aziza Dauren Malika', 'Nazarbayev Tokayev Karimov Abdullaev Rakhimov Sultanov Bekov Usmanov Akhmetov Sadykov Nurmagambetov Juraev Kasymov Ismoilov Toktogulov Omarov'),
  ar: P('Mohammed Fatima Ahmed Aisha Omar Mariam Khalid Layla Youssef Nour Hassan Salma Tariq Huda Karim Rania', 'Al-Hashimi Haddad Khalil Mansour Nasser Saleh Hamdan Darwish Qasim Al-Masri Farouk Habib Aziz Barakat Suleiman Rahman'),
  fa: P('Ali Zahra Reza Maryam Hossein Fatemeh Mohsen Leila Amir Shirin Mehdi Nasrin Farhad Parisa Hamid Azadeh', 'Hosseini Mohammadi Rezaei Ahmadi Karimi Moradi Jafari Rahimi Mousavi Tehrani Kazemi Sadeghi Najafi Ghorbani Abbasi Farahani'),
  he: P('David Sarah Yosef Rivka Avraham Miriam Moshe Tamar Daniel Noa Itai Yael Eitan Shira Amit Maya', 'Cohen Levi Mizrahi Peretz Biton Friedman Katz Azoulay Shapiro Ben-David Goldberg Avraham Dahan Rosen Malka Gabay'),
  hi: P('Rahul Priya Amit Anjali Vikram Kavya Arjun Deepika Sanjay Meera Rohan Pooja Suresh Lakshmi Anil Sunita', 'Sharma Verma Patel Gupta Singh Kumar Reddy Iyer Nair Mehta Joshi Rao Chopra Malhotra Thapa Banerjee'),
  bn: P('Rahim Fatema Karim Nasrin Abdul Shirin Hasan Rokeya Jamal Taslima Faruk Sharmin Monir Ruma Sohel Nadia', 'Hossain Rahman Islam Ahmed Chowdhury Khan Begum Akter Sarkar Miah Talukder Uddin Bhuiyan Siddique Haque Mondal'),
  ur: P('Imran Ayesha Bilal Sana Usman Hina Zain Nadia Faisal Saima Asad Rabia Hamza Mehwish Kamran Farah', 'Khan Malik Qureshi Chaudhry Butt Sheikh Hussain Raza Mirza Shah Abbasi Siddiqui Awan Baig Javed Bhatti'),
  zh: P('Wei Fang Jun Li Ming Xiu Hao Jing Lei Mei Tao Yan Qiang Ling Bo Hui', 'Wang Li Zhang Liu Chen Yang Huang Zhao Wu Zhou Xu Sun Ma Zhu Hu Lin'),
  ja: P('Hiroshi Yuki Takeshi Aiko Kenji Sakura Daiki Haruka Shota Misaki Ryo Nanami Kazuki Emi Yuto Rina', 'Sato Suzuki Takahashi Tanaka Watanabe Ito Yamamoto Nakamura Kobayashi Kato Yoshida Yamada Sasaki Yamaguchi Matsumoto Inoue'),
  ko: P('Min-jun Seo-yeon Ji-hoon Ha-eun Hyun-woo Ji-woo Joon-ho Soo-ah Dong-hyun Yu-na Sung-min Eun-ji Tae-yang Da-eun Jae-won Hye-jin', 'Kim Lee Park Choi Jung Kang Cho Yoon Jang Lim Han Oh Seo Shin Kwon Hwang'),
  vi: P('Minh Lan Hùng Hương Tuấn Mai Dũng Linh Quang Thảo Hải Ngọc Long Trang Sơn Hà', 'Nguyễn Trần Lê Phạm Hoàng Huỳnh Phan Vũ Võ Đặng Bùi Đỗ Hồ Ngô Dương Lý'),
  th: P('Somchai Malee Anan Siriporn Prasert Nanthana Kittisak Wanida Chaiyot Pornthip Sombat Ratana Thanawat Kanya Surasak Duangjai', 'Saetang Srisuk Thongchai Wongsawat Chaiyaporn Boonmee Rattanakorn Phromma Suksawat Khamphoui Sok Chan Phommachanh Vong Keo Chea'),
  ms: P('Ahmad Siti Muhammad Nurul Budi Dewi Agus Sri Hafiz Aisyah Rizal Putri Faisal Indah Hendra Wati', 'Abdullah Rahman Hidayat Santoso Wijaya Saputra Ibrahim Hassan Ismail Kurniawan Setiawan Halim Pratama Harahap Lubis Siregar'),
  fil: P('Jose Maria Juan Ana Mark Kristine Paolo Angelica Miguel Joy Ramon Grace Carlo Liza Antonio Mae', 'Santos Reyes Cruz Bautista Ocampo Garcia Mendoza Torres Villanueva Ramos Aquino Castillo Navarro Dela Cruz Fernandez Gonzales'),
  af_e: P('Juma Amina Baraka Neema Kamau Wanjiru Otieno Akinyi Musa Zawadi Mwangi Halima Kipchoge Imani Okello Rehema', 'Kamau Otieno Mwangi Odhiambo Njoroge Kariuki Ochieng Wanjala Mugisha Habimana Nkurunziza Museveni Mutua Kiplagat Lokwang Deng'),
  af_w: P('Kwame Ama Chinedu Ngozi Oluwaseun Aisha Moussa Fatoumata Ibrahim Aminata Kofi Adwoa Emeka Chiamaka Boubacar Mariama', 'Okafor Adeyemi Mensah Diallo Traoré Coulibaly Keita Ouédraogo Diop Ndiaye Boateng Nwosu Bello Koné Sow Camara'),
  af_s: P('Sipho Thandiwe Themba Nomvula Tendai Chipo Mandla Lerato Kagiso Naledi Tafadzwa Rudo Bongani Zanele Mpho Precious', 'Dlamini Nkosi Ndlovu Moyo Khumalo Mokoena Sithole Mahlangu Banda Phiri Mutasa Chikwanha Molefe Zulu Mabaso Shikongo'),
  et: P('Abebe Almaz Tesfaye Meron Dawit Hiwot Yonas Selam Getachew Tigist Mekonnen Bethlehem Haile Mahlet Kebede Senait', 'Bekele Tadesse Girma Alemu Haile Tesfaye Mekonnen Wolde Gebre Kebede Abera Desta Hagos Tekle Berhe Asfaw'),
  so: P('Abdi Hodan Mohamed Fadumo Ahmed Sahra Hassan Ifrah Yusuf Hamdi Abdirahman Ayaan Farah Nasra Ali Hawa', 'Abdi Warsame Farah Jama Hersi Mohamud Osman Ismail Egal Duale Adan Nur Gedi Aden Yusuf Hassan'),
  bal: P('Jonas Rūta Mindaugas Laura Andris Ilze Tomas Inga Jānis Kristina Darius Līga Vytautas Agnė Mārtiņš Eglė', 'Kazlauskas Petrauskas Jankauskas Bērziņš Kalniņš Ozoliņš Stankevičius Vasiliauskas Liepiņš Krūmiņš Žukauskas Balodis Paulauskas Zariņš Butkus Vītols'),
  mn: P('Bat-Erdene Oyunchimeg Ganbaatar Altantsetseg Tömör Enkhjargal Bold Sarangerel Batbayar Nomin Dorj Tsetseg Sükh Oyun Erdene Narantuya', 'Batbold Ganbold Enkhbayar Altankhuyag Tsogt Bayar Purev Dashdorj Gantulga Munkh Sukhbaatar Chuluun Davaa Erdenebat Ochir Zorig'),
  pac: P('Josefa Mere Sione Ana Tevita Losana Kalani Leilani Manu Talia Ratu Litia Pita Mele Semisi Lupe', 'Ratu Tuilagi Fifita Tupou Vunipola Matagi Rabuka Bainimarama Taufa Leota Faleolo Seru Kaufusi Toala Sopoaga Natano'),
};
const MAP = {
  pt_br: 'BRA', pt: 'PRT AGO MOZ CPV GNB STP TLS', es: 'ESP MEX ARG COL PER VEN CHL ECU BOL PRY URY CUB DOM GTM HND SLV NIC CRI PAN GNQ SAH',
  fr: 'FRA BEL LUX MCO HTI', it: 'ITA SMR VAT', de: 'DEU AUT CHE LIE', nl: 'NLD SUR ABW CUW SXM', nordic: 'SWE NOR DNK ISL GRL FRO ALD', fi: 'FIN EST',
  en: 'USA GBR CAN AUS NZL IRL JAM BHS BRB TTO GUY BLZ ATG DMA GRD KNA LCA VCT MLT IMN JEY GGY', pl: 'POL', cz: 'CZE SVK', ru: 'RUS BLR', uk: 'UKR',
  yu: 'SRB HRV BIH MNE MKD SVN', sq: 'ALB KOS', bg: 'BGR', ro: 'ROU MDA', hu: 'HUN', el: 'GRC CYP', tr: 'TUR CYN', cau: 'ARM GEO AZE', ca: 'KAZ UZB KGZ TKM',
  ar: 'SAU ARE QAT KWT BHR OMN YEM IRQ SYR JOR LBN PSX EGY LBY TUN DZA MAR MRT SDN', fa: 'IRN AFG TJK', he: 'ISR', hi: 'IND NPL BTN LKA MDV', bn: 'BGD', ur: 'PAK',
  zh: 'CHN TWN HKG MAC SGP', ja: 'JPN', ko: 'KOR PRK', vi: 'VNM', th: 'THA LAO KHM MMR', ms: 'IDN MYS BRN', fil: 'PHL', af_e: 'KEN TZA UGA RWA BDI SDS MWI',
  af_w: 'NGA GHA LBR SLE GMB SEN CIV MLI BFA NER TCD CMR GAB COG COD CAF BEN TGO GIN MDG DJI COM', af_s: 'ZAF ZWE ZMB BWA NAM LSO SWZ', et: 'ETH ERI', so: 'SOM SOL',
  bal: 'LTU LVA', mn: 'MNG', pac: 'PNG FJI SLB VUT WSM TON KIR TUV NRU FSM MHL PLW',
};
const BY = {};
for (const c in MAP) for (const id of MAP[c].split(' ')) BY[id] = c;
const BY_REGION = { europe: 'en', eastern_europe: 'ru', balkans: 'yu', caucasus: 'cau', central_asia: 'ca', east_asia: 'zh', southeast_asia: 'ms', south_asia: 'hi', middle_east: 'ar', north_africa: 'ar', sub_saharan_africa: 'af_w', north_america: 'en', central_america: 'es', caribbean: 'en', south_america: 'es', oceania: 'pac' };

export function cultureOf(data, id) {
  if (BY[id]) return BY[id];
  const e = data.reg?.[id];
  if (e?.culture) return e.culture;
  if (e?.origin && BY[e.origin]) return BY[e.origin];
  if (e?.parent && BY[e.parent]) return BY[e.parent];
  return BY_REGION[e?.regions?.[0]] || 'en';
}
export function personName(culture, rnd = random) {
  const p = POOLS[culture] || POOLS.en;
  return `${p.first[Math.floor(rnd() * p.first.length)]} ${p.last[Math.floor(rnd() * p.last.length)]}`;
}
// Gênero pelos nomes: nas listas, os nomes de posição ímpar são femininos.
const FEM = new Set(), MASC = new Set();
for (const p of Object.values(POOLS)) p.first.forEach((n, i) => (i % 2 ? FEM : MASC).add(n));
export const isFemaleName = full => { const f = String(full || '').trim().split(/\s+/)[0]; return FEM.has(f) && !MASC.has(f); };
// Nome de líder: reduz bastante a chance de uma mulher (80% dos sorteios femininos viram masculinos).
export function leaderName(culture, rnd = random) {
  const p = POOLS[culture] || POOLS.en; let i = Math.floor(rnd() * p.first.length);
  if (i % 2 === 1 && rnd() < 0.8) i -= 1;
  return p.first[i] + ' ' + p.last[Math.floor(rnd() * p.last.length)];
}
// Título no feminino quando a líder é mulher: Rainha, Imperatriz, Primeira-ministra...
const TITLE_F = { 'Rei': 'Rainha', 'Imperador': 'Imperatriz', 'Príncipe': 'Princesa', 'Sultão': 'Sultana', 'Czar': 'Czarina', 'Grão-duque': 'Grã-duquesa', 'Primeiro-ministro': 'Primeira-ministra', 'Líder Supremo': 'Líder Suprema', 'Emir': 'Emira' };
export function genderize(leader) {
  const s = String(leader || ''); const m = s.match(/^(Líder Supremo|Primeiro-ministro|Grão-duque|[A-Za-zÀ-ÿ]+)\s+(.+)$/);
  if (!m || !TITLE_F[m[1]] || !isFemaleName(m[2])) return s;
  return TITLE_F[m[1]] + ' ' + m[2];
}
export const nameFor = (data, id) => personName(cultureOf(data, id));
// Cultura da nação do jogador: país-base da capital.
export const playerCulture = (s, data) => cultureOf(data, data.geo.cOf?.[s.nation.capitalProv] || data.geo.prov[s.nation.capitalProv]?.a3);
