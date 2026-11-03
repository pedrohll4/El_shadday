import { isSupabaseConfigured } from '../services/supabaseClient.js';

export const RESTAURANT_INFO = {
  name: "El Shadday Delivery Esfirraria e Pizzaria",
  shortName: "El Shadday",
  phone: "5569992228682",
  phoneFormatted: "(69) 99222-8682",
  address: "Av Canaã, 4065 - Ariquemes - RO, 76875-818",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=-9.9130722,-63.0289001",
  deliveryTime: "45 - 75 min",
  openingHours: "Terça a Domingo: 18:00 às 23:30",
  isOpen: true,
  closedMessage: "Estamos fechados no momento. Não estamos aceitando novos pedidos pelo site agora. Confira nossos horários de funcionamento!",
  reopenTime: "18:00",
  pixKey: "69992228682",
  pixType: "Telefone / Celular",
  pixName: "El Shadday Esfirraria",
  history: "Mais de 15 anos de tradição em Ariquemes! Pioneiros em caixas de esfirras artesanais, entregando sabor inesquecível e massas frescas todos os dias.",
  logoUrl: "https://assets.olaclick.app/companies/logos/67bb7c61-2505-4b36-a16c-6a4979bb3651.png",
  bannerUrl: "https://assets.olaclick.app/companies/backgrounds/dfd052f1-d436-49bb-a996-f2f05ce0d456.webp",
  cardMachineSettings: {
    active: true,
    type: 'percentage', // 'percentage' | 'fixed' | 'split' | 'split_fixed'
    percentageRate: 3.5, // taxa percentual ex: 3.5%
    fixedRate: 2.00, // taxa fixa geral ex: R$ 2,00
    debitRate: 0, // taxa débito % ex: 0%
    creditRate: 3.5, // taxa crédito % ex: 3.5%
    debitFixed: 0, // taxa débito em R$ ex: R$ 0,00
    creditFixed: 3.00, // taxa crédito em R$ ex: R$ 3,00
    autoAddToTotal: true, // soma no total do pedido
    customNotice: ""
  },
  cardMachineNotice: "⚠️ Pagamentos no cartão (débito ou crédito) possuem taxa da maquininha cobrada pela operadora. Consulte as condições na entrega.",
  cardMachineNoticeActive: true
};

export const ARIQUEMES_DISTRICTS = [
  // --- BAIRROS R$ 8,00 ---
  { id: "setor-01", name: "Setor 01", price: 8 },
  { id: "setor-02", name: "Setor 02", price: 8 },
  { id: "setor-03", name: "Setor 03 (Próximo à Loja)", price: 8 },
  { id: "setor-04", name: "Setor 04", price: 8 },
  { id: "setor-05", name: "Setor 05", price: 8 },
  { id: "setor-06", name: "Setor 06", price: 8 },
  { id: "setor-07", name: "Setor 07", price: 8 },
  { id: "setor-08", name: "Setor 08", price: 8 },
  { id: "setor-09", name: "Setor 09", price: 8 },
  { id: "setor-10", name: "Setor 10", price: 8 },
  { id: "setor-11", name: "Setor 11", price: 8 },
  { id: "setor-12", name: "Setor 12", price: 8 },
  { id: "demais-setores", name: "Demais Setores", price: 8 },
  { id: "bnh", name: "BNH", price: 8 },
  { id: "bom-futuro", name: "Bom Futuro", price: 8 },
  { id: "bom-jesus", name: "Bom Jesus", price: 8 },
  { id: "colonial", name: "Colonial", price: 8 },
  { id: "coqueiral", name: "Coqueiral", price: 8 },
  { id: "jardim-america", name: "Jardim América", price: 8 },
  { id: "jardim-alvorada", name: "Jardim Alvorada", price: 8 },
  { id: "jardim-das-palmeiras", name: "Jardim das Palmeiras", price: 8 },
  { id: "jardim-europa", name: "Jardim Europa", price: 8 },
  { id: "jardim-paulista", name: "Jardim Paulista", price: 8 },
  { id: "jardim-vitoria", name: "Jardim Vitória", price: 8 },
  { id: "jardim-rio-de-janeiro", name: "Jardim Rio de Janeiro", price: 8 },
  { id: "jardim-primavera", name: "Jardim Primavera", price: 8 },
  { id: "jardim-parana", name: "Jardim Paraná", price: 8 },

  // --- BAIRROS R$ 10,00 ---
  { id: "jardim-zona-sul", name: "Jardim Zona Sul", price: 10 },
  { id: "marechal-rondon", name: "Marechal Rondon", price: 10 },
  { id: "sao-geraldo", name: "São Geraldo 1 e 2", price: 10 },
  { id: "monte-cristo", name: "Monte Cristo 1 e 2", price: 10 },
  { id: "multirao", name: "Multirão", price: 10 },
  { id: "nova-londrina", name: "Nova Londrina", price: 10 },
  { id: "vila-sossego", name: "Vila do Sossego", price: 10 },
  { id: "hoteis", name: "Hotéis da BR", price: 10 },
  { id: "white-solder-prf", name: "White Solder e PRF", price: 10 },
  { id: "condominio", name: "Condomínios", price: 10 },
  { id: "greenvilhe", name: "Greenvilhe", price: 10 },
  { id: "bela-vista", name: "Bela Vista 1 e 2", price: 10 },

  // --- BAIRROS R$ 15,00 ---
  { id: "supremax-rical", name: "Supremax e Rical", price: 15 },
  { id: "sol-nascente", name: "Sol Nascente", price: 15 },
  { id: "entre-rios", name: "Entre Rios", price: 15 },
  { id: "linha-gaucha", name: "Linha Gaúcha", price: 15 },
  { id: "linha-pioneiros", name: "Linha dos Pioneiros", price: 15 },
  { id: "via-codorna", name: "Via Codorna", price: 15 },
  { id: "via-coelhos", name: "Via dos Coelhos", price: 15 },
  { id: "via-araras", name: "Via Araras (Clube Lessa)", price: 15 },

  // --- BAIRROS R$ 20,00 ---
  { id: "zaltana", name: "Zaltana", price: 20 },
  { id: "bairro-jamari", name: "Bairro Jamari (B-40)", price: 20 },
  { id: "bar-garapeira", name: "Bar da Garapeira", price: 20 },
  { id: "aterro-sanitario", name: "Aterro Sanitário", price: 20 },

  // --- LOCALIDADES ESPECIAIS ---
  { id: "ifro", name: "IFRO", price: 30 },
  { id: "linha-75", name: "Centro de Ressocialização de Ariquemes (Linha 75)", price: 50 },
  { id: "outro", name: "Outro Bairro (A Combinar)", price: 8 }
];

export const CATEGORIES = [
  { id: "combos", name: "Combos da Galera", icon: "Flame", tag: "Campeões de Vendas" },
  { id: "caixas", name: "Caixas de Esfirras", icon: "Package", tag: "Melhor Custo-Benefício" },
  { id: "esfirras-salgadas", name: "Esfirras Salgadas", icon: "Utensils", tag: "Massa Secreta & Macia" },
  { id: "esfirras-doces", name: "Esfirras Doces", icon: "HeartHandshake", tag: "Sobremesas Irresistíveis" },
  { id: "pizzas", name: "Pizzas Especiais", icon: "Pizza", tag: "Borda de Catupiry Grátis!" },
  { id: "acai", name: "Açaí & Barcas", icon: "IceCream", tag: "Cremoso & Refrescante" },
  { id: "caldos", name: "Caldos Quentinhos", icon: "Soup", tag: "Sabor Caseiro & Reconfortante" },
  { id: "bebidas", name: "Bebidas Geladas", icon: "Wine", tag: "Linha Dydyo & Tradicionais" }
];

