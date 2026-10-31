import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Plus, Minus, Info } from 'lucide-react';

const DEFAULT_COMPLEMENTS = [
  { id: 'leite-ninho', name: 'Leite em Pó (Ninho)', defaultSelected: true },
  { id: 'leite-condensado', name: 'Leite Condensado', defaultSelected: true },
  { id: 'granola', name: 'Granola Crocante', defaultSelected: true },
  { id: 'pacoca', name: 'Paçoca Rolha', defaultSelected: true },
  { id: 'banana', name: 'Banana Fatiada Fresca', defaultSelected: true },
  { id: 'morango', name: 'Morango Fresco', defaultSelected: false },
  { id: 'gotas-chocolate', name: 'Gotas de Chocolate', defaultSelected: false },
  { id: 'chocoball', name: 'Chocoball Crocante', defaultSelected: false },
  { id: 'farinha-lactea', name: 'Farinha Láctea', defaultSelected: false },
  { id: 'amendoim', name: 'Amendoim Triturado', defaultSelected: false }
];

const COBERTURAS = [
  'Sem Cobertura',
  'Cobertura de Morango',
  'Cobertura de Chocolate',
  'Cobertura de Caramelo'
];

export function AcaiCustomizerModal({ isOpen, onClose, acaiProduct, onAddAcaiToCart }) {
  const [selectedComplements, setSelectedComplements] = useState([]);
  const [selectedCobertura, setSelectedCobertura] = useState('Sem Cobertura');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen && acaiProduct) {
      // Pré-seleciona adicionais padrão da casa
      const defaults = DEFAULT_COMPLEMENTS.filter(c => c.defaultSelected).map(c => c.name);
      setSelectedComplements(defaults);
      setSelectedCobertura('Sem Cobertura');
      setNotes('');
      setQuantity(1);
    }
  }, [isOpen, acaiProduct]);

  if (!isOpen || !acaiProduct) return null;

  const basePrice = Number(acaiProduct.price) || 0;
  const totalPrice = basePrice * quantity;

  const toggleComplement = (name) => {
    setSelectedComplements(prev => 
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const handleSelectAll = () => {
    setSelectedComplements(DEFAULT_COMPLEMENTS.map(c => c.name));
  };

  const handleClearAll = () => {
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
      description: `Adicionais: ${complementsText}${cobText}${notesText}`
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
                  Personalize os adicionais e coberturas
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                1. Escolha os Adicionais ({selectedComplements.length} selecionados):
              </label>
              <div className="flex items-center gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-purple-400 hover:underline cursor-pointer font-bold"
                >
                  Marcar Todos
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEFAULT_COMPLEMENTS.map(item => {
                const isSelected = selectedComplements.includes(item.name);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleComplement(item.name)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-500/20 border-purple-500 text-white font-bold shadow-sm'
                        : 'bg-dark-950 border-dark-800 text-slate-300 hover:border-dark-700'
                    }`}
                  >
                    <span className="text-xs">{item.name}</span>
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
              {COBERTURAS.map(cob => (
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
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-400 font-bold text-xs cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:to-purple-400 text-white font-black text-xs sm:text-sm shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-98 transition-all"
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
