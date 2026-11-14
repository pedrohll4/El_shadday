/**
 * Real-Time Orders Synchronization Service for El Shadday KDS
 * Connects customer phones, admin panels, and kitchen screens across the internet in real time.
 * Supports Supabase Realtime (PostgreSQL) with automatic fallback to BroadcastChannel and SSE Cloud.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { recordCustomerFromOrder } from './customerService';

const SYNC_TOPIC = 'el-shadday-kds-ariquemes-v2';
const NTFY_BASE_URL = `https://ntfy.sh/${SYNC_TOPIC}`;

// SEGURANÇA/LGPD: o tópico ntfy.sh é PÚBLICO (qualquer pessoa lê e publica nele).
// Com o Supabase ativo, ele não é usado: nem para enviar dados de clientes,
// nem para receber comandos (ex.: "limpar todos os pedidos" forjado por terceiros).
const shouldUseNtfyFallback = () => !(isSupabaseConfigured && supabase);

// Converte "50,00", "R$ 50" etc. em número (coluna NUMERIC no banco); inválido vira null
const toNumberOrNull = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  const cleaned = String(val).replace(/[^0-9,.-]/g, '').replace(/\.(?=.*[.,])/g, '').replace(',', '.');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

// BroadcastChannel for cross-tab local sync on same device
const localChannel = typeof window !== 'undefined' && window.BroadcastChannel 
  ? new window.BroadcastChannel('el_shadday_orders_channel') 
  : null;

/**
 * Standardize order status across all layers
 */
export function normalizeOrderStatus(orderOrStatus) {
  if (!orderOrStatus) return 'RECEBIDO_COZINHA';
  const raw = typeof orderOrStatus === 'string'
    ? orderOrStatus
    : (orderOrStatus.orderStatus || orderOrStatus.status || orderOrStatus.order_status || '');
  const s = String(raw).toUpperCase().trim();

  if (s === 'CANCELADO' || s === 'CANCELED' || s === 'CANCELLED') return 'CANCELADO';
  if (s === 'CONCLUIDO' || s === 'CONCLUÍDO' || s === 'FINALIZADO' || s === 'ENTREGUE' || s === 'DONE' || s === 'COMPLETED') return 'CONCLUIDO';
  if (s === 'PRONTO' || s === 'PRONTO_BALCAO' || s === 'BALCAO' || s === 'RETIRADA' || s === 'READY') return 'PRONTO_BALCAO';
  if (s === 'SAIU_ENTREGA' || s === 'ENTREGA' || s === 'EM_ENTREGA' || s === 'DESPACHADO' || s === 'DELIVERY' || s === 'ROTA') return 'SAIU_ENTREGA';
  if (s === 'EM_PREPARO' || s === 'PREPARO' || s === 'NO_FORNO' || s === 'FORNO' || s === 'PREPARING') return 'EM_PREPARO';
  return 'RECEBIDO_COZINHA';
}

/**
 * Calculate the next daily sequential order number starting from 1.
 * Increments sequentially: 1, 2, 3...
 */
export function getNextOrderNumber(existingOrders = []) {
  try {
    const todayPrefix = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    let maxNum = 0;

    // 1. Check orders passed in memory
    if (Array.isArray(existingOrders)) {
      existingOrders.forEach(o => {
        if (!o) return;
        const num = Number(o.orderNumber);
        if (!isNaN(num) && num > maxNum && num < 1000) {
          maxNum = num;
        } else if (o.orderId) {
          const clean = String(o.orderId).replace(/^ES-/, '');
          const p = parseInt(clean, 10);
          if (!isNaN(p) && p > maxNum && p < 1000) {
            maxNum = p;
          }
        }
      });
    }

    // 2. Check localStorage saved orders
    try {
      const saved = localStorage.getItem('el_shadday_all_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach(o => {
            if (!o) return;
            const num = Number(o.orderNumber);
            if (!isNaN(num) && num > maxNum && num < 1000) {
              maxNum = num;
            } else if (o.orderId) {
              const clean = String(o.orderId).replace(/^ES-/, '');
              const p = parseInt(clean, 10);
              if (!isNaN(p) && p > maxNum && p < 1000) {
                maxNum = p;
              }
            }
          });
        }
      }
    } catch (e) {}

    // 3. Check persistent daily sequence in localStorage
    try {
      const storedSeq = localStorage.getItem('el_shadday_daily_seq_v2');
      if (storedSeq) {
        const parsedSeq = JSON.parse(storedSeq);
        if (parsedSeq?.date === todayPrefix && Number(parsedSeq?.lastNumber) > maxNum) {
          maxNum = Number(parsedSeq.lastNumber);
        }
      }
    } catch (e) {}

    const next = maxNum + 1;
    try {
      localStorage.setItem('el_shadday_daily_seq_v2', JSON.stringify({ date: todayPrefix, lastNumber: next }));
    } catch (e) {}

    return next;
  } catch (e) {
    return 1;
  }
}

