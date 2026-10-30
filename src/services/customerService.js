/**
 * Serviço de Gerenciamento e Auto-Preenchimento de Clientes para o El Shadday
 * Cria perfis de clientes automaticamente a partir dos pedidos (site, balcão e delivery)
 * e fornece busca instantânea por nome ou telefone para auto-completar no PDV/Balcão.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { ARIQUEMES_DISTRICTS } from '../data/menuData';

const CUSTOMERS_STORAGE_KEY = 'el_shadday_customers_v1';

// BroadcastChannel para sincronizar perfis entre abas/telas do mesmo dispositivo
const customerChannel = typeof window !== 'undefined' && window.BroadcastChannel
  ? new window.BroadcastChannel('el_shadday_customers_channel')
  : null;

/**
 * Remove acentos e converte para minúsculas para buscas fonéticas
 */
function normalizeString(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Normaliza e formata telefone para exibição
 */
export function formatCustomerPhone(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 13 && digits.startsWith('55')) {
    return `(${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return rawPhone;
}

/**
 * Gera chave única para o cliente (preferencialmente telefone limpo com DDD)
 */
function getCustomerKey(name, phone) {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (cleanPhone.length >= 8) {
    // Se não tem DDD e tem 8/9 dígitos, padroniza com 69 de Rondônia
    const fullPhone = cleanPhone.length <= 9 ? '69' + cleanPhone : cleanPhone;
    return 'tel_' + fullPhone;
  }
  const cleanName = normalizeString(name).replace(/[^a-z0-9]/g, '_');
  return cleanName ? 'nome_' + cleanName : null;
}

/**
 * Retorna todos os clientes armazenados localmente
 */
export function getAllCustomers() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => (b.ordersCount || 1) - (a.ordersCount || 1));
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar clientes do localStorage:', e);
  }
  return [];
}

/**
 * Salva a lista de clientes no localStorage e sincroniza no Supabase
 */
let debounceSyncTimeout = null;

export function saveAllCustomers(customersList) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customersList));
    window.dispatchEvent(new CustomEvent('el_shadday_customers_updated', { detail: customersList }));
    if (customerChannel) {
      customerChannel.postMessage({ type: 'CUSTOMERS_UPDATED', count: customersList.length });
    }
  } catch (e) {
    console.warn('Erro ao salvar clientes localmente:', e);
  }

  // Sincroniza em background com Supabase company_settings (com debounce para não sobrecarregar)
  if (isSupabaseConfigured && supabase) {
    if (debounceSyncTimeout) clearTimeout(debounceSyncTimeout);
    debounceSyncTimeout = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('company_settings')
          .select('card_machine_settings')
          .eq('id', 'el_shadday_config')
          .single();

        const existingSettings = data?.card_machine_settings || {};
        // Guarda os últimos 300 clientes mais frequentes para caber confortavelmente em metadata
        const topCustomers = customersList
          .slice()
          .sort((a, b) => new Date(b.lastOrderAt || 0) - new Date(a.lastOrderAt || 0))
          .slice(0, 300);

        await supabase.from('company_settings').update({
          card_machine_settings: {
            ...existingSettings,
            customers_directory: topCustomers
          }
        }).eq('id', 'el_shadday_config');
      } catch (err) {
        // Falha silenciosa em caso de offline
      }
    }, 3000);
  }
}

/**
 * Grava ou atualiza um perfil de cliente a partir de um pedido (checkout ou balcão)
 * 100% IDEMPOTENTE: rastreia IDs únicos de pedidos para nunca multiplicar contagem ou valor
 */
export function recordCustomerFromOrder(order) {
  if (!order) return null;

  const rawName = (order.customerName || order.customer_name || '').trim();
  const rawPhone = (order.customerPhone || order.customer_phone || '').trim();
  const orderId = String(order.orderId || order.id || '').trim();

  // Se não tem nem nome nem telefone legível, ignora
  if (!rawName && !rawPhone) return null;

  const key = getCustomerKey(rawName, rawPhone);
  if (!key) return null;

  const currentList = getAllCustomers();
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const existingIndex = currentList.findIndex(c => c.key === key || (cleanPhone.length >= 8 && c.cleanPhone === cleanPhone));

  // Extração dos dados de endereço
  const addr = (typeof order.deliveryAddress === 'object' && order.deliveryAddress !== null)
    ? order.deliveryAddress
    : {};

  const street = addr.street || addr.address || order.address || '';
  const number = addr.number || order.number || '';
  const districtName = addr.district || order.district || '';
  const complement = addr.complement || order.complement || '';
  const reference = addr.reference || order.reference || '';
  const isBalcao = order.deliveryType === 'balcao' || order.deliveryType === 'retirada' || addr.isPickup || districtName === 'Balcão';
  const deliveryType = isBalcao ? 'balcao' : 'delivery';

  // Identifica o ID do bairro correspondente em Ariquemes
  const matchedDistrict = ARIQUEMES_DISTRICTS.find(d => 
    normalizeString(d.name) === normalizeString(districtName) ||
    d.id === districtName
  );
  const districtId = matchedDistrict ? matchedDistrict.id : (isBalcao ? 'balcao' : 'setor-03');

  const orderTotal = Number(order.total || 0);
  const orderDate = order.createdAt || new Date().toISOString();

  let customerProfile;

  if (existingIndex >= 0) {
    const existing = currentList[existingIndex];
    const orderIds = Array.isArray(existing.orderIds) ? [...existing.orderIds] : (existing.lastOrderId ? [existing.lastOrderId] : []);
    const isNewOrder = orderId && !orderIds.includes(orderId);
    
    if (isNewOrder) {
      orderIds.push(orderId);
    }

    customerProfile = {
      ...existing,
      name: rawName || existing.name,
      phone: rawPhone || existing.phone,
      phoneFormatted: formatCustomerPhone(rawPhone || existing.phone),
      cleanPhone: cleanPhone || existing.cleanPhone,
      // Se este pedido veio com endereço preenchido, atualiza o endereço preferencial
      ...(street ? { street, address: street } : {}),
      ...(number ? { number } : {}),
      ...(districtName ? { district: districtName, districtId } : {}),
      ...(complement ? { complement } : {}),
      ...(reference ? { reference } : {}),
      deliveryType: deliveryType || existing.deliveryType || 'delivery',
      orderIds: orderIds,
      // Contagem baseada estritamente no tamanho do array de pedidos únicos
      ordersCount: Math.max(1, orderIds.length),
      totalSpent: isNewOrder ? Number((existing.totalSpent || 0) + orderTotal) : (existing.totalSpent || orderTotal),
      lastOrderAt: orderDate,
      lastOrderId: orderId || existing.lastOrderId,
      updatedAt: new Date().toISOString()
    };
    currentList[existingIndex] = customerProfile;
  } else {
    customerProfile = {
      id: 'cust_' + Math.random().toString(36).substring(2, 10),
      key,
      name: rawName || 'Cliente',
      phone: rawPhone,
      phoneFormatted: formatCustomerPhone(rawPhone),
      cleanPhone,
      street,
      address: street,
      number,
      district: districtName || (isBalcao ? 'Balcão' : 'Setor 03'),
      districtId,
      complement,
      reference,
      deliveryType,
      orderIds: orderId ? [orderId] : [],
      ordersCount: 1,
      totalSpent: orderTotal,
      firstOrderAt: orderDate,
      lastOrderAt: orderDate,
      lastOrderId: orderId,
      notes: order.notes || '',
      updatedAt: new Date().toISOString()
    };
    currentList.unshift(customerProfile);
  }

  saveAllCustomers(currentList);
  return customerProfile;
}

/**
 * Reconstrói o catálogo de clientes a partir do histórico completo de pedidos
 * 100% DETERMINÍSTICO E EXATO: agrupa pedidos reais sem acumular em loop
 */
export function backfillCustomersFromOrders(orders = []) {
  if (!Array.isArray(orders) || orders.length === 0) return getAllCustomers();

  // 1. Deduplica a lista de pedidos por orderId
  const uniqueOrdersMap = new Map();
  for (const o of orders) {
    const id = o.orderId || o.id;
    if (id && !uniqueOrdersMap.has(id)) {
      uniqueOrdersMap.set(id, o);
    }
  }
  const uniqueOrders = Array.from(uniqueOrdersMap.values());

  // 2. Agrupa pedidos diretamente por cliente
  const customersMap = new Map();

  // Ordena do mais antigo para o mais novo
  const sortedOrders = uniqueOrders.slice().sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

  for (const order of sortedOrders) {
    const rawName = (order.customerName || order.customer_name || '').trim();
    const rawPhone = (order.customerPhone || order.customer_phone || '').trim();
    if (!rawName && !rawPhone) continue;

    const key = getCustomerKey(rawName, rawPhone);
    if (!key) continue;

    const cleanPhone = rawPhone.replace(/\D/g, '');
    const orderId = String(order.orderId || order.id || '');
    const orderTotal = Number(order.total || 0);
    const orderDate = order.createdAt || new Date().toISOString();

    const addr = (typeof order.deliveryAddress === 'object' && order.deliveryAddress !== null)
      ? order.deliveryAddress
      : {};

    const street = addr.street || addr.address || order.address || '';
    const number = addr.number || order.number || '';
    const districtName = addr.district || order.district || '';
    const complement = addr.complement || order.complement || '';
    const reference = addr.reference || order.reference || '';
    const isBalcao = order.deliveryType === 'balcao' || order.deliveryType === 'retirada' || addr.isPickup || districtName === 'Balcão';
    const deliveryType = isBalcao ? 'balcao' : 'delivery';

    const matchedDistrict = ARIQUEMES_DISTRICTS.find(d => 
      normalizeString(d.name) === normalizeString(districtName) ||
      d.id === districtName
    );
    const districtId = matchedDistrict ? matchedDistrict.id : (isBalcao ? 'balcao' : 'setor-03');

    let profile = customersMap.get(key) || (cleanPhone.length >= 8 ? customersMap.get('tel_' + cleanPhone) : null);

    if (profile) {
      // Se este pedido ainda não foi computado para este cliente, adiciona
      if (orderId && !profile.orderIds.includes(orderId)) {
        profile.orderIds.push(orderId);
        profile.totalSpent = Number((profile.totalSpent + orderTotal).toFixed(2));
        profile.ordersCount = profile.orderIds.length;
      }
      // Atualiza com dados mais recentes se este pedido for mais novo
      if (new Date(orderDate) >= new Date(profile.lastOrderAt || 0)) {
        profile.lastOrderAt = orderDate;
        profile.lastOrderId = orderId;
        if (rawName) profile.name = rawName;
        if (rawPhone) {
          profile.phone = rawPhone;
          profile.phoneFormatted = formatCustomerPhone(rawPhone);
          profile.cleanPhone = cleanPhone;
        }
        if (street) profile.street = profile.address = street;
        if (number) profile.number = number;
        if (districtName) {
          profile.district = districtName;
          profile.districtId = districtId;
        }
        if (complement) profile.complement = complement;
        if (reference) profile.reference = reference;
        profile.deliveryType = deliveryType;
      }
    } else {
      profile = {
        id: 'cust_' + Math.random().toString(36).substring(2, 10),
        key,
        name: rawName || 'Cliente',
        phone: rawPhone,
        phoneFormatted: formatCustomerPhone(rawPhone),
        cleanPhone,
        street,
        address: street,
        number,
        district: districtName || (isBalcao ? 'Balcão' : 'Setor 03'),
        districtId,
        complement,
        reference,
        deliveryType,
        orderIds: orderId ? [orderId] : [],
        ordersCount: 1,
        totalSpent: Number(orderTotal.toFixed(2)),
        firstOrderAt: orderDate,
        lastOrderAt: orderDate,
        lastOrderId: orderId,
        notes: order.notes || '',
        updatedAt: new Date().toISOString()
      };
      customersMap.set(key, profile);
      if (cleanPhone.length >= 8) {
        customersMap.set('tel_' + cleanPhone, profile);
      }
    }
  }

  // Deduplica perfis por id e ordena por frequência
  const uniqueProfiles = Array.from(new Set(Array.from(customersMap.values())));
  uniqueProfiles.sort((a, b) => (b.ordersCount || 1) - (a.ordersCount || 1));
  saveAllCustomers(uniqueProfiles);
  return uniqueProfiles;
}

/**
 * Busca clientes por nome, telefone ou endereço (para autocomplete ultra rápido no PDV)
 */
export function searchCustomers(rawQuery, limit = 6) {
  if (!rawQuery || typeof rawQuery !== 'string') return [];
  const q = normalizeString(rawQuery);
  if (q.length < 2) return [];

  const digitsOnly = rawQuery.replace(/\D/g, '');
  const all = getAllCustomers();

  const scored = [];

  for (const customer of all) {
    let score = 0;
    const nameNorm = normalizeString(customer.name);
    const phoneNorm = (customer.cleanPhone || '').replace(/\D/g, '');
    const districtNorm = normalizeString(customer.district);
    const streetNorm = normalizeString(customer.street || customer.address);

    // 1. Match por nome
    if (nameNorm.startsWith(q)) {
      score += 150; // Começa com o termo digitado (peso máximo)
    } else if (nameNorm.includes(q)) {
      score += 70;
    }

    // 2. Match por telefone
    if (digitsOnly.length >= 2 && phoneNorm.includes(digitsOnly)) {
      if (phoneNorm.startsWith(digitsOnly) || phoneNorm.endsWith(digitsOnly)) {
        score += 130;
      } else {
        score += 80;
      }
    }

    // 3. Match por endereço ou bairro
    if (streetNorm.includes(q) || districtNorm.includes(q)) {
      score += 30;
    }

    if (score > 0) {
      // Bônus para clientes mais fiéis e frequentes
      score += Math.min(50, (customer.ordersCount || 1) * 5);
      scored.push({ customer, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(item => item.customer);
}

/**
 * Sincroniza catálogo de clientes a partir do Supabase na inicialização
 */
export async function syncCustomersFromCloud() {
  if (!isSupabaseConfigured || !supabase) return getAllCustomers();
  try {
    const { data } = await supabase
      .from('company_settings')
      .select('card_machine_settings')
      .eq('id', 'el_shadday_config')
      .single();

    const cloudCustomers = data?.card_machine_settings?.customers_directory;
    if (Array.isArray(cloudCustomers) && cloudCustomers.length > 0) {
      const local = getAllCustomers();
      const map = new Map();
      // Insere primeiro os locais
      local.forEach(c => { if (c.key) map.set(c.key, c); });
      // Mescla com os da nuvem
      cloudCustomers.forEach(c => {
        if (!c.key) return;
        const exist = map.get(c.key);
        if (!exist || new Date(c.updatedAt || 0) > new Date(exist.updatedAt || 0)) {
          map.set(c.key, c);
        }
      });
      const merged = Array.from(map.values()).sort((a, b) => (b.ordersCount || 1) - (a.ordersCount || 1));
      try {
        localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(merged));
      } catch (e) {}
      return merged;
    }
  } catch (err) {}
  return getAllCustomers();
}