export const PRODUCTS = [
  // ==========================================
  // COMBOS PROMOCIONAIS (11 ITENS)
  // ==========================================
  {
    id: "combo-1-fm-10esf",
    categoryId: "combos",
    name: "1 Pizza Família + 10 Esfirras Sortidas",
    description: "O combo mais pedido! 1 Pizza Família de 8 fatias (até 2 sabores à sua escolha com borda de Catupiry GRÁTIS) acompanhada de 10 esfirras sortidas artesanais quentinhas.",
    price: 65.00,
    originalPrice: 70.00,
    badge: "Mais Vendido 🔥",
    bordaGratis: true,
    image: "https://assets.olaclick.app/companies/products/images/800/28f65695-a7b3-411c-abc7-e3a01aed7031.jpeg",
    details: "Pizza Família 8 fatias + 10 esfirras sortidas."
  },
  {
    id: "combo-2-pizzas-fm",
    categoryId: "combos",
    name: "2 Pizzas Família com Borda Grátis",
    description: "Combo da galera! 2 Pizzas Família (cada uma com 8 fatias e até 2 sabores cada). Ambas com borda recheada de Catupiry grátis.",
    price: 80.00,
    originalPrice: 80.00,
    badge: "Economia Real ⭐",
    bordaGratis: true,
    image: "https://assets.olaclick.app/companies/products/images/800/dadb6a0e-498b-4d67-8b61-dc4759f1a9fc.jpeg",
    details: "16 fatias deliciosas para reunir os amigos e família."
  },
  {
    id: "combo-pizza-gg-dydyo",
    categoryId: "combos",
    name: "Pizza Gigante + Dydyo 2L",
    description: "1 Pizza Gigante de 12 fatias (até 3 sabores à sua escolha com borda de Catupiry grátis) + 1 Refrigerante Dydyo 2L geladíssimo.",
    price: 60.00,
    originalPrice: 60.00,
    badge: "Clássico da Galera 🥤",
    bordaGratis: true,
    image: "https://assets.olaclick.app/companies/products/images/800/ddf08b24-e1d6-4370-b57d-2e329f042910.png",
    details: "12 fatias generosas + Dydyo 2L."
  },
  {
    id: "combo-20esf-dydyo",
    categoryId: "combos",
    name: "Caixa com 20 Esfirras + Dydyo 2L",
    description: "Caixa de 20 unidades de esfirras (15 salgadas + 5 doces todas sortidas quentinhas) + 1 Refrigerante Dydyo 2L geladíssimo.",
    price: 44.99,
    originalPrice: 44.99,
    badge: "Combo Sucesso 🔥",
    isBox: true,
    totalCount: 20,
    salgadasCount: 15,
    docesCount: 5,
    image: "https://assets.olaclick.app/companies/products/images/800/c6f824f0-f546-40c2-a2ad-9963807729d4.png",
    details: "20 esfirras sortidas + Dydyo 2L."
  },
  {
    id: "combo-30esf-dydyo",
    categoryId: "combos",
    name: "Caixa com 30 Esfirras + Dydyo 2L",
    description: "Caixa com 30 esfirras (25 salgadas + 5 doces sabores sortidos) + 1 Refrigerante Dydyo 2L geladíssimo.",
    price: 55.00,
    originalPrice: 55.00,
    badge: "Mais Pedido 👥",
    isBox: true,
    totalCount: 30,
    salgadasCount: 25,
    docesCount: 5,
    image: "https://assets.olaclick.app/companies/products/images/800/9e895022-6c27-4cef-8f9e-2a9dfc988a8b.png",
    details: "30 esfirras sortidas + Dydyo 2L."
  },
  {
    id: "combo-pizza-fm-p-dydyo",
    categoryId: "combos",
    name: "Pizza Família + Pizza P + Dydyo 2L",
    description: "Pizza família 8 fatias (até 2 sabores com borda de Catupiry grátis) + Pizza P de brigadeiro + 1 Refrigerante Dydyo 2L.",
    price: 59.99,
    originalPrice: 59.99,
    badge: "Especial Família 🌟",
    bordaGratis: true,
    image: "https://assets.olaclick.app/companies/products/images/800/c89d7ac9-5a31-4384-8b87-9a08d78edf71.png",
    details: "Pizza FM salgada + Pizza P doce + Dydyo 2L."
  },
  {
    id: "combo-pizza-gg-p-dydyo",
    categoryId: "combos",
    name: "Pizza Gigante + Pizza P + Dydyo 2L",
    description: "Pizza gigante 12 fatias (até 3 sabores à escolha com borda de Catupiry grátis) + Pizza P Doce de brigadeiro + 1 Refrigerante Dydyo 2L.",
    price: 69.99,
    originalPrice: 69.99,
    badge: "Sal + Doce Completo 🍕",
    bordaGratis: true,
    image: "https://assets.olaclick.app/companies/products/images/800/f5d4c6fd-7166-4a91-b351-f25250d69a76.png",
    details: "Pizza GG salgada + Pizza P doce + Dydyo 2L."
  },
  {
    id: "combo-fm-acai",
    categoryId: "combos",
    name: "1 Pizza Família + 1 Barca de Açaí",
    description: "Sal e doce na medida certa! 1 Pizza Família 8 fatias (até 2 sabores com borda grátis) + 1 Barca de Açaí trufada com seus acompanhamentos favoritos à escolha.",
    price: 65.00,
    originalPrice: 65.00,
    badge: "Sal + Doce 🍧",
    bordaGratis: true,
    image: "https://assets.olaclick.app/companies/products/images/800/6d01a4bb-7da7-414b-8ae1-45fd1fbbc33e.jpeg",
    details: "Pizza Família + Barca de Açaí completa."
  },
  {
    id: "combo-gg-acai",
    categoryId: "combos",
    name: "1 Pizza Gigante + 1 Barca de Açaí",
    description: "1 Pizza Gigante 12 fatias (até 3 sabores com borda de Catupiry grátis) + 1 Barca de Açaí com acompanhamentos à escolha.",
    price: 75.00,
    originalPrice: 80.00,
    badge: "Sucesso Absoluto 🏆",
    bordaGratis: true,
    image: "https://assets.olaclick.app/companies/products/images/800/b8ac4f80-f52f-4cea-87ba-863ad904669f.jpeg",
    details: "Pizza Gigante + Barca de Açaí com acompanhamentos."
  },
  {
    id: "combo-1gg-1fm-10esf",
    categoryId: "combos",
    name: "1 Pizza GG + 1 Pizza FM + 10 Esfirras",
    description: "Banquete completo: 1 Pizza Gigante (12 fatias, até 3 sabores), 1 Pizza Família (8 fatias, até 2 sabores) e 10 esfirras sortidas quentinhas. Ambas as pizzas com borda de Catupiry grátis!",
    price: 115.00,
    originalPrice: 115.00,
    badge: "Mega Festa 🎉",
    bordaGratis: true,
    image: "https://assets.olaclick.app/companies/products/images/800/3d22b221-5cf2-48fb-874d-8537c5a8d176.png",
    details: "24 fatias + 10 esfirras. Serve 6 a 8 pessoas."
  },
  {
    id: "combo-3-pizzas-gg",
    categoryId: "combos",
    name: "3 Pizzas Gigantes com Borda Grátis",
    description: "O maior combo da El Shadday! 3 Pizzas Gigantes de 12 fatias cada (total de 36 fatias, escolha até 3 sabores para cada pizza). Todas com borda de Catupiry grátis.",
    price: 150.00,
    originalPrice: 150.00,
    badge: "Super Combo 👑",
    bordaGratis: true,
    image: "https://assets.olaclick.app/companies/products/images/800/48bff297-6ae2-4a76-b574-91f7a2f94710.jpeg",
    details: "36 fatias ideais para comemorações e aniversários."
  },

  // ==========================================
  // CAIXAS DE ESFIRRAS (4 ITENS)
  // ==========================================
  {
    id: "caixa-20-esfirras",
    categoryId: "caixas",
    name: "Caixa com 20 Esfirras Sortidas",
    description: "A clássica da El Shadday: 20 esfirras sortidas quentinhas. Escolha entre: com ou sem doces, e com ou sem carne suína. *No crédito: R$ 40,00.",
    price: 35.00,
    creditPrice: 40.00,
    badge: "Pioneira em Ariquemes 🥇",
    isBox: true,
    totalCount: 20,
    salgadasCount: 15,
    docesCount: 5,
    image: "https://assets.olaclick.app/companies/products/images/800/4cfa4549-ad5f-4b4e-b539-468584a0eeba.png"
  },
  {
    id: "caixa-30-esfirras",
    categoryId: "caixas",
    name: "Caixa com 30 Esfirras Sortidas",
    description: "Conjunto perfeito para compartilhar: 30 esfirras sortidas quentinhas. Escolha entre: com ou sem doces, e com ou sem carne suína. *No crédito: R$ 50,00.",
    price: 45.00,
    creditPrice: 50.00,
    badge: "Para Compartilhar 👥",
    isBox: true,
    totalCount: 30,
    salgadasCount: 22,
    docesCount: 8,
    image: "https://assets.olaclick.app/companies/products/images/800/d22ae090-8054-428b-8ba3-6f147ad985c8.png"
  },
  {
    id: "caixa-40-esfirras",
    categoryId: "caixas",
    name: "Caixa com 40 Esfirras Sortidas",
    description: "Conjunto com 40 esfirras sortidas quentinhas. Escolha entre: com ou sem doces, e com ou sem carne suína. *No crédito: R$ 60,00.",
    price: 55.00,
    creditPrice: 60.00,
    badge: "Melhor Custo x Benefício 💰",
    isBox: true,
    totalCount: 40,
    salgadasCount: 33,
    docesCount: 7,
    image: "https://assets.olaclick.app/companies/products/images/800/365a2072-4954-4c6a-a734-69a6cef0130a.png"
  },
  {
    id: "caixa-50-esfirras",
    categoryId: "caixas",
    name: "Caixa com 50 Esfirras Sortidas",
    description: "A super caixa da El Shadday: 50 esfirras sortidas quentinhas. Escolha entre: com ou sem doces, e com ou sem carne suína. *No crédito: R$ 75,00.",
    price: 70.00,
    creditPrice: 75.00,
    badge: "Mega Caixa 📦",
    isBox: true,
    totalCount: 50,
    salgadasCount: 40,
    docesCount: 10,
    image: "https://assets.olaclick.app/companies/products/images/800/ad6d93be-acae-46e7-b062-9e796f376b8f.png"
  },

  // ==========================================
  // ESFIRRAS SALGADAS UNIDADE (13 ITENS)
  // ==========================================
  {
    id: "esf-calabresa",
    categoryId: "esfirras-salgadas",
    name: "Calabresa",
    description: "Esfirra de calabresa, molho artesanal, queijo, calabresa em fatias, cebola e orégano.",
    price: 3.00,
    badge: "Clássica",
    image: "https://assets.olaclick.app/companies/products/images/800/b9859011-b627-4250-90de-a92a3a3d6177.jpeg"
  },
  {
    id: "esf-carne",
    categoryId: "esfirras-salgadas",
    name: "Carne",
    description: "Esfirra de carne, molho artesanal, queijo, carne moída temperada e orégano.",
    price: 3.00,
    badge: "Sucesso",
    image: "https://assets.olaclick.app/companies/products/images/800/34932ad4-8ab9-4f03-b2b8-94b83324232b.jpeg"
  },
  {
    id: "esf-bacon",
    categoryId: "esfirras-salgadas",
    name: "Bacon",
    description: "Esfirra de bacon, bacon crocante, queijo derretido, molho artesanal e orégano.",
    price: 3.00,
    badge: "Crocante",
    image: "https://assets.olaclick.app/companies/products/images/800/d4a84c53-79c6-47dd-a0ef-4bb7f8316a87.jpeg"
  },
  {
    id: "esf-frango-milho",
    categoryId: "esfirras-salgadas",
    name: "Frango com Milho",
    description: "Esfirra de frango com milho, molho artesanal, milho doce, frango desfiado suculento, queijo e orégano.",
    price: 3.00,
    badge: "Saboroso",
    image: "https://assets.olaclick.app/companies/products/images/800/af8569cc-1a77-4fe1-a837-f134533522ec.jpeg"
  },
  {
    id: "esf-queijo",
    categoryId: "esfirras-salgadas",
    name: "Queijo",
    description: "Esfirra de queijo muçarela puro derretido, molho artesanal e orégano.",
    price: 3.00,
    image: "https://assets.olaclick.app/companies/products/images/800/7fb03255-1d3f-4380-ba54-30742703bb5d.jpeg"
  },
  {
    id: "esf-calabresa-picada",
    categoryId: "esfirras-salgadas",
    name: "Calabresa Picadinha",
    description: "Esfirra de calabresa picadinha, com molho artesanal, queijo, calabresa picadinha especial, ervilha e orégano.",
    price: 3.00,
    image: "https://assets.olaclick.app/companies/products/images/800/90c1a95b-0544-4c87-bc28-457a7d50d999.jpeg"
  },
  {
    id: "esf-queijo-cheddar",
    categoryId: "esfirras-salgadas",
    name: "Queijo com Cheddar",
    description: "Esfirra de queijo com cheddar cremoso, molho artesanal, queijo muçarela e orégano.",
    price: 3.00,
    badge: "Cremosa",
    image: "https://assets.olaclick.app/companies/products/images/800/f94c32f0-ca2f-4e20-b276-d512eae188db.jpeg"
  },
  {
    id: "esf-vegetariana",
    categoryId: "esfirras-salgadas",
    name: "Vegetariana",
    description: "Esfirra vegetariana, molho artesanal, milho verde, ervilha fresca, azeitona, queijo muçarela, cebola e orégano.",
    price: 3.00,
    badge: "Leve 🍃",
    image: "https://assets.olaclick.app/companies/products/images/800/14995c2c-18e7-4330-9ce8-b0f6ef75d6ff.jpeg"
  },
  {
    id: "esf-calabresa-catupiry",
    categoryId: "esfirras-salgadas",
    name: "Calabresa com Catupiry (Gourmet)",
    description: "Esfirra gourmet, com calabresa especial, legítimo Catupiry cremoso, molho artesanal, queijo e orégano.",
    price: 4.50,
    badge: "Gourmet ⭐",
    image: "https://assets.olaclick.app/companies/products/images/800/9a4dc97a-a4ce-4279-82d4-7a51325d1648.jpeg"
  },
  {
    id: "esf-milho",
    categoryId: "esfirras-salgadas",
    name: "Milho",
    description: "Esfirra de milho, milho verde doce, molho artesanal, queijo muçarela e orégano.",
    price: 3.00,
    image: "https://assets.olaclick.app/companies/products/images/800/ef45a3ef-d4ee-4dc0-a243-c7770c8d909f.jpeg"
  },
  {
    id: "esf-ervilha",
    categoryId: "esfirras-salgadas",
    name: "Ervilha",
    description: "Esfirra de ervilha, molho artesanal, ervilhas frescas, queijo muçarela e orégano.",
    price: 3.00,
    image: "https://assets.olaclick.app/companies/products/images/800/4142df92-6a5d-4c45-94e4-21d9342f562c.jpeg"
  },
  {
    id: "esf-bacon-catupiry",
    categoryId: "esfirras-salgadas",
    name: "Bacon com Catupiry (Gourmet)",
    description: "Esfirra gourmet, cubos de bacon crocantes, Catupiry cremoso, molho artesanal, queijo e orégano.",
    price: 4.50,
    badge: "Gourmet ⭐",
    image: "https://assets.olaclick.app/companies/products/images/800/6a4086d3-7033-4a4f-bd92-d94c81b70126.jpeg"
  },
  {
    id: "esf-brocolis",
    categoryId: "esfirras-salgadas",
    name: "Brócolis",
    description: "Esfirra de brócolis fresco refogado, molho artesanal, queijo muçarela e orégano.",
    price: 3.00,
    image: "https://assets.olaclick.app/companies/products/images/800/b3bafa8d-03b8-4a62-ad91-7cee59503dc9.jpeg"
  },

  // ==========================================
  // ESFIRRAS DOCES UNIDADE (12 ITENS)
  // ==========================================
  {
    id: "esf-brigadeiro",
    categoryId: "esfirras-doces",
    name: "Brigadeiro",
    description: "Esfirra de brigadeiro, chocolate ao leite cremoso, leve toque de queijo e granulado de puro chocolate.",
    price: 5.00,
    badge: "Favorito Doce 🍫",
    image: "https://assets.olaclick.app/companies/products/images/800/d03d6a99-9d23-455c-b1da-7cb643d6a34b.jpeg"
  },
  {
    id: "esf-amendoim",
    categoryId: "esfirras-doces",
    name: "Amendoim",
    description: "Esfirra de amendoim, doce de leite artesanal aveludado e amendoim torrado crocante.",
    price: 5.00,
    image: "https://assets.olaclick.app/companies/products/images/800/5e7a1169-0566-4273-a361-a51db28e4193.jpeg"
  },
  {
    id: "esf-banana-canela",
    categoryId: "esfirras-doces",
    name: "Banana com Canela",
    description: "Esfirra de banana fresca, leite condensado cremoso, queijo muçarela e canela em pó perfumada.",
    price: 5.00,
    badge: "Tradicional 🍌",
    image: "https://assets.olaclick.app/companies/products/images/800/06fd1e23-74ce-4a87-a31b-6867664e718b.jpeg"
  },
  {
    id: "esf-pacoca",
    categoryId: "esfirras-doces",
    name: "Paçoca",
    description: "Esfirra de paçoca, doce de leite cremoso e farofa generosa de paçoca de amendoim.",
    price: 5.00,
    image: "https://assets.olaclick.app/companies/products/images/800/a2499912-d1b7-457d-b65a-1105d69d214a.jpeg"
  },
  {
    id: "esf-mm",
    categoryId: "esfirras-doces",
    name: "M&M",
    description: "Esfirra de M&M, chocolate ao leite cremoso e confeitos coloridos crocantes de M&M.",
    price: 5.00,
    badge: "Colorida 🌈",
    image: "https://assets.olaclick.app/companies/products/images/800/06b09d11-16fd-4524-a73d-58472a052bb5.jpeg"
  },
  {
    id: "esf-chocoball",
    categoryId: "esfirras-doces",
    name: "Chocoball",
    description: "Esfirra de chocoball crocante e delicioso chocolate ao leite cremoso.",
    price: 5.00,
    image: "https://assets.olaclick.app/companies/products/images/800/1d321eed-85bd-448e-8b88-054935dcdb6d.jpeg"
  },
  {
    id: "esf-beijinho",
    categoryId: "esfirras-doces",
    name: "Beijinho",
    description: "Esfirra de beijinho, coco ralado úmido, leve toque de queijo e leite condensado.",
    price: 5.00,
    image: "https://assets.olaclick.app/companies/products/images/800/80ff3462-9731-40e5-b83e-cf167cfe4b81.jpeg"
  },
  {
    id: "esf-chocolate-branco",
    categoryId: "esfirras-doces",
    name: "Chocolate Branco",
    description: "Esfirra de chocolate branco derretido puro, sabor amanteigado e aveludado irresistível.",
    price: 5.00,
    image: "https://assets.olaclick.app/companies/products/images/800/2243d4f5-19ae-4e4a-905f-a73d5fd09840.jpeg"
  },
  {
    id: "esf-banana-nevada",
    categoryId: "esfirras-doces",
    name: "Banana Nevada (Gourmet)",
    description: "Esfirra gourmet, fatias de banana, chocolate branco nobre derretido, queijo e canela.",
    price: 6.50,
    badge: "Gourmet ⭐",
    image: "https://assets.olaclick.app/companies/products/images/800/5517e7e7-9d37-4653-a654-e15e54faeaf1.jpeg"
  },
  {
    id: "esf-prestigio",
    categoryId: "esfirras-doces",
    name: "Prestígio (Gourmet)",
    description: "Esfirra gourmet, chocolate ao leite cremoso, coco ralado selecionado e toque suave de queijo.",
    price: 6.50,
    badge: "Gourmet ⭐",
    image: "https://assets.olaclick.app/companies/products/images/800/cb651694-adab-468b-8404-2be34d3c4b76.jpeg"
  },
  {
    id: "esf-chocolate-morango",
    categoryId: "esfirras-doces",
    name: "Chocolate com Morango (Gourmet)",
    description: "Esfirra gourmet, generoso chocolate ao leite nobre com pedaços frescos e suculentos de morango.",
    price: 6.50,
    badge: "Mais Desejada 🍓",
    image: "https://assets.olaclick.app/companies/products/images/800/aac6df81-fb06-4e5a-ac4b-31d0abd31534.jpeg"
  },
  {
    id: "esf-romeu-julieta",
    categoryId: "esfirras-doces",
    name: "Romeu e Julieta",
    description: "Esfirra de goiabada cascão cremosa derretida perfeitamente combinada com queijo muçarela.",
    price: 5.00,
    image: "https://assets.olaclick.app/companies/products/images/800/3d9bce96-b41f-4b69-92da-d8614427dfd4.jpeg"
  },

  // ==========================================
  // PIZZAS ESPECIAIS (POR TAMANHO: P, M, FAMÍLIA, GIGANTE)
  // ==========================================
  {
    id: "pizza-p",
    categoryId: "pizzas",
    name: "Pizza Pequena P (4 Fatias - até 2 Sabores)",
    description: "Pizza tamanho P com 4 fatias. Escolha até 2 sabores à sua escolha (salgados, especiais ou doces). Acompanha BORDA DE CATUPIRY GRÁTIS!",
    price: 20.00,
    badge: "Borda Grátis 🧀",
    bordaGratis: true,
    isPizzaCustomizer: true,
    tamanho: "Pequena (4 fatias)",
    maxSabores: 2,
    image: "https://assets.olaclick.app/companies/products/images/800/c89d7ac9-5a31-4384-8b87-9a08d78edf71.png"
  },
  {
    id: "pizza-m",
    categoryId: "pizzas",
    name: "Pizza Média M (6 Fatias - até 2 Sabores)",
    description: "Pizza tamanho M com 6 fatias. Escolha até 2 sabores à sua escolha (salgados, especiais ou doces). Acompanha BORDA DE CATUPIRY GRÁTIS!",
    price: 30.00,
    badge: "Borda Grátis 🧀",
    bordaGratis: true,
    isPizzaCustomizer: true,
    tamanho: "Média (6 fatias)",
    maxSabores: 2,
    image: "https://assets.olaclick.app/companies/products/images/800/dadb6a0e-498b-4d67-8b61-dc4759f1a9fc.jpeg"
  },
  {
    id: "pizza-familia-salgada",
    categoryId: "pizzas",
    name: "Pizza Família (8 Fatias - até 2 Sabores)",
    description: "Pizza grande tamanho família com 8 fatias. Selecione até 2 sabores à sua escolha (salgados, especiais ou doces). Acompanha BORDA DE CATUPIRY GRÁTIS!",
    price: 40.00,
    badge: "Borda Grátis 🧀",
    bordaGratis: true,
    isPizzaCustomizer: true,
    tamanho: "Família (8 fatias)",
    maxSabores: 2,
    image: "https://assets.olaclick.app/companies/products/images/800/80ee539a-0a44-44f7-abf5-5e02b4c2f34b.png"
  },
  {
    id: "pizza-gigante-salgada",
    categoryId: "pizzas",
    name: "Pizza Gigante (12 Fatias - até 3 Sabores)",
    description: "Nossa maior pizza com 12 fatias fartas! Selecione até 3 sabores à sua escolha (salgados, especiais ou doces). Acompanha BORDA DE CATUPIRY GRÁTIS!",
    price: 50.00,
    badge: "Borda Grátis 🧀",
    bordaGratis: true,
    isPizzaCustomizer: true,
    tamanho: "Gigante (12 fatias)",
    maxSabores: 3,
    image: "https://assets.olaclick.app/companies/products/images/800/1ecaf28b-a823-4aeb-8dff-a779c79204a9.png"
  },

  // ==========================================
  // AÇAÍ & BARCAS (4 ITENS)
  // ==========================================
  {
    id: "barca-acai-especial",
    categoryId: "acai",
    name: "Barca de Açaí Especial",
    description: "A famosa barca de açaí da El Shadday! Açaí cremoso trufado de altíssima qualidade servido na barca com 11 opções de acompanhamentos à sua escolha: Frutas frescas, Leite em pó, Granola, Paçoca, Ovomaltine, M&M's e coberturas.",
    price: 35.00,
    originalPrice: 40.00,
    badge: "Sucesso da Casa 🍧",
    image: "/barca_acai.jpg",
    details: "Açaí cremoso trufado + acompanhamentos selecionados à sua escolha."
  },
  {
    id: "acai-copo-500ml",
    categoryId: "acai",
    name: "Copo de Açaí 500ml Turbinado",
    description: "Copo de 500ml de puro açaí cremoso montado em camadas com leite em pó Ninho, leite condensado, banana fresca fatiada e granola crocante.",
    price: 20.00,
    badge: "Mais Pedido 🍨",
    image: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=800&q=80",
    details: "500ml montado em camadas generosas."
  },
  {
    id: "acai-copo-700ml",
    categoryId: "acai",
    name: "Copo de Açaí Gigante 700ml",
    description: "Para os verdadeiros amantes de açaí! Copão de 700ml com camadas fartas de açaí, leite Ninho, leite condensado, banana, morango e paçoca.",
    price: 28.00,
    badge: "Gigante 🏆",
    image: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=800&q=80",
    details: "700ml bem servido para matar qualquer vontade."
  },
  {
    id: "acai-copo-300ml",
    categoryId: "acai",
    name: "Copo de Açaí 300ml Express",
    description: "Porção individual refrescante de açaí batido cremoso com leite em pó, leite condensado e paçoca crocante.",
    price: 15.00,
    image: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=800&q=80",
    details: "Porção individual 300ml."
  },

  // ==========================================
  // CALDOS QUENTINHOS (5 ITENS)
  // ==========================================
  {
    id: "caldo-frango-milho",
    categoryId: "caldos",
    name: "Caldo de Frango com Milho e Mandioca",
    description: "Caldo cremoso com base de mandioca selecionada e frango desfiado suculento, milho verde e tempero caseiro especial. Acompanha cheiro-verde e torradinhas crocantes.",
    price: 20.00,
    badge: "Tradicional 🍲",
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80",
    details: "Pote térmico 500ml quentinho + torradinhas e cheiro-verde."
  },
  {
    id: "caldo-carne-seca-mandioca",
    categoryId: "caldos",
    name: "Caldo de Carne Seca com Mandioca",
    description: "O clássico do norte: carne seca desfiada de primeira qualidade cozida no ponto certo com mandioca cremosa, alho frito e especiarias da casa. Acompanha torradinhas crocantes.",
    price: 24.00,
    badge: "Mais Vendido 🔥",
    image: "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?auto=format&fit=crop&w=800&q=80",
    details: "Pote térmico 500ml bem quentinho."
  },
  {
    id: "caldo-feijao-bacon-calabresa",
    categoryId: "caldos",
    name: "Caldo de Feijão com Bacon e Calabresa",
    description: "Caldo de feijão encorpado e aveludado, temperado com muito alho e louro, recheado com cubos dourados de bacon crocante e calabresa fatiada. Acompanha torresminho e cheiro-verde.",
    price: 22.00,
    badge: "Saboroso 🥓",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
    details: "Pote térmico 500ml + torresmo crocante e cheiro-verde."
  },
  {
    id: "caldo-verde-especial",
    categoryId: "caldos",
    name: "Caldo Verde Especial da El Shadday",
    description: "Tradicional caldo verde com base cremosa de batatas, couve fininha refogada no azeite extra virgem e rodelas de calabresa defumada. Acompanha torradinhas.",
    price: 22.00,
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80",
    details: "Pote térmico 500ml."
  },
  {
    id: "caldo-mocoto-tradicional",
    categoryId: "caldos",
    name: "Caldo de Mocotó Tradicional",
    description: "Rico em colágeno e muito sabor, cozido lentamente com temperos caseiros, cheiro-verde e ovos de codorna. Puro revigorante!",
    price: 25.00,
    badge: "Fortalecedor 💪",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
    details: "Pote térmico 500ml."
  },

  // ==========================================
  // BEBIDAS (8 ITENS)
  // ==========================================
  {
    id: "dydyo-cola-2l",
    categoryId: "bebidas",
    name: "Dydyo Cola 2L",
    description: "Refrigerante regional sabor Cola 2 Litros bem gelado.",
    price: 10.00,
    badge: "Regional 🥤",
    image: "https://assets.olaclick.app/companies/products/images/800/5c0b2454-6874-4f56-850c-2126b597191f.png"
  },
  {
    id: "dydyo-laranja-2l",
    categoryId: "bebidas",
    name: "Dydyo Laranja 2L",
    description: "Refrigerante regional sabor Laranja 2 Litros bem gelado.",
    price: 10.00,
    badge: "Regional 🥤",
    image: "https://assets.olaclick.app/companies/products/images/800/7a8f04b2-2b44-4e12-bdc7-1c9173c97537.png"
  },
  {
    id: "dydyo-guarana-2l",
    categoryId: "bebidas",
    name: "Dydyo Guaraná 2L",
    description: "Refrigerante regional sabor Guaraná da Amazônia 2 Litros geladíssimo.",
    price: 10.00,
    badge: "Regional 🥤",
    image: "https://assets.olaclick.app/companies/products/images/800/a0597d6a-fee7-43a6-99be-e072f6beba77.png"
  },
  {
    id: "coca-cola-2l",
    categoryId: "bebidas",
    name: "Coca-Cola Original 2L",
    description: "Sabor original Coca-Cola 2 Litros, perfeito para acompanhar sua pizza ou esfirras.",
    price: 16.00,
    image: "https://assets.olaclick.app/companies/products/images/800/5cf5a9e3-d887-4309-a531-94c6ba777299.png"
  },
  {
    id: "fanta-laranja-2l",
    categoryId: "bebidas",
    name: "Fanta Laranja 2L",
    description: "Fanta sabor laranja 2 Litros bem gelada.",
    price: 16.00,
    image: "https://assets.olaclick.app/companies/products/images/800/492710b2-5b16-497c-a43c-40b4fb7d6a0c.png"
  },
  {
    id: "fanta-uva-2l",
    categoryId: "bebidas",
    name: "Fanta Uva 2L",
    description: "Fanta sabor uva 2 Litros bem gelada.",
    price: 16.00,
    image: "https://assets.olaclick.app/companies/products/images/800/dbb4b323-f5a2-47e0-ba15-35fcc41e22c9.png"
  },
  {
    id: "refrigerante-lata",
    categoryId: "bebidas",
    name: "Refrigerante em Lata (Coca-Cola 350ml)",
    description: "Refrigerante Coca-Cola em lata 350ml gelada.",
    price: 6.00,
    image: "https://assets.olaclick.app/companies/products/images/800/5cf5a9e3-d887-4309-a531-94c6ba777299.png"
  },
  {
    id: "coca-cola-2-5l",
    categoryId: "bebidas",
    name: "Coca-Cola 2,5L",
    description: "Coca-Cola tamanho família 2,5 Litros sabor original bem gelada.",
    price: 18.00,
    image: "https://assets.olaclick.app/companies/products/images/800/5cf5a9e3-d887-4309-a531-94c6ba777299.png"
  }
];

