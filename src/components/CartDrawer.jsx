import React, { useState } from 'react';
import { 
  X, ShoppingBag, Trash2, Plus, Minus, MapPin, 
  ArrowRight, AlertCircle, ShieldCheck
} from 'lucide-react';
import { ARIQUEMES_DISTRICTS } from '../data/menuData';

export function CartDrawer({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart,
  onProceedToPayment 
}) {
  const [deliveryType, setDeliveryType] = useState('delivery'); // 'delivery' | 'retirada'
  const [selectedDistrict, setSelectedDistrict] = useState(ARIQUEMES_DISTRICTS[0].id);
  const [streetAddress, setStreetAddress] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [reference, setReference] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const currentDistrict = ARIQUEMES_DISTRICTS.find(d => d.id === selectedDistrict) || ARIQUEMES_DISTRICTS[0];
  const deliveryFee = deliveryType === 'delivery' ? currentDistrict.price : 0;

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal + deliveryFee;

  const handleAdvanceToPayment = () => {
    if (cartItems.length === 0) {
      setErrorMessage('Seu pedido está vazio!');
      return;
    }
    if (!customerName.trim()) {
      setErrorMessage('Por favor, informe seu nome!');
      return;
    }
    if (deliveryType === 'delivery' && !streetAddress.trim()) {
      setErrorMessage('Por favor, informe a rua e o número para a entrega!');
      return;
    }

    setErrorMessage('');

    const orderDetails = {
      customerName: customerName.trim(),
      deliveryType,
      districtId: selectedDistrict,
      streetAddress: streetAddress.trim(),
      addressNumber: addressNumber.trim(),
      reference: reference.trim(),
      deliveryFee,
      subtotal,
      total
    };

    onProceedToPayment(orderDetails);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-dark-950/80 backdrop-blur-sm flex justify-end">
      <div className="relative w-full max-w-lg bg-dark-900 border-l border-dark-800 shadow-2xl flex flex-col h-full overflow-hidden">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-dark-800 bg-dark-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gold/15 flex items-center justify-center text-brand-gold border border-brand-gold/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg text-white">
                Seu Pedido
              </h2>
              <p className="text-xs text-slate-400">
                {cartItems.length} {cartItems.length === 1 ? 'item adicionado' : 'itens adicionados'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          
          {/* Cart Items List */}
          {cartItems.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-full bg-dark-850 border border-dark-800 flex items-center justify-center mx-auto text-slate-500">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-slate-300">
                Seu carrinho está vazio
              </p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Escolha suas esfirras, pizzas e combos favoritos e adicione ao pedido!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span>Itens Selecionados</span>
                <button
                  onClick={onClearCart}
                  className="text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                >
                  Limpar tudo
                </button>
              </div>

              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-dark-850 border border-dark-800 flex gap-3 items-start justify-between"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-dark-950 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Breakdown for custom box */}
                    {item.isCustomBox && (
                      <div className="text-[10px] text-brand-goldLight mt-1 space-y-0.5">
                        {item.salgadasDetails && (
                          <div className="line-clamp-2">
                            🥟 <strong>Salg:</strong> {Object.entries(item.salgadasDetails).map(([k, v]) => `${v}x ${k}`).join(', ')}
                          </div>
                        )}
                        {item.docesDetails && (
                          <div className="line-clamp-2">
                            🍫 <strong>Doces:</strong> {Object.entries(item.docesDetails).map(([k, v]) => `${v}x ${k}`).join(', ')}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-black text-brand-gold">
                        R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                      </span>

                      {/* Quantity control */}
                      <div className="flex items-center gap-1.5 bg-dark-900 px-2 py-1 rounded-lg border border-dark-750">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="text-slate-400 hover:text-white cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white px-1">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="text-slate-400 hover:text-white cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cartItems.length > 0 && (
            <>
              {/* Delivery Type Switcher */}
              <div className="space-y-2 pt-2 border-t border-dark-800">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Como deseja receber?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDeliveryType('delivery')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      deliveryType === 'delivery'
                        ? 'bg-brand-gold/15 border-brand-gold text-white font-bold'
                        : 'bg-dark-850 border-dark-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold">🛵 Delivery</div>
                    <div className="text-[11px] text-brand-gold">Entregamos em Ariquemes</div>
                  </button>

                  <button
                    onClick={() => setDeliveryType('retirada')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      deliveryType === 'retirada'
                        ? 'bg-brand-gold/15 border-brand-gold text-white font-bold'
                        : 'bg-dark-850 border-dark-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold">🏪 Retirada</div>
                    <div className="text-[11px] text-emerald-400">Sem taxa (Setor 03)</div>
                  </button>
                </div>
              </div>

              {/* Delivery Details */}
              {deliveryType === 'delivery' && (
                <div className="space-y-3 p-4 rounded-2xl bg-dark-850 border border-dark-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-gold uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Endereço de Entrega em Ariquemes</span>
                  </div>

                  {/* District / Sector Selection */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Seu Bairro / Setor:
                    </label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:outline-none focus:border-brand-gold cursor-pointer"
                    >
                      {ARIQUEMES_DISTRICTS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} — Taxa: R$ {d.price.toFixed(2).replace('.', ',')}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Street & Number */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Rua / Avenida:
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Rua Maceió"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Número:
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 2333"
                        value={addressNumber}
                        onChange={(e) => setAddressNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                  </div>

                  {/* Reference */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Ponto de Referência (opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Próximo à praça, portão preto..."
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                </div>
              )}

              {/* Customer Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Seu Nome:
                </label>
                <input
                  type="text"
                  placeholder="Como podemos te chamar?"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-850 border border-dark-800 text-white text-xs focus:outline-none focus:border-brand-gold"
                />
              </div>
            </>
          )}

        </div>

        {/* Drawer Footer */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-dark-800 bg-dark-950 space-y-3">
            
            {/* Error notice */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Calculations */}
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal dos itens:</span>
                <span className="text-white font-medium">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de entrega ({deliveryType === 'delivery' ? currentDistrict.name : 'Retirada'}):</span>
                <span className="text-white font-medium">
                  {deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2).replace('.', ',')}`}
                </span>
              </div>
              <div className="pt-2 border-t border-dark-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Total do pedido:</span>
                <span className="text-2xl font-black text-brand-gold">
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* In-Site Payment Button */}
            <button
              onClick={handleAdvanceToPayment}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold hover:from-amber-400 hover:to-brand-gold text-dark-950 font-black text-sm sm:text-base shadow-glow-gold transition-all duration-300 hover:scale-102 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>Avançar para Pagamento Seguro</span>
              <ArrowRight className="w-5 h-5 text-dark-950" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pague via PIX ou Cartão diretamente no site</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
