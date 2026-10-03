import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { BuffetApp } from './buffet/BuffetApp';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryNav } from './components/CategoryNav';
import { ProductCard } from './components/ProductCard';
import { BoxBuilderModal } from './components/BoxBuilderModal';
import { PizzaCustomizerModal } from './components/PizzaCustomizerModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutPaymentModal } from './components/CheckoutPaymentModal';
import { OrderConfirmationView } from './components/OrderConfirmationView';
import { OrdersListModal } from './components/OrdersListModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import { PRODUCTS, CATEGORIES } from './data/menuData';
import { ChevronRight, Package } from 'lucide-react';

// Generates or retrieves an anonymous private client ID on this device (NO ACCOUNT NEEDED!)
const getOrCreateClientId = () => {
  try {
    let id = localStorage.getItem('el_shadday_client_id');
    if (!id) {
      id = 'cli_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem('el_shadday_client_id', id);
    }
    return id;
  } catch (e) {
    return 'cli_guest_' + Date.now();
  }
};

const getLocalMyOrderIds = () => {
  try {
    const saved = localStorage.getItem('el_shadday_my_order_ids');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

export function LegacyDeliveryApp({ onSwitchToBuffet }) {
  const [cartItems, setCartItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  
  // View mode: 'menu' | 'order-receipt' | 'admin'
  const [currentView, setCurrentView] = useState('menu');
  const [activeOrder, setActiveOrder] = useState(null);

  // Private Client Identity (No account creation needed, scoped to customer's device)
  const [clientId] = useState(() => getOrCreateClientId());
  const [myOrderIds, setMyOrderIds] = useState(() => getLocalMyOrderIds());

  // Admin Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('el_shadday_admin_auth') === 'true';
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  // All orders in the system (fetched from server API)
  const [allOrders, setAllOrders] = useState([]);

  // Fetch orders from server API
  const fetchOrdersFromServer = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAllOrders(data);
        }
      }
    } catch (err) {
      console.warn('Could not fetch /api/orders, falling back to local state:', err);
    }
  }, []);

  // Poll server every 2.5 seconds to keep kitchen and client always in sync across tabs & devices
  useEffect(() => {
    fetchOrdersFromServer();
    const interval = setInterval(fetchOrdersFromServer, 2500);
    return () => clearInterval(interval);
  }, [fetchOrdersFromServer]);

  // Filter orders that belong STRICTLY to this anonymous customer device
  const myOrders = useMemo(() => {
    return allOrders.filter(order => 
      order.customerId === clientId || myOrderIds.includes(order.orderId)
    );
  }, [allOrders, clientId, myOrderIds]);

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingOrderDetails, setPendingOrderDetails] = useState(null);
  const [isOrdersListOpen, setIsOrdersListOpen] = useState(false);
  const [isBoxBuilderOpen, setIsBoxBuilderOpen] = useState(false);
  const [selectedBoxForBuilder, setSelectedBoxForBuilder] = useState(null);
  const [isPizzaCustomizerOpen, setIsPizzaCustomizerOpen] = useState(false);
  const [selectedPizzaForCustomizer, setSelectedPizzaForCustomizer] = useState(null);

  const menuRef = useRef(null);

  // Handle URL hash for sharing or opening order directly
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#/admin') {
        if (sessionStorage.getItem('el_shadday_admin_auth') === 'true') {
          setCurrentView('admin');
        } else {
          setIsAdminLoginModalOpen(true);
        }
      } else if (hash.startsWith('#/pedido/')) {
        const orderId = hash.replace('#/pedido/', '');
        // Client can only view their own order (or if admin is logged in, can view any order)
        const found = allOrders.find(o => 
          o.orderId === orderId && (
            o.customerId === clientId || 
            myOrderIds.includes(o.orderId) || 
            sessionStorage.getItem('el_shadday_admin_auth') === 'true'
          )
        );
        if (found) {
          setActiveOrder(found);
          setCurrentView('order-receipt');
        } else {
          // If order doesn't belong to client, don't show other people's order!
          window.location.hash = '';
          setCurrentView('menu');
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [allOrders, clientId, myOrderIds]);

  // Cart operations
  const handleAddToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleAddBoxToCart = (customBox) => {
    setCartItems(prev => [...prev, { ...customBox, quantity: 1 }]);
    setIsCartOpen(true);
  };

  const handleAddPizzaToCart = (customPizza) => {
    setCartItems(prev => [...prev, { ...customPizza, quantity: 1 }]);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (itemId, delta) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const handleRemoveItem = (itemId) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartValue = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Transition from Cart to In-Site Payment
  const handleProceedToPayment = (orderDetails) => {
    setPendingOrderDetails(orderDetails);
    setIsCartOpen(false);
    setIsPaymentModalOpen(true);
  };

  // Payment successful callback - Attaches private customerId and sends to Server API!
  const handlePaymentSuccess = async (newOrder) => {
    const orderWithClient = {
      ...newOrder,
      customerId: clientId // Scoped specifically to this customer!
    };

    // Save ID in client's local tracker
    const updatedMyIds = [orderWithClient.orderId, ...myOrderIds];
    setMyOrderIds(updatedMyIds);
    try {
      localStorage.setItem('el_shadday_my_order_ids', JSON.stringify(updatedMyIds));
    } catch (e) {}

    // 1. Optimistic update in state
    setAllOrders(prev => [orderWithClient, ...prev]);

    // 2. Send to Server API (this guarantees the kitchen sees it immediately!)
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderWithClient)
      });
    } catch (err) {
      console.error('Failed to post order to server:', err);
    }

    // Clear cart
    setCartItems([]);
    // Close payment modal
    setIsPaymentModalOpen(false);
    // Switch view to the confirmed order receipt
    setActiveOrder(orderWithClient);
    setCurrentView('order-receipt');
    window.location.hash = `#/pedido/${orderWithClient.orderId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
    setActiveOrder(null);
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin actions
  const handleOpenAdminTrigger = () => {
    if (isAdminLoggedIn) {
      setCurrentView('admin');
      window.location.hash = '#/admin';
    } else {
      setIsAdminLoginModalOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    sessionStorage.setItem('el_shadday_admin_auth', 'true');
    setCurrentView('admin');
    window.location.hash = '#/admin';
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('el_shadday_admin_auth');
    setCurrentView('menu');
    window.location.hash = '';
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setAllOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, orderStatus: newStatus } : o));
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus })
      });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleUpdatePaymentStatus = async (orderId, newPaymentStatus) => {
    setAllOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, paymentStatus: newPaymentStatus } : o));
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newPaymentStatus })
      });
    } catch (err) {
      console.error('Error updating payment status:', err);
    }
  };

  // Open builder modals
  const handleOpenBoxBuilder = (boxProduct = null) => {
    setSelectedBoxForBuilder(boxProduct);
    setIsBoxBuilderOpen(true);
  };

  const handleOpenPizzaCustomizer = (pizzaProduct) => {
    setSelectedPizzaForCustomizer(pizzaProduct);
    setIsPizzaCustomizerOpen(true);
  };

  const scrollToMenu = () => {
    menuRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return PRODUCTS.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }
    return PRODUCTS.filter(p => p.categoryId === activeCategory);
  }, [activeCategory, searchQuery]);

  const activeCategoryObj = CATEGORIES.find(c => c.id === activeCategory);

  // VIEW 1: ADMIN DASHBOARD (Pizzaria Kitchen & Control Center - SEES ALL ORDERS)
  if (currentView === 'admin' && isAdminLoggedIn) {
    return (
      <AdminDashboard
        orders={allOrders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onUpdatePaymentStatus={handleUpdatePaymentStatus}
        onLogout={handleAdminLogout}
        onBackToSite={handleBackToMenu}
      />
    );
  }

  // VIEW 2: ORDER RECEIPT / TRACKING (Client view - SEES ONLY THEIR OWN ORDER)
  if (currentView === 'order-receipt' && activeOrder) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col font-sans selection:bg-brand-gold selection:text-dark-950">
        <Header
          cartCount={totalCartCount}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenBoxBuilder={() => handleOpenBoxBuilder()}
          confirmedOrdersCount={myOrders.length}
          onOpenOrdersList={() => setIsOrdersListOpen(true)}
          onOpenAdmin={handleOpenAdminTrigger}
        />
        <OrderConfirmationView
          order={activeOrder}
          onBackToMenu={handleBackToMenu}
        />
        <OrdersListModal
          isOpen={isOrdersListOpen}
          onClose={() => setIsOrdersListOpen(false)}
          orders={myOrders}
          onSelectOrder={(ord) => {
            setActiveOrder(ord);
            setCurrentView('order-receipt');
            window.location.hash = `#/pedido/${ord.orderId}`;
          }}
        />
        <AdminLoginModal
          isOpen={isAdminLoginModalOpen}
          onClose={() => setIsAdminLoginModalOpen(false)}
          onLoginSuccess={handleAdminLoginSuccess}
        />
        <Footer onOpenAdmin={handleOpenAdminTrigger} />
      </div>
    );
  }

  // VIEW 3: MAIN CLIENT CATALOG
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col font-sans selection:bg-brand-gold selection:text-dark-950">
      
      {/* Main Header - shows myOrders.length ONLY for this client */}
      <Header
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenBoxBuilder={() => handleOpenBoxBuilder()}
        confirmedOrdersCount={myOrders.length}
        onOpenOrdersList={() => setIsOrdersListOpen(true)}
        onOpenAdmin={handleOpenAdminTrigger}
      />

      {/* Hero Section */}
      <Hero
        onOpenBoxBuilder={() => handleOpenBoxBuilder()}
        onScrollToMenu={scrollToMenu}
      />

      {/* Main Menu Area */}
      <main ref={menuRef} className="flex-1 pb-24">
        
        {/* Category Navigation Bar */}
        <CategoryNav
          activeCategory={activeCategory}
          onSelectCategory={(id) => {
            setActiveCategory(id);
            setSearchQuery('');
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-8 pb-4 border-b border-dark-850 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                  {searchQuery ? `Resultados para "${searchQuery}"` : activeCategoryObj?.name}
                </h2>
                {!searchQuery && activeCategoryObj?.tag && (
                  <span className="hidden sm:inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                    {activeCategoryObj.tag}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {searchQuery 
                  ? `Encontramos ${filteredProducts.length} itens correspondentes`
                  : `Preparados no capricho com ingredientes frescos e selecionados`
                }
              </p>
            </div>

            {/* Quick Box Builder Trigger if viewing boxes */}
            {(activeCategory === 'caixas' || activeCategory === 'combos') && !searchQuery && (
              <button
                onClick={() => handleOpenBoxBuilder()}
                className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold border border-brand-gold/30 transition-all cursor-pointer"
              >
                <Package className="w-4 h-4" />
                <span>Personalizar Sabores da Caixa</span>
              </button>
            )}
          </div>

          {/* Cards Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-dark-900/60 rounded-3xl border border-dark-800">
              <p className="text-base font-bold text-slate-300">
                Nenhum sabor encontrado para sua busca.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Tente buscar por termos como "carne", "calabresa", "chocolate", "pizza" ou limpe a busca.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 rounded-xl bg-brand-gold text-dark-950 font-bold text-xs cursor-pointer"
              >
                Ver Todas as Opções
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredProducts.map((product) => {
                const inCart = cartItems.find(item => item.id === product.id);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    cartQuantity={inCart ? inCart.quantity : 0}
                    onAddToCart={handleAddToCart}
                    onOpenBoxBuilder={handleOpenBoxBuilder}
                    onOpenPizzaCustomizer={handleOpenPizzaCustomizer}
                  />
                );
              })}
            </div>
          )}

        </div>

      </main>

      {/* Floating Mobile Cart Bar */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden animate-slide-up">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold text-dark-950 p-4 rounded-2xl shadow-glow-gold flex items-center justify-between font-extrabold text-sm cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-dark-950 text-brand-gold flex items-center justify-center text-xs font-black">
                {totalCartCount}
              </div>
              <span>Ver Pedido</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs opacity-80">Total:</span>
              <span className="text-base font-black">R$ {totalCartValue.toFixed(2).replace('.', ',')}</span>
              <ChevronRight className="w-5 h-5 text-dark-950" />
            </div>
          </button>
        </div>
      )}

      {/* Modals & Drawers */}
      <BoxBuilderModal
        isOpen={isBoxBuilderOpen}
        onClose={() => setIsBoxBuilderOpen(false)}
        onAddBoxToCart={handleAddBoxToCart}
        initialBox={selectedBoxForBuilder}
      />

      <PizzaCustomizerModal
        isOpen={isPizzaCustomizerOpen}
        onClose={() => setIsPizzaCustomizerOpen(false)}
        pizzaProduct={selectedPizzaForCustomizer}
        onAddPizzaToCart={handleAddPizzaToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onProceedToPayment={handleProceedToPayment}
      />

      <CheckoutPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        cartItems={cartItems}
        orderDetails={pendingOrderDetails}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Client's Private Orders List (ONLY shows orders from this customer device) */}
      <OrdersListModal
        isOpen={isOrdersListOpen}
        onClose={() => setIsOrdersListOpen(false)}
        orders={myOrders}
        onSelectOrder={(ord) => {
          setActiveOrder(ord);
          setCurrentView('order-receipt');
          window.location.hash = `#/pedido/${ord.orderId}`;
        }}
      />

      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Footer */}
      <Footer onOpenAdmin={handleOpenAdminTrigger} />

    </div>
  );
}

