/**
 * Authentication and Multi-Branch User Management Service
 * Roles:
 * - SUPER_ADMIN: Master Admin (consolidated financials, profit, all branches, user creation, branch creation)
 * - BRANCH_ADMIN: Branch Manager (menu pricing, local PDV, local orders, branch metrics)
 * - KITCHEN: Kitchen Staff (dedicated real-time KDS display, order status progression, audio alerts)
 */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  BRANCH_ADMIN: 'BRANCH_ADMIN',
  KITCHEN: 'KITCHEN'
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Admin Master (Diretoria)',
  [ROLES.BRANCH_ADMIN]: 'Admin da Filial (Gerência)',
  [ROLES.KITCHEN]: 'Cozinha (KDS Operacional)'
};

export const ROLE_DESCRIPTIONS = {
  [ROLES.SUPER_ADMIN]: 'Acesso total: faturamento consolidado, lucro, criação de filiais, gestão de usuários e controle de todas as unidades.',
  [ROLES.BRANCH_ADMIN]: 'Acesso à filial: gestão de cardápio, criação de preços, PDV de balcão e relatório local da sua unidade.',
  [ROLES.KITCHEN]: 'Acesso operacional: tela de comandas KDS da cozinha, notificações sonoras e avanço de status dos pedidos da filial.'
};

export const INITIAL_USERS = [
  {
    id: 'user_master_01',
    username: 'admin',
    name: 'Administrador Master',
    role: ROLES.SUPER_ADMIN,
    branchId: 'all',
    branchName: 'Todas as Filiais (Global)',
    password: 'elshadday',
    active: true,
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'user_admin_ariquemes',
    username: 'admin.ariquemes',
    name: 'Gerente Ariquemes',
    role: ROLES.BRANCH_ADMIN,
    branchId: 'ariquemes',
    branchName: 'Unidade Ariquemes',
    password: 'ariquemes123',
    active: true,
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'user_cozinha_ariquemes',
    username: 'cozinha.ariquemes',
    name: 'Cozinha Ariquemes',
    role: ROLES.KITCHEN,
    branchId: 'ariquemes',
    branchName: 'Unidade Ariquemes',
    password: 'ariquemes123',
    active: true,
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'user_admin_portovelho',
    username: 'admin.portovelho',
    name: 'Gerente Porto Velho',
    role: ROLES.BRANCH_ADMIN,
    branchId: 'porto-velho',
    branchName: 'Unidade Porto Velho',
    password: 'portovelho123',
    active: true,
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'user_cozinha_portovelho',
    username: 'cozinha.portovelho',
    name: 'Cozinha Porto Velho',
    role: ROLES.KITCHEN,
    branchId: 'porto-velho',
    branchName: 'Unidade Porto Velho',
    password: 'portovelho123',
    active: true,
    createdAt: '2026-10-01T00:00:00.000Z'
  }
];

const STORAGE_USERS_KEY = 'el_shadday_users_v2';
const STORAGE_CURRENT_USER_KEY = 'el_shadday_current_user';
const STORAGE_AUTH_LEGACY_KEY = 'el_shadday_admin_auth';

export function getStoredUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading stored users:', e);
  }
  // Initialize with defaults if none found
  saveStoredUsers(INITIAL_USERS);
  return INITIAL_USERS;
}

export function saveStoredUsers(users) {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('el_shadday_users_updated', { detail: users }));
    }
  } catch (e) {
    console.error('Error saving stored users:', e);
  }
}

export function getCurrentUser() {
  try {
    const raw = sessionStorage.getItem(STORAGE_CURRENT_USER_KEY) || localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    // Fallback: If legacy auth flag is present without user object, default to Master
    if (sessionStorage.getItem(STORAGE_AUTH_LEGACY_KEY) === 'true') {
      const master = getStoredUsers().find(u => u.role === ROLES.SUPER_ADMIN) || INITIAL_USERS[0];
      setCurrentUser(master);
      return master;
    }
  } catch (e) {
    console.error('Error retrieving current user:', e);
  }
  return null;
}

export function setCurrentUser(user) {
  try {
    if (user) {
      sessionStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
      sessionStorage.setItem(STORAGE_AUTH_LEGACY_KEY, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_CURRENT_USER_KEY);
      sessionStorage.removeItem(STORAGE_AUTH_LEGACY_KEY);
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    }
  } catch (e) {
    console.error('Error saving current user:', e);
  }
}

export function logoutUser() {
  setCurrentUser(null);
}

