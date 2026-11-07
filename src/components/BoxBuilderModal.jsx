import React, { useState, useEffect, useMemo } from 'react';
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

  const handleConfirm = () => {
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

    onAddBoxToCart(customItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-dark-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-xl bg-dark-900 border-t sm:border border-brand-gold/40 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex-shrink-0 p-4 sm:p-5 border-b border-dark-800 bg-gradient-to-r from-dark-950 to-dark-900 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/30 flex-shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-extrabold text-base sm:text-lg text-white leading-tight truncate">
                {name}
              </h2>
              <p className="text-[11px] sm:text-xs text-brand-gold font-medium">
                Pioneiros em Ariquemes • Massas frescas e artesanais todos os dias
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-dark-700 flex-shrink-0 ml-2"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Closed Store Alert */}
        {!isStoreOpen && (
          <div className="bg-red-950/90 border-b border-red-500/30 px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold text-red-200">
            <span>⛔ Estabelecimento Fechado • Apenas visualização da caixa (pedidos pausados)</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
          
          {/* Card Resumo do Produto Selecionado (Fixo e sem opções de alterar tamanho) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-dark-950 to-dark-850 border border-brand-gold/30 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-dark-900 border border-dark-750 flex-shrink-0">
                <img
                  src={boxImage}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-extrabold text-white truncate">
                  {name}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[11px] font-black text-brand-gold bg-brand-gold/15 px-2 py-0.5 rounded border border-brand-gold/30">
                    {totalCount} Esfirras
                  </span>
                  {isDydyoCombo && (
                    <span className="text-[11px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                      <span>🥤</span>
                      <span>+ {selectedDydyo}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="text-[10px] text-slate-400 block">Preço:</span>
              <span className="text-base sm:text-lg font-black text-brand-gold">
                R$ {price.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* As 4 Opções de Sortidas Exclusivas */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                <span>Escolha como deseja o sortido:</span>
              </span>
              <span className="text-[11px] text-brand-gold font-bold">
                Total fixo: {totalCount} esfirras
              </span>
            </div>

            <div className="space-y-2.5">
              {BOX_SORTIDO_OPTIONS.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                const compositionText = opt.hasDoces 
                  ? `${salgadasCount} Salgadas + ${docesCount} Doces`
                  : `${totalCount} Esfirras Salgadas`;

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
                      {/* Radio Circle */}
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
                          <span className="text-xs sm:text-sm font-bold text-white">
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
                          {getOptionDescription(opt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 1. SELEÇÃO DE REFRIGERANTE / BEBIDA */}
          {isDydyoCombo ? (
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
                          : 'bg-dark-850 hover:bg-dark-800 border-dark-750 text-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-amber-400 bg-amber-400 text-dark-950' : 'border-dark-600'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
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
                    <span className="text-xs font-semibold">Apenas as esfirras (Sem bebida)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">R$ 0,00</span>
                </button>

                {/* Lista de Bebidas */}
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
                      {extraSauceConfig.description || 'Pote generoso de molho artesanal especial da El Shadday (perfeito para molhar as esfirras quentinhas).'}
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

          {/* Observações para a Cozinha (Opcional) */}
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
              <span className="text-[11px] text-slate-400 block">Total do Pedido:</span>
              <div className="text-xl sm:text-2xl font-black text-brand-gold leading-tight">
                R$ {finalPrice.toFixed(2).replace('.', ',')}
              </div>
            </div>

            {creditPrice && (
              <span className="text-[10px] text-slate-500">
                *No crédito: R$ {finalCreditPrice.toFixed(2).replace('.', ',')}
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
              disabled={!isStoreOpen}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                !isStoreOpen
                  ? 'bg-dark-800 text-slate-500 border border-red-500/30 cursor-not-allowed'
                  : 'bg-gradient-to-r from-brand-gold to-amber-500 hover:from-amber-400 hover:to-brand-gold text-dark-950 shadow-glow-gold cursor-pointer hover:scale-102 active:scale-98'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{!isStoreOpen ? '⛔ Fechado para Pedidos' : `Adicionar Caixa (${totalCount} un)`}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
