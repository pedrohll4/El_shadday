import React, { useState, useMemo } from 'react';
import { 
  Check, 
  MessageCircle, 
  ChevronRight, 
  Camera, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { ElShaddayLogo } from '../buffet/components/ElShaddayLogo';
import { 
  INITIAL_BUFFET_CATEGORIES, 
  INITIAL_EVENT_TYPES 
} from '../buffet/buffetData';

export function BuffetSection({ onExploreFullBuffet }) {
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
  const handleToggleCategory = (categoryId) => {
    const cat = INITIAL_BUFFET_CATEGORIES.find(c => c.id === categoryId);
    if (!cat) return;
    const catItemIds = cat.items.map(i => i.id);
    const isAllSelected = catItemIds.every(id => selectedItemIds.includes(id));

    setSelectedItemIds(prev => {
      let updated;
      if (isAllSelected) {
        // Unselect all in this category
        const setIds = new Set(catItemIds);
        updated = prev.filter(id => !setIds.has(id));
      } else {
        // Select all in this category
        updated = Array.from(new Set([...prev, ...catItemIds]));
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
          msg += `• ${item.name}\n`;
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
    <section id="buffet-section" className="relative py-12 sm:py-20 bg-[#0E1218] border-t border-[#262F3D] text-slate-100">
      
      <div className="max-w-4xl mx-auto px-3 sm:px-6 relative">
        
        {/* 1. Cabeçalho Minimalista e Nobre */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <ElShaddayLogo size="md" variant="horizontal" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D8B85A] block mb-1">
            Serviços de Buffet
          </span>

          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Monte o Cardápio do Seu Evento
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Selecione abaixo os pratos e opções desejadas para o seu evento e solicite seu orçamento direto pelo WhatsApp.
          </p>
        </div>

        {/* 2. Banner de Itens Inclusos (Clean, sem poluição) */}
        <div className="mb-8 rounded-2xl bg-[#151B24] border border-[#D8B85A]/40 p-4 sm:p-5 text-center shadow-lg">
          <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-[0.2em] text-[#D8B85A] block mb-1">
            Estrutura Completa de Alto Padrão
          </span>
          <h3 className="font-serif text-sm sm:text-base font-bold text-white">
            JÁ INCLUSO: GARÇONS, PRATARIA, TAÇAS, RECHAUDS E TALHERES
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
            Montagem completa, serviço de mesa e equipe uniformizada inclusos no seu evento.
          </p>
        </div>

        {/* 3. Cardápio na Ordem Gastronômica Correta:
            1. Entradas
            2. Prato Principal & Assados
            3. Acompanhamentos
            4. Sobremesas
            5. Bebidas
        */}
        <div className="space-y-6">
          {INITIAL_BUFFET_CATEGORIES.map((category, index) => {
            const countInCat = category.items.filter(i => selectedItemIds.includes(i.id)).length;
            const isAllSelected = countInCat === category.items.length;

            return (
              <div 
                key={category.id}
                className="rounded-2xl bg-[#151B24] border border-[#232B36] p-4 sm:p-5 shadow-sm"
              >
                
                {/* Header da Categoria */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#232B36]">
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <span className="text-[#D8B85A] text-xs sm:text-sm font-sans font-bold">
                        0{index + 1}.
                      </span>
                      <span>{category.name}</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {category.items.length} {category.items.length === 1 ? 'opção' : 'opções'}
                      {countInCat > 0 && ` • ${countInCat} selecionada(s)`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleCategory(category.id)}
                    className="text-[11px] font-bold text-[#D8B85A] hover:text-[#E8D58A] px-2.5 py-1 rounded-lg bg-[#0E1218] border border-[#262F3D] hover:border-[#D8B85A]/50 transition-colors cursor-pointer"
                  >
                    {isAllSelected ? 'Desmarcar todos' : 'Marcar todos'}
                  </button>
                </div>

                {/* Grid de Itens: Compacto, limpo e bem dimensionado no celular */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {category.items.map(item => {
                    const isSelected = selectedItemIds.includes(item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleItem(item.id)}
                        className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-xl text-left transition-all flex items-center gap-3 cursor-pointer select-none border ${
                          isSelected
                            ? 'bg-[#1E2530] border-[#D8B85A] text-white shadow-sm'
                            : 'bg-[#0E1218]/80 hover:bg-[#0E1218] border-[#202732] hover:border-slate-600 text-slate-300'
                        }`}
                      >
                        {/* Checkbox limpo */}
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#D8B85A] text-[#0E1218]'
                            : 'border border-slate-600 bg-transparent text-transparent'
                        }`}>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>

                        {/* Nome do Item */}
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                          <span className={`text-xs sm:text-sm font-medium leading-snug truncate ${
                            isSelected ? 'font-bold text-white' : 'text-slate-300'
                          }`}>
                            {item.name}
                          </span>

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

        {/* 4. Espaço Reservado para Fotos do Buffet (Discreto e Limpo) */}
        <div className="mt-10 rounded-2xl bg-[#151B24] border border-[#232B36] p-4 sm:p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D8B85A] mb-1">
            <Camera className="w-4 h-4" />
            <span>Fotos do Buffet</span>
          </div>

          <h3 className="font-serif text-base sm:text-lg font-bold text-white">
            Estrutura & Mesas Montadas
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Espaço reservado para as fotos oficiais dos nossos eventos e montagem de mesas.
          </p>

          {/* Placeholders limpos e discretos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            <div className="h-24 sm:h-28 rounded-xl bg-[#0E1218] border border-dashed border-[#2E3744] flex flex-col items-center justify-center p-2 text-center text-slate-400">
              <span className="text-[11px] font-medium text-slate-300">Rechauds & Pratos</span>
              <span className="text-[9px] text-slate-400 mt-0.5">Fotos em breve</span>
            </div>
            <div className="h-24 sm:h-28 rounded-xl bg-[#0E1218] border border-dashed border-[#2E3744] flex flex-col items-center justify-center p-2 text-center text-slate-400">
              <span className="text-[11px] font-medium text-slate-300">Prataria & Taças</span>
              <span className="text-[9px] text-slate-400 mt-0.5">Fotos em breve</span>
            </div>
            <div className="col-span-2 sm:col-span-1 h-24 sm:h-28 rounded-xl bg-[#0E1218] border border-dashed border-[#2E3744] flex flex-col items-center justify-center p-2 text-center text-slate-400">
              <span className="text-[11px] font-medium text-slate-300">Equipe & Serviço</span>
              <span className="text-[9px] text-slate-400 mt-0.5">Fotos em breve</span>
            </div>
          </div>
        </div>

        {/* 5. Formulário de Orçamento Direto no WhatsApp */}
        <div id="buffet-orcamento-form" className="mt-8 rounded-2xl bg-[#151B24] border border-[#D8B85A]/40 p-4 sm:p-7 shadow-xl">
          
          <div className="text-center mb-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D8B85A] block mb-1">
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
                  className="w-full h-11 px-3.5 rounded-xl bg-[#0E1218] border border-[#232B36] focus:border-[#D8B85A] text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none transition-colors"
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
                  className="w-full h-11 px-3.5 rounded-xl bg-[#0E1218] border border-[#232B36] focus:border-[#D8B85A] text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none transition-colors"
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
                  className="w-full h-11 px-3.5 rounded-xl bg-[#0E1218] border border-[#232B36] focus:border-[#D8B85A] text-white text-xs sm:text-sm focus:outline-none transition-colors"
                >
                  {INITIAL_EVENT_TYPES.map((type) => (
                    <option key={type} value={type} className="bg-[#0E1218] text-white">
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
                  className="w-full h-11 px-3.5 rounded-xl bg-[#0E1218] border border-[#232B36] focus:border-[#D8B85A] text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none transition-colors"
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
                  className="w-full h-11 px-3.5 rounded-xl bg-[#0E1218] border border-[#232B36] focus:border-[#D8B85A] text-white text-xs sm:text-sm focus:outline-none transition-colors"
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
                className="w-full p-3 rounded-xl bg-[#0E1218] border border-[#232B36] focus:border-[#D8B85A] text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none transition-colors resize-none"
              ></textarea>
            </div>

            {/* Botão de Envio WhatsApp */}
            <button
              type="submit"
              className="w-full h-13 py-3.5 px-5 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] active:bg-[#1DA850] text-[#0E1218] font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-md"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>
                {selectedItemIds.length > 0
                  ? `Solicitar Orçamento no WhatsApp (${selectedItemIds.length} ${selectedItemIds.length === 1 ? 'item' : 'itens'})`
                  : 'Solicitar Orçamento no WhatsApp'}
              </span>
            </button>

            <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
              <span>Atendimento em Ariquemes e região</span>

              {onExploreFullBuffet && (
                <button
                  type="button"
                  onClick={onExploreFullBuffet}
                  className="text-[#D8B85A] hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver apresentação completa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </form>

        </div>

      </div>

      {/* 6. Barra Flutuante Mobile Discreta (quando há itens selecionados) */}
      {selectedItemIds.length > 0 && (
        <div className="sm:hidden fixed bottom-4 left-3 right-3 z-40 animate-fadeIn">
          <div className="bg-[#151B24]/95 backdrop-blur-md border border-[#D8B85A]/50 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#D8B85A] text-[#0E1218] font-bold text-xs flex items-center justify-center">
                {selectedItemIds.length}
              </span>
              <span className="text-xs font-semibold text-white">
                {selectedItemIds.length === 1 ? 'item selecionado' : 'itens selecionados'}
              </span>
            </div>

            <a
              href="#buffet-orcamento-form"
              className="px-3.5 py-2 rounded-xl bg-[#25D366] text-[#0E1218] text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Orçamento</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

    </section>
  );
}
