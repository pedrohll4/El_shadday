import React from 'react';
import { X, ReceiptText, ChevronRight } from 'lucide-react';

const STATUS_LABEL = {
  RECEBIDO_COZINHA: { text: 'Recebido', cls: 'bg-amber-500/15 text-amber-300' },
  EM_PREPARO: { text: 'Em preparo', cls: 'bg-brand-gold/15 text-brand-goldLight' },
  PRONTO_BALCAO: { text: 'Pronto para retirar', cls: 'bg-emerald-500/15 text-emerald-300' },
  SAIU_ENTREGA: { text: 'Saiu para entrega', cls: 'bg-blue-500/15 text-blue-300' },
  CONCLUIDO: { text: 'Concluído', cls: 'bg-dark-800 text-slate-300' },
  CANCELADO: { text: 'Cancelado', cls: 'bg-red-500/15 text-red-300' }
};

const money = (v) => `R$ ${(Number(v) || 0).toFixed(2).replace('.', ',')}`;

const formatDate = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
};

// "Meus pedidos": pedidos feitos neste celular, com o status mais recente que tivermos
export function MyOrdersSheet({ isOpen, onClose, orders, liveOrders, onSelectOrder }) {
  if (!isOpen) return null;

  const liveById = {};
  (liveOrders || []).forEach(o => { if (o?.orderId) liveById[o.orderId] = o; });

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-dark-900 border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col animate-sheet-up">
        <div className="px-5 pt-5 pb-3 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Meus pedidos</h3>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-dark-800 text-slate-300 flex items-center justify-center cursor-pointer" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {(!orders || orders.length === 0) ? (
            <div className="py-14 text-center">
              <ReceiptText className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="mt-3 text-sm text-slate-300 font-semibold">Você ainda não fez pedidos por aqui</p>
              <p className="text-xs text-slate-500 mt-1">Quando fizer, ele aparece nesta lista.</p>
            </div>
          ) : (
            orders.slice(0, 30).map(ord => {
              const live = liveById[ord.orderId] || ord;
              const st = STATUS_LABEL[live.orderStatus || live.status] || STATUS_LABEL.RECEBIDO_COZINHA;
              const count = (ord.items || []).reduce((a, i) => a + (i.quantity || 1), 0);
              return (
                <button
                  key={ord.orderId}
                  type="button"
                  onClick={() => { onSelectOrder(ord); onClose(); }}
                  className="w-full text-left p-3.5 rounded-2xl bg-dark-850 border border-white/5 flex items-center gap-3 cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white">Pedido #{ord.orderNumber || ord.orderId}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${st.cls}`}>{st.text}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDate(ord.createdAt)} • {count} {count === 1 ? 'item' : 'itens'} • <span className="text-slate-200 font-semibold">{money(ord.total)}</span>
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
