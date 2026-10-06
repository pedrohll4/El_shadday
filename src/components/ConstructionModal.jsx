import React from 'react';
import { X, Building2, MapPin, Sparkles, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { ElShaddayLogo, GoldFiligree } from '../buffet/components/ElShaddayLogo';

export function ConstructionModal({ isOpen, onClose, onSelectAriquemes }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-center p-6 sm:p-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-dark-700"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Building2 className="w-8 h-8" />
        </div>

        <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full inline-block mx-auto">
          Em Construção 🚧
        </span>

        <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white mt-3">
          Unidade Porto Velho
        </h3>

        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
          Estamos preparando a melhor experiência gastronômica de esfirras artesanais e pizzas para a capital de Rondônia!
        </p>

        <GoldFiligree className="my-4" />

        <div className="bg-dark-950 p-4 rounded-2xl border border-dark-800 text-left text-xs space-y-2 mb-5">
          <div className="flex items-center gap-2 text-brand-gold font-bold">
            <Clock className="w-4 h-4" />
            <span>Fase de Implantação e Obras</span>
          </div>
          <p className="text-slate-400">
            No momento, nosso atendimento de delivery está operando com cardápio completo na <strong>Unidade Ariquemes - RO</strong>.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => {
            onSelectAriquemes();
            onClose();
          }}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 hover:from-amber-400 hover:to-brand-gold text-dark-950 font-extrabold text-xs sm:text-sm shadow-glow-gold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
        >
          <span>Ir para o Cardápio de Ariquemes</span>
          <ArrowRight className="w-4 h-4 text-dark-950" />
        </button>

      </div>
    </div>
  );
}
