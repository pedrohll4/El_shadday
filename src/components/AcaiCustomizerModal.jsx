import React, { useState, useEffect } from 'react';
import { StepFlow, OptionRow, OptionFilters, NotesStep, money } from './storefront/StepFlow';
import { X, Sparkles, Check, Plus, Minus, Info, AlertCircle } from 'lucide-react';
import { getStoredAcaiSettings } from '../data/menuData';

export function AcaiCustomizerModal({ isOpen, onClose, acaiProduct, onAddAcaiToCart, isStoreOpen = true }) {
  const [acaiConfig, setAcaiConfig] = useState(() => getStoredAcaiSettings());
  const [selectedComplements, setSelectedComplements] = useState([]);
  const [selectedCobertura, setSelectedCobertura] = useState('Sem Cobertura');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [limitWarning, setLimitWarning] = useState('');

  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail) setAcaiConfig(e.detail);
      else setAcaiConfig(getStoredAcaiSettings());
    };
    window.addEventListener('acai_settings_updated', handleSync);
    return () => window.removeEventListener('acai_settings_updated', handleSync);
  }, []);

  const availableComplements = (acaiConfig.complements || []).filter(c => c.isAvailable !== false);
  const availableCoberturas = (acaiConfig.coberturas || [])
    .map((cb, idx) => typeof cb === 'string' ? { id: `cob_${idx}`, name: cb, price: 0, isAvailable: true } : cb)
    .filter(c => c.isAvailable !== false);
  const maxLimit = Number(acaiConfig.maxComplementsPerAcai) || 0; // 0 = sem limite

  useEffect(() => {
    if (isOpen && acaiProduct) {
      // Pré-seleciona os adicionais marcados como padrão que estejam disponíveis
      const currentConfig = getStoredAcaiSettings();
      setAcaiConfig(currentConfig);
      const avail = (currentConfig.complements || []).filter(c => c.isAvailable !== false);
      const defaults = avail.filter(c => c.defaultSelected).map(c => c.name);
      const lim = Number(currentConfig.maxComplementsPerAcai) || 0;
      setSelectedComplements(lim > 0 ? defaults.slice(0, lim) : defaults);
      setSelectedCobertura('Sem Cobertura');
      setNotes('');
      setQuantity(1);
      setLimitWarning('');
    }
  }, [isOpen, acaiProduct]);

  if (!isOpen || !acaiProduct) return null;

  const basePrice = Number(acaiProduct.price) || 0;
  
  // Cálculo de adicionais pagos (Acompanhamentos + Cobertura)
  const complementsSurcharge = selectedComplements.reduce((acc, compName) => {
    const compObj = (acaiConfig.complements || []).find(c => c.name === compName);
    return acc + (Number(compObj?.price) || 0);
  }, 0);

  const selectedCobObj = availableCoberturas.find(c => c.name === selectedCobertura);
  const coberturaSurcharge = Number(selectedCobObj?.price) || 0;
  const totalExtrasSurcharge = complementsSurcharge + coberturaSurcharge;

  const unitPrice = basePrice + totalExtrasSurcharge;
  const totalPrice = unitPrice * quantity;

  const toggleComplement = (name) => {
    setLimitWarning('');
    setSelectedComplements(prev => {
      if (prev.includes(name)) {
        return prev.filter(c => c !== name);
      }
      if (maxLimit > 0 && prev.length >= maxLimit) {
        setLimitWarning(`Limite máximo atingido (${maxLimit} acompanhamentos neste açaí). Desmarque um para trocar.`);
        return prev;
      }
      return [...prev, name];
    });
  };

  const handleSelectDefault = () => {
    setLimitWarning('');
    const defaults = availableComplements.filter(c => c.defaultSelected).map(c => c.name);
    setSelectedComplements(maxLimit > 0 ? defaults.slice(0, maxLimit) : defaults);
  };

  const handleSelectAll = () => {
    setLimitWarning('');
    const allNames = availableComplements.map(c => c.name);
    if (maxLimit > 0) {
      setSelectedComplements(allNames.slice(0, maxLimit));
      if (allNames.length > maxLimit) {
        setLimitWarning(`Marcados os primeiros ${maxLimit} acompanhamentos permitidos.`);
      }
    } else {
      setSelectedComplements(allNames);
    }
  };

  const handleClearAll = () => {
    setLimitWarning('');
    setSelectedComplements([]);
  };

  const handleConfirm = (qty = 1) => {
    const complementsText = selectedComplements.length > 0 
      ? selectedComplements.map(name => {
          const compObj = (acaiConfig.complements || []).find(c => c.name === name);
          const pr = Number(compObj?.price) || 0;
          return pr > 0 ? `${name} (+R$ ${pr.toFixed(2).replace('.', ',')})` : name;
        }).join(', ')
      : 'Açaí Puro (Sem adicionais)';

    const cobText = selectedCobertura && selectedCobertura !== 'Sem Cobertura'
      ? ` • Cobertura: ${selectedCobertura}${coberturaSurcharge > 0 ? ` (+R$ ${coberturaSurcharge.toFixed(2).replace('.', ',')})` : ''}`
      : '';

    const notesText = notes.trim() ? ` • Obs: ${notes.trim()}` : '';

    const customAcai = {
      id: `custom-acai-${acaiProduct.id}-${Date.now()}`,
      name: `${acaiProduct.name}`,
      price: unitPrice,
      basePrice,
      totalExtrasSurcharge,
      quantity,
      isCustomAcai: true,
      complements: selectedComplements,
      cobertura: selectedCobertura,
      notes: notes.trim(),
      image: acaiProduct.image,
      description: `Acompanhamentos: ${complementsText}${cobText}${notesText}`
    };

    onAddAcaiToCart({ ...customAcai, quantity: Math.max(1, Number(qty) || 1) });
    onClose();
  };

  const steps = [
    {
      id: 'acompanhamentos',
      title: maxLimit > 0 ? `Escolha até ${maxLimit} acompanhamentos` : 'Escolha os acompanhamentos',
      shortTitle: 'Acompanhamentos',
      hint: limitWarning || 'Já deixamos marcados os mais pedidos. Toque para tirar ou colocar.',
      min: 0,
      max: maxLimit,
      count: selectedComplements.length,
      content: (
        <div className="space-y-2">
          {availableComplements.map(c => {
            const isSel = selectedComplements.includes(c.name);
            return (
              <OptionRow
                key={c.id || c.name}
                title={`${c.icon ? c.icon + ' ' : ''}${c.name}`}
                priceText={Number(c.price) > 0 ? `+ ${money(c.price)}` : null}
                selected={isSel}
                disabled={!isSel && maxLimit > 0 && selectedComplements.length >= maxLimit}
                onClick={() => toggleComplement(c.name)}
              />
            );
          })}
        </div>
      )
    },
    availableCoberturas.length > 0 && {
      id: 'cobertura',
      title: 'Escolha a cobertura',
      shortTitle: 'Cobertura',
      min: 1,
      max: 1,
      count: selectedCobertura ? 1 : 0,
      content: (
        <div className="space-y-2">
          {availableCoberturas.map(c => (
            <OptionRow
              key={c.id || c.name}
              title={c.name}
              priceText={Number(c.price) > 0 ? `+ ${money(c.price)}` : null}
              multi={false}
              selected={selectedCobertura === c.name}
              onClick={() => setSelectedCobertura(c.name)}
            />
          ))}
        </div>
      )
    },
    {
      id: 'obs',
      title: 'Observação',
      shortTitle: 'Observação',
      content: <NotesStep value={notes} onChange={setNotes} placeholder="Ex.: pouco leite em pó, separar a granola..." />
    }
  ].filter(Boolean);

  return (
    <StepFlow
      isOpen={isOpen}
      onClose={onClose}
      product={{ id: acaiProduct.id, name: acaiProduct.name, image: acaiProduct.image, description: acaiProduct.description }}
      steps={steps}
      unitPrice={unitPrice}
      isStoreOpen={isStoreOpen}
      onFinish={(qty) => handleConfirm(qty)}
    />
  );
}
