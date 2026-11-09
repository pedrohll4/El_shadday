/**
 * Aviso de "NÃO SALVOU" para a equipe.
 *
 * Antes, quando o Supabase recusava uma gravação (cardápio, fotos, galeria,
 * pedidos...), o painel mostrava "salvo com sucesso" mesmo assim. Este módulo
 * confere TODA gravação feita pelo painel e mostra um aviso vermelho na tela
 * quando ela falha ou quando o login no servidor expirou.
 * Clientes do site nunca veem o aviso (só aparece com alguém da equipe logado).
 */
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getCurrentUser, isSecureAuthEnabled } from './authService';

let hasServerSession = false;
let secureMode = false;
let lastShownAt = 0;

export function showSaveError(message) {
  if (typeof document === 'undefined') return;
  if (!getCurrentUser()) return; // cliente comum: não mostra nada
  const now = Date.now();
  if (now - lastShownAt < 1500) return; // evita vários avisos iguais em sequência
  lastShownAt = now;

  let box = document.getElementById('el-shadday-save-error');
  if (!box) {
    box = document.createElement('div');
    box.id = 'el-shadday-save-error';
    box.setAttribute('role', 'alert');
    box.style.cssText = [
      'position:fixed', 'left:50%', 'bottom:20px', 'transform:translateX(-50%)', 'z-index:99999',
      'max-width:min(560px,calc(100vw - 32px))', 'background:#b91c1c', 'color:#fff',
      'padding:14px 44px 14px 16px', 'border-radius:14px', 'box-shadow:0 10px 30px rgba(0,0,0,.45)',
      'font:600 14px/1.4 system-ui,sans-serif'
    ].join(';');
    const close = document.createElement('button');
    close.textContent = '×';
    close.setAttribute('aria-label', 'Fechar aviso');
    close.style.cssText = 'position:absolute;top:6px;right:10px;background:none;border:0;color:#fff;font-size:22px;cursor:pointer';
    close.onclick = () => box.remove();
    const text = document.createElement('div');
    text.className = 'msg';
    box.append(text, close);
    document.body.appendChild(box);
  }
  box.querySelector('.msg').textContent = '⚠️ NÃO SALVOU NA NUVEM: ' + message;
  clearTimeout(box._timer);
  box._timer = setTimeout(() => box.remove(), 15000);
}

function friendlyMessage(table, error) {
  const msg = String(error?.message || error || '');
  if (/row-level security|permission denied|JWT|not authorized|401|403/i.test(msg)) {
    return 'seu login expirou ou não tem permissão. Saia do painel e entre de novo, depois repita a alteração.';
  }
  if (/fetch|network|Failed to fetch/i.test(msg)) {
    return 'sem internet no momento. Confira a conexão e repita a alteração.';
  }
  return `erro do servidor ao gravar (${table}): ${msg.slice(0, 140)}`;
}

if (typeof window !== 'undefined' && isSupabaseConfigured && supabase) {
  isSecureAuthEnabled().then(v => { secureMode = v; }).catch(() => {});
  try {
    supabase.auth.getSession().then(({ data }) => { hasServerSession = !!data?.session; }).catch(() => {});
    supabase.auth.onAuthStateChange((_event, session) => { hasServerSession = !!session; });
  } catch (e) {}

  // Confere o resultado de toda gravação (insert/upsert/update/delete)
  const originalFrom = supabase.from.bind(supabase);
  supabase.from = (table) => {
    const qb = originalFrom(table);
    ['insert', 'upsert', 'update', 'delete'].forEach((method) => {
      if (typeof qb[method] !== 'function') return;
      const originalMethod = qb[method].bind(qb);
      qb[method] = (...args) => {
        const fb = originalMethod(...args);
        const originalThen = fb.then.bind(fb);
        fb.then = (onFulfilled, onRejected) => originalThen((res) => {
          try {
            if (getCurrentUser()) {
              if (res?.error && res.error.code !== '23505') {
                showSaveError(friendlyMessage(table, res.error));
              } else if (!res?.error && secureMode && !hasServerSession && table !== 'orders') {
                // Sem login no servidor o banco ignora a alteração sem dar erro
                showSaveError(friendlyMessage(table, 'JWT'));
              }
            }
          } catch (e) {}
          return res;
        }).then(onFulfilled, onRejected);
        return fb;
      };
    });
    return qb;
  };
}
