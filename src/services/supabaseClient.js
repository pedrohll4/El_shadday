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

const DEFAULT_SUPABASE_URL = 'https://yzeemqzxlgudynydvpof.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZWVtcXp4bGd1ZHlueWR2cG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MjAwOTgsImV4cCI6MjEwNzA5NjA5OH0.aahKZCTuVyJ9lNS09EZPVhaucSRhTL6pDGwKITSUnwg';

const getEnvOrStored = (staticEnvVal, storageKey, fallbackVal = '') => {
  if (staticEnvVal && typeof staticEnvVal === 'string' && !staticEnvVal.includes('placeholder')) {
    return staticEnvVal.trim();
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && stored.trim()) return stored.trim();
    } catch (e) {}
  }
  return fallbackVal;
};

// STATIC access required by Vite compiler for production builds:
const supabaseUrl = getEnvOrStored(import.meta.env.VITE_SUPABASE_URL, 'el_shadday_supabase_url', DEFAULT_SUPABASE_URL);
const supabaseAnonKey = getEnvOrStored(import.meta.env.VITE_SUPABASE_ANON_KEY, 'el_shadday_supabase_anon_key', DEFAULT_SUPABASE_ANON_KEY);

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
