import React, { useState, useEffect, useMemo } from 'react';
import { X, Pizza, Check, Sparkles, AlertCircle, Info, Search, Flame, ArrowUpRight, Wine, Plus } from 'lucide-react';
import { 
  getStoredPizzaFlavors, 
  calculatePizzaPrice, 
  getPizzaFlavorPrice, 
  getPizzaSizeKey, 
  INITIAL_PIZZA_FLAVORS,
  BEVERAGE_OPTIONS,
  DYDYO_FLAVORS,
  getStoredExtraSauceConfig
} from '../data/menuData';

export function PizzaCustomizerModal({ isOpen, onClose, pizzaProduct, onAddPizzaToCart, flavors, isStoreOpen = true }) {
  const [flavorsList, setFlavorsList] = useState(() => {
    if (flavors && Array.isArray(flavors) && flavors.length > 0) return flavors;
    const stored = getStoredPizzaFlavors();
    return (stored && stored.length > 0) ? stored : INITIAL_PIZZA_FLAVORS;
  });
  const [selectedFlavors, setSelectedFlavors] = useState([]);
  const [flavorSearch, setFlavorSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [notes, setNotes] = useState('');

  // Refrigerante & Bebidas
  const isDydyoIncluded = useMemo(() => {
    const text = `${pizzaProduct?.name || ''} ${pizzaProduct?.description || ''} ${pizzaProduct?.details || ''}`.toLowerCase();
    return text.includes('dydyo');
  }, [pizzaProduct]);

  const [selectedDydyo, setSelectedDydyo] = useState('Dydyo Guaraná 2L');
  const [selectedBeverageId, setSelectedBeverageId] = useState('none');

  // Molho Extra da Casa
  const [extraSauceConfig, setExtraSauceConfig] = useState(() => getStoredExtraSauceConfig());
  const [wantsExtraSauce, setWantsExtraSauce] = useState(false);

  const maxFlavors = useMemo(() => {
    if (pizzaProduct?.maxSabores) return Number(pizzaProduct.maxSabores);
    const name = (pizzaProduct?.name || '').toLowerCase();
    if (name.includes('gigante') || name.includes('12 fatia') || name.includes('3 sabor')) return 3;
    if (name.includes('família') || name.includes('familia') || name.includes('8 fatia')) return 2;
    if (name.includes('média') || name.includes('media') || name.includes('6 fatia')) return 2;
    if (name.includes('brotinho') || name.includes('broto') || name.includes('pequena') || name.includes('4 fatia')) return 2;
    return 2;
  }, [pizzaProduct]);

  const basePrice = Number(pizzaProduct?.price) || 0;

  const sizeKey = useMemo(() => {
    return getPizzaSizeKey(pizzaProduct, basePrice);
  }, [pizzaProduct, basePrice]);

  // Atualiza lista quando eventos de sincronização acontecerem
  useEffect(() => {
    const handleFlavorsUpdated = (e) => {
      if (e?.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setFlavorsList(e.detail);
      } else {
        const stored = getStoredPizzaFlavors();
        setFlavorsList((stored && stored.length > 0) ? stored : INITIAL_PIZZA_FLAVORS);
      }
    };

    window.addEventListener('pizza_flavors_updated', handleFlavorsUpdated);
    window.addEventListener('storage', handleFlavorsUpdated);

    const handleSauceUpdated = (e) => {
      if (e?.detail) setExtraSauceConfig(e.detail);
      else setExtraSauceConfig(getStoredExtraSauceConfig());
    };
    window.addEventListener('extra_sauce_config_updated', handleSauceUpdated);

    return () => {
      window.removeEventListener('pizza_flavors_updated', handleFlavorsUpdated);
      window.removeEventListener('storage', handleFlavorsUpdated);
      window.removeEventListener('extra_sauce_config_updated', handleSauceUpdated);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      const activeFlavors = (flavors && Array.isArray(flavors) && flavors.length > 0)
        ? flavors
        : getStoredPizzaFlavors();
      setFlavorsList((activeFlavors && activeFlavors.length > 0) ? activeFlavors : INITIAL_PIZZA_FLAVORS);
      setSelectedFlavors([]);
      setFlavorSearch('');
      setCategoryFilter('todos');
      setNotes('');
      setSelectedDydyo('Dydyo Guaraná 2L');
      setSelectedBeverageId('none');
      setWantsExtraSauce(false);
      setExtraSauceConfig(getStoredExtraSauceConfig());
    }
  }, [isOpen, pizzaProduct, flavors]);

  // Sabores disponíveis com fallback para que a lista nunca fique vazia
  const availableFlavors = useMemo(() => {
    const list = Array.isArray(flavorsList) && flavorsList.length > 0 ? flavorsList : INITIAL_PIZZA_FLAVORS;
    const unpaused = list.filter(f => f.isAvailable !== false);
    return unpaused.length > 0 ? unpaused : list;
  }, [flavorsList]);

  // Categorias disponíveis dinamicamente ordenadas
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

  // Filtragem de sabores
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

  // Cálculo de Preço - Regra: sempre puxa para o maior valor do tamanho
  const calculatedPrice = useMemo(() => {
    return calculatePizzaPrice(basePrice, selectedFlavors, sizeKey);
  }, [basePrice, selectedFlavors, sizeKey]);

  // Bebida Selecionada
  const selectedBeverage = useMemo(() => {
    if (isDydyoIncluded) {
      return BEVERAGE_OPTIONS.find(b => b.name === selectedDydyo) || BEVERAGE_OPTIONS[0];
    }
    if (selectedBeverageId === 'none') return null;
    return BEVERAGE_OPTIONS.find(b => b.id === selectedBeverageId) || null;
  }, [isDydyoIncluded, selectedDydyo, selectedBeverageId]);

  const beveragePrice = isDydyoIncluded ? 0 : (selectedBeverage ? Number(selectedBeverage.price || 0) : 0);
  const extraSaucePrice = (wantsExtraSauce && extraSauceConfig?.active !== false) ? Number(extraSauceConfig.price || 0) : 0;

  const totalPizzaPrice = useMemo(() => {
    return calculatedPrice + beveragePrice + extraSaucePrice;
  }, [calculatedPrice, beveragePrice, extraSaucePrice]);

  // Identifica o sabor de maior valor selecionado que causa acréscimo
  const highestPricedFlavor = useMemo(() => {
    if (!selectedFlavors || selectedFlavors.length === 0) return null;
    return selectedFlavors.reduce((max, f) => {
      const effPrice = getPizzaFlavorPrice(f, sizeKey, basePrice);
      const maxEffPrice = max ? getPizzaFlavorPrice(max, sizeKey, basePrice) : 0;
      return effPrice > maxEffPrice ? f : max;
    }, null);
  }, [selectedFlavors, basePrice, sizeKey]);

  // Verifica se o preço final subiu acima da base da pizza
  const isPriceUpgraded = Boolean(
    calculatedPrice > basePrice
  );

  if (!isOpen || !pizzaProduct) return null;

  const toggleFlavor = (flavor) => {
    const isAlreadySelected = selectedFlavors.some(f => f.id === flavor.id || f.name === flavor.name);
    if (isAlreadySelected) {
      setSelectedFlavors(selectedFlavors.filter(f => f.id !== flavor.id && f.name !== flavor.name));
    } else {
      if (selectedFlavors.length < maxFlavors) {
        setSelectedFlavors([...selectedFlavors, flavor]);
      }
    }
  };

  const handleConfirm = () => {
    if (selectedFlavors.length === 0) return;

    const flavorNames = selectedFlavors.map(f => f.name);
    const upgradeText = isPriceUpgraded && highestPricedFlavor
      ? ` (Valor cobrado pelo maior sabor: ${highestPricedFlavor.name} - R$ ${calculatedPrice.toFixed(2).replace('.', ',')})`
      : '';

    const beverageText = isDydyoIncluded
      ? ` • 🥤 Refri Incluso: ${selectedDydyo}`
      : (selectedBeverage ? ` • 🥤 + ${selectedBeverage.name} (R$ ${beveragePrice.toFixed(2).replace('.', ',')})` : '');

    const sauceText = (wantsExtraSauce && extraSauceConfig?.active !== false)
      ? ` • 🧂 + ${extraSauceConfig.name || 'Molho Extra'} (R$ ${extraSaucePrice.toFixed(2).replace('.', ',')})`
      : '';

    const customPizza = {
      id: `custom-pizza-${Date.now()}`,
      name: `${pizzaProduct.name} (${flavorNames.join(' / ')})`,
      price: totalPizzaPrice,
      basePrice: basePrice,
      isCustomPizza: true,
      tamanho: pizzaProduct.tamanho || 'Pizza',
      flavors: flavorNames,
      flavorDetails: selectedFlavors,
      highestFlavor: highestPricedFlavor,
      dydyoFlavor: isDydyoIncluded ? selectedDydyo : (selectedBeverage?.isDydyo ? selectedBeverage.name : null),
      beverage: isDydyoIncluded ? selectedDydyo : (selectedBeverage ? selectedBeverage.name : null),
      beveragePrice: beveragePrice,
      hasExtraSauce: Boolean(wantsExtraSauce && extraSauceConfig?.active !== false),
      extraSaucePrice: extraSaucePrice,
      extraSauceName: wantsExtraSauce ? (extraSauceConfig.name || 'Molho Extra da Casa') : null,
      notes: notes.trim(),
      bordaGratis: Boolean(pizzaProduct.bordaGratis),
      image: pizzaProduct.image,
      description: `Sabores: ${flavorNames.join(' e ')}.${pizzaProduct.bordaGratis ? ' Acompanha borda de Catupiry grátis.' : ''}${upgradeText}${beverageText}${sauceText}${notes ? ` Obs: ${notes}` : ''}`
    };

    onAddPizzaToCart(customPizza);
    onClose();
  };

  const isComplete = selectedFlavors.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-xl bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-dark-800 bg-gradient-to-r from-dark-900 to-dark-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/30 flex-shrink-0">
              <Pizza className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-base sm:text-lg text-white leading-tight">
                {pizzaProduct.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-brand-gold font-bold">
                  Escolha até {maxFlavors} {maxFlavors === 1 ? 'sabor' : 'sabores'} ({selectedFlavors.length}/{maxFlavors})
                </span>
                <span className="text-[11px] text-slate-400">• Base: R$ {basePrice.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Closed Store Alert */}
        {!isStoreOpen && (
          <div className="bg-red-950/90 border-b border-red-500/30 px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold text-red-200">
            <span>⛔ Estabelecimento Fechado • Apenas visualização de sabores (pedidos pausados)</span>
          </div>
        )}

        {/* Borda Grátis Banner */}
        {pizzaProduct.bordaGratis && (
          <div className="bg-gradient-to-r from-amber-500/20 via-brand-gold/25 to-amber-500/20 border-b border-brand-gold/30 px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold text-brand-goldLight">
            <Sparkles className="w-4 h-4 text-brand-gold animate-pulse" />
            <span>Borda Recheada de Catupiry 100% GRÁTIS Inclusa!</span>
          </div>
        )}

        {/* Pricing Notice */}
        <div className="bg-dark-950/80 px-4 py-2 border-b border-dark-800 flex items-center gap-2 text-[11px] text-slate-300">
          <Info className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" />
          <span>
            <strong className="text-white">Regra de Preço:</strong> Cobrado pelo sabor de <strong>maior valor</strong> selecionado. Sabores com valor igual ou inferior ao preço base não agregam acréscimo.
          </span>
        </div>

        {/* Search & Category Filter */}
        <div className="p-3.5 sm:px-5 sm:pt-4 border-b border-dark-800/80 bg-dark-900 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar sabor por nome ou ingredientes..."
              value={flavorSearch}
              onChange={(e) => setFlavorSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-dark-850 border border-dark-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
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
                  : 'bg-dark-800 text-slate-300 hover:bg-dark-750'
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
                      : 'bg-dark-800 text-slate-300 hover:bg-dark-750'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Flavor Selector List */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-2">
          {filteredFlavors.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              Nenhum sabor encontrado para a busca informada.
            </div>
          ) : (
            filteredFlavors.map((flavor) => {
              const isSelected = selectedFlavors.some(f => f.id === flavor.id || f.name === flavor.name);
              const isDisabled = !isSelected && selectedFlavors.length >= maxFlavors;
              const flavorPriceForSize = getPizzaFlavorPrice(flavor, sizeKey, basePrice);
              const isStandard = flavorPriceForSize <= basePrice && flavor.category !== 'especiais';
              const effectivePrice = isStandard ? basePrice : flavorPriceForSize;
              const isFlavorMoreExpensive = effectivePrice > basePrice;

              const imageSrc = flavor.image || '';

              return (
                <button
                  key={flavor.id || flavor.name}
                  type="button"
                  onClick={() => toggleFlavor(flavor)}
                  disabled={isDisabled}
                  className={`w-full p-2.5 sm:p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-brand-gold/15 border-brand-gold text-white font-bold shadow-md'
                      : isDisabled
                      ? 'bg-dark-900/40 border-dark-800 text-slate-500 opacity-40 cursor-not-allowed'
                      : 'bg-dark-850 hover:bg-dark-800 text-slate-200 border-dark-800 hover:border-dark-700'
                  }`}
                >
                  {/* Left: Illustrated transparent-background pizza photo */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center rounded-xl bg-dark-900/80 border border-dark-800/80 p-1 group-hover:scale-105 transition-transform">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={flavor.name}
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

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-white">
                        {flavor.name}
                      </span>
                      {flavor.category && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
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
                      <p className="text-[11px] text-slate-400 line-clamp-1 sm:line-clamp-2 mt-0.5 font-normal">
                        {flavor.description}
                      </p>
                    )}

                    {/* Preço do Sabor */}
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      {isStandard ? (
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          Incluso no tamanho (Sem acréscimo)
                        </span>
                      ) : (
                        <>
                          <span className="text-xs font-black text-brand-gold">
                            R$ {flavorPriceForSize.toFixed(2).replace('.', ',')}
                          </span>
                          {isFlavorMoreExpensive ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                              <ArrowUpRight className="w-3 h-3 text-amber-400" />
                              <span>Puxa p/ R$ {flavorPriceForSize.toFixed(2).replace('.', ',')}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-semibold">
                              (Sem acréscimo)
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Selection Checkbox */}
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border flex-shrink-0 mt-1 transition-all ${
                    isSelected
                      ? 'bg-brand-gold border-brand-gold text-dark-950'
                      : 'border-slate-600 bg-dark-900'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })
          )}

          {/* 1. SELEÇÃO DE REFRIGERANTE / BEBIDA */}
          {isDydyoIncluded ? (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-dark-950 to-dark-900 border border-amber-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-base">🥤</span>
                  <span>Escolha o Sabor do seu Dydyo 2L:</span>
                </span>
                <span className="text-[10px] text-amber-300 font-bold bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                  Incluso no Combo
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DYDYO_FLAVORS.map((dydyo) => {
                  const isSelected = selectedDydyo === dydyo.name;
                  return (
                    <button
                      key={dydyo.id}
                      type="button"
                      onClick={() => setSelectedDydyo(dydyo.name)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-white ring-1 ring-amber-400/50 shadow-md'
                          : 'bg-dark-850 hover:bg-dark-800 border-dark-750 text-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-amber-400 bg-amber-400 text-dark-950' : 'border-dark-600'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold leading-tight truncate">{dydyo.flavor}</div>
                        <div className="text-[10px] text-slate-400 truncate">{dydyo.badge || '2L Gelado'}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-dark-900 border border-dark-750 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-base">🥤</span>
                  <span>Deseja Adicionar Refrigerante ou Bebida Gelada? (Opcional)</span>
                </label>
                <span className="text-[10px] text-slate-400 bg-dark-800 px-2 py-0.5 rounded">
                  {selectedBeverageId === 'none' ? 'Sem Bebida' : 'Bebida Adicionada'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {/* Opção Sem Bebida */}
                <button
                  type="button"
                  onClick={() => setSelectedBeverageId('none')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    selectedBeverageId === 'none'
                      ? 'bg-brand-gold/15 border-brand-gold text-white font-bold'
                      : 'bg-dark-850 hover:bg-dark-800 border-dark-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedBeverageId === 'none' ? 'border-brand-gold bg-brand-gold text-dark-950' : 'border-dark-600'
                    }`}>
                      {selectedBeverageId === 'none' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs font-semibold">Apenas a pizza (Sem bebida)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">R$ 0,00</span>
                </button>

                {/* Lista de Bebidas Disponíveis */}
                {BEVERAGE_OPTIONS.map((bev) => {
                  const isSelected = selectedBeverageId === bev.id;
                  return (
                    <button
                      key={bev.id}
                      type="button"
                      onClick={() => setSelectedBeverageId(bev.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-white font-bold shadow-md'
                          : 'bg-dark-850 hover:bg-dark-800 border-dark-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-amber-400 bg-amber-400 text-dark-950' : 'border-dark-600'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 truncate">
                          <span className="text-xs block truncate font-medium">{bev.name}</span>
                          {bev.badge && <span className="text-[9px] text-amber-300 font-normal">{bev.badge}</span>}
                        </div>
                      </div>
                      <span className="text-xs font-black text-amber-300 whitespace-nowrap ml-2">
                        + R$ {bev.price.toFixed(2).replace('.', ',')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. SELEÇÃO DE MOLHO EXTRA DA CASA */}
          {extraSauceConfig?.active !== false && (
            <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              wantsExtraSauce 
                ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400/40' 
                : 'bg-dark-900 border-dark-750'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="text-xl flex-shrink-0">🧂</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">
                        {extraSauceConfig.name || 'Molho Especial da Casa'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black border border-amber-500/30">
                        + R$ {Number(extraSauceConfig.price || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {extraSauceConfig.description || 'Pote generoso de molho artesanal especial da El Shadday (perfeito para bordas e recheios).'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setWantsExtraSauce(!wantsExtraSauce)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                    wantsExtraSauce
                      ? 'bg-amber-400 text-dark-950 shadow-md scale-102'
                      : 'bg-dark-800 hover:bg-dark-750 text-slate-300 border border-dark-700'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 stroke-[3] ${wantsExtraSauce ? 'opacity-100' : 'opacity-30'}`} />
                  <span>{wantsExtraSauce ? 'Molho Adicionado' : 'Adicionar Molho'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Observations */}
          <div className="pt-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Observações (opcional):
            </label>
            <input
              type="text"
              placeholder="Ex: Sem cebola em uma metade, massa bem crocante, orégano à parte..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-dark-850 border border-dark-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-dark-800 bg-dark-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Total da Pizza:</span>
              {isPriceUpgraded && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                  <Flame className="w-2.5 h-2.5 text-amber-400" />
                  <span>Maior sabor</span>
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-black text-brand-gold">
                R$ {totalPizzaPrice.toFixed(2).replace('.', ',')}
              </div>
              {(isPriceUpgraded || beveragePrice > 0 || extraSaucePrice > 0) && (
                <div className="text-[11px] text-slate-500 line-through">
                  R$ {basePrice.toFixed(2).replace('.', ',')}
                </div>
              )}
            </div>
            
            {/* Detalhamento de Adicionais no rodapé */}
            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-slate-400">
              {isPriceUpgraded && highestPricedFlavor && (
                <span className="text-amber-300 font-medium">
                  Sabor: {highestPricedFlavor.name}
                </span>
              )}
              {beveragePrice > 0 && selectedBeverage && (
                <span className="text-cyan-300 font-medium">
                  • Bebida: +R$ {beveragePrice.toFixed(2).replace('.', ',')}
                </span>
              )}
              {extraSaucePrice > 0 && (
                <span className="text-amber-200 font-medium">
                  • Molho: +R$ {extraSaucePrice.toFixed(2).replace('.', ',')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 font-semibold text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isComplete || !isStoreOpen}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
                !isStoreOpen
                  ? 'bg-dark-800 text-slate-500 border border-red-500/30 cursor-not-allowed'
                  : isComplete
                  ? 'bg-brand-gold hover:bg-amber-400 text-dark-950 shadow-glow-gold cursor-pointer hover:scale-102'
                  : 'bg-dark-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{!isStoreOpen ? '⛔ Fechado para Pedidos' : 'Adicionar Pizza'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
