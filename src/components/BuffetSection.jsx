import React, { useState, useMemo, useEffect } from 'react';
import { 
  Check, 
  MessageCircle, 
  ChevronRight, 
  ChevronLeft,
  Camera, 
  ArrowRight,
  ShieldCheck,
  Flame,
  Sparkles,
  Play,
  Film,
  X
} from 'lucide-react';
import { ElShaddayLogo } from '../buffet/components/ElShaddayLogo';
import { 
  INITIAL_BUFFET_CATEGORIES, 
  INITIAL_EVENT_TYPES,
  DEFAULT_CHURRASCO_OPTIONS,
  formatMeatList,
  INITIAL_BUFFET_GALLERY,
  getStoredBuffetGallery,
  saveStoredBuffetGallery,
  isFakeGalleryItem,
  getStoredBuffetCategories,
  getUnavailableBuffetItemIds
} from '../buffet/buffetData';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { isVideoUrl, getVideoPosterUrl } from '../utils/imageCompressor';

export function BuffetSection({ onExploreFullBuffet, onBackToDelivery }) {
  // Dynamic categories state (allows admin to manage & disable items)
  const [categories, setCategories] = useState(() => getStoredBuffetCategories());
  const [unavailableItemIds, setUnavailableItemIds] = useState(() => getUnavailableBuffetItemIds());

  // Listen to live category & unavailability updates across devices
  useEffect(() => {
    const handleBuffetSync = () => {
      const freshCats = getStoredBuffetCategories();
      const freshUnavail = getUnavailableBuffetItemIds();
      setCategories(freshCats);
      setUnavailableItemIds(freshUnavail);

      // Auto-prune any unavailable items from the client's current selection
      setSelectedItemIds(prev => prev.filter(id => !freshUnavail.includes(id)));
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

  // Selected item IDs array
  const [selectedItemIds, setSelectedItemIds] = useState(() => {
    try {
      const saved = localStorage.getItem('el_shadday_selected_items');
      const unavail = getUnavailableBuffetItemIds();
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(id => !unavail.includes(id));
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  // Selected churrasco meats array (Carne, Frango, Toscana, Porco Assado)
  const [selectedChurrascoMeats, setSelectedChurrascoMeats] = useState(() => {
    try {
      const saved = localStorage.getItem('el_shadday_churrasco_meats');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_CHURRASCO_OPTIONS.map(o => o.label);
  });

  // Keep localStorage updated when churrasco meats change
  useEffect(() => {
    try {
      localStorage.setItem('el_shadday_churrasco_meats', JSON.stringify(selectedChurrascoMeats));
    } catch (e) {}
  }, [selectedChurrascoMeats]);

  // Toggle specific meat in churrasco
  const handleToggleChurrascoMeat = (meatLabel) => {
    setSelectedChurrascoMeats(prev => {
      let updated;
      if (prev.includes(meatLabel)) {
        if (prev.length === 1) return prev; // Mantenha pelo menos uma opção
        updated = prev.filter(m => m !== meatLabel);
      } else {
        updated = [...prev, meatLabel];
      }
      return updated;
    });
  };

  // Sincronização em tempo real das fotos da galeria (localStorage + Supabase)
  const [galleryPhotos, setGalleryPhotos] = useState(() => getStoredBuffetGallery());

  useEffect(() => {
    // Escuta atualizações locais (cross-tab e evento custom)
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

    // ========== CARREGA GALERIA DO SUPABASE ==========
    // Estratégia: company_settings.buffet_gallery PRIMEIRO (tabela garantida),
    // depois tenta buffet_gallery (tabela dedicada) se existir.
    if (isSupabaseConfigured && supabase) {
      // 1) Busca de company_settings (SEMPRE existe)
      supabase
        .from('company_settings')
        .select('buffet_gallery')
        .eq('id', 'el_shadday_config')
        .single()
        .then(({ data: csData, error: csError }) => {
          if (!csError && Array.isArray(csData?.buffet_gallery)) {
            const cleanCs = csData.buffet_gallery.filter(p => !isFakeGalleryItem(p));
            console.log('[BuffetSection] ✅ Galeria carregada de company_settings:', cleanCs.length, 'itens');
            setGalleryPhotos(cleanCs);
            saveStoredBuffetGallery(cleanCs);
            return; // Já carregou — não precisa tentar buffet_gallery
          }
          // 2) Fallback: tenta tabela buffet_gallery (pode não existir)
          supabase
            .from('buffet_gallery')
            .select('*')
            .order('position', { ascending: true })
            .then(({ data, error }) => {
              if (!error && Array.isArray(data) && data.length > 0) {
                const clean = data.filter(p => !isFakeGalleryItem(p));
                console.log('[BuffetSection] ✅ Galeria carregada de buffet_gallery:', clean.length, 'itens');
                setGalleryPhotos(clean);
                saveStoredBuffetGallery(clean);
              }
            });
        });

      // Realtime: escuta mudanças em company_settings
      supabase
        .channel('realtime_gallery_section_cs')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'company_settings' }, () => {
          supabase
            .from('company_settings')
            .select('buffet_gallery')
            .eq('id', 'el_shadday_config')
            .single()
            .then(({ data: csData }) => {
              if (Array.isArray(csData?.buffet_gallery)) {
                const clean = csData.buffet_gallery.filter(p => !isFakeGalleryItem(p));
                setGalleryPhotos(clean);
                saveStoredBuffetGallery(clean);
              }
            });
        })
        .subscribe();

      // Realtime: escuta mudanças em buffet_gallery (se existir)
      supabase
        .channel('realtime_gallery_section_bg')
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
    }

    return () => {
      window.removeEventListener('storage', handleGallerySync);
      window.removeEventListener('buffet_gallery_updated', handleGallerySync);
    };
  }, []);

  // Rotating mini-gallery index
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    const total = galleryPhotos && galleryPhotos.length > 0 ? galleryPhotos.length : 1;
    const timer = setInterval(() => {
      setGalleryIndex(prev => (prev + 1) % total);
    }, 3500);
    return () => clearInterval(timer);
  }, [galleryPhotos]);

  // Client form data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    eventType: 'Casamento',
    guestCount: '100',
    eventDate: '',
    notes: ''
  });

  const [formError, setFormError] = useState('');

  // Toggle item selection (respects item availability)
  const handleToggleItem = (itemId) => {
    // Prevent selecting unavailable items
    if (unavailableItemIds.includes(itemId)) {
      return;
    }

    setSelectedItemIds(prev => {
      const isRemoving = prev.includes(itemId);
      const updated = isRemoving
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
      
      try {
        localStorage.setItem('el_shadday_selected_items', JSON.stringify(updated));
      } catch (e) {}

      // Se selecionou churrasco e não havia carnes marcadas, restaura todas
      if (!isRemoving && itemId === 'pp_churrasco_assados' && selectedChurrascoMeats.length === 0) {
        setSelectedChurrascoMeats(DEFAULT_CHURRASCO_OPTIONS.map(o => o.label));
      }

      return updated;
    });
  };

  // Select all or clear items in a category (only affects available items)
  const handleToggleCategory = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return;
    const availableItems = cat.items.filter(i => i.active !== false && !unavailableItemIds.includes(i.id));
    const availableIds = availableItems.map(i => i.id);
    if (availableIds.length === 0) return;

    const isAllSelected = availableIds.every(id => selectedItemIds.includes(id));

    setSelectedItemIds(prev => {
      let updated;
      if (isAllSelected) {
        // Unselect all available items in this category
        const setIds = new Set(availableIds);
        updated = prev.filter(id => !setIds.has(id));
      } else {
        // Select all available items in this category
        updated = Array.from(new Set([...prev, ...availableIds]));
      }

      try {
        localStorage.setItem('el_shadday_selected_items', JSON.stringify(updated));
      } catch (e) {}

      return updated;
    });
  };

  // Group selected items by category in correct gastronomic order
  const selectedGrouped = useMemo(() => {
    const groups = [];
    categories.forEach(cat => {
      const matched = cat.items.filter(item => selectedItemIds.includes(item.id) && item.active !== false && !unavailableItemIds.includes(item.id));
      if (matched.length > 0) {
        groups.push({
          categoryName: cat.name,
          categoryId: cat.id,
          items: matched
        });
      }
    });
    return groups;
  }, [categories, selectedItemIds, unavailableItemIds]);

  // Submit quote request directly via WhatsApp
  const handleSubmitQuote = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Por favor, informe seu nome!');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Por favor, informe seu telefone ou WhatsApp!');
      return;
    }

    setFormError('');

    let msg = `*SOLICITAÇÃO DE ORÇAMENTO - BUFFET EL SHADDAY*\n`;
    msg += `----------------------------------------\n`;
    msg += `*Cliente:* ${formData.name.trim()}\n`;
    msg += `*WhatsApp:* ${formData.phone.trim()}\n`;
    msg += `*Tipo de Evento:* ${formData.eventType}\n`;
    msg += `*Nº de Convidados:* ${formData.guestCount || 'A combinar'} pessoas\n`;
    msg += `*Data Prevista:* ${formData.eventDate ? formData.eventDate : 'A combinar'}\n`;
    if (formData.notes && formData.notes.trim()) {
      msg += `*Observações:* ${formData.notes.trim()}\n`;
    }
    msg += `----------------------------------------\n\n`;

    if (selectedGrouped.length > 0) {
      msg += `*CARDÁPIO SELECIONADO:*\n\n`;
      selectedGrouped.forEach(group => {
        msg += `*${group.categoryName.toUpperCase()}:*\n`;
        group.items.forEach(item => {
          if (item.id === 'pp_churrasco_assados' && selectedChurrascoMeats.length > 0) {
            msg += `• Churrasco (${formatMeatList(selectedChurrascoMeats)})\n`;
          } else {
            msg += `• ${item.name}\n`;
          }
        });
        msg += `\n`;
      });
      msg += `*Estrutura Inclusa:* Garçons, Prataria, Taças, Rechauds e Talheres.\n`;
    } else {
      msg += `*(Gostaria de receber a proposta com o cardápio completo)*\n\n`;
      msg += `*Estrutura Inclusa:* Garçons, Prataria, Taças, Rechauds e Talheres.\n`;
    }

    msg += `----------------------------------------\n`;
    msg += `Olá! Gostaria de receber o orçamento para o meu evento.`;

    const encoded = encodeURIComponent(msg);
    const whatsappUrl = `https://wa.me/5569992228682?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <section id="buffet-section" className="relative py-8 sm:py-16 bg-dark-950 text-slate-100">
      
      <div className="max-w-4xl mx-auto px-3 sm:px-6 relative">
        
        {/* Breadcrumb / Botão de Retorno */}
        {onBackToDelivery && (
          <div className="mb-6 flex items-center justify-between border-b border-dark-800 pb-3">
            <button
              type="button"
              onClick={onBackToDelivery}
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-brand-gold transition-colors font-bold cursor-pointer group"
            >
              <ChevronLeft className="w-4 h-4 text-brand-gold group-hover:-translate-x-1 transition-transform" />
              <span>Voltar ao Delivery de Pizzas & Lanches</span>
            </button>
            <span className="text-[11px] text-brand-gold font-bold uppercase tracking-wider hidden sm:inline">
              ✦ Proposta 100% Personalizada
            </span>
          </div>
        )}

        {/* 1. Cabeçalho Minimalista e Nobre */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <ElShaddayLogo size="md" variant="horizontal" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-gold block mb-1">
            Serviços de Buffet
          </span>

          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Monte o Cardápio do Seu Evento
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Selecione abaixo os pratos e opções desejadas para o seu evento e solicite seu orçamento direto pelo WhatsApp.
          </p>
        </div>

        {/* 2. Banner de Itens Inclusos (Padronizado com o Design Token do Site) */}
        <div className="mb-8 rounded-3xl bg-dark-900 border border-brand-gold/30 p-4 sm:p-5 text-center shadow-xl">
          <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-[0.2em] text-brand-gold block mb-1">
            Estrutura Completa de Alto Padrão
          </span>
          <h3 className="font-serif text-sm sm:text-base font-bold text-white">
            JÁ INCLUSO: GARÇONS, PRATARIA, TAÇAS, RECHAUDS E TALHERES
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
            Montagem completa, serviço de mesa e equipe uniformizada inclusos no seu evento.
          </p>

          <div className="mt-4 pt-3 border-t border-dark-750 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center flex-shrink-0 border border-brand-gold/30">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Quer ver nossa equipe e mesas montadas?</p>
                <p className="text-[11px] text-slate-400">Fotos de casamentos, formaturas e vídeos de eventos reais.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('buffet-galeria');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold hover:brightness-110 active:scale-95 text-dark-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-glow-gold cursor-pointer whitespace-nowrap"
            >
              <span>Ver Fotos & Galeria</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* 3. Cardápio na Ordem Gastronômica Correta:
            1. Entradas
            2. Prato Principal & Assados
            3. Acompanhamentos
            4. Sobremesas
            5. Bebidas
        */}
        <div className="space-y-6">
          {categories.map((category, index) => {
            const availableItems = category.items.filter(i => i.active !== false && !unavailableItemIds.includes(i.id));
            const countInCat = availableItems.filter(i => selectedItemIds.includes(i.id)).length;
            const isAllSelected = availableItems.length > 0 && availableItems.every(i => selectedItemIds.includes(i.id));

            return (
              <div 
                key={category.id}
                className="rounded-3xl bg-dark-900 border border-dark-750/90 p-4 sm:p-5 shadow-lg"
              >
                
                {/* Header da Categoria */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-dark-800">
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <span className="text-brand-gold text-xs sm:text-sm font-sans font-bold">
                        0{index + 1}.
                      </span>
                      <span>{category.name}</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {category.items.length} {category.items.length === 1 ? 'opção' : 'opções'}
                      {countInCat > 0 && ` • ${countInCat} selecionada(s)`}
                    </span>
                  </div>

                  {availableItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleToggleCategory(category.id)}
                      className="text-[11px] font-bold text-brand-gold hover:text-amber-300 px-3 py-1.5 rounded-xl bg-dark-950 border border-dark-750 hover:border-brand-gold/40 transition-all cursor-pointer"
                    >
                      {isAllSelected ? 'Desmarcar todos' : 'Marcar todos'}
                    </button>
                  )}
                </div>

                {/* Grid de Itens: Compacto, limpo e bem dimensionado no celular */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {category.items.map(item => {
                    const isUnavailable = item.active === false || item.isAvailable === false || unavailableItemIds.includes(item.id);
                    const isSelected = !isUnavailable && selectedItemIds.includes(item.id);
                    const isChurrasco = item.id === 'pp_churrasco_assados';

                    // Item Indisponível / Esgotado Temporariamente
                    if (isUnavailable) {
                      return (
                        <div
                          key={item.id}
                          className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl text-left flex items-center gap-3 select-none border bg-dark-950/60 border-rose-900/30 opacity-60 cursor-not-allowed"
                          title="Item temporariamente esgotado na cozinha."
                        >
                          <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 bg-dark-900 border border-dark-800 text-slate-600">
                            <X className="w-3.5 h-3.5" />
                          </div>

                          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                            <span className="text-xs sm:text-sm font-medium text-slate-400 line-through truncate">
                              {item.name}
                            </span>
                            <span className="flex-shrink-0 text-[10px] font-extrabold text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded-md border border-rose-500/30 flex items-center gap-1">
                              ⛔ Indisponível (Acabou)
                            </span>
                          </div>
                        </div>
                      );
                    }

                    if (isChurrasco && isSelected) {
                      return (
                        <div
                          key={item.id}
                          className="col-span-1 sm:col-span-2 rounded-2xl bg-gradient-to-br from-dark-850 to-dark-900 border-2 border-brand-gold p-3.5 sm:p-4 shadow-[0_0_20px_rgba(216,184,90,0.22)] transition-all animate-fadeIn"
                        >
                          {/* Topo do card de churrasco selecionado */}
                          <div 
                            onClick={() => handleToggleItem(item.id)}
                            className="flex items-center justify-between gap-3 cursor-pointer select-none pb-2.5 border-b border-dark-750"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-md bg-brand-gold text-dark-950 flex items-center justify-center flex-shrink-0 font-black shadow-sm">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-base font-bold text-white">
                                    {item.name}
                                  </span>
                                  <span className="flex-shrink-0 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                    Assados na Brasa
                                  </span>
                                </div>
                                <p className="text-[11px] text-amber-200 mt-0.5 font-medium">
                                  {selectedChurrascoMeats.length > 0 
                                    ? `Opções selecionadas: ${formatMeatList(selectedChurrascoMeats)}`
                                    : 'Escolha abaixo quais opções deseja incluir:'
                                  }
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleItem(item.id);
                              }}
                              className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                            >
                              Remover
                            </button>
                          </div>

                          {/* Seleção das carnes: Carne, Frango, Toscana e Porco Assado */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] sm:text-xs uppercase tracking-wider font-bold text-amber-200 flex items-center gap-1.5">
                                <Flame className="w-3.5 h-3.5 text-brand-gold" />
                                <span>Escolha se vai querer:</span>
                              </span>
                              <span className="text-[10px] text-slate-400">
                                (Marque ou desmarque)
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {DEFAULT_CHURRASCO_OPTIONS.map(opt => {
                                const isMeatSelected = selectedChurrascoMeats.includes(opt.label);
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleChurrascoMeat(opt.label);
                                    }}
                                    className={`py-2 px-2.5 sm:px-3 rounded-xl text-left transition-all flex items-center gap-2 cursor-pointer border ${
                                      isMeatSelected
                                        ? 'bg-brand-gold/15 border-brand-gold text-white font-bold shadow-sm'
                                        : 'bg-dark-950 hover:bg-dark-900 border-dark-750 text-slate-400'
                                    }`}
                                  >
                                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                                      isMeatSelected
                                        ? 'bg-brand-gold text-dark-950 font-black'
                                        : 'border border-dark-700 bg-transparent text-transparent'
                                    }`}>
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                    <span className="text-sm">{opt.icon}</span>
                                    <span className={`text-xs truncate ${
                                      isMeatSelected ? 'text-white font-bold' : 'text-slate-300'
                                    }`}>
                                      {opt.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {selectedChurrascoMeats.length === 0 && (
                              <p className="text-[11px] text-amber-400 mt-2 font-medium">
                                ⚠️ Por favor, selecione ao menos uma opção para o churrasco.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleItem(item.id)}
                        className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 flex items-center gap-3 cursor-pointer select-none border active:scale-[0.99] ${
                          isSelected
                            ? 'bg-dark-850 border-2 border-brand-gold text-white shadow-[0_0_15px_rgba(216,184,90,0.2)]'
                            : 'bg-dark-950/70 hover:bg-dark-900 border-dark-750 hover:border-brand-gold/40 text-slate-300'
                        }`}
                      >
                        {/* Checkbox limpo */}
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-brand-gold to-amber-500 text-dark-950 shadow-sm font-black'
                            : 'border border-dark-700 bg-dark-900 text-transparent'
                        }`}>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>

                        {/* Nome do Item */}
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className={`text-xs sm:text-sm font-medium leading-snug block truncate ${
                              isSelected ? 'font-bold text-white' : 'text-slate-300'
                            }`}>
                              {item.name}
                            </span>
                            {isChurrasco && (
                              <span className="text-[10px] text-slate-400 block truncate">
                                Carne, Frango, Toscana e Porco Assado
                              </span>
                            )}
                          </div>

                          {item.isAssado && (
                            <span className="flex-shrink-0 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              Assados
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>

        {/* 4. Fotos do Buffet em Destaque Rotativo (Muda Sozinho sem Virar Testão) */}
        <div id="buffet-galeria" className="mt-10 rounded-3xl bg-dark-900 border border-dark-750 p-4 sm:p-6 text-center shadow-lg scroll-mt-24">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-gold">
              <Camera className="w-4 h-4" />
              <span>Fotos do Buffet em Ação</span>
            </div>

            <span className="text-xs text-brand-gold font-semibold inline-flex items-center gap-1">
              <span>Galeria de Eventos Reais</span>
            </span>
          </div>

          <h3 className="font-serif text-base sm:text-lg font-bold text-white text-left">
            Estrutura, Prataria & Assados na Brasa
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 text-left">
            Montagem real para casamentos, formaturas e comemorações exclusivas.
          </p>

          {/* Mini Carrossel de 3 Fotos / Vídeos Rotativos */}
          {galleryPhotos && galleryPhotos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {[0, 1, 2].slice(0, Math.min(3, galleryPhotos.length)).map(offset => {
                const photoIdx = (galleryIndex + offset) % galleryPhotos.length;
                const photo = galleryPhotos[photoIdx];
                if (!photo) return null;
                const isVid = Boolean(photo.type === 'video' || isVideoUrl(photo.url));
                const poster = photo.thumbnail || getVideoPosterUrl(photo.url);

                return (
                  <div 
                    key={photo.id || offset}
                    className="group relative h-40 sm:h-44 rounded-2xl overflow-hidden bg-dark-950 border border-dark-750 hover:border-brand-gold transition-all shadow-md"
                  >
                    {isVid ? (
                      <div className="w-full h-full relative bg-black flex items-center justify-center">
                        {poster ? (
                          <img 
                            src={poster} 
                            alt={photo.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
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
                          <div className="w-9 h-9 rounded-full bg-brand-gold text-dark-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400 text-dark-950 font-black text-[9px] flex items-center gap-1 shadow-sm uppercase tracking-wider">
                          <Film className="w-2.5 h-2.5" />
                          Vídeo
                        </span>
                      </div>
                    ) : (
                      <img 
                        src={photo.url} 
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent pointer-events-none" />
                    
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-dark-950/85 text-brand-gold-light border border-brand-gold/30 text-[9px] font-bold uppercase">
                      {photo.tag || 'Buffet'}
                    </span>

                    <div className="absolute bottom-2 left-2 right-2 text-left pointer-events-none">
                      <div className="flex items-center gap-1">
                        {isVid && <Film className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                        <h5 className="font-serif text-xs font-bold text-white truncate group-hover:text-amber-200">
                          {photo.title}
                        </h5>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {photo.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 p-6 rounded-2xl bg-dark-950 border border-dark-750 text-center text-xs text-slate-400">
              Galeria em atualização • Fotos e vídeos reais dos nossos eventos disponíveis no WhatsApp!
            </div>
          )}

          {galleryPhotos && galleryPhotos.length > 0 && (
            <div className="mt-3.5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                <span>Fotos e vídeos reais que mudam automaticamente a cada 3,5s</span>
              </span>
              <span className="font-mono text-brand-gold text-[10px] font-semibold">
                Foto {((galleryIndex % galleryPhotos.length) + 1)} de {galleryPhotos.length}
              </span>
            </div>
          )}
        </div>

        {/* 5. Formulário de Orçamento Direto no WhatsApp */}
        <div id="buffet-orcamento-form" className="mt-8 rounded-3xl bg-dark-900 border border-brand-gold/40 p-4 sm:p-7 shadow-xl">
          
          <div className="text-center mb-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold block mb-1">
              Solicitar Proposta
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
              Receber Orçamento no WhatsApp
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {selectedItemIds.length > 0 
                ? `Você selecionou ${selectedItemIds.length} ${selectedItemIds.length === 1 ? 'item' : 'itens'}. Preencha os dados abaixo para receber sua proposta:`
                : `Preencha os dados básicos para receber nossa proposta completa:`}
            </p>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-center font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmitQuote} className="space-y-3.5 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl bg-dark-950 border border-dark-750 focus:border-brand-gold text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Seu WhatsApp *
                </label>
                <input
                  type="tel"
                  placeholder="(69) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl bg-dark-950 border border-dark-750 focus:border-brand-gold text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tipo de Evento
                </label>
                <select
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl bg-dark-950 border border-dark-750 focus:border-brand-gold text-white text-xs sm:text-sm focus:outline-none transition-colors"
                >
                  {INITIAL_EVENT_TYPES.map((type) => (
                    <option key={type} value={type} className="bg-dark-950 text-white">
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nº de Pessoas
                </label>
                <input
                  type="text"
                  placeholder="Ex: 100 convidados"
                  value={formData.guestCount}
                  onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl bg-dark-950 border border-dark-750 focus:border-brand-gold text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Data (Opcional)
                </label>
                <input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl bg-dark-950 border border-dark-750 focus:border-brand-gold text-white text-xs sm:text-sm focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Observações (Opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Local do evento ou alguma preferência específica..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-3 rounded-xl bg-dark-950 border border-dark-750 focus:border-brand-gold text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none transition-colors resize-none"
              ></textarea>
            </div>

            {/* Botão de Envio WhatsApp */}
            <button
              type="submit"
              className="w-full h-13 py-3.5 px-5 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] active:bg-[#1DA850] text-dark-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-md"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>
                {selectedItemIds.length > 0
                  ? `Solicitar Orçamento no WhatsApp (${selectedItemIds.length} ${selectedItemIds.length === 1 ? 'item' : 'itens'})`
                  : 'Solicitar Orçamento no WhatsApp'}
              </span>
            </button>

            <div className="flex items-center justify-center pt-2 text-[11px] text-slate-400">
              <span>Atendimento em Ariquemes e região</span>
            </div>

          </form>

        </div>

      </div>

      {/* 6. Barra Flutuante Mobile Discreta (quando há itens selecionados) */}
      {selectedItemIds.length > 0 && (
        <div className="sm:hidden fixed bottom-4 left-3 right-3 z-40 animate-fadeIn">
          <div className="bg-dark-900/95 backdrop-blur-md border border-brand-gold/50 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-brand-gold text-dark-950 font-black text-xs flex items-center justify-center shadow-sm">
                {selectedItemIds.length}
              </span>
              <span className="text-xs font-semibold text-white">
                {selectedItemIds.length === 1 ? 'item selecionado' : 'itens selecionados'}
              </span>
            </div>

            <a
              href="#buffet-orcamento-form"
              className="px-3.5 py-2 rounded-xl bg-[#25D366] text-dark-950 text-xs font-black flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
            >
              <span>Orçamento</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </a>
          </div>
        </div>
      )}

    </section>
  );
}
