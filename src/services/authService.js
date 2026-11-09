import { supabase, isSupabaseConfigured } from './supabaseClient';

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

// ==============================================================================
// LOGIN SEGURO (Supabase Auth)
// Depois que o supabase_security.sql é aplicado, as senhas são conferidas no
// servidor e o banco só libera pedidos/configurações para a equipe logada.
// Antes disso, o modo antigo (local) continua funcionando para ninguém ficar
// trancado para fora durante a atualização.
// ==============================================================================
const STAFF_EMAIL_DOMAIN = '@elshadday.local';
const USERS_CACHE_KEY = 'el_shadday_users_cache_v3';
let secureModePromise = null;

export function staffEmailFor(username) {
  return String(username || '').trim().toLowerCase() + STAFF_EMAIL_DOMAIN;
}

/** true quando o banco já tem o login seguro (função my_profile existe) */
export function isSecureAuthEnabled() {
  if (!isSupabaseConfigured || !supabase) return Promise.resolve(false);
  if (!secureModePromise) {
    secureModePromise = supabase.rpc('my_profile').then(({ error }) => {
      if (!error) return true;
      const missing = error.code === 'PGRST202' || /could not find the function/i.test(error.message || '');
      if (missing) {
        secureModePromise = null; // verifica de novo na próxima vez (o SQL pode ser aplicado a qualquer momento)
        return false;
      }
      return true; // erro de permissão/rede: trata como seguro (nunca cai no modo antigo por engano)
    }).catch(() => true);
  }
  return secureModePromise;
}

async function fetchMyProfile() {
  const { data, error } = await supabase.rpc('my_profile');
  if (error) throw new Error(error.message);
  return data || null;
}

/**
 * Confere a sessão salva ao abrir o app. Retorna o usuário logado ou null.
 * Se o login seguro está ativo e não há sessão válida, limpa o usuário em cache.
 */
export async function restoreSession() {
  if (!(await isSecureAuthEnabled())) return getCurrentUser();
  try {
    const { data } = await supabase.auth.getSession();
    if (!data?.session) {
      setCurrentUser(null);
      return null;
    }
    const profile = await fetchMyProfile();
    if (!profile) {
      await supabase.auth.signOut().catch(() => {});
      setCurrentUser(null);
      return null;
    }
    setCurrentUser(profile);
    return profile;
  } catch (e) {
    // Sem internet: mantém o que está em cache; o banco continua protegido de qualquer forma
    return getCurrentUser();
  }
}

if (typeof window !== 'undefined' && isSupabaseConfigured && supabase) {
  try {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        const had = getCurrentUser();
        try {
          sessionStorage.removeItem(STORAGE_CURRENT_USER_KEY);
          sessionStorage.removeItem(STORAGE_AUTH_LEGACY_KEY);
        } catch (e) {}
        if (had) window.dispatchEvent(new CustomEvent('el_shadday_auth_signed_out'));
      }
    });
  } catch (e) {}
}

function cacheUsers(list) {
  try {
    localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('el_shadday_users_updated', { detail: list }));
  } catch (e) {}
}

function rpcErrorMessage(error, fallback) {
  const msg = error?.message || '';
  if (/permission denied|not authorized|JWT/i.test(msg)) return 'Sessão expirada ou sem permissão. Entre novamente.';
  return msg || fallback;
}

/** Lista de usuários (assíncrona). No modo seguro vem do servidor. */
export async function fetchUsers() {
  if (await isSecureAuthEnabled()) {
    const { data, error } = await supabase.rpc('list_app_users');
    if (error) throw new Error(rpcErrorMessage(error, 'Erro ao carregar usuários.'));
    const list = Array.isArray(data) ? data : [];
    cacheUsers(list);
    return list;
  }
  return getLegacyUsers();
}

// Modo antigo (somente até o supabase_security.sql ser aplicado)
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

function getLegacyUsers() {
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
  saveLegacyUsers(INITIAL_USERS);
  return INITIAL_USERS;
}

function saveLegacyUsers(users) {
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
    // (Removido: antes, só a "flag" de login no navegador já virava Admin Master.)
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
  if (isSupabaseConfigured && supabase) {
    supabase.auth.signOut().catch(() => {});
  }
}

