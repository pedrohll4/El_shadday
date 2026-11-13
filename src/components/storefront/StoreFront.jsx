import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Home, ReceiptText, ShoppingBag, Info, Search, X, ChevronDown, ChevronRight,
  Clock, MapPin, Phone, Bike, Store, AlertCircle, CheckCircle2, Plus, Minus,
  Flame, Package, Utensils, HeartHandshake, Pizza, IceCream, Soup, Wine, Sparkles
} from 'lucide-react';
import { RESTAURANT_INFO } from '../../data/menuData';

// Ícone de cada categoria (vem do cadastro como texto)
const CATEGORY_ICONS = { Flame, Package, Utensils, HeartHandshake, Pizza, IceCream, Soup, Wine };

const money = (v) => `R$ ${(Number(v) || 0).toFixed(2).replace('.', ',')}`;

// Descobre que tipo de produto é (abre montador ou vai direto para a sacola)
export function getProductKind(product) {
  const name = (product?.name || '').toLowerCase();
  const isBox = Boolean(product?.isBox || product?.categoryId === 'caixas' || (name.includes('caixa') && name.includes('esfirr')));
  const isPizza = Boolean(product?.isPizzaCustomizer);
  const isCombo = product?.categoryId === 'combos' && !isBox;
  const isAcai = product?.categoryId === 'acai' || (product?.id && String(product.id).includes('acai')) || name.includes('açaí');
  return { isBox, isPizza, isCombo, isAcai, isCustomizable: isBox || isPizza || isCombo || isAcai };
}

