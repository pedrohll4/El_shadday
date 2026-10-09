import { createClient } from '@supabase/supabase-js';

const checkUrlParams = () => {
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get('sb_url') || params.get('supabase_url');
      const keyParam = params.get('sb_key') || params.get('supabase_key');
      if (urlParam && keyParam) {
        localStorage.setItem('el_shadday_supabase_url', urlParam.trim());
        localStorage.setItem('el_shadday_supabase_anon_key', keyParam.trim());
        // Clean URL params from address bar without reloading
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', cleanUrl);
        return { url: urlParam.trim(), key: keyParam.trim() };
      }
    } catch (e) {}
  }
  return null;
};

// Check if credentials came via URL query params (e.g. from 1-click sync link)
checkUrlParams();

const getEnvOrStored = (envKey, storageKey) => {
  const envVal = import.meta.env[envKey];
  if (envVal && !envVal.includes('placeholder')) return envVal;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && stored.trim()) return stored.trim();
    } catch (e) {}
  }
  return '';
};

const supabaseUrl = getEnvOrStored('VITE_SUPABASE_URL', 'el_shadday_supabase_url');
const supabaseAnonKey = getEnvOrStored('VITE_SUPABASE_ANON_KEY', 'el_shadday_supabase_anon_key');

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

export function saveCustomSupabaseConfig(url, key) {
  try {
    if (url) localStorage.setItem('el_shadday_supabase_url', url.trim());
    if (key) localStorage.setItem('el_shadday_supabase_anon_key', key.trim());
    window.location.reload();
  } catch (e) {
    console.error('Error saving custom supabase config:', e);
  }
}

export function clearCustomSupabaseConfig() {
  try {
    localStorage.removeItem('el_shadday_supabase_url');
    localStorage.removeItem('el_shadday_supabase_anon_key');
    window.location.reload();
  } catch (e) {
    console.error('Error clearing custom supabase config:', e);
  }
}

export function setAndInitSupabase(url, key) {
  try {
    if (url && key) {
      const prev = localStorage.getItem('el_shadday_supabase_url');
      localStorage.setItem('el_shadday_supabase_url', url.trim());
      localStorage.setItem('el_shadday_supabase_anon_key', key.trim());
      if (prev !== url.trim()) {
        window.location.reload();
      }
    }
  } catch (e) {}
}

if (!isSupabaseConfigured) {
  console.info(
    'ℹ️ Supabase não configurado. O sistema está utilizando sincronização em tempo real global (Cloud Pub/Sub + SSE) e armazenamento local.'
  );
} else {
  console.info('🚀 Supabase conectado com sucesso! Realtime e Banco de Dados ativos.');
}
