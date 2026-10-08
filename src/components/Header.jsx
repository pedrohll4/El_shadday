import React from 'react';
import { 
  ShoppingBag, Phone, MapPin, Clock, Flame, ChevronRight, 
  Crown, Sparkles, Building2, UtensilsCrossed, ChefHat 
} from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';

export function Header({ 
  cartCount, 
  cartTotal = 0,
  onOpenCart, 
  activeBranch,
  onOpenBranchModal,
  onScrollToBuffet,
  onOpenAdmin
}) {
  return (
    <header className="sticky top-0 z-40 bg-dark-950/95 backdrop-blur-md border-b border-dark-800 transition-all duration-300 w-full max-w-full">
      
      {/* 1. Top Banner Notice with Promotion */}
      <div className="bg-gradient-to-r from-brand-goldDark via-brand-gold to-brand-goldDark text-dark-950 px-3 py-1 text-[11px] sm:text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 shadow-inner text-center">
        <Flame className="w-3.5 h-3.5 text-dark-950 flex-shrink-0 animate-bounce" />
        <span className="truncate">
          <strong>PROMOÇÃO:</strong> Borda de Catupiry 100% GRÁTIS em todas as pizzas!
        </span>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* DESKTOP LAYOUT (sm and above): All in 1 elegant row */}
        <div className="hidden sm:flex items-center justify-between h-20">
          
          {/* Logo & Brand Info */}
          <div className="flex items-center gap-3">
            <a href="#" className="relative group flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-gold p-0.5 bg-dark-900 shadow-glow-gold transition-transform duration-300 group-hover:scale-105 flex-shrink-0">
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
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Aberto</span>
                  </span>
                </div>
                
                <span className="text-[11px] text-slate-400 font-medium">
                  Delivery de Esfirras & Pizzas
                </span>
              </div>
            </a>
          </div>

          {/* Active Branch Switcher (Desktop) - High Visibility */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={onOpenBranchModal}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 hover:bg-dark-800 border-2 border-brand-gold/60 hover:border-brand-gold text-left transition-all cursor-pointer group shadow-sm hover:shadow-glow-gold active:scale-98"
              title="Clique para alternar entre Ariquemes e Porto Velho"
            >
              <div className="w-7 h-7 rounded-lg bg-brand-gold/20 flex items-center justify-center text-brand-gold flex-shrink-0 border border-brand-gold/40">
                <MapPin className="w-4 h-4 animate-bounce" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black text-brand-gold tracking-wider leading-none">
                  Filial Selecionada:
                </span>
                <span className="text-xs font-black text-white group-hover:text-amber-300 leading-tight">
                  {activeBranch?.displayName || 'Ariquemes - RO'}
                </span>
              </div>
              <div className="px-2 py-0.5 rounded-lg bg-brand-gold text-dark-950 text-[11px] font-black group-hover:bg-amber-400 transition-colors ml-1">
                ⇄ Trocar Cidade
              </div>
            </button>
          </div>

          {/* Right Action Buttons (Desktop) */}
          <div className="flex items-center gap-2.5">
            {/* Buffet Anchor Button */}
            {onScrollToBuffet && (
              <button
                type="button"
                onClick={onScrollToBuffet}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dark-900 hover:bg-dark-850 text-brand-gold hover:text-amber-300 text-xs font-bold border border-brand-gold/30 hover:border-brand-gold transition-all cursor-pointer"
                title="Conhecer serviços de Buffet para eventos"
              >
                <Crown className="w-4 h-4 text-brand-gold" />
                <span>Buffet & Eventos</span>
              </button>
            )}

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-gradient-to-r from-brand-gold to-amber-500 hover:from-amber-400 hover:to-brand-gold text-dark-950 font-extrabold px-4 py-2.5 rounded-xl shadow-glow-gold transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 text-dark-950 flex-shrink-0" />
              <div className="flex flex-col items-start leading-tight">
                <span className="text-xs font-black">Minha Sacola</span>
                {cartTotal > 0 && (
                  <span className="text-[10px] font-black text-dark-950/80">
                    R$ {cartTotal.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>

              {cartCount > 0 && (
                <span className="bg-dark-950 text-brand-gold text-xs font-black w-5 h-5 rounded-full flex items-center justify-center border border-brand-gold ml-0.5">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* MOBILE LAYOUT (< sm): 2 clean, spacious rows designed specifically for smartphones */}
        <div className="sm:hidden py-2 space-y-2">
          
          {/* Mobile Row 1: Logo & Cart */}
          <div className="flex items-center justify-between">
            {/* Logo + Brand */}
            <a href="#" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-brand-gold p-0.5 bg-dark-900 flex-shrink-0 shadow-sm">
                <img 
                  src={RESTAURANT_INFO.logoUrl} 
                  alt={RESTAURANT_INFO.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="flex flex-col leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-black text-base text-white tracking-tight">
                    EL SHADDAY
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Delivery & Buffet
                </span>
              </div>
            </a>

            {/* Mobile Actions: Cart */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenCart}
                className="relative px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 text-dark-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95"
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

          {/* Mobile Row 2: Prominent Branch Switcher & Buffet Shortcut */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-dark-800/60 text-xs">
            <button
              type="button"
              onClick={onOpenBranchModal}
              className="flex-1 flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-dark-900 border-2 border-brand-gold/60 active:border-brand-gold text-left active:scale-98 transition-all shadow-sm"
              title="Trocar entre Ariquemes e Porto Velho"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" />
                <span className="font-black text-white text-[11px] truncate">
                  {activeBranch?.displayName || 'Ariquemes - RO'}
                </span>
              </div>
              <span className="text-[10px] bg-brand-gold text-dark-950 font-black px-2 py-0.5 rounded-lg flex-shrink-0">
                ⇄ Trocar Cidade
              </span>
            </button>

            {onScrollToBuffet && (
              <button
                type="button"
                onClick={onScrollToBuffet}
                className="flex items-center gap-1 text-brand-gold font-bold text-[11px] px-2.5 py-1.5 rounded-xl bg-dark-900 border border-brand-gold/30 flex-shrink-0"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Buffet</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
