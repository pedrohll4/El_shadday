// Initial Buffet Data for El Shadday Serviços de Buffet
// Follows strictly the client prompt & reference image specifications

export const INITIAL_BUFFET_COMPANY = {
  name: "El Shadday Serviços de Buffet",
  shortName: "El Shadday",
  tagline: "Seu evento merece uma experiência inesquecível.",
  subtitle: "Buffet personalizado para casamentos, formaturas, aniversários e eventos corporativos.",
  experienceYears: "Mais de 15 anos",
  phone: "5569992228682",
  phoneDisplay: "(69) 99222-8682",
  instagram: "@elshadday_buffet",
  instagramUrl: "https://instagram.com",
  city: "Ariquemes - RO",
  address: "Rua Maceió, 2333 - Setor 03, Ariquemes - RO",
  logoUrl: "https://assets.olaclick.app/companies/logos/67bb7c61-2505-4b36-a16c-6a4979bb3651.png",
  bannerUrl: "https://assets.olaclick.app/companies/backgrounds/dfd052f1-d436-49bb-a996-f2f05ce0d456.webp",
  aboutText: `O El Shadday Serviços de Buffet nasceu para transformar momentos especiais em experiências inesquecíveis. Trabalhamos com dedicação, qualidade e cuidado em cada detalhe, oferecendo soluções completas para diferentes tipos de eventos. Nossa missão é proporcionar momentos gastronômicos memoráveis com atendimento de excelência.`,
  differentials: [
    { title: "Garçons Treinados", desc: "Equipe uniformizada, atenciosa e ágil do início ao fim." },
    { title: "Prataria & Rechauds", desc: "Prataria nobre e rechauds térmicos para manter tudo aquecido." },
    { title: "Taças de Cristal", desc: "Taças finas para todas as bebidas do seu evento." },
    { title: "Talheres Completos", desc: "Linha de talheres elegantes e higienizados." },
    { title: "Pontualidade Rigorosa", desc: "Montagem antecipada e estrutura pronta no horário combinado." },
    { title: "Ingredientes Selecionados", desc: "Carnes nobres, temperos artesanais e frescor absoluto." }
  ],
  bannerIncluso: "JÁ INCLUSO GARÇONS, PRATARIA, TAÇAS, RECHAUDS E TALHERES"
};

export const INITIAL_EVENT_TYPES = [
  "Casamento",
  "Aniversário",
  "Formatura",
  "Confraternização",
  "Evento Corporativo",
  "Festa Particular",
  "Bodas",
  "Outro"
];

// Espaço reservado para as fotos oficiais do Buffet El Shadday.
// Basta substituir as URLs abaixo pelas fotos que o cliente enviar!
export const RESERVED_BUFFET_PHOTOS = [
  {
    id: "rechauds",
    title: "Mesa de Pratos Quentes & Rechauds",
    subtitle: "Estrutura térmica que mantém a temperatura perfeita do início ao fim",
    tag: "Rechauds & Buffet",
    url: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop&q=80",
    isReservedPlaceholder: true
  },
  {
    id: "prataria",
    title: "Prataria Nobre, Taças & Talheres",
    subtitle: "Mesa posta sofisticada com taças finas e talheres de alto padrão inclusos",
    tag: "Louças & Cristais",
    url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&auto=format&fit=crop&q=80",
    isReservedPlaceholder: true
  },
  {
    id: "entradas",
    title: "Entradas & Salgadinhos Variados",
    subtitle: "Coxinhas, quibes, risoles e petiscos finos servidos quentinhos",
    tag: "Entradas & Petiscos",
    url: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop&q=80",
    isReservedPlaceholder: true
  },
  {
    id: "churrasco",
    title: "Churrasco & Carnes Nobres",
    subtitle: "Cortes bovinos, toscana suculenta e frango dourados no ponto ideal",
    tag: "Carnes & Assados",
    url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
    isReservedPlaceholder: true
  },
  {
    id: "garcons",
    title: "Equipe de Garçons Uniformizada",
    subtitle: "Profissionais experientes, atenciosos e ágeis no atendimento",
    tag: "Serviço de Salão",
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
    isReservedPlaceholder: true
  },
  {
    id: "sobremesas",
    title: "Mousses de Cupuaçu & Maracujá",
    subtitle: "Sobremesas aeradas e refinadas preparadas artesanalmente",
    tag: "Sobremesas",
    url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80",
    isReservedPlaceholder: true
  }
];

