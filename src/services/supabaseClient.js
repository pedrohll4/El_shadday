import { createClient } from '@supabase/supabase-js';

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

if (!isSupabaseConfigured) {
  console.info(
    'ℹ️ Supabase não configurado. O sistema está utilizando sincronização em tempo real global (Cloud Pub/Sub + SSE) e armazenamento local.'
  );
} else {
  console.info('🚀 Supabase conectado com sucesso! Realtime e Banco de Dados ativos.');
}
