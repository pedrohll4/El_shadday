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
    <header className="sticky top-0 z-40 bg-dark-950/90 backdrop-blur-md border-b border-dark-800 transition-all duration-300">
      
      {/* Top Banner Notice with Promotion */}
      <div className="bg-gradient-to-r from-brand-goldDark via-brand-gold to-brand-goldDark text-dark-950 px-3 sm:px-4 py-1.5 text-xs font-semibold tracking-wide flex items-center justify-between sm:justify-center gap-2 shadow-inner">
        <span className="flex items-center gap-1.5 truncate">
          <Flame className="w-3.5 h-3.5 text-dark-950 flex-shrink-0 animate-bounce" />
          <strong className="hidden xs:inline">PROMOÇÃO:</strong> Borda de Catupiry 100% GRÁTIS em todas as pizzas salgadas!
        </span>

        {/* Quick link to Buffet on top banner on mobile */}
        {onScrollToBuffet && (
          <button
            type="button"
            onClick={onScrollToBuffet}
            className="sm:hidden text-[11px] font-black underline uppercase hover:text-black flex-shrink-0 cursor-pointer"
          >
            Buffet ➔
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Info */}
          <div className="flex items-center gap-3">
            <a href="#" className="relative group flex items-center gap-2.5 sm:gap-3">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full overflow-hidden border-2 border-brand-gold p-0.5 bg-dark-900 shadow-glow-gold transition-transform duration-300 group-hover:scale-105 flex-shrink-0">
                <img 
                  src={RESTAURANT_INFO.logoUrl} 
                  alt={RESTAURANT_INFO.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-base sm:text-xl tracking-tight text-white group-hover:text-brand-gold transition-colors">
                    EL SHADDAY
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="hidden xs:inline">Aberto</span>
                  </span>
                </div>
                
                <span className="text-[11px] text-slate-400 font-medium">
                  Delivery de Esfirras & Pizzas
                </span>
              </div>
            </a>
          </div>

          {/* Active Branch Badge & Switcher */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={onOpenBranchModal}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-dark-900 hover:bg-dark-850 border border-brand-gold/30 hover:border-brand-gold text-left transition-all cursor-pointer group shadow-sm"
              title="Clique para trocar de filial"
            >
              <div className="w-6 h-6 rounded-lg bg-brand-gold/15 flex items-center justify-center text-brand-gold flex-shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-brand-gold tracking-wider leading-none">
                  Unidade Ativa
                </span>
                <span className="text-xs font-extrabold text-white group-hover:text-amber-300 leading-tight">
                  {activeBranch?.displayName || 'Ariquemes - RO'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-brand-gold underline ml-1 hidden sm:inline">
                Trocar
              </span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Buffet Section Anchor Button */}
            {onScrollToBuffet && (
              <button
                type="button"
                onClick={onScrollToBuffet}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dark-900 hover:bg-dark-850 text-brand-gold hover:text-amber-300 text-xs font-bold border border-brand-gold/30 hover:border-brand-gold/60 transition-all cursor-pointer"
                title="Conhecer e solicitar orçamento de Buffet para eventos"
              >
                <Crown className="w-4 h-4 text-brand-gold" />
                <span>Buffet & Eventos</span>
              </button>
            )}

            {/* Kitchen KDS Panel Button */}
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dark-900 hover:bg-dark-850 text-brand-gold hover:text-amber-300 text-xs font-bold border border-brand-gold/30 hover:border-brand-gold transition-all cursor-pointer shadow-sm"
                title="Painel de Pedidos da Cozinha (KDS)"
              >
                <ChefHat className="w-4 h-4 text-brand-gold" />
                <span className="hidden sm:inline">Cozinha</span>
              </button>
            )}

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-gradient-to-r from-brand-gold to-amber-500 hover:from-amber-400 hover:to-brand-gold text-dark-950 font-extrabold px-3.5 sm:px-4 py-2.5 rounded-xl shadow-glow-gold transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 text-dark-950 flex-shrink-0" />
              <div className="flex flex-col items-start leading-tight">
                <span className="text-xs font-black hidden sm:inline">Minha Sacola</span>
                {cartTotal > 0 ? (
                  <span className="text-[11px] font-black sm:hidden">
                    R$ {cartTotal.toFixed(2).replace('.', ',')}
                  </span>
                ) : (
                  <span className="text-xs font-black sm:hidden">Sacola</span>
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
      </div>
    </header>
  );
}
