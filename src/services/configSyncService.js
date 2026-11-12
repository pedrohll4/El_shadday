/**
 * Cloud Configuration Synchronization Service for El Shadday
 * Synchronizes Menu Products, Buffet Gallery Photos, Promotions and Store Settings
 * in real-time across ALL customer phones, admin computers and tablets worldwide.
 * 
 * Works with or without Supabase, guaranteeing zero-config instant multi-device sync!
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { saveStoredProducts, saveStoredPromoSettings, getStoredRestaurantInfo, saveStoredRestaurantInfo, saveStoredPizzaFlavors, saveStoredAcaiSettings, saveStoredDistricts, saveStoredCategories, saveStoredExtraSauceConfig, stripPrivateCardMachineSettings } from '../data/menuData';
import { fixLegacyStoreAddress } from '../data/branchesData';
import { saveStoredBuffetGallery, saveUnavailableBuffetItemIds, getUnavailableBuffetItemIds, saveStoredBuffetCategories } from '../buffet/buffetData';

const CONFIG_TOPIC = 'el-shadday-config-sync-ariquemes-v2';
const NTFY_CONFIG_URL = `https://ntfy.sh/${CONFIG_TOPIC}`;

// SEGURANÇA: o tópico ntfy.sh é PÚBLICO. Com o Supabase ativo ele não é usado,
// senão qualquer pessoa poderia publicar preços/loja fechada falsos para os clientes.
const shouldUseNtfyFallback = () => !(isSupabaseConfigured && supabase);

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
          card_machine_settings: data.cardMachineSettings ? stripPrivateCardMachineSettings(data.cardMachineSettings) : data.cardMachineSettings,
          delivery_active: data.isOpen !== false,
          updated_at: new Date().toISOString()
        });
      } else if (type === 'PIZZA_FLAVORS_UPDATE') {
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          pizza_flavors: data,
          updated_at: new Date().toISOString()
        });
      } else if (type === 'ACAI_SETTINGS_UPDATE') {
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          acai_settings: data,
          updated_at: new Date().toISOString()
        });
      } else if (type === 'BUFFET_CATEGORIES_UPDATE') {
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          buffet_categories: data,
          updated_at: new Date().toISOString()
        });
      } else if (type === 'DELIVERY_DISTRICTS_UPDATE') {
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          delivery_districts: data,
          updated_at: new Date().toISOString()
        });
      } else if (type === 'DELIVERY_CATEGORIES_UPDATE') {
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          delivery_categories: data,
          updated_at: new Date().toISOString()
        });
      } else if (type === 'BUFFET_AVAILABILITY_UPDATE') {
        let currentPromos = {};
        try {
          const raw = localStorage.getItem('el_shadday_delivery_promos_v2');
          if (raw) currentPromos = JSON.parse(raw);
        } catch (e) {}
        currentPromos.buffet_unavailable_items = Array.isArray(data) ? data : [];
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          promo_settings: currentPromos,
          updated_at: new Date().toISOString()
        });
      } else if (type === 'EXTRA_SAUCE_UPDATE') {
        let currentPromos = {};
        try {
          const raw = localStorage.getItem('el_shadday_delivery_promos_v2');
          if (raw) currentPromos = JSON.parse(raw);
        } catch (e) {}
        currentPromos.extra_sauce_config = data;
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          promo_settings: currentPromos,
          updated_at: new Date().toISOString()
        });
      } else if (type === 'GALLERY_UPDATE') {
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          buffet_gallery: data,
          updated_at: new Date().toISOString()
        });

        // Clean buffet_gallery table and synchronize with new array
        await supabase.from('buffet_gallery').delete().neq('id', 'placeholder_none');
        if (Array.isArray(data) && data.length > 0) {
          const rows = data.map((item, i) => ({
            id: item.id || `media_${Date.now()}_${i}`,
            url: item.url,
            title: item.title || 'Buffet El Shadday',
            subtitle: item.subtitle || '',
            category: item.category || 'churrasco',
            tag: item.tag || 'Buffet',
            type: item.type || 'image',
            thumbnail: item.thumbnail || item.url,
            position: i
          }));
          await supabase.from('buffet_gallery').insert(rows);
        }
      }
    } catch (err) {
      console.warn('⚠️ Supabase config sync error:', err);
    }
  }

  // 3. Dispatch to Global Cloud Pub/Sub (só sem Supabase)
  if (shouldUseNtfyFallback()) try {
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
 * Busca a linha de configuração da loja UMA vez e compartilha o resultado com quem
 * pedir nos próximos segundos (antes o site baixava a mesma linha 2x ao abrir).
 */
