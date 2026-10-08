import React, { useState, useMemo } from 'react';
import { 
  Crown, Calendar, Users, Sparkles, MessageCircle, 
  Send, Wine, Utensils, HeartHandshake, CheckCircle2, 
  ChevronRight, Check, Plus, Camera, Flame, Salad, 
  Cake, ConciergeBell, Info, ArrowRight, ShieldCheck,
  CheckCircle, Sparkle
} from 'lucide-react';
import { ElShaddayLogo, GoldFiligree } from '../buffet/components/ElShaddayLogo';
import { 
  INITIAL_BUFFET_CATEGORIES, 
  RESERVED_BUFFET_PHOTOS, 
  INITIAL_EVENT_TYPES 
} from '../buffet/buffetData';

export function BuffetSection({ onExploreFullBuffet }) {
  // Category tab filter (or show all in flyer layout)
  const [activeTab, setActiveTab] = useState('todos');

  // Selected item IDs array
  const [selectedItemIds, setSelectedItemIds] = useState(() => {
    try {
      const saved = localStorage.getItem('el_shadday_selected_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

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

  // Toggle item selection
  const handleToggleItem = (itemId) => {
    setSelectedItemIds(prev => {
      const updated = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
      
      try {
        localStorage.setItem('el_shadday_selected_items', JSON.stringify(updated));
      } catch (e) {}

      return updated;
    });
  };

  // Select all or clear items in a category
  const handleSelectAllCategory = (categoryId) => {
    const cat = INITIAL_BUFFET_CATEGORIES.find(c => c.id === categoryId);
    if (!cat) return;
    const itemIds = cat.items.map(i => i.id);
    setSelectedItemIds(prev => {
      const merged = Array.from(new Set([...prev, ...itemIds]));
      try {
        localStorage.setItem('el_shadday_selected_items', JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });
  };

  const handleClearCategory = (categoryId) => {
    const cat = INITIAL_BUFFET_CATEGORIES.find(c => c.id === categoryId);
    if (!cat) return;
    const catItemIds = new Set(cat.items.map(i => i.id));
    setSelectedItemIds(prev => {
      const filtered = prev.filter(id => !catItemIds.has(id));
      try {
        localStorage.setItem('el_shadday_selected_items', JSON.stringify(filtered));
      } catch (e) {}
      return filtered;
    });
  };

  // Group selected items by category
  const selectedGrouped = useMemo(() => {
    const groups = [];
    INITIAL_BUFFET_CATEGORIES.forEach(cat => {
      const matched = cat.items.filter(item => selectedItemIds.includes(item.id));
      if (matched.length > 0) {
        groups.push({
          categoryName: cat.name,
          categoryId: cat.id,
          items: matched
        });
      }
    });
    return groups;
  }, [selectedItemIds]);

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

    let msg = `👑 *SOLICITAÇÃO DE ORÇAMENTO - BUFFET EL SHADDAY*\n`;
    msg += `----------------------------------------\n`;
    msg += `👤 *Cliente:* ${formData.name.trim()}\n`;
    msg += `📱 *WhatsApp:* ${formData.phone.trim()}\n`;
    msg += `🎉 *Tipo de Evento:* ${formData.eventType}\n`;
    msg += `👥 *Nº de Convidados:* ${formData.guestCount || 'A combinar'} pessoas\n`;
    msg += `📅 *Data Prevista:* ${formData.eventDate ? formData.eventDate : 'A combinar'}\n`;
    if (formData.notes && formData.notes.trim()) {
      msg += `📝 *Observações:* ${formData.notes.trim()}\n`;
    }
    msg += `----------------------------------------\n\n`;

    if (selectedGrouped.length > 0) {
      msg += `🍽️ *CARDÁPIO SELECIONADO PELO CLIENTE:*\n\n`;
      selectedGrouped.forEach(group => {
        msg += `*${group.categoryName.toUpperCase()}:*\n`;
        group.items.forEach(item => {
          msg += `  • ${item.name}\n`;
        });
        msg += `\n`;
      });
      msg += `✨ *Estrutura Inclusa:* Garçons, Prataria, Taças, Rechauds e Talheres.\n`;
    } else {
      msg += `*(Cliente deseja receber a proposta completa com sugestões de cardápio)*\n\n`;
      msg += `✨ *Estrutura Inclusa:* Garçons, Prataria, Taças, Rechauds e Talheres.\n`;
    }

    msg += `----------------------------------------\n`;
    msg += `Olá! Gostaria de receber um orçamento personalizado para o meu evento!`;

    const encoded = encodeURIComponent(msg);
    const whatsappUrl = `https://wa.me/5569992228682?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  // Helper icons for categories
  const getCategoryIcon = (catId) => {
    switch (catId) {
      case 'acompanhamentos':
        return <Salad className="w-5 h-5 text-emerald-400" />;
      case 'prato_principal':
        return <Utensils className="w-5 h-5 text-amber-400" />;
      case 'sobremesas':
        return <Cake className="w-5 h-5 text-pink-400" />;
      case 'entradas':
        return <ConciergeBell className="w-5 h-5 text-yellow-400" />;
      case 'bebidas':
        return <Wine className="w-5 h-5 text-sky-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-brand-gold" />;
    }
  };

  return (
    <section id="buffet-section" className="relative py-16 lg:py-24 bg-gradient-to-b from-dark-950 via-[#0e1219] to-dark-950 border-t-2 border-brand-gold/40 overflow-hidden">
      
      {/* Background Gold Ambient Glows */}
      <div className="absolute top-1/6 left-1/4 w-[35rem] h-[35rem] bg-brand-gold/8 rounded-full blur-[140px] pointer-events-none -z-0"></div>
      <div className="absolute bottom-1/4 right-10 w-[30rem] h-[30rem] bg-amber-600/8 rounded-full blur-[130px] pointer-events-none -z-0"></div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        
        {/* 1. Header do Buffet El Shadday */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="flex justify-center mb-3">
            <ElShaddayLogo size="md" variant="horizontal" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-gold/15 border border-brand-gold/40 text-brand-goldLight text-xs font-bold uppercase tracking-widest mb-3 shadow-[0_0_15px_rgba(216,184,90,0.2)]">
            <Crown className="w-4 h-4 text-brand-gold" />
            <span>Serviços de Buffet de Alta Gastronomia</span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
            Monte o Cardápio do Seu Evento
          </h2>

          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            Selecione com um toque os pratos que você deseja para o seu evento. 
            Nossa equipe cuida de toda a montagem, empratamento e atendimento de alto padrão.
          </p>

          <GoldFiligree className="my-5" />

          {/* Dica de usabilidade interativa */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-dark-900/90 border border-brand-gold/30 text-amber-200 text-xs sm:text-sm font-semibold shadow-md">
            <span className="text-base animate-bounce">👆</span>
            <span>Toque nos pratos abaixo para selecionar suas opções favoritas:</span>
          </div>
        </div>

        {/* 2. BANNER DE DESTAQUE: JÁ INCLUSO NO BUFFET (Conforme panfleto oficial) */}
        <div className="mb-12 rounded-3xl bg-gradient-to-r from-dark-900 via-[#181d26] to-dark-900 border-2 border-brand-gold/50 p-5 sm:p-7 shadow-[0_15px_40px_rgba(0,0,0,0.6)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto mb-5">
            <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-[0.3em] text-brand-gold block">
              Comodidade & Excelência Absoluta
            </span>
            <h3 className="font-display text-lg sm:text-2xl font-black text-white mt-1">
              ✦ JÁ INCLUSO GARÇONS, PRATARIA, TAÇAS, RECHAUDS E TALHERES ✦
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Estrutura física completa e serviço de garçons para você não se preocupar com nada.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 text-center">
            <div className="p-3 rounded-2xl bg-dark-950/80 border border-brand-gold/20 flex flex-col items-center gap-2 hover:border-brand-gold/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center font-bold">
                🤵
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Garçons Treinados</h4>
                <p className="text-[10px] text-slate-400">Equipe uniformizada e ágil</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-dark-950/80 border border-brand-gold/20 flex flex-col items-center gap-2 hover:border-brand-gold/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center font-bold">
                🍽️
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Prataria Nobre</h4>
                <p className="text-[10px] text-slate-400">Louças finas e higienizadas</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-dark-950/80 border border-brand-gold/20 flex flex-col items-center gap-2 hover:border-brand-gold/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center font-bold">
                🍷
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Taças de Cristal</h4>
                <p className="text-[10px] text-slate-400">Para todas as bebidas servidas</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-dark-950/80 border border-brand-gold/20 flex flex-col items-center gap-2 hover:border-brand-gold/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center font-bold">
                🍲
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Rechauds Térmicos</h4>
                <p className="text-[10px] text-slate-400">Mantém tudo quente e no ponto</p>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-dark-950/80 border border-brand-gold/20 flex flex-col items-center gap-2 hover:border-brand-gold/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center font-bold">
                🍴
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Talheres Completos</h4>
                <p className="text-[10px] text-slate-400">Inox polido e elegante</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. BARRA DE FILTRO POR CATEGORIA (ESPELHO DO FLYER) */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          <button
            onClick={() => setActiveTab('todos')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'todos'
                ? 'bg-gradient-to-r from-brand-gold to-amber-500 text-dark-950 shadow-[0_4px_15px_rgba(216,184,90,0.35)]'
                : 'bg-dark-900 text-slate-300 border border-dark-800 hover:border-brand-gold/40'
            }`}
          >
            ✦ Cardápio Completo
          </button>

          {INITIAL_BUFFET_CATEGORIES.map(cat => {
            const isCurrent = activeTab === cat.id;
            const countInCat = cat.items.filter(i => selectedItemIds.includes(i.id)).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-gradient-to-r from-brand-gold to-amber-500 text-dark-950 shadow-[0_4px_15px_rgba(216,184,90,0.35)]'
                    : 'bg-dark-900 text-slate-300 border border-dark-800 hover:border-brand-gold/40'
                }`}
              >
                <span>{cat.name}</span>
                {countInCat > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isCurrent ? 'bg-dark-950 text-brand-gold' : 'bg-brand-gold text-dark-950'
                  }`}>
                    {countInCat}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* CONTADOR DE SELEÇÃO RÁPIDO */}
        {selectedItemIds.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-brand-gold/15 border-2 border-brand-gold/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-gold text-dark-950 font-black flex items-center justify-center text-base shadow-md">
                {selectedItemIds.length}
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">
                  {selectedItemIds.length === 1 ? '1 item selecionado' : `${selectedItemIds.length} itens selecionados para o seu cardápio`}
                </h4>
                <p className="text-xs text-amber-200">
                  Preencha os dados abaixo e envie tudo formatado pelo WhatsApp!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setSelectedItemIds([]);
                  try { localStorage.removeItem('el_shadday_selected_items'); } catch(e){}
                }}
                className="px-3 py-1.5 rounded-xl bg-dark-900 hover:bg-dark-800 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Limpar Tudo
              </button>
              <a
                href="#buffet-orcamento-form"
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Finalizar Orçamento</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* 4. AS CATEGORIAS DO CARDÁPIO (ACOMPANHAMENTOS, PRATO PRINCIPAL, SOBREMESA, ENTRADA, BEBIDAS) */}
        <div className="space-y-10">
          {INITIAL_BUFFET_CATEGORIES.map(category => {
            if (activeTab !== 'todos' && activeTab !== category.id) return null;

            const selectedInCat = category.items.filter(i => selectedItemIds.includes(i.id)).length;
            const isAllSelected = selectedInCat === category.items.length;

            return (
              <div 
                key={category.id} 
                className="rounded-3xl bg-dark-900/90 border border-brand-gold/30 p-5 sm:p-7 shadow-xl space-y-5"
              >
                
                {/* Header da Categoria */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-dark-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-dark-950 border border-brand-gold/30 flex items-center justify-center shadow-inner">
                      {getCategoryIcon(category.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-xl sm:text-2xl font-black text-white">
                          {category.name}
                        </h3>
                        {category.badge && (
                          <span className="px-2.5 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold text-[10px] font-extrabold uppercase tracking-wider border border-brand-gold/30">
                            {category.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  {/* Ações rápidas da categoria */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => isAllSelected ? handleClearCategory(category.id) : handleSelectAllCategory(category.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-dark-950 hover:bg-dark-800 border border-dark-750 hover:border-brand-gold/40 text-[11px] font-extrabold text-brand-gold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {isAllSelected ? (
                        <>
                          <span>Desmarcar Todos</span>
                        </>
                      ) : (
                        <>
                          <span>Selecionar Todos ({category.items.length})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Grid dos Pratos da Categoria - Super Clicáveis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {category.items.map(item => {
                    const isSelected = selectedItemIds.includes(item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleItem(item.id)}
                        className={`w-full text-left p-4 rounded-2xl transition-all duration-200 cursor-pointer flex items-start gap-3.5 relative overflow-hidden group select-none ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500/20 via-brand-gold/15 to-dark-900 border-2 border-brand-gold shadow-[0_4px_20px_rgba(216,184,90,0.25)] ring-1 ring-brand-gold/50 scale-[1.01]'
                            : 'bg-dark-950/70 hover:bg-dark-950 border border-dark-800 hover:border-brand-gold/50 text-slate-300'
                        }`}
                      >
                        {/* Checkbox Icon - Grande e Visível */}
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                          isSelected
                            ? 'bg-brand-gold text-dark-950 shadow-md scale-110'
                            : 'border-2 border-slate-600 group-hover:border-brand-gold text-transparent'
                        }`}>
                          <Check className={`w-4 h-4 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                        </div>

                        {/* Detalhes do Prato */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-extrabold transition-colors leading-snug ${
                              isSelected ? 'text-white' : 'text-slate-200 group-hover:text-brand-goldLight'
                            }`}>
                              {item.name}
                            </h4>

                            {item.isAssado && (
                              <span className="px-2 py-0.2 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-black uppercase">
                                Assados
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {item.desc}
                          </p>

                          {/* Indicador de toque fácil */}
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${
                              isSelected ? 'text-brand-gold' : 'text-slate-500 group-hover:text-slate-400'
                            }`}>
                              {isSelected ? '✓ Incluído no seu buffet' : '+ Toque para incluir'}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>

        {/* 5. ESPAÇO RESERVADO PARA AS FOTOS DO BUFFET (Conforme pedido pelo cliente) */}
        <div className="mt-16 pt-12 border-t border-brand-gold/20">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-xs font-bold uppercase tracking-wider mb-2">
              <Camera className="w-3.5 h-3.5" />
              <span>Espaço Reservado • Fotos do Buffet</span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-black text-white">
              Estrutura & Apresentação dos Nossos Eventos
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Conheça a elegância das nossas mesas, rechauds térmicos, prataria e taças de alto padrão.
            </p>
          </div>

          {/* Grid com as fotos reservadas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {RESERVED_BUFFET_PHOTOS.map((foto) => (
              <div 
                key={foto.id} 
                className="rounded-3xl bg-dark-900 border border-brand-gold/30 overflow-hidden shadow-xl hover:border-brand-gold transition-all duration-300 group flex flex-col"
              >
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-dark-950">
                  <img 
                    src={foto.url} 
                    alt={foto.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent"></div>

                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-dark-950/80 backdrop-blur-md text-brand-gold border border-brand-gold/40 text-[10px] font-black uppercase tracking-wider">
                    {foto.tag}
                  </span>

                  <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-dark-950/90 text-[10px] text-slate-300 border border-dark-800">
                    📸 El Shadday Buffet
                  </span>
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-display font-extrabold text-base text-white group-hover:text-brand-gold transition-colors">
                      {foto.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {foto.subtitle}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-dark-800 flex items-center justify-between text-[11px] text-amber-200/80">
                    <span className="flex items-center gap-1 font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                      Incluso no orçamento
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">100% Completo</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <span className="text-xs text-slate-400 italic">
              ✨ Galeria oficial em atualização com as fotos reais dos eventos da El Shadday.
            </span>
          </div>
        </div>

        {/* 6. FORMULÁRIO DE ORÇAMENTO COM WHATSAPP (COM OS PRATOS ESCOLHIDOS) */}
        <div id="buffet-orcamento-form" className="mt-16 pt-12 border-t border-brand-gold/30">
          <div className="bg-dark-900 border-2 border-brand-gold/60 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-2xl mx-auto text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">
                Orçamento Direto e Personalizado
              </span>
              <h3 className="text-2xl sm:text-3xl font-display font-black text-white mt-1">
                Solicite sua Proposta de Buffet via WhatsApp
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {selectedItemIds.length > 0 
                  ? `Seu pedido já inclui os ${selectedItemIds.length} pratos selecionados acima! Preencha os detalhes e receba a proposta detalhada:`
                  : `Preencha os dados do seu evento abaixo para gerarmos a proposta no WhatsApp da nossa equipe:`}
              </p>
            </div>

            {/* Resumo visual dos itens selecionados */}
            {selectedGrouped.length > 0 && (
              <div className="mb-6 p-4 rounded-2xl bg-dark-950 border border-brand-gold/40">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold block mb-2">
                  Pratos que você marcou para o cardápio:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedGrouped.map(group => 
                    group.items.map(item => (
                      <span 
                        key={item.id} 
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-dark-900 border border-brand-gold/30 text-white text-xs font-medium"
                      >
                        <Check className="w-3 h-3 text-brand-gold" />
                        <span>{item.name}</span>
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-medium text-center">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitQuote} className="space-y-4 max-w-3xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Seu Nome Completo *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: João Ferreira"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 focus:border-brand-gold text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none transition-colors"
                    required
                  />
                </div>

                {/* Telefone / WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Seu WhatsApp para Contato *
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex: (69) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 focus:border-brand-gold text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Tipo de Evento */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Tipo do Evento
                  </label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 focus:border-brand-gold text-white text-xs sm:text-sm focus:outline-none transition-colors"
                  >
                    {INITIAL_EVENT_TYPES.map((type) => (
                      <option key={type} value={type} className="bg-dark-950 text-white">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Convidados */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nº de Convidados (Estimado)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 150 convidados"
                    value={formData.guestCount}
                    onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 focus:border-brand-gold text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Data */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Data Prevista (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 focus:border-brand-gold text-white text-xs sm:text-sm focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Observações ou Pedidos Especiais (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Local do evento (chácara, salão, etc.) ou alguma preferência específica..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 focus:border-brand-gold text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none transition-colors resize-none"
                ></textarea>
              </div>

              {/* Botão Gigante de Envio para o WhatsApp */}
              <button
                type="submit"
                className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-sm sm:text-base shadow-[0_4px_25px_rgba(16,185,129,0.35)] transition-all duration-300 hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-3 cursor-pointer"
              >
                <MessageCircle className="w-6 h-6" />
                <span>
                  {selectedItemIds.length > 0 
                    ? `Enviar Orçamento no WhatsApp (${selectedItemIds.length} Itens Selecionados)`
                    : 'Enviar Solicitação de Orçamento pelo WhatsApp'}
                </span>
              </button>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-center text-[11px] text-slate-400">
                <span>✦ Resposta ágil pela nossa equipe de eventos de Ariquemes e região.</span>

                {onExploreFullBuffet && (
                  <button
                    type="button"
                    onClick={onExploreFullBuffet}
                    className="text-brand-gold hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver Apresentação Institucional Completa</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>

          </div>
        </div>

      </div>

    </section>
  );
}
