import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Flame, Check, Sparkles, AlertCircle, Copy, 
  ChevronRight, ArrowRight, Pizza, Pizza as PizzaIcon, CheckCircle2, 
  Package, IceCream, ArrowLeft, Search, ArrowUpRight, Info 
} from 'lucide-react';
import { 
  getStoredPizzaFlavors, 
  calculatePizzaPrice, 
  calculatePizzaSurcharge, 
  getFlavorSurchargeForPizza,
  getStoredAcaiSettings,
  DYDYO_FLAVORS,
  INITIAL_PIZZA_FLAVORS 
} from '../data/menuData';

// Helper to determine the pizza configuration for any combo with size & base price
export function getComboPizzasConfig(product) {
  if (!product) return [];

  const id = product.id;

  if (id === 'combo-2-pizzas-gg') {
    return [
      { id: 'p1', title: '1ª Pizza Gigante (12 fatias)', shortTitle: '1ª Pizza GG', maxFlavors: 3, size: 'gigante', basePrice: 50.00 },
      { id: 'p2', title: '2ª Pizza Gigante (12 fatias)', shortTitle: '2ª Pizza GG', maxFlavors: 3, size: 'gigante', basePrice: 50.00 }
    ];
  }

  if (id === 'combo-2-pizzas-fm') {
    return [
      { id: 'p1', title: '1ª Pizza Família (8 fatias)', shortTitle: '1ª Pizza FM', maxFlavors: 2, size: 'familia', basePrice: 40.00 },
      { id: 'p2', title: '2ª Pizza Família (8 fatias)', shortTitle: '2ª Pizza FM', maxFlavors: 2, size: 'familia', basePrice: 40.00 }
    ];
  }

  if (id === 'combo-3-pizzas-gg') {
    return [
      { id: 'p1', title: '1ª Pizza Gigante (12 fatias)', shortTitle: '1ª Pizza GG', maxFlavors: 3, size: 'gigante', basePrice: 50.00 },
      { id: 'p2', title: '2ª Pizza Gigante (12 fatias)', shortTitle: '2ª Pizza GG', maxFlavors: 3, size: 'gigante', basePrice: 50.00 },
      { id: 'p3', title: '3ª Pizza Gigante (12 fatias)', shortTitle: '3ª Pizza GG', maxFlavors: 3, size: 'gigante', basePrice: 50.00 }
    ];
  }

  if (id === 'combo-1gg-1fm-10esf') {
    return [
      { id: 'p1', title: '1ª Pizza Gigante (12 fatias)', shortTitle: '1ª Pizza GG', maxFlavors: 3, size: 'gigante', basePrice: 50.00 },
      { id: 'p2', title: '2ª Pizza Família (8 fatias)', shortTitle: '2ª Pizza FM', maxFlavors: 2, size: 'familia', basePrice: 40.00 }
    ];
  }

  if (id === 'combo-1-fm-10esf' || id === 'combo-fm-acai' || id === 'combo-pizza-fm-p-dydyo') {
    return [
      { id: 'p1', title: 'Pizza Família (8 fatias)', shortTitle: 'Pizza Família', maxFlavors: 2, size: 'familia', basePrice: 40.00 }
    ];
  }

  if (id === 'combo-gg-acai' || id === 'combo-pizza-gg-p-dydyo' || id === 'combo-pizza-gg-dydyo') {
    return [
      { id: 'p1', title: 'Pizza Gigante (12 fatias)', shortTitle: 'Pizza Gigante', maxFlavors: 3, size: 'gigante', basePrice: 50.00 }
    ];
  }

  // Generic fallback if product mentions 2 or 3 pizzas
  const name = (product.name || '').toLowerCase();
  if (name.includes('3 pizza')) {
    return [
      { id: 'p1', title: '1ª Pizza Gigante (12 fatias)', shortTitle: '1ª Pizza', maxFlavors: 3, size: 'gigante', basePrice: 50.00 },
      { id: 'p2', title: '2ª Pizza Gigante (12 fatias)', shortTitle: '2ª Pizza', maxFlavors: 3, size: 'gigante', basePrice: 50.00 },
      { id: 'p3', title: '3ª Pizza Gigante (12 fatias)', shortTitle: '3ª Pizza', maxFlavors: 3, size: 'gigante', basePrice: 50.00 }
    ];
  }

  if (name.includes('2 pizza') || name.includes('duas pizza')) {
    const isGigante = name.includes('gigante');
    return [
      { id: 'p1', title: isGigante ? '1ª Pizza Gigante (12 fatias)' : '1ª Pizza Família (8 fatias)', shortTitle: '1ª Pizza', maxFlavors: isGigante ? 3 : 2, size: isGigante ? 'gigante' : 'familia', basePrice: isGigante ? 50.00 : 40.00 },
      { id: 'p2', title: isGigante ? '2ª Pizza Gigante (12 fatias)' : '2ª Pizza Família (8 fatias)', shortTitle: '2ª Pizza', maxFlavors: isGigante ? 3 : 2, size: isGigante ? 'gigante' : 'familia', basePrice: isGigante ? 50.00 : 40.00 }
    ];
  }

  const isGigante = name.includes('gigante');
  return [
    { id: 'p1', title: isGigante ? 'Pizza Gigante (12 fatias)' : 'Pizza Família (8 fatias)', shortTitle: 'Pizza', maxFlavors: isGigante ? 3 : 2, size: isGigante ? 'gigante' : 'familia', basePrice: isGigante ? 50.00 : 40.00 }
  ];
}