let companySettingsRequest = null;
export function getCompanySettingsRow() {
  if (!isSupabaseConfigured || !supabase) return Promise.resolve({ data: null, error: new Error('Supabase off') });
  if (!companySettingsRequest) {
    companySettingsRequest = Promise.resolve(
      supabase.from('company_settings').select('*').eq('id', 'el_shadday_config').single()
    ).catch(error => ({ data: null, error }));
    setTimeout(() => { companySettingsRequest = null; }, 5000);
  }
  return companySettingsRequest;
}

/**
 * Converte a linha de company_settings (snake_case) para o formato usado pela loja (camelCase).
 * Só sobrescreve campos que vieram preenchidos do banco.
 */
export function mapCompanySettingsToStore(data, currentStore = {}) {
  if (!data) return currentStore;
  return {
    ...currentStore,
    ...(data.name ? { name: data.name } : {}),
    ...(data.phone ? { phone: data.phone } : {}),
    ...(data.phone_display ? { phoneFormatted: data.phone_display } : {}),
    ...(data.address ? { address: fixLegacyStoreAddress(data.address) } : {}),
    ...(data.pix_key ? { pixKey: data.pix_key } : {}),
    ...(data.pix_name ? { pixName: data.pix_name } : {}),
    ...(data.delivery_active !== undefined && data.delivery_active !== null ? { isOpen: data.delivery_active } : {}),
    ...(data.card_machine_notice !== undefined && data.card_machine_notice !== null ? { cardMachineNotice: data.card_machine_notice } : {}),
    ...(data.card_machine_notice_active !== undefined && data.card_machine_notice_active !== null ? { cardMachineNoticeActive: data.card_machine_notice_active } : {}),
    ...(data.card_machine_settings ? { cardMachineSettings: stripPrivateCardMachineSettings(data.card_machine_settings) } : {})
  };
}

/**
 * Fetch latest config from the cloud (called when client opens app on mobile/pc).
 * When Supabase is configured, it is the authoritative source of truth.
 */