/**
 * Reserva o próximo número de pedido NO BANCO (único para todos os aparelhos).
 * Antes, cada celular contava sozinho a partir do #01 e um cliente novo
 * sobrescrevia o pedido de outro com o mesmo número.
 */
// Sufixo do turno atual: deixa o ID no banco único mesmo quando a contagem
// volta para #01 depois do fechamento de caixa (ex.: "01-k3x9ab").
let currentShiftTag = '';

// Número visível de um ID ("65" -> 65, "01-k3x9ab" -> 1)
export function parseOrderSeq(id) {
  const m = /^(?:ES-)?(\d{1,6})(?:-|$)/.exec(String(id || ''));
  return m ? Number(m[1]) : NaN;
}

// Monta o ID do pedido para o número reservado (usa o sufixo do turno atual)
export function buildOrderId(orderNumber) {
  const padded = String(orderNumber).padStart(2, '0');
  return currentShiftTag ? `${padded}-${currentShiftTag}` : padded;
}

/**
 * Contagem diária: o número recomeça do #01 depois de cada fechamento de caixa
 * (manual ou automático). Conta só os pedidos do turno aberto = criados depois
 * do último fechamento e ainda sem shift_closed_at. Olha as últimas 12h
 * (mesma janela que a chave pública enxerga), então cliente e equipe contam igual.
 * Retorna null se o banco não tiver a coluna shift_closed_at (usa o modo antigo).
 */
