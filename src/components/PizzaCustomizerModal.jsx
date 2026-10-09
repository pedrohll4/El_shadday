import React, { useState, useEffect, useMemo } from 'react';
import { X, Pizza, Check, Sparkles, AlertCircle, Info, Search, Flame, ArrowUpRight } from 'lucide-react';
import { getStoredPizzaFlavors, calculatePizzaPrice } from '../data/menuData';

export function PizzaCustomizerModal({ isOpen, onClose, pizzaProduct, onAddPizzaToCart }) {
  const [flavorsList, setFlavorsList] = useState(() => getStoredPizzaFlavors());
  const [selectedFlavors, setSelectedFlavors] = useState([]);
  const [flavorSearch, setFlavorSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [notes, setNotes] = useState('');

  const maxFlavors = pizzaProduct?.maxSabores || 2;
  const basePrice = Number(pizzaProduct?.price) || 0;

  // Atualiza lista quando eventos de sincronização acontecerem
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

  useEffect(() => {
    if (isOpen) {
      setFlavorsList(getStoredPizzaFlavors());
      setSelectedFlavors([]);
      setFlavorSearch('');
      setCategoryFilter('todos');
      setNotes('');
    }
  }, [isOpen, pizzaProduct]);

  // Sabores disponíveis
  const availableFlavors = useMemo(() => {
    return flavorsList.filter(f => f.isAvailable !== false);
  }, [flavorsList]);

  // Categorias disponíveis dinamicamente
  const availableCategories = useMemo(() => {
    const set = new Set(availableFlavors.map(f => f.category || 'salgadas'));
    return Array.from(set);
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

  // Cálculo de Preço - Regra: sempre puxa para o maior valor
  const calculatedPrice = useMemo(() => {
    return calculatePizzaPrice(basePrice, selectedFlavors);
  }, [basePrice, selectedFlavors]);

  // Identifica o sabor de maior valor selecionado
  const highestPricedFlavor = useMemo(() => {
    if (!selectedFlavors || selectedFlavors.length === 0) return null;
    return selectedFlavors.reduce((max, f) => (!max || f.price > max.price) ? f : max, null);
  }, [selectedFlavors]);

  // Verifica se o preço final subiu acima da base da pizza
  const isPriceUpgraded = Boolean(
    highestPricedFlavor && Number(highestPricedFlavor.price) > basePrice
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

    const customPizza = {
      id: `custom-pizza-${Date.now()}`,
      name: `${pizzaProduct.name} (${flavorNames.join(' / ')})`,
      price: calculatedPrice,
      basePrice: basePrice,
      isCustomPizza: true,
      tamanho: pizzaProduct.tamanho || 'Pizza',
      flavors: flavorNames,
      flavorDetails: selectedFlavors,
      highestFlavor: highestPricedFlavor,
      notes: notes.trim(),
      bordaGratis: true,
      image: pizzaProduct.image,
      description: `Sabores: ${flavorNames.join(' e ')}. Acompanha borda de Catupiry grátis.${upgradeText}${notes ? ` Obs: ${notes}` : ''}`
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

        {/* Borda Grátis Banner */}
        <div className="bg-gradient-to-r from-amber-500/20 via-brand-gold/25 to-amber-500/20 border-b border-brand-gold/30 px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold text-brand-goldLight">
          <Sparkles className="w-4 h-4 text-brand-gold animate-pulse" />
          <span>Borda Recheada de Catupiry 100% GRÁTIS Inclusa!</span>
        </div>

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
              const label = cat === 'salgadas' ? 'Salgadas' : cat === 'especiais' ? 'Especiais / Nobres' : cat === 'doces' ? 'Doces' : cat;
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
              const flavorPrice = Number(flavor.price) || 0;
              const isFlavorMoreExpensive = flavorPrice > basePrice;

              return (
                <button
                  key={flavor.id || flavor.name}
                  type="button"
                  onClick={() => toggleFlavor(flavor)}
                  disabled={isDisabled}
                  className={`w-full p-3 rounded-2xl border text-left flex items-start justify-between gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-gold/15 border-brand-gold text-white font-bold shadow-md'
                      : isDisabled
                      ? 'bg-dark-900/40 border-dark-800 text-slate-500 opacity-40 cursor-not-allowed'
                      : 'bg-dark-850 hover:bg-dark-800 text-slate-200 border-dark-800 hover:border-dark-700'
                  }`}
                >
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
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 font-normal">
                        {flavor.description}
                      </p>
                    )}

                    {/* Preço do Sabor */}
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs font-black text-brand-gold">
                        R$ {flavorPrice.toFixed(2).replace('.', ',')}
                      </span>
                      {isFlavorMoreExpensive ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                          <ArrowUpRight className="w-3 h-3 text-amber-400" />
                          <span>Puxa p/ R$ {flavorPrice.toFixed(2).replace('.', ',')}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          (Sem acréscimo)
                        </span>
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

          {/* Observations */}
          <div className="pt-2">
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
                R$ {calculatedPrice.toFixed(2).replace('.', ',')}
              </div>
              {isPriceUpgraded && (
                <div className="text-[11px] text-slate-500 line-through">
                  R$ {basePrice.toFixed(2).replace('.', ',')}
                </div>
              )}
            </div>
            {isPriceUpgraded && highestPricedFlavor && (
              <p className="text-[10px] text-amber-300/90 font-medium">
                Puxado por: <strong>{highestPricedFlavor.name}</strong>
              </p>
            )}
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
              disabled={!isComplete}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
                isComplete
                  ? 'bg-brand-gold hover:bg-amber-400 text-dark-950 shadow-glow-gold cursor-pointer hover:scale-102'
                  : 'bg-dark-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Adicionar Pizza</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
