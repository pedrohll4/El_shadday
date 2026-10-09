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

export const DEFAULT_CHURRASCO_OPTIONS = [
  { id: "carne", label: "Carne", icon: "🥩" },
  { id: "frango", label: "Frango", icon: "🍗" },
  { id: "toscana", label: "Toscana", icon: "🌭" },
  { id: "porco_assado", label: "Porco Assado", icon: "🍖" }
];

export function formatMeatList(meats = []) {
  if (!meats || meats.length === 0) return '';
  if (meats.length === 1) return meats[0];
  if (meats.length === 2) return `${meats[0]} e ${meats[1]}`;
  return `${meats.slice(0, -1).join(', ')} e ${meats[meats.length - 1]}`;
}

export function formatChurrascoLabel(meats = []) {
  if (!meats || meats.length === 0) return 'Churrasco (Selecione as carnes)';
  return `Churrasco (${formatMeatList(meats)})`;
}

export const GALLERY_CATEGORIES = [
  { id: 'all', label: 'Todas' },
  { id: 'churrasco', label: 'Churrasco & Carnes' },
  { id: 'rechauds', label: 'Mesa & Rechauds' },
  { id: 'prataria', label: 'Louças & Taças' },
  { id: 'entradas', label: 'Entradas & Salgados' },
  { id: 'sobremesas', label: 'Doces & Sobremesas' },
  { id: 'equipe', label: 'Serviço & Garçons' }
];

// Galeria de fotos do Buffet El Shadday.
// Inicia vazia para que APENAS as fotos e vídeos reais adicionados pelo usuário sejam exibidos.
export const INITIAL_BUFFET_GALLERY = [];

export const RESERVED_BUFFET_PHOTOS = [];

export const INITIAL_BUFFET_CATEGORIES = [
  {
    id: "entradas",
    name: "Entradas",
    description: "Para recepcionar seus convidados",
    icon: "ConciergeBell",
    badge: "Entradas",
    items: [
      { id: "ent_salgadinhos", name: "Salgadinhos Variados", desc: "Coxinhas, quibes, risoles e empadas", active: true },
      { id: "ent_petiscos", name: "Petiscos Variados", desc: "Canapés finos e tábua de frios", active: true }
    ]
  },
  {
    id: "prato_principal",
    name: "Prato Principal & Assados",
    description: "Carnes e assados preparados na brasa",
    icon: "UtensilsCrossed",
    badge: "Pratos Principais",
    items: [
      { id: "pp_peito_branco", name: "Filé de Peito ao molho Branco", desc: "Filés macios com molho branco", active: true },
      { id: "pp_carne_madeira", name: "Carne ao Molho Madeira", desc: "Iscas nobres com molho madeira", active: true },
      { id: "pp_coxa_recheada", name: "Coxa/Sobre coxa desossada e recheada", desc: "Recheada com queijo e bacon", active: true },
      { id: "pp_strogonoff_frango", name: "Strogonoff de Frango", desc: "Strogonoff cremoso", active: true },
      { id: "pp_strogonoff_carne", name: "Strogonoff de Carne", desc: "Filé em tiras com molho especial", active: true },
      { id: "pp_porco_frito", name: "Porco Frito", desc: "Pedaços suínos fritos e crocantes", active: true },
      { 
        id: "pp_churrasco_assados", 
        name: "Churrasco", 
        desc: "Assados na brasa (escolha: Carne, Frango, Toscana e Porco Assado)", 
        isAssado: true, 
        badge: "Assados", 
        active: true,
        churrascoOptions: ["Carne", "Frango", "Toscana", "Porco Assado"]
      }
    ]
  },
  {
    id: "acompanhamentos",
    name: "Acompanhamentos",
    description: "Guarnições, massas e saladas frescas",
    icon: "Salad",
    badge: "Guarnições",
    items: [
      { id: "acomp_salada_tropical", name: "Salada Verde Tropical", desc: "Folhas nobres e frutas", active: true },
      { id: "acomp_batatas_rusticas", name: "Batatas Rústicas Assadas", desc: "Douradas ao forno com azeite", active: true },
      { id: "acomp_arroz_grega", name: "Arroz branco e Arroz a Grega", desc: "Dupla tradicional soltinha", active: true },
      { id: "acomp_farofa_banana", name: "Farofa de Banana da terra", desc: "Crocante com banana da terra", active: true },
      { id: "acomp_farofa_tropeira", name: "Farofa Tropeira", desc: "Com bacon e calabresa", active: true },
      { id: "acomp_macarrao_alho", name: "Macarrão Alho e Oleo", desc: "Salteado em azeite e alho", active: true },
      { id: "acomp_macarrao_branco", name: "Macarrão ao Molho Branco", desc: "Bechamel cremoso", active: true },
      { id: "acomp_creme_milho", name: "Creme de milho", desc: "Creme de milho verde fresco", active: true },
      { id: "acomp_salada_vinagrete", name: "Salada de Vinagrete", desc: "Tomate, cebola e temperos no azeite", active: true },
      { id: "acomp_macarrao_bolonhesa", name: "Macarrão a Bolonhesa", desc: "Ao sugo com carne moída de primeira", active: true }
    ]
  },
  {
    id: "sobremesas",
    name: "Sobremesas",
    description: "Doces artesanais",
    icon: "Cake",
    badge: "Sobremesas",
    items: [
      { id: "sob_cupuacu", name: "Mousse de cupuaçu", desc: "Mousse artesanal cremoso", active: true },
      { id: "sob_maracuja", name: "Mousse de Maracuja", desc: "Mousse suave e aerado", active: true }
    ]
  },
  {
    id: "bebidas",
    name: "Bebidas",
    description: "Servidas geladas em taças",
    icon: "Wine",
    badge: "Bebidas",
    items: [
      { id: "beb_regional", name: "Refrigerante Regional + Agua mineral e Suco natural", desc: "Refrigerante regional, água e suco", active: true },
      { id: "beb_original", name: "Refrigerante Original + Agua mineral e Suco natural", desc: "Refrigerante de marca original, água e suco", active: true }
    ]
  }
];

