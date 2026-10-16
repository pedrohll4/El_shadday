import React from 'react';
import { 
  Star, Clock, MapPin, Bike, ShoppingBag, Sparkles, Flame, 
  ChevronRight, ArrowRight, Award, ShieldCheck, HeartHandshake, Crown
} from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';

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

          {/* RIGHT COLUMN: 3D Appetizing Floating Showcase */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative select-none">
            
            {/* 3D Interactive Floating Stage */}
            <div 
              className="relative w-full max-w-[340px] sm:max-w-[380px] h-[280px] sm:h-[320px] flex items-center justify-center overflow-visible cursor-pointer"
              onClick={handleScrollToMenu}
              title="Clique para ir direto aos sabores do cardápio"
            >
              
              {/* Radial Auric Glow Aura */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-gold/25 via-amber-500/15 to-transparent blur-3xl animate-aura-glow pointer-events-none"></div>
              <div className="absolute w-56 h-56 rounded-full bg-[radial-gradient(circle,rgba(255,213,109,0.3)_0%,rgba(203,172,87,0.12)_45%,transparent_75%)] blur-2xl pointer-events-none"></div>

              {/* Floating Savory Embers & Steam */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <span className="absolute bottom-10 left-1/4 w-2 h-2 rounded-full bg-brand-gold shadow-[0_0_10px_#ffd56d] ember-1"></span>
                <span className="absolute bottom-14 right-1/4 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#e5b842] ember-2"></span>
                <span className="absolute bottom-8 right-1/3 w-1.5 h-1.5 rounded-full bg-amber-200 shadow-[0_0_8px_#fff] ember-3"></span>
                <span className="absolute bottom-12 left-1/3 w-2 h-2 rounded-full bg-brand-gold shadow-[0_0_8px_#ffd56d] ember-4"></span>
              </div>

              {/* Dynamic Levitation Ground Shadow */}
              <div className="absolute bottom-4 w-60 sm:w-68 h-6 bg-[radial-gradient(ellipse,rgba(0,0,0,0.85)_0%,rgba(14,14,16,0.5)_50%,transparent_75%)] rounded-full blur-md animate-shadow-breathe pointer-events-none"></div>

              {/* Floating 3D Food Element */}
              <div className="relative z-10 w-full h-full flex items-center justify-center animate-esfiha-float group">
                <img
                  src="https://yzeemqzxlgudynydvpof.supabase.co/storage/v1/object/public/gallery/hero_pizza_esfiha_round.webp"
                  alt="Esfirra Aberta Redonda Dourada e Fatia de Pizza Artesanal El Shadday"
                  className="w-full max-h-[260px] sm:max-h-[300px] object-contain transition-transform duration-500 group-hover:scale-105"
                  style={{
                    mixBlendMode: 'screen',
                    maskImage: 'radial-gradient(ellipse 92% 90% at 50% 50%, black 72%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 92% 90% at 50% 50%, black 72%, transparent 100%)'
                  }}
                />
              </div>

              {/* Floating Quality Badge (Glassmorphic) */}
              <div className="absolute bottom-2 right-2 sm:right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-dark-900/90 backdrop-blur-md border border-brand-gold/40 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.7)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-gold"></span>
                </span>
                <Flame className="w-3.5 h-3.5 text-brand-gold" />
                <span className="text-[11px] font-black text-brand-gold tracking-tight">
                  Queijo Puxando • Na Hora
                </span>
              </div>

            </div>

            {/* Micro Interaction Hint */}
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1 font-medium">
              <Sparkles className="w-3 h-3 text-brand-gold" />
              <span>Clique para ver os sabores e montar seu pedido</span>
            </p>

          </div>

        </div>
      </div>

    </section>
  );
}
