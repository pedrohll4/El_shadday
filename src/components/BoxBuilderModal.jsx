import React, { useState, useEffect } from 'react';
import { 
  X, Package, Check, Sparkles, ShieldAlert, AlertCircle, Info, ChevronRight, MessageSquare 
} from 'lucide-react';

// Tamanhos disponíveis das Caixas de Esfirras
export const BOX_CONFIGS = [
  { 
    id: 'caixa-20-esfirras', 
    name: 'Caixa com 20 Esfirras', 
    total: 20, 
    salgadas: 15, 
    doces: 5, 
    price: 35.00,
    creditPrice: 40.00,
    image: "https://assets.olaclick.app/companies/products/images/800/4cfa4549-ad5f-4b4e-b539-468584a0eeba.png"
  },
  { 
    id: 'caixa-30-esfirras', 
    name: 'Caixa com 30 Esfirras', 
    total: 30, 
    salgadas: 22, 
    doces: 8, 
    price: 45.00,
    creditPrice: 50.00,
    image: "https://assets.olaclick.app/companies/products/images/800/d22ae090-8054-428b-8ba3-6f147ad985c8.png"
  },
  { 
    id: 'caixa-40-esfirras', 
    name: 'Caixa com 40 Esfirras', 
    total: 40, 
    salgadas: 33, 
    doces: 7, 
    price: 55.00,
    creditPrice: 60.00,
    image: "https://assets.olaclick.app/companies/products/images/800/365a2072-4954-4c6a-a734-69a6cef0130a.png"
  },
  { 
    id: 'caixa-50-esfirras', 
    name: 'Caixa com 50 Esfirras', 
    total: 50, 
    salgadas: 40, 
    doces: 10, 
    price: 70.00,
    creditPrice: 75.00,
    image: "https://assets.olaclick.app/companies/products/images/800/ad6d93be-acae-46e7-b062-9e796f376b8f.png"
  },
  { 
    id: 'combo-20esf-dydyo', 
    name: 'Caixa com 20 Esfirras + Dydyo 2L', 
    total: 20, 
    salgadas: 15, 
    doces: 5, 
    price: 44.99,
    creditPrice: 44.99,
    image: "https://assets.olaclick.app/companies/products/images/800/4cfa4549-ad5f-4b4e-b539-468584a0eeba.png"
  },
  { 
    id: 'combo-30esf-dydyo', 
    name: 'Caixa com 30 Esfirras + Dydyo 2L', 
    total: 30, 
    salgadas: 25, 
    doces: 5, 
    price: 55.00,
    creditPrice: 55.00,
    image: "https://assets.olaclick.app/companies/products/images/800/d22ae090-8054-428b-8ba3-6f147ad985c8.png"
  },
];

// As 4 opções oficiais de Caixas de Esfirras Sortidas
export const BOX_SORTIDO_OPTIONS = [
  {
    id: 'esfirras-sortidas-sem-doce',
    name: 'esfirras sortidas sem doce',
    displayTitle: 'Esfirras sortidas sem doce',
    tag: '100% Salgadas',
    icon: '🥟',
    hasDoces: false,
    semSuinos: false,
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    description: 'Caixa com sabores salgados sortidos tradicionais da casa (carne moída temperada, frango, queijo, calabresa, etc.). Não inclui esfirras doces.'
  },
  {
    id: 'esfirras-sortidas-com-doce',
    name: 'esfirras sortidas com doce',
    displayTitle: 'Esfirras sortidas com doce',
    tag: 'Salgadas + Doces',
    icon: '✨',
    hasDoces: true,
    semSuinos: false,
    badgeColor: 'bg-brand-gold/15 text-brand-gold border-brand-gold/30',
    description: 'A clássica mistura da El Shadday: esfirras salgadas sortidas tradicionais + esfirras doces sortidas da casa.'
  },
  {
    id: 'esfirras-sortidas-sem-suinos-sem-doce',
    name: 'esfiras sortidas sem suinos sem doce',
    displayTitle: 'Esfirras sortidas sem suínos sem doce',
    tag: 'Sem Carne Suína • 100% Salgadas',
    icon: '🥩',
    hasDoces: false,
    semSuinos: true,
    badgeColor: 'bg-red-500/15 text-red-300 border-red-500/30',
    description: '100% salgadas sortidas SEM carne suína (sem calabresa e sem bacon; preparadas com frango, carne bovina e queijos). Não inclui esfirras doces.'
  },
  {
    id: 'esfirras-sortidas-sem-suinos-com-doce',
    name: 'esfirras sortidas sem suinos com doce',
    displayTitle: 'Esfirras sortidas sem suínos com doce',
    tag: 'Sem Carne Suína • Com Doces',
    icon: '🍫',
    hasDoces: true,
    semSuinos: true,
    badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    description: 'Esfirras salgadas sortidas SEM carne suína (sem calabresa e sem bacon) + esfirras doces sortidas da casa.'
  }
];

