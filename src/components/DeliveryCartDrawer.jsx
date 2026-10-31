import React, { useState } from 'react';
import { 
  X, ShoppingBag, Trash2, Plus, Minus, MapPin, 
  ArrowRight, AlertCircle, ShieldCheck, Copy, Check, 
  CreditCard, Banknote, QrCode, MessageCircle, Sparkles, Building2,
  Shuffle
} from 'lucide-react';
import { ARIQUEMES_DISTRICTS, RESTAURANT_INFO, getStoredRestaurantInfo, calculateCardMachineFee, getCardMachineNoticeText } from '../data/menuData';
import { dispatchOrderToKitchen } from '../services/ordersSyncService';
import { cleanPhoneNumber } from '../services/whatsappNotificationService';
import { recordCustomerFromOrder } from '../services/customerService';

export function DeliveryCartDrawer({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart,
  onOrderFinished,
  activeBranch,
  initialDeliveryType = 'delivery'
}) {
  const [deliveryType, setDeliveryType] = useState(initialDeliveryType); // 'delivery' | 'retirada'
  const [storeInfo, setStoreInfo] = useState(() => getStoredRestaurantInfo());

  React.useEffect(() => {
    const handleStoreUpdate = (e) => {
      if (e?.detail) setStoreInfo(e.detail);
      else setStoreInfo(getStoredRestaurantInfo());
    };
    window.addEventListener('delivery_restaurant_info_updated', handleStoreUpdate);
    return () => window.removeEventListener('delivery_restaurant_info_updated', handleStoreUpdate);
  }, []);

  React.useEffect(() => {
    if (initialDeliveryType) {
      setDeliveryType(initialDeliveryType);
    }
  }, [initialDeliveryType, isOpen]);
  const [selectedDistrict, setSelectedDistrict] = useState(ARIQUEMES_DISTRICTS[2].id); // Setor 03 default
  const [streetAddress, setStreetAddress] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [reference, setReference] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix'); // 'pix' | 'cartao' | 'dinheiro' | 'misto'
  const [cardOption, setCardOption] = useState('credito'); // 'credito' | 'debito'
  const [cashChange, setCashChange] = useState('');
  const [splitMethod1, setSplitMethod1] = useState('pix'); // 'pix' | 'credito' | 'debito' | 'dinheiro'
  const [splitAmount1, setSplitAmount1] = useState('');
  const [splitMethod2, setSplitMethod2] = useState('credito'); // 'pix' | 'credito' | 'debito' | 'dinheiro'
  const [splitChange1, setSplitChange1] = useState('');
  const [splitChange2, setSplitChange2] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const currentDistrict = ARIQUEMES_DISTRICTS.find(d => d.id === selectedDistrict) || ARIQUEMES_DISTRICTS[0];
  const deliveryFee = deliveryType === 'delivery' ? currentDistrict.price : 0;
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const cardSettings = storeInfo?.cardMachineSettings || RESTAURANT_INFO.cardMachineSettings;
  const isCardFeeActive = cardSettings?.active !== false;
  const isSplitWithCard = paymentMethod === 'misto' && (splitMethod1 === 'credito' || splitMethod1 === 'debito' || splitMethod2 === 'credito' || splitMethod2 === 'debito');
  const splitCardType = (splitMethod1 === 'debito' || splitMethod2 === 'debito') ? 'debito' : 'credito';
  
  const cardFee = (paymentMethod === 'cartao' && isCardFeeActive && cardSettings?.autoAddToTotal)
    ? calculateCardMachineFee(subtotal, cardSettings, cardOption)
    : (isSplitWithCard && isCardFeeActive && cardSettings?.autoAddToTotal)
    ? calculateCardMachineFee(subtotal, cardSettings, splitCardType)
    : 0;
  const total = subtotal + deliveryFee + cardFee;

  const pixKey = activeBranch?.pixKey || storeInfo?.pixKey || RESTAURANT_INFO.pixKey || '69992228682';
  const rawRestaurantPhone = activeBranch?.whatsapp || activeBranch?.phone || storeInfo?.whatsapp || storeInfo?.phone || RESTAURANT_INFO.whatsapp || RESTAURANT_INFO.phone || '5569992228682';
  const restaurantPhone = cleanPhoneNumber(rawRestaurantPhone);

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
    const cleanPhoneDigits = customerPhone.replace(/\D/g, '');
    if (!cleanPhoneDigits || cleanPhoneDigits.length < 8) {
      setErrorMessage('Por favor, informe um WhatsApp válido com DDD (mínimo 8 ou 9 dígitos)!');
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
      if (item.pizzaSelections && item.pizzaSelections.length > 0) {
        desc = item.pizzaSelections.map(p => `\n   ↳ 🍕 *${p.pizzaTitle}:* ${p.flavors.join(' / ')}`).join('');
        if (item.bordaGratis) {
          desc += `\n   ↳ 🧀 Borda de Catupiry Grátis`;
        }
        if (item.acaiComplements && item.acaiComplements.length > 0) {
          desc += `\n   ↳ 🍧 *Acomp. Barca de Açaí:* ${item.acaiComplements.join(', ')}`;
        }
        if (item.acaiCobertura && item.acaiCobertura !== 'Sem Cobertura') {
          desc += `\n   ↳ 🍯 *Cobertura:* ${item.acaiCobertura}`;
        }
        if (item.notes) {
          desc += `\n   ↳ 📝 Obs: ${item.notes}`;
        }
      } else if (item.isCustomAcai || (item.acaiComplements && item.acaiComplements.length > 0)) {
        const comps = item.acaiComplements || item.complements || [];
        if (comps.length > 0) {
          desc = `\n   ↳ 🍧 *Acompanhamentos:* ${comps.join(', ')}`;
        }
        const cob = item.acaiCobertura || item.cobertura;
        if (cob && cob !== 'Sem Cobertura') {
          desc += `\n   ↳ 🍯 *Cobertura:* ${cob}`;
        }
        if (item.notes) {
          desc += `\n   ↳ 📝 Obs: ${item.notes}`;
        }
      } else if (item.flavors && item.flavors.length > 0) {
        desc = `\n   ↳ Sabores: ${item.flavors.join(' / ')}`;
        if (item.bordaGratis) {
          desc += ` (Borda Catupiry Grátis)`;
        }
        if (item.notes) {
          desc += ` - Obs: ${item.notes}`;
        }
      } else if (item.isCustomBox) {
        if (item.boxOptionTitle) {
          desc = `\n   ↳ ✨ *Opção:* ${item.boxOptionTitle}`;
          if (item.semSuinos) {
            desc += `\n   ↳ 🚫 *SEM SUÍNOS:* Sim (Sem porco / bacon / calabresa)`;
          }
          if (item.notes) {
            desc += `\n   ↳ 📝 *Obs:* ${item.notes}`;
          }
        } else if (item.isSortido) {
          desc = `\n   ↳ 🎲 *Sabores:* Sortido especial da casa (selecionado pela equipe)`;
          if (item.semSuinos) {
            desc += `\n   ↳ 🚫 *SEM SUÍNOS:* Sim (Sem porco / bacon / calabresa)`;
          }
        } else {
          const salgText = Object.entries(item.salgadasDetails || {}).map(([f, q]) => `${q}x ${f}`).join(', ');
          const docesText = Object.entries(item.docesDetails || {}).map(([f, q]) => `${q}x ${f}`).join(', ');
          desc = `\n   ↳ 🥟 Salgadas: ${salgText}\n   ↳ 🍫 Doces: ${docesText}`;
          if (item.semSuinos) {
            desc += `\n   ↳ 🚫 *SEM SUÍNOS:* Sim (Sem porco / bacon / calabresa)`;
          }
        }
      } else if (item.description && (item.isBox || item.isCombo)) {
        desc = `\n   ↳ ${item.description}`;
        if (item.semSuinos || item.semSuinosEsfirras) {
          desc += `\n   ↳ 🚫 *SEM SUÍNOS:* Sim (Sem porco / bacon / calabresa)`;
        }
      }
      return `${idx + 1}. *${item.quantity}x ${item.name}* - R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}${desc}`;
    }).join('\n');

    // Payment method text
    let paymentText = 'PIX';
    let formattedPaymentMethod = 'PIX Instantâneo';
    let resolvedChangeFor = null;
    let resolvedPaymentStatus = 'PENDENTE_COBRANCA';

    const getSplitLabel = (m) => {
      if (m === 'pix') return 'PIX';
      if (m === 'credito') return 'Cartão de Crédito';
      if (m === 'debito') return 'Cartão de Débito';
      if (m === 'dinheiro') return 'Dinheiro';
      return m;
    };

    if (paymentMethod === 'cartao') {
      const cardTypeLabel = cardOption === 'debito' ? 'Débito' : 'Crédito';
      paymentText = `Cartão de ${cardTypeLabel} (Levar maquininha)`;
      if (cardFee > 0) {
        paymentText += `\n   ↳ 💳 *Taxa Maquininha:* + R$ ${cardFee.toFixed(2).replace('.', ',')}`;
      }
      if (isCardFeeActive) {
        const noticeMsg = getCardMachineNoticeText(cardSettings);
        if (noticeMsg) {
          paymentText += `\n   ↳ ⚠️ *Aviso Taxa:* ${noticeMsg.replace(/⚠️\s*/g, '').trim()}`;
        }
      }
      formattedPaymentMethod = `Cartão de ${cardTypeLabel}${cardFee > 0 ? ` (Taxa +R$ ${cardFee.toFixed(2).replace('.', ',')})` : ''}`;
      resolvedPaymentStatus = 'PENDENTE_COBRANCA';
    } else if (paymentMethod === 'dinheiro') {
      paymentText = `Dinheiro ${cashChange ? `(Troco para R$ ${cashChange})` : '(Sem troco)'}`;
      formattedPaymentMethod = `Dinheiro ${cashChange ? `(Troco p/ R$ ${cashChange})` : ''}`;
      resolvedChangeFor = cashChange ? Number(String(cashChange).replace(',', '.')) : null;
      resolvedPaymentStatus = 'PENDENTE_COBRANCA';
    } else if (paymentMethod === 'pix') {
      paymentText = 'PIX';
      formattedPaymentMethod = 'PIX Instantâneo';
      resolvedPaymentStatus = 'PAGO_APROVADO';
    } else if (paymentMethod === 'misto') {
      const rawVal1 = parseFloat(String(splitAmount1).replace(',', '.')) || (total / 2);
      const val1 = Math.min(Math.max(0.01, rawVal1), total - 0.01);
      const val2 = Math.max(0, total - val1);

      const m1Label = getSplitLabel(splitMethod1);
      const m2Label = getSplitLabel(splitMethod2);
      const troco1Text = (splitMethod1 === 'dinheiro' && splitChange1) ? ` (Troco p/ R$ ${splitChange1})` : '';
      const troco2Text = (splitMethod2 === 'dinheiro' && splitChange2) ? ` (Troco p/ R$ ${splitChange2})` : '';

      paymentText = `2 Formas de Pagamento (Misto):\n   ↳ 1ª: R$ ${val1.toFixed(2).replace('.', ',')} no ${m1Label}${troco1Text}\n   ↳ 2ª: R$ ${val2.toFixed(2).replace('.', ',')} no ${m2Label}${troco2Text}`;
      if (cardFee > 0) {
        paymentText += `\n   ↳ 💳 *Taxa Maquininha:* + R$ ${cardFee.toFixed(2).replace('.', ',')}`;
      }
      if (splitMethod1 === 'credito' || splitMethod1 === 'debito' || splitMethod2 === 'credito' || splitMethod2 === 'debito') {
        paymentText += `\n   ↳ 💳 *Maquininha:* Levar maquininha para parte em cartão`;
      }

      formattedPaymentMethod = `Misto: R$ ${val1.toFixed(2).replace('.', ',')} (${m1Label}${troco1Text}) + R$ ${val2.toFixed(2).replace('.', ',')} (${m2Label}${troco2Text})`;
      if (splitMethod1 === 'dinheiro' && splitChange1) {
        resolvedChangeFor = Number(String(splitChange1).replace(',', '.'));
      } else if (splitMethod2 === 'dinheiro' && splitChange2) {
        resolvedChangeFor = Number(String(splitChange2).replace(',', '.'));
      }
      resolvedPaymentStatus = (splitMethod1 === 'pix' && splitMethod2 === 'pix') ? 'PAGO_APROVADO' : 'PENDENTE_COBRANCA';
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
🏢 *Local:* ${activeBranch?.address || 'Rua Maceió, 2333 - Setor 03, Ariquemes - RO'}
🛵 *Taxa:* Grátis (Retirada)`;
    }

    // Full WhatsApp Message
    const branchDisplayName = activeBranch?.displayName || activeBranch?.name || 'Ariquemes - RO';
    const hasPixPayment = paymentMethod === 'pix' || (paymentMethod === 'misto' && (splitMethod1 === 'pix' || splitMethod2 === 'pix'));
    const whatsappMessage = 
`🍕 *NOVO PEDIDO - EL SHADDAY DELIVERY*
🆔 *Pedido:* #${orderId}
📍 *Unidade:* ${branchDisplayName}
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
${cardFee > 0 ? `💳 *Taxa Maquininha (${cardOption === 'debito' ? 'Débito' : 'Crédito'}):* R$ ${cardFee.toFixed(2).replace('.', ',')}\n` : ''}🛵 *Taxa de Entrega:* ${deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2).replace('.', ',')}` : 'Grátis'}
💳 *TOTAL A PAGAR: R$ ${total.toFixed(2).replace('.', ',')}*
💵 *Forma de Pagamento:* ${paymentText}
${hasPixPayment ? `\n⚠️ *COMPROVANTE DO PIX:* Segue em anexo nesta conversa!\n(Chave Pix utilizada: ${pixKey})` : ''}
----------------------------------------
Pedido gerado via Cardápio Digital El Shadday.`;

    const encoded = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${restaurantPhone}?text=${encoded}`;

    const orderData = {
      orderId,
      branchId: activeBranch?.id || 'ariquemes',
      branchName: activeBranch?.displayName || activeBranch?.name || 'Unidade Ariquemes',
      createdAt: new Date().toISOString(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryType,
      deliveryAddress: {
        street: deliveryType === 'delivery' ? streetAddress.trim() : (activeBranch?.address || 'Rua Maceió, 2333 - Setor 03, Ariquemes - RO'),
        address: deliveryType === 'delivery' ? streetAddress.trim() : (activeBranch?.address || 'Rua Maceió, 2333 - Setor 03, Ariquemes - RO'),
        number: addressNumber.trim(),
        district: deliveryType === 'delivery' ? currentDistrict.name : 'Balcão',
        reference: reference.trim(),
        isPickup: deliveryType === 'balcao'
      },
      district: deliveryType === 'delivery' ? currentDistrict.name : 'Balcão',
      address: deliveryType === 'delivery' 
        ? `${streetAddress.trim()}${addressNumber.trim() ? `, Nº ${addressNumber.trim()}` : ''}`
        : (activeBranch?.address || 'Rua Maceió, 2333 - Setor 03, Ariquemes - RO'),
      number: addressNumber.trim(),
      reference: reference.trim(),
      notes: orderNotes.trim(),
      subtotal,
      deliveryFee,
      cardFee,
      total,
      paymentMethod: formattedPaymentMethod,
      paymentStatus: resolvedPaymentStatus,
      changeFor: resolvedChangeFor,
      cashChange: resolvedChangeFor,
      orderStatus: 'RECEBIDO_COZINHA',
      status: 'RECEBIDO_COZINHA',
      pixKey,
      whatsappUrl,
      items: cartItems
    };

    // Save order in local history
    try {
      recordCustomerFromOrder(orderData);
      const history = JSON.parse(localStorage.getItem('el_shadday_orders_history') || '[]');
      localStorage.setItem('el_shadday_orders_history', JSON.stringify([orderData, ...history]));
    } catch (e) {}

    // Notify parent to open OrderSuccessModal and dispatch to Kitchen across all channels
    onOrderFinished(orderData);

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-dark-950/80 backdrop-blur-sm flex justify-end animate-fade-in">
      <div className="relative w-full max-w-lg bg-dark-900 border-l border-dark-800 shadow-2xl flex flex-col h-full max-h-[100dvh] overflow-hidden">
        
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
                <span className="text-brand-gold font-medium">{activeBranch?.displayName || activeBranch?.name || 'Unidade Ariquemes'}</span>
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
                      {item.pizzaSelections && item.pizzaSelections.length > 0 ? (
                        <div className="mt-1 space-y-0.5 bg-dark-950/70 p-2 rounded-lg border border-dark-800">
                          {item.pizzaSelections.map((p, pIdx) => (
                            <p key={pIdx} className="text-[11px] text-brand-gold font-medium leading-tight">
                              🍕 <strong className="text-white">{p.pizzaTitle}:</strong> {p.flavors.join(' / ')}
                            </p>
                          ))}
                          {item.acaiComplements && item.acaiComplements.length > 0 && (
                            <p className="text-[11px] text-purple-300 font-medium leading-tight mt-1 pt-1 border-t border-dark-800">
                              🍧 <strong className="text-white">Barca de Açaí:</strong> {item.acaiComplements.join(', ')}
                              {item.acaiCobertura && item.acaiCobertura !== 'Sem Cobertura' && (
                                <span className="text-purple-200"> • Cobertura: {item.acaiCobertura}</span>
                              )}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-[10px] text-slate-400 italic mt-0.5">
                              Obs: {item.notes}
                            </p>
                          )}
                        </div>
                      ) : (item.isCustomAcai || (item.acaiComplements && item.acaiComplements.length > 0)) ? (
                        <div className="mt-1 bg-purple-950/40 p-2 rounded-lg border border-purple-800/40 space-y-0.5">
                          <p className="text-[11px] text-purple-200 font-medium leading-tight">
                            🍧 <strong className="text-white">Acompanhamentos:</strong> {(item.acaiComplements || item.complements || []).join(', ')}
                          </p>
                          {(item.acaiCobertura || item.cobertura) && (item.acaiCobertura || item.cobertura) !== 'Sem Cobertura' && (
                            <p className="text-[10px] text-purple-300">
                              🍯 <strong className="text-white">Cobertura:</strong> {item.acaiCobertura || item.cobertura}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-[10px] text-slate-400 italic mt-0.5">
                              Obs: {item.notes}
                            </p>
                          )}
                        </div>
                      ) : (
                        <>
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
                        </>
                      )}

                      {/* Sem Suinos Badge */}
                      {(item.semSuinos || item.semSuinosEsfirras) && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                            🚫 Opção Sem Carne Suína
                          </span>
                        </div>
                      )}

                      {/* Box Flavors Details */}
                      {item.isCustomBox && (
                        <div className="mt-1 text-[11px] text-amber-300 font-medium bg-dark-950 p-2 rounded-lg border border-brand-gold/30 space-y-0.5">
                          {item.boxOptionTitle ? (
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>✨</span>
                              <span>{item.boxOptionTitle}</span>
                            </div>
                          ) : item.isSortido ? (
                            <div className="flex items-center gap-1.5">
                              <span>🎲</span>
                              <span>Sortido da Casa (sabores variados pela equipe){item.semSuinos ? ' • Sem suínos' : ''}</span>
                            </div>
                          ) : item.salgadasDetails ? (
                            <div className="text-[10px] text-slate-400 space-y-0.5">
                              <p><strong className="text-white">Salgadas:</strong> {Object.entries(item.salgadasDetails).map(([f, q]) => `${q}x ${f}`).join(', ')}</p>
                              <p><strong className="text-white">Doces:</strong> {Object.entries(item.docesDetails || {}).map(([f, q]) => `${q}x ${f}`).join(', ')}</p>
                            </div>
                          ) : null}
                          {item.notes && (
                            <p className="text-[10px] text-slate-300 italic">Obs: {item.notes}</p>
                          )}
                        </div>
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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('misto');
                      if (!splitAmount1) {
                        setSplitAmount1((total / 2).toFixed(2));
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'misto'
                        ? 'bg-brand-gold text-dark-950 border-brand-gold shadow-glow-gold'
                        : 'bg-dark-950 text-slate-300 border-dark-800 hover:border-dark-700'
                    }`}
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>2 Formas</span>
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

                {/* Cartão Info & Aviso de Taxa */}
                {paymentMethod === 'cartao' && (
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-dark-950 border border-dark-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-brand-gold" />
                          Tipo de Cartão na Maquininha:
                        </span>
                        <div className="flex items-center gap-1 bg-dark-900 p-0.5 rounded-lg border border-dark-750">
                          <button
                            type="button"
                            onClick={() => setCardOption('debito')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                              cardOption === 'debito'
                                ? 'bg-brand-gold text-dark-950 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Débito
                          </button>
                          <button
                            type="button"
                            onClick={() => setCardOption('credito')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                              cardOption === 'credito'
                                ? 'bg-brand-gold text-dark-950 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Crédito
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-tight">
                        O entregador levará a máquina de cartão até você para pagamento na entrega.
                      </p>
                    </div>

                    {isCardFeeActive && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-bold text-amber-400 text-xs">
                          <span className="flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            Aviso de Taxa da Maquininha:
                          </span>
                          {cardFee > 0 && (
                            <span className="font-mono bg-amber-400/20 px-2 py-0.5 rounded text-amber-300 font-extrabold text-[11px]">
                              + R$ {cardFee.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] leading-relaxed text-amber-200/90 whitespace-pre-line">
                          {getCardMachineNoticeText(cardSettings)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2 Formas (Misto / Dividir) Box */}
                {paymentMethod === 'misto' && (() => {
                  const val1 = parseFloat(String(splitAmount1).replace(',', '.')) || (total / 2);
                  const val2 = Math.max(0, total - val1);
                  return (
                    <div className="bg-dark-950/80 p-3.5 rounded-2xl border border-brand-gold/40 space-y-3.5 animate-fade-in">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Shuffle className="w-3.5 h-3.5 text-brand-gold" />
                          <span>Dividir em 2 Formas de Pagamento</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setSplitAmount1((total / 2).toFixed(2))}
                          className="text-[10px] font-black px-2 py-1 rounded-lg bg-brand-gold/15 hover:bg-brand-gold/25 border border-brand-gold/40 text-brand-gold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>50% Metade (R$ {(total / 2).toFixed(2).replace('.', ',')} cada)</span>
                        </button>
                      </div>

                      {/* 1ª Forma */}
                      <div className="p-3 rounded-xl bg-dark-900 border border-dark-800 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-1.5">
                          <span className="text-xs font-bold text-slate-200">
                            1ª Forma:
                          </span>
                          <div className="flex items-center gap-1">
                            {[
                              { id: 'pix', label: 'PIX' },
                              { id: 'credito', label: 'Crédito' },
                              { id: 'debito', label: 'Débito' },
                              { id: 'dinheiro', label: 'Dinheiro' }
                            ].map(opt => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setSplitMethod1(opt.id)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                  splitMethod1 === opt.id
                                    ? 'bg-brand-gold text-dark-950'
                                    : 'bg-dark-950 text-slate-400 hover:text-white border border-dark-800'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-semibold text-slate-400 flex-shrink-0">
                            Valor 1ª forma:
                          </label>
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              max={total}
                              placeholder={(total / 2).toFixed(2)}
                              value={splitAmount1}
                              onChange={(e) => setSplitAmount1(e.target.value)}
                              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-dark-950 border border-dark-800 text-white text-xs font-bold focus:border-brand-gold focus:outline-none"
                            />
                          </div>
                        </div>

                        {splitMethod1 === 'dinheiro' && (
                          <div className="pt-1">
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                              Precisa de troco na 1ª forma? (Dinheiro)
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Troco para R$ 50,00"
                              value={splitChange1}
                              onChange={(e) => setSplitChange1(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-dark-950 border border-dark-800 text-white text-xs placeholder-slate-500 focus:border-brand-gold focus:outline-none"
                            />
                          </div>
                        )}
                      </div>

                      {/* 2ª Forma */}
                      <div className="p-3 rounded-xl bg-dark-900 border border-dark-800 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-1.5">
                          <span className="text-xs font-bold text-slate-200">
                            2ª Forma:
                          </span>
                          <div className="flex items-center gap-1">
                            {[
                              { id: 'credito', label: 'Crédito' },
                              { id: 'debito', label: 'Débito' },
                              { id: 'pix', label: 'PIX' },
                              { id: 'dinheiro', label: 'Dinheiro' }
                            ].map(opt => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setSplitMethod2(opt.id)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                  splitMethod2 === opt.id
                                    ? 'bg-brand-gold text-dark-950'
                                    : 'bg-dark-950 text-slate-400 hover:text-white border border-dark-800'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-dark-950 border border-dark-850">
                          <span className="text-[11px] font-semibold text-slate-400">
                            Valor restante da 2ª forma:
                          </span>
                          <span className="text-xs font-black text-brand-gold font-mono">
                            R$ {val2.toFixed(2).replace('.', ',')}
                          </span>
                        </div>

                        {splitMethod2 === 'dinheiro' && (
                          <div className="pt-1">
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                              Precisa de troco na 2ª forma? (Dinheiro)
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Troco para R$ 50,00"
                              value={splitChange2}
                              onChange={(e) => setSplitChange2(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-dark-950 border border-dark-800 text-white text-xs placeholder-slate-500 focus:border-brand-gold focus:outline-none"
                            />
                          </div>
                        )}
                      </div>

                      {/* Pix Key Box if either split option is Pix */}
                      {(splitMethod1 === 'pix' || splitMethod2 === 'pix') && (
                        <div className="bg-gradient-to-r from-amber-500/10 to-brand-gold/15 p-3 rounded-xl border border-brand-gold/40 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                              <QrCode className="w-3.5 h-3.5 text-brand-gold" />
                              <span>Chave PIX (Celular):</span>
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
                            💡 Faça o PIX referente a sua parte e envie o comprovante no WhatsApp!
                          </p>
                        </div>
                      )}

                      {/* Card notice if either is card */}
                      {(splitMethod1 === 'credito' || splitMethod1 === 'debito' || splitMethod2 === 'credito' || splitMethod2 === 'debito') && (
                        <p className="text-[10px] text-slate-400 leading-tight bg-dark-900/60 p-2 rounded-lg border border-dark-850">
                          💳 O entregador levará a máquina de cartão para receber a parte do cartão na entrega.
                        </p>
                      )}
                    </div>
                  );
                })()}

              </div>

            </div>
          )}

        </div>

        {/* Drawer Footer with Totals and WhatsApp Finalize Button */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 pb-8 sm:pb-5 border-t border-dark-800 bg-dark-950 space-y-3">
            
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

              {(paymentMethod === 'cartao' || isSplitWithCard) && cardFee > 0 && (
                <div className="flex items-center justify-between text-amber-300 font-semibold">
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    Taxa da Maquininha:
                  </span>
                  <span className="font-bold">+ R$ {cardFee.toFixed(2).replace('.', ',')}</span>
                </div>
              )}

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
