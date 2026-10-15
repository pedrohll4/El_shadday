import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldAlert, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { authenticateUser } from '../services/authService';

export function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Limpa os campos sempre que o modal for aberto
  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser) {
      setError('Por favor, informe seu usuário de acesso.');
      return;
    }
    if (!cleanPass) {
      setError('Por favor, informe sua senha de acesso.');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = authenticateUser(cleanUser, cleanPass);

      if (!user) {
        throw new Error('Usuário ou senha incorretos.');
      }

      onLoginSuccess(user);
      onClose();
    } catch (err) {
      setError(err.message || 'Usuário ou senha incorretos. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-dark-900 border border-brand-gold/40 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-dark-800 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/40 flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                Acesso Restrito
              </span>
              <h2 className="font-display font-extrabold text-lg text-white mt-0.5">
                Painel El Shadday
              </h2>
              <p className="text-xs text-slate-400">
                Informe suas credenciais para continuar
              </p>
            </div>
          </div>

          <button
            type="button"
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

          {/* Campo de Usuário */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Usuário:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="Digite seu usuário de acesso"
              autoComplete="username"
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-750 text-white text-sm focus:outline-none focus:border-brand-gold font-sans placeholder:text-slate-500"
              required
            />
          </div>

          {/* Campo de Senha */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Senha:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Digite sua senha secreta"
                autoComplete="current-password"
                className="w-full pl-4 pr-11 py-3 rounded-xl bg-dark-950 border border-dark-750 text-white text-sm focus:outline-none focus:border-brand-gold font-sans placeholder:text-slate-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
                tabIndex="-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botão de Envio */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold text-dark-950 font-black text-sm shadow-glow-gold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Verificando...' : 'Entrar no Painel'}</span>
              <ArrowRight className="w-4 h-4 text-dark-950" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
