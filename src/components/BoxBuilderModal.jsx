import React, { useState, useEffect } from 'react';
import { X, Package, Check, Plus, Minus, Sparkles, Shuffle, AlertCircle } from 'lucide-react';
import { PRODUCTS } from '../data/menuData';

const BOX_OPTIONS = [
  { id: 'caixa-20-esfirras', name: 'Caixa 20 Esfirras', total: 20, salgadas: 15, doces: 5, price: 35.00 },
  { id: 'caixa-30-esfirras', name: 'Caixa 30 Esfirras', total: 30, salgadas: 22, doces: 8, price: 45.00 },
  { id: 'caixa-40-esfirras', name: 'Caixa 40 Esfirras', total: 40, salgadas: 33, doces: 7, price: 55.00 },
  { id: 'caixa-50-esfirras', name: 'Caixa 50 Esfirras', total: 50, salgadas: 40, doces: 10, price: 70.00 },
];

export function BoxBuilderModal({ isOpen, onClose, onAddBoxToCart, initialBox = null }) {
  const [selectedBox, setSelectedBox] = useState(BOX_OPTIONS[0]);
  const [activeTab, setActiveTab] = useState('salgadas'); // 'salgadas' | 'doces'
  const [salgadasSelections, setSalgadasSelections] = useState({});
  const [docesSelections, setDocesSelections] = useState({});

  // Filter available individual flavors
  const salgadasList = PRODUCTS.filter(p => p.categoryId === 'esfirras-salgadas' && p.price === 3.00);
  const docesList = PRODUCTS.filter(p => p.categoryId === 'esfirras-doces' && p.price === 4.00);

  useEffect(() => {
    if (initialBox) {
      const match = BOX_OPTIONS.find(b => b.id === initialBox.id || b.total === initialBox.totalCount);
      if (match) {
        setSelectedBox(match);
      }
    }
  }, [initialBox, isOpen]);

  if (!isOpen) return null;

  // Calculate totals
  const totalSalgadasChosen = Object.values(salgadasSelections).reduce((a, b) => a + b, 0);
  const totalDocesChosen = Object.values(docesSelections).reduce((a, b) => a + b, 0);

  const remainingSalgadas = selectedBox.salgadas - totalSalgadasChosen;
  const remainingDoces = selectedBox.doces - totalDocesChosen;

  const handleBoxChange = (box) => {
    setSelectedBox(box);
    // Reset selections on size change
    setSalgadasSelections({});
    setDocesSelections({});
  };

  const handleUpdateCount = (flavorName, type, delta) => {
    if (type === 'salgadas') {
      const current = salgadasSelections[flavorName] || 0;
      const next = current + delta;
      if (next < 0) return;
      if (delta > 0 && totalSalgadasChosen >= selectedBox.salgadas) return;

      const updated = { ...salgadasSelections };
      if (next === 0) {
        delete updated[flavorName];
      } else {
        updated[flavorName] = next;
      }
      setSalgadasSelections(updated);
    } else {
      const current = docesSelections[flavorName] || 0;
      const next = current + delta;
      if (next < 0) return;
      if (delta > 0 && totalDocesChosen >= selectedBox.doces) return;

      const updated = { ...docesSelections };
      if (next === 0) {
        delete updated[flavorName];
      } else {
        updated[flavorName] = next;
      }
      setDocesSelections(updated);
    }
  };

  // Quick auto-fill random/sortido
  const handleAutoFill = () => {
    // Fill salgadas evenly
    const newSalgadas = {};
    let salgToDistribute = selectedBox.salgadas;
    let sIdx = 0;
    while (salgToDistribute > 0) {
      const flavor = salgadasList[sIdx % salgadasList.length].name;
      newSalgadas[flavor] = (newSalgadas[flavor] || 0) + 1;
      salgToDistribute--;
      sIdx++;
    }
    setSalgadasSelections(newSalgadas);

    // Fill doces evenly
    const newDoces = {};
    let docesToDistribute = selectedBox.doces;
    let dIdx = 0;
    while (docesToDistribute > 0) {
      const flavor = docesList[dIdx % docesList.length].name;
      newDoces[flavor] = (newDoces[flavor] || 0) + 1;
      docesToDistribute--;
      dIdx++;
    }
    setDocesSelections(newDoces);
  };

  const isBoxComplete = remainingSalgadas === 0 && remainingDoces === 0;

  const handleConfirm = () => {
    const customItem = {
      id: `custom-box-${Date.now()}`,
      name: `${selectedBox.name} Personalizada`,
      price: selectedBox.price,
      isCustomBox: true,
      totalCount: selectedBox.total,
      salgadasDetails: salgadasSelections,
      docesDetails: docesSelections,
      image: "https://assets.olaclick.app/companies/products/images/800/4cfa4549-ad5f-4b4e-b539-468584a0eeba.png",
      description: `${selectedBox.salgadas} Salgadas e ${selectedBox.doces} Doces escolhidas no capricho.`
    };
    onAddBoxToCart(customItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-dark-800 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg sm:text-xl text-white">
                Monte sua Caixa de Esfirras
              </h2>
              <p className="text-xs text-slate-400">
                Escolha o tamanho e selecione cada sabor ao seu gosto
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

        {/* Box Size Selector Tabs */}
        <div className="p-4 sm:p-5 border-b border-dark-800/80 bg-dark-950/50">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
            1. Selecione o Tamanho da Caixa:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BOX_OPTIONS.map((box) => {
              const isSelected = selectedBox.id === box.id;
              return (
                <button
                  key={box.id}
                  onClick={() => handleBoxChange(box)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-gold text-dark-950 font-bold border-brand-gold shadow-glow-gold scale-102'
                      : 'bg-dark-900 hover:bg-dark-850 text-slate-300 border-dark-800 hover:border-dark-700'
                  }`}
                >
                  <div className="text-sm font-extrabold">{box.total} Esfirras</div>
                  <div className="text-xs mt-0.5 opacity-90">R$ {box.price.toFixed(2).replace('.', ',')}</div>
                  <div className={`text-[10px] mt-1 ${isSelected ? 'text-dark-950/80' : 'text-slate-400'}`}>
                    {box.salgadas} Salg / {box.doces} Doces
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Counters and Auto-fill Button */}
        <div className="px-5 py-3.5 bg-dark-850 border-b border-dark-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
              remainingSalgadas === 0 ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-dark-900 border-dark-750 text-slate-300'
            }`}>
              <span>Salgadas:</span>
              <strong className="text-white">{totalSalgadasChosen} / {selectedBox.salgadas}</strong>
              {remainingSalgadas === 0 && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />}
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
              remainingDoces === 0 ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-dark-900 border-dark-750 text-slate-300'
            }`}>
              <span>Doces:</span>
              <strong className="text-white">{totalDocesChosen} / {selectedBox.doces}</strong>
              {remainingDoces === 0 && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />}
            </div>
          </div>

          <button
            onClick={handleAutoFill}
            className="flex items-center gap-1.5 text-xs font-bold text-brand-gold hover:text-amber-300 bg-brand-gold/10 hover:bg-brand-gold/20 border border-brand-gold/30 px-3 py-1.5 rounded-xl transition-all"
            title="Preencher com sabores variados da casa"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Preenchimento Sortido</span>
          </button>
        </div>

        {/* Flavor Category Switcher */}
        <div className="px-5 pt-3 flex gap-2 border-b border-dark-800 bg-dark-900">
          <button
            onClick={() => setActiveTab('salgadas')}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'salgadas'
                ? 'border-brand-gold text-brand-gold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Sabores Salgados ({salgadasList.length})
          </button>
          <button
            onClick={() => setActiveTab('doces')}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'doces'
                ? 'border-brand-gold text-brand-gold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Sabores Doces ({docesList.length})
          </button>
        </div>

        {/* Flavors List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
          {(activeTab === 'salgadas' ? salgadasList : docesList).map((flavor) => {
            const count = activeTab === 'salgadas' 
              ? (salgadasSelections[flavor.name] || 0)
              : (docesSelections[flavor.name] || 0);

            const isMaxReached = activeTab === 'salgadas'
              ? remainingSalgadas <= 0
              : remainingDoces <= 0;

            return (
              <div
                key={flavor.id}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-dark-850 hover:bg-dark-800/80 border border-dark-800 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-dark-950 flex-shrink-0">
                    <img
                      src={flavor.image}
                      alt={flavor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                      {flavor.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {flavor.description}
                    </p>
                  </div>
                </div>

                {/* Counter controls */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <button
                    onClick={() => handleUpdateCount(flavor.name, activeTab, -1)}
                    disabled={count === 0}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      count === 0
                        ? 'opacity-30 bg-dark-900 text-slate-500 cursor-not-allowed'
                        : 'bg-dark-750 hover:bg-dark-700 text-white cursor-pointer active:scale-95'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className={`w-6 text-center text-xs font-black ${count > 0 ? 'text-brand-gold' : 'text-slate-400'}`}>
                    {count}
                  </span>

                  <button
                    onClick={() => handleUpdateCount(flavor.name, activeTab, 1)}
                    disabled={isMaxReached}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      isMaxReached
                        ? 'opacity-30 bg-dark-900 text-slate-500 cursor-not-allowed'
                        : 'bg-brand-gold hover:bg-amber-400 text-dark-950 cursor-pointer active:scale-95'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Footer Confirmation */}
        <div className="p-4 sm:p-5 border-t border-dark-800 bg-dark-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <div className="text-xs text-slate-400">Total da Caixa:</div>
            <div className="text-2xl font-black text-brand-gold">
              R$ {selectedBox.price.toFixed(2).replace('.', ',')}
            </div>
            {!isBoxComplete && (
              <div className="text-[11px] text-amber-400 flex items-center gap-1 mt-0.5 justify-center sm:justify-start">
                <AlertCircle className="w-3 h-3" />
                <span>
                  Faltam {remainingSalgadas} salgadas e {remainingDoces} doces
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>

            <button
              onClick={handleConfirm}
              disabled={!isBoxComplete}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                isBoxComplete
                  ? 'bg-gradient-to-r from-brand-gold to-amber-500 hover:from-amber-400 hover:to-brand-gold text-dark-950 shadow-glow-gold cursor-pointer hover:scale-102'
                  : 'bg-dark-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Adicionar Caixa ao Pedido</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
