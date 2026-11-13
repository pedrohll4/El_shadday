import React, { useState, useEffect, useMemo } from 'react';
import { StepFlow, OptionRow, OptionFilters, NotesStep, money } from './storefront/StepFlow';
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
  getAutoFlavorImage,
  INITIAL_PIZZA_FLAVORS,
  getStoredExtraSauceConfig
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
  const [extraSauceConfig, setExtraSauceConfig] = useState(() => getStoredExtraSauceConfig());
  const [wantsExtraSauce, setWantsExtraSauce] = useState(false);
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
    const handleSauceUpdated = (e) => {
      if (e?.detail) setExtraSauceConfig(e.detail);
      else setExtraSauceConfig(getStoredExtraSauceConfig());
    };
    window.addEventListener('pizza_flavors_updated', handleFlavorsUpdated);
    window.addEventListener('acai_settings_updated', handleAcaiUpdated);
    window.addEventListener('extra_sauce_config_updated', handleSauceUpdated);
    window.addEventListener('storage', handleFlavorsUpdated);
    return () => {
      window.removeEventListener('pizza_flavors_updated', handleFlavorsUpdated);
      window.removeEventListener('acai_settings_updated', handleAcaiUpdated);
      window.removeEventListener('extra_sauce_config_updated', handleSauceUpdated);
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
      setWantsExtraSauce(false);
      setExtraSauceConfig(getStoredExtraSauceConfig());

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
  const extraSaucePrice = (wantsExtraSauce && extraSauceConfig?.active !== false) ? Number(extraSauceConfig.price || 0) : 0;
  const finalComboPrice = baseComboPrice + totalComboSurcharge + extraSaucePrice;

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

  const handleConfirm = (qty = 1) => {
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
    if (wantsExtraSauce && extraSauceConfig?.active !== false) {
      extras.push(`${extraSauceConfig.name || 'Molho Extra'} (+ R$ ${extraSaucePrice.toFixed(2).replace('.', ',')})`);
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
      hasExtraSauce: Boolean(wantsExtraSauce && extraSauceConfig?.active !== false),
      extraSaucePrice: extraSaucePrice,
      extraSauceName: wantsExtraSauce ? (extraSauceConfig.name || 'Molho Extra da Casa') : null,
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

    onAddComboToCart({ ...customCombo, quantity: Math.max(1, Number(qty) || 1) });
    onClose();
  };

  const currentPizzaBase = Number(currentPizza?.basePrice) || (currentPizza?.size === 'gigante' ? 50.00 : 40.00);

  const sauceActive = extraSauceConfig?.active !== false;
  const CATEGORY_LABELS = { salgadas: 'Salgadas', especiais: 'Especiais', doces: 'Doces' };

  // Marca/desmarca o sabor de uma pizza específica do combo
  const togglePizzaFlavor = (pizza, flavorName) => {
    setValidationError('');
    setPizzaSelections(prev => {
      const list = prev[pizza.id] || [];
      if (list.includes(flavorName)) return { ...prev, [pizza.id]: list.filter(f => f !== flavorName) };
      if (list.length >= pizza.maxFlavors) return prev;
      return { ...prev, [pizza.id]: [...list, flavorName] };
    });
  };

  const copyFromFirst = (pizza) => {
    const first = pizzaSelections[pizzasConfig[0]?.id] || [];
    if (first.length === 0) return;
    setPizzaSelections(prev => ({ ...prev, [pizza.id]: first.slice(0, pizza.maxFlavors) }));
  };

  const pizzaSteps = pizzasConfig.map((pizza, idx) => {
    const selected = pizzaSelections[pizza.id] || [];
    const base = Number(pizza.basePrice) || (pizza.size === 'gigante' ? 50.00 : 40.00);
    const firstSelected = pizzaSelections[pizzasConfig[0]?.id] || [];
    return {
      id: `pizza-${pizza.id}`,
      title: pizzasConfig.length > 1
        ? `${pizza.title}: escolha até ${pizza.maxFlavors} sabores`
        : `Escolha até ${pizza.maxFlavors} sabores`,
      shortTitle: pizzasConfig.length > 1 ? pizza.shortTitle : 'Sabores',
      hint: 'Sabores especiais podem ter um pequeno acréscimo, mostrado ao lado do sabor.',
      min: 1,
      max: pizza.maxFlavors,
      count: selected.length,
      missingText: 'Escolha pelo menos 1 sabor para esta pizza',
      content: (
        <div>
          {idx > 0 && firstSelected.length > 0 && (
            <button
              type="button"
              onClick={() => copyFromFirst(pizza)}
              className="w-full mb-3 py-2.5 rounded-xl border border-brand-gold/40 bg-brand-gold/10 text-brand-goldLight text-sm font-bold cursor-pointer"
            >
              Repetir os sabores da 1ª pizza ({firstSelected.join(' / ')})
            </button>
          )}
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
            {[...filteredFlavors].sort((a, b) => getFlavorSurchargeForPizza(base, a, pizza.size) - getFlavorSurchargeForPizza(base, b, pizza.size)).map(flavor => {
              const isSel = selected.includes(flavor.name);
              const extra = getFlavorSurchargeForPizza(base, flavor, pizza.size);
              return (
                <OptionRow
                  key={flavor.id || flavor.name}
                  title={flavor.name}
                  description={flavor.description}
                  priceText={extra > 0 ? `+ ${money(extra)}` : 'Incluso no combo'}
                  image={flavor.image || (flavor.imageRemoved ? null : getAutoFlavorImage(flavor))}
                  imageFit="contain"
                  selected={isSel}
                  disabled={!isSel && selected.length >= pizza.maxFlavors}
                  onClick={() => togglePizzaFlavor(pizza, flavor.name)}
                />
              );
            })}
          </div>
        </div>
      )
    };
  });

  const steps = [
    ...pizzaSteps,
    hasEsfirrasInCombo && {
      id: 'esfirras',
      title: 'Como quer as 10 esfirras?',
      shortTitle: 'Esfirras',
      min: 1,
      max: 1,
      count: 1,
      content: (
        <div className="space-y-2">
          <OptionRow title="Sortidas da casa" description="Mistura dos sabores tradicionais." multi={false} selected={!semSuinosEsfirras} onClick={() => setSemSuinosEsfirras(false)} />
          <OptionRow title="Sortidas sem carne suína" description="Sem calabresa e sem bacon." multi={false} selected={semSuinosEsfirras} onClick={() => setSemSuinosEsfirras(true)} />
        </div>
      )
    },
    hasAcaiInCombo && {
      id: 'acai',
      title: maxComboLimit > 0 ? `Barca de açaí: até ${maxComboLimit} acompanhamentos` : 'Barca de açaí: acompanhamentos',
      shortTitle: 'Açaí',
      hint: acaiLimitWarning || undefined,
      min: 0,
      max: maxComboLimit,
      count: selectedAcaiComplements.length,
      content: (
        <div className="space-y-2">
          {availableAcaiComplements.map(c => {
            const isSel = selectedAcaiComplements.includes(c.name);
            return (
              <OptionRow
                key={c.id || c.name}
                title={`${c.icon ? c.icon + ' ' : ''}${c.name}`}
                priceText={Number(c.price) > 0 ? `+ ${money(c.price)}` : null}
                selected={isSel}
                disabled={!isSel && maxComboLimit > 0 && selectedAcaiComplements.length >= maxComboLimit}
                onClick={() => toggleAcaiComplement(c.name)}
              />
            );
          })}
        </div>
      )
    },
    hasAcaiInCombo && availableAcaiCoberturas.length > 0 && {
      id: 'cobertura',
      title: 'Cobertura do açaí',
      shortTitle: 'Cobertura',
      min: 1,
      max: 1,
      count: selectedAcaiCobertura ? 1 : 0,
      content: (
        <div className="space-y-2">
          {availableAcaiCoberturas.map(c => (
            <OptionRow
              key={c.id || c.name}
              title={c.name}
              priceText={Number(c.price) > 0 ? `+ ${money(c.price)}` : null}
              multi={false}
              selected={selectedAcaiCobertura === c.name}
              onClick={() => setSelectedAcaiCobertura(c.name)}
            />
          ))}
        </div>
      )
    },
    hasDydyoInCombo && {
      id: 'refri',
      title: 'Escolha o refri (já incluso)',
      shortTitle: 'Refri',
      min: 1,
      max: 1,
      count: selectedDydyo ? 1 : 0,
      content: (
        <div className="space-y-2">
          {DYDYO_FLAVORS.map(d => (
            <OptionRow key={d.id} title={d.name} description={d.description} image={d.image || null} badge={d.badge} multi={false} selected={selectedDydyo === d.name} onClick={() => setSelectedDydyo(d.name)} />
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
          <OptionRow title={`Sim, adicionar ${extraSauceConfig.name || 'molho da casa'}`} description={extraSauceConfig.description} priceText={`+ ${money(extraSauceConfig.price)}`} multi={false} selected={wantsExtraSauce} onClick={() => setWantsExtraSauce(true)} />
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
        id: comboProduct.id,
        name: comboProduct.name,
        image: comboProduct.image,
        description: comboProduct.description
      }}
      steps={steps}
      unitPrice={finalComboPrice}
      isStoreOpen={isStoreOpen}
      onFinish={(qty) => handleConfirm(qty)}
    />
  );
}