export default function App() {
  const [appMode, setAppMode] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('mode') === 'delivery') return 'delivery';
      const saved = localStorage.getItem('el_shadday_active_app_mode');
      return saved === 'delivery' ? 'delivery' : 'buffet';
    } catch (e) {
      return 'buffet';
    }
  });

  const handleToggleMode = () => {
    setAppMode(prev => {
      const next = prev === 'buffet' ? 'delivery' : 'buffet';
      try {
        localStorage.setItem('el_shadday_active_app_mode', next);
      } catch (e) {}
      return next;
    });
  };

  if (appMode === 'delivery') {
    return (
      <div className="relative min-h-screen bg-dark-950">
        {/* Banner notifying that delivery is currently in standby */}
        <div className="bg-[#B3913A] text-[#15191F] font-bold text-xs py-2 px-4 text-center sticky top-0 z-50 flex items-center justify-center gap-3 shadow-md">
          <span>ℹ️ Modo Delivery de Pizzas (Legado - Temporariamente em Stand-by).</span>
          <button 
            onClick={handleToggleMode} 
            className="bg-[#15191F] text-[#E8D58A] px-3 py-1 rounded-md text-[11px] font-extrabold uppercase hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Ir para El Shadday Serviços de Buffet
          </button>
        </div>
        <LegacyDeliveryApp onSwitchToBuffet={handleToggleMode} />
      </div>
    );
  }

  return (
    <BuffetApp 
      currentAppMode={appMode} 
      onToggleAppMode={handleToggleMode} 
    />
  );
}
