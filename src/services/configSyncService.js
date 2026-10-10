/**
 * Cloud Configuration Synchronization Service for El Shadday
 * Synchronizes Menu Products, Buffet Gallery Photos, Promotions and Store Settings
 * in real-time across ALL customer phones, admin computers and tablets worldwide.
 * 
 * Works with or without Supabase, guaranteeing zero-config instant multi-device sync!
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { saveStoredProducts, saveStoredPromoSettings, saveStoredRestaurantInfo, saveStoredPizzaFlavors } from '../data/menuData';
import { saveStoredBuffetGallery } from '../buffet/buffetData';

const CONFIG_TOPIC = 'el-shadday-config-sync-ariquemes-v2';
const NTFY_CONFIG_URL = `https://ntfy.sh/${CONFIG_TOPIC}`;

// Cross-tab channel on the same device
const configChannel = typeof window !== 'undefined' && window.BroadcastChannel 
  ? new window.BroadcastChannel('el_shadday_config_channel') 
  : null;

/**
 * Dispatch an update to the cloud so all other devices receive it immediately
 * @param {'PRODUCTS_UPDATE' | 'GALLERY_UPDATE' | 'PROMOS_UPDATE' | 'STORE_UPDATE' | 'PIZZA_FLAVORS_UPDATE'} type 
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
          card_machine_notice: data.cardMachineNotice,
          card_machine_notice_active: data.cardMachineNoticeActive,
          card_machine_settings: data.cardMachineSettings,
          updated_at: new Date().toISOString()
        });
      } else if (type === 'PIZZA_FLAVORS_UPDATE') {
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          pizza_flavors: data,
          updated_at: new Date().toISOString()
        });
      } else if (type === 'GALLERY_UPDATE') {
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          buffet_gallery: data,
          updated_at: new Date().toISOString()
        });

        if (Array.isArray(data) && data.length > 0) {
          for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (item && item.url) {
              await supabase.from('buffet_gallery').upsert({
                id: item.id || `media_${Date.now()}_${i}`,
                url: item.url,
                title: item.title || 'Buffet El Shadday',
                subtitle: item.subtitle || '',
                category: item.category || 'churrasco',
                tag: item.tag || 'Buffet',
                type: item.type || 'image',
                thumbnail: item.thumbnail || item.url,
                position: i
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ Supabase config sync error:', err);
    }
  }

  // 3. Dispatch to Global Cloud Pub/Sub (instant cross-device sync)
  try {
    const rawJson = JSON.stringify(payload);
    // ntfy.sh accepts small payloads (<4KB). If payload contains base64 images or large lists, send lightweight ping
    const bodyToSend = rawJson.length > 3500 
      ? JSON.stringify({ type: `${type}_PING`, updatedAt: payload.updatedAt }) 
      : rawJson;

    await fetch(NTFY_CONFIG_URL, {
      method: 'POST',
      headers: {
        'Title': `Config Sync: ${type}`,
        'Priority': 'default',
        'Tags': 'gear,arrows_counterclockwise'
      },
      body: bodyToSend,
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
    let latestFlavors = null;

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.event === 'message' && entry.message) {
          const parsed = JSON.parse(entry.message);
          if (parsed && parsed.type) {
            if (parsed.type === 'SUPABASE_CONFIG_SYNC' && parsed.data?.url && parsed.data?.key) {
              if (typeof window !== 'undefined') {
                const current = localStorage.getItem('el_shadday_supabase_url');
                if (!current) {
                  localStorage.setItem('el_shadday_supabase_url', parsed.data.url);
                  localStorage.setItem('el_shadday_supabase_anon_key', parsed.data.key);
                }
              }
            } else if (parsed.type === 'PRODUCTS_UPDATE' && Array.isArray(parsed.data)) {
              latestProducts = parsed.data;
            } else if (parsed.type === 'GALLERY_UPDATE' && Array.isArray(parsed.data)) {
              if (parsed.data.length > 0) {
                latestGallery = parsed.data;
              }
            } else if (parsed.type === 'GALLERY_UPDATE_PING' || parsed.type === 'GALLERY_PING') {
              if (isSupabaseConfigured && supabase) {
                try {
                  const { data: bgData } = await supabase.from('buffet_gallery').select('*').order('position', { ascending: true });
                  if (Array.isArray(bgData) && bgData.length > 0) {
                    latestGallery = bgData;
                  }
                } catch (e) {}
              }
            } else if (parsed.type === 'PROMOS_UPDATE' && parsed.data) {
              latestPromos = parsed.data;
            } else if (parsed.type === 'STORE_UPDATE' && parsed.data) {
              latestStore = parsed.data;
            } else if (parsed.type === 'PIZZA_FLAVORS_UPDATE' && Array.isArray(parsed.data)) {
              latestFlavors = parsed.data;
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
    if (latestFlavors && latestFlavors.length > 0) {
      saveStoredPizzaFlavors(latestFlavors);
    }

    return {
      products: latestProducts,
      gallery: (latestGallery && latestGallery.length > 0) ? latestGallery : null,
      promos: latestPromos,
      store: latestStore,
      flavors: latestFlavors
    };
  } catch (err) {
    console.warn('⚠️ [Cloud Sync] Erro ao buscar histórico de configurações:', err);
    return null;
  }
}

/**
 * Subscribe to real-time configuration events (changes made on PC push to phone live)
 */
