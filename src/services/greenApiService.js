/**
 * Serviço de Integração com Green API (WhatsApp Cloud)
 * 100% compatível com Vercel (Pure HTTPS REST API - sem servidores ou PC local).
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'el_shadday_green_api_config_v1';

export const DEFAULT_GREEN_API_CONFIG = {
  idInstance: '',
  apiTokenInstance: '',
  enabled: true,
  status: 'disconnected', // 'authorized' | 'notAuthorized' | 'disconnected'
  phoneNumber: '',
  lastChecked: null
};

export function getGreenApiConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_GREEN_API_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error reading Green API config:', e);
  }
  return DEFAULT_GREEN_API_CONFIG;
}

export async function saveGreenApiConfig(config) {
  try {
    const next = { ...getGreenApiConfig(), ...config, lastChecked: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('el_shadday_green_api_updated', { detail: next }));
    }

    // Persiste também no Supabase para que todas as telas / filiais compartilhem a mesma credencial
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('company_settings').select('card_machine_settings').eq('id', 'el_shadday_config').single();
        const existing = data?.card_machine_settings || {};
        await supabase.from('company_settings').update({
          card_machine_settings: {
            ...existing,
            green_api_config: {
              idInstance: next.idInstance,
              apiTokenInstance: next.apiTokenInstance,
              enabled: next.enabled
            }
          }
        }).eq('id', 'el_shadday_config');
      } catch (err) {}
    }

    return next;
  } catch (e) {
    console.error('Error saving Green API config:', e);
    return config;
  }
}

/**
 * Carrega credenciais do Supabase na inicialização (se ainda não estiver no localStorage)
 */
export async function syncGreenApiFromCloud() {
  if (!isSupabaseConfigured || !supabase) return getGreenApiConfig();
  try {
    const { data } = await supabase.from('company_settings').select('card_machine_settings').eq('id', 'el_shadday_config').single();
    const cloudConfig = data?.card_machine_settings?.green_api_config;
    if (cloudConfig?.idInstance && cloudConfig?.apiTokenInstance) {
      const local = getGreenApiConfig();
      if (!local.idInstance) {
        return saveGreenApiConfig(cloudConfig);
      }
    }
  } catch (e) {}
  return getGreenApiConfig();
}

/**
 * Verifica o status da instância na Green API
 */
export async function checkGreenApiStatus() {
  const config = getGreenApiConfig();
  if (!config.idInstance || !config.apiTokenInstance) {
    return { authorized: false, status: 'not_configured', message: 'Credenciais não configuradas' };
  }

  const url = `https://api.green-api.com/waInstance${config.idInstance}/getStateInstance/${config.apiTokenInstance}`;

  try {
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (!res.ok) {
      return { authorized: false, status: 'error', error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    const isAuth = data.stateInstance === 'authorized';

    const updated = {
      ...config,
      status: isAuth ? 'authorized' : 'notAuthorized',
      lastChecked: new Date().toISOString()
    };

    saveGreenApiConfig(updated);
    return { authorized: isAuth, stateInstance: data.stateInstance };
  } catch (err) {
    return { authorized: false, status: 'error', error: err.message };
  }
}

/**
 * Obtém o QR Code da Green API para escanear no celular
 */
export async function getGreenApiQRCode() {
  const config = getGreenApiConfig();
  if (!config.idInstance || !config.apiTokenInstance) {
    return { success: false, error: 'Informe o ID da Instância e o Token primeiro.' };
  }

  const url = `https://api.green-api.com/waInstance${config.idInstance}/qr/${config.apiTokenInstance}`;

  try {
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (!res.ok) {
      return { success: false, error: `Erro na Green API: HTTP ${res.status}` };
    }
    const data = await res.json();

    if (data.type === 'alreadyLogged') {
      await saveGreenApiConfig({ status: 'authorized' });
      return { success: true, alreadyLogged: true };
    }

    if (data.type === 'qrCode' && data.message) {
      const qrDataUrl = data.message.startsWith('data:') 
        ? data.message 
        : `data:image/png;base64,${data.message}`;
      return { success: true, qrCodeDataUrl: qrDataUrl };
    }

    return { success: false, error: 'Não foi possível gerar o QR Code no momento.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Envia mensagem direta pelo Green API (100% Silencioso via Nuvem Vercel)
 */
export async function sendGreenApiMessage({ phone, message }) {
  const config = getGreenApiConfig();
  if (!config.idInstance || !config.apiTokenInstance || config.enabled === false) {
    return { success: false, notConfigured: true, error: 'Green API não está configurada ou desativada' };
  }

  let cleanPhone = String(phone || '').replace(/\D/g, '');
  if (cleanPhone.length === 10 || cleanPhone.length === 11) {
    cleanPhone = '55' + cleanPhone;
  }

  if (!cleanPhone) {
    return { success: false, error: 'Telefone inválido' };
  }

  const chatId = `${cleanPhone}@c.us`;
  const url = `https://api.green-api.com/waInstance${config.idInstance}/sendMessage/${config.apiTokenInstance}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        message
      })
    });

    if (res.ok) {
      const data = await res.json();
      console.log('✅ [Green API] Mensagem enviada com sucesso para', chatId, data);
      return { success: true, idMessage: data.idMessage };
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn('⚠️ [Green API] Falha no envio:', res.status, errData);
      return { success: false, error: errData.message || `HTTP ${res.status}` };
    }
  } catch (err) {
    console.warn('⚠️ [Green API] Erro de rede:', err.message);
    return { success: false, error: err.message };
  }
}
