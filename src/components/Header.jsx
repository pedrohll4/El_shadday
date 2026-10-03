import React from 'react';
import { ShoppingBag, Phone, MapPin, Clock, Flame, ChevronRight, ReceiptText, ChefHat } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';

export function Header({ 
  cartCount, 
  onOpenCart, 
  onOpenBoxBuilder, 
  confirmedOrdersCount, 
  onOpenOrdersList,
  onOpenAdmin 
}) {
  return (
    <header className="sticky top-0 z-40 bg-dark-950/85 backdrop-blur-md border-b border-dark-800 transition-all duration-300">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-brand-goldDark via-brand-gold to-brand-goldDark text-dark-950 px-4 py-1.5 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-inner">
        <span className="flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-dark-950 animate-bounce" />
          <strong>PROMOÇÃO DA SEMANA:</strong> Borda de Catupiry 100% GRÁTIS em todas as pizzas salgadas!
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Info */}
          <div className="flex items-center gap-3.5">
            <a href="#" className="relative group flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-brand-gold p-0.5 bg-dark-900 shadow-glow-gold transition-transform duration-300 group-hover:scale-105">
                <img 
                  src={RESTAURANT_INFO.logoUrl} 
                  alt={RESTAURANT_INFO.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display font-extrabold text-lg sm:text-2xl tracking-tight text-white group-hover:text-brand-gold transition-colors">
                    EL SHADDAY
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Aberto agora
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-medium hidden xs:block">
                  Esfirraria & Pizzaria Gourmet • Ariquemes-RO
                </span>
              </div>
            </a>
          </div>

          {/* Center info */}
          <div className="hidden lg:flex items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2 bg-dark-900/80 px-3 py-1.5 rounded-full border border-dark-800">
              <Clock className="w-4 h-4 text-brand-gold" />
              <span>Hoje: <strong>09:00 às 23:00</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-dark-900/80 px-3 py-1.5 rounded-full border border-dark-800">
              <MapPin className="w-4 h-4 text-brand-gold" />
              <span>R. Maceió, 2333 • <strong>Setor 03</strong></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Admin Pizzeria Button */}
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 bg-dark-900 hover:bg-dark-850 text-brand-gold hover:text-amber-300 border border-brand-gold/30 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
              title="Acesso da Pizzaria: Ver pedidos na cozinha e atrasos"
            >
              <ChefHat className="w-4 h-4" />
              <span className="hidden md:inline">Painel Cozinha</span>
            </button>

            {/* View Orders / Receipt Button */}
            {confirmedOrdersCount > 0 && (
              <button
                onClick={onOpenOrdersList}
                className="flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
                title="Acompanhar meus pedidos e comprovantes"
              >
                <ReceiptText className="w-4 h-4" />
                <span className="hidden sm:inline">Meus Pedidos</span>
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-dark-950 font-black text-[11px] flex items-center justify-center">
                  {confirmedOrdersCount}
                </span>
              </button>
            )}

            {/* Box builder trigger */}
            <button
              onClick={onOpenBoxBuilder}
              className="hidden lg:flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-brand-gold/20 hover:from-amber-500/30 hover:to-brand-gold/30 text-brand-goldLight text-xs font-semibold px-3 py-2 rounded-xl border border-brand-gold/40 transition-all hover:scale-105 cursor-pointer"
            >
              <span>Montar Caixa</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-gradient-to-r from-brand-gold to-amber-500 hover:from-amber-400 hover:to-brand-gold text-dark-950 font-bold px-4 py-2.5 rounded-xl shadow-glow-gold transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 text-dark-950" />
              <span className="hidden sm:inline text-sm">Meu Pedido</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-red text-white text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center border-2 border-dark-950 animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