async function nextShiftOrderNumber() {
  const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at, shift_closed_at')
    .gt('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error || !Array.isArray(data)) return null;

  let lastClose = 0;
  data.forEach(r => {
    const t = r?.shift_closed_at ? Date.parse(r.shift_closed_at) : 0;
    if (Number.isFinite(t) && t > lastClose) lastClose = t;
  });

  let maxNum = 0;
  data.forEach(r => {
    if (!r || r.shift_closed_at) return;
    const created = Date.parse(r.created_at);
    if (lastClose && Number.isFinite(created) && created <= lastClose) return;
    const n = parseOrderSeq(r.id);
    if (Number.isFinite(n) && n > maxNum) maxNum = n;
  });

  const d = new Date();
  const tag = lastClose
    ? Math.floor(lastClose / 1000).toString(36)
    : `d${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return { next: maxNum + 1, tag };
}

export async function reserveOrderNumber(existingOrders = []) {
  const localNext = getNextOrderNumber(existingOrders);
  currentShiftTag = '';
  if (!isSupabaseConfigured || !supabase) return localNext;
  try {
    const shift = await nextShiftOrderNumber();
    if (shift) {
      currentShiftTag = shift.tag;
      return shift.next;
    }
  } catch (e) {}
  try {
    const { data, error } = await supabase.rpc('next_order_number');
    if (!error && data !== null && data !== undefined && Number.isFinite(Number(data))) {
      return Number(data);
    }
    // Banco ainda sem a função (antes do supabase_security.sql): usa o maior número já gravado
    const { data: rows } = await supabase
      .from('orders')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(200);
    let maxDb = 0;
    (rows || []).forEach(r => {
      const n = /^[0-9]{1,9}$/.test(String(r?.id || '')) ? Number(r.id) : NaN;
      if (Number.isFinite(n) && n > maxDb) maxDb = n;
    });
    return Math.max(localNext, maxDb + 1);
  } catch (e) {
    return localNext;
  }
}

/**
 * Format order sequence for display:
 * 1 -> "01" (or "1")
 * 2 -> "02"
 */
export function formatOrderNumber(orderOrId, fallbackIndex) {
  if (!orderOrId) return fallbackIndex ? String(fallbackIndex).padStart(2, '0') : '01';

  if (typeof orderOrId === 'object') {
    if (orderOrId.orderNumber && !isNaN(Number(orderOrId.orderNumber))) {
      return String(orderOrId.orderNumber).padStart(2, '0');
    }
    const clean = String(orderOrId.orderId || '').replace(/^ES-/, '');
    const num = parseInt(clean, 10);
    if (!isNaN(num) && num > 0 && num < 1000) {
      return String(num).padStart(2, '0');
    }
    if (fallbackIndex) {
      return String(fallbackIndex).padStart(2, '0');
    }
    return String(orderOrId.orderId || '01');
  }

  const clean = String(orderOrId).replace(/^ES-/, '');
  const num = parseInt(clean, 10);
  if (!isNaN(num) && num > 0 && num < 1000) {
    return String(num).padStart(2, '0');
  }
  return fallbackIndex ? String(fallbackIndex).padStart(2, '0') : String(orderOrId);
}

function mapSupabaseRowToOrder(row) {
  if (!row) return null;
  const normalized = normalizeOrderStatus(row.status || row.order_status);
  const addr = (typeof row.delivery_address === 'object' && row.delivery_address !== null)
    ? row.delivery_address
    : {};
  const districtName = addr.district || row.district || '';
  const streetName = addr.street || addr.address || row.address || '';
  const numberStr = addr.number || row.number || '';
  const complementStr = addr.complement || row.complement || '';
  const referenceStr = addr.reference || row.reference || '';
  const isPickup = row.delivery_type === 'balcao' || row.delivery_type === 'retirada' || addr.isPickup || districtName === 'Balcão';

  let orderNum = row.order_number || row.orderNumber || null;
  if (!orderNum) {
    const p = parseOrderSeq(row.id);
    if (!isNaN(p) && p > 0 && p < 1000) {
      orderNum = p;
    }
  }

  return {
    orderId: row.id,
    orderNumber: orderNum,
    displayNumber: orderNum ? String(orderNum).padStart(2, '0') : String(row.id || ''),
    branchId: row.branch_id || 'ariquemes',
    branchName: row.branch_name || 'Unidade Ariquemes',
    customerName: row.customer_name || 'Cliente',
    customerPhone: row.customer_phone || '',
    deliveryAddress: {
      street: streetName,
      address: streetName,
      number: numberStr,
      district: districtName,
      complement: complementStr,
      reference: referenceStr,
      isPickup
    },
    district: districtName,
    address: streetName,
    number: numberStr,
    complement: complementStr,
    reference: referenceStr,
    deliveryType: row.delivery_type || (isPickup ? 'balcao' : 'delivery'),
    items: row.items || [],
    subtotal: Number(row.subtotal || 0),
    deliveryFee: Number(row.delivery_fee || 0),
    total: Number(row.total || 0),
    paymentMethod: row.payment_method || 'A Definir',
    paymentStatus: row.payment_status || (row.payment_method && row.payment_method.toLowerCase().includes('pix') ? 'PAGO_APROVADO' : 'PENDENTE_COBRANCA'),
    changeFor: row.change_for,
    cashChange: row.change_for,
    status: normalized,
    orderStatus: normalized,
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Fechamento de caixa compartilhado entre aparelhos (coluna opcional shift_closed_at)
    ...(row.shift_closed_at ? { shiftClosedAt: row.shift_closed_at, isArchived: true } : {})
  };
}

/**
 * Marca no Supabase os pedidos encerrados num fechamento de caixa, para que
 * TODOS os aparelhos vejam o caixa fechado (antes ficava só no navegador local).
 * Requer a coluna orders.shift_closed_at (ver supabase_schema.sql).
 */
export async function persistShiftClosing(orderIds = [], closedAt = new Date().toISOString()) {
  if (!isSupabaseConfigured || !supabase || !Array.isArray(orderIds) || orderIds.length === 0) return false;
  try {
    const { error } = await supabase
      .from('orders')
      .update({ shift_closed_at: closedAt })
      .in('id', orderIds);
    if (error) throw new Error(error.message);
    return true;
  } catch (err) {
    console.warn('⚠️ Fechamento de caixa salvo só neste aparelho (falta a coluna shift_closed_at?):', err.message || err);
    return false;
  }
}

/**
 * Reaplica fechamentos de caixa salvos localmente sobre a lista vinda da nuvem,
 * para que recarregar a página não "reabra" o caixa.
 */
export function applyLocalShiftClosings(orders = []) {
  try {
    const history = JSON.parse(localStorage.getItem('el_shadday_cash_closing_history_v1') || '[]');
    if (!Array.isArray(history) || history.length === 0) return orders;
    const closedMap = new Map();
    history.forEach(rec => {
      (rec?.ordersSummary || []).forEach(o => {
        if (o?.orderId && !closedMap.has(o.orderId)) closedMap.set(o.orderId, { at: rec.closedAt, id: rec.id });
      });
    });
    if (closedMap.size === 0) return orders;
    return orders.map(o => {
      let c = o && !o.shiftClosedAt && closedMap.get(o.orderId);
      // Pedido criado DEPOIS desse fechamento não pertence a ele (mesmo número
      // reaproveitado) — antes ele sumia da tela como se o caixa estivesse fechado
      if (c && o.createdAt && c.at && Date.parse(o.createdAt) > Date.parse(c.at)) c = null;
      return c ?{ ...o, shiftClosedAt: c.at, shiftClosingId: c.id, isArchived: true } : o;
    });
  } catch (e) {
    return orders;
  }
}

// Fila de pedidos que ainda não chegaram ao banco (ex.: celular abriu o WhatsApp
// e o navegador congelou a página antes de gravar). É reenviada depois.
const PENDING_KEY = 'el_shadday_pending_orders_v1';
const readPending = () => {
  try {
    const list = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch (e) { return []; }
};
const writePending = (list) => {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(0, 20))); } catch (e) {}
};
const addPending = (order) => {
  writePending([order, ...readPending().filter(o => o?.orderId !== order.orderId)]);
};
const removePending = (orderId) => {
  writePending(readPending().filter(o => o?.orderId !== orderId));
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// O pedido com esse ID que já está no banco é este mesmo pedido? (a 1ª tentativa
// pode ter gravado e só a resposta se perdeu; não pode virar pedido duplicado)
async function isSameOrderAlreadySaved(row) {
  try {
    const { data } = await supabase
      .from('orders')
      .select('customer_name, customer_phone, total')
      .eq('id', row.id)
      .maybeSingle();
    if (!data) return false;
    return String(data.customer_phone || '') === String(row.customer_phone || '')
      && String(data.customer_name || '') === String(row.customer_name || '')
      && Math.abs(Number(data.total || 0) - Number(row.total || 0)) < 0.01;
  } catch (e) {
    return false;
  }
}

/**
 * Send an order to the kitchen across all available channels.
 * Retorna true quando o pedido está gravado no banco.
 */
export async function dispatchOrderToKitchen(orderData) {
  // 1. Broadcast locally to other tabs immediately
  try {
    if (localChannel) {
      localChannel.postMessage({ type: 'NEW_ORDER', order: orderData });
    }
  } catch (e) {}

  // 2. Dispatch to Supabase PostgreSQL Database (if connected)
  let savedInSupabase = false;
  if (isSupabaseConfigured && supabase) {
    try {
      const addr = orderData.deliveryAddress || {
        street: orderData.streetAddress || orderData.address || '',
        address: orderData.streetAddress || orderData.address || '',
        number: orderData.number || orderData.addressNumber || '',
        district: orderData.district || '',
        complement: orderData.complement || '',
        reference: orderData.reference || '',
        isPickup: orderData.deliveryType === 'balcao' || orderData.deliveryType === 'retirada'
      };
      const changeVal = toNumberOrNull(orderData.changeFor || orderData.cashChange || orderData.change_for || null);

      const buildRow = () => ({
        id: orderData.orderId,
        branch_id: orderData.branchId || 'ariquemes',
        branch_name: orderData.branchName || 'Unidade Ariquemes',
        customer_name: orderData.customerName || 'Cliente',
        customer_phone: orderData.customerPhone || '',
        delivery_address: addr,
        items: orderData.items || [],
        subtotal: Number(orderData.subtotal || 0),
        delivery_fee: Number(orderData.deliveryFee || 0),
        total: Number(orderData.total || 0),
        payment_method: orderData.paymentMethod || '',
        change_for: changeVal,
        status: normalizeOrderStatus(orderData.orderStatus || orderData.status),
        notes: orderData.notes || ''
        // created_at / updated_at: o banco preenche com a hora do servidor.
        // Antes vinha do relógio do celular do cliente; relógio errado fazia o
        // pedido cair fora da lista do painel.
      });

      addPending(orderData);

      // Falha de rede (sem código do Postgres) => tenta de novo algumas vezes
      const tryInsert = async () => {
        let res;
        for (let n = 0; n < 4; n++) {
          try {
            res = await supabase.from('orders').insert(buildRow());
          } catch (e) {
            res = { error: { message: String(e?.message || e), code: '' } };
          }
          if (!res.error || res.error.code) return res;
          await sleep(800 * (n + 1));
        }
        return res;
      };

      // INSERT (nunca sobrescreve outro pedido). Se o número já existe, pega outro.
      let { error } = await tryInsert();
      if (error && error.code === '23505' && await isSameOrderAlreadySaved(buildRow())) error = null;
      for (let attempt = 0; error && error.code === '23505' && attempt < 3; attempt++) {
        const fresh = await reserveOrderNumber();
        const freshDisplay = String(fresh).padStart(2, '0');
        // 2ª tentativa em diante: sufixo aleatório garante ID único
        const freshId = buildOrderId(fresh) + (attempt > 0 ? Math.random().toString(36).slice(2, 5) : '');
        console.warn(`⚠️ Número #${orderData.orderId} já existia no banco; pedido renumerado para #${freshDisplay}`);
        orderData.orderId = freshId;
        orderData.orderNumber = fresh;
        orderData.displayNumber = '#' + freshDisplay;
        ({ error } = await tryInsert());
      }
      if (error) {
        console.warn('⚠️ Supabase order insert error:', error.message);
      } else {
        savedInSupabase = true;
        removePending(orderData.orderId);
        console.log('✅ Pedido gravado no Supabase com sucesso:', orderData.orderId);
      }
    } catch (err) {
      console.warn('⚠️ Erro ao comunicar com Supabase:', err);
    }
  }

  // 3. Publish to Cloud Pub/Sub (só se o Supabase não estiver disponível)
  if (!savedInSupabase && shouldUseNtfyFallback()) try {
    const payload = JSON.stringify({
      ...orderData,
      status: normalizeOrderStatus(orderData.orderStatus || orderData.status),
      orderStatus: normalizeOrderStatus(orderData.orderStatus || orderData.status)
    });
    await fetch(NTFY_BASE_URL, {
      method: 'POST',
      headers: {
        'Title': `Novo Pedido #${orderData.orderId} - ${orderData.customerName}`,
        'Priority': 'urgent',
        'Tags': 'pizza,bell,plate_with_cutlery',
        'Actions': `view, Abrir Painel, ${typeof window !== 'undefined' ? window.location.origin : ''}/#/admin`
      },
      body: payload,
      keepalive: true
    });
    console.log('✅ Order dispatched successfully to cloud pub/sub:', orderData.orderId);
  } catch (err) {
    console.warn('⚠️ Cloud pub/sub dispatch failed, falling back:', err);
  }

  // 4. Fallback to local /api/orders (dev server / node backend if running)
  if (shouldUseNtfyFallback()) try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...orderData,
        status: normalizeOrderStatus(orderData.orderStatus || orderData.status),
        orderStatus: normalizeOrderStatus(orderData.orderStatus || orderData.status)
      }),
      keepalive: true
    });
  } catch (err) {
    // Expected on purely static environments
  }

  return savedInSupabase;
}

