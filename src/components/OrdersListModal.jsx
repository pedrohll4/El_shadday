import React from 'react';
import { X, ReceiptText, Clock, ChevronRight, CheckCircle2, Send } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';

export function OrdersListModal({ isOpen, onClose, orders, onSelectOrder }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-dark-800 bg-dark-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg text-white">
                Meus Pedidos Realizados
              </h2>
              <p className="text-xs text-slate-400">
                Histórico de pedidos processados no site
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Nenhum pedido realizado recentemente.
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.orderId}
                onClick={() => {
                  onSelectOrder(ord);
                  onClose();
                }}
                className="p-4 rounded-2xl bg-dark-850 hover:bg-dark-800 border border-dark-800 hover:border-brand-gold/40 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white group-hover:text-brand-gold transition-colors">
                      #{ord.orderId}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      PAGO NO SITE
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {ord.items.length} itens • R$ {ord.total.toFixed(2).replace('.', ',')}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(ord.createdAt).toLocaleDateString('pt-BR')} às {new Date(ord.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-brand-gold text-xs font-bold">
                  <span className="hidden sm:inline">Ver Comprovante</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
