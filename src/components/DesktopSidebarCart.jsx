import React, { useState, useEffect } from 'react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, MessageCircle, Bike, Store, Sparkles, Check, X } from 'lucide-react';
import { getStoredExtraSauceConfig } from '../data/menuData';

export function DesktopSidebarCart({
  cartItems = [],
  onAddToCart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenCheckout,
  activeBranch,
  deliveryMode = 'delivery',
  deliveryFee = 8,
  isStoreOpen = true,
  openingHours
}) {
  const [extraSauceConfig, setExtraSauceConfig] = useState(() => getStoredExtraSauceConfig());

  useEffect(() => {
    const handleSauceUpdate = (e) => {
      if (e?.detail) setExtraSauceConfig(e.detail);
      else setExtraSauceConfig(getStoredExtraSauceConfig());
    };
    window.addEventListener('extra_sauce_config_updated', handleSauceUpdate);
    return () => {
      window.removeEventListener('extra_sauce_config_updated', handleSauceUpdate);
    };
  }, []);

  const standaloneSauceItem = (cartItems || []).find(i => i.id === 'extra-sauce-standalone' || i.isStandaloneSauce);
  const sauceCount = standaloneSauceItem ? standaloneSauceItem.quantity : 0;

  const handleToggleSauceYes = () => {
    if (standaloneSauceItem) {
      if (onUpdateQuantity) onUpdateQuantity(standaloneSauceItem.id, 1);
    } else if (onAddToCart) {
      onAddToCart({
        id: 'extra-sauce-standalone',
        name: `Potinho de ${extraSauceConfig.name || 'Molho Especial da Casa'}`,
        price: Number(extraSauceConfig.price !== undefined ? extraSauceConfig.price : 3.00),
        quantity: 1,
        isStandaloneSauce: true,
        hasExtraSauce: true,
        extraSauceName: extraSauceConfig.name || 'Molho Especial da Casa',
        extraSaucePrice: Number(extraSauceConfig.price !== undefined ? extraSauceConfig.price : 3.00),
        image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=400&q=80',
        description: 'Potinho artesanal de molho extra da casa'
      });
    }
  };

  const handleToggleSauceNo = () => {
    if (standaloneSauceItem && onRemoveItem) {
      onRemoveItem(standaloneSauceItem.id);
    }
  };

  const handleIncreaseSauce = () => {
    if (standaloneSauceItem && onUpdateQuantity) {
      onUpdateQuantity(standaloneSauceItem.id, 1);
    } else {
      handleToggleSauceYes();
    }
  };

  const handleDecreaseSauce = () => {
    if (standaloneSauceItem) {
      if (standaloneSauceItem.quantity > 1 && onUpdateQuantity) {
        onUpdateQuantity(standaloneSauceItem.id, -1);
      } else if (onRemoveItem) {
        onRemoveItem(standaloneSauceItem.id);
      }
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const currentFee = deliveryMode === 'delivery' ? deliveryFee : 0;
  const total = subtotal + currentFee;
  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <aside className="hidden lg:block lg:col-span-4 xl:col-span-4">
      <div className="sticky top-6 bg-dark-900/90 backdrop-blur-xl border border-white/5 rounded-3xl p-5 shadow-2xl flex flex-col justify-between max-h-[calc(100vh-48px)]">
        
        {/* Cart Header */}
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-white/5">
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
          <div className="mt-3 p-2.5 rounded-xl bg-dark-950/80 border border-white/5 flex items-center justify-between text-xs text-slate-300">
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
              <div className="w-16 h-16 rounded-full bg-dark-950 border border-white/5 flex items-center justify-center mx-auto text-slate-600">
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
                className="p-3 rounded-2xl bg-dark-950/90 border border-white/5 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs text-white leading-tight">
                      {item.name}
                    </h5>
                    
                    {/* Flavors / Customizations Breakdown */}
                    {Array.isArray(item.pizzaSelections) && item.pizzaSelections.length > 0 && (
                      <div className="mt-0.5 space-y-0.5">
                        {item.pizzaSelections.map((p, pIdx) => (
                          <p key={pIdx} className="text-[10px] text-brand-gold/90 leading-snug">
                            🍕 <span className="text-white font-medium">{p.pizzaTitle || `Pizza ${pIdx + 1}`}:</span> {Array.isArray(p.flavors) ? p.flavors.join(' / ') : (p.flavors || '')}
                            {p.surcharge > 0 && (
                              <span className="text-amber-300 font-bold ml-1">
                                (+ R$ {Number(p.surcharge).toFixed(2).replace('.', ',')})
                              </span>
                            )}
                          </p>
                        ))}
                        {item.totalSurcharge > 0 && (
                          <p className="text-[10px] text-amber-300 font-semibold leading-snug">
                            ⭐ Sabores especiais: + R$ {Number(item.totalSurcharge).toFixed(2).replace('.', ',')}
                          </p>
                        )}
                      </div>
                    )}

                    {item.acaiComplements && item.acaiComplements.length > 0 && (
                      <p className="text-[10px] text-purple-300 font-medium mt-0.5 leading-snug">
                        🍧 <span className="text-white font-bold">{item.pizzaSelections ? 'Barca de Açaí:' : 'Açaí:'}</span> {item.acaiComplements.join(', ')}
                        {item.acaiCobertura && item.acaiCobertura !== 'Sem Cobertura' && (
                          <span className="text-purple-200"> • Cobertura: {item.acaiCobertura}</span>
                        )}
                      </p>
                    )}

                    {item.dydyoFlavor && (
                      <p className="text-[10px] text-amber-300 font-medium mt-0.5 leading-snug">
                        🥤 <span className="text-white font-bold">Refri:</span> {item.dydyoFlavor}
                      </p>
                    )}

                    {item.beverage && (
                      <p className="text-[10px] text-cyan-300 font-medium mt-0.5 leading-snug">
                        🥤 <span className="text-white font-bold">Bebida:</span> {item.beverage}
                      </p>
                    )}

                    {item.hasExtraSauce && (
                      <p className="text-[10px] text-amber-200 font-medium mt-0.5 leading-snug">
                        🍯 <span className="text-white font-bold">Molho Extra:</span> {item.extraSauceName || 'Molho Especial'}
                      </p>
                    )}

                    {item.flavors && !item.pizzaSelections && (
                      <p className="text-[10px] text-brand-gold/90 mt-0.5 leading-snug">
                        {Array.isArray(item.flavors) ? item.flavors.join(' + ') : item.flavors}
                      </p>
                    )}

                    {item.boxFlavors && (
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {Object.entries(item.boxFlavors).map(([f, q]) => `${q}x ${f}`).join(', ')}
                      </p>
                    )}

                    {item.boxOptionTitle ? (
                      <p className="text-[10px] text-amber-300 mt-0.5 font-bold">
                        ✨ {item.boxOptionTitle}
                      </p>
                    ) : item.isSortido ? (
                      <p className="text-[10px] text-amber-300 mt-0.5 font-medium">
                        🎲 Sortido da Casa
                      </p>
                    ) : item.salgadasDetails ? (
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        Salg: {Object.entries(item.salgadasDetails).map(([f, q]) => `${q}x ${f}`).join(', ')}
                      </p>
                    ) : null}

                    {(item.semSuinos || item.semSuinosEsfirras) && (
                      <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                        🚫 Sem Carne Suína
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-black text-white whitespace-nowrap">
                    R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                  </span>
                </div>

                {/* Counter & Remove */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
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
                      className="w-5 h-5 rounded-md bg-brand-gold hover:bg-amber-400 text-dark-950 flex items-center justify-center font-bold cursor-pointer"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Molho Extra Upsell na Sidebar */}
        {cartItems.length > 0 && extraSauceConfig.active !== false && (
          <div className="p-3 my-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base">🍯</span>
                <span className="text-xs font-bold text-white truncate">Quer Molho Extra?</span>
              </div>
              <span className="text-[10px] font-black text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded-full border border-amber-500/30 shrink-0">
                + R$ {Number(extraSauceConfig.price || 3.00).toFixed(2).replace('.', ',')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={handleToggleSauceYes}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  sauceCount > 0
                    ? 'bg-amber-400 text-dark-950 font-black shadow-sm'
                    : 'bg-dark-950 text-slate-300 hover:text-white border border-dark-750'
                }`}
              >
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Sim ({sauceCount > 0 ? `${sauceCount}x` : '+R$' + Number(extraSauceConfig.price || 3).toFixed(0)})</span>
              </button>

              <button
                type="button"
                onClick={handleToggleSauceNo}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  sauceCount === 0
                    ? 'bg-dark-850 text-slate-300 border border-dark-700 font-bold'
                    : 'bg-dark-950 text-slate-400 hover:text-white border border-dark-750'
                }`}
              >
                <X className="w-3 h-3" />
                <span>Não</span>
              </button>
            </div>
          </div>
        )}

        {/* Cart Financial Summary & Checkout Trigger */}
        {cartItems.length > 0 && (
          <div className="pt-3 border-t border-white/5 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{deliveryMode === 'delivery' ? 'Taxa Estimada:' : 'Retirada:'}</span>
                <span>{currentFee > 0 ? `R$ ${currentFee.toFixed(2).replace('.', ',')}` : 'Grátis'}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-white pt-1 border-t border-white/5">
                <span>Total a Pagar:</span>
                <span className="text-brand-gold text-base">
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {!isStoreOpen ? (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/30 text-xs text-red-200">
                  <p className="font-bold flex items-center gap-1.5 text-red-300">
                    <span>⚠️ Estabelecimento Fechado</span>
                  </p>
                  <p className="mt-1 text-[11px] text-red-200/90 leading-relaxed">
                    Não estamos aceitando pedidos no momento.
                  </p>
                  {openingHours && (
                    <p className="mt-1 text-[10px] text-brand-gold font-bold">
                      🕒 Horário: {openingHours}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 px-4 rounded-2xl bg-dark-800 text-slate-500 font-black text-sm border border-red-500/30 flex items-center justify-center gap-2 cursor-not-allowed select-none opacity-80"
                >
                  <span>⛔ Estabelecimento Fechado</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenCheckout}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Finalizar Pedido</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </div>
        )}

      </div>
    </aside>
  );
}