export function authenticateUser(username, password, options = {}) {
  let cleanUsername = String(username || '').trim().toLowerCase();
  let cleanPassword = String(password || '').trim();

  // If only 1 parameter was supplied, treat as password
  if (!cleanPassword && cleanUsername) {
    cleanPassword = cleanUsername;
    cleanUsername = '';
  }

  const users = getStoredUsers();

  // 1. Exact match by username AND password (PRIMARY & RECOMMENDED)
  if (cleanUsername && cleanPassword) {
    const found = users.find(u => 
      u.username.toLowerCase() === cleanUsername && 
      u.password === cleanPassword &&
      u.active !== false
    );
    if (found) {
      setCurrentUser(found);
      return found;
    }
  }

  // 2. Master fallback: Only if master's current password is 'elshadday'
  const masterUser = users.find(u => u.role === ROLES.SUPER_ADMIN && u.active !== false) || INITIAL_USERS[0];
  if (masterUser && masterUser.password === 'elshadday') {
    if (cleanPassword === 'elshadday' || ((cleanUsername === 'admin' || cleanUsername === 'master') && cleanPassword === 'elshadday')) {
      setCurrentUser(masterUser);
      return masterUser;
    }
  }

  // 3. Match by password with optional role / branch context
  if (cleanPassword) {
    const matchByPass = users.filter(u => u.password === cleanPassword && u.active !== false);
    if (matchByPass.length > 0) {
      // If role specified
      if (options.role) {
        const byRole = matchByPass.find(u => u.role === options.role && (!options.branchId || u.branchId === options.branchId));
        if (byRole) {
          setCurrentUser(byRole);
          return byRole;
        }
      }
      // If branch specified
      if (options.branchId) {
        const byBranch = matchByPass.find(u => u.branchId === options.branchId);
        if (byBranch) {
          setCurrentUser(byBranch);
          return byBranch;
        }
      }
      // Default to first matching user
      const chosen = matchByPass[0];
      setCurrentUser(chosen);
      return chosen;
    }
  }

  // 4. Match username as alias/id
  if (cleanUsername) {
    const byAlias = users.find(u => 
      u.username.toLowerCase() === cleanUsername && 
      u.active !== false
    );
    if (byAlias && (!cleanPassword || byAlias.password === cleanPassword)) {
      setCurrentUser(byAlias);
      return byAlias;
    }
  }

  throw new Error('Usuário ou senha incorretos, ou conta desativada.');
}

export function createUser({ username, password, name, role, branchId, branchName }) {
  const cleanUsername = String(username || '').trim().toLowerCase();
  if (!cleanUsername) throw new Error('Nome de usuário é obrigatório.');
  if (!password || String(password).trim().length < 4) {
    throw new Error('A senha deve ter pelo menos 4 caracteres.');
  }

  const users = getStoredUsers();
  const exists = users.some(u => u.username.toLowerCase() === cleanUsername);
  if (exists) {
    throw new Error(`O usuário "${cleanUsername}" já existe no sistema.`);
  }

  const newUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    username: cleanUsername,
    name: String(name || cleanUsername).trim(),
    role: role || ROLES.BRANCH_ADMIN,
    branchId: role === ROLES.SUPER_ADMIN ? 'all' : (branchId || 'ariquemes'),
    branchName: role === ROLES.SUPER_ADMIN ? 'Todas as Filiais (Global)' : (branchName || 'Unidade Ariquemes'),
    password: String(password).trim(),
    active: true,
    createdAt: new Date().toISOString()
  };

  const updated = [...users, newUser];
  saveStoredUsers(updated);
  return newUser;
}

export function updateUser(userId, updates = {}) {
  const users = getStoredUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) throw new Error('Usuário não encontrado.');

  const existing = users[index];
  const sanitizedUpdates = { ...updates };

  // 1. Tag / Username validation (Unique & Non-empty)
  if (sanitizedUpdates.username !== undefined) {
    const cleanUser = String(sanitizedUpdates.username || '').trim().toLowerCase();
    if (!cleanUser) {
      throw new Error('A tag / nome de usuário não pode ficar em branco.');
    }
    const alreadyExists = users.some(
      u => u.id !== userId && u.username.toLowerCase() === cleanUser
    );
    if (alreadyExists) {
      throw new Error(`A tag/usuário "${cleanUser}" já está em uso por outra conta.`);
    }
    sanitizedUpdates.username = cleanUser;
  }

  // 2. Password validation (Minimum 4 characters if changed)
  if (sanitizedUpdates.password !== undefined && sanitizedUpdates.password !== null) {
    const cleanPass = String(sanitizedUpdates.password).trim();
    if (cleanPass) {
      if (cleanPass.length < 4) {
        throw new Error('A senha deve ter no mínimo 4 caracteres.');
      }
      sanitizedUpdates.password = cleanPass;
    } else {
      // If empty string was passed, keep current password without overwriting
      delete sanitizedUpdates.password;
    }
  }

  // 3. Name validation
  if (sanitizedUpdates.name !== undefined) {
    const cleanName = String(sanitizedUpdates.name || '').trim();
    if (cleanName) {
      sanitizedUpdates.name = cleanName;
    } else if (sanitizedUpdates.username) {
      sanitizedUpdates.name = sanitizedUpdates.username;
    }
  }

  // 4. Role adjustments
  if (sanitizedUpdates.role === ROLES.SUPER_ADMIN) {
    sanitizedUpdates.branchId = 'all';
    sanitizedUpdates.branchName = 'Todas as Filiais (Global)';
  }

  const updatedUser = {
    ...existing,
    ...sanitizedUpdates,
    updatedAt: new Date().toISOString()
  };

  users[index] = updatedUser;
  saveStoredUsers(users);

  // If current logged-in user is updated, refresh active session immediately
  const current = getCurrentUser();
  if (current && current.id === userId) {
    setCurrentUser(updatedUser);
  }

  return updatedUser;
}

export function deleteUser(userId) {
  const users = getStoredUsers();
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error('Usuário não encontrado.');
  if (user.role === ROLES.SUPER_ADMIN && users.filter(u => u.role === ROLES.SUPER_ADMIN).length <= 1) {
    throw new Error('Não é possível excluir o único Admin Master do sistema.');
  }

  const filtered = users.filter(u => u.id !== userId);
  saveStoredUsers(filtered);
  return true;
}

export function resetUserPassword(userId, newPassword) {
  if (!newPassword || String(newPassword).trim().length < 4) {
    throw new Error('A nova senha deve ter no mínimo 4 caracteres.');
  }
  return updateUser(userId, { password: String(newPassword).trim() });
}
