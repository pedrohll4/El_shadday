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

export const INITIAL_BUFFET_CATEGORIES = [
  {
    id: "carnes",
    name: "Carnes",
    description: "Opções de carnes selecionadas preparadas no capricho",
    icon: "UtensilsCrossed",
    badge: "Principal",
    items: [
      { id: "carne_bovina", name: "Carne", desc: "Cortes bovinos nobres selecionados e suculentos", active: true },
      { id: "carne_frango", name: "Frango", desc: "Cortes de frango temperados com especiarias da casa", active: true },
      { id: "carne_toscana", name: "Toscana", desc: "Linguiça toscana artesanal grelhada no ponto ideal", active: true },
      { id: "carne_porco", name: "Porco", desc: "Carne suína nobre dourada, macia e saborosa", active: true }
    ]
  },
  {
    id: "churrasco",
    name: "Churrasco",
    description: "Assados na brasa com cortes nobres e complementos tradicionais",
    icon: "Flame",
    badge: "Assados",
    items: [
      { id: "churr_carne", name: "Carne", desc: "Churrasco de corte bovino assado na brasa", active: true },
      { id: "churr_frango", name: "Frango", desc: "Churrasco de frango marinado e dourado", active: true },
      { id: "churr_toscana", name: "Toscana", desc: "Toscana especial assada na brasa", active: true },
      { id: "churr_porco", name: "Porco", desc: "Carne de porco selecionada e assada com crosta dourada", active: true },
      { id: "churr_pao_alho", name: "Pão de alho", desc: "Pão de alho crocante recheado com creme especial e queijo", active: true }
    ]
  },
  {
    id: "pratos_especiais",
    name: "Pratos Especiais",
    description: "Preparações refinadas exclusivas do Buffet El Shadday",
    icon: "Sparkles",
    badge: "Destaque",
    items: [
      { id: "esp_moqueca", name: "Moqueca", desc: "Moqueca especial rica em temperos, dendê e leite de coco cremoso", active: true },
      { id: "esp_carne_madeira", name: "Carne ao Molho Madeira", desc: "Iscas nobres com molho madeira encorpado e champignon", active: true },
      { id: "esp_peito_branco", name: "Filé de Peito ao Molho Branco", desc: "Filés macios cobertos com molho branco aveludado e queijo", active: true },
      { id: "esp_coxa_recheada", name: "Coxa / Sobrecoxa Recheada", desc: "Desossada e recheada com queijo, bacon e ervas finas", active: true },
      { id: "esp_strogonoff_frango", name: "Strogonoff de Frango", desc: "Clássico strogonoff cremoso com cogumelos frescos", active: true },
      { id: "esp_strogonoff_carne", name: "Strogonoff de Carne", desc: "Filé em tiras com creme aveludado de especiarias", active: true },
      { id: "esp_porco_frito", name: "Porco Frito Crocante", desc: "Pedaços suínos temperados e fritos no ponto pururuca", active: true }
    ]
  },
  {
    id: "acompanhamentos",
    name: "Acompanhamentos",
    description: "Guarnições aromáticas, farofas caseiras e saladas frescas",
    icon: "Salad",
    badge: "Guarnições",
    items: [
      { id: "acomp_vatapa", name: "Vatapá", desc: "Vatapá tradicional cremoso, aromático e com textura suave", active: true },
      { id: "acomp_farofa_trad", name: "Farofa Tradicional", desc: "Farofa artesanal dourada na manteiga com ervas finas", active: true },
      { id: "acomp_farofa_tropeiro", name: "Farofa Tropeiro", desc: "Farofa tropeira com pedacinhos de bacon, calabresa e temperos", active: true },
      { id: "acomp_arroz_grega", name: "Arroz Branco e Arroz à Grega", desc: "Dupla tradicional soltinha com legumes selecionados", active: true },
      { id: "acomp_salada_tropical", name: "Salada Verde Tropical", desc: "Mix de folhas nobres, frutas da estação e molho agridoce", active: true },
      { id: "acomp_batatas_rusticas", name: "Batatas Rústicas Assadas", desc: "Batatas douradas ao forno com alecrim e azeite de oliva", active: true },
      { id: "acomp_creme_milho", name: "Creme de Milho", desc: "Creme aveludado preparado com milho verde e toque de queijo", active: true },
      { id: "acomp_salada_vinagrete", name: "Salada de Vinagrete", desc: "Cubos de tomate, cebola e pimentão marinados em azeite", active: true },
      { id: "acomp_macarrao_alho", name: "Macarrão Alho e Óleo", desc: "Massa al dente salteada em azeite extravirgem e alho dourado", active: true },
      { id: "acomp_macarrao_branco", name: "Macarrão ao Molho Branco", desc: "Massa nobre envolvida em molho bechamel cremoso", active: true },
      { id: "acomp_macarrao_bolonhesa", name: "Macarrão à Bolonhesa", desc: "Massa ao sugo artesanal com carne moída de primeira", active: true }
    ]
  },
  {
    id: "entradas",
    name: "Entradas & Petiscos",
    description: "Para recepcionar seus convidados com elegância",
    icon: "ConciergeBell",
    badge: "Boas-vindas",
    items: [
      { id: "ent_salgadinhos", name: "Salgadinhos Variados", desc: "Coxinhas, quibes, risoles e empadas douradas e quentinhas", active: true },
      { id: "ent_petiscos", name: "Petiscos Variados", desc: "Canapés finos, tábuas de frios selecionados e torradinhas", active: true }
    ]
  },
  {
    id: "bebidas",
    name: "Bebidas",
    description: "Linha de refrigerantes, sucos naturais e água para seu evento",
    icon: "Wine",
    badge: "Bebidas",
    items: [
      { id: "beb_refri_reg", name: "Refrigerante Regional", desc: "Refrigerante regional + água mineral com e sem gás e suco natural", active: true },
      { id: "beb_refri_orig", name: "Refrigerante Original", desc: "Refrigerante de marca original + água mineral e suco natural", active: true },
      { id: "beb_refrigerante", name: "Refrigerante", desc: "Seleção de refrigerantes de primeira linha servidos gelados", active: true },
      { id: "beb_agua", name: "Água Mineral", desc: "Água mineral cristalina (com gás e sem gás)", active: true },
      { id: "beb_suco", name: "Suco Natural", desc: "Sucos naturais de polpas e frutas frescas da época", active: true }
    ]
  },
  {
    id: "sobremesas",
    name: "Sobremesas",
    description: "O toque doce e requintado para fechar com chave de ouro",
    icon: "Cake",
    badge: "Doces",
    items: [
      { id: "sob_cupuacu", name: "Mousse de Cupuaçu", desc: "Mousse artesanal cremoso com calda leve da fruta", active: true },
      { id: "sob_maracuja", name: "Mousse de Maracujá", desc: "Mousse suave e aerado com calda de maracujá e sementes", active: true },
      { id: "sob_especial", name: "Sobremesa Especial", desc: "Sobremesa da casa personalizada para a ocasião", active: true }
    ]
  }
];

// Helper to get company settings with localStorage persistence
export function getStoredBuffetCompany() {
  try {
    const saved = localStorage.getItem("el_shadday_buffet_company");
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
    localStorage.setItem("el_shadday_buffet_company", JSON.stringify(company));
  } catch (e) {
    console.error("Error saving company data:", e);
  }
}

// Helper to get buffet categories & items with localStorage persistence
export function getStoredBuffetCategories() {
  try {
    const saved = localStorage.getItem("el_shadday_buffet_categories");
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
    localStorage.setItem("el_shadday_buffet_categories", JSON.stringify(categories));
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
