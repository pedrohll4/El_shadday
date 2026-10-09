import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Flame, Clock, AlertTriangle, CheckCircle2, Search, 
  MapPin, User, DollarSign, Package, 
  Printer, ArrowLeft, LogOut, RefreshCw, Send, Check,
  Bike, ChefHat, BellRing, Plus, Minus, Trash2, XCircle,
  MessageSquare, Phone, ShoppingBag, Store, Copy, ChevronRight,
  AlertCircle, X, ShieldAlert, Sparkles, CheckCheck,
  Camera, RotateCcw, Edit, Edit2, Eye, EyeOff, Tag, Percent,
  Utensils, ToggleLeft, ToggleRight, Save, Layers, CheckSquare
} from 'lucide-react';
import { 
  RESTAURANT_INFO, 
  ARIQUEMES_DISTRICTS, 
  CATEGORIES, 
  PRODUCTS,
  getStoredProducts,
  saveStoredProducts,
  getStoredPromoSettings,
  saveStoredPromoSettings,
  getStoredRestaurantInfo,
  saveStoredRestaurantInfo
} from '../data/menuData';
import { 
  GALLERY_CATEGORIES, 
  INITIAL_BUFFET_GALLERY, 
  getStoredBuffetGallery, 
  saveStoredBuffetGallery 
} from '../buffet/buffetData';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

