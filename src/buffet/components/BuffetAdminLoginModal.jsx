import React, { useState } from 'react';
import { Shield, Lock, X, ArrowRight, AlertCircle } from 'lucide-react';
import { ElShaddayLogo, GoldFiligree } from './ElShaddayLogo';

import { authenticateUser } from '../../services/authService';

export function BuffetAdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const cleanUser = username.trim();
    const clean = password.trim();
    if (!cleanUser || !clean) {
      setErrorMsg('Informe seu usuário e senha de acesso.');
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await authenticateUser(cleanUser, clean);
      setErrorMsg('');
      setPassword('');
      sessionStorage.setItem('el_shadday_admin_auth', 'true');
      sessionStorage.setItem('el_shadday_buffet_admin_auth', 'true');
      onLoginSuccess(user);
    } catch (err) {
      setErrorMsg(err.message || 'Usuário ou senha incorretos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      
      <div className="relative w-full max-w-md rounded-2xl bg-[#1A202A] border-2 border-[#D8B85A]/40 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-slate-100">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#202630] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#202630] border border-[#D8B85A]/40 flex items-center justify-center mx-auto mb-3 text-[#E8D58A] shadow-[0_0_15px_rgba(216,184,90,0.2)]">
            <Lock className="w-6 h-6 text-[#D8B85A]" />
          </div>

          <h3 className="font-serif text-2xl font-bold text-white">
            Acesso Restrito
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Painel Administrativo El Shadday Buffet
          </p>
          <GoldFiligree width="w-28" className="my-2" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1.5">
              Usuário
            </label>
            <input
              type="text"
              autoFocus
              autoCapitalize="none"
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Ex: admin"
              className="w-full px-4 py-3 rounded-xl bg-[#15191F] border border-[#2E3744] text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#D8B85A] focus:border-[#D8B85A] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1.5">
              Senha de Acesso
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Digite a senha de administrador..."
              className="w-full px-4 py-3 rounded-xl bg-[#15191F] border border-[#2E3744] text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#D8B85A] focus:border-[#D8B85A] transition-all"
            />
            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>


          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-[#D8B85A] via-[#E8D58A] to-[#D8B85A] text-[#15191F] shadow-[0_4px_20px_rgba(216,184,90,0.3)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{isSubmitting ? 'Entrando...' : 'Entrar no Painel'}</span>
            <ArrowRight className="w-4 h-4 text-[#15191F]" />
          </button>
        </form>

      </div>

    </div>
  );
}
