import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { BRANCHES, DEFAULT_BRANCH_ID, getStoredBranches } from './data/branchesData';
import { INITIAL_MULTI_BRANCH_ORDERS } from './data/initialOrdersData';
import { getCurrentUser, logoutUser, ROLES } from './services/authService';
import { 
  PRODUCTS, 
  CATEGORIES, 
  RESTAURANT_INFO,
  getStoredProducts,
  saveStoredProducts,
  getStoredPromoSettings,
  saveStoredPromoSettings,
  getStoredRestaurantInfo,
  saveStoredRestaurantInfo,
  saveStoredPizzaFlavors,
  normalizeProductsList,
  normalizePizzaFlavors
} from './data/menuData';
import { saveStoredBuffetGallery, isFakeGalleryItem, saveUnavailableBuffetItemIds } from './buffet/buffetData';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
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
  dispatchOrderDelete,
  dispatchClearAllOrders,
  fetchCloudOrdersHistory, 
  subscribeToKitchenEvents 
} from './services/ordersSyncService';
import { 
  fetchCloudConfigHistory, 
  subscribeToConfigEvents 
} from './services/configSyncService';
import { ShoppingBag, ArrowRight, Sparkles, ChevronRight, Phone, Search, ChefHat } from 'lucide-react';

const getInitialOrders = () => {
  try {
    const saved = localStorage.getItem('el_shadday_all_orders');
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  // When Supabase is configured, do not inject mock dummy orders if database is empty
  return isSupabaseConfigured ? [] : INITIAL_MULTI_BRANCH_ORDERS;
};


// Error Boundary to prevent blank/black screens on any unexpected runtime error
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-brand-gold border border-brand-gold/40 flex items-center justify-center mb-4 text-3xl font-black">
            ⚠️
          </div>
          <h2 className="text-xl sm:text-2xl font-black mb-2 text-white font-display">
            Restaurando Painel El Shadday
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6">
            Ocorreu uma pequena oscilação temporária na interface. Seus pedidos e configurações permanecem 100% seguros.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold text-dark-950 font-black text-xs hover:scale-102 transition-transform shadow-glow-gold cursor-pointer"
            >
              🔄 Recarregar Painel
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                sessionStorage.removeItem('el_shadday_admin_auth');
                window.location.hash = '';
                window.location.href = window.location.pathname;
              }}
              className="px-5 py-3 rounded-xl bg-dark-900 text-slate-200 border border-dark-750 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              🍕 Ir para o Cardápio Delivery
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // App View mode: 'delivery' (default & primary) | 'admin' (kitchen KDS) | 'full-buffet' (showcase) | 'cardapio-evento' (buffet menu builder)
  const [appView, setAppView] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'buffet') return 'full-buffet';
      if (params.get('mode') === 'cardapio-evento' || params.get('mode') === 'orcamento') return 'cardapio-evento';
      const hash = window.location.hash;
      if (hash.includes('cardapio-evento') || hash.includes('orcamento') || hash.includes('buffet-cardapio')) return 'cardapio-evento';
      if (hash.includes('buffet')) return 'full-buffet';
      if (params.get('mode') === 'admin' || hash.includes('admin')) {
        if (sessionStorage.getItem('el_shadday_admin_auth') === 'true') {
          return 'admin';
        }
      }
      return 'delivery';
    } catch (e) {
      return 'delivery';
    }
  });

  // Current Logged-in User Session & Roles
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

  // Dynamic Branches State
  const [branches, setBranches] = useState(() => getStoredBranches());

  useEffect(() => {
    const handleBranchesSync = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setBranches(e.detail);
      } else {
        setBranches(getStoredBranches());
      }
    };
    window.addEventListener('el_shadday_branches_updated', handleBranchesSync);
    return () => window.removeEventListener('el_shadday_branches_updated', handleBranchesSync);
  }, []);

  // Branch Selection State (with QR Code URL query parameter support: ?filial=ariquemes ou ?filial=porto-velho)
  const [selectedBranchId, setSelectedBranchId] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const filialParam = params.get('filial') || params.get('branch');
      if (filialParam) {
        return filialParam;
      }
      return localStorage.getItem('el_shadday_selected_branch') || DEFAULT_BRANCH_ID;
    } catch (e) {
      return DEFAULT_BRANCH_ID;
    }
  });

  // Auto-detect QR Code branch URL parameter on mount/update
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const filialParam = params.get('filial') || params.get('branch');
      if (filialParam) {
        const found = branches.find(b => 
          b.id.toLowerCase() === filialParam.toLowerCase() ||
          b.displayName.toLowerCase().includes(filialParam.toLowerCase())
        );
        if (found) {
          setSelectedBranchId(found.id);
          localStorage.setItem('el_shadday_selected_branch', found.id);
          localStorage.setItem('el_shadday_has_seen_branch_modal', 'true');
          setIsBranchModalOpen(false);
        }
      }
    } catch (e) {}
  }, [branches]);

  // Open branch selector modal on first visit or when user clicks to switch
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('filial') || params.get('branch')) return false; // Scanned direct QR Code
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

  // Dynamic Menu, Promos and Store Info
  const [products, setProducts] = useState(() => getStoredProducts());
  const [promoSettings, setPromoSettings] = useState(() => getStoredPromoSettings());
  const [restaurantInfo, setRestaurantInfo] = useState(() => getStoredRestaurantInfo());

  // Real-time synchronization for products, promos and restaurant info
  useEffect(() => {
    const handleProductsSync = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setProducts(e.detail);
      } else {
        setProducts(getStoredProducts());
      }
    };
    const handlePromosSync = (e) => {
      if (e?.detail) {
        setPromoSettings(e.detail);
      } else {
        setPromoSettings(getStoredPromoSettings());
      }
    };
    const handleInfoSync = (e) => {
      if (e?.detail) {
        setRestaurantInfo(e.detail);
      } else {
        setRestaurantInfo(getStoredRestaurantInfo());
      }
    };

    window.addEventListener('delivery_products_updated', handleProductsSync);
    window.addEventListener('delivery_promos_updated', handlePromosSync);
    window.addEventListener('delivery_restaurant_info_updated', handleInfoSync);
    window.addEventListener('storage', handleProductsSync);

    // Hydrate products, gallery & promo settings from Supabase if configured
    if (isSupabaseConfigured && supabase) {
      const syncGalleryFromSupabase = () => {
        supabase
          .from('buffet_gallery')
          .select('*')
          .order('position', { ascending: true })
          .then(({ data: bgData, error: bgErr }) => {
            if (!bgErr && Array.isArray(bgData)) {
              const clean = bgData.filter(p => !isFakeGalleryItem(p));
              saveStoredBuffetGallery(clean);
              window.dispatchEvent(new CustomEvent("buffet_gallery_updated", { detail: clean }));
            }
          });
      };

      supabase
        .from('company_settings')
        .select('*')
        .eq('id', 'el_shadday_config')
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            if (Array.isArray(data.buffet_gallery)) {
              const cleanGal = data.buffet_gallery.filter(p => !isFakeGalleryItem(p));
              saveStoredBuffetGallery(cleanGal);
              window.dispatchEvent(new CustomEvent("buffet_gallery_updated", { detail: cleanGal }));
            } else {
              // company_settings vazio para galeria — busca na tabela buffet_gallery
              syncGalleryFromSupabase();
            }
            if (Array.isArray(data.menu_products) && data.menu_products.length > 0) {
              const normProds = normalizeProductsList(data.menu_products);
              setProducts(normProds);
              saveStoredProducts(normProds);
            }
            if (Array.isArray(data.pizza_flavors)) {
              const normFlavors = normalizePizzaFlavors(data.pizza_flavors);
              saveStoredPizzaFlavors(normFlavors);
              window.dispatchEvent(new CustomEvent("pizza_flavors_updated", { detail: normFlavors }));
            }
            if (data.promo_settings && typeof data.promo_settings === 'object' && Object.keys(data.promo_settings).length > 0) {
              setPromoSettings(data.promo_settings);
              saveStoredPromoSettings(data.promo_settings);
              if (Array.isArray(data.promo_settings.buffet_unavailable_items)) {
                saveUnavailableBuffetItemIds(data.promo_settings.buffet_unavailable_items);
              }
            }
            if (data.card_machine_notice !== undefined || data.name) {
              const currentStore = getStoredRestaurantInfo();
              const updatedStore = {
                ...currentStore,
                ...(data.name ? { name: data.name } : {}),
                ...(data.phone ? { phone: data.phone } : {}),
                ...(data.phone_display ? { phoneFormatted: data.phone_display } : {}),
                ...(data.address ? { address: data.address } : {}),
                ...(data.pix_key ? { pixKey: data.pix_key } : {}),
                ...(data.pix_name ? { pixName: data.pix_name } : {}),
                ...(data.card_machine_notice !== undefined ? { cardMachineNotice: data.card_machine_notice } : {}),
                ...(data.card_machine_notice_active !== undefined ? { cardMachineNoticeActive: data.card_machine_notice_active } : {}),
                ...(data.card_machine_settings ? { cardMachineSettings: data.card_machine_settings } : {})
              };
              setRestaurantInfo(updatedStore);
              saveStoredRestaurantInfo(updatedStore);
            }
          } else {
            syncGalleryFromSupabase();
          }
        });

      // Realtime subscription to company_settings across all devices
      const channelSettings = supabase
        .channel('realtime_company_settings_app')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'company_settings' }, (payload) => {
          const freshData = payload.new;
          if (freshData) {
            if (Array.isArray(freshData.buffet_gallery)) {
              const cleanGal = freshData.buffet_gallery.filter(p => !isFakeGalleryItem(p));
              saveStoredBuffetGallery(cleanGal);
              window.dispatchEvent(new CustomEvent("buffet_gallery_updated", { detail: cleanGal }));
            }
            if (Array.isArray(freshData.menu_products) && freshData.menu_products.length > 0) {
              const normProds = normalizeProductsList(freshData.menu_products);
              setProducts(normProds);
              saveStoredProducts(normProds);
            }
            if (Array.isArray(freshData.pizza_flavors)) {
              const normFlavors = normalizePizzaFlavors(freshData.pizza_flavors);
              saveStoredPizzaFlavors(normFlavors);
              window.dispatchEvent(new CustomEvent("pizza_flavors_updated", { detail: normFlavors }));
            }
            if (freshData.promo_settings) {
              setPromoSettings(freshData.promo_settings);
              saveStoredPromoSettings(freshData.promo_settings);
              if (Array.isArray(freshData.promo_settings.buffet_unavailable_items)) {
                saveUnavailableBuffetItemIds(freshData.promo_settings.buffet_unavailable_items);
              }
            }
          }
        })
        .subscribe();
    }

    // Hydrate from Global Cloud Pub/Sub (Cross-device instant sync)
    fetchCloudConfigHistory().then((cloudCfg) => {
      if (cloudCfg) {
        if (Array.isArray(cloudCfg.products)) setProducts(normalizeProductsList(cloudCfg.products));
        if (cloudCfg.promos) setPromoSettings(cloudCfg.promos);
        if (cloudCfg.store) setRestaurantInfo(cloudCfg.store);
        if (Array.isArray(cloudCfg.flavors)) {
          const normFlavors = normalizePizzaFlavors(cloudCfg.flavors);
          saveStoredPizzaFlavors(normFlavors);
          window.dispatchEvent(new CustomEvent("pizza_flavors_updated", { detail: normFlavors }));
        }
      }
    });

    // Real-time live subscription across devices
    const unsubscribeConfig = subscribeToConfigEvents({
      onProductsUpdate: (prods) => setProducts(normalizeProductsList(prods)),
      onPromosUpdate: (promos) => setPromoSettings(promos),
      onStoreUpdate: (store) => setRestaurantInfo(store),
      onPizzaFlavorsUpdate: (flavors) => {
        const normFlavors = normalizePizzaFlavors(flavors);
        window.dispatchEvent(new CustomEvent("pizza_flavors_updated", { detail: normFlavors }));
      }
    });

    return () => {
      window.removeEventListener('delivery_products_updated', handleProductsSync);
      window.removeEventListener('delivery_promos_updated', handlePromosSync);
      window.removeEventListener('delivery_restaurant_info_updated', handleInfoSync);
      window.removeEventListener('storage', handleProductsSync);
      if (unsubscribeConfig) unsubscribeConfig();
    };
  }, []);

  // Kitchen & Admin State
  const [allOrders, setAllOrders] = useState(() => getInitialOrders());
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('el_shadday_admin_auth') === 'true';
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  // Sync orders in real-time across devices (Cloud SSE + BroadcastChannel + API)
  useEffect(() => {
    // 1. Initial load from Cloud history (authoritative orders from Supabase)
    const initSync = async () => {
      try {
        const cloudOrders = await fetchCloudOrdersHistory();
        if (Array.isArray(cloudOrders)) {
          if (isSupabaseConfigured) {
            setAllOrders(cloudOrders);
            try {
              localStorage.setItem('el_shadday_all_orders', JSON.stringify(cloudOrders));
            } catch (e) {}
          } else if (cloudOrders.length > 0) {
            setAllOrders(prev => {
              const map = new Map();
              prev.forEach(o => { if (o?.orderId) map.set(o.orderId, o); });
              cloudOrders.forEach(o => { if (o?.orderId) map.set(o.orderId, { ...(map.get(o.orderId) || {}), ...o }); });
              const list = Array.from(map.values());
              list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
              try {
                localStorage.setItem('el_shadday_all_orders', JSON.stringify(list));
              } catch (e) {}
              return list;
            });
          }
        }
      } catch (e) {
        console.warn('Initial cloud history sync failed:', e);
      }

      // Also try local /api/orders ONLY if Supabase is NOT configured
      if (!isSupabaseConfigured) {
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
      }
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
      },
      onOrderDelete: (orderId) => {
        setAllOrders(prev => {
          const updated = prev.filter(o => o.orderId !== orderId);
          try {
            localStorage.setItem('el_shadday_all_orders', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      },
      onAllOrdersCleared: () => {
        setAllOrders([]);
        try {
          localStorage.setItem('el_shadday_all_orders', JSON.stringify([]));
        } catch (e) {}
      }
    });

    // 3. Fallback polling every 5 seconds for local API (only if Supabase is not configured)
    let interval = null;
    if (!isSupabaseConfigured) {
      interval = setInterval(async () => {
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
    }

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, []);

  // Handle URL hash changes (#/admin, #admin, #/cozinha, #cardapio-evento, #buffet)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#/admin' || hash === '#admin' || hash === '#/cozinha' || hash === '#cozinha') {
        if (sessionStorage.getItem('el_shadday_admin_auth') === 'true') {
          setAppView('admin');
        } else {
          setIsAdminLoginModalOpen(true);
        }
      } else if (hash.includes('cardapio-evento') || hash.includes('buffet-cardapio') || hash.includes('orcamento-evento')) {
        setAppView('cardapio-evento');
      } else if (hash === '#/buffet' || hash === '#buffet') {
        setAppView('full-buffet');
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
    return branches.find(b => b.id === selectedBranchId) || branches[0] || BRANCHES[0];
  }, [branches, selectedBranchId]);

  // Branch switch handler
  const handleSelectBranch = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
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

  const handleAdminLoginSuccess = (authenticatedUser) => {
    if (authenticatedUser) {
      setCurrentUser(authenticatedUser);
      if (authenticatedUser.branchId && authenticatedUser.branchId !== 'all') {
        setSelectedBranchId(authenticatedUser.branchId);
        try {
          localStorage.setItem('el_shadday_selected_branch', authenticatedUser.branchId);
        } catch (e) {}
      }
    }
    setIsAdminLoggedIn(true);
    sessionStorage.setItem('el_shadday_admin_auth', 'true');
    setIsAdminLoginModalOpen(false);
    setAppView('admin');
    window.location.hash = '#/admin';
  };

  const handleAdminLogout = () => {
    logoutUser();
    setCurrentUser(null);
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
      await dispatchOrderDelete(orderId);
    } catch (err) {
      console.error('Error deleting order:', err);
    }
  };

  const handleClearAllOrders = async () => {
    setAllOrders([]);
    try {
      localStorage.setItem('el_shadday_all_orders', JSON.stringify([]));
    } catch (e) {}

    try {
      await dispatchClearAllOrders();
    } catch (err) {
      console.error('Error clearing all orders:', err);
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

  // Branch-scoped menu products (Ariquemes vs Porto Velho)
  const branchProducts = useMemo(() => {
    return products.filter(p => {
      if (p.branchId === 'all') return true;
      if (p.branchId === selectedBranchId) return true;
      if (!p.branchId && selectedBranchId === 'ariquemes') return true;
      return false;
    });
  }, [products, selectedBranchId]);

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return branchProducts.filter(p => 
      p.isAvailable !== false && (
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.details?.toLowerCase().includes(query)
      )
    );
  }, [searchQuery, branchProducts]);

  // Cart summary
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartValue = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Smooth scroll to menu
  const scrollToMenu = () => {
    if (menuSectionRef.current) {
      menuSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Navigation helpers for views
  const handleOpenBuffetSubpage = () => {
    window.location.hash = '#cardapio-evento';
    window.scrollTo({ top: 0, behavior: 'instant' });
    setAppView('cardapio-evento');
  };

  const handleOpenFullBuffet = () => {
    window.location.hash = '#buffet';
    window.scrollTo({ top: 0, behavior: 'instant' });
    setAppView('full-buffet');
  };

  const handleBackToDelivery = () => {
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'instant' });
    setAppView('delivery');
  };

  // VIEW 1: KITCHEN KDS / PAINEL DA COZINHA
  if (appView === 'admin') {
    return (
      <ErrorBoundary>
        <AdminDashboard
          orders={allOrders}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onUpdatePaymentStatus={handleUpdatePaymentStatus}
          onCancelOrder={handleCancelOrder}
          onDeleteOrder={handleDeleteOrder}
          onClearAllOrders={handleClearAllOrders}
          onCreateKitchenOrder={handleCreateKitchenOrder}
          onLogout={handleAdminLogout}
          onBackToSite={handleBackToSiteFromAdmin}
          onSwitchToBuffet={handleOpenFullBuffet}
          currentUser={currentUser}
          branches={branches}
          currentBranchId={selectedBranchId}
          onSelectBranch={handleSelectBranch}
        />
      </ErrorBoundary>
    );
  }

  // VIEW 2: FULL BUFFET SHOWCASE (APRESENTAÇÃO INSTITUCIONAL)
  if (appView === 'full-buffet') {
    return (
      <div className="relative min-h-screen bg-dark-950 text-slate-100">
        <div className="bg-dark-950/90 backdrop-blur-md border-b border-dark-750/80 shadow-2xl py-2.5 px-4 sm:px-6 sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-[11px] font-black uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
              Buffet El Shadday
            </span>
            <span className="text-xs text-slate-300 font-medium hidden sm:inline">
              Apresentação Completa para Casamentos, Formaturas e Eventos
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <button 
              type="button"
              onClick={handleOpenBuffetSubpage} 
              className="px-3.5 py-1.5 rounded-xl bg-dark-900 border border-brand-gold/40 hover:border-brand-gold text-brand-gold text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Abrir o montador de cardápio"
            >
              <span>🍽️ Montar Cardápio</span>
            </button>

            <button 
              type="button"
              onClick={handleBackToDelivery} 
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold hover:brightness-110 active:scale-95 text-dark-950 text-xs font-black uppercase tracking-wider shadow-glow-gold transition-all cursor-pointer flex items-center gap-2"
            >
              <span>🍕 Voltar para o Delivery</span>
            </button>
          </div>
        </div>
        <BuffetApp 
          currentAppMode="buffet" 
          onToggleAppMode={handleBackToDelivery}
          onNavigateToBuilder={handleOpenBuffetSubpage}
        />
      </div>
    );
  }

  // VIEW 2.5: DEDICATED BUFFET & EVENT MENU SUBPAGE ("Monte o Cardápio do Seu Evento")
  if (appView === 'cardapio-evento') {
    return (
      <div className="relative min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans selection:bg-brand-gold selection:text-dark-950">
        {/* Sticky Subpage Top Bar */}
        <div className="bg-dark-950/95 backdrop-blur-md border-b border-dark-750/80 shadow-2xl py-2.5 px-4 sm:px-6 sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-[11px] font-black uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
              Buffet El Shadday
            </span>
            <span className="text-xs text-slate-300 font-medium hidden sm:inline">
              Montador de Cardápio para Eventos & Casamentos
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <button 
              type="button"
              onClick={handleOpenFullBuffet} 
              className="px-3.5 py-1.5 rounded-xl bg-dark-900 border border-brand-gold/40 hover:border-brand-gold text-brand-gold text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Ver fotos reais, equipe e estrutura do Buffet"
            >
              <span>👑 Ver Apresentação & Galeria</span>
            </button>

            <button 
              type="button"
              onClick={handleBackToDelivery} 
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold hover:brightness-110 active:scale-95 text-dark-950 text-xs font-black uppercase tracking-wider shadow-glow-gold transition-all cursor-pointer flex items-center gap-2"
            >
              <span>🍕 Voltar para o Delivery</span>
            </button>
          </div>
        </div>

        {/* The Event Menu Builder Component */}
        <main className="flex-1">
          <BuffetSection 
            onExploreFullBuffet={handleOpenFullBuffet}
            onBackToDelivery={handleBackToDelivery}
          />
        </main>

        {/* Footer */}
        <Footer onOpenAdmin={handleOpenAdminTrigger} />
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
        onScrollToBuffet={handleOpenBuffetSubpage}
        onOpenAdmin={handleOpenAdminTrigger}
        currentUser={currentUser}
      />

      {/* 1.1 Top Promotional Announcement Banner */}
      {promoSettings.bannerActive && promoSettings.bannerText && (
        <div className="bg-gradient-to-r from-amber-600 via-brand-gold to-amber-500 text-dark-950 font-black text-xs sm:text-sm py-2 px-4 text-center shadow-md flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 fill-dark-950 text-dark-950" />
          <span>{promoSettings.bannerText}</span>
          {promoSettings.couponActive && promoSettings.couponCode && (
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-full bg-dark-950 text-brand-gold text-[10px] font-mono tracking-wider font-extrabold uppercase">
              Cupom: {promoSettings.couponCode} ({promoSettings.couponDiscountPercent}% OFF)
            </span>
          )}
        </div>
      )}

      {/* 2. Restaurant Profile & iFood Header (Cover, Avatar, Ratings, Delivery Switcher) */}
      <RestaurantStoreHeader
        activeBranch={activeBranch}
        onOpenBranchModal={() => setIsBranchModalOpen(true)}
        deliveryMode={deliveryMode}
        onToggleDeliveryMode={setDeliveryMode}
        onScrollToCategory={handleSelectCategory}
        onOpenBuffet={handleOpenBuffetSubpage}
      />

      {/* 2.1 Promotions & Highlights Shelf */}
      <PromotionsShelf
        products={branchProducts}
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
      <div ref={menuSectionRef} id="menu-section">
        <CategoryNav
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onScrollToBuffet={handleOpenBuffetSubpage}
          products={branchProducts}
          showBuffet={selectedBranchId === 'ariquemes'}
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
                const categoryProducts = branchProducts.filter(p => p.categoryId === cat.id && p.isAvailable !== false);
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
                          {(() => {
                            const displayTag = cat.id === 'pizzas'
                              ? (categoryProducts.some(p => p.bordaGratis) ? 'Borda de Catupiry Grátis!' : null)
                              : cat.tag;
                            return displayTag ? (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-goldLight border border-brand-gold/30">
                                {displayTag}
                              </span>
                            ) : null;
                          })()}
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

      {/* 5. Buffet CTA Banner at the Bottom of Delivery (Exclusive to Ariquemes) */}
      {selectedBranchId === 'ariquemes' && (
        <section className="py-10 px-3 sm:px-6 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950 border-t border-dark-800">
          <div className="max-w-4xl mx-auto rounded-3xl bg-dark-900/90 border border-brand-gold/30 p-5 sm:p-7 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5 relative z-10">
              <div className="text-center sm:text-left space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold text-[10px] sm:text-[11px] font-black uppercase tracking-wider border border-brand-gold/30">
                  <Sparkles className="w-3 h-3 text-brand-gold" />
                  Buffet El Shadday • Ariquemes
                </span>
                <h3 className="font-serif text-lg sm:text-2xl font-bold text-white">
                  Vai realizar um casamento, formatura ou festa?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                  Equipe completa, garçons uniformizados, prataria, rechauds e assados nobres na brasa inclusos.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto flex-shrink-0">
                <button
                  type="button"
                  onClick={handleOpenBuffetSubpage}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold hover:brightness-110 active:scale-98 text-dark-950 font-black text-xs uppercase tracking-wider shadow-glow-gold transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
                >
                  <span>🍽️ Montar Cardápio de Evento</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                </button>

                <button
                  type="button"
                  onClick={handleOpenFullBuffet}
                  className="px-4 py-3 rounded-xl bg-dark-950 hover:bg-dark-850 text-slate-200 hover:text-white border border-dark-750 hover:border-brand-gold/40 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-center"
                >
                  <span>👑 Ver Apresentação</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

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
        branches={branches}
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
        products={products}
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