/**
 * Reenvia pedidos que ficaram na fila deste aparelho sem chegar ao banco.
 * Chamado ao abrir o site, ao voltar para a aba e quando a internet volta.
 */
let flushRunning = false;
export async function flushPendingOrders() {
  if (flushRunning || !isSupabaseConfigured || !supabase) return;
  const pending = readPending();
  if (pending.length === 0) return;
  flushRunning = true;
  try {
    const maxAge = 6 * 60 * 60 * 1000;
    for (const order of pending) {
      if (!order?.orderId) continue;
      const age = Date.now() - new Date(order.createdAt || 0).getTime();
      if (!(age < maxAge)) { removePending(order.orderId); continue; }
      const oldId = order.orderId;
      const ok = await dispatchOrderToKitchen(order);
      if (ok && oldId !== order.orderId) removePending(oldId);
    }
  } catch (e) {
  } finally {
    flushRunning = false;
  }
}

/**
 * Broadcast an order status update (e.g. EM_PREPARO, CONCLUIDO)
 */
export async function dispatchOrderUpdateToKitchen(orderId, updates) {
  const normStatus = updates.orderStatus || updates.status 
    ? normalizeOrderStatus(updates.orderStatus || updates.status) 
    : undefined;

  const enrichedUpdates = {
    ...updates,
    ...(normStatus ? { orderStatus: normStatus, status: normStatus } : {})
  };

  const updatePayload = {
    type: 'ORDER_UPDATE',
    orderId,
    updates: enrichedUpdates,
    updatedAt: new Date().toISOString()
  };

  // 1. Broadcast locally
  try {
    if (localChannel) {
      localChannel.postMessage(updatePayload);
    }
  } catch (e) {}

  // 2. Update Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const updateData = {
        updated_at: new Date().toISOString()
      };
      if (normStatus) updateData.status = normStatus;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.paymentStatus) updateData.payment_status = updates.paymentStatus;
      if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod;
      if (updates.changeFor !== undefined) updateData.change_for = updates.changeFor ? Number(String(updates.changeFor).replace(',', '.')) : null;
      if (Array.isArray(updates.items)) updateData.items = updates.items;
      if (updates.subtotal !== undefined) updateData.subtotal = Number(updates.subtotal) || 0;
      if (updates.deliveryFee !== undefined) updateData.delivery_fee = Number(updates.deliveryFee) || 0;
      if (updates.total !== undefined) updateData.total = Number(updates.total) || 0;
      if (updates.customerName !== undefined) updateData.customer_name = updates.customerName || 'Cliente';
      if (updates.customerPhone !== undefined) updateData.customer_phone = updates.customerPhone || '';
      if (updates.deliveryAddress && typeof updates.deliveryAddress === 'object') updateData.delivery_address = updates.deliveryAddress;
      if (updates.cashChange !== undefined) updateData.change_for = updates.cashChange ? Number(String(updates.cashChange).replace(',', '.')) : null;

      let { error } = await supabase.from('orders').update(updateData).eq('id', orderId);
      // Coluna opcional ausente no banco (ex.: payment_status) não pode derrubar a atualização inteira
      if (error && updateData.payment_status !== undefined && /payment_status/.test(error.message || '')) {
        delete updateData.payment_status;
        ({ error } = await supabase.from('orders').update(updateData).eq('id', orderId));
      }
      if (error) {
        console.warn('⚠️ Supabase recusou a atualização do pedido:', orderId, error.message);
      } else {
        console.log('✅ Status atualizado no Supabase:', orderId, enrichedUpdates);
      }
    } catch (err) {
      console.warn('⚠️ Erro ao atualizar status no Supabase:', err);
    }
  }

  // 3. Fallback Cloud Pub/Sub
  if (shouldUseNtfyFallback()) try {
    await fetch(NTFY_BASE_URL, {
      method: 'POST',
      headers: {
        'Title': `Atualização Pedido #${orderId}`,
        'Tags': 'arrows_counterclockwise',
        'Priority': 'low'
      },
      body: JSON.stringify(updatePayload)
    });
  } catch (err) {}

  // 4. Fallback local /api/orders
  if (shouldUseNtfyFallback()) try {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  } catch (err) {}
}

