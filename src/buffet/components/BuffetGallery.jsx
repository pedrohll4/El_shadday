import React from 'react';
import { Camera, Sparkles } from 'lucide-react';
import { GoldFiligree } from './ElShaddayLogo';
import { RESERVED_BUFFET_PHOTOS } from '../buffetData';

export function BuffetGallery() {
  return (
    <section id="galeria" className="py-16 sm:py-24 bg-[#15191F] text-slate-100 border-b border-[#2E3744] relative overflow-hidden">
      
      {/* Glows */}
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-[#D8B85A]/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D8B85A]/10 border border-[#D8B85A]/30 text-[#E8D58A] text-xs font-bold uppercase tracking-wider mb-2">
            <Camera className="w-3.5 h-3.5 text-[#D8B85A]" />
            <span>Espaço Reservado • Fotos do Buffet</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-white mt-2">
            Estrutura & Montagem
          </h2>

          <GoldFiligree width="w-36 sm:w-48" className="mt-2 mb-3" />

          <p className="text-sm sm:text-base text-slate-300 font-light">
            Conheça a elegância que levamos para cada detalhe da sua comemoração.
          </p>
        </div>

        {/* Grid de Fotos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {RESERVED_BUFFET_PHOTOS.map((foto) => (
            <div 
              key={foto.id}
              className="rounded-2xl bg-[#1A202A] border border-[#2E3744] hover:border-[#D8B85A]/60 overflow-hidden shadow-xl transition-all duration-300 group flex flex-col"
            >
              <div className="relative h-52 w-full overflow-hidden bg-[#202630]">
                <img 
                  src={foto.url} 
                  alt={foto.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A202A] via-[#1A202A]/20 to-transparent" />

                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#15191F]/80 backdrop-blur-md text-[#E8D58A] border border-[#D8B85A]/40 text-[10px] font-bold uppercase tracking-wider">
                  {foto.tag}
                </span>

                <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-[#15191F]/90 text-[10px] text-slate-300 border border-[#2E3744]">
                  📸 El Shadday Buffet
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-serif text-lg font-bold text-white group-hover:text-[#E8D58A] transition-colors">
                    {foto.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {foto.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#2E3744] flex items-center justify-between text-[11px] text-[#E8D58A]">
                  <span className="flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-[#D8B85A]" />
                    Incluso no evento
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">100% Completo</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400 italic">
            ✦ Espaço reservado para as fotos oficiais enviadas pela equipe do El Shadday Buffet.
          </p>
        </div>

      </div>

    </section>
  );
}
