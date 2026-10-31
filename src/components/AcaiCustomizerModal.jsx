import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Plus, Minus, Info, AlertCircle } from 'lucide-react';
import { getStoredAcaiSettings } from '../data/menuData';

export function AcaiCustomizerModal({ isOpen, onClose, acaiProduct, onAddAcaiToCart }) {
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

  const availableComplements = acaiConfig.complements.filter(c => c.isAvailable !== false);
  const maxLimit = Number(acaiConfig.maxComplementsPerAcai) || 0; // 0 = sem limite

  useEffect(() => {
    if (isOpen && acaiProduct) {
      // Pré-seleciona os adicionais marcados como padrão que estejam disponíveis
      const currentConfig = getStoredAcaiSettings();
      setAcaiConfig(currentConfig);
      const avail = currentConfig.complements.filter(c => c.isAvailable !== false);
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
  const totalPrice = basePrice * quantity;

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

  const handleConfirm = () => {
    const complementsText = selectedComplements.length > 0 
      ? selectedComplements.join(', ')
      : 'Açaí Puro (Sem adicionais)';

    const cobText = selectedCobertura && selectedCobertura !== 'Sem Cobertura'
      ? ` • Cobertura: ${selectedCobertura}`
      : '';

    const notesText = notes.trim() ? ` • Obs: ${notes.trim()}` : '';

    const customAcai = {
      id: `custom-acai-${acaiProduct.id}-${Date.now()}`,
      name: `${acaiProduct.name}`,
      price: basePrice,
      quantity,
      isCustomAcai: true,
      complements: selectedComplements,
      cobertura: selectedCobertura,
      notes: notes.trim(),
      image: acaiProduct.image,
      description: `Acompanhamentos: ${complementsText}${cobText}${notesText}`
    };

    onAddAcaiToCart(customAcai);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-dark-900 border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-dark-800 bg-gradient-to-r from-dark-900 to-purple-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-300 border border-purple-500/30 flex-shrink-0">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-base sm:text-lg text-white leading-tight">
                {acaiProduct.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-purple-400 font-bold">
                  {maxLimit > 0 ? `Escolha até ${maxLimit} acompanhamentos` : `${availableComplements.length} Acompanhamentos disponíveis`}
                </span>
                <span className="text-[11px] text-slate-400">• R$ {basePrice.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-dark-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Adicionais Inclusos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                1. Escolha os Acompanhamentos ({selectedComplements.length}{maxLimit > 0 ? `/${maxLimit}` : ''}):
              </label>
              <div className="flex items-center gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={handleSelectDefault}
                  className="text-purple-400 hover:underline cursor-pointer font-bold"
                >
                  Padrão
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-purple-400 hover:underline cursor-pointer font-bold"
                >
                  {maxLimit > 0 ? `Marcar (até ${maxLimit})` : 'Marcar Todos'}
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-slate-400 hover:underline cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            </div>

            {limitWarning && (
              <div className="p-2.5 rounded-xl bg-purple-950/70 border border-purple-500/50 text-purple-200 text-xs flex items-center gap-2 animate-pulse">
                <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>{limitWarning}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableComplements.map(item => {
                const isSelected = selectedComplements.includes(item.name);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleComplement(item.name)}
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
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'bg-purple-500 text-dark-950' : 'border border-dark-700 bg-dark-900'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cobertura */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              2. Cobertura:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(acaiConfig.coberturas || ['Sem Cobertura']).map(cob => (
                <button
                  key={cob}
                  type="button"
                  onClick={() => setSelectedCobertura(cob)}
                  className={`p-2 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    selectedCobertura === cob
                      ? 'bg-purple-500 text-dark-950 font-black border-purple-500'
                      : 'bg-dark-950 text-slate-300 border-dark-800 hover:border-dark-700'
                  }`}
                >
                  {cob}
                </button>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              3. Observações (Opcional):
            </label>
            <input
              type="text"
              placeholder="Ex: Caprichar no leite em pó, mandar granola separada..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-dark-800 bg-dark-950 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Valor:</span>
            <span className="text-base sm:text-lg font-black text-purple-400 font-mono">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-dark-900 border border-dark-750 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-dark-800 cursor-pointer transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-7 text-center font-bold text-xs text-white">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(q => q + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-dark-800 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-xs hover:brightness-110 shadow-lg shadow-purple-500/20 cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Adicionar Açaí</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