/* ------------------------------------------------------------------ */
/* Linha de produto (texto à esquerda, foto à direita - estilo app)    */
/* ------------------------------------------------------------------ */
function MenuItemRow({ product, cartItem, onOpen, onIncrement, onDecrement, isStoreOpen }) {
  const kind = getProductKind(product);
  const qty = cartItem?.quantity || 0;
  const showFrom = kind.isPizza || kind.isBox || kind.isCombo || kind.isAcai;

  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      className="w-full text-left flex items-stretch gap-3 p-3 rounded-2xl bg-dark-900 border border-white/[0.06] hover:border-brand-gold/40 active:scale-[0.99] transition-all cursor-pointer"
    >
      <div className="flex-1 min-w-0 flex flex-col">
        {(product.badge || product.bordaGratis) && (
          <div className="flex flex-wrap gap-1 mb-1">
            {product.badge && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-brand-gold/15 text-brand-goldLight">
                {product.badge}
              </span>
            )}
            {product.bordaGratis && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-400/90 text-dark-950">
                Borda grátis
              </span>
            )}
          </div>
        )}
        <h4 className="font-bold text-[15px] leading-snug text-white line-clamp-2">{product.name}</h4>
        {product.description && (
          <p className="mt-0.5 text-[13px] leading-snug text-slate-400 line-clamp-2">{product.description}</p>
        )}
        <div className="mt-auto pt-2 flex items-baseline gap-2 flex-wrap">
          {showFrom && <span className="text-[12px] text-emerald-400 font-semibold">A partir de</span>}
          <span className="text-[15px] font-extrabold text-emerald-400">{money(product.price)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-slate-500 line-through">{money(product.originalPrice)}</span>
          )}
        </div>
      </div>

      <div className="relative flex-shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-dark-950">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Pizza className="w-9 h-9 text-brand-gold/30" />
          </div>
        )}

        {/* Botão rápido: + para itens simples, contador quando já está na sacola */}
        {!kind.isCustomizable && qty > 0 ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-1.5 right-1.5 flex items-center gap-1 p-1 rounded-full bg-dark-950/95 border border-brand-gold/50"
          >
            <span
              role="button"
              tabIndex={0}
              aria-label="Diminuir"
              onClick={(e) => { e.stopPropagation(); onDecrement(cartItem); }}
              className="w-7 h-7 rounded-full bg-dark-800 text-white flex items-center justify-center"
            >
              <Minus className="w-3.5 h-3.5" />
            </span>
            <span className="min-w-[1.25rem] text-center text-sm font-black text-white">{qty}</span>
            <span
              role="button"
              tabIndex={0}
              aria-label="Aumentar"
              onClick={(e) => { e.stopPropagation(); onIncrement(product, cartItem); }}
              className="w-7 h-7 rounded-full bg-brand-gold text-dark-950 flex items-center justify-center"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </span>
          </div>
        ) : (
          <span
            className={`absolute bottom-1.5 right-1.5 w-9 h-9 rounded-full flex items-center justify-center shadow-lg ${
              isStoreOpen || kind.isCustomizable ? 'bg-brand-gold text-dark-950' : 'bg-dark-800 text-slate-400'
            }`}
            aria-hidden="true"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
          </span>
        )}
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Folha de informações da loja                                        */
/* ------------------------------------------------------------------ */
function StoreInfoSheet({ isOpen, onClose, activeBranch, restaurantInfo, isStoreOpen, openingHours, onChangeBranch, canChangeBranch, onOpenBuffet, showBuffet }) {
  if (!isOpen) return null;
  const phone = activeBranch?.whatsapp || restaurantInfo?.phone || RESTAURANT_INFO.phone;
  const phoneFormatted = activeBranch?.whatsappFormatted || activeBranch?.phoneFormatted || RESTAURANT_INFO.phoneFormatted;
  const address = activeBranch?.address || restaurantInfo?.address || RESTAURANT_INFO.address;
  const mapsUrl = restaurantInfo?.mapsUrl || RESTAURANT_INFO.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-dark-900 border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-y-auto animate-sheet-up">
        <div className="sticky top-0 bg-dark-900 px-5 pt-3 pb-3 border-b border-white/5 flex items-center justify-between">
          <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-10 h-1 rounded-full bg-white/15 sm:hidden" />
          <h3 className="text-lg font-bold text-white mt-2">Informações da loja</h3>
          <button type="button" onClick={onClose} className="mt-2 w-9 h-9 rounded-full bg-dark-800 text-slate-300 flex items-center justify-center cursor-pointer" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-sm">
          <div className={`flex items-center gap-2 p-3 rounded-xl ${isStoreOpen ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isStoreOpen ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="font-bold">{isStoreOpen ? 'Aberto agora' : 'Fechado agora'}</span>
          </div>

          <InfoLine icon={Clock} title="Horário de funcionamento" text={openingHours} />
          <InfoLine icon={Bike} title="Tempo de entrega" text={activeBranch?.deliveryTime || RESTAURANT_INFO.deliveryTime} />
          <InfoLine icon={MapPin} title="Endereço" text={address} action={{ label: 'Abrir no mapa', href: mapsUrl }} />
          <InfoLine icon={Phone} title="WhatsApp" text={phoneFormatted} action={{ label: 'Chamar no WhatsApp', href: `https://wa.me/${phone}` }} />

          {canChangeBranch && (
            <button type="button" onClick={onChangeBranch} className="w-full flex items-center justify-between p-3 rounded-xl bg-dark-850 border border-white/5 text-slate-200 cursor-pointer">
              <span className="flex items-center gap-2"><Store className="w-4 h-4 text-brand-gold" /> Trocar de unidade</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {showBuffet && (
            <button type="button" onClick={onOpenBuffet} className="w-full flex items-center justify-between p-3 rounded-xl bg-brand-gold/10 border border-brand-gold/30 text-brand-goldLight cursor-pointer">
              <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Buffet para eventos</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoLine({ icon: Icon, title, text, action }) {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-dark-850 border border-white/5">
      <Icon className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{title}</p>
        <p className="text-slate-100 font-medium break-words">{text}</p>
        {action && (
          <a href={action.href} target="_blank" rel="noopener noreferrer" className="inline-block mt-1 text-xs font-bold text-brand-gold">
            {action.label} →
          </a>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Vitrine principal                                                   */
/* ------------------------------------------------------------------ */
export function StoreFront({
  activeBranch,
  restaurantInfo,
  promoSettings,
  categories,
  products,
  cartItems,
  totalCartCount,
  totalCartValue,
  isStoreOpen,
  openingHours,
  closedMessage,
  deliveryMode,
  onChangeDeliveryMode,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  searchResults,
  onOpenProduct,
  onIncrement,
  onDecrement,
  onOpenCart,
  onOpenOrders,
  ordersCount,
  onOpenBranchModal,
  canChangeBranch,
  onOpenBuffet,
  showBuffet,
  onOpenAdmin,
  desktopCart
}) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const [showStickyBrand, setShowStickyBrand] = useState(false);
  const chipsRef = useRef(null);
  const searchInputRef = useRef(null);
  const logoTapRef = useRef({ count: 0, at: 0 });

  const visibleCategories = useMemo(() => {
    return (categories || [])
      .filter(c => c.visible !== false)
      .map(c => ({ ...c, items: products.filter(p => p.categoryId === c.id && p.isAvailable !== false) }))
      .filter(c => c.items.length > 0);
  }, [categories, products]);

  // "Promoção do dia": destaques do cardápio
  const highlights = useMemo(() => {
    const list = products.filter(p => p.isAvailable !== false && (p.isHighlight || p.badge || p.isPromo));
    return (list.length ? list : products.filter(p => p.categoryId === 'combos' && p.isAvailable !== false)).slice(0, 10);
  }, [products]);

  const cartById = useMemo(() => {
    const map = {};
    (cartItems || []).forEach(i => { map[i.id] = i; });
    return map;
  }, [cartItems]);

  // Mostra logo pequeno na barra quando a capa sai da tela
  useEffect(() => {
    const onScroll = () => setShowStickyBrand(window.scrollY > 260);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Mantém o chip da categoria atual visível
  useEffect(() => {
    const wrap = chipsRef.current;
    if (!wrap || !activeCategory) return;
    const chip = wrap.querySelector(`[data-cat="${activeCategory}"]`);
    if (chip) {
      const left = chip.offsetLeft - wrap.clientWidth / 2 + chip.clientWidth / 2;
      wrap.scrollTo({ left, behavior: 'smooth' });
    }
  }, [activeCategory]);

  useEffect(() => {
    if (isSearchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [isSearchOpen]);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Acesso discreto da equipe: tocar 5x no logo
  const handleLogoTap = () => {
    const now = Date.now();
    const t = logoTapRef.current;
    t.count = now - t.at < 1500 ? t.count + 1 : 1;
    t.at = now;
    if (t.count >= 5) {
      t.count = 0;
      onOpenAdmin?.();
    }
  };

  const cover = activeBranch?.bannerImage || restaurantInfo?.bannerUrl || RESTAURANT_INFO.bannerUrl;
  const logo = restaurantInfo?.logoUrl || RESTAURANT_INFO.logoUrl;
  const storeName = restaurantInfo?.shortName || RESTAURANT_INFO.shortName || 'El Shadday';

  const renderRows = (items) => (
    <div className="space-y-2.5">
      {items.map(p => (
        <MenuItemRow
          key={p.id}
          product={p}
          cartItem={cartById[p.id]}
          onOpen={onOpenProduct}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          isStoreOpen={isStoreOpen}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 font-sans w-full overflow-x-clip pb-36 lg:pb-10">
      <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-12 lg:gap-8 lg:px-6 lg:pt-6">
        <div className="lg:col-span-8 min-w-0">

          {/* CAPA + LOGO */}
          <header className="relative">
            <div className="h-44 sm:h-56 lg:h-64 w-full overflow-hidden lg:rounded-3xl bg-dark-900">
              <img src={cover} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-dark-950/80 lg:rounded-3xl" />
            </div>
            <button
              type="button"
              onClick={handleLogoTap}
              className="absolute left-4 lg:left-6 -bottom-10 w-24 h-24 rounded-full bg-dark-950 p-1 border-2 border-brand-gold shadow-glow-gold overflow-hidden"
              aria-label={storeName}
            >
              <img src={logo} alt={storeName} className="w-full h-full object-cover rounded-full" />
            </button>
          </header>

          {/* NOME, STATUS, INFO */}
          <section className="px-4 lg:px-2 pt-12">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-white leading-tight">{storeName}</h1>
                <p className="text-[13px] text-slate-400 mt-0.5">Esfirraria e Pizzaria • {activeBranch?.displayName || 'Ariquemes - RO'}</p>
                <div className="mt-1.5 flex items-center gap-3 text-[13px]">
                  <span className={`flex items-center gap-1.5 font-semibold ${isStoreOpen ? 'text-emerald-400' : 'text-red-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${isStoreOpen ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    {isStoreOpen ? 'Aberto agora' : 'Loja fechada'}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5" /> {activeBranch?.deliveryTime || RESTAURANT_INFO.deliveryTime}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInfoOpen(true)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-sm font-semibold text-slate-200 cursor-pointer"
              >
                <Info className="w-4 h-4 text-brand-gold" /> Info
              </button>
            </div>

            {/* Entrega x Retirada */}
            <div className="mt-4 grid grid-cols-2 p-1 rounded-2xl bg-dark-900 border border-white/5">
              {[
                { id: 'delivery', label: 'Entrega', icon: Bike },
                { id: 'retirada', label: 'Retirar na loja', icon: Store }
              ].map(opt => {
                const active = (deliveryMode === 'retirada' ? 'retirada' : 'delivery') === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeDeliveryMode(opt.id)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                      active ? 'bg-brand-gold text-dark-950' : 'text-slate-300'
                    }`}
                  >
                    <opt.icon className="w-4 h-4" /> {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Avisos */}
            <div className="mt-3 space-y-2">
              {!isStoreOpen && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-[13px] text-red-200">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
                  <div>
                    <p className="font-semibold">Estamos fechados. Você pode olhar o cardápio, mas não dá para concluir o pedido agora.</p>
                    <p className="text-red-300/80 mt-0.5">Horário: {openingHours}</p>
                    {closedMessage && closedMessage !== RESTAURANT_INFO.closedMessage && (
                      <p className="text-red-300/80 mt-0.5">{closedMessage}</p>
                    )}
                  </div>
                </div>
              )}
              {promoSettings?.bannerActive && promoSettings?.bannerText && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-brand-gold/10 border border-brand-gold/25 text-[13px] text-brand-goldLight">
                  <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    {promoSettings.bannerText}
                    {promoSettings.couponActive && promoSettings.couponCode && (
                      <> — cupom <strong className="font-mono">{promoSettings.couponCode}</strong></>
                    )}
                  </p>
                </div>
              )}
              {canChangeBranch && (
                <button type="button" onClick={onOpenBranchModal} className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[13px] text-emerald-200 cursor-pointer text-left">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span className="flex-1">{activeBranch?.name || 'Unidade Ariquemes'}</span>
                  <span className="text-xs font-bold text-emerald-300">Trocar</span>
                </button>
              )}
            </div>
          </section>

          {/* PROMOÇÃO DO DIA */}
          {highlights.length > 0 && !searchQuery.trim() && (
            <section className="mt-6">
              <h2 className="px-4 lg:px-2 text-base font-bold text-white mb-2.5">Promoção do dia</h2>
              <div className="flex gap-3 overflow-x-auto px-4 lg:px-2 pb-2 snap-x snap-mandatory scroll-px-4 lg:scroll-px-2 no-scrollbar">
                {highlights.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onOpenProduct(p)}
                    className="snap-start flex-shrink-0 w-44 sm:w-52 rounded-2xl overflow-hidden bg-dark-900 border border-white/[0.06] text-left cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <div className="h-28 sm:h-32 bg-dark-950">
                      {p.image && <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover" />}
                    </div>
                    <div className="p-2.5">
                      <p className="text-sm font-bold text-white leading-snug line-clamp-2 min-h-[2.5rem]">{p.name}</p>
                      <p className="mt-1 text-[13px] font-extrabold text-emerald-400">
                        <span className="font-semibold text-xs">A partir de </span>{money(p.price)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* BARRA FIXA: CATEGORIAS + BUSCA */}
          <div id="menu-section" className="sticky top-0 z-30 mt-4 bg-dark-950/95 backdrop-blur border-b border-white/5">
            {isSearchOpen ? (
              <div className="flex items-center gap-2 px-4 lg:px-2 py-2.5">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-dark-900 border border-brand-gold/40">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Buscar no cardápio"
                    className="flex-1 bg-transparent text-[15px] text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { onSearchChange(''); setIsSearchOpen(false); }}
                  className="px-2 py-2 text-sm font-semibold text-brand-gold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-2.5 pl-4 lg:pl-2">
                {showStickyBrand && (
                  <button type="button" onClick={scrollTop} className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden border border-brand-gold/60" aria-label="Voltar ao topo">
                    <img src={logo} alt="" className="w-full h-full object-cover" />
                  </button>
                )}
                <div ref={chipsRef} className="flex-1 flex gap-2 overflow-x-auto no-scrollbar">
                  {visibleCategories.map(cat => (
                    <button
                      key={cat.id}
                      data-cat={cat.id}
                      type="button"
                      onClick={() => onSelectCategory(cat.id)}
                      className={`flex-shrink-0 px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        activeCategory === cat.id
                          ? 'bg-brand-gold text-dark-950'
                          : 'bg-dark-900 text-slate-300 border border-white/10'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="flex-shrink-0 mr-4 lg:mr-2 w-10 h-10 rounded-full bg-dark-900 border border-white/10 flex items-center justify-center text-slate-200 cursor-pointer"
                  aria-label="Buscar"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* CARDÁPIO */}
          <main className="px-4 lg:px-2 pt-4 space-y-4">
            {searchQuery.trim() ? (
              <section>
                <p className="text-sm text-slate-400 mb-3">
                  {searchResults.length} {searchResults.length === 1 ? 'resultado' : 'resultados'} para “{searchQuery}”
                </p>
                {searchResults.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">Nada encontrado. Tente outra palavra.</div>
                ) : renderRows(searchResults)}
              </section>
            ) : (
              visibleCategories.map(cat => {
                const Icon = CATEGORY_ICONS[cat.icon] || Utensils;
                const isCollapsed = collapsed[cat.id];
                const tag = cat.id === 'pizzas' && cat.items.some(p => p.bordaGratis) ? 'Borda de Catupiry grátis' : cat.tag;
                return (
                  <section key={cat.id} id={`section-${cat.id}`} className="scroll-mt-20 rounded-2xl bg-dark-900/50 border border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setCollapsed(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                      className="w-full flex items-center gap-3 p-3.5 text-left cursor-pointer"
                      aria-expanded={!isCollapsed}
                    >
                      <span className="w-11 h-11 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-base font-bold text-white">{cat.name}</span>
                        {tag && <span className="block text-[13px] text-slate-400 truncate">{tag}</span>}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
                    </button>
                    {!isCollapsed && <div className="px-2.5 pb-2.5">{renderRows(cat.items)}</div>}
                  </section>
                );
              })
            )}

            {showBuffet && !searchQuery.trim() && (
              <button
                type="button"
                onClick={onOpenBuffet}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-brand-gold/15 to-transparent border border-brand-gold/30 text-left cursor-pointer"
              >
                <Sparkles className="w-6 h-6 text-brand-gold flex-shrink-0" />
                <span className="flex-1">
                  <span className="block font-bold text-white">Buffet para eventos</span>
                  <span className="block text-[13px] text-slate-400">Casamento, formatura, aniversário: monte seu cardápio e peça orçamento</span>
                </span>
                <ChevronRight className="w-5 h-5 text-brand-gold" />
              </button>
            )}

            <footer className="py-8 text-center text-xs text-slate-500 space-y-1">
              <p>{RESTAURANT_INFO.name}</p>
              <p>{activeBranch?.address || RESTAURANT_INFO.address}</p>
              <button type="button" onClick={onOpenAdmin} className="mt-2 text-slate-600 hover:text-slate-400 cursor-pointer">Área da equipe</button>
            </footer>
          </main>
        </div>

        {/* Sacola lateral no computador */}
        {desktopCart}
      </div>

      {/* Barra "Ver sacola" (celular) */}
      {totalCartCount > 0 && (
        <div className="fixed left-0 right-0 bottom-[64px] z-40 px-3 pb-2 lg:hidden">
          <button
            type="button"
            onClick={onOpenCart}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-brand-gold text-dark-950 font-bold shadow-glow-gold active:scale-[0.99] transition-transform cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="min-w-[1.6rem] h-6 px-1.5 rounded-lg bg-dark-950 text-brand-gold text-xs font-black flex items-center justify-center">{totalCartCount}</span>
              Ver sacola
            </span>
            <span className="font-black">{money(totalCartValue)}</span>
          </button>
        </div>
      )}

      {/* MENU INFERIOR (celular) */}
      <nav className="fixed left-0 right-0 bottom-0 z-40 lg:hidden bg-dark-900/98 backdrop-blur border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4 h-16">
          <NavBtn icon={Home} label="Início" active onClick={scrollTop} />
          <NavBtn icon={ReceiptText} label="Pedidos" badge={ordersCount} onClick={onOpenOrders} />
          <NavBtn icon={ShoppingBag} label="Sacola" badge={totalCartCount} onClick={onOpenCart} />
          <NavBtn icon={Info} label="Loja" onClick={() => setIsInfoOpen(true)} />
        </div>
      </nav>

      <StoreInfoSheet
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        activeBranch={activeBranch}
        restaurantInfo={restaurantInfo}
        isStoreOpen={isStoreOpen}
        openingHours={openingHours}
        canChangeBranch={canChangeBranch}
        onChangeBranch={() => { setIsInfoOpen(false); onOpenBranchModal(); }}
        showBuffet={showBuffet}
        onOpenBuffet={() => { setIsInfoOpen(false); onOpenBuffet(); }}
      />
    </div>
  );
}

function NavBtn({ icon: Icon, label, active, badge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold cursor-pointer ${active ? 'text-brand-gold' : 'text-slate-400'}`}
    >
      <span className="relative">
        <Icon className="w-6 h-6" />
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-2.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
            {badge}
          </span>
        )}
      </span>
      {label}
    </button>
  );
}
