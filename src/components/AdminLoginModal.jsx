import React, { useState } from 'react';
import { 
  X, Lock, KeyRound, ShieldAlert, ArrowRight, Eye, EyeOff, 
  Crown, Building2, ChefHat, Sparkles, CheckCircle2 
} from 'lucide-react';
import { 
  authenticateUser, 
  INITIAL_USERS, 
  ROLES, 
  ROLE_LABELS 
} from '../services/authService';

export function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('elshadday');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [selectedDemoIndex, setSelectedDemoIndex] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    try {
      const user = authenticateUser(username, password);
      onLoginSuccess(user);
      onClose();
    } catch (err) {
      setError(err.message || 'Usuário ou senha incorretos.');
    }
  };

  const handleApplyPreset = (preset, idx) => {
    setUsername(preset.username);
    setPassword(preset.password);
    setSelectedDemoIndex(idx);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-dark-800 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/40">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                  Sistema Multi-Filiais
                </span>
              </div>
              <h2 className="font-display font-extrabold text-lg sm:text-xl text-white">
                Acesso aos Painéis El Shadday
              </h2>
              <p className="text-xs text-slate-400">
                Entre como Master, Gerente de Filial ou Cozinha KDS
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-fade-in">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Access Switcher */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
              <span>⚡ Teste Rápido com 1 Clique:</span>
              <span className="text-[10px] text-brand-gold font-normal">Selecione para preencher</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INITIAL_USERS.map((usr, idx) => {
                const isSelected = selectedDemoIndex === idx;
                const isMaster = usr.role === ROLES.SUPER_ADMIN;
                const isKitchen = usr.role === ROLES.KITCHEN;

                return (
                  <button
                    key={usr.id}
                    type="button"
                    onClick={() => handleApplyPreset(usr, idx)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-brand-gold/20 border-brand-gold text-white ring-1 ring-brand-gold'
                        : 'bg-dark-950/80 border-dark-800 text-slate-400 hover:bg-dark-850 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {isMaster ? (
                        <Crown className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" />
                      ) : isKitchen ? (
                        <ChefHat className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Building2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      )}
                      <span className="text-[11px] font-extrabold line-clamp-1">
                        {isMaster ? 'Master Geral' : isKitchen ? `Cozinha ${usr.branchId === 'ariquemes' ? 'Ariq.' : 'PVH'}` : `Admin ${usr.branchId === 'ariquemes' ? 'Ariq.' : 'PVH'}`}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                      @{usr.username}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Usuário / Login:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setSelectedDemoIndex(-1);
              }}
              placeholder="Ex: admin, admin.ariquemes ou cozinha.portovelho"
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs font-mono focus:outline-none focus:border-brand-gold"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Senha de Acesso:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setSelectedDemoIndex(-1);
                }}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:outline-none focus:border-brand-gold"
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

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-brand-gold hover:bg-amber-400 text-dark-950 font-black text-xs sm:text-sm shadow-glow-gold transition-all duration-200 hover:scale-101 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Entrar no Painel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