export async function fetchCloudConfigHistory() {
  // 1. If Supabase is active, query company_settings directly (Single Source of Truth)
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await getCompanySettingsRow();

      if (!error && data) {
        const products = Array.isArray(data.menu_products) && data.menu_products.length > 0 ? data.menu_products : null;
        const gallery = Array.isArray(data.buffet_gallery) ? data.buffet_gallery : [];
        const flavors = Array.isArray(data.pizza_flavors) && data.pizza_flavors.length > 0 ? data.pizza_flavors : null;
        const acaiSettings = data.acai_settings || null;
        const promos = data.promo_settings || null;
        const buffetCats = Array.isArray(data.buffet_categories) && data.buffet_categories.length > 0 ? data.buffet_categories : null;
        const deliveryDistricts = Array.isArray(data.delivery_districts) && data.delivery_districts.length > 0 ? data.delivery_districts : null;
        const deliveryCategories = Array.isArray(data.delivery_categories) && data.delivery_categories.length > 0 
          ? data.delivery_categories 
          : (Array.isArray(data.categories) && data.categories.length > 0 ? data.categories : null);
        
        if (products) saveStoredProducts(products);
        saveStoredBuffetGallery(gallery);
        if (flavors) saveStoredPizzaFlavors(flavors);
        if (acaiSettings) saveStoredAcaiSettings(acaiSettings);
        if (buffetCats) saveStoredBuffetCategories(buffetCats);
        if (deliveryDistricts) saveStoredDistricts(deliveryDistricts);
        if (deliveryCategories) saveStoredCategories(deliveryCategories);
        if (promos) {
          saveStoredPromoSettings(promos);
          if (promos.extra_sauce_config) {
            saveStoredExtraSauceConfig(promos.extra_sauce_config);
          }
          if (Array.isArray(promos.buffet_unavailable_items)) {
            saveUnavailableBuffetItemIds(promos.buffet_unavailable_items);
          }
        }
        let store = null;
        if (data.name || data.delivery_active !== undefined) {
          store = mapCompanySettingsToStore(data, getStoredRestaurantInfo());
          saveStoredRestaurantInfo(store);
        }

        return {
          products,
          gallery,
          promos,
          store,
          flavors,
          delivery_categories: deliveryCategories
        };
      }
    } catch (err) {
      console.warn('⚠️ [Cloud Sync] Erro ao buscar config do Supabase:', err);
    }
  }

  // 2. Fallback to ntfy.sh cloud cache only if Supabase is offline or not configured
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
            if (parsed.type === 'SUPABASE_CONFIG_SYNC') {
              // SEGURANÇA: ignorado (tópico público)
            } else if (parsed.type === 'PRODUCTS_UPDATE' && Array.isArray(parsed.data)) {
              latestProducts = parsed.data;
            } else if (parsed.type === 'GALLERY_UPDATE' && Array.isArray(parsed.data)) {
              latestGallery = parsed.data;
            } else if (parsed.type === 'GALLERY_UPDATE_PING' || parsed.type === 'GALLERY_PING') {
              if (isSupabaseConfigured && supabase) {
                try {
                  const { data: bgData } = await supabase.from('buffet_gallery').select('*').order('position', { ascending: true });
                  if (Array.isArray(bgData)) {
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
            } else if (parsed.type === 'PIZZA_FLAVORS_UPDATE_PING' || parsed.type === 'PIZZA_FLAVORS_PING') {
              if (isSupabaseConfigured && supabase) {
                try {
                  const { data: csData } = await supabase.from('company_settings').select('pizza_flavors').eq('id', 'el_shadday_config').single();
                  if (Array.isArray(csData?.pizza_flavors)) {
                    latestFlavors = csData.pizza_flavors;
                  }
                } catch (e) {}
              }
            } else if (parsed.type === 'ACAI_SETTINGS_UPDATE' && parsed.data) {
              saveStoredAcaiSettings(parsed.data);
            } else if (parsed.type === 'BUFFET_CATEGORIES_UPDATE' && Array.isArray(parsed.data)) {
              saveStoredBuffetCategories(parsed.data);
            } else if (parsed.type === 'DELIVERY_DISTRICTS_UPDATE' && Array.isArray(parsed.data)) {
              saveStoredDistricts(parsed.data);
            } else if (parsed.type === 'EXTRA_SAUCE_UPDATE' && parsed.data) {
              saveStoredExtraSauceConfig(parsed.data);
            }
          }
        }
      } catch (e) {}
    }

    // Apply latest changes to local storage & dispatch events
    if (Array.isArray(latestProducts)) {
      saveStoredProducts(latestProducts);
    }
    if (Array.isArray(latestGallery)) {
      saveStoredBuffetGallery(latestGallery);
    }
    if (latestPromos) {
      saveStoredPromoSettings(latestPromos);
    }
    if (latestStore) {
      saveStoredRestaurantInfo(latestStore);
    }
    if (Array.isArray(latestFlavors)) {
      saveStoredPizzaFlavors(latestFlavors);
    }

    return {
      products: latestProducts,
      gallery: latestGallery,
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
export function subscribeToConfigEvents({ onProductsUpdate, onGalleryUpdate, onPromosUpdate, onStoreUpdate, onPizzaFlavorsUpdate, onBuffetAvailabilityUpdate, onBuffetCategoriesUpdate, onDeliveryDistrictsUpdate, onDeliveryCategoriesUpdate } = {}) {
  let eventSource = null;
  let isCleanedUp = false;

  const connectSSE = () => {
    if (isCleanedUp || !shouldUseNtfyFallback()) return;
    try {
      eventSource = new EventSource(`${NTFY_CONFIG_URL}/sse`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'message' && payload.message) {
            const data = JSON.parse(payload.message);
            if (!data || !data.type) return;

            // SEGURANÇA: o tópico ntfy é público; nunca aceitar credenciais de banco vindas dele.
            if (data.type === 'SUPABASE_CONFIG_SYNC') {
              return;
            } else if (data.type === 'GALLERY_UPDATE_PING' || data.type === 'GALLERY_PING') {
              if (isSupabaseConfigured && supabase) {
                supabase.from('buffet_gallery').select('*').order('position', { ascending: true }).then(({ data: galData }) => {
                  if (Array.isArray(galData)) {
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
              saveStoredBuffetGallery(data.data);
              if (onGalleryUpdate) onGalleryUpdate(data.data);
            } else if (data.type === 'BUFFET_AVAILABILITY_UPDATE' && Array.isArray(data.data)) {
              saveUnavailableBuffetItemIds(data.data);
              if (onBuffetAvailabilityUpdate) onBuffetAvailabilityUpdate(data.data);
            } else if (data.type === 'PROMOS_UPDATE' && data.data) {
              saveStoredPromoSettings(data.data);
              if (Array.isArray(data.data.buffet_unavailable_items)) {
                saveUnavailableBuffetItemIds(data.data.buffet_unavailable_items);
                if (onBuffetAvailabilityUpdate) onBuffetAvailabilityUpdate(data.data.buffet_unavailable_items);
              }
              if (onPromosUpdate) onPromosUpdate(data.data);
            } else if (data.type === 'STORE_UPDATE' && data.data) {
              saveStoredRestaurantInfo(data.data);
              if (onStoreUpdate) onStoreUpdate(data.data);
            } else if (data.type === 'PIZZA_FLAVORS_UPDATE' && Array.isArray(data.data)) {
              saveStoredPizzaFlavors(data.data);
              if (onPizzaFlavorsUpdate) onPizzaFlavorsUpdate(data.data);
            } else if (data.type === 'PIZZA_FLAVORS_UPDATE_PING' || data.type === 'PIZZA_FLAVORS_PING') {
              if (isSupabaseConfigured && supabase) {
                supabase.from('company_settings').select('pizza_flavors').eq('id', 'el_shadday_config').single().then(({ data: csData }) => {
                  if (Array.isArray(csData?.pizza_flavors)) {
                    saveStoredPizzaFlavors(csData.pizza_flavors);
                    if (onPizzaFlavorsUpdate) onPizzaFlavorsUpdate(csData.pizza_flavors);
                  }
                }).catch(() => {});
              }
            } else if (data.type === 'BUFFET_CATEGORIES_UPDATE' && Array.isArray(data.data)) {
              saveStoredBuffetCategories(data.data);
              if (onBuffetCategoriesUpdate) onBuffetCategoriesUpdate(data.data);
            } else if (data.type === 'DELIVERY_DISTRICTS_UPDATE' && Array.isArray(data.data)) {
              saveStoredDistricts(data.data);
              if (onDeliveryDistrictsUpdate) onDeliveryDistrictsUpdate(data.data);
            } else if (data.type === 'DELIVERY_CATEGORIES_UPDATE' && Array.isArray(data.data)) {
              saveStoredCategories(data.data);
              if (onDeliveryCategoriesUpdate) onDeliveryCategoriesUpdate(data.data);
            } else if (data.type === 'EXTRA_SAUCE_UPDATE' && data.data) {
              saveStoredExtraSauceConfig(data.data);
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
    } else if (data.type === 'BUFFET_AVAILABILITY_UPDATE' && Array.isArray(data.data)) {
      saveUnavailableBuffetItemIds(data.data);
      if (onBuffetAvailabilityUpdate) onBuffetAvailabilityUpdate(data.data);
    } else if (data.type === 'PROMOS_UPDATE' && data.data) {
      if (onPromosUpdate) onPromosUpdate(data.data);
    } else if (data.type === 'STORE_UPDATE' && data.data) {
      if (onStoreUpdate) onStoreUpdate(data.data);
    } else if (data.type === 'PIZZA_FLAVORS_UPDATE' && Array.isArray(data.data)) {
      if (onPizzaFlavorsUpdate) onPizzaFlavorsUpdate(data.data);
    } else if (data.type === 'BUFFET_CATEGORIES_UPDATE' && Array.isArray(data.data)) {
      if (onBuffetCategoriesUpdate) onBuffetCategoriesUpdate(data.data);
    } else if (data.type === 'DELIVERY_DISTRICTS_UPDATE' && Array.isArray(data.data)) {
      if (onDeliveryDistrictsUpdate) onDeliveryDistrictsUpdate(data.data);
    } else if (data.type === 'EXTRA_SAUCE_UPDATE' && data.data) {
      saveStoredExtraSauceConfig(data.data);
    } else if (data.type === 'DELIVERY_CATEGORIES_UPDATE' && Array.isArray(data.data)) {
      if (onDeliveryCategoriesUpdate) onDeliveryCategoriesUpdate(data.data);
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
