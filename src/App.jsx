import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { BRANCHES, DEFAULT_BRANCH_ID } from './data/branchesData';
import { PRODUCTS, CATEGORIES, RESTAURANT_INFO } from './data/menuData';
import { Header } from './components/Header';
import { RestaurantStoreHeader } from './components/RestaurantStoreHeader';
import { PromotionsShelf } from './components/PromotionsShelf';
import { CategoryNav } from './components/CategoryNav';
import { ProductCard } from './components/ProductCard';
import { DesktopSidebarCart } from './components/DesktopSidebarCart';
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
import { 
  dispatchOrderToKitchen, 
  dispatchOrderUpdateToKitchen, 
  fetchCloudOrdersHistory, 
  subscribeToKitchenEvents 
} from './services/ordersSyncService';
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
  const [deliveryMode, setDeliveryMode] = useState('delivery');

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

  // Sync orders in real-time across devices (Cloud SSE + BroadcastChannel + API)
  useEffect(() => {
    // 1. Initial load from Cloud history (orders from last 24h across all phones/tablets)
    const initSync = async () => {
      try {
        const cloudOrders = await fetchCloudOrdersHistory();
        if (cloudOrders && cloudOrders.length > 0) {
          setAllOrders(prev => {
            const map = new Map();
            // Start with current local orders
            prev.forEach(o => { if (o?.orderId) map.set(o.orderId, o); });
            // Merge cloud orders (cloud might have updates or newer orders)
            cloudOrders.forEach(o => { if (o?.orderId) map.set(o.orderId, { ...(map.get(o.orderId) || {}), ...o }); });
            const list = Array.from(map.values());
            list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            try {
              localStorage.setItem('el_shadday_all_orders', JSON.stringify(list));
            } catch (e) {}
            return list;
          });
        }
      } catch (e) {
        console.warn('Initial cloud history sync failed:', e);
      }

      // Also try local /api/orders if running on dev server
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const apiOrders = await res.json();
          if (Array.isArray(apiOrders) && apiOrders.length > 0) {
            setAllOrders(prev => {
              const map = new Map();
              prev.forEach(o => { if (o?.orderId) map.set(o.orderId, o); });
              apiOrders.forEach(o => { if (o?.orderId) map.set(o.orderId, { ...(map.get(o.orderId) || {}), ...o }); });
              const list = Array.from(map.values());
              list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
              try {
                localStorage.setItem('el_shadday_all_orders', JSON.stringify(list));
              } catch (e) {}
              return list;
            });
          }
        }
      } catch (e) {}
    };

    initSync();

    // 2. Subscribe to instant real-time events (SSE Cloud + BroadcastChannel local)
    const unsubscribe = subscribeToKitchenEvents({
      onNewOrder: (newOrder) => {
        setAllOrders(prev => {
          if (prev.some(o => o.orderId === newOrder.orderId)) {
            return prev;
          }
          const updated = [newOrder, ...prev];
          try {
            localStorage.setItem('el_shadday_all_orders', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      },
      onOrderUpdate: (orderId, updates) => {
        setAllOrders(prev => {
          const updated = prev.map(o => o.orderId === orderId ? { ...o, ...updates } : o);
          try {
            localStorage.setItem('el_shadday_all_orders', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }
    });

    // 3. Fallback polling every 5 seconds for local API
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const apiOrders = await res.json();
          if (Array.isArray(apiOrders) && apiOrders.length > 0) {
            setAllOrders(prev => {
              let hasNew = false;
              const map = new Map();
              prev.forEach(o => { if (o?.orderId) map.set(o.orderId, o); });
              apiOrders.forEach(o => {
                if (o?.orderId && !map.has(o.orderId)) {
                  map.set(o.orderId, o);
                  hasNew = true;
                }
              });
              if (hasNew) {
                const list = Array.from(map.values());
                list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                try {
                  localStorage.setItem('el_shadday_all_orders', JSON.stringify(list));
                } catch (e) {}
                return list;
              }
              return prev;
            });
          }
        }
      } catch (e) {}
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

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
    setAllOrders(prev => {
      if (prev.some(o => o.orderId === orderData.orderId)) return prev;
      const updated = [orderData, ...prev];
      try {
        localStorage.setItem('el_shadday_all_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Send to kitchen across all real-time channels (Cloud SSE + BroadcastChannel + API)
    try {
      await dispatchOrderToKitchen(orderData);
    } catch (e) {
      console.warn('Could not dispatch order to kitchen:', e);
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
      await dispatchOrderUpdateToKitchen(orderId, { orderStatus: newStatus });
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
      await dispatchOrderUpdateToKitchen(orderId, { paymentStatus: newPaymentStatus });
    } catch (err) {
      console.error('Error updating payment status:', err);
    }
  };

  const handleCancelOrder = async (orderId, reason = '') => {
    setAllOrders(prev => {
      const updated = prev.map(o => o.orderId === orderId ? { 
        ...o, 
        orderStatus: 'CANCELADO', 
        cancelReason: reason || 'Cancelado pelo operador da cozinha',
        cancelledAt: new Date().toISOString()
      } : o);
      try {
        localStorage.setItem('el_shadday_all_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      await dispatchOrderUpdateToKitchen(orderId, { 
        orderStatus: 'CANCELADO', 
        cancelReason: reason || 'Cancelado pelo operador da cozinha',
        cancelledAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error cancelling order:', err);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    setAllOrders(prev => {
      const updated = prev.filter(o => o.orderId !== orderId);
      try {
        localStorage.setItem('el_shadday_all_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      await dispatchOrderUpdateToKitchen(orderId, { orderStatus: 'DELETED', isDeleted: true });
    } catch (err) {
      console.error('Error deleting order:', err);
    }
  };

  const handleCreateKitchenOrder = async (newOrder) => {
    setAllOrders(prev => {
      const updated = [newOrder, ...prev.filter(o => o.orderId !== newOrder.orderId)];
      try {
        localStorage.setItem('el_shadday_all_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      await dispatchOrderToKitchen(newOrder);
    } catch (err) {
      console.error('Error dispatching kitchen PDV order:', err);
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
        onCancelOrder={handleCancelOrder}
        onDeleteOrder={handleDeleteOrder}
        onCreateKitchenOrder={handleCreateKitchenOrder}
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
    <div className={`min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans selection:bg-brand-gold selection:text-dark-950 w-full max-w-full overflow-x-hidden ${totalCartCount > 0 ? 'pb-24 sm:pb-0' : ''}`}>
      
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

      {/* 2. Restaurant Profile & iFood Header (Cover, Avatar, Ratings, Delivery Switcher) */}
      <RestaurantStoreHeader
        activeBranch={activeBranch}
        onOpenBranchModal={() => setIsBranchModalOpen(true)}
        deliveryMode={deliveryMode}
        onToggleDeliveryMode={setDeliveryMode}
        onScrollToCategory={handleSelectCategory}
      />

      {/* 2.1 Promotions & Highlights Shelf */}
      <PromotionsShelf
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
        onAddToCart={handleAddToCart}
      />

      {/* 3. Category Navigation & Search */}
      <div ref={menuSectionRef}>
        <CategoryNav
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onScrollToBuffet={scrollToBuffet}
        />
      </div>

      {/* 4. Menu Grid & Desktop Sidebar Layout (iFood Standard) */}
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Menu Items & Categories (8 columns on desktop) */}
          <div className="lg:col-span-8 space-y-8 min-w-0">
            
            {/* SEARCH MODE: When user typed something */}
            {searchQuery.trim() ? (
              <section className="py-2">
                <div className="mb-5 border-b border-dark-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg sm:text-xl font-display font-extrabold text-white flex items-center gap-2">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    {searchResults.map((product) => {
                      const inCart = cartItems.find(item => item.id === product.id);
                      return (
                        <ProductCard
                          key={product.id}
                          product={product}
                          cartQuantity={inCart ? inCart.quantity : 0}
                          cartItem={inCart}
                          onAddToCart={handleAddToCart}
                          onUpdateQuantity={handleUpdateQuantity}
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
                    className="scroll-mt-36 pt-2 pb-6 border-b border-dark-800/80 last:border-b-0"
                  >
                    {/* Category Header */}
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-dark-800/60 pb-2.5">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg sm:text-xl font-display font-extrabold text-white tracking-tight">
                            {cat.name}
                          </h3>
                          {cat.tag && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-goldLight border border-brand-gold/30">
                              {cat.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {categoryProducts.length} {categoryProducts.length === 1 ? 'delícia disponível' : 'delícias disponíveis'}
                        </p>
                      </div>
                    </div>

                    {/* Products Grid for this category (2 columns on desktop/tablet, 1 col on mobile) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                      {categoryProducts.map((product) => {
                        const inCart = cartItems.find(item => item.id === product.id);
                        return (
                          <ProductCard
                            key={product.id}
                            product={product}
                            cartQuantity={inCart ? inCart.quantity : 0}
                            cartItem={inCart}
                            onAddToCart={handleAddToCart}
                            onUpdateQuantity={handleUpdateQuantity}
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

          </div>

          {/* Right Column: Desktop Sidebar Cart (4 columns on desktop, hidden on mobile) */}
          <DesktopSidebarCart
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onOpenCheckout={() => setIsCartOpen(true)}
            activeBranch={activeBranch}
            deliveryMode={deliveryMode}
            deliveryFee={8}
          />

        </div>
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
        initialDeliveryType={deliveryMode}
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
