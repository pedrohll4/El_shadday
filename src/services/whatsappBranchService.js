/**
 * Serviço de Gerenciamento de Conexões WhatsApp por Filial
 * Conecta com o motor local gratuito (@whiskeysockets/baileys)
 * e via Supabase Realtime Bridge (para funcionamento no Vercel).
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'el_shadday_branch_whatsapp_sessions_v2';
export const LOCAL_ENGINE_URL = 'http://127.0.0.1:5001';

export const DEFAULT_WHATSAPP_SESSIONS = {
  ariquemes: {
    branchId: 'ariquemes',
    branchName: 'Unidade Ariquemes',
    status: 'disconnected', // 'connected' | 'connecting' | 'scan_qr' | 'disconnected'
    phone: '5569992228682',
    phoneFormatted: '(69) 99222-8682',
    sessionName: 'WhatsApp Ariquemes (Matriz)',
    device: 'WhatsApp Web (Baileys)',
    batteryLevel: 96,
    connectedAt: null,
    lastActivity: null,
    qrCodeDataUrl: null,
    apiUrl: LOCAL_ENGINE_URL,
    apiToken: '',
    autoNotify: true
  },
  'porto-velho': {
    branchId: 'porto-velho',
    branchName: 'Unidade Porto Velho',
    status: 'disconnected',
    phone: '5569992228682',
    phoneFormatted: '(69) 99222-8682',
    sessionName: 'WhatsApp Porto Velho (Filial)',
    device: 'WhatsApp Web (Baileys)',
    batteryLevel: 88,
    connectedAt: null,
    lastActivity: null,
    qrCodeDataUrl: null,
    apiUrl: LOCAL_ENGINE_URL,
    apiToken: '',
    autoNotify: true
  }
};

// Canal Supabase Realtime para ponte Vercel <-> Motor Local
let supabaseBridgeChannel = null;

if (typeof window !== 'undefined' && isSupabaseConfigured && supabase) {
  try {
    supabaseBridgeChannel = supabase.channel('el_shadday_whatsapp_bridge');

    supabaseBridgeChannel
      .on('broadcast', { event: 'STATUS_UPDATE' }, ({ payload }) => {
        if (!payload) return;
        const normStatus = (payload.status || 'disconnected').toLowerCase();
        const updates = {
          status: normStatus === 'scan_qr' ? 'scan_qr' : (normStatus === 'connected' ? 'connected' : 'disconnected'),
          qrCodeDataUrl: payload.qrCodeDataUrl || null,
          batteryLevel: payload.batteryLevel || 95,
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
  if (all[id]) return all[id];
  return {
    branchId: id,
    branchName: id === 'porto-velho' ? 'Unidade Porto Velho' : 'Unidade Ariquemes',
    status: 'disconnected',
    phone: '',
    phoneFormatted: '',
    sessionName: `WhatsApp ${id}`,
    device: 'WhatsApp Web',
    batteryLevel: 100,
    connectedAt: null,
    lastActivity: null,
    qrCodeDataUrl: null,
    apiUrl: LOCAL_ENGINE_URL,
    apiToken: '',
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

export function disconnectBranchWhatsApp(branchId) {
  // Envia comando de logout para o motor local e Supabase
  try {
    fetch(`${LOCAL_ENGINE_URL}/logout`, { method: 'POST' }).catch(() => {});
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

export function connectBranchWhatsApp(branchId, { phone, phoneFormatted, sessionName, apiUrl, apiToken }) {
  let cleanPhone = (phone || '').replace(/\D/g, '');
  if (cleanPhone.length === 10 || cleanPhone.length === 11) {
    cleanPhone = '55' + cleanPhone;
  }
  return updateBranchWhatsApp(branchId, {
    status: 'connected',
    phone: cleanPhone || '5569992228682',
    phoneFormatted: phoneFormatted || formatPhoneDisplay(cleanPhone) || '(69) 99222-8682',
    sessionName: sessionName || (branchId === 'porto-velho' ? 'WhatsApp Porto Velho' : 'WhatsApp Ariquemes'),
    device: 'WhatsApp Web (Baileys)',
    batteryLevel: Math.floor(Math.random() * 15) + 85,
    connectedAt: new Date().toISOString(),
    apiUrl: apiUrl || LOCAL_ENGINE_URL,
    apiToken: apiToken || '',
    qrCodeDataUrl: null
  });
}

/**
 * Consulta o status em tempo real do motor de WhatsApp
 * Tenta HTTP local primeiro; se falhar (ex: HTTPS Vercel), requisita via Supabase Realtime
 */
export async function fetchEngineStatus(branchId = 'ariquemes') {
  try {
    const res = await fetch(`${LOCAL_ENGINE_URL}/status`, {
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
        batteryLevel: data.batteryLevel || 95
      };

      if (data.userInfo?.phone) {
        updates.phone = data.userInfo.phone;
        updates.phoneFormatted = formatPhoneDisplay(data.userInfo.phone);
      }

      updateBranchWhatsApp(branchId, updates);
      return data;
    }
  } catch (err) {
    // Se falhou requisição direta (ex: HTTPS na Vercel bloqueando HTTP local)
    // Requisita via Supabase Bridge
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
 * Inicia conexão / geração de QR Code
 */
export async function requestEngineConnect(branchId = 'ariquemes') {
  updateBranchWhatsApp(branchId, { status: 'connecting' });

  try {
    const res = await fetch(`${LOCAL_ENGINE_URL}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    // Fallback Supabase Bridge
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
 * Envia mensagem direta pelo motor
 */
export async function sendEngineDirectMessage({ phone, message, orderId = null, status = null }) {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (!cleanPhone || !message) {
    return { success: false, error: 'Telefone e mensagem são obrigatórios' };
  }

  // 1. Tenta envio direto via HTTP local
  try {
    const res = await fetch(`${LOCAL_ENGINE_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone, message, orderId, status })
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, ...data };
    }
  } catch (err) {
    // Silencia e tenta via Supabase Bridge
  }

  // 2. Fallback via Supabase Bridge (para quando chamado na Vercel)
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
