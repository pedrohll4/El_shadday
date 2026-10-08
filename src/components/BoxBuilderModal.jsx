import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Package, Check, Plus, Minus, Sparkles, Shuffle, 
  AlertCircle, ShieldAlert, Info, Flame, ChevronRight 
} from 'lucide-react';
import { PRODUCTS } from '../data/menuData';

// Business Rules for Assorted Boxes (Caixas Somente Sortidas)
export const BOX_CONFIGS = [
  { 
    id: 'caixa-20-esfirras', 
    name: 'Caixa com 20 Esfirras', 
    total: 20, 
    salgadas: 15, 
    doces: 5, 
    price: 35.00,
    creditPrice: 40.00,
    maxPerSalgada: 3, 
    maxPerDoce: 1, 
    maxCarne: 3, // limitado pelo teto da caixa (3)
    ruleText: 'Máx. 3 de cada salgada • 1 de cada doce'
  },
  { 
    id: 'caixa-30-esfirras', 
    name: 'Caixa com 30 Esfirras', 
    total: 30, 
    salgadas: 22, 
    doces: 8, 
    price: 45.00,
    creditPrice: 50.00,
    maxPerSalgada: 4, 
    maxPerDoce: 1, 
    maxCarne: 4, // limitado pelo teto da caixa (4)
    ruleText: 'Máx. 4 de cada salgada • 1 de cada doce'
  },
  { 
    id: 'caixa-40-esfirras', 
    name: 'Caixa com 40 Esfirras', 
    total: 40, 
    salgadas: 33, 
    doces: 7, 
    price: 55.00,
    creditPrice: 60.00,
    maxPerSalgada: 5, 
    maxPerDoce: 2, 
    maxCarne: 5, // Limite explícito de 5 unidades de carne
    ruleText: 'Máx. 5 de cada salgada (Carne máx. 5) • 2 de cada doce'
  },
  { 
    id: 'caixa-50-esfirras', 
    name: 'Caixa com 50 Esfirras', 
    total: 50, 
    salgadas: 40, 
    doces: 10, 
    price: 70.00,
    creditPrice: 75.00,
    maxPerSalgada: 10, 
    maxPerDoce: 2, 
    maxCarne: 5, // Limite explícito de 5 unidades de carne
    ruleText: 'Máx. 10 de cada salgada (Carne máx. 5) • 2 de cada doce'
  },
];

// Helper: Check if a flavor contains pork
export const isPorkFlavor = (flavorName) => {
  const str = (flavorName || '').toLowerCase();
  return str.includes('calabresa') || str.includes('bacon');
};

// Helper: Check if a flavor is beef/carne
export const isCarneFlavor = (flavorName) => {
  const str = (flavorName || '').toLowerCase();
  return str.includes('carne');
};

