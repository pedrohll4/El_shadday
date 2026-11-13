import React, { useEffect, useState } from 'react';
import { Menu, X, LogOut, ExternalLink, BellRing, MoreHorizontal } from 'lucide-react';
import { RESTAURANT_INFO } from '../../data/menuData';

/*
 * Moldura do painel (estilo Ola Click):
 *  - menu lateral fixo no computador, com grupos e contadores
 *  - barra superior com o interruptor "Loja aberta / fechada"
 *  - no celular: menu inferior com os atalhos principais + gaveta com o resto
 *
 * items: [{ id, label, icon, group, badge, badgeTone, onClick? }]
 */

function NavItem({ item, active, onSelect }) {
  const Icon = item.icon;
  const tone = item.badgeTone === 'alert'
    ? 'bg-red-500 text-white'
    : active ? 'bg-dark-950 text-brand-gold' : 'bg-dark-800 text-slate-300';
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
        active ? 'bg-brand-gold text-dark-950' : 'text-slate-300 hover:bg-dark-800 hover:text-white'
      }`}
    >
      <Icon className="w-[18px] h-[18px] flex-shrink-0" />
      <span className="flex-1 text-left truncate">{item.label}</span>
      {item.badge !== undefined && item.badge !== null && item.badge !== 0 && item.badge !== '' && (
        <span className={`min-w-[1.5rem] px-1.5 py-0.5 rounded-full text-[11px] font-black text-center ${tone}`}>{item.badge}</span>
      )}
    </button>
  );
}

function NavList({ items, activeId, onSelect }) {
  const groups = [];
  items.forEach(it => {
    let g = groups.find(x => x.name === it.group);
    if (!g) { g = { name: it.group, items: [] }; groups.push(g); }
    g.items.push(it);
  });
  return (
    <nav className="space-y-5">
      {groups.map(g => (
        <div key={g.name || 'main'}>
          {g.name && <p className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{g.name}</p>}
          <div className="space-y-1">
            {g.items.map(it => (
              <NavItem key={it.id} item={it} active={it.id === activeId} onSelect={onSelect} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function StoreStatusSwitch({ isOpen, onToggle, compact }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
        isOpen ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-red-500/10 border-red-500/40'
      }`}
      title={isOpen ? 'Clique para fechar a loja e pausar pedidos no site' : 'Clique para abrir a loja e liberar pedidos no site'}
      role="switch"
      aria-checked={isOpen}
    >
      <span className={`relative w-10 h-6 rounded-full transition-colors ${isOpen ? 'bg-emerald-500' : 'bg-dark-700'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${isOpen ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      <span className={`text-sm font-bold ${isOpen ? 'text-emerald-300' : 'text-red-300'}`}>
        {compact ? (isOpen ? 'Aberta' : 'Fechada') : (isOpen ? 'Loja aberta' : 'Loja fechada')}
      </span>
    </button>
  );
}

// Bolinha "Ao vivo": mostra se os pedidos estão chegando sozinhos
function LiveIndicator() {
  const [status, setStatus] = useState(() => {
    try { return window.__elShaddayOrdersLive || 'connecting'; } catch (e) { return 'connecting'; }
  });
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine !== false : true));
  useEffect(() => {
    const onStatus = (e) => setStatus(e.detail);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('el_shadday_orders_live', onStatus);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('el_shadday_orders_live', onStatus);
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  const state = !online ? 'offline' : status;
  const map = {
    live: { dot: 'bg-emerald-400', text: 'Ao vivo', cls: 'text-emerald-300', title: 'Pedidos novos aparecem sozinhos, sem atualizar a página' },
    connecting: { dot: 'bg-amber-400 animate-pulse', text: 'Conectando', cls: 'text-amber-300', title: 'Conectando ao servidor de pedidos' },
    reconnecting: { dot: 'bg-amber-400 animate-pulse', text: 'Reconectando', cls: 'text-amber-300', title: 'A conexão caiu e está voltando sozinha. Enquanto isso o painel confere os pedidos a cada 15 segundos.' },
    offline: { dot: 'bg-red-500 animate-pulse', text: 'Sem internet', cls: 'text-red-300', title: 'Sem internet neste aparelho: pedidos novos não chegam até a internet voltar' }
  };
  const m = map[state] || map.connecting;
  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-2 rounded-full bg-dark-900 border border-white/10 text-xs font-bold ${m.cls}`} title={m.title}>
      <span className={`w-2 h-2 rounded-full ${m.dot}`} /> <span className="hidden md:inline">{m.text}</span>
    </span>
  );
}

