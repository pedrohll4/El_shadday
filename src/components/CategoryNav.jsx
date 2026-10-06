import React from 'react';
import { 
  Flame, Package, Utensils, HeartHandshake, Pizza, Wine, Search, X, Crown 
} from 'lucide-react';
import { CATEGORIES, PRODUCTS } from '../data/menuData';

const ICONS_MAP = {
  Flame,
  Package,
  Utensils,
  HeartHandshake,
  Pizza,
  Wine
};

export function CategoryNav({ 
  activeCategory, 
  onSelectCategory, 
  searchQuery, 
  onSearchChange,
  onScrollToBuffet
}) {
  return (
    <div className="sticky top-[104px] sm:top-20 z-30 bg-dark-950/95 backdrop-blur-md border-b border-dark-800 py-2 sm:py-2.5 shadow-xl transition-all w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-2">
        
        {/* Search bar & Friendly helper title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse"></span>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Cardápio El Shadday
            </span>
          </div>

          {/* Search box with clear button (iFood style) */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar no cardápio de El Shadday..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs rounded-xl bg-dark-900 border border-dark-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-dark-800 text-slate-400 hover:text-white flex items-center justify-center text-xs cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Category Chips (Quick scroll navigation) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
          {CATEGORIES.map((cat) => {
            const Icon = ICONS_MAP[cat.icon] || Flame;
            const isActive = activeCategory === cat.id;
            const itemCount = PRODUCTS.filter(p => p.categoryId === cat.id).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 shadow-glow-gold scale-102 font-black'
                    : 'bg-dark-900 text-slate-300 hover:text-white hover:bg-dark-850 border border-dark-800 hover:border-brand-gold/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-dark-950' : 'text-brand-gold'}`} />
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-dark-950/20 text-dark-950' : 'bg-dark-800 text-slate-400'
                }`}>
                  {itemCount}
                </span>
              </button>
            );
          })}

          {/* Buffet Category Chip */}
          {onScrollToBuffet && (
            <button
              type="button"
              onClick={onScrollToBuffet}
              className="flex-shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold bg-dark-900 text-brand-gold hover:text-amber-300 border border-brand-gold/30 hover:border-brand-gold transition-all cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-brand-gold" />
              <span>Buffet & Eventos</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-brand-gold/20 text-brand-gold font-bold">
                Orçamento
              </span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