export const INITIAL_BUFFET_CATEGORIES = [
  {
    id: "acompanhamentos",
    name: "Acompanhamentos",
    description: "Guarnições aromáticas, farofas caseiras, massas nobres e saladas frescas",
    icon: "Salad",
    badge: "10 Opções",
    items: [
      { id: "acomp_salada_tropical", name: "Salada Verde Tropical", desc: "Mix de folhas nobres, frutas da estação e molho agridoce suave", active: true },
      { id: "acomp_batatas_rusticas", name: "Batatas Rústicas Assadas", desc: "Batatas douradas ao forno com azeite de oliva e alecrim fresco", active: true },
      { id: "acomp_arroz_grega", name: "Arroz branco e Arroz a Grega", desc: "Dupla tradicional soltinha com legumes selecionados", active: true },
      { id: "acomp_farofa_banana", name: "Farofa de Banana da terra", desc: "Farofa crocante dourada na manteiga com pedacinhos de banana da terra", active: true },
      { id: "acomp_farofa_tropeira", name: "Farofa Tropeira", desc: "Farofa tropeira com pedacinhos de bacon, calabresa e temperos caseiros", active: true },
      { id: "acomp_macarrao_alho", name: "Macarrão Alho e Oleo", desc: "Massa al dente salteada em azeite extravirgem e alho dourado crocante", active: true },
      { id: "acomp_macarrao_branco", name: "Macarrão ao Molho Branco", desc: "Massa nobre envolvida em molho bechamel cremoso e queijo", active: true },
      { id: "acomp_creme_milho", name: "Creme de milho", desc: "Creme aveludado preparado com milho verde fresco e toque suave de queijo", active: true },
      { id: "acomp_salada_vinagrete", name: "Salada de Vinagrete", desc: "Cubos de tomate, cebola e pimentão marinados em azeite extravirgem", active: true },
      { id: "acomp_macarrao_bolonhesa", name: "Macarrão a Bolonhesa", desc: "Massa ao sugo artesanal com carne moída de primeira selecionada", active: true }
    ]
  },
  {
    id: "prato_principal",
    name: "Prato Principal & Assados",
    description: "Cortes bovinos, suínos e aves com molhos refinados e churrasco na brasa",
    icon: "UtensilsCrossed",
    badge: "Carnes & Assados",
    items: [
      { id: "pp_peito_branco", name: "Filé de Peito ao molho Branco", desc: "Filés macios de peito grelhados com molho branco aveludado e queijo", active: true },
      { id: "pp_carne_madeira", name: "Carne ao Molho Madeira", desc: "Iscas de carne nobre com molho madeira encorpado e champignon", active: true },
      { id: "pp_coxa_recheada", name: "Coxa/Sobre coxa desossada e recheada", desc: "Cortes desossados e recheados com queijo, bacon e ervas finas", active: true },
      { id: "pp_strogonoff_frango", name: "Strogonoff de Frango", desc: "Clássico strogonoff cremoso com cogumelos frescos da estação", active: true },
      { id: "pp_strogonoff_carne", name: "Strogonoff de Carne", desc: "Filé em tiras com creme aveludado de especiarias e cogumelos", active: true },
      { id: "pp_porco_frito", name: "Porco Frito", desc: "Pedaços suínos temperados e fritos no ponto perfeito crocante", active: true },
      { id: "pp_churrasco_assados", name: "Churrasco de: ( Carne, toscana e Frango)", desc: "Assados na brasa com corte bovino, toscana artesanal e frango dourado", isAssado: true, badge: "Assados", active: true }
    ]
  },
  {
    id: "sobremesas",
    name: "Sobremesa",
    description: "Mousses artesanais aerados para adoçar sua festa com requinte",
    icon: "Cake",
    badge: "Doces Finos",
    items: [
      { id: "sob_cupuacu", name: "Mousse de cupuaçu", desc: "Mousse artesanal cremoso e aerado com calda da fruta fresca", active: true },
      { id: "sob_maracuja", name: "Mousse de Maracuja", desc: "Mousse suave e levemente cítrico com sementes e calda natural", active: true }
    ]
  },
  {
    id: "entradas",
    name: "Entrada",
    description: "Recepção com salgadinhos dourados e petiscos especiais",
    icon: "ConciergeBell",
    badge: "Boas-Vindas",
    items: [
      { id: "ent_salgadinhos", name: "Salgadinhos Variados", desc: "Coxinhas, quibes, risoles e empadas servidos quentinhos", active: true },
      { id: "ent_petiscos", name: "Petiscos Variados", desc: "Canapés finos, tábua de frios e finger foods selecionados", active: true }
    ]
  },
  {
    id: "bebidas",
    name: "Bebidas",
    description: "Linha de refrigerantes, água mineral e sucos naturais servidos gelados",
    icon: "Wine",
    badge: "Bebidas",
    items: [
      { id: "beb_regional", name: "Refrigerante Regional + Agua mineral e Suco natural", desc: "Refrigerante regional gelado, água mineral (com e sem gás) e suco natural", active: true },
      { id: "beb_original", name: "Refrigerante Original + Agua mineral e Suco natural", desc: "Refrigerantes de marca original de primeira linha, água mineral e suco natural", active: true }
    ]
  }
];

