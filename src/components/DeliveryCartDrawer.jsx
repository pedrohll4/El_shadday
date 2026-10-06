import React, { useState } from 'react';
import { 
  X, ShoppingBag, Trash2, Plus, Minus, MapPin, 
  ArrowRight, AlertCircle, ShieldCheck, Copy, Check, 
  CreditCard, Banknote, QrCode, MessageCircle, Sparkles, Building2
} from 'lucide-react';
import { ARIQUEMES_DISTRICTS, RESTAURANT_INFO } from '../data/menuData';

export function DeliveryCartDrawer({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart,
  onOrderFinished,
  activeBranch
}) {
  const [deliveryType, setDeliveryType] = useState('delivery'); // 'delivery' | 'retirada'
  const [selectedDistrict, setSelectedDistrict] = useState(ARIQUEMES_DISTRICTS[2].id); // Setor 03 default
  const [streetAddress, setStreetAddress] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [reference, setReference] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix'); // 'pix' | 'cartao' | 'dinheiro'
  const [cashChange, setCashChange] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const currentDistrict = ARIQUEMES_DISTRICTS.find(d => d.id === selectedDistrict) || ARIQUEMES_DISTRICTS[0];
  const deliveryFee = deliveryType === 'delivery' ? currentDistrict.price : 0;
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal + deliveryFee;

  const pixKey = activeBranch?.pixKey || RESTAURANT_INFO.pixKey || '69992228682';
  const restaurantPhone = activeBranch?.phone || RESTAURANT_INFO.phone || '5569992228682';

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleFinalizeWhatsAppOrder = () => {
    if (cartItems.length === 0) {
      setErrorMessage('Sua sacola está vazia! Adicione itens do cardápio.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMessage('Por favor, digite seu nome!');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMessage('Por favor, informe seu WhatsApp ou telefone para contato!');
      return;
    }
    if (deliveryType === 'delivery' && !streetAddress.trim()) {
      setErrorMessage('Por favor, informe o nome da rua ou avenida para a entrega!');
      return;
    }

    setErrorMessage('');

    // Generate Unique Human-Readable Order ID (ex: #ES-4921)
    const orderId = 'ES-' + Math.floor(1000 + Math.random() * 9000);

    // Format Items list for WhatsApp
    const itemsFormatted = cartItems.map((item, idx) => {
      let desc = '';
      if (item.flavors && item.flavors.length > 0) {
        desc = `\n   ↳ Sabores: ${item.flavors.join(' / ')}`;
      } else if (item.description && (item.isBox || item.isCombo)) {
        desc = `\n   ↳ ${item.description}`;
      }
      return `${idx + 1}. *${item.quantity}x ${item.name}* - R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}${desc}`;
    }).join('\n');

    // Payment method text
    let paymentText = 'PIX';
    if (paymentMethod === 'cartao') {
      paymentText = 'Cartão de Crédito/Débito (Levar maquininha)';
    } else if (paymentMethod === 'dinheiro') {
      paymentText = `Dinheiro ${cashChange ? `(Troco para R$ ${cashChange})` : '(Sem troco)'}`;
    }

    // Delivery text
    let deliveryText = '';
    if (deliveryType === 'delivery') {
      deliveryText = 
`🛵 *Tipo:* Delivery (Entrega)
📍 *Bairro:* ${currentDistrict.name}
🏠 *Endereço:* ${streetAddress.trim()}${addressNumber.trim() ? `, Nº ${addressNumber.trim()}` : ''}
${reference.trim() ? `📌 *Referência:* ${reference.trim()}\n` : ''}🛵 *Taxa de Entrega:* R$ ${deliveryFee.toFixed(2).replace('.', ',')}`;
    } else {
      deliveryText = 
`🛍️ *Tipo:* Retirada no Balcão
🏢 *Local:* Rua Maceió, 2333 - Setor 03, Ariquemes - RO
🛵 *Taxa:* Grátis (Retirada)`;
    }

    // Full WhatsApp Message
    const whatsappMessage = 
`🍕 *NOVO PEDIDO - EL SHADDAY DELIVERY*
🆔 *Pedido:* #${orderId}
📍 *Unidade:* Ariquemes - RO
----------------------------------------
👤 *Cliente:* ${customerName.trim()}
📱 *WhatsApp:* ${customerPhone.trim()}
----------------------------------------
📋 *ITENS:*
${itemsFormatted}
----------------------------------------
${deliveryText}
${orderNotes.trim() ? `\n📝 *Observações do Pedido:*\n${orderNotes.trim()}\n` : ''}
💰 *Subtotal:* R$ ${subtotal.toFixed(2).replace('.', ',')}
💳 *TOTAL A PAGAR: R$ ${total.toFixed(2).replace('.', ',')}*
💵 *Forma de Pagamento:* ${paymentText}
${paymentMethod === 'pix' ? `\n⚠️ *COMPROVANTE DO PIX:* Segue em anexo nesta conversa!\n(Chave Pix utilizada: ${pixKey})` : ''}
----------------------------------------
Pedido gerado via Cardápio Digital El Shadday.`;

    const encoded = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${restaurantPhone}?text=${encoded}`;

    const orderData = {
      orderId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryType,
      address: deliveryType === 'delivery' 
        ? `${streetAddress.trim()}${addressNumber.trim() ? `, Nº ${addressNumber.trim()}` : ''} - ${currentDistrict.name}`
        : 'Retirada no Balcão',
      paymentMethod,
      total,
      pixKey,
      whatsappUrl,
      items: cartItems
    };

    // Save order in local history
    try {
      const history = JSON.parse(localStorage.getItem('el_shadday_orders_history') || '[]');
      localStorage.setItem('el_shadday_orders_history', JSON.stringify([orderData, ...history]));
    } catch (e) {}

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    // Notify parent to open OrderSuccessModal
    onOrderFinished(orderData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-dark-950/80 backdrop-blur-sm flex justify-end animate-fade-in">
      <div className="relative w-full max-w-lg bg-dark-900 border-l border-dark-800 shadow-2xl flex flex-col h-full overflow-hidden">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-dark-800 bg-dark-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gold/15 flex items-center justify-center text-brand-gold border border-brand-gold/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-base sm:text-lg text-white">
                Sua Sacola
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}</span>
                <span>•</span>
                <span className="text-brand-gold font-medium">Unidade Ariquemes</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          
          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Cart Items List */}
          {cartItems.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-full bg-dark-850 border border-dark-800 flex items-center justify-center mx-auto text-slate-500">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-display font-bold text-base text-white">
                Sua sacola está vazia
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Explore nosso cardápio de esfirras, pizzas e combos especiais para montar seu pedido.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-amber-400 text-dark-950 text-xs font-bold transition-all cursor-pointer"
              >
                Ver Cardápio
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Itens Selecionados ({cartItems.length})
                </span>
                <button
                  type="button"
                  onClick={onClearCart}
                  className="text-[11px] text-red-400 hover:text-red-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar sacola</span>
                </button>
              </div>

              <div className="divide-y divide-dark-800 space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-start gap-3">
                    {/* Item Image */}
                    {item.image && (
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-dark-950 flex-shrink-0 border border-dark-800">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                          {item.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors p-0.5"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Flavors / details description */}
                      {item.flavors && item.flavors.length > 0 && (
                        <p className="text-[11px] text-brand-gold/90 mt-0.5 font-medium">
                          Sabores: {item.flavors.join(' / ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-[11px] text-slate-400 mt-0.5 italic">
                          Obs: {item.notes}
                        </p>
                      )}

                      {/* Quantity & Price */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 bg-dark-950 rounded-lg border border-dark-800 p-0.5">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-white px-1">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs sm:text-sm font-bold text-brand-gold">
                          R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checkout Steps - Only show if items exist */}
          {cartItems.length > 0 && (
            <div className="space-y-5 pt-4 border-t border-dark-800">
              
              {/* 1. Tipo de Entrega */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  1. Como Deseja Receber?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('delivery')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      deliveryType === 'delivery'
                        ? 'bg-brand-gold text-dark-950 border-brand-gold shadow-glow-gold'
                        : 'bg-dark-950 text-slate-300 border-dark-800 hover:border-dark-700'
                    }`}
                  >
                    <span>🛵 Delivery (Entrega)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('retirada')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      deliveryType === 'retirada'
                        ? 'bg-brand-gold text-dark-950 border-brand-gold shadow-glow-gold'
                        : 'bg-dark-950 text-slate-300 border-dark-800 hover:border-dark-700'
                    }`}
                  >
                    <span>🛍️ Retirada no Balcão</span>
                  </button>
                </div>
              </div>

              {/* 2. Endereço se Delivery */}
              {deliveryType === 'delivery' ? (
                <div className="space-y-3 bg-dark-950/60 p-3.5 rounded-2xl border border-dark-800">
                  <span className="text-xs font-bold text-brand-gold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Endereço de Entrega (Ariquemes - RO)</span>
                  </span>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Seu Bairro (Taxa calculada automaticamente) *
                    </label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-800 text-white text-xs focus:border-brand-gold focus:outline-none"
                    >
                      {ARIQUEMES_DISTRICTS.map((district) => (
                        <option key={district.id} value={district.id}>
                          {district.name} — Taxa: R$ {district.price.toFixed(2).replace('.', ',')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Rua / Avenida *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Rua das Flores"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-800 text-white text-xs placeholder-slate-500 focus:border-brand-gold focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Número
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 123"
                        value={addressNumber}
                        onChange={(e) => setAddressNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-800 text-white text-xs placeholder-slate-500 focus:border-brand-gold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Ponto de Referência / Complemento
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Próximo à padaria, casa de esquina"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-800 text-white text-xs placeholder-slate-500 focus:border-brand-gold focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-dark-950/60 p-3.5 rounded-2xl border border-dark-800 text-xs text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 text-brand-gold font-bold">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Retirada no Balcão da Pizzaria:</span>
                  </div>
                  <p className="text-slate-400">
                    Rua Maceió, 2333 - Setor 03, Ariquemes - RO
                  </p>
                  <p className="text-[11px] text-emerald-400 font-semibold pt-1">
                    ✓ Taxa de entrega gratuita!
                  </p>
                </div>
              )}

              {/* 3. Seus Dados */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  2. Seus Dados para Contato
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Seu Nome *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: João Silva"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-dark-800 text-white text-xs placeholder-slate-500 focus:border-brand-gold focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Seu WhatsApp / Telefone *
                    </label>
                    <input
                      type="tel"
                      placeholder="Ex: (69) 99999-9999"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-dark-800 text-white text-xs placeholder-slate-500 focus:border-brand-gold focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Observações do Pedido (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Caprichar no sachê de maionese, sem orégano..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-dark-800 text-white text-xs placeholder-slate-500 focus:border-brand-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* 4. Forma de Pagamento */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  3. Forma de Pagamento
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'pix'
                        ? 'bg-brand-gold text-dark-950 border-brand-gold shadow-glow-gold'
                        : 'bg-dark-950 text-slate-300 border-dark-800 hover:border-dark-700'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>PIX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cartao')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'cartao'
                        ? 'bg-brand-gold text-dark-950 border-brand-gold shadow-glow-gold'
                        : 'bg-dark-950 text-slate-300 border-dark-800 hover:border-dark-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Cartão</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('dinheiro')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'dinheiro'
                        ? 'bg-brand-gold text-dark-950 border-brand-gold shadow-glow-gold'
                        : 'bg-dark-950 text-slate-300 border-dark-800 hover:border-dark-700'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Dinheiro</span>
                  </button>
                </div>

                {/* Pix Details Box */}
                {paymentMethod === 'pix' && (
                  <div className="bg-gradient-to-r from-amber-500/10 to-brand-gold/15 p-3 rounded-xl border border-brand-gold/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white">
                        Chave PIX (Celular):
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="text-[11px] font-extrabold text-brand-gold flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        {copiedPix ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Chave Copiada!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Chave</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-dark-950 p-2 rounded-lg font-mono text-center text-xs font-bold text-brand-gold border border-dark-800">
                      {pixKey}
                    </div>

                    <p className="text-[10px] text-slate-300 leading-tight">
                      💡 <strong>Dica:</strong> Copie a chave, realize a transferência e anexe o comprovante na conversa do WhatsApp que abrirá a seguir!
                    </p>
                  </div>
                )}

                {/* Dinheiro Troco Box */}
                {paymentMethod === 'dinheiro' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Precisa de troco para quanto? (Deixe em branco se não precisar)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Troco para R$ 50,00"
                      value={cashChange}
                      onChange={(e) => setCashChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-dark-800 text-white text-xs placeholder-slate-500 focus:border-brand-gold focus:outline-none"
                    />
                  </div>
                )}

                {/* Cartão Info */}
                {paymentMethod === 'cartao' && (
                  <div className="p-2.5 rounded-xl bg-dark-950 text-[11px] text-slate-400 border border-dark-800">
                    O entregador levará a máquina de cartão até você (Crédito ou Débito).
                  </div>
                )}

              </div>

            </div>
          )}

        </div>

        {/* Drawer Footer with Totals and WhatsApp Finalize Button */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-dark-800 bg-dark-950 space-y-3">
            
            {/* Totals Breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Subtotal dos itens:</span>
                <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Taxa de Entrega ({deliveryType === 'delivery' ? currentDistrict.name : 'Balcão'}):</span>
                <span>
                  {deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2).replace('.', ',')}` : 'Grátis'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-dark-800 font-extrabold text-base text-white">
                <span>Total a Pagar:</span>
                <span className="text-brand-gold text-lg">
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Main Action Button */}
            <button
              type="button"
              onClick={handleFinalizeWhatsAppOrder}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-sm sm:text-base shadow-lg transition-all duration-300 hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Finalizar Pedido via WhatsApp</span>
            </button>

            <p className="text-center text-[10px] text-slate-400">
              Ao clicar, você enviará os dados do pedido e o comprovante no WhatsApp da pizzaria.
            </p>

          </div>
        )}

      </div>
    </div>
  );
}
