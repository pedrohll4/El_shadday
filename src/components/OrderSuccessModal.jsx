import React, { useState } from 'react';
import { 
  CheckCircle2, X, MessageCircle, Copy, Check, 
  AlertCircle, Receipt, ArrowRight, ShieldCheck, Sparkles 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function OrderSuccessModal({ 
  isOpen, 
  onClose, 
  orderData, 
  onNewOrder 
}) {
  const [copiedPix, setCopiedPix] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [isOpen]);

  if (!isOpen || !orderData) return null;

  const handleCopyPix = () => {
    if (orderData.pixKey) {
      navigator.clipboard.writeText(orderData.pixKey);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    }
  };

  const handleOpenWhatsAppAgain = () => {
    if (orderData.whatsappUrl) {
      window.open(orderData.whatsappUrl, '_blank');
    }
  };

  const isPix = orderData.paymentMethod === 'pix';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-dark-700"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="pt-8 pb-5 px-6 text-center bg-gradient-to-b from-dark-950 to-dark-900 border-b border-dark-800">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Pedido Registrado com Sucesso
          </span>

          <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white mt-2">
            Seu Pedido foi Enviado!
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            A mensagem foi gerada e encaminhada para a cozinha da El Shadday no WhatsApp.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          
          {/* PIX RECEIPT NOTICE - KEY FEATURE */}
          {isPix && (
            <div className="bg-gradient-to-br from-amber-500/15 via-brand-gold/15 to-dark-900 border-2 border-brand-gold/60 rounded-2xl p-4 sm:p-5 space-y-3 shadow-glow-gold">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-gold/25 text-brand-gold flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                    <span>Atenção: Envie o Comprovante do PIX</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Para agilizar o preparo na cozinha, anexe o comprovante de pagamento diretamente na conversa do WhatsApp que foi aberta!
                  </p>
                </div>
              </div>

              {/* Pix Key Box */}
              <div className="bg-dark-950/90 rounded-xl p-3 border border-brand-gold/30 flex items-center justify-between gap-2">
                <div className="overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Chave PIX (Celular)
                  </span>
                  <span className="font-mono text-sm sm:text-base font-extrabold text-brand-gold select-all truncate block">
                    {orderData.pixKey || '69992228682'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    El Shadday Delivery
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPix}
                  className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 ${
                    copiedPix
                      ? 'bg-emerald-500 text-dark-950 shadow-md'
                      : 'bg-brand-gold hover:bg-amber-400 text-dark-950'
                  }`}
                >
                  {copiedPix ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Pix</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Quick Order Summary */}
          <div className="bg-dark-850/80 rounded-2xl p-4 border border-dark-800 space-y-3">
            <div className="flex items-center justify-between border-b border-dark-800 pb-2 text-xs">
              <span className="text-slate-400 font-medium">Código do Pedido:</span>
              <span className="font-mono font-bold text-white">#{orderData.orderId}</span>
            </div>

            <div className="flex items-center justify-between border-b border-dark-800 pb-2 text-xs">
              <span className="text-slate-400 font-medium">Cliente:</span>
              <span className="font-bold text-white">{orderData.customerName}</span>
            </div>

            <div className="flex items-center justify-between border-b border-dark-800 pb-2 text-xs">
              <span className="text-slate-400 font-medium">Tipo:</span>
              <span className="font-bold text-brand-gold">
                {orderData.deliveryType === 'delivery' ? '🛵 Delivery' : '🛍️ Retirada no Balcão'}
              </span>
            </div>

            {orderData.deliveryType === 'delivery' && (
              <div className="flex items-center justify-between border-b border-dark-800 pb-2 text-xs">
                <span className="text-slate-400 font-medium">Endereço:</span>
                <span className="text-white text-right max-w-[200px] truncate">
                  {orderData.address}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-dark-800 pb-2 text-xs">
              <span className="text-slate-400 font-medium">Forma de Pagamento:</span>
              <span className="font-bold text-white uppercase">{orderData.paymentMethod}</span>
            </div>

            <div className="flex items-center justify-between pt-1 text-sm">
              <span className="text-slate-300 font-bold">Total do Pedido:</span>
              <span className="font-extrabold text-base text-brand-gold">
                R$ {orderData.total?.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* WhatsApp Reopen Button */}
          <button
            type="button"
            onClick={handleOpenWhatsAppAgain}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-200 cursor-pointer active:scale-98"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Reabrir Conversa no WhatsApp</span>
          </button>

          {/* Start New Order */}
          <button
            type="button"
            onClick={() => {
              onNewOrder();
              onClose();
            }}
            className="w-full py-3 px-4 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white font-semibold text-xs border border-dark-700 transition-all cursor-pointer"
          >
            Fazer Novo Pedido
          </button>

        </div>

      </div>
    </div>
  );
}
