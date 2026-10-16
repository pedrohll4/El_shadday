import React from 'react';
import { Sparkles, Flame, Package, Pizza, ArrowRight, Star } from 'lucide-react';

export function PromotionsShelf({ 
  onOpenBoxBuilder, 
  onOpenPizzaCustomizer, 
  onOpenComboCustomizer,
  onAddToCart,
  products = []
}) {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return null;
  }

  // Only select products explicitly marked as highlight or promo
  const highlights = products.filter(p => 
    p && p.isAvailable !== false && (p.isHighlight || p.isPromo)
  ).slice(0, 8);

  if (highlights.length === 0) {
    return null;
  }

  const handleAction = (product) => {
    if (product.isBox) {
      onOpenBoxBuilder(product);
    } else if (product.isPizzaCustomizer) {
      onOpenPizzaCustomizer(product);
    } else if (product.categoryId === 'combos' && onOpenComboCustomizer) {
      onOpenComboCustomizer(product);
    } else {
      onAddToCart(product);
    }
  };

  return (
    <section className="py-6 border-b border-white/5 bg-dark-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-gold/15 text-brand-gold flex items-center justify-center">
              <Flame className="w-4 h-4 fill-brand-gold text-brand-gold" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-display font-black text-white flex items-center gap-2">
                <span>Destaques da Casa</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                  Mais Pedidos
                </span>
              </h2>
            </div>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Os campeões de pedidos em Ariquemes
          </span>
        </div>

        {/* Shelf Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {highlights.map((product) => (
            <div
              key={product.id}
              onClick={() => handleAction(product)}
              className="group relative rounded-2xl bg-dark-900/90 border border-white/5 hover:border-brand-gold/50 p-3.5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-gold cursor-pointer"
            >
              {/* Product Thumbnail with Clean Badge */}
              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-dark-950 mb-3">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-transparent"></div>

                {/* Floating Tag */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {product.badge ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-dark-950/90 text-brand-gold border border-brand-gold/40 shadow-md flex items-center gap-1 backdrop-blur-sm">
                      <Sparkles className="w-2.5 h-2.5" />
                      {product.badge}
                    </span>
                  ) : product.isHighlight ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-brand-gold text-dark-950 shadow-md flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-dark-950 text-dark-950" />
                      Destaque
                    </span>
                  ) : null}
                  {product.bordaGratis && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-400 text-dark-950">
                      Borda Grátis
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Desc */}
              <div className="flex-1">
                <h3 className="font-display font-bold text-sm text-white group-hover:text-brand-gold transition-colors line-clamp-1 leading-snug">
                  {product.name}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Price & Action Button */}
              <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] text-brand-gold font-bold">R$</span>
                    <span className="text-base font-black text-white">
                      {(Number(product.price) || 0).toFixed(2).replace('.', ',')}
                    </span>
                    {product.originalPrice && (
                      <span className="text-[10px] text-slate-500 line-through">
                        R$ {(Number(product.originalPrice) || 0).toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-brand-gold hover:bg-amber-400 text-dark-950 font-black text-xs flex items-center gap-1 shadow-sm transition-transform active:scale-95 group-hover:scale-103"
                >
                  <span>
                    {product.isBox ? 'Montar' : product.isPizzaCustomizer ? 'Escolher' : product.categoryId === 'combos' ? 'Combo' : 'Pedir'}
                  </span>
                  <ArrowRight className="w-3 h-3 stroke-[3]" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
