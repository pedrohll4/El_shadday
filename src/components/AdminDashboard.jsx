import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Flame, Clock, AlertTriangle, CheckCircle2, Search, 
  MapPin, User, DollarSign, Package, 
  Printer, ArrowLeft, ArrowRight, LogOut, RefreshCw, Send, Check,
  Bike, ChefHat, BellRing, Plus, Minus, Trash2, XCircle,
  MessageSquare, Phone, ShoppingBag, Store, Copy, ChevronLeft, ChevronRight,
  AlertCircle, X, ShieldAlert, Sparkles, CheckCheck,
  Camera, RotateCcw, Edit, Edit2, Eye, EyeOff, Tag, Percent,
  Utensils, ToggleLeft, ToggleRight, Save, Layers, CheckSquare,
  Pizza, ArrowUpRight, Info, CreditCard, Play, Film,
  Building2, Users, Crown, Sliders, BarChart3, Star, QrCode,
  Settings2, Smartphone, Banknote, Shuffle, Lock, ImageOff,
  GripVertical, ArrowUp, ArrowDown, ChevronsUp, HeartHandshake, IceCream, Soup, Wine,
  ClipboardList, Wrench
} from 'lucide-react';
import { AdminShell } from './admin/AdminShell';
import { 
  RESTAURANT_INFO, 
  ARIQUEMES_DISTRICTS, 
  getStoredDistricts,
  saveStoredDistricts,
  normalizeDistrictsList, 
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
  getStoredAcaiSettings,
  saveStoredAcaiSettings,
  DEFAULT_ACAI_SETTINGS,
  calculatePizzaPrice,
  calculateCardMachineFee,
  getCardMachineNoticeText,
  normalizeProductsList,
  normalizePizzaFlavors,
  getStoredCategories,
  saveStoredCategories,
  normalizeCategoriesList,
  PIZZA_SIZES,
  DEFAULT_PIZZA_BASE_PRICES,
  getPizzaSizeKey,
  getPizzaFlavorPrice,
  getStoredExtraSauceConfig,
  saveStoredExtraSauceConfig,
  stripPrivateCardMachineSettings
} from '../data/menuData';
import { PizzaCustomizerModal } from './PizzaCustomizerModal';
import { BoxBuilderModal } from './BoxBuilderModal';
import { ComboCustomizerModal } from './ComboCustomizerModal';
import { AcaiCustomizerModal } from './AcaiCustomizerModal';
import { EditOrderItemsModal } from './EditOrderItemsModal';
import { EditOrderCustomerModal } from './EditOrderCustomerModal';
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
import { uploadMediaToSupabaseStorage } from '../services/storageService';
import { ImageUploader } from './ImageUploader';
import { isVideoUrl, getVideoPosterUrl, compressImageFile } from '../utils/imageCompressor';
import { ROLES, ROLE_LABELS, getCurrentUser } from '../services/authService';
import { getStoredBranches } from '../data/branchesData';
import { updateBranch } from '../services/branchesService';
import { MasterFinancialView } from './admin/MasterFinancialView';
import { BranchManagementView } from './admin/BranchManagementView';
import { UserManagementView } from './admin/UserManagementView';
import WhatsAppManagerView from './admin/WhatsAppManagerView';
import { CashClosingModal } from './CashClosingModal';
import { 
  getCashRegisterSettings, 
  executeCashClosing, 
  calculateShiftTotals 
} from '../services/cashRegisterService';
import { 
  sendCustomerWhatsAppNotification, 
  buildStatusMessage, 
  getWhatsAppSettings, 
  saveWhatsAppSettings,
  cleanPhoneNumber,
  openWhatsAppInstantLink
} from '../services/whatsappNotificationService';
import { isCloudBaileysActive, fetchEngineStatus } from '../services/whatsappBranchService';
import { normalizeOrderStatus, reserveOrderNumber, formatOrderNumber } from '../services/ordersSyncService';
import { 
  searchCustomers, 
  recordCustomerFromOrder, 
  backfillCustomersFromOrders, 
  getAllCustomers 
} from '../services/customerService';

const CATEGORY_ICONS_MAP = {
  Flame,
  Package,
  Utensils,
  HeartHandshake,
  Pizza,
  Wine,
  IceCream,
  Soup,
  Layers
};

// Colunas do quadro de pedidos (estilo Ola Click)
const KDS_KANBAN_COLUMNS = [
  { id: 'novos', title: 'Novos / pendentes', statuses: ['RECEBIDO_COZINHA'], always: true, headerCls: 'bg-amber-500/15 text-amber-300' },
  { id: 'preparo', title: 'Em preparo', statuses: ['EM_PREPARO'], always: true, headerCls: 'bg-brand-gold/15 text-brand-goldLight' },
  { id: 'prontos', title: 'Prontos / em entrega', statuses: ['PRONTO_BALCAO', 'SAIU_ENTREGA'], always: true, headerCls: 'bg-blue-500/15 text-blue-300' },
  { id: 'concluidos', title: 'Concluídos', statuses: ['CONCLUIDO'], always: true, dropHint: 'Arraste um pedido aqui para concluir', headerCls: 'bg-emerald-500/15 text-emerald-300' },
  { id: 'cancelados', title: 'Cancelados', statuses: ['CANCELADO'], headerCls: 'bg-red-500/15 text-red-300' }
];

const ADMIN_TAB_TITLES = {
  kds: 'Pedidos',
  pdv: 'Novo pedido',
  menu: 'Cardápio',
  settings: 'Configurações',
  qrcode: 'QR Code e link da loja',
  whatsapp: 'WhatsApp',
  'master-overview': 'Faturamento',
  'branch-overview': 'Desempenho da filial',
  branches: 'Filiais',
  users: 'Usuários',
  buffet: 'Buffet: pratos',
  gallery: 'Buffet: galeria'
};