export function AdminShell({
  items,
  mobileItems,
  activeId,
  onSelect,
  title,
  subtitle,
  userName,
  roleLabel,
  isStoreOpen,
  onToggleStore,
  isAudioUnlocked,
  onToggleAudio,
  onBackToSite,
  onLogout,
  topExtra,
  children
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSelect = (item) => {
    setDrawerOpen(false);
    if (item.onClick) item.onClick();
    else onSelect(item.id);
  };

  const brand = (
    <div className="flex items-center gap-3 px-2">
      <img src={RESTAURANT_INFO.logoUrl} alt="" className="w-10 h-10 rounded-full border border-brand-gold/50 object-cover" />
      <div className="min-w-0">
        <p className="font-display font-bold text-white leading-tight truncate">El Shadday</p>
        <p className="text-[11px] text-slate-400 truncate">{roleLabel}</p>
      </div>
    </div>
  );

  const footer = (
    <div className="space-y-1 border-t border-white/5 pt-3">
      {userName && <p className="px-3 pb-1 text-xs text-slate-500 truncate">Olá, <span className="text-slate-300 font-semibold">{userName}</span></p>}
      <button type="button" onClick={onBackToSite} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-dark-800 cursor-pointer">
        <ExternalLink className="w-4 h-4" /> Ver site
      </button>
      <button type="button" onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-300 hover:bg-red-500/10 cursor-pointer">
        <LogOut className="w-4 h-4" /> Sair
      </button>
    </div>
  );

  return (
    <>
      {/* MENU LATERAL (computador) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col bg-dark-900 border-r border-white/5">
        <div className="py-4 border-b border-white/5">{brand}</div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavList items={items} activeId={activeId} onSelect={handleSelect} />
        </div>
        <div className="px-3 pb-4">{footer}</div>
      </aside>

      {/* GAVETA (celular) */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[82%] max-w-xs bg-dark-900 border-r border-white/10 flex flex-col animate-fade-in">
            <div className="py-4 border-b border-white/5 flex items-center justify-between pr-3">
              {brand}
              <button type="button" onClick={() => setDrawerOpen(false)} className="w-9 h-9 rounded-full bg-dark-800 text-slate-300 flex items-center justify-center cursor-pointer" aria-label="Fechar menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavList items={items} activeId={activeId} onSelect={handleSelect} />
            </div>
            <div className="px-3 pb-4">{footer}</div>
          </aside>
        </div>
      )}

      {/* BARRA SUPERIOR */}
      <header className="sticky top-0 z-30 bg-dark-950/95 backdrop-blur border-b border-white/5">
        <div className="flex items-center gap-3 px-3 sm:px-5 py-2.5">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden w-10 h-10 rounded-xl bg-dark-900 border border-white/10 text-slate-200 flex items-center justify-center cursor-pointer"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold text-white truncate">{title}</h1>
            {subtitle && <p className="text-xs text-slate-400 truncate hidden sm:block">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <LiveIndicator />
            {topExtra}
            <button
              type="button"
              onClick={onToggleAudio}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border cursor-pointer ${
                isAudioUnlocked ? 'border-white/10 text-slate-300 bg-dark-900' : 'border-brand-gold bg-brand-gold text-dark-950 animate-pulse'
              }`}
              title="Ativar/testar o alarme de novo pedido"
            >
              <BellRing className="w-4 h-4" />
              {isAudioUnlocked ? 'Som ativo' : 'Ativar som'}
            </button>
            <button
              type="button"
              onClick={onToggleAudio}
              className={`sm:hidden w-10 h-10 rounded-full flex items-center justify-center border cursor-pointer ${
                isAudioUnlocked ? 'border-white/10 text-slate-300 bg-dark-900' : 'border-brand-gold bg-brand-gold text-dark-950 animate-pulse'
              }`}
              aria-label="Ativar som"
            >
              <BellRing className="w-4 h-4" />
            </button>
            <StoreStatusSwitch isOpen={isStoreOpen} onToggle={onToggleStore} compact />
          </div>
        </div>
      </header>

      {children}

      {/* MENU INFERIOR (celular) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-dark-900/98 backdrop-blur border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        <div className="grid h-16" style={{ gridTemplateColumns: `repeat(${(mobileItems?.length || 0) + 1}, minmax(0, 1fr))` }}>
          {(mobileItems || []).map(it => {
            const Icon = it.icon;
            const active = it.id === activeId;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => handleSelect(it)}
                className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold cursor-pointer ${active ? 'text-brand-gold' : 'text-slate-400'}`}
              >
                <span className="relative">
                  <Icon className="w-6 h-6" />
                  {!!it.badge && (
                    <span className="absolute -top-1.5 -right-3 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">{it.badge}</span>
                  )}
                </span>
                {it.shortLabel || it.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-slate-400 cursor-pointer"
          >
            <MoreHorizontal className="w-6 h-6" />
            Mais
          </button>
        </div>
      </nav>
    </>
  );
}