/**
 * Permanently delete an order from Supabase database and all synced devices
 */
export async function dispatchOrderDelete(orderId) {
  // 1. Delete from Supabase PostgreSQL Database
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) {
        console.warn('⚠️ Erro ao excluir pedido no Supabase:', error.message);
      } else {
        console.log('✅ Pedido excluído definitivamente do Supabase:', orderId);
      }
    } catch (err) {
      console.warn('⚠️ Erro de conexão ao excluir pedido no Supabase:', err);
    }
  }

  // 2. Broadcast locally across browser tabs
  try {
    if (localChannel) {
      localChannel.postMessage({ type: 'ORDER_DELETED', orderId });
    }
  } catch (e) {}

  // 3. Fallback Cloud Pub/Sub
  if (shouldUseNtfyFallback()) try {
    await fetch(NTFY_BASE_URL, {
      method: 'POST',
      headers: {
        'Title': `Pedido Excluído #${orderId}`,
        'Tags': 'wastebasket',
        'Priority': 'low'
      },
      body: JSON.stringify({ type: 'ORDER_DELETED', orderId })
    });
  } catch (err) {}
}

/**
 * Delete all orders from Supabase database and all synced devices
 */
export async function dispatchClearAllOrders() {
  try {
    localStorage.removeItem('el_shadday_daily_seq_v2');
  } catch (e) {}

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('orders').delete().neq('id', 'placeholder_none');
      if (error) {
        console.warn('⚠️ Erro ao limpar pedidos no Supabase:', error.message);
      } else {
        console.log('✅ Todos os pedidos excluídos do Supabase com sucesso');
      }
    } catch (err) {
      console.warn('⚠️ Erro de conexão ao limpar pedidos no Supabase:', err);
    }
  }

  try {
    if (localChannel) {
      localChannel.postMessage({ type: 'ALL_ORDERS_CLEARED' });
    }
  } catch (e) {}

  if (shouldUseNtfyFallback()) try {
    await fetch(NTFY_BASE_URL, {
      method: 'POST',
      headers: {
        'Title': 'Todos os Pedidos Limpos',
        'Tags': 'wastebasket',
        'Priority': 'default'
      },
      body: JSON.stringify({ type: 'ALL_ORDERS_CLEARED' })
    });
  } catch (err) {}
}

