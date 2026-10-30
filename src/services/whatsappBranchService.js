/**
 * Serviço de Gerenciamento do Motor WhatsApp Baileys na Nuvem (Render) e Local
 * Permite que a Vercel converse diretamente com a URL do Render
 * e controle quando desativar a abertura de novas guias no navegador.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'el_shadday_branch_whatsapp_sessions_v3';
const CLOUD_URL_KEY = 'el_shadday_cloud_engine_url_v1';

export const DEFAULT_CLOUD_URL = 'https://el-shadday-whatsap.onrender.com';

export function getCloudEngineUrl() {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CLOUD_URL_KEY);
      if (stored && stored.trim()) return stored.trim();
    } catch (e) {}
  }
  return DEFAULT_CLOUD_URL;
}

export function saveCloudEngineUrl(url) {
  const clean = (url || '').trim().replace(/\/+$/, '');
  try {
    localStorage.setItem(CLOUD_URL_KEY, clean);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('el_shadday_cloud_url_updated', { detail: clean }));
    }
  } catch (e) {}

  // Salva no Supabase para sincronizar em todos os computadores/celulares da pizzaria
  if (isSupabaseConfigured && supabase) {
    try {
      supabase.from('company_settings').select('card_machine_settings').eq('id', 'el_shadday_config').single()
        .then(({ data }) => {
          const existing = data?.card_machine_settings || {};
          supabase.from('company_settings').update({
            card_machine_settings: {
              ...existing,
              cloud_engine_url: clean
            }
          }).eq('id', 'el_shadday_config');
        }).catch(() => {});
    } catch (err) {}
  }

  return clean;
}

export async function syncCloudEngineUrlFromDatabase() {
  if (!isSupabaseConfigured || !supabase) return getCloudEngineUrl();
  try {
    const { data } = await supabase.from('company_settings').select('card_machine_settings').eq('id', 'el_shadday_config').single();
    const cloudUrl = data?.card_machine_settings?.cloud_engine_url;
    if (cloudUrl && cloudUrl.startsWith('http')) {
      const current = getCloudEngineUrl();
      if (!current || current === DEFAULT_CLOUD_URL) {
        localStorage.setItem(CLOUD_URL_KEY, cloudUrl);
        return cloudUrl;
      }
    }
  } catch (e) {}
  return getCloudEngineUrl();
}

export const DEFAULT_WHATSAPP_SESSIONS = {
  ariquemes: {
    branchId: 'ariquemes',
    branchName: 'Unidade Ariquemes',
    status: 'disconnected', // 'connected' | 'connecting' | 'scan_qr' | 'disconnected'
    phone: '5569992228682',
    phoneFormatted: '(69) 99222-8682',
    sessionName: 'WhatsApp Ariquemes (Matriz)',
    device: 'WhatsApp Web (Baileys Cloud)',
    batteryLevel: 98,
    connectedAt: null,
    lastActivity: null,
    qrCodeDataUrl: null,
    autoNotify: true
  }
};

// Canal Supabase Realtime para ponte Vercel <-> Render
let supabaseBridgeChannel = null;

if (typeof window !== 'undefined' && isSupabaseConfigured && supabase) {
  try {
    supabaseBridgeChannel = supabase.channel('el_shadday_whatsapp_bridge');

    supabaseBridgeChannel
      .on('broadcast', { event: 'STATUS_UPDATE' }, ({ payload }) => {
        if (!payload) return;
        const normStatus = (payload.status || 'disconnected').toLowerCase();
        const isConn = normStatus === 'connected';

        const updates = {
          status: isConn ? 'connected' : (normStatus === 'scan_qr' ? 'scan_qr' : 'disconnected'),
          qrCodeDataUrl: payload.qrCodeDataUrl || null,
          batteryLevel: payload.batteryLevel || 98,
          lastActivity: new Date().toISOString()
        };

        if (payload.userInfo?.phone) {
          updates.phone = payload.userInfo.phone;
          updates.phoneFormatted = formatPhoneDisplay(payload.userInfo.phone);
        }

        updateBranchWhatsApp('ariquemes', updates);

        window.dispatchEvent(new CustomEvent('el_shadday_whatsapp_engine_update', {
          detail: { ...payload, branchId: 'ariquemes' }
        }));
      })
      .subscribe();
  } catch (err) {
    console.warn('[WhatsApp Branch] Falha ao inicializar bridge Supabase:', err);
  }
}

export function formatPhoneDisplay(digits) {
  const d = String(digits || '').replace(/\D/g, '');
  if (d.length === 13 && d.startsWith('55')) {
    return `(${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  }
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  return digits;
}

export function getAllBranchWhatsApp() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_WHATSAPP_SESSIONS, ...parsed };
    }
  } catch (e) {
    console.error('Error reading branch WhatsApp sessions:', e);
  }
  return DEFAULT_WHATSAPP_SESSIONS;
}

export function getBranchWhatsApp(branchId) {
  const all = getAllBranchWhatsApp();
  const id = branchId || 'ariquemes';
  return all[id] || {
    branchId: id,
    branchName: 'Unidade Ariquemes',
    status: 'disconnected',
    phone: '',
    phoneFormatted: '',
    sessionName: 'WhatsApp Ariquemes',
    device: 'WhatsApp Web (Baileys Cloud)',
    batteryLevel: 98,
    connectedAt: null,
    lastActivity: null,
    qrCodeDataUrl: null,
    autoNotify: true
  };
}

export function saveAllBranchWhatsApp(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('el_shadday_whatsapp_session_updated', { detail: sessions }));
    }
  } catch (e) {
    console.error('Error saving branch WhatsApp sessions:', e);
  }
}

export function updateBranchWhatsApp(branchId, updates) {
  const all = getAllBranchWhatsApp();
  const targetId = branchId || 'ariquemes';
  const existing = all[targetId] || getBranchWhatsApp(targetId);
  const updated = {
    ...existing,
    ...updates,
    lastActivity: new Date().toISOString()
  };
  all[targetId] = updated;
  saveAllBranchWhatsApp(all);
  return updated;
}

/**
 * Retorna true se o Baileys na nuvem/local estiver CONECTADO e pronto para envio invisível
 */
