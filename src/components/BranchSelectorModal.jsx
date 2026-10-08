import React from 'react';
import { X, MapPin, Clock, Phone, ChevronRight, CheckCircle2, AlertTriangle, Sparkles, Building2 } from 'lucide-react';
import { BRANCHES } from '../data/branchesData';
import { ElShaddayLogo, GoldFiligree } from '../buffet/components/ElShaddayLogo';

export function BranchSelectorModal({ 
  isOpen, 
  onClose, 
  selectedBranchId, 
  onSelectBranch 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Close button if user already has a branch selected */}
        {selectedBranchId && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-dark-800/90 hover:bg-dark-750 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-dark-700"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="pt-6 pb-3 px-4 sm:px-6 text-center bg-gradient-to-b from-dark-950 to-dark-900 border-b border-dark-800">
          <div className="flex justify-center mb-1.5">
            <ElShaddayLogo size="sm" variant="horizontal" className="sm:hidden" />
            <ElShaddayLogo size="md" variant="horizontal" className="hidden sm:flex" />
          </div>
          
          <h2 className="text-lg sm:text-2xl font-display font-extrabold text-white mt-1.5 leading-tight">
            Selecione a Unidade para seu Pedido
          </h2>
          <p className="text-[11px] sm:text-sm text-slate-400 max-w-md mx-auto mt-1">
            Escolha a filial para conferir o cardápio e prazos de entrega.
          </p>

          <GoldFiligree className="my-2" />
        </div>

        {/* Branches Grid */}
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 max-h-[75dvh] overflow-y-auto">
          {BRANCHES.map((branch) => {
            const isActive = branch.status === 'active';
            const isCurrent = selectedBranchId === branch.id;

            return (
              <div
                key={branch.id}
                onClick={() => onSelectBranch(branch.id)}
                className={`group relative rounded-2xl p-4 sm:p-5 border transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-dark-850/90 hover:bg-dark-800 border-brand-gold/40 hover:border-brand-gold hover:shadow-glow-gold'
                    : 'bg-dark-950/80 hover:bg-dark-900 border-dark-800 hover:border-amber-500/50'
                } ${isCurrent ? 'ring-2 ring-brand-gold bg-dark-800' : ''}`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  
                  {/* Left: Branch Info */}
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isActive 
                        ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/40' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      <Building2 className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display font-bold text-base sm:text-lg text-white group-hover:text-brand-gold transition-colors">
                          {branch.displayName}
                        </h3>
                        
                        {/* Status Badge */}
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            {branch.badge}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            {branch.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-brand-goldLight font-medium">
                        {branch.subtitle}
                      </p>

                      <div className="flex flex-col gap-1 pt-1 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" />
                          <span>{branch.address}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" />
                          <span>{branch.deliveryTime} • {branch.openingHours}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 pt-1 leading-relaxed">
                        {branch.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Action Button */}
                  <div className="w-full sm:w-auto flex-shrink-0 sm:self-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBranch(branch.id);
                      }}
                      className={`w-full sm:w-auto px-5 py-3 rounded-xl font-extrabold text-xs transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-brand-gold to-amber-400 hover:from-amber-400 hover:to-brand-gold text-dark-950 shadow-glow-gold'
                          : 'bg-dark-800 hover:bg-dark-750 text-amber-300 border border-amber-500/40 hover:border-amber-400'
                      }`}
                    >
                      <span>{isActive ? 'Entrar no Cardápio' : 'Ver Unidade Porto Velho'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer note */}
        <div className="p-4 bg-dark-950 border-t border-dark-800 text-center text-xs text-slate-400">
          <span>Tem dúvidas sobre entregas? Fale conosco no WhatsApp: </span>
          <a 
            href="https://wa.me/5569992228682" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-brand-gold hover:underline font-bold"
          >
            (69) 99222-8682
          </a>
        </div>

      </div>
    </div>
  );
}
