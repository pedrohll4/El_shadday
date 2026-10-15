import React, { useState } from 'react';
import { 
  Building2, Plus, Edit2, Trash2, MapPin, Phone, 
  Clock, CreditCard, CheckCircle2, AlertTriangle, 
  ExternalLink, X, Save, ArrowRight, Sparkles, ChefHat, Utensils
} from 'lucide-react';
import { 
  createBranch, 
  updateBranch, 
  toggleBranchStatus, 
  deleteBranch 
} from '../../services/branchesService';

export function BranchManagementView({ 
  branches, 
  onRefreshBranches, 
  onNavigateToBranchMenu, 
  onNavigateToBranchKitchen 
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New Branch Form State
  const [formName, setFormName] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('Filial Delivery & Balcão');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('(69) 99222-8682');
  const [formAutoNotifyWhatsApp, setFormAutoNotifyWhatsApp] = useState(true);
  const [formWhatsappApiUrl, setFormWhatsappApiUrl] = useState('');
  const [formWhatsappApiToken, setFormWhatsappApiToken] = useState('');
  const [formPixKey, setFormPixKey] = useState('69992228682');
  const [formPixName, setFormPixName] = useState('El Shadday Delivery');
  const [formDeliveryTime, setFormDeliveryTime] = useState('40 - 65 min');
  const [formOpeningHours, setFormOpeningHours] = useState('Terça a Domingo: 18:00 às 23:30');
  const [formStatus, setFormStatus] = useState('active');

  const handleOpenCreateModal = () => {
    setFormName('');
    setFormCity('');
    setFormSubtitle('Filial Delivery & Balcão');
    setFormAddress('');
    setFormPhone('(69) 99222-8682');
    setFormAutoNotifyWhatsApp(true);
    setFormWhatsappApiUrl('');
    setFormWhatsappApiToken('');
    setFormPixKey('69992228682');
    setFormPixName('El Shadday Delivery');
    setFormDeliveryTime('40 - 65 min');
    setFormOpeningHours('Terça a Domingo: 18:00 às 23:30');
    setFormStatus('active');
    setErrorMsg('');
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (branch) => {
    setEditingBranch(branch);
    setFormName(branch.name || '');
    setFormCity(branch.displayName ? branch.displayName.replace(' - RO', '') : '');
    setFormSubtitle(branch.subtitle || '');
    setFormAddress(branch.address || '');
    setFormPhone(branch.phoneFormatted || branch.whatsappFormatted || branch.phone || '(69) 99222-8682');
    setFormAutoNotifyWhatsApp(branch.autoNotifyWhatsApp !== false);
    setFormWhatsappApiUrl(branch.whatsappApiUrl || '');
    setFormWhatsappApiToken(branch.whatsappApiToken || '');
    setFormPixKey(branch.pixKey || '');
    setFormPixName(branch.pixName || '');
    setFormDeliveryTime(branch.deliveryTime || '');
    setFormOpeningHours(branch.openingHours || '');
    setFormStatus(branch.status || 'active');
    setErrorMsg('');
  };

  const handleSaveNewBranch = (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (!formName.trim()) throw new Error('O nome da filial é obrigatório.');
      if (!formCity.trim()) throw new Error('A cidade da filial é obrigatória.');

      const cleanPhoneDigits = formPhone.replace(/\D/g, '') || '5569992228682';

      const newB = createBranch({
        name: formName.trim(),
        displayName: `${formCity.trim()} - RO`,
        subtitle: formSubtitle.trim(),
        address: formAddress.trim(),
        phone: cleanPhoneDigits,
        phoneFormatted: formPhone.trim(),
        whatsapp: cleanPhoneDigits,
        whatsappFormatted: formPhone.trim(),
        autoNotifyWhatsApp: formAutoNotifyWhatsApp,
        whatsappApiUrl: formWhatsappApiUrl.trim(),
        whatsappApiToken: formWhatsappApiToken.trim(),
        pixKey: formPixKey.trim(),
        pixName: formPixName.trim(),
        deliveryTime: formDeliveryTime.trim(),
        openingHours: formOpeningHours.trim(),
        status: formStatus
      });

      setSuccessMsg(`Filial "${newB.name}" cadastrada com sucesso!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setIsCreateModalOpen(false);
      onRefreshBranches();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao cadastrar filial.');
    }
  };

  const handleUpdateBranch = (e) => {
    e.preventDefault();
    if (!editingBranch) return;
    setErrorMsg('');
    try {
      const cleanPhoneDigits = formPhone.replace(/\D/g, '') || '5569992228682';

      updateBranch(editingBranch.id, {
        name: formName.trim(),
        displayName: `${formCity.trim()} - RO`,
        subtitle: formSubtitle.trim(),
        address: formAddress.trim(),
        phoneFormatted: formPhone.trim(),
        phone: cleanPhoneDigits,
        whatsappFormatted: formPhone.trim(),
        whatsapp: cleanPhoneDigits,
        autoNotifyWhatsApp: formAutoNotifyWhatsApp,
        whatsappApiUrl: formWhatsappApiUrl.trim(),
        whatsappApiToken: formWhatsappApiToken.trim(),
        pixKey: formPixKey.trim(),
        pixName: formPixName.trim(),
        deliveryTime: formDeliveryTime.trim(),
        openingHours: formOpeningHours.trim(),
        status: formStatus
      });

      setSuccessMsg(`Filial atualizada com sucesso!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setEditingBranch(null);
      onRefreshBranches();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao salvar alterações.');
    }
  };

  const handleToggleStatus = (branchId) => {
    try {
      toggleBranchStatus(branchId);
      onRefreshBranches();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = (branch) => {
    if (confirm(`Tem certeza que deseja excluir a filial "${branch.name}"? Esta ação removerá a filial do sistema.`)) {
      try {
        deleteBranch(branch.id);
        onRefreshBranches();
        setSuccessMsg(`Filial removida.`);
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-white">
      
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-brand-gold/30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/40">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-gold/20 text-brand-gold border border-brand-gold/40">
                Gestão Master
              </span>
              <span className="text-xs text-slate-400">
                {branches.length} filiais cadastradas
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-black text-white mt-0.5">
              Gestão de Filiais El Shadday
            </h2>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-2xl bg-brand-gold hover:bg-amber-400 text-dark-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-glow-gold transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Cadastrar Nova Filial</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {branches.map((b) => {
          const isActive = b.status === 'active';
          const isAriquemes = b.id === 'ariquemes';

          return (
            <div
              key={b.id}
              className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-5 ${
                isActive
                  ? 'bg-dark-900 border-brand-gold/30 hover:border-brand-gold/70 shadow-xl'
                  : 'bg-dark-950 border-dark-800 hover:border-amber-500/40'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-black text-lg sm:text-xl text-white">
                        {b.name}
                      </h3>
                      {isAriquemes && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold border border-brand-gold/40">
                          Matriz Principal
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-gold font-medium mt-0.5">
                      {b.displayName} • {b.subtitle}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(b.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                    }`}
                    title="Clique para alternar o status da filial"
                  >
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    <span>{b.badge || (isActive ? 'Aberta' : 'Em Construção 🚧')}</span>
                  </button>
                </div>

                {/* Details List */}
                <div className="mt-4 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-4 h-4 text-brand-gold flex-shrink-0" />
                    <span className="line-clamp-1">{b.address || 'Endereço não informado'}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-slate-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="font-semibold text-white">WhatsApp: {b.phoneFormatted || b.whatsappFormatted || b.phone || 'Sem WhatsApp'}</span>
                    </div>
                    {b.phone && (
                      <a
                        href={`https://wa.me/${(b.whatsapp || b.phone).toString().replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-0.5 rounded-lg border border-emerald-500/30 flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <span>Testar</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 bg-dark-950 border border-dark-750">
                      <span className={`w-2 h-2 rounded-full ${b.autoNotifyWhatsApp !== false ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                      <span className={b.autoNotifyWhatsApp !== false ? 'text-emerald-400 font-extrabold' : 'text-slate-400'}>
                        {b.autoNotifyWhatsApp !== false ? 'Notificação Automática via WhatsApp: ATIVADA' : 'Notificação Automática: DESATIVADA'}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Entrega: {b.deliveryTime || '45 - 75 min'} ({b.openingHours || 'Terça a Domingo'})</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-300">
                    <CreditCard className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>Pix: {b.pixKey} ({b.pixName})</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-dark-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {onNavigateToBranchMenu && (
                    <button
                      onClick={() => onNavigateToBranchMenu(b.id)}
                      className="px-3 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-200 hover:text-white border border-dark-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Gerenciar cardápio desta filial"
                    >
                      <Utensils className="w-3.5 h-3.5 text-brand-gold" />
                      <span>Cardápio</span>
                    </button>
                  )}

                  {onNavigateToBranchKitchen && (
                    <button
                      onClick={() => onNavigateToBranchKitchen(b.id)}
                      className="px-3 py-1.5 rounded-xl bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-gold border border-brand-gold/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Abrir KDS da cozinha desta filial"
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      <span>Cozinha</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(b)}
                    className="p-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700 transition-colors cursor-pointer"
                    title="Editar informações da filial"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {!isAriquemes && (
                    <button
                      onClick={() => handleDelete(b)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors cursor-pointer"
                      title="Excluir filial"
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

      {/* MODAL: CRIAR OU EDITAR FILIAL */}
      {(isCreateModalOpen || editingBranch) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-xl bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-dark-800 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/40">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-lg text-white">
                    {editingBranch ? `Editar Filial: ${editingBranch.name}` : 'Cadastrar Nova Filial'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina os dados operacionais, endereço e chave PIX desta unidade.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingBranch(null);
                }}
                className="w-8 h-8 rounded-full bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={editingBranch ? handleUpdateBranch : handleSaveNewBranch} className="p-6 space-y-4 max-h-[75dvh] overflow-y-auto">
              
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Nome da Filial: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Unidade Jaru"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:border-brand-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Cidade / UF: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Jaru ou Porto Velho"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:border-brand-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Subtítulo / Destaque:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Filial Capital • Delivery & Balcão"
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:border-brand-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Endereço Completo:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Av. Principal, 1200 - Centro, Jaru - RO"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:border-brand-gold focus:outline-none"
                />
              </div>

              {/* Configurações de WhatsApp da Filial */}
              <div className="p-4 rounded-2xl bg-dark-950 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-white uppercase tracking-wider block">
                        WhatsApp da Filial (Notificações & Atendimento)
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Número utilizado para disparar avisos de status do pedido aos clientes.
                      </span>
                    </div>
                  </div>

                  {formPhone && (
                    <a
                      href={`https://wa.me/${formPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <span>Testar Número</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Número do WhatsApp com DDD: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="(69) 99222-8682"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Status da Unidade:
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:border-brand-gold focus:outline-none"
                    >
                      <option value="active">🟢 Ativa e Aberta para Pedidos</option>
                      <option value="construction">🚧 Em Obras / Implantação (Em Breve)</option>
                      <option value="closed">🔴 Fechada Temporariamente</option>
                    </select>
                  </div>
                </div>

                {/* Checkbox de Envio Automático */}
                <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formAutoNotifyWhatsApp}
                    onChange={(e) => setFormAutoNotifyWhatsApp(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-emerald-400 block">
                      Disparar status automaticamente no WhatsApp do cliente
                    </span>
                    <span className="text-[11px] text-slate-400 block leading-relaxed">
                      Ao avançar o pedido na cozinha (No Forno, Saiu p/ Entrega, Pronto no Balcão, Entregue ou Cancelado), envia automaticamente a mensagem no WhatsApp do cliente com os dados desta filial.
                    </span>
                  </div>
                </label>

                {/* API / Webhook Opcional */}
                <div className="pt-2 border-t border-dark-850">
                  <details className="text-xs text-slate-400">
                    <summary className="cursor-pointer font-bold text-slate-300 hover:text-white flex items-center gap-1 select-none">
                      <span>⚙️ Configuração Opcional: Webhook / API WhatsApp (Evolution API / Z-API / n8n)</span>
                    </summary>
                    <div className="mt-2.5 space-y-2 p-3 rounded-xl bg-dark-900 border border-dark-800">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">URL do Webhook / API (POST):</label>
                        <input
                          type="text"
                          placeholder="Ex: https://api.z-api.io/instances/... ou Evolution API"
                          value={formWhatsappApiUrl}
                          onChange={(e) => setFormWhatsappApiUrl(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-dark-950 border border-dark-750 text-white text-xs focus:border-emerald-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Token de Autenticação (Bearer):</label>
                        <input
                          type="password"
                          placeholder="Token da API (se necessário)"
                          value={formWhatsappApiToken}
                          onChange={(e) => setFormWhatsappApiToken(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-dark-950 border border-dark-750 text-white text-xs focus:border-emerald-400 focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500">
                        * Deixe em branco para usar o envio padrão via WhatsApp Web / App nativo com 1 clique.
                      </p>
                    </div>
                  </details>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Chave PIX da Filial:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 69992228682 ou CNPJ"
                    value={formPixKey}
                    onChange={(e) => setFormPixKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:border-brand-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Nome / Titular do Pix:
                  </label>
                  <input
                    type="text"
                    placeholder="El Shadday Delivery"
                    value={formPixName}
                    onChange={(e) => setFormPixName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:border-brand-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Tempo Médio de Entrega:
                  </label>
                  <input
                    type="text"
                    placeholder="40 - 65 min"
                    value={formDeliveryTime}
                    onChange={(e) => setFormDeliveryTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:border-brand-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Horário de Atendimento:
                  </label>
                  <input
                    type="text"
                    placeholder="Terça a Domingo: 18:00 às 23:30"
                    value={formOpeningHours}
                    onChange={(e) => setFormOpeningHours(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:border-brand-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-dark-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingBranch(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-dark-800 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-amber-400 text-dark-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-glow-gold transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingBranch ? 'Salvar Alterações' : 'Criar Filial'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
