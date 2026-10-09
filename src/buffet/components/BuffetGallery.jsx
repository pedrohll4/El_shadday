import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Camera, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Maximize2, 
  X, 
  LayoutGrid, 
  SlidersHorizontal,
  Flame,
  UtensilsCrossed,
  Wine,
  ConciergeBell,
  Cake,
  Eye
} from 'lucide-react';
import { GoldFiligree } from './ElShaddayLogo';
import { 
  GALLERY_CATEGORIES, 
  INITIAL_BUFFET_GALLERY, 
  getStoredBuffetGallery 
} from '../buffetData';

const CATEGORY_ICONS = {
  all: Camera,
  churrasco: Flame,
  rechauds: UtensilsCrossed,
  prataria: Wine,
  entradas: ConciergeBell,
  sobremesas: Cake,
  equipe: Sparkles
};

export function BuffetGallery({ galleryItems }) {
  // Use passed gallery items or read from localStorage
  const photos = useMemo(() => {
    if (galleryItems !== undefined && Array.isArray(galleryItems)) return galleryItems;
    return getStoredBuffetGallery();
  }, [galleryItems]);

  // Active Category Filter
  const [activeCategory, setActiveCategory] = useState('all');

  // Filtered Photos List
  const filteredPhotos = useMemo(() => {
    if (activeCategory === 'all') return photos;
    return photos.filter(p => p.category === activeCategory);
  }, [photos, activeCategory]);

  // Current Slide Index in Carousel
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotation state
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);

  // View Mode: 'carousel' (default, compact & dynamic) | 'grid' (all at once)
  const [viewMode, setViewMode] = useState('carousel');

  // Lightbox Modal State
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Reset index when category changes
  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
  }, [activeCategory]);

  // Autoplay Timer (3.5 seconds with progress bar)
  useEffect(() => {
    if (!isAutoPlaying || isHovered || filteredPhotos.length <= 1 || viewMode !== 'carousel') {
      return;
    }

    const intervalMs = 3500;
    const stepMs = 50;
    const stepPercent = (stepMs / intervalMs) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setCurrentIndex(curr => (curr + 1) % filteredPhotos.length);
          return 0;
        }
        return prev + stepPercent;
      });
    }, stepMs);

    return () => clearInterval(timer);
  }, [isAutoPlaying, isHovered, filteredPhotos.length, viewMode]);

  // Navigation Handlers
  const handlePrev = () => {
    setProgress(0);
    setCurrentIndex(curr => (curr - 1 + filteredPhotos.length) % filteredPhotos.length);
  };

  const handleNext = () => {
    setProgress(0);
    setCurrentIndex(curr => (curr + 1) % filteredPhotos.length);
  };

  // Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') {
        setLightboxIndex(curr => (curr - 1 + filteredPhotos.length) % filteredPhotos.length);
      }
      if (e.key === 'ArrowRight') {
        setLightboxIndex(curr => (curr + 1) % filteredPhotos.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, filteredPhotos.length]);

  // Active current photo
  const currentPhoto = filteredPhotos[currentIndex] || filteredPhotos[0];

  // Calculate 3 visible items for desktop carousel
  const visiblePhotos = useMemo(() => {
    if (filteredPhotos.length === 0) return [];
    if (filteredPhotos.length <= 3) return filteredPhotos;

    const prevIndex = (currentIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
    const nextIndex = (currentIndex + 1) % filteredPhotos.length;

    return [
      { item: filteredPhotos[prevIndex], position: 'prev', index: prevIndex },
      { item: filteredPhotos[currentIndex], position: 'current', index: currentIndex },
      { item: filteredPhotos[nextIndex], position: 'next', index: nextIndex }
    ];
  }, [filteredPhotos, currentIndex]);

  return (
    <section id="galeria" className="py-16 sm:py-24 bg-[#11151B] text-slate-100 border-b border-[#2E3744] relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-[#D8B85A]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D8B85A]/10 border border-[#D8B85A]/30 text-[#E8D58A] text-xs font-bold uppercase tracking-wider mb-2">
            <Camera className="w-3.5 h-3.5 text-[#D8B85A]" />
            <span>Galeria Dinâmica • Buffet El Shadday</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-white mt-1">
            Estrutura, Mesas & Sabores
          </h2>

          <GoldFiligree width="w-36 sm:w-48" className="mt-2 mb-3" />

          <p className="text-sm sm:text-base text-slate-300 font-light max-w-xl mx-auto">
            Acompanhe em detalhes a apresentação e o cuidado que levamos para casamentos, formaturas e eventos especiais.
          </p>

          <div className="mt-4">
            <a
              href="#/admin"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#181E27] hover:bg-[#202733] border border-[#D8B85A]/40 text-[#E8D58A] hover:text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
              title="Acessar o painel para adicionar ou excluir fotos"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#D8B85A]" />
              <span>Painel de Fotos: Adicionar / Remover Fotos</span>
            </a>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
          {GALLERY_CATEGORIES.map(cat => {
            const isCatActive = activeCategory === cat.id;
            const Icon = CATEGORY_ICONS[cat.id] || Camera;
            const count = cat.id === 'all' 
              ? photos.length 
              : photos.filter(p => p.category === cat.id).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 border ${
                  isCatActive
                    ? 'bg-gradient-to-r from-[#D8B85A] to-[#B3913A] text-[#11151B] font-bold border-[#D8B85A] shadow-[0_4px_16px_rgba(216,184,90,0.35)] scale-105'
                    : 'bg-[#181E27] text-slate-300 hover:text-white border-[#2A3442] hover:border-[#D8B85A]/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isCatActive ? 'text-[#11151B]' : 'text-[#D8B85A]'}`} />
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isCatActive ? 'bg-[#11151B]/20 text-[#11151B]' : 'bg-[#11151B] text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode & Autoplay Control Bar */}
        <div className="flex items-center justify-between gap-3 mb-6 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">
              Exibindo <strong className="text-[#E8D58A]">{filteredPhotos.length}</strong> {filteredPhotos.length === 1 ? 'foto' : 'fotos'}
            </span>

            {viewMode === 'carousel' && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-[#D8B85A] bg-[#D8B85A]/10 border border-[#D8B85A]/25 px-2.5 py-0.5 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Muda automaticamente a cada 3,5s
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Play/Pause Button */}
            {viewMode === 'carousel' && (
              <button
                type="button"
                onClick={() => setIsAutoPlaying(prev => !prev)}
                className="px-2.5 py-1.5 rounded-lg bg-[#181E27] hover:bg-[#202734] border border-[#2A3442] text-xs text-slate-300 hover:text-[#E8D58A] transition-colors flex items-center gap-1.5 cursor-pointer"
                title={isAutoPlaying ? "Pausar rotação automática" : "Ativar rotação automática"}
              >
                {isAutoPlaying ? <Pause className="w-3.5 h-3.5 text-[#D8B85A]" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                <span className="hidden sm:inline text-[11px]">{isAutoPlaying ? 'Pausar' : 'Rodar'}</span>
              </button>
            )}

            {/* Toggle Grid/Carousel */}
            <button
              type="button"
              onClick={() => setViewMode(curr => curr === 'carousel' ? 'grid' : 'carousel')}
              className="px-3 py-1.5 rounded-lg bg-[#181E27] hover:bg-[#202734] border border-[#2A3442] text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {viewMode === 'carousel' ? (
                <>
                  <LayoutGrid className="w-3.5 h-3.5 text-[#D8B85A]" />
                  <span className="text-[11px]">Ver em Grade</span>
                </>
              ) : (
                <>
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#D8B85A]" />
                  <span className="text-[11px]">Ver em Carrossel</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================
            ESTADO VAZIO: QUANDO TODAS AS FOTOS FORAM REMOVIDAS
        ======================================================== */}
        {filteredPhotos.length === 0 && (
          <div className="py-16 text-center bg-[#181E27]/50 rounded-3xl border border-[#2A3442] p-8 max-w-lg mx-auto my-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-[#D8B85A]/15 text-[#D8B85A] flex items-center justify-center mx-auto mb-4 border border-[#D8B85A]/30">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl font-normal text-white">Galeria em Atualização</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Novas fotos dos nossos eventos estão sendo preparadas. Solicite fotos e vídeos recentes diretamente pelo nosso WhatsApp!
            </p>
          </div>
        )}

        {/* ========================================================
            MODO 1: CARROSSEL ROTATIVO COM AUTOPLAY (PADRÃO)
            Não vira testão! Ocupa altura fixa e elegante
        ======================================================== */}
        {viewMode === 'carousel' && currentPhoto && (
          <div 
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setIsHovered(false)}
          >
            {/* Progress line */}
            <div className="w-full h-1 bg-[#1E2530] rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-gradient-to-r from-[#D8B85A] to-[#E8D58A] transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Main Stage: Desktop 3-Card Panoramic View / Mobile 1-Card Focus */}
            <div className="hidden md:grid grid-cols-12 gap-4 items-center">
              
              {/* Left/Prev Preview Card */}
              {visiblePhotos[0] && (
                <div 
                  onClick={() => {
                    handlePrev();
                  }}
                  className="col-span-3 rounded-2xl overflow-hidden bg-[#181E27] border border-[#2A3442] opacity-50 hover:opacity-80 transition-all duration-300 cursor-pointer h-72 relative group"
                >
                  <img 
                    src={visiblePhotos[0].item.url} 
                    alt={visiblePhotos[0].item.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#11151B] via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 text-[11px] font-bold text-slate-300 truncate max-w-[85%]">
                    {visiblePhotos[0].item.title}
                  </span>
                </div>
              )}

              {/* Center Highlighted Card */}
              {visiblePhotos[1] && (
                <div 
                  onClick={() => setLightboxIndex(visiblePhotos[1].index)}
                  className="col-span-6 rounded-3xl overflow-hidden bg-[#181E27] border-2 border-[#D8B85A] shadow-[0_0_35px_rgba(216,184,90,0.25)] h-96 relative group cursor-pointer transition-all duration-300"
                >
                  <img 
                    src={visiblePhotos[1].item.url} 
                    alt={visiblePhotos[1].item.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#11151B] via-[#11151B]/30 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-[#11151B]/85 backdrop-blur-md text-[#E8D58A] border border-[#D8B85A]/40 text-xs font-bold uppercase tracking-wider">
                      {visiblePhotos[1].item.tag || "El Shadday Buffet"}
                    </span>

                    <button
                      type="button"
                      className="w-9 h-9 rounded-full bg-[#11151B]/80 hover:bg-[#D8B85A] text-slate-300 hover:text-[#11151B] flex items-center justify-center transition-colors border border-[#2E3744]"
                      title="Ver em tela cheia"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bottom Captions */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-white group-hover:text-[#E8D58A] transition-colors leading-snug">
                      {visiblePhotos[1].item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {visiblePhotos[1].item.subtitle}
                    </p>

                    <div className="mt-3 pt-3 border-t border-[#2E3744]/80 flex items-center justify-between text-xs text-[#E8D58A]">
                      <span className="flex items-center gap-1 font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-[#D8B85A]" />
                        Toque na imagem para ampliar
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {visiblePhotos[1].index + 1} / {filteredPhotos.length}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Right/Next Preview Card */}
              {visiblePhotos[2] && (
                <div 
                  onClick={() => {
                    handleNext();
                  }}
                  className="col-span-3 rounded-2xl overflow-hidden bg-[#181E27] border border-[#2A3442] opacity-50 hover:opacity-80 transition-all duration-300 cursor-pointer h-72 relative group"
                >
                  <img 
                    src={visiblePhotos[2].item.url} 
                    alt={visiblePhotos[2].item.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#11151B] via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 text-[11px] font-bold text-slate-300 truncate max-w-[85%]">
                    {visiblePhotos[2].item.title}
                  </span>
                </div>
              )}

            </div>

            {/* Mobile Single Card View */}
            <div className="md:hidden">
              <div 
                onClick={() => setLightboxIndex(currentIndex)}
                className="rounded-2xl overflow-hidden bg-[#181E27] border-2 border-[#D8B85A] shadow-xl h-80 relative group cursor-pointer"
              >
                <img 
                  src={currentPhoto.url} 
                  alt={currentPhoto.title}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#11151B] via-[#11151B]/40 to-transparent" />

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-[#11151B]/85 text-[#E8D58A] border border-[#D8B85A]/40 text-[10px] font-bold uppercase tracking-wider">
                    {currentPhoto.tag || "Buffet El Shadday"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#11151B]/80 text-[10px] font-bold text-slate-300 border border-[#2E3744]">
                    {currentIndex + 1} de {filteredPhotos.length}
                  </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-serif text-lg font-bold text-white leading-snug">
                    {currentPhoto.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {currentPhoto.subtitle}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#E8D58A] mt-2 font-semibold">
                    <Eye className="w-3.5 h-3.5" />
                    Toque para ver em tela cheia
                  </span>
                </div>
              </div>
            </div>

            {/* Carousel Navigation Buttons & Dots Bar */}
            <div className="mt-6 flex items-center justify-between gap-4">
              {/* Prev Button */}
              <button
                type="button"
                onClick={handlePrev}
                className="w-11 h-11 rounded-2xl bg-[#181E27] hover:bg-[#D8B85A] text-[#E8D58A] hover:text-[#11151B] border border-[#D8B85A]/40 flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer hover:scale-105 active:scale-95"
                title="Foto anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Indicator Dots (Show subset if many photos) */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-md py-2 scrollbar-none">
                {filteredPhotos.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setProgress(0);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === currentIndex 
                        ? 'w-7 bg-gradient-to-r from-[#D8B85A] to-[#E8D58A]' 
                        : 'w-2 bg-[#2E3744] hover:bg-slate-500'
                    }`}
                    title={`Ir para foto ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={handleNext}
                className="w-11 h-11 rounded-2xl bg-[#181E27] hover:bg-[#D8B85A] text-[#E8D58A] hover:text-[#11151B] border border-[#D8B85A]/40 flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer hover:scale-105 active:scale-95"
                title="Próxima foto"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

          </div>
        )}

        {/* ========================================================
            MODO 2: GRADE COMPLETA (OPÇÃO EXPANSÍVEL)
        ======================================================== */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {filteredPhotos.map((foto, index) => (
              <div 
                key={foto.id}
                onClick={() => setLightboxIndex(index)}
                className="rounded-2xl bg-[#181E27] border border-[#2E3744] hover:border-[#D8B85A] overflow-hidden shadow-xl transition-all duration-300 group flex flex-col cursor-pointer hover:-translate-y-1"
              >
                <div className="relative h-56 w-full overflow-hidden bg-[#202630]">
                  <img 
                    src={foto.url} 
                    alt={foto.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181E27] via-[#181E27]/20 to-transparent" />

                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#11151B]/80 backdrop-blur-md text-[#E8D58A] border border-[#D8B85A]/40 text-[10px] font-bold uppercase tracking-wider">
                    {foto.tag}
                  </span>

                  <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-[#11151B]/90 text-[10px] text-slate-300 border border-[#2E3744]">
                    📸 #{index + 1}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-serif text-lg font-bold text-white group-hover:text-[#E8D58A] transition-colors">
                      {foto.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {foto.subtitle}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#2E3744] flex items-center justify-between text-[11px] text-[#E8D58A]">
                    <span className="flex items-center gap-1 font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-[#D8B85A]" />
                      Incluso no evento
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold group-hover:text-white">Ver foto</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Reminder */}
        <div className="mt-12 text-center">
          <p className="text-xs text-slate-400 italic">
            ✦ Espaço pronto para receber todas as 49 fotos oficiais do Buffet El Shadday. Editáveis via painel de controle.
          </p>
        </div>

      </div>

      {/* ========================================================
          MODAL LIGHTBOX (TELA CHEIA COM NAVEGAÇÃO)
      ======================================================== */}
      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
        <div 
          className="fixed inset-0 z-50 bg-[#0B0D11]/95 backdrop-blur-lg flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setLightboxIndex(null)}
        >
          <div 
            className="relative max-w-5xl w-full max-h-[95vh] flex flex-col bg-[#15191F] border border-[#D8B85A]/50 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="p-4 px-6 border-b border-[#2E3744] flex items-center justify-between bg-[#11151B]">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-[#D8B85A]/15 border border-[#D8B85A]/40 text-[#E8D58A] text-xs font-bold uppercase tracking-wider">
                  {filteredPhotos[lightboxIndex].tag}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {lightboxIndex + 1} de {filteredPhotos.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="w-9 h-9 rounded-full bg-[#202630] hover:bg-rose-950/50 hover:text-rose-300 text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-[#2E3744]"
                title="Fechar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Stage with Prev/Next buttons */}
            <div className="relative flex-1 bg-black/40 min-h-[300px] sm:min-h-[480px] max-h-[65vh] flex items-center justify-center overflow-hidden">
              <img 
                src={filteredPhotos[lightboxIndex].url} 
                alt={filteredPhotos[lightboxIndex].title}
                className="max-h-full max-w-full object-contain mx-auto select-none"
              />

              {/* Prev in Modal */}
              <button
                type="button"
                onClick={() => setLightboxIndex(curr => (curr - 1 + filteredPhotos.length) % filteredPhotos.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#11151B]/80 hover:bg-[#D8B85A] text-white hover:text-[#11151B] border border-[#D8B85A]/40 flex items-center justify-center transition-all cursor-pointer shadow-xl"
                title="Anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Next in Modal */}
              <button
                type="button"
                onClick={() => setLightboxIndex(curr => (curr + 1) % filteredPhotos.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#11151B]/80 hover:bg-[#D8B85A] text-white hover:text-[#11151B] border border-[#D8B85A]/40 flex items-center justify-center transition-all cursor-pointer shadow-xl"
                title="Próxima"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Bottom Caption */}
            <div className="p-4 sm:p-5 bg-[#181E27] border-t border-[#2E3744] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                  {filteredPhotos[lightboxIndex].title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  {filteredPhotos[lightboxIndex].subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] text-slate-400">
                  Use as setas do teclado (← e →) para navegar
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

    </section>
  );
}
