import React from 'react';
import { Flame, Sparkles, Award } from 'lucide-react';

export function Interactive3DFoodStage() {
  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none py-2 lg:py-4">
      
      {/* Warm Golden Gourmet Aura (Pure CSS, ultra-lightweight) */}
      <div className="absolute inset-0 max-w-[420px] max-h-[360px] m-auto rounded-full bg-gradient-to-tr from-brand-gold/25 via-amber-500/15 to-transparent blur-3xl pointer-events-none animate-aura-glow"></div>

      {/* Main Food Showcase Container */}
      <div className="relative z-10 w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[460px] flex flex-col items-center justify-center">
        
        {/* Top Floating Glassmorphism Badge */}
        <div className="absolute -top-3 right-1 sm:right-4 z-20 flex items-center gap-1.5 px-3 py-1 bg-dark-900/90 backdrop-blur-md border border-brand-gold/40 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.8)] pointer-events-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-gold"></span>
          </span>
          <Flame className="w-3.5 h-3.5 text-brand-gold" />
          <span className="text-[11px] font-black text-brand-gold tracking-tight">
            Forno a Lenha • Na Hora
          </span>
        </div>

        {/* Floating Food Image (Pizza Artesanal & Esfirra Aberta) */}
        <div className="relative w-full animate-esfiha-float">
          <img
            src="/hero_pizza_esfiha.webp"
            alt="Pizza Artesanal e Esfirra Aberta El Shadday"
            className="w-full h-auto object-contain filter drop-shadow-[0_22px_35px_rgba(0,0,0,0.85)] pointer-events-none select-none"
            loading="eager"
            fetchPriority="high"
          />

          {/* Soft Dynamic Contact Shadow beneath the food */}
          <div className="w-[85%] h-6 mx-auto -mt-4 sm:-mt-6 bg-black/75 rounded-full blur-md pointer-events-none animate-shadow-breathe"></div>
        </div>

        {/* Bottom Floating Glassmorphism Feature Pill */}
        <div className="relative z-20 -mt-2 sm:-mt-3 flex items-center gap-1.5 px-3.5 py-1.5 bg-dark-900/90 backdrop-blur-md border border-brand-gold/30 rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.7)] pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-bold text-slate-200 tracking-tight">
            Massa Artesanal & Queijo Puxa de Verdade
          </span>
        </div>

      </div>

    </div>
  );
}
