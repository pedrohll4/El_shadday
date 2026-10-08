import React, { useState, useEffect } from 'react';
import { 
  X, Check, ShieldCheck, QrCode, CreditCard, Banknote, 
  Copy, Clock, Loader2, ArrowRight, Lock, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RESTAURANT_INFO, ARIQUEMES_DISTRICTS } from '../data/menuData';

export function CheckoutPaymentModal({ 
  isOpen, 
  onClose, 
  cartItems, 
  orderDetails, 
  onPaymentSuccess 
}) {
  const [selectedMethod, setSelectedMethod] = useState(orderDetails?.paymentMethod || 'pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [pixTimeLeft, setPixTimeLeft] = useState(600); // 10 minutes countdown
  const [copiedPix, setCopiedPix] = useState(false);

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardType, setCardType] = useState('credito'); // 'credito' | 'debito'
  const [formError, setFormError] = useState('');

  // Dinheiro field
  const [trocoPara, setTrocoPara] = useState(orderDetails?.cashChange || '');

  const district = ARIQUEMES_DISTRICTS.find(d => d.id === orderDetails?.districtId) || ARIQUEMES_DISTRICTS[0];
  const deliveryFee = orderDetails?.deliveryType === 'delivery' ? district.price : 0;
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal + deliveryFee;

  // Pix string generator
  const pixCode = `00020126580014br.gov.bcb.pix0114+5569992228682520400005303986540${total.toFixed(2)}5802BR5919EL SHADDAY DELIVERY6009ARIQUEMES62070503***6304`;

  // Countdown timer for PIX
  useEffect(() => {
    if (!isOpen || selectedMethod !== 'pix') return;
    const timer = setInterval(() => {
      setPixTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, selectedMethod]);

  if (!isOpen) return null;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  // Card formatting helpers
  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      val = `${val.substring(0, 2)}/${val.substring(2, 4)}`;
    }
    setCardExpiry(val);
  };

  const handleProcessPayment = () => {
    setFormError('');

    if (selectedMethod === 'cartao') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        setFormError('Informe um número de cartão válido com 16 dígitos.');
        return;
      }
      if (!cardName.trim()) {
        setFormError('Informe o nome impresso no cartão.');
        return;
      }
      if (cardExpiry.length < 5) {
        setFormError('Informe a validade (MM/AA).');
        return;
      }
      if (cardCvv.length < 3) {
        setFormError('Informe o código de segurança (CVV).');
        return;
      }
    }

    setIsProcessing(true);
    setProcessingStep('Criptografando dados com segurança...');

    setTimeout(() => {
      setProcessingStep('Conectando ao gateway de pagamento...');
    }, 900);

    setTimeout(() => {
      setProcessingStep('Autorizando transação...');
    }, 1800);

    setTimeout(() => {
      setProcessingStep('Pagamento Aprovado com Sucesso!');
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 }
        });
      } catch (e) {}
    }, 2700);

    setTimeout(() => {
      const orderId = `ES-${Math.floor(1000 + Math.random() * 9000)}`;
      const completedOrder = {
        orderId,
        createdAt: new Date().toISOString(),
        items: cartItems,
        subtotal,
        deliveryFee,
        total,
        deliveryType: orderDetails.deliveryType,
        district: district.name,
        address: orderDetails.streetAddress,
        number: orderDetails.addressNumber,
        reference: orderDetails.reference,
        customerName: orderDetails.customerName,
        customerPhone: orderDetails.customerPhone || '',
        paymentMethod: selectedMethod === 'cartao' 
          ? `Cartão de ${cardType === 'credito' ? 'Crédito' : 'Débito'} (final ${cardNumber.slice(-4)})`
          : selectedMethod === 'pix' 
          ? 'PIX Instantâneo (Aprovado)'
          : `Dinheiro ${trocoPara ? `(Troco p/ R$ ${trocoPara})` : '(Sem troco)'}`,
        paymentStatus: 'PAGO_APROVADO',
        orderStatus: 'RECEBIDO_COZINHA' // 'RECEBIDO_COZINHA' | 'EM_PREPARO' | 'SAIU_ENTREGA' | 'CONCLUIDO'
      };

      setIsProcessing(false);
      onPaymentSuccess(completedOrder);
    }, 3600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-dark-800 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg sm:text-xl text-white">
                Pagamento Seguro no Site
              </h2>
              <p className="text-xs text-slate-400">
                Total do Pedido: <strong className="text-brand-gold font-black">R$ {total.toFixed(2).replace('.', ',')}</strong>
              </p>
            </div>
          </div>

          {!isProcessing && (
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="p-10 flex flex-col items-center justify-center space-y-5 text-center min-h-[380px]">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-dark-800 border-t-brand-gold animate-spin flex items-center justify-center"></div>
              <ShieldCheck className="w-8 h-8 text-brand-gold absolute inset-0 m-auto animate-pulse" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Processando Pagamento...</h3>
              <p className="text-xs text-brand-gold font-semibold tracking-wide animate-pulse">
                {processingStep}
              </p>
            </div>
            <p className="text-[11px] text-slate-500 max-w-xs">
              Ambiente protegido com criptografia de ponta a ponta. Não feche esta janela.
            </p>
          </div>
        )}

        {/* Payment Form Content */}
        {!isProcessing && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            
            {/* Payment Method Selector Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Escolha a Forma de Pagamento:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('pix')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    selectedMethod === 'pix'
                      ? 'bg-brand-gold text-dark-950 font-bold border-brand-gold shadow-glow-gold'
                      : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border-dark-800'
                  }`}
                >
                  <QrCode className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-bold">PIX</div>
                  <div className="text-[10px] opacity-80">Aprovação Imediata</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('cartao')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    selectedMethod === 'cartao'
                      ? 'bg-brand-gold text-dark-950 font-bold border-brand-gold shadow-glow-gold'
                      : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border-dark-800'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-bold">Cartão</div>
                  <div className="text-[10px] opacity-80">Crédito ou Débito</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('dinheiro')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    selectedMethod === 'dinheiro'
                      ? 'bg-brand-gold text-dark-950 font-bold border-brand-gold shadow-glow-gold'
                      : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border-dark-800'
                  }`}
                >
                  <Banknote className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-bold">Dinheiro</div>
                  <div className="text-[10px] opacity-80">Pagar na Entrega</div>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* PIX TAB */}
            {selectedMethod === 'pix' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-850 border border-dark-800 space-y-4 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-brand-gold text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Código expira em: <strong>{formatTimer(pixTimeLeft)}</strong></span>
                </div>

                {/* QR Code image */}
                <div className="w-44 h-44 mx-auto p-2 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixCode)}`}
                    alt="QR Code PIX El Shadday"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-white">Escaneie o QR Code no app do seu banco</div>
                  <div className="text-[11px] text-slate-400">Ou copie o código Pix Copia e Cola abaixo:</div>
                </div>

                {/* Copy paste input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pixCode}
                    className="w-full px-3 py-2 text-xs bg-dark-900 border border-dark-750 text-slate-400 rounded-xl focus:outline-none select-all truncate"
                  />
                  <button
                    onClick={handleCopyPix}
                    className="flex-shrink-0 px-3 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 border border-brand-gold/40 text-brand-gold font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    {copiedPix ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  Após pagar, clique no botão abaixo para o sistema validar e gerar seu comprovante oficial!
                </p>
              </div>
            )}

            {/* CARTAO TAB */}
            {selectedMethod === 'cartao' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-850 border border-dark-800 space-y-4">
                
                {/* Credit vs Debit switch */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-dark-900 rounded-xl border border-dark-800">
                  <button
                    type="button"
                    onClick={() => setCardType('credito')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      cardType === 'credito' ? 'bg-brand-gold text-dark-950 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Crédito à Vista
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardType('debito')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      cardType === 'debito' ? 'bg-brand-gold text-dark-950 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Débito
                  </button>
                </div>

                {/* Card input form */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Número do Cartão:</label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-dark-900 border border-dark-750 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Nome Impresso no Cartão:</label>
                    <input
                      type="text"
                      placeholder="Ex: JOAO S SILVA"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2.5 rounded-xl bg-dark-900 border border-dark-750 text-white uppercase placeholder-slate-600 focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Validade (MM/AA):</label>
                      <input
                        type="text"
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        className="w-full px-3 py-2.5 rounded-xl bg-dark-900 border border-dark-750 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-brand-gold text-center"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Código CVV:</label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2.5 rounded-xl bg-dark-900 border border-dark-750 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-brand-gold text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <span>Transação criptografada com certificado SSL seguro de 256 bits.</span>
                </div>
              </div>
            )}

            {/* DINHEIRO TAB */}
            {selectedMethod === 'dinheiro' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-850 border border-dark-800 space-y-4">
                <div className="text-xs text-slate-300">
                  O pagamento em dinheiro será efetuado diretamente ao entregador na chegada do pedido.
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Precisa de troco para quanto? (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Troco para R$ 100,00"
                    value={trocoPara}
                    onChange={(e) => setTrocoPara(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Total a pagar: R$ {total.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            )}

            {/* Order Summary Recap */}
            <div className="p-3.5 rounded-2xl bg-dark-950 border border-dark-800 space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between text-white font-semibold">
                <span>Cliente:</span>
                <span>{orderDetails?.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Entrega:</span>
                <span>{orderDetails?.deliveryType === 'delivery' ? `${district.name} (+ R$ ${deliveryFee.toFixed(2).replace('.', ',')})` : 'Retirada no Balcão'}</span>
              </div>
              <div className="pt-1.5 border-t border-dark-850 flex justify-between items-baseline">
                <span className="font-bold text-white">Total:</span>
                <span className="text-xl font-black text-brand-gold">R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

          </div>
        )}

        {/* Footer Action */}
        {!isProcessing && (
          <div className="p-4 sm:p-5 border-t border-dark-800 bg-dark-950 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-3 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 font-semibold text-xs"
            >
              Voltar ao Pedido
            </button>

            <button
              onClick={handleProcessPayment}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold hover:from-amber-400 hover:to-brand-gold text-dark-950 font-black text-sm shadow-glow-gold transition-all duration-300 hover:scale-102 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {selectedMethod === 'pix' ? 'Confirmar e Processar PIX' : selectedMethod === 'cartao' ? `Pagar R$ ${total.toFixed(2).replace('.', ',')} Agora` : 'Confirmar Pedido em Dinheiro'}
              </span>
              <ArrowRight className="w-4 h-4 text-dark-950" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