// Funções auxiliares mantidas para compatibilidade
export const isPorkFlavor = (flavorName) => {
  const str = (flavorName || '').toLowerCase();
  return str.includes('calabresa') || str.includes('bacon');
};

export const isCarneFlavor = (flavorName) => {
  const str = (flavorName || '').toLowerCase();
  return str.includes('carne');
};

export function BoxBuilderModal({ isOpen, onClose, onAddBoxToCart, initialBox = null }) {
  const [selectedBox, setSelectedBox] = useState(BOX_CONFIGS[0]);
  const [selectedOptionId, setSelectedOptionId] = useState(BOX_SORTIDO_OPTIONS[0].id);
  const [notes, setNotes] = useState('');

  // Sincroniza caixa inicial e redefine quando o modal abre
  useEffect(() => {
    if (isOpen) {
      if (initialBox) {
        const match = BOX_CONFIGS.find(b => b.id === initialBox.id || b.total === initialBox.totalCount);
        if (match) {
          setSelectedBox(match);
        } else {
          setSelectedBox(BOX_CONFIGS[0]);
        }
      } else {
        setSelectedBox(BOX_CONFIGS[0]);
      }
      setSelectedOptionId(BOX_SORTIDO_OPTIONS[0].id);
      setNotes('');
    }
  }, [initialBox, isOpen]);

  if (!isOpen) return null;

  const currentOption = BOX_SORTIDO_OPTIONS.find(o => o.id === selectedOptionId) || BOX_SORTIDO_OPTIONS[0];

  const handleConfirm = () => {
    const customItem = {
      id: `custom-box-${selectedBox.id}-${Date.now()}`,
      name: `${selectedBox.name} Sortida`,
      price: selectedBox.price,
      creditPrice: selectedBox.creditPrice,
      isCustomBox: true,
      isBox: true,
      isSortido: true,
      totalCount: selectedBox.total,
      boxOption: currentOption.id,
      boxOptionTitle: currentOption.displayTitle,
      hasDoces: currentOption.hasDoces,
      semSuinos: currentOption.semSuinos,
      salgadasCount: currentOption.hasDoces ? selectedBox.salgadas : selectedBox.total,
      docesCount: currentOption.hasDoces ? selectedBox.doces : 0,
      notes: notes.trim(),
      image: selectedBox.image || "https://assets.olaclick.app/companies/products/images/800/4cfa4549-ad5f-4b4e-b539-468584a0eeba.png",
      description: `${currentOption.displayTitle} (${currentOption.hasDoces ? `${selectedBox.salgadas} Salgadas + ${selectedBox.doces} Doces` : `${selectedBox.total} Salgadas`})${currentOption.semSuinos ? ' • 🚫 Sem carne suína' : ''}${notes.trim() ? ` • Obs: ${notes.trim()}` : ''}`
    };

    onAddBoxToCart(customItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-dark-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-xl bg-dark-900 border-t sm:border border-brand-gold/40 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex-shrink-0 p-4 sm:p-5 border-b border-dark-800 bg-gradient-to-r from-dark-950 to-dark-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/30 flex-shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-base sm:text-lg text-white leading-tight">
                Caixa de Esfirras Sortidas
              </h2>
              <p className="text-[11px] sm:text-xs text-brand-gold font-medium">
                Pioneiros em Ariquemes • Massas frescas e artesanais todos os dias
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-dark-700 flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
          
          {/* PASSO 1: Seleção do Tamanho da Caixa */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-brand-gold/20 text-brand-gold text-[10px] font-black flex items-center justify-center">1</span>
                <span>Tamanho da Caixa:</span>
              </span>
              <span className="text-[11px] text-brand-gold font-bold">
                {selectedBox.total} Esfirras no total
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BOX_CONFIGS.map((box) => {
                const isSelected = selectedBox.id === box.id;
                return (
                  <button
                    key={box.id}
                    type="button"
                    onClick={() => setSelectedBox(box)}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black border-brand-gold shadow-glow-gold scale-102'
                        : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border-dark-800 hover:border-dark-700'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-extrabold">{box.total} Esfirras</div>
                    <div className="text-xs sm:text-sm font-black mt-0.5 opacity-95">
                      R$ {box.price.toFixed(2).replace('.', ',')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PASSO 2: As 4 Opções de Sortidas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-brand-gold/20 text-brand-gold text-[10px] font-black flex items-center justify-center">2</span>
                <span>Escolha como deseja o sortido:</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Selecione 1 opção
              </span>
            </div>

            <div className="space-y-2.5">
              {BOX_SORTIDO_OPTIONS.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                const compositionText = opt.hasDoces 
                  ? `${selectedBox.salgadas} Salgadas + ${selectedBox.doces} Doces`
                  : `${selectedBox.total} Esfirras Salgadas`;

                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedOptionId(opt.id)}
                    className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-brand-gold/10 border-brand-gold shadow-md shadow-brand-gold/10 ring-1 ring-brand-gold/50'
                        : 'bg-dark-850 hover:bg-dark-800 border-dark-800 hover:border-dark-750'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Custom Radio Circle */}
                      <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center transition-colors flex-shrink-0 ${
                        isSelected 
                          ? 'border-brand-gold bg-brand-gold text-dark-950' 
                          : 'border-dark-700 bg-dark-900 group-hover:border-slate-500'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      {/* Info & Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm sm:text-base font-bold text-white capitalize">
                            {opt.displayTitle}
                          </span>
                          
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${opt.badgeColor}`}>
                            {opt.tag}
                          </span>
                        </div>

                        {/* Composition pill */}
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[11px] font-extrabold text-brand-gold bg-dark-900 px-2 py-0.5 rounded-md border border-dark-800">
                            {opt.icon} {compositionText}
                          </span>
                          {opt.semSuinos && (
                            <span className="text-[10px] font-bold text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-500/30">
                              Sem calabresa/bacon
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                          {opt.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PASSO 3: Observações (Opcional) */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-brand-gold" />
              <span>Observações para a Cozinha (Opcional):</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Bem assadas, separar doces em caixinha menor, etc."
              className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold transition-colors"
              maxLength={120}
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-dark-800 bg-dark-950 flex flex-col sm:flex-row items-center justify-between gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between w-full sm:w-auto sm:flex-col sm:items-start">
            <div>
              <span className="text-[11px] text-slate-400 block">Total da Caixa:</span>
              <div className="text-xl sm:text-2xl font-black text-brand-gold leading-tight">
                R$ {selectedBox.price.toFixed(2).replace('.', ',')}
              </div>
            </div>

            {selectedBox.creditPrice && (
              <span className="text-[10px] text-slate-500">
                *No crédito: R$ {selectedBox.creditPrice.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-brand-gold to-amber-500 hover:from-amber-400 hover:to-brand-gold text-dark-950 shadow-glow-gold cursor-pointer hover:scale-102 active:scale-98 transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Adicionar Caixa ({selectedBox.total} un)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