export function AdminDashboard({ 
  orders = [], 
  onUpdateOrderStatus, 
  onUpdatePaymentStatus, 
  onUpdatePaymentMethod,
  onUpdateOrderDetails,
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

  // Horizontal Scroll state for Navigation Tabs (Rotbar)
  const tabsNavRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkTabsScroll = () => {
    if (tabsNavRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsNavRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkTabsScroll, 120);
    window.addEventListener('resize', checkTabsScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkTabsScroll);
    };
  }, [activeAdminTab, currentUser, branchesList]);

  const handleScrollTabs = (direction) => {
    if (tabsNavRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      tabsNavRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkTabsScroll, 320);
    }
  };

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
  const panelOpenedAtRef = useRef(Date.now()); // hora em que o painel abriu (para não perder o alarme do 1º pedido)

  // Barra de filtros da Cozinha (Ativos, Em Atraso, Pendentes...) com rolagem lateral
  const kdsFiltersScrollRef = useRef(null);
  const scrollKdsFilters = (direction) => {
    const el = kdsFiltersScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -240 : 240, behavior: 'smooth' });
  };

  // KDS Grid Scheme & Card Density State
  const [kdsGridCols, setKdsGridCols] = useState(() => {
    try {
      return localStorage.getItem('el_shadday_kds_grid_cols_v2') || 'kanban';
    } catch (e) {
      return '3';
    }
  });
  const [kanbanDragOrderId, setKanbanDragOrderId] = useState(null); // pedido sendo arrastado no quadro
  const [kanbanDragOverCol, setKanbanDragOverCol] = useState(null);
  const [kanbanDetailOrderId, setKanbanDetailOrderId] = useState(null); // pedido aberto no painel lateral do quadro
  const [kdsCompactMode, setKdsCompactMode] = useState(() => {
    try {
      return localStorage.getItem('el_shadday_kds_compact_mode') === 'true';
    } catch (e) {
      return false;
    }
  });

  const handleSetKdsGridCols = (cols) => {
    setKdsGridCols(cols);
    try {
      localStorage.setItem('el_shadday_kds_grid_cols_v2', cols);
    } catch (e) {}
  };

  const handleToggleKdsCompactMode = () => {
    setKdsCompactMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem('el_shadday_kds_compact_mode', String(next));
      } catch (e) {}
      return next;
    });
  };

  // Cash Register Closing States
  const [isCashClosingModalOpen, setIsCashClosingModalOpen] = useState(false);
  const [showArchivedKdsOrders, setShowArchivedKdsOrders] = useState(false);

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

  // Change Payment / Cash Change Modal State (KDS / Cozinha)
  const [changePaymentModalOrder, setChangePaymentModalOrder] = useState(null);
  const [editItemsModalOrder, setEditItemsModalOrder] = useState(null);
  const [editCustomerModalOrder, setEditCustomerModalOrder] = useState(null);
  const [editPaymentType, setEditPaymentType] = useState('pix'); // 'pix' | 'dinheiro' | 'credito' | 'debito' | 'misto'
  const [editCashChange, setEditCashChange] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState('PENDENTE_COBRANCA'); // 'PENDENTE_COBRANCA' | 'PAGO_APROVADO'
  const [editSplitMethod1, setEditSplitMethod1] = useState('pix');
  const [editSplitAmount1, setEditSplitAmount1] = useState('');
  const [editSplitMethod2, setEditSplitMethod2] = useState('credito');
  const [editSplitChange1, setEditSplitChange1] = useState('');
  const [editSplitChange2, setEditSplitChange2] = useState('');

  // PDV (Point of Sale) State
  const [pdvCategory, setPdvCategory] = useState(CATEGORIES[0]?.id || 'combos');
  const [pdvSearch, setPdvSearch] = useState('');
  const [pdvCart, setPdvCart] = useState([]);
  const [pdvCustomerName, setPdvCustomerName] = useState('');
  const [pdvCustomerPhone, setPdvCustomerPhone] = useState('');
  const [pdvDeliveryType, setPdvDeliveryType] = useState('balcao'); // 'balcao' | 'delivery'
  const [pdvDistrict, setPdvDistrict] = useState(() => getStoredDistricts()[2] || getStoredDistricts()[0] || { id: 'setor-03', name: 'Setor 03', price: 8 });
  const [pdvAddress, setPdvAddress] = useState('');
  const [pdvNumber, setPdvNumber] = useState('');
  const [pdvReference, setPdvReference] = useState('');
  const [pdvPaymentMethod, setPdvPaymentMethod] = useState('pix'); // 'pix' | 'dinheiro' | 'debito' | 'credito'
  const [pdvIsPaid, setPdvIsPaid] = useState(true);
  const [pdvCashChange, setPdvCashChange] = useState('');
  const [pdvOrderNotes, setPdvOrderNotes] = useState('');
  const [pdvDiscount, setPdvDiscount] = useState('');
  const [pdvServiceName, setPdvServiceName] = useState('');
  const [pdvServiceFee, setPdvServiceFee] = useState('');
  const [pdvSuccessOrder, setPdvSuccessOrder] = useState(null);
  const [pdvValidationError, setPdvValidationError] = useState('');
  const [pdvSubTab, setPdvSubTab] = useState('novo'); // 'novo' | 'baixa'
  const [pdvTicketOpen, setPdvTicketOpen] = useState(false); // comanda aberta em tela cheia no celular
  const [pdvExtrasOpen, setPdvExtrasOpen] = useState(''); // 'obs' | 'desc' | 'serv'
  useEffect(() => { if (pdvSuccessOrder) setPdvTicketOpen(false); }, [pdvSuccessOrder]);
  const [pdvBaixaSearch, setPdvBaixaSearch] = useState('');
  const [pdvBaixaFilter, setPdvBaixaFilter] = useState('abertos'); // 'abertos' | 'balcao' | 'delivery' | 'concluidos'
  const [pdvBaixaToast, setPdvBaixaToast] = useState(null);
  const pdvBaixaToastTimeoutRef = useRef(null);
  const pdvCategoryScrollRef = useRef(null);

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

      let channelBuffetGallery = null;
      let channelCsGallery = null;

      try {
        const existingChannels = typeof supabase.getChannels === 'function' ? supabase.getChannels() : [];
        const prevBuffet = existingChannels.find(ch => ch?.topic?.includes('realtime_buffet_gallery_admin'));
        if (prevBuffet) supabase.removeChannel(prevBuffet);
        const prevCs = existingChannels.find(ch => ch?.topic?.includes('realtime_cs_gallery_admin'));
        if (prevCs) supabase.removeChannel(prevCs);

        // Realtime: sincroniza alterações em buffet_gallery
        channelBuffetGallery = supabase
          .channel(`realtime_buffet_gallery_admin_${Date.now()}`)
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
        channelCsGallery = supabase
          .channel(`realtime_cs_gallery_admin_${Date.now()}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'company_settings', filter: 'id=eq.el_shadday_config' }, () => {
            loadFromCompanySettings();
          })
          .subscribe();
      } catch (err) {
        console.warn('[AdminDashboard] Falha ao registrar realtime gallery:', err);
      }

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

  // Sub-navigation in Menu Tab: 'products' | 'categories' | 'flavors' | 'acai'
  const [menuSubTab, setMenuSubTab] = useState('products');
  // Sub-navigation in Settings Tab: 'card-fee' | 'store' | 'promos'
  const [settingsSubTab, setSettingsSubTab] = useState('card-fee');

  // Delivery Categories / Topics Order State
  const [deliveryCategories, setDeliveryCategories] = useState(() => getStoredCategories());
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState(null);

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
  const [flavorFormPrices, setFlavorFormPrices] = useState({
    brotinho: '15.00',
    p: '20.00',
    m: '30.00',
    familia: '40.00',
    gigante: '50.00'
  });
  const [flavorFormCategory, setFlavorFormCategory] = useState('salgadas');
  const [flavorFormDescription, setFlavorFormDescription] = useState('');
  const [flavorFormImage, setFlavorFormImage] = useState('');
  const [isUploadingFlavorImage, setIsUploadingFlavorImage] = useState(false);
  const [flavorFormIsAvailable, setFlavorFormIsAvailable] = useState(true);

  // Açaí Complements & Settings State
  const [acaiSettings, setAcaiSettings] = useState(() => getStoredAcaiSettings());
  const [tempMaxAcai, setTempMaxAcai] = useState(() => (getStoredAcaiSettings().maxComplementsPerAcai ?? 0).toString());
  const [tempMaxComboBarca, setTempMaxComboBarca] = useState(() => (getStoredAcaiSettings().maxComplementsPerComboBarca ?? 0).toString());
  const [isComplementModalOpen, setIsComplementModalOpen] = useState(false);
  const [editingComplement, setEditingComplement] = useState(null);
  const [complementFormName, setComplementFormName] = useState('');
  const [complementFormIcon, setComplementFormIcon] = useState('🥜');
  const [complementFormPrice, setComplementFormPrice] = useState('0');
  const [complementFormIsAvailable, setComplementFormIsAvailable] = useState(true);
  const [complementFormDefaultSelected, setComplementFormDefaultSelected] = useState(false);
  
  // Açaí Coberturas State
  const [newCoberturaText, setNewCoberturaText] = useState('');
  const [newCoberturaPrice, setNewCoberturaPrice] = useState('0');
  const [isCoberturaModalOpen, setIsCoberturaModalOpen] = useState(false);
  const [editingCobertura, setEditingCobertura] = useState(null);
  const [coberturaFormName, setCoberturaFormName] = useState('');
  const [coberturaFormPrice, setCoberturaFormPrice] = useState('0');
  const [coberturaFormIsAvailable, setCoberturaFormIsAvailable] = useState(true);

  // Delivery Districts Management State (Taxas de Entrega por Bairro)
  const [districtsList, setDistrictsList] = useState(() => getStoredDistricts());
  const [districtSearch, setDistrictSearch] = useState('');
  const [districtPriceFilter, setDistrictPriceFilter] = useState('all'); // 'all' | '8' | '10' | '15' | '20+' | 'unavailable'
  const [newDistrictName, setNewDistrictName] = useState('');
  const [newDistrictPrice, setNewDistrictPrice] = useState('8.00');
  const [editingDistrict, setEditingDistrict] = useState(null);
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [districtFormName, setDistrictFormName] = useState('');
  const [districtFormPrice, setDistrictFormPrice] = useState('8.00');
  const [districtFormIsAvailable, setDistrictFormIsAvailable] = useState(true);

  // PDV Custom Modals (Pizza, Esfirra Box, Açaí, Combos)
  const [pdvPizzaToCustomize, setPdvPizzaToCustomize] = useState(null);
  const [pdvBoxToCustomize, setPdvBoxToCustomize] = useState(null);
  const [pdvComboToCustomize, setPdvComboToCustomize] = useState(null);
  const [pdvAcaiToCustomize, setPdvAcaiToCustomize] = useState(null);

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
  const [tempStoreIsOpen, setTempStoreIsOpen] = useState(restaurantSettings.isOpen !== false);
  const [tempStoreClosedMessage, setTempStoreClosedMessage] = useState(
    restaurantSettings.closedMessage || 'Estamos fechados no momento. Não estamos aceitando novos pedidos pelo site agora. Confira nossos horários de funcionamento!'
  );
  const [tempStoreReopenTime, setTempStoreReopenTime] = useState(
    restaurantSettings.reopenTime || '18:00'
  );
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
  const [tempCardDebit, setTempCardDebit] = useState(currentCardSettings.debitRate !== undefined ? currentCardSettings.debitRate.toString() : '0');
  const [tempCardCredit, setTempCardCredit] = useState(currentCardSettings.creditRate !== undefined ? currentCardSettings.creditRate.toString() : '3.5');
  const [tempCardDebitFixed, setTempCardDebitFixed] = useState(currentCardSettings.debitFixed !== undefined ? currentCardSettings.debitFixed.toString() : '0.00');
  const [tempCardCreditFixed, setTempCardCreditFixed] = useState(currentCardSettings.creditFixed !== undefined ? currentCardSettings.creditFixed.toString() : '3.00');
  const [tempCardAutoAdd, setTempCardAutoAdd] = useState(currentCardSettings.autoAddToTotal !== false);
  const [tempCardCustomNotice, setTempCardCustomNotice] = useState(currentCardSettings.customNotice || '');

  // Extra Sauce Settings Form Fields
  const [extraSauceConfig, setExtraSauceConfig] = useState(() => getStoredExtraSauceConfig());
  const [tempSauceActive, setTempSauceActive] = useState(extraSauceConfig.active !== false);
  const [tempSauceName, setTempSauceName] = useState(extraSauceConfig.name || 'Molho Especial da Casa');
  const [tempSaucePrice, setTempSaucePrice] = useState(extraSauceConfig.price !== undefined ? extraSauceConfig.price.toString() : '3.00');
  const [tempSauceDescription, setTempSauceDescription] = useState(extraSauceConfig.description || '');

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
        if (data.isOpen !== undefined) setTempStoreIsOpen(data.isOpen !== false);
        if (data.closedMessage !== undefined) setTempStoreClosedMessage(data.closedMessage);
        if (data.reopenTime !== undefined) setTempStoreReopenTime(data.reopenTime);
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
          if (cs.debitFixed !== undefined) setTempCardDebitFixed(cs.debitFixed.toString());
          if (cs.creditFixed !== undefined) setTempCardCreditFixed(cs.creditFixed.toString());
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
    const handleAcaiSync = (e) => {
      if (e?.detail) {
        setAcaiSettings(e.detail);
        if (e.detail.maxComplementsPerAcai !== undefined) setTempMaxAcai((e.detail.maxComplementsPerAcai || 0).toString());
        if (e.detail.maxComplementsPerComboBarca !== undefined) setTempMaxComboBarca((e.detail.maxComplementsPerComboBarca || 0).toString());
      } else {
        const stored = getStoredAcaiSettings();
        setAcaiSettings(stored);
        setTempMaxAcai((stored.maxComplementsPerAcai || 0).toString());
        setTempMaxComboBarca((stored.maxComplementsPerComboBarca || 0).toString());
      }
    };

    const handleCategoriesSync = (e) => {
      if (e?.detail && Array.isArray(e.detail)) setDeliveryCategories(e.detail);
      else setDeliveryCategories(getStoredCategories());
    };

    const handleSauceSync = (e) => {
      const cfg = e?.detail || getStoredExtraSauceConfig();
      setExtraSauceConfig(cfg);
      setTempSauceActive(cfg.active !== false);
      setTempSauceName(cfg.name || 'Molho Especial da Casa');
      setTempSaucePrice(cfg.price !== undefined ? cfg.price.toString() : '3.00');
      setTempSauceDescription(cfg.description || '');
    };

    window.addEventListener('delivery_products_updated', handleProductsSync);
    window.addEventListener('delivery_promos_updated', handlePromosSync);
    window.addEventListener('delivery_restaurant_info_updated', handleStoreSync);
    window.addEventListener('pizza_flavors_updated', handleFlavorsSync);
    window.addEventListener('acai_settings_updated', handleAcaiSync);
    window.addEventListener('delivery_categories_updated', handleCategoriesSync);
    window.addEventListener('extra_sauce_config_updated', handleSauceSync);
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
              if (data.promo_settings.extra_sauce_config) {
                const normSauce = saveStoredExtraSauceConfig(data.promo_settings.extra_sauce_config);
                setExtraSauceConfig(normSauce);
                setTempSauceActive(normSauce.active !== false);
                setTempSauceName(normSauce.name || 'Molho Especial da Casa');
                setTempSaucePrice(normSauce.price !== undefined ? normSauce.price.toString() : '3.00');
                setTempSauceDescription(normSauce.description || '');
              }
            }
            if (Array.isArray(data.pizza_flavors)) {
              const normFlavors = normalizePizzaFlavors(data.pizza_flavors);
              setPizzaFlavors(normFlavors);
              saveStoredPizzaFlavors(normFlavors);
            }
            if (Array.isArray(data.delivery_categories)) {
              const normCats = normalizeCategoriesList(data.delivery_categories);
              setDeliveryCategories(normCats);
              saveStoredCategories(normCats);
            }
            if (data.acai_settings) {
              const normAcai = saveStoredAcaiSettings(data.acai_settings);
              setAcaiSettings(normAcai);
              if (normAcai.maxComplementsPerAcai !== undefined) setTempMaxAcai((normAcai.maxComplementsPerAcai || 0).toString());
              if (normAcai.maxComplementsPerComboBarca !== undefined) setTempMaxComboBarca((normAcai.maxComplementsPerComboBarca || 0).toString());
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
                ...(data.card_machine_settings ? { cardMachineSettings: stripPrivateCardMachineSettings(data.card_machine_settings) } : {})
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
                if (cs.debitFixed !== undefined) setTempCardDebitFixed(cs.debitFixed.toString());
                if (cs.creditFixed !== undefined) setTempCardCreditFixed(cs.creditFixed.toString());
                if (cs.autoAddToTotal !== undefined) setTempCardAutoAdd(cs.autoAddToTotal);
                if (cs.customNotice !== undefined) setTempCardCustomNotice(cs.customNotice);
              }
            }
          }
        });

      try {
        const existingChannels = typeof supabase.getChannels === 'function' ? supabase.getChannels() : [];
        const prevMenu = existingChannels.find(ch => ch?.topic?.includes('realtime_cs_menu_admin'));
        if (prevMenu) supabase.removeChannel(prevMenu);

        channelCompanySettingsAdmin = supabase
          .channel(`realtime_cs_menu_admin_${Date.now()}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'company_settings', filter: 'id=eq.el_shadday_config' }, (payload) => {
            const fresh = payload.new;
            // Ignora outras linhas (ex.: sessão do WhatsApp, que tem loja 'fechada' e listas vazias)
            if (fresh && fresh.id === 'el_shadday_config') {
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
              if (Array.isArray(fresh.delivery_categories)) {
                const normCats = normalizeCategoriesList(fresh.delivery_categories);
                setDeliveryCategories(normCats);
                saveStoredCategories(normCats);
              }
              if (fresh.acai_settings) {
                const normAcai = saveStoredAcaiSettings(fresh.acai_settings);
                setAcaiSettings(normAcai);
                if (normAcai.maxComplementsPerAcai !== undefined) setTempMaxAcai((normAcai.maxComplementsPerAcai || 0).toString());
                if (normAcai.maxComplementsPerComboBarca !== undefined) setTempMaxComboBarca((normAcai.maxComplementsPerComboBarca || 0).toString());
              }
              if (fresh.promo_settings) {
                setPromoSettings(fresh.promo_settings);
                saveStoredPromoSettings(fresh.promo_settings);
                if (fresh.promo_settings.extra_sauce_config) {
                  const normSauce = saveStoredExtraSauceConfig(fresh.promo_settings.extra_sauce_config);
                  setExtraSauceConfig(normSauce);
                  setTempSauceActive(normSauce.active !== false);
                  setTempSauceName(normSauce.name || 'Molho Especial da Casa');
                  setTempSaucePrice(normSauce.price !== undefined ? normSauce.price.toString() : '3.00');
                  setTempSauceDescription(normSauce.description || '');
                }
              }
            }
          })
          .subscribe();
      } catch (err) {
        console.warn('[AdminDashboard] Falha ao registrar realtime menu_admin:', err);
      }
    }

    return () => {
      window.removeEventListener('delivery_products_updated', handleProductsSync);
      window.removeEventListener('delivery_promos_updated', handlePromosSync);
      window.removeEventListener('delivery_restaurant_info_updated', handleStoreSync);
      window.removeEventListener('pizza_flavors_updated', handleFlavorsSync);
      window.removeEventListener('acai_settings_updated', handleAcaiSync);
      window.removeEventListener('delivery_categories_updated', handleCategoriesSync);
      window.removeEventListener('extra_sauce_config_updated', handleSauceSync);
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

    const isBoxProductCategory = prodFormCategory === 'caixas' || (prodFormName.toLowerCase().includes('caixa') && prodFormName.toLowerCase().includes('esfirr'));
    const inferredCount = parseInt(editingProduct?.totalCount || prodFormName.match(/\d+/)?.[0] || '20', 10);
    const inferredSalgadas = editingProduct?.salgadasCount || (inferredCount === 50 ? 40 : (inferredCount === 40 ? 33 : (inferredCount === 30 ? 22 : 15)));
    const inferredDoces = editingProduct?.docesCount || Math.max(0, inferredCount - inferredSalgadas);

    const savedProd = {
      ...(editingProduct || {}),
      id: editingProduct ? editingProduct.id : `prod_${Date.now()}`,
      name: prodFormName.trim(),
      categoryId: prodFormCategory,
      price: priceNum,
      originalPrice: (origPriceNum && origPriceNum > priceNum) ? origPriceNum : (prodFormIsPromo ? (origPriceNum || Math.round(priceNum * 1.25)) : undefined),
      badge: prodFormBadge.trim() || (prodFormIsPromo ? 'Promoção 🔥' : ''),
      description: prodFormDescription.trim(),
      details: prodFormDetails.trim(),
      image: prodFormImage.trim(),
      isAvailable: prodFormIsAvailable,
      isPromo: prodFormIsPromo,
      isHighlight: !!prodFormIsHighlight,
      bordaGratis: prodFormBordaGratis,
      isBox: editingProduct ? (editingProduct.isBox ?? isBoxProductCategory) : isBoxProductCategory,
      totalCount: isBoxProductCategory ? inferredCount : editingProduct?.totalCount,
      salgadasCount: isBoxProductCategory ? inferredSalgadas : editingProduct?.salgadasCount,
      docesCount: isBoxProductCategory ? inferredDoces : editingProduct?.docesCount,
      creditPrice: editingProduct?.creditPrice || (isBoxProductCategory ? (inferredCount === 50 ? 75 : (inferredCount === 40 ? 60 : (inferredCount === 30 ? 50 : 40))) : undefined),
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

  const handleSaveExtraSauceConfig = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const parsedPrice = parseFloat(tempSaucePrice.toString().replace(',', '.')) || 0;
    const updated = {
      active: tempSauceActive,
      name: tempSauceName.trim() || 'Molho Especial da Casa',
      price: parsedPrice,
      description: tempSauceDescription.trim()
    };
    saveStoredExtraSauceConfig(updated);
    setExtraSauceConfig(updated);
    dispatchConfigSync('EXTRA_SAUCE_UPDATE', updated);
    triggerMenuToast('Configurações de Molho Extra salvas com sucesso!');
  };

  const handleSaveStoreSettings = (e) => {
    if (e) e.preventDefault();
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
      isOpen: tempStoreIsOpen,
      closedMessage: tempStoreClosedMessage.trim(),
      reopenTime: tempStoreReopenTime.trim(),
      cardMachineNotice: tempStoreCardMachineNotice.trim(),
      cardMachineNoticeActive: tempStoreCardMachineNoticeActive
    };
    setRestaurantSettings(newStore);
    saveStoredRestaurantInfo(newStore);
    dispatchConfigSync('STORE_UPDATE', newStore);

    // Sync with active/current branch
    try {
      if (currentBranch?.id) {
        updateBranch(currentBranch.id, {
          openingHours: tempStoreOpeningHours.trim(),
          status: tempStoreIsOpen ? 'active' : 'closed',
          deliveryTime: tempStoreDeliveryTime.trim()
        });
      }
    } catch (err) {}

    triggerMenuToast('Configurações da loja, horários e status atualizados com sucesso!');
  };

  const handleQuickToggleStoreStatus = () => {
    const nextIsOpen = !(restaurantSettings.isOpen !== false);
    const newStore = {
      ...restaurantSettings,
      isOpen: nextIsOpen
    };
    setRestaurantSettings(newStore);
    setTempStoreIsOpen(nextIsOpen);
    saveStoredRestaurantInfo(newStore);
    dispatchConfigSync('STORE_UPDATE', newStore);

    try {
      if (currentBranch?.id) {
        updateBranch(currentBranch.id, {
          status: nextIsOpen ? 'active' : 'closed'
        });
      }
    } catch (err) {}

    triggerMenuToast(nextIsOpen ? '🟢 Estabelecimento ABERTO para pedidos online!' : '🔴 Estabelecimento FECHADO para pedidos online!');
  };

  const handleSaveCardMachineSettings = (e) => {
    if (e) e.preventDefault();
    const pctNum = parseFloat(tempCardPercentage.toString().replace(',', '.')) || 0;
    const fixNum = parseFloat(tempCardFixed.toString().replace(',', '.')) || 0;
    const debNum = parseFloat(tempCardDebit.toString().replace(',', '.')) || 0;
    const credNum = parseFloat(tempCardCredit.toString().replace(',', '.')) || 0;
    const debFixNum = parseFloat(tempCardDebitFixed.toString().replace(',', '.')) || 0;
    const credFixNum = parseFloat(tempCardCreditFixed.toString().replace(',', '.')) || 0;

    const newCardSettings = {
      active: tempCardActive,
      type: tempCardType,
      percentageRate: pctNum,
      fixedRate: fixNum,
      debitRate: debNum,
      creditRate: credNum,
      debitFixed: debFixNum,
      creditFixed: credFixNum,
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
  const handleUploadFlavorImageFile = async (file) => {
    if (!file) return;
    setIsUploadingFlavorImage(true);
    try {
      // 1. Tenta hospedar diretamente no Supabase Storage (Nuvem)
      const storageUrl = await uploadMediaToSupabaseStorage(file, 'flavors');
      if (storageUrl) {
        setFlavorFormImage(storageUrl);
        triggerMenuToast('Foto enviada para o banco Supabase com sucesso!');
        return;
      }

      // 2. Fallback: comprime em WebP leve otimizado para salvar no banco
      const comp = await compressImageFile(file, {
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.80,
        mimeType: 'image/webp'
      });
      if (comp?.dataUrl) {
        setFlavorFormImage(comp.dataUrl);
        triggerMenuToast('Foto otimizada e pronta para salvar!');
      }
    } catch (err) {
      console.warn('Erro ao processar imagem do sabor:', err);
      const reader = new FileReader();
      reader.onload = (re) => {
        if (re.target?.result) setFlavorFormImage(re.target.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingFlavorImage(false);
    }
  };

  const handleOpenCreateFlavor = () => {
    setEditingFlavor(null);
    setFlavorFormName('');
    setFlavorFormPrice('40.00');
    setFlavorFormPrices({
      brotinho: '15.00',
      p: '20.00',
      m: '30.00',
      familia: '40.00',
      gigante: '50.00'
    });
    setFlavorFormCategory('salgadas');
    setFlavorFormDescription('');
    setFlavorFormImage('');
    setFlavorFormIsAvailable(true);
    setIsFlavorModalOpen(true);
  };

  const handleOpenEditFlavor = (flavor) => {
    setEditingFlavor(flavor);
    setFlavorFormName(flavor.name || '');
    setFlavorFormPrice(flavor.price !== undefined ? flavor.price.toString() : '40.00');
    
    const brotinhoVal = flavor.prices?.brotinho ?? getPizzaFlavorPrice(flavor, 'brotinho');
    const pVal = flavor.prices?.p ?? getPizzaFlavorPrice(flavor, 'p');
    const mVal = flavor.prices?.m ?? getPizzaFlavorPrice(flavor, 'm');
    const famVal = flavor.prices?.familia ?? (flavor.price || 40.00);
    const gigVal = flavor.prices?.gigante ?? getPizzaFlavorPrice(flavor, 'gigante');

    setFlavorFormPrices({
      brotinho: Number(brotinhoVal).toFixed(2),
      p: Number(pVal).toFixed(2),
      m: Number(mVal).toFixed(2),
      familia: Number(famVal).toFixed(2),
      gigante: Number(gigVal).toFixed(2)
    });

    setFlavorFormCategory(flavor.category || 'salgadas');
    setFlavorFormDescription(flavor.description || '');
    setFlavorFormImage(flavor.image || '');
    setFlavorFormIsAvailable(flavor.isAvailable !== false);
    setIsFlavorModalOpen(true);
  };

  const handleSaveFlavor = async (e) => {
    e.preventDefault();
    if (isUploadingFlavorImage) {
      alert('Aguarde o envio da foto para a nuvem terminar antes de salvar o sabor.');
      return;
    }
    if (!flavorFormName.trim()) {
      alert('Informe o nome do sabor.');
      return;
    }
    
    const brotinhoNum = parseFloat(String(flavorFormPrices.brotinho).replace(',', '.')) || 15.00;
    const pNum = parseFloat(String(flavorFormPrices.p).replace(',', '.')) || 20.00;
    const mNum = parseFloat(String(flavorFormPrices.m).replace(',', '.')) || 30.00;
    const famNum = parseFloat(String(flavorFormPrices.familia).replace(',', '.')) || 40.00;
    const gigNum = parseFloat(String(flavorFormPrices.gigante).replace(',', '.')) || 50.00;

    if (brotinhoNum <= 0 || pNum <= 0 || mNum <= 0 || famNum <= 0 || gigNum <= 0) {
      alert('Informe valores válidos maiores que zero para todos os tamanhos de pizza.');
      return;
    }

    const savedFlavor = {
      id: editingFlavor ? editingFlavor.id : `flavor_${Date.now()}`,
      name: flavorFormName.trim(),
      price: famNum,
      prices: {
        brotinho: brotinhoNum,
        p: pNum,
        m: mNum,
        familia: famNum,
        gigante: gigNum
      },
      category: flavorFormCategory,
      description: flavorFormDescription.trim(),
      image: flavorFormImage.trim(),
      // Foto apagada no formulário = sem foto de propósito; com foto = volta a mostrar
      imageRemoved: !flavorFormImage.trim() && Boolean(editingFlavor?.imageRemoved),
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

  // Handlers for Açaí Complements & Settings
  const handleSaveAcaiLimits = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const limAcai = Math.max(0, parseInt(tempMaxAcai, 10) || 0);
    const limCombo = Math.max(0, parseInt(tempMaxComboBarca, 10) || 0);
    const updated = {
      ...acaiSettings,
      maxComplementsPerAcai: limAcai,
      maxComplementsPerComboBarca: limCombo
    };
    setAcaiSettings(updated);
    saveStoredAcaiSettings(updated);
    dispatchConfigSync('ACAI_SETTINGS_UPDATE', updated);
    triggerMenuToast('Limites de acompanhamentos do Açaí salvos e sincronizados com sucesso!');
  };

  const handleToggleComplementAvailability = (complementId) => {
    const updatedComps = (acaiSettings.complements || []).map(c => {
      if (c.id === complementId) {
        const nextState = c.isAvailable === false ? true : false;
        triggerMenuToast(nextState ? `Acompanhamento "${c.name}" disponível!` : `Acompanhamento "${c.name}" pausado (esgotado)!`);
        return { ...c, isAvailable: nextState };
      }
      return c;
    });
    const updated = { ...acaiSettings, complements: updatedComps };
    setAcaiSettings(updated);
    saveStoredAcaiSettings(updated);
    dispatchConfigSync('ACAI_SETTINGS_UPDATE', updated);
  };

  const handleToggleComplementDefault = (complementId) => {
    const updatedComps = (acaiSettings.complements || []).map(c => {
      if (c.id === complementId) {
        return { ...c, defaultSelected: !c.defaultSelected };
      }
      return c;
    });
    const updated = { ...acaiSettings, complements: updatedComps };
    setAcaiSettings(updated);
    saveStoredAcaiSettings(updated);
    dispatchConfigSync('ACAI_SETTINGS_UPDATE', updated);
  };

  const handleOpenCreateComplement = () => {
    setEditingComplement(null);
    setComplementFormName('');
    setComplementFormIcon('🥜');
    setComplementFormPrice('0');
    setComplementFormIsAvailable(true);
    setComplementFormDefaultSelected(false);
    setIsComplementModalOpen(true);
  };

  const handleOpenEditComplement = (comp) => {
    setEditingComplement(comp);
    setComplementFormName(comp.name || '');
    setComplementFormIcon(comp.icon || '✨');
    setComplementFormPrice((comp.price ?? 0).toString());
    setComplementFormIsAvailable(comp.isAvailable !== false);
    setComplementFormDefaultSelected(Boolean(comp.defaultSelected));
    setIsComplementModalOpen(true);
  };

  const handleSaveComplement = (e) => {
    e.preventDefault();
    if (!complementFormName.trim()) {
      alert('Informe o nome do acompanhamento.');
      return;
    }
    const priceNum = Math.max(0, parseFloat(complementFormPrice.toString().replace(',', '.')) || 0);
    const newComp = {
      id: editingComplement ? editingComplement.id : `acai_comp_${Date.now()}`,
      name: complementFormName.trim(),
      icon: complementFormIcon.trim() || '✨',
      price: priceNum,
      isAvailable: complementFormIsAvailable,
      defaultSelected: complementFormDefaultSelected
    };

    let updatedComps;
    if (editingComplement) {
      updatedComps = (acaiSettings.complements || []).map(c => c.id === editingComplement.id ? newComp : c);
      triggerMenuToast(`Acompanhamento "${newComp.name}" atualizado com sucesso!`);
    } else {
      updatedComps = [...(acaiSettings.complements || []), newComp];
      triggerMenuToast(`Novo acompanhamento "${newComp.name}" adicionado!`);
    }

    const updated = { ...acaiSettings, complements: updatedComps };
    setAcaiSettings(updated);
    saveStoredAcaiSettings(updated);
    dispatchConfigSync('ACAI_SETTINGS_UPDATE', updated);
    setIsComplementModalOpen(false);
  };

  const handleDeleteComplement = (complementId) => {
    const comp = (acaiSettings.complements || []).find(c => c.id === complementId);
    if (!window.confirm(`Tem certeza que deseja remover o acompanhamento "${comp?.name || ''}"?`)) return;
    const updatedComps = (acaiSettings.complements || []).filter(c => c.id !== complementId);
    const updated = { ...acaiSettings, complements: updatedComps };
    setAcaiSettings(updated);
    saveStoredAcaiSettings(updated);
    dispatchConfigSync('ACAI_SETTINGS_UPDATE', updated);
    triggerMenuToast('Acompanhamento removido.');
  };

  const handleOpenCreateCobertura = () => {
    setEditingCobertura(null);
    setCoberturaFormName('');
    setCoberturaFormPrice('0');
    setCoberturaFormIsAvailable(true);
    setIsCoberturaModalOpen(true);
  };

  const handleOpenEditCobertura = (cob) => {
    const item = typeof cob === 'string' ? { id: cob, name: cob, price: 0, isAvailable: true } : cob;
    setEditingCobertura(item);
    setCoberturaFormName(item.name || '');
    setCoberturaFormPrice((item.price ?? 0).toString());
    setCoberturaFormIsAvailable(item.isAvailable !== false);
    setIsCoberturaModalOpen(true);
  };

  const handleSaveCobertura = (e) => {
    e.preventDefault();
    if (!coberturaFormName.trim()) {
      alert('Informe o nome da cobertura.');
      return;
    }
    const priceNum = Math.max(0, parseFloat(coberturaFormPrice.toString().replace(',', '.')) || 0);
    const newCob = {
      id: editingCobertura ? editingCobertura.id : `cob_${Date.now()}`,
      name: coberturaFormName.trim(),
      price: priceNum,
      isAvailable: coberturaFormIsAvailable
    };

    let updatedCobs;
    if (editingCobertura) {
      updatedCobs = (acaiSettings.coberturas || []).map(c => {
        const isMatch = typeof c === 'string' ? c === editingCobertura.name : (c.id === editingCobertura.id || c.name === editingCobertura.name);
        return isMatch ? newCob : (typeof c === 'string' ? { id: c, name: c, price: 0, isAvailable: true } : c);
      });
      triggerMenuToast(`Cobertura "${newCob.name}" atualizada com sucesso!`);
    } else {
      const exists = (acaiSettings.coberturas || []).some(c => (typeof c === 'string' ? c : c.name).toLowerCase() === newCob.name.toLowerCase());
      if (exists) {
        alert('Esta cobertura já existe na lista.');
        return;
      }
      const existingObjs = (acaiSettings.coberturas || []).map(c => typeof c === 'string' ? { id: c, name: c, price: 0, isAvailable: true } : c);
      updatedCobs = [...existingObjs, newCob];
      triggerMenuToast(`Nova cobertura "${newCob.name}" adicionada!`);
    }

    const updated = { ...acaiSettings, coberturas: updatedCobs };
    setAcaiSettings(updated);
    saveStoredAcaiSettings(updated);
    dispatchConfigSync('ACAI_SETTINGS_UPDATE', updated);
    setIsCoberturaModalOpen(false);
  };

  const handleToggleCoberturaAvailability = (cobIdOrName) => {
    const updatedCobs = (acaiSettings.coberturas || []).map(c => {
      const isMatch = typeof c === 'string' ? c === cobIdOrName : (c.id === cobIdOrName || c.name === cobIdOrName);
      if (isMatch) {
        const itemObj = typeof c === 'string' ? { id: c, name: c, price: 0, isAvailable: true } : c;
        const nextState = itemObj.isAvailable === false ? true : false;
        triggerMenuToast(nextState ? `Cobertura "${itemObj.name}" ativada (disponível)!` : `Cobertura "${itemObj.name}" pausada (esgotada)!`);
        return { ...itemObj, isAvailable: nextState };
      }
      return typeof c === 'string' ? { id: c, name: c, price: 0, isAvailable: true } : c;
    });
    const updated = { ...acaiSettings, coberturas: updatedCobs };
    setAcaiSettings(updated);
    saveStoredAcaiSettings(updated);
    dispatchConfigSync('ACAI_SETTINGS_UPDATE', updated);
  };

  const handleAddCobertura = (e) => {
    e.preventDefault();
    const val = newCoberturaText.trim();
    if (!val) return;
    const exists = (acaiSettings.coberturas || []).some(c => (typeof c === 'string' ? c : c.name).toLowerCase() === val.toLowerCase());
    if (exists) {
      alert('Esta cobertura já existe na lista.');
      return;
    }
    const priceNum = Math.max(0, parseFloat(newCoberturaPrice.toString().replace(',', '.')) || 0);
    const newCob = {
      id: `cob_${Date.now()}`,
      name: val,
      price: priceNum,
      isAvailable: true
    };
    const existingObjs = (acaiSettings.coberturas || []).map(c => typeof c === 'string' ? { id: c, name: c, price: 0, isAvailable: true } : c);
    const updatedCobs = [...existingObjs, newCob];
    const updated = { ...acaiSettings, coberturas: updatedCobs };
    setAcaiSettings(updated);
    saveStoredAcaiSettings(updated);
    dispatchConfigSync('ACAI_SETTINGS_UPDATE', updated);
    setNewCoberturaText('');
    setNewCoberturaPrice('0');
    triggerMenuToast(`Cobertura "${val}" adicionada com sucesso!`);
  };

  const handleDeleteCobertura = (cobIdOrName) => {
    const cob = (acaiSettings.coberturas || []).find(c => 
      typeof c === 'string' ? c === cobIdOrName : (c.id === cobIdOrName || c.name === cobIdOrName)
    );
    const cobName = typeof cob === 'string' ? cob : (cob?.name || '');
    if (cobName === 'Sem Cobertura' || (cob && cob.id === 'sem-cobertura')) {
      alert('"Sem Cobertura" é a opção padrão do cliente e não pode ser removida.');
      return;
    }
    if (!window.confirm(`Remover "${cobName}" da lista de coberturas?`)) return;
    const updatedCobs = (acaiSettings.coberturas || []).filter(c => 
      typeof c === 'string' ? c !== cobIdOrName : (c.id !== cobIdOrName && c.name !== cobIdOrName)
    );
    const updated = { ...acaiSettings, coberturas: updatedCobs };
    setAcaiSettings(updated);
    saveStoredAcaiSettings(updated);
    dispatchConfigSync('ACAI_SETTINGS_UPDATE', updated);
    triggerMenuToast('Cobertura removida.');
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

  const handleRemoveFlavorPhoto = (flavorId) => {
    const target = pizzaFlavors.find(f => f.id === flavorId);
    if (!window.confirm(`Deseja remover a foto do sabor "${target?.name || ''}"?`)) return;
    const updated = pizzaFlavors.map(f => f.id === flavorId ? { ...f, image: '', imageRemoved: true } : f);
    setPizzaFlavors(updated);
    saveStoredPizzaFlavors(updated);
    dispatchConfigSync('PIZZA_FLAVORS_UPDATE', updated);
    triggerMenuToast(`Foto do sabor "${target?.name || ''}" removida com sucesso!`);
  };

  const handleClearAllFlavorPhotos = () => {
    if (!window.confirm('Deseja remover as fotos de todos os sabores de pizza? Os nomes, categorias e preços serão mantidos intactos.')) return;
    const updated = pizzaFlavors.map(f => ({ ...f, image: '' }));
    setPizzaFlavors(updated);
    saveStoredPizzaFlavors(updated);
    dispatchConfigSync('PIZZA_FLAVORS_UPDATE', updated);
    triggerMenuToast('Todas as fotos dos sabores foram removidas com sucesso!');
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

  // Handlers & Sync for Delivery Districts (Taxas de Entrega)
  useEffect(() => {
    const handleDistrictsSync = (e) => {
      if (e?.detail && Array.isArray(e.detail)) setDistrictsList(e.detail);
      else setDistrictsList(getStoredDistricts());
    };
    window.addEventListener('delivery_districts_updated', handleDistrictsSync);
    window.addEventListener('storage', handleDistrictsSync);
    return () => {
      window.removeEventListener('delivery_districts_updated', handleDistrictsSync);
      window.removeEventListener('storage', handleDistrictsSync);
    };
  }, []);

  const handleAddNewDistrict = async (e) => {
    if (e) e.preventDefault();
    if (!newDistrictName.trim()) {
      triggerMenuToast('Por favor, informe o nome do bairro ou localidade.');
      return;
    }

    const cleanPrice = Math.max(0, parseFloat(String(newDistrictPrice).replace(',', '.')) || 0);
    const cleanId = newDistrictName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || `dist_${Date.now()}`;
    const newDistrict = {
      id: `${cleanId}_${Date.now().toString().slice(-4)}`,
      name: newDistrictName.trim(),
      price: cleanPrice,
      isAvailable: true
    };

    const updated = [newDistrict, ...districtsList];
    setDistrictsList(updated);
    saveStoredDistricts(updated);
    await dispatchConfigSync('DELIVERY_DISTRICTS_UPDATE', updated);
    setNewDistrictName('');
    setNewDistrictPrice('8.00');
    triggerMenuToast(`Bairro "${newDistrict.name}" cadastrado com taxa de R$ ${cleanPrice.toFixed(2).replace('.', ',')}!`);
  };

  const handleUpdateDistrictInlinePrice = async (districtId, newPriceStr) => {
    const cleanPrice = Math.max(0, parseFloat(String(newPriceStr).replace(',', '.')) || 0);
    const updated = districtsList.map(d => d.id === districtId ? { ...d, price: cleanPrice } : d);
    setDistrictsList(updated);
    saveStoredDistricts(updated);
    await dispatchConfigSync('DELIVERY_DISTRICTS_UPDATE', updated);
    const target = updated.find(d => d.id === districtId);
    triggerMenuToast(`Taxa de "${target?.name || 'Bairro'}" atualizada para R$ ${cleanPrice.toFixed(2).replace('.', ',')}`);
  };

  const handleOpenEditDistrict = (district) => {
    setEditingDistrict(district);
    setDistrictFormName(district.name || '');
    setDistrictFormPrice(Number(district.price || 0).toFixed(2));
    setDistrictFormIsAvailable(district.isAvailable !== false);
    setIsDistrictModalOpen(true);
  };

  const handleSaveDistrictModal = async (e) => {
    if (e) e.preventDefault();
    if (!districtFormName.trim()) {
      triggerMenuToast('Por favor, digite o nome do bairro.');
      return;
    }
    const cleanPrice = Math.max(0, parseFloat(String(districtFormPrice).replace(',', '.')) || 0);
    const updated = districtsList.map(d => {
      if (d.id === editingDistrict.id) {
        return {
          ...d,
          name: districtFormName.trim(),
          price: cleanPrice,
          isAvailable: districtFormIsAvailable
        };
      }
      return d;
    });

    setDistrictsList(updated);
    saveStoredDistricts(updated);
    await dispatchConfigSync('DELIVERY_DISTRICTS_UPDATE', updated);
    setIsDistrictModalOpen(false);
    triggerMenuToast(`Bairro "${districtFormName.trim()}" atualizado com sucesso!`);
  };

  const handleToggleDistrictAvailability = async (districtId) => {
    const updated = districtsList.map(d => {
      if (d.id === districtId) {
        const nextState = d.isAvailable === false ? true : false;
        triggerMenuToast(nextState ? `Bairro "${d.name}" ativado para entregas!` : `Bairro "${d.name}" pausado (temporariamente indisponível)!`);
        return { ...d, isAvailable: nextState };
      }
      return d;
    });
    setDistrictsList(updated);
    saveStoredDistricts(updated);
    await dispatchConfigSync('DELIVERY_DISTRICTS_UPDATE', updated);
  };

  const handleDeleteDistrict = async (districtId, districtName) => {
    if (!window.confirm(`Deseja realmente remover o bairro "${districtName}" da lista de entregas?`)) return;
    const updated = districtsList.filter(d => d.id !== districtId);
    setDistrictsList(updated);
    saveStoredDistricts(updated);
    await dispatchConfigSync('DELIVERY_DISTRICTS_UPDATE', updated);
    triggerMenuToast(`Bairro "${districtName}" removido.`);
  };

  const handleResetDefaultDistricts = async () => {
    if (!window.confirm('Deseja restaurar a lista padrão com os 48 bairros oficiais de Ariquemes?')) return;
    const defaultList = normalizeDistrictsList(ARIQUEMES_DISTRICTS);
    setDistrictsList(defaultList);
    saveStoredDistricts(defaultList);
    await dispatchConfigSync('DELIVERY_DISTRICTS_UPDATE', defaultList);
    triggerMenuToast('Lista padrão de bairros restaurada com sucesso!');
  };

  const filteredDistricts = useMemo(() => {
    let list = districtsList;
    if (districtSearch.trim()) {
      const q = districtSearch.toLowerCase().trim();
      list = list.filter(d => (d.name || '').toLowerCase().includes(q));
    }
    if (districtPriceFilter === '8') {
      list = list.filter(d => Number(d.price) === 8 && d.isAvailable !== false);
    } else if (districtPriceFilter === '10') {
      list = list.filter(d => Number(d.price) === 10 && d.isAvailable !== false);
    } else if (districtPriceFilter === '15') {
      list = list.filter(d => Number(d.price) === 15 && d.isAvailable !== false);
    } else if (districtPriceFilter === '20+') {
      list = list.filter(d => Number(d.price) >= 20 && d.isAvailable !== false);
    } else if (districtPriceFilter === 'unavailable') {
      list = list.filter(d => d.isAvailable === false);
    }
    return list;
  }, [districtsList, districtSearch, districtPriceFilter]);

  // Handlers for Category / Topics Reordering
  const handleDragStartCategory = (e, index) => {
    setDraggedCategoryIndex(index);
    try {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    } catch {
      // ignore
    }
  };

  const handleDragOverCategory = (e, index) => {
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch {
      // ignore
    }
  };

  const handleDropCategory = async (e, targetIndex) => {
    e.preventDefault();
    if (draggedCategoryIndex === null || draggedCategoryIndex === targetIndex) {
      setDraggedCategoryIndex(null);
      return;
    }

    const updated = [...deliveryCategories];
    const [moved] = updated.splice(draggedCategoryIndex, 1);
    updated.splice(targetIndex, 0, moved);

    setDeliveryCategories(updated);
    saveStoredCategories(updated);
    await dispatchConfigSync('DELIVERY_CATEGORIES_UPDATE', updated);
    setDraggedCategoryIndex(null);
    triggerMenuToast(`Tópico "${moved.name}" posicionado em ${targetIndex + 1}º lugar!`);
  };

  const handleDragEndCategory = () => {
    setDraggedCategoryIndex(null);
  };

  const handleMoveCategory = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= deliveryCategories.length) return;

    const updated = [...deliveryCategories];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    setDeliveryCategories(updated);
    saveStoredCategories(updated);
    await dispatchConfigSync('DELIVERY_CATEGORIES_UPDATE', updated);
    triggerMenuToast(`Tópico "${moved.name}" movido para ${targetIndex + 1}º lugar!`);
  };

  const handleMoveCategoryToTop = async (index) => {
    if (index === 0) return;
    const updated = [...deliveryCategories];
    const [moved] = updated.splice(index, 1);
    updated.unshift(moved);

    setDeliveryCategories(updated);
    saveStoredCategories(updated);
    await dispatchConfigSync('DELIVERY_CATEGORIES_UPDATE', updated);
    triggerMenuToast(`Tópico "${moved.name}" colocado no 1º lugar do cardápio!`);
  };

  const handleToggleCategoryVisibility = async (categoryId) => {
    const updated = deliveryCategories.map(c => {
      if (c.id === categoryId) {
        const nextState = c.visible === false ? true : false;
        triggerMenuToast(nextState ? `Tópico "${c.name}" agora está visível no cardápio!` : `Tópico "${c.name}" ocultado do cardápio!`);
        return { ...c, visible: nextState };
      }
      return c;
    });

    setDeliveryCategories(updated);
    saveStoredCategories(updated);
    await dispatchConfigSync('DELIVERY_CATEGORIES_UPDATE', updated);
  };

  const handleResetCategoriesOrder = async () => {
    if (!window.confirm('Deseja restaurar a ordem padrão dos tópicos do cardápio?')) return;
    const defaultList = normalizeCategoriesList(CATEGORIES);
    setDeliveryCategories(defaultList);
    saveStoredCategories(defaultList);
    await dispatchConfigSync('DELIVERY_CATEGORIES_UPDATE', defaultList);
    triggerMenuToast('Ordem padrão dos tópicos restaurada com sucesso!');
  };

  // Buffet Items Availability Management State
  const [buffetCategories, setBuffetCategories] = useState(() => getStoredBuffetCategories());
  const [unavailableBuffetIds, setUnavailableBuffetIds] = useState(() => getUnavailableBuffetItemIds());
  const [buffetSearchQuery, setBuffetSearchQuery] = useState('');
  const [buffetCategoryFilter, setBuffetCategoryFilter] = useState('all');

  // Buffet Item Add / Edit Modal State
  const [isBuffetItemModalOpen, setIsBuffetItemModalOpen] = useState(false);
  const [editingBuffetItem, setEditingBuffetItem] = useState(null); // null if new, or item object
  const [buffetItemFormCategoryId, setBuffetItemFormCategoryId] = useState('prato_principal');
  const [buffetItemFormName, setBuffetItemFormName] = useState('');
  const [buffetItemFormDesc, setBuffetItemFormDesc] = useState('');
  const [buffetItemFormIsAssado, setBuffetItemFormIsAssado] = useState(false);
  const [buffetItemFormIsAvailable, setBuffetItemFormIsAvailable] = useState(true);

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

  const handleOpenCreateBuffetItem = (preferredCatId = 'prato_principal') => {
    setEditingBuffetItem(null);
    setBuffetItemFormCategoryId(preferredCatId || buffetCategories[0]?.id || 'prato_principal');
    setBuffetItemFormName('');
    setBuffetItemFormDesc('');
    setBuffetItemFormIsAssado(preferredCatId === 'prato_principal');
    setBuffetItemFormIsAvailable(true);
    setIsBuffetItemModalOpen(true);
  };

  const handleOpenEditBuffetItem = (item, categoryId) => {
    setEditingBuffetItem({ ...item, categoryId });
    setBuffetItemFormCategoryId(categoryId || 'prato_principal');
    setBuffetItemFormName(item.name || '');
    setBuffetItemFormDesc(item.desc || '');
    setBuffetItemFormIsAssado(Boolean(item.isAssado));
    setBuffetItemFormIsAvailable(!unavailableBuffetIds.includes(item.id) && item.active !== false);
    setIsBuffetItemModalOpen(true);
  };

  const handleSaveBuffetItem = async (e) => {
    if (e) e.preventDefault();
    if (!buffetItemFormName.trim()) {
      triggerMenuToast('Por favor, informe o nome do prato!');
      return;
    }

    const currentCats = getStoredBuffetCategories();
    let updatedCats = [];
    const targetCatId = buffetItemFormCategoryId || 'prato_principal';

    if (editingBuffetItem) {
      // Editar prato existente
      const originalCatId = editingBuffetItem.categoryId;
      const itemId = editingBuffetItem.id;
      
      const updatedItem = {
        ...editingBuffetItem,
        name: buffetItemFormName.trim(),
        desc: buffetItemFormDesc.trim(),
        isAssado: Boolean(buffetItemFormIsAssado),
        badge: buffetItemFormIsAssado ? 'Assados' : (editingBuffetItem.badge || undefined),
        active: buffetItemFormIsAvailable
      };
      delete updatedItem.categoryId;

      if (originalCatId === targetCatId) {
        // Permanece na mesma categoria
        updatedCats = currentCats.map(cat => {
          if (cat.id !== targetCatId) return cat;
          return {
            ...cat,
            items: (cat.items || []).map(i => i.id === itemId ? updatedItem : i)
          };
        });
      } else {
        // Mudou de categoria: remove da antiga e insere na nova
        updatedCats = currentCats.map(cat => {
          if (cat.id === originalCatId) {
            return {
              ...cat,
              items: (cat.items || []).filter(i => i.id !== itemId)
            };
          }
          if (cat.id === targetCatId) {
            return {
              ...cat,
              items: [...(cat.items || []), updatedItem]
            };
          }
          return cat;
        });
      }

      // Atualiza disponibilidade
      let newUnavail = [...unavailableBuffetIds];
      if (buffetItemFormIsAvailable) {
        newUnavail = newUnavail.filter(id => id !== itemId);
      } else if (!newUnavail.includes(itemId)) {
        newUnavail.push(itemId);
      }
      saveUnavailableBuffetItemIds(newUnavail);
      setUnavailableBuffetIds(newUnavail);
      await dispatchConfigSync('BUFFET_AVAILABILITY_UPDATE', newUnavail);
      triggerMenuToast(`Prato "${buffetItemFormName.trim()}" atualizado com sucesso!`);
    } else {
      // Criar novo prato
      const newId = `buffet_prato_${Date.now()}`;
      const newItem = {
        id: newId,
        name: buffetItemFormName.trim(),
        desc: buffetItemFormDesc.trim(),
        isAssado: Boolean(buffetItemFormIsAssado),
        badge: buffetItemFormIsAssado ? 'Assados' : undefined,
        active: buffetItemFormIsAvailable
      };

      let categoryFound = false;
      updatedCats = currentCats.map(cat => {
        if (cat.id === targetCatId) {
          categoryFound = true;
          return {
            ...cat,
            items: [...(cat.items || []), newItem]
          };
        }
        return cat;
      });

      if (!categoryFound && updatedCats.length > 0) {
        updatedCats[0].items = [...(updatedCats[0].items || []), newItem];
      }

      if (!buffetItemFormIsAvailable) {
        const newUnavail = [...unavailableBuffetIds, newId];
        saveUnavailableBuffetItemIds(newUnavail);
        setUnavailableBuffetIds(newUnavail);
        await dispatchConfigSync('BUFFET_AVAILABILITY_UPDATE', newUnavail);
      }

      triggerMenuToast(`Prato "${buffetItemFormName.trim()}" adicionado ao Buffet!`);
    }

    saveStoredBuffetCategories(updatedCats);
    setBuffetCategories(updatedCats);
    await dispatchConfigSync('BUFFET_CATEGORIES_UPDATE', updatedCats);
    setIsBuffetItemModalOpen(false);
  };

  const handleDeleteBuffetItem = async (itemId, itemName) => {
    if (!window.confirm(`Tem certeza que deseja excluir o prato "${itemName}" do Buffet?`)) return;

    const currentCats = getStoredBuffetCategories();
    const updatedCats = currentCats.map(cat => ({
      ...cat,
      items: (cat.items || []).filter(i => i.id !== itemId)
    }));

    const nextUnavail = unavailableBuffetIds.filter(id => id !== itemId);
    saveStoredBuffetCategories(updatedCats);
    setBuffetCategories(updatedCats);
    saveUnavailableBuffetItemIds(nextUnavail);
    setUnavailableBuffetIds(nextUnavail);

    await dispatchConfigSync('BUFFET_CATEGORIES_UPDATE', updatedCats);
    await dispatchConfigSync('BUFFET_AVAILABILITY_UPDATE', nextUnavail);
    triggerMenuToast(`Prato "${itemName}" removido do Buffet.`);
  };

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

  // LOUD Restaurant Kitchen Alert Sound Engine using Web Audio API + Maximizer + Speech Synthesis
  const playChime = (isTest = false, customPhrase = '') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const t = ctx.currentTime;

      // Dynamics Compressor (Audio Maximizer & Limiter for maximum RMS loudness without distortion)
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-14, t);
      compressor.knee.setValueAtTime(6, t);
      compressor.ratio.setValueAtTime(16, t);
      compressor.attack.setValueAtTime(0.002, t);
      compressor.release.setValueAtTime(0.25, t);
      compressor.connect(ctx.destination);

      // Master output gain (Maximum boost)
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(1.0, t);
      masterGain.connect(compressor);

      // Play a piercing, rich multi-tone restaurant bell sequence (2 loud cycles: DING-DONG! ... DING-DONG!)
      const playTone = (freq1, freq2, startTime, duration = 0.35) => {
        // Fundamental Tone (Sine)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq1, startTime);
        gain1.gain.setValueAtTime(0.85, startTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.start(startTime);
        osc1.stop(startTime + duration);

        // Harmonic High Bell Tone (Triangle / Square for piercing through kitchen background noise)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq2, startTime);
        gain2.gain.setValueAtTime(0.75, startTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start(startTime);
        osc2.stop(startTime + duration);
      };

      // Cycle 1: High crisp ding-dong
      playTone(784.00, 1568.00, t, 0.32); // G5 + G6
      playTone(1046.50, 2093.00, t + 0.18, 0.45); // C6 + C7

      // Cycle 2: Louder repetition (Restaurant Service Chime)
      playTone(880.00, 1760.00, t + 0.48, 0.32); // A5 + A6
      playTone(1174.66, 2349.32, t + 0.66, 0.65); // D6 + D7

      // High-priority vocal alert at MAX volume (1.0)
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const phrase = customPhrase || (isTest 
            ? 'Alerta sonoro da cozinha no volume máximo!' 
            : 'Atenção cozinha! Novo pedido recebido!');
          const utterance = new SpeechSynthesisUtterance(phrase);
          utterance.lang = 'pt-BR';
          utterance.volume = 1.0; // 100% Volume
          utterance.rate = 1.02;
          utterance.pitch = 1.15; // Higher pitch cuts through ambient noise
          
          setTimeout(() => {
            try {
              window.speechSynthesis.speak(utterance);
            } catch (e) {}
          }, 700);
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
      if (list.length === 0) return;
      isInitialOrdersLoadedRef.current = true;
      // Pedidos antigos só entram na lista; pedido feito DEPOIS que o painel abriu
      // (ex.: 1º pedido do dia com a lista vazia) ainda toca o alarme
      let hasFresh = false;
      list.forEach(o => {
        if (!o?.orderId) return;
        const created = new Date(o.createdAt || 0).getTime();
        if (created > panelOpenedAtRef.current - 5000) hasFresh = true;
        else knownOrderIdsRef.current.add(o.orderId);
      });
      if (!hasFresh) return;
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

  // Live Shift Totals for Cash Register Status
  const currentShiftTotals = useMemo(() => {
    return calculateShiftTotals(scopedOrders);
  }, [scopedOrders]);

  // Background Auto-Closing Watcher for Cash Register (Checks every 25 seconds)
  useEffect(() => {
    const checkAutoCashClose = () => {
      try {
        const cashSettings = getCashRegisterSettings();
        if (!cashSettings.autoCloseEnabled || !cashSettings.autoCloseTime) return;

        const dateNow = new Date();
        const currentHours = dateNow.getHours().toString().padStart(2, '0');
        const currentMinutes = dateNow.getMinutes().toString().padStart(2, '0');
        const currentTimeStr = `${currentHours}:${currentMinutes}`;
        const todayDateStr = dateNow.toISOString().slice(0, 10);

        // Se o horário atual bate com o horário programado e ainda não fechou hoje nesse horário
        if (currentTimeStr === cashSettings.autoCloseTime && cashSettings.lastClosedDate !== todayDateStr) {
          console.log('⏰ Horário programado atingido! Fechando caixa automaticamente:', currentTimeStr);
          
          executeCashClosing({
            orders,
            closedBy: 'Fechamento Automático (Sistema)',
            closingType: 'automatic',
            initialDrawerCash: Number(cashSettings.initialDrawerCash) || 0,
            notes: `Fechamento diário automático programado para as ${cashSettings.autoCloseTime}.`,
            branchId: currentBranch?.id || 'ariquemes',
            branchName: currentBranch?.displayName || currentBranch?.name || 'Unidade Ariquemes'
          });

          playChime(true, `Atenção equipe! O caixa do dia foi encerrado automaticamente às ${cashSettings.autoCloseTime}. O relatório financeiro está salvo em finanças.`);
        }
      } catch (e) {
        console.warn('Auto close check error:', e);
      }
    };

    const interval = setInterval(checkAutoCashClose, 25000);
    return () => clearInterval(interval);
  }, [orders, currentBranch]);

  // Metrics calculations (Excluding cancelled orders, completed orders, and closed shifts!)
  const activeOrdersList = useMemo(() => {
    return scopedOrders.filter(o => {
      if (!o) return false;
      const st = normalizeOrderStatus(o);
      if (st === 'CANCELADO' || st === 'CONCLUIDO') return false;
      if (!showArchivedKdsOrders && (o.shiftClosedAt || o.isArchived)) return false;
      return true;
    });
  }, [scopedOrders, showArchivedKdsOrders]);

  const totalRevenue = useMemo(() => {
    return scopedOrders
      .filter(o => {
        if (!o || normalizeOrderStatus(o) === 'CANCELADO') return false;
        if (!showArchivedKdsOrders && (o.shiftClosedAt || o.isArchived)) return false;
        return o.paymentStatus === 'PAGO_APROVADO' || normalizeOrderStatus(o) === 'CONCLUIDO';
      })
      .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  }, [scopedOrders, showArchivedKdsOrders]);

  const pendingCount = useMemo(() => {
    return activeOrdersList.filter(o => normalizeOrderStatus(o) === 'RECEBIDO_COZINHA').length;
  }, [activeOrdersList]);

  const inPrepCount = useMemo(() => {
    return activeOrdersList.filter(o => normalizeOrderStatus(o) === 'EM_PREPARO').length;
  }, [activeOrdersList]);

  const inDeliveryCount = useMemo(() => {
    return activeOrdersList.filter(o => normalizeOrderStatus(o) === 'SAIU_ENTREGA').length;
  }, [activeOrdersList]);

  const readyBalcaoCount = useMemo(() => {
    return activeOrdersList.filter(o => normalizeOrderStatus(o) === 'PRONTO_BALCAO').length;
  }, [activeOrdersList]);

  const delayedCount = useMemo(() => {
    return activeOrdersList.filter(o => isOrderDelayed(o)).length;
  }, [activeOrdersList, now]);

  const completedCount = useMemo(() => {
    return scopedOrders.filter(o => {
      if (!o) return false;
      if (normalizeOrderStatus(o) !== 'CONCLUIDO') return false;
      if (!showArchivedKdsOrders && (o.shiftClosedAt || o.isArchived)) return false;
      return true;
    }).length;
  }, [scopedOrders, showArchivedKdsOrders]);

  const cancelledCount = useMemo(() => {
    return scopedOrders.filter(o => {
      if (!o) return false;
      if (normalizeOrderStatus(o) !== 'CANCELADO') return false;
      if (!showArchivedKdsOrders && (o.shiftClosedAt || o.isArchived)) return false;
      return true;
    }).length;
  }, [scopedOrders, showArchivedKdsOrders]);

  // Filtered orders list for KDS
  const filteredOrders = useMemo(() => {
    return scopedOrders.filter(order => {
      // Exclui pedidos de turnos anteriores já fechados da tela ativa da cozinha (a menos que o usuário clique para ver)
      if (!showArchivedKdsOrders && (order.shiftClosedAt || order.isArchived)) {
        return false;
      }

      const orderSt = normalizeOrderStatus(order);
      const isCancelled = orderSt === 'CANCELADO';
      const isConcluded = orderSt === 'CONCLUIDO';

      // Specific filter tabs
      if (selectedFilter === 'cancelados') {
        if (!isCancelled) return false;
      } else if (selectedFilter === 'concluidos') {
        if (!isConcluded) return false;
      } else {
        // All other tabs hide cancelled orders
        if (isCancelled) return false;
      }

      // 'todos' tab represents 'Ativos' in KDS: hide concluded orders!
      if (selectedFilter === 'todos') {
        if (isConcluded || isCancelled) return false;
      }

      if (selectedFilter === 'atrasados' && (!isOrderDelayed(order) || isConcluded)) return false;
      if (selectedFilter === 'pendentes' && orderSt !== 'RECEBIDO_COZINHA') return false;
      if (selectedFilter === 'preparo' && orderSt !== 'EM_PREPARO') return false;
      if (selectedFilter === 'pronto_balcao' && orderSt !== 'PRONTO_BALCAO') return false;
      if (selectedFilter === 'entrega' && orderSt !== 'SAIU_ENTREGA') return false;
      if (selectedFilter === 'nao_pagos' && (order.paymentStatus === 'PAGO_APROVADO' || isCancelled || isConcluded)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const displayNum = formatOrderNumber(order).toLowerCase();
        const matchesId = (order.orderId || '').toLowerCase().includes(q) || displayNum.includes(q) || `#${displayNum}`.includes(q);
        const matchesName = (order.customerName || '').toLowerCase().includes(q);
        const matchesPhone = (order.customerPhone || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''));
        const matchesDistrict = (order.district || '').toLowerCase().includes(q);
        return matchesId || matchesName || matchesPhone || matchesDistrict;
      }

      return true;
    });
  }, [scopedOrders, selectedFilter, searchQuery, now, showArchivedKdsOrders]);

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
    const orderNotes = order.notes || order.orderNotes || '';
    const discountAmount = Number(order.discountAmount || order.discount || 0);
    const serviceFee = Number(order.serviceFee || order.serviceAmount || 0);
    const serviceDescription = order.serviceDescription || 'Serviço';
    const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
    const paymentMethod = order.paymentMethod || 'A Definir';
    const isPaid = order.paymentStatus === 'PAGO_APROVADO';
    const displayNumber = formatOrderNumber(order);

    const branch = branchesList.find(b => b.id === (order.branchId || currentBranch?.id)) || currentBranch;
    const branchName = branch?.displayName || branch?.name || 'EL SHADDAY DELIVERY';
    const branchPhone = branch?.phoneFormatted || branch?.whatsappFormatted || '(69) 99222-8682';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Comanda #${displayNumber} - El Shadday</title>
          <style>
            @page {
              size: auto;
              margin: 0mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              color: #000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              font-size: 13px;
              line-height: 1.35;
              font-weight: 600;
              color: #000;
              background: #fff;
              width: 100%;
              max-width: 290px;
              padding: 4mm 3mm 0mm 3mm;
              margin: 0 auto;
              -webkit-font-smoothing: antialiased;
              text-rendering: optimizeLegibility;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: 900; }
            .title { font-size: 15px; font-weight: 900; letter-spacing: 0.5px; margin-bottom: 2px; }
            .comanda-id { 
              font-size: 22px; 
              font-weight: 900; 
              letter-spacing: 1px; 
              border: 2.5px solid #000; 
              padding: 5px 2px; 
              margin: 5px 0; 
              text-align: center;
            }
            .divider { border-top: 1.5px solid #000; margin: 5px 0; }
            .item-row { margin-bottom: 5px; }
            .item-header { display: flex; justify-content: space-between; font-weight: 900; font-size: 13.5px; line-height: 1.25; }
            .item-sub { padding-left: 8px; font-size: 12px; font-weight: 800; color: #000; line-height: 1.35; margin-top: 1px; }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              font-size: 16px; 
              font-weight: 900; 
              margin: 4px 0; 
              padding: 3px 0;
              border-top: 1.5px solid #000;
              border-bottom: 1.5px solid #000;
            }
            .info-row { margin: 3px 0; font-size: 12.5px; font-weight: 600; line-height: 1.3; }
            .destaque-box {
              border: 2px solid #000;
              background: #fff;
              color: #000;
              font-size: 13px;
              font-weight: 900;
              text-align: center;
              padding: 3px 2px;
              margin: 4px 0;
              letter-spacing: 0.5px;
            }
            .cancel-badge { color: #000; border: 2px solid #000; font-weight: 900; font-size: 14px; text-align: center; padding: 4px 0; margin: 4px 0; }
            .obs-box { border: 2px solid #000; padding: 4px; margin: 5px 0; font-weight: 900; font-size: 12px; line-height: 1.3; }
            .troco-box { border: 1.5px dashed #000; padding: 4px; margin: 4px 0; font-weight: 900; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="center bold title">${branchName.toUpperCase()}</div>
          <div class="center bold comanda-id">*** COMANDA #${displayNumber} ***</div>
          <div class="center" style="font-size: 13px; font-weight: 900; margin-bottom: 2px;">PEDIDO Nº ${displayNumber}</div>
          <div class="center" style="font-size: 11.5px; font-weight: 700;">Data: ${formattedDate}</div>

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
          ` : '<div class="destaque-box">>>> RETIRADA NO BALCÃO <<<</div>'}

          <div class="divider"></div>
          <div class="bold" style="font-size: 13px; margin-bottom: 4px;">ITENS DO PEDIDO:</div>

          ${(order.items || []).map(it => {
            const itemTotal = Number(it.price || it.unitPrice || 0) * Number(it.quantity || 1);
            let details = [];
            if (it.pizzaSelections && it.pizzaSelections.length > 0) {
              const sab = it.pizzaSelections.map(p => p.flavors?.join('/')).filter(Boolean).join(' + ');
              if (sab) details.push(`Sabores: ${sab}`);
            } else if (it.flavors && it.flavors.length > 0) {
              details.push(`Sabores: ${it.flavors.join('/')}`);
            }
            if (it.acaiComplements && it.acaiComplements.length > 0) {
              details.push(`Barca Açaí: ${it.acaiComplements.join(', ')}`);
            } else if (it.complements && it.complements.length > 0) {
              details.push(`Açaí: ${it.complements.join(', ')}`);
            }
            if ((it.acaiCobertura || it.cobertura) && (it.acaiCobertura || it.cobertura) !== 'Sem Cobertura') {
              details.push(`Cobertura: ${it.acaiCobertura || it.cobertura}`);
            }
            if (it.dydyoFlavor) {
              details.push(`Refri Incluso: ${it.dydyoFlavor}`);
            }
            if (it.beverage) {
              details.push(`Bebida: ${it.beverage}`);
            }
            if (it.hasExtraSauce) {
              details.push(`Molho Extra: ${it.extraSauceName || 'Sim'}${it.extraSaucePrice > 0 ? ` (+R$ ${Number(it.extraSaucePrice).toFixed(2)})` : ''}`);
            }
            if (it.boxOptionTitle) {
              details.push(`Opção: ${it.boxOptionTitle}`);
            }
            if (it.salgadasDetails) {
              const salg = Object.entries(it.salgadasDetails).map(([k,v]) => `${v}x ${k}`).join(', ');
              details.push(it.isSortido ? `[SORTIDO INTERNO] Salg: ${salg}` : `Salgadas: ${salg}`);
            }
            if (it.docesDetails) {
              const doc = Object.entries(it.docesDetails).map(([k,v]) => `${v}x ${k}`).join(', ');
              details.push(it.isSortido ? `[SORTIDO INTERNO] Doces: ${doc}` : `Doces: ${doc}`);
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

          <div style="display:flex; justify-content:space-between; margin:2px 0; font-size:12.5px; font-weight:700;">
            <span>Subtotal:</span>
            <span>R$ ${Number(order.subtotal || 0).toFixed(2)}</span>
          </div>
          ${!isBalcao ? `
            <div style="display:flex; justify-content:space-between; margin:2px 0; font-size:12.5px; font-weight:700;">
              <span>Taxa Entrega:</span>
              <span>R$ ${Number(order.deliveryFee || 0).toFixed(2)}</span>
            </div>
          ` : ''}
          ${serviceFee > 0 ? `
            <div style="display:flex; justify-content:space-between; margin:2px 0; font-size:12.5px; font-weight:700;">
              <span>Serviço (${serviceDescription}):</span>
              <span>+ R$ ${serviceFee.toFixed(2)}</span>
            </div>
          ` : ''}
          ${discountAmount > 0 ? `
            <div style="display:flex; justify-content:space-between; margin:2px 0; font-size:12.5px; font-weight:900;">
              <span>Desconto Balcão:</span>
              <span>- R$ ${discountAmount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="total-row">
            <span>TOTAL:</span>
            <span style="font-size: 18px;">R$ ${Number(order.total || 0).toFixed(2)}</span>
          </div>

          <div class="divider"></div>

          <div class="info-row"><span class="bold">PAGAMENTO:</span> ${paymentMethod.toUpperCase()}</div>
          <div class="info-row" style="font-weight: 900;">
            <span class="bold">STATUS:</span> 
            ${isPaid ? '[ PAGO ] (Pix / Cartão)' : '[ ! ] COBRAR NA ENTREGA'}
          </div>
          ${changeFor && Number(changeFor) > Number(order.total || 0) ? `
            <div class="troco-box">
              TROCO PARA: R$ ${Number(changeFor).toFixed(2)} (Levar R$ ${(Number(changeFor) - Number(order.total || 0)).toFixed(2)})
            </div>
          ` : ''}

          <div class="divider"></div>
          <div class="center" style="font-size: 12px; font-weight: 800; margin-top: 3px;">${branchPhone}</div>
          <div class="center" style="font-size: 11px; font-weight: 700; margin-top: 2px;">Obrigado pela preferência!</div>

          <!-- Espaço de avanço do papel além da guilhotina/serrilha do corte -->
          <div style="height: 25mm;"></div>
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

    const normNewStatus = normalizeOrderStatus(newStatus);
    const notifyType = normNewStatus;

    // Se o status for CONCLUIDO, NÃO envia WhatsApp automático para não gerar mensagem redundante pós-balcão/entrega
    const shouldNotifyWhatsApp = normNewStatus !== 'CONCLUIDO';

    // 1. Update order status in app state / DB
    onUpdateOrderStatus(order.orderId, normNewStatus);

    // 2. Dispatch background WhatsApp notification (100% invisível em segundo plano, NUNCA abre popup/nova aba no navegador)
    if (shouldNotifyWhatsApp) {
      handleTriggerCustomerWhatsApp(order, notifyType, customReason);
    }

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
      PRONTO_BALCAO: { tab: 'todos', label: 'Pronto Balcão' },
      SAIU_ENTREGA: { tab: 'entrega', label: 'Saiu p/ Entrega' },
      CONCLUIDO: { tab: 'concluidos', label: 'Prontos / Entregues' },
      CANCELADO: { tab: 'cancelados', label: 'Cancelados' }
    };

    const targetInfo = STATUS_MAP[normNewStatus];
    if (autoFollowTab && targetInfo && kdsGridCols !== 'kanban') {
      setSelectedFilter(targetInfo.tab);
      setStatusChangeToast({
        orderId: formatOrderNumber(order),
        newStatus: normNewStatus,
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
        orderId: formatOrderNumber(cancelModalOrder),
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

  // Change Payment / Cash Change Handlers (KDS / Cozinha)
  const handleOpenChangePaymentModal = (order) => {
    setChangePaymentModalOrder(order);
    const methodStr = (order.paymentMethod || '').toLowerCase();
    
    // Auto-detect current payment method
    if (methodStr.includes('misto') || methodStr.includes('2 formas')) {
      setEditPaymentType('misto');
      setEditSplitAmount1(order.total ? (order.total / 2).toFixed(2) : '');
    } else if (methodStr.includes('dinheiro')) {
      setEditPaymentType('dinheiro');
      setEditCashChange(order.changeFor || order.cashChange ? String(order.changeFor || order.cashChange) : '');
    } else if (methodStr.includes('crédito') || methodStr.includes('credito')) {
      setEditPaymentType('credito');
    } else if (methodStr.includes('débito') || methodStr.includes('debito')) {
      setEditPaymentType('debito');
    } else {
      setEditPaymentType('pix');
    }

    setEditPaymentStatus(order.paymentStatus || 'PENDENTE_COBRANCA');
    setEditCashChange(order.changeFor || order.cashChange ? String(order.changeFor || order.cashChange) : '');
    setEditSplitMethod1('pix');
    setEditSplitAmount1(order.total ? (order.total / 2).toFixed(2) : '');
    setEditSplitMethod2('credito');
    setEditSplitChange1('');
    setEditSplitChange2('');
  };

  const handleSavePaymentChange = () => {
    if (!changePaymentModalOrder) return;
    const order = changePaymentModalOrder;
    const orderTotal = Number(order.total) || 0;

    let newMethodText = 'PIX';
    let finalChangeFor = null;

    if (editPaymentType === 'pix') {
      newMethodText = 'PIX Instantâneo';
    } else if (editPaymentType === 'credito') {
      newMethodText = 'Cartão de Crédito (Levar Maquininha)';
    } else if (editPaymentType === 'debito') {
      newMethodText = 'Cartão de Débito (Levar Maquininha)';
    } else if (editPaymentType === 'dinheiro') {
      const cleanChange = editCashChange.trim().replace('R$', '').replace(',', '.').trim();
      const numChange = parseFloat(cleanChange);
      if (!isNaN(numChange) && numChange > 0) {
        finalChangeFor = numChange;
        const trocoDevolver = numChange > orderTotal ? (numChange - orderTotal).toFixed(2).replace('.', ',') : '0,00';
        newMethodText = `Dinheiro (Troco p/ R$ ${numChange.toFixed(2).replace('.', ',')} • Devolver R$ ${trocoDevolver})`;
      } else {
        newMethodText = 'Dinheiro (Sem troco / Valor exato)';
      }
    } else if (editPaymentType === 'misto') {
      const getMethodLabel = (m) => {
        if (m === 'pix') return 'PIX';
        if (m === 'credito') return 'Cartão Crédito';
        if (m === 'debito') return 'Cartão Débito';
        if (m === 'dinheiro') return 'Dinheiro';
        return m;
      };

      const val1 = parseFloat(String(editSplitAmount1).replace(',', '.')) || (orderTotal / 2);
      const val2 = Math.max(0, orderTotal - val1);

      let t1 = '';
      if (editSplitMethod1 === 'dinheiro' && editSplitChange1) {
        const cleanT1 = parseFloat(String(editSplitChange1).replace(',', '.'));
        if (!isNaN(cleanT1)) {
          finalChangeFor = cleanT1;
          t1 = ` - troco p/ R$ ${cleanT1.toFixed(2).replace('.', ',')}`;
        }
      }
      let t2 = '';
      if (editSplitMethod2 === 'dinheiro' && editSplitChange2) {
        const cleanT2 = parseFloat(String(editSplitChange2).replace(',', '.'));
        if (!isNaN(cleanT2)) {
          finalChangeFor = cleanT2;
          t2 = ` - troco p/ R$ ${cleanT2.toFixed(2).replace('.', ',')}`;
        }
      }

      newMethodText = `Misto: R$ ${val1.toFixed(2).replace('.', ',')} (${getMethodLabel(editSplitMethod1)}${t1}) + R$ ${val2.toFixed(2).replace('.', ',')} (${getMethodLabel(editSplitMethod2)}${t2})`;
    }

    const updates = {
      paymentMethod: newMethodText,
      paymentStatus: editPaymentStatus,
      changeFor: finalChangeFor,
      cashChange: finalChangeFor
    };

    if (onUpdatePaymentMethod) {
      onUpdatePaymentMethod(order.orderId, updates);
    } else if (onUpdatePaymentStatus) {
      onUpdatePaymentStatus(order.orderId, editPaymentStatus);
    }

    setChangePaymentModalOrder(null);
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

  // Serviço / Acréscimo em Reais no Balcão (PDV)
  const pdvServiceAmount = useMemo(() => {
    if (!pdvServiceFee) return 0;
    let s = String(pdvServiceFee).trim().replace(/\s+/g, '');
    if (!s) return 0;
    if (s.includes(',') && s.includes('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else if (s.includes(',')) {
      s = s.replace(',', '.');
    }
    const val = parseFloat(s);
    if (isNaN(val) || val <= 0) return 0;
    return val;
  }, [pdvServiceFee]);

  // Desconto em Reais no Balcão (PDV)
  const pdvDiscountAmount = useMemo(() => {
    if (!pdvDiscount) return 0;
    let s = String(pdvDiscount).trim().replace(/\s+/g, '');
    if (!s) return 0;
    if (s.includes(',') && s.includes('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else if (s.includes(',')) {
      s = s.replace(',', '.');
    }
    const val = parseFloat(s);
    if (isNaN(val) || val <= 0) return 0;
    return Math.min(val, pdvCartSubtotal + pdvDeliveryFee + pdvServiceAmount);
  }, [pdvDiscount, pdvCartSubtotal, pdvDeliveryFee, pdvServiceAmount]);

  const pdvCartTotal = Math.max(0, (pdvCartSubtotal + pdvDeliveryFee + pdvServiceAmount) - pdvDiscountAmount);

  const scrollPdvCategories = (direction) => {
    if (pdvCategoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      pdvCategoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handlePdvCategoryWheel = (e) => {
    if (e.deltaY !== 0 && pdvCategoryScrollRef.current) {
      e.preventDefault();
      pdvCategoryScrollRef.current.scrollLeft += (e.deltaY > 0 ? 120 : -120);
    }
  };

  // PDV Customization Product Detectors
  const isPizzaProduct = (prod) => {
    if (!prod) return false;
    return Boolean(
      prod.isPizzaCustomizer || 
      prod.categoryId === 'pizzas' || 
      (prod.name && prod.name.toLowerCase().includes('pizza'))
    );
  };

  const isBoxProduct = (prod) => {
    if (!prod) return false;
    return Boolean(
      prod.isBox || 
      prod.categoryId === 'caixas' || 
      (prod.name && prod.name.toLowerCase().includes('caixa') && prod.name.toLowerCase().includes('esfirr'))
    );
  };

  const isComboProduct = (prod) => {
    if (!prod) return false;
    return Boolean(
      prod.categoryId === 'combos' || 
      (prod.name && prod.name.toLowerCase().includes('combo'))
    );
  };

  const isAcaiProduct = (prod) => {
    if (!prod) return false;
    const name = (prod.name || '').toLowerCase();
    const id = (prod.id || '').toLowerCase();
    return Boolean(
      prod.categoryId === 'acai' || 
      id.includes('acai') || 
      name.includes('açaí') || 
      name.includes('acai')
    );
  };

  const handlePDVProductClick = (prod) => {
    if (isPizzaProduct(prod)) {
      setPdvPizzaToCustomize(prod);
    } else if (isBoxProduct(prod)) {
      setPdvBoxToCustomize(prod);
    } else if (isComboProduct(prod)) {
      setPdvComboToCustomize(prod);
    } else if (isAcaiProduct(prod)) {
      setPdvAcaiToCustomize(prod);
    } else {
      handleAddProductToPDV(prod, 1);
    }
  };

  const handleAddPizzaToPDV = (customPizza) => {
    setPdvCart(prev => [...prev, {
      id: customPizza.id,
      name: customPizza.name,
      price: customPizza.price,
      quantity: customPizza.quantity || 1,
      notes: customPizza.notes || '',
      flavors: customPizza.flavors,
      bordaGratis: customPizza.bordaGratis,
      tamanho: customPizza.tamanho,
      isCustomPizza: true,
      description: customPizza.description,
      beverage: customPizza.beverage || null,
      beveragePrice: customPizza.beveragePrice || 0,
      dydyoFlavor: customPizza.dydyoFlavor || null,
      hasExtraSauce: Boolean(customPizza.hasExtraSauce),
      extraSaucePrice: customPizza.extraSaucePrice || 0,
      extraSauceName: customPizza.extraSauceName || null
    }]);
    setPdvPizzaToCustomize(null);
  };

  const handleAddBoxToPDV = (customBox) => {
    setPdvCart(prev => [...prev, {
      id: customBox.id,
      name: customBox.name,
      price: customBox.price,
      quantity: customBox.quantity || 1,
      isCustomBox: true,
      isBox: true,
      isSortido: customBox.isSortido,
      totalCount: customBox.totalCount,
      boxOption: customBox.boxOption,
      boxOptionTitle: customBox.boxOptionTitle,
      hasDoces: customBox.hasDoces,
      semSuinos: customBox.semSuinos,
      notes: customBox.notes,
      salgadasDetails: customBox.salgadasDetails,
      docesDetails: customBox.docesDetails,
      dydyoFlavor: customBox.dydyoFlavor || null,
      beverage: customBox.beverage || null,
      beveragePrice: customBox.beveragePrice || 0,
      hasExtraSauce: Boolean(customBox.hasExtraSauce),
      extraSaucePrice: customBox.extraSaucePrice || 0,
      extraSauceName: customBox.extraSauceName || null,
      description: customBox.description
    }]);
    setPdvBoxToCustomize(null);
  };

  const handleAddAcaiToPDV = (customAcai) => {
    setPdvCart(prev => [...prev, {
      id: customAcai.id,
      name: customAcai.name,
      price: customAcai.price,
      quantity: customAcai.quantity || 1,
      isCustomAcai: true,
      complements: customAcai.complements,
      cobertura: customAcai.cobertura,
      notes: customAcai.notes || '',
      description: customAcai.description
    }]);
    setPdvAcaiToCustomize(null);
  };

  const handleAddComboToPDV = (customCombo) => {
    setPdvCart(prev => [...prev, {
      id: customCombo.id,
      name: customCombo.name,
      price: customCombo.price,
      quantity: customCombo.quantity || 1,
      isCombo: true,
      isCustomCombo: true,
      pizzaSelections: customCombo.pizzaSelections,
      acaiComplements: customCombo.acaiComplements || [],
      acaiCobertura: customCombo.acaiCobertura || '',
      dydyoFlavor: customCombo.dydyoFlavor || null,
      hasExtraSauce: Boolean(customCombo.hasExtraSauce),
      extraSaucePrice: customCombo.extraSaucePrice || 0,
      extraSauceName: customCombo.extraSauceName || null,
      notes: customCombo.notes || '',
      description: customCombo.description
    }]);
    setPdvComboToCustomize(null);
  };

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

  const handleAddStandaloneSauceToPDV = () => {
    const saucePrice = Number(extraSauceConfig.price !== undefined ? extraSauceConfig.price : 3.00);
    const sauceName = `Potinho de ${extraSauceConfig.name || 'Molho Especial da Casa'}`;
    setPdvValidationError('');
    setPdvCart(prev => {
      const existing = prev.find(i => i.isStandaloneSauce);
      if (existing) {
        return prev.map(i => i.isStandaloneSauce ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        id: `sauce-standalone-${Date.now()}`,
        name: sauceName,
        price: saucePrice,
        quantity: 1,
        isStandaloneSauce: true,
        hasExtraSauce: true,
        extraSauceName: extraSauceConfig.name || 'Molho Especial da Casa',
        extraSaucePrice: saucePrice,
        description: 'Potinho artesanal de molho extra da casa'
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

  // Sincroniza histórico de clientes a partir dos pedidos (apenas quando a lista de pedidos realmente mudar)
  const prevOrdersHashRef = useRef('');
  useEffect(() => {
    const list = Array.isArray(orders) ? orders : [];
    const hash = list.map(o => o.orderId || o.id).sort().join(',');
    if (hash && hash !== prevOrdersHashRef.current) {
      prevOrdersHashRef.current = hash;
      backfillCustomersFromOrders(list);
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
        const found = districtsList.find(d => 
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

  const [isLaunchingPdv, setIsLaunchingPdv] = useState(false);
  const handleLaunchPDVOrder = async (directBaixa = false) => {
    if (isLaunchingPdv) return;
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

    // Número reservado no banco (único entre todos os aparelhos)
    setIsLaunchingPdv(true);
    let orderNumber;
    try {
      orderNumber = await reserveOrderNumber(orders);
    } finally {
      setIsLaunchingPdv(false);
    }
    const orderId = String(orderNumber).padStart(2, '0');

    let paymentMethodText = 'PIX';
    if (pdvPaymentMethod === 'dinheiro') {
      paymentMethodText = `Dinheiro ${pdvCashChange ? `(Troco p/ R$ ${pdvCashChange})` : '(Sem troco)'}`;
    } else if (pdvPaymentMethod === 'debito') {
      paymentMethodText = 'Cartão de Débito (Balcão / Maquininha)';
    } else if (pdvPaymentMethod === 'credito') {
      paymentMethodText = 'Cartão de Crédito (Balcão / Maquininha)';
    }

    const isConcludedDirect = Boolean(directBaixa);

    const newOrder = {
      orderId,
      orderNumber,
      displayNumber: '#' + orderId,
      branchId: currentBranch?.id || 'ariquemes',
      branchName: currentBranch?.displayName || currentBranch?.name || 'Unidade Ariquemes',
      createdAt: new Date().toISOString(),
      customerName: pdvCustomerName.trim(),
      customerPhone: pdvCustomerPhone.trim(),
      deliveryType: pdvDeliveryType,
      deliveryAddress: {
        street: pdvDeliveryType === 'delivery' ? pdvAddress.trim() : 'Av. Canaã, 4065 - Setor 04 (esquina, ao lado da Rumotos), Ariquemes - RO',
        address: pdvDeliveryType === 'delivery' ? pdvAddress.trim() : 'Av. Canaã, 4065 - Setor 04 (esquina, ao lado da Rumotos), Ariquemes - RO',
        number: pdvDeliveryType === 'delivery' ? pdvNumber.trim() : '',
        district: pdvDeliveryType === 'delivery' ? pdvDistrict.name : 'Balcão',
        reference: pdvDeliveryType === 'delivery' ? pdvReference.trim() : '',
        isPickup: pdvDeliveryType === 'balcao'
      },
      district: pdvDeliveryType === 'delivery' ? pdvDistrict.name : 'Balcão (Setor 04)',
      address: pdvDeliveryType === 'delivery' ? pdvAddress.trim() : 'Av. Canaã, 4065 - Setor 04 (esquina, ao lado da Rumotos), Ariquemes - RO',
      number: pdvDeliveryType === 'delivery' ? pdvNumber.trim() : '',
      reference: pdvDeliveryType === 'delivery' ? pdvReference.trim() : '',
      items: pdvCart,
      subtotal: pdvCartSubtotal,
      deliveryFee: pdvDeliveryFee,
      serviceFee: pdvServiceAmount,
      serviceAmount: pdvServiceAmount,
      serviceDescription: pdvServiceName.trim(),
      discount: pdvDiscountAmount,
      discountAmount: pdvDiscountAmount,
      total: pdvCartTotal,
      paymentMethod: paymentMethodText,
      paymentStatus: (isConcludedDirect || pdvIsPaid) ? 'PAGO_APROVADO' : 'PENDENTE',
      orderStatus: isConcludedDirect ? 'CONCLUIDO' : 'RECEBIDO_COZINHA',
      source: 'PDV_BALCAO',
      notes: (
        pdvOrderNotes.trim() + 
        (pdvServiceAmount > 0 ? ` [Serviço: ${pdvServiceName.trim() || 'Serviço'} (+R$ ${pdvServiceAmount.toFixed(2).replace('.', ',')})]` : '') +
        (pdvDiscountAmount > 0 ? ` [Desconto: R$ ${pdvDiscountAmount.toFixed(2).replace('.', ',')}]` : '')
      ).trim(),
      orderNotes: pdvOrderNotes.trim(),
      baixaDadaEm: isConcludedDirect ? new Date().toISOString() : null,
      baixaDadaPor: isConcludedDirect ? (currentUser?.name || 'Balcão / PDV') : null
    };

    try {
      recordCustomerFromOrder(newOrder);
    } catch (e) {}

    if (onCreateKitchenOrder) {
      onCreateKitchenOrder(newOrder);
    }

    if (newOrder.customerPhone && !isConcludedDirect) {
      handleTriggerCustomerWhatsApp(newOrder, 'RECEBIDO_COZINHA');
    }

    playChime(isConcludedDirect);
    setPdvSuccessOrder(newOrder);

    // Reset PDV form
    setPdvCart([]);
    setPdvDiscount('');
    setPdvServiceName('');
    setPdvServiceFee('');
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

  // PDV Controle / Dar Baixa Helpers
  const pdvOrdersList = useMemo(() => {
    return (scopedOrders || []).filter(o => {
      if (!o || normalizeOrderStatus(o) === 'CANCELADO') return false;
      if (!showArchivedKdsOrders && (o.shiftClosedAt || o.isArchived)) return false;
      return true;
    });
  }, [scopedOrders, showArchivedKdsOrders]);

  const openPdvOrders = useMemo(() => {
    return pdvOrdersList.filter(o => normalizeOrderStatus(o) !== 'CONCLUIDO');
  }, [pdvOrdersList]);

  const openPdvOrdersCount = openPdvOrders.length;

  const balcaoOpenCount = useMemo(() => {
    return openPdvOrders.filter(o => o.deliveryType === 'balcao').length;
  }, [openPdvOrders]);

  const deliveryOpenCount = useMemo(() => {
    return openPdvOrders.filter(o => o.deliveryType === 'delivery').length;
  }, [openPdvOrders]);

  const concluidosCount = useMemo(() => {
    return pdvOrdersList.filter(o => normalizeOrderStatus(o) === 'CONCLUIDO').length;
  }, [pdvOrdersList]);

  const filteredPdvBaixaOrders = useMemo(() => {
    let list = pdvOrdersList;

    if (pdvBaixaFilter === 'abertos') {
      list = list.filter(o => normalizeOrderStatus(o) !== 'CONCLUIDO');
    } else if (pdvBaixaFilter === 'balcao') {
      list = list.filter(o => normalizeOrderStatus(o) !== 'CONCLUIDO' && o.deliveryType === 'balcao');
    } else if (pdvBaixaFilter === 'delivery') {
      list = list.filter(o => normalizeOrderStatus(o) !== 'CONCLUIDO' && o.deliveryType === 'delivery');
    } else if (pdvBaixaFilter === 'concluidos') {
      list = list.filter(o => normalizeOrderStatus(o) === 'CONCLUIDO');
    }

    if (pdvBaixaSearch.trim()) {
      const q = pdvBaixaSearch.toLowerCase().trim();
      list = list.filter(o => {
        const orderNum = String(o.orderNumber || o.orderId || '').toLowerCase();
        const displayNum = formatOrderNumber(o).toLowerCase();
        const custName = (o.customerName || '').toLowerCase();
        const custPhone = (o.customerPhone || '').toLowerCase();
        return orderNum.includes(q) || displayNum.includes(q) || custName.includes(q) || custPhone.includes(q);
      });
    }

    return list.slice().sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [pdvOrdersList, pdvBaixaFilter, pdvBaixaSearch]);

  const handleDarBaixa = (order) => {
    if (!order) return;
    handleUpdateStatusAndTab(order, 'CONCLUIDO');
    if (order.paymentStatus !== 'PAGO_APROVADO' && onUpdatePaymentStatus) {
      onUpdatePaymentStatus(order.orderId, 'PAGO_APROVADO');
    }
    playChime(true);
    setPdvBaixaToast({
      orderId: formatOrderNumber(order),
      customerName: order.customerName,
      type: 'success',
      text: `Baixa realizada com sucesso no Pedido #${formatOrderNumber(order)}!`
    });
    if (pdvBaixaToastTimeoutRef.current) clearTimeout(pdvBaixaToastTimeoutRef.current);
    pdvBaixaToastTimeoutRef.current = setTimeout(() => {
      setPdvBaixaToast(null);
    }, 4000);
  };

  const handleReabrirPedido = (order) => {
    if (!order) return;
    handleUpdateStatusAndTab(order, 'EM_PREPARO');
    playChime(false);
    setPdvBaixaToast({
      orderId: formatOrderNumber(order),
      customerName: order.customerName,
      type: 'info',
      text: `Pedido #${formatOrderNumber(order)} reaberto e retornado para Em Preparo.`
    });
    if (pdvBaixaToastTimeoutRef.current) clearTimeout(pdvBaixaToastTimeoutRef.current);
    pdvBaixaToastTimeoutRef.current = setTimeout(() => {
      setPdvBaixaToast(null);
    }, 4000);
  };

  const handleTogglePaymentStatus = (order) => {
    if (!order || !onUpdatePaymentStatus) return;
    const newPayStatus = order.paymentStatus === 'PAGO_APROVADO' ? 'PENDENTE' : 'PAGO_APROVADO';
    onUpdatePaymentStatus(order.orderId, newPayStatus);
    playChime(newPayStatus === 'PAGO_APROVADO');
  };

  // Cartão de pedido da cozinha (usado na grade e nas colunas do quadro)
  const renderKdsOrderCard = (order) => {
                    // Em 3 ou 4 colunas o cartão é estreito: empilha cabeçalho e pagamento para nada sair da borda
                    const isNarrowCard = kdsGridCols === '3' || kdsGridCols === '4' || kdsGridCols === 'kanban';
                    const elapsedMin = getElapsedMinutes(order.createdAt);
                    const isDelayed = isOrderDelayed(order);
                    const currentStatus = normalizeOrderStatus(order);
                    const isCancelled = currentStatus === 'CANCELADO';
                    const isPaid = order.paymentStatus === 'PAGO_APROVADO';
                    const isHighlighted = highlightedOrderId === order.orderId;
                    const orderDisplayNumber = formatOrderNumber(order);

                    return (
                      <div
                        key={order.orderId}
                        className={`rounded-2xl border flex flex-col justify-between min-w-0 overflow-hidden break-words transition-all duration-300 shadow-md ${
                          kdsCompactMode ? 'p-3' : 'p-4 sm:p-5'
                        } ${
                          isHighlighted
                            ? 'bg-brand-gold/15 border-brand-gold ring-2 ring-inset ring-brand-gold shadow-glow-gold'
                            : isCancelled
                            ? 'bg-red-950/15 border-red-900/50 opacity-80'
                            : isDelayed
                            ? 'bg-red-950/20 border-red-500/60 ring-1 ring-inset ring-red-500/40'
                            : currentStatus === 'CONCLUIDO'
                            ? 'bg-dark-900/60 border-dark-800 opacity-75'
                            : 'bg-dark-900 border-dark-800 hover:border-brand-gold/50'
                        }`}
                      >
                        <div>
                          {/* Top Header of the card */}
                          <div className={`flex gap-2 border-b border-dark-800 ${isNarrowCard ? 'flex-col' : 'flex-col sm:flex-row sm:items-start sm:justify-between'} ${kdsCompactMode ? 'pb-2' : 'pb-3'}`}>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-display font-black text-xl text-brand-gold tracking-tight bg-dark-950 px-2.5 py-0.5 rounded-xl border border-brand-gold/40 shadow-sm">
                                  #{orderDisplayNumber}
                                </span>
                                {order.orderId && order.orderId !== orderDisplayNumber && (
                                  <span className="text-[10px] text-slate-500 font-mono hidden sm:inline" title="Identificador único">
                                    ({order.orderId})
                                  </span>
                                )}

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
                                          : (currentStatus === 'SAIU_ENTREGA' || currentStatus === 'PRONTO_BALCAO')
                                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 hover:bg-blue-500/30'
                                          : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                                      }`}
                                      title="Alterar status deste pedido e mover para a aba correspondente"
                                    >
                                      <option value="RECEBIDO_COZINHA" className="bg-dark-950 text-amber-300">🟡 Na Fila (Pendente)</option>
                                      <option value="EM_PREPARO" className="bg-dark-950 text-brand-gold">🔥 No Forno (Preparo)</option>
                                      {(order.deliveryType === 'balcao' || order.deliveryType === 'retirada' || order.district === 'Balcão') ? (
                                        <>
                                          <option value="PRONTO_BALCAO" className="bg-dark-950 text-blue-300">📦 Pronto no Balcão</option>
                                          <option value="CONCLUIDO" className="bg-dark-950 text-emerald-300">✅ Concluído (Entregue)</option>
                                        </>
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

                              <div className="text-xs font-bold text-white mt-1 flex items-center gap-1.5 flex-wrap min-w-0">
                                <span className="flex items-center gap-1 min-w-0">
                                  <User className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" />
                                  <span className="break-words min-w-0">{order.customerName}</span>
                                </span>

                                {order.customerPhone && (
                                  <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    <Phone className="w-3 h-3" />
                                    <span>{order.customerPhone}</span>
                                  </span>
                                )}

                                {!isCancelled && (
                                  <button
                                    type="button"
                                    onClick={() => setEditCustomerModalOrder(order)}
                                    className="px-2 py-0.5 rounded bg-brand-gold/15 hover:bg-brand-gold/25 border border-brand-gold/40 text-[10px] font-black text-brand-gold flex items-center gap-1 transition-all cursor-pointer flex-shrink-0"
                                    title="Corrigir nome, telefone, endereço ou trocar entre retirada e entrega"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" />
                                    <span>Editar Cliente</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Payment Status Pill */}
                            <div className={`min-w-0 ${isNarrowCard ? 'w-full text-left' : 'w-full sm:w-auto sm:max-w-[55%] text-left sm:text-right'}`}>
                              {isPaid ? (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-[11px] inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>PAGO</span>
                                </span>
                              ) : (
                                <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${isNarrowCard ? '' : 'sm:justify-end'}`}>
                                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold text-[11px] inline-flex items-center gap-1 whitespace-nowrap">
                                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                    <span>COBRAR NA ENTREGA</span>
                                  </span>
                                  {!isCancelled && (
                                    <button
                                      onClick={() => onUpdatePaymentStatus(order.orderId, 'PAGO_APROVADO')}
                                      className="text-[10px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer whitespace-nowrap"
                                    >
                                      Marcar como Pago
                                    </button>
                                  )}
                                </div>
                              )}
                              <div className="mt-1.5 p-1.5 rounded-lg bg-dark-950/70 border border-dark-800 text-[11px] space-y-1">
                                <div className="flex items-center justify-between gap-1.5 min-w-0">
                                  <span className="font-bold text-slate-200 flex items-center gap-1 truncate min-w-0" title={order.paymentMethod || 'A Definir'}>
                                    <CreditCard className="w-3 h-3 text-brand-gold flex-shrink-0" />
                                    <span className="truncate">{order.paymentMethod || 'A Definir'}</span>
                                  </span>
                                  {!isCancelled && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenChangePaymentModal(order)}
                                      className="px-2 py-0.5 rounded bg-brand-gold/15 hover:bg-brand-gold/25 border border-brand-gold/40 text-[10px] font-black text-brand-gold flex items-center gap-1 transition-all cursor-pointer flex-shrink-0"
                                      title="Alterar forma de pagamento ou troco"
                                    >
                                      <Edit2 className="w-2.5 h-2.5" />
                                      <span>Alterar</span>
                                    </button>
                                  )}
                                </div>
                                {(order.changeFor || order.cashChange) && (
                                  <div className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center justify-between flex-wrap gap-1">
                                    <span>💵 Troco p/: R$ {Number(order.changeFor || order.cashChange).toFixed(2).replace('.', ',')}</span>
                                    {order.total && Number(order.changeFor || order.cashChange) > Number(order.total) && (
                                      <span className="text-emerald-300 font-black">
                                        Devolver: R$ {(Number(order.changeFor || order.cashChange) - Number(order.total)).toFixed(2).replace('.', ',')}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Delivery address & info */}
                          <div className="py-2.5 text-xs text-slate-300 space-y-1">
                            <div className="flex items-start gap-1.5 min-w-0">
                              <MapPin className="w-3.5 h-3.5 text-brand-gold flex-shrink-0 mt-0.5" />
                              <span className="min-w-0 break-words">
                                <strong>{order.deliveryType === 'delivery' ? order.district : 'Retirada no Balcão (Setor 04)'}</strong>
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
                              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[10px] font-bold text-slate-400 px-0.5">
                                <span className="flex items-center gap-1 text-slate-300 min-w-0">
                                  <Sliders className="w-3 h-3 text-brand-gold flex-shrink-0" />
                                  <span>{isNarrowCard ? 'FLUXO DO PEDIDO:' : 'FLUXO DO PEDIDO (CLIQUE P/ MUDAR):'}</span>
                                </span>
                                <span className="text-[10px] text-brand-goldLight font-bold">
                                  {currentStatus === 'RECEBIDO_COZINHA' && '🟡 1. Na Fila'}
                                  {currentStatus === 'EM_PREPARO' && '🔥 2. No Forno'}
                                  {currentStatus === 'PRONTO_BALCAO' && '📦 3. Pronto no Balcão'}
                                  {currentStatus === 'SAIU_ENTREGA' && '🛵 3. Em Rota'}
                                  {currentStatus === 'CONCLUIDO' && '✅ 4. Concluído'}
                                </span>
                              </div>

                              <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                                {/* 1. Pendente */}
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatusAndTab(order, 'RECEBIDO_COZINHA')}
                                  className={`py-1.5 px-1 rounded-lg font-bold flex flex-col items-center justify-center gap-0.5 min-w-0 transition-all cursor-pointer ${isNarrowCard ? 'text-[10px]' : 'text-[11px] sm:flex-row sm:gap-1'} ${
                                    currentStatus === 'RECEBIDO_COZINHA'
                                      ? 'bg-amber-500 text-dark-950 font-black shadow-sm ring-1 ring-inset ring-amber-400'
                                      : 'bg-dark-900 hover:bg-dark-850 text-slate-400 hover:text-amber-300 border border-dark-800'
                                  }`}
                                  title="Mover de volta para Pendente (Fila)"
                                >
                                  <Clock className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate max-w-full">{isNarrowCard ? 'Fila' : '1. Pendente'}</span>
                                </button>

                                {/* 2. No Forno */}
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatusAndTab(order, 'EM_PREPARO')}
                                  className={`py-1.5 px-1 rounded-lg font-bold flex flex-col items-center justify-center gap-0.5 min-w-0 transition-all cursor-pointer ${isNarrowCard ? 'text-[10px]' : 'text-[11px] sm:flex-row sm:gap-1'} ${
                                    currentStatus === 'EM_PREPARO'
                                      ? 'bg-brand-gold text-dark-950 font-black shadow-sm ring-1 ring-inset ring-amber-300'
                                      : 'bg-dark-900 hover:bg-dark-850 text-slate-400 hover:text-brand-gold border border-dark-800'
                                  }`}
                                  title="Mover para No Forno (Em Preparo)"
                                >
                                  <Flame className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate max-w-full">{isNarrowCard ? 'Forno' : '2. No Forno'}</span>
                                </button>

                                {/* 3. Saiu Entrega / Balcão */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const isBalcao = order.deliveryType === 'balcao' || order.deliveryType === 'retirada' || order.district === 'Balcão';
                                    if (isBalcao) {
                                      handleUpdateStatusAndTab(order, 'PRONTO_BALCAO');
                                    } else {
                                      handleUpdateStatusAndTab(order, 'SAIU_ENTREGA');
                                    }
                                  }}
                                  className={`py-1.5 px-1 rounded-lg font-bold flex flex-col items-center justify-center gap-0.5 min-w-0 transition-all cursor-pointer ${isNarrowCard ? 'text-[10px]' : 'text-[11px] sm:flex-row sm:gap-1'} ${
                                    currentStatus === 'SAIU_ENTREGA' || currentStatus === 'PRONTO_BALCAO'
                                      ? 'bg-blue-500 text-white font-black shadow-sm ring-1 ring-inset ring-blue-400'
                                      : 'bg-dark-900 hover:bg-dark-850 text-slate-400 hover:text-blue-300 border border-dark-800'
                                  }`}
                                  title={(order.deliveryType === 'balcao' || order.deliveryType === 'retirada' || order.district === 'Balcão') ? 'Marcar Pronto no Balcão' : 'Mover para Saiu para Entrega'}
                                >
                                  {(order.deliveryType === 'balcao' || order.deliveryType === 'retirada' || order.district === 'Balcão') ? (
                                    <Store className="w-3 h-3 flex-shrink-0" />
                                  ) : (
                                    <Bike className="w-3 h-3 flex-shrink-0" />
                                  )}
                                  <span className="truncate max-w-full">{(order.deliveryType === 'balcao' || order.deliveryType === 'retirada' || order.district === 'Balcão') ? (isNarrowCard ? 'Balcão' : '3. Balcão') : (isNarrowCard ? 'Entrega' : '3. Entrega')}</span>
                                </button>

                                {/* 4. Concluído */}
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatusAndTab(order, 'CONCLUIDO')}
                                  className={`py-1.5 px-1 rounded-lg font-bold flex flex-col items-center justify-center gap-0.5 min-w-0 transition-all cursor-pointer ${isNarrowCard ? 'text-[10px]' : 'text-[11px] sm:flex-row sm:gap-1'} ${
                                    currentStatus === 'CONCLUIDO'
                                      ? 'bg-emerald-500 text-dark-950 font-black shadow-sm ring-1 ring-inset ring-emerald-400'
                                      : 'bg-dark-900 hover:bg-dark-850 text-slate-400 hover:text-emerald-300 border border-dark-800'
                                  }`}
                                  title="Marcar como Concluído / Finalizado"
                                >
                                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate max-w-full">{isNarrowCard ? 'Pronto' : '4. Concluído'}</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-red-950/40 p-2.5 rounded-xl border border-red-500/40 my-2 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-red-400 text-xs font-bold min-w-0">
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
                          <div className={`bg-dark-950 rounded-xl border border-dark-850 space-y-2 mt-1 min-w-0 ${isNarrowCard ? 'p-2.5' : 'p-3'}`}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                O que precisa ser feito:
                              </div>
                              {!isCancelled && (
                                <button
                                  type="button"
                                  onClick={() => setEditItemsModalOrder(order)}
                                  className="px-2 py-0.5 rounded bg-brand-gold/15 hover:bg-brand-gold/25 border border-brand-gold/40 text-[10px] font-black text-brand-gold flex items-center gap-1 transition-all cursor-pointer flex-shrink-0"
                                  title="Adicionar, remover ou alterar itens deste pedido"
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                  <span>Editar Itens</span>
                                </button>
                              )}
                            </div>
                            <div className="space-y-1.5 text-xs">
                              {(order.items || []).map((it, idx) => (
                                <div key={idx} className="border-b border-dark-900 pb-1 last:border-0 last:pb-0">
                                  <div className="font-bold text-white flex items-start justify-between gap-2">
                                    <span className="min-w-0 break-words">{it.quantity}x {it.name}</span>
                                    <span className="text-slate-400 text-[11px] flex-shrink-0 whitespace-nowrap">
                                      R$ {((it.price || 0) * (it.quantity || 1)).toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>

                                  {/* Pizza Selections in Combo */}
                                  {it.pizzaSelections && it.pizzaSelections.length > 0 && (
                                    <div className="text-[11px] text-amber-300 font-medium pl-2 mt-0.5 space-y-0.5">
                                      {it.pizzaSelections.map((p, pIdx) => (
                                        <div key={pIdx}>🍕 <strong>{p.pizzaTitle}:</strong> {p.flavors.join(' / ')}</div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Standalone Pizza Flavors */}
                                  {it.flavors && it.flavors.length > 0 && !it.pizzaSelections && (
                                    <div className="text-[11px] text-amber-300 font-medium pl-2 mt-0.5">
                                      🍕 <strong>Sabores:</strong> {it.flavors.join(' / ')}
                                    </div>
                                  )}

                                  {/* Açaí Complements */}
                                  {(it.acaiComplements?.length > 0 || it.complements?.length > 0) && (
                                    <div className="text-[11px] text-purple-300 font-medium pl-2 mt-1 bg-purple-950/40 p-1.5 rounded border border-purple-800/40 space-y-0.5">
                                      <div>🍧 <strong>Barca/Copo Açaí:</strong> {(it.acaiComplements || it.complements).join(', ')}</div>
                                      {(it.acaiCobertura || it.cobertura) && (it.acaiCobertura || it.cobertura) !== 'Sem Cobertura' && (
                                        <div>🍯 <strong>Cobertura:</strong> {it.acaiCobertura || it.cobertura}</div>
                                      )}
                                    </div>
                                  )}

                                  {/* Refrigerante Dydyo */}
                                  {it.dydyoFlavor && (
                                    <div className="text-[11px] text-amber-300 font-semibold pl-2 mt-1 bg-amber-950/40 p-1.5 rounded border border-amber-500/40 flex items-center gap-1.5">
                                      <span>🥤</span>
                                      <span><strong>Refrigerante Incluso:</strong> {it.dydyoFlavor}</span>
                                    </div>
                                  )}

                                  {/* Bebida Escolhida */}
                                  {it.beverage && (
                                    <div className="text-[11px] text-cyan-300 font-semibold pl-2 mt-1 bg-cyan-950/40 p-1.5 rounded border border-cyan-500/40 flex items-center gap-1.5">
                                      <span>🥤</span>
                                      <span><strong>Bebida:</strong> {it.beverage}</span>
                                    </div>
                                  )}

                                  {/* Molho Extra */}
                                  {it.hasExtraSauce && (
                                    <div className="text-[11px] text-amber-200 font-semibold pl-2 mt-1 bg-amber-950/40 p-1.5 rounded border border-amber-600/40 flex items-center gap-1.5">
                                      <span>🍯</span>
                                      <span><strong>Molho Extra:</strong> {it.extraSauceName || 'Molho Especial'}</span>
                                      {it.extraSaucePrice > 0 && (
                                        <span className="text-[10px] text-amber-400 font-normal">
                                          (+R$ {Number(it.extraSaucePrice).toFixed(2).replace('.', ',')})
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Custom Box details */}
                                  {it.isCustomBox && (
                                    <div className="text-[11px] text-brand-goldLight pl-2 mt-0.5 space-y-0.5">
                                      {it.boxOptionTitle ? (
                                        <div className="text-[11px] font-bold text-amber-300 bg-dark-900 px-2 py-0.5 rounded border border-brand-gold/40 inline-flex items-center gap-1 mb-1">
                                          <span>✨</span>
                                          <span>{it.boxOptionTitle}</span>
                                        </div>
                                      ) : it.isSortido && (
                                        <div className="text-[10px] font-black text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/40 inline-flex items-center gap-1 mb-1">
                                          <span>🎲</span>
                                          <span>SORTIDO DA CASA (PREPARO INTERNO COZINHA)</span>
                                        </div>
                                      )}
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
                          <div className="flex flex-wrap justify-between items-baseline gap-x-2 pt-3 text-xs">
                            <span className="text-slate-400">Total com Entrega:</span>
                            <div className="text-right">
                              {(Number(order.serviceAmount || order.serviceFee) > 0) && (
                                <span className="text-[10px] text-amber-400 font-bold block">
                                  + R$ {Number(order.serviceAmount || order.serviceFee).toFixed(2).replace('.', ',')} ({order.serviceDescription || 'serviço'})
                                </span>
                              )}
                              {(Number(order.discountAmount || order.discount) > 0) && (
                                <span className="text-[10px] text-emerald-400 font-bold block">
                                  - R$ {Number(order.discountAmount || order.discount).toFixed(2).replace('.', ',')} desc.
                                </span>
                              )}
                              <span className="text-lg font-black text-brand-gold">
                                R$ {(order.total || 0).toFixed(2).replace('.', ',')}
                              </span>
                            </div>
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
                              onClick={() => {
                                const isBalcao = order.deliveryType === 'balcao' || order.deliveryType === 'retirada' || order.district === 'Balcão';
                                const defType = currentStatus === 'CONCLUIDO' 
                                  ? 'concluido' 
                                  : currentStatus === 'EM_PREPARO' 
                                  ? (isBalcao ? 'pronto' : 'entrega')
                                  : currentStatus === 'PRONTO_BALCAO'
                                  ? 'pronto'
                                  : currentStatus === 'SAIU_ENTREGA'
                                  ? 'entrega'
                                  : 'recebido';
                                handleOpenWhatsAppModal(order, defType);
                              }}
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
                                  {(order.deliveryType === 'balcao' || order.deliveryType === 'retirada' || order.district === 'Balcão') ? (
                                    <>
                                      <option value="PRONTO_BALCAO">📦 3. Mover p/ Pronto Balcão</option>
                                      <option value="CONCLUIDO">✅ 4. Mover p/ Concluído</option>
                                    </>
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
                                  const isBalcao = order.deliveryType === 'balcao' || order.deliveryType === 'retirada' || order.district === 'Balcão';
                                  if (isBalcao) {
                                    handleUpdateStatusAndTab(order, 'PRONTO_BALCAO');
                                  } else {
                                    handleUpdateStatusAndTab(order, 'SAIU_ENTREGA');
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer"
                              >
                                {(order.deliveryType === 'balcao' || order.deliveryType === 'retirada' || order.district === 'Balcão') ? (
                                  <>
                                    <Store className="w-3.5 h-3.5 stroke-[2.5]" />
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

                            {!isCancelled && currentStatus === 'PRONTO_BALCAO' && (
                              <button
                                onClick={() => handleUpdateStatusAndTab(order, 'CONCLUIDO')}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-bold text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer"
                                title="Cliente retirou o pedido: completar pedido e dar baixa"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Completar Pedido</span>
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
  };

  // Cartão compacto do quadro (estilo Ola Click): o essencial + botão da próxima etapa
  const getNextKanbanAction = (order) => {
    const st = normalizeOrderStatus(order);
    const isDelivery = order.deliveryType === 'delivery';
    if (st === 'RECEBIDO_COZINHA') return { status: 'EM_PREPARO', label: 'Aceitar e preparar', cls: 'bg-brand-gold text-dark-950' };
    if (st === 'EM_PREPARO') return isDelivery
      ? { status: 'SAIU_ENTREGA', label: 'Saiu p/ entrega', cls: 'bg-blue-500 text-white' }
      : { status: 'PRONTO_BALCAO', label: 'Pronto p/ retirar', cls: 'bg-blue-500 text-white' };
    if (st === 'PRONTO_BALCAO' || st === 'SAIU_ENTREGA') return { status: 'CONCLUIDO', label: 'Concluir', cls: 'bg-emerald-500 text-dark-950' };
    return null;
  };

  // Solta o pedido numa coluna do quadro e muda a etapa dele
  const handleKanbanDrop = (colId, orderId) => {
    setKanbanDragOverCol(null);
    setKanbanDragOrderId(null);
    const order = (scopedOrders || []).find(o => o.orderId === orderId);
    if (!order) return;
    const current = normalizeOrderStatus(order);
    if (current === 'CANCELADO') return;
    let target = null;
    if (colId === 'novos') target = 'RECEBIDO_COZINHA';
    else if (colId === 'preparo') target = 'EM_PREPARO';
    else if (colId === 'prontos') target = order.deliveryType === 'delivery' ? 'SAIU_ENTREGA' : 'PRONTO_BALCAO';
    else if (colId === 'concluidos') target = 'CONCLUIDO';
    else if (colId === 'cancelados') { setCancelModalOrder(order); return; }
    if (!target || target === current) return;
    if (colId === 'prontos' && (current === 'PRONTO_BALCAO' || current === 'SAIU_ENTREGA')) return;
    handleUpdateStatusAndTab(order, target);
  };

  const renderKanbanCompactCard = (order) => {
    const st = normalizeOrderStatus(order);
    const mins = getElapsedMinutes(order.createdAt);
    const isDone = st === 'CONCLUIDO' || st === 'CANCELADO';
    const timeCls = isDone ? 'bg-dark-800 text-slate-400'
      : mins >= 35 ? 'bg-red-500/20 text-red-300'
      : mins >= 20 ? 'bg-amber-500/20 text-amber-300'
      : 'bg-emerald-500/15 text-emerald-300';
    const isPaid = order.paymentStatus === 'PAGO_APROVADO';
    const items = Array.isArray(order.items) ? order.items : [];
    const itemsCount = items.reduce((a, i) => a + (Number(i.quantity) || 1), 0);
    const next = getNextKanbanAction(order);
    const isDelivery = order.deliveryType === 'delivery';
    const fromSite = order.source !== 'PDV_BALCAO';
    const isHighlighted = highlightedOrderId === order.orderId;

    return (
      <div
        role="button"
        tabIndex={0}
        draggable={st !== 'CANCELADO'}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          try { e.dataTransfer.setData('text/plain', order.orderId); } catch (err) {}
          setKanbanDragOrderId(order.orderId);
        }}
        onDragEnd={() => { setKanbanDragOrderId(null); setKanbanDragOverCol(null); }}
        onClick={() => setKanbanDetailOrderId(order.orderId)}
        onKeyDown={(e) => { if (e.key === 'Enter') setKanbanDetailOrderId(order.orderId); }}
        className={`rounded-xl bg-dark-900 border p-3 cursor-grab active:cursor-grabbing select-none transition-all hover:border-brand-gold/60 ${kanbanDragOrderId === order.orderId ? 'opacity-40 scale-[0.98]' : ''} ${
          isHighlighted ? 'border-brand-gold ring-2 ring-brand-gold/40' : st === 'RECEBIDO_COZINHA' ? 'border-amber-500/40' : 'border-white/[0.07]'
        } ${st === 'CANCELADO' ? 'opacity-60' : ''}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-white">#{formatOrderNumber(order)}</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${isDelivery ? 'bg-blue-500/15 text-blue-300' : 'bg-dark-800 text-slate-300'}`}>
            {isDelivery ? 'Delivery' : 'Retirada'}
          </span>
          {!fromSite && <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-brand-gold/15 text-brand-goldLight">PDV</span>}
          <span className={`ml-auto px-1.5 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 ${timeCls}`}>
            <Clock className="w-3 h-3" /> {mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, '0')}`}
          </span>
        </div>

        <p className="mt-1.5 text-sm font-semibold text-slate-100 truncate">{order.customerName || 'Cliente'}</p>
        <p className="text-xs text-slate-400 truncate">
          {isDelivery ? `${order.district || order.deliveryAddress?.district || ''}${order.address || order.deliveryAddress?.street ? ' • ' + (order.address || order.deliveryAddress?.street) : ''}` : 'Retirar no balcão'}
        </p>

        <ul className="mt-2 space-y-0.5 text-xs text-slate-300">
          {items.slice(0, 3).map((it, idx) => (
            <li key={it.id || idx} className="truncate"><span className="font-bold text-white">{it.quantity || 1}x</span> {it.name}</li>
          ))}
          {items.length > 3 && <li className="text-slate-500">+ {items.length - 3} itens</li>}
        </ul>
        {(order.orderNotes || order.notes) && (
          <p className="mt-1.5 text-[11px] text-amber-300 line-clamp-2">Obs: {order.orderNotes || order.notes}</p>
        )}

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-black text-white">R$ {(Number(order.total) || 0).toFixed(2).replace('.', ',')}</p>
            <p className={`text-[11px] font-semibold ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isPaid ? 'Pago' : 'A cobrar'} • {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handlePrintOrder(order); }}
              className="w-9 h-9 rounded-lg bg-dark-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              title="Imprimir comanda"
            >
              <Printer className="w-4 h-4" />
            </button>
            {next && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleUpdateStatusAndTab(order, next.status); }}
                className={`h-9 px-3 rounded-lg text-xs font-black whitespace-nowrap cursor-pointer ${next.cls}`}
              >
                {next.label}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Itens do menu lateral do painel (mesmas regras de acesso das abas antigas)
  const isAriquemesBuffet = currentBranch?.id === 'ariquemes' && (currentUser?.role === ROLES.SUPER_ADMIN || currentUser?.branchId === 'ariquemes');
  const isKitchenRole = currentUser?.role === ROLES.KITCHEN;
  const adminNavItems = [
    { id: 'kds', label: 'Pedidos', icon: ChefHat, group: 'Operação', badge: activeOrdersList.length, badgeTone: delayedCount > 0 ? 'alert' : undefined },
    !isKitchenRole && { id: 'pdv', label: 'Novo pedido (balcão)', shortLabel: 'Novo', icon: Plus, group: 'Operação', badge: pdvCart.length || null },
    { id: 'cash', label: 'Caixa do dia', icon: Lock, group: 'Operação', onClick: () => setIsCashClosingModalOpen(true) },
    !isKitchenRole && { id: 'menu', label: 'Cardápio', icon: Utensils, group: 'Loja', badge: scopedProductsList.length },
    !isKitchenRole && { id: 'settings', label: 'Configurações', shortLabel: 'Ajustes', icon: Settings2, group: 'Loja' },
    !isKitchenRole && { id: 'qrcode', label: 'QR Code e link', icon: QrCode, group: 'Loja' },
    !isKitchenRole && { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, group: 'Integrações' },
    currentUser?.role === ROLES.SUPER_ADMIN && { id: 'master-overview', label: 'Faturamento', icon: BarChart3, group: 'Gestão' },
    currentUser?.role === ROLES.BRANCH_ADMIN && { id: 'branch-overview', label: 'Desempenho', icon: BarChart3, group: 'Gestão' },
    currentUser?.role === ROLES.SUPER_ADMIN && { id: 'branches', label: 'Filiais', icon: Building2, group: 'Gestão', badge: branchesList.length },
    currentUser?.role === ROLES.SUPER_ADMIN && { id: 'users', label: 'Usuários', icon: Users, group: 'Gestão' },
    isAriquemesBuffet && { id: 'buffet', label: 'Buffet: pratos', icon: Utensils, group: 'Buffet', badge: unavailableBuffetIds.length ? `${unavailableBuffetIds.length} pausados` : null, badgeTone: 'alert' },
    isAriquemesBuffet && { id: 'gallery', label: 'Buffet: galeria', icon: Camera, group: 'Buffet' },
    onSwitchToBuffet && currentBranch?.id === 'ariquemes' && { id: 'buffet-site', label: 'Vitrine do buffet', icon: Sparkles, group: 'Buffet', onClick: onSwitchToBuffet }
  ].filter(Boolean);
  const adminMobileNavItems = adminNavItems
    .filter(it => ['kds', 'pdv', 'menu', 'settings'].includes(it.id))
    .map(it => (it.id === 'menu' ? { ...it, badge: null } : it));

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans lg:pl-64 pb-20 lg:pb-0">
      
      {/* Real-time Order Alert Banner */}
      {newOrderAlert && (
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-dark-950 font-black px-4 py-3 flex items-center justify-between shadow-2xl animate-bounce-subtle z-50 sticky top-0">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <BellRing className="w-5 h-5 animate-pulse" />
            <span>NOVO PEDIDO CHEGOU NA COZINHA! #{formatOrderNumber(newOrderAlert)} - {newOrderAlert.customerName} (R$ {(newOrderAlert.total || 0).toFixed(2).replace('.', ',')})</span>
          </div>
          <button
            onClick={() => setNewOrderAlert(null)}
            className="text-xs bg-dark-950 text-white px-2.5 py-1 rounded-lg cursor-pointer"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* Moldura do painel: menu lateral, barra superior e menu inferior (estilo Ola Click) */}
      <AdminShell
        items={adminNavItems}
        mobileItems={adminMobileNavItems}
        activeId={activeAdminTab}
        onSelect={(id) => {
          if (id === 'menu') setMenuSubTab('products');
          setActiveAdminTab(id);
          try { window.scrollTo({ top: 0 }); } catch (e) {}
        }}
        title={ADMIN_TAB_TITLES[activeAdminTab] || 'Painel'}
        subtitle={`${currentBranch?.displayName || currentBranch?.name || 'El Shadday'} • ${ROLE_LABELS[currentUser?.role] || 'Painel de Gestão'}`}
        userName={currentUser?.name}
        roleLabel={currentUser?.role === ROLES.SUPER_ADMIN ? 'Painel Master' : (currentBranch?.displayName || currentBranch?.name || 'Painel')}
        isStoreOpen={restaurantSettings.isOpen !== false}
        onToggleStore={handleQuickToggleStoreStatus}
        isAudioUnlocked={isAudioUnlocked}
        onToggleAudio={handleUnlockAndTestAudio}
        onBackToSite={onBackToSite}
        onLogout={onLogout}
        topExtra={currentUser?.role === ROLES.SUPER_ADMIN ? (
          <div className="hidden md:flex items-center gap-1.5 bg-dark-900 px-3 py-2 rounded-full border border-white/10">
            <Store className="w-3.5 h-3.5 text-brand-gold" />
            <select
              value={masterBranchFilter}
              onChange={(e) => setMasterBranchFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-dark-900 text-white">Todas as filiais</option>
              {branchesList.map(b => (
                <option key={b.id} value={b.id} className="bg-dark-900 text-white">{b.name}</option>
              ))}
            </select>
          </div>
        ) : null}
      >

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
              <div className="flex flex-wrap items-center gap-2 min-w-0 [&>*]:whitespace-nowrap">
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

                {/* Fechar Caixa Button */}
                <button
                  type="button"
                  onClick={() => setIsCashClosingModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-950 hover:bg-dark-850 border border-brand-gold/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
                  title="Controle de Caixa: Ver resumo do turno atual ou fechar o caixa"
                >
                  <Lock className="w-3.5 h-3.5 text-brand-gold" />
                  <span className="text-slate-300">Caixa: <strong className="text-brand-gold">R$ {currentShiftTotals.grossRevenue.toFixed(2).replace('.', ',')}</strong></span>
                  <span className="text-[10px] bg-brand-gold/15 text-amber-300 px-1.5 py-0.5 rounded font-black border border-brand-gold/30">
                    Fechar
                  </span>
                </button>
              </div>

            </div>

            {/* Filter Bar & Search */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-dark-900 border border-dark-800 space-y-3">
              <div className="flex flex-col gap-3">

                {/* Filter buttons (linha inteira, com barrinha para deslizar e setas) */}
                <div className="flex items-center gap-1.5 w-full min-w-0">
                <button
                  type="button"
                  onClick={() => scrollKdsFilters('left')}
                  className="flex-shrink-0 p-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-brand-gold border border-brand-gold/30 cursor-pointer transition-all active:scale-90"
                  title="Deslizar filtros para a esquerda"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
                <div
                  ref={kdsFiltersScrollRef}
                  onWheel={(e) => {
                    const el = kdsFiltersScrollRef.current;
                    if (el && e.deltaY !== 0 && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                      el.scrollLeft += e.deltaY;
                    }
                  }}
                  className="admin-tabs-scrollbar flex items-center gap-1.5 flex-1 min-w-0 pb-2 pt-0.5 select-none"
                >
                  <button
                    onClick={() => setSelectedFilter('todos')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                      selectedFilter === 'todos' 
                        ? 'bg-brand-gold text-dark-950 font-black' 
                        : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                    }`}
                  >
                    Ativos ({activeOrdersList.length})
                  </button>

                  <button
                    onClick={() => setSelectedFilter('atrasados')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 flex items-center gap-1 ${
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                      selectedFilter === 'pendentes' 
                        ? 'bg-amber-500 text-dark-950 font-black' 
                        : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                    }`}
                  >
                    Pendentes ({pendingCount})
                  </button>

                  <button
                    onClick={() => setSelectedFilter('preparo')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                      selectedFilter === 'preparo' 
                        ? 'bg-brand-gold text-dark-950 font-black' 
                        : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                    }`}
                  >
                    No Forno ({inPrepCount})
                  </button>

                  {readyBalcaoCount > 0 && (
                    <button
                      onClick={() => setSelectedFilter('pronto_balcao')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 flex items-center gap-1 ${
                        selectedFilter === 'pronto_balcao' 
                          ? 'bg-purple-500 text-white font-black' 
                          : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Pronto Balcão ({readyBalcaoCount})</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedFilter('entrega')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                      selectedFilter === 'entrega' 
                        ? 'bg-blue-500 text-white font-black' 
                        : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                    }`}
                  >
                    Saiu p/ Entrega ({inDeliveryCount})
                  </button>

                  <button
                    onClick={() => setSelectedFilter('concluidos')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                      selectedFilter === 'concluidos' 
                        ? 'bg-emerald-500 text-dark-950 font-black' 
                        : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                    }`}
                  >
                    Prontos / Entregues ({completedCount})
                  </button>

                  <button
                    onClick={() => setSelectedFilter('cancelados')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 flex items-center gap-1 ${
                      selectedFilter === 'cancelados' 
                        ? 'bg-red-700 text-white font-black' 
                        : 'bg-red-950/40 text-red-400 hover:bg-red-950/70 border border-red-800/40'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancelados ({cancelledCount})</span>
                  </button>

                  {scopedOrders.some(o => o.shiftClosedAt || o.isArchived) && (
                    <button
                      type="button"
                      onClick={() => setShowArchivedKdsOrders(!showArchivedKdsOrders)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 flex items-center gap-1 border ${
                        showArchivedKdsOrders 
                          ? 'bg-purple-600 text-white font-black shadow-sm' 
                          : 'bg-dark-850 hover:bg-dark-800 text-purple-300 border-purple-500/30'
                      }`}
                      title="Clique para ver os pedidos dos caixas anteriores que já foram fechados"
                    >
                      <span>📦 {showArchivedKdsOrders ? 'Ocultar Caixas Fechados' : 'Ver Caixas Fechados'}</span>
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => scrollKdsFilters('right')}
                  className="flex-shrink-0 p-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-brand-gold border border-brand-gold/30 cursor-pointer transition-all active:scale-90"
                  title="Deslizar filtros para a direita (ver mais opções)"
                >
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
                </div>

                {/* Right controls: Grid Layout, Compact Mode, Sound Tester, Auto-Aba & Search */}
                <div className="flex flex-wrap items-center gap-2 w-full">
                  {/* Grid Layout Scheme Selector */}
                  <div className="flex items-center gap-1 p-0.5 rounded-xl bg-dark-950 border border-dark-750" title="Mudar o esquema da grade de pedidos na tela">
                    <span className="text-[10px] text-slate-500 font-bold px-1.5 uppercase tracking-wider hidden lg:inline">Ver como:</span>
                    <button
                      type="button"
                      onClick={() => handleSetKdsGridCols('kanban')}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        kdsGridCols === 'kanban'
                          ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-dark-800'
                      }`}
                      title="Quadro com colunas por etapa (Novos, Em preparo, Prontos)"
                    >
                      Quadro
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetKdsGridCols('2')}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        kdsGridCols === '2'
                          ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-dark-800'
                      }`}
                      title="2 Colunas (Padrão Grande)"
                    >
                      2 Col
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetKdsGridCols('3')}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        kdsGridCols === '3'
                          ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-dark-800'
                      }`}
                      title="3 Colunas (Recomendado - Mais pedidos visíveis na tela)"
                    >
                      3 Col
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetKdsGridCols('4')}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        kdsGridCols === '4'
                          ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-dark-800'
                      }`}
                      title="4 Colunas (Mural Compacto - Máxima visão para dias de pico)"
                    >
                      4 Col
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetKdsGridCols('1')}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        kdsGridCols === '1'
                          ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-dark-800'
                      }`}
                      title="1 Coluna (Lista corrida)"
                    >
                      1 Col
                    </button>
                  </div>

                  {/* Compact Mode Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleKdsCompactMode}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                      kdsCompactMode
                        ? 'bg-brand-gold/20 text-brand-gold border-brand-gold/50'
                        : 'bg-dark-850 text-slate-400 border-dark-750 hover:bg-dark-800'
                    }`}
                    title="Diminui o tamanho e o espaçamento dos cartões para caber ainda mais pedidos na tela"
                  >
                    <span>🗜️ {kdsCompactMode ? 'Compacto: ON' : 'Compacto: OFF'}</span>
                  </button>

                  {/* Sound Test / Volume Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAudioUnlocked(true);
                      playChime(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40"
                    title="Testar o alarme sonoro alto da cozinha"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Som Alto</span>
                  </button>

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
                    <span>Auto-Aba: <strong>{autoFollowTab ? 'ON' : 'OFF'}</strong></span>
                  </button>

                  <div className="relative w-full sm:w-64 sm:ml-auto">
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
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 px-1">
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

              {filteredOrders.length === 0 && kdsGridCols !== 'kanban' ? (
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
                kdsGridCols === 'kanban' ? (
                  <div>
                  <p className="hidden md:block mb-2 text-xs text-slate-500">Dica: arraste os cartões com o mouse de uma coluna para outra para mudar a etapa do pedido.</p>
                  <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 snap-x">
                    {KDS_KANBAN_COLUMNS
                      .map(col => ({ ...col, list: filteredOrders.filter(o => col.statuses.includes(normalizeOrderStatus(o))) }))
                      .filter(col => (col.always && selectedFilter === 'todos') || col.list.length > 0)
                      .map(col => (
                        <section
                          key={col.id}
                          onDragOver={(e) => {
                            if (!kanbanDragOrderId) return;
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (kanbanDragOverCol !== col.id) setKanbanDragOverCol(col.id);
                          }}
                          onDragLeave={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget)) setKanbanDragOverCol(prev => (prev === col.id ? null : prev));
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            let id = kanbanDragOrderId;
                            try { id = e.dataTransfer.getData('text/plain') || id; } catch (err) {}
                            handleKanbanDrop(col.id, id);
                          }}
                          className={`snap-start flex-shrink-0 w-[85vw] sm:w-[320px] lg:flex-1 lg:min-w-[250px] rounded-2xl border flex flex-col max-h-[calc(100vh-200px)] transition-colors ${
                            kanbanDragOverCol === col.id
                              ? 'bg-brand-gold/10 border-brand-gold border-dashed'
                              : kanbanDragOrderId ? 'bg-dark-950/60 border-white/15 border-dashed' : 'bg-dark-950/60 border-white/5'
                          }`}
                        >
                          <header className={`flex items-center justify-between px-3.5 py-3 border-b border-white/5 rounded-t-2xl ${col.headerCls}`}>
                            <span className="font-bold text-sm">{col.title}</span>
                            <span className="min-w-[1.75rem] px-2 py-0.5 rounded-full bg-dark-950/60 text-xs font-black text-center">{col.list.length}</span>
                          </header>
                          <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                            {col.list.length === 0 ? (
                              <p className="py-8 text-center text-xs text-slate-500">{kanbanDragOrderId ? 'Solte aqui' : (col.dropHint || 'Nenhum pedido aqui')}</p>
                            ) : col.list.map(order => (
                              <React.Fragment key={order.orderId}>{renderKanbanCompactCard(order)}</React.Fragment>
                            ))}
                          </div>
                        </section>
                      ))}
                  </div>
                  </div>
                ) : (
                <div className={`
                  ${kdsGridCols === '1' ? 'grid grid-cols-1 gap-3.5 max-w-2xl mx-auto' : ''}
                  ${kdsGridCols === '2' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}
                  ${kdsGridCols === '3' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3' : ''}
                  ${kdsGridCols === '4' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5' : ''}
                `}>
                  {filteredOrders.map(order => (
                    <React.Fragment key={order.orderId}>{renderKdsOrderCard(order)}</React.Fragment>
                  ))}
                </div>
                )
              )}

            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: PDV DE BALCÃO (POINT OF SALE / CRIAR PEDIDOS COZINHA)  */}
        {/* ============================================================== */}
        {activeAdminTab === 'pdv' && currentUser?.role !== ROLES.KITCHEN && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Abas do PDV (estilo Ola Click) */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center p-1 rounded-xl bg-dark-900 border border-white/5">
                <button
                  type="button"
                  onClick={() => setPdvSubTab('novo')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 cursor-pointer ${
                    pdvSubTab === 'novo' ? 'bg-brand-gold text-dark-950' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Plus className="w-4 h-4" /> Novo pedido
                </button>
                <button
                  type="button"
                  onClick={() => setPdvSubTab('baixa')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 cursor-pointer ${
                    pdvSubTab === 'baixa' ? 'bg-brand-gold text-dark-950' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" /> Dar baixa
                  {openPdvOrdersCount > 0 && (
                    <span className={`min-w-[1.4rem] px-1.5 rounded-full text-[11px] font-black ${pdvSubTab === 'baixa' ? 'bg-dark-950 text-brand-gold' : 'bg-red-500 text-white'}`}>
                      {openPdvOrdersCount}
                    </span>
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCustomerDirectoryOpen(true);
                  setCustomerDirectorySearch('');
                }}
                className="ml-auto px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-slate-200 text-sm font-semibold flex items-center gap-2 cursor-pointer"
                title="Ver clientes cadastrados a partir dos pedidos"
              >
                <Users className="w-4 h-4 text-brand-gold" /> Clientes ({getAllCustomers().length})
              </button>
            </div>

            {/* Validation Banner if any */}
            {pdvValidationError && pdvSubTab !== 'novo' && (
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

            {/* PDV estilo Ola Click: catálogo em grade à esquerda, comanda fixa à direita */}
            {pdvSubTab === 'novo' && (
              <div className="lg:flex lg:gap-4 lg:items-start">

                {/* ===== CATÁLOGO ===== */}
                <section className="flex-1 min-w-0 rounded-2xl bg-dark-900/60 border border-white/5 overflow-hidden">
                  <div className="p-3 border-b border-white/5 space-y-3">
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-dark-950 border border-white/10 focus-within:border-brand-gold">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar produto"
                        value={pdvSearch}
                        onChange={(e) => setPdvSearch(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                      />
                      {pdvSearch && (
                        <button type="button" onClick={() => setPdvSearch('')} className="text-slate-500 hover:text-white cursor-pointer" aria-label="Limpar busca">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div
                      ref={pdvCategoryScrollRef}
                      onWheel={handlePdvCategoryWheel}
                      className="flex gap-1 overflow-x-auto no-scrollbar border-b border-white/5 -mb-3"
                    >
                      {[{ id: 'todos', name: 'Todos' }, ...deliveryCategories].map(cat => {
                        const count = cat.id === 'todos'
                          ? productsList.filter(p => p.isAvailable !== false).length
                          : productsList.filter(p => p.isAvailable !== false && p.categoryId === cat.id).length;
                        if (cat.id !== 'todos' && count === 0) return null;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setPdvCategory(cat.id)}
                            className={`flex-shrink-0 px-3 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                              pdvCategory === cat.id ? 'border-brand-gold text-brand-gold' : 'border-transparent text-slate-400 hover:text-white'
                            }`}
                          >
                            {cat.name} <span className="text-xs opacity-60">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3 pb-24 lg:pb-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 lg:max-h-[calc(100vh-230px)] lg:overflow-y-auto">
                    {/* Potinho de molho avulso */}
                    {extraSauceConfig?.active !== false && (pdvCategory === 'todos' || pdvCategory === 'bebidas') && !pdvSearch.trim() && (
                      <button
                        type="button"
                        onClick={handleAddStandaloneSauceToPDV}
                        className="relative text-left rounded-xl bg-dark-900 border border-amber-500/30 hover:border-amber-400 overflow-hidden flex flex-col cursor-pointer"
                      >
                        <div className="aspect-[4/3] bg-amber-500/10 flex items-center justify-center text-4xl">🍯</div>
                        <div className="p-2.5 flex-1 flex flex-col">
                          <p className="text-[13px] font-semibold text-white leading-snug line-clamp-2">Potinho de {extraSauceConfig.name || 'molho'}</p>
                          <p className="mt-auto pt-1 text-sm font-bold text-brand-gold">R$ {Number(extraSauceConfig.price || 0).toFixed(2).replace('.', ',')}</p>
                        </div>
                        {pdvCart.find(i => i.isStandaloneSauce) && (
                          <span className="absolute top-2 right-2 min-w-[1.6rem] h-6 px-1.5 rounded-full bg-brand-gold text-dark-950 text-xs font-black flex items-center justify-center">
                            {pdvCart.find(i => i.isStandaloneSauce).quantity}
                          </span>
                        )}
                      </button>
                    )}

                    {pdvFilteredProducts.length === 0 && (
                      <p className="col-span-full py-10 text-center text-sm text-slate-500">Nenhum produto encontrado.</p>
                    )}

                    {pdvFilteredProducts.map(prod => {
                      const inCart = pdvCart.find(i => i.id === prod.id);
                      const needsOptions = isPizzaProduct(prod) || isBoxProduct(prod) || isComboProduct(prod) || isAcaiProduct(prod);
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => handlePDVProductClick(prod)}
                          className={`relative text-left rounded-xl bg-dark-900 border overflow-hidden flex flex-col transition-colors cursor-pointer active:scale-[0.98] ${
                            inCart ? 'border-brand-gold' : 'border-white/[0.06] hover:border-brand-gold/50'
                          }`}
                        >
                          <div className="aspect-[4/3] bg-dark-950">
                            {prod.image ? (
                              <img src={prod.image} alt="" loading="lazy" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Utensils className="w-8 h-8 text-brand-gold/30" /></div>
                            )}
                          </div>
                          <div className="p-2.5 flex-1 flex flex-col">
                            <p className="text-[13px] font-semibold text-white leading-snug line-clamp-2">{prod.name}</p>
                            <div className="mt-auto pt-1">
                              {needsOptions && <span className="block text-[10px] leading-none text-slate-400">a partir de</span>}
                              <span className="text-sm font-bold text-brand-gold whitespace-nowrap">R$ {(prod.price || 0).toFixed(2).replace('.', ',')}</span>
                            </div>
                          </div>
                          {inCart && (
                            <span className="absolute top-2 right-2 min-w-[1.6rem] h-6 px-1.5 rounded-full bg-brand-gold text-dark-950 text-xs font-black flex items-center justify-center">
                              {inCart.quantity}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Botão "Ver comanda" no celular */}
                {pdvCart.length > 0 && !pdvTicketOpen && (
                  <button
                    type="button"
                    onClick={() => setPdvTicketOpen(true)}
                    className="lg:hidden fixed left-3 right-3 bottom-[76px] z-30 h-14 px-4 rounded-2xl bg-brand-gold text-dark-950 font-bold flex items-center justify-between shadow-glow-gold cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="min-w-[1.6rem] h-6 px-1.5 rounded-lg bg-dark-950 text-brand-gold text-xs font-black flex items-center justify-center">
                        {pdvCart.reduce((a, i) => a + i.quantity, 0)}
                      </span>
                      Ver comanda
                    </span>
                    <span className="font-black">R$ {pdvCartTotal.toFixed(2).replace('.', ',')}</span>
                  </button>
                )}

                {/* ===== COMANDA ===== */}
                <aside
                  className={`${pdvTicketOpen ? 'fixed inset-0 z-[75] flex' : 'hidden'} lg:z-auto lg:flex lg:sticky lg:top-[76px] w-full lg:w-[380px] xl:w-[400px] flex-shrink-0 flex-col bg-dark-900 lg:rounded-2xl lg:border lg:border-white/10 lg:h-[calc(100vh-150px)] overflow-hidden`}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setPdvTicketOpen(false)} className="lg:hidden w-9 h-9 rounded-full bg-dark-800 text-slate-200 flex items-center justify-center cursor-pointer" aria-label="Voltar ao catálogo">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h3 className="text-base font-bold text-white">Comanda</h3>
                    </div>
                    {(pdvCart.length > 0 || pdvCustomerName) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!window.confirm('Limpar a comanda inteira?')) return;
                          setPdvCart([]);
                          setPdvDiscount('');
                          setPdvServiceName('');
                          setPdvServiceFee('');
                          setPdvCustomerName('');
                          setPdvCustomerPhone('');
                          setPdvAddress('');
                          setPdvNumber('');
                          setPdvReference('');
                          setPdvOrderNotes('');
                          setPdvCashChange('');
                          setActiveAutoCompletedCustomer(null);
                        }}
                        className="text-xs font-semibold text-red-300 hover:text-red-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Limpar
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {/* Tipo de pedido */}
                    <div className="px-4 pt-3">
                      <div className="grid grid-cols-2 p-1 rounded-xl bg-dark-950 border border-white/5">
                        {[
                          { id: 'balcao', label: 'Balcão / Retirada', icon: Store },
                          { id: 'delivery', label: 'Delivery', icon: Bike }
                        ].map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setPdvDeliveryType(t.id)}
                            className={`py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                              pdvDeliveryType === t.id ? 'bg-brand-gold text-dark-950' : 'text-slate-400'
                            }`}
                          >
                            <t.icon className="w-4 h-4" /> {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cliente */}
                    <div className="px-4 pt-3 relative">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Cliente</p>
                      <div className="grid grid-cols-5 gap-2">
                        <input
                          type="text"
                          placeholder="Nome *"
                          value={pdvCustomerName}
                          onChange={handleCustomerNameChange}
                          onFocus={() => {
                            if (pdvCustomerName.trim().length >= 2) {
                              const matches = searchCustomers(pdvCustomerName);
                              setCustomerSuggestions(matches);
                              setIsCustomerSuggestionsOpen(matches.length > 0);
                            }
                          }}
                          className="col-span-3 px-3 py-2.5 rounded-xl bg-dark-950 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                        />
                        <input
                          type="tel"
                          placeholder="Telefone"
                          value={pdvCustomerPhone}
                          onChange={handleCustomerPhoneChange}
                          onFocus={() => {
                            if (pdvCustomerPhone.trim().length >= 2) {
                              const matches = searchCustomers(pdvCustomerPhone);
                              setCustomerSuggestions(matches);
                              setIsCustomerSuggestionsOpen(matches.length > 0);
                            }
                          }}
                          className="col-span-2 px-3 py-2.5 rounded-xl bg-dark-950 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                        />
                      </div>

                      {isCustomerSuggestionsOpen && customerSuggestions.length > 0 && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsCustomerSuggestionsOpen(false)} />
                          <div className="absolute left-4 right-4 mt-1 z-50 rounded-xl bg-dark-850 border border-brand-gold/40 shadow-2xl max-h-60 overflow-y-auto divide-y divide-white/5">
                            {customerSuggestions.map(cust => (
                              <button
                                key={cust.id || cust.key}
                                type="button"
                                onClick={() => handleSelectCustomer(cust)}
                                className="w-full p-2.5 text-left hover:bg-brand-gold/10 flex items-center gap-2.5 cursor-pointer"
                              >
                                <span className="w-8 h-8 rounded-full bg-brand-gold/20 text-brand-gold font-black text-xs flex items-center justify-center flex-shrink-0">
                                  {(cust.name || 'C').charAt(0).toUpperCase()}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-semibold text-white truncate">{cust.name}</span>
                                  <span className="block text-xs text-slate-400 truncate">
                                    {cust.phoneFormatted || cust.phone || 'sem telefone'}
                                    {(cust.street || cust.address) ? ` • ${cust.district || ''} ${cust.street || cust.address}` : ''}
                                  </span>
                                </span>
                                <span className="text-[11px] text-slate-500 flex-shrink-0">{cust.ordersCount || 1} ped.</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {activeAutoCompletedCustomer && (
                        <p className="mt-1.5 text-xs text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Cliente cadastrado • {activeAutoCompletedCustomer.ordersCount || 1} pedidos anteriores
                        </p>
                      )}

                      {pdvDeliveryType === 'delivery' && (
                        <div className="mt-2 space-y-2">
                          <select
                            value={pdvDistrict.id}
                            onChange={(e) => {
                              const found = districtsList.find(d => d.id === e.target.value);
                              if (found) setPdvDistrict(found);
                            }}
                            className="w-full px-3 py-2.5 rounded-xl bg-dark-950 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-gold"
                          >
                            {districtsList.map(d => (
                              <option key={d.id} value={d.id} disabled={d.isAvailable === false}>
                                {d.name} {d.isAvailable === false ? '(pausado)' : `— entrega R$ ${(Number(d.price) || 0).toFixed(2).replace('.', ',')}`}
                              </option>
                            ))}
                          </select>
                          <div className="grid grid-cols-4 gap-2">
                            <input type="text" placeholder="Rua / endereço *" value={pdvAddress} onChange={(e) => setPdvAddress(e.target.value)} className="col-span-3 px-3 py-2.5 rounded-xl bg-dark-950 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold" />
                            <input type="text" placeholder="Nº" value={pdvNumber} onChange={(e) => setPdvNumber(e.target.value)} className="px-3 py-2.5 rounded-xl bg-dark-950 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold" />
                          </div>
                          <input type="text" placeholder="Ponto de referência" value={pdvReference} onChange={(e) => setPdvReference(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-dark-950 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold" />
                        </div>
                      )}
                    </div>

                    {/* Itens */}
                    <div className="px-4 pt-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Itens</p>
                      {pdvCart.length === 0 ? (
                        <div className="py-8 rounded-xl border border-dashed border-white/10 text-center text-sm text-slate-500">
                          Toque nos produtos para adicionar
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5 rounded-xl bg-dark-950 border border-white/5">
                          {pdvCart.map(item => (
                            <div key={item.id} className="p-2.5 flex items-start gap-2.5">
                              <div className="flex items-center rounded-lg bg-dark-800 flex-shrink-0">
                                <button type="button" onClick={() => handleUpdatePDVItemQty(item.id, -1)} className="w-7 h-8 flex items-center justify-center text-slate-200 cursor-pointer" aria-label="Diminuir">
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-5 text-center text-sm font-bold text-white">{item.quantity}</span>
                                <button type="button" onClick={() => handleUpdatePDVItemQty(item.id, 1)} className="w-7 h-8 flex items-center justify-center text-slate-200 cursor-pointer" aria-label="Aumentar">
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white leading-snug">{item.name}</p>
                                {item.description && <p className="text-xs text-slate-400 leading-snug line-clamp-3 mt-0.5">{item.description}</p>}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold text-white">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                                <button type="button" onClick={() => handleRemovePDVItem(item.id)} className="mt-1 text-slate-500 hover:text-red-400 cursor-pointer" aria-label="Remover item">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Extras recolhíveis: observação, desconto, serviço */}
                    <div className="px-4 pt-3 space-y-1.5">
                      {[
                        { id: 'obs', label: 'Observação para a cozinha', icon: MessageSquare, value: pdvOrderNotes ? pdvOrderNotes : '' },
                        { id: 'desc', label: 'Desconto', icon: Tag, value: pdvDiscountAmount > 0 ? `- R$ ${pdvDiscountAmount.toFixed(2).replace('.', ',')}` : '' },
                        { id: 'serv', label: 'Serviço / taxa extra', icon: Wrench, value: pdvServiceAmount > 0 ? `+ R$ ${pdvServiceAmount.toFixed(2).replace('.', ',')}` : '' }
                      ].map(ex => (
                        <div key={ex.id} className="rounded-xl bg-dark-950 border border-white/5">
                          <button
                            type="button"
                            onClick={() => setPdvExtrasOpen(prev => (prev === ex.id ? '' : ex.id))}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 cursor-pointer"
                          >
                            <ex.icon className="w-4 h-4 text-brand-gold" />
                            <span className="flex-1 text-left">{ex.label}</span>
                            {ex.value && <span className="text-xs font-semibold text-brand-goldLight truncate max-w-[45%]">{ex.value}</span>}
                            <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${pdvExtrasOpen === ex.id ? 'rotate-90' : ''}`} />
                          </button>
                          {pdvExtrasOpen === ex.id && (
                            <div className="px-3 pb-3">
                              {ex.id === 'obs' && (
                                <textarea
                                  rows={2}
                                  placeholder="Ex.: sem cebola, massa bem assada..."
                                  value={pdvOrderNotes}
                                  onChange={(e) => setPdvOrderNotes(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                                />
                              )}
                              {ex.id === 'desc' && (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="R$ 0,00"
                                    value={pdvDiscount}
                                    onChange={(e) => setPdvDiscount(e.target.value)}
                                    className="w-24 px-3 py-2 rounded-lg bg-dark-900 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                  />
                                  {[2, 5, 10].map(v => (
                                    <button key={v} type="button" onClick={() => setPdvDiscount(String(v))} className="px-2.5 py-2 rounded-lg bg-dark-900 border border-white/10 text-xs font-bold text-emerald-300 cursor-pointer">R$ {v}</button>
                                  ))}
                                  {pdvDiscount && <button type="button" onClick={() => setPdvDiscount('')} className="ml-auto text-xs text-slate-400 cursor-pointer">Tirar</button>}
                                </div>
                              )}
                              {ex.id === 'serv' && (
                                <div className="space-y-1.5">
                                  <div className="flex gap-1.5">
                                    <input type="text" placeholder="O que foi (ex.: embalagem)" value={pdvServiceName} onChange={(e) => setPdvServiceName(e.target.value)} className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-dark-900 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400" />
                                    <input type="text" inputMode="decimal" placeholder="R$ 0,00" value={pdvServiceFee} onChange={(e) => setPdvServiceFee(e.target.value)} className="w-24 px-3 py-2 rounded-lg bg-dark-900 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400" />
                                  </div>
                                  <div className="flex gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => { setPdvServiceName('10% Garçom'); setPdvServiceFee((pdvCartSubtotal * 0.1).toFixed(2).replace('.', ',')); }}
                                      className="px-2.5 py-1.5 rounded-lg bg-dark-900 border border-white/10 text-xs font-bold text-amber-300 cursor-pointer"
                                    >
                                      10% garçom
                                    </button>
                                    {(pdvServiceName || pdvServiceFee) && (
                                      <button type="button" onClick={() => { setPdvServiceName(''); setPdvServiceFee(''); }} className="ml-auto text-xs text-slate-400 cursor-pointer">Tirar</button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Pagamento */}
                    <div className="px-4 pt-4 pb-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Pagamento</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { id: 'pix', label: 'Pix', icon: QrCode },
                          { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
                          { id: 'debito', label: 'Débito', icon: CreditCard },
                          { id: 'credito', label: 'Crédito', icon: CreditCard }
                        ].map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPdvPaymentMethod(p.id)}
                            className={`py-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer ${
                              pdvPaymentMethod === p.id ? 'bg-brand-gold/15 border-brand-gold text-brand-goldLight' : 'bg-dark-950 border-white/10 text-slate-400'
                            }`}
                          >
                            <p.icon className="w-4 h-4" /> {p.label}
                          </button>
                        ))}
                      </div>
                      {pdvPaymentMethod === 'dinheiro' && (
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Troco para quanto? (deixe vazio se não precisa)"
                          value={pdvCashChange}
                          onChange={(e) => setPdvCashChange(e.target.value)}
                          className="mt-2 w-full px-3 py-2.5 rounded-xl bg-dark-950 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                        />
                      )}
                      {(pdvPaymentMethod === 'debito' || pdvPaymentMethod === 'credito') && restaurantSettings.cardMachineNoticeActive !== false && restaurantSettings.cardMachineNotice && (
                        <p className="mt-2 text-xs text-amber-300">{restaurantSettings.cardMachineNotice}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => setPdvIsPaid(v => !v)}
                        className="mt-2 w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-dark-950 border border-white/10 cursor-pointer"
                        role="switch"
                        aria-checked={pdvIsPaid}
                      >
                        <span className={`text-sm font-semibold ${pdvIsPaid ? 'text-emerald-300' : 'text-amber-300'}`}>
                          {pdvIsPaid ? 'Já está pago' : 'Cobrar na entrega / retirada'}
                        </span>
                        <span className={`relative w-10 h-6 rounded-full ${pdvIsPaid ? 'bg-emerald-500' : 'bg-dark-700'}`}>
                          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${pdvIsPaid ? 'left-[18px]' : 'left-0.5'}`} />
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Rodapé: totais + botões */}
                  <div className="border-t border-white/10 bg-dark-950 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-1">
                    <div className="flex justify-between text-sm text-slate-400">
                      <span>Subtotal</span><span>R$ {pdvCartSubtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    {pdvDeliveryType === 'delivery' && (
                      <div className="flex justify-between text-sm text-slate-400">
                        <span>Entrega ({pdvDistrict.name})</span><span>R$ {pdvDeliveryFee.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    {pdvServiceAmount > 0 && (
                      <div className="flex justify-between text-sm text-amber-300">
                        <span>{pdvServiceName.trim() || 'Serviço'}</span><span>+ R$ {pdvServiceAmount.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    {pdvDiscountAmount > 0 && (
                      <div className="flex justify-between text-sm text-emerald-300">
                        <span>Desconto</span><span>- R$ {pdvDiscountAmount.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-base font-bold text-white">Total</span>
                      <span className="text-2xl font-black text-brand-gold">R$ {pdvCartTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    {pdvValidationError && (
                      <p className="text-sm font-semibold text-red-300 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {pdvValidationError}</p>
                    )}
                    <div className="grid grid-cols-5 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={async () => { await handleLaunchPDVOrder(true); }}
                        disabled={pdvCart.length === 0 || isLaunchingPdv}
                        className="col-span-2 h-12 rounded-xl border border-white/15 bg-dark-900 text-slate-200 text-[13px] font-bold leading-tight disabled:opacity-40 cursor-pointer"
                        title="Registra a venda como já entregue e paga (não vai para a cozinha)"
                      >
                        Venda direta
                      </button>
                      <button
                        type="button"
                        onClick={async () => { await handleLaunchPDVOrder(false); }}
                        disabled={pdvCart.length === 0 || isLaunchingPdv}
                        className="col-span-3 h-12 rounded-xl bg-brand-gold text-dark-950 text-sm font-black flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                        title="Envia o pedido para a fila da cozinha"
                      >
                        <ChefHat className="w-4 h-4" /> {isLaunchingPdv ? 'Enviando...' : 'Enviar p/ cozinha'}
                      </button>
                    </div>
                  </div>
                </aside>
              </div>
            )}

            {/* SUB-VIEW 2: CONTROLE / DAR BAIXA NOS PEDIDOS */}
            {pdvSubTab === 'baixa' && (
              <div className="space-y-4 animate-fade-in">
                {/* Active Toast Notification Banner */}
                {pdvBaixaToast && (
                  <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-lg animate-fade-in ${
                    pdvBaixaToast.type === 'success' 
                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' 
                      : 'bg-blue-950/80 border-blue-500/50 text-blue-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                        pdvBaixaToast.type === 'success' ? 'bg-emerald-500 text-dark-950' : 'bg-blue-500 text-white'
                      }`}>
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{pdvBaixaToast.text}</div>
                        <div className="text-xs text-slate-300">Cliente: {pdvBaixaToast.customerName || 'Balcão'}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPdvBaixaToast(null)}
                      className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Quick Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* 1. Em Aberto */}
                  <div 
                    onClick={() => setPdvBaixaFilter('abertos')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      pdvBaixaFilter === 'abertos' 
                        ? 'bg-amber-500/15 border-amber-500/60 ring-2 ring-amber-500/30' 
                        : 'bg-dark-900 border-dark-800 hover:border-dark-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Total em Aberto</span>
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-amber-400">{openPdvOrdersCount}</span>
                      <span className="text-[11px] text-slate-400">pedidos</span>
                    </div>
                  </div>

                  {/* 2. Balcão / Retirada */}
                  <div 
                    onClick={() => setPdvBaixaFilter('balcao')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      pdvBaixaFilter === 'balcao' 
                        ? 'bg-brand-gold/15 border-brand-gold/60 ring-2 ring-brand-gold/30' 
                        : 'bg-dark-900 border-dark-800 hover:border-dark-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Balcão (Retirada)</span>
                      <Store className="w-4 h-4 text-brand-gold" />
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-brand-gold">{balcaoOpenCount}</span>
                      <span className="text-[11px] text-slate-400">a entregar</span>
                    </div>
                  </div>

                  {/* 3. Delivery */}
                  <div 
                    onClick={() => setPdvBaixaFilter('delivery')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      pdvBaixaFilter === 'delivery' 
                        ? 'bg-blue-500/15 border-blue-500/60 ring-2 ring-blue-500/30' 
                        : 'bg-dark-900 border-dark-800 hover:border-dark-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Delivery</span>
                      <Bike className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-blue-400">{deliveryOpenCount}</span>
                      <span className="text-[11px] text-slate-400">em rota/fila</span>
                    </div>
                  </div>

                  {/* 4. Concluídos / Baixas Dadas */}
                  <div 
                    onClick={() => setPdvBaixaFilter('concluidos')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      pdvBaixaFilter === 'concluidos' 
                        ? 'bg-emerald-500/15 border-emerald-500/60 ring-2 ring-emerald-500/30' 
                        : 'bg-dark-900 border-dark-800 hover:border-dark-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Baixas Hoje</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-400">{concluidosCount}</span>
                      <span className="text-[11px] text-slate-400">finalizados</span>
                    </div>
                  </div>
                </div>

                {/* Filter pills & search bar */}
                <div className="p-3.5 rounded-2xl bg-dark-900 border border-dark-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setPdvBaixaFilter('abertos')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        pdvBaixaFilter === 'abertos'
                          ? 'bg-amber-500 text-dark-950 font-black shadow-sm'
                          : 'bg-dark-950 hover:bg-dark-800 text-slate-300 border border-dark-800'
                      }`}
                    >
                      Abertos ({openPdvOrdersCount})
                    </button>

                    <button
                      type="button"
                      onClick={() => setPdvBaixaFilter('balcao')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        pdvBaixaFilter === 'balcao'
                          ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                          : 'bg-dark-950 hover:bg-dark-800 text-slate-300 border border-dark-800'
                      }`}
                    >
                      Balcão ({balcaoOpenCount})
                    </button>

                    <button
                      type="button"
                      onClick={() => setPdvBaixaFilter('delivery')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        pdvBaixaFilter === 'delivery'
                          ? 'bg-blue-500 text-white font-black shadow-sm'
                          : 'bg-dark-950 hover:bg-dark-800 text-slate-300 border border-dark-800'
                      }`}
                    >
                      Delivery ({deliveryOpenCount})
                    </button>

                    <button
                      type="button"
                      onClick={() => setPdvBaixaFilter('concluidos')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        pdvBaixaFilter === 'concluidos'
                          ? 'bg-emerald-500 text-dark-950 font-black shadow-sm'
                          : 'bg-dark-950 hover:bg-dark-800 text-slate-300 border border-dark-800'
                      }`}
                    >
                      Concluídos ({concluidosCount})
                    </button>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={pdvBaixaSearch}
                      onChange={(e) => setPdvBaixaSearch(e.target.value)}
                      placeholder="Buscar nº pedido, cliente, fone..."
                      className="w-full bg-dark-950 border border-dark-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                    />
                    {pdvBaixaSearch && (
                      <button
                        type="button"
                        onClick={() => setPdvBaixaSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Orders Grid / List */}
                {filteredPdvBaixaOrders.length === 0 ? (
                  <div className="p-12 rounded-3xl bg-dark-900 border border-dark-800 text-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-dark-950 border border-dark-800 text-brand-gold flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div className="max-w-md mx-auto">
                      <h3 className="text-base font-black text-white">
                        {pdvBaixaFilter === 'abertos' 
                          ? 'Nenhum pedido em aberto aguardando baixa!' 
                          : pdvBaixaSearch 
                          ? 'Nenhum pedido encontrado com este termo.' 
                          : 'Nenhum pedido registrado nesta categoria.'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {pdvBaixaFilter === 'abertos'
                          ? 'Todos os pedidos foram atendidos e tiveram a baixa dada no sistema.'
                          : 'Você pode pesquisar por outro nome ou criar um novo lançamento.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPdvSubTab('novo')}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black text-xs inline-flex items-center gap-1.5 shadow-glow-gold cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>+ Fazer Novo Lançamento</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredPdvBaixaOrders.map((order) => {
                      const orderDisplayNumber = formatOrderNumber(order);
                      const currentStatus = normalizeOrderStatus(order);
                      const isConcluded = currentStatus === 'CONCLUIDO';
                      const isPaid = order.paymentStatus === 'PAGO_APROVADO';
                      const elapsedMin = getElapsedMinutes(order.createdAt);
                      const isDelayed = isOrderDelayed(order);

                      return (
                        <div
                          key={order.orderId}
                          className={`rounded-3xl border flex flex-col justify-between transition-all duration-300 shadow-lg ${
                            isConcluded
                              ? 'bg-dark-900/60 border-dark-800/80 opacity-80 hover:opacity-100'
                              : isDelayed
                              ? 'bg-red-950/20 border-red-500/50 ring-1 ring-red-500/30'
                              : 'bg-dark-900 border-dark-800 hover:border-brand-gold/40'
                          }`}
                        >
                          {/* Card Header */}
                          <div className="p-4 sm:p-5 border-b border-dark-800/80 space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-display font-black text-xl text-brand-gold tracking-tight bg-dark-950 px-2.5 py-0.5 rounded-xl border border-brand-gold/40 shadow-sm">
                                  #{orderDisplayNumber}
                                </span>
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 ${
                                  order.deliveryType === 'balcao'
                                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                                    : 'bg-blue-500/15 border border-blue-500/40 text-blue-300'
                                }`}>
                                  {order.deliveryType === 'balcao' ? (
                                    <>
                                      <Store className="w-3 h-3" />
                                      <span>Balcão</span>
                                    </>
                                  ) : (
                                    <>
                                      <Bike className="w-3 h-3" />
                                      <span>Delivery</span>
                                    </>
                                  )}
                                </span>
                              </div>

                              {/* Status Indicator */}
                              <div>
                                {isConcluded ? (
                                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Baixa Concluída</span>
                                  </span>
                                ) : (
                                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border ${
                                    currentStatus === 'RECEBIDO_COZINHA'
                                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                      : currentStatus === 'EM_PREPARO'
                                      ? 'bg-brand-gold/15 border-brand-gold/40 text-brand-gold'
                                      : (currentStatus === 'SAIU_ENTREGA' || currentStatus === 'PRONTO_BALCAO')
                                      ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                                      : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                  }`}>
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {currentStatus === 'RECEBIDO_COZINHA' && 'Na Fila'}
                                      {currentStatus === 'EM_PREPARO' && 'No Forno'}
                                      {currentStatus === 'PRONTO_BALCAO' && 'Pronto Balcão'}
                                      {currentStatus === 'SAIU_ENTREGA' && 'Em Rota'}
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Customer Info */}
                            <div className="space-y-1">
                              <div className="text-sm font-bold text-white flex items-center gap-1.5 min-w-0">
                                <User className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" />
                                <span className="truncate min-w-0">{order.customerName || 'Cliente Balcão'}</span>
                                {normalizeOrderStatus(order) !== 'CANCELADO' && (
                                  <button
                                    type="button"
                                    onClick={() => setEditCustomerModalOrder(order)}
                                    className="ml-auto px-2 py-0.5 rounded bg-brand-gold/15 hover:bg-brand-gold/25 border border-brand-gold/40 text-[10px] font-black text-brand-gold flex items-center gap-1 transition-all cursor-pointer flex-shrink-0"
                                    title="Corrigir nome, telefone, endereço, pagamento ou trocar entre retirada e entrega"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" />
                                    <span>Editar</span>
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                                {order.customerPhone && (
                                  <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    <span>{order.customerPhone}</span>
                                  </span>
                                )}
                                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span>{elapsedMin === 0 ? 'Agora mesmo' : `há ${elapsedMin} min`}</span>
                                </span>
                              </div>

                              {order.deliveryType === 'delivery' && (
                                <div className="text-[11px] text-slate-300 flex items-center gap-1 pt-0.5">
                                  <MapPin className="w-3 h-3 text-brand-gold flex-shrink-0" />
                                  <span className="truncate">
                                    {order.district} • {order.address}{order.number ? `, Nº ${order.number}` : ''}
                                  </span>
                                </div>
                              )}

                              {order.orderNotes && (
                                <div className="text-[11px] text-amber-300/90 italic bg-dark-950/80 p-1.5 rounded-lg border border-dark-850 mt-1">
                                  Obs: {order.orderNotes}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Body: Items List */}
                          <div className="p-4 sm:p-5 flex-1 space-y-2">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                              <span>Itens do Pedido ({order.items?.length || 0})</span>
                              <div className="text-right">
                                {(Number(order.serviceAmount || order.serviceFee) > 0) && (
                                <span className="text-[10px] text-amber-400 font-bold block">
                                  + R$ {Number(order.serviceAmount || order.serviceFee).toFixed(2).replace('.', ',')} ({order.serviceDescription || 'serviço'})
                                </span>
                              )}
                              {(Number(order.discountAmount || order.discount) > 0) && (
                                  <div className="text-[10px] text-emerald-400 font-bold">
                                    - R$ {Number(order.discountAmount || order.discount).toFixed(2).replace('.', ',')} desc.
                                  </div>
                                )}
                                <span className="text-brand-gold font-mono font-black text-xs">
                                  R$ {(Number(order.total) || 0).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            </div>

                            <div className="bg-dark-950 p-2.5 rounded-2xl border border-dark-850 space-y-1.5 max-h-44 overflow-y-auto">
                              {(order.items || []).map((it, idx) => (
                                <div key={idx} className="border-b border-dark-900 pb-1.5 last:border-0 last:pb-0 text-xs">
                                  <div className="font-bold text-white flex items-center justify-between">
                                    <span>{it.quantity}x {it.name}</span>
                                    <span className="text-slate-400 text-[11px]">
                                      R$ {((it.price || 0) * (it.quantity || 1)).toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                  {it.customizerDetails && (
                                    <div className="text-[11px] text-brand-goldLight pl-2 mt-0.5">
                                      {it.customizerDetails}
                                    </div>
                                  )}
                                  {it.boxSelections && it.boxSelections.length > 0 && (
                                    <div className="text-[11px] text-amber-300/80 pl-2 mt-0.5">
                                      {it.boxSelections.map(f => `${f.quantity}x ${f.name}`).join(' • ')}
                                    </div>
                                  )}
                                  {it.beverage && (
                                    <div className="text-[11px] text-cyan-300 font-semibold pl-2 mt-0.5">
                                      🥤 Bebida: {it.beverage}
                                    </div>
                                  )}
                                  {it.hasExtraSauce && (
                                    <div className="text-[11px] text-amber-200 font-semibold pl-2 mt-0.5">
                                      🍯 Molho Extra: {it.extraSauceName || 'Molho Especial'}{it.extraSaucePrice > 0 ? ` (+R$ ${Number(it.extraSaucePrice).toFixed(2)})` : ''}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Payment Info */}
                            <div className="p-2.5 rounded-2xl bg-dark-950/60 border border-dark-850 flex items-center justify-between gap-2">
                              <div className="text-xs truncate">
                                <span className="text-slate-400">Pagamento: </span>
                                <span className="font-bold text-slate-200">{order.paymentMethod || 'A Definir'}</span>
                              </div>

                              <div>
                                {isPaid ? (
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePaymentStatus(order)}
                                    className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer hover:bg-emerald-500/30 transition-all"
                                    title="Clique para alternar status do pagamento"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Pago</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePaymentStatus(order)}
                                    className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer hover:bg-amber-500/30 transition-all animate-pulse"
                                    title="Clique para marcar como Pago"
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Receber (Pendente)</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: Action Buttons */}
                          <div className="p-3 sm:p-4 border-t border-dark-800/80 bg-dark-950/40 rounded-b-3xl flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handlePrintOrder(order)}
                              className="py-2.5 px-3 rounded-2xl bg-dark-800 hover:bg-dark-750 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-dark-700 transition-colors cursor-pointer"
                              title="Imprimir comanda térmica"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Comanda</span>
                            </button>

                            {!isConcluded ? (
                              <button
                                type="button"
                                onClick={() => handleDarBaixa(order)}
                                className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:scale-[1.02] active:scale-98 text-dark-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-glow-emerald transition-all"
                                title="Dar baixa imediata: conclui o pedido e aprova o pagamento"
                              >
                                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                <span>Dar Baixa (Concluir)</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleReabrirPedido(order)}
                                className="flex-1 py-2.5 px-3 rounded-2xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-dark-700 cursor-pointer transition-colors"
                                title="Reabrir pedido se foi concluído por engano"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-brand-gold" />
                                <span>Reabrir Pedido</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

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
                          {menuSubTab === 'flavors' ? `${pizzaFlavors.length} sabores` : menuSubTab === 'categories' ? `${deliveryCategories.length} tópicos` : menuSubTab === 'extra-sauce' ? 'Molho Extra' : `${productsList.length} itens`}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400">
                        {menuSubTab === 'categories' 
                          ? 'Defina a ordem e quais tópicos/categorias aparecem primeiro no cardápio do cliente.'
                          : menuSubTab === 'extra-sauce'
                          ? 'Configure o valor adicional cobrado e o nome do molho artesanal oferecido nas caixas de esfirras, pizzas e combos.'
                          : 'Crie novos itens, edite preços de pizzas e sabores individuais, pause produtos esgotados.'}
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

                        {/* Botão "Limpar fotos de todos os sabores" removido: apagava tudo com um clique */}

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
                    ) : menuSubTab === 'categories' ? (
                      <>
                        <button
                          type="button"
                          onClick={handleResetCategoriesOrder}
                          className="px-3.5 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white text-xs font-semibold border border-dark-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Restaurar a ordem original dos tópicos do cardápio"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-brand-gold" />
                          <span>Restaurar Ordem Padrão</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setMenuSubTab('extra-sauce')}
                          className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Configurar o valor cobrado e nome do Molho Extra"
                        >
                          <span className="text-base">🍯</span>
                          <span>Configurar Molho Extra (R$ {Number(extraSauceConfig.price || 0).toFixed(2).replace('.', ',')})</span>
                        </button>

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
                    onClick={() => setSettingsSubTab('delivery-fees')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      settingsSubTab === 'delivery-fees'
                        ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                        : 'bg-dark-800/80 text-emerald-300 hover:text-white hover:bg-dark-800'
                    }`}
                  >
                    <Bike className="w-3.5 h-3.5 text-emerald-400" />
                    <span>🛵 Taxas de Entrega ({districtsList.length} Bairros)</span>
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

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('extra-sauce')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      settingsSubTab === 'extra-sauce'
                        ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                        : 'bg-dark-800/80 text-amber-300 hover:text-white hover:bg-dark-800'
                    }`}
                  >
                    <span>🍯</span>
                    <span>Molho Extra (R$ {Number(extraSauceConfig.price || 0).toFixed(2).replace('.', ',')})</span>
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

                    <button
                      type="button"
                      onClick={() => setMenuSubTab('categories')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        menuSubTab === 'categories'
                          ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                          : 'bg-dark-800/80 text-amber-300 hover:text-white hover:bg-dark-800'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>🗂️ Ordem dos Tópicos ({deliveryCategories.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMenuSubTab('acai')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        menuSubTab === 'acai'
                          ? 'bg-purple-500 text-white font-black shadow-sm'
                          : 'bg-dark-800/80 text-purple-300 hover:text-white hover:bg-purple-950/40'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Açaí & Acompanhamentos ({(acaiSettings.complements || []).length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMenuSubTab('extra-sauce')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        menuSubTab === 'extra-sauce'
                          ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                          : 'bg-amber-500/15 text-amber-300 hover:text-white hover:bg-amber-500/25 border border-amber-500/30'
                      }`}
                    >
                      <span>🍯</span>
                      <span>Molho Extra ({extraSauceConfig.active !== false ? `Ativo • R$ ${Number(extraSauceConfig.price || 0).toFixed(2).replace('.', ',')}` : 'Desativado'})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveAdminTab('settings');
                        setSettingsSubTab('delivery-fees');
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap bg-dark-800/80 text-emerald-300 hover:text-white hover:bg-emerald-950/40"
                    >
                      <Bike className="w-3.5 h-3.5 text-emerald-400" />
                      <span>🛵 Taxas de Entrega ({districtsList.length})</span>
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
                  {/* Banner de Acesso Rápido ao Molho Extra */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-dark-850 via-dark-800 to-dark-850 border border-amber-500/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-xl flex-shrink-0 border border-amber-400/30">
                        🍯
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-white">Opção de Molho Extra: {extraSauceConfig.name || 'Molho Especial da Casa'}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            extraSauceConfig.active !== false
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-dark-900 text-slate-400 border border-dark-700'
                          }`}>
                            {extraSauceConfig.active !== false ? `Ativo • + R$ ${Number(extraSauceConfig.price || 0).toFixed(2).replace('.', ',')} adicionais` : 'Desativado'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Oferecido aos clientes no final da montagem de Caixas de Esfirras, Pizzas e Combos com acréscimo automático.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMenuSubTab('extra-sauce')}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black text-xs hover:brightness-110 shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-end sm:self-auto"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>Configurar Molho Extra</span>
                    </button>
                  </div>
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

                    {deliveryCategories.map(cat => (
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

              {/* SUBTAB: ORDEM DOS TÓPICOS / CATEGORIAS DO CARDÁPIO */}
              {activeAdminTab === 'menu' && menuSubTab === 'categories' && (
                <div className="mt-5 space-y-5 animate-fade-in">
                  {/* Informational Callout */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-brand-gold/15 to-amber-500/10 border border-brand-gold/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 text-brand-gold flex items-center justify-center border border-brand-gold/30 flex-shrink-0 mt-0.5">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                          <span>Organização dos Tópicos do Cardápio</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold font-bold border border-brand-gold/30">
                            Arrastar & Soltar
                          </span>
                        </h3>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          Arraste os tópicos usando o ícone <strong className="text-brand-gold font-mono">⠿</strong> ou utilize os botões de subir/descer para definir quais categorias aparecem primeiro no cardápio do cliente (ex: você pode mover <strong>Caixas de Esfirras</strong> para o topo). As alterações sincronizam automaticamente com os clientes!
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetCategoriesOrder}
                      className="px-3.5 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto whitespace-nowrap"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-brand-gold" />
                      <span>Restaurar Ordem Padrão</span>
                    </button>
                  </div>

                  {/* Visual Live Preview Bar */}
                  <div className="bg-dark-850/80 rounded-2xl border border-dark-800 p-4">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand-gold" />
                        <span className="text-xs font-bold text-slate-200">
                          Prévia da Ordem no Cardápio do Cliente:
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {deliveryCategories.filter(c => c.visible !== false).length} tópicos visíveis
                      </span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none no-scrollbar">
                      {deliveryCategories
                        .filter(cat => cat.visible !== false)
                        .map((cat, idx) => {
                          const IconComp = CATEGORY_ICONS_MAP[cat.icon] || Package;
                          return (
                            <div
                              key={cat.id}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all ${
                                idx === 0
                                  ? 'bg-brand-gold/20 border-brand-gold text-brand-gold shadow-sm'
                                  : 'bg-dark-800/90 border-dark-700 text-slate-300'
                              }`}
                            >
                              <span className="w-4 h-4 rounded-full bg-dark-900/80 text-[10px] flex items-center justify-center font-mono font-bold text-slate-400">
                                {idx + 1}
                              </span>
                              <IconComp className="w-3.5 h-3.5" />
                              <span>{cat.name}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* List of Reorderable Categories */}
                  <div className="space-y-2.5">
                    {deliveryCategories.map((cat, index) => {
                      const IconComp = CATEGORY_ICONS_MAP[cat.icon] || Package;
                      const itemCount = scopedProductsList.filter(p => p.categoryId === cat.id).length;
                      const isFirst = index === 0;
                      const isLast = index === deliveryCategories.length - 1;
                      const isDragging = draggedCategoryIndex === index;
                      const isHidden = cat.visible === false;

                      return (
                        <div
                          key={cat.id}
                          draggable
                          onDragStart={(e) => handleDragStartCategory(e, index)}
                          onDragOver={(e) => handleDragOverCategory(e, index)}
                          onDrop={(e) => handleDropCategory(e, index)}
                          onDragEnd={handleDragEndCategory}
                          className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all cursor-move select-none ${
                            isDragging
                              ? 'opacity-40 border-dashed border-brand-gold scale-[0.99] bg-dark-800/40'
                              : isHidden
                              ? 'bg-dark-850/50 border-dark-800/60 opacity-60'
                              : isFirst
                              ? 'bg-gradient-to-r from-brand-gold/10 via-dark-850 to-dark-850 border-brand-gold/40 shadow-sm'
                              : 'bg-dark-850 hover:bg-dark-800/90 border-dark-800 hover:border-dark-700'
                          }`}
                        >
                          {/* Left: Drag Handle, Number, Icon & Details */}
                          <div className="flex items-center gap-3">
                            {/* Grip Handle */}
                            <div 
                              className="text-slate-500 hover:text-brand-gold cursor-grab active:cursor-grabbing p-1 transition-colors"
                              title="Clique e arraste para reposicionar"
                            >
                              <GripVertical className="w-5 h-5" />
                            </div>

                            {/* Position Badge */}
                            <div
                              className={`w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center border shadow-xs ${
                                isFirst
                                  ? 'bg-brand-gold text-dark-950 border-brand-gold font-black'
                                  : 'bg-dark-800 text-slate-300 border-dark-700'
                              }`}
                              title={`Posição ${index + 1}`}
                            >
                              {index + 1}º
                            </div>

                            {/* Category Icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                              isFirst
                                ? 'bg-brand-gold/15 text-brand-gold border-brand-gold/30'
                                : 'bg-dark-800 text-slate-300 border-dark-700'
                            }`}>
                              <IconComp className="w-5 h-5" />
                            </div>

                            {/* Name and Tag / Item Count */}
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-display font-extrabold text-sm sm:text-base text-white">
                                  {cat.name}
                                </h4>
                                {isFirst && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gold text-dark-950 font-black flex items-center gap-1 shadow-xs">
                                    ⭐ 1º do Cardápio (Topo)
                                  </span>
                                )}
                                {isHidden && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                                    Oculto no Cardápio
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                                <span>{itemCount} {itemCount === 1 ? 'produto cadastrado' : 'produtos cadastrados'}</span>
                                {cat.tag && (
                                  <>
                                    <span>•</span>
                                    <span className="text-slate-400 italic font-sans">{cat.tag}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Action Buttons */}
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            {/* Move to Top */}
                            {!isFirst && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveCategoryToTop(index);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-gold border border-brand-gold/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                                title="Mover diretamente para o 1º lugar (topo)"
                              >
                                <ChevronsUp className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Topo</span>
                              </button>
                            )}

                            {/* Move Up */}
                            <button
                              type="button"
                              disabled={isFirst}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveCategory(index, 'up');
                              }}
                              className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                                isFirst
                                  ? 'opacity-30 border-dark-800 text-slate-600 cursor-not-allowed'
                                  : 'bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border-dark-700 active:scale-95'
                              }`}
                              title="Subir uma posição"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>

                            {/* Move Down */}
                            <button
                              type="button"
                              disabled={isLast}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveCategory(index, 'down');
                              }}
                              className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                                isLast
                                  ? 'opacity-30 border-dark-800 text-slate-600 cursor-not-allowed'
                                  : 'bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border-dark-700 active:scale-95'
                              }`}
                              title="Descer uma posição"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>

                            {/* Toggle Visibility */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCategoryVisibility(cat.id);
                              }}
                              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                isHidden
                                  ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30'
                                  : 'bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border-dark-700'
                              }`}
                              title={isHidden ? 'Exibir no cardápio do cliente' : 'Ocultar temporariamente do cardápio'}
                            >
                              {isHidden ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                                  <span className="hidden sm:inline">Oculto</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="hidden sm:inline">Visível</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                          <span>Valores por Tamanho & Regra do Maior Valor</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold font-bold border border-brand-gold/30">
                            Broto • P • M • Família • Gigante
                          </span>
                        </h3>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          Agora você pode definir o valor de cada sabor individualmente para cada tamanho (Brotinho, Pequena, Média, Família e Gigante). Ao montar uma pizza, o sistema puxa automaticamente para o <strong>MAIOR valor</strong> entre os sabores selecionados naquele tamanho. Sabores no valor base ou inferior não geram nenhum acréscimo!
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
                      const brotinhoPrice = getPizzaFlavorPrice(flavor, 'brotinho');
                      const pPrice = getPizzaFlavorPrice(flavor, 'p');
                      const mPrice = getPizzaFlavorPrice(flavor, 'm');
                      const famPrice = getPizzaFlavorPrice(flavor, 'familia');
                      const gigPrice = getPizzaFlavorPrice(flavor, 'gigante');

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
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-11 h-11 rounded-xl bg-dark-950 border border-dark-750 flex items-center justify-center p-1 flex-shrink-0">
                                  {flavor.image ? (
                                    <img 
                                      src={flavor.image} 
                                      alt={flavor.name} 
                                      className="w-full h-full object-contain drop-shadow" 
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                  ) : (
                                    <Pizza className="w-5 h-5 text-slate-600" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-sm font-extrabold text-white leading-snug truncate">
                                    {flavor.name}
                                  </h4>
                                  <span className="text-[10px] text-slate-500 font-mono block">
                                    {flavor.image ? '📷 Foto Ativa' : 'Sem foto'}
                                  </span>
                                </div>
                              </div>
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

                            {/* Valores por Tamanho do Sabor */}
                            <div className="my-2 p-2 rounded-xl bg-dark-900/90 border border-dark-750">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                <span>Valores por Tamanho:</span>
                                {flavor.category === 'especiais' && <span className="text-amber-400 font-bold">Gourmet ⭐</span>}
                              </div>
                              <div className="grid grid-cols-5 gap-1 text-center font-mono">
                                <div className="p-1 rounded-lg bg-dark-950 border border-dark-800">
                                  <div className="text-[9px] text-slate-400 font-sans font-semibold">Broto (4f)</div>
                                  <div className={`text-xs font-black ${brotinhoPrice > 15 ? 'text-amber-300' : 'text-slate-200'}`}>
                                    R$ {brotinhoPrice.toFixed(0)}
                                  </div>
                                </div>
                                <div className="p-1 rounded-lg bg-dark-950 border border-dark-800">
                                  <div className="text-[9px] text-slate-400 font-sans font-semibold">P (4f)</div>
                                  <div className={`text-xs font-black ${pPrice > 20 ? 'text-amber-300' : 'text-slate-200'}`}>
                                    R$ {pPrice.toFixed(0)}
                                  </div>
                                </div>
                                <div className="p-1 rounded-lg bg-dark-950 border border-dark-800">
                                  <div className="text-[9px] text-slate-400 font-sans font-semibold">M (6f)</div>
                                  <div className={`text-xs font-black ${mPrice > 30 ? 'text-amber-300' : 'text-slate-200'}`}>
                                    R$ {mPrice.toFixed(0)}
                                  </div>
                                </div>
                                <div className="p-1 rounded-lg bg-dark-950 border border-dark-800">
                                  <div className="text-[9px] text-slate-400 font-sans font-semibold">FM (8f)</div>
                                  <div className={`text-xs font-black ${famPrice > 40 ? 'text-amber-300' : 'text-slate-200'}`}>
                                    R$ {famPrice.toFixed(0)}
                                  </div>
                                </div>
                                <div className="p-1 rounded-lg bg-dark-950 border border-dark-800">
                                  <div className="text-[9px] text-slate-400 font-sans font-semibold">GG (12f)</div>
                                  <div className={`text-xs font-black ${gigPrice > 50 ? 'text-amber-300' : 'text-slate-200'}`}>
                                    R$ {gigPrice.toFixed(0)}
                                  </div>
                                </div>
                              </div>
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
                              {flavor.image && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFlavorPhoto(flavor.id)}
                                  className="p-2 rounded-xl bg-dark-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Remover foto deste sabor"
                                >
                                  <ImageOff className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenEditFlavor(flavor)}
                                className="p-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-brand-gold transition-colors cursor-pointer"
                                title="Editar nome, foto ou preço"
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

              {/* SUBTAB 3: AÇAÍ, ACOMPANHAMENTOS & COBERTURAS */}
              {activeAdminTab === 'menu' && menuSubTab === 'acai' && (
                <div className="mt-5 space-y-6 max-w-5xl">
                  
                  {/* Top Banner & Header */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-dark-850 to-dark-850 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                          Açaí & Acompanhamentos
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {(acaiSettings.complements || []).length} Adicionais
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Configure os acompanhamentos adicionais para copos e barcas, pause itens esgotados e defina limites máximos por pedido.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenCreateComplement}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-xs hover:brightness-110 shadow-lg shadow-purple-500/20 flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Novo Acompanhamento</span>
                    </button>
                  </div>

                  {/* Card 1: REGRAS DE LIMITE DE ACOMPANHAMENTOS */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-dark-850 border border-dark-750 space-y-4">
                    <div className="border-b border-dark-800 pb-3 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-purple-400" />
                          Regras de Limite de Acompanhamentos por Pedido
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Evite desperdícios ou excessos limitando quantos acompanhamentos o cliente pode escolher por item.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSaveAcaiLimits} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Limite no Açaí Individual */}
                        <div className="p-4 rounded-xl bg-dark-900 border border-dark-750">
                          <label className="block text-xs font-bold text-slate-200 mb-1">
                            Limite Máximo no Açaí Individual (Copos / Barcas)
                          </label>
                          <p className="text-[11px] text-slate-400 mb-2">
                            Ex: <strong>5</strong> para permitir até 5 itens. Digite <strong>0</strong> para deixar <em>ilimitado</em>.
                          </p>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="50"
                              value={tempMaxAcai}
                              onChange={(e) => setTempMaxAcai(e.target.value)}
                              className="w-28 px-3.5 py-2 rounded-xl bg-dark-800 border border-dark-700 text-sm text-white font-bold font-mono focus:outline-none focus:border-purple-400"
                            />
                            <span className="text-xs text-slate-400 font-medium">
                              {parseInt(tempMaxAcai, 10) > 0 ? `Máx. ${tempMaxAcai} acompanhamentos` : 'Ilimitado (Sem limite)'}
                            </span>
                          </div>
                        </div>

                        {/* Limite no Combo Barca de Açaí */}
                        <div className="p-4 rounded-xl bg-dark-900 border border-dark-750">
                          <label className="block text-xs font-bold text-slate-200 mb-1">
                            Limite Máximo na Barca dos Combos (Pizza + Açaí)
                          </label>
                          <p className="text-[11px] text-slate-400 mb-2">
                            Ex: <strong>5</strong> para a barca inclusa no combo. Digite <strong>0</strong> para <em>ilimitado</em>.
                          </p>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="50"
                              value={tempMaxComboBarca}
                              onChange={(e) => setTempMaxComboBarca(e.target.value)}
                              className="w-28 px-3.5 py-2 rounded-xl bg-dark-800 border border-dark-700 text-sm text-white font-bold font-mono focus:outline-none focus:border-purple-400"
                            />
                            <span className="text-xs text-slate-400 font-medium">
                              {parseInt(tempMaxComboBarca, 10) > 0 ? `Máx. ${tempMaxComboBarca} acompanhamentos` : 'Ilimitado (Sem limite)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-xs hover:brightness-110 shadow-md shadow-purple-500/20 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>Salvar Regras de Limite</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Card 2: ACOMPANHAMENTOS CADASTRADOS */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-dark-850 border border-dark-750 space-y-4">
                    <div className="border-b border-dark-800 pb-3 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-purple-400" />
                          Acompanhamentos Cadastrados ({(acaiSettings.complements || []).length})
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Clique em Disponível/Esgotado para pausar um acompanhamento que acabou na cozinha.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenCreateComplement}
                        className="px-3.5 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Item</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(acaiSettings.complements || []).map(comp => {
                        const isAvail = comp.isAvailable !== false;
                        const isDef = Boolean(comp.defaultSelected);
                        return (
                          <div
                            key={comp.id}
                            className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                              !isAvail 
                                ? 'bg-dark-950/60 border-dark-800 opacity-60' 
                                : 'bg-dark-900 border-dark-750 hover:border-purple-500/40 shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-2xl p-1 rounded-xl bg-dark-950 border border-dark-800 flex-shrink-0">
                                  {comp.icon || '✨'}
                                </span>
                                <div className="min-w-0">
                                  <h5 className="text-xs sm:text-sm font-bold text-white truncate">
                                    {comp.name}
                                  </h5>
                                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                    {Number(comp.price) > 0 ? (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                                        + R$ {Number(comp.price).toFixed(2).replace('.', ',')}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                                        Grátis (Incluso)
                                      </span>
                                    )}
                                    {isDef && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                        Padrão ⭐
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-dark-800 flex items-center justify-between gap-2">
                              {/* Toggle Availability */}
                              <button
                                type="button"
                                onClick={() => handleToggleComplementAvailability(comp.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                  isAvail
                                    ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                                }`}
                                title={isAvail ? 'Clique para pausar este item (esgotado)' : 'Clique para ativar este item (disponível)'}
                              >
                                {isAvail ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                <span>{isAvail ? 'Disponível' : 'Esgotado'}</span>
                              </button>

                              <div className="flex items-center gap-1">
                                {/* Toggle Default */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleComplementDefault(comp.id)}
                                  className={`p-1.5 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer ${
                                    isDef
                                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                      : 'bg-dark-800 text-slate-400 border-dark-700 hover:text-white'
                                  }`}
                                  title={isDef ? 'Remover dos itens marcados por padrão' : 'Marcar este item por padrão na abertura do açaí'}
                                >
                                  <Star className={`w-3.5 h-3.5 ${isDef ? 'fill-purple-400 text-purple-400' : ''}`} />
                                </button>

                                {/* Edit */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditComplement(comp)}
                                  className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-purple-300 transition-colors cursor-pointer"
                                  title="Editar nome, preço ou ícone"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComplement(comp.id)}
                                  className="p-1.5 rounded-lg bg-dark-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                                  title="Remover acompanhamento"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card 3: COBERTURAS DO AÇAÍ */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-dark-850 border border-dark-750 space-y-4">
                    <div className="border-b border-dark-800 pb-3 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          Coberturas para Copos e Barca de Açaí ({(acaiSettings.coberturas || []).length})
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Configure opções de cobertura, adicione preços diferentes e pause opções esgotadas na cozinha.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenCreateCobertura}
                        className="px-3.5 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nova Cobertura</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(acaiSettings.coberturas || []).map(rawCob => {
                        const cob = typeof rawCob === 'string' ? { id: rawCob, name: rawCob, price: 0, isAvailable: true } : rawCob;
                        const isAvail = cob.isAvailable !== false;
                        const isSemCob = cob.name === 'Sem Cobertura' || cob.id === 'sem-cobertura';
                        const price = Number(cob.price) || 0;

                        return (
                          <div
                            key={cob.id || cob.name}
                            className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                              !isAvail 
                                ? 'bg-dark-950/60 border-dark-800 opacity-60' 
                                : 'bg-dark-900 border-dark-750 hover:border-purple-500/40 shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-2xl p-1 rounded-xl bg-dark-950 border border-dark-800 flex-shrink-0">
                                  🍯
                                </span>
                                <div className="min-w-0">
                                  <h5 className="text-xs sm:text-sm font-bold text-white truncate">
                                    {cob.name}
                                  </h5>
                                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                    {price > 0 ? (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                                        + R$ {price.toFixed(2).replace('.', ',')}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                                        Grátis (Incluso)
                                      </span>
                                    )}
                                    {isSemCob && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-dark-800 text-slate-400 border border-dark-700">
                                        Padrão
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-dark-800 flex items-center justify-between gap-2">
                              {/* Toggle Availability */}
                              <button
                                type="button"
                                onClick={() => handleToggleCoberturaAvailability(cob.id || cob.name)}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                  isAvail
                                    ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                                }`}
                                title={isAvail ? 'Clique para pausar esta cobertura (esgotado)' : 'Clique para ativar esta cobertura (disponível)'}
                              >
                                {isAvail ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                <span>{isAvail ? 'Disponível' : 'Esgotado'}</span>
                              </button>

                              <div className="flex items-center gap-1">
                                {/* Edit */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCobertura(cob)}
                                  className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-purple-300 transition-colors cursor-pointer"
                                  title="Editar nome ou preço"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete */}
                                {!isSemCob && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCobertura(cob.id || cob.name)}
                                    className="p-1.5 rounded-lg bg-dark-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                                    title="Remover cobertura"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Add Form */}
                    <form onSubmit={handleAddCobertura} className="p-4 rounded-xl bg-dark-900 border border-dark-800 space-y-2 mt-4">
                      <span className="text-xs font-bold text-slate-300 block">Adição Rápida de Cobertura:</span>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          value={newCoberturaText}
                          onChange={(e) => setNewCoberturaText(e.target.value)}
                          placeholder="Ex: Cobertura de Maracujá..."
                          className="flex-1 w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                        />
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="relative w-full sm:w-32">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">R$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.50"
                              value={newCoberturaPrice}
                              onChange={(e) => setNewCoberturaPrice(e.target.value)}
                              placeholder="0,00"
                              className="w-full pl-8 pr-2.5 py-2.5 rounded-xl bg-dark-950 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-mono"
                              title="Preço adicional (0 = grátis)"
                            />
                          </div>
                          <button
                            type="submit"
                            className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Adicionar</span>
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

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
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { id: 'percentage', label: 'Porcentagem Geral (%)', desc: 'Aplica um % fixo no valor dos itens (ex: 3.5%)' },
                          { id: 'split', label: 'Débito e Crédito em %', desc: 'Taxas em % separadas para Débito e Crédito' },
                          { id: 'split_fixed', label: 'Débito e Crédito em R$', desc: 'Valores em R$ separados para Débito e Crédito' },
                          { id: 'fixed', label: 'Valor Fixo Geral em R$', desc: 'Adiciona um valor fixo único (ex: R$ 2,00 por pedido)' }
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
                                placeholder="0"
                                className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-white font-mono text-base font-bold focus:outline-none focus:border-brand-gold"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 block">Digite 0 para isento (sem taxa) ou ex: 1.5%</span>
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
                                placeholder="3.5"
                                className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-white font-mono text-base font-bold focus:outline-none focus:border-brand-gold"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 block">Exemplo: 3.5% ou 4.5%</span>
                          </div>
                        </div>
                      )}

                      {tempCardType === 'split_fixed' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              Taxa do Cartão de Débito (R$):
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                              <input
                                type="text"
                                value={tempCardDebitFixed}
                                onChange={(e) => setTempCardDebitFixed(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-white font-mono text-base font-bold focus:outline-none focus:border-brand-gold"
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 block">Digite 0.00 para Débito sem taxa (grátis)</span>
                          </div>

                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              Taxa do Cartão de Crédito (R$):
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                              <input
                                type="text"
                                value={tempCardCreditFixed}
                                onChange={(e) => setTempCardCreditFixed(e.target.value)}
                                placeholder="3.00"
                                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-white font-mono text-base font-bold focus:outline-none focus:border-brand-gold"
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 block">Exemplo: R$ 3,00 fixos no crédito</span>
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
                          percentageRate: parseFloat(tempCardPercentage) || 0,
                          fixedRate: parseFloat(tempCardFixed) || 0,
                          debitRate: parseFloat(tempCardDebit) || 0,
                          creditRate: parseFloat(tempCardCredit) || 0,
                          debitFixed: parseFloat(tempCardDebitFixed) || 0,
                          creditFixed: parseFloat(tempCardCreditFixed) || 0
                        })}`}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold leading-relaxed"
                      />
                      <span className="text-[11px] text-slate-500 block">
                        Deixe em branco para usar o texto automático gerado a partir do valor que você configurou.
                      </span>
                    </div>

                    {/* Simulador em Tempo Real */}
                    {(() => {
                      const simSettings = {
                        active: tempCardActive,
                        type: tempCardType,
                        percentageRate: parseFloat(tempCardPercentage) || 0,
                        fixedRate: parseFloat(tempCardFixed) || 0,
                        debitRate: parseFloat(tempCardDebit) || 0,
                        creditRate: parseFloat(tempCardCredit) || 0,
                        debitFixed: parseFloat(tempCardDebitFixed) || 0,
                        creditFixed: parseFloat(tempCardCreditFixed) || 0
                      };

                      const isSplitType = tempCardType === 'split' || tempCardType === 'split_fixed';
                      const debFee = calculateCardMachineFee(50, simSettings, 'debito');
                      const credFee = calculateCardMachineFee(50, simSettings, 'credito');

                      return (
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-3">
                          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            Simulação em Tempo Real (Exemplo com Pedido de R$ 50,00 no Cartão):
                          </span>

                          {isSplitType ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              {/* Simulação Débito */}
                              <div className={`p-3.5 rounded-xl border ${debFee === 0 ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-dark-950/70 border-dark-800'} space-y-2`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-white flex items-center gap-1.5 text-xs">
                                    💳 Pagamento no DÉBITO
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${debFee === 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'}`}>
                                    {debFee === 0 ? 'Taxa Grátis (R$ 0,00)' : `+ R$ ${debFee.toFixed(2).replace('.', ',')}`}
                                  </span>
                                </div>
                                <div className="space-y-1.5 text-[11px]">
                                  <div className="flex justify-between text-slate-400">
                                    <span>Subtotal do Pedido:</span>
                                    <span className="text-white font-semibold">R$ 50,00</span>
                                  </div>
                                  <div className="flex justify-between text-slate-400">
                                    <span>Taxa da Maquininha:</span>
                                    <span className={`font-bold ${debFee === 0 ? 'text-emerald-400' : 'text-brand-gold'}`}>
                                      {debFee === 0 ? 'R$ 0,00 (Sem taxa)' : `+ R$ ${debFee.toFixed(2).replace('.', ',')}`}
                                    </span>
                                  </div>
                                  <div className="pt-2 border-t border-dark-800 flex justify-between items-center font-extrabold">
                                    <span className="text-white">Total no Débito:</span>
                                    <span className="text-emerald-400 text-sm">
                                      R$ {(50 + (tempCardAutoAdd ? debFee : 0)).toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Simulação Crédito */}
                              <div className={`p-3.5 rounded-xl border ${credFee === 0 ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-dark-950/70 border-dark-800'} space-y-2`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-white flex items-center gap-1.5 text-xs">
                                    💳 Pagamento no CRÉDITO
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${credFee === 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'}`}>
                                    {credFee === 0 ? 'Taxa Grátis (R$ 0,00)' : `+ R$ ${credFee.toFixed(2).replace('.', ',')}`}
                                  </span>
                                </div>
                                <div className="space-y-1.5 text-[11px]">
                                  <div className="flex justify-between text-slate-400">
                                    <span>Subtotal do Pedido:</span>
                                    <span className="text-white font-semibold">R$ 50,00</span>
                                  </div>
                                  <div className="flex justify-between text-slate-400">
                                    <span>Taxa da Maquininha:</span>
                                    <span className={`font-bold ${credFee === 0 ? 'text-emerald-400' : 'text-brand-gold'}`}>
                                      {credFee === 0 ? 'R$ 0,00 (Sem taxa)' : `+ R$ ${credFee.toFixed(2).replace('.', ',')}`}
                                    </span>
                                  </div>
                                  <div className="pt-2 border-t border-dark-800 flex justify-between items-center font-extrabold">
                                    <span className="text-white">Total no Crédito:</span>
                                    <span className="text-emerald-400 text-sm">
                                      R$ {(50 + (tempCardAutoAdd ? credFee : 0)).toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div className="bg-dark-950/70 p-2.5 rounded-lg border border-dark-800">
                                <span className="text-slate-400 block text-[10px]">Subtotal do Pedido:</span>
                                <span className="font-bold text-white">R$ 50,00</span>
                              </div>
                              <div className="bg-dark-950/70 p-2.5 rounded-lg border border-dark-800">
                                <span className="text-slate-400 block text-[10px]">Taxa Calculada:</span>
                                <span className={`font-bold ${credFee === 0 ? 'text-emerald-400' : 'text-brand-gold'}`}>
                                  {credFee === 0 ? 'R$ 0,00 (Sem taxa)' : `+ R$ ${credFee.toFixed(2).replace('.', ',')}`}
                                </span>
                              </div>
                              <div className="bg-dark-950/70 p-2.5 rounded-lg border border-dark-800 sm:col-span-2">
                                <span className="text-slate-400 block text-[10px]">Total a Pagar ({tempCardAutoAdd ? 'Com Taxa Somada' : 'Sem Taxa Somada'}):</span>
                                <span className="font-extrabold text-emerald-400 text-sm">
                                  R$ {(50 + (tempCardAutoAdd ? credFee : 0)).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="pt-2 text-[11px] text-amber-200/90 leading-relaxed border-t border-amber-500/20 space-y-1">
                            {isSplitType ? (
                              <>
                                <div>
                                  <strong className="text-white">Aviso exibido para Débito:</strong> {getCardMachineNoticeText(simSettings, 'debito')}
                                </div>
                                <div>
                                  <strong className="text-white">Aviso exibido para Crédito:</strong> {getCardMachineNoticeText(simSettings, 'credito')}
                                </div>
                              </>
                            ) : (
                              <div>
                                <strong className="text-white">Como o cliente verá na sacola:</strong> {getCardMachineNoticeText(simSettings)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

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

              {/* SUBTAB: MOLHO EXTRA ADICIONAL */}
              {(activeAdminTab === 'settings' ? settingsSubTab === 'extra-sauce' : menuSubTab === 'extra-sauce') && (
                <div className="mt-5 space-y-6">
                  <form onSubmit={handleSaveExtraSauceConfig} className="p-5 rounded-2xl bg-dark-800/60 border border-dark-700 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-dark-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30 text-xl flex-shrink-0">
                          🍯
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Opção de Molho Extra Adicional</h3>
                          <p className="text-xs text-slate-400">
                            Configure o valor adicional e o nome do molho oferecido na escolha de Caixas de Esfirras, Pizzas e Combos.
                          </p>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer bg-dark-900/80 px-3.5 py-2 rounded-xl border border-dark-750">
                        <input
                          type="checkbox"
                          checked={tempSauceActive}
                          onChange={(e) => setTempSauceActive(e.target.checked)}
                          className="w-4 h-4 accent-amber-400 cursor-pointer"
                        />
                        <span className={`text-xs font-bold ${tempSauceActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {tempSauceActive ? 'Ativo no Cardápio' : 'Desativado'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Nome do Molho / Apresentação:
                        </label>
                        <input
                          type="text"
                          value={tempSauceName}
                          onChange={(e) => setTempSauceName(e.target.value)}
                          placeholder="Ex: Molho Especial da Casa"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Nome que aparece para o cliente na hora de escolher.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Valor Adicional Cobrado (R$):
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.50"
                            min="0"
                            value={tempSaucePrice}
                            onChange={(e) => setTempSaucePrice(e.target.value)}
                            placeholder="3.00"
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-xs font-mono font-bold text-brand-gold focus:outline-none focus:border-brand-gold"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Valor somado automaticamente ao total do produto quando o cliente selecionar.
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Descrição / Detalhes do Molho (Opcional):
                      </label>
                      <input
                        type="text"
                        value={tempSauceDescription}
                        onChange={(e) => setTempSauceDescription(e.target.value)}
                        placeholder="Ex: Potinho de molho artesanal extra para acompanhar suas esfirras, pizzas e combos."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    {/* Preview interativo de como o cliente vê */}
                    <div className="pt-2">
                      <span className="text-[11px] text-slate-400 font-bold block mb-2">
                        👁️ Prévia da opção na escolha do cliente (Pizzas, Caixas e Combos):
                      </span>
                      <div className="p-3.5 rounded-2xl bg-dark-900 border border-amber-500/30 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-lg flex-shrink-0">
                            🍯
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>Quer {tempSauceName || 'Molho Especial da Casa'}?</span>
                              <span className="text-[10px] font-black text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/40">
                                + R$ {Number(parseFloat(tempSaucePrice.toString().replace(',', '.')) || 0).toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {tempSauceDescription || 'Potinho de molho artesanal extra para acompanhar o seu pedido.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-xl bg-brand-gold text-dark-950 font-black text-[11px] shadow-sm pointer-events-none"
                          >
                            ✓ Sim, Adicionar
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-300 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Como funciona:</strong> Ao marcar o molho extra, o valor será adicionado no item, enviado no WhatsApp do cliente e impresso na comanda da cozinha/balcão para que a equipe envie o potinho extra.
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black text-xs hover:brightness-110 shadow-glow-gold cursor-pointer"
                      >
                        Salvar Configuração de Molho Extra
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* SUBTAB 3: DADOS DO RESTAURANTE & WHATSAPP */}
              {(activeAdminTab === 'settings' ? settingsSubTab === 'store' : menuSubTab === 'store') && (
                <>
                  <form onSubmit={handleSaveStoreSettings} className="mt-5 p-5 rounded-2xl bg-dark-800/60 border border-dark-700 space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-dark-700">
                    <Store className="w-5 h-5 text-brand-gold" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Status, Horários & Dados da Loja</h3>
                      <p className="text-xs text-slate-400">Controle se a loja está aberta ou fechada, horários de funcionamento e dados de pagamento.</p>
                    </div>
                  </div>

                  {/* SEÇÃO 1: STATUS DE ATENDIMENTO (ABERTO OU FECHADO) & HORÁRIOS */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-dark-900/90 border border-dark-700/80 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-dark-800">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          tempStoreIsOpen ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white flex items-center gap-2">
                            <span>Status de Atendimento da Loja</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              tempStoreIsOpen 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {tempStoreIsOpen ? '🟢 Aberto para Pedidos' : '🔴 Fechado no Momento'}
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Quando fechado, o site exibe o aviso de fechamento e não deixa os clientes finalizarem pedidos.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setTempStoreIsOpen(!tempStoreIsOpen)}
                        className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer shadow-sm flex items-center gap-1.5 ${
                          tempStoreIsOpen
                            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 animate-pulse'
                        }`}
                      >
                        <span>{tempStoreIsOpen ? '🔴 Alterar para FECHADO' : '🟢 Alterar para ABERTO'}</span>
                      </button>
                    </div>

                    {/* Dual Selection Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setTempStoreIsOpen(true)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          tempStoreIsOpen
                            ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                            : 'bg-dark-950/60 border-dark-750 hover:border-dark-700 opacity-60'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          tempStoreIsOpen ? 'bg-emerald-500 text-dark-950' : 'border border-slate-600'
                        }`}>
                          {tempStoreIsOpen && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-white flex items-center gap-1.5">
                            <span>🟢 Estabelecimento Aberto</span>
                          </h5>
                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                            O cardápio está liberado. Clientes podem montar pizzas, esfirras, combos e enviar pedidos via WhatsApp normalmente.
                          </p>
                        </div>
                      </div>

                      <div
                        onClick={() => setTempStoreIsOpen(false)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          !tempStoreIsOpen
                            ? 'bg-red-950/40 border-red-500/50 shadow-md ring-1 ring-red-500/30'
                            : 'bg-dark-950/60 border-dark-750 hover:border-dark-700 opacity-60'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          !tempStoreIsOpen ? 'bg-red-500 text-white' : 'border border-slate-600'
                        }`}>
                          {!tempStoreIsOpen && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-white flex items-center gap-1.5">
                            <span>🔴 Estabelecimento Fechado</span>
                          </h5>
                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                            Pausa os pedidos. O site exibirá aviso de loja fechada, mostrará os horários de funcionamento e impedirá os clientes de pedir.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* HORÁRIOS DE FUNCIONAMENTO */}
                    <div className="pt-3 border-t border-dark-800 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-300">
                            Horário de Funcionamento (Visível no site para os clientes):
                          </label>
                          <span className="text-[10px] text-brand-gold font-bold">
                            💡 Modelos rápidos:
                          </span>
                        </div>
                        <input
                          type="text"
                          value={tempStoreOpeningHours}
                          onChange={(e) => setTempStoreOpeningHours(e.target.value)}
                          placeholder="Ex: Terça a Domingo: 18:00 às 23:30 (Segunda fechado)"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-700 text-xs text-white placeholder-slate-500 focus:border-brand-gold focus:outline-none"
                        />
                      </div>

                      {/* Quick Schedule Templates */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold mr-1">Modelos Rápidos:</span>
                        {[
                          'Terça a Domingo: 18:00 às 23:30',
                          'Terça a Domingo: 18:00 às 23:30 (Segunda fechado)',
                          'Todos os dias: 18:00 às 23:30',
                          'Segunda a Sábado: 18:00 às 23:30',
                          'Terça a Sexta: 09:00 às 11:30 e 18:00 às 23:30 | Sáb e Dom: 18:00 às 23:30'
                        ].map((tpl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setTempStoreOpeningHours(tpl)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-dark-950 hover:bg-dark-850 text-slate-300 hover:text-white border border-dark-750 hover:border-brand-gold/40 transition-colors cursor-pointer"
                          >
                            {tpl.length > 35 ? tpl.slice(0, 32) + '...' : tpl}
                          </button>
                        ))}
                      </div>

                      {/* Configurações extras quando estiver fechado */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Mensagem para os Clientes quando a Loja estiver Fechada:
                          </label>
                          <textarea
                            rows={2}
                            value={tempStoreClosedMessage}
                            onChange={(e) => setTempStoreClosedMessage(e.target.value)}
                            placeholder="Ex: Estamos fechados no momento. Não estamos aceitando novos pedidos pelo site agora."
                            className="w-full px-3.5 py-2 rounded-xl bg-dark-950 border border-dark-700 text-xs text-white placeholder-slate-500 focus:border-brand-gold focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Previsão de Reabertura (Opcional):
                          </label>
                          <input
                            type="text"
                            value={tempStoreReopenTime}
                            onChange={(e) => setTempStoreReopenTime(e.target.value)}
                            placeholder="Ex: Hoje às 18:00"
                            className="w-full px-3.5 py-2 rounded-xl bg-dark-950 border border-dark-700 text-xs text-white placeholder-slate-500 focus:border-brand-gold focus:outline-none"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">
                            Aparece no aviso quando o cliente tentar pedir.
                          </p>
                        </div>
                      </div>

                      {/* Live Preview Card */}
                      <div className="p-3.5 rounded-xl bg-dark-950 border border-dark-800 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          👀 Pré-visualização do Aviso no Site {!tempStoreIsOpen ? '(Ativo Agora)' : '(Quando Fechar)'}:
                        </span>
                        <div className="p-3 rounded-xl bg-gradient-to-r from-red-950/80 via-red-900/60 to-amber-950/80 border border-red-500/30 text-xs text-red-200 flex items-start gap-2.5">
                          <span className="text-lg">⛔</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-red-300">
                              Estabelecimento Fechado • Pedidos Online Pausados
                            </p>
                            <p className="text-[11px] text-red-200/90 mt-0.5">
                              {tempStoreClosedMessage || 'No momento não estamos aceitando pedidos pelo site.'}
                            </p>
                            <p className="text-[11px] text-brand-gold font-bold mt-1">
                              🕒 Horário: {tempStoreOpeningHours || 'Terça a Domingo: 18:00 às 23:30'}
                              {tempStoreReopenTime ? ` • Reabre: ${tempStoreReopenTime}` : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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
                        placeholder="Ex: Av. Canaã, 4065 - Setor 04 (esquina, ao lado da Rumotos), Ariquemes - RO"
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

            {/* SUBTAB 4: TAXAS DE ENTREGA POR BAIRRO */}
            {(activeAdminTab === 'settings' ? settingsSubTab === 'delivery-fees' : menuSubTab === 'delivery-fees') && (
              <div className="mt-5 space-y-6">
                {/* Top Header Card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-dark-850 border border-dark-750 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <Bike className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base sm:text-lg text-white">
                          Taxas de Entrega por Bairro (Ariquemes & Região)
                        </h3>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-wider">
                          100% Real & Integrado
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Altere o valor de qualquer bairro, adicione novos locais ou pause temporariamente. Os valores são aplicados instantaneamente na sacola e no resumo do WhatsApp.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetDefaultDistricts}
                    className="px-3.5 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start md:self-auto shrink-0"
                    title="Restaura os 48 bairros originais de Ariquemes"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-brand-gold" />
                    <span>Restaurar 48 Bairros Padrão</span>
                  </button>
                </div>

                {/* Summary Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-dark-900 border border-dark-800">
                    <span className="text-[11px] text-slate-400 block font-medium">Total de Bairros</span>
                    <span className="text-xl font-black text-white mt-1 block">
                      {districtsList.length}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-dark-900 border border-dark-800">
                    <span className="text-[11px] text-emerald-400 block font-medium">Bairros Ativos</span>
                    <span className="text-xl font-black text-emerald-400 mt-1 block">
                      {districtsList.filter(d => d.isAvailable !== false).length}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-dark-900 border border-dark-800">
                    <span className="text-[11px] text-rose-400 block font-medium">Pausados / Esgotados</span>
                    <span className="text-xl font-black text-rose-400 mt-1 block">
                      {districtsList.filter(d => d.isAvailable === false).length}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-dark-900 border border-dark-800">
                    <span className="text-[11px] text-brand-gold block font-medium">Faixa de Preço</span>
                    <span className="text-sm font-black text-brand-gold mt-1.5 block truncate">
                      {districtsList.length > 0 
                        ? `R$ ${Math.min(...districtsList.map(d => Number(d.price) || 0)).toFixed(2).replace('.', ',')} a R$ ${Math.max(...districtsList.map(d => Number(d.price) || 0)).toFixed(2).replace('.', ',')}`
                        : 'R$ 0,00'}
                    </span>
                  </div>
                </div>

                {/* Add New District Box */}
                <form onSubmit={handleAddNewDistrict} className="p-4 sm:p-5 rounded-2xl bg-dark-900/90 border border-brand-gold/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-brand-gold" />
                    <h4 className="text-sm font-bold text-white">Adicionar Novo Bairro ou Localidade</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-400 block mb-1">Nome do Bairro / Setor / Chácara:</label>
                      <input
                        type="text"
                        value={newDistrictName}
                        onChange={(e) => setNewDistrictName(e.target.value)}
                        placeholder="Ex: Residencial Alphaville, Km 5, Setor 12..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Taxa de Entrega (R$):</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">R$</span>
                        <input
                          type="text"
                          value={newDistrictPrice}
                          onChange={(e) => setNewDistrictPrice(e.target.value)}
                          placeholder="12,00"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs font-bold focus:outline-none focus:border-brand-gold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black text-xs hover:brightness-110 shadow-glow-gold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Cadastrar Bairro</span>
                    </button>
                  </div>
                </form>

                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={districtSearch}
                      onChange={(e) => setDistrictSearch(e.target.value)}
                      placeholder="Buscar bairro por nome... (Ex: Setor 01, Apoio...)"
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-brand-gold"
                    />
                    {districtSearch && (
                      <button
                        type="button"
                        onClick={() => setDistrictSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                    <button
                      type="button"
                      onClick={() => setDistrictPriceFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        districtPriceFilter === 'all'
                          ? 'bg-brand-gold text-dark-950 font-black'
                          : 'bg-dark-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Todos ({districtsList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDistrictPriceFilter('8')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        districtPriceFilter === '8'
                          ? 'bg-brand-gold text-dark-950 font-black'
                          : 'bg-dark-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      R$ 8,00
                    </button>
                    <button
                      type="button"
                      onClick={() => setDistrictPriceFilter('10')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        districtPriceFilter === '10'
                          ? 'bg-brand-gold text-dark-950 font-black'
                          : 'bg-dark-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      R$ 10,00
                    </button>
                    <button
                      type="button"
                      onClick={() => setDistrictPriceFilter('15')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        districtPriceFilter === '15'
                          ? 'bg-brand-gold text-dark-950 font-black'
                          : 'bg-dark-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      R$ 15,00
                    </button>
                    <button
                      type="button"
                      onClick={() => setDistrictPriceFilter('20+')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        districtPriceFilter === '20+'
                          ? 'bg-brand-gold text-dark-950 font-black'
                          : 'bg-dark-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      R$ 20+
                    </button>
                    <button
                      type="button"
                      onClick={() => setDistrictPriceFilter('unavailable')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        districtPriceFilter === 'unavailable'
                          ? 'bg-rose-500 text-white font-black'
                          : 'bg-dark-800 text-rose-300 hover:text-white'
                      }`}
                    >
                      ⚠️ Pausados ({districtsList.filter(d => d.isAvailable === false).length})
                    </button>
                  </div>
                </div>

                {/* Neighborhoods Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredDistricts.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-dark-900 rounded-2xl border border-dark-800 space-y-2">
                      <MapPin className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                      <p className="text-sm font-bold text-white">Nenhum bairro encontrado com esses filtros.</p>
                      <p className="text-xs text-slate-500">Tente buscar por outro termo ou limpe a busca.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setDistrictSearch('');
                          setDistrictPriceFilter('all');
                        }}
                        className="mt-2 px-3 py-1.5 rounded-lg bg-dark-800 text-brand-gold text-xs font-bold hover:bg-dark-750"
                      >
                        Limpar Filtros
                      </button>
                    </div>
                  ) : (
                    filteredDistricts.map((district) => {
                      const isPaused = district.isAvailable === false;
                      return (
                        <div
                          key={district.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isPaused
                              ? 'bg-dark-950/70 border-rose-900/40 opacity-75'
                              : 'bg-dark-900 border-dark-800 hover:border-dark-700'
                          }`}
                        >
                          {/* Card Header: Name & Status */}
                          <div className="flex items-start justify-between gap-2 mb-2.5">
                            <div className="min-w-0">
                              <h5 className="font-bold text-sm text-white truncate" title={district.name}>
                                {district.name}
                              </h5>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                <span>ID: {district.id}</span>
                              </span>
                            </div>

                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                                isPaused
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {isPaused ? 'Pausado' : 'Ativo'}
                            </span>
                          </div>

                          {/* Inline Price Editor */}
                          <div className="p-2.5 rounded-xl bg-dark-950 border border-dark-800 mb-3 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-slate-400">Taxa de Entrega:</span>
                              <span className="text-[10px] text-slate-500">(Enter para salvar)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-brand-gold">R$</span>
                              <input
                                type="text"
                                defaultValue={Number(district.price || 0).toFixed(2).replace('.', ',')}
                                key={`${district.id}-${district.price}`}
                                onBlur={(e) => handleUpdateDistrictInlinePrice(district.id, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleUpdateDistrictInlinePrice(district.id, e.target.value);
                                    e.target.blur();
                                  }
                                }}
                                className="w-full px-2 py-1 rounded-lg bg-dark-900 border border-dark-700 text-white font-black text-sm focus:outline-none focus:border-brand-gold focus:bg-dark-850"
                              />
                            </div>
                          </div>

                          {/* Actions Buttons */}
                          <div className="flex items-center gap-1.5 pt-1 border-t border-dark-800">
                            <button
                              type="button"
                              onClick={() => handleToggleDistrictAvailability(district.id)}
                              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                                isPaused
                                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                              title={isPaused ? 'Reativar entrega neste bairro' : 'Pausar entrega neste bairro temporariamente'}
                            >
                              {isPaused ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Reativar</span>
                                </>
                              ) : (
                                <>
                                  <X className="w-3 h-3" />
                                  <span>Pausar</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditDistrict(district)}
                              className="p-1.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700 cursor-pointer transition-colors"
                              title="Editar detalhes e nome do bairro"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteDistrict(district.id, district.name)}
                              className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 cursor-pointer transition-colors"
                              title="Remover este bairro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
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
                  <button
                    type="button"
                    onClick={() => handleOpenCreateBuffetItem()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 text-xs font-black hover:brightness-110 shadow-glow-gold transition-all cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Adicionar Novo Prato</span>
                  </button>

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

                      <button
                        type="button"
                        onClick={() => handleOpenCreateBuffetItem(category.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-dark-900 hover:bg-dark-850 text-brand-gold border border-brand-gold/30 text-xs font-bold transition-colors cursor-pointer"
                        title={`Adicionar novo prato em ${category.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Adicionar em {category.name}</span>
                        <span className="sm:hidden">+ Prato</span>
                      </button>
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
                                : 'bg-dark-900 border-dark-800 hover:border-brand-gold/40 shadow-sm'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <h4 className={`text-xs sm:text-sm font-bold truncate ${
                                    isUnavailable ? 'text-slate-400 line-through' : 'text-white'
                                  }`}>
                                    {item.name}
                                  </h4>
                                  {item.isAssado && (
                                    <span className="inline-block mt-0.5 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      🥩 Assado na Brasa
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {isUnavailable ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 whitespace-nowrap">
                                      ⛔ Acabou
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                                      🟢 Ativo
                                    </span>
                                  )}

                                  {/* Editar Prato */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditBuffetItem(item, category.id)}
                                    className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-brand-gold transition-colors cursor-pointer"
                                    title="Editar prato"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Excluir Prato */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBuffetItem(item.id, item.name)}
                                    className="p-1.5 rounded-lg bg-dark-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                    title="Remover prato do buffet"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {item.desc && (
                                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
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
      </AdminShell>

      {/* Painel lateral com o pedido completo (aberto ao tocar num cartão do quadro) */}
      {kanbanDetailOrderId && (() => {
        const detailOrder = (scopedOrders || []).find(o => o.orderId === kanbanDetailOrderId);
        if (!detailOrder) return null;
        return (
          <div className="fixed inset-0 z-[45] flex justify-end" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/60" onClick={() => setKanbanDetailOrderId(null)} />
            <div className="relative w-full sm:max-w-xl lg:max-w-2xl h-full bg-dark-950 border-l border-white/10 flex flex-col animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <h3 className="text-xl font-black text-white">Pedido #{formatOrderNumber(detailOrder)}</h3>
                <button type="button" onClick={() => setKanbanDetailOrderId(null)} className="w-9 h-9 rounded-full bg-dark-800 text-slate-200 flex items-center justify-center cursor-pointer" aria-label="Fechar">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                <div className="kds-detail-zoom">{renderKdsOrderCard(detailOrder)}</div>
              </div>
            </div>
          </div>
        );
      })()}

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
                    Pedido #{formatOrderNumber(whatsappModalData.order)} • {whatsappModalData.order.customerName}
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
                    Pedido #{formatOrderNumber(cancelModalOrder)} • {cancelModalOrder.customerName}
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
      {/* MODAL: CHANGE PAYMENT & CASH CHANGE MODAL (KDS / COZINHA)      */}
      {/* ============================================================== */}
      {editItemsModalOrder && (
        <EditOrderItemsModal
          order={editItemsModalOrder}
          products={productsList}
          formatOrderNumber={formatOrderNumber}
          onClose={() => setEditItemsModalOrder(null)}
          onSave={(updates) => {
            const handler = onUpdateOrderDetails || onUpdatePaymentMethod;
            if (handler) handler(editItemsModalOrder.orderId, updates);
            setEditItemsModalOrder(null);
          }}
        />
      )}

      {editCustomerModalOrder && (
        <EditOrderCustomerModal
          order={editCustomerModalOrder}
          districts={districtsList}
          formatOrderNumber={formatOrderNumber}
          onClose={() => setEditCustomerModalOrder(null)}
          onOpenPayment={() => {
            const o = editCustomerModalOrder;
            setEditCustomerModalOrder(null);
            handleOpenChangePaymentModal(o);
          }}
          onSave={(updates) => {
            const handler = onUpdateOrderDetails || onUpdatePaymentMethod;
            if (handler) handler(editCustomerModalOrder.orderId, updates);
            setEditCustomerModalOrder(null);
          }}
        />
      )}

      {changePaymentModalOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="relative w-full max-w-lg bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-dark-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/20 text-brand-gold flex items-center justify-center border border-brand-gold/30">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Alterar Forma de Pagamento & Troco
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pedido #{formatOrderNumber(changePaymentModalOrder)} • {changePaymentModalOrder.customerName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setChangePaymentModalOrder(null)}
                className="w-8 h-8 rounded-full bg-dark-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Order Summary */}
            <div className="bg-dark-950/90 p-3.5 rounded-2xl border border-dark-800 flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Total do Pedido:
                </span>
                <span className="text-lg font-black text-brand-gold font-mono">
                  R$ {Number(changePaymentModalOrder.total || 0).toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Forma Atual:
                </span>
                <span className="text-xs font-bold text-slate-200">
                  {changePaymentModalOrder.paymentMethod || 'A Definir'}
                </span>
              </div>
            </div>

            {/* Select New Payment Method */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Selecione a Nova Forma de Pagamento:
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {[
                  { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
                  { id: 'pix', label: 'PIX', icon: QrCode },
                  { id: 'credito', label: 'Crédito', icon: CreditCard },
                  { id: 'debito', label: 'Débito', icon: CreditCard },
                  { id: 'misto', label: '2 Formas', icon: Shuffle }
                ].map(opt => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setEditPaymentType(opt.id)}
                      className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        editPaymentType === opt.id
                          ? 'bg-brand-gold text-dark-950 border-brand-gold shadow-glow-gold'
                          : 'bg-dark-950 text-slate-300 border-dark-800 hover:border-dark-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dinheiro & Troco Inputs */}
            {editPaymentType === 'dinheiro' && (() => {
              const orderTotal = Number(changePaymentModalOrder.total || 0);
              const cleanChange = parseFloat(String(editCashChange).replace('R$', '').replace(',', '.').trim()) || 0;
              const trocoDevolver = cleanChange > orderTotal ? (cleanChange - orderTotal) : 0;
              return (
                <div className="bg-dark-950/80 p-3.5 rounded-2xl border border-dark-800 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1">
                      Precisa de troco para quanto? (Valor pago pelo cliente)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                      <input
                        type="text"
                        placeholder="Ex: 50,00 (ou deixe em branco se não precisar)"
                        value={editCashChange}
                        onChange={(e) => setEditCashChange(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs font-bold focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                  </div>

                  {/* Quick Shortcut Buttons for common bill values */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold">Atalhos:</span>
                    <button
                      type="button"
                      onClick={() => setEditCashChange('')}
                      className="px-2 py-0.5 rounded-lg bg-dark-800 hover:bg-dark-750 text-[10px] font-bold text-slate-300 border border-dark-700 cursor-pointer"
                    >
                      Sem Troco
                    </button>
                    {[20, 50, 100, 200].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setEditCashChange(val.toString())}
                        className="px-2 py-0.5 rounded-lg bg-dark-800 hover:bg-dark-750 text-[10px] font-bold text-slate-300 border border-dark-700 cursor-pointer"
                      >
                        R$ {val},00
                      </button>
                    ))}
                  </div>

                  {/* Live Troco Feedback */}
                  {cleanChange > 0 && (
                    <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between font-bold ${
                      cleanChange >= orderTotal
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                    }`}>
                      <span>
                        {cleanChange >= orderTotal
                          ? '💵 Troco a devolver para o cliente:'
                          : '⚠️ Valor entregue é menor que o total!'}
                      </span>
                      <span className="font-mono text-sm font-black">
                        {cleanChange >= orderTotal
                          ? `R$ ${trocoDevolver.toFixed(2).replace('.', ',')}`
                          : `Falta R$ ${(orderTotal - cleanChange).toFixed(2).replace('.', ',')}`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Misto (2 Formas) Inputs */}
            {editPaymentType === 'misto' && (() => {
              const orderTotal = Number(changePaymentModalOrder.total || 0);
              const val1 = parseFloat(String(editSplitAmount1).replace(',', '.')) || (orderTotal / 2);
              const val2 = Math.max(0, orderTotal - val1);
              return (
                <div className="bg-dark-950/80 p-3.5 rounded-2xl border border-dark-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Shuffle className="w-3.5 h-3.5 text-brand-gold" />
                      <span>Configurar 2 Formas:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditSplitAmount1((orderTotal / 2).toFixed(2))}
                      className="text-[10px] font-black px-2 py-1 rounded-lg bg-brand-gold/15 hover:bg-brand-gold/25 border border-brand-gold/40 text-brand-gold cursor-pointer"
                    >
                      50% / 50% (R$ {(orderTotal / 2).toFixed(2).replace('.', ',')} cada)
                    </button>
                  </div>

                  {/* 1ª Forma */}
                  <div className="p-2.5 rounded-xl bg-dark-900 border border-dark-800 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="text-xs font-bold text-slate-200">1ª Forma:</span>
                      <div className="flex items-center gap-1">
                        {[
                          { id: 'pix', label: 'PIX' },
                          { id: 'credito', label: 'Crédito' },
                          { id: 'debito', label: 'Débito' },
                          { id: 'dinheiro', label: 'Dinheiro' }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setEditSplitMethod1(opt.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                              editSplitMethod1 === opt.id
                                ? 'bg-brand-gold text-dark-950'
                                : 'bg-dark-950 text-slate-400 hover:text-white border border-dark-800'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-400 flex-shrink-0">
                        Valor 1ª forma:
                      </label>
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder={(orderTotal / 2).toFixed(2)}
                          value={editSplitAmount1}
                          onChange={(e) => setEditSplitAmount1(e.target.value)}
                          className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-dark-950 border border-dark-750 text-white text-xs font-bold focus:border-brand-gold focus:outline-none"
                        />
                      </div>
                    </div>

                    {editSplitMethod1 === 'dinheiro' && (
                      <input
                        type="text"
                        placeholder="Troco para quanto na 1ª forma? (Ex: 50)"
                        value={editSplitChange1}
                        onChange={(e) => setEditSplitChange1(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-dark-950 border border-dark-750 text-white text-xs placeholder-slate-500 focus:border-brand-gold focus:outline-none"
                      />
                    )}
                  </div>

                  {/* 2ª Forma */}
                  <div className="p-2.5 rounded-xl bg-dark-900 border border-dark-800 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="text-xs font-bold text-slate-200">2ª Forma:</span>
                      <div className="flex items-center gap-1">
                        {[
                          { id: 'credito', label: 'Crédito' },
                          { id: 'debito', label: 'Débito' },
                          { id: 'pix', label: 'PIX' },
                          { id: 'dinheiro', label: 'Dinheiro' }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setEditSplitMethod2(opt.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                              editSplitMethod2 === opt.id
                                ? 'bg-brand-gold text-dark-950'
                                : 'bg-dark-950 text-slate-400 hover:text-white border border-dark-800'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-dark-950 border border-dark-850">
                      <span className="text-[11px] font-semibold text-slate-400">
                        Valor restante da 2ª forma:
                      </span>
                      <span className="text-xs font-black text-brand-gold font-mono">
                        R$ {val2.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    {editSplitMethod2 === 'dinheiro' && (
                      <input
                        type="text"
                        placeholder="Troco para quanto na 2ª forma? (Ex: 50)"
                        value={editSplitChange2}
                        onChange={(e) => setEditSplitChange2(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-dark-950 border border-dark-750 text-white text-xs placeholder-slate-500 focus:border-brand-gold focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Payment Status Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Status do Pagamento:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditPaymentStatus('PENDENTE_COBRANCA')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    editPaymentStatus === 'PENDENTE_COBRANCA'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cobrar na Entrega</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditPaymentStatus('PAGO_APROVADO')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    editPaymentStatus === 'PAGO_APROVADO'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Já Pago / Aprovado</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-dark-800">
              <button
                type="button"
                onClick={handleSavePaymentChange}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 hover:from-amber-400 hover:to-brand-gold text-dark-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Nova Forma de Pagamento</span>
              </button>

              <button
                type="button"
                onClick={() => setChangePaymentModalOrder(null)}
                className="w-full py-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-400 font-semibold text-xs cursor-pointer transition-colors"
              >
                Cancelar
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
                {pdvSuccessOrder.orderStatus === 'CONCLUIDO'
                  ? `Pedido #${formatOrderNumber(pdvSuccessOrder)} Baixa Concluída!`
                  : `Pedido #${formatOrderNumber(pdvSuccessOrder)} Lançado!`}
              </h3>
              <p className="text-xs text-brand-gold font-medium mt-1">
                {pdvSuccessOrder.orderStatus === 'CONCLUIDO'
                  ? 'Venda registrada e baixa imediata realizada com sucesso.'
                  : 'O pedido já está visível em tempo real na fila da cozinha.'}
              </p>
              <div className="text-sm font-bold text-slate-300 mt-2">
                Cliente: {pdvSuccessOrder.customerName} • R$ {(pdvSuccessOrder.total || 0).toFixed(2).replace('.', ',')}
                {(Number(pdvSuccessOrder.serviceAmount || pdvSuccessOrder.serviceFee) > 0) && (
                  <span className="ml-2 text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    (+ {pdvSuccessOrder.serviceDescription || 'Serviço'}: R$ {Number(pdvSuccessOrder.serviceAmount || pdvSuccessOrder.serviceFee).toFixed(2).replace('.', ',')})
                  </span>
                )}
                {(Number(pdvSuccessOrder.discountAmount || pdvSuccessOrder.discount) > 0) && (
                  <span className="ml-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    (Desconto: R$ {Number(pdvSuccessOrder.discountAmount || pdvSuccessOrder.discount).toFixed(2).replace('.', ',')})
                  </span>
                )}
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
                onClick={() => {
                  setPdvSuccessOrder(null);
                  setPdvSubTab('novo');
                }}
                className="flex-1 py-2.5 rounded-xl bg-brand-gold hover:bg-amber-400 text-dark-950 font-black text-xs cursor-pointer shadow-glow-gold"
              >
                + Criar Outro Pedido
              </button>
              {pdvSuccessOrder.orderStatus === 'CONCLUIDO' ? (
                <button
                  type="button"
                  onClick={() => {
                    setPdvSuccessOrder(null);
                    setPdvSubTab('baixa');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Ver Controle / Baixas
                </button>
              ) : (
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
              )}
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
                    {deliveryCategories.map(c => (
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
                        placeholder="Ex: Brotinho (4 fatias), Pequena (4 fatias), Família (8 fatias)..."
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

              {/* Preços por Tamanho de Pizza */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-dark-850 border border-brand-gold/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Preços por Tamanho de Pizza (R$) *</span>
                      <span className="text-[10px] text-brand-gold font-normal">(Personalize o valor de cada tamanho)</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Sabores tradicionais ficam no valor base. Sabores especiais podem ter acréscimo proporcional por tamanho.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setFlavorFormPrices({ brotinho: '15.00', p: '20.00', m: '30.00', familia: '40.00', gigante: '50.00' })}
                      className="px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-dark-750 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold border border-emerald-500/30 cursor-pointer"
                      title="Preencher com valores base padrão (sem acréscimo)"
                    >
                      Tradicional (15/20/30/40/50)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlavorFormPrices({ brotinho: '18.00', p: '25.00', m: '38.00', familia: '50.00', gigante: '65.00' })}
                      className="px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-dark-750 text-[10px] text-amber-300 hover:text-amber-200 font-bold border border-amber-500/30 cursor-pointer"
                      title="Sugerir valores para sabor Especial (+3 Broto, +5 P, +8 M, +10 FM, +15 GG)"
                    >
                      Sugerir Especial ⭐
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {/* Brotinho (BROTO) */}
                  <div className="p-2.5 rounded-xl bg-dark-900 border border-dark-750 focus-within:border-brand-gold">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">Brotinho</span>
                      <span className="text-[9px] text-slate-400">4 fatias</span>
                    </div>
                    <div className="text-[9px] text-slate-500 mb-1">Base: R$ 15,00</div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                      <input
                        type="text"
                        required
                        value={flavorFormPrices.brotinho}
                        onChange={(e) => setFlavorFormPrices(prev => ({ ...prev, brotinho: e.target.value }))}
                        className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-dark-950 border border-dark-700 text-xs text-white font-mono font-bold focus:outline-none focus:border-brand-gold"
                        placeholder="15.00"
                      />
                    </div>
                    <div className="text-[9px] mt-1">
                      {parseFloat(String(flavorFormPrices.brotinho).replace(',', '.')) > 15 ? (
                        <span className="text-amber-400 font-bold">
                          + R$ {(parseFloat(String(flavorFormPrices.brotinho).replace(',', '.')) - 15).toFixed(2).replace('.', ',')}
                        </span>
                      ) : (
                        <span className="text-emerald-400">Sem acréscimo</span>
                      )}
                    </div>
                  </div>

                  {/* Pequena (P) */}
                  <div className="p-2.5 rounded-xl bg-dark-900 border border-dark-750 focus-within:border-brand-gold">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">Pequena (P)</span>
                      <span className="text-[9px] text-slate-400">4 fatias</span>
                    </div>
                    <div className="text-[9px] text-slate-500 mb-1">Base: R$ 20,00</div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                      <input
                        type="text"
                        required
                        value={flavorFormPrices.p}
                        onChange={(e) => setFlavorFormPrices(prev => ({ ...prev, p: e.target.value }))}
                        className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-dark-950 border border-dark-700 text-xs text-white font-mono font-bold focus:outline-none focus:border-brand-gold"
                        placeholder="20.00"
                      />
                    </div>
                    <div className="text-[9px] mt-1">
                      {parseFloat(String(flavorFormPrices.p).replace(',', '.')) > 20 ? (
                        <span className="text-amber-400 font-bold">
                          + R$ {(parseFloat(String(flavorFormPrices.p).replace(',', '.')) - 20).toFixed(2).replace('.', ',')}
                        </span>
                      ) : (
                        <span className="text-emerald-400">Sem acréscimo</span>
                      )}
                    </div>
                  </div>

                  {/* Média (M) */}
                  <div className="p-2.5 rounded-xl bg-dark-900 border border-dark-750 focus-within:border-brand-gold">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">Média (M)</span>
                      <span className="text-[9px] text-slate-400">6 fatias</span>
                    </div>
                    <div className="text-[9px] text-slate-500 mb-1">Base: R$ 30,00</div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                      <input
                        type="text"
                        required
                        value={flavorFormPrices.m}
                        onChange={(e) => setFlavorFormPrices(prev => ({ ...prev, m: e.target.value }))}
                        className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-dark-950 border border-dark-700 text-xs text-white font-mono font-bold focus:outline-none focus:border-brand-gold"
                        placeholder="30.00"
                      />
                    </div>
                    <div className="text-[9px] mt-1">
                      {parseFloat(String(flavorFormPrices.m).replace(',', '.')) > 30 ? (
                        <span className="text-amber-400 font-bold">
                          + R$ {(parseFloat(String(flavorFormPrices.m).replace(',', '.')) - 30).toFixed(2).replace('.', ',')}
                        </span>
                      ) : (
                        <span className="text-emerald-400">Sem acréscimo</span>
                      )}
                    </div>
                  </div>

                  {/* Família (FM) */}
                  <div className="p-2.5 rounded-xl bg-dark-900 border border-dark-750 focus-within:border-brand-gold">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">Família (FM)</span>
                      <span className="text-[9px] text-slate-400">8 fatias</span>
                    </div>
                    <div className="text-[9px] text-slate-500 mb-1">Base: R$ 40,00</div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                      <input
                        type="text"
                        required
                        value={flavorFormPrices.familia}
                        onChange={(e) => setFlavorFormPrices(prev => ({ ...prev, familia: e.target.value }))}
                        className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-dark-950 border border-dark-700 text-xs text-white font-mono font-bold focus:outline-none focus:border-brand-gold"
                        placeholder="40.00"
                      />
                    </div>
                    <div className="text-[9px] mt-1">
                      {parseFloat(String(flavorFormPrices.familia).replace(',', '.')) > 40 ? (
                        <span className="text-amber-400 font-bold">
                          + R$ {(parseFloat(String(flavorFormPrices.familia).replace(',', '.')) - 40).toFixed(2).replace('.', ',')}
                        </span>
                      ) : (
                        <span className="text-emerald-400">Sem acréscimo</span>
                      )}
                    </div>
                  </div>

                  {/* Gigante (GG) */}
                  <div className="p-2.5 rounded-xl bg-dark-900 border border-dark-750 focus-within:border-brand-gold">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">Gigante (GG)</span>
                      <span className="text-[9px] text-slate-400">12 fatias</span>
                    </div>
                    <div className="text-[9px] text-slate-500 mb-1">Base: R$ 50,00</div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                      <input
                        type="text"
                        required
                        value={flavorFormPrices.gigante}
                        onChange={(e) => setFlavorFormPrices(prev => ({ ...prev, gigante: e.target.value }))}
                        className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-dark-950 border border-dark-700 text-xs text-white font-mono font-bold focus:outline-none focus:border-brand-gold"
                        placeholder="50.00"
                      />
                    </div>
                    <div className="text-[9px] mt-1">
                      {parseFloat(String(flavorFormPrices.gigante).replace(',', '.')) > 50 ? (
                        <span className="text-amber-400 font-bold">
                          + R$ {(parseFloat(String(flavorFormPrices.gigante).replace(',', '.')) - 50).toFixed(2).replace('.', ',')}
                        </span>
                      ) : (
                        <span className="text-emerald-400">Sem acréscimo</span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  💡 <strong>Regra:</strong> Ao montar a pizza, o sistema cobrará o <strong>maior valor</strong> entre os sabores escolhidos para aquele tamanho.
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

              {/* Foto Ilustrativa do Sabor (Sem Fundo) */}
              <div className="pt-2 border-t border-dark-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-200">
                    Foto do Sabor (Sem Fundo)
                  </label>
                  <span className="text-[10px] text-brand-gold font-medium">PNG transparente recomendado</span>
                </div>

                {/* Preview Box e Upload */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-dark-900 border border-dark-750">
                  <div className="w-16 h-16 rounded-xl bg-dark-950 border border-dark-800 flex items-center justify-center p-1.5 flex-shrink-0 relative overflow-hidden">
                    {flavorFormImage ? (
                      <img 
                        src={flavorFormImage} 
                        alt="Prévia do Sabor" 
                        className="w-full h-full object-contain drop-shadow" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <Pizza className="w-8 h-8 text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {flavorFormImage ? 'Foto ativa para este sabor' : 'Nenhuma foto selecionada'}
                    </p>
                    <p className="text-[10px] text-slate-400 mb-2">
                      Aparecerá nos combos de pizza e na montagem individual
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-dark-750 text-slate-200 border border-dark-700 text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1.5">
                        {isUploadingFlavorImage ? (
                          <RefreshCw className="w-3.5 h-3.5 text-brand-gold animate-spin" />
                        ) : (
                          <Camera className="w-3.5 h-3.5 text-brand-gold" />
                        )}
                        <span>{isUploadingFlavorImage ? 'Salvando na Nuvem...' : 'Carregar do Aparelho'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingFlavorImage}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadFlavorImageFile(file);
                          }}
                        />
                      </label>

                      {flavorFormImage && !isUploadingFlavorImage && (
                        <button
                          type="button"
                          onClick={() => setFlavorFormImage('')}
                          className="px-2 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/40 text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Remover Foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seleção rápida das fotos oficiais da El Shadday */}
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium mb-1">
                    Ou selecione uma foto pronta do catálogo da El Shadday:
                  </span>
                  <select
                    value={flavorFormImage}
                    onChange={(e) => setFlavorFormImage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white focus:outline-none focus:border-brand-gold cursor-pointer"
                  >
                    <option value="">-- Escolher foto do acervo --</option>
                    {INITIAL_PIZZA_FLAVORS.map(init => (
                      <option key={init.id} value={init.image}>
                        {init.name} ({init.category === 'especiais' ? 'Especial' : init.category === 'doces' ? 'Doce' : 'Tradicional'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* URL direta */}
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium mb-1">
                    Ou informe o caminho/URL da imagem:
                  </span>
                  <input
                    type="text"
                    value={flavorFormImage}
                    onChange={(e) => setFlavorFormImage(e.target.value)}
                    placeholder="Ex: /flavors/carne-seca.png ou https://..."
                    className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-brand-gold"
                  />
                </div>
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
                  disabled={isUploadingFlavorImage}
                  className={`px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black text-xs hover:brightness-110 shadow-glow-gold cursor-pointer flex items-center gap-1.5 ${
                    isUploadingFlavorImage ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isUploadingFlavorImage ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-dark-950" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isUploadingFlavorImage ? 'Enviando foto...' : editingFlavor ? 'Salvar Sabor' : 'Cadastrar Sabor'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: CADASTRAR / EDITAR ACOMPANHAMENTO DE AÇAÍ */}
      {isComplementModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-dark-900 border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-dark-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-white">
                    {editingComplement ? `Editar: ${editingComplement.name}` : 'Novo Acompanhamento'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingComplement ? 'Altere o nome, ícone ou status' : 'Adicione um novo acompanhamento de açaí'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsComplementModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveComplement} className="space-y-4 mt-4">
              {/* Nome */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Nome do Acompanhamento *
                </label>
                <input
                  type="text"
                  required
                  value={complementFormName}
                  onChange={(e) => setComplementFormName(e.target.value)}
                  placeholder="Ex: Nutella, Paçoca, Morango..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Ícone / Emoji */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Emoji / Ícone Ilustrativo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={complementFormIcon}
                    onChange={(e) => setComplementFormIcon(e.target.value)}
                    placeholder="Ex: 🥜 ou 🍓 ou ✨"
                    className="w-16 text-center px-2 py-2 rounded-xl bg-dark-800 border border-dark-700 text-lg text-white focus:outline-none focus:border-purple-400"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['🥜', '🍓', '🍌', '🥛', '🥣', '🥝', '🍫', '✨', '🍬', '🥥'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setComplementFormIcon(emoji)}
                        className="w-8 h-8 rounded-lg bg-dark-800 hover:bg-dark-750 text-base flex items-center justify-center cursor-pointer transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preço Adicional */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Preço Adicional (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={complementFormPrice}
                    onChange={(e) => setComplementFormPrice(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Deixe 0,00 para acompanhamento incluso (grátis), ou digite o valor extra cobrado ao adicionar este item ao açaí.
                </p>
              </div>

              {/* Opções */}
              <div className="space-y-2 pt-2 border-t border-dark-800">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-dark-800/60 border border-dark-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={complementFormIsAvailable}
                    onChange={(e) => setComplementFormIsAvailable(e.target.checked)}
                    className="w-4 h-4 accent-emerald-400 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">Disponível para Pedidos</div>
                    <div className="text-[10px] text-slate-400">Desmarque caso tenha acabado na cozinha (ficará esgotado)</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-dark-800/60 border border-dark-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={complementFormDefaultSelected}
                    onChange={(e) => setComplementFormDefaultSelected(e.target.checked)}
                    className="w-4 h-4 accent-purple-400 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">Marcado por Padrão</div>
                    <div className="text-[10px] text-slate-400">Vem pré-selecionado quando o cliente abre o modal</div>
                  </div>
                </label>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-dark-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsComplementModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-xs hover:brightness-110 shadow-md shadow-purple-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingComplement ? 'Salvar Acompanhamento' : 'Adicionar Acompanhamento'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR / EDITAR COBERTURA */}
      {isCoberturaModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-dark-900 border border-dark-750 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-dark-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-white">
                    {editingCobertura ? `Editar: ${editingCobertura.name}` : 'Nova Cobertura'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingCobertura ? 'Altere o nome, preço ou status da cobertura' : 'Adicione uma nova opção de cobertura para o açaí'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCoberturaModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCobertura} className="space-y-4 mt-4">
              {/* Nome */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Nome da Cobertura *
                </label>
                <input
                  type="text"
                  required
                  value={coberturaFormName}
                  onChange={(e) => setCoberturaFormName(e.target.value)}
                  placeholder="Ex: Cobertura de Nutella, Frutas Vermelhas..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Preço Adicional */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Preço Adicional (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={coberturaFormPrice}
                    onChange={(e) => setCoberturaFormPrice(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Deixe 0,00 para cobertura inclusa (grátis), ou digite o valor extra cobrado ao cliente.
                </p>
              </div>

              {/* Status Disponível */}
              <div className="pt-2 border-t border-dark-800">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-dark-800/60 border border-dark-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={coberturaFormIsAvailable}
                    onChange={(e) => setCoberturaFormIsAvailable(e.target.checked)}
                    className="w-4 h-4 accent-emerald-400 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">Disponível para Pedidos</div>
                    <div className="text-[10px] text-slate-400">Desmarque caso tenha acabado na cozinha (ficará esgotado)</div>
                  </div>
                </label>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-dark-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCoberturaModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-xs hover:brightness-110 shadow-md shadow-purple-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingCobertura ? 'Salvar Cobertura' : 'Adicionar Cobertura'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR / EDITAR PRATO DO BUFFET */}
      {isBuffetItemModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-lg bg-dark-900 border border-dark-750 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-dark-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 text-brand-gold border border-brand-gold/30 flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-white">
                    {editingBuffetItem ? `Editar: ${editingBuffetItem.name}` : 'Novo Prato para o Buffet'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingBuffetItem ? 'Altere o nome, descrição, categoria ou status do prato' : 'Cadastre um novo prato ou assado para os eventos de buffet'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBuffetItemModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBuffetItem} className="space-y-4 mt-3">
              {/* Categoria */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Categoria do Buffet *
                </label>
                <select
                  value={buffetItemFormCategoryId}
                  onChange={(e) => setBuffetItemFormCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white focus:outline-none focus:border-brand-gold cursor-pointer"
                >
                  {buffetCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.items?.length || 0} itens cadastrados)
                    </option>
                  ))}
                </select>
              </div>

              {/* Nome do Prato */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Nome do Prato *
                </label>
                <input
                  type="text"
                  required
                  value={buffetItemFormName}
                  onChange={(e) => setBuffetItemFormName(e.target.value)}
                  placeholder="Ex: Costela Bovina no Bafo, Risoto de Camarão..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                />
              </div>

              {/* Descrição / Ingredientes */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Descrição ou Ingredientes (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={buffetItemFormDesc}
                  onChange={(e) => setBuffetItemFormDesc(e.target.value)}
                  placeholder="Ex: Assada lentamente no bafo por 8 horas, suculenta e servida com mandioca na manteiga de garrafa..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold leading-relaxed"
                />
              </div>

              {/* Opções de Status e Assado */}
              <div className="space-y-2.5 pt-2 border-t border-dark-800">
                {/* É um Assado na Brasa */}
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-dark-800/60 border border-dark-750 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={buffetItemFormIsAssado}
                    onChange={(e) => setBuffetItemFormIsAssado(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-gold accent-brand-gold cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>🥩 É um Assado ou Preparado na Brasa?</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Recebe destaque com selo especial de "Assados" no cardápio de buffet do cliente
                    </div>
                  </div>
                </label>

                {/* Disponível no Cardápio */}
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-dark-800/60 border border-dark-750 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={buffetItemFormIsAvailable}
                    onChange={(e) => setBuffetItemFormIsAvailable(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-400 accent-emerald-400 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">
                      Disponível para Clientes no Cardápio do Site
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Desmarque caso tenha acabado na cozinha para pausar este prato
                    </div>
                  </div>
                </label>
              </div>

              {/* Botões do Formulário */}
              <div className="pt-4 border-t border-dark-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsBuffetItemModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black text-xs hover:brightness-110 shadow-glow-gold cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <Save className="w-4 h-4 stroke-[3]" />
                  <span>{editingBuffetItem ? 'Salvar Alterações' : 'Cadastrar Prato no Buffet'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 1: PERSONALIZAR PIZZA NO PDV */}
      {pdvPizzaToCustomize && (
        <PizzaCustomizerModal
          isOpen={!!pdvPizzaToCustomize}
          onClose={() => setPdvPizzaToCustomize(null)}
          pizzaProduct={pdvPizzaToCustomize}
          flavors={pizzaFlavors}
          onAddPizzaToCart={handleAddPizzaToPDV}
        />
      )}

      {/* MODAL 2: MONTAR CAIXA DE ESFIRRAS NO PDV */}
      {pdvBoxToCustomize && (
        <BoxBuilderModal
          isOpen={!!pdvBoxToCustomize}
          onClose={() => setPdvBoxToCustomize(null)}
          initialBox={pdvBoxToCustomize}
          products={productsList}
          onAddBoxToCart={handleAddBoxToPDV}
        />
      )}

      {/* MODAL 3: PERSONALIZAR AÇAÍ NO PDV */}
      {pdvAcaiToCustomize && (
        <AcaiCustomizerModal
          isOpen={!!pdvAcaiToCustomize}
          onClose={() => setPdvAcaiToCustomize(null)}
          acaiProduct={pdvAcaiToCustomize}
          onAddAcaiToCart={handleAddAcaiToPDV}
        />
      )}

      {/* MODAL 4: MONTAR COMBO NO PDV */}
      {pdvComboToCustomize && (
        <ComboCustomizerModal
          isOpen={!!pdvComboToCustomize}
          onClose={() => setPdvComboToCustomize(null)}
          comboProduct={pdvComboToCustomize}
          onAddComboToCart={handleAddComboToPDV}
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

      {/* MODAL: EDITAR BAIRRO & TAXA */}
      {isDistrictModalOpen && editingDistrict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-dark-900 border border-dark-750 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dark-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Editar Taxa de Entrega</h4>
                  <p className="text-[11px] text-slate-400">Atualize o nome ou o valor cobrado</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDistrictModalOpen(false);
                  setEditingDistrict(null);
                }}
                className="w-8 h-8 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDistrictModal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nome do Bairro:
                </label>
                <input
                  type="text"
                  value={districtFormName}
                  onChange={(e) => setDistrictFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs font-semibold focus:outline-none focus:border-brand-gold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Valor da Taxa (R$):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">R$</span>
                  <input
                    type="text"
                    value={districtFormPrice}
                    onChange={(e) => setDistrictFormPrice(e.target.value)}
                    placeholder="10,00"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs font-black focus:outline-none focus:border-brand-gold"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-dark-950 border border-dark-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Disponibilidade para Entrega</span>
                  <span className="text-[11px] text-slate-400">Se desativado, o cliente não poderá pedir entrega para este bairro</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={districtFormIsAvailable}
                    onChange={(e) => setDistrictFormIsAvailable(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                  />
                  <span className={`text-xs font-bold ${districtFormIsAvailable ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {districtFormIsAvailable ? 'Ativo' : 'Pausado'}
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-dark-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsDistrictModalOpen(false);
                    setEditingDistrict(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black text-xs hover:brightness-110 shadow-glow-gold cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FECHAMENTO DE CAIXA / HISTÓRICO / HORÁRIO AUTOMÁTICO */}
      <CashClosingModal
        isOpen={isCashClosingModalOpen}
        onClose={() => setIsCashClosingModalOpen(false)}
        orders={scopedOrders}
        currentUser={currentUser}
        currentBranch={currentBranch}
        onCashClosed={() => {
          // Play confirmation chime
          playChime(true, 'Caixa do dia fechado com sucesso! Relatório arquivado em finanças.');
        }}
      />

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
