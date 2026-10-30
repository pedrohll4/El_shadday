import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Flame, Clock, AlertTriangle, CheckCircle2, Search, 
  MapPin, User, DollarSign, Package, 
  Printer, ArrowLeft, ArrowRight, LogOut, RefreshCw, Send, Check,
  Bike, ChefHat, BellRing, Plus, Minus, Trash2, XCircle,
  MessageSquare, Phone, ShoppingBag, Store, Copy, ChevronRight,
  AlertCircle, X, ShieldAlert, Sparkles, CheckCheck,
  Camera, RotateCcw, Edit, Edit2, Eye, EyeOff, Tag, Percent,
  Utensils, ToggleLeft, ToggleRight, Save, Layers, CheckSquare,
  Pizza, ArrowUpRight, Info, CreditCard, Play, Film,
  Building2, Users, Crown, Sliders, BarChart3, Star, QrCode,
  Settings2, Smartphone
} from 'lucide-react';
import { 
  RESTAURANT_INFO, 
  ARIQUEMES_DISTRICTS, 
  CATEGORIES, 
  PRODUCTS,
  INITIAL_PIZZA_FLAVORS,
  getStoredProducts,
  saveStoredProducts,
  getStoredPromoSettings,
  saveStoredPromoSettings,
  getStoredRestaurantInfo,
  saveStoredRestaurantInfo,
  getStoredPizzaFlavors,
  saveStoredPizzaFlavors,
  calculatePizzaPrice,
  calculateCardMachineFee,
  getCardMachineNoticeText,
  normalizeProductsList,
  normalizePizzaFlavors
} from '../data/menuData';
import { PizzaCustomizerModal } from './PizzaCustomizerModal';
import { 
  GALLERY_CATEGORIES, 
  INITIAL_BUFFET_GALLERY, 
  getStoredBuffetGallery, 
  saveStoredBuffetGallery,
  isFakeGalleryItem,
  getStoredBuffetCategories,
  saveStoredBuffetCategories,
  getUnavailableBuffetItemIds,
  saveUnavailableBuffetItemIds
} from '../buffet/buffetData';
import { 
  supabase, 
  isSupabaseConfigured,
  saveCustomSupabaseConfig,
  clearCustomSupabaseConfig 
} from '../services/supabaseClient';
import { dispatchConfigSync } from '../services/configSyncService';
import { ImageUploader } from './ImageUploader';
import { isVideoUrl, getVideoPosterUrl } from '../utils/imageCompressor';
import { ROLES, ROLE_LABELS, getCurrentUser } from '../services/authService';
import { getStoredBranches } from '../data/branchesData';
import { MasterFinancialView } from './admin/MasterFinancialView';
import { BranchManagementView } from './admin/BranchManagementView';
import { UserManagementView } from './admin/UserManagementView';
import WhatsAppManagerView from './admin/WhatsAppManagerView';
import { 
  sendCustomerWhatsAppNotification, 
  buildStatusMessage, 
  getWhatsAppSettings, 
  saveWhatsAppSettings,
  cleanPhoneNumber,
  openWhatsAppInstantLink
} from '../services/whatsappNotificationService';
import { isCloudBaileysActive, fetchEngineStatus } from '../services/whatsappBranchService';
import { normalizeOrderStatus } from '../services/ordersSyncService';
import { 
  searchCustomers, 
  recordCustomerFromOrder, 
  backfillCustomersFromOrders, 
  getAllCustomers 
} from '../services/customerService';

