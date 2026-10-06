import React from 'react';
import { 
  Star, Clock, MapPin, ChevronRight, Sparkles, Flame, 
  Bike, ShoppingBag, ShieldCheck, Phone, Info, Award
} from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';

export function RestaurantStoreHeader({ 
  activeBranch, 
  onOpenBranchModal, 
  deliveryMode = 'delivery',
  onToggleDeliveryMode,
  onScrollToCategory
}) {
  return (
    <div className="w-full bg-dark-950 border-b border-dark-800">
      
      {/* 1. Cover Banner with Dark Gradient */}
      <div className="relative w-full h-40 sm:h-52 md:h-64 overflow-hidden bg-dark-900">
        <img
          src={RESTAURANT_INFO.bannerUrl}
          alt="Capa El Shadday"
          className="w-full h-full object-cover object-center opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950/80 via-transparent to-dark-950/80"></div>

        {/* Promo Floating Badge over Banner */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
          <div className="bg-brand-red text-white text-[11px] sm:text-xs font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-red-400/30">
            <Flame className="w-3.5 h-3.5 text-yellow-300 animate-bounce" />
            <span>BORDA GRÁTIS EM TODAS AS PIZZAS</span>
          </div>
        </div>
      </div>

      {/* 2. Restaurant Identity & Metadata (Padrão iFood) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 relative z-20 pb-5 sm:pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          
          {/* Left: Avatar Logo + Title + Tags */}
          <div className="flex items-start sm:items-end gap-3.5 sm:gap-5">
            {/* Store Logo with Golden Ring */}
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-3 border-brand-gold bg-dark-900 shadow-glow-gold flex-shrink-0 relative group">
              <img
                src={RESTAURANT_INFO.logoUrl}
                alt={RESTAURANT_INFO.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-brand-gold/10 pointer-events-none"></div>
            </div>

            {/* Title & Ratings */}
            <div className="space-y-1 sm:space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display font-black text-xl sm:text-3xl text-white tracking-tight leading-tight">
                  {RESTAURANT_INFO.shortName} Delivery
                </h1>
                
                {/* Status Aberto */}
                <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Aberto Agora</span>
                </span>
              </div>

              {/* Category Breadcrumbs / Tags */}
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                Pizzas Artesanais • Caixas de Esfirras • Combos • Buffet
              </p>

              {/* iFood Rating & Location Row */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400 pt-0.5">
                <div className="flex items-center gap-1 font-extrabold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>4.9</span>
                  <span className="text-slate-400 font-normal text-[11px]">(500+ pedidos)</span>
                </div>

                <span className="text-dark-700">•</span>

                {/* Filial Switcher */}
                <button
                  type="button"
                  onClick={onOpenBranchModal}
                  className="flex items-center gap-1 text-slate-300 hover:text-brand-gold transition-colors font-semibold group cursor-pointer"
                  title="Alterar filial"
                >
                  <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                  <span className="underline decoration-brand-gold/50 group-hover:decoration-brand-gold">
                    {activeBranch?.displayName || 'Ariquemes - RO'}
                  </span>
                  <span className="text-[10px] text-brand-gold font-bold ml-0.5">(Alterar)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Delivery / Takeout Switcher (iFood Standard Tabs) */}
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 md:pt-0">
            <div className="inline-flex p-1 rounded-2xl bg-dark-900 border border-dark-800 shadow-inner">
              <button
                type="button"
                onClick={() => onToggleDeliveryMode && onToggleDeliveryMode('delivery')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  deliveryMode === 'delivery'
                    ? 'bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>Entrega</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleDeliveryMode && onToggleDeliveryMode('retirada')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  deliveryMode === 'retirada'
                    ? 'bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Retirada</span>
              </button>
            </div>
          </div>

        </div>

        {/* 3. iFood Metrics Row: Delivery Time, Fee, Min Order */}
        <div className="mt-4 pt-4 border-t border-dark-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          
          {/* Tempo de entrega */}
          <div className="p-2.5 rounded-xl bg-dark-900/60 border border-dark-800/80 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-gold/15 flex items-center justify-center text-brand-gold flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tempo Estimado</div>
              <div className="font-extrabold text-white text-xs sm:text-sm">{RESTAURANT_INFO.deliveryTime}</div>
            </div>
          </div>

          {/* Taxa de Entrega */}
          <div className="p-2.5 rounded-xl bg-dark-900/60 border border-dark-800/80 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                {deliveryMode === 'delivery' ? 'Taxa de Entrega' : 'Retirada'}
              </div>
              <div className="font-extrabold text-emerald-400 text-xs sm:text-sm">
                {deliveryMode === 'delivery' ? 'A partir de R$ 8,00' : 'Grátis no Balcão'}
              </div>
            </div>
          </div>

          {/* Pedido Mínimo */}
          <div className="p-2.5 rounded-xl bg-dark-900/60 border border-dark-800/80 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-gold/15 flex items-center justify-center text-brand-gold flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pedido Mínimo</div>
              <div className="font-extrabold text-white text-xs sm:text-sm">R$ 20,00</div>
            </div>
          </div>

          {/* Tradição & Qualidade */}
          <div className="p-2.5 rounded-xl bg-dark-900/60 border border-dark-800/80 flex items-center gap-2.5 col-span-2 sm:col-span-1">
            <div className="w-8 h-8 rounded-lg bg-brand-red/15 flex items-center justify-center text-brand-red flex-shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tradição</div>
              <div className="font-extrabold text-white text-xs sm:text-sm">15 Anos em Ariquemes</div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
