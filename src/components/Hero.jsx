import React from 'react';
import { Sparkles, Package, Pizza, Clock, Award, ShieldCheck, ChevronDown } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';

export function Hero({ onOpenBoxBuilder, onScrollToMenu }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950 pt-8 pb-16 lg:py-20 border-b border-dark-800/80">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none -z-0"></div>
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-brand-red/10 rounded-full blur-3xl pointer-events-none -z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline & Action Buttons */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-dark-800/90 border border-brand-gold/30 text-brand-goldLight text-xs font-semibold shadow-inner">
              <Award className="w-4 h-4 text-brand-gold" />
              <span>Pioneiros em Caixas de Esfirras em Ariquemes • Há 15 Anos</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.12]">
              Sabor artesanal que <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-brand-gold via-amber-300 to-brand-goldLight bg-clip-text text-transparent drop-shadow-sm">
                derrete na boca
              </span>{' '}
              a cada mordida.
            </h1>

            {/* Subtitle / Promise */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Esfirras salgadas e doces recheadas até a borda, massas frescas assadas no ponto e pizzas com 
              <span className="text-brand-gold font-bold"> borda de Catupiry 100% grátis</span>. O verdadeiro delivery da sua família!
            </p>

            {/* Action CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={onScrollToMenu}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold hover:from-amber-400 hover:to-brand-gold text-dark-950 font-bold text-base shadow-glow-gold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Fazer Meu Pedido</span>
                <ChevronDown className="w-5 h-5 text-dark-950" />
              </button>

              <button
                onClick={onOpenBoxBuilder}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-dark-800/90 hover:bg-dark-750 text-white font-semibold text-base border border-dark-700 hover:border-brand-gold/50 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
              >
                <Package className="w-5 h-5 text-brand-gold group-hover:rotate-12 transition-transform" />
                <span>Montar Caixa de Esfirras</span>
              </button>
            </div>

            {/* Quick Benefits / Trust Badges */}
            <div className="pt-6 border-t border-dark-800 grid grid-cols-2 sm:grid-cols-3 gap-4 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-gold/15 flex items-center justify-center text-brand-gold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">45 - 75 min</div>
                  <div className="text-[11px] text-slate-400">Entrega rápida</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">15 Anos</div>
                  <div className="text-[11px] text-slate-400">Tradição & Qualidade</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
                <div className="w-8 h-8 rounded-lg bg-brand-red/15 flex items-center justify-center text-brand-red">
                  <Pizza className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Borda Grátis</div>
                  <div className="text-[11px] text-slate-400">Catupiry nas Pizzas</div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Main Visual Card */}
              <div className="relative rounded-3xl overflow-hidden border border-brand-gold/30 bg-gradient-to-b from-dark-850 to-dark-900 shadow-2xl p-2.5 group">
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-dark-950">
                  <img
                    src="https://assets.olaclick.app/companies/products/images/800/4cfa4549-ad5f-4b4e-b539-468584a0eeba.png"
                    alt="Caixa de Esfirras El Shadday"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent"></div>
                  
                  {/* Floating Tag Top Right */}
                  <div className="absolute top-3 right-3 bg-brand-red text-white text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>CARRO-CHEFE</span>
                  </div>

                  {/* Caption on the image */}
                  <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-dark-950/80 backdrop-blur-md border border-dark-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-brand-gold font-bold tracking-wider uppercase">Mais Pedida em Ariquemes</div>
                      <div className="text-sm font-extrabold text-white">Caixa com 20 Esfirras</div>
                      <div className="text-[11px] text-slate-300">15 Salgadas + 5 Doces</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 line-through">R$ 40,00</div>
                      <div className="text-lg font-black text-brand-gold">R$ 35,00</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Mini Card - Pizza Highlight */}
              <div className="absolute -bottom-6 -left-4 sm:-left-6 bg-dark-900/95 backdrop-blur-md border border-brand-gold/40 p-3.5 rounded-2xl shadow-glow-gold flex items-center gap-3 max-w-[240px] animate-bounce-subtle">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-dark-950 border border-dark-800">
                  <img
                    src="https://assets.olaclick.app/companies/products/images/800/80ee539a-0a44-44f7-abf5-5e02b4c2f34b.png"
                    alt="Pizza Família com borda"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-brand-gold uppercase tracking-wider">Presente da Casa 🎁</div>
                  <div className="text-xs font-bold text-white leading-tight">Borda Recheada Grátis</div>
                  <div className="text-[11px] text-slate-400">Em todas as pizzas</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