export function AdminDashboard({ 
  orders = [], 
  onUpdateOrderStatus, 
  onUpdatePaymentStatus, 
  onCancelOrder,
  onDeleteOrder,
  onClearAllOrders,
  onCreateKitchenOrder,
  onLogout, 
  onBackToSite,
  onSwitchToBuffet,
  currentUser: propUser,
  branches: propBranches,
  currentBranchId,
  onSelectBranch
}) {
  const [currentUser, setCurrentUser] = useState(() => propUser || getCurrentUser());
  const [branchesList, setBranchesList] = useState(() => propBranches || getStoredBranches());
  const [masterBranchFilter, setMasterBranchFilter] = useState('all');

  // Keep currentUser synced if prop changes
  useEffect(() => {
    if (propUser) setCurrentUser(propUser);
  }, [propUser]);

  // Keep branches synced if prop changes
  useEffect(() => {
    if (propBranches) setBranchesList(propBranches);
  }, [propBranches]);

  // Listen to branch updates
  useEffect(() => {
    const handleBranchesUpdate = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setBranchesList(e.detail);
      } else {
        setBranchesList(getStoredBranches());
      }
    };
    window.addEventListener('el_shadday_branches_updated', handleBranchesUpdate);
    return () => window.removeEventListener('el_shadday_branches_updated', handleBranchesUpdate);
  }, []);

  // Determine current active branch object safely
  const currentBranch = useMemo(() => {
    const list = branchesList || [];
    const targetId = (currentUser?.role === ROLES.SUPER_ADMIN && masterBranchFilter !== 'all')
      ? masterBranchFilter
      : (currentUser?.branchId === 'all' ? (currentBranchId || 'ariquemes') : (currentUser?.branchId || currentBranchId || 'ariquemes'));
    return list.find(b => b.id === targetId) || list[0] || {
      id: 'ariquemes',
      name: 'Unidade Ariquemes',
      displayName: 'Ariquemes - RO'
    };
  }, [branchesList, currentUser, masterBranchFilter, currentBranchId]);

  // Filter orders according to user's role and selected branch safely
  const scopedOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    if (currentUser?.role === ROLES.SUPER_ADMIN) {
      if (masterBranchFilter === 'all') return orders.filter(Boolean);
      return orders.filter(o => o && (o.branchId || 'ariquemes') === masterBranchFilter);
    }
    const branchId = currentUser?.branchId || currentBranchId || 'ariquemes';
    return orders.filter(o => o && (o.branchId || 'ariquemes') === branchId);
  }, [orders, currentUser, masterBranchFilter, currentBranchId]);

  // Navigation tab based on role
  const [activeAdminTab, setActiveAdminTab] = useState(() => {
    const user = propUser || getCurrentUser();
    if (user?.role === ROLES.SUPER_ADMIN) return 'master-overview';
    if (user?.role === ROLES.BRANCH_ADMIN) return 'menu';
    return 'kds';
  });

  // Automatically sync tab when user role changes (Prevents black screen or empty views)
  useEffect(() => {
    if (currentUser?.role === ROLES.KITCHEN) {
      if (activeAdminTab !== 'kds') {
        setActiveAdminTab('kds');
      }
    } else if (currentUser?.role === ROLES.BRANCH_ADMIN) {
      const disallowed = ['master-overview', 'branches', 'users'];
      if ((currentUser?.branchId || currentBranch?.id) !== 'ariquemes') {
        disallowed.push('gallery');
      }
      if (disallowed.includes(activeAdminTab)) {
        setActiveAdminTab('menu');
      }
    } else if (currentUser?.role === ROLES.SUPER_ADMIN) {
      if (activeAdminTab === 'branch-overview') {
        setActiveAdminTab('master-overview');
      }
    }
  }, [currentUser, activeAdminTab, currentBranch]);

  // KDS Filters
  const [selectedFilter, setSelectedFilter] = useState('todos'); // 'todos' | 'atrasados' | 'pendentes' | 'preparo' | 'entrega' | 'concluidos' | 'nao_pagos' | 'cancelados'
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(Date.now());
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  // Auto Follow Tab on Status Change & Highlight State
  const [autoFollowTab, setAutoFollowTab] = useState(() => {
    try {
      const saved = localStorage.getItem('el_shadday_kds_auto_follow_tab');
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);
  const [statusChangeToast, setStatusChangeToast] = useState(null); // { orderId, newStatus, tabLabel }
  const highlightTimeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const toggleAutoFollowTab = () => {
    setAutoFollowTab(prev => {
      const next = !prev;
      try {
        localStorage.setItem('el_shadday_kds_auto_follow_tab', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Audio chimes
  const audioCtxRef = useRef(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const knownOrderIdsRef = useRef(new Set((orders || []).map(o => o?.orderId).filter(Boolean)));
  const isInitialOrdersLoadedRef = useRef((orders || []).length > 0);

  // WhatsApp Settings & Notification States
  const [whatsAppSettings, setWhatsAppSettings] = useState(() => getWhatsAppSettings());
  const [lastSentWhatsAppNotice, setLastSentWhatsAppNotice] = useState(null); // { orderId, customerName, statusType, phone, whatsappUrl }
  const [whatsappModalData, setWhatsappModalData] = useState(null); // { order, phone, message, activeTemplate }

  // Listen to global WhatsApp sent events for visual toast feedback
  useEffect(() => {
    const handleWhatsAppNotification = (e) => {
      if (e?.detail) {
        setLastSentWhatsAppNotice(e.detail);
        const timer = setTimeout(() => setLastSentWhatsAppNotice(null), 8000);
        return () => clearTimeout(timer);
      }
    };
    window.addEventListener('el_shadday_whatsapp_notification_triggered', handleWhatsAppNotification);
    return () => window.removeEventListener('el_shadday_whatsapp_notification_triggered', handleWhatsAppNotification);
  }, []);

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

  // Customer Profile Autocomplete State (PDV)
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [isCustomerSuggestionsOpen, setIsCustomerSuggestionsOpen] = useState(false);
  const [activeAutoCompletedCustomer, setActiveAutoCompletedCustomer] = useState(null);
  const [isCustomerDirectoryOpen, setIsCustomerDirectoryOpen] = useState(false);
  const [customerDirectorySearch, setCustomerDirectorySearch] = useState('');

  // Buffet Gallery Management States
  const [galleryList, setGalleryList] = useState(() => getStoredBuffetGallery());
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoMeta, setNewPhotoMeta] = useState(null);
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoSubtitle, setNewPhotoSubtitle] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState('churrasco');
  const [newPhotoTag, setNewPhotoTag] = useState('');
  const [galleryFeedback, setGalleryFeedback] = useState('');

  // Sincronizar galeria com Supabase se configurado & escutar atualizações
  useEffect(() => {
    const handleGallerySync = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setGalleryList(e.detail);
      } else {
        const stored = getStoredBuffetGallery();
        setGalleryList(stored);
      }
    };

    window.addEventListener('storage', handleGallerySync);
    window.addEventListener('buffet_gallery_updated', handleGallerySync);

    if (isSupabaseConfigured && supabase) {
      const loadFromCompanySettings = () => {
        return supabase
          .from('company_settings')
          .select('buffet_gallery')
          .eq('id', 'el_shadday_config')
          .single()
          .then(({ data: csData }) => {
            if (Array.isArray(csData?.buffet_gallery)) {
              const cleanCs = csData.buffet_gallery.filter(p => !isFakeGalleryItem(p));
              console.log('[AdminDashboard] Galeria carregada de company_settings:', cleanCs.length, 'itens');
              setGalleryList(cleanCs);
              saveStoredBuffetGallery(cleanCs);
            }
          });
      };

      // Carrega inicial: tenta primeiro buffet_gallery, depois company_settings
      supabase
        .from('buffet_gallery')
        .select('*')
        .order('position', { ascending: true })
        .then(({ data, error }) => {
          if (!error && Array.isArray(data) && data.length > 0) {
            const clean = data.filter(p => !isFakeGalleryItem(p));
            console.log('[AdminDashboard] Galeria carregada de buffet_gallery:', clean.length, 'itens');
            setGalleryList(clean);
            saveStoredBuffetGallery(clean);
          } else {
            loadFromCompanySettings();
          }
        });

      // Realtime: sincroniza alterações em buffet_gallery
      const channelBuffetGallery = supabase
        .channel('realtime_buffet_gallery_admin')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'buffet_gallery' }, () => {
          supabase
            .from('buffet_gallery')
            .select('*')
            .order('position', { ascending: true })
            .then(({ data }) => {
              if (Array.isArray(data)) {
                const clean = data.filter(p => !isFakeGalleryItem(p));
                setGalleryList(clean);
                saveStoredBuffetGallery(clean);
              }
            });
        })
        .subscribe();

      // Realtime company_settings: sincroniza novas fotos enviadas
      const channelCsGallery = supabase
        .channel('realtime_cs_gallery_admin')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'company_settings' }, () => {
          loadFromCompanySettings();
        })
        .subscribe();

      return () => {
        window.removeEventListener('storage', handleGallerySync);
        window.removeEventListener('buffet_gallery_updated', handleGallerySync);
        if (supabase) {
          if (channelBuffetGallery) supabase.removeChannel(channelBuffetGallery);
          if (channelCsGallery) supabase.removeChannel(channelCsGallery);
        }
      };
    }

    return () => {
      window.removeEventListener('storage', handleGallerySync);
      window.removeEventListener('buffet_gallery_updated', handleGallerySync);
    };
  }, []);

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) {
      alert('Por favor, envie uma foto/vídeo ou informe um link antes de salvar.');
      return;
    }
    const isVid = Boolean(newPhotoMeta?.isVideo || isVideoUrl(newPhotoUrl.trim()));
    const poster = newPhotoMeta?.thumbnail || (isVid ? getVideoPosterUrl(newPhotoUrl.trim()) : null);

    const newPhoto = {
      id: 'media_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      url: newPhotoUrl.trim(),
      title: newPhotoTitle.trim() || (isVid ? 'Vídeo Buffet El Shadday' : 'Buffet El Shadday'),
      subtitle: newPhotoSubtitle.trim() || (isVid ? 'Vídeo oficial do Buffet El Shadday' : 'Foto oficial do Buffet El Shadday'),
      category: newPhotoCategory || 'churrasco',
      tag: newPhotoTag.trim() || 'Buffet El Shadday',
      type: isVid ? 'video' : 'image',
      thumbnail: poster || (isVid ? '' : newPhotoUrl.trim())
    };
    const updated = [newPhoto, ...galleryList];
    setGalleryList(updated);
    saveStoredBuffetGallery(updated);
    dispatchConfigSync('GALLERY_UPDATE', updated);

    if (isSupabaseConfigured && supabase) {
      try {
        // PRIMÁRIO: salva TODA a galeria em company_settings.buffet_gallery (tabela garantida)
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          buffet_gallery: updated,
          updated_at: new Date().toISOString()
        });
        console.log('[AdminDashboard] ✅ Galeria salva em company_settings');

        // SECUNDÁRIO: tenta salvar também na tabela buffet_gallery (pode não existir)
        try {
          await supabase.from('buffet_gallery').upsert({
            id: newPhoto.id,
            url: newPhoto.url,
            title: newPhoto.title,
            subtitle: newPhoto.subtitle,
            category: newPhoto.category,
            tag: newPhoto.tag,
            type: newPhoto.type || 'image',
            thumbnail: newPhoto.thumbnail || newPhoto.url,
            position: 0
          });
        } catch (bgErr) {
          console.warn('[AdminDashboard] buffet_gallery table não disponível (OK):', bgErr.message);
        }
      } catch (err) {
        console.warn('Erro na inserção do Supabase:', err);
      }
    }

    setNewPhotoUrl('');
    setNewPhotoMeta(null);
    setNewPhotoTitle('');
    setNewPhotoSubtitle('');
    setNewPhotoTag('');
    setGalleryFeedback(isVid ? 'Vídeo adicionado e salvo na nuvem com sucesso! 🎬' : 'Foto adicionada e salva na nuvem com sucesso! 📸');
    setTimeout(() => setGalleryFeedback(''), 3500);
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Tem certeza que deseja remover este item?')) return;
    const updated = galleryList.filter(p => p.id !== photoId);
    setGalleryList(updated);
    saveStoredBuffetGallery(updated);
    dispatchConfigSync('GALLERY_UPDATE', updated);

    if (isSupabaseConfigured && supabase) {
      try {
        // Atualiza company_settings com galeria sem o item deletado
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          buffet_gallery: updated,
          updated_at: new Date().toISOString()
        });
        try { await supabase.from('buffet_gallery').delete().eq('id', photoId); } catch (e) {}
      } catch (err) {}
    }
    setGalleryFeedback('Item removido com sucesso!');
    setTimeout(() => setGalleryFeedback(''), 3500);
  };

  const handleClearAllPhotos = async () => {
    if (!window.confirm('Tem certeza que deseja apagar TODAS as fotos e vídeos da galeria? O carrossel ficará livre para você colocar apenas as suas fotos reais do Buffet.')) return;
    setGalleryList([]);
    saveStoredBuffetGallery([]);
    dispatchConfigSync('GALLERY_UPDATE', []);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          buffet_gallery: [],
          updated_at: new Date().toISOString()
        });
        try { await supabase.from('buffet_gallery').delete().neq('id', '___none___'); } catch (e) {}
      } catch (err) {}
    }
    setTimeout(() => setGalleryFeedback(''), 3500);
  };

  const handleResetGallery = async () => {
    if (!window.confirm('Deseja limpar todas as fotos da galeria?')) return;
    setGalleryList([]);
    saveStoredBuffetGallery([]);
    dispatchConfigSync('GALLERY_UPDATE', []);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          buffet_gallery: [],
          updated_at: new Date().toISOString()
        });
        try { await supabase.from('buffet_gallery').delete().neq('id', '___none___'); } catch (e) {}
      } catch (err) {}
    }
    setGalleryFeedback('Galeria limpa com sucesso!');
    setTimeout(() => setGalleryFeedback(''), 3500);
  };

  const handleForceSyncGalleryToDatabase = async () => {
    const current = galleryList.length > 0 ? galleryList : getStoredBuffetGallery();
    const clean = current.filter(p => !isFakeGalleryItem(p));
    if (clean.length === 0) {
      alert('Não há fotos ou vídeos na galeria para sincronizar.');
      return;
    }

    setGalleryFeedback(`Enviando ${clean.length} item(ns) para o banco de dados Supabase e nuvem...`);
    
    // 1. Salva localmente
    saveStoredBuffetGallery(clean);
    setGalleryList(clean);

    // 2. Salva em Supabase se configurado
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          buffet_gallery: clean,
          updated_at: new Date().toISOString()
        });

        for (let i = 0; i < clean.length; i++) {
          const item = clean[i];
          await supabase.from('buffet_gallery').upsert({
            id: item.id || `media_${Date.now()}_${i}`,
            url: item.url,
            title: item.title || 'Buffet El Shadday',
            subtitle: item.subtitle || '',
            category: item.category || 'churrasco',
            tag: item.tag || 'Buffet',
            type: item.type || 'image',
            thumbnail: item.thumbnail || item.url,
            position: i
          });
        }
      } catch (err) {
        console.warn('Erro ao salvar no Supabase:', err);
      }
    }

    // 3. Notifica nuvem global e outros dispositivos
    dispatchConfigSync('GALLERY_UPDATE', clean);

    setGalleryFeedback(`✅ ${clean.length} foto(s)/vídeo(s) sincronizados com sucesso no banco de dados e nuvem!`);
    setTimeout(() => setGalleryFeedback(''), 4500);
  };

  // ==============================================================
  // MENU, PRODUCTS & PROMOTIONS MANAGEMENT
  // ==============================================================
  const [productsList, setProductsList] = useState(() => getStoredProducts());
  const [promoSettings, setPromoSettings] = useState(() => getStoredPromoSettings());
  const [restaurantSettings, setRestaurantSettings] = useState(() => getStoredRestaurantInfo());

  // Sub-navigation in Menu Tab: 'products' | 'flavors'
  const [menuSubTab, setMenuSubTab] = useState('products');
  // Sub-navigation in Settings Tab: 'card-fee' | 'store' | 'promos'
  const [settingsSubTab, setSettingsSubTab] = useState('card-fee');

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
  const [prodFormIsHighlight, setProdFormIsHighlight] = useState(false);
  const [prodFormBordaGratis, setProdFormBordaGratis] = useState(false);
  const [prodFormMaxSabores, setProdFormMaxSabores] = useState('2');
  const [prodFormTamanho, setProdFormTamanho] = useState('Família (8 fatias)');

  // Pizza Flavors Management State
  const [pizzaFlavors, setPizzaFlavors] = useState(() => getStoredPizzaFlavors());
  const [flavorSearch, setFlavorSearch] = useState('');
  const [flavorCategoryFilter, setFlavorCategoryFilter] = useState('todos');
  const [isFlavorModalOpen, setIsFlavorModalOpen] = useState(false);
  const [editingFlavor, setEditingFlavor] = useState(null);
  const [flavorFormName, setFlavorFormName] = useState('');
  const [flavorFormPrice, setFlavorFormPrice] = useState('40.00');
  const [flavorFormCategory, setFlavorFormCategory] = useState('salgadas');
  const [flavorFormDescription, setFlavorFormDescription] = useState('');
  const [flavorFormIsAvailable, setFlavorFormIsAvailable] = useState(true);

  // PDV Custom Pizza Modal
  const [pdvPizzaToCustomize, setPdvPizzaToCustomize] = useState(null);

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
  const [tempStoreCardMachineNotice, setTempStoreCardMachineNotice] = useState(
    restaurantSettings.cardMachineNotice !== undefined 
      ? restaurantSettings.cardMachineNotice 
      : '⚠️ Pagamentos no cartão (débito ou crédito) possuem taxa da maquininha cobrada pela operadora. Consulte as condições na entrega.'
  );
  const [tempStoreCardMachineNoticeActive, setTempStoreCardMachineNoticeActive] = useState(
    restaurantSettings.cardMachineNoticeActive !== false
  );

  // Card Machine Settings Form Fields
  const currentCardSettings = restaurantSettings.cardMachineSettings || RESTAURANT_INFO.cardMachineSettings || {};
  const [tempCardActive, setTempCardActive] = useState(currentCardSettings.active !== false);
  const [tempCardType, setTempCardType] = useState(currentCardSettings.type || 'percentage');
  const [tempCardPercentage, setTempCardPercentage] = useState(currentCardSettings.percentageRate !== undefined ? currentCardSettings.percentageRate.toString() : '3.5');
  const [tempCardFixed, setTempCardFixed] = useState(currentCardSettings.fixedRate !== undefined ? currentCardSettings.fixedRate.toString() : '2.00');
  const [tempCardDebit, setTempCardDebit] = useState(currentCardSettings.debitRate !== undefined ? currentCardSettings.debitRate.toString() : '2.0');
  const [tempCardCredit, setTempCardCredit] = useState(currentCardSettings.creditRate !== undefined ? currentCardSettings.creditRate.toString() : '4.5');
  const [tempCardAutoAdd, setTempCardAutoAdd] = useState(currentCardSettings.autoAddToTotal !== false);
  const [tempCardCustomNotice, setTempCardCustomNotice] = useState(currentCardSettings.customNotice || '');

  // Supabase Custom Config State
  const [customSupabaseUrl, setCustomSupabaseUrl] = useState(() => {
    try { return localStorage.getItem('el_shadday_supabase_url') || ''; } catch (e) { return ''; }
  });
  const [customSupabaseKey, setCustomSupabaseKey] = useState(() => {
    try { return localStorage.getItem('el_shadday_supabase_anon_key') || ''; } catch (e) { return ''; }
  });

  // Menu Feedback Toast
  const [menuFeedback, setMenuFeedback] = useState('');

  const triggerMenuToast = (msg) => {
    setMenuFeedback(msg);
    setTimeout(() => setMenuFeedback(''), 3500);
  };

  // Sync menu & promos & pizza flavors across tabs/windows
  useEffect(() => {
    const handleProductsSync = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
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
      const data = e?.detail || getStoredRestaurantInfo();
      setRestaurantSettings(data);
      if (data) {
        if (data.name !== undefined) setTempStoreName(data.name);
        if (data.phone !== undefined) setTempStorePhone(data.phone);
        if (data.phoneFormatted !== undefined) setTempStorePhoneFormatted(data.phoneFormatted);
        if (data.address !== undefined) setTempStoreAddress(data.address);
        if (data.deliveryTime !== undefined) setTempStoreDeliveryTime(data.deliveryTime);
        if (data.pixKey !== undefined) setTempStorePixKey(data.pixKey);
        if (data.pixName !== undefined) setTempStorePixName(data.pixName);
        if (data.openingHours !== undefined) setTempStoreOpeningHours(data.openingHours);
        if (data.cardMachineNotice !== undefined) setTempStoreCardMachineNotice(data.cardMachineNotice);
        if (data.cardMachineNoticeActive !== undefined) setTempStoreCardMachineNoticeActive(data.cardMachineNoticeActive);
        if (data.cardMachineSettings) {
          const cs = data.cardMachineSettings;
          if (cs.active !== undefined) setTempCardActive(cs.active);
          if (cs.type !== undefined) setTempCardType(cs.type);
          if (cs.percentageRate !== undefined) setTempCardPercentage(cs.percentageRate.toString());
          if (cs.fixedRate !== undefined) setTempCardFixed(cs.fixedRate.toString());
          if (cs.debitRate !== undefined) setTempCardDebit(cs.debitRate.toString());
          if (cs.creditRate !== undefined) setTempCardCredit(cs.creditRate.toString());
          if (cs.autoAddToTotal !== undefined) setTempCardAutoAdd(cs.autoAddToTotal);
          if (cs.customNotice !== undefined) setTempCardCustomNotice(cs.customNotice);
        }
      }
    };
    const handleFlavorsSync = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setPizzaFlavors(e.detail);
      } else {
        setPizzaFlavors(getStoredPizzaFlavors());
      }
    };

    window.addEventListener('delivery_products_updated', handleProductsSync);
    window.addEventListener('delivery_promos_updated', handlePromosSync);
    window.addEventListener('delivery_restaurant_info_updated', handleStoreSync);
    window.addEventListener('pizza_flavors_updated', handleFlavorsSync);
    window.addEventListener('storage', handleProductsSync);

    let channelCompanySettingsAdmin = null;

    // Hydrate products & promo settings & pizza flavors & store info from Supabase if configured
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('company_settings')
        .select('*')
        .eq('id', 'el_shadday_config')
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            if (Array.isArray(data.menu_products)) {
              const normProds = normalizeProductsList(data.menu_products);
              setProductsList(normProds);
              saveStoredProducts(normProds);
            }
            if (data.promo_settings && typeof data.promo_settings === 'object' && Object.keys(data.promo_settings).length > 0) {
              setPromoSettings(data.promo_settings);
              saveStoredPromoSettings(data.promo_settings);
            }
            if (Array.isArray(data.pizza_flavors)) {
              const normFlavors = normalizePizzaFlavors(data.pizza_flavors);
              setPizzaFlavors(normFlavors);
              saveStoredPizzaFlavors(normFlavors);
            }
            if (data.card_machine_notice !== undefined || data.name || data.card_machine_settings) {
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
              setRestaurantSettings(updatedStore);
              saveStoredRestaurantInfo(updatedStore);
              if (updatedStore.cardMachineNotice !== undefined) setTempStoreCardMachineNotice(updatedStore.cardMachineNotice);
              if (updatedStore.cardMachineNoticeActive !== undefined) setTempStoreCardMachineNoticeActive(updatedStore.cardMachineNoticeActive);
              if (updatedStore.cardMachineSettings) {
                const cs = updatedStore.cardMachineSettings;
                if (cs.active !== undefined) setTempCardActive(cs.active);
                if (cs.type !== undefined) setTempCardType(cs.type);
                if (cs.percentageRate !== undefined) setTempCardPercentage(cs.percentageRate.toString());
                if (cs.fixedRate !== undefined) setTempCardFixed(cs.fixedRate.toString());
                if (cs.debitRate !== undefined) setTempCardDebit(cs.debitRate.toString());
                if (cs.creditRate !== undefined) setTempCardCredit(cs.creditRate.toString());
                if (cs.autoAddToTotal !== undefined) setTempCardAutoAdd(cs.autoAddToTotal);
                if (cs.customNotice !== undefined) setTempCardCustomNotice(cs.customNotice);
              }
            }
          }
        });

      channelCompanySettingsAdmin = supabase
        .channel('realtime_cs_menu_admin')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'company_settings' }, (payload) => {
          const fresh = payload.new;
          if (fresh) {
            if (Array.isArray(fresh.menu_products)) {
              const normProds = normalizeProductsList(fresh.menu_products);
              setProductsList(normProds);
              saveStoredProducts(normProds);
            }
            if (Array.isArray(fresh.pizza_flavors)) {
              const normFlavors = normalizePizzaFlavors(fresh.pizza_flavors);
              setPizzaFlavors(normFlavors);
              saveStoredPizzaFlavors(normFlavors);
            }
            if (fresh.promo_settings) {
              setPromoSettings(fresh.promo_settings);
              saveStoredPromoSettings(fresh.promo_settings);
            }
          }
        })
        .subscribe();
    }

    return () => {
      window.removeEventListener('delivery_products_updated', handleProductsSync);
      window.removeEventListener('delivery_promos_updated', handlePromosSync);
      window.removeEventListener('delivery_restaurant_info_updated', handleStoreSync);
      window.removeEventListener('pizza_flavors_updated', handleFlavorsSync);
      window.removeEventListener('storage', handleProductsSync);
      if (channelCompanySettingsAdmin && supabase) {
        supabase.removeChannel(channelCompanySettingsAdmin);
      }
    };
  }, []);

  const syncProductsToCloud = async (prods) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          menu_products: prods,
          updated_at: new Date().toISOString()
        });
      } catch (err) {}
    }
  };

  const syncPromosToCloud = async (promos) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          promo_settings: promos,
          updated_at: new Date().toISOString()
        });
      } catch (err) {}
    }
  };

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
    setProdFormIsHighlight(false);
    setProdFormBordaGratis(false);
    setProdFormMaxSabores('2');
    setProdFormTamanho('Família (8 fatias)');
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
    setProdFormIsHighlight(!!prod.isHighlight);
    setProdFormBordaGratis(!!prod.bordaGratis);
    setProdFormMaxSabores(prod.maxSabores !== undefined ? prod.maxSabores.toString() : '2');
    setProdFormTamanho(prod.tamanho || (prod.categoryId === 'pizzas' ? 'Família (8 fatias)' : ''));
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
      isHighlight: !!prodFormIsHighlight,
      bordaGratis: prodFormBordaGratis,
      isBox: editingProduct ? editingProduct.isBox : (prodFormCategory === 'caixas'),
      isPizzaCustomizer: editingProduct ? (editingProduct.isPizzaCustomizer ?? (prodFormCategory === 'pizzas')) : (prodFormCategory === 'pizzas'),
      maxSabores: prodFormCategory === 'pizzas' ? (parseInt(prodFormMaxSabores) || 2) : editingProduct?.maxSabores,
      tamanho: prodFormCategory === 'pizzas' ? (prodFormTamanho.trim() || 'Família (8 fatias)') : editingProduct?.tamanho,
      branchId: editingProduct?.branchId || (currentUser?.role === ROLES.SUPER_ADMIN && masterBranchFilter !== 'all' ? masterBranchFilter : (currentUser?.branchId || currentBranch?.id || 'ariquemes'))
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
    syncProductsToCloud(updated);
    dispatchConfigSync('PRODUCTS_UPDATE', updated);
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
    syncProductsToCloud(updated);
    dispatchConfigSync('PRODUCTS_UPDATE', updated);
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
    syncProductsToCloud(updated);
    dispatchConfigSync('PRODUCTS_UPDATE', updated);
  };

  const handleToggleProductHighlight = (prodId) => {
    const updated = productsList.map(p => {
      if (p.id === prodId) {
        const nextState = !p.isHighlight;
        triggerMenuToast(nextState ? `"${p.name}" agora está nos Destaques da Casa ⭐!` : `Destaque removido de "${p.name}".`);
        return {
          ...p,
          isHighlight: nextState
        };
      }
      return p;
    });
    setProductsList(updated);
    saveStoredProducts(updated);
    syncProductsToCloud(updated);
    dispatchConfigSync('PRODUCTS_UPDATE', updated);
  };

  const handleToggleProductBordaGratis = (prodId) => {
    const updated = productsList.map(p => {
      if (p.id === prodId) {
        const nextState = !p.bordaGratis;
        triggerMenuToast(nextState ? `Borda Grátis ATIVADA em "${p.name}"! 🧀` : `Borda Grátis DESATIVADA de "${p.name}".`);
        return {
          ...p,
          bordaGratis: nextState
        };
      }
      return p;
    });
    setProductsList(updated);
    saveStoredProducts(updated);
    syncProductsToCloud(updated);
    dispatchConfigSync('PRODUCTS_UPDATE', updated);
  };

  const handleSetAllPizzasBordaGratis = (enabled) => {
    const updated = productsList.map(p => {
      if (p.categoryId === 'pizzas' || p.isPizzaCustomizer) {
        return {
          ...p,
          bordaGratis: enabled
        };
      }
      return p;
    });
    setProductsList(updated);
    saveStoredProducts(updated);
    syncProductsToCloud(updated);
    dispatchConfigSync('PRODUCTS_UPDATE', updated);
    triggerMenuToast(enabled ? '🧀 Borda de Catupiry Grátis ATIVADA em todas as pizzas!' : '🧀 Borda Grátis DESATIVADA de todas as pizzas.');
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
    syncProductsToCloud(updated);
    dispatchConfigSync('PRODUCTS_UPDATE', updated);
    triggerMenuToast(`Cópia de "${prod.name}" criada com sucesso!`);
  };

  const handleDeleteProduct = (prodId, prodName) => {
    if (!window.confirm(`Tem certeza que deseja remover o produto "${prodName}" do cardápio?`)) return;
    const updated = productsList.filter(p => p.id !== prodId);
    setProductsList(updated);
    saveStoredProducts(updated);
    syncProductsToCloud(updated);
    dispatchConfigSync('PRODUCTS_UPDATE', updated);
    triggerMenuToast(`Produto removido do cardápio!`);
  };

  const handleResetMenuToDefault = () => {
    if (!window.confirm('Deseja restaurar todos os produtos e preços para o padrão original da loja?')) return;
    setProductsList(PRODUCTS);
    saveStoredProducts(PRODUCTS);
    syncProductsToCloud(PRODUCTS);
    dispatchConfigSync('PRODUCTS_UPDATE', PRODUCTS);
    triggerMenuToast('Cardápio restaurado para o padrão original!');
  };

  const handleClearAllProducts = () => {
    if (!window.confirm('Tem certeza que deseja apagar TODOS os produtos do cardápio? Você poderá cadastrar somente os seus produtos e preços exclusivos.')) return;
    setProductsList([]);
    saveStoredProducts([]);
    syncProductsToCloud([]);
    dispatchConfigSync('PRODUCTS_UPDATE', []);
    triggerMenuToast('Todos os produtos foram removidos!');
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
    syncPromosToCloud(newSettings);
    dispatchConfigSync('PROMOS_UPDATE', newSettings);
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
      openingHours: tempStoreOpeningHours.trim(),
      cardMachineNotice: tempStoreCardMachineNotice.trim(),
      cardMachineNoticeActive: tempStoreCardMachineNoticeActive
    };
    setRestaurantSettings(newStore);
    saveStoredRestaurantInfo(newStore);
    dispatchConfigSync('STORE_UPDATE', newStore);
    triggerMenuToast('Dados do restaurante e taxa da maquininha atualizados com sucesso!');
  };

  const handleSaveCardMachineSettings = (e) => {
    if (e) e.preventDefault();
    const pctNum = parseFloat(tempCardPercentage.toString().replace(',', '.')) || 0;
    const fixNum = parseFloat(tempCardFixed.toString().replace(',', '.')) || 0;
    const debNum = parseFloat(tempCardDebit.toString().replace(',', '.')) || 0;
    const credNum = parseFloat(tempCardCredit.toString().replace(',', '.')) || 0;

    const newCardSettings = {
      active: tempCardActive,
      type: tempCardType,
      percentageRate: pctNum,
      fixedRate: fixNum,
      debitRate: debNum,
      creditRate: credNum,
      autoAddToTotal: tempCardAutoAdd,
      customNotice: tempCardCustomNotice.trim()
    };

    const noticeText = getCardMachineNoticeText(newCardSettings);

    const newStore = {
      ...restaurantSettings,
      cardMachineSettings: newCardSettings,
      cardMachineNotice: noticeText,
      cardMachineNoticeActive: tempCardActive
    };

    setRestaurantSettings(newStore);
    setTempStoreCardMachineNotice(noticeText);
    setTempStoreCardMachineNoticeActive(tempCardActive);
    saveStoredRestaurantInfo(newStore);
    dispatchConfigSync('STORE_UPDATE', newStore);
    triggerMenuToast('Taxa da maquininha salva e sincronizada com sucesso!');
  };

  // Handlers for Pizza Flavors
  const handleOpenCreateFlavor = () => {
    setEditingFlavor(null);
    setFlavorFormName('');
    setFlavorFormPrice('40.00');
    setFlavorFormCategory('salgadas');
    setFlavorFormDescription('');
    setFlavorFormIsAvailable(true);
    setIsFlavorModalOpen(true);
  };

  const handleOpenEditFlavor = (flavor) => {
    setEditingFlavor(flavor);
    setFlavorFormName(flavor.name || '');
    setFlavorFormPrice(flavor.price !== undefined ? flavor.price.toString() : '40.00');
    setFlavorFormCategory(flavor.category || 'salgadas');
    setFlavorFormDescription(flavor.description || '');
    setFlavorFormIsAvailable(flavor.isAvailable !== false);
    setIsFlavorModalOpen(true);
  };

  const handleSaveFlavor = async (e) => {
    e.preventDefault();
    if (!flavorFormName.trim()) {
      alert('Informe o nome do sabor.');
      return;
    }
    const priceNum = parseFloat(flavorFormPrice.toString().replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Informe um preço válido para o sabor (ex: 40.00 ou 120.00).');
      return;
    }

    const savedFlavor = {
      id: editingFlavor ? editingFlavor.id : `flavor_${Date.now()}`,
      name: flavorFormName.trim(),
      price: priceNum,
      category: flavorFormCategory,
      description: flavorFormDescription.trim(),
      isAvailable: flavorFormIsAvailable
    };

    let updated;
    if (editingFlavor) {
      updated = pizzaFlavors.map(f => f.id === editingFlavor.id ? savedFlavor : f);
      triggerMenuToast(`Sabor "${savedFlavor.name}" atualizado com sucesso!`);
    } else {
      updated = [...pizzaFlavors, savedFlavor];
      triggerMenuToast(`Novo sabor "${savedFlavor.name}" cadastrado com sucesso!`);
    }

    setPizzaFlavors(updated);
    saveStoredPizzaFlavors(updated);
    dispatchConfigSync('PIZZA_FLAVORS_UPDATE', updated);
    setIsFlavorModalOpen(false);
  };

  const handleToggleFlavorAvailability = (flavorId) => {
    const updated = pizzaFlavors.map(f => {
      if (f.id === flavorId) {
        const nextState = f.isAvailable === false ? true : false;
        triggerMenuToast(nextState ? `Sabor "${f.name}" ativado (disponível)!` : `Sabor "${f.name}" pausado (esgotado)!`);
        return { ...f, isAvailable: nextState };
      }
      return f;
    });
    setPizzaFlavors(updated);
    saveStoredPizzaFlavors(updated);
    dispatchConfigSync('PIZZA_FLAVORS_UPDATE', updated);
  };

  const handleDeleteFlavor = (flavorId) => {
    const flavor = pizzaFlavors.find(f => f.id === flavorId);
    if (!window.confirm(`Tem certeza que deseja excluir o sabor "${flavor?.name || ''}"?`)) return;
    const updated = pizzaFlavors.filter(f => f.id !== flavorId);
    setPizzaFlavors(updated);
    saveStoredPizzaFlavors(updated);
    dispatchConfigSync('PIZZA_FLAVORS_UPDATE', updated);
    triggerMenuToast('Sabor de pizza excluído.');
  };

  const handleResetFlavorsToDefault = () => {
    if (!window.confirm('Deseja restaurar todos os sabores padrão de pizza e valores originais?')) return;
    setPizzaFlavors(INITIAL_PIZZA_FLAVORS);
    saveStoredPizzaFlavors(INITIAL_PIZZA_FLAVORS);
    dispatchConfigSync('PIZZA_FLAVORS_UPDATE', INITIAL_PIZZA_FLAVORS);
    triggerMenuToast('Sabores de pizza restaurados para o padrão com sucesso!');
  };

  const handleClearAllFlavors = () => {
    if (!window.confirm('Tem certeza que deseja apagar TODOS os sabores de pizza? Você poderá cadastrar somente os seus sabores e valores exclusivos.')) return;
    setPizzaFlavors([]);
    saveStoredPizzaFlavors([]);
    dispatchConfigSync('PIZZA_FLAVORS_UPDATE', []);
    triggerMenuToast('Todos os sabores de pizza foram removidos!');
  };

  // Buffet Items Availability Management State
  const [buffetCategories, setBuffetCategories] = useState(() => getStoredBuffetCategories());
  const [unavailableBuffetIds, setUnavailableBuffetIds] = useState(() => getUnavailableBuffetItemIds());
  const [buffetSearchQuery, setBuffetSearchQuery] = useState('');
  const [buffetCategoryFilter, setBuffetCategoryFilter] = useState('all');

  useEffect(() => {
    const handleBuffetSync = () => {
      setBuffetCategories(getStoredBuffetCategories());
      setUnavailableBuffetIds(getUnavailableBuffetItemIds());
    };
    window.addEventListener('buffet_categories_updated', handleBuffetSync);
    window.addEventListener('buffet_unavailable_updated', handleBuffetSync);
    window.addEventListener('storage', handleBuffetSync);

    return () => {
      window.removeEventListener('buffet_categories_updated', handleBuffetSync);
      window.removeEventListener('buffet_unavailable_updated', handleBuffetSync);
      window.removeEventListener('storage', handleBuffetSync);
    };
  }, []);

  const handleToggleBuffetItemAvailability = async (itemId) => {
    const current = getUnavailableBuffetItemIds();
    let next;
    const targetItem = buffetCategories.flatMap(c => c.items || []).find(i => i.id === itemId);
    const itemName = targetItem ? targetItem.name : 'Item';
    
    if (current.includes(itemId)) {
      next = current.filter(id => id !== itemId);
      triggerMenuToast(`"${itemName}" reativado no Buffet (Disponível)!`);
    } else {
      next = [...current, itemId];
      triggerMenuToast(`"${itemName}" pausado no Buffet (Indisponível / Acabou)!`);
    }
    
    saveUnavailableBuffetItemIds(next);
    setUnavailableBuffetIds(next);
    const updated = getStoredBuffetCategories();
    setBuffetCategories(updated);

    // Sync to Supabase & Cloud
    await dispatchConfigSync('BUFFET_AVAILABILITY_UPDATE', next);
  };

  const handleResetAllBuffetItemsAvailable = async () => {
    if (!window.confirm('Deseja marcar TODOS os itens do buffet como disponíveis?')) return;
    saveUnavailableBuffetItemIds([]);
    setUnavailableBuffetIds([]);
    const updated = getStoredBuffetCategories();
    setBuffetCategories(updated);
    await dispatchConfigSync('BUFFET_AVAILABILITY_UPDATE', []);
    triggerMenuToast('Todos os itens do Buffet foram reativados!');
  };

  // Filtered Buffet items
  const filteredBuffetItems = useMemo(() => {
    let cats = buffetCategories;
    if (buffetCategoryFilter !== 'all') {
      cats = cats.filter(c => c.id === buffetCategoryFilter);
    }
    return cats.map(cat => {
      let items = cat.items || [];
      if (buffetSearchQuery.trim()) {
        const q = buffetSearchQuery.toLowerCase().trim();
        items = items.filter(i => (i.name || '').toLowerCase().includes(q) || (i.desc || '').toLowerCase().includes(q));
      }
      return {
        ...cat,
        items
      };
    }).filter(cat => cat.items.length > 0);
  }, [buffetCategories, buffetCategoryFilter, buffetSearchQuery]);

  // Filtered Pizza Flavors in Admin
  const filteredAdminFlavors = useMemo(() => {
    let list = pizzaFlavors;
    if (flavorCategoryFilter === 'pausados') {
      list = list.filter(f => f.isAvailable === false);
    } else if (flavorCategoryFilter !== 'todos') {
      list = list.filter(f => (f.category || 'salgadas') === flavorCategoryFilter);
    }

    if (flavorSearch.trim()) {
      const q = flavorSearch.toLowerCase().trim();
      list = list.filter(f => 
        f.name.toLowerCase().includes(q) ||
        (f.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [pizzaFlavors, flavorCategoryFilter, flavorSearch]);

  // Scoped products in Admin (Scoped strictly by Branch)
  const scopedProductsList = useMemo(() => {
    if (currentUser?.role === ROLES.BRANCH_ADMIN) {
      const bId = currentUser?.branchId || currentBranch?.id || 'ariquemes';
      return productsList.filter(p => p.branchId === bId || (!p.branchId && bId === 'ariquemes') || p.branchId === 'all');
    } else if (currentUser?.role === ROLES.SUPER_ADMIN && masterBranchFilter !== 'all') {
      return productsList.filter(p => p.branchId === masterBranchFilter || (!p.branchId && masterBranchFilter === 'ariquemes') || p.branchId === 'all');
    }
    return productsList;
  }, [productsList, currentUser, currentBranch, masterBranchFilter]);

  // Filtered products in Admin (Category & Search over scoped products)
  const filteredAdminProducts = useMemo(() => {
    let list = scopedProductsList;

    if (menuCategoryFilter === 'destaques') {
      list = list.filter(p => p.isHighlight || p.isPromo);
    } else if (menuCategoryFilter === 'promos') {
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
  }, [scopedProductsList, menuCategoryFilter, menuSearch]);

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

  // Sincroniza status do motor Baileys em background ao carregar o painel
  useEffect(() => {
    fetchEngineStatus('ariquemes').catch(() => {});
  }, []);

  // Watch for incoming new orders and sound the alarm safely
  useEffect(() => {
    const list = Array.isArray(orders) ? orders : [];

    // Se é a primeira carga de histórico, apenas popula os IDs conhecidos sem disparar alarme sonoro
    if (!isInitialOrdersLoadedRef.current) {
      if (list.length > 0) {
        list.forEach(o => {
          if (o?.orderId) knownOrderIdsRef.current.add(o.orderId);
        });
        isInitialOrdersLoadedRef.current = true;
      }
      return;
    }

    const newOrders = list.filter(o => o?.orderId && !knownOrderIdsRef.current.has(o.orderId));
    
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
    if (!createdAt) return 0;
    const diffMs = now - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  // Check if order is delayed (active and older than 35 minutes)
  const isOrderDelayed = (order) => {
    if (!order) return false;
    const st = normalizeOrderStatus(order);
    if (st === 'CONCLUIDO' || st === 'CANCELADO') return false;
    const elapsed = getElapsedMinutes(order.createdAt);
    return elapsed >= 35; // 35+ minutes threshold for warning
  };

  // Metrics calculations (Excluding cancelled orders!)
  const activeOrdersList = useMemo(() => {
    return scopedOrders.filter(o => o && normalizeOrderStatus(o) !== 'CANCELADO');
  }, [scopedOrders]);

  const totalRevenue = useMemo(() => {
    return activeOrdersList
      .filter(o => o && (o.paymentStatus === 'PAGO_APROVADO' || normalizeOrderStatus(o) === 'CONCLUIDO'))
      .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  }, [activeOrdersList]);

  const pendingCount = useMemo(() => {
    return activeOrdersList.filter(o => normalizeOrderStatus(o) === 'RECEBIDO_COZINHA').length;
  }, [activeOrdersList]);

  const inPrepCount = useMemo(() => {
    return activeOrdersList.filter(o => normalizeOrderStatus(o) === 'EM_PREPARO').length;
  }, [activeOrdersList]);

  const inDeliveryCount = useMemo(() => {
    return activeOrdersList.filter(o => normalizeOrderStatus(o) === 'SAIU_ENTREGA').length;
  }, [activeOrdersList]);

  const delayedCount = useMemo(() => {
    return activeOrdersList.filter(o => isOrderDelayed(o)).length;
  }, [activeOrdersList, now]);

  const completedCount = useMemo(() => {
    return activeOrdersList.filter(o => normalizeOrderStatus(o) === 'CONCLUIDO').length;
  }, [activeOrdersList]);

  const cancelledCount = useMemo(() => {
    return scopedOrders.filter(o => normalizeOrderStatus(o) === 'CANCELADO').length;
  }, [scopedOrders]);

  // Filtered orders list for KDS
  const filteredOrders = useMemo(() => {
    return scopedOrders.filter(order => {
      const orderSt = normalizeOrderStatus(order);
      const isCancelled = orderSt === 'CANCELADO';

      // Specific filter tabs
      if (selectedFilter === 'cancelados') {
        if (!isCancelled) return false;
      } else {
        // All other tabs hide cancelled orders unless specifically looking at cancelados
        if (isCancelled && selectedFilter !== 'todos') return false;
      }

      if (selectedFilter === 'atrasados' && !isOrderDelayed(order)) return false;
      if (selectedFilter === 'pendentes' && orderSt !== 'RECEBIDO_COZINHA') return false;
      if (selectedFilter === 'preparo' && orderSt !== 'EM_PREPARO') return false;
      if (selectedFilter === 'entrega' && orderSt !== 'SAIU_ENTREGA') return false;
      if (selectedFilter === 'concluidos' && orderSt !== 'CONCLUIDO') return false;
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
  }, [scopedOrders, selectedFilter, searchQuery, now]);

  // Print ticket helper (imprime comanda térmica compacta sem abrir nova guia no navegador)
  const handlePrintOrder = (order) => {
    if (!order) return;

    // Remove qualquer iframe de impressão anterior se houver
    const oldIframe = document.getElementById('comanda-print-frame');
    if (oldIframe) {
      try { oldIframe.remove(); } catch (e) {}
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'comanda-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    // Resolução segura de endereço e dados (sem jamais exibir "undefined")
    const customerName = order.customerName || order.customer_name || 'Cliente';
    const customerPhone = order.customerPhone || order.customer_phone || '';
    const isBalcao = order.deliveryType === 'balcao' || order.deliveryType === 'retirada' || order.district === 'Balcão';
    const address = order.deliveryAddress?.street || order.deliveryAddress?.address || order.address || '';
    const number = order.deliveryAddress?.number || order.number || '';
    const district = order.deliveryAddress?.district || order.district || '';
    const complement = order.deliveryAddress?.complement || order.complement || '';
    const reference = order.deliveryAddress?.reference || order.reference || '';
    const changeFor = order.changeFor || order.cashChange || null;
    const orderNotes = order.notes || '';
    const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
    const paymentMethod = order.paymentMethod || 'A Definir';
    const isPaid = order.paymentStatus === 'PAGO_APROVADO';

    const branch = branchesList.find(b => b.id === (order.branchId || currentBranch?.id)) || currentBranch;
    const branchName = branch?.displayName || branch?.name || 'EL SHADDAY DELIVERY';
    const branchPhone = branch?.phoneFormatted || branch?.whatsappFormatted || '(69) 99222-8682';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Comanda #${order.orderId} - El Shadday</title>
          <style>
            @page {
              size: auto;
              margin: 0mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              line-height: 1.25;
              color: #000;
              background: #fff;
              width: 100%;
              max-width: 280px;
              padding: 4mm 3mm;
              margin: 0 auto;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .title { font-size: 13px; letter-spacing: -0.3px; margin-bottom: 2px; }
            .comanda-id { font-size: 14px; margin: 2px 0; }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            .item-row { margin-bottom: 4px; }
            .item-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 11.5px; }
            .item-sub { padding-left: 8px; font-size: 10px; color: #111; }
            .total-row { display: flex; justify-content: space-between; font-size: 13.5px; font-weight: bold; margin: 3px 0; }
            .info-row { margin: 2px 0; font-size: 11px; }
            .cancel-badge { color: red; font-weight: bold; font-size: 13px; text-align: center; padding: 2px 0; }
            .obs-box { border: 1px solid #000; padding: 3px; margin: 4px 0; font-weight: bold; font-size: 10.5px; }
          </style>
        </head>
        <body>
          <div class="center bold title">${branchName.toUpperCase()}</div>
          <div class="center bold comanda-id">*** COMANDA #${order.orderId} ***</div>
          <div class="center" style="font-size: 10px;">Data: ${formattedDate}</div>

          ${order.orderStatus === 'CANCELADO' ? '<div class="cancel-badge">*** PEDIDO CANCELADO ***</div>' : ''}

          <div class="divider"></div>

          <div class="info-row"><span class="bold">CLIENTE:</span> ${customerName}</div>
          ${customerPhone ? `<div class="info-row"><span class="bold">WHATSAPP:</span> ${customerPhone}</div>` : ''}
          <div class="info-row"><span class="bold">TIPO:</span> ${isBalcao ? 'RETIRADA NO BALCÃO' : 'ENTREGA EM DOMICÍLIO'}</div>

          ${!isBalcao ? `
            ${district ? `<div class="info-row"><span class="bold">BAIRRO:</span> ${district}</div>` : ''}
            ${address ? `<div class="info-row"><span class="bold">END:</span> ${address}${number ? `, Nº ${number}` : ''}</div>` : ''}
            ${complement ? `<div class="info-row"><span class="bold">COMPL:</span> ${complement}</div>` : ''}
            ${reference ? `<div class="info-row"><span class="bold">REF:</span> ${reference}</div>` : ''}
          ` : '<div class="info-row bold" style="background:#000;color:#fff;text-align:center;padding:1px;margin:2px 0;">RETIRADA NO LOCAL (BALCÃO)</div>'}

          <div class="divider"></div>
          <div class="bold" style="margin-bottom: 3px;">ITENS DO PEDIDO:</div>

          ${(order.items || []).map(it => {
            const itemTotal = Number(it.price || it.unitPrice || 0) * Number(it.quantity || 1);
            let details = [];
            if (it.pizzaSelections && it.pizzaSelections.length > 0) {
              const sab = it.pizzaSelections.map(p => p.flavors?.join('/')).filter(Boolean).join(' + ');
              if (sab) details.push(`Sabores: ${sab}`);
            } else if (it.flavors && it.flavors.length > 0) {
              details.push(`Sabores: ${it.flavors.join('/')}`);
            }
            if (it.salgadasDetails) {
              const salg = Object.entries(it.salgadasDetails).map(([k,v]) => `${v}x ${k}`).join(', ');
              if (salg) details.push(`Salgadas: ${salg}`);
            }
            if (it.docesDetails) {
              const doc = Object.entries(it.docesDetails).map(([k,v]) => `${v}x ${k}`).join(', ');
              if (doc) details.push(`Doces: ${doc}`);
            }
            if (it.notes) details.push(`Obs: ${it.notes}`);

            return `
              <div class="item-row">
                <div class="item-header">
                  <span>${it.quantity}x ${it.name}</span>
                  ${itemTotal > 0 ? `<span>R$ ${itemTotal.toFixed(2)}</span>` : ''}
                </div>
                ${details.map(d => `<div class="item-sub">• ${d}</div>`).join('')}
              </div>
            `;
          }).join('')}

          ${orderNotes ? `
            <div class="obs-box">OBS DO PEDIDO: ${orderNotes}</div>
          ` : ''}

          <div class="divider"></div>

          <div style="display:flex; justify-content:space-between; margin:1px 0; font-size:11px;">
            <span>Subtotal:</span>
            <span>R$ ${Number(order.subtotal || 0).toFixed(2)}</span>
          </div>
          ${!isBalcao ? `
            <div style="display:flex; justify-content:space-between; margin:1px 0; font-size:11px;">
              <span>Taxa Entrega:</span>
              <span>R$ ${Number(order.deliveryFee || 0).toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="total-row">
            <span>TOTAL:</span>
            <span>R$ ${Number(order.total || 0).toFixed(2)}</span>
          </div>

          <div class="divider"></div>

          <div class="info-row"><span class="bold">PAGAMENTO:</span> ${paymentMethod.toUpperCase()}</div>
          <div class="info-row">
            <span class="bold">STATUS:</span> 
            ${isPaid ? 'PAGO (Pix / Cartão)' : '⚠️ COBRAR NA ENTREGA'}
          </div>
          ${changeFor && Number(changeFor) > Number(order.total || 0) ? `
            <div class="info-row bold" style="background:#f4f4f4;padding:2px;">
              TROCO PARA: R$ ${Number(changeFor).toFixed(2)} (Levar R$ ${(Number(changeFor) - Number(order.total || 0)).toFixed(2)})
            </div>
          ` : ''}

          <div class="divider"></div>
          <div class="center" style="font-size: 10px;">${branchPhone}</div>
          <div class="center" style="font-size: 9px; margin-top: 2px;">Obrigado pela preferência!</div>
        </body>
      </html>
    `;

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Erro ao imprimir via iframe:', err);
      }
      setTimeout(() => {
        try { iframe.remove(); } catch (e) {}
      }, 3000);
    }, 150);
  };

  // Disparo automático de WhatsApp para o cliente da filial do pedido
  const handleTriggerCustomerWhatsApp = async (order, statusType, reason = '') => {
    if (!order || !order.customerPhone) return;
    const branch = branchesList.find(b => b.id === (order.branchId || currentBranch?.id)) || currentBranch;
    try {
      await sendCustomerWhatsAppNotification({
        order,
        statusType,
        branch,
        reason,
        forceOpen: false
      });
    } catch (err) {
      console.warn('[AdminDashboard] Erro ao disparar WhatsApp automático:', err);
    }
  };

  // WhatsApp Message Launcher (Modal manual com preview)
  const handleOpenWhatsAppModal = (order, defaultType = 'pronto') => {
    let rawPhone = (order.customerPhone || '').replace(/\D/g, '');
    const branch = branchesList.find(b => b.id === (order.branchId || currentBranch?.id)) || currentBranch;

    let normalizedType = defaultType;
    if (defaultType === 'entrega') normalizedType = 'SAIU_ENTREGA';
    else if (defaultType === 'pronto') normalizedType = order.deliveryType === 'balcao' ? 'PRONTO_BALCAO' : 'SAIU_ENTREGA';
    else if (defaultType === 'preparo') normalizedType = 'EM_PREPARO';
    else if (defaultType === 'cancelado') normalizedType = 'CANCELADO';
    else if (defaultType === 'recebido') normalizedType = 'RECEBIDO_COZINHA';
    else if (defaultType === 'concluido') normalizedType = 'CONCLUIDO';

    const initialMessage = buildStatusMessage({
      order,
      statusType: normalizedType,
      branch,
      reason: order.cancelReason || ''
    });

    setWhatsappModalData({
      order,
      branch,
      phone: rawPhone,
      message: initialMessage,
      activeTemplate: normalizedType
    });
  };

  const handleApplyWhatsAppTemplate = (type) => {
    if (!whatsappModalData) return;
    const { order, branch } = whatsappModalData;
    const targetBranch = branch || branchesList.find(b => b.id === (order.branchId || currentBranch?.id)) || currentBranch;

    const msg = buildStatusMessage({
      order,
      statusType: type,
      branch: targetBranch,
      reason: order.cancelReason || ''
    });

    setWhatsappModalData(prev => ({
      ...prev,
      message: msg,
      activeTemplate: type
    }));
  };

  const handleSendWhatsAppMessage = () => {
    if (!whatsappModalData) return;
    let digits = cleanPhoneNumber(whatsappModalData.phone);
    if (!digits) {
      alert('Por favor, informe o número de WhatsApp válido do cliente!');
      return;
    }
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(whatsappModalData.message)}`;
    window.open(url, '_blank');
    setWhatsappModalData(null);
  };

  // Update order status with automatic tab switching and WhatsApp notification
  const handleUpdateStatusAndTab = (order, newStatus, customReason = '') => {
    if (!order || !newStatus) return;

    let notifyType = newStatus;
    if (newStatus === 'CONCLUIDO' && order.deliveryType === 'balcao') {
      notifyType = 'PRONTO_BALCAO';
    }

    // REGRA DE OURO: Se o motor Baileys na nuvem estiver ATIVADO/CONECTADO:
    // O sistema de abrir mensagem em nova guia NÃO É USADO! O envio é 100% invisível em segundo plano!
    const isBaileysActive = isCloudBaileysActive();

    if (!isBaileysActive && whatsAppSettings?.autoNotify && whatsAppSettings?.notifyOnClick !== false) {
      // Somente abre o WhatsApp Web com texto pronto se o Baileys NÃO estiver conectado
      const branchObj = branchesList.find(b => b.id === (order.branchId || currentBranch?.id)) || currentBranch;
      openWhatsAppInstantLink({
        order,
        statusType: notifyType,
        branch: branchObj,
        reason: customReason
      });
    }

    // 1. Update order status in app state / DB
    onUpdateOrderStatus(order.orderId, newStatus);

    // 2. Dispatch background WhatsApp notification (Baileys Cloud)
    handleTriggerCustomerWhatsApp(order, notifyType, customReason);

    // 3. Highlight this specific order card
    setHighlightedOrderId(order.orderId);
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedOrderId(null);
    }, 2800);

    // 4. Automatically switch to the destination tab if enabled
    const STATUS_MAP = {
      RECEBIDO_COZINHA: { tab: 'pendentes', label: 'Pendentes' },
      EM_PREPARO: { tab: 'preparo', label: 'No Forno' },
      SAIU_ENTREGA: { tab: 'entrega', label: 'Saiu p/ Entrega' },
      CONCLUIDO: { tab: 'concluidos', label: 'Prontos / Entregues' },
      CANCELADO: { tab: 'cancelados', label: 'Cancelados' }
    };

    const targetInfo = STATUS_MAP[newStatus];
    if (autoFollowTab && targetInfo) {
      setSelectedFilter(targetInfo.tab);
      setStatusChangeToast({
        orderId: order.orderId,
        newStatus,
        tabLabel: targetInfo.label
      });
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setStatusChangeToast(null);
      }, 3500);
    }
  };

  // Cancel / Delete Order Execution
  const handleConfirmCancel = () => {
    if (!cancelModalOrder) return;
    const orderToCancel = { ...cancelModalOrder, cancelReason };
    if (onCancelOrder) {
      onCancelOrder(cancelModalOrder.orderId, cancelReason);
    } else {
      onUpdateOrderStatus(cancelModalOrder.orderId, 'CANCELADO');
    }
    handleTriggerCustomerWhatsApp(orderToCancel, 'CANCELADO', cancelReason);

    if (autoFollowTab) {
      setSelectedFilter('cancelados');
      setHighlightedOrderId(cancelModalOrder.orderId);
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedOrderId(null);
      }, 2800);

      setStatusChangeToast({
        orderId: cancelModalOrder.orderId,
        newStatus: 'CANCELADO',
        tabLabel: 'Cancelados'
      });
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setStatusChangeToast(null);
      }, 3500);
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

  // Sincroniza histórico de clientes a partir dos pedidos
  useEffect(() => {
    if (Array.isArray(orders) && orders.length > 0) {
      backfillCustomersFromOrders(orders);
    }
  }, [orders]);

  // Handlers para Autocomplete de Cliente no PDV
  const handleCustomerNameChange = (e) => {
    const val = e.target.value;
    setPdvCustomerName(val);
    if (activeAutoCompletedCustomer && val !== activeAutoCompletedCustomer.name) {
      setActiveAutoCompletedCustomer(null);
    }
    if (val.trim().length >= 2) {
      const matches = searchCustomers(val);
      setCustomerSuggestions(matches);
      setIsCustomerSuggestionsOpen(matches.length > 0);
    } else {
      setCustomerSuggestions([]);
      setIsCustomerSuggestionsOpen(false);
    }
  };

  const handleCustomerPhoneChange = (e) => {
    const val = e.target.value;
    setPdvCustomerPhone(val);
    if (activeAutoCompletedCustomer && val !== activeAutoCompletedCustomer.phone) {
      setActiveAutoCompletedCustomer(null);
    }
    if (val.trim().length >= 2) {
      const matches = searchCustomers(val);
      setCustomerSuggestions(matches);
      setIsCustomerSuggestionsOpen(matches.length > 0);
    } else {
      setCustomerSuggestions([]);
      setIsCustomerSuggestionsOpen(false);
    }
  };

  const handleSelectCustomer = (cust) => {
    if (!cust) return;
    setPdvCustomerName(cust.name || '');
    setPdvCustomerPhone(cust.phoneFormatted || cust.phone || '');
    if (cust.deliveryType === 'delivery') {
      setPdvDeliveryType('delivery');
      if (cust.district || cust.districtId) {
        const found = ARIQUEMES_DISTRICTS.find(d => 
          d.id === cust.districtId || 
          d.name.toLowerCase() === (cust.district || '').toLowerCase()
        );
        if (found) setPdvDistrict(found);
      }
      setPdvAddress(cust.street || cust.address || '');
      setPdvNumber(cust.number || '');
      setPdvReference(cust.reference || '');
    } else {
      setPdvDeliveryType('balcao');
    }
    setActiveAutoCompletedCustomer(cust);
    setIsCustomerSuggestionsOpen(false);
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
      branchId: currentBranch?.id || 'ariquemes',
      branchName: currentBranch?.displayName || currentBranch?.name || 'Unidade Ariquemes',
      createdAt: new Date().toISOString(),
      customerName: pdvCustomerName.trim(),
      customerPhone: pdvCustomerPhone.trim(),
      deliveryType: pdvDeliveryType,
      deliveryAddress: {
        street: pdvDeliveryType === 'delivery' ? pdvAddress.trim() : 'Rua Maceió, 2333 - Setor 03, Ariquemes - RO',
        address: pdvDeliveryType === 'delivery' ? pdvAddress.trim() : 'Rua Maceió, 2333 - Setor 03, Ariquemes - RO',
        number: pdvDeliveryType === 'delivery' ? pdvNumber.trim() : '',
        district: pdvDeliveryType === 'delivery' ? pdvDistrict.name : 'Balcão',
        reference: pdvDeliveryType === 'delivery' ? pdvReference.trim() : '',
        isPickup: pdvDeliveryType === 'balcao'
      },
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

    try {
      recordCustomerFromOrder(newOrder);
    } catch (e) {}

    if (onCreateKitchenOrder) {
      onCreateKitchenOrder(newOrder);
    }

    if (newOrder.customerPhone) {
      handleTriggerCustomerWhatsApp(newOrder, 'RECEBIDO_COZINHA');
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
    setActiveAutoCompletedCustomer(null);
    setIsCustomerSuggestionsOpen(false);
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
          
          {/* Brand & Role Header */}
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${
              currentUser?.role === ROLES.SUPER_ADMIN
                ? 'bg-brand-gold/20 text-brand-gold border-brand-gold/40'
                : currentUser?.role === ROLES.BRANCH_ADMIN
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              {currentUser?.role === ROLES.SUPER_ADMIN ? (
                <Crown className="w-6 h-6" />
              ) : currentUser?.role === ROLES.BRANCH_ADMIN ? (
                <Building2 className="w-6 h-6" />
              ) : (
                <ChefHat className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-base sm:text-lg text-white">
                  {currentUser?.role === ROLES.SUPER_ADMIN
                    ? 'Painel Master El Shadday'
                    : currentUser?.role === ROLES.BRANCH_ADMIN
                    ? `Admin • ${currentBranch?.name || 'Filial'}`
                    : `Cozinha KDS • ${currentBranch?.name || 'Filial'}`}
                </h1>
                
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  currentUser?.role === ROLES.SUPER_ADMIN
                    ? 'bg-brand-gold/20 text-brand-gold border-brand-gold/40'
                    : currentUser?.role === ROLES.BRANCH_ADMIN
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                }`}>
                  {ROLE_LABELS[currentUser?.role] || 'Painel de Gestão'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {currentUser?.role === ROLES.SUPER_ADMIN
                  ? 'Diretoria • Faturamento, Lucro Consolidado, Filiais e Usuários'
                  : currentUser?.role === ROLES.BRANCH_ADMIN
                  ? `${currentBranch?.displayName} • Gestão de Cardápio, Preços & Vendas da Filial`
                  : `${currentBranch?.displayName} • Comandas em Tempo Real e Operação`}
              </p>
            </div>
          </div>

          {/* Quick Header Actions & Branch Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Super Admin Branch Filter Dropdown */}
            {currentUser?.role === ROLES.SUPER_ADMIN && (
              <div className="flex items-center gap-1.5 bg-dark-950 px-3 py-1.5 rounded-2xl border border-dark-750">
                <Store className="w-3.5 h-3.5 text-brand-gold" />
                <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">Filial:</span>
                <select
                  value={masterBranchFilter}
                  onChange={(e) => setMasterBranchFilter(e.target.value)}
                  className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-dark-900 text-white">Todas as Filiais (Global)</option>
                  {branchesList.map(b => (
                    <option key={b.id} value={b.id} className="bg-dark-900 text-white">
                      {b.name} ({b.displayName})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* User chip */}
            {currentUser && (
              <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-950 border border-dark-800 text-xs">
                <span className="text-slate-400">Olá,</span>
                <span className="font-bold text-white">{currentUser.name}</span>
              </div>
            )}

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
        {currentUser?.role !== ROLES.KITCHEN && (
          <div className="max-w-7xl mx-auto mt-3 flex items-center gap-1.5 border-t border-dark-800 pt-2.5 overflow-x-auto scrollbar-none no-scrollbar pb-1 text-xs">
            
            {/* 1. COZINHA (KDS) */}
            <button
              type="button"
              onClick={() => setActiveAdminTab('kds')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeAdminTab === 'kds'
                  ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                  : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Cozinha</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeAdminTab === 'kds' ? 'bg-dark-950 text-brand-gold' : 'bg-dark-900 text-slate-400'
              }`}>
                {activeOrdersList.length}
              </span>
            </button>

            {/* 2. NOVO PEDIDO (PDV) */}
            <button
              type="button"
              onClick={() => setActiveAdminTab('pdv')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeAdminTab === 'pdv'
                  ? 'bg-emerald-500 text-dark-950 font-black shadow-sm'
                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo Pedido</span>
              {pdvCart.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-dark-950 font-black">
                  {pdvCart.length}
                </span>
              )}
            </button>

            {/* 3. CARDÁPIO */}
            <button
              type="button"
              onClick={() => {
                setActiveAdminTab('menu');
                setMenuSubTab('products');
              }}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeAdminTab === 'menu'
                  ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                  : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Cardápio</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeAdminTab === 'menu' ? 'bg-dark-950 text-brand-gold' : 'bg-dark-900 text-slate-400'
              }`}>
                {scopedProductsList.length}
              </span>
            </button>

            {/* 4. WHATSAPP MULTI-FILIAL */}
            <button
              type="button"
              onClick={() => setActiveAdminTab('whatsapp')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeAdminTab === 'whatsapp'
                  ? 'bg-emerald-500 text-dark-950 font-black shadow-sm'
                  : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
              }`}
              title="Gerenciador de Conexões WhatsApp das Filiais"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp</span>
            </button>

            {/* 5. QR CODE MESA / BALCÃO */}
            <button
              type="button"
              onClick={() => setActiveAdminTab('qrcode')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeAdminTab === 'qrcode'
                  ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                  : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
              }`}
              title="QR Code e Link Oficial da Filial"
            >
              <QrCode className="w-4 h-4" />
              <span>QR Code Mesa</span>
            </button>

            {/* 6. CONFIGURAÇÕES (TAXA, LOJA, CUPONS) */}
            <button
              type="button"
              onClick={() => setActiveAdminTab('settings')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeAdminTab === 'settings'
                  ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                  : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
              }`}
              title="Taxa da maquininha, dados da filial e cupons"
            >
              <Settings2 className="w-4 h-4" />
              <span>Configurações</span>
            </button>

            {/* ABAS DO MASTER (SUPER_ADMIN) */}
            {currentUser?.role === ROLES.SUPER_ADMIN && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveAdminTab('master-overview')}
                  className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeAdminTab === 'master-overview'
                      ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                      : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Faturamento</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAdminTab('branches')}
                  className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeAdminTab === 'branches'
                      ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                      : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Filiais</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    activeAdminTab === 'branches' ? 'bg-dark-950 text-brand-gold' : 'bg-dark-900 text-slate-400'
                  }`}>
                    {branchesList.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAdminTab('users')}
                  className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeAdminTab === 'users'
                      ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                      : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Usuários</span>
                </button>
              </>
            )}

            {/* DESEMPENHO DA FILIAL (BRANCH_ADMIN) */}
            {currentUser?.role === ROLES.BRANCH_ADMIN && (
              <button
                type="button"
                onClick={() => setActiveAdminTab('branch-overview')}
                className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeAdminTab === 'branch-overview'
                    ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                    : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Desempenho</span>
              </button>
            )}

            {/* BUFFET DISPONIBILIDADE (APENAS ARIQUEMES) */}
            {currentBranch?.id === 'ariquemes' && (currentUser?.role === ROLES.SUPER_ADMIN || currentUser?.branchId === 'ariquemes') && (
              <button
                type="button"
                onClick={() => setActiveAdminTab('buffet')}
                className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeAdminTab === 'buffet'
                    ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                    : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                }`}
                title="Controlar disponibilidade dos pratos do Buffet (pausar se acabar na cozinha)"
              >
                <Utensils className="w-4 h-4" />
                <span>Buffet (Pratos)</span>
                {unavailableBuffetIds.length > 0 ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-rose-500 text-white animate-pulse">
                    ⛔ {unavailableBuffetIds.length} pausados
                  </span>
                ) : (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    activeAdminTab === 'buffet' ? 'bg-dark-950 text-brand-gold' : 'bg-dark-900 text-slate-400'
                  }`}>
                    Ativo
                  </span>
                )}
              </button>
            )}

            {/* GALERIA BUFFET (APENAS ARIQUEMES) */}
            {currentBranch?.id === 'ariquemes' && (currentUser?.role === ROLES.SUPER_ADMIN || currentUser?.branchId === 'ariquemes') && (
              <button
                type="button"
                onClick={() => setActiveAdminTab('gallery')}
                className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeAdminTab === 'gallery'
                    ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                    : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Galeria Buffet</span>
              </button>
            )}

            {/* ATALHO BUFFET (APENAS ARIQUEMES) */}
            {onSwitchToBuffet && currentBranch?.id === 'ariquemes' && (
              <button
                type="button"
                onClick={onSwitchToBuffet}
                className="ml-auto px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 bg-amber-500/10 text-brand-gold hover:bg-amber-500/20 border border-brand-gold/30 transition-all cursor-pointer whitespace-nowrap text-xs"
                title="Acessar vitrine do Buffet El Shadday Ariquemes"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Buffet 👑</span>
              </button>
            )}

          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-6">
        
        {/* VIEW 0A: MASTER FINANCIAL & PROFIT VIEW */}
        {activeAdminTab === 'master-overview' && currentUser?.role === ROLES.SUPER_ADMIN && (
          <MasterFinancialView
            orders={orders}
            branches={branchesList}
            onNavigateToBranchMenu={(bId) => {
              setMasterBranchFilter(bId);
              setActiveAdminTab('menu');
            }}
            onNavigateToBranchKitchen={(bId) => {
              setMasterBranchFilter(bId);
              setActiveAdminTab('kds');
            }}
          />
        )}

        {/* VIEW 0B: BRANCH OVERVIEW (FOR BRANCH ADMIN) */}
        {activeAdminTab === 'branch-overview' && currentUser?.role === ROLES.BRANCH_ADMIN && (
          <MasterFinancialView
            orders={orders.filter(o => (o.branchId || 'ariquemes') === (currentUser?.branchId || 'ariquemes'))}
            branches={branchesList.filter(b => b.id === (currentUser?.branchId || 'ariquemes'))}
            onNavigateToBranchMenu={() => setActiveAdminTab('menu')}
            onNavigateToBranchKitchen={() => setActiveAdminTab('kds')}
          />
        )}

        {/* VIEW 0C: BRANCHES MANAGEMENT (SUPER ADMIN) */}
        {activeAdminTab === 'branches' && currentUser?.role === ROLES.SUPER_ADMIN && (
          <BranchManagementView
            branches={branchesList}
            onRefreshBranches={() => setBranchesList(getStoredBranches())}
            onNavigateToBranchMenu={(bId) => {
              setMasterBranchFilter(bId);
              setActiveAdminTab('menu');
            }}
            onNavigateToBranchKitchen={(bId) => {
              setMasterBranchFilter(bId);
              setActiveAdminTab('kds');
            }}
          />
        )}

        {/* VIEW 0D: USERS MANAGEMENT (SUPER ADMIN) */}
        {activeAdminTab === 'users' && currentUser?.role === ROLES.SUPER_ADMIN && (
          <UserManagementView
            branches={branchesList}
            currentUser={currentUser}
            onRefreshUsers={() => {}}
          />
        )}
        
        {/* ============================================================== */}
        {/* VIEW 1: KITCHEN DISPLAY SYSTEM (KDS) & ORDERS FEED             */}
        {/* ============================================================== */}
        {activeAdminTab === 'kds' && (
          <div className="space-y-5 animate-fade-in">

            {/* Operational Status Strip (Compact, Clean & Fast) */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-dark-900 border border-dark-800 shadow-md">
              
              {/* Order Flow Counts */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-950 border border-dark-800">
                  <span className="text-slate-400">Total na Fila:</span>
                  <span className="font-black text-white">{activeOrdersList.length}</span>
                </div>
                
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <span>Pendentes:</span>
                  <span className="font-bold">{pendingCount}</span>
                </div>
                
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-gold/10 border border-brand-gold/30 text-brand-gold">
                  <span>No Forno:</span>
                  <span className="font-bold">{inPrepCount}</span>
                </div>
                
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <span>Em Entrega:</span>
                  <span className="font-bold">{inDeliveryCount}</span>
                </div>

                {delayedCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 font-bold animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Atrasados (+35m): {delayedCount}</span>
                  </div>
                )}
              </div>

              {/* WhatsApp Quick Status & Auto-Notify & Buffet Pause Shortcut */}
              <div className="flex items-center gap-2">
                {currentBranch?.id === 'ariquemes' && (
                  <button
                    type="button"
                    onClick={() => setActiveAdminTab('buffet')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-brand-gold text-xs font-bold transition-colors cursor-pointer"
                    title="Acessar controle de pratos que acabaram no Buffet"
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Buffet: Pausar Pratos</span>
                    {unavailableBuffetIds.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-black text-[10px]">
                        {unavailableBuffetIds.length} pausados
                      </span>
                    )}
                  </button>
                )}
                {currentUser?.role !== ROLES.KITCHEN ? (
                  <button
                    type="button"
                    onClick={() => setActiveAdminTab('whatsapp')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-colors cursor-pointer"
                    title="Clique para gerenciar a conexão do WhatsApp desta filial"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>WhatsApp: <strong>{currentBranch?.phoneFormatted || '(69) 99222-8682'}</strong></span>
                  </button>
                ) : (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold select-none"
                    title="WhatsApp da filial ativo para envio de status"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>WhatsApp: <strong>{currentBranch?.phoneFormatted || '(69) 99222-8682'}</strong></span>
                  </div>
                )}

                {currentUser?.role !== ROLES.KITCHEN ? (
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !whatsAppSettings.autoNotify;
                      const updated = { ...whatsAppSettings, autoNotify: nextState };
                      setWhatsAppSettings(updated);
                      saveWhatsAppSettings(updated);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      whatsAppSettings.autoNotify
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-dark-800 text-slate-400 border border-dark-750'
                    }`}
                    title="Ativar ou pausar envio automático de mensagens no WhatsApp do cliente"
                  >
                    {whatsAppSettings.autoNotify ? '🔔 Avisos: ON' : '🔕 Avisos: OFF'}
                  </button>
                ) : (
                  <div
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold select-none ${
                      whatsAppSettings.autoNotify
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-dark-800 text-slate-400 border border-dark-750'
                    }`}
                    title="Avisos automáticos de status via WhatsApp"
                  >
                    {whatsAppSettings.autoNotify ? '🔔 Avisos: ON' : '🔕 Avisos: OFF'}
                  </div>
                )}
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

                {/* Right controls: Auto-Aba Toggle & Search input */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={toggleAutoFollowTab}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                      autoFollowTab 
                        ? 'bg-brand-gold/15 text-brand-gold border-brand-gold/40 hover:bg-brand-gold/25' 
                        : 'bg-dark-850 text-slate-400 border-dark-750 hover:bg-dark-800'
                    }`}
                    title="Quando ativado, a tela abre automaticamente a aba do novo status do pedido sempre que você avançar ou mudar seu status"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${autoFollowTab ? 'text-brand-gold' : 'text-slate-400'}`} />
                    <span>Auto-Mudar Aba: <strong>{autoFollowTab ? 'ATIVO' : 'OFF'}</strong></span>
                  </button>

                  <div className="relative w-full sm:w-60">
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
            </div>

            {/* Orders Feed */}
            <div className="space-y-4">

              {/* Status Change Toast Banner */}
              {statusChangeToast && (
                <div className="p-3 rounded-2xl bg-brand-gold/15 border border-brand-gold/40 text-brand-gold text-xs font-bold flex items-center justify-between gap-3 animate-fade-in shadow-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-gold animate-bounce" />
                    <span>
                      Pedido <strong>#{statusChangeToast.orderId}</strong> movido para a aba <strong>{statusChangeToast.tabLabel}</strong>!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStatusChangeToast(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Mostrando <strong>{filteredOrders.length}</strong> pedidos</span>
                <div className="flex items-center gap-3">
                  {orders.length > 0 && onClearAllOrders && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("⚠️ ATENÇÃO: Deseja realmente excluir permanentemente TODOS os pedidos do banco de dados e do painel?")) {
                          onClearAllOrders();
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Excluir permanentemente todos os pedidos"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Limpar Todos</span>
                    </button>
                  )}
                  <span className="flex items-center gap-1 text-[11px] text-brand-gold">
                    <RefreshCw className="w-3 h-3 animate-spin-slow" />
                    Sincronização em tempo real ativa
                  </span>
                </div>
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
                    const currentStatus = normalizeOrderStatus(order);
                    const isCancelled = currentStatus === 'CANCELADO';
                    const isPaid = order.paymentStatus === 'PAGO_APROVADO';
                    const isHighlighted = highlightedOrderId === order.orderId;

                    return (
                      <div
                        key={order.orderId}
                        className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 shadow-md ${
                          isHighlighted
                            ? 'bg-brand-gold/15 border-brand-gold ring-2 ring-brand-gold shadow-glow-gold scale-[1.01]'
                            : isCancelled
                            ? 'bg-red-950/15 border-red-900/50 opacity-80'
                            : isDelayed
                            ? 'bg-red-950/20 border-red-500/60 ring-1 ring-red-500/40'
                            : currentStatus === 'CONCLUIDO'
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

                                {/* Status Selector Pill in Header */}
                                {!isCancelled ? (
                                  <div className="relative inline-flex items-center">
                                    <select
                                      value={currentStatus}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'CANCELADO') {
                                          setCancelModalOrder(order);
                                          setCancelReason('');
                                        } else {
                                          handleUpdateStatusAndTab(order, val);
                                        }
                                      }}
                                      className={`text-[10px] font-black rounded-lg px-2 py-0.5 border cursor-pointer transition-all focus:outline-none focus:ring-1 ${
                                        currentStatus === 'RECEBIDO_COZINHA'
                                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                                          : currentStatus === 'EM_PREPARO'
                                          ? 'bg-brand-gold/25 border-brand-gold/50 text-brand-gold hover:bg-brand-gold/35'
                                          : currentStatus === 'SAIU_ENTREGA'
                                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 hover:bg-blue-500/30'
                                          : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                                      }`}
                                      title="Alterar status deste pedido e mover para a aba correspondente"
                                    >
                                      <option value="RECEBIDO_COZINHA" className="bg-dark-950 text-amber-300">🟡 Na Fila (Pendente)</option>
                                      <option value="EM_PREPARO" className="bg-dark-950 text-brand-gold">🔥 No Forno (Preparo)</option>
                                      {order.deliveryType === 'balcao' ? (
                                        <option value="CONCLUIDO" className="bg-dark-950 text-emerald-300">📦 Pronto no Balcão</option>
                                      ) : (
                                        <>
                                          <option value="SAIU_ENTREGA" className="bg-dark-950 text-blue-300">🛵 Saiu p/ Entrega</option>
                                          <option value="CONCLUIDO" className="bg-dark-950 text-emerald-300">✅ Entregue (Finalizado)</option>
                                        </>
                                      )}
                                      <option value="CANCELADO" className="bg-dark-950 text-red-400">❌ Cancelar Pedido...</option>
                                    </select>
                                  </div>
                                ) : null}

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

                          {/* Interactive Status Flow Stepper / Pipeline */}
                          {!isCancelled ? (
                            <div className="bg-dark-950/90 p-2 sm:p-2.5 rounded-xl border border-dark-850 my-2 space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-0.5">
                                <span className="flex items-center gap-1 text-slate-300">
                                  <Sliders className="w-3 h-3 text-brand-gold" />
                                  <span>FLUXO DO PEDIDO (CLIQUE P/ MUDAR):</span>
                                </span>
                                <span className="text-[10px] text-brand-goldLight font-bold">
                                  {currentStatus === 'RECEBIDO_COZINHA' && '🟡 1. Na Fila'}
                                  {currentStatus === 'EM_PREPARO' && '🔥 2. No Forno'}
                                  {currentStatus === 'SAIU_ENTREGA' && '🛵 3. Em Rota'}
                                  {currentStatus === 'CONCLUIDO' && (order.deliveryType === 'balcao' ? '📦 3. No Balcão' : '✅ 4. Concluído')}
                                </span>
                              </div>

                              <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                                {/* 1. Pendente */}
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatusAndTab(order, 'RECEBIDO_COZINHA')}
                                  className={`py-1.5 px-1 rounded-lg text-[11px] font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                                    currentStatus === 'RECEBIDO_COZINHA'
                                      ? 'bg-amber-500 text-dark-950 font-black shadow-sm ring-1 ring-amber-400 scale-[1.02]'
                                      : 'bg-dark-900 hover:bg-dark-850 text-slate-400 hover:text-amber-300 border border-dark-800'
                                  }`}
                                  title="Mover de volta para Pendente (Fila)"
                                >
                                  <Clock className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">1. Pendente</span>
                                </button>

                                {/* 2. No Forno */}
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatusAndTab(order, 'EM_PREPARO')}
                                  className={`py-1.5 px-1 rounded-lg text-[11px] font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                                    currentStatus === 'EM_PREPARO'
                                      ? 'bg-brand-gold text-dark-950 font-black shadow-sm ring-1 ring-amber-300 scale-[1.02]'
                                      : 'bg-dark-900 hover:bg-dark-850 text-slate-400 hover:text-brand-gold border border-dark-800'
                                  }`}
                                  title="Mover para No Forno (Em Preparo)"
                                >
                                  <Flame className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">2. No Forno</span>
                                </button>

                                {/* 3. Saiu Entrega / Balcão */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (order.deliveryType === 'balcao') {
                                      handleUpdateStatusAndTab(order, 'CONCLUIDO');
                                    } else {
                                      handleUpdateStatusAndTab(order, 'SAIU_ENTREGA');
                                    }
                                  }}
                                  className={`py-1.5 px-1 rounded-lg text-[11px] font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                                    currentStatus === 'SAIU_ENTREGA' || (order.deliveryType === 'balcao' && currentStatus === 'CONCLUIDO')
                                      ? 'bg-blue-500 text-white font-black shadow-sm ring-1 ring-blue-400 scale-[1.02]'
                                      : 'bg-dark-900 hover:bg-dark-850 text-slate-400 hover:text-blue-300 border border-dark-800'
                                  }`}
                                  title={order.deliveryType === 'balcao' ? 'Marcar Pronto no Balcão' : 'Mover para Saiu para Entrega'}
                                >
                                  {order.deliveryType === 'balcao' ? (
                                    <Store className="w-3 h-3 flex-shrink-0" />
                                  ) : (
                                    <Bike className="w-3 h-3 flex-shrink-0" />
                                  )}
                                  <span className="truncate">{order.deliveryType === 'balcao' ? '3. Balcão' : '3. Entrega'}</span>
                                </button>

                                {/* 4. Concluído */}
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatusAndTab(order, 'CONCLUIDO')}
                                  className={`py-1.5 px-1 rounded-lg text-[11px] font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                                    currentStatus === 'CONCLUIDO'
                                      ? 'bg-emerald-500 text-dark-950 font-black shadow-sm ring-1 ring-emerald-400 scale-[1.02]'
                                      : 'bg-dark-900 hover:bg-dark-850 text-slate-400 hover:text-emerald-300 border border-dark-800'
                                  }`}
                                  title="Marcar como Concluído / Finalizado"
                                >
                                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">4. Concluído</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-red-950/40 p-2.5 rounded-xl border border-red-500/40 my-2 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                                <XCircle className="w-4 h-4 flex-shrink-0" />
                                <span>Pedido Cancelado: {order.cancelReason || 'Sem motivo'}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatusAndTab(order, 'RECEBIDO_COZINHA')}
                                className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white text-[11px] font-bold border border-red-400/40 cursor-pointer flex items-center gap-1 transition-colors"
                                title="Reativar pedido cancelado e mover de volta para a fila da cozinha"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reativar Pedido</span>
                              </button>
                            </div>
                          )}

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
                            
                            {/* Direct Dropdown Status Selector */}
                            {!isCancelled && (
                              <div className="relative inline-flex items-center">
                                <select
                                  value={currentStatus}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'CANCELADO') {
                                      setCancelModalOrder(order);
                                      setCancelReason('');
                                    } else {
                                      handleUpdateStatusAndTab(order, val);
                                    }
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-200 border border-dark-700 text-xs font-bold cursor-pointer transition-colors focus:outline-none focus:border-brand-gold"
                                  title="Alterar status do pedido diretamente"
                                >
                                  <option value="RECEBIDO_COZINHA">🟡 1. Mover p/ Pendente</option>
                                  <option value="EM_PREPARO">🔥 2. Mover p/ No Forno</option>
                                  {order.deliveryType === 'balcao' ? (
                                    <option value="CONCLUIDO">📦 3. Mover p/ Pronto Balcão</option>
                                  ) : (
                                    <>
                                      <option value="SAIU_ENTREGA">🛵 3. Mover p/ Saiu Entrega</option>
                                      <option value="CONCLUIDO">✅ 4. Mover p/ Entregue</option>
                                    </>
                                  )}
                                  <option value="CANCELADO">❌ Cancelar Pedido...</option>
                                </select>
                              </div>
                            )}

                            {!isCancelled && currentStatus === 'RECEBIDO_COZINHA' && (
                              <button
                                onClick={() => handleUpdateStatusAndTab(order, 'EM_PREPARO')}
                                className="px-3 py-1.5 rounded-xl bg-brand-gold hover:bg-amber-400 text-dark-950 font-bold text-xs flex items-center gap-1 shadow-glow-gold transition-all cursor-pointer"
                              >
                                <Flame className="w-3.5 h-3.5" />
                                <span>Mover p/ Forno</span>
                              </button>
                            )}

                            {!isCancelled && currentStatus === 'EM_PREPARO' && (
                              <button
                                onClick={() => {
                                  if (order.deliveryType === 'balcao') {
                                    handleUpdateStatusAndTab(order, 'CONCLUIDO');
                                  } else {
                                    handleUpdateStatusAndTab(order, 'SAIU_ENTREGA');
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

                            {!isCancelled && currentStatus === 'SAIU_ENTREGA' && (
                              <button
                                onClick={() => handleUpdateStatusAndTab(order, 'CONCLUIDO')}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-bold text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Marcar Entregue</span>
                              </button>
                            )}

                            {!isCancelled && currentStatus === 'CONCLUIDO' && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Concluído</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatusAndTab(order, 'EM_PREPARO')}
                                  className="text-[11px] text-slate-400 hover:text-brand-gold underline px-1 py-0.5 cursor-pointer"
                                  title="Reabrir pedido e voltar para No Forno se precisar refazer"
                                >
                                  Reabrir
                                </button>
                              </div>
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
        {activeAdminTab === 'pdv' && currentUser?.role !== ROLES.KITCHEN && (
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

              <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomerDirectoryOpen(true);
                    setCustomerDirectorySearch('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-dark-950 hover:bg-dark-800 text-brand-gold border border-brand-gold/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title="Ver clientes cadastrados a partir dos pedidos"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Cadastros ({getAllCustomers().length})</span>
                </button>

                {pdvCart.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-950 border border-dark-800">
                    <span className="text-xs text-slate-400">Total:</span>
                    <span className="text-sm font-black text-brand-gold">
                      R$ {pdvCartTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}
              </div>
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
                        onClick={() => prod.isPizzaCustomizer ? setPdvPizzaToCustomize(prod) : handleAddProductToPDV(prod, 1)}
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
                            {item.description && (
                              <div className="text-[10px] text-slate-400 truncate">{item.description}</div>
                            )}
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

                    <div className="relative">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="relative">
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[10px] text-slate-400 block">Nome do Cliente *</label>
                            <span className="text-[9px] text-brand-gold font-medium flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> Auto-completar
                            </span>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Digite o nome..."
                              value={pdvCustomerName}
                              onChange={handleCustomerNameChange}
                              onFocus={() => {
                                if (pdvCustomerName.trim().length >= 2) {
                                  const matches = searchCustomers(pdvCustomerName);
                                  setCustomerSuggestions(matches);
                                  setIsCustomerSuggestionsOpen(matches.length > 0);
                                }
                              }}
                              className="w-full px-3 py-1.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-gold pr-7"
                            />
                            {pdvCustomerName && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPdvCustomerName('');
                                  setCustomerSuggestions([]);
                                  setIsCustomerSuggestionsOpen(false);
                                  setActiveAutoCompletedCustomer(null);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="relative">
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[10px] text-slate-400 block">WhatsApp / Celular</label>
                            <span className="text-[9px] text-slate-500">Busca por número</span>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="(69) 99999-9999"
                              value={pdvCustomerPhone}
                              onChange={handleCustomerPhoneChange}
                              onFocus={() => {
                                if (pdvCustomerPhone.trim().length >= 2) {
                                  const matches = searchCustomers(pdvCustomerPhone);
                                  setCustomerSuggestions(matches);
                                  setIsCustomerSuggestionsOpen(matches.length > 0);
                                }
                              }}
                              className="w-full px-3 py-1.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-gold pr-7"
                            />
                            {pdvCustomerPhone && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPdvCustomerPhone('');
                                  setCustomerSuggestions([]);
                                  setIsCustomerSuggestionsOpen(false);
                                  setActiveAutoCompletedCustomer(null);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dropdown de Sugestões de Clientes Cadastrados */}
                      {isCustomerSuggestionsOpen && customerSuggestions.length > 0 && (
                        <div className="relative z-50">
                          <div 
                            className="fixed inset-0" 
                            onClick={() => setIsCustomerSuggestionsOpen(false)} 
                          />
                          <div className="absolute top-1 left-0 right-0 bg-dark-900 border border-brand-gold/50 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-dark-800">
                            <div className="p-2 bg-dark-950 flex items-center justify-between text-[11px] text-slate-400">
                              <span className="font-bold text-white flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-brand-gold" />
                                Clientes Encontrados ({customerSuggestions.length})
                              </span>
                              <span className="text-[10px] text-brand-gold">Clique para preencher tudo</span>
                            </div>
                            <div className="max-h-56 overflow-y-auto">
                              {customerSuggestions.map((cust) => (
                                <button
                                  key={cust.id || cust.key}
                                  type="button"
                                  onClick={() => handleSelectCustomer(cust)}
                                  className="w-full p-2.5 text-left hover:bg-brand-gold/10 transition-colors flex items-center justify-between gap-2 group cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-full bg-brand-gold/20 text-brand-gold font-black text-xs flex items-center justify-center shrink-0 border border-brand-gold/30">
                                      {(cust.name || 'C').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-xs text-white group-hover:text-brand-gold transition-colors truncate">
                                          {cust.name}
                                        </span>
                                        <span className="px-1.5 py-0.2 rounded-full bg-dark-800 text-brand-gold text-[9px] font-bold border border-brand-gold/20 shrink-0">
                                          {cust.ordersCount || 1} {(cust.ordersCount || 1) === 1 ? 'pedido' : 'pedidos'}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-400 flex items-center gap-2 truncate">
                                        {cust.phoneFormatted || cust.phone ? (
                                          <span className="text-slate-300 font-mono text-[10px]">
                                            {cust.phoneFormatted || cust.phone}
                                          </span>
                                        ) : null}
                                        {(cust.street || cust.address) ? (
                                          <span>• 📍 {cust.district || ''} - {cust.street || cust.address}{cust.number ? `, Nº ${cust.number}` : ''}</span>
                                        ) : (
                                          <span>• 🛍️ Preferência Balcão</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <span className="inline-block px-2 py-0.5 rounded bg-brand-gold/20 text-brand-gold text-[10px] font-bold group-hover:bg-brand-gold group-hover:text-dark-950 transition-colors shrink-0">
                                    Preencher ↵
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Badge de Cliente Vinculado */}
                      {activeAutoCompletedCustomer && (
                        <div className="mt-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="truncate">
                              Perfil vinculado: <b>{activeAutoCompletedCustomer.name}</b> • {activeAutoCompletedCustomer.ordersCount || 1} pedidos anteriores
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveAutoCompletedCustomer(null);
                              setPdvCustomerName('');
                              setPdvCustomerPhone('');
                              setPdvAddress('');
                              setPdvNumber('');
                              setPdvReference('');
                            }}
                            className="text-[10px] text-slate-400 hover:text-white underline shrink-0 cursor-pointer"
                          >
                            Limpar
                          </button>
                        </div>
                      )}
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

                      {(pdvPaymentMethod === 'debito' || pdvPaymentMethod === 'credito') && (
                        <div className="pt-1 space-y-1.5">
                          {restaurantSettings.cardMachineNoticeActive !== false && restaurantSettings.cardMachineNotice && (
                            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                              <span className="leading-tight">{restaurantSettings.cardMachineNotice}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveAdminTab('menu');
                              setMenuSubTab('card-fee');
                            }}
                            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Configurar / Alterar Valores da Taxa da Maquininha ⚙️</span>
                          </button>
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
        {/* VIEW 3: CARDÁPIO (PRODUTOS & SABORES) / CONFIGURAÇÕES DA FILIAL */}
        {/* ============================================================== */}
        {(activeAdminTab === 'menu' || activeAdminTab === 'settings') && currentUser?.role !== ROLES.KITCHEN && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Header Box */}
            <div className="bg-dark-900 border border-dark-800 rounded-3xl p-5 sm:p-7 shadow-xl">
              
              {activeAdminTab === 'settings' ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-dark-800">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-brand-gold/15 text-brand-gold flex items-center justify-center border border-brand-gold/30">
                      <Settings2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-display font-extrabold text-base sm:text-lg text-white">
                        Configurações da {currentBranch?.name || 'Filial'}
                      </h2>
                      <p className="text-xs text-slate-400">
                        Ajuste taxas de cartão da maquininha, dados de contato e endereço da unidade, e promoções.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveAdminTab('menu')}
                    className="px-3.5 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Utensils className="w-3.5 h-3.5 text-brand-gold" />
                    <span>Voltar ao Cardápio &rarr;</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-dark-800">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-brand-gold/15 text-brand-gold flex items-center justify-center border border-brand-gold/30">
                      <Utensils className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-display font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                        <span>Cardápio & Preços da {currentBranch?.name || 'Filial'}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold border border-brand-gold/30 font-bold">
                          {menuSubTab === 'flavors' ? `${pizzaFlavors.length} sabores` : `${productsList.length} itens`}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400">
                        Crie novos itens, edite preços de pizzas e sabores individuais, pause produtos esgotados.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {menuSubTab === 'flavors' ? (
                      <>
                        <button
                          type="button"
                          onClick={handleOpenCreateFlavor}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black text-xs hover:brightness-110 shadow-glow-gold flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>+ Novo Sabor de Pizza</span>
                        </button>

                        {pizzaFlavors.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearAllFlavors}
                            className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-white text-xs font-semibold border border-rose-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Apagar todos os sabores de pizza para cadastrar os seus"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Apagar Todos os Sabores</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleResetFlavorsToDefault}
                          className="px-3 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white text-xs font-semibold border border-dark-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Restaurar os sabores padrão de pizza"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-brand-gold" />
                          <span>Restaurar Sabores Padrão</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleOpenCreateProduct}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black text-xs hover:brightness-110 shadow-glow-gold flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>+ Criar Novo Produto</span>
                        </button>

                        {productsList.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearAllProducts}
                            className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-white text-xs font-semibold border border-rose-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Apagar todos os produtos para cadastrar os seus"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Apagar Todos os Produtos</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleResetMenuToDefault}
                          className="px-3 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white text-xs font-semibold border border-dark-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Restaurar o cardápio original"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-brand-gold" />
                          <span>Restaurar Padrão</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Toast Feedback */}
              {menuFeedback && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{menuFeedback}</span>
                </div>
              )}

              {/* Sub-tabs Dinâmicas (Cardápio ou Configurações) */}
              {activeAdminTab === 'settings' ? (
                <div className="flex items-center gap-2 mt-5 border-b border-dark-800 pb-3 overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('card-fee')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      settingsSubTab === 'card-fee'
                        ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                        : 'bg-dark-800/80 text-slate-400 hover:text-white hover:bg-dark-800'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                    <span>💳 Taxa da Maquininha</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('store')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      settingsSubTab === 'store'
                        ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                        : 'bg-dark-800/80 text-slate-400 hover:text-white hover:bg-dark-800'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>🏪 Dados da Loja</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('promos')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      settingsSubTab === 'promos'
                        ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                        : 'bg-dark-800/80 text-slate-400 hover:text-white hover:bg-dark-800'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>🏷️ Promoções & Cupons</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 mt-5 border-b border-dark-800 pb-3 flex-wrap">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
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
                      onClick={() => setMenuSubTab('flavors')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        menuSubTab === 'flavors'
                          ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                          : 'bg-dark-800/80 text-slate-400 hover:text-white hover:bg-dark-800'
                      }`}
                    >
                      <Pizza className="w-3.5 h-3.5" />
                      <span>Sabores de Pizza ({pizzaFlavors.length})</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveAdminTab('settings');
                      setSettingsSubTab('card-fee');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Configurar taxa da maquininha, dados da loja e cupons"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-brand-gold" />
                    <span>Configurações da Filial (Taxas / Loja) &rarr;</span>
                  </button>
                </div>
              )}

              {/* SUBTAB 1: PRODUTOS & PREÇOS */}
              {activeAdminTab === 'menu' && menuSubTab === 'products' && (
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
                      <span>de {scopedProductsList.length} itens</span>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setMenuCategoryFilter('todos')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        menuCategoryFilter === 'todos'
                          ? 'bg-brand-gold text-dark-950 font-black'
                          : 'bg-dark-800 text-slate-300 hover:bg-dark-750 hover:text-white'
                      }`}
                    >
                      Todos ({scopedProductsList.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setMenuCategoryFilter('destaques')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                        menuCategoryFilter === 'destaques'
                          ? 'bg-brand-gold text-dark-950 font-black'
                          : 'bg-dark-800 text-brand-gold hover:bg-dark-750'
                      }`}
                    >
                      <Star className={`w-3 h-3 ${menuCategoryFilter === 'destaques' ? 'fill-dark-950 text-dark-950' : 'fill-brand-gold text-brand-gold'}`} />
                      <span>Destaques da Casa ({scopedProductsList.filter(p => p.isHighlight || p.isPromo).length})</span>
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
                      <span>Em Promoção ({scopedProductsList.filter(p => p.isPromo || p.originalPrice).length})</span>
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
                      <span>Pausados/Esgotados ({scopedProductsList.filter(p => p.isAvailable === false).length})</span>
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
                        {cat.name} ({scopedProductsList.filter(p => p.categoryId === cat.id).length})
                      </button>
                    ))}
                  </div>

                  {/* Banner de Controle Rápido de Borda Grátis para Pizzas */}
                  {menuCategoryFilter === 'pizzas' && (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-brand-gold/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 my-2 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">🧀</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-extrabold text-white">Promoção de Borda Grátis nas Pizzas</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              scopedProductsList.filter(p => p.categoryId === 'pizzas').every(p => p.bordaGratis)
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : scopedProductsList.filter(p => p.categoryId === 'pizzas').some(p => p.bordaGratis)
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                : 'bg-dark-900 text-slate-400 border border-dark-700'
                            }`}>
                              {scopedProductsList.filter(p => p.categoryId === 'pizzas').every(p => p.bordaGratis)
                                ? 'Ativa em Todas'
                                : scopedProductsList.filter(p => p.categoryId === 'pizzas').some(p => p.bordaGratis)
                                ? 'Ativa em Algumas'
                                : 'Desativada'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            Ative ou desative o Catupiry Grátis em todas as pizzas do delivery instantaneamente:
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSetAllPizzasBordaGratis(true)}
                          className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-dark-950 font-black text-xs transition-transform active:scale-95 cursor-pointer shadow-sm"
                        >
                          🧀 Ativar em Todas
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetAllPizzasBordaGratis(false)}
                          className="px-3 py-1.5 rounded-xl bg-dark-900 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700 text-xs font-bold transition-transform active:scale-95 cursor-pointer"
                        >
                          Desativar de Todas
                        </button>
                      </div>
                    </div>
                  )}

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
                          className={`rounded-2xl p-3.5 bg-dark-800/80 border transition-all flex flex-col justify-between gap-3 overflow-hidden ${
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
                                {product.isHighlight && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-black uppercase bg-brand-gold text-dark-950 flex items-center gap-0.5 shadow-sm">
                                    <Star className="w-2.5 h-2.5 fill-dark-950 text-dark-950" />
                                    <span>Destaque</span>
                                  </span>
                                )}
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
                          <div className="pt-2.5 border-t border-dark-700/80 space-y-2">
                            {/* Linha 1: Status e Toggles Rápidos */}
                            <div className="flex flex-wrap items-center gap-1.5">
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

                              {/* Toggle Highlight */}
                              <button
                                type="button"
                                onClick={() => handleToggleProductHighlight(product.id)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                  product.isHighlight
                                    ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/40 hover:bg-brand-gold/30'
                                    : 'bg-dark-900 text-slate-400 hover:text-brand-gold hover:bg-dark-750 border border-dark-700/60'
                                }`}
                                title="Adicionar ou remover da vitrine 'Destaques da Casa' no topo do delivery"
                              >
                                <Star className={`w-3 h-3 ${product.isHighlight ? 'fill-brand-gold text-brand-gold' : ''}`} />
                                <span>{product.isHighlight ? 'Destaque' : '+ Destaque'}</span>
                              </button>

                              {/* Toggle Promo */}
                              <button
                                type="button"
                                onClick={() => handleToggleProductPromo(product.id)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                  hasPromo
                                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400/30'
                                    : 'bg-dark-900 text-slate-400 hover:text-amber-300 hover:bg-dark-750 border border-dark-700/60'
                                }`}
                                title="Ativar ou desativar selo promocional"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>{hasPromo ? 'Promoção' : '+ Promo'}</span>
                              </button>

                              {/* Toggle Borda Grátis para Pizzas e Combos */}
                              {(product.categoryId === 'pizzas' || product.isPizzaCustomizer || product.categoryId === 'combos') && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductBordaGratis(product.id)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                    product.bordaGratis
                                      ? 'bg-amber-400 text-dark-950 font-black shadow-sm hover:bg-amber-300'
                                      : 'bg-dark-900 text-slate-400 hover:text-amber-300 hover:bg-dark-750 border border-dark-700/60'
                                  }`}
                                  title={product.bordaGratis ? 'Borda de Catupiry Grátis ativa! Clique para desativar' : 'Sem borda grátis. Clique para ativar'}
                                >
                                  <span>🧀</span>
                                  <span>{product.bordaGratis ? 'Borda Grátis' : 'Sem Borda'}</span>
                                </button>
                              )}
                            </div>

                            {/* Linha 2: Ações de Gestão (Duplicar, Excluir, Editar) */}
                            <div className="pt-2 border-t border-dark-700/50 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                {/* Duplicate */}
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateProduct(product)}
                                  className="px-2.5 py-1.5 rounded-lg bg-dark-900 hover:bg-dark-750 text-slate-400 hover:text-white border border-dark-700/80 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Duplicar produto"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Duplicar</span>
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(product.id, product.name)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-200 border border-rose-500/20 transition-colors cursor-pointer"
                                  title="Excluir produto do cardápio"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditProduct(product)}
                                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 hover:brightness-110 text-dark-950 font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                                title="Editar produto completo"
                              >
                                <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Editar</span>
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

              {/* SUBTAB: SABORES DE PIZZA & PRECIFICAÇÃO */}
              {activeAdminTab === 'menu' && menuSubTab === 'flavors' && (
                <div className="mt-5 space-y-5">
                  {/* Informational Callout Box explaining the rule */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-brand-gold/15 to-amber-500/10 border border-brand-gold/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 text-brand-gold flex items-center justify-center border border-brand-gold/30 flex-shrink-0 mt-0.5">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                          <span>Regra do Maior Valor Ativa</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold font-bold border border-brand-gold/30">
                            Automático
                          </span>
                        </h3>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          Ao montar uma pizza (ex: Família ou Gigante), o sistema puxa automaticamente para o <strong>MAIOR valor</strong> entre os sabores selecionados. Sabores com valor igual ou inferior ao preço base da pizza não geram acréscimo. Se o cliente escolher um sabor mais caro (ex: R$ 45, R$ 55, R$ 120), a pizza será cobrada por esse maior valor!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Buscar sabor por nome ou ingredientes..."
                        value={flavorSearch}
                        onChange={(e) => setFlavorSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>Exibindo:</span>
                      <span className="font-mono text-brand-gold font-bold">{filteredAdminFlavors.length}</span>
                      <span>de {pizzaFlavors.length} sabores</span>
                    </div>
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setFlavorCategoryFilter('todos')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        flavorCategoryFilter === 'todos'
                          ? 'bg-brand-gold text-dark-950 font-black'
                          : 'bg-dark-800 text-slate-300 hover:bg-dark-750 hover:text-white'
                      }`}
                    >
                      Todos ({pizzaFlavors.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlavorCategoryFilter('salgadas')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        flavorCategoryFilter === 'salgadas'
                          ? 'bg-brand-gold text-dark-950 font-black'
                          : 'bg-dark-800 text-slate-300 hover:bg-dark-750 hover:text-white'
                      }`}
                    >
                      Salgadas Tradicionais ({pizzaFlavors.filter(f => (f.category || 'salgadas') === 'salgadas').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlavorCategoryFilter('especiais')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        flavorCategoryFilter === 'especiais'
                          ? 'bg-amber-400 text-dark-950 font-black'
                          : 'bg-dark-800 text-amber-300 hover:bg-dark-750'
                      }`}
                    >
                      Especiais & Nobres ⭐ ({pizzaFlavors.filter(f => f.category === 'especiais').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlavorCategoryFilter('doces')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        flavorCategoryFilter === 'doces'
                          ? 'bg-pink-400 text-dark-950 font-black'
                          : 'bg-dark-800 text-pink-300 hover:bg-dark-750'
                      }`}
                    >
                      Doces 🍫 ({pizzaFlavors.filter(f => f.category === 'doces').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlavorCategoryFilter('pausados')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        flavorCategoryFilter === 'pausados'
                          ? 'bg-red-500 text-white font-black'
                          : 'bg-dark-800 text-red-400 hover:bg-dark-750'
                      }`}
                    >
                      Esgotados / Pausados ({pizzaFlavors.filter(f => f.isAvailable === false).length})
                    </button>
                  </div>

                  {/* Flavors Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {filteredAdminFlavors.map(flavor => {
                      const isAvailable = flavor.isAvailable !== false;
                      const priceNum = Number(flavor.price) || 0;

                      return (
                        <div
                          key={flavor.id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 overflow-hidden ${
                            !isAvailable
                              ? 'bg-dark-950/60 border-dark-800/80 opacity-60'
                              : 'bg-dark-850 border-dark-750 hover:border-brand-gold/40 shadow-sm'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="text-sm font-extrabold text-white leading-snug">
                                {flavor.name}
                              </h4>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                                flavor.category === 'especiais'
                                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                  : flavor.category === 'doces'
                                  ? 'bg-pink-400/20 text-pink-300 border border-pink-400/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}>
                                {flavor.category === 'especiais' ? 'Especial ⭐' : flavor.category === 'doces' ? 'Doce 🍫' : 'Tradicional'}
                              </span>
                            </div>

                            {/* Preço do Sabor */}
                            <div className="flex items-baseline gap-1.5 my-1.5">
                              <span className="text-xs font-bold text-slate-400">Preço do Sabor:</span>
                              <span className="text-lg font-black text-brand-gold">
                                R$ {priceNum.toFixed(2).replace('.', ',')}
                              </span>
                            </div>

                            {flavor.description && (
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                {flavor.description}
                              </p>
                            )}
                          </div>

                          {/* Footer Actions */}
                          <div className="pt-3 border-t border-dark-800/80 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleFlavorAvailability(flavor.id)}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                isAvailable
                                  ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                              }`}
                              title={isAvailable ? 'Clique para pausar este sabor (esgotado)' : 'Clique para reativar este sabor'}
                            >
                              {isAvailable ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              <span>{isAvailable ? 'Disponível' : 'Esgotado'}</span>
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditFlavor(flavor)}
                                className="p-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-brand-gold transition-colors cursor-pointer"
                                title="Editar nome, preço ou ingredientes"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteFlavor(flavor.id)}
                                className="p-2 rounded-xl bg-dark-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                                title="Excluir sabor"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {filteredAdminFlavors.length === 0 && (
                    <div className="p-8 text-center bg-dark-850 rounded-2xl border border-dark-800 text-slate-400 text-xs">
                      Nenhum sabor encontrado para o filtro atual.
                      <button
                        type="button"
                        onClick={() => { setFlavorSearch(''); setFlavorCategoryFilter('todos'); }}
                        className="mt-3 block mx-auto px-3 py-1.5 rounded-xl bg-brand-gold text-dark-950 font-bold text-xs hover:bg-amber-400 cursor-pointer"
                      >
                        Limpar Filtros
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB: TAXA DA MAQUININHA */}
              {(activeAdminTab === 'settings' ? settingsSubTab === 'card-fee' : menuSubTab === 'card-fee') && (
                <div className="mt-5 space-y-6 max-w-4xl">
                  <div className="p-5 sm:p-6 rounded-2xl bg-dark-850 border border-dark-750 space-y-6">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-dark-800">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold shadow-glow-gold/10">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                            Definir Taxa da Maquininha de Cartão
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                              tempCardActive 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {tempCardActive ? 'Ativo no Cardápio' : 'Desativado'}
                            </span>
                          </h3>
                          <p className="text-xs text-slate-400">
                            Defina aqui a taxa que você cobra quando o cliente paga no cartão (Débito ou Crédito).
                          </p>
                        </div>
                      </div>

                      {/* Toggle Ativar / Desativar */}
                      <label className="flex items-center gap-2.5 cursor-pointer select-none bg-dark-950 px-4 py-2.5 rounded-xl border border-dark-750 self-start sm:self-auto">
                        <input
                          type="checkbox"
                          checked={tempCardActive}
                          onChange={(e) => setTempCardActive(e.target.checked)}
                          className="w-4 h-4 rounded text-brand-gold accent-brand-gold cursor-pointer"
                        />
                        <span className="text-xs font-bold text-white">
                          {tempCardActive ? 'Taxa Ativada' : 'Taxa Desativada'}
                        </span>
                      </label>
                    </div>

                    {/* Passo 1: Tipo de Cobrança */}
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-300">
                        1. Como você deseja cobrar a taxa da maquininha?
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: 'percentage', label: 'Porcentagem Geral (%)', desc: 'Aplica um % fixo no valor dos itens (ex: 3.5%)' },
                          { id: 'split', label: 'Débito e Crédito Separados', desc: 'Taxas diferentes para Débito e Crédito' },
                          { id: 'fixed', label: 'Valor Fixo em R$', desc: 'Adiciona um valor fixo (ex: R$ 2,00 por pedido)' }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setTempCardType(opt.id)}
                            className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                              tempCardType === opt.id
                                ? 'bg-brand-gold/15 border-brand-gold text-white shadow-sm ring-1 ring-brand-gold/30'
                                : 'bg-dark-950/80 border-dark-800 text-slate-400 hover:text-white hover:border-dark-700'
                            }`}
                          >
                            <div className="font-bold text-xs text-brand-gold mb-1">{opt.label}</div>
                            <div className="text-[11px] text-slate-400 leading-tight">{opt.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Passo 2: Valores da Taxa */}
                    <div className="p-4 rounded-xl bg-dark-950 border border-dark-800 space-y-4">
                      <label className="block text-xs font-bold text-slate-200">
                        2. Digite os Valores da sua Taxa:
                      </label>

                      {tempCardType === 'percentage' && (
                        <div className="max-w-xs">
                          <label className="block text-xs text-slate-400 mb-1">
                            Porcentagem da Taxa (%):
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={tempCardPercentage}
                              onChange={(e) => setTempCardPercentage(e.target.value)}
                              placeholder="Ex: 3.5"
                              className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-white font-mono text-base font-bold focus:outline-none focus:border-brand-gold"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 block">Exemplos: 3.0 ou 3.5 ou 4.99</span>
                        </div>
                      )}

                      {tempCardType === 'split' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              Taxa do Cartão de Débito (%):
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={tempCardDebit}
                                onChange={(e) => setTempCardDebit(e.target.value)}
                                placeholder="Ex: 2.0"
                                className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-white font-mono text-base font-bold focus:outline-none focus:border-brand-gold"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 block">Exemplo: 2.0%</span>
                          </div>

                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              Taxa do Cartão de Crédito (%):
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={tempCardCredit}
                                onChange={(e) => setTempCardCredit(e.target.value)}
                                placeholder="Ex: 4.5"
                                className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-white font-mono text-base font-bold focus:outline-none focus:border-brand-gold"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 block">Exemplo: 4.5%</span>
                          </div>
                        </div>
                      )}

                      {tempCardType === 'fixed' && (
                        <div className="max-w-xs">
                          <label className="block text-xs text-slate-400 mb-1">
                            Valor Fixo por Pedido (R$):
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                            <input
                              type="text"
                              value={tempCardFixed}
                              onChange={(e) => setTempCardFixed(e.target.value)}
                              placeholder="Ex: 2.00"
                              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-white font-mono text-base font-bold focus:outline-none focus:border-brand-gold"
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 block">Exemplo: 2.00 ou 3.00 fixos por pedido</span>
                        </div>
                      )}

                      {/* Somar automaticamente ao total */}
                      <div className="pt-3 border-t border-dark-800">
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={tempCardAutoAdd}
                            onChange={(e) => setTempCardAutoAdd(e.target.checked)}
                            className="w-4 h-4 mt-0.5 rounded text-brand-gold accent-brand-gold cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">
                              Somar o valor da taxa automaticamente no total a pagar
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Quando ativado, a taxa da maquininha é somada no total da sacola e no resumo do WhatsApp.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Passo 3: Mensagem Explicativa */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-300">
                          3. Mensagem explicativa exibida ao cliente na sacola:
                        </label>
                        <button
                          type="button"
                          onClick={() => setTempCardCustomNotice('')}
                          className="text-[11px] text-brand-gold hover:underline cursor-pointer"
                        >
                          Usar texto automático padrão
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={tempCardCustomNotice}
                        onChange={(e) => setTempCardCustomNotice(e.target.value)}
                        placeholder={`Automático: ${getCardMachineNoticeText({
                          active: tempCardActive,
                          type: tempCardType,
                          percentageRate: parseFloat(tempCardPercentage) || 3.5,
                          fixedRate: parseFloat(tempCardFixed) || 2.0,
                          debitRate: parseFloat(tempCardDebit) || 2.0,
                          creditRate: parseFloat(tempCardCredit) || 4.5
                        })}`}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold leading-relaxed"
                      />
                      <span className="text-[11px] text-slate-500 block">
                        Deixe em branco para usar o texto automático gerado a partir do valor que você configurou.
                      </span>
                    </div>

                    {/* Simulador em Tempo Real */}
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-3">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Simulação em Tempo Real (Exemplo com Pedido de R$ 50,00 no Cartão):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-dark-950/70 p-2.5 rounded-lg border border-dark-800">
                          <span className="text-slate-400 block text-[10px]">Subtotal do Pedido:</span>
                          <span className="font-bold text-white">R$ 50,00</span>
                        </div>
                        <div className="bg-dark-950/70 p-2.5 rounded-lg border border-dark-800">
                          <span className="text-slate-400 block text-[10px]">Taxa Calculada:</span>
                          <span className="font-bold text-brand-gold">
                            + R$ {calculateCardMachineFee(50, {
                              active: tempCardActive,
                              type: tempCardType,
                              percentageRate: parseFloat(tempCardPercentage) || 0,
                              fixedRate: parseFloat(tempCardFixed) || 0,
                              debitRate: parseFloat(tempCardDebit) || 0,
                              creditRate: parseFloat(tempCardCredit) || 0
                            }, 'credito').toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <div className="bg-dark-950/70 p-2.5 rounded-lg border border-dark-800 sm:col-span-2">
                          <span className="text-slate-400 block text-[10px]">Total a Pagar ({tempCardAutoAdd ? 'Com Taxa Somada' : 'Sem Taxa Somada'}):</span>
                          <span className="font-extrabold text-emerald-400 text-sm">
                            R$ {(50 + (tempCardAutoAdd ? calculateCardMachineFee(50, {
                              active: tempCardActive,
                              type: tempCardType,
                              percentageRate: parseFloat(tempCardPercentage) || 0,
                              fixedRate: parseFloat(tempCardFixed) || 0,
                              debitRate: parseFloat(tempCardDebit) || 0,
                              creditRate: parseFloat(tempCardCredit) || 0
                            }, 'credito') : 0)).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 text-[11px] text-amber-200/90 leading-relaxed border-t border-amber-500/20">
                        <strong>Como o cliente verá na sacola:</strong> {getCardMachineNoticeText({
                          active: tempCardActive,
                          type: tempCardType,
                          percentageRate: parseFloat(tempCardPercentage) || 3.5,
                          fixedRate: parseFloat(tempCardFixed) || 2.0,
                          debitRate: parseFloat(tempCardDebit) || 2.0,
                          creditRate: parseFloat(tempCardCredit) || 4.5,
                          customNotice: tempCardCustomNotice
                        })}
                      </div>
                    </div>

                    {/* Salvar */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleSaveCardMachineSettings}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black text-xs hover:brightness-110 shadow-glow-gold cursor-pointer flex items-center gap-2 transition-transform active:scale-95"
                      >
                        <Save className="w-4 h-4 stroke-[3]" />
                        <span>Salvar Taxa da Maquininha</span>
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* SUBTAB 2: PROMOÇÕES, BANNERS & CUPONS */}
              {(activeAdminTab === 'settings' ? settingsSubTab === 'promos' : menuSubTab === 'promos') && (
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

                  {/* Card Promoção Borda de Catupiry Grátis */}
                  <div className="p-5 rounded-2xl bg-dark-800/60 border border-dark-700 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-dark-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30 text-lg flex-shrink-0">
                          🧀
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white">Promoção Borda de Catupiry Grátis</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              productsList.filter(p => p.categoryId === 'pizzas').every(p => p.bordaGratis)
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : productsList.filter(p => p.categoryId === 'pizzas').some(p => p.bordaGratis)
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                : 'bg-dark-900 text-slate-400 border border-dark-700'
                            }`}>
                              {productsList.filter(p => p.categoryId === 'pizzas').every(p => p.bordaGratis)
                                ? 'Ativa em Todas as Pizzas'
                                : productsList.filter(p => p.categoryId === 'pizzas').some(p => p.bordaGratis)
                                ? 'Ativa em Algumas Pizzas'
                                : 'Desativada'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Controle com 1 clique se os clientes ganham Borda de Catupiry 100% grátis nas pizzas do delivery.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSetAllPizzasBordaGratis(true)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-brand-gold hover:from-amber-300 hover:to-brand-gold text-dark-950 font-black text-xs transition-transform active:scale-95 cursor-pointer shadow-sm flex items-center gap-1.5"
                        >
                          <span>🧀 Ativar Borda Grátis em Todas</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetAllPizzasBordaGratis(false)}
                          className="px-3.5 py-2 rounded-xl bg-dark-900 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700 text-xs font-bold transition-transform active:scale-95 cursor-pointer"
                        >
                          Desativar de Todas
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      💡 <strong>Dica:</strong> Você também pode ligar ou desligar a borda grátis individualmente em cada pizza na aba <strong>Cardápio</strong>, clicando no botão <strong>🧀 Borda Grátis / Sem Borda</strong> do card da pizza ou editando o produto.
                    </p>
                  </div>
                </div>
              )}

              {/* SUBTAB 3: DADOS DO RESTAURANTE & WHATSAPP */}
              {(activeAdminTab === 'settings' ? settingsSubTab === 'store' : menuSubTab === 'store') && (
                <>
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

                  {/* Card Machine Fee Notice Section */}
                  <div className="pt-4 border-t border-dark-800">
                    <div className="p-4 sm:p-5 rounded-2xl bg-dark-950/80 border border-amber-500/25 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white flex items-center gap-2">
                              Aviso de Taxa da Maquininha (Cartão)
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                tempStoreCardMachineNoticeActive 
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {tempStoreCardMachineNoticeActive ? 'Ativo no Cardápio' : 'Desativado'}
                              </span>
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Mensagem exibida ao cliente na sacola ao selecionar Cartão e no resumo do WhatsApp.
                            </p>
                          </div>
                        </div>

                        {/* Switch Toggle */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setMenuSubTab('card-fee')}
                            className="px-3 py-1.5 rounded-xl bg-brand-gold/15 hover:bg-brand-gold/25 border border-brand-gold/40 text-brand-gold font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <span>⚙️ Definir Valores (% ou R$)</span>
                          </button>

                          <label className="flex items-center gap-2 cursor-pointer select-none bg-dark-900 px-3 py-1.5 rounded-xl border border-dark-750">
                            <input
                              type="checkbox"
                              checked={tempStoreCardMachineNoticeActive}
                              onChange={(e) => setTempStoreCardMachineNoticeActive(e.target.checked)}
                              className="w-4 h-4 rounded text-brand-gold accent-brand-gold cursor-pointer"
                            />
                            <span className="text-xs font-semibold text-slate-200">
                              Exibir aviso ao cliente
                            </span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Texto do Aviso sobre a Taxa da Maquininha:
                        </label>
                        <textarea
                          rows={3}
                          value={tempStoreCardMachineNotice}
                          onChange={(e) => setTempStoreCardMachineNotice(e.target.value)}
                          placeholder="Ex: ⚠️ Pagamentos no cartão (débito ou crédito) possuem taxa da maquininha cobrada pela operadora. Consulte as condições na entrega."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold leading-relaxed"
                        />
                      </div>

                      {/* Live Preview Box */}
                      {tempStoreCardMachineNoticeActive && tempStoreCardMachineNotice && (
                        <div className="pt-1">
                          <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                            Pré-visualização de como o cliente vê na sacola:
                          </span>
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="font-bold text-amber-300 text-xs block">Aviso sobre Taxa da Maquininha:</span>
                              <p className="text-[11px] leading-relaxed text-amber-200/90 whitespace-pre-line">
                                {tempStoreCardMachineNotice}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Preset Quick Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                        <span className="text-slate-400 text-xs">Sugestões rápidas:</span>
                        <button
                          type="button"
                          onClick={() => setTempStoreCardMachineNotice("⚠️ Pagamentos no cartão (débito ou crédito) possuem taxa da maquininha cobrada pela operadora. Consulte as condições na entrega.")}
                          className="px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-700 transition-colors cursor-pointer"
                        >
                          Padrão da Loja
                        </button>
                        <button
                          type="button"
                          onClick={() => setTempStoreCardMachineNotice("⚠️ Pagamentos no cartão possuem acréscimo de taxa da operadora de cartão. Para economizar e pagar sem taxa, utilize PIX ou Dinheiro!")}
                          className="px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-700 transition-colors cursor-pointer"
                        >
                          Incentivo ao PIX
                        </button>
                        <button
                          type="button"
                          onClick={() => setTempStoreCardMachineNotice("💳 Pagamentos com cartão de débito ou crédito possuem acréscimo referente à taxa da maquininha.")}
                          className="px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-700 transition-colors cursor-pointer"
                        >
                          Aviso Simples
                        </button>
                      </div>
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

                {/* Cloud & Supabase Sync Status Card */}
                <div className="mt-8 pt-6 border-t border-dark-800">
                  <div className="p-5 rounded-2xl bg-dark-900 border border-dark-750">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
                          <h4 className="text-sm font-bold text-white">
                            {isSupabaseConfigured ? 'Banco de Dados Supabase Conectado' : 'Sincronização em Nuvem em Tempo Real Ativa (Global)'}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {isSupabaseConfigured 
                            ? 'Todas as alterações de cardápio, fotos e pedidos estão salvas permanentemente no banco de dados e sincronizadas com todos os celulares e computadores.'
                            : 'O sistema está sincronizando em tempo real entre celulares, tablets e computadores via canal de nuvem global. Para persistência permanente de longo prazo no banco de dados, você pode adicionar a chave do Supabase abaixo.'}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${isSupabaseConfigured ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                        {isSupabaseConfigured ? 'Nuvem Conectada' : 'Nuvem Tempo Real Ativa'}
                      </span>
                    </div>

                    <div className="bg-dark-950/70 rounded-xl p-4 border border-dark-800/80 space-y-3">
                      <p className="text-xs font-semibold text-slate-300">
                        Configuração do Supabase (Opcional - Persistência Permanente):
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Project URL (https://...):</label>
                          <input
                            type="text"
                            value={customSupabaseUrl}
                            onChange={(e) => setCustomSupabaseUrl(e.target.value)}
                            placeholder="https://seu-projeto.supabase.co"
                            className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Anon Key (Public API Key):</label>
                          <input
                            type="password"
                            value={customSupabaseKey}
                            onChange={(e) => setCustomSupabaseKey(e.target.value)}
                            placeholder="eyJhbGciOiJIUz..."
                            className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-500">
                          {isSupabaseConfigured ? '✅ Conexão ativa.' : 'ℹ️ Deixe em branco se preferir usar a sincronização automática.'}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {customSupabaseUrl && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm('Deseja desconectar as credenciais manuais do Supabase?')) {
                                    clearCustomSupabaseConfig();
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 text-xs font-semibold cursor-pointer"
                              >
                                Limpar
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const syncLink = `${window.location.origin}${window.location.pathname}?sb_url=${encodeURIComponent(customSupabaseUrl.trim())}&sb_key=${encodeURIComponent(customSupabaseKey.trim())}`;
                                  navigator.clipboard.writeText(syncLink);
                                  alert('Link copiado com sucesso! 📲\n\nEnvie este link no seu WhatsApp e abra-o no celular. O celular conectará ao banco de dados na mesma hora!');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold cursor-pointer border border-emerald-500/30 flex items-center gap-1.5"
                                title="Copiar link direto para conectar outro aparelho com 1 clique"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar Link para Conectar no Celular</span>
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (!customSupabaseUrl.trim() || !customSupabaseKey.trim()) {
                                alert('Por favor, informe a URL e a Anon Key do Supabase.');
                                return;
                              }
                              dispatchConfigSync('SUPABASE_CONFIG_SYNC', { url: customSupabaseUrl.trim(), key: customSupabaseKey.trim() });
                              saveCustomSupabaseConfig(customSupabaseUrl, customSupabaseKey);
                            }}
                            className="px-4 py-1.5 rounded-lg bg-brand-gold hover:bg-amber-400 text-dark-950 text-xs font-black cursor-pointer shadow-sm"
                          >
                            Salvar Conexão Supabase
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 p-2.5 rounded-lg bg-brand-gold/10 border border-brand-gold/20 text-[11px] text-amber-200/90 leading-relaxed">
                        <strong>💡 Dica para a Vercel:</strong> Para que <em>qualquer</em> cliente ou aparelho novo acesse o banco de dados sem precisar de nenhum link, adicione <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> nas <strong>Environment Variables</strong> do seu projeto na Vercel!
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW: BUFFET ITEM AVAILABILITY MANAGEMENT (DISPONIBILIDADE)    */}
        {/* ============================================================== */}
        {activeAdminTab === 'buffet' && currentUser?.role !== ROLES.KITCHEN && (currentBranch?.id === 'ariquemes' || currentUser?.role === ROLES.SUPER_ADMIN) && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-dark-900 border border-dark-800 rounded-3xl p-5 sm:p-7 shadow-xl">
              
              {/* Top Title & Quick Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-dark-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/30">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                      <span>Cardápio do Buffet: Pausar e Reativar Pratos</span>
                      {unavailableBuffetIds.length > 0 && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                          {unavailableBuffetIds.length} pausado(s)
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Acabou algum prato ou assado na cozinha? Clique para deixá-lo indisponível no site com 1 toque.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {unavailableBuffetIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleResetAllBuffetItemsAvailable}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reativar Todos os Pratos</span>
                    </button>
                  )}
                  {onSwitchToBuffet && (
                    <button
                      type="button"
                      onClick={onSwitchToBuffet}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-200 border border-dark-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-brand-gold" />
                      <span>Ver Buffet no Site</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Toast Feedback */}
              {menuFeedback && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{menuFeedback}</span>
                </div>
              )}

              {/* Status summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="p-3.5 rounded-2xl bg-dark-950 border border-dark-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium">Total de Pratos Cadastrados</span>
                    <p className="text-lg font-black text-white">
                      {buffetCategories.reduce((acc, c) => acc + (c.items || []).length, 0)} itens
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-dark-900 border border-dark-750 flex items-center justify-center text-slate-300">
                    <Utensils className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-950 border border-dark-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium">Disponíveis no Cardápio</span>
                    <p className="text-lg font-black text-emerald-400">
                      {buffetCategories.reduce((acc, c) => acc + (c.items || []).filter(i => !unavailableBuffetIds.includes(i.id)).length, 0)} disponíveis
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-950 border border-dark-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium">Pausados (Acabou na Cozinha)</span>
                    <p className="text-lg font-black text-rose-400">
                      {unavailableBuffetIds.length} pausados
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={buffetSearchQuery}
                    onChange={(e) => setBuffetSearchQuery(e.target.value)}
                    placeholder="Buscar prato... ex: Strogonoff, Peito, Salgadinho..."
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-dark-950 border border-dark-800 focus:border-brand-gold text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                  {buffetSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setBuffetSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  <button
                    type="button"
                    onClick={() => setBuffetCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      buffetCategoryFilter === 'all'
                        ? 'bg-brand-gold text-dark-950 font-black'
                        : 'bg-dark-950 text-slate-400 hover:text-white border border-dark-800'
                    }`}
                  >
                    Todas ({buffetCategories.reduce((acc, c) => acc + (c.items || []).length, 0)})
                  </button>
                  {buffetCategories.map(cat => {
                    const isCatActive = buffetCategoryFilter === cat.id;
                    const catCount = (cat.items || []).length;
                    const unavailInCat = (cat.items || []).filter(i => unavailableBuffetIds.includes(i.id)).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setBuffetCategoryFilter(cat.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isCatActive
                            ? 'bg-brand-gold text-dark-950 font-black'
                            : 'bg-dark-950 text-slate-400 hover:text-white border border-dark-800'
                        }`}
                      >
                        <span>{cat.name}</span>
                        {unavailInCat > 0 && (
                          <span className="w-2 h-2 rounded-full bg-rose-500" title={`${unavailInCat} pausado(s)`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Items List grouped by category */}
              <div className="space-y-6">
                {filteredBuffetItems.map(category => (
                  <div key={category.id} className="p-4 sm:p-5 rounded-2xl bg-dark-950 border border-dark-800/90 shadow-sm">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-dark-800">
                      <div>
                        <h3 className="font-serif text-sm sm:text-base font-bold text-white flex items-center gap-2">
                          <span className="text-brand-gold">👑</span>
                          <span>{category.name}</span>
                          <span className="text-xs text-slate-400 font-sans font-normal">
                            ({category.items.length} {category.items.length === 1 ? 'item' : 'itens'})
                          </span>
                        </h3>
                        {category.description && (
                          <p className="text-xs text-slate-400 mt-0.5">{category.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {category.items.map(item => {
                        const isUnavailable = unavailableBuffetIds.includes(item.id) || item.active === false;
                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                              isUnavailable
                                ? 'bg-dark-900/40 border-rose-900/40 opacity-80'
                                : 'bg-dark-900 border-dark-800 hover:border-brand-gold/40'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h4 className={`text-xs sm:text-sm font-bold ${
                                  isUnavailable ? 'text-slate-400 line-through' : 'text-white'
                                }`}>
                                  {item.name}
                                </h4>
                                {isUnavailable ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 whitespace-nowrap">
                                    ⛔ Acabou
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                                    🟢 Ativo
                                  </span>
                                )}
                              </div>
                              {item.desc && (
                                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                                  {item.desc}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleBuffetItemAvailability(item.id)}
                              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                                isUnavailable
                                  ? 'bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-black shadow-sm'
                                  : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 hover:border-rose-500/50'
                              }`}
                            >
                              {isUnavailable ? (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Reativar no Buffet (Disponível)</span>
                                </>
                              ) : (
                                <>
                                  <X className="w-3.5 h-3.5" />
                                  <span>Pausar Prato (Acabou na Cozinha)</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 4: BUFFET PHOTO GALLERY MANAGEMENT                        */}
        {/* ============================================================== */}
        {activeAdminTab === 'gallery' && currentUser?.role !== ROLES.KITCHEN && (currentBranch?.id === 'ariquemes' || currentUser?.role === ROLES.SUPER_ADMIN) && (
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

                <div className="flex flex-wrap items-center gap-2">
                  {galleryList.length > 0 && (
                    <button
                      type="button"
                      onClick={handleForceSyncGalleryToDatabase}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 hover:brightness-110 text-xs font-black text-dark-950 transition-all cursor-pointer shadow-md active:scale-95"
                      title="Forçar envio de todas as fotos para o banco de dados Supabase e nuvem agora"
                    >
                      <Sparkles className="w-3.5 h-3.5 fill-current" />
                      <span>Sincronizar no Banco ({galleryList.length})</span>
                    </button>
                  )}

                  {galleryList.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllPhotos}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-xs font-semibold text-rose-300 hover:text-white border border-rose-500/40 transition-all cursor-pointer"
                      title="Apagar todas as fotos da galeria para recomeçar do zero"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Apagar Todas</span>
                    </button>
                  )}
                </div>
              </div>

              {galleryFeedback && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-fadeIn">
                  {galleryFeedback}
                </div>
              )}

              {/* Form to add new photo or video */}
              <form onSubmit={handleAddPhoto} className="p-5 rounded-2xl bg-dark-950 border border-brand-gold/30 mb-8 space-y-4">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-brand-gold flex items-center gap-2">
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Cadastrar Foto ou Vídeo na Galeria</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <ImageUploader
                      value={newPhotoUrl}
                      onChange={(url, meta) => {
                        setNewPhotoUrl(url);
                        if (meta) setNewPhotoMeta(meta);
                      }}
                      label="Foto ou Vídeo do Buffet / Prato / Evento *"
                      description="Envie foto (WebP) ou vídeo (MP4/WebM até 30MB) do dispositivo, ou insira uma URL (YouTube, Vimeo, MP4)."
                      placeholder="https://exemplo.com/buffet.jpg ou link do YouTube Shorts"
                      acceptVideo={true}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-slate-300 mb-1">
                      Título do Prato / Evento (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Buffet El Shadday ou Picanha"
                      value={newPhotoTitle}
                      onChange={(e) => setNewPhotoTitle(e.target.value)}
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

                  <div className="sm:col-span-2 lg:col-span-2">
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

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Salvar na Galeria</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Photos List Grid */}
              {galleryList.length === 0 ? (
                <div className="p-8 sm:p-12 text-center rounded-2xl bg-dark-950 border border-dark-800 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center mx-auto border border-brand-gold/20">
                    <Camera className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-white">Nenhuma mídia cadastrada na galeria</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Todas as fotos padrão foram removidas. Adicione as suas fotos ou vídeos reais do Buffet El Shadday no formulário acima usando a opção <strong>"Do Dispositivo"</strong> ou <strong>"Link / YouTube"</strong>!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryList.map((photo, idx) => {
                    const catObj = GALLERY_CATEGORIES.find(c => c.id === photo.category);
                    const isVid = photo.type === 'video' || isVideoUrl(photo.url);
                    const poster = photo.thumbnail || getVideoPosterUrl(photo.url);

                    return (
                      <div 
                        key={photo.id || idx}
                        className="group relative rounded-2xl overflow-hidden bg-dark-950 border border-dark-800 hover:border-brand-gold/50 transition-all flex flex-col shadow-sm"
                      >
                        <div className="relative aspect-video w-full bg-black/50 overflow-hidden flex items-center justify-center">
                          {isVid ? (
                            <>
                              {poster ? (
                                <img
                                  src={poster}
                                  alt={photo.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                              ) : (
                                <video
                                  src={photo.url}
                                  className="w-full h-full object-cover"
                                  muted
                                  playsInline
                                />
                              )}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-brand-gold text-dark-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                  <Play className="w-5 h-5 fill-current ml-0.5" />
                                </div>
                              </div>
                              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-dark-950 shadow-sm flex items-center gap-1">
                                <Film className="w-3 h-3" />
                                Vídeo
                              </span>
                            </>
                          ) : (
                            <img
                              src={photo.url}
                              alt={photo.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          )}

                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-sm text-brand-gold border border-brand-gold/30">
                            {catObj ? catObj.label : photo.category}
                          </span>
                        </div>

                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              {isVid && <Film className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                              <h4 className="text-xs font-bold text-white line-clamp-1">{photo.title}</h4>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{photo.subtitle}</p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-dark-800 flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-950/60 transition-colors cursor-pointer"
                              title="Remover item da galeria"
                            >
                              <Trash2 className="w-4 h-4" />
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
        {/* VIEW 5: FILIAL QR CODE & DIRECT ACCESS                         */}
        {/* ============================================================== */}
        {activeAdminTab === 'qrcode' && currentUser?.role !== ROLES.KITCHEN && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-dark-900 border border-brand-gold/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-dark-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/40">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                        Acesso Direto por QR Code
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-display font-black text-white mt-0.5">
                      QR Code e Link Oficial da {currentBranch?.name || 'Filial'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Disponibilize nas mesas, no balcão e no WhatsApp para o cliente abrir diretamente o cardápio desta filial!
                    </p>
                  </div>
                </div>

                {currentUser?.role === ROLES.SUPER_ADMIN && (
                  <div className="flex items-center gap-2 bg-dark-950 p-2 rounded-2xl border border-dark-800">
                    <span className="text-xs text-slate-400 font-bold">Trocar Filial:</span>
                    <select
                      value={masterBranchFilter}
                      onChange={(e) => setMasterBranchFilter(e.target.value)}
                      className="bg-dark-900 text-xs font-bold text-white px-2.5 py-1.5 rounded-xl border border-dark-750 focus:outline-none"
                    >
                      {branchesList.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.displayName})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* QR Code Card Display */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                
                {/* Visual QR Code Card (Printable!) */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div id="printable-branch-qrcode" className="p-6 bg-white rounded-3xl shadow-2xl border-4 border-brand-gold text-dark-950 text-center max-w-xs w-full flex flex-col items-center">
                    <div className="font-display font-black text-lg text-dark-950 uppercase tracking-tight">
                      EL SHADDAY DELIVERY
                    </div>
                    <div className="text-xs font-extrabold text-amber-600 mb-3 uppercase">
                      📍 {currentBranch?.displayName || 'Ariquemes - RO'}
                    </div>

                    {/* QR Code Image */}
                    <div className="w-56 h-56 bg-slate-50 p-2 rounded-2xl border border-slate-200 shadow-inner flex items-center justify-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                          (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://elshaddaydelivery.com.br/') + `?filial=${currentBranch?.id || 'ariquemes'}`
                        )}&color=000000&bgcolor=ffffff&qzone=1`}
                        alt={`QR Code ${currentBranch?.name}`}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>

                    <div className="mt-3 font-extrabold text-xs text-dark-950">
                      Aponte a câmera do celular para pedir
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Pizzas Artesanais & Esfirras • {currentBranch?.phoneFormatted || '(69) 99222-8682'}
                    </div>
                  </div>
                </div>

                {/* Information & Action Buttons */}
                <div className="md:col-span-7 space-y-4">
                  
                  <div className="p-4 rounded-2xl bg-dark-950 border border-dark-800 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      🔗 Link Direto do Cardápio desta Filial:
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={(typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://elshaddaydelivery.com.br/') + `?filial=${currentBranch?.id || 'ariquemes'}`}
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-dark-900 border border-dark-750 text-brand-gold text-xs font-mono font-bold select-all focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://elshaddaydelivery.com.br/') + `?filial=${currentBranch?.id || 'ariquemes'}`;
                          navigator.clipboard.writeText(url);
                          alert('✅ Link copiado com sucesso! Você pode colar nas redes sociais ou enviar no WhatsApp.');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-brand-gold hover:bg-amber-400 text-dark-950 font-black text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copiar Link</span>
                      </button>
                    </div>
                  </div>

                  {/* Highlights of Branch Isolation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-dark-950 border border-dark-800 space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Isolamento Total</span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Ao escanear, o cliente entra <strong>exclusivamente</strong> na unidade de {currentBranch?.displayName || 'Ariquemes'}, sem misturar cardápio ou pedidos com outras cidades.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-dark-950 border border-dark-800 space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-emerald-400" />
                        <span>WhatsApp da Unidade</span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Os pedidos vão direto para o WhatsApp oficial desta filial: <strong>{currentBranch?.phoneFormatted || '(69) 99222-8682'}</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Print and Open buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const url = (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://elshaddaydelivery.com.br/') + `?filial=${currentBranch?.id || 'ariquemes'}`;
                        window.open(url, '_blank');
                      }}
                      className="px-4 py-3 rounded-xl bg-dark-800 hover:bg-dark-750 text-white font-bold text-xs border border-dark-700 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <ArrowUpRight className="w-4 h-4 text-brand-gold" />
                      <span>Testar Cardápio em Nova Guia</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const printWin = window.open('', '_blank', 'width=700,height=900');
                        if (!printWin) return;
                        const url = (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://elshaddaydelivery.com.br/') + `?filial=${currentBranch?.id || 'ariquemes'}`;
                        const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(url)}&color=000000&bgcolor=ffffff&qzone=1`;
                        printWin.document.write(`
                          <html>
                            <head>
                              <title>QR Code - ${currentBranch?.name}</title>
                              <style>
                                body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff; color: #111; }
                                .card { border: 4px solid #D8B85A; padding: 40px; border-radius: 24px; text-align: center; max-width: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
                                h1 { margin: 0 0 5px; font-size: 26px; font-weight: 900; }
                                h2 { margin: 0 0 20px; font-size: 16px; color: #b48e35; font-weight: 800; }
                                img { width: 280px; height: 280px; border-radius: 16px; margin: 10px 0; }
                                p { font-size: 14px; font-weight: bold; margin-top: 15px; }
                                .sub { font-size: 12px; color: #666; font-weight: normal; }
                              </style>
                            </head>
                            <body>
                              <div class="card">
                                <h1>EL SHADDAY DELIVERY</h1>
                                <h2>${currentBranch?.displayName || 'Ariquemes - RO'}</h2>
                                <img src="${qrSrc}" alt="QR Code" />
                                <p>Aponte a câmera do celular para pedir!</p>
                                <div class="sub">Delivery & Balcão • ${currentBranch?.phoneFormatted || '(69) 99222-8682'}</div>
                              </div>
                            </body>
                          </html>
                        `);
                        printWin.document.close();
                        printWin.focus();
                        setTimeout(() => printWin.print(), 500);
                      }}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold text-dark-950 font-black text-xs shadow-glow-gold hover:scale-102 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimir Placa de Mesa / Balcão com QR Code</span>
                    </button>
                  </div>

                </div>

              </div>

            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 6: GERENCIADOR DE CONEXÕES WHATSAPP (MULTI-FILIAL)        */}
        {/* ============================================================== */}
        {activeAdminTab === 'whatsapp' && currentUser?.role !== ROLES.KITCHEN && (
          <div className="space-y-6 animate-fade-in">
            <WhatsAppManagerView 
              currentUser={currentUser} 
              branches={branchesList} 
              currentBranch={currentBranch} 
            />
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

            {/* Branch indicator */}
            {whatsappModalData.branch && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-dark-950 border border-dark-800 text-[11px]">
                <span className="text-slate-400">Filial de Envio:</span>
                <span className="font-bold text-brand-gold flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-brand-gold" />
                  {whatsappModalData.branch.displayName || whatsappModalData.branch.name}
                  <span className="text-emerald-400 font-mono text-[10px]">
                    ({whatsappModalData.branch.whatsappFormatted || whatsappModalData.branch.phoneFormatted || '(69) 99222-8682'})
                  </span>
                </span>
              </div>
            )}

            {/* Quick Templates */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Mensagens Rápidas por Status (1 Clique):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => handleApplyWhatsAppTemplate('RECEBIDO_COZINHA')}
                  className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                    whatsappModalData.activeTemplate === 'RECEBIDO_COZINHA' || whatsappModalData.activeTemplate === 'recebido'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                      : 'bg-dark-950 border-dark-800 text-slate-300 hover:border-dark-700'
                  }`}
                >
                  <Pizza className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="truncate">Confirmado</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyWhatsAppTemplate('EM_PREPARO')}
                  className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                    whatsappModalData.activeTemplate === 'EM_PREPARO' || whatsappModalData.activeTemplate === 'preparo'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                      : 'bg-dark-950 border-dark-800 text-slate-300 hover:border-dark-700'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="truncate">No Forno</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyWhatsAppTemplate('SAIU_ENTREGA')}
                  className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                    whatsappModalData.activeTemplate === 'SAIU_ENTREGA' || whatsappModalData.activeTemplate === 'entrega'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-black'
                      : 'bg-dark-950 border-dark-800 text-slate-300 hover:border-dark-700'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="truncate">Saiu p/ Entrega</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyWhatsAppTemplate('PRONTO_BALCAO')}
                  className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                    whatsappModalData.activeTemplate === 'PRONTO_BALCAO' || whatsappModalData.activeTemplate === 'pronto'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black'
                      : 'bg-dark-950 border-dark-800 text-slate-300 hover:border-dark-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">Pronto Balcão</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyWhatsAppTemplate('CONCLUIDO')}
                  className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                    whatsappModalData.activeTemplate === 'CONCLUIDO' || whatsappModalData.activeTemplate === 'concluido'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black'
                      : 'bg-dark-950 border-dark-800 text-slate-300 hover:border-dark-700'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 stroke-[3]" />
                  <span className="truncate">Finalizado</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyWhatsAppTemplate('CANCELADO')}
                  className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                    whatsappModalData.activeTemplate === 'CANCELADO' || whatsappModalData.activeTemplate === 'cancelado'
                      ? 'bg-red-500/20 border-red-500 text-red-300 font-black'
                      : 'bg-dark-950 border-dark-800 text-slate-300 hover:border-dark-700'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <span className="truncate">Cancelado</span>
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

                {/* Configurações Especiais de Pizza */}
                {prodFormCategory === 'pizzas' && (
                  <div className="sm:col-span-2 p-3.5 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-white mb-1">
                        Tamanho da Pizza *
                      </label>
                      <input
                        type="text"
                        value={prodFormTamanho}
                        onChange={(e) => setProdFormTamanho(e.target.value)}
                        placeholder="Ex: Família (8 fatias), Gigante (12 fatias), Pequena (4 fatias)..."
                        className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white mb-1">
                        Quantidade Máxima de Sabores *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={prodFormMaxSabores}
                        onChange={(e) => setProdFormMaxSabores(e.target.value)}
                        placeholder="Ex: 2 ou 3"
                        className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2 text-[11px] text-brand-goldLight flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" />
                      <span>
                        Pizzas cadastradas aqui abrem automaticamente o montador de sabores com cálculo pelo <strong>maior valor</strong> selecionado.
                      </span>
                    </div>
                  </div>
                )}

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

                {/* Imagem do Produto (Upload do Dispositivo ou URL Externa) */}
                <div className="sm:col-span-2">
                  <ImageUploader
                    value={prodFormImage}
                    onChange={setProdFormImage}
                    label="Foto do Produto"
                    description="Envie uma imagem do seu dispositivo (otimizada automaticamente para gastar menos espaço no banco de dados) ou informe uma URL externa."
                    placeholder="https://exemplo.com/foto-pizza.jpg"
                  />
                </div>

                {/* Switches */}
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-dark-800">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-dark-800/60 border border-dark-700 cursor-pointer hover:border-dark-600 transition-colors">
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

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-dark-800/60 border border-dark-700 cursor-pointer hover:border-brand-gold/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={prodFormIsHighlight}
                      onChange={(e) => setProdFormIsHighlight(e.target.checked)}
                      className="w-4 h-4 accent-brand-gold cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-brand-gold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-brand-gold text-brand-gold" />
                        <span>Destaques da Casa</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Topo da tela principal</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-dark-800/60 border border-dark-700 cursor-pointer hover:border-amber-400/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={prodFormIsPromo}
                      onChange={(e) => setProdFormIsPromo(e.target.checked)}
                      className="w-4 h-4 accent-amber-400 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-amber-300">Selo Promoção</div>
                      <div className="text-[10px] text-slate-400">Preço promocional 🔥</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-dark-800/60 border border-dark-700 cursor-pointer hover:border-dark-600 transition-colors">
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

      {/* ============================================================== */}
      {/* MODAL: CRIAR OU EDITAR SABOR DE PIZZA                          */}
      {/* ============================================================== */}
      {isFlavorModalOpen && (
        <div className="fixed inset-0 z-50 bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-dark-900 border border-brand-gold/40 w-full max-w-lg rounded-3xl p-5 sm:p-7 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-dark-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center border border-brand-gold/30">
                  <Pizza className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base sm:text-lg text-white">
                    {editingFlavor ? `Editar: ${editingFlavor.name}` : 'Cadastrar Novo Sabor de Pizza'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingFlavor ? 'Atualize o nome, valor ou ingredientes deste sabor' : 'Adicione um novo sabor de pizza com seu respectivo valor'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFlavorModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFlavor} className="space-y-4 mt-4">
              
              {/* Nome do Sabor */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Nome do Sabor *
                </label>
                <input
                  type="text"
                  required
                  value={flavorFormName}
                  onChange={(e) => setFlavorFormName(e.target.value)}
                  placeholder="Ex: Camarão Especial com Catupiry, Quatro Queijos..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                />
              </div>

              {/* Preço do Sabor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-200">
                    Preço deste Sabor (R$) *
                  </label>
                  <span className="text-[10px] text-brand-gold font-medium">Puxa o valor da pizza se for o maior</span>
                </div>
                <input
                  type="text"
                  required
                  value={flavorFormPrice}
                  onChange={(e) => setFlavorFormPrice(e.target.value)}
                  placeholder="Ex: 40,00 ou 55,00 ou 120,00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white font-mono font-bold focus:outline-none focus:border-brand-gold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 <strong>Regra:</strong> Se o cliente montar uma pizza com este sabor e ele for o mais caro entre os escolhidos, a pizza inteira será cobrada por este valor.
                </p>
              </div>

              {/* Categoria do Sabor */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Categoria do Sabor
                </label>
                <select
                  value={flavorFormCategory}
                  onChange={(e) => setFlavorFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white focus:outline-none focus:border-brand-gold cursor-pointer"
                >
                  <option value="salgadas">Salgada Tradicional</option>
                  <option value="especiais">Especial / Nobre / Gourmet ⭐</option>
                  <option value="doces">Doce 🍫</option>
                </select>
              </div>

              {/* Ingredientes / Descrição */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Ingredientes / Descrição do Sabor <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span>
                </label>
                <textarea
                  rows="2"
                  value={flavorFormDescription}
                  onChange={(e) => setFlavorFormDescription(e.target.value)}
                  placeholder="Ex: Molho de tomate artesanal, camarões salteados ao alho, catupiry cremoso e orégano..."
                  className="w-full px-3.5 py-2 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                />
              </div>

              {/* Disponibilidade */}
              <div className="pt-2 border-t border-dark-800">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-dark-800/60 border border-dark-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flavorFormIsAvailable}
                    onChange={(e) => setFlavorFormIsAvailable(e.target.checked)}
                    className="w-4 h-4 accent-emerald-400 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">Disponível para Pedidos</div>
                    <div className="text-[10px] text-slate-400">Desmarque se faltar ingrediente para pausar este sabor</div>
                  </div>
                </label>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-dark-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFlavorModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black text-xs hover:brightness-110 shadow-glow-gold cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingFlavor ? 'Salvar Sabor' : 'Cadastrar Sabor'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: PERSONALIZAR PIZZA NO PDV */}
      {pdvPizzaToCustomize && (
        <PizzaCustomizerModal
          isOpen={!!pdvPizzaToCustomize}
          onClose={() => setPdvPizzaToCustomize(null)}
          pizzaProduct={pdvPizzaToCustomize}
          onAddPizzaToCart={(customPizza) => {
            setPdvCart(prev => [...prev, {
              id: customPizza.id,
              name: customPizza.name,
              price: customPizza.price,
              quantity: 1,
              notes: customPizza.notes || '',
              flavors: customPizza.flavors,
              isCustomPizza: true,
              description: customPizza.description
            }]);
            setPdvPizzaToCustomize(null);
          }}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL: DIRETÓRIO DE CLIENTES / HISTÓRICO                       */}
      {/* ============================================================== */}
      {isCustomerDirectoryOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="relative w-full max-w-2xl bg-dark-900 border border-dark-800 rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-dark-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-gold/20 text-brand-gold flex items-center justify-center border border-brand-gold/30">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Perfis de Clientes Cadastrados
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Gerados automaticamente através dos pedidos anteriores
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerDirectoryOpen(false)}
                className="w-8 h-8 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente por nome, telefone ou bairro..."
                value={customerDirectorySearch}
                onChange={(e) => setCustomerDirectorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-gold"
              />
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {(() => {
                const list = customerDirectorySearch.trim().length >= 2 
                  ? searchCustomers(customerDirectorySearch, 40) 
                  : getAllCustomers();
                
                if (list.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      Nenhum perfil de cliente encontrado.
                    </div>
                  );
                }

                return list.map((cust) => (
                  <div
                    key={cust.id || cust.key}
                    className="p-3 rounded-2xl bg-dark-950 border border-dark-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-dark-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-brand-gold/15 text-brand-gold font-black text-sm flex items-center justify-center shrink-0 border border-brand-gold/30">
                        {(cust.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">
                            {cust.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold text-[10px] font-black border border-brand-gold/30 shrink-0">
                            {cust.ordersCount || 1} {(cust.ordersCount || 1) === 1 ? 'pedido' : 'pedidos'}
                          </span>
                          {cust.totalSpent > 0 && (
                            <span className="text-[10px] text-slate-400">
                              (R$ {Number(cust.totalSpent).toFixed(2).replace('.', ',')})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          {cust.phoneFormatted || cust.phone ? (
                            <span className="text-slate-300 font-mono">
                              📱 {cust.phoneFormatted || cust.phone}
                            </span>
                          ) : null}
                          {(cust.street || cust.address) ? (
                            <span>📍 {cust.district ? `${cust.district} - ` : ''}{cust.street || cust.address}{cust.number ? `, Nº ${cust.number}` : ''}</span>
                          ) : (
                            <span>🛍️ Retirada Balcão</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleSelectCustomer(cust);
                        setIsCustomerDirectoryOpen(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-brand-gold hover:bg-brand-yellow text-dark-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0 self-end sm:self-auto"
                    >
                      <span>Lançar Pedido</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING WHATSAPP SENT NOTIFICATION TOAST */}
      {lastSentWhatsAppNotice && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-[92vw] sm:w-auto bg-dark-900 border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 animate-fade-in backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/40">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-white truncate flex items-center gap-1.5">
                <span>WhatsApp Enviado!</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
                  #{lastSentWhatsAppNotice.orderId}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                {lastSentWhatsAppNotice.customerName} ({lastSentWhatsAppNotice.phone})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {lastSentWhatsAppNotice.whatsappUrl && (
              <a
                href={lastSentWhatsAppNotice.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-black text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md"
                title="Abrir WhatsApp manualmente"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Abrir</span>
              </a>
            )}
            <button
              onClick={() => setLastSentWhatsAppNotice(null)}
              className="w-7 h-7 rounded-lg bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