export function ComboCustomizerModal({ 
  isOpen, 
  onClose, 
  comboProduct, 
  onAddComboToCart,
  isStoreOpen = true
}) {
  const [activeStage, setActiveStage] = useState('pizzas'); // 'pizzas' | 'acai'
  const [activePizzaIndex, setActivePizzaIndex] = useState(0);
  const [pizzaSelections, setPizzaSelections] = useState({});
  const [flavorSearch, setFlavorSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [selectedAcaiComplements, setSelectedAcaiComplements] = useState([]);
  const [selectedAcaiCobertura, setSelectedAcaiCobertura] = useState('Sem Cobertura');
  const [selectedDydyo, setSelectedDydyo] = useState('Dydyo Guaraná 2L');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState('');
  const [semSuinosEsfirras, setSemSuinosEsfirras] = useState(false);

  // Check accompaniments for this combo
  const hasEsfirrasInCombo = useMemo(() => {
    const text = `${comboProduct?.name || ''} ${comboProduct?.description || ''}`.toLowerCase();
    return text.includes('esfirra');
  }, [comboProduct]);

  const hasDydyoInCombo = useMemo(() => {
    const text = `${comboProduct?.name || ''} ${comboProduct?.description || ''}`.toLowerCase();
    return text.includes('dydyo');
  }, [comboProduct]);

  const hasAcaiInCombo = useMemo(() => {
    const text = `${comboProduct?.name || ''} ${comboProduct?.description || ''}`.toLowerCase();
    return text.includes('açaí') || text.includes('acai');
  }, [comboProduct]);

  const hasPizzaPInCombo = useMemo(() => {
    const text = `${comboProduct?.name || ''} ${comboProduct?.description || ''}`.toLowerCase();
    return text.includes('pizza p') || text.includes('brigadeiro');
  }, [comboProduct]);

  // Get configuration of pizzas for this combo
  const pizzasConfig = useMemo(() => {
    return getComboPizzasConfig(comboProduct);
  }, [comboProduct]);

  const [flavorsList, setFlavorsList] = useState(() => getStoredPizzaFlavors());
  const [acaiConfig, setAcaiConfig] = useState(() => getStoredAcaiSettings());
  const [acaiLimitWarning, setAcaiLimitWarning] = useState('');

  // Listen to pizza_flavors_updated and acai_settings_updated
  useEffect(() => {
    const handleFlavorsUpdated = (e) => {
      if (e?.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setFlavorsList(e.detail);
      } else {
        const stored = getStoredPizzaFlavors();
        setFlavorsList(stored && stored.length > 0 ? stored : INITIAL_PIZZA_FLAVORS);
      }
    };
    const handleAcaiUpdated = (e) => {
      if (e?.detail) setAcaiConfig(e.detail);
      else setAcaiConfig(getStoredAcaiSettings());
    };
    window.addEventListener('pizza_flavors_updated', handleFlavorsUpdated);
    window.addEventListener('acai_settings_updated', handleAcaiUpdated);
    window.addEventListener('storage', handleFlavorsUpdated);
    return () => {
      window.removeEventListener('pizza_flavors_updated', handleFlavorsUpdated);
      window.removeEventListener('acai_settings_updated', handleAcaiUpdated);
      window.removeEventListener('storage', handleFlavorsUpdated);
    };
  }, []);

  const availableFlavors = useMemo(() => {
    const list = Array.isArray(flavorsList) && flavorsList.length > 0 ? flavorsList : INITIAL_PIZZA_FLAVORS;
    const unpaused = list.filter(f => f.isAvailable !== false);
    return unpaused.length > 0 ? unpaused : list;
  }, [flavorsList]);

  const availableAcaiComplements = useMemo(() => {
    return (acaiConfig.complements || []).filter(c => c.isAvailable !== false);
  }, [acaiConfig]);

  const availableAcaiCoberturas = useMemo(() => {
    return (acaiConfig.coberturas || [])
      .map((cb, idx) => typeof cb === 'string' ? { id: `cob_${idx}`, name: cb, price: 0, isAvailable: true } : cb)
      .filter(c => c.isAvailable !== false);
  }, [acaiConfig]);

  const maxComboLimit = Number(acaiConfig.maxComplementsPerComboBarca) || 0;

  // Calculate extras surcharge for Acai in combo (if any complement or cobertura has price > 0)
  const acaiExtrasSurcharge = useMemo(() => {
    if (!hasAcaiInCombo) return 0;
    let extra = 0;
    selectedAcaiComplements.forEach(compName => {
      const compObj = (acaiConfig.complements || []).find(c => c.name === compName);
      if (compObj && Number(compObj.price) > 0) {
        extra += Number(compObj.price);
      }
    });
    const cobObj = availableAcaiCoberturas.find(c => c.name === selectedAcaiCobertura);
    if (cobObj && Number(cobObj.price) > 0) {
      extra += Number(cobObj.price);
    }
    return extra;
  }, [hasAcaiInCombo, selectedAcaiComplements, selectedAcaiCobertura, acaiConfig, availableAcaiCoberturas]);

  // Reset state on open
  useEffect(() => {
    if (isOpen && comboProduct) {
      setFlavorsList(getStoredPizzaFlavors());
      const currentAcai = getStoredAcaiSettings();
      setAcaiConfig(currentAcai);

      setActiveStage('pizzas');
      setActivePizzaIndex(0);
      setFlavorSearch('');
      setCategoryFilter('todos');
      setNotes('');
      setValidationError('');
      setSemSuinosEsfirras(false);
      setAcaiLimitWarning('');

      // Pre-seleciona adicionais padrão do Açaí se houver barca
      const avail = (currentAcai.complements || []).filter(c => c.isAvailable !== false);
      const defaultComplements = avail.filter(c => c.defaultSelected).map(c => c.name);
      const lim = Number(currentAcai.maxComplementsPerComboBarca) || 0;
      setSelectedAcaiComplements(lim > 0 ? defaultComplements.slice(0, lim) : defaultComplements);
      setSelectedAcaiCobertura('Sem Cobertura');
      setSelectedDydyo('Dydyo Guaraná 2L');

      // Initialize empty selection for each pizza in the combo
      const initial = {};
      const config = getComboPizzasConfig(comboProduct);
      config.forEach(p => {
        initial[p.id] = [];
      });
      setPizzaSelections(initial);
    }
  }, [isOpen, comboProduct]);

  const currentPizza = pizzasConfig[activePizzaIndex] || pizzasConfig[0];
  const currentFlavors = (currentPizza && pizzaSelections[currentPizza.id]) || [];

  // Available categories ordered
  const availableCategories = useMemo(() => {
    const set = new Set(availableFlavors.map(f => f.category || 'salgadas'));
    const order = ['salgadas', 'especiais', 'doces'];
    const arr = Array.from(set);
    return arr.sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [availableFlavors]);

  // Filtered flavors based on search & category
  const filteredFlavors = useMemo(() => {
    return availableFlavors.filter(flavor => {
      const matchesCategory = categoryFilter === 'todos' || (flavor.category || 'salgadas') === categoryFilter;
      const q = flavorSearch.toLowerCase().trim();
      const matchesSearch = !q || 
        flavor.name.toLowerCase().includes(q) || 
        (flavor.description && flavor.description.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [availableFlavors, categoryFilter, flavorSearch]);

  // Calculate surcharges for all pizzas in combo
  const pizzaSurcharges = useMemo(() => {
    const map = {};
    pizzasConfig.forEach(p => {
      const flavors = pizzaSelections[p.id] || [];
      const base = Number(p.basePrice) || (p.size === 'gigante' ? 50.00 : 40.00);
      map[p.id] = calculatePizzaSurcharge(base, flavors, p.size);
    });
    return map;
  }, [pizzasConfig, pizzaSelections]);

  const totalComboSurcharge = useMemo(() => {
    const pizzaSur = Object.values(pizzaSurcharges).reduce((acc, v) => acc + (Number(v) || 0), 0);
    return pizzaSur + acaiExtrasSurcharge;
  }, [pizzaSurcharges, acaiExtrasSurcharge]);

  const baseComboPrice = Number(comboProduct?.price) || 0;
  const finalComboPrice = baseComboPrice + totalComboSurcharge;

  if (!isOpen || !comboProduct) return null;

  // Toggle a flavor for the active pizza
  const toggleFlavor = (flavorName) => {
    setValidationError('');
    const currentList = pizzaSelections[currentPizza.id] || [];

    if (currentList.includes(flavorName)) {
      setPizzaSelections(prev => ({
        ...prev,
        [currentPizza.id]: currentList.filter(f => f !== flavorName)
      }));
    } else {
      if (currentList.length < currentPizza.maxFlavors) {
        setPizzaSelections(prev => ({
          ...prev,
          [currentPizza.id]: [...currentList, flavorName]
        }));
      }
    }
  };

  // Toggle complement for Açaí
  const toggleAcaiComplement = (name) => {
    setAcaiLimitWarning('');
    setSelectedAcaiComplements(prev => {
      if (prev.includes(name)) {
        return prev.filter(c => c !== name);
      }
      if (maxComboLimit > 0 && prev.length >= maxComboLimit) {
        setAcaiLimitWarning(`Limite máximo de acompanhamentos atingido na barca (${maxComboLimit}). Desmarque um para trocar.`);
        return prev;
      }
      return [...prev, name];
    });
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

  const handleConfirm = () => {
    // Validate each pizza
    for (let i = 0; i < pizzasConfig.length; i++) {
      const p = pizzasConfig[i];
      const selected = pizzaSelections[p.id] || [];
      if (selected.length === 0) {
        setActiveStage('pizzas');
        setActivePizzaIndex(i);
        setValidationError(`Por favor, selecione ao menos 1 sabor para a ${p.title}!`);
        return;
      }
    }

    // Build human-friendly breakdown with surcharges if any
    const breakdown = pizzasConfig.map((p) => {
      const flavors = pizzaSelections[p.id] || [];
      const surcharge = pizzaSurcharges[p.id] || 0;
      const extraStr = surcharge > 0 ? ` (+ R$ ${surcharge.toFixed(2).replace('.', ',')})` : '';
      return `${p.shortTitle}: ${flavors.join(' / ')}${extraStr}`;
    }).join(' • ');

    const extras = [];
    if (hasEsfirrasInCombo) {
      extras.push(semSuinosEsfirras ? '10 Esfirras: SORTIDAS SEM CARNE SUÍNA' : '10 Esfirras Sortidas');
    }
    if (hasPizzaPInCombo) {
      extras.push('Pizza P Doce Brigadeiro');
    }
    if (hasAcaiInCombo) {
      const complementsFormatted = selectedAcaiComplements.map(name => {
        const compObj = (acaiConfig.complements || []).find(c => c.name === name);
        const pr = Number(compObj?.price) || 0;
        return pr > 0 ? `${name} (+R$ ${pr.toFixed(2).replace('.', ',')})` : name;
      });
      const cobObj = availableAcaiCoberturas.find(c => c.name === selectedAcaiCobertura);
      const cobPrice = Number(cobObj?.price) || 0;
      const cobFormatted = selectedAcaiCobertura && selectedAcaiCobertura !== 'Sem Cobertura'
        ? ` + ${selectedAcaiCobertura}${cobPrice > 0 ? ` (+R$ ${cobPrice.toFixed(2).replace('.', ',')})` : ''}`
        : '';
      const acaiText = complementsFormatted.length > 0
        ? `Barca de Açaí (${complementsFormatted.join(', ')}${cobFormatted})`
        : 'Barca de Açaí Tradicional';
      extras.push(acaiText);
    }
    if (hasDydyoInCombo) {
      extras.push(selectedDydyo || 'Dydyo 2L');
    }
    const extrasText = extras.length > 0 ? ` • Acompanha: ${extras.join(' + ')}` : '';
    const surchargeNotice = totalComboSurcharge > 0 
      ? ` • Sabores especiais: + R$ ${totalComboSurcharge.toFixed(2).replace('.', ',')}` 
      : '';

    const customCombo = {
      id: `custom-combo-${comboProduct.id}-${Date.now()}`,
      name: comboProduct.name,
      price: finalComboPrice,
      basePrice: baseComboPrice,
      totalSurcharge: totalComboSurcharge,
      isCombo: true,
      semSuinosEsfirras: hasEsfirrasInCombo ? semSuinosEsfirras : false,
      pizzaSelections: pizzasConfig.map(p => ({
        pizzaTitle: p.title,
        flavors: pizzaSelections[p.id] || [],
        surcharge: pizzaSurcharges[p.id] || 0
      })),
      acaiComplements: hasAcaiInCombo ? selectedAcaiComplements : [],
      acaiCobertura: hasAcaiInCombo ? selectedAcaiCobertura : '',
      dydyoFlavor: hasDydyoInCombo ? selectedDydyo : null,
      notes: notes.trim(),
      image: comboProduct.image,
      bordaGratis: comboProduct.bordaGratis,
      description: `${breakdown}. Acompanha borda de Catupiry grátis.${extrasText}${surchargeNotice}${notes ? ` Obs: ${notes}` : ''}`
    };

    onAddComboToCart(customCombo);
    onClose();
  };

  const currentPizzaBase = Number(currentPizza?.basePrice) || (currentPizza?.size === 'gigante' ? 50.00 : 40.00);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl sm:max-w-3xl bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
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
                {hasAcaiInCombo
                  ? 'Monte sua pizza com foto de cada sabor e escolha os acompanhamentos do açaí!'
                  : pizzasConfig.length > 1 
                  ? `Escolha os sabores das suas ${pizzasConfig.length} pizzas com foto ilustrativa e borda grátis!` 
                  : 'Escolha os sabores da sua pizza com foto ilustrativa e borda de Catupiry grátis!'}
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

        {/* Closed Store Alert */}
        {!isStoreOpen && (
          <div className="bg-red-950/90 border-b border-red-500/30 px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold text-red-200">
            <span>⛔ Estabelecimento Fechado • Apenas visualização do combo (pedidos pausados)</span>
          </div>
        )}

        {/* Borda Catupiry Banner */}
        {comboProduct.bordaGratis && (
          <div className="bg-gradient-to-r from-amber-500/20 via-brand-gold/25 to-amber-500/20 border-b border-brand-gold/30 px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold text-brand-goldLight shadow-inner">
            <Sparkles className="w-4 h-4 text-brand-gold animate-pulse" />
            <span>Borda de Catupiry 100% GRÁTIS Inclusa em Todas as Pizzas!</span>
          </div>
        )}

        {/* Multi-Step Navigation: Pizzas & Barca de Açaí */}
        {(pizzasConfig.length > 1 || hasAcaiInCombo) && (
          <div className="p-3 bg-dark-950 border-b border-dark-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Etapas de Personalização:</span>
              <span className="text-brand-gold font-extrabold">
                {activeStage === 'acai' ? 'Barca de Açaí' : `${currentPizza?.shortTitle} (${activePizzaIndex + 1}/${pizzasConfig.length})`}
              </span>
            </div>

            <div className="flex gap-2 flex-wrap">
              {pizzasConfig.map((pizza, idx) => {
                const isSelected = activeStage === 'pizzas' && activePizzaIndex === idx;
                const flavorsCount = (pizzaSelections[pizza.id] || []).length;
                const isComplete = flavorsCount > 0;
                const surcharge = pizzaSurcharges[pizza.id] || 0;

                return (
                  <button
                    key={pizza.id}
                    type="button"
                    onClick={() => {
                      setActiveStage('pizzas');
                      setActivePizzaIndex(idx);
                      setValidationError('');
                    }}
                    className={`flex-1 min-w-[130px] p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-brand-gold text-dark-950 border-brand-gold shadow-glow-gold'
                        : isComplete
                        ? 'bg-dark-900 border-emerald-500/50 text-white'
                        : 'bg-dark-900 border-dark-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-xs truncate">
                        🍕 {pizza.shortTitle}
                      </span>
                      {isComplete && (
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-dark-950' : 'text-emerald-400'}`} />
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1 text-[10px] mt-0.5 font-medium">
                      <span className="truncate">
                        {flavorsCount > 0 
                          ? `${flavorsCount}/${pizza.maxFlavors} sabores` 
                          : `Até ${pizza.maxFlavors} sabores`}
                      </span>
                      {surcharge > 0 && (
                        <span className={`px-1.5 py-0.2 rounded font-black text-[9px] ${
                          isSelected 
                            ? 'bg-dark-950 text-amber-300' 
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          + R$ {surcharge.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Aba da Barca de Açaí */}
              {hasAcaiInCombo && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveStage('acai');
                    setValidationError('');
                  }}
                  className={`flex-1 min-w-[130px] p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                    activeStage === 'acai'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white border-purple-400 shadow-md ring-1 ring-purple-400'
                      : selectedAcaiComplements.length > 0
                      ? 'bg-purple-950/40 border-purple-500/50 text-purple-200'
                      : 'bg-dark-900 border-dark-800 text-slate-300 hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-extrabold text-xs truncate flex items-center gap-1">
                      <span>🍧</span>
                      <span>Barca de Açaí</span>
                    </span>
                    {selectedAcaiComplements.length > 0 && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-300" />
                    )}
                  </div>

                  <div className="text-[10px] mt-0.5 truncate font-medium opacity-90">
                    {selectedAcaiComplements.length > 0
                      ? `${selectedAcaiComplements.length} acompanhamentos`
                      : 'Escolher acompanhamentos'}
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
          
          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* ETAPA 1: ESCOLHA DOS SABORES DA PIZZA                   */}
          {/* ======================================================== */}
          {activeStage === 'pizzas' && (
            <div className="space-y-3.5">
              
              {/* Current Pizza Header & Helper */}
              <div className="bg-dark-950/70 p-3.5 rounded-2xl border border-dark-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <PizzaIcon className="w-4 h-4 text-brand-gold" />
                    <h3 className="font-display font-extrabold text-sm sm:text-base text-white">
                      {currentPizza?.title}
                    </h3>
                  </div>
                  <p className="text-xs text-brand-goldLight mt-0.5 font-medium">
                    Escolha até {currentPizza?.maxFlavors} sabores ({currentFlavors.length}/{currentPizza?.maxFlavors} selecionados)
                    {pizzaSurcharges[currentPizza?.id] > 0 && (
                      <span className="ml-2 font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.2 rounded text-[10px]">
                        Acréscimo nesta pizza: + R$ {pizzaSurcharges[currentPizza?.id].toFixed(2).replace('.', ',')}
                      </span>
                    )}
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

              {/* Informative Price Notice */}
              <div className="px-3 py-2 rounded-xl bg-dark-950/50 border border-dark-800 text-[11px] text-slate-300 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" />
                <span>
                  <strong className="text-white">Regra de Sabores:</strong> Sabores tradicionais são <strong className="text-emerald-400">100% inclusos</strong>. Sabores especiais agregam apenas a diferença de valor da pizza.
                </span>
              </div>

              {/* Search & Category Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar sabor por nome ou ingredientes..."
                    value={flavorSearch}
                    onChange={(e) => setFlavorSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-dark-950 border border-dark-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                  />
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('todos')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      categoryFilter === 'todos'
                        ? 'bg-brand-gold text-dark-950 font-black'
                        : 'bg-dark-950 text-slate-300 hover:bg-dark-800 border border-dark-800'
                    }`}
                  >
                    Todos ({availableFlavors.length})
                  </button>
                  {availableCategories.map(cat => {
                    const label = cat === 'salgadas' ? 'Salgadas 🧀' : cat === 'especiais' ? 'Especiais ⭐' : cat === 'doces' ? 'Doces 🍫' : cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer capitalize ${
                          categoryFilter === cat
                            ? 'bg-brand-gold text-dark-950 font-black'
                            : 'bg-dark-950 text-slate-300 hover:bg-dark-800 border border-dark-800'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Flavors Grid with Transparent-Background Photos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredFlavors.map((flavor) => {
                  const flavorName = flavor.name;
                  const isSelected = currentFlavors.includes(flavorName);
                  const isDisabled = !isSelected && currentFlavors.length >= currentPizza.maxFlavors;
                  const extraPrice = getFlavorSurchargeForPizza(currentPizzaBase, flavor, currentPizza?.size);
                  const imageSrc = flavor.image || '';

                  return (
                    <button
                      key={flavor.id || flavorName}
                      type="button"
                      onClick={() => toggleFlavor(flavorName)}
                      disabled={isDisabled}
                      className={`w-full p-2.5 sm:p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected
                          ? 'bg-brand-gold/15 border-brand-gold text-white ring-1 ring-brand-gold/50 shadow-md'
                          : isDisabled
                          ? 'bg-dark-950/40 border-dark-800/80 text-slate-500 opacity-40 cursor-not-allowed'
                          : 'bg-dark-950/90 hover:bg-dark-850 text-slate-200 border-dark-800 hover:border-dark-700'
                      }`}
                    >
                      {/* Left: Transparent Cutout Pizza Flavor Image */}
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center rounded-xl bg-dark-900/80 border border-dark-800/80 p-1 group-hover:scale-105 transition-transform">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={flavorName}
                            className="w-full h-full object-contain filter drop-shadow-md"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Pizza className="w-6 h-6 sm:w-7 sm:h-7 text-brand-gold/60" />
                        )}
                      </div>

                      {/* Center Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                            {flavorName}
                          </span>
                          {flavor.category && (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider ${
                              flavor.category === 'especiais' 
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                                : flavor.category === 'doces'
                                ? 'bg-pink-400/20 text-pink-300 border border-pink-400/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {flavor.category === 'especiais' ? 'Especial ⭐' : flavor.category === 'doces' ? 'Doce 🍫' : 'Tradicional'}
                            </span>
                          )}
                        </div>

                        {flavor.description && (
                          <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-normal">
                            {flavor.description}
                          </p>
                        )}

                        {/* Price / Addition for this Combo Pizza */}
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          {extraPrice === 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Incluso no Combo (+ R$ 0,00)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                              <ArrowUpRight className="w-3 h-3 text-brand-gold stroke-[3]" />
                              <span>+ R$ {extraPrice.toFixed(2).replace('.', ',')} no combo</span>
                            </span>
                          )}
                          <span className="text-[9px] text-slate-500 font-medium">
                            (Ref: R$ {Number(flavor.price || 40).toFixed(2).replace('.', ',')})
                          </span>
                        </div>
                      </div>

                      {/* Right: Checkbox */}
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 border transition-colors ${
                        isSelected
                          ? 'bg-brand-gold border-brand-gold text-dark-950 font-black shadow-sm'
                          : 'border-slate-700 bg-dark-900 text-transparent'
                      }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {filteredFlavors.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Nenhum sabor encontrado para a busca informada.
                </div>
              )}

              {/* Botão de Avanço para a Barca de Açaí */}
              {hasAcaiInCombo && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentFlavors.length === 0) {
                        setValidationError('Selecione ao menos 1 sabor para a pizza antes de avançar!');
                        return;
                      }
                      setActiveStage('acai');
                      setValidationError('');
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-brand-gold text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:scale-101 active:scale-98 transition-all cursor-pointer"
                  >
                    <span>Avançar para os Acompanhamentos da Barca de Açaí</span>
                    <span>🍧</span>
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              )}

              {/* Next Pizza Shortcut Button if multiple pizzas */}
              {pizzasConfig.length > 1 && activePizzaIndex < pizzasConfig.length - 1 && currentFlavors.length > 0 && (
                <div className="pt-1">
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
            </div>
          )}

          {/* ======================================================== */}
          {/* ETAPA 2: ESCOLHA DOS ACOMPANHAMENTOS DA BARCA DE AÇAÍ   */}
          {/* ======================================================== */}
          {activeStage === 'acai' && hasAcaiInCombo && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Header do Açaí */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 to-dark-950 border border-purple-500/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm sm:text-base text-white">
                      Barca de Açaí Especial Inclusa
                    </h3>
                    <p className="text-xs text-purple-300 font-medium">
                      {maxComboLimit > 0 ? `Escolha até ${maxComboLimit} acompanhamentos inclusos` : `${availableAcaiComplements.length} acompanhamentos frescos disponíveis`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveStage('pizzas')}
                  className="px-2.5 py-1.5 rounded-lg bg-dark-900 hover:bg-dark-850 text-slate-300 text-[11px] font-bold border border-dark-750 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar p/ Pizza</span>
                </button>
              </div>

              {/* Seletor de Acompanhamentos do Açaí */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                    Escolha os Acompanhamentos ({selectedAcaiComplements.length}{maxComboLimit > 0 ? `/${maxComboLimit}` : ''}):
                  </label>
                  <div className="flex items-center gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        setAcaiLimitWarning('');
                        const defaults = availableAcaiComplements.filter(c => c.defaultSelected).map(c => c.name);
                        setSelectedAcaiComplements(maxComboLimit > 0 ? defaults.slice(0, maxComboLimit) : defaults);
                      }}
                      className="text-purple-400 hover:underline cursor-pointer font-bold"
                    >
                      Padrão
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAcaiLimitWarning('');
                        const allNames = availableAcaiComplements.map(c => c.name);
                        if (maxComboLimit > 0) {
                          setSelectedAcaiComplements(allNames.slice(0, maxComboLimit));
                          if (allNames.length > maxComboLimit) {
                            setAcaiLimitWarning(`Marcados os primeiros ${maxComboLimit} acompanhamentos permitidos.`);
                          }
                        } else {
                          setSelectedAcaiComplements(allNames);
                        }
                      }}
                      className="text-purple-400 hover:underline cursor-pointer font-bold"
                    >
                      {maxComboLimit > 0 ? `Marcar (até ${maxComboLimit})` : 'Marcar Todos'}
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAcaiLimitWarning('');
                        setSelectedAcaiComplements([]);
                      }}
                      className="text-slate-400 hover:underline cursor-pointer"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {acaiLimitWarning && (
                  <div className="p-2.5 rounded-xl bg-purple-950/70 border border-purple-500/50 text-purple-200 text-xs flex items-center gap-2 animate-pulse">
                    <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>{acaiLimitWarning}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableAcaiComplements.map((item) => {
                    const isSelected = selectedAcaiComplements.includes(item.name);
                    const itemPrice = Number(item.price) || 0;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleAcaiComplement(item.name)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-500/20 border-purple-500 text-white font-bold shadow-sm ring-1 ring-purple-500/50'
                            : 'bg-dark-950 border-dark-800 text-slate-300 hover:border-dark-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base">{item.icon}</span>
                          <span className="text-xs truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {itemPrice > 0 && (
                            <span className="text-[10px] font-black font-mono text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
                              +R$ {itemPrice.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? 'bg-purple-500 text-dark-950' : 'border border-dark-700 bg-dark-900'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cobertura do Açaí */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  Cobertura da Barca (Opcional):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableAcaiCoberturas.map(cob => {
                    const cobPrice = Number(cob.price) || 0;
                    const isSelected = selectedAcaiCobertura === cob.name;
                    return (
                      <button
                        key={cob.id || cob.name}
                        type="button"
                        onClick={() => setSelectedAcaiCobertura(cob.name)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-500 text-dark-950 font-black border-purple-500 shadow-md'
                            : 'bg-dark-950 text-slate-300 border-dark-800 hover:border-dark-700'
                        }`}
                      >
                        <span className="truncate">{cob.name}</span>
                        {cobPrice > 0 && (
                          <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                            isSelected 
                              ? 'bg-dark-950/25 text-dark-950 border border-dark-950/30' 
                              : 'text-amber-300 bg-amber-500/15 border border-amber-500/30'
                          }`}>
                            +R$ {cobPrice.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* Resumo ao Vivo do Combo */}
          <div className="bg-dark-950 p-3.5 rounded-2xl border border-dark-800 space-y-2 pt-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Resumo do Combo:
            </span>

            <div className="space-y-1.5 text-xs">
              {pizzasConfig.map((pizza) => {
                const flavors = pizzaSelections[pizza.id] || [];
                const surcharge = pizzaSurcharges[pizza.id] || 0;
                return (
                  <div key={pizza.id} className="flex items-start justify-between gap-2">
                    <span className="text-slate-400 font-medium">
                      🍕 {pizza.shortTitle}:
                    </span>
                    <div className="text-right">
                      <span className={`font-bold ${flavors.length > 0 ? 'text-brand-gold' : 'text-slate-500 italic'}`}>
                        {flavors.length > 0 ? flavors.join(' + ') : 'Escolha os sabores'}
                      </span>
                      {surcharge > 0 && (
                        <span className="ml-1 text-[10px] text-amber-300 font-extrabold">
                          (+ R$ {surcharge.toFixed(2).replace('.', ',')})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {hasAcaiInCombo && (
                <div className="flex items-start justify-between gap-2 pt-1 border-t border-dark-850">
                  <span className="text-slate-400 font-medium">
                    🍧 Barca de Açaí:
                  </span>
                  <span className={`text-right font-bold ${selectedAcaiComplements.length > 0 ? 'text-purple-300' : 'text-slate-500 italic'}`}>
                    {selectedAcaiComplements.length > 0 
                      ? `${selectedAcaiComplements.length} adicionais selecionados` 
                      : 'Nenhum adicional'}
                  </span>
                </div>
              )}
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

          {/* Escolha do Refrigerante Dydyo 2L (Incluso no Combo) */}
          {hasDydyoInCombo && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-dark-950 border border-amber-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-base">🥤</span>
                  <span>Escolha o Sabor do seu Dydyo 2L:</span>
                </span>
                <span className="text-[10px] text-amber-300 font-bold bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                  Incluso no Combo
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {DYDYO_FLAVORS.map((dydyo) => {
                  const isSelected = selectedDydyo === dydyo.name;
                  return (
                    <button
                      key={dydyo.id}
                      type="button"
                      onClick={() => setSelectedDydyo(dydyo.name)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-white ring-1 ring-amber-400/50 shadow-md'
                          : 'bg-dark-900 hover:bg-dark-850 border-dark-800 text-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-amber-400 bg-amber-400 text-dark-950' : 'border-dark-600'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold leading-tight truncate">
                          {dydyo.flavor}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {dydyo.badge || '2L Gelado'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pizza P Doce Brigadeiro (se houver no combo) */}
          {hasPizzaPInCombo && (
            <div className="p-3.5 rounded-2xl bg-dark-950 border border-brand-gold/30 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block">
                  Sobremesa Inclusa no Combo:
                </span>
                <div className="mt-0.5">
                  <span className="text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                    🍫 1 Pizza P Doce Brigadeiro
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Observações do Combo (Opcional):
            </label>
            <input
              type="text"
              placeholder="Ex: Pizza bem assada, sem cebola, caprichar no morango do açaí..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-800 focus:border-brand-gold text-white text-xs placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-dark-800 bg-dark-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Valor Total do Combo:</span>
              {totalComboSurcharge > 0 && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold">
                  + R$ {totalComboSurcharge.toFixed(2).replace('.', ',')} sabores especiais
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-black text-brand-gold font-mono">
                R$ {finalComboPrice.toFixed(2).replace('.', ',')}
              </span>
              {totalComboSurcharge > 0 && (
                <span className="text-xs text-slate-500 line-through">
                  R$ {baseComboPrice.toFixed(2).replace('.', ',')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-400 font-bold text-xs cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isStoreOpen}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                !isStoreOpen
                  ? 'bg-dark-800 text-slate-500 border border-red-500/30 cursor-not-allowed'
                  : 'bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold hover:from-amber-400 hover:to-brand-gold text-dark-950 shadow-glow-gold cursor-pointer active:scale-98'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{!isStoreOpen ? '⛔ Fechado para Pedidos' : `Adicionar Combo • R$ ${finalComboPrice.toFixed(2).replace('.', ',')}`}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