// Helper to get company settings with localStorage persistence
export function getStoredBuffetCompany() {
  try {
    const saved = localStorage.getItem("el_shadday_buffet_company_v4");
    if (saved) {
      return { ...INITIAL_BUFFET_COMPANY, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Error reading stored company data:", e);
  }
  return INITIAL_BUFFET_COMPANY;
}

export function saveStoredBuffetCompany(company) {
  try {
    localStorage.setItem("el_shadday_buffet_company_v4", JSON.stringify(company));
  } catch (e) {
    console.error("Error saving company data:", e);
  }
}

// Helper to get buffet categories & items with localStorage persistence
export function getStoredBuffetCategories() {
  try {
    const saved = localStorage.getItem("el_shadday_buffet_categories_v4");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading stored buffet categories:", e);
  }
  return INITIAL_BUFFET_CATEGORIES;
}

export function saveStoredBuffetCategories(categories) {
  try {
    localStorage.setItem("el_shadday_buffet_categories_v4", JSON.stringify(categories));
  } catch (e) {
    console.error("Error saving buffet categories:", e);
  }
}

// Helper to get event types with persistence
export function getStoredEventTypes() {
  try {
    const saved = localStorage.getItem("el_shadday_buffet_event_types");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading stored event types:", e);
  }
  return INITIAL_EVENT_TYPES;
}

export function saveStoredEventTypes(eventTypes) {
  try {
    localStorage.setItem("el_shadday_buffet_event_types", JSON.stringify(eventTypes));
  } catch (e) {
    console.error("Error saving event types:", e);
  }
}

// Helper to store submitted quote requests for the admin to view
export function getStoredQuoteHistory() {
  try {
    const saved = localStorage.getItem("el_shadday_buffet_quotes");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error reading stored quote history:", e);
  }
  return [];
}

export function saveQuoteToHistory(quote) {
  try {
    const history = getStoredQuoteHistory();
    const updated = [quote, ...history];
    localStorage.setItem("el_shadday_buffet_quotes", JSON.stringify(updated.slice(0, 100)));
  } catch (e) {
    console.error("Error saving quote to history:", e);
  }
}
