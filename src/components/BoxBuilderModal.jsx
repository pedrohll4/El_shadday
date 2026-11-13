import React, { useState, useEffect, useMemo } from 'react';
import { StepFlow, OptionRow, OptionFilters, NotesStep, money } from './storefront/StepFlow';
import { 
  X, Package, Check, Sparkles, MessageSquare, Flame 
} from 'lucide-react';
import { DYDYO_FLAVORS, BEVERAGE_OPTIONS, getStoredExtraSauceConfig } from '../data/menuData';

// Tamanhos disponíveis das Caixas de Esfirras (mantidos para export/referência)
export const BOX_CONFIGS = [
  { 
    id: 'caixa-20-esfirras', 
    name: 'Caixa com 20 Esfirras', 
    total: 20, 
    totalCount: 20,
    salgadas: 15, 
    salgadasCount: 15,
    doces: 5, 
    docesCount: 5,
    price: 35.00,
    creditPrice: 40.00,
    image: "https://assets.olaclick.app/companies/products/images/800/4cfa4549-ad5f-4b4e-b539-468584a0eeba.png"
  },
  { 
    id: 'caixa-30-esfirras', 
    name: 'Caixa com 30 Esfirras', 
    total: 30, 
    totalCount: 30,
    salgadas: 22, 
    salgadasCount: 22,
    doces: 8, 
    docesCount: 8,
    price: 45.00,
    creditPrice: 50.00,
    image: "https://assets.olaclick.app/companies/products/images/800/d22ae090-8054-428b-8ba3-6f147ad985c8.png"
  },
  { 
    id: 'caixa-40-esfirras', 
    name: 'Caixa com 40 Esfirras', 
    total: 40, 
    totalCount: 40,
    salgadas: 33, 
    salgadasCount: 33,
    doces: 7, 
    docesCount: 7,
    price: 55.00,
    creditPrice: 60.00,
    image: "https://assets.olaclick.app/companies/products/images/800/365a2072-4954-4c6a-a734-69a6cef0130a.png"
  },
  { 
    id: 'caixa-50-esfirras', 
    name: 'Caixa com 50 Esfirras', 
    total: 50, 
    totalCount: 50,
    salgadas: 40, 
    salgadasCount: 40,
    doces: 10, 
    docesCount: 10,
    price: 70.00,
    creditPrice: 75.00,
    image: "https://assets.olaclick.app/companies/products/images/800/ad6d93be-acae-46e7-b062-9e796f376b8f.png"
  },
  { 
    id: 'combo-20esf-dydyo', 
    name: 'Caixa com 20 Esfirras + Dydyo 2L', 
    total: 20, 
    totalCount: 20,
    salgadas: 15, 
    salgadasCount: 15,
    doces: 5, 
    docesCount: 5,
    price: 44.99,
    creditPrice: 44.99,
    image: "https://assets.olaclick.app/companies/products/images/800/4cfa4549-ad5f-4b4e-b539-468584a0eeba.png"
  },
  { 
    id: 'combo-30esf-dydyo', 
    name: 'Caixa com 30 Esfirras + Dydyo 2L', 
    total: 30, 
    totalCount: 30,
    salgadas: 25, 
    salgadasCount: 25,
    doces: 5, 
    docesCount: 5,
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
    displayTitle: 'Esfirras Sortidas Sem Doce',
    tag: '100% Salgadas',
    icon: '🥟',
    hasDoces: false,
    semSuinos: false,
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    description: 'Caixa com sabores salgados sortidos tradicionais da casa (carne moída temperada, frango, queijo, calabresa, etc.). Não inclui esfirras doces.'
  },
  {
    id: 'esfirras-sortidas-com-doce',
    name: 'esfirra sortidas com doce',
    displayTitle: 'Esfirras Sortidas Com Doce',
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
    displayTitle: 'Esfirras Sortidas Sem Suínos Sem Doce',
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
    displayTitle: 'Esfirras Sortidas Sem Suínos Com Doce',
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

export function BoxBuilderModal({ isOpen, onClose, onAddBoxToCart, initialBox = null, isStoreOpen = true }) {
  const [selectedOptionId, setSelectedOptionId] = useState(BOX_SORTIDO_OPTIONS[0].id);
  const [selectedDydyo, setSelectedDydyo] = useState('Dydyo Guaraná 2L');
  const [selectedBeverageId, setSelectedBeverageId] = useState('none');
  const [extraSauceConfig, setExtraSauceConfig] = useState(() => getStoredExtraSauceConfig());
  const [wantsExtraSauce, setWantsExtraSauce] = useState(false);
  const [notes, setNotes] = useState('');

  // Sempre que o modal abre, reseta a opção, refrigerante e observações
  useEffect(() => {
    if (isOpen) {
      setSelectedOptionId(BOX_SORTIDO_OPTIONS[0].id);
      setSelectedDydyo('Dydyo Guaraná 2L');
      setSelectedBeverageId('none');
      setWantsExtraSauce(false);
      setExtraSauceConfig(getStoredExtraSauceConfig());
      setNotes('');
    }
  }, [isOpen, initialBox]);

  useEffect(() => {
    const handleSauceUpdated = (e) => {
      if (e?.detail) setExtraSauceConfig(e.detail);
      else setExtraSauceConfig(getStoredExtraSauceConfig());
    };
    window.addEventListener('extra_sauce_config_updated', handleSauceUpdated);
    return () => window.removeEventListener('extra_sauce_config_updated', handleSauceUpdated);
  }, []);

  if (!isOpen) return null;

  // Procura configuração pré-definida por id ou por correspondência de nome
  const knownConfig = BOX_CONFIGS.find(b => b.id === initialBox?.id) || null;

  // Extrai quantidade do nome ou id (ex: 'Caixa com 40 Esfirras' -> 40, 'caixa-40-esfirras' -> 40)
  const countFromName = (() => {
    const text = `${initialBox?.id || ''} ${initialBox?.name || ''}`;
    const m = text.match(/(?:caixa|combo).*?(\d+)/i) || text.match(/(\d+)\s*(?:esfirras?|unidades?|un)/i) || text.match(/-(\d+)-/);
    return m ? parseInt(m[1], 10) : null;
  })();

  const totalCount = Number(
    initialBox?.totalCount || 
    initialBox?.total || 
    knownConfig?.totalCount || 
    knownConfig?.total || 
    countFromName || 
    20
  );

  const defaultSalgadas = totalCount === 50 ? 40 : (totalCount === 40 ? 33 : (totalCount === 30 ? (initialBox?.id?.includes('dydyo') ? 25 : 22) : (totalCount === 20 ? 15 : Math.max(1, totalCount - 5))));
  const salgadasCount = Number(
    initialBox?.salgadasCount || 
    initialBox?.salgadas || 
    knownConfig?.salgadasCount || 
    knownConfig?.salgadas || 
    defaultSalgadas
  );

  const defaultDoces = Math.max(0, totalCount - salgadasCount);
  const docesCount = Number(
    initialBox?.docesCount || 
    initialBox?.doces || 
    knownConfig?.docesCount || 
    knownConfig?.doces || 
    defaultDoces
  );

  const defaultPrice = totalCount === 50 ? 70 : (totalCount === 40 ? 55 : (totalCount === 30 ? (initialBox?.id?.includes('dydyo') ? 55 : 45) : (totalCount === 20 ? (initialBox?.id?.includes('dydyo') ? 44.99 : 35) : 35)));
  const price = Number(initialBox?.price ?? knownConfig?.price ?? defaultPrice);

  const defaultCreditPrice = totalCount === 50 ? 75 : (totalCount === 40 ? 60 : (totalCount === 30 ? (initialBox?.id?.includes('dydyo') ? 55 : 50) : (totalCount === 20 ? (initialBox?.id?.includes('dydyo') ? 44.99 : 40) : 40)));
  const creditPrice = initialBox?.creditPrice ? Number(initialBox.creditPrice) : (knownConfig?.creditPrice ? Number(knownConfig.creditPrice) : defaultCreditPrice);

  const name = initialBox?.name || knownConfig?.name || `Caixa com ${totalCount} Esfirras`;
  const isDydyoCombo = (name.toLowerCase().includes('dydyo') || (initialBox?.id || '').toLowerCase().includes('dydyo'));
  const boxImage = initialBox?.image || knownConfig?.image || "https://assets.olaclick.app/companies/products/images/800/4cfa4549-ad5f-4b4e-b539-468584a0eeba.png";

  // Sem hook aqui: este trecho roda depois do "if (!isOpen) return null" (hooks após return causam React error #310)
  const selectedBeverage = isDydyoCombo
    ? (BEVERAGE_OPTIONS.find(b => b.name === selectedDydyo) || BEVERAGE_OPTIONS[0])
    : (selectedBeverageId === 'none' ? null : (BEVERAGE_OPTIONS.find(b => b.id === selectedBeverageId) || null));

  const beveragePrice = isDydyoCombo ? 0 : (selectedBeverage ? Number(selectedBeverage.price || 0) : 0);
  const extraSaucePrice = (wantsExtraSauce && extraSauceConfig?.active !== false) ? Number(extraSauceConfig.price || 0) : 0;

  const finalPrice = price + beveragePrice + extraSaucePrice;
  const finalCreditPrice = (creditPrice || price) + beveragePrice + extraSaucePrice;

  const currentOption = BOX_SORTIDO_OPTIONS.find(o => o.id === selectedOptionId) || BOX_SORTIDO_OPTIONS[0];

  const getOptionDescription = (opt) => {
    if (opt.id === 'esfirras-sortidas-sem-doce') {
      return `Caixa com todas as ${totalCount} esfirras salgadas sortidas tradicionais da casa (carne moída temperada, frango, queijo, calabresa, etc.). 100% salgadas, sem doces.`;
    }
    if (opt.id === 'esfirras-sortidas-com-doce') {
      return `A clássica mistura da El Shadday: ${salgadasCount} esfirras salgadas sortidas tradicionais + ${docesCount} esfirras doces sortidas da casa.`;
    }
    if (opt.id === 'esfirras-sortidas-sem-suinos-sem-doce') {
      return `Todas as ${totalCount} esfirras salgadas sortidas SEM carne suína (sem calabresa e sem bacon; preparadas com frango, carne bovina e queijos). 100% salgadas, sem doces.`;
    }
    if (opt.id === 'esfirras-sortidas-sem-suinos-com-doce') {
      return `${salgadasCount} esfirras salgadas sortidas SEM carne suína (sem calabresa e sem bacon) + ${docesCount} esfirras doces sortidas da casa.`;
    }
    return opt.description;
  };

  const handleConfirm = (qty = 1) => {
    const isDoces = currentOption.hasDoces;
    const isSemSuinos = currentOption.semSuinos;

    const beverageText = isDydyoCombo
      ? ` • 🥤 + ${selectedDydyo}`
      : (selectedBeverage ? ` • 🥤 + ${selectedBeverage.name} (R$ ${beveragePrice.toFixed(2).replace('.', ',')})` : '');

    const sauceText = (wantsExtraSauce && extraSauceConfig?.active !== false)
      ? ` • 🧂 + ${extraSauceConfig.name || 'Molho Extra'} (R$ ${extraSaucePrice.toFixed(2).replace('.', ',')})`
      : '';

    const customItem = {
      id: `custom-box-${initialBox?.id || 'box'}-${Date.now()}`,
      name: name,
      price: finalPrice,
      creditPrice: finalCreditPrice,
      basePrice: price,
      isCustomBox: true,
      isBox: true,
      isSortido: true,
      totalCount: totalCount,
      boxOption: currentOption.id,
      boxOptionTitle: currentOption.displayTitle,
      hasDoces: isDoces,
      semSuinos: isSemSuinos,
      salgadasCount: isDoces ? salgadasCount : totalCount,
      docesCount: isDoces ? docesCount : 0,
      dydyoFlavor: isDydyoCombo ? selectedDydyo : (selectedBeverage?.isDydyo ? selectedBeverage.name : null),
      beverage: isDydyoCombo ? selectedDydyo : (selectedBeverage ? selectedBeverage.name : null),
      beveragePrice: beveragePrice,
      hasExtraSauce: Boolean(wantsExtraSauce && extraSauceConfig?.active !== false),
      extraSaucePrice: extraSaucePrice,
      extraSauceName: wantsExtraSauce ? (extraSauceConfig.name || 'Molho Extra da Casa') : null,
      notes: notes.trim(),
      image: boxImage,
      description: `${currentOption.displayTitle} (${isDoces ? `${salgadasCount} Salgadas + ${docesCount} Doces` : `${totalCount} Salgadas`})${isSemSuinos ? ' • 🚫 Sem carne suína' : ''}${beverageText}${sauceText}${notes.trim() ? ` • Obs: ${notes.trim()}` : ''}`
    };

    onAddBoxToCart({ ...customItem, quantity: Math.max(1, Number(qty) || 1) });
    onClose();
  };

  const sauceActive = extraSauceConfig?.active !== false;
  const steps = [
    {
      id: 'tipo',
      title: 'Como quer as esfirras?',
      shortTitle: 'Esfirras',
      hint: `São ${totalCount} esfirras sortidas pela casa.`,
      min: 1,
      max: 1,
      count: selectedOptionId ? 1 : 0,
      content: (
        <div className="space-y-2">
          {BOX_SORTIDO_OPTIONS.map(opt => (
            <OptionRow
              key={opt.id}
              title={`${opt.icon} ${opt.displayTitle}`}
              description={getOptionDescription(opt)}
              multi={false}
              selected={selectedOptionId === opt.id}
              onClick={() => setSelectedOptionId(opt.id)}
            />
          ))}
        </div>
      )
    },
    isDydyoCombo ? {
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
    } : {
      id: 'bebida',
      title: 'Vai querer bebida?',
      shortTitle: 'Bebida',
      min: 1,
      max: 1,
      count: 1,
      content: (
        <div className="space-y-2">
          <OptionRow title="Não, obrigado" multi={false} selected={selectedBeverageId === 'none'} onClick={() => setSelectedBeverageId('none')} />
          {BEVERAGE_OPTIONS.map(b => (
            <OptionRow key={b.id} title={b.name} image={b.image || null} priceText={`+ ${money(b.price)}`} multi={false} selected={selectedBeverageId === b.id} onClick={() => setSelectedBeverageId(b.id)} />
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
      content: <NotesStep value={notes} onChange={setNotes} placeholder="Ex.: mais esfirras de frango, entregar bem quentinha..." />
    }
  ].filter(Boolean);

  return (
    <StepFlow
      isOpen={isOpen}
      onClose={onClose}
      product={{ id: initialBox?.id || name, name, image: boxImage, description: initialBox?.description }}
      steps={steps}
      unitPrice={finalPrice}
      isStoreOpen={isStoreOpen}
      onFinish={(qty) => handleConfirm(qty)}
    />
  );
}