// Helper to get company settings with localStorage persistence
export function getStoredBuffetCompany() {
  try {
    const saved = localStorage.getItem("el_shadday_buffet_company_v6");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.phone === '5569992000000' || !parsed.phone) {
        parsed.phone = INITIAL_BUFFET_COMPANY.phone;
        parsed.phoneDisplay = INITIAL_BUFFET_COMPANY.phoneDisplay;
      }
      return { ...INITIAL_BUFFET_COMPANY, ...parsed };
    }
    // Migration from v5
    const oldSaved = localStorage.getItem("el_shadday_buffet_company_v5");
    if (oldSaved) {
      const parsed = JSON.parse(oldSaved);
      if (parsed.phone === '5569992000000' || !parsed.phone) {
        parsed.phone = INITIAL_BUFFET_COMPANY.phone;
        parsed.phoneDisplay = INITIAL_BUFFET_COMPANY.phoneDisplay;
      }
      const upgraded = { ...INITIAL_BUFFET_COMPANY, ...parsed };
      saveStoredBuffetCompany(upgraded);
      return upgraded;
    }
  } catch (e) {
    console.error("Error reading stored company data:", e);
  }
  return INITIAL_BUFFET_COMPANY;
}

export function saveStoredBuffetCompany(company) {
  try {
    localStorage.setItem("el_shadday_buffet_company_v6", JSON.stringify(company));
  } catch (e) {
    console.error("Error saving company data:", e);
  }
}

// Helper to get buffet categories & items with localStorage persistence
export function getStoredBuffetCategories() {
  try {
    const saved = localStorage.getItem("el_shadday_buffet_categories_v6");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Migration from v5 if present
    const oldSaved = localStorage.getItem("el_shadday_buffet_categories_v5");
    if (oldSaved) {
      const parsed = JSON.parse(oldSaved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const upgraded = parsed.map(cat => ({
          ...cat,
          items: (cat.items || []).map(item => {
            if (item.id === 'pp_churrasco_assados') {
              return {
                ...item,
                name: "Churrasco",
                desc: "Assados na brasa (escolha: Carne, Frango, Toscana e Porco Assado)",
                churrascoOptions: ["Carne", "Frango", "Toscana", "Porco Assado"]
              };
            }
            return item;
          })
        }));
        saveStoredBuffetCategories(upgraded);
        return upgraded;
      }
    }
  } catch (e) {
    console.error("Error reading stored buffet categories:", e);
  }
  return INITIAL_BUFFET_CATEGORIES;
}

export function saveStoredBuffetCategories(categories) {
  try {
    localStorage.setItem("el_shadday_buffet_categories_v6", JSON.stringify(categories));
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

export const FAKE_GALLERY_IDS = new Set([
  'gal_1', 'gal_2', 'gal_3', 'gal_4', 'gal_5', 'gal_6',
  'gal_7', 'gal_8', 'gal_9', 'gal_10', 'gal_11', 'gal_12'
]);

export function isFakeGalleryItem(item) {
  if (!item) return false;
  if (FAKE_GALLERY_IDS.has(item.id)) return true;
  if (typeof item.url === 'string' && item.url.includes('images.unsplash.com')) return true;
  return false;
}

// Helper to get buffet gallery photos with persistence (apenas fotos reais do usuário)
export function getStoredBuffetGallery() {
  try {
    const saved = localStorage.getItem("el_shadday_buffet_gallery_v2");
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => item && !isFakeGalleryItem(item));
      }
    }
  } catch (e) {
    console.error("Error reading stored buffet gallery:", e);
  }
  return [];
}

export function saveStoredBuffetGallery(gallery) {
  try {
    localStorage.setItem("el_shadday_buffet_gallery_v2", JSON.stringify(gallery));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent("buffet_gallery_updated", { detail: gallery }));
    }
  } catch (e) {
    console.error("Error saving buffet gallery:", e);
  }
}

