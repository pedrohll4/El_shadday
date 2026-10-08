import React, { useState, useMemo, useEffect } from 'react';
import { GoldFiligree, ElShaddayLogo } from './ElShaddayLogo';
import { 
  Check, 
  UtensilsCrossed, 
  Flame, 
  Sparkles, 
  Salad, 
  Wine, 
  Cake, 
  ConciergeBell, 
  Calendar, 
  Users, 
  MapPin, 
  MessageSquare, 
  User, 
  Phone, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Copy, 
  Send, 
  RotateCcw,
  Sparkle,
  Info
} from 'lucide-react';
import { saveQuoteToHistory } from '../buffetData';

// Category icon map helper
const CATEGORY_ICONS = {
  acompanhamentos: Salad,
  prato_principal: UtensilsCrossed,
  carnes: UtensilsCrossed,
  churrasco: Flame,
  pratos_especiais: Sparkles,
  entradas: ConciergeBell,
  sobremesas: Cake,
  bebidas: Wine
};

export function BuffetBuilder({ 
  company, 
  categories = [], 
  eventTypes = [],
  onQuoteSent
}) {
  // Current active step: 'selection' (1) | 'details' (2) | 'summary' (3)
  const [currentStep, setCurrentStep] = useState('selection');
  
  // Active category filter tab in selection step
  const [activeCategoryTab, setActiveCategoryTab] = useState(categories[0]?.id || 'acompanhamentos');

  // Selected items stored as an array of item IDs
  const [selectedItemIds, setSelectedItemIds] = useState(() => {
    try {
      const saved = localStorage.getItem('el_shadday_selected_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Save selected items to localStorage so client never loses selection on refresh
  useEffect(() => {
    try {
      localStorage.setItem('el_shadday_selected_items', JSON.stringify(selectedItemIds));
    } catch (e) {}
  }, [selectedItemIds]);

  // Event details state
  const [eventDetails, setEventDetails] = useState(() => {
    try {
      const saved = localStorage.getItem('el_shadday_event_details');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      nome: '',
      whatsapp: '',
      tipoEvento: eventTypes[0] || 'Casamento',
      dataEvento: '',
      convidados: '100',
      localEvento: '',
      observacoes: ''
    };
  });

  // Save event details to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('el_shadday_event_details', JSON.stringify(eventDetails));
    } catch (e) {}
  }, [eventDetails]);

  // Validation warning state
  const [validationErrors, setValidationErrors] = useState({});
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Toggle item selection
  const handleToggleItem = (itemId) => {
    setSelectedItemIds(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  // Select all or clear category
  const handleSelectAllInCategory = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return;
    const catItemIds = cat.items.filter(i => i.active !== false).map(i => i.id);
    setSelectedItemIds(prev => {
      const combined = new Set([...prev, ...catItemIds]);
      return Array.from(combined);
    });
  };

  const handleClearCategory = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return;
    const catItemIds = new Set(cat.items.map(i => i.id));
    setSelectedItemIds(prev => prev.filter(id => !catItemIds.has(id)));
  };

  // Group selected items by category for review
  const selectedByCategory = useMemo(() => {
    const result = [];
    categories.forEach(cat => {
      const catSelected = cat.items.filter(item => selectedItemIds.includes(item.id) && item.active !== false);
      if (catSelected.length > 0) {
        result.push({
          category: cat,
          items: catSelected
        });
      }
    });
    return result;
  }, [categories, selectedItemIds]);

  const totalSelectedCount = selectedItemIds.length;

  // Format date DD/MM/YYYY
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return 'A definir';
    try {
      const [year, month, day] = dateStr.split('-');
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  // Validation before going to summary
  const handleProceedToSummary = () => {
    const errors = {};
    if (!eventDetails.nome.trim()) {
      errors.nome = 'Por favor, informe seu nome ou o responsável pelo evento.';
    }
    if (!eventDetails.whatsapp.trim()) {
      errors.whatsapp = 'Por favor, informe um número de WhatsApp para contato.';
    }
    if (!eventDetails.convidados || parseInt(eventDetails.convidados) <= 0) {
      errors.convidados = 'Informe a estimativa de convidados.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setCurrentStep('summary');
    window.location.hash = '#montador';
    const montadorEl = document.getElementById('montador');
    if (montadorEl) montadorEl.scrollIntoView({ behavior: 'smooth' });
  };

  // Build the official WhatsApp message according to Prompt requirement #16
  const generateWhatsAppMessage = () => {
    let msg = `Olá, ${company.shortName || 'El Shadday'}! Gostaria de solicitar um orçamento para meu evento.\n\n`;
    
    msg += `*DADOS DO EVENTO*\n`;
    msg += `👤 *Responsável:* ${eventDetails.nome || 'Não informado'}\n`;
    msg += `📱 *WhatsApp:* ${eventDetails.whatsapp || 'Não informado'}\n`;
    msg += `🎉 *Tipo de Evento:* ${eventDetails.tipoEvento || 'Geral'}\n`;
    msg += `📅 *Data:* ${formatDisplayDate(eventDetails.dataEvento)}\n`;
    msg += `👥 *Convidados:* ${eventDetails.convidados || '0'} pessoas\n`;
    msg += `📍 *Local:* ${eventDetails.localEvento || 'A definir / Ariquemes'}\n\n`;

    msg += `*ITENS SELECIONADOS*\n`;

    if (selectedByCategory.length === 0) {
      msg += `(Nenhum item fixo pré-selecionado, gostaria de receber as opções de cardápio)\n\n`;
    } else {
      selectedByCategory.forEach(group => {
        let icon = '•';
        if (group.category.id === 'carnes') icon = '🥩';
        else if (group.category.id === 'churrasco') icon = '🔥';
        else if (group.category.id === 'pratos_especiais') icon = '🍲';
        else if (group.category.id === 'acompanhamentos') icon = '🥗';
        else if (group.category.id === 'bebidas') icon = '🥤';
        else if (group.category.id === 'sobremesas') icon = '🍰';
        else if (group.category.id === 'entradas') icon = '🥟';

        msg += `${icon} *${group.category.name}:*\n`;
        group.items.forEach(item => {
          msg += `- ${item.name}\n`;
        });
        msg += `\n`;
      });
    }

    if (eventDetails.observacoes && eventDetails.observacoes.trim()) {
      msg += `*Observações:*\n${eventDetails.observacoes.trim()}\n\n`;
    }

    msg += `Gostaria de saber também sobre a disponibilidade para essa data.\n`;
    msg += `Aguardo o orçamento. Obrigado!`;

    return msg;
  };

  // Send to WhatsApp handler
  const handleSendToWhatsApp = () => {
    const message = generateWhatsAppMessage();
    const phone = company.phone ? company.phone.replace(/\D/g, '') : '5569992000000';
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    // Store in history
    const quoteRecord = {
      id: 'quote_' + Date.now(),
      createdAt: new Date().toISOString(),
      cliente: eventDetails.nome,
      whatsapp: eventDetails.whatsapp,
      tipoEvento: eventDetails.tipoEvento,
      dataEvento: eventDetails.dataEvento,
      convidados: eventDetails.convidados,
      local: eventDetails.localEvento,
      observacoes: eventDetails.observacoes,
      totalItens: totalSelectedCount,
      itens: selectedByCategory.map(g => ({
        categoria: g.category.name,
        itens: g.items.map(i => i.name)
      }))
    };
    saveQuoteToHistory(quoteRecord);

    if (onQuoteSent) onQuoteSent(quoteRecord);

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
  };

  // Copy message to clipboard helper
  const handleCopyMessage = () => {
    const msg = generateWhatsAppMessage();
    navigator.clipboard.writeText(msg);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  // Current category for selection step
  const activeCategoryObj = categories.find(c => c.id === activeCategoryTab) || categories[0];

  return (
    <section id="montador" className="py-16 sm:py-24 bg-[#15191F] text-slate-100 border-b border-[#2E3744] relative">
      
      {/* Background subtle gold glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#D8B85A]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#D8B85A]">
            Experiência Personalizada
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-white mt-2">
            Monte seu evento
          </h2>
          <GoldFiligree width="w-40 sm:w-56" className="mt-2 mb-3" />
          <p className="text-sm sm:text-base text-slate-300 font-light">
            Selecione os itens que deseja incluir no seu orçamento. Ao final, enviaremos tudo organizado no seu WhatsApp.
          </p>
        </div>

        {/* Stepper Navigation Indicator */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-between relative">
            
            {/* Step 1 Pill */}
            <button
              onClick={() => setCurrentStep('selection')}
              className={`flex-1 flex flex-col items-center gap-2 p-2 rounded-xl transition-all cursor-pointer ${
                currentStep === 'selection' 
                  ? 'text-[#E8D58A]' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-serif font-bold text-sm transition-all ${
                currentStep === 'selection'
                  ? 'bg-[#D8B85A] text-[#15191F] shadow-[0_0_15px_rgba(216,184,90,0.5)] scale-110'
                  : totalSelectedCount > 0 
                    ? 'bg-[#202630] border border-[#D8B85A] text-[#E8D58A]'
                    : 'bg-[#202630] border border-[#2E3744] text-slate-400'
              }`}>
                {totalSelectedCount > 0 && currentStep !== 'selection' ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className="text-xs uppercase tracking-wider font-semibold text-center">
                1. Escolha os Itens
              </span>
              {totalSelectedCount > 0 && (
                <span className="text-[10px] text-[#D8B85A] font-bold bg-[#D8B85A]/15 px-2 py-0.5 rounded-full">
                  {totalSelectedCount} selecionados
                </span>
              )}
            </button>

            {/* Connecting Line 1 */}
            <div className={`w-8 sm:w-16 h-[2px] transition-colors ${
              totalSelectedCount > 0 ? 'bg-[#D8B85A]/60' : 'bg-[#2E3744]'
            }`} />

            {/* Step 2 Pill */}
            <button
              onClick={() => {
                if (totalSelectedCount === 0) {
                  // Allow proceeding anyway, but give friendly tip
                }
                setCurrentStep('details');
              }}
              className={`flex-1 flex flex-col items-center gap-2 p-2 rounded-xl transition-all cursor-pointer ${
                currentStep === 'details' 
                  ? 'text-[#E8D58A]' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-serif font-bold text-sm transition-all ${
                currentStep === 'details'
                  ? 'bg-[#D8B85A] text-[#15191F] shadow-[0_0_15px_rgba(216,184,90,0.5)] scale-110'
                  : eventDetails.nome 
                    ? 'bg-[#202630] border border-[#D8B85A] text-[#E8D58A]'
                    : 'bg-[#202630] border border-[#2E3744] text-slate-400'
              }`}>
                {eventDetails.nome && currentStep !== 'details' ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <span className="text-xs uppercase tracking-wider font-semibold text-center">
                2. Dados do Evento
              </span>
            </button>

            {/* Connecting Line 2 */}
            <div className={`w-8 sm:w-16 h-[2px] transition-colors ${
              currentStep === 'summary' ? 'bg-[#D8B85A]/60' : 'bg-[#2E3744]'
            }`} />

            {/* Step 3 Pill */}
            <button
              onClick={handleProceedToSummary}
              className={`flex-1 flex flex-col items-center gap-2 p-2 rounded-xl transition-all cursor-pointer ${
                currentStep === 'summary' 
                  ? 'text-[#E8D58A]' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-serif font-bold text-sm transition-all ${
                currentStep === 'summary'
                  ? 'bg-[#D8B85A] text-[#15191F] shadow-[0_0_15px_rgba(216,184,90,0.5)] scale-110'
                  : 'bg-[#202630] border border-[#2E3744] text-slate-400'
              }`}>
                3
              </div>
              <span className="text-xs uppercase tracking-wider font-semibold text-center">
                3. Revisar & WhatsApp
              </span>
            </button>

          </div>
        </div>

        {/* STEP 1: ITEM SELECTION */}
        {currentStep === 'selection' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Category Tabs Pill Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none sm:justify-center">
              {categories.map(category => {
                const IconComponent = CATEGORY_ICONS[category.id] || UtensilsCrossed;
                const isCurrent = activeCategoryTab === category.id;
                const countSelectedInCat = category.items.filter(i => selectedItemIds.includes(i.id)).length;

                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategoryTab(category.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      isCurrent
                        ? 'bg-gradient-to-r from-[#D8B85A] via-[#E8D58A] to-[#D8B85A] text-[#15191F] shadow-[0_4px_18px_rgba(216,184,90,0.35)] scale-105'
                        : 'bg-[#1A202A] text-slate-300 hover:text-white border border-[#2E3744] hover:border-[#D8B85A]/40'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${isCurrent ? 'text-[#15191F]' : 'text-[#D8B85A]'}`} />
                    <span>{category.name}</span>
                    {countSelectedInCat > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        isCurrent 
                          ? 'bg-[#15191F] text-[#E8D58A]' 
                          : 'bg-[#D8B85A] text-[#15191F]'
                      }`}>
                        {countSelectedInCat}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Category Header with Quick Actions */}
            {activeCategoryObj && (
              <div className="rounded-2xl bg-[#1A202A] border border-[#2E3744] p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2E3744]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                        {activeCategoryObj.name}
                      </h3>
                      {activeCategoryObj.badge && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#D8B85A]/15 text-[#E8D58A] border border-[#D8B85A]/30">
                          {activeCategoryObj.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      {activeCategoryObj.description || "Clique nos cards abaixo para selecionar os itens que deseja em seu buffet."}
                    </p>
                  </div>

                  {/* Quick Select/Clear Helpers */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSelectAllInCategory(activeCategoryObj.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#202630] hover:bg-[#283241] border border-[#2E3744] text-[11px] font-semibold text-[#E8D58A] transition-colors cursor-pointer"
                    >
                      Selecionar Todos
                    </button>
                    <button
                      onClick={() => handleClearCategory(activeCategoryObj.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#202630] hover:bg-[#283241] border border-[#2E3744] text-[11px] font-semibold text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {/* Specific Note for Moqueca / Acompanhamentos according to prompt requirements */}
                {activeCategoryObj.id === 'pratos_especiais' && (
                  <div className="mt-3 py-2 px-3 rounded-lg bg-[#D8B85A]/10 border border-[#D8B85A]/25 text-xs text-[#E8D58A] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 flex-shrink-0 text-[#D8B85A]" />
                    <span>A <strong>Moqueca</strong> é preparada como prato especial exclusivo para enriquecer sua mesa.</span>
                  </div>
                )}

                {activeCategoryObj.id === 'acompanhamentos' && (
                  <div className="mt-3 py-2 px-3 rounded-lg bg-[#202630] border border-[#2E3744] text-xs text-slate-300 flex items-center gap-2">
                    <Info className="w-4 h-4 flex-shrink-0 text-[#D8B85A]" />
                    <span>Opções consagradas: <strong>Vatapá</strong>, <strong>Farofa Tradicional</strong> e <strong>Farofa Tropeiro</strong>, além de guarnições frescas.</span>
                  </div>
                )}

                {/* Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {activeCategoryObj.items
                    .filter(item => item.active !== false)
                    .map(item => {
                      const isSelected = selectedItemIds.includes(item.id);

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggleItem(item.id)}
                          className={`relative rounded-xl p-4 sm:p-5 transition-all duration-300 cursor-pointer select-none group ${
                            isSelected
                              ? 'bg-gradient-to-b from-[#202630] to-[#1C232E] border-2 border-[#D8B85A] shadow-[0_0_20px_rgba(216,184,90,0.25)] -translate-y-1'
                              : 'bg-[#15191F] border border-[#2E3744] hover:border-[#D8B85A]/50 hover:bg-[#1A202A]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className={`font-serif text-base sm:text-lg font-bold transition-colors ${
                                  isSelected ? 'text-[#E8D58A]' : 'text-slate-100 group-hover:text-[#E8D58A]'
                                }`}>
                                  {item.name}
                                </h4>
                              </div>
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                {item.desc}
                              </p>
                            </div>

                            {/* Checkbox Indicator */}
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                              isSelected
                                ? 'bg-gradient-to-br from-[#D8B85A] to-[#B3913A] text-[#15191F] shadow-[0_2px_10px_rgba(216,184,90,0.4)] scale-105'
                                : 'border border-[#2E3744] group-hover:border-[#D8B85A]/60 bg-[#202630] text-transparent'
                            }`}>
                              <Check className={`w-4 h-4 stroke-[3] ${isSelected ? 'text-[#15191F]' : 'opacity-0'}`} />
                            </div>
                          </div>

                          {/* Bottom Selection Status */}
                          <div className="mt-4 pt-2.5 border-t border-[#2E3744]/70 flex items-center justify-between text-[11px]">
                            <span className={isSelected ? 'text-[#E8D58A] font-bold' : 'text-slate-400'}>
                              {isSelected ? '✓ Selecionado no Orçamento' : 'Toque para incluir'}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                              {activeCategoryObj.name}
                            </span>
                          </div>

                        </div>
                      );
                    })}
                </div>

              </div>
            )}

            {/* Bottom Step 1 Action Bar */}
            <div className="rounded-2xl bg-[#1A202A] border border-[#D8B85A]/30 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-11 h-11 rounded-xl bg-[#D8B85A]/15 border border-[#D8B85A]/30 flex items-center justify-center text-[#E8D58A] flex-shrink-0">
                  <UtensilsCrossed className="w-5 h-5 text-[#D8B85A]" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-slate-100">
                    {totalSelectedCount > 0 
                      ? `${totalSelectedCount} itens selecionados no cardápio`
                      : 'Nenhum item selecionado ainda'
                    }
                  </h4>
                  <p className="text-xs text-slate-400">
                    Você pode selecionar quantos itens desejar antes de avançar para os dados do evento.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep('details')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-[#D8B85A] via-[#E8D58A] to-[#D8B85A] text-[#15191F] shadow-[0_4px_20px_rgba(216,184,90,0.3)] hover:shadow-[0_6px_28px_rgba(216,184,90,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Avançar: Dados do Evento</span>
                <ArrowRight className="w-4 h-4 text-[#15191F]" />
              </button>
            </div>

          </div>
        )}

        {/* STEP 2: EVENT DETAILS */}
        {currentStep === 'details' && (
          <div className="max-w-3xl mx-auto animate-fadeIn space-y-6">
            
            <div className="rounded-2xl bg-[#1A202A] border border-[#2E3744] p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              
              <div className="pb-5 border-b border-[#2E3744] mb-6">
                <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#D8B85A]">
                  Etapa 02 de 03
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
                  Sobre o seu evento
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Informe os dados básicos para que a equipe do El Shadday calcule a quantidade ideal e organize seu atendimento.
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-5">
                
                {/* Nome do Responsável */}
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-slate-200 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#D8B85A]" />
                    <span>Nome do Responsável <strong className="text-rose-400">*</strong></span>
                  </label>
                  <input
                    type="text"
                    value={eventDetails.nome}
                    onChange={(e) => setEventDetails({ ...eventDetails, nome: e.target.value })}
                    placeholder="Ex: Pedro de Alcântara"
                    className={`w-full px-4 py-3 rounded-xl bg-[#15191F] border text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#D8B85A] transition-all ${
                      validationErrors.nome ? 'border-rose-500' : 'border-[#2E3744] focus:border-[#D8B85A]'
                    }`}
                  />
                  {validationErrors.nome && (
                    <p className="text-[11px] text-rose-400 mt-1">{validationErrors.nome}</p>
                  )}
                </div>

                {/* WhatsApp & Tipo de Evento (2 cols) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* WhatsApp */}
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#D8B85A]" />
                      <span>WhatsApp de Contato <strong className="text-rose-400">*</strong></span>
                    </label>
                    <input
                      type="tel"
                      value={eventDetails.whatsapp}
                      onChange={(e) => setEventDetails({ ...eventDetails, whatsapp: e.target.value })}
                      placeholder="(69) 99999-9999"
                      className={`w-full px-4 py-3 rounded-xl bg-[#15191F] border text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#D8B85A] transition-all ${
                        validationErrors.whatsapp ? 'border-rose-500' : 'border-[#2E3744] focus:border-[#D8B85A]'
                      }`}
                    />
                    {validationErrors.whatsapp && (
                      <p className="text-[11px] text-rose-400 mt-1">{validationErrors.whatsapp}</p>
                    )}
                  </div>

                  {/* Tipo de Evento */}
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#D8B85A]" />
                      <span>Tipo de Evento</span>
                    </label>
                    <select
                      value={eventDetails.tipoEvento}
                      onChange={(e) => setEventDetails({ ...eventDetails, tipoEvento: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#15191F] border border-[#2E3744] text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#D8B85A] focus:border-[#D8B85A] transition-all cursor-pointer"
                    >
                      {eventTypes.map((type, idx) => (
                        <option key={idx} value={type} className="bg-[#15191F] text-slate-100">
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* Data do Evento & Número de Convidados (2 cols) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Data do Evento */}
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#D8B85A]" />
                      <span>Data Prevista do Evento</span>
                    </label>
                    <input
                      type="date"
                      value={eventDetails.dataEvento}
                      onChange={(e) => setEventDetails({ ...eventDetails, dataEvento: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 rounded-xl bg-[#15191F] border border-[#2E3744] text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#D8B85A] focus:border-[#D8B85A] transition-all"
                    />
                  </div>

                  {/* Número de Convidados */}
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#D8B85A]" />
                      <span>Número de Convidados (Estimado) <strong className="text-rose-400">*</strong></span>
                    </label>
                    <input
                      type="number"
                      min="10"
                      step="5"
                      value={eventDetails.convidados}
                      onChange={(e) => setEventDetails({ ...eventDetails, convidados: e.target.value })}
                      placeholder="Ex: 100"
                      className={`w-full px-4 py-3 rounded-xl bg-[#15191F] border text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#D8B85A] transition-all ${
                        validationErrors.convidados ? 'border-rose-500' : 'border-[#2E3744] focus:border-[#D8B85A]'
                      }`}
                    />
                    {validationErrors.convidados && (
                      <p className="text-[11px] text-rose-400 mt-1">{validationErrors.convidados}</p>
                    )}
                  </div>

                </div>

                {/* Local do Evento */}
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-slate-200 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#D8B85A]" />
                    <span>Local / Cidade do Evento</span>
                  </label>
                  <input
                    type="text"
                    value={eventDetails.localEvento}
                    onChange={(e) => setEventDetails({ ...eventDetails, localEvento: e.target.value })}
                    placeholder="Ex: Ariquemes - Chácara dos Ipês, Salão Paroquial..."
                    className="w-full px-4 py-3 rounded-xl bg-[#15191F] border border-[#2E3744] text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#D8B85A] focus:border-[#D8B85A] transition-all"
                  />
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-slate-200 mb-1.5 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#D8B85A]" />
                    <span>Observações ou Pedidos Especiais</span>
                  </label>
                  <textarea
                    rows={3}
                    value={eventDetails.observacoes}
                    onChange={(e) => setEventDetails({ ...eventDetails, observacoes: e.target.value })}
                    placeholder="Conte um pouco mais sobre o seu evento, preferências, horários ou dúvidas..."
                    className="w-full px-4 py-3 rounded-xl bg-[#15191F] border border-[#2E3744] text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#D8B85A] focus:border-[#D8B85A] transition-all resize-y"
                  />
                </div>

              </div>

              {/* Navigation CTAs */}
              <div className="mt-8 pt-5 border-t border-[#2E3744] flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={() => setCurrentStep('selection')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold text-slate-300 hover:text-white bg-[#202630] border border-[#2E3744] hover:border-[#D8B85A]/40 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar aos Itens</span>
                </button>

                <button
                  onClick={handleProceedToSummary}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-[#D8B85A] via-[#E8D58A] to-[#D8B85A] text-[#15191F] shadow-[0_4px_20px_rgba(216,184,90,0.3)] hover:shadow-[0_6px_28px_rgba(216,184,90,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>Revisar Orçamento</span>
                  <ArrowRight className="w-4 h-4 text-[#15191F]" />
                </button>
              </div>

            </div>

          </div>
        )}

        {/* STEP 3: SUMMARY & WHATSAPP CONVERSION */}
        {currentStep === 'summary' && (
          <div className="max-w-3xl mx-auto animate-fadeIn space-y-6">
            
            {/* The Formal Quote Preview Card */}
            <div className="rounded-2xl bg-gradient-to-b from-[#1C232E] to-[#15191F] border-2 border-[#D8B85A]/40 p-6 sm:p-8 shadow-[0_15px_45px_rgba(0,0,0,0.7)] relative overflow-hidden">
              
              {/* Subtle top crest glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-[#D8B85A]/10 rounded-full blur-2xl pointer-events-none" />

              {/* Card Header with Logo */}
              <div className="text-center pb-6 border-b border-[#2E3744] relative">
                <ElShaddayLogo variant="badge" size="sm" />
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-2">
                  Confira seu orçamento
                </h3>
                <GoldFiligree width="w-32 sm:w-44" className="mt-1 mb-2" />
                <p className="text-xs text-slate-300">
                  Revise sua proposta antes de enviar. O atendimento responderá pelo WhatsApp com a cotação exata.
                </p>
              </div>

              {/* Event Metadata Banner */}
              <div className="my-6 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#202630] border border-[#2E3744] rounded-xl p-4 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Evento</span>
                  <strong className="text-xs sm:text-sm text-[#E8D58A] font-serif block mt-0.5">{eventDetails.tipoEvento}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Data</span>
                  <strong className="text-xs sm:text-sm text-slate-100 block mt-0.5">{formatDisplayDate(eventDetails.dataEvento)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Convidados</span>
                  <strong className="text-xs sm:text-sm text-[#E8D58A] block mt-0.5">{eventDetails.convidados} pessoas</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Local</span>
                  <strong className="text-xs sm:text-sm text-slate-100 block mt-0.5 truncate">{eventDetails.localEvento || 'Ariquemes'}</strong>
                </div>
              </div>

              {/* Responsável & WhatsApp line */}
              <div className="mb-6 px-4 py-2.5 rounded-lg bg-[#15191F] border border-[#2E3744] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[#D8B85A]" />
                  <span className="text-slate-400">Responsável:</span>
                  <strong className="text-slate-200">{eventDetails.nome}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#D8B85A]" />
                  <span className="text-slate-400">Contato:</span>
                  <strong className="text-slate-200">{eventDetails.whatsapp}</strong>
                </div>
              </div>

              {/* Selected Items Grouped by Category */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-bold tracking-[0.2em] text-[#D8B85A] flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-[#D8B85A]" />
                  <span>Itens Selecionados no Cardápio</span>
                </h4>

                {selectedByCategory.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#202630] border border-[#2E3744] text-center text-xs text-slate-400">
                    Nenhum item específico selecionado. Enviaremos o cardápio completo pelo WhatsApp.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedByCategory.map(group => (
                      <div key={group.category.id} className="p-3.5 rounded-xl bg-[#15191F] border border-[#2E3744]">
                        <h5 className="font-serif text-xs font-bold text-[#E8D58A] pb-1.5 border-b border-[#2E3744] flex items-center justify-between">
                          <span>{group.category.name}</span>
                          <span className="text-[10px] text-slate-400 font-sans font-normal">{group.items.length} itens</span>
                        </h5>
                        <ul className="mt-2 space-y-1">
                          {group.items.map(item => (
                            <li key={item.id} className="text-xs text-slate-200 flex items-center gap-1.5">
                              <Check className="w-3 h-3 text-[#D8B85A] flex-shrink-0" />
                              <span>{item.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Observações block */}
                {eventDetails.observacoes && (
                  <div className="p-3.5 rounded-xl bg-[#15191F] border border-[#2E3744] text-xs">
                    <span className="text-slate-400 block font-semibold mb-1">Observações do cliente:</span>
                    <p className="text-slate-200 italic">{eventDetails.observacoes}</p>
                  </div>
                )}

              </div>

              {/* Differential reminder badge */}
              <div className="mt-6 pt-4 border-t border-[#2E3744] bg-[#202630]/60 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-4 text-center">
                <p className="text-xs text-[#E8D58A] font-semibold tracking-wider">
                  ✦ {company.bannerIncluso || "JÁ INCLUSO GARÇONS, PRATARIA, TAÇAS, RECHAUDS E TALHERES"}
                </p>
              </div>

            </div>

            {/* Bottom Actions: Edit Selection & Send via WhatsApp */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Back to Edit Button */}
              <button
                onClick={() => setCurrentStep('selection')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold text-slate-300 hover:text-white bg-[#202630] border border-[#2E3744] hover:border-[#D8B85A]/40 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>EDITAR SELEÇÃO</span>
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                
                {/* Copy Text Button */}
                <button
                  onClick={handleCopyMessage}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold text-slate-300 bg-[#1A202A] border border-[#2E3744] hover:border-slate-400 transition-all cursor-pointer"
                  title="Copiar texto da mensagem para a área de transferência"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSuccess ? '✓ Copiado!' : 'Copiar Texto'}</span>
                </button>

                {/* Primary High Conversion WhatsApp Button */}
                <button
                  onClick={handleSendToWhatsApp}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 text-slate-950 shadow-[0_4px_25px_rgba(16,185,129,0.4)] hover:shadow-[0_6px_32px_rgba(16,185,129,0.6)] hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer group"
                >
                  <Send className="w-4 h-4 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
                  <span>ENVIAR ORÇAMENTO PELO WHATSAPP</span>
                </button>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* Floating Bottom Bar on Mobile for Instant Conversion */}
      {currentStep === 'selection' && totalSelectedCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden animate-slide-up">
          <button
            onClick={() => setCurrentStep('details')}
            className="w-full bg-gradient-to-r from-[#D8B85A] via-[#E8D58A] to-[#D8B85A] text-[#15191F] p-4 rounded-2xl shadow-[0_4px_25px_rgba(216,184,90,0.5)] flex items-center justify-between font-extrabold text-xs uppercase tracking-wider cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[#15191F] text-[#E8D58A] flex items-center justify-center text-xs font-black">
                {totalSelectedCount}
              </span>
              <span>Itens Selecionados</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold">
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4 text-[#15191F]" />
            </div>
          </button>
        </div>
      )}

    </section>
  );
}
