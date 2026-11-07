import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, Search, Save, ClipboardList, Edit2 } from 'lucide-react';

const money = (v) => `R$ ${(Number(v) || 0).toFixed(2).replace('.', ',')}`;
const parseMoney = (v) => {
  const n = parseFloat(String(v ?? '').replace('R$', '').replace(',', '.').trim());
  return isNaN(n) ? 0 : n;
};

/**
 * Modal da Cozinha/KDS para o admin ou balconista adicionar, remover e alterar
 * itens de um pedido já existente (quantidade, preço, observação, taxa de entrega).
 */
export function EditOrderItemsModal({ order, products = [], formatOrderNumber, onClose, onSave }) {
  const [items, setItems] = useState(() => (order.items || []).map(it => ({ ...it, quantity: Number(it.quantity) || 1 })));
  const [deliveryFee, setDeliveryFee] = useState(() => String(Number(order.deliveryFee || 0).toFixed(2)).replace('.', ','));
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [editingIdx, setEditingIdx] = useState(null);

  const serviceAmount = Number(order.serviceAmount || order.serviceFee) || 0;
  const discountAmount = Number(order.discountAmount || order.discount) || 0;
  const subtotal = items.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  const fee = parseMoney(deliveryFee);
  const total = Math.max(0, subtotal + fee + serviceAmount - discountAmount);

  const term = search.trim().toLowerCase();
  const results = term.length < 2 ? [] : products
    .filter(p => p && p.name && p.active !== false && p.isActive !== false)
    .filter(p => p.name.toLowerCase().includes(term) || (p.description || '').toLowerCase().includes(term))
    .slice(0, 8);

  const updateItem = (idx, patch) => setItems(prev => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const changeQty = (idx, delta) => setItems(prev => prev.map((it, i) => (i === idx ? { ...it, quantity: Math.max(1, (Number(it.quantity) || 1) + delta) } : it)));
  const removeItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
    setEditingIdx(null);
  };

  const addProduct = (p) => {
    setItems(prev => [...prev, {
      id: `${p.id}-edit-${Date.now()}`,
      productId: p.id,
      name: p.name,
      price: Number(p.price) || 0,
      quantity: 1,
      categoryId: p.categoryId,
      addedByStaff: true
    }]);
    setSearch('');
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    setItems(prev => [...prev, {
      id: `avulso-${Date.now()}`,
      name: customName.trim(),
      price: parseMoney(customPrice),
      quantity: 1,
      isCustomStaffItem: true,
      addedByStaff: true
    }]);
    setCustomName('');
    setCustomPrice('');
  };

  const handleSave = () => {
    if (items.length === 0) {
      alert('O pedido precisa ter pelo menos 1 item. Para remover tudo, cancele o pedido.');
      return;
    }
    const cleanItems = items.map(it => ({
      ...it,
      price: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1,
      notes: it.notes ? String(it.notes).trim() : it.notes
    }));
    onSave({
      items: cleanItems,
      subtotal: Number(subtotal.toFixed(2)),
      deliveryFee: Number(fee.toFixed(2)),
      total: Number(total.toFixed(2)),
      editedAt: new Date().toISOString()
    });
  };

  const inputCls = 'w-full px-2.5 py-1.5 rounded-lg bg-dark-950 border border-dark-700 text-white text-xs focus:outline-none focus:border-brand-gold';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-xl bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-gold/20 text-brand-gold flex items-center justify-center border border-brand-gold/30">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Editar Itens do Pedido</h3>
              <p className="text-[11px] text-slate-400">
                Pedido #{formatOrderNumber ? formatOrderNumber(order) : order.orderId} • {order.customerName}
              </p>
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

        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Current items */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Itens do pedido</div>
            {items.length === 0 && (
              <div className="text-xs text-slate-500 bg-dark-950 p-3 rounded-xl border border-dark-800">Nenhum item. Adicione abaixo.</div>
            )}
            {items.map((it, idx) => (
              <div key={idx} className="bg-dark-950 p-2.5 rounded-xl border border-dark-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{it.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {money(it.price)} un • <span className="text-brand-gold font-bold">{money((Number(it.price) || 0) * (Number(it.quantity) || 1))}</span>
                      {it.notes ? <span className="text-amber-300"> • OBS: {it.notes}</span> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="flex items-center gap-1.5 bg-dark-900 px-1.5 py-1 rounded-lg border border-dark-750">
                      <button type="button" onClick={() => changeQty(idx, -1)} className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-white cursor-pointer">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-black text-white w-5 text-center font-mono text-xs">{it.quantity}</span>
                      <button type="button" onClick={() => changeQty(idx, 1)} className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-white cursor-pointer">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center border cursor-pointer transition-colors ${editingIdx === idx ? 'bg-brand-gold text-dark-950 border-brand-gold' : 'bg-dark-900 text-brand-gold border-brand-gold/40 hover:bg-brand-gold/15'}`}
                      title="Alterar nome, preço ou observação"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-500/10 text-red-400 border border-red-500/40 hover:bg-red-500/20 cursor-pointer transition-colors"
                      title="Remover item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {editingIdx === idx && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-dark-800">
                    <label className="sm:col-span-2 text-[10px] font-bold text-slate-400 space-y-1">
                      <span>Nome / descrição</span>
                      <input className={inputCls} value={it.name || ''} onChange={e => updateItem(idx, { name: e.target.value })} />
                    </label>
                    <label className="text-[10px] font-bold text-slate-400 space-y-1">
                      <span>Preço unitário (R$)</span>
                      <input
                        className={inputCls}
                        inputMode="decimal"
                        defaultValue={String(Number(it.price || 0).toFixed(2)).replace('.', ',')}
                        onChange={e => updateItem(idx, { price: parseMoney(e.target.value) })}
                      />
                    </label>
                    <label className="sm:col-span-3 text-[10px] font-bold text-slate-400 space-y-1">
                      <span>Observação para a cozinha</span>
                      <input className={inputCls} value={it.notes || ''} placeholder="Ex: sem cebola" onChange={e => updateItem(idx, { notes: e.target.value })} />
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add from menu */}
          <div className="space-y-2 bg-dark-950/60 p-3 rounded-xl border border-dark-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Adicionar do cardápio</div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                className={`${inputCls} pl-8`}
                placeholder="Buscar produto (ex: coca, calabresa, caixa 20...)"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {results.length > 0 && (
              <div className="space-y-1">
                {results.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProduct(p)}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-dark-900 hover:bg-dark-850 border border-dark-800 hover:border-brand-gold/50 text-left cursor-pointer transition-colors"
                  >
                    <span className="text-xs text-white font-semibold truncate">{p.name}</span>
                    <span className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[11px] text-brand-gold font-bold">{money(p.price)}</span>
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    </span>
                  </button>
                ))}
              </div>
            )}
            {term.length >= 2 && results.length === 0 && (
              <div className="text-[11px] text-slate-500">Nenhum produto encontrado. Use o item avulso abaixo.</div>
            )}
          </div>

          {/* Add custom item */}
          <div className="space-y-2 bg-dark-950/60 p-3 rounded-xl border border-dark-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Item avulso (nome e valor livres)</div>
            <div className="flex gap-2">
              <input className={inputCls} placeholder="Ex: Pizza meia calabresa / meia frango" value={customName} onChange={e => setCustomName(e.target.value)} />
              <input className={`${inputCls} !w-24`} inputMode="decimal" placeholder="R$ 0,00" value={customPrice} onChange={e => setCustomPrice(e.target.value)} />
              <button
                type="button"
                onClick={addCustom}
                disabled={!customName.trim()}
                className="px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Delivery fee */}
          <label className="flex items-center justify-between gap-3 text-xs text-slate-300 font-bold">
            <span>Taxa de entrega (R$)</span>
            <input className={`${inputCls} !w-28 text-right`} inputMode="decimal" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} />
          </label>
        </div>

        {/* Totals + actions */}
        <div className="border-t border-dark-800 pt-3 space-y-3">
          <div className="text-xs space-y-0.5">
            <div className="flex justify-between text-slate-400"><span>Subtotal itens</span><span>{money(subtotal)}</span></div>
            <div className="flex justify-between text-slate-400"><span>Entrega</span><span>{money(fee)}</span></div>
            {serviceAmount > 0 && <div className="flex justify-between text-amber-400"><span>Serviço</span><span>+ {money(serviceAmount)}</span></div>}
            {discountAmount > 0 && <div className="flex justify-between text-emerald-400"><span>Desconto</span><span>- {money(discountAmount)}</span></div>}
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-slate-300 font-bold">Novo total</span>
              <span className="text-lg font-black text-brand-gold">{money(total)}</span>
            </div>
            {Math.abs(total - (Number(order.total) || 0)) > 0.009 && (
              <div className="text-[11px] text-amber-300">Antes: {money(order.total)} • Confira a forma de pagamento/troco depois de salvar.</div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 text-sm font-bold border border-dark-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
