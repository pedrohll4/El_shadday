import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { ShoppingBag, ArrowRight, Sparkles, ChevronRight, Phone } from 'lucide-react';

export default function App() {
  // App View mode: 'delivery' (default & primary) | 'full-buffet' (showcase)
  const [appView, setAppView] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'buffet') return 'full-buffet';
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

  const handleOrderFinished = (orderData) => {
    setCompletedOrderData(orderData);
    setIsCartOpen(false);
    setIsOrderSuccessOpen(true);
    setCartItems([]); // Clear cart upon successful order dispatch
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    let list = PRODUCTS;

    if (activeCategory) {
      list = list.filter(p => p.categoryId === activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = PRODUCTS.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.details?.toLowerCase().includes(query)
      );
    }

    return list;
  }, [activeCategory, searchQuery]);

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

  // If user navigated to full buffet view
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

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans selection:bg-brand-gold selection:text-dark-950">
      
      {/* 1. Header with Branch and Cart Controls */}
      <Header
        cartCount={totalCartCount}
        cartTotal={totalCartValue}
        onOpenCart={() => setIsCartOpen(true)}
        activeBranch={activeBranch}
        onOpenBranchModal={() => setIsBranchModalOpen(true)}
        onScrollToBuffet={scrollToBuffet}
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
          onSelectCategory={(catId) => {
            setActiveCategory(catId);
            setSearchQuery('');
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* 4. Menu Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Section Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dark-800 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white flex items-center gap-2">
              <span className="text-brand-gold">●</span>
              <span>
                {searchQuery 
                  ? `Resultados para "${searchQuery}"` 
                  : (CATEGORIES.find(c => c.id === activeCategory)?.name || 'Cardápio')}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'opção disponível' : 'opções disponíveis'} em {activeBranch.displayName}
            </p>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="hidden sm:inline">Taxa de entrega:</span>
            <span className="text-brand-gold font-bold bg-dark-900 px-2.5 py-1 rounded-lg border border-dark-800">
              A partir de R$ 8,00 em Ariquemes
            </span>
          </div>
        </div>

        {/* Empty Search Result */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-dark-900/50 rounded-3xl border border-dark-800">
            <p className="text-sm text-slate-400">Nenhum item encontrado para esta busca.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory(CATEGORIES[0].id);
              }}
              className="mt-3 px-4 py-2 rounded-xl bg-brand-gold text-dark-950 font-bold text-xs hover:bg-amber-400 transition-colors"
            >
              Ver Todos os Itens
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => {
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

      </main>

      {/* 5. Buffet Section at the Bottom (Quotation via WhatsApp) */}
      <BuffetSection onExploreFullBuffet={() => setAppView('full-buffet')} />

      {/* 6. Footer */}
      <Footer onOpenAdmin={() => {}} />

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

      {/* Combo Customizer Modal */}
      <ComboCustomizerModal
        isOpen={isComboCustomizerOpen}
        onClose={() => setIsComboCustomizerOpen(false)}
        comboProduct={selectedComboForCustomizer}
        onAddComboToCart={handleAddComboToCart}
      />

    </div>
  );
}
