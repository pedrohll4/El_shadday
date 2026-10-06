import React from 'react';
import { Plus, Check, Sparkles, Package, Pizza as PizzaIcon, Info } from 'lucide-react';

export function ProductCard({ 
  product, 
  onAddToCart, 
  onOpenBoxBuilder, 
  onOpenPizzaCustomizer, 
  onOpenComboCustomizer,
  cartQuantity 
}) {
  const isBox = product.isBox;
  const isPizza = product.isPizzaCustomizer;
  const isCombo = product.categoryId === 'combos';

  const handleAction = () => {
    if (isBox) {
      onOpenBoxBuilder(product);
    } else if (isPizza) {
      onOpenPizzaCustomizer(product);
    } else if (isCombo && onOpenComboCustomizer) {
      onOpenComboCustomizer(product);
    } else {
      onAddToCart(product);
    }
  };

  return (
    <div className="group relative rounded-2xl bg-dark-900 border border-dark-800 hover:border-brand-gold/50 shadow-card-dark transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden">
      
      {/* Product Image & Badges */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-dark-950">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-80"></div>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          {product.badge && (
            <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-brand-red text-white shadow-md flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-300" />
              {product.badge}
            </span>
          )}
          {product.bordaGratis && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/90 text-dark-950 shadow-md">
              Borda Catupiry Grátis
            </span>
          )}
        </div>

        {/* Box or Pizza indicator badge */}
        {isBox && (
          <div className="absolute bottom-2 left-2.5 bg-dark-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-brand-gold/30 text-[11px] font-bold text-brand-goldLight flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-brand-gold" />
            <span>Personalizável: {product.totalCount} Unidades</span>
          </div>
        )}

        {isPizza && (
          <div className="absolute bottom-2 left-2.5 bg-dark-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-brand-gold/30 text-[11px] font-bold text-brand-goldLight flex items-center gap-1.5">
            <PizzaIcon className="w-3.5 h-3.5 text-brand-gold" />
            <span>{product.tamanho}</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-display font-bold text-base sm:text-lg text-white group-hover:text-brand-gold transition-colors leading-snug">
            {product.name}
          </h3>

          <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {product.details && (
            <div className="mt-2 flex items-center gap-1 text-[11px] text-brand-gold/90 font-medium">
              <Info className="w-3 h-3" />
              <span>{product.details}</span>
            </div>
          )}
        </div>

        {/* Pricing & Add Button */}
        <div className="mt-4 pt-3 border-t border-dark-800/80 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-brand-gold font-semibold">R$</span>
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {product.price.toFixed(2).replace('.', ',')}
              </span>
            </div>
            {product.originalPrice && (
              <span className="text-[11px] text-slate-500 line-through">
                R$ {product.originalPrice.toFixed(2).replace('.', ',')}
              </span>
            )}
            {product.creditPrice && (
              <span className="text-[10px] text-slate-400 block">
                Crédito: R$ {product.creditPrice.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          {/* Action Trigger Button */}
          {isBox ? (
            <button
              onClick={handleAction}
              className="flex items-center gap-1.5 bg-brand-gold hover:bg-amber-400 text-dark-950 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-glow-gold transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Montar Caixa</span>
            </button>
          ) : isPizza ? (
            <button
              onClick={handleAction}
              className="flex items-center gap-1.5 bg-brand-gold hover:bg-amber-400 text-dark-950 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-glow-gold transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <PizzaIcon className="w-4 h-4" />
              <span>Escolher Sabores</span>
            </button>
          ) : isCombo ? (
            <button
              onClick={handleAction}
              className="flex items-center gap-1.5 bg-brand-gold hover:bg-amber-400 text-dark-950 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-glow-gold transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Pedir Combo</span>
            </button>
          ) : (
            <button
              onClick={handleAction}
              className={`flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
                cartQuantity > 0
                  ? 'bg-emerald-500 text-dark-950 shadow-md'
                  : 'bg-dark-800 hover:bg-brand-gold text-white hover:text-dark-950 border border-dark-700 hover:border-brand-gold'
              }`}
              title="Adicionar ao carrinho"
            >
              {cartQuantity > 0 ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{cartQuantity} no pedido</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Adicionar</span>
                </>
              )}
            </button>
          )}

        </div>

      </div>

    </div>
  );
}