export async function authenticateUser(username, password, options = {}) {
  if (await isSecureAuthEnabled()) {
    const cleanUser = String(username || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();
    if (!cleanUser || !cleanPass) throw new Error('Informe usuário e senha.');
    const { error } = await supabase.auth.signInWithPassword({ email: staffEmailFor(cleanUser), password: cleanPass });
    if (error) {
      if (/fetch|network/i.test(error.message || '')) throw new Error('Sem conexão com o servidor. Verifique a internet.');
      throw new Error('Usuário ou senha incorretos, ou conta desativada.');
    }
    const profile = await fetchMyProfile().catch(() => null);
    if (!profile) {
      await supabase.auth.signOut().catch(() => {});
      throw new Error('Usuário ou senha incorretos, ou conta desativada.');
    }
    setCurrentUser(profile);
    return profile;
  }
  return legacyAuthenticate(username, password, options);
}

function legacyAuthenticate(username, password, options = {}) {
  let cleanUsername = String(username || '').trim().toLowerCase();
  let cleanPassword = String(password || '').trim();

  // If only 1 parameter was supplied, treat as password
  if (!cleanPassword && cleanUsername) {
    cleanPassword = cleanUsername;
    cleanUsername = '';
  }

  const users = getLegacyUsers();

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

export async function createUser(data) {
  if (await isSecureAuthEnabled()) {
    const { username, password, name, role, branchId, branchName } = data || {};
    const { data: user, error } = await supabase.rpc('admin_create_user', {
      p_username: String(username || '').trim().toLowerCase(),
      p_password: String(password || '').trim(),
      p_name: String(name || '').trim(),
      p_role: role || ROLES.BRANCH_ADMIN,
      p_branch_id: branchId || '',
      p_branch_name: branchName || ''
    });
    if (error) throw new Error(rpcErrorMessage(error, 'Erro ao criar usuário.'));
    return user;
  }
  return legacyCreateUser(data);
}

function legacyCreateUser({ username, password, name, role, branchId, branchName }) {
  const cleanUsername = String(username || '').trim().toLowerCase();
  if (!cleanUsername) throw new Error('Nome de usuário é obrigatório.');
  if (!password || String(password).trim().length < 4) {
    throw new Error('A senha deve ter pelo menos 4 caracteres.');
  }

  const users = getLegacyUsers();
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
  saveLegacyUsers(updated);
  return newUser;
}

export async function updateUser(userId, updates = {}) {
  if (await isSecureAuthEnabled()) {
    const payload = {};
    ['username', 'name', 'role', 'branchId', 'branchName', 'active', 'password'].forEach(k => {
      if (updates[k] !== undefined && updates[k] !== null) payload[k] = updates[k];
    });
    if (payload.password !== undefined && !String(payload.password).trim()) delete payload.password;
    const { data: user, error } = await supabase.rpc('admin_update_user', { p_id: userId, p_updates: payload });
    if (error) throw new Error(rpcErrorMessage(error, 'Erro ao atualizar usuário.'));
    const current = getCurrentUser();
    if (current && current.id === userId && user) setCurrentUser(user);
    return user;
  }
  return legacyUpdateUser(userId, updates);
}

function legacyUpdateUser(userId, updates = {}) {
  const users = getLegacyUsers();
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
  saveLegacyUsers(users);

  // If current logged-in user is updated, refresh active session immediately
  const current = getCurrentUser();
  if (current && current.id === userId) {
    setCurrentUser(updatedUser);
  }

  return updatedUser;
}

export async function deleteUser(userId) {
  if (await isSecureAuthEnabled()) {
    const { error } = await supabase.rpc('admin_delete_user', { p_id: userId });
    if (error) throw new Error(rpcErrorMessage(error, 'Erro ao excluir usuário.'));
    return true;
  }
  return legacyDeleteUser(userId);
}

function legacyDeleteUser(userId) {
  const users = getLegacyUsers();
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error('Usuário não encontrado.');
  if (user.role === ROLES.SUPER_ADMIN && users.filter(u => u.role === ROLES.SUPER_ADMIN).length <= 1) {
    throw new Error('Não é possível excluir o único Admin Master do sistema.');
  }

  const filtered = users.filter(u => u.id !== userId);
  saveLegacyUsers(filtered);
  return true;
}

export async function resetUserPassword(userId, newPassword) {
  if (!newPassword || String(newPassword).trim().length < 6) {
    throw new Error('A nova senha deve ter no mínimo 6 caracteres.');
  }
  return updateUser(userId, { password: String(newPassword).trim() });
}

/** Último resultado de fetchUsers() (sem senhas). Use fetchUsers() para dados atualizados. */
export function getStoredUsers() {
  try {
    const raw = localStorage.getItem(USERS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}
