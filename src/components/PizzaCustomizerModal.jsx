import React, { useState, useEffect } from 'react';
import { X, Pizza, Check, Sparkles, AlertCircle } from 'lucide-react';
import { PIZZA_FLAVORS } from '../data/menuData';

export function PizzaCustomizerModal({ isOpen, onClose, pizzaProduct, onAddPizzaToCart }) {
  const [selectedFlavors, setSelectedFlavors] = useState([]);
  const [notes, setNotes] = useState('');

  const maxFlavors = pizzaProduct?.maxSabores || 2;

  useEffect(() => {
    if (isOpen) {
      setSelectedFlavors([]);
      setNotes('');
    }
  }, [isOpen, pizzaProduct]);

  if (!isOpen || !pizzaProduct) return null;

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
    const customPizza = {
      id: `custom-pizza-${Date.now()}`,
      name: `${pizzaProduct.name} (${selectedFlavors.join(' / ')})`,
      price: pizzaProduct.price,
      isCustomPizza: true,
      tamanho: pizzaProduct.tamanho,
      flavors: selectedFlavors,
      notes: notes.trim(),
      bordaGratis: true,
      image: pizzaProduct.image,
      description: `Sabores: ${selectedFlavors.join(' e ')}. Acompanha borda de Catupiry grátis.${notes ? ` Obs: ${notes}` : ''}`
    };
    onAddPizzaToCart(customPizza);
    onClose();
  };

  const isComplete = selectedFlavors.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-dark-800 bg-gradient-to-r from-dark-900 to-dark-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/30">
              <Pizza className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg text-white">
                {pizzaProduct.name}
              </h2>
              <p className="text-xs text-brand-gold font-medium">
                Escolha até {maxFlavors} sabores ({selectedFlavors.length}/{maxFlavors} selecionados)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Borda Grátis Banner */}
        <div className="bg-gradient-to-r from-amber-500/20 via-brand-gold/25 to-amber-500/20 border-b border-brand-gold/30 px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-brand-goldLight">
          <Sparkles className="w-4 h-4 text-brand-gold animate-pulse" />
          <span>Borda Recheada de Catupiry 100% GRÁTIS Inclusa!</span>
        </div>

        {/* Flavor Selector */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Selecione os sabores da sua pizza:
          </div>
          {PIZZA_FLAVORS.map((flavor) => {
            const isSelected = selectedFlavors.includes(flavor);
            const isDisabled = !isSelected && selectedFlavors.length >= maxFlavors;

            return (
              <button
                key={flavor}
                onClick={() => toggleFlavor(flavor)}
                disabled={isDisabled}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand-gold/15 border-brand-gold text-white font-bold shadow-md'
                    : isDisabled
                    ? 'bg-dark-900/50 border-dark-800 text-slate-500 opacity-50 cursor-not-allowed'
                    : 'bg-dark-850 hover:bg-dark-800 text-slate-200 border-dark-800 hover:border-dark-700'
                }`}
              >
                <span className="text-xs sm:text-sm">{flavor}</span>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                  isSelected
                    ? 'bg-brand-gold border-brand-gold text-dark-950'
                    : 'border-slate-600 bg-dark-900'
                }`}>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}

          {/* Observations */}
          <div className="pt-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Observações (opcional):
            </label>
            <input
              type="text"
              placeholder="Ex: Sem cebola, massa bem crocante, orégano à parte..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-dark-850 border border-dark-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-dark-800 bg-dark-950 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-slate-400">Total:</div>
            <div className="text-xl font-black text-brand-gold">
              R$ {pizzaProduct.price.toFixed(2).replace('.', ',')}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 font-semibold text-xs"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isComplete}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
                isComplete
                  ? 'bg-brand-gold hover:bg-amber-400 text-dark-950 shadow-glow-gold cursor-pointer hover:scale-102'
                  : 'bg-dark-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Adicionar Pizza</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
