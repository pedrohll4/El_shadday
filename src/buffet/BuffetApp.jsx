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
import { BuffetBuilder } from './components/BuffetBuilder';
import { BuffetFooter } from './components/BuffetFooter';
import { BuffetFloatingWhatsApp } from './components/BuffetFloatingWhatsApp';
import { BuffetAdminLoginModal } from './components/BuffetAdminLoginModal';
import { BuffetAdminDashboard } from './components/BuffetAdminDashboard';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { dispatchConfigSync } from '../services/configSyncService';

export function BuffetApp({ currentAppMode, onToggleAppMode }) {
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
      if (e?.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setGalleryPhotos(e.detail);
      } else {
        const stored = getStoredBuffetGallery();
        if (stored && stored.length > 0) {
          setGalleryPhotos(stored);
        }
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
              if (cleanCs.length > 0) {
                console.log('[BuffetApp] Galeria carregada de company_settings:', cleanCs.length, 'itens');
                setGalleryPhotos(cleanCs);
                saveStoredBuffetGallery(cleanCs);
              }
            }
          });
      };

      // 1. Carrega fotos da tabela buffet_gallery
      supabase
        .from('buffet_gallery')
        .select('*')
        .order('position', { ascending: true })
        .then(({ data, error }) => {
          if (!error && Array.isArray(data)) {
            const clean = data.filter(p => !isFakeGalleryItem(p));
            if (clean.length > 0) {
              console.log('[BuffetApp] Galeria carregada de buffet_gallery:', clean.length, 'itens');
              setGalleryPhotos(clean);
              saveStoredBuffetGallery(clean);
            } else {
              console.log('[BuffetApp] buffet_gallery vazia, tentando company_settings...');
              loadFromCompanySettings();
            }
          } else {
            console.warn('[BuffetApp] Erro ao buscar buffet_gallery:', error?.message);
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
                if (clean.length > 0) {
                  setGalleryPhotos(clean);
                  saveStoredBuffetGallery(clean);
                }
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
        onNavigateToBuilder={() => scrollTo('montador')}
      />

      {/* Hero Section */}
      <BuffetHero
        company={company}
        onScrollToBuilder={() => scrollTo('montador')}
        onScrollToAbout={() => scrollTo('quem-somos')}
      />

      {/* Main Content Areas */}
      <main className="flex-1">
        
        {/* Section 1: Quem Somos */}
        <BuffetAbout
          company={company}
          onScrollToBuilder={() => scrollTo('montador')}
        />

        {/* Section 2: Como Funciona */}
        <BuffetHowItWorks
          onScrollToBuilder={() => scrollTo('montador')}
        />

        {/* Section 3: O que Servimos / Cardápio Preview */}
        <BuffetMenuPreview
          categories={categories}
          onScrollToBuilder={() => scrollTo('montador')}
        />

        {/* Section 3.1: Galeria de Fotos Dinâmica com Carrossel */}
        <BuffetGallery galleryItems={galleryPhotos} />

        {/* Section 4: Montador de Orçamento (Principal Funcionalidade) */}
        <BuffetBuilder
          company={company}
          categories={categories}
          eventTypes={eventTypes}
          onQuoteSent={() => updateSelectedCount()}
        />

      </main>

      {/* Footer */}
      <BuffetFooter
        company={company}
        onOpenAdmin={handleOpenAdminTrigger}
        onScrollToSection={scrollTo}
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
