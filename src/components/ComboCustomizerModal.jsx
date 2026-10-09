import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Flame, Check, Sparkles, AlertCircle, Copy, 
  ChevronRight, ArrowRight, Pizza as PizzaIcon, CheckCircle2, Package 
} from 'lucide-react';
import { getStoredPizzaFlavors } from '../data/menuData';

// Helper to determine the pizza configuration for any combo
export function getComboPizzasConfig(product) {
  if (!product) return [];

  const id = product.id;

  if (id === 'combo-2-pizzas-gg') {
    return [
      { id: 'p1', title: '1ª Pizza Gigante (12 fatias)', shortTitle: '1ª Pizza GG', maxFlavors: 3 },
      { id: 'p2', title: '2ª Pizza Gigante (12 fatias)', shortTitle: '2ª Pizza GG', maxFlavors: 3 }
    ];
  }

  if (id === 'combo-2-pizzas-fm') {
    return [
      { id: 'p1', title: '1ª Pizza Família (8 fatias)', shortTitle: '1ª Pizza FM', maxFlavors: 2 },
      { id: 'p2', title: '2ª Pizza Família (8 fatias)', shortTitle: '2ª Pizza FM', maxFlavors: 2 }
    ];
  }

  if (id === 'combo-3-pizzas-gg') {
    return [
      { id: 'p1', title: '1ª Pizza Gigante (12 fatias)', shortTitle: '1ª Pizza GG', maxFlavors: 3 },
      { id: 'p2', title: '2ª Pizza Gigante (12 fatias)', shortTitle: '2ª Pizza GG', maxFlavors: 3 },
      { id: 'p3', title: '3ª Pizza Gigante (12 fatias)', shortTitle: '3ª Pizza GG', maxFlavors: 3 }
    ];
  }

  if (id === 'combo-1gg-1fm-10esf') {
    return [
      { id: 'p1', title: '1ª Pizza Gigante (12 fatias)', shortTitle: '1ª Pizza GG', maxFlavors: 3 },
      { id: 'p2', title: '2ª Pizza Família (8 fatias)', shortTitle: '2ª Pizza FM', maxFlavors: 2 }
    ];
  }

  if (id === 'combo-1-fm-10esf' || id === 'combo-fm-acai') {
    return [
      { id: 'p1', title: 'Pizza Família (8 fatias)', shortTitle: 'Pizza Família', maxFlavors: 2 }
    ];
  }

  if (id === 'combo-gg-acai') {
    return [
      { id: 'p1', title: 'Pizza Gigante (12 fatias)', shortTitle: 'Pizza Gigante', maxFlavors: 3 }
    ];
  }

  // Generic fallback if product mentions 2 or 3 pizzas
  const name = (product.name || '').toLowerCase();
  if (name.includes('3 pizza')) {
    return [
      { id: 'p1', title: '1ª Pizza Gigante (12 fatias)', shortTitle: '1ª Pizza', maxFlavors: 3 },
      { id: 'p2', title: '2ª Pizza Gigante (12 fatias)', shortTitle: '2ª Pizza', maxFlavors: 3 },
      { id: 'p3', title: '3ª Pizza Gigante (12 fatias)', shortTitle: '3ª Pizza', maxFlavors: 3 }
    ];
  }

  if (name.includes('2 pizza') || name.includes('duas pizza')) {
    const isGigante = name.includes('gigante');
    return [
      { id: 'p1', title: isGigante ? '1ª Pizza Gigante (12 fatias)' : '1ª Pizza Família (8 fatias)', shortTitle: '1ª Pizza', maxFlavors: isGigante ? 3 : 2 },
      { id: 'p2', title: isGigante ? '2ª Pizza Gigante (12 fatias)' : '2ª Pizza Família (8 fatias)', shortTitle: '2ª Pizza', maxFlavors: isGigante ? 3 : 2 }
    ];
  }

  const isGigante = name.includes('gigante');
  return [
    { id: 'p1', title: isGigante ? 'Pizza Gigante (12 fatias)' : 'Pizza Família (8 fatias)', shortTitle: 'Pizza', maxFlavors: isGigante ? 3 : 2 }
  ];
}

