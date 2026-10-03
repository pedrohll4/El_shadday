import React from 'react';
import { GoldFiligree } from './ElShaddayLogo';
import { CheckSquare, Calendar, Eye, Send, ArrowRight } from 'lucide-react';

export function BuffetHowItWorks({ onScrollToBuilder }) {
  const steps = [
    {
      step: "01",
      title: "Escolha o que deseja",
      desc: "Selecione os pratos, carnes, acompanhamentos e bebidas com apenas um toque.",
      icon: CheckSquare
    },
    {
      step: "02",
      title: "Informe os detalhes do evento",
      desc: "Data prevista, quantidade estimada de pessoas, tipo de evento e local.",
      icon: Calendar
    },
    {
      step: "03",
      title: "Confira seu orçamento",
      desc: "Veja tudo o que selecionou em um resumo visual organizado antes de enviar.",
      icon: Eye
    },
    {
      step: "04",
      title: "Envie pelo WhatsApp",
      desc: "Clique em Enviar e todas as informações serão organizadas em uma mensagem direta.",
      icon: Send
    }
  ];

  return (
    <section id="como-funciona" className="py-16 sm:py-24 bg-[#202630] border-b border-[#2E3744] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#D8B85A]">
            Simples, Rápido & Sem Complicação
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-white mt-2">
            Solicite seu orçamento em poucos passos
          </h2>
          <GoldFiligree width="w-36 sm:w-48" className="mt-2 mb-3" />
          <p className="text-sm sm:text-base text-slate-300 font-light">
            Desenvolvido para que você monte a proposta perfeita para o seu evento em poucos minutos.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={index}
                className="relative rounded-2xl bg-[#1A202A] border border-[#2E3744] hover:border-[#D8B85A]/50 p-6 transition-all duration-300 hover:-translate-y-1.5 shadow-[0_8px_25px_rgba(0,0,0,0.4)] flex flex-col justify-between group"
              >
                <div>
                  {/* Step Number with Luxury Gold Typography */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-serif text-3xl font-extrabold text-[#D8B85A]/40 group-hover:text-[#D8B85A] transition-colors">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#202630] border border-[#2E3744] group-hover:border-[#D8B85A]/40 flex items-center justify-center text-[#E8D58A] transition-colors">
                      <Icon className="w-5 h-5 text-[#D8B85A]" />
                    </div>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-slate-100 group-hover:text-[#E8D58A] transition-colors mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-light">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-[#2E3744]/60 flex items-center justify-between text-[11px] text-[#D8B85A] font-semibold uppercase tracking-wider">
                  <span>Passo {index + 1} de 4</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick CTA to jump into builder */}
        <div className="mt-12 text-center">
          <button
            onClick={onScrollToBuilder}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D8B85A]/15 hover:bg-[#D8B85A]/25 text-[#E8D58A] border border-[#D8B85A]/40 hover:border-[#D8B85A] transition-all font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            <span>QUERO MONTAR MEU ORÇAMENTO AGORA</span>
            <ArrowRight className="w-4 h-4 text-[#D8B85A]" />
          </button>
        </div>

      </div>
    </section>
  );
}
