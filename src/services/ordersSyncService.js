/**
 * Real-Time Orders Synchronization Service for El Shadday KDS
 * Connects customer phones, admin panels, and kitchen screens across the internet in real time.
 * Supports Supabase Realtime (PostgreSQL) with automatic fallback to BroadcastChannel and SSE Cloud.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

const SYNC_TOPIC = 'el-shadday-kds-ariquemes-v2';
const NTFY_BASE_URL = `https://ntfy.sh/${SYNC_TOPIC}`;

// BroadcastChannel for cross-tab local sync on same device
const localChannel = typeof window !== 'undefined' && window.BroadcastChannel 
  ? new window.BroadcastChannel('el_shadday_orders_channel') 
  : null;

function mapSupabaseRowToOrder(row) {
  if (!row) return null;
  return {
    orderId: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    deliveryAddress: row.delivery_address,
    items: row.items || [],
    subtotal: Number(row.subtotal || 0),
    deliveryFee: Number(row.delivery_fee || 0),
    total: Number(row.total || 0),
    paymentMethod: row.payment_method,
    changeFor: row.change_for,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Send an order to the kitchen across all available channels
 */
export async function dispatchOrderToKitchen(orderData) {
  // 1. Broadcast locally to other tabs immediately
  try {
    if (localChannel) {
      localChannel.postMessage({ type: 'NEW_ORDER', order: orderData });
    }
  } catch (e) {}

  // 2. Dispatch to Supabase PostgreSQL Database (if connected)
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('orders').upsert({
        id: orderData.orderId,
        customer_name: orderData.customerName || 'Cliente',
        customer_phone: orderData.customerPhone || '',
        delivery_address: orderData.deliveryAddress || {},
        items: orderData.items || [],
        subtotal: orderData.subtotal || 0,
        delivery_fee: orderData.deliveryFee || 0,
        total: orderData.total || 0,
        payment_method: orderData.paymentMethod || '',
        change_for: orderData.changeFor || null,
        status: orderData.status || 'RECEBIDO',
        notes: orderData.notes || '',
        created_at: orderData.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      if (error) {
        console.warn('⚠️ Supabase order insert error:', error.message);
      } else {
        console.log('✅ Pedido gravado no Supabase com sucesso:', orderData.orderId);
      }
    } catch (err) {
      console.warn('⚠️ Erro ao comunicar com Supabase:', err);
    }
  }

  // 3. Publish to Cloud Pub/Sub (Cross-device Internet Sync fallback)
  try {
    const payload = JSON.stringify(orderData);
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
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
      keepalive: true
    });
  } catch (err) {
    // Expected on purely static environments
  }
}

/**
 * Broadcast an order status update (e.g. EM_PREPARO, CONCLUIDO)
 */
export async function dispatchOrderUpdateToKitchen(orderId, updates) {
  const updatePayload = {
    type: 'ORDER_UPDATE',
    orderId,
    updates,
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
      if (updates.status) updateData.status = updates.status;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      await supabase.from('orders').update(updateData).eq('id', orderId);
      console.log('✅ Status atualizado no Supabase:', orderId, updates);
    } catch (err) {
      console.warn('⚠️ Erro ao atualizar status no Supabase:', err);
    }
  }

  // 3. Fallback Cloud Pub/Sub
  try {
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
  try {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  } catch (err) {}
}

/**
 * Fetch past cloud orders (last 24 hours)
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
        return data.map(mapSupabaseRowToOrder).filter(Boolean);
      }
    } catch (err) {
      console.warn('Falha ao buscar histórico no Supabase, tentando fallback:', err);
    }
  }

  // Fallback to ntfy.sh cloud cache
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
          
          if (parsed.type === 'ORDER_UPDATE' && parsed.orderId) {
            const existing = ordersMap.get(parsed.orderId);
            if (existing) {
              ordersMap.set(parsed.orderId, { ...existing, ...parsed.updates });
            }
          } else if (parsed.orderId) {
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
export function subscribeToKitchenEvents({ onNewOrder, onOrderUpdate }) {
  let eventSource = null;
  let supabaseChannel = null;
  let isCleanedUp = false;

  // 1. Supabase Realtime Subscription (WebSockets)
  if (isSupabaseConfigured && supabase) {
    try {
      supabaseChannel = supabase
        .channel('kds_orders_live')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            if (isCleanedUp || !payload.new) return;
            const mapped = mapSupabaseRowToOrder(payload.new);
            if (onNewOrder && mapped) onNewOrder(mapped);
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          (payload) => {
            if (isCleanedUp || !payload.new) return;
            if (onOrderUpdate) {
              onOrderUpdate(payload.new.id, {
                status: payload.new.status,
                notes: payload.new.notes,
                updatedAt: payload.new.updated_at
              });
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Supabase Realtime Status:', status);
        });
    } catch (err) {
      console.warn('Supabase Realtime subscription error:', err);
    }
  }

  // 2. Server-Sent Events (SSE) Fallback via ntfy.sh
  const connectSSE = () => {
    if (isCleanedUp) return;

    try {
      eventSource = new EventSource(`${NTFY_BASE_URL}/sse`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'message' && payload.message) {
            const data = JSON.parse(payload.message);

            if (data.type === 'ORDER_UPDATE') {
              if (onOrderUpdate) onOrderUpdate(data.orderId, data.updates);
            } else if (data.orderId) {
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

    if (data.type === 'NEW_ORDER' && data.order && onNewOrder) {
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
    if (supabaseChannel && supabase) {
      supabase.removeChannel(supabaseChannel);
    }
    if (eventSource) {
      eventSource.close();
    }
    if (localChannel) {
      localChannel.removeEventListener('message', handleLocalMessage);
    }
  };
}