export function BoxBuilderModal({ isOpen, onClose, onAddBoxToCart, initialBox = null }) {
  const [selectedBox, setSelectedBox] = useState(BOX_CONFIGS[0]);
  const [activeTab, setActiveTab] = useState('salgadas'); // 'salgadas' | 'doces'
  const [semSuinos, setSemSuinos] = useState(false);
  const [salgadasSelections, setSalgadasSelections] = useState({});
  const [docesSelections, setDocesSelections] = useState({});
  const [feedbackNotice, setFeedbackNotice] = useState('');

  // RULE: Sabores Tradicionais da El Shadday para caixas sortidas
  const salgadasList = useMemo(() => {
    return PRODUCTS.filter(p => 
      p.categoryId === 'esfirras-salgadas' && 
      (p.price <= 3.00 || !p.badge?.toLowerCase().includes('gourmet')) &&
      !p.name.toLowerCase().includes('gourmet') &&
      !p.badge?.toLowerCase().includes('gourmet')
    );
  }, []);

  const docesList = useMemo(() => {
    return PRODUCTS.filter(p => 
      p.categoryId === 'esfirras-doces' && 
      (p.price <= 4.00 || !p.badge?.toLowerCase().includes('gourmet')) &&
      !p.name.toLowerCase().includes('gourmet') &&
      !p.badge?.toLowerCase().includes('gourmet')
    );
  }, []);

  // Sync initial box size and reset state when opening
  useEffect(() => {
    if (isOpen) {
      if (initialBox) {
        const match = BOX_CONFIGS.find(b => b.id === initialBox.id || b.total === initialBox.totalCount);
        if (match) {
          setSelectedBox(match);
        }
      }
      setSalgadasSelections({});
      setDocesSelections({});
      setFeedbackNotice('');
      setActiveTab('salgadas');
    }
  }, [initialBox, isOpen]);

  // Clean pork flavors whenever semSuinos is enabled
  useEffect(() => {
    if (semSuinos) {
      setSalgadasSelections(prev => {
        const next = { ...prev };
        let removedCount = 0;
        Object.keys(next).forEach(flavorName => {
          if (isPorkFlavor(flavorName)) {
            removedCount += next[flavorName];
            delete next[flavorName];
          }
        });
        if (removedCount > 0) {
          setFeedbackNotice(`Opção Sem Suínos ativa: ${removedCount} esfirras com porco foram removidas.`);
          setTimeout(() => setFeedbackNotice(''), 4000);
        }
        return next;
      });
    }
  }, [semSuinos]);

  if (!isOpen) return null;

  // Totals calculations
  const totalSalgadasChosen = Object.values(salgadasSelections).reduce((a, b) => a + b, 0);
  const totalDocesChosen = Object.values(docesSelections).reduce((a, b) => a + b, 0);

  const remainingSalgadas = selectedBox.salgadas - totalSalgadasChosen;
  const remainingDoces = selectedBox.doces - totalDocesChosen;

  const handleBoxChange = (box) => {
    setSelectedBox(box);
    setSalgadasSelections({});
    setDocesSelections({});
    setFeedbackNotice('');
  };

  // Get maximum allowed count for a specific flavor under all business rules
  const getMaxAllowedForFlavor = (flavor, type) => {
    if (type === 'salgadas') {
      if (semSuinos && isPorkFlavor(flavor.name)) {
        return 0; // Pork disabled
      }
      if (isCarneFlavor(flavor.name)) {
        return selectedBox.maxCarne; // Max 5 on 40/50, or 3 on 20, 4 on 30
      }
      return selectedBox.maxPerSalgada;
    } else {
      return selectedBox.maxPerDoce;
    }
  };

  // Handle Increment/Decrement with strict validation
  const handleUpdateCount = (flavor, type, delta) => {
    setFeedbackNotice('');

    if (type === 'salgadas') {
      const current = salgadasSelections[flavor.name] || 0;
      const next = current + delta;
      if (next < 0) return;

      if (delta > 0) {
        if (semSuinos && isPorkFlavor(flavor.name)) {
          setFeedbackNotice('Opção Sem Suínos está ativada. Desmarque para incluir este sabor.');
          return;
        }

        if (totalSalgadasChosen >= selectedBox.salgadas) {
          setFeedbackNotice(`Você já atingiu o limite de ${selectedBox.salgadas} esfirras salgadas desta caixa!`);
          return;
        }

        const maxAllowed = getMaxAllowedForFlavor(flavor, 'salgadas');
        if (current >= maxAllowed) {
          if (isCarneFlavor(flavor.name)) {
            setFeedbackNotice(`A esfirra de Carne tem limite máximo de ${selectedBox.maxCarne} unidades nesta caixa!`);
          } else {
            setFeedbackNotice(`Limite de ${maxAllowed} unidades para este sabor atingido (caixas são sortidas)!`);
          }
          return;
        }
      }

      const updated = { ...salgadasSelections };
      if (next === 0) {
        delete updated[flavor.name];
      } else {
        updated[flavor.name] = next;
      }
      setSalgadasSelections(updated);

      // Auto-switch to Doces if salgadas are completely filled
      if (next > current && (totalSalgadasChosen + 1) >= selectedBox.salgadas && totalDocesChosen < selectedBox.doces) {
        setTimeout(() => {
          setActiveTab('doces');
          setFeedbackNotice('Salgadas completas! Agora escolha suas esfirras doces.');
          setTimeout(() => setFeedbackNotice(''), 3500);
        }, 300);
      }

    } else {
      // Doces
      const current = docesSelections[flavor.name] || 0;
      const next = current + delta;
      if (next < 0) return;

      if (delta > 0) {
        if (totalDocesChosen >= selectedBox.doces) {
          setFeedbackNotice(`Você já atingiu o limite de ${selectedBox.doces} esfirras doces desta caixa!`);
          return;
        }

        const maxAllowed = selectedBox.maxPerDoce;
        if (current >= maxAllowed) {
          setFeedbackNotice(`Limite de ${maxAllowed} unidade(s) por doce na caixa de ${selectedBox.total}!`);
          return;
        }
      }

      const updated = { ...docesSelections };
      if (next === 0) {
        delete updated[flavor.name];
      } else {
        updated[flavor.name] = next;
      }
      setDocesSelections(updated);
    }
  };

  // Card click handler: clicking anywhere on a flavor card adds +1 or shows why it cannot be added
  const handleCardClick = (flavor, type) => {
    const isPork = type === 'salgadas' && isPorkFlavor(flavor.name);
    const isPorkBlocked = semSuinos && isPork;

    if (isPorkBlocked) {
      setFeedbackNotice('Opção Sem Suínos está ativada. Desmarque para incluir este sabor.');
      return;
    }

    const current = type === 'salgadas' 
      ? (salgadasSelections[flavor.name] || 0)
      : (docesSelections[flavor.name] || 0);

    const maxAllowed = getMaxAllowedForFlavor(flavor, type);
    const isCategoryFull = type === 'salgadas'
      ? remainingSalgadas <= 0
      : remainingDoces <= 0;

    if (isCategoryFull) {
      if (type === 'salgadas') {
        setFeedbackNotice(`Limite de ${selectedBox.salgadas} esfirras salgadas já atingido! Alterne para Doces.`);
      } else {
        setFeedbackNotice(`Limite de ${selectedBox.doces} esfirras doces já atingido!`);
      }
      return;
    }

    if (current >= maxAllowed) {
      if (type === 'salgadas' && isCarneFlavor(flavor.name)) {
        setFeedbackNotice(`A esfirra de Carne tem limite máximo de ${selectedBox.maxCarne} unidades nesta caixa!`);
      } else {
        setFeedbackNotice(`Limite de ${maxAllowed} unidade(s) para este sabor atingido (as caixas são sortidas)!`);
      }
      return;
    }

    // Add 1
    handleUpdateCount(flavor, type, 1);
  };

  // Smart Assorted Pre-Fill adhering strictly to all business rules
  const handleAutoFill = () => {
    setFeedbackNotice('');

    // 1. Distribute Salgadas
    const availableSalgadas = salgadasList.filter(f => !semSuinos || !isPorkFlavor(f.name));
    if (availableSalgadas.length === 0) return;

    const newSalgadas = {};
    let salgToDistribute = selectedBox.salgadas;
    let sIdx = 0;

    // Distribute in round-robin respecting individual flavor limits
    let loops = 0;
    while (salgToDistribute > 0 && loops < 250) {
      loops++;
      const flavor = availableSalgadas[sIdx % availableSalgadas.length];
      const maxAllowed = getMaxAllowedForFlavor(flavor, 'salgadas');
      const current = newSalgadas[flavor.name] || 0;

      if (current < maxAllowed) {
        newSalgadas[flavor.name] = current + 1;
        salgToDistribute--;
      }
      sIdx++;
    }
    setSalgadasSelections(newSalgadas);

    // 2. Distribute Doces
    const newDoces = {};
    let docesToDistribute = selectedBox.doces;
    let dIdx = 0;
    loops = 0;

    while (docesToDistribute > 0 && loops < 150) {
      loops++;
      const flavor = docesList[dIdx % docesList.length];
      const maxAllowed = selectedBox.maxPerDoce;
      const current = newDoces[flavor.name] || 0;

      if (current < maxAllowed) {
        newDoces[flavor.name] = current + 1;
        docesToDistribute--;
      }
      dIdx++;
    }
    setDocesSelections(newDoces);

    setFeedbackNotice('✨ Caixa preenchida com o sortido perfeito da casa!');
    setTimeout(() => setFeedbackNotice(''), 3500);
  };

  const isBoxComplete = remainingSalgadas === 0 && remainingDoces === 0;

  const handleConfirm = () => {
    const customItem = {
      id: `custom-box-${selectedBox.id}-${Date.now()}`,
      name: `${selectedBox.name} Sortida`,
      price: selectedBox.price,
      isCustomBox: true,
      totalCount: selectedBox.total,
      semSuinos: semSuinos,
      salgadasDetails: salgadasSelections,
      docesDetails: docesSelections,
      image: "https://assets.olaclick.app/companies/products/images/800/4cfa4549-ad5f-4b4e-b539-468584a0eeba.png",
      description: `${selectedBox.salgadas} Salgadas e ${selectedBox.doces} Doces sortidas.${semSuinos ? ' 🚫 OPÇÃO SEM SUÍNOS.' : ''}`
    };
    onAddBoxToCart(customItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-dark-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-dark-900 border-t sm:border border-brand-gold/40 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[95dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden">
        
        {/* Header (Fixed at top) */}
        <div className="flex-shrink-0 p-3.5 sm:p-5 border-b border-dark-800 bg-gradient-to-r from-dark-950 to-dark-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/30 flex-shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-sm sm:text-lg text-white leading-tight">
                Monte sua Caixa de Esfirras Sortidas
              </h2>
              <p className="text-[11px] sm:text-xs text-brand-gold font-medium">
                Pioneiros em caixas de esfirras em Ariquemes • Somente Sortidas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-dark-700 flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container: ALL content scrolls smoothly together */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          
          {/* Box Size Selector Section */}
          <div className="p-3 sm:p-4 bg-dark-950/70 border-b border-dark-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                1. Selecione o Tamanho da Caixa:
              </span>
              <span className="text-[11px] text-brand-gold font-bold">
                {selectedBox.ruleText}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BOX_CONFIGS.map((box) => {
                const isSelected = selectedBox.id === box.id;
                return (
                  <button
                    key={box.id}
                    type="button"
                    onClick={() => handleBoxChange(box)}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black border-brand-gold shadow-glow-gold scale-102'
                        : 'bg-dark-900 hover:bg-dark-850 text-slate-300 border-dark-800 hover:border-dark-700'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-extrabold">{box.total} Esfirras</div>
                    <div className="text-xs sm:text-sm font-black mt-0.5 opacity-95">
                      R$ {box.price.toFixed(2).replace('.', ',')}
                    </div>
                    <div className={`text-[10px] mt-1 font-semibold ${isSelected ? 'text-dark-950/90' : 'text-slate-400'}`}>
                      {box.salgadas} Salg / {box.doces} Doces
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Opção Sem Suínos (Toggle) */}
            <div className="mt-2.5 p-2.5 rounded-xl bg-dark-900 border border-dark-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldAlert className="w-4 h-4 text-brand-gold flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">
                    Opção Sem Carne Suína?
                  </span>
                  <span className="text-[10px] text-slate-400 line-clamp-1">
                    Substitui calabresa e bacon por frango, carne bovina e queijos.
                  </span>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0 px-2.5 py-1 rounded-lg bg-dark-850 border border-dark-750 hover:border-brand-gold/40 transition-colors">
                <input
                  type="checkbox"
                  checked={semSuinos}
                  onChange={(e) => setSemSuinos(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-gold accent-brand-gold cursor-pointer"
                />
                <span className={`text-[11px] font-black ${semSuinos ? 'text-brand-gold' : 'text-slate-400'}`}>
                  {semSuinos ? 'SEM SUÍNOS ATIVO' : 'Permitir Suínos'}
                </span>
              </label>
            </div>
          </div>

          {/* Sticky Counters & Category Tabs Header */}
          <div className="sticky top-0 z-20 bg-dark-900/98 backdrop-blur-md border-b border-dark-800 shadow-md">
            
            {/* Live Counters and Auto-fill Button */}
            <div className="px-3.5 sm:px-4 py-2.5 bg-dark-850/95 flex items-center justify-between gap-2 border-b border-dark-800/80">
              <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
                {/* Salgadas counter */}
                <button
                  type="button"
                  onClick={() => setActiveTab('salgadas')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                    activeTab === 'salgadas' ? 'ring-1 ring-brand-gold/60' : ''
                  } ${
                    remainingSalgadas === 0 
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' 
                      : 'bg-dark-900 border-dark-750 text-slate-300 hover:text-white'
                  }`}
                >
                  <span>Salgadas:</span>
                  <strong className="text-white font-bold">{totalSalgadasChosen} / {selectedBox.salgadas}</strong>
                  {remainingSalgadas === 0 && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />}
                </button>

                {/* Doces counter */}
                <button
                  type="button"
                  onClick={() => setActiveTab('doces')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                    activeTab === 'doces' ? 'ring-1 ring-brand-gold/60' : ''
                  } ${
                    remainingDoces === 0 
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' 
                      : 'bg-dark-900 border-dark-750 text-slate-300 hover:text-white'
                  }`}
                >
                  <span>Doces:</span>
                  <strong className="text-white font-bold">{totalDocesChosen} / {selectedBox.doces}</strong>
                  {remainingDoces === 0 && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />}
                </button>
              </div>

              {/* Quick Auto-Fill Button */}
              <button
                type="button"
                onClick={handleAutoFill}
                className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-brand-gold hover:text-amber-300 bg-brand-gold/10 hover:bg-brand-gold/20 border border-brand-gold/30 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 flex-shrink-0"
                title="Preencher respeitando os limites sortidos da El Shadday"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Sortido da Casa</span>
              </button>
            </div>

            {/* Flavor Category Switcher */}
            <div className="px-3.5 sm:px-4 pt-2 flex items-center justify-between">
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('salgadas')}
                  className={`flex-1 sm:flex-none pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'salgadas'
                      ? 'border-brand-gold text-brand-gold'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Salgadas Tradicionais</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-dark-800 text-slate-400 font-semibold">
                    {salgadasList.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('doces')}
                  className={`flex-1 sm:flex-none pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'doces'
                      ? 'border-brand-gold text-brand-gold'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Doces Tradicionais</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-dark-800 text-slate-400 font-semibold">
                    {docesList.length}
                  </span>
                </button>
              </div>

              <span className="text-[11px] text-slate-400 hidden sm:inline">
                *Sabores especiais/gourmet não entram na caixa
              </span>
            </div>

            {/* Feedback / Rule Notice Alert */}
            {feedbackNotice && (
              <div className="px-4 py-2 bg-amber-500/15 border-t border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{feedbackNotice}</span>
                <button
                  type="button"
                  onClick={() => setFeedbackNotice('')}
                  className="text-amber-400 hover:text-white text-xs font-bold px-1"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Flavors List */}
          <div className="p-3 sm:p-4 space-y-2.5 pb-6">
            
            {/* Friendly prompt if Salgadas is complete and user is on Salgadas tab */}
            {activeTab === 'salgadas' && remainingSalgadas === 0 && remainingDoces > 0 && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-dark-850 border border-emerald-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Salgadas completas ({selectedBox.salgadas}/{selectedBox.salgadas})!</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('doces')}
                  className="px-3 py-1.5 rounded-xl bg-brand-gold hover:bg-amber-400 text-dark-950 font-black text-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                >
                  <span>Escolher Doces ({remainingDoces})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Friendly prompt if Doces is complete and user is on Doces tab but missing salgadas */}
            {activeTab === 'doces' && remainingDoces === 0 && remainingSalgadas > 0 && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-dark-850 border border-emerald-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Doces completas ({selectedBox.doces}/{selectedBox.doces})!</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('salgadas')}
                  className="px-3 py-1.5 rounded-xl bg-brand-gold hover:bg-amber-400 text-dark-950 font-black text-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                >
                  <span>Escolher Salgadas ({remainingSalgadas})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Flavors Loop */}
            {(activeTab === 'salgadas' ? salgadasList : docesList).map((flavor) => {
              const isPork = activeTab === 'salgadas' && isPorkFlavor(flavor.name);
              const isCarne = activeTab === 'salgadas' && isCarneFlavor(flavor.name);
              const isPorkBlocked = semSuinos && isPork;

              const count = activeTab === 'salgadas' 
                ? (salgadasSelections[flavor.name] || 0)
                : (docesSelections[flavor.name] || 0);

              const maxAllowed = getMaxAllowedForFlavor(flavor, activeTab);
              const isFlavorMaxReached = count >= maxAllowed;

              const isCategoryFull = activeTab === 'salgadas'
                ? remainingSalgadas <= 0
                : remainingDoces <= 0;

              const canAdd = !isPorkBlocked && !isCategoryFull && !isFlavorMaxReached;

              return (
                <div
                  key={flavor.id}
                  onClick={() => handleCardClick(flavor, activeTab)}
                  className={`group relative flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                    isPorkBlocked 
                      ? 'opacity-40 bg-dark-950 border-dark-850 cursor-not-allowed'
                      : count > 0
                      ? 'bg-brand-gold/10 border-brand-gold/70 shadow-md shadow-brand-gold/5'
                      : 'bg-dark-850 hover:bg-dark-800 border-dark-800 hover:border-dark-700'
                  }`}
                >
                  {/* Left: Image & Info */}
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-dark-950 flex-shrink-0 border border-dark-800">
                      <img
                        src={flavor.image}
                        alt={flavor.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {flavor.name}
                        </h4>
                        {isPork && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            Suíno
                          </span>
                        )}
                        {isCarne && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                            Bovino (Máx {selectedBox.maxCarne})
                          </span>
                        )}
                      </div>
                      
                      {/* Flavor Limit Badge */}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400">
                          {isPorkBlocked ? (
                            <span className="text-red-400 font-bold">🚫 Bloqueado (Sem Suínos ativo)</span>
                          ) : (
                            <span>Limite: <strong className="text-slate-300">{maxAllowed} un</strong> nesta caixa</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Counter Controls */}
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    {count === 0 ? (
                      /* Big Add Button when 0 */
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(flavor, activeTab);
                        }}
                        disabled={!canAdd}
                        className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                          !canAdd
                            ? 'opacity-40 bg-dark-900 text-slate-500 cursor-not-allowed border border-dark-800'
                            : 'bg-brand-gold hover:bg-amber-400 text-dark-950 font-black cursor-pointer active:scale-95 shadow-sm'
                        }`}
                        title={!canAdd ? (isFlavorMaxReached ? 'Limite deste sabor atingido' : 'Limite da caixa atingido') : 'Adicionar sabor'}
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Adicionar</span>
                      </button>
                    ) : (
                      /* Stepper with comfortable touch targets */
                      <div className="flex items-center gap-1 bg-dark-950/80 p-1 rounded-xl border border-dark-750">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateCount(flavor, activeTab, -1);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-dark-800 hover:bg-dark-700 text-white cursor-pointer active:scale-95"
                          aria-label="Diminuir"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <span className="w-7 text-center text-xs font-black text-brand-gold">
                          {count}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateCount(flavor, activeTab, 1);
                          }}
                          disabled={!canAdd}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            !canAdd
                              ? 'opacity-30 bg-dark-900 text-slate-500 cursor-not-allowed'
                              : 'bg-brand-gold hover:bg-amber-400 text-dark-950 cursor-pointer active:scale-95 font-bold'
                          }`}
                          title={!canAdd ? (isFlavorMaxReached ? 'Limite máximo atingido' : 'Limite da caixa atingido') : 'Adicionar mais 1'}
                          aria-label="Aumentar"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* Footer Confirmation (Fixed at bottom, always fully visible!) */}
        <div className="flex-shrink-0 p-3 sm:p-4 border-t border-dark-800 bg-dark-950 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between w-full sm:w-auto sm:flex-col sm:items-start">
            <div>
              <span className="text-[11px] text-slate-400 block">Total da Caixa Sortida:</span>
              <div className="text-xl sm:text-2xl font-black text-brand-gold leading-tight">
                R$ {selectedBox.price.toFixed(2).replace('.', ',')}
              </div>
            </div>

            <div className="text-right sm:text-left">
              {isBoxComplete ? (
                <div className="text-xs text-emerald-400 font-bold flex items-center gap-1 sm:mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Caixa pronta para o carrinho!</span>
                </div>
              ) : (
                <div className="text-[11px] text-amber-400 flex items-center gap-1 sm:mt-0.5 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>
                    Faltam {remainingSalgadas} salg. e {remainingDoces} doces
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isBoxComplete}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                isBoxComplete
                  ? 'bg-gradient-to-r from-brand-gold to-amber-500 hover:from-amber-400 hover:to-brand-gold text-dark-950 shadow-glow-gold cursor-pointer hover:scale-102 active:scale-98'
                  : 'bg-dark-800 text-slate-500 cursor-not-allowed'
              }`}
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