/**
 * Fetch past cloud orders (last 24 hours).
 * If Supabase is connected, Supabase is the single source of truth.
 */
export async function fetchCloudOrdersHistory() {
  // If Supabase is active, query database directly
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && Array.isArray(data)) {
        // Return Supabase data directly (even if empty []!)
        return data.map(mapSupabaseRowToOrder).filter(Boolean);
      }
    } catch (err) {
      console.warn('Falha ao buscar histórico no Supabase, tentando fallback:', err);
    }
  }

  // Fallback to ntfy.sh cloud cache only if Supabase failed or is not configured
  try {
    const res = await fetch(`${NTFY_BASE_URL}/json?poll=1&since=24h`);
    if (!res.ok) return [];
    
    const text = await res.text();
    const lines = text.trim().split('\n').filter(Boolean);
    const ordersMap = new Map();

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.event === 'message' && entry.message) {
          const parsed = JSON.parse(entry.message);
          
          if (parsed.type === 'ALL_ORDERS_CLEARED') {
            ordersMap.clear();
          } else if (parsed.type === 'ORDER_DELETED' && parsed.orderId) {
            ordersMap.delete(parsed.orderId);
          } else if (parsed.type === 'ORDER_UPDATE' && parsed.orderId) {
            const existing = ordersMap.get(parsed.orderId);
            if (existing) {
              ordersMap.set(parsed.orderId, { ...existing, ...parsed.updates });
            }
          } else if (parsed.orderId && !parsed.isDeleted && parsed.orderStatus !== 'DELETED') {
            ordersMap.set(parsed.orderId, parsed);
          }
        }
      } catch (e) {
        // Skip unparseable lines
      }
    }

    return Array.from(ordersMap.values());
  } catch (err) {
    console.warn('Could not fetch cloud orders history:', err);
    return [];
  }
}

