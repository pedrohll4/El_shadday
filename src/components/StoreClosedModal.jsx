import React from 'react';
import { X, Clock, AlertTriangle, MessageCircle, ArrowRight, Store } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';

export function StoreClosedModal({ 
  isOpen, 
  onClose, 
  openingHours = 'Terça a Domingo: 18:00 às 23:30',
  closedMessage = 'No momento não estamos aceitando pedidos pelo site. Você pode navegar pelo cardápio completo!',
  whatsapp = '5569992228682',
  reopenTime
}) {
  if (!isOpen) return null;

  const cleanPhone = (whatsapp || RESTAURANT_INFO.phone || '5569992228682').replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-dark-900 border border-red-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-center p-6 sm:p-7">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-dark-700"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-3xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-500/10">
          <Store className="w-8 h-8 text-red-400" />
        </div>

        <span className="text-[11px] font-black uppercase tracking-widest text-red-300 bg-red-500/15 border border-red-500/30 px-3.5 py-1 rounded-full inline-block mx-auto">
          🔴 Loja Fechada no Momento
        </span>

        <h3 className="text-xl sm:text-2xl font-display font-black text-white mt-3 leading-snug">
          Estamos Temporariamente Fechados
        </h3>

        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed px-1">
          {closedMessage}
        </p>

        {/* Schedule Box */}
        <div className="bg-dark-950 p-4 rounded-2xl border border-dark-800 text-left text-xs space-y-2.5 my-4">
          <div className="flex items-center gap-2 text-brand-gold font-bold">
            <Clock className="w-4 h-4 text-brand-gold shrink-0" />
            <span>Horário de Funcionamento:</span>
          </div>
          <p className="text-white font-semibold text-xs pl-6">
            {openingHours}
          </p>

          {reopenTime && (
            <div className="pt-2 border-t border-dark-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Previsão de Reabertura:</span>
              <span className="text-emerald-400 font-bold">{reopenTime}</span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-400 mb-4">
          Você pode continuar explorando nosso cardápio de esfirras e pizzas normalmente. Quando abrirmos, os pedidos estarão liberados!
        </p>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 hover:from-amber-400 hover:to-brand-gold text-dark-950 font-black text-xs sm:text-sm shadow-glow-gold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <span>🍕 Continuar Olhando o Cardápio</span>
          </button>

          {cleanPhone && (
            <a
              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent('Olá! Gostaria de informações sobre o horário de funcionamento do El Shadday.')}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-dark-800 hover:bg-dark-750 text-emerald-400 font-bold text-xs border border-emerald-500/30 flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Dúvidas? Fale pelo WhatsApp</span>
            </a>
          )}
        </div>

      </div>
    </div>
  );
}
