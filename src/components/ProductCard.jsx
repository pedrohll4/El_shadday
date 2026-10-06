import React from 'react';
import { Plus, Minus, Check, Sparkles, Package, Pizza as PizzaIcon, Info } from 'lucide-react';

export function ProductCard({ 
  product, 
  onAddToCart, 
  onOpenBoxBuilder, 
  onOpenPizzaCustomizer, 
  onOpenComboCustomizer,
  onUpdateQuantity,
  cartQuantity = 0,
  cartItem = null
}) {
  const isBox = product.isBox;
  const isPizza = product.isPizzaCustomizer;
  const isCombo = product.categoryId === 'combos';
  const isCustomizable = isBox || isPizza || isCombo;

  const handleAction = (e) => {
    e.stopPropagation();
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

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (onUpdateQuantity && cartItem) {
      onUpdateQuantity(cartItem.id, 1);
    } else {
      onAddToCart(product);
    }
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (onUpdateQuantity && cartItem) {
      onUpdateQuantity(cartItem.id, -1);
    }
  };

  return (
    <div 
      onClick={handleAction}
      className="group relative rounded-2xl bg-dark-900 hover:bg-dark-850/95 border border-dark-800 hover:border-brand-gold/50 p-3 sm:p-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex justify-between gap-3 sm:gap-4 items-stretch"
    >
      
      {/* LEFT COLUMN: Name, Description, Tags, Price */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        
        <div>
          {/* Top Pill Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {product.badge && (
              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-brand-red text-white flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{product.badge}</span>
              </span>
            )}
            {product.bordaGratis && (
              <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-amber-400 text-dark-950">
                Borda Catupiry Grátis
              </span>
            )}
            {isBox && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                {product.totalCount} unidades
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="font-display font-bold text-sm sm:text-base text-white group-hover:text-brand-gold transition-colors leading-snug line-clamp-2">
            {product.name}
          </h3>

          {/* Product Description */}
          <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Serving / Detail Hint */}
          {product.details && (
            <p className="mt-1 text-[11px] text-amber-300/80 font-medium">
              {product.details}
            </p>
          )}
        </div>

        {/* Pricing Row */}
        <div className="mt-2.5 pt-2 border-t border-dark-800/60 flex items-baseline gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-brand-gold font-bold">R$</span>
            <span className="text-base sm:text-lg font-black text-white tracking-tight">
              {product.price.toFixed(2).replace('.', ',')}
            </span>
          </div>

          {product.originalPrice && (
            <span className="text-xs text-slate-500 line-through">
              R$ {product.originalPrice.toFixed(2).replace('.', ',')}
            </span>
          )}

          {product.creditPrice && (
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              (Crédito R$ {product.creditPrice.toFixed(2).replace('.', ',')})
            </span>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: Product Thumbnail & Action Button */}
      <div className="flex-shrink-0 flex flex-col justify-between items-end">
        
        {/* Square Image Thumbnail */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden relative bg-dark-950 border border-dark-800/80">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>

        {/* Action Button: Customizable vs Direct +/- */}
        <div className="mt-2">
          {isCustomizable ? (
            <button
              type="button"
              onClick={handleAction}
              className="px-3 py-1.5 rounded-xl bg-brand-gold hover:bg-amber-400 text-dark-950 font-black text-[11px] flex items-center gap-1 shadow-sm transition-transform active:scale-95 cursor-pointer"
            >
              {isBox ? (
                <>
                  <Package className="w-3.5 h-3.5" />
                  <span>Montar</span>
                </>
              ) : isPizza ? (
                <>
                  <PizzaIcon className="w-3.5 h-3.5" />
                  <span>Escolher</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Combo</span>
                </>
              )}
            </button>
          ) : cartQuantity > 0 ? (
            /* Quantity Counter for Direct Items */
            <div 
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 p-1 rounded-xl bg-dark-950 border border-brand-gold/40 shadow-sm"
            >
              <button
                type="button"
                onClick={handleDecrement}
                className="w-6 h-6 rounded-lg bg-dark-800 hover:bg-dark-700 text-white flex items-center justify-center cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>

              <span className="text-xs font-black text-white px-1">
                {cartQuantity}
              </span>

              <button
                type="button"
                onClick={handleIncrement}
                className="w-6 h-6 rounded-lg bg-brand-gold hover:bg-amber-400 text-dark-950 flex items-center justify-center font-bold cursor-pointer"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
              </button>
            </div>
          ) : (
            /* Add Button for Direct Items */
            <button
              type="button"
              onClick={handleAction}
              className="px-3 py-1.5 rounded-xl bg-dark-800 hover:bg-brand-gold text-white hover:text-dark-950 border border-dark-700 hover:border-brand-gold font-bold text-[11px] flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>Adicionar</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