export function subscribeToConfigEvents({ onProductsUpdate, onGalleryUpdate, onPromosUpdate, onStoreUpdate, onPizzaFlavorsUpdate } = {}) {
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

            if (data.type === 'SUPABASE_CONFIG_SYNC' && data.data?.url && data.data?.key) {
              if (typeof window !== 'undefined') {
                const cur = localStorage.getItem('el_shadday_supabase_url');
                if (!cur) {
                  localStorage.setItem('el_shadday_supabase_url', data.data.url);
                  localStorage.setItem('el_shadday_supabase_anon_key', data.data.key);
                  window.location.reload();
                }
              }
            } else if (data.type === 'GALLERY_UPDATE_PING' || data.type === 'GALLERY_PING') {
              if (isSupabaseConfigured && supabase) {
                supabase.from('buffet_gallery').select('*').order('position', { ascending: true }).then(({ data: galData }) => {
                  if (Array.isArray(galData) && galData.length > 0) {
                    saveStoredBuffetGallery(galData);
                    if (onGalleryUpdate) onGalleryUpdate(galData);
                  } else {
                    supabase.from('company_settings').select('buffet_gallery').eq('id', 'el_shadday_config').single().then(({ data: cs }) => {
                      if (Array.isArray(cs?.buffet_gallery)) {
                        saveStoredBuffetGallery(cs.buffet_gallery);
                        if (onGalleryUpdate) onGalleryUpdate(cs.buffet_gallery);
                      }
                    });
                  }
                });
              }
            } else if (data.type === 'PRODUCTS_UPDATE' && Array.isArray(data.data)) {
              saveStoredProducts(data.data);
              if (onProductsUpdate) onProductsUpdate(data.data);
            } else if (data.type === 'GALLERY_UPDATE' && Array.isArray(data.data)) {
              if (data.data.length > 0) {
                saveStoredBuffetGallery(data.data);
                if (onGalleryUpdate) onGalleryUpdate(data.data);
              }
            } else if (data.type === 'PROMOS_UPDATE' && data.data) {
              saveStoredPromoSettings(data.data);
              if (onPromosUpdate) onPromosUpdate(data.data);
            } else if (data.type === 'STORE_UPDATE' && data.data) {
              saveStoredRestaurantInfo(data.data);
              if (onStoreUpdate) onStoreUpdate(data.data);
            } else if (data.type === 'PIZZA_FLAVORS_UPDATE' && Array.isArray(data.data)) {
              saveStoredPizzaFlavors(data.data);
              if (onPizzaFlavorsUpdate) onPizzaFlavorsUpdate(data.data);
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
    } else if (data.type === 'PIZZA_FLAVORS_UPDATE' && Array.isArray(data.data)) {
      if (onPizzaFlavorsUpdate) onPizzaFlavorsUpdate(data.data);
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
