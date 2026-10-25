import React, { useState, useEffect } from 'react';
import { 
  getStoredBuffetCompany, 
  saveStoredBuffetCompany, 
  getStoredBuffetCategories, 
  saveStoredBuffetCategories, 
  getStoredEventTypes, 
  saveStoredEventTypes,
  getStoredBuffetGallery,
  saveStoredBuffetGallery,
  isFakeGalleryItem
} from './buffetData';
import { BuffetHeader } from './components/BuffetHeader';
import { BuffetHero } from './components/BuffetHero';
import { BuffetAbout } from './components/BuffetAbout';
import { BuffetHowItWorks } from './components/BuffetHowItWorks';
import { BuffetMenuPreview } from './components/BuffetMenuPreview';
import { BuffetGallery } from './components/BuffetGallery';
import { BuffetFooter } from './components/BuffetFooter';
import { BuffetFloatingWhatsApp } from './components/BuffetFloatingWhatsApp';
import { BuffetAdminLoginModal } from './components/BuffetAdminLoginModal';
import { BuffetAdminDashboard } from './components/BuffetAdminDashboard';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { dispatchConfigSync } from '../services/configSyncService';
import { Utensils, ArrowRight, Sparkles } from 'lucide-react';

export function BuffetApp({ currentAppMode, onToggleAppMode, onNavigateToBuilder }) {
  // App Dynamic State (Editable & Persisted)
  const [company, setCompany] = useState(() => getStoredBuffetCompany());
  const [categories, setCategories] = useState(() => getStoredBuffetCategories());
  const [eventTypes, setEventTypes] = useState(() => getStoredEventTypes());
  const [galleryPhotos, setGalleryPhotos] = useState(() => getStoredBuffetGallery());

  // Admin session & modal state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('el_shadday_buffet_admin_auth') === 'true';
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);

  // Selected items count tracker for header badge
  const [selectedCount, setSelectedCount] = useState(0);

  // Read selected items count from localStorage
  const updateSelectedCount = () => {
    try {
      const saved = localStorage.getItem('el_shadday_selected_items');
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) {
          setSelectedCount(arr.length);
          return;
        }
      }
    } catch (e) {}
    setSelectedCount(0);
  };

  useEffect(() => {
    updateSelectedCount();
    const interval = setInterval(updateSelectedCount, 1500);
    return () => clearInterval(interval);
  }, []);

  // Listen to category and unavailability updates in real time
  useEffect(() => {
    const handleCategoriesSync = () => {
      setCategories(getStoredBuffetCategories());
    };
    window.addEventListener('buffet_categories_updated', handleCategoriesSync);
    window.addEventListener('buffet_unavailable_updated', handleCategoriesSync);
    window.addEventListener('storage', handleCategoriesSync);

    return () => {
      window.removeEventListener('buffet_categories_updated', handleCategoriesSync);
      window.removeEventListener('buffet_unavailable_updated', handleCategoriesSync);
      window.removeEventListener('storage', handleCategoriesSync);
    };
  }, []);

  // Handle URL hash changes (e.g. #/admin)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#/admin' || hash === '#admin') {
        if (sessionStorage.getItem('el_shadday_buffet_admin_auth') === 'true') {
          setIsAdminDashboardOpen(true);
        } else {
          setIsAdminLoginModalOpen(true);
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Admin Auth Handlers
  const handleOpenAdminTrigger = () => {
    if (isAdminLoggedIn) {
      setIsAdminDashboardOpen(true);
      window.location.hash = '#/admin';
    } else {
      setIsAdminLoginModalOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    sessionStorage.setItem('el_shadday_buffet_admin_auth', 'true');
    setIsAdminLoginModalOpen(false);
    setIsAdminDashboardOpen(true);
    window.location.hash = '#/admin';
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('el_shadday_buffet_admin_auth');
    setIsAdminDashboardOpen(false);
    window.location.hash = '';
  };

  const handleBackToSiteFromAdmin = () => {
    setIsAdminDashboardOpen(false);
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // State Updates from Admin
  const handleSaveCompany = (newCompany) => {
    setCompany(newCompany);
    saveStoredBuffetCompany(newCompany);
  };

  const handleSaveCategories = (newCategories) => {
    setCategories(newCategories);
    saveStoredBuffetCategories(newCategories);
  };

  const handleSaveEventTypes = (newEventTypes) => {
    setEventTypes(newEventTypes);
    saveStoredEventTypes(newEventTypes);
  };

  // Fetch initial gallery from Supabase if configured & listen to real-time events
  useEffect(() => {
    const handleGallerySync = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setGalleryPhotos(e.detail);
      } else {
        const stored = getStoredBuffetGallery();
        setGalleryPhotos(stored);
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
              console.log('[BuffetApp] Galeria carregada de company_settings:', cleanCs.length, 'itens');
              setGalleryPhotos(cleanCs);
              saveStoredBuffetGallery(cleanCs);
            }
          });
      };

      // 1. Carrega fotos da tabela buffet_gallery
      supabase
        .from('buffet_gallery')
        .select('*')
        .order('position', { ascending: true })
        .then(({ data, error }) => {
          if (!error && Array.isArray(data) && data.length > 0) {
            const clean = data.filter(p => !isFakeGalleryItem(p));
            console.log('[BuffetApp] Galeria carregada de buffet_gallery:', clean.length, 'itens');
            setGalleryPhotos(clean);
            saveStoredBuffetGallery(clean);
          } else {
            loadFromCompanySettings();
          }
        });

      // 2. Escuta alterações em tempo real na tabela buffet_gallery
      supabase
        .channel('realtime_buffet_gallery_buffetapp')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'buffet_gallery' }, () => {
          supabase
            .from('buffet_gallery')
            .select('*')
            .order('position', { ascending: true })
            .then(({ data }) => {
              if (Array.isArray(data)) {
                const clean = data.filter(p => !isFakeGalleryItem(p));
                setGalleryPhotos(clean);
                saveStoredBuffetGallery(clean);
              }
            });
        })
        .subscribe();

      // 3. Escuta alterações em tempo real na tabela company_settings
      supabase
        .channel('realtime_cs_gallery_buffetapp')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'company_settings' }, () => {
          loadFromCompanySettings();
        })
        .subscribe();
    }

    return () => {
      window.removeEventListener('storage', handleGallerySync);
      window.removeEventListener('buffet_gallery_updated', handleGallerySync);
    };
  }, []);

  const handleSaveGalleryPhotos = async (newGallery) => {
    setGalleryPhotos(newGallery);
    saveStoredBuffetGallery(newGallery);
    dispatchConfigSync('GALLERY_UPDATE', newGallery);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('company_settings').upsert({
          id: 'el_shadday_config',
          buffet_gallery: newGallery,
          updated_at: new Date().toISOString()
        });

        await supabase.from('buffet_gallery').delete().neq('id', 'placeholder_none');
        if (newGallery.length > 0) {
          const rows = newGallery.map((g, idx) => ({
            id: g.id || `media_${Date.now()}_${idx}`,
            url: g.url,
            title: g.title,
            subtitle: g.subtitle || '',
            category: g.category || 'churrasco',
            tag: g.tag || '',
            position: idx
          }));
          await supabase.from('buffet_gallery').insert(rows);
        }
      } catch (e) {
        console.warn('Erro ao sincronizar galeria com Supabase:', e);
      }
    }
  };

  // Scroll helpers
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // IF ADMIN DASHBOARD VIEW IS OPEN
  if (isAdminDashboardOpen && isAdminLoggedIn) {
    return (
      <BuffetAdminDashboard
        company={company}
        categories={categories}
        eventTypes={eventTypes}
        galleryPhotos={galleryPhotos}
        onSaveCompany={handleSaveCompany}
        onSaveCategories={handleSaveCategories}
        onSaveEventTypes={handleSaveEventTypes}
        onSaveGalleryPhotos={handleSaveGalleryPhotos}
        onLogout={handleAdminLogout}
        onBackToSite={handleBackToSiteFromAdmin}
        currentAppMode={currentAppMode}
        onToggleAppMode={onToggleAppMode}
      />
    );
  }

  // MAIN BUFFET WEBSITE VIEW
  return (
    <div className="min-h-screen bg-[#202630] text-slate-100 font-sans selection:bg-[#D8B85A] selection:text-[#15191F] flex flex-col">
      
      {/* Top Header */}
      <BuffetHeader
        company={company}
        onOpenAdmin={handleOpenAdminTrigger}
        selectedItemsCount={selectedCount}
        onNavigateToBuilder={onNavigateToBuilder || (() => scrollTo('montador-cta'))}
      />

      {/* Hero Section */}
      <BuffetHero
        company={company}
        onScrollToBuilder={onNavigateToBuilder || (() => scrollTo('montador-cta'))}
        onScrollToAbout={() => scrollTo('quem-somos')}
      />

      {/* Main Content Areas */}
      <main className="flex-1">
        
        {/* Section 1: Quem Somos */}
        <BuffetAbout
          company={company}
          onScrollToBuilder={onNavigateToBuilder || (() => scrollTo('montador-cta'))}
        />

        {/* Section 2: Como Funciona */}
        <BuffetHowItWorks
          onScrollToBuilder={onNavigateToBuilder || (() => scrollTo('montador-cta'))}
        />

        {/* Section 3: O que Servimos / Cardápio Preview */}
        <BuffetMenuPreview
          categories={categories}
          onScrollToBuilder={onNavigateToBuilder || (() => scrollTo('montador-cta'))}
        />

        {/* Section 3.1: Galeria de Fotos Dinâmica com Carrossel */}
        <BuffetGallery galleryItems={galleryPhotos} />

        {/* Section 4: Chamada em Destaque para Montar o Cardápio na Subpágina */}
        <section id="montador-cta" className="py-16 sm:py-24 bg-gradient-to-b from-[#15191F] via-[#1A202A] to-[#15191F] text-slate-100 border-t border-[#2E3744] relative overflow-hidden text-center px-4">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#D8B85A]/10 rounded-full blur-[140px] pointer-events-none" />
          
          <div className="max-w-3xl mx-auto relative z-10 space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#D8B85A] inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D8B85A]/10 border border-[#D8B85A]/30">
              <Sparkles className="w-3.5 h-3.5 text-[#D8B85A]" />
              Cardápio Sob Medida para Seu Evento
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              Monte o Cardápio do Seu Evento
            </h2>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#D8B85A] to-transparent mx-auto my-2" />
            <p className="text-xs sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed font-light">
              Acesse nossa página exclusiva do montador para escolher entradas, assados na brasa, guarnições, sobremesas e bebidas. Receba sua proposta detalhada direto no WhatsApp!
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToBuilder) {
                    onNavigateToBuilder();
                  } else {
                    window.location.hash = '#cardapio-evento';
                  }
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider bg-gradient-to-r from-[#D8B85A] via-[#E8D58A] to-[#D8B85A] text-[#15191F] shadow-[0_4px_25px_rgba(216,184,90,0.35)] hover:shadow-[0_6px_35px_rgba(216,184,90,0.55)] hover:scale-102 active:scale-98 transition-all cursor-pointer group"
              >
                <Utensils className="w-4 h-4 text-[#15191F]" />
                <span>Montar Cardápio de Evento Agora</span>
                <ArrowRight className="w-4 h-4 text-[#15191F] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <p className="text-[11px] text-[#E8D58A] font-medium pt-2">
              ✦ Já incluso: garçons uniformizados, prataria, taças, rechauds e talheres.
            </p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <BuffetFooter
        company={company}
        onOpenAdmin={handleOpenAdminTrigger}
        onScrollToSection={scrollTo}
        onNavigateToBuilder={onNavigateToBuilder}
      />

      {/* Floating WhatsApp Button */}
      <BuffetFloatingWhatsApp
        company={company}
      />

      {/* Admin Login Modal */}
      <BuffetAdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

    </div>
  );
}
