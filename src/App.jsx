import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { BRANCHES, DEFAULT_BRANCH_ID } from './data/branchesData';
import { PRODUCTS, CATEGORIES, RESTAURANT_INFO } from './data/menuData';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryNav } from './components/CategoryNav';
import { ProductCard } from './components/ProductCard';
import { BoxBuilderModal } from './components/BoxBuilderModal';
import { PizzaCustomizerModal } from './components/PizzaCustomizerModal';
import { ComboCustomizerModal } from './components/ComboCustomizerModal';
import { BranchSelectorModal } from './components/BranchSelectorModal';
import { ConstructionModal } from './components/ConstructionModal';
import { DeliveryCartDrawer } from './components/DeliveryCartDrawer';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { BuffetSection } from './components/BuffetSection';
import { Footer } from './components/Footer';
import { BuffetApp } from './buffet/BuffetApp';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ShoppingBag, ArrowRight, Sparkles, ChevronRight, Phone, Search, ChefHat } from 'lucide-react';

const getInitialOrders = () => {
  try {
    const saved = localStorage.getItem('el_shadday_all_orders');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

export default function App() {
  // App View mode: 'delivery' (default & primary) | 'admin' (kitchen KDS) | 'full-buffet' (showcase)
  const [appView, setAppView] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'buffet') return 'full-buffet';
      if (params.get('mode') === 'admin' || window.location.hash.includes('admin')) {
        if (sessionStorage.getItem('el_shadday_admin_auth') === 'true') {
          return 'admin';
        }
      }
      return 'delivery';
    } catch (e) {
      return 'delivery';
    }
  });

  // Branch Selection State
  const [selectedBranchId, setSelectedBranchId] = useState(() => {
    try {
      return localStorage.getItem('el_shadday_selected_branch') || DEFAULT_BRANCH_ID;
    } catch (e) {
      return DEFAULT_BRANCH_ID;
    }
  });

  // Open branch selector modal on first visit or when user clicks to switch
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(() => {
    try {
      const hasChosen = localStorage.getItem('el_shadday_has_seen_branch_modal');
      return !hasChosen; // Open on first visit
    } catch (e) {
      return true;
    }
  });

  const [isConstructionModalOpen, setIsConstructionModalOpen] = useState(false);

  // Cart & Menu State
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('el_shadday_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Save cart in localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('el_shadday_cart_items', JSON.stringify(cartItems));
    } catch (e) {}
  }, [cartItems]);

  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  // Kitchen & Admin State
  const [allOrders, setAllOrders] = useState(() => getInitialOrders());
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('el_shadday_admin_auth') === 'true';
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  // Fetch orders from server API and poll every 3 seconds
  const fetchOrdersFromServer = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAllOrders(data);
          try {
            localStorage.setItem('el_shadday_all_orders', JSON.stringify(data));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('Could not fetch /api/orders, using local orders cache');
    }
  }, []);

  useEffect(() => {
    fetchOrdersFromServer();
    const interval = setInterval(fetchOrdersFromServer, 3000);
    return () => clearInterval(interval);
  }, [fetchOrdersFromServer]);

  // Handle URL hash changes (#/admin, #admin, #/cozinha)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#/admin' || hash === '#admin' || hash === '#/cozinha' || hash === '#cozinha') {
        if (sessionStorage.getItem('el_shadday_admin_auth') === 'true') {
          setAppView('admin');
        } else {
          setIsAdminLoginModalOpen(true);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Modals State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBoxBuilderOpen, setIsBoxBuilderOpen] = useState(false);
  const [selectedBoxForBuilder, setSelectedBoxForBuilder] = useState(null);
  const [isPizzaCustomizerOpen, setIsPizzaCustomizerOpen] = useState(false);
  const [selectedPizzaForCustomizer, setSelectedPizzaForCustomizer] = useState(null);
  const [isComboCustomizerOpen, setIsComboCustomizerOpen] = useState(false);
  const [selectedComboForCustomizer, setSelectedComboForCustomizer] = useState(null);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);
  const [completedOrderData, setCompletedOrderData] = useState(null);

  const menuSectionRef = useRef(null);

  // Active branch object
  const activeBranch = useMemo(() => {
    return BRANCHES.find(b => b.id === selectedBranchId) || BRANCHES[0];
  }, [selectedBranchId]);

  // Branch switch handler
  const handleSelectBranch = (branchId) => {
    const branch = BRANCHES.find(b => b.id === branchId);
    if (!branch) return;

    if (branch.status === 'construction') {
      setIsBranchModalOpen(false);
      setIsConstructionModalOpen(true);
      return;
    }

    setSelectedBranchId(branchId);
    try {
      localStorage.setItem('el_shadday_selected_branch', branchId);
      localStorage.setItem('el_shadday_has_seen_branch_modal', 'true');
    } catch (e) {}
    setIsBranchModalOpen(false);
  };

  // Cart Handlers
  const handleAddToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
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

  const handleAddComboToCart = (customCombo) => {
    setCartItems(prev => [...prev, { ...customCombo, quantity: 1 }]);
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

  const handleOrderFinished = async (orderData) => {
    setCompletedOrderData(orderData);
    setIsCartOpen(false);
    setIsOrderSuccessOpen(true);
    setCartItems([]); // Clear cart upon successful order dispatch

    // Save optimistically to allOrders for the kitchen display
    setAllOrders(prev => [orderData, ...prev]);

    // Send to /api/orders so kitchen sees it immediately
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
    } catch (e) {
      console.warn('Could not post order to server:', e);
    }
  };

  // Kitchen Admin Handlers
  const handleOpenAdminTrigger = () => {
    if (isAdminLoggedIn) {
      setAppView('admin');
      window.location.hash = '#/admin';
    } else {
      setIsAdminLoginModalOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    sessionStorage.setItem('el_shadday_admin_auth', 'true');
    setIsAdminLoginModalOpen(false);
    setAppView('admin');
    window.location.hash = '#/admin';
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('el_shadday_admin_auth');
    setAppView('delivery');
    window.location.hash = '';
  };

  const handleBackToSiteFromAdmin = () => {
    setAppView('delivery');
    window.location.hash = '';
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setAllOrders(prev => {
      const updated = prev.map(o => o.orderId === orderId ? { ...o, orderStatus: newStatus } : o);
      try {
        localStorage.setItem('el_shadday_all_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus })
      });
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const handleUpdatePaymentStatus = async (orderId, newPaymentStatus) => {
    setAllOrders(prev => {
      const updated = prev.map(o => o.orderId === orderId ? { ...o, paymentStatus: newPaymentStatus } : o);
      try {
        localStorage.setItem('el_shadday_all_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

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

  // Quick scroll to a category section
  const handleSelectCategory = (catId) => {
    setActiveCategory(catId);
    setSearchQuery('');
    const target = document.getElementById(`section-${catId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // IntersectionObserver to sync top category pill as user scrolls
  useEffect(() => {
    if (searchQuery.trim() || appView !== 'delivery') return;

    const handleScrollObserver = () => {
      const scrollPosition = window.scrollY + 200;

      for (const cat of CATEGORIES) {
        const el = document.getElementById(`section-${cat.id}`);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveCategory(cat.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScrollObserver, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollObserver);
  }, [searchQuery, appView]);

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query) ||
      p.details?.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Cart summary
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartValue = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Smooth scroll to menu
  const scrollToMenu = () => {
    if (menuSectionRef.current) {
      menuSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Smooth scroll to Buffet
  const scrollToBuffet = () => {
    const el = document.getElementById('buffet-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // VIEW 1: KITCHEN KDS / PAINEL DA COZINHA
  if (appView === 'admin') {
    return (
      <AdminDashboard
        orders={allOrders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onUpdatePaymentStatus={handleUpdatePaymentStatus}
        onLogout={handleAdminLogout}
        onBackToSite={handleBackToSiteFromAdmin}
      />
    );
  }

  // VIEW 2: FULL BUFFET SHOWCASE
  if (appView === 'full-buffet') {
    return (
      <div className="relative min-h-screen bg-dark-950">
        <div className="bg-[#B3913A] text-[#15191F] font-bold text-xs py-2 px-4 text-center sticky top-0 z-50 flex items-center justify-center gap-3 shadow-md">
          <span>👑 Você está visualizando a Apresentação Completa de Buffet.</span>
          <button 
            onClick={() => setAppView('delivery')} 
            className="bg-[#15191F] text-[#E8D58A] px-3 py-1 rounded-md text-[11px] font-extrabold uppercase hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Voltar para o Delivery El Shadday 🍕
          </button>
        </div>
        <BuffetApp 
          currentAppMode="buffet" 
          onToggleAppMode={() => setAppView('delivery')} 
        />
      </div>
    );
  }

  // VIEW 3: MAIN DELIVERY EXPERIENCE
  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans selection:bg-brand-gold selection:text-dark-950">
      
      {/* 1. Header with Branch, Cart and Kitchen Controls */}
      <Header
        cartCount={totalCartCount}
        cartTotal={totalCartValue}
        onOpenCart={() => setIsCartOpen(true)}
        activeBranch={activeBranch}
        onOpenBranchModal={() => setIsBranchModalOpen(true)}
        onScrollToBuffet={scrollToBuffet}
        onOpenAdmin={handleOpenAdminTrigger}
      />

      {/* 2. Hero Presentation */}
      <Hero 
        onOpenBoxBuilder={() => {
          setSelectedBoxForBuilder(null);
          setIsBoxBuilderOpen(true);
        }}
        onScrollToMenu={scrollToMenu}
      />

      {/* 3. Category Navigation & Search */}
      <div ref={menuSectionRef}>
        <CategoryNav
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* 4. Menu Grid (Continuous Flow by Categories or Search Results) */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        
        {/* Banner with Delivery Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-dark-900/90 border border-dark-800 p-4 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <div>
              <span className="text-xs sm:text-sm font-bold text-white block">
                Atendimento Delivery em Ariquemes - RO
              </span>
              <span className="text-[11px] text-slate-400">
                Pioneiros em caixas de esfirras artesanais • Entrega em 45 a 75 minutos
              </span>
            </div>
          </div>

          <div className="text-xs text-brand-gold font-extrabold bg-dark-950 px-3 py-1.5 rounded-xl border border-brand-gold/30 self-start sm:self-auto">
            Borda de Catupiry GRÁTIS nas Pizzas Salgadas! 🧀
          </div>
        </div>

        {/* SEARCH MODE: When user typed something */}
        {searchQuery.trim() ? (
          <section className="py-6">
            <div className="mb-6 border-b border-dark-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-brand-gold" />
                  <span>Resultados para "{searchQuery}"</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {searchResults.length} {searchResults.length === 1 ? 'item encontrado' : 'itens encontrados'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-brand-gold hover:underline cursor-pointer"
              >
                Limpar Busca
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-16 bg-dark-900/50 rounded-3xl border border-dark-800">
                <p className="text-sm text-slate-400">Nenhum item encontrado para esta busca.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 px-4 py-2 rounded-xl bg-brand-gold text-dark-950 font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
                >
                  Ver Todo o Cardápio
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {searchResults.map((product) => {
                  const inCart = cartItems.find(item => item.id === product.id);
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      cartQuantity={inCart ? inCart.quantity : 0}
                      onAddToCart={handleAddToCart}
                      onOpenBoxBuilder={(prod) => {
                        setSelectedBoxForBuilder(prod);
                        setIsBoxBuilderOpen(true);
                      }}
                      onOpenPizzaCustomizer={(prod) => {
                        setSelectedPizzaForCustomizer(prod);
                        setIsPizzaCustomizerOpen(true);
                      }}
                      onOpenComboCustomizer={(prod) => {
                        setSelectedComboForCustomizer(prod);
                        setIsComboCustomizerOpen(true);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          /* CONTINUOUS FLOW MODE: All categories displayed in full sequence! */
          CATEGORIES.map((cat) => {
            const categoryProducts = PRODUCTS.filter(p => p.categoryId === cat.id);
            if (categoryProducts.length === 0) return null;

            return (
              <section 
                key={cat.id} 
                id={`section-${cat.id}`} 
                className="scroll-mt-36 pt-6 pb-8 border-b border-dark-800/80 last:border-b-0"
              >
                {/* Category Header */}
                <div className="mb-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-dark-800/60 pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-tight">
                        {cat.name}
                      </h3>
                      {cat.tag && (
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-gold/15 text-brand-goldLight border border-brand-gold/30">
                          {cat.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {categoryProducts.length} {categoryProducts.length === 1 ? 'delícia disponível' : 'delícias disponíveis'}
                    </p>
                  </div>

                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Role para baixo para ver mais categorias
                  </span>
                </div>

                {/* Products Grid for this category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {categoryProducts.map((product) => {
                    const inCart = cartItems.find(item => item.id === product.id);
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        cartQuantity={inCart ? inCart.quantity : 0}
                        onAddToCart={handleAddToCart}
                        onOpenBoxBuilder={(prod) => {
                          setSelectedBoxForBuilder(prod);
                          setIsBoxBuilderOpen(true);
                        }}
                        onOpenPizzaCustomizer={(prod) => {
                          setSelectedPizzaForCustomizer(prod);
                          setIsPizzaCustomizerOpen(true);
                        }}
                        onOpenComboCustomizer={(prod) => {
                          setSelectedComboForCustomizer(prod);
                          setIsComboCustomizerOpen(true);
                        }}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })
        )}

      </main>

      {/* 5. Buffet Section at the Bottom (Quotation via WhatsApp) */}
      <BuffetSection onExploreFullBuffet={() => setAppView('full-buffet')} />

      {/* 6. Footer */}
      <Footer onOpenAdmin={handleOpenAdminTrigger} />

      {/* 7. Floating Bottom Bar on Mobile when Cart has Items */}
      {totalCartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-dark-950/95 backdrop-blur-md border-t border-brand-gold/40 sm:hidden animate-fade-in shadow-2xl">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold text-dark-950 font-black text-sm flex items-center justify-between shadow-glow-gold active:scale-98 transition-transform cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-dark-950" />
              <span>Ver Pedido ({totalCartCount} {totalCartCount === 1 ? 'item' : 'itens'})</span>
            </div>
            <div className="flex items-center gap-1">
              <span>R$ {totalCartValue.toFixed(2).replace('.', ',')}</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </div>
          </button>
        </div>
      )}

      {/* 8. Modals & Drawers */}
      
      {/* Branch Selector Modal */}
      <BranchSelectorModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        selectedBranchId={selectedBranchId}
        onSelectBranch={handleSelectBranch}
      />

      {/* Porto Velho Construction Modal */}
      <ConstructionModal
        isOpen={isConstructionModalOpen}
        onClose={() => setIsConstructionModalOpen(false)}
        onSelectAriquemes={() => handleSelectBranch('ariquemes')}
      />

      {/* Delivery Cart Drawer (Streamlined WhatsApp Checkout) */}
      <DeliveryCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderFinished={handleOrderFinished}
        activeBranch={activeBranch}
      />

      {/* Order Success & Pix Proof Modal */}
      <OrderSuccessModal
        isOpen={isOrderSuccessOpen}
        onClose={() => setIsOrderSuccessOpen(false)}
        orderData={completedOrderData}
        onNewOrder={() => {
          setIsOrderSuccessOpen(false);
          setCompletedOrderData(null);
        }}
      />

      {/* Kitchen Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Box Builder Modal */}
      <BoxBuilderModal
        isOpen={isBoxBuilderOpen}
        onClose={() => setIsBoxBuilderOpen(false)}
        onAddBoxToCart={handleAddBoxToCart}
        initialBox={selectedBoxForBuilder}
      />

      {/* Pizza Customizer Modal */}
      <PizzaCustomizerModal
        isOpen={isPizzaCustomizerOpen}
        onClose={() => setIsPizzaCustomizerOpen(false)}
        pizzaProduct={selectedPizzaForCustomizer}
        onAddPizzaToCart={handleAddPizzaToCart}
      />

      {/* Combo Customizer Modal (Handles Multi-Pizza selection) */}
      <ComboCustomizerModal
        isOpen={isComboCustomizerOpen}
        onClose={() => setIsComboCustomizerOpen(false)}
        comboProduct={selectedComboForCustomizer}
        onAddComboToCart={handleAddComboToCart}
      />

    </div>
  );
}
