import React, { useState } from 'react';
import { 
  Building2, 
  UtensilsCrossed, 
  Calendar, 
  History, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Save, 
  LogOut, 
  ArrowLeft, 
  Phone, 
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  Flame,
  Salad,
  Wine,
  Cake,
  ConciergeBell
} from 'lucide-react';
import { 
  INITIAL_BUFFET_COMPANY, 
  INITIAL_BUFFET_CATEGORIES, 
  INITIAL_EVENT_TYPES,
  getStoredQuoteHistory
} from '../buffetData';

export function BuffetAdminDashboard({
  company,
  categories,
  eventTypes,
  onSaveCompany,
  onSaveCategories,
  onSaveEventTypes,
  onLogout,
  onBackToSite,
  currentAppMode,
  onToggleAppMode
}) {
  // Admin Tabs: 'company' | 'menu' | 'events' | 'quotes' | 'system'
  const [activeTab, setActiveTab] = useState('company');

  // Form states
  const [tempCompany, setTempCompany] = useState({ ...company });
  const [tempCategories, setTempCategories] = useState(JSON.parse(JSON.stringify(categories)));
  const [tempEventTypes, setTempEventTypes] = useState([...eventTypes]);

  // New item draft states
  const [selectedCategoryForAdd, setSelectedCategoryForAdd] = useState(categories[0]?.id || 'carnes');
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');

  // Editing existing item
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemDesc, setEditItemDesc] = useState('');

  // New event type input
  const [newEventTypeName, setNewEventTypeName] = useState('');

  // Quotes history
  const [quoteHistory, setQuoteHistory] = useState(() => getStoredQuoteHistory());

  // Save feedback state
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const triggerSaveNotification = (msg) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  // --- COMPANY HANDLERS ---
  const handleSaveCompanyChanges = () => {
    onSaveCompany(tempCompany);
    triggerSaveNotification('Informações da empresa salvas com sucesso!');
  };

  // --- MENU CATEGORIES & ITEMS HANDLERS ---
  const handleToggleItemActive = (catId, itemId) => {
    const updated = tempCategories.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => {
          if (item.id !== itemId) return item;
          return { ...item, active: item.active === false ? true : false };
        })
      };
    });
    setTempCategories(updated);
    onSaveCategories(updated);
    triggerSaveNotification('Status do item atualizado!');
  };

  const handleAddNewItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem = {
      id: 'item_' + Date.now(),
      name: newItemName.trim(),
      desc: newItemDesc.trim() || 'Prato preparado no capricho pela equipe El Shadday',
      active: true
    };

    const updated = tempCategories.map(cat => {
      if (cat.id !== selectedCategoryForAdd) return cat;
      return {
        ...cat,
        items: [...cat.items, newItem]
      };
    });

    setTempCategories(updated);
    onSaveCategories(updated);
    setNewItemName('');
    setNewItemDesc('');
    triggerSaveNotification(`Item "${newItem.name}" adicionado com sucesso!`);
  };

  const handleStartEditItem = (item) => {
    setEditingItemId(item.id);
    setEditItemName(item.name);
    setEditItemDesc(item.desc || '');
  };

  const handleSaveEditItem = (catId, itemId) => {
    const updated = tempCategories.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            name: editItemName.trim() || item.name,
            desc: editItemDesc.trim() || item.desc
          };
        })
      };
    });
    setTempCategories(updated);
    onSaveCategories(updated);
    setEditingItemId(null);
    triggerSaveNotification('Item editado com sucesso!');
  };

  const handleDeleteItem = (catId, itemId) => {
    if (!window.confirm('Tem certeza que deseja excluir este item do cardápio?')) return;
    const updated = tempCategories.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        items: cat.items.filter(item => item.id !== itemId)
      };
    });
    setTempCategories(updated);
    onSaveCategories(updated);
    triggerSaveNotification('Item removido com sucesso!');
  };

  const handleResetMenuToDefault = () => {
    if (!window.confirm('Deseja restaurar todas as categorias e itens padrão do cardápio do El Shadday?')) return;
    setTempCategories(INITIAL_BUFFET_CATEGORIES);
    onSaveCategories(INITIAL_BUFFET_CATEGORIES);
    triggerSaveNotification('Cardápio restaurado para o padrão original!');
  };

  // --- EVENT TYPES HANDLERS ---
  const handleAddEventType = (e) => {
    e.preventDefault();
    if (!newEventTypeName.trim()) return;
    if (tempEventTypes.includes(newEventTypeName.trim())) return;

    const updated = [...tempEventTypes, newEventTypeName.trim()];
    setTempEventTypes(updated);
    onSaveEventTypes(updated);
    setNewEventTypeName('');
    triggerSaveNotification('Tipo de evento adicionado!');
  };

  const handleDeleteEventType = (typeToDelete) => {
    if (tempEventTypes.length <= 1) {
      alert('É necessário manter ao menos 1 tipo de evento.');
      return;
    }
    const updated = tempEventTypes.filter(t => t !== typeToDelete);
    setTempEventTypes(updated);
    onSaveEventTypes(updated);
    triggerSaveNotification('Tipo de evento removido!');
  };

  return (
    <div className="min-h-screen bg-[#15191F] text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="bg-[#202630] border-b border-[#2E3744] py-4 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToSite}
            className="p-2 rounded-lg bg-[#15191F] hover:bg-[#2A3442] text-slate-300 hover:text-white border border-[#2E3744] transition-colors cursor-pointer"
            title="Voltar ao site"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-serif text-lg sm:text-xl font-bold text-[#E8D58A] flex items-center gap-2">
              <span>Painel de Gestão — El Shadday Buffet</span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Personalize textos, WhatsApp de recebimento, itens e acompanhe orçamentos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToSite}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-[#15191F] border border-[#2E3744] hover:border-[#D8B85A]/50 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#D8B85A]" />
            <span>Ver Site do Buffet</span>
          </button>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 hover:text-rose-100 bg-rose-950/40 border border-rose-800/40 hover:bg-rose-900/60 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Save Notification Toast */}
      {saveSuccessMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#202630] border-2 border-emerald-500 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{saveSuccessMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-[#1A202A] border-b border-[#2E3744] px-4 sm:px-8">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-2.5">
          
          <button
            onClick={() => setActiveTab('company')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'company'
                ? 'bg-[#D8B85A] text-[#15191F] font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#202630]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Empresa & WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-[#D8B85A] text-[#15191F] font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#202630]'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Cardápio & Pratos</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'events'
                ? 'bg-[#D8B85A] text-[#15191F] font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#202630]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Tipos de Eventos</span>
          </button>

          <button
            onClick={() => setActiveTab('quotes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'quotes'
                ? 'bg-[#D8B85A] text-[#15191F] font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#202630]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Orçamentos Recebidos</span>
            {quoteHistory.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'quotes' ? 'bg-[#15191F] text-[#E8D58A]' : 'bg-[#D8B85A] text-[#15191F]'
              }`}>
                {quoteHistory.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'system'
                ? 'bg-[#D8B85A] text-[#15191F] font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#202630]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Módulos do Sistema</span>
          </button>

        </div>
      </div>

      {/* Tab Contents */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        
        {/* TAB 1: COMPANY & WHATSAPP */}
        {activeTab === 'company' && (
          <div className="space-y-6 max-w-4xl">
            <div className="rounded-2xl bg-[#202630] border border-[#2E3744] p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <h2 className="font-serif text-xl font-bold text-[#E8D58A] mb-1">
                Informações da Empresa & WhatsApp de Recebimento
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Todas as alterações aqui refletem instantaneamente no site e nos links de orçamento.
              </p>

              <div className="space-y-5">
                
                {/* Nome do Buffet & Slogan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1.5">
                      Nome Oficial
                    </label>
                    <input
                      type="text"
                      value={tempCompany.name}
                      onChange={(e) => setTempCompany({ ...tempCompany, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#15191F] border border-[#2E3744] text-slate-100 text-sm focus:outline-none focus:border-[#D8B85A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1.5">
                      Slogan / Frase de Destaque
                    </label>
                    <input
                      type="text"
                      value={tempCompany.tagline}
                      onChange={(e) => setTempCompany({ ...tempCompany, tagline: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#15191F] border border-[#2E3744] text-slate-100 text-sm focus:outline-none focus:border-[#D8B85A]"
                    />
                  </div>
                </div>

                {/* WhatsApp de Recebimento (CRÍTICO) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#15191F] border border-[#D8B85A]/40">
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-[#E8D58A] mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#D8B85A]" />
                      <span>WhatsApp para Receber Orçamentos (com DDI e DDD)</span>
                    </label>
                    <input
                      type="text"
                      value={tempCompany.phone}
                      onChange={(e) => setTempCompany({ ...tempCompany, phone: e.target.value })}
                      placeholder="Ex: 5569992000000"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#202630] border border-[#2E3744] text-slate-100 text-sm focus:outline-none focus:border-[#D8B85A]"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Apenas números, com 55 na frente. Ex: 5569992000000
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1.5">
                      WhatsApp para Exibição no Site
                    </label>
                    <input
                      type="text"
                      value={tempCompany.phoneDisplay}
                      onChange={(e) => setTempCompany({ ...tempCompany, phoneDisplay: e.target.value })}
                      placeholder="Ex: (69) 99200-0000"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#202630] border border-[#2E3744] text-slate-100 text-sm focus:outline-none focus:border-[#D8B85A]"
                    />
                  </div>
                </div>

                {/* Instagram & Local */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1.5">
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={tempCompany.instagram}
                      onChange={(e) => setTempCompany({ ...tempCompany, instagram: e.target.value })}
                      placeholder="@elshadday_buffet"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#15191F] border border-[#2E3744] text-slate-100 text-sm focus:outline-none focus:border-[#D8B85A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1.5">
                      Cidade / Endereço
                    </label>
                    <input
                      type="text"
                      value={tempCompany.city}
                      onChange={(e) => setTempCompany({ ...tempCompany, city: e.target.value })}
                      placeholder="Ariquemes - RO"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#15191F] border border-[#2E3744] text-slate-100 text-sm focus:outline-none focus:border-[#D8B85A]"
                    />
                  </div>
                </div>

                {/* Banner de Itens Inclusos */}
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1.5">
                    Faixa de Garantia / Diferencial Incluso
                  </label>
                  <input
                    type="text"
                    value={tempCompany.bannerIncluso}
                    onChange={(e) => setTempCompany({ ...tempCompany, bannerIncluso: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#15191F] border border-[#2E3744] text-slate-100 text-sm focus:outline-none focus:border-[#D8B85A]"
                  />
                </div>

                {/* Texto da Seção Quem Somos (100% editável como exigido) */}
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1.5">
                    Texto Institucional — Quem Somos
                  </label>
                  <textarea
                    rows={4}
                    value={tempCompany.aboutText}
                    onChange={(e) => setTempCompany({ ...tempCompany, aboutText: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#15191F] border border-[#2E3744] text-slate-100 text-sm focus:outline-none focus:border-[#D8B85A]"
                  />
                </div>

              </div>

              <div className="mt-8 pt-5 border-t border-[#2E3744] flex items-center justify-end">
                <button
                  onClick={handleSaveCompanyChanges}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D8B85A] to-[#B3913A] text-[#15191F] font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Dados da Empresa</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: MENU & ITEMS */}
        {activeTab === 'menu' && (
          <div className="space-y-8">
            
            {/* Add New Item Box */}
            <div className="rounded-2xl bg-[#202630] border border-[#D8B85A]/35 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <h3 className="font-serif text-lg font-bold text-[#E8D58A] mb-1 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#D8B85A]" />
                <span>Adicionar Novo Item ao Cardápio</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Cadastre novas carnes, pratos especiais, guarnições, bebidas ou sobremesas.
              </p>

              <form onSubmit={handleAddNewItem} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-3">
                  <label className="block text-[11px] uppercase font-bold text-slate-300 mb-1">Categoria</label>
                  <select
                    value={selectedCategoryForAdd}
                    onChange={(e) => setSelectedCategoryForAdd(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#15191F] border border-[#2E3744] text-slate-100 text-xs focus:outline-none focus:border-[#D8B85A]"
                  >
                    {tempCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] uppercase font-bold text-slate-300 mb-1">Nome do Item / Prato</label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Ex: Picanha ao Forno, Salmão Grelhado..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[#15191F] border border-[#2E3744] text-slate-100 text-xs focus:outline-none focus:border-[#D8B85A]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] uppercase font-bold text-slate-300 mb-1">Descrição Breve</label>
                  <input
                    type="text"
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    placeholder="Ex: Corte suculento com ervas finas..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[#15191F] border border-[#2E3744] text-slate-100 text-xs focus:outline-none focus:border-[#D8B85A]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#D8B85A] text-[#15191F] font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </form>
            </div>

            {/* List of Categories & Items */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-white">
                    Itens Atuais por Categoria
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ative, desative, edite ou exclua opções do cardápio em tempo real.
                  </p>
                </div>

                <button
                  onClick={handleResetMenuToDefault}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202630] border border-[#2E3744] text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#D8B85A]" />
                  <span>Restaurar Padrão</span>
                </button>
              </div>

              {tempCategories.map(cat => (
                <div key={cat.id} className="rounded-2xl bg-[#202630] border border-[#2E3744] p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#2E3744] mb-4">
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif text-base font-bold text-[#E8D58A]">
                        {cat.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 bg-[#15191F] px-2 py-0.5 rounded-full border border-[#2E3744]">
                        {cat.items.length} itens
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {cat.items.map(item => {
                      const isEditing = editingItemId === item.id;
                      const isActive = item.active !== false;

                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl p-3.5 border transition-all ${
                            isActive 
                              ? 'bg-[#15191F] border-[#2E3744]' 
                              : 'bg-[#15191F]/50 border-dashed border-slate-700 opacity-60'
                          }`}
                        >
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editItemName}
                                onChange={(e) => setEditItemName(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#202630] border border-[#D8B85A] text-slate-100 text-xs font-bold"
                              />
                              <input
                                type="text"
                                value={editItemDesc}
                                onChange={(e) => setEditItemDesc(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#202630] border border-[#2E3744] text-slate-300 text-xs"
                              />
                              <div className="flex items-center gap-2 justify-end">
                                <button
                                  onClick={() => handleSaveEditItem(cat.id, item.id)}
                                  className="p-1.5 rounded-md bg-emerald-600 text-white text-xs hover:bg-emerald-500"
                                  title="Salvar"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingItemId(null)}
                                  className="p-1.5 rounded-md bg-slate-700 text-slate-200 text-xs hover:bg-slate-600"
                                  title="Cancelar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <span className={`text-xs font-bold block ${isActive ? 'text-slate-100' : 'text-slate-400 line-through'}`}>
                                    {item.name}
                                  </span>
                                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                                    {item.desc}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleToggleItemActive(cat.id, item.id)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                                      isActive 
                                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/60' 
                                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                                    }`}
                                  >
                                    {isActive ? 'Ativo' : 'Oculto'}
                                  </button>
                                  
                                  <button
                                    onClick={() => handleStartEditItem(item)}
                                    className="p-1 rounded text-slate-400 hover:text-[#E8D58A] transition-colors"
                                    title="Editar"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteItem(cat.id, item.id)}
                                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 3: EVENT TYPES */}
        {activeTab === 'events' && (
          <div className="space-y-6 max-w-3xl">
            <div className="rounded-2xl bg-[#202630] border border-[#2E3744] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <h3 className="font-serif text-lg font-bold text-[#E8D58A] mb-1">
                Tipos de Eventos do Dropdown
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Adicione ou remova as opções de eventos disponíveis para os clientes escolherem na solicitação.
              </p>

              {/* Add event type form */}
              <form onSubmit={handleAddEventType} className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={newEventTypeName}
                  onChange={(e) => setNewEventTypeName(e.target.value)}
                  placeholder="Ex: Chá de Bebê, Noivado, Jantar Beneficente..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#15191F] border border-[#2E3744] text-slate-100 text-sm focus:outline-none focus:border-[#D8B85A]"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D8B85A] text-[#15191F] font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar</span>
                </button>
              </form>

              {/* List of event types */}
              <div className="space-y-2">
                {tempEventTypes.map((type, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#15191F] border border-[#2E3744]"
                  >
                    <span className="text-xs font-semibold text-slate-200">
                      {type}
                    </span>
                    <button
                      onClick={() => handleDeleteEventType(type)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: QUOTES HISTORY */}
        {activeTab === 'quotes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-white">
                  Histórico de Orçamentos Solicitados
                </h3>
                <p className="text-xs text-slate-400">
                  Todas as solicitações enviadas através do montador ficam salvas aqui para conferência da sua equipe.
                </p>
              </div>

              {quoteHistory.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Deseja limpar o histórico salvo neste navegador?')) {
                      localStorage.removeItem('el_shadday_buffet_quotes');
                      setQuoteHistory([]);
                    }
                  }}
                  className="text-xs text-slate-400 hover:text-rose-400 underline cursor-pointer"
                >
                  Limpar Histórico
                </button>
              )}
            </div>

            {quoteHistory.length === 0 ? (
              <div className="text-center py-16 rounded-2xl bg-[#202630] border border-[#2E3744]">
                <History className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                <p className="font-serif text-base text-slate-300">
                  Nenhum orçamento registrado ainda.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Assim que os visitantes gerarem um orçamento no site, ele aparecerá aqui com todos os detalhes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quoteHistory.map(q => (
                  <div key={q.id} className="rounded-2xl bg-[#202630] border border-[#2E3744] p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#2E3744]">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          {new Date(q.createdAt).toLocaleString('pt-BR')}
                        </span>
                        <h4 className="font-serif text-base font-bold text-[#E8D58A] mt-0.5">
                          {q.cliente || 'Cliente sem nome'}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D8B85A]/15 text-[#E8D58A] border border-[#D8B85A]/30">
                        {q.tipoEvento}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <div>
                        <span className="text-slate-400 block text-[10px]">WhatsApp:</span>
                        <strong>{q.whatsapp}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Data do Evento:</span>
                        <strong>{q.dataEvento || 'A definir'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Convidados:</span>
                        <strong>{q.convidados} pessoas</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Local:</span>
                        <strong className="truncate block">{q.local || 'A definir'}</strong>
                      </div>
                    </div>

                    {/* Selected items summary */}
                    <div className="pt-2 border-t border-[#2E3744]/70">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                        Itens Selecionados ({q.totalItens || 0}):
                      </span>
                      <div className="space-y-1 text-xs text-slate-300 max-h-28 overflow-y-auto pr-1">
                        {q.itens && q.itens.map((catGroup, idx) => (
                          <div key={idx} className="text-[11px]">
                            <span className="text-[#E8D58A] font-semibold">{catGroup.categoria}: </span>
                            <span>{catGroup.itens.join(', ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick WhatsApp response button */}
                    <div className="pt-2 flex justify-end">
                      <a
                        href={`https://wa.me/${q.whatsapp ? q.whatsapp.replace(/\D/g, '') : ''}?text=${encodeURIComponent(`Olá, ${q.cliente}! Recebemos sua solicitação de orçamento para o evento de ${q.tipoEvento}. Vamos verificar nossa disponibilidade e detalhes!`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Chamar no WhatsApp</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SYSTEM MODULES / SWITCHER */}
        {activeTab === 'system' && (
          <div className="space-y-6 max-w-3xl">
            <div className="rounded-2xl bg-[#202630] border border-[#2E3744] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <h3 className="font-serif text-lg font-bold text-[#E8D58A] mb-1">
                Controle de Módulos do Sistema
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Conforme solicitado, nenhum código ou função de delivery foi apagado. As funções antigas estão temporariamente desativadas para focar no Buffet de Eventos.
              </p>

              <div className="p-4 rounded-xl bg-[#15191F] border border-[#2E3744] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#D8B85A]" />
                      <span>Módulo Ativo: El Shadday Serviços de Buffet</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Site institucional luxuoso + montador de orçamentos personalizado via WhatsApp.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-700">
                    ATIVO
                  </span>
                </div>

                <div className="pt-3 border-t border-[#2E3744] flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-400">
                      Módulo Delivery de Pizzas & Esfirras (Legado)
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Carrinho, personalizador de esfirras, caixas e checkout PIX (Preservado e mantido em stand-by).
                    </p>
                  </div>
                  
                  {onToggleAppMode && (
                    <button
                      onClick={onToggleAppMode}
                      className="px-3 py-1.5 rounded-lg bg-[#202630] hover:bg-[#283241] border border-[#2E3744] text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {currentAppMode === 'delivery' ? 'Alternar para Buffet' : 'Visualizar Modo Delivery'}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

    </div>
  );
}