/**
 * Subscribe kitchen panel to real-time events
 */
// Avisa a tela se a conexão "ao vivo" dos pedidos está funcionando
function emitLiveStatus(status) {
  try {
    window.__elShaddayOrdersLive = status;
    window.dispatchEvent(new CustomEvent('el_shadday_orders_live', { detail: status }));
  } catch (e) {}
}

/**
 * Busca só os pedidos criados/alterados nos últimos minutos (consulta leve).
 * Serve de rede de segurança caso a conexão ao vivo tenha caído.
 */
export async function fetchRecentlyChangedOrders(minutes = 3) {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`created_at.gte.${since},updated_at.gte.${since}`)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error || !Array.isArray(data)) return null;
    return data.map(mapSupabaseRowToOrder).filter(Boolean);
  } catch (e) {
    return null;
  }
}

export function subscribeToKitchenEvents({ onNewOrder, onOrderUpdate, onOrderDelete, onAllOrdersCleared, onReconnected } = {}) {
  let eventSource = null;
  let supabaseChannel = null;
  let isCleanedUp = false;
  let retryTimer = null;
  let retryDelay = 2000;
  let hasConnectedOnce = false;


  // 1. Supabase Realtime Subscription (WebSockets) - reconecta sozinho se cair
  const connectRealtime = () => {
    if (isCleanedUp || !isSupabaseConfigured || !supabase) return;
    try {
      const existingChannels = typeof supabase.getChannels === 'function' ? supabase.getChannels() : [];
      const prevLive = existingChannels.find(ch => ch?.topic?.includes('kds_orders_live'));
      if (prevLive) supabase.removeChannel(prevLive);

      supabaseChannel = supabase
        .channel(`kds_orders_live_${Date.now()}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            if (isCleanedUp || !payload.new) return;
            const mapped = mapSupabaseRowToOrder(payload.new);
            if (mapped) {
              try {
                recordCustomerFromOrder(mapped);
              } catch (e) {}
            }
            if (onNewOrder && mapped) onNewOrder(mapped);
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          (payload) => {
            if (isCleanedUp || !payload.new) return;
            if (onOrderUpdate) {
              const mapped = mapSupabaseRowToOrder(payload.new);
              if (mapped) {
                onOrderUpdate(payload.new.id, mapped);
              }
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'orders' },
          (payload) => {
            if (isCleanedUp || !payload.old) return;
            if (onOrderDelete && payload.old.id) {
              onOrderDelete(payload.old.id);
            }
          }
        )
        ;
      const thisChannel = supabaseChannel;
      thisChannel.subscribe((status) => {
        if (isCleanedUp || thisChannel !== supabaseChannel) return;
        console.log('📡 Supabase Realtime Status:', status);
        if (status === 'SUBSCRIBED') {
          retryDelay = 2000;
          emitLiveStatus('live');
          // Voltou depois de cair: busca o que chegou enquanto estava fora
          if (hasConnectedOnce && onReconnected) onReconnected();
          hasConnectedOnce = true;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          emitLiveStatus('reconnecting');
          supabaseChannel = null;
          try { supabase.removeChannel(thisChannel); } catch (e) {}
          if (retryTimer) clearTimeout(retryTimer);
          retryTimer = setTimeout(connectRealtime, retryDelay);
          retryDelay = Math.min(retryDelay * 2, 30000);
        }
      });
    } catch (err) {
      console.warn('Supabase Realtime subscription error:', err);
      emitLiveStatus('reconnecting');
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(connectRealtime, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 30000);
    }
  };
  if (isSupabaseConfigured && supabase) {
    emitLiveStatus('connecting');
    connectRealtime();
  }

  // 2. Server-Sent Events (SSE) Fallback via ntfy.sh
  const connectSSE = () => {
    if (isCleanedUp || !shouldUseNtfyFallback()) return;

    try {
      eventSource = new EventSource(`${NTFY_BASE_URL}/sse`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'message' && payload.message) {
            const data = JSON.parse(payload.message);

            if (data.type === 'ALL_ORDERS_CLEARED') {
              if (onAllOrdersCleared) onAllOrdersCleared();
            } else if (data.type === 'ORDER_DELETED' && data.orderId) {
              if (onOrderDelete) onOrderDelete(data.orderId);
            } else if (data.type === 'ORDER_UPDATE' && data.orderId) {
              if (onOrderUpdate) onOrderUpdate(data.orderId, data.updates);
            } else if (data.orderId && !data.isDeleted) {
              if (onNewOrder) onNewOrder(data);
            }
          }
        } catch (err) {
          // Ignore keepalives or heartbeats
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
        }
        if (!isCleanedUp) {
          setTimeout(connectSSE, 4000);
        }
      };
    } catch (e) {
      console.warn('SSE subscription failed, falling back to polling:', e);
    }
  };

  connectSSE();

  // 3. Local BroadcastChannel (cross-tab sync)
  const handleLocalMessage = (event) => {
    const data = event.data;
    if (!data) return;

    if (data.type === 'ALL_ORDERS_CLEARED' && onAllOrdersCleared) {
      onAllOrdersCleared();
    } else if (data.type === 'ORDER_DELETED' && data.orderId && onOrderDelete) {
      onOrderDelete(data.orderId);
    } else if (data.type === 'NEW_ORDER' && data.order && onNewOrder) {
      onNewOrder(data.order);
    } else if (data.type === 'ORDER_UPDATE' && data.orderId && onOrderUpdate) {
      onOrderUpdate(data.orderId, data.updates);
    }
  };

  if (localChannel) {
    localChannel.addEventListener('message', handleLocalMessage);
  }


  // Cleanup handler
  return () => {
    isCleanedUp = true;
    if (retryTimer) clearTimeout(retryTimer);
    if (supabaseChannel && supabase) {
      const ch = supabaseChannel;
      supabaseChannel = null;
      supabase.removeChannel(ch);
    }
    if (eventSource) {
      eventSource.close();
    }
    if (localChannel) {
      localChannel.removeEventListener('message', handleLocalMessage);
    }
  };
}
