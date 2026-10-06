import React from 'react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, MessageCircle, Bike, Store, Sparkles } from 'lucide-react';

export function DesktopSidebarCart({
  cartItems = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenCheckout,
  activeBranch,
  deliveryMode = 'delivery',
  deliveryFee = 8
}) {
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const currentFee = deliveryMode === 'delivery' ? deliveryFee : 0;
  const total = subtotal + currentFee;
  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <aside className="hidden lg:block lg:col-span-4 xl:col-span-4">
      <div className="sticky top-28 bg-dark-900 border border-dark-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between max-h-[calc(100vh-140px)]">
        
        {/* Cart Header */}
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-dark-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-black text-base text-white leading-tight">
                  Sua Sacola
                </h3>
                <span className="text-[11px] text-slate-400">
                  {activeBranch?.displayName || 'Ariquemes - RO'}
                </span>
              </div>
            </div>

            {totalCount > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="text-[11px] text-slate-500 hover:text-brand-red flex items-center gap-1 transition-colors cursor-pointer"
                title="Limpar sacola"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>

          {/* Delivery Mode Indicator */}
          <div className="mt-3 p-2 rounded-xl bg-dark-950/80 border border-dark-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              {deliveryMode === 'delivery' ? (
                <>
                  <Bike className="w-4 h-4 text-emerald-400" />
                  <span>Entrega em Casa</span>
                </>
              ) : (
                <>
                  <Store className="w-4 h-4 text-amber-400" />
                  <span>Retirada no Balcão</span>
                </>
              )}
            </div>
            <span className="text-[11px] font-bold text-brand-gold">
              {deliveryMode === 'delivery' ? `Taxa ~R$ ${deliveryFee.toFixed(2).replace('.', ',')}` : 'Grátis'}
            </span>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="my-4 flex-1 overflow-y-auto pr-1 space-y-3 max-h-[300px] scrollbar-thin">
          {cartItems.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-dark-950 border border-dark-800 flex items-center justify-center mx-auto text-slate-600">
                <ShoppingBag className="w-8 h-8 stroke-1" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">Sua sacola está vazia</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                  Selecione esfirras, pizzas e combos no cardápio para começar!
                </p>
              </div>
            </div>
          ) : (
            cartItems.map((item) => (
              <div 
                key={item.cartId || item.id}
                className="p-3 rounded-2xl bg-dark-950 border border-dark-800/80 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs text-white leading-tight">
                      {item.name}
                    </h5>
                    
                    {/* Flavors / Customizations Breakdown */}
                    {item.flavors && (
                      <p className="text-[10px] text-brand-gold/90 mt-0.5 leading-snug">
                        {Array.isArray(item.flavors) ? item.flavors.join(' + ') : item.flavors}
                      </p>
                    )}

                    {item.boxFlavors && (
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {Object.entries(item.boxFlavors).map(([f, q]) => `${q}x ${f}`).join(', ')}
                      </p>
                    )}
                  </div>

                  <span className="text-xs font-black text-white whitespace-nowrap">
                    R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                  </span>
                </div>

                {/* Counter & Remove */}
                <div className="flex items-center justify-between pt-1 border-t border-dark-850">
                  <span className="text-[10px] text-slate-500">
                    R$ {item.price.toFixed(2).replace('.', ',')} cada
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="w-5 h-5 rounded-md bg-dark-800 hover:bg-dark-700 text-white flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>

                    <span className="text-xs font-extrabold text-white px-1">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="w-5 h-5 rounded-md bg-brand-gold hover:bg-amber-400 text-dark-950 flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Financial Summary & Checkout Trigger */}
        {cartItems.length > 0 && (
          <div className="pt-3 border-t border-dark-800 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{deliveryMode === 'delivery' ? 'Taxa Estimada:' : 'Retirada:'}</span>
                <span>{currentFee > 0 ? `R$ ${currentFee.toFixed(2).replace('.', ',')}` : 'Grátis'}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-white pt-1 border-t border-dark-800">
                <span>Total a Pagar:</span>
                <span className="text-brand-gold text-base">
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenCheckout}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Finalizar Pedido</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}

      </div>
    </aside>
  );
}