export const PIZZA_SIZES = [
  { key: 'p', label: 'Pequena (P)', shortLabel: 'P (4 fatias)', fatias: '4 fatias', defaultBase: 20.00 },
  { key: 'm', label: 'Média (M)', shortLabel: 'M (6 fatias)', fatias: '6 fatias', defaultBase: 30.00 },
  { key: 'familia', label: 'Família (FM)', shortLabel: 'FM (8 fatias)', fatias: '8 fatias', defaultBase: 40.00 },
  { key: 'gigante', label: 'Gigante (GG)', shortLabel: 'GG (12 fatias)', fatias: '12 fatias', defaultBase: 50.00 }
];

export const DEFAULT_PIZZA_BASE_PRICES = {
  p: 20.00,
  m: 30.00,
  familia: 40.00,
  gigante: 50.00
};

const STD_PIZZA_PRICES = { ...DEFAULT_PIZZA_BASE_PRICES };

export const INITIAL_PIZZA_FLAVORS = [
  {
    id: "calabresa",
    name: "Calabresa Especial com Cebola",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "salgadas",
    description: "Molho artesanal, queijo muçarela derretido, calabresa fatiada crocante, cebola e orégano.",
    image: "/flavors/calabresa.png",
    isAvailable: true
  },
  {
    id: "mucarela",
    name: "Muçarela Tradicional",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "salgadas",
    description: "Muçarela de primeira qualidade, molho artesanal e orégano perfumado.",
    image: "/flavors/mucarela.png",
    isAvailable: true
  },
  {
    id: "dois-queijos",
    name: "Dois Queijos Cremoso",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "salgadas",
    description: "Combinação saborosa de muçarela especial e queijo cremoso com orégano.",
    image: "/flavors/dois-queijos.png",
    isAvailable: true
  },
  {
    id: "frango-catupiry",
    name: "Frango com Catupiry",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "salgadas",
    description: "Peito de frango desfiado temperado, muçarela, legítimo Catupiry cremoso e orégano.",
    image: "/flavors/frango-catupiry.png",
    isAvailable: true
  },
  {
    id: "frango-cheddar",
    name: "Frango com Cheddar",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "salgadas",
    description: "Frango desfiado suculento, muçarela e delicioso queijo cheddar derretido.",
    image: "/flavors/frango-cheddar.png",
    isAvailable: true
  },
  {
    id: "vegetariana",
    name: "Vegetariana da Casa",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "salgadas",
    description: "Milho verde, ervilha fresca, azeitona, muçarela, cebola crocante e orégano.",
    image: "/flavors/vegetariana.png",
    isAvailable: true
  },
  {
    id: "calabresa-picadinha",
    name: "Calabresa Picadinha com Ervilha",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "salgadas",
    description: "Calabresa picadinha especial, ervilhas frescas, queijo muçarela e orégano.",
    image: "/flavors/calabresa-picadinha.png",
    isAvailable: true
  },
  {
    id: "bacon-crocante",
    name: "Bacon Crocante",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "salgadas",
    description: "Cubos de bacon dourados e crocantes, queijo muçarela derretido e orégano.",
    image: "/flavors/bacon-crocante.png",
    isAvailable: true
  },
  {
    id: "romanesca",
    name: "Romanesca",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "salgadas",
    description: "Receita especial com muçarela, presunto, champignon e orégano.",
    image: "/flavors/romanesca.png",
    isAvailable: true
  },
  {
    id: "hot-dog",
    name: "Hot-Dog Especial",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "salgadas",
    description: "Molho artesanal, muçarela, salsicha fatiada selecionada, milho e batata palha.",
    image: "/flavors/hot-dog.png",
    isAvailable: true
  },
  {
    id: "baiana-apimentada",
    name: "Baiana Apimentada",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "salgadas",
    description: "Calabresa moída, pimenta calabresa selecionada, cebola, ovos e muçarela.",
    image: "/flavors/baiana-apimentada.png",
    isAvailable: true
  },
  {
    id: "frango-milho",
    name: "Frango com Milho",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "salgadas",
    description: "Frango desfiado suculento, milho verde selecionado e queijo muçarela.",
    image: "/flavors/frango-milho.png",
    isAvailable: true
  },
  {
    id: "milho",
    name: "Milho Verde com Queijo",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "salgadas",
    description: "Milho verde doce e suculento, muçarela derretida e orégano.",
    image: "/flavors/milho.png",
    isAvailable: true
  },
  {
    id: "calabresa-catupiry",
    name: "Calabresa com Catupiry (Gourmet)",
    price: 50.00,
    prices: { p: 25.00, m: 38.00, familia: 50.00, gigante: 62.00 },
    category: "especiais",
    description: "Fatias de calabresa artesanal combinadas com o legítimo Catupiry cremoso e muçarela.",
    image: "/flavors/calabresa-catupiry.png",
    isAvailable: true
  },
  {
    id: "carne-seca",
    name: "Carne Seca com Catupiry (Gourmet)",
    price: 65.00,
    prices: { p: 35.00, m: 48.00, familia: 65.00, gigante: 78.00 },
    category: "especiais",
    description: "Carne seca desfiada de primeiríssima qualidade com generoso Catupiry cremoso.",
    image: "/flavors/carne-seca.png",
    isAvailable: true
  },
  {
    id: "strogonoff-frango",
    name: "Strogonoff de Frango (Especial)",
    price: 55.00,
    prices: { p: 28.00, m: 42.00, familia: 55.00, gigante: 68.00 },
    category: "especiais",
    description: "Strogonoff de frango cremoso feito na hora, muçarela e batata palha crocante.",
    image: "/flavors/strogonoff-frango.png",
    isAvailable: true
  },
  {
    id: "lombo-abacaxi",
    name: "Lombo com Abacaxi (Especial)",
    price: 65.00,
    prices: { p: 35.00, m: 48.00, familia: 65.00, gigante: 78.00 },
    category: "especiais",
    description: "Lombo canadense fatiado, pedaços doces de abacaxi e queijo muçarela derretido.",
    image: "/flavors/lombo-abacaxi.png",
    isAvailable: true
  },
  {
    id: "lombo-portuguesa",
    name: "Lombo à Portuguesa (Especial)",
    price: 65.00,
    prices: { p: 35.00, m: 48.00, familia: 65.00, gigante: 78.00 },
    category: "especiais",
    description: "Lombo especial com cebola, ovos, azeitonas selecionadas e muçarela.",
    image: "/flavors/lombo-portuguesa.png",
    isAvailable: true
  },
  {
    id: "brigadeiro-gourmet",
    name: "Brigadeiro com Granulado Nobre",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "doces",
    description: "Chocolate ao leite cremoso nobre, granulado de puro cacau e leve toque suave de queijo.",
    image: "/flavors/brigadeiro-gourmet.png",
    isAvailable: true
  },
  {
    id: "banana-canela",
    name: "Banana com Canela e Leite Condensado",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "doces",
    description: "Fatias de banana fresca, leite condensado cremoso artesanal, muçarela derretida e canela em pó perfumada.",
    image: "/flavors/banana-canela.png",
    isAvailable: true
  },
  {
    id: "romeu-julieta",
    name: "Romeu e Julieta Nobre",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "doces",
    description: "Goiabada cascão cremosa derretida harmonizada com bastante queijo muçarela especial.",
    image: "/flavors/romeu-julieta.png",
    isAvailable: true
  },
  {
    id: "prestigio-gourmet",
    name: "Prestígio com Coco Ralado",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "doces",
    description: "Chocolate ao leite nobre cremoso com flocos úmidos de coco ralado selecionado e queijo muçarela.",
    image: "/flavors/prestigio-gourmet.png",
    isAvailable: true
  },
  {
    id: "chocolate-morango",
    name: "Sensação (Chocolate com Morango)",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "doces",
    description: "Generoso chocolate nobre ao leite com pedaços frescos e suculentos de morango.",
    image: "/flavors/chocolate-morango.png",
    isAvailable: true
  },
  {
    id: "chocolate-branco",
    name: "Chocolate Branco Cremoso",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "doces",
    description: "Puro chocolate branco nobre derretido, amanteigado, aveludado e irresistível.",
    image: "/flavors/chocolate-branco.png",
    isAvailable: true
  },
  {
    id: "banana-nevada",
    name: "Banana Nevada com Chocolate Branco",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "doces",
    description: "Fatias de banana fresca, chocolate branco nobre derretido, queijo e canela suave.",
    image: "/flavors/banana-nevada.png",
    isAvailable: true
  },
  {
    id: "confete-mm",
    name: "Confete M&M Colorido",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "doces",
    description: "Chocolate ao leite nobre cremoso com confeitos crocantes e coloridos de chocolate.",
    image: "/flavors/confete-mm.png",
    isAvailable: true
  },
  {
    id: "doce-leite-pacoca",
    name: "Doce de Leite com Paçoca",
    price: 40.00,
    prices: { ...STD_PIZZA_PRICES },
    category: "doces",
    description: "Doce de leite artesanal aveludado e farofa generosa de paçoca de amendoim torrado.",
    image: "/flavors/doce-leite-pacoca.png",
    isAvailable: true
  }
];

