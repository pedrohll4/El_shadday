import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

export function BuffetFloatingWhatsApp({ company }) {
  const [showTooltip, setShowTooltip] = useState(true);

  const phone = company.phone ? company.phone.replace(/\D/g, '') : '5569992000000';
  const defaultText = `Olá, ${company.shortName || 'El Shadday'}! Gostaria de conversar sobre um buffet para meu evento.`;
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(defaultText)}`;

  return (
    <aside 
      aria-label="Atendimento via WhatsApp"
      className="fixed bottom-6 right-5 z-40 flex items-end flex-col gap-2"
    >
      
      {/* Tooltip bubble */}
      {showTooltip && (
        <div className="relative bg-[#15191F] text-slate-100 border border-[#D8B85A]/40 px-3.5 py-2 rounded-2xl shadow-[0_8px_25px_rgba(0,0,0,0.6)] text-xs flex items-center gap-2 max-w-[230px] animate-fadeIn">
          <div className="flex-1">
            <span className="font-serif font-bold text-[#E8D58A] block">El Shadday Buffet</span>
            <span className="text-[11px] text-slate-300">Precisa de ajuda ou orçamento rápido? Fale conosco!</span>
          </div>
          <button 
            onClick={() => setShowTooltip(false)}
            className="text-slate-400 hover:text-white p-0.5"
            aria-label="Fechar dica do WhatsApp"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          
          {/* Tooltip arrow */}
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-[#15191F] border-r border-b border-[#D8B85A]/40 transform rotate-45" />
        </div>
      )}

      {/* Main Floating Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-[0_4px_25px_rgba(16,185,129,0.45)] hover:shadow-[0_6px_35px_rgba(16,185,129,0.7)] hover:scale-110 active:scale-95 transition-all duration-300"
        title="Falar no WhatsApp com o El Shadday"
        aria-label="Conversar pelo WhatsApp"
      >
        {/* Pulsing ring */}
        <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-30 animate-ping pointer-events-none" />

        {/* WhatsApp Icon */}
        <MessageCircle className="w-7 h-7 fill-white stroke-none drop-shadow" />

        {/* Quick Tag Label on hover */}
        <span className="hidden sm:group-hover:flex absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap bg-[#15191F] text-[#E8D58A] border border-[#D8B85A]/40 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-lg">
          Falar com o El Shadday
        </span>
      </a>

    </aside>
  );
}
