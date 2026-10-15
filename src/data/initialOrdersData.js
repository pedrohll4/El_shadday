export const INITIAL_MULTI_BRANCH_ORDERS = [
  {
    orderId: "ES-1042",
    customerId: "system_demo_user_1",
    branchId: "ariquemes",
    branchName: "Unidade Ariquemes",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min atrás
    customerName: "Carlos Eduardo Santos",
    customerPhone: "(69) 99341-2290",
    deliveryType: "delivery",
    district: "Setor 05",
    address: "Av. Tancredo Neves, 1420 - Setor 05, Ariquemes - RO",
    number: "1420",
    reference: "Próximo à Panificadora Central",
    subtotal: 75,
    deliveryFee: 8,
    cardFee: 0,
    total: 83,
    paymentMethod: "PIX Instantâneo",
    paymentStatus: "PAGO_APROVADO",
    orderStatus: "CONCLUIDO",
    notes: "Massa bem crocante e açaí com bastante leite condensado",
    items: [
      {
        id: "combo-gg-acai",
        name: "1 Pizza Gigante + 1 Barca de Açaí",
        quantity: 1,
        price: 75,
        notes: "Massa bem crocante e açaí com bastante leite condensado"
      }
    ]
  },
  {
    orderId: "ES-1043",
    customerId: "system_demo_user_2",
    branchId: "ariquemes",
    branchName: "Unidade Ariquemes",
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 min atrás
    customerName: "Mariana Alencar",
    customerPhone: "(69) 99201-8843",
    deliveryType: "delivery",
    district: "Jardim das Palmeiras",
    address: "Rua dos Ipês, 310 - Jardim das Palmeiras, Ariquemes - RO",
    number: "310",
    reference: "Casa de esquina, muro cinza",
    subtotal: 55,
    deliveryFee: 8,
    cardFee: 2.20,
    total: 65.20,
    paymentMethod: "Cartão de Crédito",
    paymentStatus: "PAGO_APROVADO",
    orderStatus: "EM_PREPARO",
    notes: "Caprichar no recheio das esfirras doces",
    items: [
      {
        id: "caixa-40-esfirras",
        name: "Caixa com 40 Esfirras Personalizada",
        quantity: 1,
        price: 55,
        isCustomBox: true,
        salgadasDetails: {
          "Calabresa": 15,
          "Carne": 10,
          "Bacon": 8
        },
        docesDetails: {
          "Brigadeiro": 4,
          "Banana com Canela": 3
        }
      }
    ]
  },
  {
    orderId: "ES-1044",
    customerId: "system_demo_user_3",
    branchId: "ariquemes",
    branchName: "Unidade Ariquemes",
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 min atrás
    customerName: "Roberto Lima",
    customerPhone: "(69) 98402-1172",
    deliveryType: "balcao",
    district: "Setor 03",
    address: "Rua Maceió, 2333 - Setor 03, Ariquemes - RO",
    number: "2333",
    reference: "Retirada no balcão",
    subtotal: 65,
    deliveryFee: 0,
    cardFee: 0,
    total: 65,
    paymentMethod: "Dinheiro (Troco p/ R$ 100,00)",
    paymentStatus: "PENDENTE_COBRANCA",
    orderStatus: "RECEBIDO_COZINHA",
    notes: "Pizza metade Frango com Catupiry e metade Calabresa",
    items: [
      {
        id: "combo-1-fm-10esf",
        name: "1 Pizza Família + 10 Esfirras Sortidas",
        quantity: 1,
        price: 65,
        notes: "Pizza metade Frango com Catupiry e metade Calabresa"
      }
    ]
  },
  {
    orderId: "ES-2001",
    customerId: "system_demo_user_pvh1",
    branchId: "porto-velho",
    branchName: "Unidade Porto Velho",
    createdAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
    customerName: "Dra. Larissa Medeiros",
    customerPhone: "(69) 99912-3456",
    deliveryType: "delivery",
    district: "Olaria",
    address: "Av. Pinheiro Machado, 2100 - Olaria, Porto Velho - RO",
    number: "2100",
    reference: "Edifício Rio Madeira, Apto 502",
    subtotal: 110,
    deliveryFee: 10,
    cardFee: 0,
    total: 120,
    paymentMethod: "PIX Instantâneo",
    paymentStatus: "PAGO_APROVADO",
    orderStatus: "CONCLUIDO",
    notes: "Enviar com sachês de maionese temperada e ketchup",
    items: [
      {
        id: "combo-super-pvh",
        name: "1 Pizza Gigante + 20 Esfirras + Refri 2L",
        quantity: 1,
        price: 110
      }
    ]
  },
  {
    orderId: "ES-2002",
    customerId: "system_demo_user_pvh2",
    branchId: "porto-velho",
    branchName: "Unidade Porto Velho",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    customerName: "Fernando Cavalcante",
    customerPhone: "(69) 98114-9988",
    deliveryType: "delivery",
    district: "São Cristóvão",
    address: "Rua Duque de Caxias, 850 - São Cristóvão, Porto Velho - RO",
    number: "850",
    reference: "Próximo à Praça das Três Caixas D'Água",
    subtotal: 85,
    deliveryFee: 10,
    cardFee: 2.90,
    total: 97.90,
    paymentMethod: "Cartão de Crédito",
    paymentStatus: "PAGO_APROVADO",
    orderStatus: "EM_PREPARO",
    notes: "Borda recheada bem caprichada",
    items: [
      {
        id: "pizza-gigante-especial",
        name: "Pizza Gigante 12 Pedaços (Especial)",
        quantity: 1,
        price: 65
      },
      {
        id: "esfirras-doces-10",
        name: "Caixa 10 Esfirras Doces Gourmet",
        quantity: 1,
        price: 20
      }
    ]
  }
];

export const INITIAL_ORDERS = INITIAL_MULTI_BRANCH_ORDERS;