export function ComboCustomizerModal({ 
  isOpen, 
  onClose, 
  comboProduct, 
  onAddComboToCart 
}) {
  const [activePizzaIndex, setActivePizzaIndex] = useState(0);
  const [pizzaSelections, setPizzaSelections] = useState({});
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState('');
  const [semSuinosEsfirras, setSemSuinosEsfirras] = useState(false);

  // Check if this combo contains esfirras
  const hasEsfirrasInCombo = useMemo(() => {
    const text = `${comboProduct?.name || ''} ${comboProduct?.description || ''}`.toLowerCase();
    return text.includes('esfirra');
  }, [comboProduct]);

  // Get configuration of pizzas for this combo
  const pizzasConfig = useMemo(() => {
    return getComboPizzasConfig(comboProduct);
  }, [comboProduct]);

  const [flavorsList, setFlavorsList] = useState(() => getStoredPizzaFlavors());

  // Listen to pizza_flavors_updated
  useEffect(() => {
    const handleFlavorsUpdated = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setFlavorsList(e.detail);
      } else {
        setFlavorsList(getStoredPizzaFlavors());
      }
    };
    window.addEventListener('pizza_flavors_updated', handleFlavorsUpdated);
    window.addEventListener('storage', handleFlavorsUpdated);
    return () => {
      window.removeEventListener('pizza_flavors_updated', handleFlavorsUpdated);
      window.removeEventListener('storage', handleFlavorsUpdated);
    };
  }, []);

  const availableFlavors = useMemo(() => {
    return flavorsList.filter(f => f.isAvailable !== false);
  }, [flavorsList]);

  // Reset state on open
  useEffect(() => {
    if (isOpen && comboProduct) {
      setFlavorsList(getStoredPizzaFlavors());
      setActivePizzaIndex(0);
      setNotes('');
      setValidationError('');
      setSemSuinosEsfirras(false);

      // Initialize empty selection for each pizza in the combo
      const initial = {};
      const config = getComboPizzasConfig(comboProduct);
      config.forEach(p => {
        initial[p.id] = [];
      });
      setPizzaSelections(initial);
    }
  }, [isOpen, comboProduct]);

  if (!isOpen || !comboProduct) return null;

  const currentPizza = pizzasConfig[activePizzaIndex] || pizzasConfig[0];
  const currentFlavors = pizzaSelections[currentPizza?.id] || [];

  // Toggle a flavor for the active pizza
  const toggleFlavor = (flavor) => {
    setValidationError('');
    const currentList = pizzaSelections[currentPizza.id] || [];

    if (currentList.includes(flavor)) {
      setPizzaSelections(prev => ({
        ...prev,
        [currentPizza.id]: currentList.filter(f => f !== flavor)
      }));
    } else {
      if (currentList.length < currentPizza.maxFlavors) {
        setPizzaSelections(prev => ({
          ...prev,
          [currentPizza.id]: [...currentList, flavor]
        }));
      }
    }
  };

  // Quick action: copy flavors from 1st pizza to 2nd pizza
  const handleCopyFromFirstPizza = () => {
    const firstPizzaFlavors = pizzaSelections[pizzasConfig[0].id] || [];
    if (firstPizzaFlavors.length === 0) {
      setValidationError('Escolha os sabores da 1ª pizza primeiro!');
      return;
    }

    setPizzaSelections(prev => ({
      ...prev,
      [currentPizza.id]: [...firstPizzaFlavors]
    }));
  };

  // Check if all pizzas have at least 1 flavor
  const allPizzasHaveFlavors = pizzasConfig.every(p => {
    const list = pizzaSelections[p.id] || [];
    return list.length > 0;
  });

  const handleConfirm = () => {
    // Validate each pizza
    for (let i = 0; i < pizzasConfig.length; i++) {
      const p = pizzasConfig[i];
      const selected = pizzaSelections[p.id] || [];
      if (selected.length === 0) {
        setActivePizzaIndex(i);
        setValidationError(`Por favor, selecione ao menos 1 sabor para a ${p.title}!`);
        return;
      }
    }

    // Build human-friendly breakdown
    const breakdown = pizzasConfig.map((p, idx) => {
      const flavors = pizzaSelections[p.id] || [];
      return `${p.shortTitle}: ${flavors.join(' / ')}`;
    }).join(' • ');

    const customCombo = {
      id: `custom-combo-${comboProduct.id}-${Date.now()}`,
      name: comboProduct.name,
      price: comboProduct.price,
      isCombo: true,
      semSuinosEsfirras: hasEsfirrasInCombo ? semSuinosEsfirras : false,
      pizzaSelections: pizzasConfig.map(p => ({
        pizzaTitle: p.title,
        flavors: pizzaSelections[p.id] || []
      })),
      notes: notes.trim(),
      image: comboProduct.image,
      bordaGratis: comboProduct.bordaGratis,
      description: `${breakdown}. Acompanha borda de Catupiry grátis.${hasEsfirrasInCombo ? (semSuinosEsfirras ? ' • 10 Esfirras: SORTIDAS SEM CARNE SUÍNA' : ' • 10 Esfirras Sortidas') : ''}${notes ? ` Obs: ${notes}` : ''}`
    };

    onAddComboToCart(customCombo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-xl bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-dark-800 bg-gradient-to-r from-dark-950 to-dark-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/30 flex-shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-base sm:text-lg text-white leading-tight">
                {comboProduct.name}
              </h2>
              <p className="text-xs text-brand-gold font-medium">
                {pizzasConfig.length > 1 
                  ? `Monte suas ${pizzasConfig.length} pizzas individualmente com borda grátis!` 
                  : 'Escolha os sabores da sua pizza com borda de Catupiry grátis!'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-dark-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Borda Catupiry Banner */}
        {comboProduct.bordaGratis && (
          <div className="bg-gradient-to-r from-amber-500/20 via-brand-gold/25 to-amber-500/20 border-b border-brand-gold/30 px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold text-brand-goldLight shadow-inner">
            <Sparkles className="w-4 h-4 text-brand-gold animate-pulse" />
            <span>Borda de Catupiry 100% GRÁTIS Inclusa em Todas as Pizzas!</span>
          </div>
        )}

        {/* Multi-Pizza Segmented Selector (When Combo has 2 or more pizzas) */}
        {pizzasConfig.length > 1 && (
          <div className="p-3 bg-dark-950 border-b border-dark-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Selecione a pizza para montar:</span>
              <span className="text-brand-gold">
                Etapa {activePizzaIndex + 1} de {pizzasConfig.length}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {pizzasConfig.map((pizza, idx) => {
                const isSelected = activePizzaIndex === idx;
                const flavorsCount = (pizzaSelections[pizza.id] || []).length;
                const isComplete = flavorsCount > 0;

                return (
                  <button
                    key={pizza.id}
                    type="button"
                    onClick={() => {
                      setActivePizzaIndex(idx);
                      setValidationError('');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-brand-gold text-dark-950 border-brand-gold shadow-glow-gold'
                        : isComplete
                        ? 'bg-dark-900 border-emerald-500/50 text-white'
                        : 'bg-dark-900 border-dark-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-xs truncate">
                        {pizza.shortTitle}
                      </span>
                      {isComplete && (
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-dark-950' : 'text-emerald-400'}`} />
                      )}
                    </div>

                    <div className="text-[10px] mt-0.5 truncate font-medium">
                      {flavorsCount > 0 
                        ? `${flavorsCount}/${pizza.maxFlavors} sabores` 
                        : `Até ${pizza.maxFlavors} sabores`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Current Pizza Header & Helper */}
          <div className="bg-dark-950/70 p-3.5 rounded-2xl border border-dark-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <PizzaIcon className="w-4 h-4 text-brand-gold" />
                <h3 className="font-display font-extrabold text-sm sm:text-base text-white">
                  {currentPizza?.title}
                </h3>
              </div>
              <p className="text-xs text-brand-goldLight mt-0.5 font-medium">
                Escolha até {currentPizza?.maxFlavors} sabores ({currentFlavors.length}/{currentPizza?.maxFlavors} selecionados)
              </p>
            </div>

            {/* Quick copy button if on 2nd or 3rd pizza and 1st pizza is chosen */}
            {activePizzaIndex > 0 && (pizzaSelections[pizzasConfig[0].id] || []).length > 0 && (
              <button
                type="button"
                onClick={handleCopyFromFirstPizza}
                className="self-start sm:self-auto px-2.5 py-1.5 rounded-lg bg-dark-900 hover:bg-dark-850 text-brand-gold text-[11px] font-bold border border-brand-gold/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copiar os mesmos sabores da 1ª pizza"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Repetir Sabores da 1ª Pizza</span>
              </button>
            )}
          </div>

          {/* Flavors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableFlavors.map((flavor) => {
              const flavorName = typeof flavor === 'object' ? flavor.name : flavor;
              const isSelected = currentFlavors.includes(flavorName);
              return (
                <button
                  key={flavor.id || flavorName}
                  type="button"
                  onClick={() => toggleFlavor(flavorName)}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-gold/20 border-brand-gold text-brand-goldLight shadow-sm'
                      : 'bg-dark-950 border-dark-800 text-slate-300 hover:border-dark-700'
                  }`}
                >
                  <span className="truncate">{flavorName}</span>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border ${
                    isSelected
                      ? 'bg-brand-gold border-brand-gold text-dark-950'
                      : 'border-slate-600 bg-dark-900'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Next Pizza Shortcut Button if multiple pizzas */}
          {pizzasConfig.length > 1 && activePizzaIndex < pizzasConfig.length - 1 && currentFlavors.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setActivePizzaIndex(activePizzaIndex + 1);
                  setValidationError('');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-dark-800 hover:bg-dark-750 text-brand-gold hover:text-amber-300 text-xs font-bold border border-brand-gold/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Avançar para a {pizzasConfig[activePizzaIndex + 1].shortTitle}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Live Summary of Pizzas */}
          <div className="bg-dark-950 p-3.5 rounded-2xl border border-dark-800 space-y-2 pt-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Resumo do Combo:
            </span>

            <div className="space-y-1.5 text-xs">
              {pizzasConfig.map((pizza, idx) => {
                const flavors = pizzaSelections[pizza.id] || [];
                return (
                  <div key={pizza.id} className="flex items-start justify-between gap-2">
                    <span className="text-slate-400 font-medium">
                      🍕 {pizza.shortTitle}:
                    </span>
                    <span className={`text-right font-bold ${flavors.length > 0 ? 'text-brand-gold' : 'text-slate-500 italic'}`}>
                      {flavors.length > 0 ? flavors.join(' + ') : 'Escolha os sabores'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Esfirras Acompanhamento & Opção Sem Suínos */}
          {hasEsfirrasInCombo && (
            <div className="p-3.5 rounded-2xl bg-dark-950 border border-brand-gold/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    Acompanha 10 Esfirras Sortidas Artesanais
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Massa fresca e macia da El Shadday
                  </span>
                </div>
              </div>

              <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-900 border border-dark-800 hover:border-brand-gold/40 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={semSuinosEsfirras}
                  onChange={(e) => setSemSuinosEsfirras(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-gold accent-brand-gold cursor-pointer"
                />
                <span className={`text-xs font-black ${semSuinosEsfirras ? 'text-brand-gold' : 'text-slate-400'}`}>
                  🚫 Opção Sem Suínos
                </span>
              </label>
            </div>
          )}

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Observações do Combo (Opcional):
            </label>
            <input
              type="text"
              placeholder="Ex: 1ª Pizza bem assada, 2ª Pizza sem cebola..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-800 focus:border-brand-gold text-white text-xs placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-dark-950 border-t border-dark-800 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-slate-400 block">Total do Combo:</span>
            <span className="text-xl sm:text-2xl font-black text-brand-gold">
              R$ {comboProduct.price.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className={`px-6 py-3.5 rounded-xl font-extrabold text-xs sm:text-sm shadow-glow-gold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
              allPizzasHaveFlavors
                ? 'bg-gradient-to-r from-brand-gold to-amber-400 hover:from-amber-400 hover:to-brand-gold text-dark-950 active:scale-95'
                : 'bg-dark-800 text-slate-400 hover:text-white border border-dark-700'
            }`}
          >
            <span>Adicionar Combo</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

      </div>
    </div>
  );
}
