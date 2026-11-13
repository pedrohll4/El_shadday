import React, { useState, useEffect, useMemo } from 'react';
import { StepFlow, OptionRow, OptionFilters, NotesStep, money } from './storefront/StepFlow';
import { X, Pizza, Check, Sparkles, AlertCircle, Info, Search, Flame, ArrowUpRight, Wine, Plus } from 'lucide-react';
import { 
  getStoredPizzaFlavors, 
  calculatePizzaPrice, 
  getPizzaFlavorPrice, 
  getPizzaSizeKey, 
  INITIAL_PIZZA_FLAVORS,
  BEVERAGE_OPTIONS,
  DYDYO_FLAVORS,
  getAutoFlavorImage,
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

  const handleConfirm = (qty = 1) => {
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

    onAddPizzaToCart({ ...customPizza, quantity: Math.max(1, Number(qty) || 1) });
    onClose();
  };

  const isComplete = selectedFlavors.length > 0;

  const sauceActive = extraSauceConfig?.active !== false;
  const CATEGORY_LABELS = { salgadas: 'Salgadas', especiais: 'Especiais', doces: 'Doces' };

  const steps = [
    {
      id: 'sabores',
      title: maxFlavors > 1 ? `Escolha até ${maxFlavors} sabores` : 'Escolha o sabor',
      shortTitle: 'Sabores',
      hint: 'O valor final será o do sabor mais caro escolhido.',
      min: 1,
      max: maxFlavors,
      count: selectedFlavors.length,
      missingText: 'Escolha pelo menos 1 sabor para continuar',
      content: (
        <div>
          <OptionFilters
            search={flavorSearch}
            onSearch={setFlavorSearch}
            categories={availableCategories}
            active={categoryFilter}
            onCategory={setCategoryFilter}
            labels={CATEGORY_LABELS}
          />
          <div className="space-y-2">
            {filteredFlavors.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">Nenhum sabor encontrado.</p>
            )}
            {[...filteredFlavors].sort((a, b) => (Number(getPizzaFlavorPrice(a, sizeKey, basePrice)) || 0) - (Number(getPizzaFlavorPrice(b, sizeKey, basePrice)) || 0)).map(flavor => {
              const isSel = selectedFlavors.some(f => f.id === flavor.id || f.name === flavor.name);
              const flavorPrice = Math.max(basePrice, Number(getPizzaFlavorPrice(flavor, sizeKey, basePrice)) || 0);
              return (
                <OptionRow
                  key={flavor.id || flavor.name}
                  title={flavor.name}
                  description={flavor.description}
                  priceText={money(flavorPrice)}
                  image={flavor.image || (flavor.imageRemoved ? null : getAutoFlavorImage(flavor))}
                  imageFit="contain"
                  selected={isSel}
                  disabled={!isSel && selectedFlavors.length >= maxFlavors}
                  onClick={() => toggleFlavor(flavor)}
                />
              );
            })}
          </div>
        </div>
      )
    },
    isDydyoIncluded ? {
      id: 'refri',
      title: 'Escolha o refri (já incluso)',
      shortTitle: 'Refri',
      min: 1,
      max: 1,
      count: selectedDydyo ? 1 : 0,
      content: (
        <div className="space-y-2">
          {DYDYO_FLAVORS.map(d => (
            <OptionRow
              key={d.id}
              title={d.name}
              description={d.description}
              image={d.image || null}
              badge={d.badge}
              multi={false}
              selected={selectedDydyo === d.name}
              onClick={() => setSelectedDydyo(d.name)}
            />
          ))}
        </div>
      )
    } : {
      id: 'bebida',
      title: 'Vai querer bebida?',
      shortTitle: 'Bebida',
      min: 1,
      max: 1,
      count: 1,
      content: (
        <div className="space-y-2">
          <OptionRow
            title="Não, obrigado"
            multi={false}
            selected={selectedBeverageId === 'none'}
            onClick={() => setSelectedBeverageId('none')}
          />
          {BEVERAGE_OPTIONS.map(b => (
            <OptionRow
              key={b.id}
              title={b.name}
              image={b.image || null}
              priceText={`+ ${money(b.price)}`}
              multi={false}
              selected={selectedBeverageId === b.id}
              onClick={() => setSelectedBeverageId(b.id)}
            />
          ))}
        </div>
      )
    },
    sauceActive && {
      id: 'molho',
      title: 'Adicionar molho?',
      shortTitle: 'Molho',
      min: 1,
      max: 1,
      count: 1,
      content: (
        <div className="space-y-2">
          <OptionRow title="Não precisa de molho" multi={false} selected={!wantsExtraSauce} onClick={() => setWantsExtraSauce(false)} />
          <OptionRow
            title={`Sim, adicionar ${extraSauceConfig.name || 'molho da casa'}`}
            description={extraSauceConfig.description}
            priceText={`+ ${money(extraSauceConfig.price)}`}
            multi={false}
            selected={wantsExtraSauce}
            onClick={() => setWantsExtraSauce(true)}
          />
        </div>
      )
    },
    {
      id: 'obs',
      title: 'Observação',
      shortTitle: 'Observação',
      content: <NotesStep value={notes} onChange={setNotes} />
    }
  ].filter(Boolean);

  return (
    <StepFlow
      isOpen={isOpen}
      onClose={onClose}
      product={{
        id: pizzaProduct.id,
        name: pizzaProduct.name,
        image: pizzaProduct.image,
        description: `${pizzaProduct.description || ''}${pizzaProduct.bordaGratis ? ' Borda de Catupiry grátis.' : ''}`.trim()
      }}
      steps={steps}
      unitPrice={totalPizzaPrice}
      isStoreOpen={isStoreOpen}
      onFinish={(qty) => handleConfirm(qty)}
    />
  );
}
