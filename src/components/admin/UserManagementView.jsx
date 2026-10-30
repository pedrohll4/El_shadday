import React, { useState } from 'react';
import { 
  Users, UserPlus, KeyRound, Trash2, ShieldCheck, 
  ChefHat, Building2, Crown, CheckCircle2, AlertTriangle, 
  X, Save, Lock, Eye, EyeOff, Search, ToggleLeft, ToggleRight,
  Edit2, AtSign, Tag
} from 'lucide-react';
import { 
  ROLES, 
  ROLE_LABELS, 
  ROLE_DESCRIPTIONS, 
  getStoredUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  resetUserPassword 
} from '../../services/authService';

export function UserManagementView({ 
  branches = [], 
  currentUser, 
  onRefreshUsers 
}) {
  const [usersList, setUsersList] = useState(() => getStoredUsers());
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchUserQuery, setSearchUserQuery] = useState('');
  
  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState(ROLES.BRANCH_ADMIN);
  const [newBranchId, setNewBranchId] = useState(branches[0]?.id || 'ariquemes');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Full Edit User Modal State (Tag, Senha, Nome, Cargo, Filial, Status)
  const [editModalUser, setEditModalUser] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editRole, setEditRole] = useState(ROLES.BRANCH_ADMIN);
  const [editBranchId, setEditBranchId] = useState(branches[0]?.id || 'ariquemes');
  const [editActive, setEditActive] = useState(true);

  // Quick Credentials / Reset Password & Tag Modal State
  const [resetModalUser, setResetModalUser] = useState(null);
  const [resetUsername, setResetUsername] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const refreshList = () => {
    const updated = getStoredUsers();
    setUsersList(updated);
    if (onRefreshUsers) onRefreshUsers(updated);
  };

  const handleOpenCreateModal = () => {
    setNewUsername('');
    setNewName('');
    setNewPassword('');
    setNewRole(ROLES.BRANCH_ADMIN);
    setNewBranchId(branches[0]?.id || 'ariquemes');
    setShowNewPassword(false);
    setErrorMsg('');
    setIsCreateModalOpen(true);
  };

  const handleCreateUserSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const selectedBranch = branches.find(b => b.id === newBranchId);
      const branchName = newRole === ROLES.SUPER_ADMIN 
        ? 'Todas as Filiais (Global)' 
        : (selectedBranch?.displayName || selectedBranch?.name || 'Unidade');

      const user = createUser({
        username: newUsername.trim(),
        name: newName.trim() || newUsername.trim(),
        password: newPassword.trim(),
        role: newRole,
        branchId: newRole === ROLES.SUPER_ADMIN ? 'all' : newBranchId,
        branchName
      });

      setSuccessMsg(`Usuário/Tag "@${user.username}" criado com sucesso!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setIsCreateModalOpen(false);
      refreshList();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao criar usuário.');
    }
  };

  // Open Full Edit Modal
  const handleOpenEditModal = (user) => {
    setEditModalUser(user);
    setEditUsername(user.username || '');
    setEditName(user.name || '');
    setEditPassword('');
    setShowEditPassword(false);
    setEditRole(user.role || ROLES.BRANCH_ADMIN);
    setEditBranchId(user.branchId === 'all' ? (branches[0]?.id || 'ariquemes') : (user.branchId || branches[0]?.id || 'ariquemes'));
    setEditActive(user.active !== false);
    setErrorMsg('');
  };

  // Submit Full Edit (Tag, Password, Name, Role, Branch, Active)
  const handleEditUserSubmit = (e) => {
    e.preventDefault();
    if (!editModalUser) return;
    setErrorMsg('');
    try {
      const cleanUsername = editUsername.trim().toLowerCase();
      if (!cleanUsername) {
        throw new Error('A tag / nome de usuário é obrigatória.');
      }

      const selectedBranch = branches.find(b => b.id === editBranchId);
      const branchName = editRole === ROLES.SUPER_ADMIN 
        ? 'Todas as Filiais (Global)' 
        : (selectedBranch?.displayName || selectedBranch?.name || 'Unidade');

      const updates = {
        username: cleanUsername,
        name: editName.trim() || cleanUsername,
        role: editRole,
        branchId: editRole === ROLES.SUPER_ADMIN ? 'all' : editBranchId,
        branchName,
        active: editActive
      };

      if (editPassword.trim()) {
        if (editPassword.trim().length < 4) {
          throw new Error('A nova senha deve ter no mínimo 4 caracteres.');
        }
        updates.password = editPassword.trim();
      }

      const updated = updateUser(editModalUser.id, updates);
      setSuccessMsg(`Usuário/Tag "@${updated.username}" atualizado com sucesso!`);
      setTimeout(() => setSuccessMsg(''), 4500);
      setEditModalUser(null);
      refreshList();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao atualizar dados do usuário.');
    }
  };

  // Open Quick Credentials Modal (Quickly change Tag and/or Password)
  const handleOpenQuickCredentialsModal = (user) => {
    setResetModalUser(user);
    setResetUsername(user.username || '');
    setResetNewPassword('');
    setShowResetPassword(false);
    setErrorMsg('');
  };

  // Submit Quick Credentials (Tag and/or Password)
  const handleQuickCredentialsSubmit = (e) => {
    e.preventDefault();
    if (!resetModalUser) return;
    setErrorMsg('');
    try {
      const cleanTag = resetUsername.trim().toLowerCase();
      const cleanPass = resetNewPassword.trim();

      if (!cleanTag) {
        throw new Error('A tag / usuário não pode ficar em branco.');
      }

      const updates = {};
      let changedSomething = false;

      if (cleanTag !== resetModalUser.username.toLowerCase()) {
        updates.username = cleanTag;
        changedSomething = true;
      }

      if (cleanPass) {
        if (cleanPass.length < 4) {
          throw new Error('A nova senha deve ter no mínimo 4 caracteres.');
        }
        updates.password = cleanPass;
        changedSomething = true;
      }

      if (!changedSomething) {
        setErrorMsg('Nenhuma alteração detectada. Digite uma nova tag ou uma nova senha para salvar.');
        return;
      }

      const updated = updateUser(resetModalUser.id, updates);
      const details = [];
      if (updates.username) details.push(`Tag: @${updated.username}`);
      if (updates.password) details.push('Nova senha aplicada');

      setSuccessMsg(`Credenciais salvas com sucesso! (${details.join(', ')})`);
      setTimeout(() => setSuccessMsg(''), 4500);
      setResetModalUser(null);
      setResetNewPassword('');
      refreshList();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao redefinir credenciais.');
    }
  };

  const handleToggleUserActive = (user) => {
    if (user.role === ROLES.SUPER_ADMIN && user.id === currentUser?.id) {
      alert('Você não pode desativar o seu próprio usuário Master logado.');
      return;
    }
    try {
      updateUser(user.id, { active: !user.active });
      refreshList();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = (user) => {
    if (confirm(`Tem certeza que deseja excluir o usuário "${user.username}"?`)) {
      try {
        deleteUser(user.id);
        setSuccessMsg(`Usuário removido.`);
        setTimeout(() => setSuccessMsg(''), 3000);
        refreshList();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Filtered Users
  const filteredUsers = usersList.filter(user => {
    if (roleFilter !== 'ALL' && user.role !== roleFilter) return false;
    if (searchUserQuery.trim()) {
      const q = searchUserQuery.toLowerCase();
      const matchName = (user.name || '').toLowerCase().includes(q);
      const matchUsername = (user.username || '').toLowerCase().includes(q);
      const matchBranch = (user.branchName || '').toLowerCase().includes(q);
      return matchName || matchUsername || matchBranch;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in text-white">
      
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-brand-gold/30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/40">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-gold/20 text-brand-gold border border-brand-gold/40">
                Acessos & Segurança
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Alteração de Tag & Senha
              </span>
              <span className="text-xs text-slate-400">
                {usersList.length} usuários cadastrados
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-black text-white mt-0.5">
              Gestão de Contas & Usuários
            </h2>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-2xl bg-brand-gold hover:bg-amber-400 text-dark-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-glow-gold transition-all duration-200 cursor-pointer"
        >
          <UserPlus className="w-4 h-4 stroke-[3]" />
          <span>Criar Novo Usuário</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-dark-900 border border-dark-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        
        {/* Role Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Todos os Usuários' },
            { id: ROLES.SUPER_ADMIN, label: '👑 Master' },
            { id: ROLES.BRANCH_ADMIN, label: '🏢 Admin Filial' },
            { id: ROLES.KITCHEN, label: '👨‍🍳 Cozinha KDS' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setRoleFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === f.id
                  ? 'bg-brand-gold text-dark-950 font-black shadow-glow-gold'
                  : 'bg-dark-950 text-slate-400 hover:text-white border border-dark-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por login, nome..."
            value={searchUserQuery}
            onChange={(e) => setSearchUserQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs placeholder:text-slate-500 focus:border-brand-gold focus:outline-none w-full sm:w-56"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>

      </div>

      {/* Users Table */}
      <div className="p-5 rounded-3xl bg-dark-900 border border-dark-800 shadow-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-dark-800 text-slate-400 font-bold uppercase text-[10px]">
              <th className="pb-3 pr-3">Usuário / Nome</th>
              <th className="pb-3 pr-3">Cargo / Nível</th>
              <th className="pb-3 pr-3">Filial Vinculada</th>
              <th className="pb-3 pr-3">Status</th>
              <th className="pb-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-850">
            {filteredUsers.map((u) => {
              const isMaster = u.role === ROLES.SUPER_ADMIN;
              const isBranchAdmin = u.role === ROLES.BRANCH_ADMIN;
              const isKitchen = u.role === ROLES.KITCHEN;

              return (
                <tr key={u.id} className="hover:bg-dark-850/50 transition-colors">
                  
                  {/* User info */}
                  <td className="py-3.5 pr-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                        isMaster 
                          ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/40' 
                          : isBranchAdmin 
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' 
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}>
                        {isMaster ? <Crown className="w-4 h-4" /> : isBranchAdmin ? <Building2 className="w-4 h-4" /> : <ChefHat className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{u.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-dark-950 text-brand-gold border border-brand-gold/25">
                            <AtSign className="w-3 h-3 text-brand-gold" />
                            <span>{u.username}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role badge */}
                  <td className="py-3.5 pr-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isMaster 
                        ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/40' 
                        : isBranchAdmin 
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' 
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>

                  {/* Branch name */}
                  <td className="py-3.5 pr-3">
                    <span className="text-xs text-slate-300 font-medium">
                      {u.branchName || (u.branchId === 'all' ? 'Todas as Filiais' : u.branchId)}
                    </span>
                  </td>

                  {/* Status Toggle */}
                  <td className="py-3.5 pr-3">
                    <button
                      onClick={() => handleToggleUserActive(u)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        u.active !== false 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25' 
                          : 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
                      }`}
                      title="Clique para alternar o status do usuário"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${u.active !== false ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      <span>{u.active !== false ? 'Ativo' : 'Inativo'}</span>
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Botão de Edição Completa */}
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="px-2.5 py-1 rounded-xl bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-gold border border-brand-gold/30 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Editar tag (@usuário), senha, nome e permissões"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>

                      {/* Botão de Alteração Rápida de Senha & Tag */}
                      <button
                        onClick={() => handleOpenQuickCredentialsModal(u)}
                        className="px-2.5 py-1 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Mudar rapidamente a tag (@usuário) e senha deste usuário"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline">Senha/Tag</span>
                      </button>

                      {!(isMaster && u.id === currentUser?.id) && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors cursor-pointer"
                          title="Excluir usuário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Permissions Guide Info Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-dark-900 border border-brand-gold/30 space-y-1.5">
          <div className="flex items-center gap-2 text-brand-gold font-bold text-xs uppercase">
            <Crown className="w-4 h-4" />
            <span>1. Admin Master (Diretoria)</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Acesso total irrestrito: vê faturamento de todas as filiais, lucro estimado, cria filiais, altera a tag (@usuário) e senha de qualquer conta do sistema e inspeciona qualquer cozinha.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-dark-900 border border-blue-500/30 space-y-1.5">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase">
            <Building2 className="w-4 h-4" />
            <span>2. Admin da Filial (Gerência)</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Focado na unidade: gerencia cardápio e preços locais, pausa produtos em falta, lança pedidos no PDV de balcão e acompanha métricas locais.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-dark-900 border border-emerald-500/30 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
            <ChefHat className="w-4 h-4" />
            <span>3. Cozinha (KDS Operacional)</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Tela limpa de produção: somente pedidos da sua filial em tempo real, alarme sonoro, avanço de status (Preparo, Pronto) e impressão de comandas.
          </p>
        </div>
      </div>

      {/* MODAL: CRIAR NOVO USUÁRIO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-md bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
            
            {/* Header */}
            <div className="p-5 border-b border-dark-800 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/40">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-lg text-white">
                    Novo Usuário
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cadastre uma nova credencial de acesso.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUserSubmit} className="p-6 space-y-4">
              
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nome Completo / Identificação: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Gerente Ariquemes ou Cozinha Noite"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:border-brand-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Tag / Nome de Usuário (Login único): *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-gold font-mono font-bold text-xs select-none">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="ex: admin.ariquemes ou tag_cozinha"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:border-brand-gold focus:outline-none font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Esta tag será usada para fazer login. Você como Master poderá alterá-la e mudar a senha a qualquer momento.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Senha Inicial de Acesso: *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 4 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:border-brand-gold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Cargo / Nível de Acesso: *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:border-brand-gold focus:outline-none"
                >
                  <option value={ROLES.BRANCH_ADMIN}>🏢 Admin da Filial (Gerência de Cardápio/Preços/PDV)</option>
                  <option value={ROLES.KITCHEN}>👨‍🍳 Cozinha KDS (Operação de Comandas em Tempo Real)</option>
                  <option value={ROLES.SUPER_ADMIN}>👑 Admin Master (Acesso Global a Todas as Filiais & Lucro)</option>
                </select>
              </div>

              {newRole !== ROLES.SUPER_ADMIN && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Filial Vinculada: *
                  </label>
                  <select
                    value={newBranchId}
                    onChange={(e) => setNewBranchId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:border-brand-gold focus:outline-none"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.displayName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-dark-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-dark-800 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-amber-400 text-dark-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-glow-gold transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Cadastrar Usuário</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: EDITAR USUÁRIO & CREDENCIAIS (TAG, SENHA, NOME, CARGO, FILIAL) */}
      {editModalUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-lg bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
            
            {/* Header */}
            <div className="p-5 border-b border-dark-800 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/40">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                      Painel Master
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {editModalUser.id.substring(0, 16)}...
                    </span>
                  </div>
                  <h3 className="font-display font-extrabold text-lg text-white mt-0.5">
                    Editar Credenciais: @{editModalUser.username}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setEditModalUser(null)}
                className="w-8 h-8 rounded-full bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditUserSubmit} className="p-6 space-y-4">
              
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Tag / Usuário (Login de acesso) */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Tag de Acesso / Usuário (Login único): *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-gold font-mono font-bold text-xs select-none">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="ex: admin.ariquemes"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs font-mono focus:border-brand-gold focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Tag que este usuário digitará para entrar no painel. O Master tem permissão total para alterá-la.
                </p>
              </div>

              {/* Nova Senha */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Senha de Acesso:
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    placeholder="Deixe em branco para manter a senha atual ou digite a nova"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:border-brand-gold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Mínimo 4 caracteres. Se preenchida, o sistema redefine a senha desta conta imediatamente.
                </p>
              </div>

              {/* Nome Completo */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nome Completo / Identificação: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Gerente Ariquemes ou Cozinha Noite"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:border-brand-gold focus:outline-none"
                />
              </div>

              {/* Cargo / Nível */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Cargo / Nível: *
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:border-brand-gold focus:outline-none"
                  >
                    <option value={ROLES.BRANCH_ADMIN}>🏢 Admin Filial</option>
                    <option value={ROLES.KITCHEN}>👨‍🍳 Cozinha KDS</option>
                    <option value={ROLES.SUPER_ADMIN}>👑 Admin Master</option>
                  </select>
                </div>

                {/* Filial */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Filial: *
                  </label>
                  {editRole === ROLES.SUPER_ADMIN ? (
                    <div className="px-3.5 py-2.5 rounded-xl bg-dark-950/60 border border-dark-800 text-slate-400 text-xs">
                      Todas as Filiais (Global)
                    </div>
                  ) : (
                    <select
                      value={editBranchId}
                      onChange={(e) => setEditBranchId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:border-brand-gold focus:outline-none"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.displayName})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Status da Conta */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-gold focus:ring-brand-gold bg-dark-950 border-dark-750"
                  />
                  <span className="text-xs text-slate-300 font-medium">
                    Conta ativa e liberada para acessar o sistema
                  </span>
                </label>
              </div>

              {/* Botões do Modal */}
              <div className="pt-3 border-t border-dark-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditModalUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-dark-800 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-amber-400 text-dark-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-glow-gold transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: ALTERAR SENHA & TAG RÁPIDA (ATUALIZADO PARA O MASTER MUDAR TAG E SENHA) */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-md bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
            
            <div className="p-5 border-b border-dark-800 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/40">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-white">
                    Alterar Tag & Senha
                  </h3>
                  <p className="text-xs text-slate-400">
                    Conta: @{resetModalUser.username} ({resetModalUser.name})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setResetModalUser(null)}
                className="w-8 h-8 rounded-full bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCredentialsSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Tag / Nome de Usuário */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Tag / Usuário (Login de acesso): *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-gold font-mono font-bold text-xs select-none">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                    placeholder="ex: admin.ariquemes"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs font-mono focus:border-brand-gold focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Altere a tag deste usuário se desejar.
                </p>
              </div>

              {/* Nova Senha */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nova Senha (deixe em branco se não quiser mudar a senha):
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    placeholder="Digite a nova senha (mínimo 4 caracteres)"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:border-brand-gold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Mínimo 4 caracteres.
                </p>
              </div>

              <div className="pt-3 border-t border-dark-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-dark-800 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-amber-400 text-dark-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-glow-gold transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Credenciais</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
