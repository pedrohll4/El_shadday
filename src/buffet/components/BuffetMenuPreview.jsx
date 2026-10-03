import React, { useState } from 'react';
import { GoldFiligree } from './ElShaddayLogo';
import { Sparkles, Utensils, ArrowRight, Check } from 'lucide-react';

export function BuffetMenuPreview({ categories = [], onScrollToBuilder }) {
  const [activeCategoryTab, setActiveCategoryTab] = useState(categories[0]?.id || 'carnes');

  return (
    <section id="cardapio-preview" className="py-16 sm:py-24 bg-[#1A202A] text-slate-100 border-b border-[#2E3744] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#D8B85A]">
            Cardápio Selecionado & Variedades
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-white mt-2">
            O que oferecemos
          </h2>
          <GoldFiligree width="w-36 sm:w-48" className="mt-2 mb-3" />
          <p className="text-sm sm:text-base text-slate-300 font-light">
            Conheça as opções gastronômicas preparadas com carinho pela equipe do El Shadday.
          </p>
        </div>

        {/* Elegant Category Switcher */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          {categories.map(cat => {
            const isSelected = activeCategoryTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryTab(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#D8B85A] text-[#15191F] font-bold shadow-[0_2px_12px_rgba(216,184,90,0.3)]'
                    : 'bg-[#15191F] text-slate-300 hover:text-white border border-[#2E3744] hover:border-[#D8B85A]/40'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Category Details Showcase */}
        {categories.map(cat => {
          if (cat.id !== activeCategoryTab) return null;
          return (
            <div key={cat.id} className="mt-8 animate-fadeIn">
              
              {/* Category Info Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-[#2E3744]">
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#E8D58A]">
                    {cat.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    {cat.description || "Itens especiais para o seu evento"}
                  </p>
                </div>

                <button
                  onClick={onScrollToBuilder}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D8B85A] hover:text-white transition-colors cursor-pointer"
                >
                  <span>Incluir no Orçamento</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Items Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.items
                  .filter(item => item.active !== false)
                  .map(item => (
                    <div 
                      key={item.id}
                      className="rounded-xl bg-[#15191F] border border-[#2E3744] hover:border-[#D8B85A]/50 p-4 transition-all duration-200 hover:-translate-y-0.5 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-serif text-base font-bold text-slate-100 group-hover:text-[#E8D58A] transition-colors">
                          {item.name}
                        </h4>
                        <div className="w-5 h-5 rounded-full bg-[#D8B85A]/10 flex items-center justify-center flex-shrink-0 text-[#D8B85A]">
                          <Check className="w-3 h-3" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  ))}
              </div>

            </div>
          );
        })}

        {/* Reference Poster Poster-Style Cream Showcase Preview */}
        <div className="mt-14 pt-8 border-t border-[#2E3744]">
          <div className="rounded-2xl bg-[#F4F0E5] text-[#252A31] p-6 sm:p-8 border-2 border-[#D8B85A] shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
            
            <div className="text-center mb-6">
              <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-[#B3913A]">
                Visão Geral do Cardápio
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#15191F] mt-1">
                Serviço Completo com Elegância
              </h3>
              <div className="w-20 h-[1.5px] bg-[#D8B85A] mx-auto my-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              
              {/* Col 1: Carnes & Churrasco */}
              <div className="p-4 rounded-xl bg-white/70 border border-[#D8B85A]/30">
                <h4 className="font-serif text-base font-bold text-[#15191F] pb-2 border-b border-[#D8B85A]/30 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#B3913A]" />
                  <span>Carnes & Churrasco</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Cortes bovinos nobres, frango marinado, toscana artesanal, porco nobre e pão de alho crocante assados no ponto ideal.
                </p>
              </div>

              {/* Col 2: Pratos Especiais & Acompanhamentos */}
              <div className="p-4 rounded-xl bg-white/70 border border-[#D8B85A]/30">
                <h4 className="font-serif text-base font-bold text-[#15191F] pb-2 border-b border-[#D8B85A]/30 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#B3913A]" />
                  <span>Especiais & Guarnições</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Moqueca especial da casa, vatapá tradicional cremoso, farofa tradicional na manteiga, farofa tropeiro com bacon, arroz e saladas frescas.
                </p>
              </div>

              {/* Col 3: Bebidas & Sobremesas */}
              <div className="p-4 rounded-xl bg-white/70 border border-[#D8B85A]/30">
                <h4 className="font-serif text-base font-bold text-[#15191F] pb-2 border-b border-[#D8B85A]/30 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#B3913A]" />
                  <span>Bebidas & Doces</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Refrigerantes, sucos naturais e água servidos gelados em taças apropriadas, finalizando com mousses refinados de maracujá e cupuaçu.
                </p>
              </div>

            </div>

            {/* Bottom banner in cream card */}
            <div className="mt-6 pt-4 border-t border-[#D8B85A]/30 text-center">
              <p className="text-xs uppercase font-extrabold tracking-wider text-[#15191F]">
                ✦ JÁ INCLUSO GARÇONS, PRATARIA, TAÇAS, RECHAUDS E TALHERES ✦
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
