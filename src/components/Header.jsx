import React from 'react';
import { 
  ShoppingBag, MapPin, Crown, ChefHat, Sparkles
} from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';

export function Header({ 
  cartCount, 
  cartTotal = 0,
  onOpenCart, 
  activeBranch,
  onOpenBranchModal,
  onScrollToBuffet,
  onOpenAdmin,
  currentUser
}) {
  return (
    <header className="sticky top-0 z-40 bg-dark-950/90 backdrop-blur-xl border-b border-white/5 transition-all duration-300 w-full max-w-full shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* DESKTOP LAYOUT (sm and above): Elegant, unified row */}
        <div className="hidden sm:flex items-center justify-between h-20">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3">
            <a href="#" className="relative group flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-gold/80 p-0.5 bg-dark-900 shadow-glow-gold transition-all duration-300 group-hover:scale-105 group-hover:border-brand-gold flex-shrink-0">
                <img 
                  src={RESTAURANT_INFO.logoUrl} 
                  alt={RESTAURANT_INFO.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-xl tracking-tight text-white group-hover:text-brand-gold transition-colors">
                    EL SHADDAY
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Aberto Agora</span>
                  </span>
                </div>
                
                <span className="text-[11px] text-slate-400 font-medium">
                  Esfihas & Pizzas Artesanais
                </span>
              </div>
            </a>
          </div>

          {/* Center: City / Branch Selector (Refined Luxury Pill) */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={onOpenBranchModal}
              className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-dark-900/80 hover:bg-dark-850 border border-brand-gold/40 hover:border-brand-gold text-left transition-all cursor-pointer group shadow-sm hover:shadow-glow-gold active:scale-98"
              title="Clique para alternar entre Ariquemes e Porto Velho"
            >
              <div className="w-6 h-6 rounded-full bg-brand-gold/15 flex items-center justify-center text-brand-gold flex-shrink-0">
                <MapPin className="w-3.5 h-3.5 text-brand-gold" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider leading-none">
                  Filial Selecionada
                </span>
                <span className="text-xs font-black text-white group-hover:text-amber-300 leading-tight">
                  {activeBranch?.displayName || 'Ariquemes - RO'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-brand-gold/90 group-hover:text-brand-gold ml-1 pl-2 border-l border-white/10">
                ⇄ Trocar
              </span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Buffet Anchor (Ariquemes only) */}
            {onScrollToBuffet && activeBranch?.id === 'ariquemes' && (
              <button
                type="button"
                onClick={onScrollToBuffet}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-dark-900/60 hover:bg-dark-850 text-slate-300 hover:text-brand-gold text-xs font-bold border border-white/10 hover:border-brand-gold/40 transition-all cursor-pointer"
                title="Conhecer serviços de Buffet para eventos"
              >
                <Crown className="w-4 h-4 text-brand-gold" />
                <span>Buffet & Eventos</span>
              </button>
            )}

            {/* Staff / Admin access if authenticated */}
            {currentUser && onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-brand-gold text-xs font-bold border border-brand-gold/30 hover:border-brand-gold transition-all cursor-pointer"
                title="Voltar ao Painel da Filial e Cozinha"
              >
                <ChefHat className="w-4 h-4 text-brand-gold" />
                <span className="hidden lg:inline">Painel Admin</span>
              </button>
            )}

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex items-center gap-2.5 bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold hover:from-amber-400 hover:to-brand-gold text-dark-950 font-black px-4 py-2.5 rounded-xl shadow-glow-gold transition-all duration-300 hover:scale-103 active:scale-97 cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 text-dark-950 flex-shrink-0" />
              <div className="flex flex-col items-start leading-tight">
                <span className="text-xs font-black">Minha Sacola</span>
                {cartTotal > 0 && (
                  <span className="text-[10px] font-extrabold text-dark-950/80">
                    R$ {cartTotal.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>

              {cartCount > 0 && (
                <span className="bg-dark-950 text-brand-gold text-[11px] font-black min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border border-brand-gold/60 ml-0.5">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* MOBILE LAYOUT (< sm): Clean, compact and spacious */}
        <div className="sm:hidden py-3 space-y-2">
          
          <div className="flex items-center justify-between gap-2">
            {/* Logo + Brand */}
            <a href="#" className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-brand-gold/70 p-0.5 bg-dark-900 flex-shrink-0 shadow-sm">
                <img 
                  src={RESTAURANT_INFO.logoUrl} 
                  alt={RESTAURANT_INFO.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="flex flex-col min-w-0 leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-black text-base text-white tracking-tight truncate">
                    EL SHADDAY
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
                </div>
                <span className="text-[10px] text-slate-400 truncate">
                  Esfihas & Pizzas
                </span>
              </div>
            </a>

            {/* Cart & Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {onScrollToBuffet && activeBranch?.id === 'ariquemes' && (
                <button
                  type="button"
                  onClick={onScrollToBuffet}
                  className="p-2 rounded-xl bg-dark-900 border border-brand-gold/30 text-brand-gold"
                  title="Buffet"
                >
                  <Crown className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onOpenCart}
                className="relative px-3 py-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <ShoppingBag className="w-4 h-4 flex-shrink-0" />
                <span>
                  {cartTotal > 0 ? `R$ ${cartTotal.toFixed(2).replace('.', ',')}` : 'Sacola'}
                </span>
                {cartCount > 0 && (
                  <span className="bg-dark-950 text-brand-gold text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ml-0.5">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile City Selector Pill */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
            <button
              type="button"
              onClick={onOpenBranchModal}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-dark-900/90 border border-brand-gold/30 text-left active:scale-98 transition-all"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" />
                <span className="text-[11px] font-bold text-slate-300 truncate">
                  Filial: <strong className="text-white">{activeBranch?.displayName || 'Ariquemes - RO'}</strong>
                </span>
              </div>
              <span className="text-[10px] font-extrabold text-brand-gold">
                ⇄ Trocar
              </span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