export function AdminDashboard({ 
  orders, 
  onUpdateOrderStatus, 
  onUpdatePaymentStatus, 
  onCancelOrder,
  onDeleteOrder,
  onCreateKitchenOrder,
  onLogout, 
  onBackToSite,
  onSwitchToBuffet
}) {
  // Navigation: 'kds' (Kitchen Display) | 'pdv' (Point of Sale / Criar Pedidos) | 'gallery' (Fotos do Buffet)
  const [activeAdminTab, setActiveAdminTab] = useState('kds');

  // KDS Filters
  const [selectedFilter, setSelectedFilter] = useState('todos'); // 'todos' | 'atrasados' | 'pendentes' | 'preparo' | 'entrega' | 'concluidos' | 'nao_pagos' | 'cancelados'
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(Date.now());
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  // Audio chimes
  const audioCtxRef = useRef(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const knownOrderIdsRef = useRef(new Set(orders.map(o => o.orderId)));

  // WhatsApp Modal State
  const [whatsappModalData, setWhatsappModalData] = useState(null); // { order, phone, message }
  
  // Cancel Order Modal State
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // PDV (Point of Sale) State
  const [pdvCategory, setPdvCategory] = useState(CATEGORIES[0]?.id || 'combos');
  const [pdvSearch, setPdvSearch] = useState('');
  const [pdvCart, setPdvCart] = useState([]);
  const [pdvCustomerName, setPdvCustomerName] = useState('');
  const [pdvCustomerPhone, setPdvCustomerPhone] = useState('');
  const [pdvDeliveryType, setPdvDeliveryType] = useState('balcao'); // 'balcao' | 'delivery'
  const [pdvDistrict, setPdvDistrict] = useState(ARIQUEMES_DISTRICTS[2]); // Setor 03 default
  const [pdvAddress, setPdvAddress] = useState('');
  const [pdvNumber, setPdvNumber] = useState('');
  const [pdvReference, setPdvReference] = useState('');
  const [pdvPaymentMethod, setPdvPaymentMethod] = useState('pix'); // 'pix' | 'dinheiro' | 'debito' | 'credito'
  const [pdvIsPaid, setPdvIsPaid] = useState(true);
  const [pdvCashChange, setPdvCashChange] = useState('');
  const [pdvOrderNotes, setPdvOrderNotes] = useState('');
  const [pdvSuccessOrder, setPdvSuccessOrder] = useState(null);
  const [pdvValidationError, setPdvValidationError] = useState('');

  // Buffet Gallery Management States
  const [galleryList, setGalleryList] = useState(() => getStoredBuffetGallery());
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoSubtitle, setNewPhotoSubtitle] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState('churrasco');
  const [newPhotoTag, setNewPhotoTag] = useState('');
  const [galleryFeedback, setGalleryFeedback] = useState('');

  // Sincronizar galeria com Supabase se configurado & escutar atualizações
  useEffect(() => {
    const handleGallerySync = (e) => {
      if (e?.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setGalleryList(e.detail);
      } else {
        setGalleryList(getStoredBuffetGallery());
      }
    };

    window.addEventListener('storage', handleGallerySync);
    window.addEventListener('buffet_gallery_updated', handleGallerySync);

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('buffet_gallery')
        .select('*')
        .order('position', { ascending: true })
        .then(({ data, error }) => {
          if (!error && Array.isArray(data) && data.length > 0) {
            setGalleryList(data);
            saveStoredBuffetGallery(data);
          }
        });
    }

    return () => {
      window.removeEventListener('storage', handleGallerySync);
      window.removeEventListener('buffet_gallery_updated', handleGallerySync);
    };
  }, []);

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!newPhotoUrl.trim() || !newPhotoTitle.trim()) {
      alert('Por favor, informe a URL da foto e o título.');
      return;
    }
    const newPhoto = {
      id: 'gal_' + Date.now(),
      url: newPhotoUrl.trim(),
      title: newPhotoTitle.trim(),
      subtitle: newPhotoSubtitle.trim() || 'Foto oficial do Buffet El Shadday',
      category: newPhotoCategory,
      tag: newPhotoTag.trim() || 'Buffet El Shadday'
    };
    const updated = [newPhoto, ...galleryList];
    setGalleryList(updated);
    saveStoredBuffetGallery(updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('buffet_gallery').insert({
          id: newPhoto.id,
          url: newPhoto.url,
          title: newPhoto.title,
          subtitle: newPhoto.subtitle,
          category: newPhoto.category,
          tag: newPhoto.tag,
          position: 0
        });
      } catch (err) {}
    }

    setNewPhotoUrl('');
    setNewPhotoTitle('');
    setNewPhotoSubtitle('');
    setNewPhotoTag('');
    setGalleryFeedback('Foto adicionada à galeria com sucesso!');
    setTimeout(() => setGalleryFeedback(''), 3500);
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Tem certeza que deseja remover esta foto?')) return;
    const updated = galleryList.filter(p => p.id !== photoId);
    setGalleryList(updated);
    saveStoredBuffetGallery(updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('buffet_gallery').delete().eq('id', photoId);
      } catch (err) {}
    }
    setGalleryFeedback('Foto removida!');
    setTimeout(() => setGalleryFeedback(''), 3500);
  };

  const handleResetGallery = async () => {
    if (!window.confirm('Deseja restaurar as fotos padrão do Buffet?')) return;
    setGalleryList(INITIAL_BUFFET_GALLERY);
    saveStoredBuffetGallery(INITIAL_BUFFET_GALLERY);
    setGalleryFeedback('Galeria restaurada para o padrão!');
    setTimeout(() => setGalleryFeedback(''), 3500);
  };

  // ==============================================================
  // MENU, PRODUCTS & PROMOTIONS MANAGEMENT
  // ==============================================================
  const [productsList, setProductsList] = useState(() => getStoredProducts());
  const [promoSettings, setPromoSettings] = useState(() => getStoredPromoSettings());
  const [restaurantSettings, setRestaurantSettings] = useState(() => getStoredRestaurantInfo());

  // Sub-navigation in Menu Tab: 'products' | 'promos' | 'store'
  const [menuSubTab, setMenuSubTab] = useState('products');

  // Search & Filter in Products list
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState('todos');

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = new, object = edit

  // Product Form Fields
  const [prodFormName, setProdFormName] = useState('');
  const [prodFormCategory, setProdFormCategory] = useState(CATEGORIES[0]?.id || 'combos');
  const [prodFormPrice, setProdFormPrice] = useState('');
  const [prodFormOriginalPrice, setProdFormOriginalPrice] = useState('');
  const [prodFormBadge, setProdFormBadge] = useState('');
  const [prodFormDescription, setProdFormDescription] = useState('');
  const [prodFormDetails, setProdFormDetails] = useState('');
  const [prodFormImage, setProdFormImage] = useState('');
  const [prodFormIsAvailable, setProdFormIsAvailable] = useState(true);
  const [prodFormIsPromo, setProdFormIsPromo] = useState(false);
  const [prodFormBordaGratis, setProdFormBordaGratis] = useState(false);

  // Promo Form Fields
  const [tempBannerText, setTempBannerText] = useState(promoSettings.bannerText || '');
  const [tempBannerActive, setTempBannerActive] = useState(promoSettings.bannerActive !== false);
  const [tempCouponCode, setTempCouponCode] = useState(promoSettings.couponCode || 'ELSHADDAY10');
  const [tempCouponDiscount, setTempCouponDiscount] = useState(promoSettings.couponDiscountPercent || 10);
  const [tempCouponMinOrder, setTempCouponMinOrder] = useState(promoSettings.minOrderValueForCoupon || 50);
  const [tempCouponActive, setTempCouponActive] = useState(promoSettings.couponActive !== false);

  // Store Form Fields
  const [tempStoreName, setTempStoreName] = useState(restaurantSettings.name || '');
  const [tempStorePhone, setTempStorePhone] = useState(restaurantSettings.phone || '5569992228682');
  const [tempStorePhoneFormatted, setTempStorePhoneFormatted] = useState(restaurantSettings.phoneFormatted || '(69) 99222-8682');
  const [tempStoreAddress, setTempStoreAddress] = useState(restaurantSettings.address || '');
  const [tempStoreDeliveryTime, setTempStoreDeliveryTime] = useState(restaurantSettings.deliveryTime || '45 - 75 min');
  const [tempStorePixKey, setTempStorePixKey] = useState(restaurantSettings.pixKey || '69992228682');
  const [tempStorePixName, setTempStorePixName] = useState(restaurantSettings.pixName || 'El Shadday Delivery');
  const [tempStoreOpeningHours, setTempStoreOpeningHours] = useState(restaurantSettings.openingHours || '');

  // Menu Feedback Toast
  const [menuFeedback, setMenuFeedback] = useState('');

  const triggerMenuToast = (msg) => {
    setMenuFeedback(msg);
    setTimeout(() => setMenuFeedback(''), 3500);
  };

  // Sync menu & promos across tabs/windows
  useEffect(() => {
    const handleProductsSync = (e) => {
      if (e?.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setProductsList(e.detail);
      } else {
        setProductsList(getStoredProducts());
      }
    };
    const handlePromosSync = (e) => {
      if (e?.detail) setPromoSettings(e.detail);
      else setPromoSettings(getStoredPromoSettings());
    };
    const handleStoreSync = (e) => {
      if (e?.detail) setRestaurantSettings(e.detail);
      else setRestaurantSettings(getStoredRestaurantInfo());
    };

    window.addEventListener('delivery_products_updated', handleProductsSync);
    window.addEventListener('delivery_promos_updated', handlePromosSync);
    window.addEventListener('delivery_restaurant_info_updated', handleStoreSync);
    window.addEventListener('storage', handleProductsSync);

    return () => {
      window.removeEventListener('delivery_products_updated', handleProductsSync);
      window.removeEventListener('delivery_promos_updated', handlePromosSync);
      window.removeEventListener('delivery_restaurant_info_updated', handleStoreSync);
      window.removeEventListener('storage', handleProductsSync);
    };
  }, []);

  // Handlers for Products
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProdFormName('');
    setProdFormCategory(CATEGORIES[0]?.id || 'combos');
    setProdFormPrice('');
    setProdFormOriginalPrice('');
    setProdFormBadge('');
    setProdFormDescription('');
    setProdFormDetails('');
    setProdFormImage('https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80');
    setProdFormIsAvailable(true);
    setProdFormIsPromo(false);
    setProdFormBordaGratis(false);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProdFormName(prod.name || '');
    setProdFormCategory(prod.categoryId || 'combos');
    setProdFormPrice(prod.price !== undefined ? prod.price.toString() : '');
    setProdFormOriginalPrice(prod.originalPrice !== undefined ? prod.originalPrice.toString() : '');
    setProdFormBadge(prod.badge || '');
    setProdFormDescription(prod.description || '');
    setProdFormDetails(prod.details || '');
    setProdFormImage(prod.image || '');
    setProdFormIsAvailable(prod.isAvailable !== false);
    setProdFormIsPromo(!!prod.isPromo || !!prod.originalPrice);
    setProdFormBordaGratis(!!prod.bordaGratis);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!prodFormName.trim()) {
      alert('Informe o nome do produto.');
      return;
    }
    const priceNum = parseFloat(prodFormPrice.toString().replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Informe um preço válido.');
      return;
    }
    const origPriceNum = prodFormOriginalPrice ? parseFloat(prodFormOriginalPrice.toString().replace(',', '.')) : null;

    const savedProd = {
      id: editingProduct ? editingProduct.id : `prod_${Date.now()}`,
      name: prodFormName.trim(),
      categoryId: prodFormCategory,
      price: priceNum,
      originalPrice: (origPriceNum && origPriceNum > priceNum) ? origPriceNum : (prodFormIsPromo ? (origPriceNum || Math.round(priceNum * 1.25)) : undefined),
      badge: prodFormBadge.trim() || (prodFormIsPromo ? 'Promoção 🔥' : ''),
      description: prodFormDescription.trim(),
      details: prodFormDetails.trim(),
      image: prodFormImage.trim() || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
      isAvailable: prodFormIsAvailable,
      isPromo: prodFormIsPromo,
      bordaGratis: prodFormBordaGratis,
      isBox: editingProduct ? editingProduct.isBox : (prodFormCategory === 'caixas'),
      isPizzaCustomizer: editingProduct ? editingProduct.isPizzaCustomizer : (prodFormCategory === 'pizzas')
    };

    let updated;
    if (editingProduct) {
      updated = productsList.map(p => p.id === editingProduct.id ? savedProd : p);
      triggerMenuToast(`Produto "${savedProd.name}" atualizado com sucesso!`);
    } else {
      updated = [savedProd, ...productsList];
      triggerMenuToast(`Novo produto "${savedProd.name}" criado com sucesso!`);
    }

    setProductsList(updated);
    saveStoredProducts(updated);
    setIsProductModalOpen(false);
  };

  const handleToggleProductAvailability = (prodId) => {
    const updated = productsList.map(p => {
      if (p.id === prodId) {
        const nextState = p.isAvailable === false ? true : false;
        triggerMenuToast(nextState ? `"${p.name}" ativado (disponível)!` : `"${p.name}" pausado (esgotado)!`);
        return { ...p, isAvailable: nextState };
      }
      return p;
    });
    setProductsList(updated);
    saveStoredProducts(updated);
  };

  const handleToggleProductPromo = (prodId) => {
    const updated = productsList.map(p => {
      if (p.id === prodId) {
        const isNowPromo = !p.isPromo && !p.originalPrice;
        if (isNowPromo) {
          triggerMenuToast(`"${p.name}" agora está em Promoção 🔥!`);
          return {
            ...p,
            isPromo: true,
            originalPrice: p.originalPrice || Math.round(p.price * 1.25),
            badge: p.badge || 'Promoção 🔥'
          };
        } else {
          triggerMenuToast(`Promoção removida de "${p.name}".`);
          const copy = { ...p };
          delete copy.originalPrice;
          copy.isPromo = false;
          if (copy.badge === 'Promoção 🔥') copy.badge = '';
          return copy;
        }
      }
      return p;
    });
    setProductsList(updated);
    saveStoredProducts(updated);
  };

  const handleDuplicateProduct = (prod) => {
    const cloned = {
      ...prod,
      id: `prod_${Date.now()}`,
      name: `${prod.name} (Cópia)`
    };
    const updated = [cloned, ...productsList];
    setProductsList(updated);
    saveStoredProducts(updated);
    triggerMenuToast(`Cópia de "${prod.name}" criada com sucesso!`);
  };

  const handleDeleteProduct = (prodId, prodName) => {
    if (!window.confirm(`Tem certeza que deseja remover o produto "${prodName}" do cardápio?`)) return;
    const updated = productsList.filter(p => p.id !== prodId);
    setProductsList(updated);
    saveStoredProducts(updated);
    triggerMenuToast(`Produto removido do cardápio!`);
  };

  const handleResetMenuToDefault = () => {
    if (!window.confirm('Deseja restaurar todos os produtos e preços para o padrão original da loja?')) return;
    setProductsList(PRODUCTS);
    saveStoredProducts(PRODUCTS);
    triggerMenuToast('Cardápio restaurado para o padrão original!');
  };

  const handleSavePromoSettings = (e) => {
    e.preventDefault();
    const newSettings = {
      bannerText: tempBannerText.trim(),
      bannerActive: tempBannerActive,
      couponCode: tempCouponCode.trim().toUpperCase(),
      couponDiscountPercent: parseFloat(tempCouponDiscount) || 10,
      minOrderValueForCoupon: parseFloat(tempCouponMinOrder) || 50,
      couponActive: tempCouponActive
    };
    setPromoSettings(newSettings);
    saveStoredPromoSettings(newSettings);
    triggerMenuToast('Promoções e Cupons salvos com sucesso!');
  };

  const handleSaveStoreSettings = (e) => {
    e.preventDefault();
    const newStore = {
      ...restaurantSettings,
      name: tempStoreName.trim(),
      phone: tempStorePhone.trim(),
      phoneFormatted: tempStorePhoneFormatted.trim(),
      address: tempStoreAddress.trim(),
      deliveryTime: tempStoreDeliveryTime.trim(),
      pixKey: tempStorePixKey.trim(),
      pixName: tempStorePixName.trim(),
      openingHours: tempStoreOpeningHours.trim()
    };
    setRestaurantSettings(newStore);
    saveStoredRestaurantInfo(newStore);
    triggerMenuToast('Dados do restaurante atualizados com sucesso!');
  };

  // Filtered products in Admin
  const filteredAdminProducts = useMemo(() => {
    let list = productsList;
    if (menuCategoryFilter === 'promos') {
      list = list.filter(p => p.isPromo || p.originalPrice);
    } else if (menuCategoryFilter === 'pausados') {
      list = list.filter(p => p.isAvailable === false);
    } else if (menuCategoryFilter !== 'todos') {
      list = list.filter(p => p.categoryId === menuCategoryFilter);
    }

    if (menuSearch.trim()) {
      const q = menuSearch.toLowerCase().trim();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.id || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [productsList, menuCategoryFilter, menuSearch]);

  // Sound chime helper using Web Audio API + Speech Synthesis
  const playChime = (isTest = false) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Three-tone bright restaurant order bell
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, t); // E5
      osc.frequency.setValueAtTime(830.61, t + 0.12); // G#5
      osc.frequency.setValueAtTime(987.77, t + 0.25); // B5

      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.start(t);
      osc.stop(t + 1.2);

      // Speak notification in Portuguese
      if ('speechSynthesis' in window) {
        try {
          const phrase = isTest 
            ? 'Som de alerta da cozinha ativado com sucesso!' 
            : 'Atenção cozinha! Novo pedido recebido!';
          const utterance = new SpeechSynthesisUtterance(phrase);
          utterance.lang = 'pt-BR';
          utterance.rate = 1.05;
          window.speechSynthesis.speak(utterance);
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  const handleUnlockAndTestAudio = () => {
    setIsAudioUnlocked(true);
    playChime(true);
  };

  // Watch for incoming new orders and sound the alarm
  useEffect(() => {
    const newOrders = orders.filter(o => o.orderId && !knownOrderIdsRef.current.has(o.orderId));
    
    if (newOrders.length > 0) {
      newOrders.forEach(o => knownOrderIdsRef.current.add(o.orderId));
      const newestOrder = newOrders[0];
      setNewOrderAlert(newestOrder);
      playChime(false);

      const timer = setTimeout(() => {
        setNewOrderAlert(null);
      }, 9000);
      return () => clearTimeout(timer);
    }
  }, [orders]);

  // Update clock every 10 seconds to recalculate elapsed minutes and delay flags
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Format elapsed time in minutes
  const getElapsedMinutes = (createdAt) => {
    const diffMs = now - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  // Check if order is delayed (active and older than 35 minutes)
  const isOrderDelayed = (order) => {
    if (order.orderStatus === 'CONCLUIDO' || order.orderStatus === 'CANCELADO') return false;
    const elapsed = getElapsedMinutes(order.createdAt);
    return elapsed >= 35; // 35+ minutes threshold for warning
  };

  // Metrics calculations (Excluding cancelled orders!)
  const activeOrdersList = useMemo(() => {
    return orders.filter(o => o.orderStatus !== 'CANCELADO');
  }, [orders]);

  const totalRevenue = useMemo(() => {
    return activeOrdersList
      .filter(o => o.paymentStatus === 'PAGO_APROVADO' || o.orderStatus === 'CONCLUIDO')
      .reduce((acc, o) => acc + (o.total || 0), 0);
  }, [activeOrdersList]);

  const pendingCount = useMemo(() => {
    return activeOrdersList.filter(o => o.orderStatus === 'RECEBIDO_COZINHA').length;
  }, [activeOrdersList]);

  const inPrepCount = useMemo(() => {
    return activeOrdersList.filter(o => o.orderStatus === 'EM_PREPARO').length;
  }, [activeOrdersList]);

  const inDeliveryCount = useMemo(() => {
    return activeOrdersList.filter(o => o.orderStatus === 'SAIU_ENTREGA').length;
  }, [activeOrdersList]);

  const delayedCount = useMemo(() => {
    return activeOrdersList.filter(o => isOrderDelayed(o)).length;
  }, [activeOrdersList, now]);

  const completedCount = useMemo(() => {
    return activeOrdersList.filter(o => o.orderStatus === 'CONCLUIDO').length;
  }, [activeOrdersList]);

  const cancelledCount = useMemo(() => {
    return orders.filter(o => o.orderStatus === 'CANCELADO').length;
  }, [orders]);

  // Filtered orders list for KDS
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const isCancelled = order.orderStatus === 'CANCELADO';

      // Specific filter tabs
      if (selectedFilter === 'cancelados') {
        if (!isCancelled) return false;
      } else {
        // All other tabs hide cancelled orders unless specifically looking at cancelados
        if (isCancelled && selectedFilter !== 'todos') return false;
      }

      if (selectedFilter === 'atrasados' && !isOrderDelayed(order)) return false;
      if (selectedFilter === 'pendentes' && order.orderStatus !== 'RECEBIDO_COZINHA') return false;
      if (selectedFilter === 'preparo' && order.orderStatus !== 'EM_PREPARO') return false;
      if (selectedFilter === 'entrega' && order.orderStatus !== 'SAIU_ENTREGA') return false;
      if (selectedFilter === 'concluidos' && order.orderStatus !== 'CONCLUIDO') return false;
      if (selectedFilter === 'nao_pagos' && (order.paymentStatus === 'PAGO_APROVADO' || isCancelled)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = (order.orderId || '').toLowerCase().includes(q);
        const matchesName = (order.customerName || '').toLowerCase().includes(q);
        const matchesPhone = (order.customerPhone || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''));
        const matchesDistrict = (order.district || '').toLowerCase().includes(q);
        return matchesId || matchesName || matchesPhone || matchesDistrict;
      }

      return true;
    });
  }, [orders, selectedFilter, searchQuery, now]);

  // Print ticket helper
  const handlePrintOrder = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Comanda #${order.orderId} - El Shadday</title>
          <style>
            body { font-family: monospace; font-size: 13px; max-width: 320px; padding: 10px; margin: 0 auto; }
            h2, h3 { text-align: center; margin: 5px 0; }
            hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
            .item { margin-bottom: 8px; }
            .bold { font-weight: bold; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <h2>EL SHADDAY DELIVERY</h2>
          <h3>COMANDA #${order.orderId}</h3>
          <div>Data: ${new Date(order.createdAt).toLocaleString('pt-BR')}</div>
          ${order.orderStatus === 'CANCELADO' ? '<div style="color:red;font-weight:bold;font-size:16px;text-align:center;">*** PEDIDO CANCELADO ***</div>' : ''}
          <hr />
          <div><span class="bold">Cliente:</span> ${order.customerName}</div>
          ${order.customerPhone ? `<div><span class="bold">WhatsApp:</span> ${order.customerPhone}</div>` : ''}
          <div><span class="bold">Tipo:</span> ${order.deliveryType === 'delivery' ? 'ENTREGA' : 'RETIRADA NO BALCÃO'}</div>
          ${order.deliveryType === 'delivery' ? `
            <div><span class="bold">Bairro:</span> ${order.district}</div>
            <div><span class="bold">End:</span> ${order.address}${order.number ? `, Nº ${order.number}` : ''}</div>
            ${order.reference ? `<div><span class="bold">Ref:</span> ${order.reference}</div>` : ''}
          ` : ''}
          <hr />
          <div class="bold">ITENS DO PEDIDO:</div>
          ${(order.items || []).map(it => `
            <div class="item">
              <div class="bold">${it.quantity}x ${it.name}</div>
              ${it.isCustomBox && it.salgadasDetails ? `<div>- Salg: ${Object.entries(it.salgadasDetails).map(([k,v]) => `${v}x ${k}`).join(', ')}</div>` : ''}
              ${it.isCustomBox && it.docesDetails ? `<div>- Doces: ${Object.entries(it.docesDetails).map(([k,v]) => `${v}x ${k}`).join(', ')}</div>` : ''}
              ${it.notes ? `<div>- OBS: ${it.notes}</div>` : ''}
            </div>
          `).join('')}
          <hr />
          <div>Subtotal: R$ ${(order.subtotal || 0).toFixed(2)}</div>
          <div>Taxa Entrega: R$ ${(order.deliveryFee || 0).toFixed(2)}</div>
          <div class="bold" style="font-size: 15px;">TOTAL: R$ ${(order.total || 0).toFixed(2)}</div>
          <hr />
          <div><span class="bold">Pagamento:</span> ${order.paymentMethod}</div>
          <div><span class="bold">Status:</span> ${order.paymentStatus === 'PAGO_APROVADO' ? 'PAGO' : 'A RECEBER NA ENTREGA'}</div>
          <hr />
          <div style="text-align: center; font-size: 11px;">Ariquemes - RO • (69) 99222-8682</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // WhatsApp Message Launcher
  const handleOpenWhatsAppModal = (order, defaultType = 'pronto') => {
    let rawPhone = (order.customerPhone || '').replace(/\D/g, '');
    let initialMessage = '';

    const name = order.customerName || 'Cliente';
    const id = order.orderId;
    const isBalcao = order.deliveryType === 'balcao';

    if (defaultType === 'entrega') {
      initialMessage = `Olá ${name}! 🛵💨 Seu pedido #${id} da El Shadday acabou de sair para entrega! O nosso motoboy já está a caminho do seu endereço. Bom apetite! 🍕`;
    } else if (defaultType === 'pronto') {
      if (isBalcao) {
        initialMessage = `Olá ${name}! 🍕✨ Seu pedido #${id} da El Shadday já está quentinho e PRONTO no balcão esperando por você! Pode vir retirar na Rua Maceió, 2333 - Setor 03.`;
      } else {
        initialMessage = `Olá ${name}! 🍕✨ Seu pedido #${id} da El Shadday já ficou pronto e está sendo preparado para o envio!`;
      }
    } else if (defaultType === 'preparo') {
      initialMessage = `Olá ${name}! 👨‍🍳🔥 Passando para avisar que o seu pedido #${id} já está no forno sendo preparado com muito carinho pela equipe El Shadday!`;
    } else if (defaultType === 'cancelado') {
      initialMessage = `Olá ${name}, informamos que o seu pedido #${id} foi cancelado no sistema da El Shadday. Qualquer dúvida, estamos à disposição por aqui!`;
    }

    setWhatsappModalData({
      order,
      phone: rawPhone,
      message: initialMessage,
      activeTemplate: defaultType
    });
  };

  const handleApplyWhatsAppTemplate = (type) => {
    if (!whatsappModalData) return;
    const { order } = whatsappModalData;
    const name = order.customerName || 'Cliente';
    const id = order.orderId;
    const isBalcao = order.deliveryType === 'balcao';

    let msg = '';
    if (type === 'entrega') {
      msg = `Olá ${name}! 🛵💨 Seu pedido #${id} da El Shadday acabou de sair para entrega! O nosso motoboy já está a caminho do seu endereço. Bom apetite! 🍕`;
    } else if (type === 'pronto') {
      if (isBalcao) {
        msg = `Olá ${name}! 🍕✨ Seu pedido #${id} da El Shadday já está quentinho e PRONTO no balcão esperando por você! Pode vir retirar na Rua Maceió, 2333 - Setor 03.`;
      } else {
        msg = `Olá ${name}! 🍕✨ Seu pedido #${id} da El Shadday já ficou pronto e quentinho!`;
      }
    } else if (type === 'preparo') {
      msg = `Olá ${name}! 👨‍🍳🔥 Passando para avisar que seu pedido #${id} já está no forno sendo preparado com muito capricho pela equipe El Shadday!`;
    } else if (type === 'cancelado') {
      msg = `Olá ${name}, informamos que seu pedido #${id} foi cancelado no sistema da El Shadday. Qualquer dúvida, estamos à disposição por aqui!`;
    }

    setWhatsappModalData(prev => ({
      ...prev,
      message: msg,
      activeTemplate: type
    }));
  };

  const handleSendWhatsAppMessage = () => {
    if (!whatsappModalData) return;
    let digits = (whatsappModalData.phone || '').replace(/\D/g, '');
    if (!digits) {
      alert('Por favor, informe o número de WhatsApp do cliente!');
      return;
    }
    if (digits.length === 10 || digits.length === 11) {
      digits = '55' + digits;
    }
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(whatsappModalData.message)}`;
    window.open(url, '_blank');
    setWhatsappModalData(null);
  };

  // Cancel / Delete Order Execution
  const handleConfirmCancel = () => {
    if (!cancelModalOrder) return;
    if (onCancelOrder) {
      onCancelOrder(cancelModalOrder.orderId, cancelReason);
    } else {
      onUpdateOrderStatus(cancelModalOrder.orderId, 'CANCELADO');
    }
    setCancelModalOrder(null);
    setCancelReason('');
  };

  const handleConfirmDelete = () => {
    if (!cancelModalOrder) return;
    if (onDeleteOrder) {
      onDeleteOrder(cancelModalOrder.orderId);
    }
    setCancelModalOrder(null);
    setCancelReason('');
  };

  // PDV Helpers
  const pdvFilteredProducts = useMemo(() => {
    let list = productsList.filter(p => p.isAvailable !== false);
    if (pdvCategory !== 'todos') {
      list = list.filter(p => p.categoryId === pdvCategory);
    }
    if (pdvSearch.trim()) {
      const q = pdvSearch.toLowerCase().trim();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [pdvCategory, pdvSearch, productsList]);

  const pdvCartSubtotal = useMemo(() => {
    return pdvCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [pdvCart]);

  const pdvDeliveryFee = pdvDeliveryType === 'delivery' ? (pdvDistrict?.price || 8) : 0;
  const pdvCartTotal = pdvCartSubtotal + pdvDeliveryFee;

  const handleAddProductToPDV = (product, quantity = 1) => {
    setPdvValidationError('');
    setPdvCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        notes: '',
        isBox: product.isBox,
        totalCount: product.totalCount,
        image: product.image
      }];
    });
  };

  const handleUpdatePDVItemQty = (id, delta) => {
    setPdvCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const handleRemovePDVItem = (id) => {
    setPdvCart(prev => prev.filter(i => i.id !== id));
  };

  const handleLaunchPDVOrder = () => {
    setPdvValidationError('');

    if (pdvCart.length === 0) {
      setPdvValidationError('Adicione pelo menos 1 item ao pedido no PDV!');
      return;
    }

    if (!pdvCustomerName.trim()) {
      setPdvValidationError('Por favor, informe o nome do cliente!');
      return;
    }

    if (pdvDeliveryType === 'delivery' && !pdvAddress.trim()) {
      setPdvValidationError('Informe o endereço de entrega do cliente!');
      return;
    }

    const orderId = `ES-${Math.floor(1000 + Math.random() * 9000)}`;

    let paymentMethodText = 'PIX';
    if (pdvPaymentMethod === 'dinheiro') {
      paymentMethodText = `Dinheiro ${pdvCashChange ? `(Troco p/ R$ ${pdvCashChange})` : '(Sem troco)'}`;
    } else if (pdvPaymentMethod === 'debito') {
      paymentMethodText = 'Cartão de Débito (Balcão / Maquininha)';
    } else if (pdvPaymentMethod === 'credito') {
      paymentMethodText = 'Cartão de Crédito (Balcão / Maquininha)';
    }

    const newOrder = {
      orderId,
      createdAt: new Date().toISOString(),
      customerName: pdvCustomerName.trim(),
      customerPhone: pdvCustomerPhone.trim(),
      deliveryType: pdvDeliveryType,
      district: pdvDeliveryType === 'delivery' ? pdvDistrict.name : 'Balcão (Setor 03)',
      address: pdvDeliveryType === 'delivery' ? pdvAddress.trim() : 'Rua Maceió, 2333 - Setor 03, Ariquemes - RO',
      number: pdvDeliveryType === 'delivery' ? pdvNumber.trim() : '',
      reference: pdvDeliveryType === 'delivery' ? pdvReference.trim() : '',
      items: pdvCart,
      subtotal: pdvCartSubtotal,
      deliveryFee: pdvDeliveryFee,
      total: pdvCartTotal,
      paymentMethod: paymentMethodText,
      paymentStatus: pdvIsPaid ? 'PAGO_APROVADO' : 'PENDENTE',
      orderStatus: 'RECEBIDO_COZINHA',
      source: 'PDV_BALCAO',
      orderNotes: pdvOrderNotes.trim()
    };

    if (onCreateKitchenOrder) {
      onCreateKitchenOrder(newOrder);
    }

    playChime(false);
    setPdvSuccessOrder(newOrder);

    // Reset PDV form
    setPdvCart([]);
    setPdvCustomerName('');
    setPdvCustomerPhone('');
    setPdvAddress('');
    setPdvNumber('');
    setPdvReference('');
    setPdvCashChange('');
    setPdvOrderNotes('');
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans">
      
      {/* Real-time Order Alert Banner */}
      {newOrderAlert && (
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-dark-950 font-black px-4 py-3 flex items-center justify-between shadow-2xl animate-bounce-subtle z-50 sticky top-0">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <BellRing className="w-5 h-5 animate-pulse" />
            <span>NOVO PEDIDO CHEGOU NA COZINHA! #{newOrderAlert.orderId} - {newOrderAlert.customerName} (R$ {(newOrderAlert.total || 0).toFixed(2).replace('.', ',')})</span>
          </div>
          <button
            onClick={() => setNewOrderAlert(null)}
            className="text-xs bg-dark-950 text-white px-2.5 py-1 rounded-lg cursor-pointer"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-dark-900 border-b border-dark-800 sticky top-0 z-40 px-3 sm:px-6 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/30">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-base sm:text-lg text-white">
                  Painel de Controle El Shadday
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  🟢 KDS Sincronizado
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Gestão da Cozinha, Entregas & PDV de Balcão
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleUnlockAndTestAudio}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isAudioUnlocked
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40'
                  : 'bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black animate-pulse shadow-glow-gold'
              }`}
              title="Ativar/testar alarme sonoro da cozinha"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>{isAudioUnlocked ? 'Som Ativo' : 'ATIVAR SOM'}</span>
            </button>

            <button
              onClick={onBackToSite}
              className="px-3 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 font-semibold text-xs border border-dark-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ver Site</span>
            </button>

            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-xs border border-red-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sair do painel administrativo"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-2 border-t border-dark-800 pt-2.5 overflow-x-auto scrollbar-none pb-1">
          <button
            type="button"
            onClick={() => setActiveAdminTab('kds')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeAdminTab === 'kds'
                ? 'bg-brand-gold text-dark-950 shadow-glow-gold font-black'
                : 'bg-dark-800 text-slate-300 hover:bg-dark-750 hover:text-white border border-dark-750'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Pedidos da Cozinha (KDS)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              activeAdminTab === 'kds' ? 'bg-dark-950 text-brand-gold' : 'bg-dark-900 text-slate-400'
            }`}>
              {activeOrdersList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('pdv')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeAdminTab === 'pdv'
                ? 'bg-brand-gold text-dark-950 shadow-glow-gold font-black'
                : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/40'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Novo Pedido (PDV)</span>
            {pdvCart.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-dark-950 font-black">
                {pdvCart.length} itens
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('menu')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeAdminTab === 'menu'
                ? 'bg-brand-gold text-dark-950 shadow-glow-gold font-black'
                : 'bg-dark-800 text-slate-300 hover:bg-dark-750 hover:text-white border border-dark-750'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Cardápio & Promoções</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              activeAdminTab === 'menu' ? 'bg-dark-950 text-brand-gold' : 'bg-dark-900 text-slate-400'
            }`}>
              {productsList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('gallery')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeAdminTab === 'gallery'
                ? 'bg-brand-gold text-dark-950 shadow-glow-gold font-black'
                : 'bg-dark-800 text-slate-300 hover:bg-dark-750 hover:text-white border border-dark-750'
            }`}
          >
            <Camera className="w-4 h-4 text-brand-gold" />
            <span>Galeria de Fotos (Buffet)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              activeAdminTab === 'gallery' ? 'bg-dark-950 text-brand-gold' : 'bg-dark-900 text-slate-400'
            }`}>
              {galleryList.length}
            </span>
          </button>

          {onSwitchToBuffet && (
            <button
              type="button"
              onClick={onSwitchToBuffet}
              className="ml-auto px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-brand-gold/20 text-brand-gold hover:text-white hover:bg-brand-gold/30 border border-brand-gold/40 transition-all cursor-pointer whitespace-nowrap"
              title="Acessar o site do Buffet"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ver Site do Buffet 👑</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-6">
        
        {/* ============================================================== */}
        {/* VIEW 1: KITCHEN DISPLAY SYSTEM (KDS) & ORDERS FEED             */}
        {/* ============================================================== */}
        {activeAdminTab === 'kds' && (
          <div className="space-y-5 animate-fade-in">

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-4">
              
              {/* Card 1: Faturamento */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-dark-900 border border-dark-800 shadow-md flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Faturamento Total</div>
                  <div className="text-base sm:text-xl font-black text-white">
                    R$ {totalRevenue.toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </div>

              {/* Card 2: Pedidos Pendentes */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-dark-900 border border-dark-800 shadow-md flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Novos / Pendentes</div>
                  <div className="text-base sm:text-xl font-black text-amber-400">
                    {pendingCount}
                  </div>
                </div>
              </div>

              {/* Card 3: Na Cozinha */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-dark-900 border border-dark-800 shadow-md flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center flex-shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">No Forno / Preparo</div>
                  <div className="text-base sm:text-xl font-black text-brand-gold">
                    {inPrepCount}
                  </div>
                </div>
              </div>

              {/* Card 4: EM ATRASO (ALERT!) */}
              <div className={`p-3.5 sm:p-4 rounded-2xl border shadow-md flex items-center gap-3 ${
                delayedCount > 0 
                  ? 'bg-red-500/15 border-red-500/50 text-red-400 animate-pulse' 
                  : 'bg-dark-900 border-dark-800 text-slate-400'
              }`}>
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  delayedCount > 0 ? 'bg-red-500 text-dark-950 font-bold' : 'bg-dark-800 text-slate-500'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                    {delayedCount > 0 ? '🚨 Atraso (+35 min)' : 'Em Atraso'}
                  </div>
                  <div className="text-base sm:text-xl font-black text-white">
                    {delayedCount}
                  </div>
                </div>
              </div>

              {/* Card 5: Concluídos */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-dark-900 border border-dark-800 shadow-md flex items-center gap-3 col-span-2 sm:col-span-1">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Entregues / Prontos</div>
                  <div className="text-base sm:text-xl font-black text-white">
                    {completedCount}
                  </div>
                </div>
              </div>

            </div>

            {/* Filter Bar & Search */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-dark-900 border border-dark-800 space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                
                {/* Filter buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => setSelectedFilter('todos')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedFilter === 'todos' 
                        ? 'bg-brand-gold text-dark-950 font-black' 
                        : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                    }`}
                  >
                    Ativos ({activeOrdersList.length})
                  </button>

                  <button
                    onClick={() => setSelectedFilter('atrasados')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      selectedFilter === 'atrasados' 
                        ? 'bg-red-500 text-white font-black' 
                        : 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Em Atraso ({delayedCount})</span>
                  </button>

                  <button
                    onClick={() => setSelectedFilter('pendentes')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedFilter === 'pendentes' 
                        ? 'bg-amber-500 text-dark-950 font-black' 
                        : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                    }`}
                  >
                    Pendentes ({pendingCount})
                  </button>

                  <button
                    onClick={() => setSelectedFilter('preparo')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedFilter === 'preparo' 
                        ? 'bg-brand-gold text-dark-950 font-black' 
                        : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                    }`}
                  >
                    No Forno ({inPrepCount})
                  </button>

                  <button
                    onClick={() => setSelectedFilter('entrega')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedFilter === 'entrega' 
                        ? 'bg-blue-500 text-white font-black' 
                        : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                    }`}
                  >
                    Saiu p/ Entrega ({inDeliveryCount})
                  </button>

                  <button
                    onClick={() => setSelectedFilter('concluidos')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedFilter === 'concluidos' 
                        ? 'bg-emerald-500 text-dark-950 font-black' 
                        : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                    }`}
                  >
                    Prontos / Entregues ({completedCount})
                  </button>

                  <button
                    onClick={() => setSelectedFilter('cancelados')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      selectedFilter === 'cancelados' 
                        ? 'bg-red-700 text-white font-black' 
                        : 'bg-red-950/40 text-red-400 hover:bg-red-950/70 border border-red-800/40'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancelados ({cancelledCount})</span>
                  </button>
                </div>

                {/* Search input */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar por Nº, Nome ou Bairro..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                  />
                </div>

              </div>
            </div>

            {/* Orders Feed */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Mostrando <strong>{filteredOrders.length}</strong> pedidos</span>
                <span className="flex items-center gap-1 text-[11px] text-brand-gold">
                  <RefreshCw className="w-3 h-3 animate-spin-slow" />
                  Sincronização em tempo real ativa
                </span>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="p-12 rounded-3xl bg-dark-900 border border-dark-800 text-center space-y-2">
                  <Package className="w-12 h-12 text-slate-600 mx-auto" />
                  <div className="text-sm font-bold text-slate-300">Nenhum pedido encontrado nesta seção.</div>
                  <p className="text-xs text-slate-500">Mude os filtros acima ou crie um novo pedido no PDV de Balcão!</p>
                  <button
                    onClick={() => setActiveAdminTab('pdv')}
                    className="mt-2 px-4 py-2 rounded-xl bg-brand-gold hover:bg-amber-400 text-dark-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-glow-gold"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Criar Pedido no PDV</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredOrders.map((order) => {
                    const elapsedMin = getElapsedMinutes(order.createdAt);
                    const isDelayed = isOrderDelayed(order);
                    const isCancelled = order.orderStatus === 'CANCELADO';
                    const isPaid = order.paymentStatus === 'PAGO_APROVADO';

                    return (
                      <div
                        key={order.orderId}
                        className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all shadow-md ${
                          isCancelled
                            ? 'bg-red-950/15 border-red-900/50 opacity-80'
                            : isDelayed
                            ? 'bg-red-950/20 border-red-500/60 ring-1 ring-red-500/40'
                            : order.orderStatus === 'CONCLUIDO'
                            ? 'bg-dark-900/60 border-dark-800 opacity-75'
                            : 'bg-dark-900 border-dark-800 hover:border-brand-gold/50'
                        }`}
                      >
                        <div>
                          {/* Top Header of the card */}
                          <div className="flex items-start justify-between gap-2 border-b border-dark-800 pb-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-display font-black text-lg text-white">
                                  #{order.orderId}
                                </span>

                                {/* Cancelled badge */}
                                {isCancelled && (
                                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] uppercase flex items-center gap-1">
                                    <XCircle className="w-3 h-3" />
                                    CANCELADO
                                  </span>
                                )}

                                {/* Delay warning pill */}
                                {!isCancelled && isDelayed && (
                                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-black text-[10px] uppercase flex items-center gap-1 animate-pulse">
                                    <AlertTriangle className="w-3 h-3" />
                                    ATRASO ({elapsedMin} min)
                                  </span>
                                )}

                                {!isCancelled && !isDelayed && (
                                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                                    <Clock className="w-3 h-3 text-brand-gold" />
                                    {elapsedMin === 0 ? 'Agora mesmo' : `há ${elapsedMin} min`}
                                  </span>
                                )}
                              </div>

                              <div className="text-xs font-bold text-white mt-1 flex items-center gap-1.5 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 text-brand-gold" />
                                  <span>{order.customerName}</span>
                                </span>

                                {order.customerPhone && (
                                  <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    <Phone className="w-3 h-3" />
                                    <span>{order.customerPhone}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Payment Status Pill */}
                            <div className="text-right">
                              {isPaid ? (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-[11px] inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>PAGO</span>
                                </span>
                              ) : (
                                <div className="space-y-1">
                                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold text-[11px] inline-flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>COBRAR NA ENTREGA</span>
                                  </span>
                                  {!isCancelled && (
                                    <button
                                      onClick={() => onUpdatePaymentStatus(order.orderId, 'PAGO_APROVADO')}
                                      className="text-[10px] text-emerald-400 hover:text-emerald-300 underline block text-right cursor-pointer"
                                    >
                                      Marcar como Pago
                                    </button>
                                  )}
                                </div>
                              )}
                              <div className="text-[10px] text-slate-400 mt-1">
                                {order.paymentMethod}
                              </div>
                            </div>
                          </div>

                          {/* Delivery address & info */}
                          <div className="py-2.5 text-xs text-slate-300 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" />
                              <span>
                                <strong>{order.deliveryType === 'delivery' ? order.district : 'Retirada no Balcão (Setor 03)'}</strong>
                                {order.deliveryType === 'delivery' && ` • ${order.address}${order.number ? `, Nº ${order.number}` : ''}`}
                              </span>
                            </div>
                            {order.reference && (
                              <div className="text-[11px] text-brand-goldLight pl-5">
                                Ponto de Referência: {order.reference}
                              </div>
                            )}
                            {order.cancelReason && (
                              <div className="text-[11px] text-red-400 pl-5 font-semibold">
                                Motivo do Cancelamento: {order.cancelReason}
                              </div>
                            )}
                          </div>

                          {/* Items List (Kitchen preparation list) */}
                          <div className="bg-dark-950 p-3 rounded-xl border border-dark-850 space-y-2 mt-1">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              O que precisa ser feito:
                            </div>
                            <div className="space-y-1.5 text-xs">
                              {(order.items || []).map((it, idx) => (
                                <div key={idx} className="border-b border-dark-900 pb-1 last:border-0 last:pb-0">
                                  <div className="font-bold text-white flex items-center justify-between">
                                    <span>{it.quantity}x {it.name}</span>
                                    <span className="text-slate-400 text-[11px]">
                                      R$ {((it.price || 0) * (it.quantity || 1)).toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>

                                  {/* Custom Box details */}
                                  {it.isCustomBox && (
                                    <div className="text-[11px] text-brand-goldLight pl-2 mt-0.5 space-y-0.5">
                                      {it.salgadasDetails && (
                                        <div>🥟 <strong>Salg:</strong> {Object.entries(it.salgadasDetails).map(([k, v]) => `${v}x ${k}`).join(', ')}</div>
                                      )}
                                      {it.docesDetails && (
                                        <div>🍫 <strong>Doces:</strong> {Object.entries(it.docesDetails).map(([k, v]) => `${v}x ${k}`).join(', ')}</div>
                                      )}
                                    </div>
                                  )}

                                  {(it.semSuinos || it.semSuinosEsfirras) && (
                                    <div className="text-[11px] text-red-400 font-extrabold pl-2 bg-red-950/40 p-1 rounded border border-red-500/40 mt-0.5">
                                      🚫 ATENÇÃO COZINHA: SEM CARNE SUÍNA (SEM CALABRESA / BACON)
                                    </div>
                                  )}

                                  {it.notes && (
                                    <div className="text-[11px] text-amber-300 font-semibold pl-2">
                                      ⚠️ OBS: {it.notes}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Total */}
                          <div className="flex justify-between items-baseline pt-3 text-xs">
                            <span className="text-slate-400">Total com Entrega:</span>
                            <span className="text-lg font-black text-brand-gold">
                              R$ {(order.total || 0).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </div>

                        {/* Operational Action Controls */}
                        <div className="pt-3.5 border-t border-dark-800 mt-3 flex flex-wrap items-center justify-between gap-2">
                          
                          {/* Left: Print & WhatsApp Buttons */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => handlePrintOrder(order)}
                              className="px-2.5 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-dark-700 transition-colors cursor-pointer"
                              title="Imprimir comanda para a cozinha"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Imprimir</span>
                            </button>

                            {/* WhatsApp Button */}
                            <button
                              onClick={() => handleOpenWhatsAppModal(order, order.deliveryType === 'balcao' ? 'pronto' : 'entrega')}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                              title="Enviar mensagem no WhatsApp do cliente"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Avisar Cliente</span>
                            </button>
                          </div>

                          {/* Right: Status Flow & Cancel Button */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            
                            {!isCancelled && order.orderStatus === 'RECEBIDO_COZINHA' && (
                              <button
                                onClick={() => {
                                  onUpdateOrderStatus(order.orderId, 'EM_PREPARO');
                                  handleOpenWhatsAppModal(order, 'preparo');
                                }}
                                className="px-3 py-1.5 rounded-xl bg-brand-gold hover:bg-amber-400 text-dark-950 font-bold text-xs flex items-center gap-1 shadow-glow-gold transition-all cursor-pointer"
                              >
                                <Flame className="w-3.5 h-3.5" />
                                <span>Mover p/ Forno</span>
                              </button>
                            )}

                            {!isCancelled && order.orderStatus === 'EM_PREPARO' && (
                              <button
                                onClick={() => {
                                  if (order.deliveryType === 'balcao') {
                                    onUpdateOrderStatus(order.orderId, 'CONCLUIDO');
                                    handleOpenWhatsAppModal(order, 'pronto');
                                  } else {
                                    onUpdateOrderStatus(order.orderId, 'SAIU_ENTREGA');
                                    handleOpenWhatsAppModal(order, 'entrega');
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer"
                              >
                                {order.deliveryType === 'balcao' ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Pronto p/ Retirada</span>
                                  </>
                                ) : (
                                  <>
                                    <Bike className="w-3.5 h-3.5" />
                                    <span>Despachar Entrega</span>
                                  </>
                                )}
                              </button>
                            )}

                            {!isCancelled && order.orderStatus === 'SAIU_ENTREGA' && (
                              <button
                                onClick={() => onUpdateOrderStatus(order.orderId, 'CONCLUIDO')}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-bold text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Marcar Entregue</span>
                              </button>
                            )}

                            {!isCancelled && order.orderStatus === 'CONCLUIDO' && (
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Concluído</span>
                              </span>
                            )}

                            {/* CANCEL / DELETE BUTTON */}
                            <button
                              onClick={() => {
                                setCancelModalOrder(order);
                                setCancelReason('');
                              }}
                              className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Cancelar ou excluir pedido"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Cancelar</span>
                            </button>

                          </div>

                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: PDV DE BALCÃO (POINT OF SALE / CRIAR PEDIDOS COZINHA)  */}
        {/* ============================================================== */}
        {activeAdminTab === 'pdv' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* PDV Header Banner */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-brand-gold/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
              <div>
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-brand-gold" />
                  <h2 className="text-base sm:text-lg font-black text-white">
                    Ponto de Venda (PDV) • Atendimento Rápido
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lance pedidos do balcão ou telefone diretamente na fila de produção da cozinha.
                </p>
              </div>

              {pdvCart.length > 0 && (
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-xs text-slate-400">Total Atual:</span>
                  <span className="text-lg font-black text-brand-gold">
                    R$ {pdvCartTotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
            </div>

            {/* Validation Banner if any */}
            {pdvValidationError && (
              <div className="p-3.5 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold flex items-center justify-between gap-2 animate-bounce-subtle">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{pdvValidationError}</span>
                </div>
                <button
                  onClick={() => setPdvValidationError('')}
                  className="text-red-300 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {/* PDV Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT: PRODUCTS CATALOG (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Search & Category Filter */}
                <div className="p-3.5 rounded-2xl bg-dark-900 border border-dark-800 space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar produto por nome ou ingrediente..."
                      value={pdvSearch}
                      onChange={(e) => setPdvSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setPdvCategory('todos')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        pdvCategory === 'todos'
                          ? 'bg-brand-gold text-dark-950 font-black'
                          : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                      }`}
                    >
                      Todos
                    </button>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setPdvCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          pdvCategory === cat.id
                            ? 'bg-brand-gold text-dark-950 font-black'
                            : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {pdvFilteredProducts.map(prod => {
                    const inCart = pdvCart.find(i => i.id === prod.id);

                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleAddProductToPDV(prod, 1)}
                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-2.5 ${
                          inCart
                            ? 'bg-brand-gold/10 border-brand-gold/60 shadow-sm'
                            : 'bg-dark-900 hover:bg-dark-850 border-dark-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {prod.image && (
                            <div className="w-11 h-11 rounded-xl overflow-hidden bg-dark-950 flex-shrink-0 border border-dark-800">
                              <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{prod.name}</h4>
                            <div className="text-xs font-black text-brand-gold mt-0.5">
                              R$ {(prod.price || 0).toFixed(2).replace('.', ',')}
                            </div>
                          </div>
                        </div>

                        {/* Quick Add Button */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {inCart ? (
                            <div className="flex items-center gap-1 bg-dark-950 px-2 py-1 rounded-xl border border-dark-750">
                              <span className="text-xs font-black text-brand-gold">
                                {inCart.quantity}x
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddProductToPDV(prod, 1);
                                }}
                                className="w-5 h-5 rounded bg-brand-gold hover:bg-amber-400 text-dark-950 flex items-center justify-center font-bold text-xs"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddProductToPDV(prod, 1);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-dark-800 hover:bg-brand-gold hover:text-dark-950 text-slate-300 font-bold text-xs transition-colors flex items-center gap-1 border border-dark-700"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Incluir</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* RIGHT: ORDER SUMMARY & DISPATCH (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                
                <div className="p-4 rounded-3xl bg-dark-900 border border-dark-800 space-y-4 shadow-xl">
                  
                  {/* Cart Items Title */}
                  <div className="flex items-center justify-between border-b border-dark-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-brand-gold" />
                      <h3 className="text-sm font-black text-white">Comanda do Pedido</h3>
                    </div>
                    {pdvCart.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPdvCart([])}
                        className="text-[11px] text-red-400 hover:underline cursor-pointer"
                      >
                        Limpar Itens
                      </button>
                    )}
                  </div>

                  {/* Items list */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {pdvCart.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs">
                        Clique nos produtos ao lado para montar o pedido.
                      </div>
                    ) : (
                      pdvCart.map(item => (
                        <div key={item.id} className="p-2 rounded-xl bg-dark-950 border border-dark-800 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white truncate">{item.name}</div>
                            <div className="text-[11px] text-brand-gold">
                              R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdatePDVItemQty(item.id, -1)}
                              className="w-6 h-6 rounded-lg bg-dark-800 hover:bg-dark-700 text-white flex items-center justify-center text-xs cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-black text-white">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdatePDVItemQty(item.id, 1)}
                              className="w-6 h-6 rounded-lg bg-brand-gold hover:bg-amber-400 text-dark-950 flex items-center justify-center text-xs font-bold cursor-pointer"
                            >
                              <Plus className="w-3 h-3 stroke-[3]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePDVItem(item.id)}
                              className="w-6 h-6 rounded-lg text-slate-500 hover:text-red-400 flex items-center justify-center text-xs ml-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Customer Information Form */}
                  <div className="border-t border-dark-800 pt-3 space-y-3">
                    <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Dados do Cliente:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Nome do Cliente *</label>
                        <input
                          type="text"
                          placeholder="Ex: Carlos Oliveira"
                          value={pdvCustomerName}
                          onChange={(e) => setPdvCustomerName(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">WhatsApp / Celular</label>
                        <input
                          type="text"
                          placeholder="(69) 99999-9999"
                          value={pdvCustomerPhone}
                          onChange={(e) => setPdvCustomerPhone(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                        />
                      </div>
                    </div>

                    {/* Delivery Type Selector */}
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Tipo de Pedido:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPdvDeliveryType('balcao')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            pdvDeliveryType === 'balcao'
                              ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                              : 'bg-dark-950 text-slate-400 border border-dark-800'
                          }`}
                        >
                          <Store className="w-3.5 h-3.5" />
                          <span>Balcão (Retirada)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPdvDeliveryType('delivery')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            pdvDeliveryType === 'delivery'
                              ? 'bg-blue-500 text-white font-black shadow-sm'
                              : 'bg-dark-950 text-slate-400 border border-dark-800'
                          }`}
                        >
                          <Bike className="w-3.5 h-3.5" />
                          <span>Delivery (Entrega)</span>
                        </button>
                      </div>
                    </div>

                    {/* If Delivery: District & Address */}
                    {pdvDeliveryType === 'delivery' && (
                      <div className="space-y-2 p-2.5 rounded-xl bg-dark-950 border border-dark-800">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Bairro em Ariquemes:</label>
                          <select
                            value={pdvDistrict.id}
                            onChange={(e) => {
                              const found = ARIQUEMES_DISTRICTS.find(d => d.id === e.target.value);
                              if (found) setPdvDistrict(found);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:outline-none focus:border-brand-gold"
                          >
                            {ARIQUEMES_DISTRICTS.map(d => (
                              <option key={d.id} value={d.id}>
                                {d.name} (+ R$ {d.price.toFixed(2)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="text-[10px] text-slate-400 block mb-0.5">Rua / Endereço *</label>
                            <input
                              type="text"
                              placeholder="Ex: Rua das Flores"
                              value={pdvAddress}
                              onChange={(e) => setPdvAddress(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Nº</label>
                            <input
                              type="text"
                              placeholder="123"
                              value={pdvNumber}
                              onChange={(e) => setPdvNumber(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Ponto de Referência</label>
                          <input
                            type="text"
                            placeholder="Ex: Próximo à padaria"
                            value={pdvReference}
                            onChange={(e) => setPdvReference(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                          />
                        </div>
                      </div>
                    )}

                    {/* Payment & Status */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 block">Forma de Pagamento:</label>
                      <div className="grid grid-cols-4 gap-1 text-[11px]">
                        {[
                          { id: 'pix', label: 'PIX' },
                          { id: 'dinheiro', label: 'Dinheiro' },
                          { id: 'debito', label: 'Débito' },
                          { id: 'credito', label: 'Crédito' }
                        ].map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPdvPaymentMethod(p.id)}
                            className={`py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                              pdvPaymentMethod === p.id
                                ? 'bg-brand-gold text-dark-950 border-brand-gold'
                                : 'bg-dark-950 text-slate-400 border-dark-800'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>

                      {pdvPaymentMethod === 'dinheiro' && (
                        <div className="pt-1">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Troco para quanto?</label>
                          <input
                            type="text"
                            placeholder="Ex: 50,00 ou deixe em branco se não precisa"
                            value={pdvCashChange}
                            onChange={(e) => setPdvCashChange(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:outline-none focus:border-brand-gold"
                          />
                        </div>
                      )}

                      {/* Payment Status Checkbox */}
                      <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={pdvIsPaid}
                          onChange={(e) => setPdvIsPaid(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                        />
                        <span className={`text-xs font-bold ${pdvIsPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {pdvIsPaid ? '✅ Pedido Já Pago no Balcão' : '⚠️ A Cobrar na Entrega/Balcão'}
                        </span>
                      </label>
                    </div>

                    {/* Kitchen Observations */}
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Observações para a Cozinha:</label>
                      <input
                        type="text"
                        placeholder="Ex: Sem cebola, massa bem crocante..."
                        value={pdvOrderNotes}
                        onChange={(e) => setPdvOrderNotes(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                  </div>

                  {/* Summary Totals & Launch Button */}
                  <div className="border-t border-dark-800 pt-3 space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Subtotal Itens:</span>
                      <span>R$ {pdvCartSubtotal.toFixed(2).replace('.', ',')}</span>
                    </div>

                    {pdvDeliveryType === 'delivery' && (
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Taxa de Entrega ({pdvDistrict.name}):</span>
                        <span>R$ {pdvDeliveryFee.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-dark-850">
                      <span>Total Geral:</span>
                      <span className="text-xl font-black text-brand-gold">
                        R$ {pdvCartTotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleLaunchPDVOrder}
                      disabled={pdvCart.length === 0}
                      className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg mt-2 ${
                        pdvCart.length > 0
                          ? 'bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold hover:scale-102 text-dark-950 shadow-glow-gold active:scale-98'
                          : 'bg-dark-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Flame className="w-5 h-5" />
                      <span>Lançar Pedido na Cozinha (PDV)</span>
                    </button>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: CARDÁPIO, PRODUTOS & PROMOÇÕES MANAGEMENT             */}
        {/* ============================================================== */}
        {activeAdminTab === 'menu' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Header Box */}
            <div className="bg-dark-900 border border-dark-800 rounded-3xl p-5 sm:p-7 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-dark-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-brand-gold/15 text-brand-gold flex items-center justify-center border border-brand-gold/30">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                      <span>Gestão Completa de Cardápio & Promoções</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold border border-brand-gold/30 font-bold">
                        {productsList.length} itens
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Crie novos itens, edite preços, pause produtos esgotados e configure promoções e cupons da loja.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenCreateProduct}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black text-xs hover:brightness-110 shadow-glow-gold flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ Criar Novo Produto</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetMenuToDefault}
                    className="px-3 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white text-xs font-semibold border border-dark-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Restaurar o cardápio original"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-brand-gold" />
                    <span>Restaurar Padrão</span>
                  </button>
                </div>
              </div>

              {/* Toast Feedback */}
              {menuFeedback && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{menuFeedback}</span>
                </div>
              )}

              {/* Sub-tabs: Produtos | Promoções & Cupons | Dados do Restaurante */}
              <div className="flex items-center gap-2 mt-5 border-b border-dark-800 pb-3 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setMenuSubTab('products')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    menuSubTab === 'products'
                      ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                      : 'bg-dark-800/80 text-slate-400 hover:text-white hover:bg-dark-800'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Produtos & Preços ({productsList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMenuSubTab('promos')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    menuSubTab === 'promos'
                      ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                      : 'bg-dark-800/80 text-slate-400 hover:text-white hover:bg-dark-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Promoções, Banners & Cupons</span>
                  {promoSettings.bannerActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setMenuSubTab('store')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    menuSubTab === 'store'
                      ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                      : 'bg-dark-800/80 text-slate-400 hover:text-white hover:bg-dark-800'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Configurações da Loja</span>
                </button>
              </div>

              {/* SUBTAB 1: PRODUTOS & PREÇOS */}
              {menuSubTab === 'products' && (
                <div className="mt-5 space-y-4">
                  {/* Search and Category Filters */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Buscar por nome, ingrediente ou ID..."
                        value={menuSearch}
                        onChange={(e) => setMenuSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>Exibindo:</span>
                      <span className="font-mono text-brand-gold font-bold">{filteredAdminProducts.length}</span>
                      <span>de {productsList.length} itens</span>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setMenuCategoryFilter('todos')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        menuCategoryFilter === 'todos'
                          ? 'bg-brand-gold text-dark-950 font-black'
                          : 'bg-dark-800 text-slate-300 hover:bg-dark-750 hover:text-white'
                      }`}
                    >
                      Todos ({productsList.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setMenuCategoryFilter('promos')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                        menuCategoryFilter === 'promos'
                          ? 'bg-amber-400 text-dark-950 font-black'
                          : 'bg-dark-800 text-amber-300 hover:bg-dark-750'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Em Promoção ({productsList.filter(p => p.isPromo || p.originalPrice).length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMenuCategoryFilter('pausados')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                        menuCategoryFilter === 'pausados'
                          ? 'bg-rose-500 text-white font-black'
                          : 'bg-dark-800 text-rose-300 hover:bg-dark-750'
                      }`}
                    >
                      <EyeOff className="w-3 h-3 text-rose-400" />
                      <span>Pausados/Esgotados ({productsList.filter(p => p.isAvailable === false).length})</span>
                    </button>

                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setMenuCategoryFilter(cat.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                          menuCategoryFilter === cat.id
                            ? 'bg-brand-gold text-dark-950 font-black'
                            : 'bg-dark-800 text-slate-300 hover:bg-dark-750 hover:text-white'
                        }`}
                      >
                        {cat.name} ({productsList.filter(p => p.categoryId === cat.id).length})
                      </button>
                    ))}
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                    {filteredAdminProducts.map(product => {
                      const isAvailable = product.isAvailable !== false;
                      const hasPromo = !!product.isPromo || (product.originalPrice && product.originalPrice > product.price);
                      const discountPercent = hasPromo && product.originalPrice 
                        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
                        : null;

                      return (
                        <div
                          key={product.id}
                          className={`rounded-2xl p-3.5 bg-dark-800/80 border transition-all flex flex-col justify-between gap-3 ${
                            isAvailable ? 'border-dark-700 hover:border-brand-gold/50' : 'border-rose-900/60 bg-dark-900/90 opacity-75'
                          }`}
                        >
                          <div className="flex gap-3 items-start">
                            {/* Thumbnail */}
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-black/50 border border-dark-700 flex-shrink-0">
                              <img
                                src={product.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80'}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80';
                                }}
                              />
                              {!isAvailable && (
                                <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-1 text-center">
                                  <span className="text-[9px] font-black text-rose-300 uppercase leading-tight">Esgotado</span>
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-dark-950 text-slate-400 border border-dark-700">
                                  {CATEGORIES.find(c => c.id === product.categoryId)?.name || product.categoryId}
                                </span>
                                {product.badge && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-black uppercase bg-brand-red text-white">
                                    {product.badge}
                                  </span>
                                )}
                                {discountPercent && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-black uppercase bg-amber-400 text-dark-950">
                                    -{discountPercent}% OFF
                                  </span>
                                )}
                              </div>

                              <h4 className="font-display font-bold text-sm text-white mt-1 leading-snug line-clamp-1" title={product.name}>
                                {product.name}
                              </h4>

                              <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                                {product.description || 'Sem descrição cadastrada.'}
                              </p>

                              <div className="mt-1.5 flex items-baseline gap-2">
                                <span className="text-sm font-black text-brand-gold">
                                  R$ {product.price?.toFixed(2).replace('.', ',')}
                                </span>
                                {product.originalPrice && (
                                  <span className="text-[10px] text-slate-500 line-through">
                                    R$ {product.originalPrice?.toFixed(2).replace('.', ',')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Toolbar */}
                          <div className="pt-2.5 border-t border-dark-700/80 flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              {/* Toggle Availability */}
                              <button
                                type="button"
                                onClick={() => handleToggleProductAvailability(product.id)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                  isAvailable
                                    ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                                }`}
                                title={isAvailable ? 'Clique para pausar (esgotado)' : 'Clique para ativar (disponível)'}
                              >
                                {isAvailable ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                <span>{isAvailable ? 'Disponível' : 'Pausado'}</span>
                              </button>

                              {/* Toggle Promo */}
                              <button
                                type="button"
                                onClick={() => handleToggleProductPromo(product.id)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                  hasPromo
                                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400/30'
                                    : 'bg-dark-900 text-slate-400 hover:text-amber-300 hover:bg-dark-750'
                                }`}
                                title="Ativar ou desativar selo promocional"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>{hasPromo ? 'Promoção' : '+ Promo'}</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              {/* Duplicate */}
                              <button
                                type="button"
                                onClick={() => handleDuplicateProduct(product)}
                                className="p-1.5 rounded-lg bg-dark-900 hover:bg-dark-750 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                title="Duplicar produto"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditProduct(product)}
                                className="px-2.5 py-1 rounded-lg bg-brand-gold/15 hover:bg-brand-gold/30 text-brand-gold border border-brand-gold/30 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                title="Editar produto completo"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Editar</span>
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-200 transition-colors cursor-pointer"
                                title="Excluir produto do cardápio"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {filteredAdminProducts.length === 0 && (
                    <div className="text-center py-12 bg-dark-800/40 rounded-2xl border border-dark-700">
                      <p className="text-sm text-slate-400">Nenhum produto encontrado para estes filtros.</p>
                      <button
                        type="button"
                        onClick={() => { setMenuSearch(''); setMenuCategoryFilter('todos'); }}
                        className="mt-3 px-3 py-1.5 rounded-xl bg-brand-gold text-dark-950 font-bold text-xs hover:bg-amber-400 cursor-pointer"
                      >
                        Limpar Filtros
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 2: PROMOÇÕES, BANNERS & CUPONS */}
              {menuSubTab === 'promos' && (
                <div className="mt-5 space-y-6">
                  {/* Banner de Destaque no Topo do Site */}
                  <form onSubmit={handleSavePromoSettings} className="p-5 rounded-2xl bg-dark-800/60 border border-dark-700 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-dark-700">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        <div>
                          <h3 className="text-sm font-bold text-white">Faixa / Banner Promocional no Topo do Site</h3>
                          <p className="text-xs text-slate-400">Aparece em destaque no topo da página de delivery para todos os clientes.</p>
                        </div>
                      </div>
                      
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempBannerActive}
                          onChange={(e) => setTempBannerActive(e.target.checked)}
                          className="w-4 h-4 accent-amber-400 cursor-pointer"
                        />
                        <span className={`text-xs font-bold ${tempBannerActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {tempBannerActive ? 'Ativo no Site' : 'Desativado'}
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Texto do Banner Promocional:
                      </label>
                      <input
                        type="text"
                        value={tempBannerText}
                        onChange={(e) => setTempBannerText(e.target.value)}
                        placeholder="Ex: 🔥 Borda de Catupiry GRÁTIS em todas as pizzas hoje + Entrega Rápida!"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    {/* Banner Preview */}
                    {tempBannerActive && tempBannerText && (
                      <div className="pt-2">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">Prévia de como os clientes verão:</span>
                        <div className="bg-gradient-to-r from-amber-600 via-brand-gold to-amber-500 text-dark-950 font-black text-xs py-2 px-4 rounded-xl text-center shadow-md flex items-center justify-center gap-2">
                          <Sparkles className="w-4 h-4 fill-dark-950 text-dark-950" />
                          <span>{tempBannerText}</span>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-dark-700">
                      <div className="flex items-center justify-between pb-3 border-b border-dark-700 mb-4">
                        <div className="flex items-center gap-2">
                          <Tag className="w-5 h-5 text-brand-gold" />
                          <div>
                            <h3 className="text-sm font-bold text-white">Cupom de Desconto</h3>
                            <p className="text-xs text-slate-400">Cupom ativo para clientes utilizarem no checkout.</p>
                          </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tempCouponActive}
                            onChange={(e) => setTempCouponActive(e.target.checked)}
                            className="w-4 h-4 accent-amber-400 cursor-pointer"
                          />
                          <span className={`text-xs font-bold ${tempCouponActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {tempCouponActive ? 'Cupom Ativo' : 'Desativado'}
                          </span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">Código do Cupom:</label>
                          <input
                            type="text"
                            value={tempCouponCode}
                            onChange={(e) => setTempCouponCode(e.target.value.toUpperCase())}
                            placeholder="Ex: ELSHADDAY10"
                            className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-700 text-xs font-mono font-bold text-brand-gold uppercase"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">Desconto (%):</label>
                          <input
                            type="number"
                            min="1"
                            max="90"
                            value={tempCouponDiscount}
                            onChange={(e) => setTempCouponDiscount(e.target.value)}
                            placeholder="Ex: 10"
                            className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">Pedido Mínimo (R$):</label>
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={tempCouponMinOrder}
                            onChange={(e) => setTempCouponMinOrder(e.target.value)}
                            placeholder="Ex: 50"
                            className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-3">
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black text-xs hover:brightness-110 shadow-glow-gold cursor-pointer"
                      >
                        Salvar Promoções & Cupons
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* SUBTAB 3: DADOS DO RESTAURANTE & WHATSAPP */}
              {menuSubTab === 'store' && (
                <form onSubmit={handleSaveStoreSettings} className="mt-5 p-5 rounded-2xl bg-dark-800/60 border border-dark-700 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-dark-700">
                    <Store className="w-5 h-5 text-brand-gold" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Dados da Loja & WhatsApp de Pedidos</h3>
                      <p className="text-xs text-slate-400">Configure o número para onde os pedidos caem e os dados de pagamento PIX.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da Loja:</label>
                      <input
                        type="text"
                        value={tempStoreName}
                        onChange={(e) => setTempStoreName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Telefone WhatsApp (Apenas Números com DDD):</label>
                      <input
                        type="text"
                        value={tempStorePhone}
                        onChange={(e) => setTempStorePhone(e.target.value)}
                        placeholder="Ex: 5569992228682"
                        className="w-full px-3.5 py-2 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Telefone Formatado para Exibição:</label>
                      <input
                        type="text"
                        value={tempStorePhoneFormatted}
                        onChange={(e) => setTempStorePhoneFormatted(e.target.value)}
                        placeholder="Ex: (69) 99222-8682"
                        className="w-full px-3.5 py-2 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Tempo Estimado de Entrega:</label>
                      <input
                        type="text"
                        value={tempStoreDeliveryTime}
                        onChange={(e) => setTempStoreDeliveryTime(e.target.value)}
                        placeholder="Ex: 45 - 75 min"
                        className="w-full px-3.5 py-2 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Chave PIX:</label>
                      <input
                        type="text"
                        value={tempStorePixKey}
                        onChange={(e) => setTempStorePixKey(e.target.value)}
                        placeholder="Ex: 69992228682"
                        className="w-full px-3.5 py-2 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Titular do PIX:</label>
                      <input
                        type="text"
                        value={tempStorePixName}
                        onChange={(e) => setTempStorePixName(e.target.value)}
                        placeholder="Ex: El Shadday Delivery"
                        className="w-full px-3.5 py-2 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Endereço da Loja:</label>
                      <input
                        type="text"
                        value={tempStoreAddress}
                        onChange={(e) => setTempStoreAddress(e.target.value)}
                        placeholder="Ex: Rua Maceió, 2333 - Setor 03, Ariquemes - RO"
                        className="w-full px-3.5 py-2 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Horário de Funcionamento:</label>
                      <input
                        type="text"
                        value={tempStoreOpeningHours}
                        onChange={(e) => setTempStoreOpeningHours(e.target.value)}
                        placeholder="Ex: Terça a Domingo: 09:00 às 23:00 (Segunda fechado)"
                        className="w-full px-3.5 py-2 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black text-xs hover:brightness-110 shadow-glow-gold cursor-pointer"
                    >
                      Salvar Dados da Loja
                    </button>
                  </div>
                </form>
              )}

            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 4: BUFFET PHOTO GALLERY MANAGEMENT                        */}
        {/* ============================================================== */}
        {activeAdminTab === 'gallery' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-dark-900 border border-dark-800 rounded-3xl p-5 sm:p-7 shadow-xl">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-dark-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/30">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-base sm:text-lg text-white">
                      Galeria de Fotos do Buffet ({galleryList.length} fotos)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Adicione e remova as fotos oficiais que passam no carrossel do Buffet El Shadday.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetGallery}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-xs font-semibold text-slate-300 hover:text-white border border-dark-700 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-brand-gold" />
                    <span>Restaurar Fotos Padrão</span>
                  </button>
                </div>
              </div>

              {galleryFeedback && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-fadeIn">
                  {galleryFeedback}
                </div>
              )}

              {/* Form to add new photo */}
              <form onSubmit={handleAddPhoto} className="p-5 rounded-2xl bg-dark-950 border border-brand-gold/30 mb-8 space-y-4">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-brand-gold flex items-center gap-2">
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Cadastrar Nova Foto na Galeria</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-[11px] uppercase font-bold text-slate-300 mb-1">
                      URL da Imagem *
                    </label>
                    <input
                      type="url"
                      placeholder="https://exemplo.com/foto.jpg"
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-slate-300 mb-1">
                      Título do Prato / Evento *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Picanha Angus na Brasa"
                      value={newPhotoTitle}
                      onChange={(e) => setNewPhotoTitle(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-slate-300 mb-1">
                      Categoria
                    </label>
                    <select
                      value={newPhotoCategory}
                      onChange={(e) => setNewPhotoCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:outline-none focus:border-brand-gold"
                    >
                      {GALLERY_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-slate-300 mb-1">
                      Subtítulo / Descrição Rápida
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Cortes nobres assados lentamente"
                      value={newPhotoSubtitle}
                      onChange={(e) => setNewPhotoSubtitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-slate-300 mb-1">
                      Etiqueta / Tag (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Churrasco Premium"
                      value={newPhotoTag}
                      onChange={(e) => setNewPhotoTag(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Salvar Foto</span>
                    </button>
                  </div>
                </div>

                {newPhotoUrl.trim() && (
                  <div className="pt-2 flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">Prévia da imagem:</span>
                    <img 
                      src={newPhotoUrl} 
                      alt="Prévia" 
                      className="w-12 h-12 object-cover rounded-lg border border-brand-gold/40"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                )}
              </form>

              {/* Photos List Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {galleryList.map((photo, idx) => {
                  const catObj = GALLERY_CATEGORIES.find(c => c.id === photo.category);
                  return (
                    <div 
                      key={photo.id || idx}
                      className="group relative rounded-2xl overflow-hidden bg-dark-950 border border-dark-800 hover:border-brand-gold/50 transition-all flex flex-col shadow-sm"
                    >
                      <div className="relative aspect-video w-full bg-black/40 overflow-hidden">
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-sm text-brand-gold border border-brand-gold/30">
                          {catObj ? catObj.label : photo.category}
                        </span>
                      </div>

                      <div className="p-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white line-clamp-1">{photo.title}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{photo.subtitle}</p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-dark-800 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-950/60 transition-colors cursor-pointer"
                            title="Remover foto da galeria"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

      </main>

      {/* ============================================================== */}
      {/* MODAL 1: WHATSAPP DIRECT MESSAGING MODAL                       */}
      {/* ============================================================== */}
      {whatsappModalData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="relative w-full max-w-lg bg-dark-900 border border-emerald-500/40 rounded-3xl shadow-2xl p-5 space-y-4">
            
            <div className="flex items-center justify-between border-b border-dark-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Enviar WhatsApp ao Cliente
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pedido #{whatsappModalData.order.orderId} • {whatsappModalData.order.customerName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setWhatsappModalData(null)}
                className="w-8 h-8 rounded-full bg-dark-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Phone input */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                WhatsApp do Cliente (com DDD):
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="(69) 99999-9999"
                  value={whatsappModalData.phone}
                  onChange={(e) => setWhatsappModalData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Quick Templates */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Mensagens Rápidas (1 Clique):
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => handleApplyWhatsAppTemplate('entrega')}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    whatsappModalData.activeTemplate === 'entrega'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-black'
                      : 'bg-dark-950 border-dark-800 text-slate-300 hover:border-dark-700'
                  }`}
                >
                  <Bike className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>🛵 Saiu p/ Entrega</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyWhatsAppTemplate('pronto')}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    whatsappModalData.activeTemplate === 'pronto'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black'
                      : 'bg-dark-950 border-dark-800 text-slate-300 hover:border-dark-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>🍕 Pronto p/ Retirada</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyWhatsAppTemplate('preparo')}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    whatsappModalData.activeTemplate === 'preparo'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                      : 'bg-dark-950 border-dark-800 text-slate-300 hover:border-dark-700'
                  }`}
                >
                  <Flame className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>👨‍🍳 No Forno / Preparo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyWhatsAppTemplate('cancelado')}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    whatsappModalData.activeTemplate === 'cancelado'
                      ? 'bg-red-500/20 border-red-500 text-red-300 font-black'
                      : 'bg-dark-950 border-dark-800 text-slate-300 hover:border-dark-700'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>❌ Pedido Cancelado</span>
                </button>
              </div>
            </div>

            {/* Message Text Area */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Texto da Mensagem (Editável):
              </label>
              <textarea
                rows={4}
                value={whatsappModalData.message}
                onChange={(e) => setWhatsappModalData(prev => ({ ...prev, message: e.target.value }))}
                className="w-full p-3 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs leading-relaxed focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWhatsappModalData(null)}
                className="flex-1 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendWhatsAppMessage}
                className="flex-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>Abrir WhatsApp do Cliente ↗</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: CANCEL / DELETE ORDER MODAL                           */}
      {/* ============================================================== */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-dark-900 border border-red-500/40 rounded-3xl shadow-2xl p-5 space-y-4">
            
            <div className="flex items-center justify-between border-b border-dark-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Cancelar ou Excluir Pedido
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pedido #{cancelModalOrder.orderId} • {cancelModalOrder.customerName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCancelModalOrder(null)}
                className="w-8 h-8 rounded-full bg-dark-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Escolha se deseja apenas marcar como <strong>Cancelado</strong> (mantendo no histórico) ou <strong>Excluir Definitivamente</strong> da lista.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Motivo do Cancelamento (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: Cliente desistiu, Teste do sistema, Endereço errado..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
              >
                <XCircle className="w-4 h-4" />
                <span>Marcar como Cancelado (Manter no Histórico)</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-full py-2.5 rounded-xl bg-dark-800 hover:bg-red-950/60 text-red-400 hover:text-red-300 border border-red-900/50 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                title="Remove permanentemente do sistema"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Definitivamente (Remover da Lista)</span>
              </button>

              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="w-full py-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-400 font-semibold text-xs cursor-pointer mt-1"
              >
                Voltar / Não fazer nada
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: PDV ORDER CREATED SUCCESS MODAL                       */}
      {/* ============================================================== */}
      {pdvSuccessOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-dark-900 border border-brand-gold/50 rounded-3xl shadow-2xl p-6 text-center space-y-4">
            
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-gold to-amber-400 text-dark-950 flex items-center justify-center mx-auto shadow-glow-gold">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">
                Pedido #{pdvSuccessOrder.orderId} Lançado!
              </h3>
              <p className="text-xs text-brand-gold font-medium mt-1">
                O pedido já está visível em tempo real na fila da cozinha.
              </p>
              <div className="text-sm font-bold text-slate-300 mt-2">
                Cliente: {pdvSuccessOrder.customerName} • R$ {(pdvSuccessOrder.total || 0).toFixed(2).replace('.', ',')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handlePrintOrder(pdvSuccessOrder)}
                className="py-2.5 px-3 rounded-xl bg-dark-800 hover:bg-dark-750 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-dark-700 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Comanda</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleOpenWhatsAppModal(pdvSuccessOrder, pdvSuccessOrder.deliveryType === 'balcao' ? 'pronto' : 'preparo');
                  setPdvSuccessOrder(null);
                }}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Avisar Cliente</span>
              </button>
            </div>

            <div className="pt-2 border-t border-dark-800 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPdvSuccessOrder(null)}
                className="flex-1 py-2.5 rounded-xl bg-brand-gold hover:bg-amber-400 text-dark-950 font-black text-xs cursor-pointer shadow-glow-gold"
              >
                + Criar Outro Pedido
              </button>
              <button
                type="button"
                onClick={() => {
                  setPdvSuccessOrder(null);
                  setActiveAdminTab('kds');
                }}
                className="flex-1 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Ver na Cozinha (KDS)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CRIAR OU EDITAR PRODUTO                                */}
      {/* ============================================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-dark-900 border border-dark-750 w-full max-w-2xl rounded-3xl p-5 sm:p-7 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-dark-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center border border-brand-gold/30">
                  {editingProduct ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5 stroke-[3]" />}
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base sm:text-lg text-white">
                    {editingProduct ? `Editar: ${editingProduct.name}` : 'Criar Novo Produto / Item'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingProduct ? 'Atualize as informações, fotos ou valores deste item' : 'Preencha os dados para cadastrar um novo item no cardápio'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 mt-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Nome do Produto */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodFormName}
                    onChange={(e) => setProdFormName(e.target.value)}
                    placeholder="Ex: Combo Família Especial + 10 Esfirras"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={prodFormCategory}
                    onChange={(e) => setProdFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white focus:outline-none focus:border-brand-gold cursor-pointer"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Preço de Venda */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodFormPrice}
                    onChange={(e) => setProdFormPrice(e.target.value)}
                    placeholder="Ex: 65,00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white font-mono font-bold focus:outline-none focus:border-brand-gold"
                  />
                </div>

                {/* Preço Original (Riscado) */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    Preço Original / De (R$) <span className="text-[10px] text-slate-400 font-normal">(Opcional para desconto)</span>
                  </label>
                  <input
                    type="text"
                    value={prodFormOriginalPrice}
                    onChange={(e) => setProdFormOriginalPrice(e.target.value)}
                    placeholder="Ex: 75,00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white font-mono focus:outline-none focus:border-brand-gold"
                  />
                </div>

                {/* Badge Promocional */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    Etiqueta / Badge <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={prodFormBadge}
                    onChange={(e) => setProdFormBadge(e.target.value)}
                    placeholder="Ex: Mais Vendido 🔥, Promoção, Especial"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                  />
                </div>

                {/* Descrição */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    Descrição dos Ingredientes / Tamanho
                  </label>
                  <textarea
                    rows="2"
                    value={prodFormDescription}
                    onChange={(e) => setProdFormDescription(e.target.value)}
                    placeholder="Ex: 1 Pizza Família de 8 fatias com até 2 sabores à sua escolha + 10 esfirras sortidas quentinhas."
                    className="w-full px-3.5 py-2 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                  />
                </div>

                {/* Detalhes / Rendimento */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    Detalhes de Rendimento <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={prodFormDetails}
                    onChange={(e) => setProdFormDetails(e.target.value)}
                    placeholder="Ex: Serve 3 a 4 pessoas com muito sabor."
                    className="w-full px-3.5 py-2 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                  />
                </div>

                {/* URL da Foto */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    URL da Foto do Produto
                  </label>
                  <input
                    type="url"
                    value={prodFormImage}
                    onChange={(e) => setProdFormImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                  />
                  {prodFormImage && (
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 font-bold">Prévia da imagem:</span>
                      <img
                        src={prodFormImage}
                        alt="Prévia"
                        className="w-14 h-14 object-cover rounded-xl border border-dark-700"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>

                {/* Switches */}
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-dark-800">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-dark-800/60 border border-dark-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodFormIsAvailable}
                      onChange={(e) => setProdFormIsAvailable(e.target.checked)}
                      className="w-4 h-4 accent-emerald-400 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">Disponível</div>
                      <div className="text-[10px] text-slate-400">Em estoque na loja</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-dark-800/60 border border-dark-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodFormIsPromo}
                      onChange={(e) => setProdFormIsPromo(e.target.checked)}
                      className="w-4 h-4 accent-amber-400 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-amber-300">Destaque Promoção</div>
                      <div className="text-[10px] text-slate-400">Exibir na prateleira</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-dark-800/60 border border-dark-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodFormBordaGratis}
                      onChange={(e) => setProdFormBordaGratis(e.target.checked)}
                      className="w-4 h-4 accent-amber-400 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">Borda Grátis</div>
                      <div className="text-[10px] text-slate-400">Selo de Catupiry</div>
                    </div>
                  </label>
                </div>

              </div>

              {/* Botões do Modal */}
              <div className="pt-4 border-t border-dark-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black text-xs hover:brightness-110 shadow-glow-gold cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
