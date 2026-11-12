// Endereço atual da loja (Ariquemes). Usado nas mensagens de WhatsApp e no site.
export const STORE_ADDRESS = 'Av. Canaã, 4065 - Setor 04 (esquina, ao lado da Rumotos), Ariquemes - RO';

// Troca automaticamente o endereço antigo (Rua Maceió / Setor 03) que pode ter
// ficado salvo no navegador ou no banco pelo endereço novo.
export function fixLegacyStoreAddress(address) {
  if (!address || typeof address !== 'string') return address;
  if (/macei[oó]/i.test(address) || /^Av.? Canaã, 4065 - Ariquemes/i.test(address)) return STORE_ADDRESS;
  return address;
}

function migrateBranches(list) {
  let changed = false;
  const fixed = list.map(b => {
    const addr = fixLegacyStoreAddress(b?.address);
    if (b && addr !== b.address) { changed = true; return { ...b, address: addr }; }
    return b;
  });
  return { fixed, changed };
}

export const BRANCHES = [
  {
    id: 'ariquemes',
    name: 'Unidade Ariquemes',
    displayName: 'Ariquemes - RO',
    subtitle: 'Matriz • Delivery & Balcão',
    status: 'active', // 'active' | 'construction' | 'closed'
    badge: 'Aberta para Pedidos',
    address: 'Av. Canaã, 4065 - Setor 04 (esquina, ao lado da Rumotos), Ariquemes - RO',
    phone: '5569992228682',
    phoneFormatted: '(69) 99222-8682',
    whatsapp: '5569992228682',
    whatsappFormatted: '(69) 99222-8682',
    autoNotifyWhatsApp: true,
    whatsappApiUrl: '',
    whatsappApiToken: '',
    pixKey: '69992228682',
    pixType: 'Celular',
    pixName: 'El Shadday Delivery',
    deliveryTime: '45 - 75 min',
    openingHours: 'Terça a Domingo: 18:00 às 23:30',
    description: 'Pioneiros em caixas de esfirras artesanais e pizzas com borda de Catupiry grátis. Entregas em todos os bairros de Ariquemes!',
    bannerImage: 'https://assets.olaclick.app/companies/backgrounds/dfd052f1-d436-49bb-a996-f2f05ce0d456.webp'
  },
  {
    id: 'porto-velho',
    name: 'Unidade Porto Velho',
    displayName: 'Porto Velho - RO',
    subtitle: 'Filial Capital • Em Breve',
    status: 'construction',
    badge: 'Em Construção 🚧',
    address: 'Av. Sete de Setembro, 1200 - Centro, Porto Velho - RO',
    phone: '5569992228682',
    phoneFormatted: '(69) 99222-8682',
    whatsapp: '5569992228682',
    whatsappFormatted: '(69) 99222-8682',
    autoNotifyWhatsApp: true,
    whatsappApiUrl: '',
    whatsappApiToken: '',
    pixKey: '69992228682',
    pixType: 'Celular',
    pixName: 'El Shadday Delivery Porto Velho',
    deliveryTime: 'Inauguração em breve',
    openingHours: 'Obras em andamento',
    description: 'Estamos preparando com muito carinho a melhor estrutura de delivery da capital rondoniense. Aguarde a inauguração!',
    bannerImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80'
  }
];

export const DEFAULT_BRANCH_ID = 'ariquemes';

const STORAGE_BRANCHES_KEY = 'el_shadday_branches_v2';

export function getStoredBranches() {
  try {
    const raw = localStorage.getItem(STORAGE_BRANCHES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const { fixed, changed } = migrateBranches(parsed);
        if (changed) {
          try { localStorage.setItem(STORAGE_BRANCHES_KEY, JSON.stringify(fixed)); } catch (e) {}
        }
        return fixed;
      }
    }
  } catch (e) {
    console.error('Error reading stored branches:', e);
  }
  return BRANCHES;
}

export function saveStoredBranches(branches) {
  try {
    localStorage.setItem(STORAGE_BRANCHES_KEY, JSON.stringify(branches));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('el_shadday_branches_updated', { detail: branches }));
    }
  } catch (e) {
    console.error('Error saving stored branches:', e);
  }
}
