import React, { useState } from 'react';
import { X, Lock, KeyRound, ShieldAlert, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';

export function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('elshadday');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Default admin credentials
    if (
      (username.trim().toLowerCase() === 'admin' || username.trim().toLowerCase() === 'elshadday') &&
      password === 'elshadday'
    ) {
      onLoginSuccess();
      onClose();
    } else {
      setError('Usuário ou senha incorretos. Use admin / elshadday.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-dark-800 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg text-white">
                Acesso da Pizzaria
              </h2>
              <p className="text-xs text-slate-400">
                Painel de Controle e Cozinha (KDS)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Usuário do Administrador:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:outline-none focus:border-brand-gold"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Senha de Acesso:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs focus:outline-none focus:border-brand-gold"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Preset Helper notice */}
          <div className="p-3 rounded-xl bg-brand-gold/10 border border-brand-gold/25 text-[11px] text-brand-goldLight space-y-0.5">
            <div>🔑 <strong>Credenciais de Demonstração:</strong></div>
            <div>Usuário: <code className="text-white bg-dark-950 px-1 py-0.5 rounded">admin</code> | Senha: <code className="text-white bg-dark-950 px-1 py-0.5 rounded">elshadday</code></div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-brand-gold hover:bg-amber-400 text-dark-950 font-extrabold text-xs sm:text-sm shadow-glow-gold transition-all duration-200 hover:scale-102 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Entrar no Painel de Pedidos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
