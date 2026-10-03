import React from 'react';
import { ElShaddayLogo, GoldFiligree } from './ElShaddayLogo';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2, ChevronDown, Clock, Wine, Users } from 'lucide-react';

export function BuffetHero({ company, onScrollToBuilder, onScrollToAbout }) {
  return (
    <section id="inicio" className="relative overflow-hidden bg-[#202630] pt-8 sm:pt-14 pb-16 sm:pb-24 border-b border-[#2E3744]">
      
      {/* Background Decorative Gold Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#D8B85A]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-[#D8B85A]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Centered Brand Badge directly referencing client's flyer */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          
          {/* Ornate Gold Filigree on top */}
          <GoldFiligree width="w-40 sm:w-56" className="mb-3 opacity-90" />

          {/* Full Regal Logo */}
          <ElShaddayLogo variant="full" size="lg" />

          {/* Gold Filigree under title */}
          <GoldFiligree width="w-48 sm:w-72" className="mt-3 mb-6 opacity-90" />

          {/* Main Headline */}
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-white tracking-tight leading-[1.15] mt-1">
            Seu evento merece uma <br className="hidden sm:inline" />
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#E8D58A] via-[#D8B85A] to-[#F5E7B2] italic font-serif">
              experiência inesquecível.
            </span>
          </h2>

          {/* Subtitle / Value Proposition */}
          <p className="mt-5 text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl font-light leading-relaxed">
            {company.subtitle || "Buffet personalizado para eventos, com opções de carnes nobres, acompanhamentos, pratos especiais, bebidas e muito mais."}
          </p>

          {/* CTA Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            
            {/* Primary Button */}
            <button
              onClick={onScrollToBuilder}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-[#D8B85A] via-[#E8D58A] to-[#D8B85A] text-[#15191F] shadow-[0_4px_25px_rgba(216,184,90,0.35)] hover:shadow-[0_6px_32px_rgba(216,184,90,0.55)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
            >
              <span>SOLICITAR ORÇAMENTO</span>
              <ArrowRight className="w-4 h-4 text-[#15191F] transition-transform group-hover:translate-x-1" />
            </button>

            {/* Secondary Button */}
            <button
              onClick={onScrollToAbout}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-medium text-sm tracking-wider uppercase text-slate-200 bg-[#15191F]/70 hover:bg-[#15191F] border border-[#D8B85A]/40 hover:border-[#D8B85A] transition-all cursor-pointer"
            >
              <span>CONHEÇA O EL SHADDAY</span>
            </button>

          </div>

          {/* Authentic High-Value Banner from Reference Flyer */}
          <div className="mt-10 w-full max-w-3xl">
            <div className="relative rounded-2xl bg-gradient-to-b from-[#1A202A] to-[#15191F] border border-[#D8B85A]/40 p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.7)]">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
                <div className="flex items-center gap-2 text-[#E8D58A] font-bold text-xs uppercase tracking-[0.25em]">
                  <Sparkles className="w-4 h-4 text-[#D8B85A] flex-shrink-0 animate-pulse" />
                  <span>Diferencial de Alto Padrão</span>
                </div>
                <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-[#D8B85A]" />
                <p className="font-serif text-xs sm:text-sm font-semibold tracking-wider text-slate-100">
                  {company.bannerIncluso || "JÁ INCLUSO GARÇONS, PRATARIA, TAÇAS, RECHAUDS E TALHERES"}
                </p>
              </div>

              {/* 4 Pillars of Confidence */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#2E3744]/70 text-slate-300 text-xs">
                <div className="flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D8B85A]" />
                  <span>Equipe Completa</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <Wine className="w-3.5 h-3.5 text-[#D8B85A]" />
                  <span>Taças & Prataria</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#D8B85A]" />
                  <span>Atendimento VIP</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#D8B85A]" />
                  <span>Pontualidade</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Subtle Scroll Indicator */}
      <div className="flex justify-center mt-10">
        <button 
          onClick={onScrollToAbout}
          className="text-slate-400 hover:text-[#E8D58A] transition-colors flex flex-col items-center gap-1 cursor-pointer"
          aria-label="Rolar para ver mais"
        >
          <span className="text-[10px] tracking-[0.25em] uppercase font-semibold">Descubra mais</span>
          <ChevronDown className="w-4 h-4 text-[#D8B85A] animate-bounce" />
        </button>
      </div>

    </section>
  );
}
