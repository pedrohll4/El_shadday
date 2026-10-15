import { BRANCHES as INITIAL_BRANCHES, DEFAULT_BRANCH_ID } from '../data/branchesData.js';

const STORAGE_BRANCHES_KEY = 'el_shadday_branches_v2';

export function getStoredBranches() {
  try {
    const raw = localStorage.getItem(STORAGE_BRANCHES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading stored branches:', e);
  }
  // Initialize with default branches
  saveStoredBranches(INITIAL_BRANCHES);
  return INITIAL_BRANCHES;
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

export function createBranch(branchData) {
  const branches = getStoredBranches();
  
  // Format slug id
  const rawId = branchData.id || branchData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const cleanId = rawId.replace(/^-+|-+$/g, '') || `filial-${Date.now()}`;

  if (branches.some(b => b.id === cleanId)) {
    throw new Error(`Já existe uma filial com o identificador "${cleanId}". Escolha outro nome.`);
  }

  const newBranch = {
    id: cleanId,
    name: branchData.name || `Unidade ${branchData.city || 'Nova Filial'}`,
    displayName: branchData.displayName || `${branchData.city || branchData.name} - RO`,
    subtitle: branchData.subtitle || 'Filial Delivery & Balcão',
    status: branchData.status || 'active', // 'active' | 'construction' | 'closed'
    badge: branchData.status === 'active' ? 'Aberta para Pedidos' : 'Em Construção 🚧',
    address: branchData.address || 'Endereço em cadastramento',
    phone: branchData.phone ? branchData.phone.replace(/\D/g, '') : '5569992228682',
    phoneFormatted: branchData.phoneFormatted || branchData.phone || '(69) 99222-8682',
    whatsapp: branchData.whatsapp ? branchData.whatsapp.replace(/\D/g, '') : (branchData.phone ? branchData.phone.replace(/\D/g, '') : '5569992228682'),
    whatsappFormatted: branchData.whatsappFormatted || branchData.whatsapp || branchData.phoneFormatted || branchData.phone || '(69) 99222-8682',
    autoNotifyWhatsApp: branchData.autoNotifyWhatsApp !== false,
    whatsappApiUrl: branchData.whatsappApiUrl || '',
    whatsappApiToken: branchData.whatsappApiToken || '',
    pixKey: branchData.pixKey || '69992228682',
    pixType: branchData.pixType || 'Celular',
    pixName: branchData.pixName || 'El Shadday Delivery',
    deliveryTime: branchData.deliveryTime || '40 - 70 min',
    openingHours: branchData.openingHours || 'Terça a Domingo: 18:00 às 23:30',
    description: branchData.description || 'Pizzas artesanais, massas frescas e esfirras premium.',
    bannerImage: branchData.bannerImage || 'https://assets.olaclick.app/companies/backgrounds/dfd052f1-d436-49bb-a996-f2f05ce0d456.webp',
    createdAt: new Date().toISOString()
  };

  const updated = [...branches, newBranch];
  saveStoredBranches(updated);
  return newBranch;
}

export function updateBranch(branchId, updates) {
  const branches = getStoredBranches();
  const index = branches.findIndex(b => b.id === branchId);
  if (index === -1) throw new Error('Filial não encontrada.');

  const existing = branches[index];
  const updatedBranch = {
    ...existing,
    ...updates,
    badge: updates.status 
      ? (updates.status === 'active' ? 'Aberta para Pedidos' : updates.status === 'construction' ? 'Em Construção 🚧' : 'Fechada Temporariamente')
      : existing.badge,
    updatedAt: new Date().toISOString()
  };

  branches[index] = updatedBranch;
  saveStoredBranches(branches);
  return updatedBranch;
}

export function toggleBranchStatus(branchId) {
  const branches = getStoredBranches();
  const branch = branches.find(b => b.id === branchId);
  if (!branch) throw new Error('Filial não encontrada.');

  const nextStatus = branch.status === 'active' ? 'construction' : 'active';
  return updateBranch(branchId, { status: nextStatus });
}

export function deleteBranch(branchId) {
  if (branchId === DEFAULT_BRANCH_ID || branchId === 'ariquemes') {
    throw new Error('A filial matriz principal não pode ser excluída.');
  }

  const branches = getStoredBranches();
  const filtered = branches.filter(b => b.id !== branchId);
  saveStoredBranches(filtered);
  return true;
}
