import React from 'react';
import { Flame, Package, Utensils, HeartHandshake, Pizza, Wine, Search } from 'lucide-react';
import { CATEGORIES } from '../data/menuData';

const ICONS_MAP = {
  Flame,
  Package,
  Utensils,
  HeartHandshake,
  Pizza,
  Wine
};

export function CategoryNav({ activeCategory, onSelectCategory, searchQuery, onSearchChange }) {
  return (
    <div className="sticky top-20 z-30 bg-dark-950/95 backdrop-blur-md border-b border-dark-800 py-3 shadow-lg transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
        
        {/* Search bar & Category title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-gold"></span>
              Cardápio Completo
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              (Selecione uma categoria ou busque pelo sabor)
            </span>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar esfirra, pizza, combo..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-dark-900 border border-dark-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all"
            />
          </div>
        </div>

        {/* Horizontal Category Chips (Scrollable on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar scroll-smooth">
          {CATEGORIES.map((cat) => {
            const Icon = ICONS_MAP[cat.icon] || Flame;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-gold to-amber-500 text-dark-950 font-bold shadow-glow-gold scale-105'
                    : 'bg-dark-900 text-slate-300 hover:text-white hover:bg-dark-850 border border-dark-800 hover:border-dark-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-dark-950' : 'text-brand-gold'}`} />
                <span>{cat.name}</span>
                {cat.id === 'caixas' && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${isActive ? 'bg-dark-950 text-brand-gold' : 'bg-brand-red text-white'}`}>
                    TOP
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