export function isCloudBaileysActive(branchId = 'ariquemes') {
  const session = getBranchWhatsApp(branchId);
  return session.status === 'connected' || session.status === 'CONNECTED';
}

export function disconnectBranchWhatsApp(branchId = 'ariquemes') {
  const engineUrl = getCloudEngineUrl();

  try {
    fetch(`${engineUrl}/logout`, { method: 'POST' }).catch(() => {});
  } catch (e) {}

  if (supabaseBridgeChannel) {
    try {
      supabaseBridgeChannel.send({
        type: 'broadcast',
        event: 'LOGOUT',
        payload: { branchId }
      }).catch(() => {});
    } catch (e) {}
  }

  return updateBranchWhatsApp(branchId, {
    status: 'disconnected',
    connectedAt: null,
    qrCodeDataUrl: null
  });
}

/**
 * Consulta o status em tempo real do motor de WhatsApp
 */
export async function fetchEngineStatus(branchId = 'ariquemes') {
  const engineUrl = getCloudEngineUrl();

  try {
    const res = await fetch(`${engineUrl}/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      const normStatus = String(data.status || 'DISCONNECTED').toLowerCase();
      
      const updates = {
        status: normStatus === 'scan_qr' ? 'scan_qr' : (normStatus === 'connected' ? 'connected' : 'disconnected'),
        qrCodeDataUrl: data.qrCodeDataUrl || null,
        batteryLevel: data.batteryLevel || 98
      };

      if (data.userInfo?.phone) {
        updates.phone = data.userInfo.phone;
        updates.phoneFormatted = formatPhoneDisplay(data.userInfo.phone);
      }

      updateBranchWhatsApp(branchId, updates);
      return data;
    }
  } catch (err) {
    // Fallback: se der erro de conexão direta (ex: HTTPS Vercel sem CORS ou inicializando),
    // requisita via Supabase Bridge
    if (supabaseBridgeChannel) {
      supabaseBridgeChannel.send({
        type: 'broadcast',
        event: 'REQUEST_STATUS',
        payload: { branchId }
      }).catch(() => {});
    }
  }

  return getBranchWhatsApp(branchId);
}

/**
 * Inicia conexão / solicitação de QR Code no motor
 */
export async function requestEngineConnect(branchId = 'ariquemes') {
  const engineUrl = getCloudEngineUrl();
  updateBranchWhatsApp(branchId, { status: 'connecting' });

  try {
    const res = await fetch(`${engineUrl}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    if (supabaseBridgeChannel) {
      supabaseBridgeChannel.send({
        type: 'broadcast',
        event: 'CONNECT',
        payload: { branchId }
      }).catch(() => {});
    }
  }

  return { status: 'CONNECTING' };
}

/**
 * Envia mensagem direta pelo motor Baileys na nuvem
 */
export async function sendEngineDirectMessage({ phone, message, orderId = null, status = null }) {
  const engineUrl = getCloudEngineUrl();
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (!cleanPhone || !message) {
    return { success: false, error: 'Telefone e mensagem são obrigatórios' };
  }

  // 1. Tenta envio direto via HTTP (para a URL do Render ou Localhost)
  try {
    const res = await fetch(`${engineUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone, message, orderId, status })
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, ...data };
    }
  } catch (err) {}

  // 2. Fallback via Supabase Bridge
  if (supabaseBridgeChannel) {
    try {
      supabaseBridgeChannel.send({
        type: 'broadcast',
        event: 'SEND_TEST',
        payload: { phone: cleanPhone, message, orderId, status }
      });
      return { success: true, queued: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  return { success: false, error: 'Motor WhatsApp não alcançado' };
}
