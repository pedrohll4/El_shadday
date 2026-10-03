import React, { useState } from 'react';
import { 
  CheckCircle2, Clock, MapPin, Phone, Send, Copy, 
  Check, ArrowLeft, Printer, ShieldCheck, Flame, Package, ExternalLink
} from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';

export function OrderConfirmationView({ order, onBackToMenu }) {
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!order) return null;

  const handleSendToWhatsApp = () => {
    let message = `*✅ COMPROVANTE DE PEDIDO PAGO - EL SHADDAY*\n`;
    message += `*Nº DO PEDIDO:* #${order.orderId}\n`;
    message += `--------------------------------------\n`;
    message += `👤 *Cliente:* ${order.customerName}\n`;
    message += `💳 *Status de Pagamento:* ${order.paymentStatus === 'PAGO_APROVADO' ? '✅ PAGO E APROVADO NO SITE' : 'PAGAMENTO NA ENTREGA'}\n`;
    message += `💵 *Forma:* ${order.paymentMethod}\n`;
    message += `🛵 *Tipo:* ${order.deliveryType === 'delivery' ? 'Entrega em Domicílio' : 'Retirada no Balcão'}\n`;

    if (order.deliveryType === 'delivery') {
      message += `📍 *Bairro/Setor:* ${order.district}\n`;
      message += `🏠 *Endereço:* ${order.address}, Nº ${order.number || 'S/N'}\n`;
      if (order.reference) {
        message += `🧭 *Referência:* ${order.reference}\n`;
      }
    } else {
      message += `📍 *Retirada:* R. Maceió, 2333 - Setor 03 (Balcão)\n`;
    }

    message += `\n*ITENS CONFIRMADOS:*\n`;
    order.items.forEach((item, index) => {
      message += `\n${index + 1}. *${item.quantity}x ${item.name}* - R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}\n`;
      if (item.isCustomBox) {
        if (item.salgadasDetails && Object.keys(item.salgadasDetails).length > 0) {
          const salgParts = Object.entries(item.salgadasDetails).map(([flv, qty]) => `${qty}x ${flv}`);
          message += `   🥟 Salgadas: ${salgParts.join(', ')}\n`;
        }
        if (item.docesDetails && Object.keys(item.docesDetails).length > 0) {
          const docesParts = Object.entries(item.docesDetails).map(([flv, qty]) => `${qty}x ${flv}`);
          message += `   🍫 Doces: ${docesParts.join(', ')}\n`;
        }
      }
      if (item.notes) {
        message += `   📝 Obs: ${item.notes}\n`;
      }
    });

    message += `\n--------------------------------------\n`;
    message += `💵 *Subtotal:* R$ ${order.subtotal.toFixed(2).replace('.', ',')}\n`;
    if (order.deliveryType === 'delivery') {
      message += `🛵 *Taxa de Entrega:* R$ ${order.deliveryFee.toFixed(2).replace('.', ',')} (${order.district})\n`;
    }
    message += `💰 *TOTAL PAGO:* R$ ${order.total.toFixed(2).replace('.', ',')}\n`;
    message += `⏰ *Data/Hora:* ${new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n`;
    message += `--------------------------------------\n`;
    message += `_Comprovante emitido pelo sistema digital El Shadday Ariquemes._`;

    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${RESTAURANT_INFO.phone}?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopySummary = () => {
    const text = `Pedido #${order.orderId} - Total: R$ ${order.total.toFixed(2).replace('.', ',')} - Cliente: ${order.customerName}`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-dark-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Top return button */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToMenu}
            className="inline-flex items-center gap-2 text-xs font-bold text-brand-gold hover:text-amber-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Cardápio</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-dark-900 hover:bg-dark-850 border border-dark-800 text-slate-400 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
              title="Imprimir Comprovante"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              onClick={handleCopySummary}
              className="p-2 rounded-xl bg-dark-900 hover:bg-dark-850 border border-dark-800 text-slate-400 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
              title="Copiar dados rápidos"
            >
              {copiedSummary ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copiedSummary ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Success Banner Card */}
        <div className="rounded-3xl bg-gradient-to-b from-dark-900 to-dark-850 border border-emerald-500/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center space-y-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg animate-bounce-subtle">
            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              Pagamento Processado com Sucesso
            </span>
            <h1 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight pt-2">
              Pedido Confirmado #{order.orderId}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Muito obrigado, <strong>{order.customerName}</strong>! Seu pedido já foi registrado no nosso sistema e enviado para a linha de produção.
            </p>
          </div>

          {/* WhatsApp Direct Action Button (THE HIGHLIGHT) */}
          <div className="pt-4 max-w-md mx-auto">
            <button
              onClick={handleSendToWhatsApp}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-dark-950 font-black text-sm sm:text-base shadow-lg transition-all duration-300 hover:scale-102 flex items-center justify-center gap-3 cursor-pointer"
            >
              <Send className="w-5 h-5 text-dark-950" />
              <span>Enviar Comprovante no WhatsApp da Pizzaria</span>
            </button>
            <p className="text-[11px] text-slate-400 mt-2">
              Clique acima para enviar o comprovante com 1 toque no WhatsApp da El Shadday e agilizar a saída da entrega!
            </p>
          </div>
        </div>

        {/* Live Order Timeline Tracker */}
        <div className="rounded-3xl bg-dark-900 border border-dark-800 p-6 space-y-4">
          <h3 className="font-display font-bold text-sm sm:text-base text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-gold" />
            Status do Pedido em Tempo Real
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Step 1 */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-dark-950 flex items-center justify-center font-bold text-xs flex-shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-400">1. Pago & Aprovado</div>
                <div className="text-[10px] text-slate-400">Confirmado pelo sistema</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-2xl bg-brand-gold/15 border border-brand-gold/40 flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-brand-gold text-dark-950 flex items-center justify-center font-bold text-xs flex-shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-brand-gold">2. Na Cozinha</div>
                <div className="text-[10px] text-slate-300">Esfirras no forno artesanal</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-2xl bg-dark-850 border border-dark-800 flex items-center gap-3 opacity-60">
              <div className="w-8 h-8 rounded-full bg-dark-800 text-slate-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                3
              </div>
              <div>
                <div className="text-xs font-bold text-white">3. Saiu para Entrega</div>
                <div className="text-[10px] text-slate-400">Tempo: {RESTAURANT_INFO.deliveryTime}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Itemized Receipt */}
        <div className="rounded-3xl bg-dark-900 border border-dark-800 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-dark-800 pb-4">
            <div>
              <h3 className="font-display font-bold text-base text-white">
                Comprovante Digital de Compra
              </h3>
              <p className="text-xs text-slate-400">
                Emitido em: {new Date(order.createdAt).toLocaleDateString('pt-BR')} às {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Forma de Pagamento:</span>
              <strong className="text-xs text-brand-gold">{order.paymentMethod}</strong>
            </div>
          </div>

          {/* Delivery & Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-dark-950 p-4 rounded-2xl border border-dark-850">
            <div>
              <span className="text-slate-500 block mb-0.5">Destinatário:</span>
              <strong className="text-white text-sm">{order.customerName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Modalidade:</span>
              <strong className="text-white">
                {order.deliveryType === 'delivery' ? `🛵 Entrega (${order.district})` : '🏪 Retirada no Balcão'}
              </strong>
            </div>
            {order.deliveryType === 'delivery' && (
              <div className="sm:col-span-2 pt-2 border-t border-dark-850">
                <span className="text-slate-500 block mb-0.5">Endereço de Entrega:</span>
                <span className="text-slate-200">
                  {order.address}, Nº {order.number || 'S/N'} • {order.district}, Ariquemes-RO
                  {order.reference && <span className="block text-brand-goldLight mt-0.5">Ref: {order.reference}</span>}
                </span>
              </div>
            )}
          </div>

          {/* Products Breakdown Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Itens do Pedido ({order.items.length})
            </h4>

            <div className="space-y-2.5">
              {order.items.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-xl bg-dark-850 border border-dark-800 flex items-start justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-white">
                      {item.quantity}x {item.name}
                    </div>
                    {item.isCustomBox && (
                      <div className="text-[11px] text-brand-goldLight space-y-0.5">
                        {item.salgadasDetails && (
                          <div>🥟 <strong>Salgadas:</strong> {Object.entries(item.salgadasDetails).map(([k, v]) => `${v}x ${k}`).join(', ')}</div>
                        )}
                        {item.docesDetails && (
                          <div>🍫 <strong>Doces:</strong> {Object.entries(item.docesDetails).map(([k, v]) => `${v}x ${k}`).join(', ')}</div>
                        )}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-[11px] text-slate-400 italic">
                        Obs: {item.notes}
                      </div>
                    )}
                  </div>

                  <span className="font-bold text-brand-gold text-sm flex-shrink-0 ml-3">
                    R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Totals */}
          <div className="border-t border-dark-800 pt-4 space-y-2 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="text-white font-medium">R$ {order.subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxa de Entrega:</span>
              <span className="text-white font-medium">
                {order.deliveryFee === 0 ? 'Grátis' : `R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}`}
              </span>
            </div>
            <div className="pt-2 border-t border-dark-800 flex justify-between items-baseline">
              <span className="text-sm font-bold text-white">Total Pago:</span>
              <span className="text-2xl font-black text-brand-gold">
                R$ {order.total.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

        </div>

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <button
            onClick={onBackToMenu}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-dark-900 hover:bg-dark-850 text-slate-200 border border-dark-800 hover:border-brand-gold font-bold text-xs transition-all cursor-pointer"
          >
            Fazer Novo Pedido
          </button>

          <button
            onClick={handleSendToWhatsApp}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 text-dark-950" />
            <span>Enviar Comprovante ao WhatsApp</span>
          </button>
        </div>

      </div>
    </div>
  );
}
