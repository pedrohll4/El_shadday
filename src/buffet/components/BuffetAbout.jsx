import React from 'react';
import { GoldFiligree } from './ElShaddayLogo';
import { Award, CheckCircle, HeartHandshake, Utensils, GlassWater, Sparkles, Shield, ChevronRight } from 'lucide-react';

export function BuffetAbout({ company, onScrollToBuilder }) {
  const differentials = company.differentials || [
    { title: "Garçons Treinados", desc: "Equipe uniformizada, atenciosa e ágil do início ao fim." },
    { title: "Prataria & Rechauds", desc: "Prataria nobre e rechauds térmicos para manter tudo aquecido." },
    { title: "Taças de Cristal", desc: "Taças finas para todas as bebidas do seu evento." },
    { title: "Talheres Completos", desc: "Linha de talheres elegantes e higienizados." }
  ];

  return (
    <section id="quem-somos" className="py-16 sm:py-24 bg-[#1A202A] text-slate-100 border-b border-[#2E3744] relative overflow-hidden">
      
      {/* Decorative subtle background light */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-[#D8B85A]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Header of Section */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#D8B85A]">
            Institucional & Excelência
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-white mt-2">
            Quem Somos
          </h2>
          <GoldFiligree width="w-36 sm:w-48" className="mt-2 mb-3" />
          <p className="text-sm sm:text-base text-slate-300 font-light">
            Dedicação, sabor refinado e cuidado minucioso em cada detalhe do seu evento.
          </p>
        </div>

        {/* 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Story, Mission & Experience */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#D8B85A]/10 border border-[#D8B85A]/30 text-[#E8D58A] text-xs font-semibold">
              <Award className="w-4 h-4 text-[#D8B85A]" />
              <span>{company.experienceYears || "Mais de 15 anos"} de experiência e tradição</span>
            </div>

            <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed font-light">
              <p className="first-letter:text-4xl first-letter:font-serif first-letter:font-bold first-letter:text-[#E8D58A] first-letter:mr-2 first-letter:float-left">
                {company.aboutText || "O El Shadday Serviços de Buffet nasceu para transformar momentos especiais em experiências inesquecíveis. Trabalhamos com dedicação, qualidade e cuidado em cada detalhe, oferecendo soluções completas para diferentes tipos de eventos."}
              </p>
              <p>
                Cuidamos desde a seleção criteriosa das carnes e ingredientes frescos até o empratamento, serviço de mesa e atendimento gentil aos seus convidados. Não entregamos apenas comida: oferecemos uma experiência de acolhimento e sofisticação.
              </p>
            </div>

            {/* Metrics Highlights */}
            <div className="grid grid-cols-3 gap-3 pt-3">
              <div className="p-3.5 rounded-xl bg-[#202630] border border-[#2E3744] text-center">
                <span className="block font-serif text-xl sm:text-2xl font-bold text-[#E8D58A]">15+</span>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Anos no mercado</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#202630] border border-[#2E3744] text-center">
                <span className="block font-serif text-xl sm:text-2xl font-bold text-[#E8D58A]">100%</span>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Equipado</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#202630] border border-[#2E3744] text-center">
                <span className="block font-serif text-xl sm:text-2xl font-bold text-[#E8D58A]">VIP</span>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Atendimento</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <button
                onClick={onScrollToBuilder}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E8D58A] hover:text-white transition-colors group cursor-pointer"
              >
                <span>Montar meu orçamento agora</span>
                <ChevronRight className="w-4 h-4 text-[#D8B85A] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>

          {/* Right Column: Differentials Card Showcase */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-[#15191F] border border-[#D8B85A]/35 p-6 sm:p-7 shadow-[0_15px_40px_rgba(0,0,0,0.6)] relative">
              
              <div className="flex items-center justify-between pb-4 border-b border-[#2E3744]">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#E8D58A]">
                    Diferenciais El Shadday
                  </h3>
                  <p className="text-xs text-slate-400">Tudo que seu evento precisa sem surpresas</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#D8B85A]/10 border border-[#D8B85A]/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#D8B85A]" />
                </div>
              </div>

              {/* List of differentials */}
              <div className="mt-5 space-y-4">
                {differentials.map((diff, index) => (
                  <div key={index} className="flex items-start gap-3.5 group">
                    <div className="w-6 h-6 rounded-lg bg-[#D8B85A]/15 border border-[#D8B85A]/40 flex items-center justify-center flex-shrink-0 mt-0.5 text-[#E8D58A]">
                      <CheckCircle className="w-3.5 h-3.5 text-[#D8B85A]" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-[#E8D58A] transition-colors">
                        {diff.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {diff.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Card Guarantee Notice */}
              <div className="mt-6 pt-4 border-t border-[#2E3744] bg-[#202630]/60 -mx-6 -mb-6 p-4 rounded-b-2xl">
                <p className="text-xs text-[#E8D58A] text-center font-medium tracking-wide">
                  ✦ Garantia de pontualidade, higiene rigorosa e carnes de procedência inspecionada.
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>

    </section>
  );
}
