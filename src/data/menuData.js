import { isSupabaseConfigured } from '../services/supabaseClient.js';

export const RESTAURANT_INFO = {
  name: "El Shadday Delivery Esfirraria e Pizzaria",
  shortName: "El Shadday",
  phone: "5569992228682",
  phoneFormatted: "(69) 99222-8682",
  address: "Av Canaã, 4065 - Ariquemes - RO, 76875-818",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=-9.9130722,-63.0289001",
  deliveryTime: "45 - 75 min",
  openingHours: "Terça a Sexta: 09:00 às 11:30 e 16:00 às 23:00 | Sábado: 18:00 às 23:00 | Domingo: 16:00 às 23:00 (Segunda fechado)",
  pixKey: "69992228682",
  pixType: "Telefone / Celular",
  pixName: "El Shadday Esfirraria",
  history: "Mais de 15 anos de tradição em Ariquemes! Pioneiros em caixas de esfirras artesanais, entregando sabor inesquecível e massas frescas todos os dias.",
  logoUrl: "https://assets.olaclick.app/companies/logos/67bb7c61-2505-4b36-a16c-6a4979bb3651.png",
  bannerUrl: "https://assets.olaclick.app/companies/backgrounds/dfd052f1-d436-49bb-a996-f2f05ce0d456.webp",
  cardMachineSettings: {
    active: true,
    type: 'percentage', // 'percentage' | 'fixed' | 'split'
    percentageRate: 3.5, // taxa percentual ex: 3.5%
    fixedRate: 2.00, // taxa fixa ex: R$ 2,00
    debitRate: 2.0, // taxa débito ex: 2.0%
    creditRate: 4.5, // taxa crédito ex: 4.5%
    autoAddToTotal: true, // soma no total do pedido
    customNotice: "⚠️ Pagamentos no cartão (débito ou crédito) possuem acréscimo referente à taxa da maquininha cobrada pela operadora."
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
    description: "Sal e doce na medida certa! 1 Pizza Família 8 fatias (até 2 sabores com borda grátis) + 1 Barca de Açaí trufada com até 5 adicionais generosos.",
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
    description: "1 Pizza Gigante 12 fatias (até 3 sabores com borda de Catupiry grátis) + 1 Barca de Açaí com até 5 adicionais generosos à escolha.",
    price: 75.00,
    originalPrice: 80.00,
    badge: "Sucesso Absoluto 🏆",
    bordaGratis: true,
    image: "https://assets.olaclick.app/companies/products/images/800/b8ac4f80-f52f-4cea-87ba-863ad904669f.jpeg",
    details: "Pizza Gigante + Barca de Açaí com 5 adicionais."
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
    description: "A clássica da El Shadday: 20 esfirras sortidas (15 salgadas + 5 doces). Máx. 3 por salgada e 1 por doce. Opção sem carne suína disponível! *No crédito: R$ 40,00.",
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
    description: "Conjunto perfeito para compartilhar: 30 esfirras sortidas (22 salgadas + 8 doces). Máx. 4 por salgada e 1 por doce. Opção sem suínos! *No crédito: R$ 50,00.",
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
    description: "Conjunto com 40 esfirras sortidas (33 salgadas + 7 doces). Máx. 5 por salgada (carne máx. 5) e 2 por doce. Opção sem suínos! *No crédito: R$ 60,00.",
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
    description: "A super caixa da El Shadday: 50 esfirras sortidas (40 salgadas + 10 doces). Máx. 10 por salgada (carne máx. 5) e 2 por doce. Opção sem suínos! *No crédito: R$ 75,00.",
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
  // PIZZAS (4 ITENS)
  // ==========================================
  {
    id: "pizza-familia-salgada",
    categoryId: "pizzas",
    name: "Pizza Família (8 Fatias - até 2 Sabores)",
    description: "Menu de Pizzas, selecione dois sabores que desejar. Valor base de R$ 40,00 (pode variar com sabores especiais). Vai com BORDA DE CATUPIRY GRÁTIS!",
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
    description: "Menu de Pizzas, selecione três sabores que desejar. Valor base de R$ 50,00 (pode variar com sabores especiais). Vai com BORDA DE CATUPIRY GRÁTIS!",
    price: 50.00,
    badge: "Borda Grátis 🧀",
    bordaGratis: true,
    isPizzaCustomizer: true,
    tamanho: "Gigante (12 fatias)",
    maxSabores: 3,
    image: "https://assets.olaclick.app/companies/products/images/800/1ecaf28b-a823-4aeb-8dff-a779c79204a9.png"
  },
  {
    id: "pizza-doce-1sabor",
    categoryId: "pizzas",
    name: "Pizzas Doces (1 Sabor)",
    description: "Cardápio de pizzas doces com massa crocante e recheio generoso. Escolha a opção desejada (1 sabor).",
    price: 13.00,
    variants: [
      { name: "Família (8 fatias)", price: 13.00 },
      { name: "Gigante (12 fatias)", price: 23.00 }
    ],
    image: "https://assets.olaclick.app/companies/products/images/800/b04b0953-8414-4284-aa40-0b323143fc97.png"
  },
  {
    id: "pizza-doce-2-3-sabores",
    categoryId: "pizzas",
    name: "Pizzas Doces (2 ou 3 Sabores)",
    description: "Cardápio de pizzas doces, monte com 2 ou 3 sabores à sua escolha para saborear o melhor da El Shadday.",
    price: 23.00,
    variants: [
      { name: "Família (8 fatias)", price: 23.00 },
      { name: "Gigante (12 fatias)", price: 33.00 }
    ],
    image: "https://assets.olaclick.app/companies/products/images/800/92c9d90d-851c-4044-8ba3-e460c12b5c36.png"
  },

  // ==========================================
  // AÇAÍ & BARCAS (4 ITENS)
  // ==========================================
  {
    id: "barca-acai-especial",
    categoryId: "acai",
    name: "Barca de Açaí Especial",
    description: "A famosa barca de açaí da El Shadday! Açaí cremoso de altíssima qualidade trufado, servido na barca com até 5 adicionais generosos: Leite em pó, Leite condensado, Granola, Paçoca, Banana fatiada e Coberturas.",
    price: 35.00,
    originalPrice: 40.00,
    badge: "Sucesso da Casa 🍧",
    image: "/barca_acai.jpg",
    details: "Açaí cremoso trufado + até 5 adicionais generosos à sua escolha."
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

export const INITIAL_PIZZA_FLAVORS = [
  {
    id: "calabresa",
    name: "Calabresa Especial com Cebola",
    price: 40.00,
    category: "salgadas",
    description: "Molho artesanal, queijo muçarela derretido, calabresa fatiada crocante, cebola e orégano.",
    isAvailable: true
  },
  {
    id: "mucarela",
    name: "Muçarela Tradicional",
    price: 40.00,
    category: "salgadas",
    description: "Muçarela de primeira qualidade, molho artesanal e orégano perfumado.",
    isAvailable: true
  },
  {
    id: "dois-queijos",
    name: "Dois Queijos Cremoso",
    price: 40.00,
    category: "salgadas",
    description: "Combinação saborosa de muçarela especial e queijo cremoso com orégano.",
    isAvailable: true
  },
  {
    id: "frango-catupiry",
    name: "Frango com Catupiry",
    price: 40.00,
    category: "salgadas",
    description: "Peito de frango desfiado temperado, muçarela, legítimo Catupiry cremoso e orégano.",
    isAvailable: true
  },
  {
    id: "frango-cheddar",
    name: "Frango com Cheddar",
    price: 40.00,
    category: "salgadas",
    description: "Frango desfiado suculento, muçarela e delicioso queijo cheddar derretido.",
    isAvailable: true
  },
  {
    id: "vegetariana",
    name: "Vegetariana da Casa",
    price: 40.00,
    category: "salgadas",
    description: "Milho verde, ervilha fresca, azeitona, muçarela, cebola crocante e orégano.",
    isAvailable: true
  },
  {
    id: "calabresa-picadinha",
    name: "Calabresa Picadinha com Ervilha",
    price: 40.00,
    category: "salgadas",
    description: "Calabresa picadinha especial, ervilhas frescas, queijo muçarela e orégano.",
    isAvailable: true
  },
  {
    id: "bacon-crocante",
    name: "Bacon Crocante",
    price: 40.00,
    category: "salgadas",
    description: "Cubos de bacon dourados e crocantes, queijo muçarela derretido e orégano.",
    isAvailable: true
  },
  {
    id: "romanesca",
    name: "Romanesca",
    price: 40.00,
    category: "salgadas",
    description: "Receita especial com muçarela, presunto, champignon e orégano.",
    isAvailable: true
  },
  {
    id: "hot-dog",
    name: "Hot-Dog Especial",
    price: 40.00,
    category: "salgadas",
    description: "Molho artesanal, muçarela, salsicha fatiada selecionada, milho e batata palha.",
    isAvailable: true
  },
  {
    id: "baiana-apimentada",
    name: "Baiana Apimentada",
    price: 40.00,
    category: "salgadas",
    description: "Calabresa moída, pimenta calabresa selecionada, cebola, ovos e muçarela.",
    isAvailable: true
  },
  {
    id: "frango-milho",
    name: "Frango com Milho",
    price: 40.00,
    category: "salgadas",
    description: "Frango desfiado suculento, milho verde selecionado e queijo muçarela.",
    isAvailable: true
  },
  {
    id: "milho",
    name: "Milho Verde com Queijo",
    price: 40.00,
    category: "salgadas",
    description: "Milho verde doce e suculento, muçarela derretida e orégano.",
    isAvailable: true
  },
  {
    id: "calabresa-catupiry",
    name: "Calabresa com Catupiry (Gourmet)",
    price: 50.00,
    category: "especiais",
    description: "Fatias de calabresa artesanal combinadas com o legítimo Catupiry cremoso e muçarela.",
    isAvailable: true
  },
  {
    id: "carne-seca",
    name: "Carne Seca com Catupiry (Gourmet)",
    price: 65.00,
    category: "especiais",
    description: "Carne seca desfiada de primeiríssima qualidade com generoso Catupiry cremoso.",
    isAvailable: true
  },
  {
    id: "strogonoff-frango",
    name: "Strogonoff de Frango (Especial)",
    price: 55.00,
    category: "especiais",
    description: "Strogonoff de frango cremoso feito na hora, muçarela e batata palha crocante.",
    isAvailable: true
  },
  {
    id: "lombo-abacaxi",
    name: "Lombo com Abacaxi (Especial)",
    price: 65.00,
    category: "especiais",
    description: "Lombo canadense fatiado, pedaços doces de abacaxi e queijo muçarela derretido.",
    isAvailable: true
  },
  {
    id: "lombo-portuguesa",
    name: "Lombo à Portuguesa (Especial)",
    price: 65.00,
    category: "especiais",
    description: "Lombo especial com cebola, ovos, azeitonas selecionadas e muçarela.",
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

export function getStoredProducts() {
  try {
    const saved = localStorage.getItem("el_shadday_delivery_products_v2");
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading stored products:", e);
  }
  return PRODUCTS;
}

export function saveStoredProducts(products) {
  try {
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
    const saved = localStorage.getItem("el_shadday_pizza_flavors_v2");
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => {
          if (typeof item === 'string') {
            return {
              id: `flavor-${item.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              name: item,
              price: 40.00,
              category: 'salgadas',
              description: '',
              isAvailable: true
            };
          }
          return {
            id: item.id || `flavor-${Date.now()}-${idx}`,
            name: item.name || '',
            price: typeof item.price === 'number' ? item.price : (parseFloat(item.price) || 40.00),
            category: item.category || 'salgadas',
            description: item.description || '',
            isAvailable: item.isAvailable !== false
          };
        });
      }
    }
  } catch (e) {
    console.error("Error reading stored pizza flavors:", e);
  }
  return INITIAL_PIZZA_FLAVORS;
}

export function saveStoredPizzaFlavors(flavors) {
  try {
    localStorage.setItem("el_shadday_pizza_flavors_v2", JSON.stringify(flavors));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent("pizza_flavors_updated", { detail: flavors }));
    }
  } catch (e) {
    console.error("Error saving stored pizza flavors:", e);
  }
}

/**
 * Regra de cálculo de Pizza por Sabor (Regra do Estabelecimento):
 * - Se os sabores tiverem preço igual ou inferior ao preço base da pizza, mantém o preço base.
 * - Se algum sabor escolhido for maior que o preço base, puxa para o MAIOR valor entre os sabores escolhidos.
 */
export function calculatePizzaPrice(basePrice, selectedFlavors) {
  const base = Number(basePrice) || 0;
  if (!selectedFlavors || selectedFlavors.length === 0) {
    return base;
  }
  
  const flavorPrices = selectedFlavors.map(f => {
    if (!f) return 0;
    if (typeof f === 'object') {
      return Number(f.price) || 0;
    }
    const stored = getStoredPizzaFlavors();
    const found = stored.find(s => s.name === f);
    return found ? (Number(found.price) || 0) : 0;
  });

  const maxFlavorPrice = Math.max(0, ...flavorPrices);
  return Math.max(base, maxFlavorPrice);
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

  if (cardSettings.type === 'fixed') {
    return Math.max(0, Number(cardSettings.fixedRate) || 0);
  }
  if (cardSettings.type === 'split') {
    const rate = cardType === 'debito' 
      ? (Number(cardSettings.debitRate) || 0) 
      : (Number(cardSettings.creditRate) || 0);
    return Math.round((numSubtotal * (rate / 100)) * 100) / 100;
  }
  const rate = Number(cardSettings.percentageRate) || 0;
  return Math.round((numSubtotal * (rate / 100)) * 100) / 100;
}

/**
 * Retorna o texto formatado do aviso da taxa da maquininha
 * @param {object} cardSettings 
 * @returns {string}
 */
export function getCardMachineNoticeText(cardSettings) {
  if (!cardSettings || cardSettings.active === false) return '';
  if (cardSettings.customNotice && cardSettings.customNotice.trim()) {
    return cardSettings.customNotice.trim();
  }
  if (cardSettings.type === 'fixed') {
    const feeStr = (Number(cardSettings.fixedRate) || 0).toFixed(2).replace('.', ',');
    return `⚠️ Pagamentos no cartão possuem taxa fixa de R$ ${feeStr} da maquininha cobrada pela operadora.`;
  }
  if (cardSettings.type === 'split') {
    const debStr = (Number(cardSettings.debitRate) || 0).toString().replace('.', ',');
    const credStr = (Number(cardSettings.creditRate) || 0).toString().replace('.', ',');
    return `⚠️ Pagamentos na maquininha possuem taxa de ${debStr}% no Débito e ${credStr}% no Crédito cobrada pela operadora.`;
  }
  const pctStr = (Number(cardSettings.percentageRate) || 0).toString().replace('.', ',');
  return `⚠️ Pagamentos no cartão possuem acréscimo de ${pctStr}% referente à taxa da maquininha cobrada pela operadora.`;
}
