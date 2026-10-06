import React, { useState, useEffect } from 'react';
import { X, Flame, Check, Sparkles, AlertCircle } from 'lucide-react';
import { PIZZA_FLAVORS } from '../data/menuData';

export function ComboCustomizerModal({ isOpen, onClose, comboProduct, onAddComboToCart }) {
  const [selectedFlavors, setSelectedFlavors] = useState([]);
  const [notes, setNotes] = useState('');

  // Default max flavors for the pizza in the combo (usually 2 flavors)
  const maxFlavors = comboProduct?.id?.includes('gg') ? 3 : 2;

  useEffect(() => {
    if (isOpen) {
      setSelectedFlavors([]);
      setNotes('');
    }
  }, [isOpen, comboProduct]);

  if (!isOpen || !comboProduct) return null;

  const toggleFlavor = (flavor) => {
    if (selectedFlavors.includes(flavor)) {
      setSelectedFlavors(selectedFlavors.filter(f => f !== flavor));
    } else {
      if (selectedFlavors.length < maxFlavors) {
        setSelectedFlavors([...selectedFlavors, flavor]);
      }
    }
  };

  const handleConfirm = () => {
    const flavorsText = selectedFlavors.length > 0 
      ? selectedFlavors.join(' e ') 
      : 'Sabores a escolher na confirmação';

    const customCombo = {
      id: `custom-combo-${comboProduct.id}-${Date.now()}`,
      name: comboProduct.name,
      price: comboProduct.price,
      isCombo: true,
      flavors: selectedFlavors,
      notes: notes.trim(),
      image: comboProduct.image,
      bordaGratis: comboProduct.bordaGratis,
      description: `Pizza: ${flavorsText}. Acompanha borda de Catupiry grátis.${notes ? ` Obs: ${notes}` : ''}`
    };

    onAddComboToCart(customCombo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-dark-800 bg-gradient-to-r from-dark-900 to-dark-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-base sm:text-lg text-white">
                {comboProduct.name}
              </h2>
              <p className="text-xs text-brand-gold font-medium">
                Escolha até {maxFlavors} sabores para a pizza ({selectedFlavors.length}/{maxFlavors} selecionados)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Borda Banner */}
        {comboProduct.bordaGratis && (
          <div className="bg-gradient-to-r from-amber-500/20 via-brand-gold/25 to-amber-500/20 border-b border-brand-gold/30 px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold text-brand-goldLight">
            <Sparkles className="w-4 h-4 text-brand-gold animate-pulse" />
            <span>Borda Recheada de Catupiry 100% GRÁTIS Inclusa!</span>
          </div>
        )}

        {/* Flavors List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
          <p className="text-xs font-bold text-slate-300 mb-2">
            Selecione os sabores da sua pizza:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PIZZA_FLAVORS.map((flavor) => {
              const isSelected = selectedFlavors.includes(flavor);
              return (
                <button
                  key={flavor}
                  type="button"
                  onClick={() => toggleFlavor(flavor)}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-gold/20 border-brand-gold text-brand-goldLight shadow-sm'
                      : 'bg-dark-950 border-dark-800 text-slate-300 hover:border-dark-700'
                  }`}
                >
                  <span className="truncate">{flavor}</span>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border ${
                    isSelected
                      ? 'bg-brand-gold border-brand-gold text-dark-950'
                      : 'border-slate-600 bg-dark-900'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Notes */}
          <div className="pt-3">
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Observações (Ex: sem cebola, ponto da massa, etc.):
            </label>
            <input
              type="text"
              placeholder="Ex: Metade sem cebola"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-800 focus:border-brand-gold text-white text-xs placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-dark-950 border-t border-dark-800 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-slate-400 block">Total do Combo:</span>
            <span className="text-xl font-black text-brand-gold">
              R$ {comboProduct.price.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-3 rounded-xl bg-brand-gold hover:bg-amber-400 text-dark-950 font-extrabold text-xs shadow-glow-gold transition-all duration-200 active:scale-95 cursor-pointer"
          >
            Adicionar ao Pedido
          </button>
        </div>

      </div>
    </div>
  );
}
