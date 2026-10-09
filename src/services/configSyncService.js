/**
 * Cloud Configuration Synchronization Service for El Shadday
 * Synchronizes Menu Products, Buffet Gallery Photos, Promotions and Store Settings
 * in real-time across ALL customer phones, admin computers and tablets worldwide.
 * 
 * Works with or without Supabase, guaranteeing zero-config instant multi-device sync!
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { saveStoredProducts, saveStoredPromoSettings, saveStoredRestaurantInfo } from '../data/menuData';
import { saveStoredBuffetGallery } from '../buffet/buffetData';

const CONFIG_TOPIC = 'el-shadday-config-sync-ariquemes-v2';
const NTFY_CONFIG_URL = `https://ntfy.sh/${CONFIG_TOPIC}`;

// Cross-tab channel on the same device
const configChannel = typeof window !== 'undefined' && window.BroadcastChannel 
  ? new window.BroadcastChannel('el_shadday_config_channel') 
  : null;

/**
 * Dispatch an update to the cloud so all other devices receive it immediately
 * @param {'PRODUCTS_UPDATE' | 'GALLERY_UPDATE' | 'PROMOS_UPDATE' | 'STORE_UPDATE'} type 
 * @param {any} data 
 */
export async function dispatchConfigSync(type, data) {
  const payload = {
    type,
    data,
    updatedAt: new Date().toISOString()
  };

  // 1. Broadcast to other tabs on same device
  try {
    if (configChannel) {
      configChannel.postMessage(payload);
    }
  } catch (e) {}

  // 2. Dispatch to Supabase PostgreSQL (if active)
  if (isSupabaseConfigured && supabase) {
    try {
      if (type === 'PRODUCTS_UPDATE') {
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          menu_products: data,
          updated_at: new Date().toISOString()
        });
      } else if (type === 'PROMOS_UPDATE') {
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          promo_settings: data,
          updated_at: new Date().toISOString()
        });
      } else if (type === 'STORE_UPDATE') {
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          name: data.name,
          phone: data.phone,
          phone_display: data.phoneFormatted,
          address: data.address,
          pix_key: data.pixKey,
          pix_name: data.pixName,
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('⚠️ Supabase config sync error:', err);
    }
  }

  // 3. Dispatch to Global Cloud Pub/Sub (instant cross-device sync)
  try {
    await fetch(NTFY_CONFIG_URL, {
      method: 'POST',
      headers: {
        'Title': `Config Sync: ${type}`,
        'Priority': 'default',
        'Tags': 'gear,arrows_counterclockwise'
      },
      body: JSON.stringify(payload),
      keepalive: true
    });
    console.log(`✅ [Cloud Sync] ${type} sincronizado na nuvem global!`);
  } catch (err) {
    console.warn(`⚠️ [Cloud Sync] Falha ao enviar ${type} para o pub/sub:`, err);
  }
}

/**
 * Fetch latest config from the cloud (called when client opens app on mobile/pc)
 */
export async function fetchCloudConfigHistory() {
  try {
    const res = await fetch(`${NTFY_CONFIG_URL}/json?poll=1&since=24h`);
    if (!res.ok) return null;

    const text = await res.text();
    const lines = text.trim().split('\n').filter(Boolean);

    let latestProducts = null;
    let latestGallery = null;
    let latestPromos = null;
    let latestStore = null;

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.event === 'message' && entry.message) {
          const parsed = JSON.parse(entry.message);
          if (parsed && parsed.type) {
            if (parsed.type === 'PRODUCTS_UPDATE' && Array.isArray(parsed.data)) {
              latestProducts = parsed.data;
            } else if (parsed.type === 'GALLERY_UPDATE' && Array.isArray(parsed.data)) {
              latestGallery = parsed.data;
            } else if (parsed.type === 'PROMOS_UPDATE' && parsed.data) {
              latestPromos = parsed.data;
            } else if (parsed.type === 'STORE_UPDATE' && parsed.data) {
              latestStore = parsed.data;
            }
          }
        }
      } catch (e) {}
    }

    // Apply latest changes to local storage & dispatch events
    if (latestProducts && latestProducts.length > 0) {
      saveStoredProducts(latestProducts);
    }
    if (latestGallery && latestGallery.length > 0) {
      saveStoredBuffetGallery(latestGallery);
    }
    if (latestPromos) {
      saveStoredPromoSettings(latestPromos);
    }
    if (latestStore) {
      saveStoredRestaurantInfo(latestStore);
    }

    return {
      products: latestProducts,
      gallery: latestGallery,
      promos: latestPromos,
      store: latestStore
    };
  } catch (err) {
    console.warn('⚠️ [Cloud Sync] Erro ao buscar histórico de configurações:', err);
    return null;
  }
}

/**
 * Subscribe to real-time configuration events (changes made on PC push to phone live)
 */
export function subscribeToConfigEvents({ onProductsUpdate, onGalleryUpdate, onPromosUpdate, onStoreUpdate } = {}) {
  let eventSource = null;
  let isCleanedUp = false;

  const connectSSE = () => {
    if (isCleanedUp) return;
    try {
      eventSource = new EventSource(`${NTFY_CONFIG_URL}/sse`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'message' && payload.message) {
            const data = JSON.parse(payload.message);
            if (!data || !data.type) return;

            if (data.type === 'PRODUCTS_UPDATE' && Array.isArray(data.data)) {
              saveStoredProducts(data.data);
              if (onProductsUpdate) onProductsUpdate(data.data);
            } else if (data.type === 'GALLERY_UPDATE' && Array.isArray(data.data)) {
              saveStoredBuffetGallery(data.data);
              if (onGalleryUpdate) onGalleryUpdate(data.data);
            } else if (data.type === 'PROMOS_UPDATE' && data.data) {
              saveStoredPromoSettings(data.data);
              if (onPromosUpdate) onPromosUpdate(data.data);
            } else if (data.type === 'STORE_UPDATE' && data.data) {
              saveStoredRestaurantInfo(data.data);
              if (onStoreUpdate) onStoreUpdate(data.data);
            }
          }
        } catch (e) {}
      };

      eventSource.onerror = () => {
        if (eventSource) eventSource.close();
        if (!isCleanedUp) {
          setTimeout(connectSSE, 5000);
        }
      };
    } catch (e) {
      console.warn('SSE subscription error:', e);
    }
  };

  connectSSE();

  // Local BroadcastChannel handler
  const handleLocal = (event) => {
    const data = event.data;
    if (!data || !data.type) return;

    if (data.type === 'PRODUCTS_UPDATE' && Array.isArray(data.data)) {
      if (onProductsUpdate) onProductsUpdate(data.data);
    } else if (data.type === 'GALLERY_UPDATE' && Array.isArray(data.data)) {
      if (onGalleryUpdate) onGalleryUpdate(data.data);
    } else if (data.type === 'PROMOS_UPDATE' && data.data) {
      if (onPromosUpdate) onPromosUpdate(data.data);
    } else if (data.type === 'STORE_UPDATE' && data.data) {
      if (onStoreUpdate) onStoreUpdate(data.data);
    }
  };

  if (configChannel) {
    configChannel.addEventListener('message', handleLocal);
  }

  return () => {
    isCleanedUp = true;
    if (eventSource) eventSource.close();
    if (configChannel) configChannel.removeEventListener('message', handleLocal);
  };
}
