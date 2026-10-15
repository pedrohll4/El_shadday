import React, { useState } from 'react';
import { 
  X, Lock, KeyRound, ShieldAlert, ArrowRight, Eye, EyeOff, 
  Crown, Building2, ChefHat, Sparkles, CheckCircle2, MapPin
} from 'lucide-react';
import { 
  authenticateUser, 
  INITIAL_USERS, 
  ROLES, 
  ROLE_LABELS 
} from '../services/authService';
import { getStoredBranches } from '../data/branchesData';

export function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const branches = getStoredBranches();
  
  // Tabs: 'MASTER' | 'BRANCH' | 'KITCHEN'
  const [activeRoleTab, setActiveRoleTab] = useState('MASTER');
  const [selectedBranchId, setSelectedBranchId] = useState('ariquemes');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Clear password whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectRoleTab = (tab) => {
    setActiveRoleTab(tab);
    setError('');
    setPassword('');
    if (tab === 'MASTER') {
      setUsername('admin');
    } else if (tab === 'BRANCH') {
      const u = selectedBranchId === 'ariquemes' ? 'admin.ariquemes' : 'admin.portovelho';
      setUsername(u);
    } else if (tab === 'KITCHEN') {
      const u = selectedBranchId === 'ariquemes' ? 'cozinha.ariquemes' : 'cozinha.portovelho';
      setUsername(u);
    }
  };

  const handleSelectBranch = (bId) => {
    setSelectedBranchId(bId);
    setError('');
    setPassword('');
    if (activeRoleTab === 'BRANCH') {
      const u = bId === 'ariquemes' ? 'admin.ariquemes' : 'admin.portovelho';
      setUsername(u);
    } else if (activeRoleTab === 'KITCHEN') {
      const u = bId === 'ariquemes' ? 'cozinha.ariquemes' : 'cozinha.portovelho';
      setUsername(u);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    try {
      const targetRole = activeRoleTab === 'MASTER' 
        ? ROLES.SUPER_ADMIN 
        : activeRoleTab === 'BRANCH' 
        ? ROLES.BRANCH_ADMIN 
        : ROLES.KITCHEN;

      const user = authenticateUser(username, password, {
        role: targetRole,
        branchId: activeRoleTab === 'MASTER' ? 'all' : selectedBranchId
      });

      if (!user) {
        throw new Error('Não foi possível identificar o usuário.');
      }

      onLoginSuccess(user);
      onClose();
    } catch (err) {
      setError(err.message || 'Senha ou usuário incorreto. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-dark-800 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/40">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                  Acesso Restrito
                </span>
              </div>
              <h2 className="font-display font-extrabold text-lg sm:text-xl text-white">
                Painel El Shadday
              </h2>
              <p className="text-xs text-slate-400">
                Escolha seu perfil ou digite sua senha de acesso
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-fade-in">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Role Selection Tabs */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 block">
              Selecione o Tipo de Acesso:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectRoleTab('MASTER')}
                className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  activeRoleTab === 'MASTER'
                    ? 'bg-brand-gold text-dark-950 border-brand-gold font-black shadow-glow-gold'
                    : 'bg-dark-950/80 border-dark-800 text-slate-400 hover:text-white hover:bg-dark-850'
                }`}
              >
                <Crown className={`w-4 h-4 ${activeRoleTab === 'MASTER' ? 'text-dark-950' : 'text-brand-gold'}`} />
                <span className="text-xs font-extrabold leading-tight">Master Geral</span>
                <span className={`text-[10px] ${activeRoleTab === 'MASTER' ? 'text-dark-950/80 font-bold' : 'text-slate-500'}`}>Diretoria</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRoleTab('BRANCH')}
                className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  activeRoleTab === 'BRANCH'
                    ? 'bg-blue-600 text-white border-blue-500 font-black shadow-md'
                    : 'bg-dark-950/80 border-dark-800 text-slate-400 hover:text-white hover:bg-dark-850'
                }`}
              >
                <Building2 className={`w-4 h-4 ${activeRoleTab === 'BRANCH' ? 'text-white' : 'text-blue-400'}`} />
                <span className="text-xs font-extrabold leading-tight">Admin Filial</span>
                <span className={`text-[10px] ${activeRoleTab === 'BRANCH' ? 'text-blue-100 font-bold' : 'text-slate-500'}`}>Gerência</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRoleTab('KITCHEN')}
                className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  activeRoleTab === 'KITCHEN'
                    ? 'bg-emerald-600 text-white border-emerald-500 font-black shadow-md'
                    : 'bg-dark-950/80 border-dark-800 text-slate-400 hover:text-white hover:bg-dark-850'
                }`}
              >
                <ChefHat className={`w-4 h-4 ${activeRoleTab === 'KITCHEN' ? 'text-white' : 'text-emerald-400'}`} />
                <span className="text-xs font-extrabold leading-tight">Cozinha KDS</span>
                <span className={`text-[10px] ${activeRoleTab === 'KITCHEN' ? 'text-emerald-100 font-bold' : 'text-slate-500'}`}>Comandas</span>
              </button>
            </div>
          </div>

          {/* Branch Picker (Only when not master) */}
          {activeRoleTab !== 'MASTER' && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>Qual Filial Você Opera?</span>
                <span className="text-[10px] text-brand-gold font-normal">Ariquemes ou Porto Velho</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {branches.map(b => {
                  const isSel = selectedBranchId === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleSelectBranch(b.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        isSel
                          ? 'bg-brand-gold/15 border-brand-gold text-white font-bold ring-1 ring-brand-gold'
                          : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-white hover:bg-dark-850'
                      }`}
                    >
                      <MapPin className={`w-4 h-4 ${isSel ? 'text-brand-gold' : 'text-slate-500'}`} />
                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight truncate">{b.displayName || b.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{b.id === 'ariquemes' ? 'Buffet & Delivery' : 'Delivery Capital'}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Senha de Acesso:
              </label>
            </div>
            
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Digite a senha de acesso"
                autoComplete="current-password"
                className="w-full pl-3.5 pr-10 py-3 rounded-xl bg-dark-950 border border-dark-750 text-white text-sm focus:outline-none focus:border-brand-gold font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Username Input */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Usuário / Login:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex: admin ou admin.ariquemes"
              autoComplete="username"
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950/70 border border-dark-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-brand-gold"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold text-dark-950 font-black text-sm shadow-glow-gold transition-all duration-200 hover:scale-101 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Entrar no Painel</span>
              <ArrowRight className="w-4 h-4 text-dark-950" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
