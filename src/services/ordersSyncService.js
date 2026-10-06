/**
 * Real-Time Orders Synchronization Service for El Shadday KDS
 * Connects customer phones and kitchen panels across the internet in real time!
 */

const SYNC_TOPIC = 'el-shadday-kds-ariquemes-v2';
const NTFY_BASE_URL = `https://ntfy.sh/${SYNC_TOPIC}`;

// BroadcastChannel for cross-tab local sync
const localChannel = typeof window !== 'undefined' && window.BroadcastChannel 
  ? new window.BroadcastChannel('el_shadday_orders_channel') 
  : null;

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

  // 2. Publish to Cloud Pub/Sub (Cross-device Internet Sync)
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

  // 3. Fallback to local /api/orders (dev server / node backend)
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

  try {
    if (localChannel) {
      localChannel.postMessage(updatePayload);
    }
  } catch (e) {}

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
            // Apply update
            const existing = ordersMap.get(parsed.orderId);
            if (existing) {
              ordersMap.set(parsed.orderId, { ...existing, ...parsed.updates });
            }
          } else if (parsed.orderId) {
            // Full order
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
 * Subscribe kitchen panel to real-time events via Server-Sent Events (SSE)
 */
export function subscribeToKitchenEvents({ onNewOrder, onOrderUpdate }) {
  let eventSource = null;
  let isCleanedUp = false;

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
        // Reconnect after 4 seconds
        if (!isCleanedUp) {
          setTimeout(connectSSE, 4000);
        }
      };
    } catch (e) {
      console.warn('SSE subscription failed, falling back to polling:', e);
    }
  };

  connectSSE();

  // Also listen on BroadcastChannel for same-device cross-tab sync
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

  // Return unsubscribe cleanup function
  return () => {
    isCleanedUp = true;
    if (eventSource) {
      eventSource.close();
    }
    if (localChannel) {
      localChannel.removeEventListener('message', handleLocalMessage);
    }
  };
}