export const PIZZA_FLAVORS = INITIAL_PIZZA_FLAVORS.map(f => f.name);

export const DEFAULT_PROMO_SETTINGS = {
  bannerActive: true,
  bannerText: "🔥 Hoje: Borda de Catupiry GRÁTIS em todas as pizzas + Esfirras quentinhas!",
  bannerLink: "#menu",
  couponActive: true,
  couponCode: "ELSHADDAY10",
  couponDiscountPercent: 10,
  minOrderValueForCoupon: 50.00
};

export function normalizeProductsList(prods) {
  if (!Array.isArray(prods) || prods.length === 0) return PRODUCTS;
  // Se contiver os itens legados de pizzas doces separadas ou faltar pizza-p, migra a fatia de pizzas
  const hasLegacyDoces = prods.some(p => p.id === 'pizza-doce-1sabor' || p.id === 'pizza-doce-2-3-sabores');
  const lacksPizzaP = !prods.some(p => p.id === 'pizza-p');
  if (hasLegacyDoces || lacksPizzaP) {
    const nonPizza = prods.filter(p => p.categoryId !== 'pizzas' && p.id !== 'pizza-doce-1sabor' && p.id !== 'pizza-doce-2-3-sabores' && p.id !== 'pizza-familia-salgada' && p.id !== 'pizza-gigante-salgada');
    const defaultPizzas = PRODUCTS.filter(p => p.categoryId === 'pizzas');
    return [...nonPizza, ...defaultPizzas];
  }
  return prods;
}

