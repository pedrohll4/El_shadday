import React from 'react';
import { 
  Star, Clock, MapPin, Bike, ShoppingBag, Sparkles, Flame, 
  ChevronRight, ArrowRight, Award, ShieldCheck, HeartHandshake, Crown
} from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';
import { Interactive3DFoodStage } from './Interactive3DFoodStage';

export function RestaurantStoreHeader({ 
  activeBranch, 
  onOpenBranchModal, 
  deliveryMode = 'delivery',
  onToggleDeliveryMode,
  onScrollToCategory
}) {
  const handleScrollToMenu = () => {
    if (onScrollToCategory) {
      onScrollToCategory('combos');
    } else {
      const el = document.getElementById('menu-section') || document.querySelector('main');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToBuffet = () => {
    const el = document.getElementById('buffet-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950 border-b border-white/5 py-6 sm:py-10 lg:py-12">
      
      {/* Ambient Gold Radial Glow Backdrops */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-96 h-96 rounded-full bg-brand-gold/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 right-10 w-80 h-80 rounded-full bg-amber-500/10 blur-[110px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: Gourmet Branding, Value Proposition, Mode Switcher & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 sm:space-y-5">
            
            {/* Chic Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-gold/10 border border-brand-gold/30 text-brand-goldLight text-xs font-semibold shadow-sm animate-fade-in">
              <Flame className="w-3.5 h-3.5 text-brand-gold fill-brand-gold animate-bounce" />
              <span>Assadas no Forno a Lenha • Massas Frescas & Fininhas</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-[1.15]">
              Esfihas & Pizzas <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-brand-gold via-amber-300 to-brand-goldLight bg-clip-text text-transparent drop-shadow-sm">
                Artesanais de Verdade
              </span>
            </h1>

            {/* Appetizing Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 font-normal max-w-xl leading-relaxed">
              Massa leve, recheios generosos e queijo derretido no ponto perfeito. 
              Peça direto e receba quentinho na sua casa ou retire no balcão sem taxas extras.
            </p>

            {/* Quick Metrics Bar (Clean Glassmorphism Pills) */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs">
              
              {/* Delivery Time */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dark-900/90 border border-white/10 text-slate-200 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-brand-gold" />
                <span className="font-bold text-white">{RESTAURANT_INFO.deliveryTime}</span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dark-900/90 border border-white/10 text-slate-200 shadow-sm">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="font-extrabold text-amber-300">4.9</span>
                <span className="text-[11px] text-slate-400">(500+ pedidos)</span>
              </div>

              {/* No signup / Sem Pedido Minimo */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-extrabold text-[11px]">Sem Pedido Mínimo</span>
              </div>

              {/* Branch Quick Switch Pill */}
              <button
                type="button"
                onClick={onOpenBranchModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dark-900/90 hover:bg-dark-850 border border-brand-gold/40 text-slate-200 hover:text-white transition-colors cursor-pointer group shadow-sm"
                title="Alterar cidade"
              >
                <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                <span className="font-extrabold text-white text-[11px]">{activeBranch?.displayName || 'Ariquemes - RO'}</span>
                <span className="text-[10px] text-brand-gold font-bold group-hover:underline">⇄</span>
              </button>

            </div>

            {/* Delivery / Retirada Interactive Mode Switcher */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Como deseja seu pedido?
              </span>

              <div className="inline-flex p-1 rounded-2xl bg-dark-900/90 border border-white/10 shadow-inner">
                <button
                  type="button"
                  onClick={() => onToggleDeliveryMode && onToggleDeliveryMode('delivery')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    deliveryMode === 'delivery'
                      ? 'bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black shadow-md scale-102'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Entrega em Casa</span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleDeliveryMode && onToggleDeliveryMode('retirada')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    deliveryMode === 'retirada'
                      ? 'bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black shadow-md scale-102'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Retirar no Balcão (Grátis)</span>
                </button>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleScrollToMenu}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold text-dark-950 font-black text-sm flex items-center justify-center gap-2 shadow-glow-gold hover:scale-103 active:scale-97 transition-all cursor-pointer group"
              >
                <span>🍕 Explorar Cardápio</span>
                <ArrowRight className="w-4 h-4 stroke-[3] transition-transform group-hover:translate-x-1" />
              </button>

              {activeBranch?.id === 'ariquemes' && (
                <button
                  type="button"
                  onClick={handleScrollToBuffet}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-dark-900/80 hover:bg-dark-850 text-brand-gold hover:text-amber-300 font-bold text-sm flex items-center justify-center gap-2 border border-brand-gold/30 hover:border-brand-gold/70 transition-all cursor-pointer"
                >
                  <Crown className="w-4 h-4 text-brand-gold" />
                  <span>Buffet para Eventos</span>
                </button>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Interactive 3D Food Stage (Rotate, Drag & Specular Shimmer) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <Interactive3DFoodStage />
          </div>

        </div>
      </div>

    </section>
  );
}
