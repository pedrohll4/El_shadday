import React, { useState } from 'react';
import { X, Save, User, Phone, MapPin, Store, Bike, CreditCard } from 'lucide-react';

const STORE_ADDRESS = 'Av. Canaã, 4065 - Setor 04 (esquina, ao lado da Rumotos), Ariquemes - RO';

const money = (v) => `R$ ${(Number(v) || 0).toFixed(2).replace('.', ',')}`;
const parseMoney = (v) => {
  const n = parseFloat(String(v ?? '').replace('R$', '').replace(',', '.').trim());
  return isNaN(n) ? 0 : n;
};

const isPickupOrder = (order) =>
  order.deliveryType === 'balcao' || order.deliveryType === 'retirada' || order.district === 'Balcão' || order.district === 'Balcão (Setor 04)';

/**
 * Modal do PDV/Cozinha para corrigir os dados do cliente de um pedido já lançado:
 * nome, telefone, retirada no balcão x entrega, bairro, endereço, número, referência e observação.
 */
export function EditOrderCustomerModal({ order, districts = [], formatOrderNumber, onClose, onSave, onOpenPayment }) {
  const addr = order.deliveryAddress || {};
  const [name, setName] = useState(order.customerName || '');
  const [phone, setPhone] = useState(order.customerPhone || '');
  const [deliveryType, setDeliveryType] = useState(isPickupOrder(order) ? 'balcao' : 'delivery');
  const [districtName, setDistrictName] = useState(() => (isPickupOrder(order) ? '' : (order.district || addr.district || '')));
  const [address, setAddress] = useState(() => (isPickupOrder(order) ? '' : (order.address || addr.street || addr.address || '')));
  const [number, setNumber] = useState(() => (isPickupOrder(order) ? '' : (order.number || addr.number || '')));
  const [reference, setReference] = useState(() => (isPickupOrder(order) ? '' : (order.reference || addr.reference || '')));
  const [deliveryFee, setDeliveryFee] = useState(() => String(Number(order.deliveryFee || 0).toFixed(2)).replace('.', ','));
  const tags = (String(order.notes || '').match(/\[[^\]]*\]/g) || []).join(' ');
  const initialNotes = order.orderNotes != null ? String(order.orderNotes) : String(order.notes || '').replace(/\[[^\]]*\]/g, '').trim();
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState('');

  const isDelivery = deliveryType === 'delivery';
  const itemsSubtotal = (order.items || []).reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  const subtotal = Number(order.subtotal) || itemsSubtotal;
  const serviceAmount = Number(order.serviceAmount || order.serviceFee) || 0;
  const discountAmount = Number(order.discountAmount || order.discount) || 0;
  const fee = isDelivery ? parseMoney(deliveryFee) : 0;
  const total = Math.max(0, subtotal + fee + serviceAmount - discountAmount);

  const handleChangeType = (type) => {
    setDeliveryType(type);
    setError('');
    if (type === 'delivery' && parseMoney(deliveryFee) === 0) {
      const found = districts.find(d => d.name === districtName);
      if (found) setDeliveryFee(String(Number(found.price || 0).toFixed(2)).replace('.', ','));
    }
  };

  const handleChangeDistrict = (value) => {
    setDistrictName(value);
    const found = districts.find(d => d.name === value);
    if (found) setDeliveryFee(String(Number(found.price || 0).toFixed(2)).replace('.', ','));
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Informe o nome do cliente.');
      return;
    }
    if (isDelivery && !address.trim()) {
      setError('Informe o endereço de entrega.');
      return;
    }
    if (isDelivery && !districtName.trim()) {
      setError('Escolha o bairro da entrega.');
      return;
    }

    const cleanAddress = isDelivery ? address.trim() : STORE_ADDRESS;
    const cleanNumber = isDelivery ? number.trim() : '';
    const cleanReference = isDelivery ? reference.trim() : '';
    const cleanDistrict = isDelivery ? districtName.trim() : 'Balcão (Setor 04)';
    const trimmedNotes = notes.trim();

    const updates = {
      customerName: name.trim(),
      customerPhone: phone.trim(),
      deliveryType,
      district: cleanDistrict,
      address: cleanAddress,
      number: cleanNumber,
      reference: cleanReference,
      deliveryAddress: {
        ...addr,
        street: cleanAddress,
        address: cleanAddress,
        number: cleanNumber,
        district: isDelivery ? cleanDistrict : 'Balcão',
        reference: cleanReference,
        isPickup: !isDelivery
      },
      deliveryFee: Number(fee.toFixed(2)),
      total: Number(total.toFixed(2)),
      editedAt: new Date().toISOString()
    };

    if (trimmedNotes !== initialNotes.trim()) {
      updates.orderNotes = trimmedNotes;
      // Mantém as marcações [Serviço: ...] / [Desconto: ...] que ficam no campo "notes"
      updates.notes = (trimmedNotes + (tags ? ' ' + tags : '')).trim();
    }

    onSave(updates);
  };

  const inputCls = 'w-full px-3 py-2 rounded-xl bg-dark-950 border border-dark-700 text-white text-sm focus:outline-none focus:border-brand-gold';
  const labelCls = 'text-[11px] font-bold text-slate-400 uppercase tracking-wider';
  const districtOptions = districts.some(d => d.name === districtName) || !districtName
    ? districts
    : [{ id: '__current', name: districtName, price: order.deliveryFee || 0 }, ...districts];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-800 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-gold/20 text-brand-gold flex items-center justify-center border border-brand-gold/30 flex-shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-white">Editar Cliente e Entrega</h3>
              <p className="text-[11px] text-slate-400 truncate">
                Pedido #{formatOrderNumber ? formatOrderNumber(order) : order.orderId} • {order.customerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-dark-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 overflow-y-auto pr-1 flex-1">
          {/* Nome e telefone */}
          <div className="space-y-1">
            <label className={labelCls}>Nome do cliente</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={name} onChange={e => { setName(e.target.value); setError(''); }} className={`${inputCls} pl-9`} placeholder="Nome do cliente" />
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Telefone / WhatsApp</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={phone} onChange={e => setPhone(e.target.value)} className={`${inputCls} pl-9 font-mono`} placeholder="(69) 99999-9999" inputMode="tel" />
            </div>
          </div>

          {/* Tipo de entrega */}
          <div className="space-y-1">
            <label className={labelCls}>Como o cliente vai receber</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleChangeType('balcao')}
                className={`py-2.5 rounded-xl border text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  !isDelivery ? 'bg-amber-500/20 border-amber-500/60 text-amber-300' : 'bg-dark-950 border-dark-700 text-slate-400 hover:text-white'
                }`}
              >
                <Store className="w-4 h-4" />
                Retirada no Balcão
              </button>
              <button
                type="button"
                onClick={() => handleChangeType('delivery')}
                className={`py-2.5 rounded-xl border text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isDelivery ? 'bg-blue-500/20 border-blue-500/60 text-blue-300' : 'bg-dark-950 border-dark-700 text-slate-400 hover:text-white'
                }`}
              >
                <Bike className="w-4 h-4" />
                Entrega
              </button>
            </div>
          </div>

          {isDelivery ? (
            <div className="space-y-3 bg-dark-950/60 p-3 rounded-2xl border border-dark-800">
              <div className="space-y-1">
                <label className={labelCls}>Bairro</label>
                <select value={districtName} onChange={e => handleChangeDistrict(e.target.value)} className={inputCls}>
                  <option value="">Escolha o bairro...</option>
                  {districtOptions.map(d => (
                    <option key={d.id || d.name} value={d.name}>
                      {d.name} — {money(d.price)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-[1fr_90px] gap-2">
                <div className="space-y-1 min-w-0">
                  <label className={labelCls}>Endereço (rua)</label>
                  <input value={address} onChange={e => { setAddress(e.target.value); setError(''); }} className={inputCls} placeholder="Rua / Avenida" />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Nº</label>
                  <input value={number} onChange={e => setNumber(e.target.value)} className={inputCls} placeholder="123" />
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Ponto de referência</label>
                <input value={reference} onChange={e => setReference(e.target.value)} className={inputCls} placeholder="Ex: perto do mercado" />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Taxa de entrega (R$)</label>
                <input value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} className={`${inputCls} font-mono`} inputMode="decimal" />
              </div>
            </div>
          ) : (
            <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-start gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Cliente retira na loja: {STORE_ADDRESS}. Sem taxa de entrega.</span>
            </div>
          )}

          <div className="space-y-1">
            <label className={labelCls}>Observação do pedido</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Ex: sem cebola, troco, interfone..." />
          </div>

          {onOpenPayment && (
            <button
              type="button"
              onClick={onOpenPayment}
              className="w-full py-2 rounded-xl bg-dark-950 border border-dark-700 hover:border-brand-gold/50 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5 text-brand-gold" />
              Alterar forma de pagamento / troco ({order.paymentMethod || 'A definir'})
            </button>
          )}
        </div>

        {/* Total + ações */}
        <div className="border-t border-dark-800 pt-3 space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Total do pedido</span>
            <span className="font-black text-brand-gold text-lg">{money(total)}</span>
          </div>
          {Math.abs(total - (Number(order.total) || 0)) > 0.009 && (
            <div className="text-[11px] text-amber-300 text-right">
              Antes: {money(order.total)} (mudou a taxa de entrega)
            </div>
          )}
          {error && (
            <div className="text-xs text-red-400 font-bold bg-red-500/10 border border-red-500/30 p-2 rounded-lg">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 font-bold text-sm cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="py-2.5 rounded-xl bg-brand-gold hover:bg-brand-goldLight text-dark-950 font-black text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