export function normalizePizzaFlavors(flavors) {
  if (!Array.isArray(flavors)) return INITIAL_PIZZA_FLAVORS;
  if (flavors.length === 0) return [];
  const hasDoces = flavors.some(f => f && typeof f === 'object' && f.category === 'doces');
  let normalized = flavors.map((item, idx) => {
    if (!item) return null;
    if (typeof item === 'string') {
      const generatedId = `flavor-${item.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const found = INITIAL_PIZZA_FLAVORS.find(f => (f.name && f.name.toLowerCase() === item.toLowerCase()) || f.id === generatedId);
      return {
        id: found?.id || generatedId,
        name: item,
        price: found ? found.price : 40.00,
        prices: found?.prices ? { ...found.prices } : { ...DEFAULT_PIZZA_BASE_PRICES },
        category: found ? found.category : 'salgadas',
        description: found ? found.description : '',
        image: found?.image || '',
        isAvailable: true
      };
    }
    const id = item.id || `flavor-${Date.now()}-${idx}`;
    const itemName = item.name || '';
    const found = INITIAL_PIZZA_FLAVORS.find(f => f.id === id || (f.name && itemName && f.name.toLowerCase() === itemName.toLowerCase()));

    // Respeita a imagem escolhida ou removida (string vazia '' = sem foto).
    // Nunca ressuscita found.image se o usuário tiver apagado a foto.
    let itemImage = '';
    if (typeof item.image === 'string') {
      itemImage = item.image.trim();
    } else if (item.image === null || item.image === false) {
      itemImage = '';
    } else if (found?.image) {
      itemImage = found.image;
    }

    // Normalização dos preços por tamanho
    let itemPrices = null;
    if (item.prices && typeof item.prices === 'object') {
      itemPrices = {
        p: typeof item.prices.p === 'number' ? item.prices.p : (parseFloat(String(item.prices.p).replace(',', '.')) || (found?.prices?.p || DEFAULT_PIZZA_BASE_PRICES.p)),
        m: typeof item.prices.m === 'number' ? item.prices.m : (parseFloat(String(item.prices.m).replace(',', '.')) || (found?.prices?.m || DEFAULT_PIZZA_BASE_PRICES.m)),
        familia: typeof item.prices.familia === 'number' ? item.prices.familia : (parseFloat(String(item.prices.familia).replace(',', '.')) || (found?.prices?.familia || DEFAULT_PIZZA_BASE_PRICES.familia)),
        gigante: typeof item.prices.gigante === 'number' ? item.prices.gigante : (parseFloat(String(item.prices.gigante).replace(',', '.')) || (found?.prices?.gigante || DEFAULT_PIZZA_BASE_PRICES.gigante))
      };
    } else if (found?.prices) {
      itemPrices = { ...found.prices };
    } else {
      const legacyPrice = typeof item.price === 'number' ? item.price : (parseFloat(item.price) || (found ? found.price : 40.00));
      const diff = Math.max(0, legacyPrice - 40.00);
      itemPrices = {
        p: DEFAULT_PIZZA_BASE_PRICES.p + diff,
        m: DEFAULT_PIZZA_BASE_PRICES.m + diff,
        familia: DEFAULT_PIZZA_BASE_PRICES.familia + diff,
        gigante: DEFAULT_PIZZA_BASE_PRICES.gigante + diff
      };
    }

    return {
      id: found?.id || id,
      name: itemName || found?.name || 'Sabor Especial',
      price: typeof item.price === 'number' ? item.price : (itemPrices.familia || 40.00),
      prices: itemPrices,
      category: item.category || found?.category || 'salgadas',
      description: item.description || found?.description || '',
      image: itemImage,
      isAvailable: item.isAvailable !== false
    };
  }).filter(Boolean);

  if (!hasDoces && flavors.length > 0) {
    const docesFlavors = INITIAL_PIZZA_FLAVORS.filter(f => f.category === 'doces');
    normalized = [...normalized, ...docesFlavors];
  }
  return normalized;
}

export function getStoredProducts() {
  try {
    const saved = localStorage.getItem("el_shadday_delivery_products_v3");
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeProductsList(parsed);
      }
    }

    const savedV2 = localStorage.getItem("el_shadday_delivery_products_v2");
    if (savedV2 !== null) {
      const parsedV2 = JSON.parse(savedV2);
      if (Array.isArray(parsedV2) && parsedV2.length > 0) {
        const migrated = normalizeProductsList(parsedV2);
        localStorage.setItem("el_shadday_delivery_products_v3", JSON.stringify(migrated));
        localStorage.setItem("el_shadday_delivery_products_v2", JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch (e) {
    console.error("Error reading stored products:", e);
  }
  return PRODUCTS;
}

export function saveStoredProducts(products) {
  try {
    localStorage.setItem("el_shadday_delivery_products_v3", JSON.stringify(products));
    localStorage.setItem("el_shadday_delivery_products_v2", JSON.stringify(products));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent("delivery_products_updated", { detail: products }));
    }
  } catch (e) {
    console.error("Error saving stored products:", e);
  }
}

export function getStoredPromoSettings() {
  try {
    const saved = localStorage.getItem("el_shadday_delivery_promos_v2");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_PROMO_SETTINGS, ...parsed };
      }
    }
  } catch (e) {
    console.error("Error reading promo settings:", e);
  }
  return DEFAULT_PROMO_SETTINGS;
}

export function saveStoredPromoSettings(settings) {
  try {
    localStorage.setItem("el_shadday_delivery_promos_v2", JSON.stringify(settings));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent("delivery_promos_updated", { detail: settings }));
    }
  } catch (e) {
    console.error("Error saving promo settings:", e);
  }
}

export function getStoredRestaurantInfo() {
  try {
    const saved = localStorage.getItem("el_shadday_delivery_restaurant_info_v2");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const mergedSettings = {
          ...RESTAURANT_INFO.cardMachineSettings,
          ...(parsed.cardMachineSettings || {})
        };
        return { 
          ...RESTAURANT_INFO, 
          ...parsed,
          isOpen: parsed.isOpen !== undefined ? parsed.isOpen : RESTAURANT_INFO.isOpen,
          closedMessage: parsed.closedMessage || RESTAURANT_INFO.closedMessage,
          reopenTime: parsed.reopenTime || RESTAURANT_INFO.reopenTime,
          openingHours: parsed.openingHours || RESTAURANT_INFO.openingHours,
          cardMachineSettings: mergedSettings,
          cardMachineNotice: parsed.cardMachineNotice !== undefined ? parsed.cardMachineNotice : RESTAURANT_INFO.cardMachineNotice,
          cardMachineNoticeActive: parsed.cardMachineNoticeActive !== undefined ? parsed.cardMachineNoticeActive : RESTAURANT_INFO.cardMachineNoticeActive
        };
      }
    }
  } catch (e) {
    console.error("Error reading restaurant info:", e);
  }
  return RESTAURANT_INFO;
}

export function isStoreOpen(restaurantInfo, branch) {
  if (branch) {
    if (branch.status === 'closed' || branch.status === 'construction') return false;
  }
  if (restaurantInfo && restaurantInfo.isOpen === false) return false;
  return true;
}

export function saveStoredRestaurantInfo(info) {
  try {
    localStorage.setItem("el_shadday_delivery_restaurant_info_v2", JSON.stringify(info));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent("delivery_restaurant_info_updated", { detail: info }));
    }
  } catch (e) {
    console.error("Error saving restaurant info:", e);
  }
}

export function getStoredPizzaFlavors() {
  try {
    const saved = localStorage.getItem("el_shadday_pizza_flavors_v4") || localStorage.getItem("el_shadday_pizza_flavors_v3");
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return normalizePizzaFlavors(parsed);
      }
    }

    const savedV2 = localStorage.getItem("el_shadday_pizza_flavors_v2");
    if (savedV2 !== null) {
      const parsed = JSON.parse(savedV2);
      if (Array.isArray(parsed)) {
        return normalizePizzaFlavors(parsed);
      }
    }
  } catch (e) {
    console.error("Error reading stored pizza flavors:", e);
  }
  return INITIAL_PIZZA_FLAVORS;
}

export function saveStoredPizzaFlavors(flavors) {
  try {
    const normalized = normalizePizzaFlavors(flavors);
    localStorage.setItem("el_shadday_pizza_flavors_v4", JSON.stringify(normalized));
    localStorage.setItem("el_shadday_pizza_flavors_v3", JSON.stringify(normalized));
    localStorage.setItem("el_shadday_pizza_flavors_v2", JSON.stringify(normalized));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent("pizza_flavors_updated", { detail: normalized }));
    }
  } catch (e) {
    console.error("Error saving stored pizza flavors:", e);
  }
}

export function normalizeCategoriesList(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return CATEGORIES.map((c, i) => ({ ...c, order: i, visible: true }));
  }

  const seenIds = new Set();
  const result = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    const catId = typeof item === 'string' ? item : item?.id;
    if (!catId || seenIds.has(catId)) continue;
    seenIds.add(catId);

    const defaultCat = CATEGORIES.find(c => c.id === catId);
    if (defaultCat) {
      result.push({
        ...defaultCat,
        ...(typeof item === 'object' ? item : {}),
        id: defaultCat.id,
        order: result.length,
        visible: item?.visible !== false
      });
    } else if (typeof item === 'object' && item.name) {
      result.push({
        id: catId,
        name: item.name,
        icon: item.icon || 'Flame',
        tag: item.tag || '',
        order: result.length,
        visible: item.visible !== false
      });
    }
  }

  // Garante que todas as categorias padrão existam
  CATEGORIES.forEach(c => {
    if (!seenIds.has(c.id)) {
      result.push({ ...c, order: result.length, visible: true });
    }
  });

  return result;
}

export function getStoredCategories() {
  try {
    const saved = localStorage.getItem("el_shadday_delivery_categories_v2") || localStorage.getItem("el_shadday_delivery_categories");
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeCategoriesList(parsed);
      }
    }
  } catch (e) {
    console.error("Error reading stored delivery categories:", e);
  }
  return CATEGORIES.map((c, i) => ({ ...c, order: i, visible: true }));
}

export function saveStoredCategories(categories) {
  try {
    const normalized = normalizeCategoriesList(categories);
    localStorage.setItem("el_shadday_delivery_categories_v2", JSON.stringify(normalized));
    localStorage.setItem("el_shadday_delivery_categories", JSON.stringify(normalized));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent("delivery_categories_updated", { detail: normalized }));
    }
    return normalized;
  } catch (e) {
    console.error("Error saving delivery categories:", e);
    return categories;
  }
}

export function normalizeDistrictsList(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return ARIQUEMES_DISTRICTS.map(d => ({
      id: d.id,
      name: d.name,
      price: typeof d.price === 'number' ? Math.max(0, d.price) : (parseFloat(d.price) || 0),
      isAvailable: d.isAvailable !== false
    }));
  }

  return raw.map((d, idx) => {
    const rawPrice = typeof d.price === 'number' ? d.price : (parseFloat(String(d.price).replace(',', '.')) || 0);
    return {
      id: d.id || `dist_${Date.now()}_${idx}`,
      name: (d.name || `Bairro ${idx + 1}`).trim(),
      price: Math.max(0, Math.round(rawPrice * 100) / 100),
      isAvailable: d.isAvailable !== false
    };
  }).filter(d => Boolean(d.name));
}

export function getStoredDistricts() {
  try {
    const saved = localStorage.getItem("el_shadday_delivery_districts_v1");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeDistrictsList(parsed);
      }
    }
  } catch (e) {
    console.error("Error reading stored delivery districts:", e);
  }
  return normalizeDistrictsList(ARIQUEMES_DISTRICTS);
}

export function saveStoredDistricts(districts) {
  try {
    const normalized = normalizeDistrictsList(districts);
    localStorage.setItem("el_shadday_delivery_districts_v1", JSON.stringify(normalized));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent("delivery_districts_updated", { detail: normalized }));
    }
    return normalized;
  } catch (e) {
    console.error("Error saving stored delivery districts:", e);
    return normalizeDistrictsList(ARIQUEMES_DISTRICTS);
  }
}

/**
 * Retorna a chave do tamanho da pizza ('p' | 'm' | 'familia' | 'gigante')
 */
export function getPizzaSizeKey(sizeOrProduct, basePrice = null) {
  if (typeof sizeOrProduct === 'string') {
    const s = sizeOrProduct.toLowerCase().trim();
    if (s === 'p' || s === 'pequena' || s.includes('pequena') || s.includes('4 fatia')) return 'p';
    if (s === 'm' || s === 'media' || s === 'média' || s.includes('média') || s.includes('media') || s.includes('6 fatia')) return 'm';
    if (s === 'familia' || s === 'família' || s.includes('família') || s.includes('familia') || s.includes('8 fatia')) return 'familia';
    if (s === 'gigante' || s === 'gg' || s.includes('gigante') || s.includes('12 fatia')) return 'gigante';
  } else if (sizeOrProduct && typeof sizeOrProduct === 'object') {
    const id = (sizeOrProduct.id || '').toLowerCase();
    const name = (sizeOrProduct.name || '').toLowerCase();
    const tamanho = (sizeOrProduct.tamanho || '').toLowerCase();
    const size = (sizeOrProduct.size || '').toLowerCase();
    
    if (size) return getPizzaSizeKey(size, basePrice);
    if (id === 'pizza-p' || name.includes('pequena') || name.includes(' p (') || tamanho.includes('pequena')) return 'p';
    if (id === 'pizza-m' || name.includes('média') || name.includes('media') || name.includes(' m (') || tamanho.includes('média') || tamanho.includes('media')) return 'm';
    if (id === 'pizza-familia-salgada' || name.includes('família') || name.includes('familia') || tamanho.includes('família') || tamanho.includes('familia')) return 'familia';
    if (id === 'pizza-gigante-salgada' || name.includes('gigante') || tamanho.includes('gigante')) return 'gigante';
  }

  // Fallback pelo preço base
  const base = Number(basePrice) || 0;
  if (base > 0 && base <= 25) return 'p';
  if (base > 25 && base <= 35) return 'm';
  if (base > 35 && base <= 45) return 'familia';
  if (base > 45) return 'gigante';

  return 'familia';
}

/**
 * Retorna o preço configurado de um sabor para um determinado tamanho de pizza
 */
export function getPizzaFlavorPrice(flavorObj, sizeKeyOrProduct = 'familia', basePrice = null) {
  if (!flavorObj) return 0;
  const sizeKey = getPizzaSizeKey(sizeKeyOrProduct, basePrice);
  const defaultBase = DEFAULT_PIZZA_BASE_PRICES[sizeKey] || (Number(basePrice) || 40.00);

  // 1. Se tem preço específico definido no mapa prices para esse tamanho
  if (flavorObj.prices && typeof flavorObj.prices === 'object') {
    const rawVal = flavorObj.prices[sizeKey];
    if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
      const parsed = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal).replace(',', '.'));
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  // 2. Se for sabor tradicional/doce padrão com preço <= 40
  const legacyPrice = Number(flavorObj.price) || 0;
  if (legacyPrice <= 40 && flavorObj.category !== 'especiais') {
    if (basePrice !== null && Number(basePrice) > 0) return Number(basePrice);
    return defaultBase;
  }

  // 3. Se for especial legado (diferença proporcional em relação aos 40 da Família)
  const diff = Math.max(0, legacyPrice - 40.00);
  return defaultBase + diff;
}

/**
 * Regra de cálculo de Pizza por Sabor (Regra do Estabelecimento):
 * - Sabores tradicionais são inclusos no valor base do tamanho escolhido (P, M, Família ou Gigante).
 * - Se algum sabor escolhido for especial/gourmet ou tiver valor superior ao preço base da pizza para aquele tamanho,
 *   a pizza inteira puxa para o MAIOR valor entre os sabores escolhidos!
 */
export function calculatePizzaPrice(basePrice, selectedFlavors, sizeKeyOrProduct = null) {
  const base = Number(basePrice) || 0;
  if (!selectedFlavors || !Array.isArray(selectedFlavors) || selectedFlavors.length === 0) {
    return base;
  }
  
  const sizeKey = getPizzaSizeKey(sizeKeyOrProduct, base);
  const allFlavors = getStoredPizzaFlavors();
  const flavorPrices = selectedFlavors.map(f => {
    if (!f) return base;
    const flavorObj = typeof f === 'object' 
      ? f 
      : allFlavors.find(s => s && s.name === f) || INITIAL_PIZZA_FLAVORS.find(s => s && s.name === f);
    if (!flavorObj) return base;
    
    const priceForSize = getPizzaFlavorPrice(flavorObj, sizeKey, base);
    // Sabores tradicionais com valor igual ou inferior ao base não geram acréscimo
    if (priceForSize <= base && flavorObj.category !== 'especiais') {
      return base;
    }
    return priceForSize;
  });

  const maxFlavorPrice = Math.max(base, ...flavorPrices);
  return Math.max(base, maxFlavorPrice);
}

/**
 * Retorna o acréscimo de uma pizza com base nos sabores selecionados e no tamanho
 */
export function calculatePizzaSurcharge(pizzaBasePrice, selectedFlavors, sizeKeyOrProduct = null) {
  const base = Number(pizzaBasePrice) || 0;
  const calculated = calculatePizzaPrice(base, selectedFlavors, sizeKeyOrProduct);
  return Math.max(0, calculated - base);
}

/**
 * Retorna o acréscimo individual que um sabor traria para uma pizza de determinado tamanho
 */
export function getFlavorSurchargeForPizza(pizzaBasePrice, flavorObj, sizeKeyOrProduct = null) {
  if (!flavorObj) return 0;
  const base = Number(pizzaBasePrice) || 0;
  const sizeKey = getPizzaSizeKey(sizeKeyOrProduct, base);
  const priceForSize = getPizzaFlavorPrice(flavorObj, sizeKey, base);
  if (priceForSize <= base && flavorObj.category !== 'especiais') {
    return 0;
  }
  return Math.max(0, priceForSize - base);
}

/**
 * Calcula o valor da taxa da maquininha de cartão
 * @param {number} subtotal 
 * @param {object} cardSettings 
 * @param {'credito' | 'debito'} cardType 
 * @returns {number}
 */
export function calculateCardMachineFee(subtotal, cardSettings, cardType = 'credito') {
  if (!cardSettings || cardSettings.active === false) return 0;
  const numSubtotal = Number(subtotal) || 0;
  if (numSubtotal <= 0) return 0;

  // 1. Taxa Fixa Geral em R$
  if (cardSettings.type === 'fixed') {
    return Math.max(0, Number(cardSettings.fixedRate) || 0);
  }

  // 2. Débito e Crédito Separados em R$ (Valores Fixos em Reais)
  if (cardSettings.type === 'split_fixed') {
    const fixedFee = cardType === 'debito'
      ? (cardSettings.debitFixed !== undefined ? Number(cardSettings.debitFixed) : (Number(cardSettings.debitRate) || 0))
      : (cardSettings.creditFixed !== undefined ? Number(cardSettings.creditFixed) : (Number(cardSettings.creditRate) || 0));
    return Math.max(0, Number(fixedFee) || 0);
  }

  // 3. Débito e Crédito Separados em % (Porcentagem)
  if (cardSettings.type === 'split') {
    const rate = cardType === 'debito' 
      ? (Number(cardSettings.debitRate) || 0) 
      : (Number(cardSettings.creditRate) || 0);
    if (rate <= 0) return 0;
    return Math.round((numSubtotal * (rate / 100)) * 100) / 100;
  }

  // 4. Porcentagem Geral (%)
  const rate = Number(cardSettings.percentageRate) || 0;
  if (rate <= 0) return 0;
  return Math.round((numSubtotal * (rate / 100)) * 100) / 100;
}

/**
 * Retorna o texto formatado do aviso da taxa da maquininha
 * @param {object} cardSettings 
 * @param {'credito' | 'debito' | null} cardType
 * @returns {string}
 */
export function getCardMachineNoticeText(cardSettings, cardType = null) {
  if (!cardSettings || cardSettings.active === false) return '';
  if (cardSettings.customNotice && cardSettings.customNotice.trim()) {
    return cardSettings.customNotice.trim();
  }

  // 1. Valor Fixo Geral
  if (cardSettings.type === 'fixed') {
    const fee = Number(cardSettings.fixedRate) || 0;
    if (fee <= 0) return '✅ Pagamentos no cartão não possuem taxa da maquininha.';
    const feeStr = fee.toFixed(2).replace('.', ',');
    return `⚠️ Pagamentos no cartão possuem taxa fixa de R$ ${feeStr} da maquininha cobrada pela operadora.`;
  }

  // 2. Débito e Crédito Separados em R$
  if (cardSettings.type === 'split_fixed') {
    const debFee = Number(cardSettings.debitFixed !== undefined ? cardSettings.debitFixed : cardSettings.debitRate) || 0;
    const credFee = Number(cardSettings.creditFixed !== undefined ? cardSettings.creditFixed : cardSettings.creditRate) || 0;

    if (cardType === 'debito') {
      return debFee > 0
        ? `⚠️ Cartão de Débito: taxa de R$ ${debFee.toFixed(2).replace('.', ',')} da maquininha.`
        : `✅ Cartão de Débito: sem taxa da maquininha (Taxa Grátis)!`;
    }
    if (cardType === 'credito') {
      return credFee > 0
        ? `⚠️ Cartão de Crédito: taxa de R$ ${credFee.toFixed(2).replace('.', ',')} da maquininha.`
        : `✅ Cartão de Crédito: sem taxa da maquininha (Taxa Grátis)!`;
    }

    if (debFee <= 0 && credFee <= 0) {
      return `✅ Pagamentos no cartão (débito ou crédito) não possuem taxa da maquininha.`;
    }
    if (debFee <= 0 && credFee > 0) {
      const credStr = credFee.toFixed(2).replace('.', ',');
      return `💳 Débito: Sem taxa (Grátis) | Crédito: Taxa fixa de R$ ${credStr} da maquininha.`;
    }
    const debStr = debFee.toFixed(2).replace('.', ',');
    const credStr = credFee.toFixed(2).replace('.', ',');
    return `💳 Débito: R$ ${debStr} | Crédito: R$ ${credStr} (taxa da maquininha cobrada pela operadora).`;
  }

  // 3. Débito e Crédito Separados em %
  if (cardSettings.type === 'split') {
    const debRate = Number(cardSettings.debitRate) || 0;
    const credRate = Number(cardSettings.creditRate) || 0;

    if (cardType === 'debito') {
      return debRate > 0
        ? `⚠️ Cartão de Débito: acréscimo de ${debRate.toString().replace('.', ',')}% da maquininha.`
        : `✅ Cartão de Débito: sem taxa da maquininha (Taxa Grátis)!`;
    }
    if (cardType === 'credito') {
      return credRate > 0
        ? `⚠️ Cartão de Crédito: acréscimo de ${credRate.toString().replace('.', ',')}% da maquininha.`
        : `✅ Cartão de Crédito: sem taxa da maquininha (Taxa Grátis)!`;
    }

    if (debRate <= 0 && credRate <= 0) {
      return `✅ Pagamentos no cartão (débito ou crédito) não possuem taxa da maquininha.`;
    }
    if (debRate <= 0 && credRate > 0) {
      const credStr = credRate.toString().replace('.', ',');
      return `💳 Débito: Sem taxa (Grátis) | Crédito: Taxa de ${credStr}% da maquininha.`;
    }
    const debStr = debRate.toString().replace('.', ',');
    const credStr = credRate.toString().replace('.', ',');
    return `⚠️ Pagamentos na maquininha possuem taxa de ${debStr}% no Débito e ${credStr}% no Crédito cobrada pela operadora.`;
  }

  // 4. Porcentagem Geral
  const rate = Number(cardSettings.percentageRate) || 0;
  if (rate <= 0) return '✅ Pagamentos no cartão não possuem taxa da maquininha.';
  const pctStr = rate.toString().replace('.', ',');
  return `⚠️ Pagamentos no cartão possuem acréscimo de ${pctStr}% referente à taxa da maquininha cobrada pela operadora.`;
}

// 11 ACOMPANHAMENTOS OFICIAIS PARA COPOS E BARCAS DE AÇAÍ
export const OFFICIAL_ACAI_COMPLEMENTS = [
  { id: 'pacoca', name: 'Paçoca', icon: '🥜', price: 0, defaultSelected: true, isAvailable: true },
  { id: 'amendoim-torrado', name: 'Amendoim torrado', icon: '🥜', price: 0, defaultSelected: false, isAvailable: true },
  { id: 'leite-em-po', name: 'Leite em pó', icon: '🥛', price: 0, defaultSelected: true, isAvailable: true },
  { id: 'granola-crocante', name: 'Granola crocante', icon: '🥣', price: 0, defaultSelected: true, isAvailable: true },
  { id: 'morango-fresco', name: 'Morango fresco', icon: '🍓', price: 0, defaultSelected: true, isAvailable: true },
  { id: 'banana-fatiada', name: 'Banana fatiada', icon: '🍌', price: 0, defaultSelected: true, isAvailable: true },
  { id: 'kiwi-fresco', name: 'Kiwi fresco', icon: '🥝', price: 0, defaultSelected: false, isAvailable: true },
  { id: 'chocoball', name: 'Chocoball', icon: '🍫', price: 0, defaultSelected: false, isAvailable: true },
  { id: 'ovomaltine', name: 'Ovomaltine', icon: '✨', price: 0, defaultSelected: false, isAvailable: true },
  { id: 'mms', name: "M&M's", icon: '🍬', price: 0, defaultSelected: false, isAvailable: true },
  { id: 'granulado-nobre', name: 'Granulado nobre', icon: '🍫', price: 0, defaultSelected: false, isAvailable: true }
];

export const ACAI_COBERTURAS = [
  { id: 'sem-cobertura', name: 'Sem Cobertura', price: 0, isAvailable: true },
  { id: 'cobertura-morango', name: 'Cobertura de Morango', price: 0, isAvailable: true },
  { id: 'cobertura-chocolate', name: 'Cobertura de Chocolate', price: 0, isAvailable: true },
  { id: 'cobertura-caramelo', name: 'Cobertura de Caramelo', price: 0, isAvailable: true }
];

export const DEFAULT_ACAI_SETTINGS = {
  maxComplementsPerAcai: 0, // 0 = Sem limite
  maxComplementsPerComboBarca: 0, // 0 = Sem limite
  complements: OFFICIAL_ACAI_COMPLEMENTS,
  coberturas: ACAI_COBERTURAS
};

export function normalizeAcaiSettings(raw) {
  if (!raw || typeof raw !== 'object') return DEFAULT_ACAI_SETTINGS;

  const maxAcai = typeof raw.maxComplementsPerAcai === 'number' 
    ? Math.max(0, raw.maxComplementsPerAcai) 
    : (parseInt(raw.maxComplementsPerAcai, 10) || 0);

  const maxCombo = typeof raw.maxComplementsPerComboBarca === 'number' 
    ? Math.max(0, raw.maxComplementsPerComboBarca) 
    : (parseInt(raw.maxComplementsPerComboBarca, 10) || 0);

  let complements = Array.isArray(raw.complements) && raw.complements.length > 0 
    ? raw.complements.map((c, idx) => ({
        id: c.id || `acai_comp_${Date.now()}_${idx}`,
        name: (c.name || 'Adicional').trim(),
        icon: c.icon || '✨',
        price: typeof c.price === 'number' ? Math.max(0, c.price) : (Math.max(0, parseFloat(c.price)) || 0),
        defaultSelected: Boolean(c.defaultSelected),
        isAvailable: c.isAvailable !== false
      }))
    : OFFICIAL_ACAI_COMPLEMENTS;

  let coberturas = [];
  if (Array.isArray(raw.coberturas) && raw.coberturas.length > 0) {
    coberturas = raw.coberturas.map((cb, idx) => {
      if (typeof cb === 'string') {
        const name = cb.trim();
        const cleanId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `cob_${idx}`;
        return {
          id: cleanId,
          name: name,
          price: 0,
          isAvailable: true
        };
      }
      return {
        id: cb.id || `cob_${Date.now()}_${idx}`,
        name: (cb.name || 'Cobertura').trim(),
        price: typeof cb.price === 'number' ? Math.max(0, cb.price) : (Math.max(0, parseFloat(cb.price)) || 0),
        isAvailable: cb.isAvailable !== false
      };
    }).filter(c => Boolean(c.name));
  } else {
    coberturas = ACAI_COBERTURAS;
  }

  // Garante que "Sem Cobertura" esteja sempre presente e no topo
  const hasSemCobertura = coberturas.some(c => (c.name || '').toLowerCase() === 'sem cobertura');
  if (!hasSemCobertura) {
    coberturas = [
      { id: 'sem-cobertura', name: 'Sem Cobertura', price: 0, isAvailable: true },
      ...coberturas
    ];
  }

  return {
    maxComplementsPerAcai: maxAcai,
    maxComplementsPerComboBarca: maxCombo,
    complements,
    coberturas
  };
}

export function getStoredAcaiSettings() {
  try {
    const saved = localStorage.getItem("el_shadday_acai_settings_v1");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return normalizeAcaiSettings(parsed);
      }
    }
  } catch (e) {
    console.error("Error reading stored açaí settings:", e);
  }
  return DEFAULT_ACAI_SETTINGS;
}

export function saveStoredAcaiSettings(settings) {
  try {
    const normalized = normalizeAcaiSettings(settings);
    localStorage.setItem("el_shadday_acai_settings_v1", JSON.stringify(normalized));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent("acai_settings_updated", { detail: normalized }));
    }
    return normalized;
  } catch (e) {
    console.error("Error saving stored açaí settings:", e);
    return DEFAULT_ACAI_SETTINGS;
  }
}

// SABORES OFICIAIS DE DYDYO 2L DISPONÍVEIS NO CARDÁPIO
export const DYDYO_FLAVORS = [
  {
    id: 'guarana',
    name: 'Dydyo Guaraná 2L',
    flavor: 'Guaraná',
    badge: 'Mais Pedido ⭐',
    description: 'Guaraná da Amazônia 2L geladíssimo',
    image: 'https://assets.olaclick.app/companies/products/images/800/a0597d6a-fee7-43a6-99be-e072f6beba77.png'
  },
  {
    id: 'cola',
    name: 'Dydyo Cola 2L',
    flavor: 'Cola',
    badge: 'Regional 🥤',
    description: 'Refrigerante sabor Cola 2L bem gelado',
    image: 'https://assets.olaclick.app/companies/products/images/800/5c0b2454-6874-4f56-850c-2126b597191f.png'
  },
  {
    id: 'laranja',
    name: 'Dydyo Laranja 2L',
    flavor: 'Laranja',
    badge: 'Frutado 🍊',
    description: 'Refrigerante sabor Laranja 2L bem gelado',
    image: 'https://assets.olaclick.app/companies/products/images/800/7a8f04b2-2b44-4e12-bdc7-1c9173c97537.png'
  },
  {
    id: 'limao',
    name: 'Dydyo Limão 2L',
    flavor: 'Limão',
    badge: 'Refrescante 🍋',
    description: 'Refrigerante sabor Limão 2L geladíssimo',
    image: 'https://assets.olaclick.app/companies/products/images/800/a0597d6a-fee7-43a6-99be-e072f6beba77.png'
  }
];
