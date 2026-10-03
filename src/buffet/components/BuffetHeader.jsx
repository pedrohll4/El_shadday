import React, { useState, useEffect } from 'react';
import { ElShaddayLogo } from './ElShaddayLogo';
import { Phone, Menu, X, Shield, CalendarCheck, Utensils } from 'lucide-react';

export function BuffetHeader({ 
  company, 
  onOpenAdmin,
  selectedItemsCount = 0,
  onNavigateToBuilder
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#15191F]/95 backdrop-blur-md border-b border-[#D8B85A]/25 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.7)]' 
          : 'bg-[#202630]/90 backdrop-blur-sm border-b border-[#2E3744] py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo Brand Link */}
          <a 
            href="#inicio" 
            onClick={(e) => { e.preventDefault(); scrollToSection('inicio'); }}
            className="group flex items-center transition-transform duration-300 hover:scale-[1.02] cursor-pointer"
          >
            <ElShaddayLogo variant="horizontal" size="sm" />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            <button 
              onClick={() => scrollToSection('inicio')}
              className="text-xs uppercase tracking-[0.2em] font-medium text-slate-300 hover:text-[#E8D58A] transition-colors"
            >
              Início
            </button>
            <button 
              onClick={() => scrollToSection('quem-somos')}
              className="text-xs uppercase tracking-[0.2em] font-medium text-slate-300 hover:text-[#E8D58A] transition-colors"
            >
              Quem Somos
            </button>
            <button 
              onClick={() => scrollToSection('como-funciona')}
              className="text-xs uppercase tracking-[0.2em] font-medium text-slate-300 hover:text-[#E8D58A] transition-colors"
            >
              Como Funciona
            </button>
            <button 
              onClick={() => scrollToSection('cardapio-preview')}
              className="text-xs uppercase tracking-[0.2em] font-medium text-slate-300 hover:text-[#E8D58A] transition-colors"
            >
              O que Servimos
            </button>
            <button 
              onClick={() => scrollToSection('montador')}
              className="text-xs uppercase tracking-[0.2em] font-medium text-[#E8D58A] hover:text-[#FFF] transition-colors flex items-center gap-1.5 font-semibold"
            >
              <Utensils className="w-3.5 h-3.5 text-[#D8B85A]" />
              Monte seu Evento
            </button>
            <button 
              onClick={() => scrollToSection('contato')}
              className="text-xs uppercase tracking-[0.2em] font-medium text-slate-300 hover:text-[#E8D58A] transition-colors"
            >
              Contato
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            
            {/* Quick WhatsApp / Phone display on desktop */}
            <a
              href={`https://wa.me/${company.phone}?text=${encodeURIComponent("Olá, El Shadday! Gostaria de mais informações sobre o buffet para meu evento.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-[#E8D58A] px-3 py-2 rounded-lg border border-[#2E3744] hover:border-[#D8B85A]/40 transition-all"
              title="Fale conosco no WhatsApp"
            >
              <Phone className="w-3.5 h-3.5 text-[#D8B85A]" />
              <span className="tracking-wider">{company.phoneDisplay}</span>
            </a>

            {/* Main CTA: Monte seu Orçamento */}
            <button
              onClick={() => {
                if (onNavigateToBuilder) onNavigateToBuilder();
                else scrollToSection('montador');
              }}
              className="relative inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-[#D8B85A] via-[#E8D58A] to-[#D8B85A] text-[#15191F] shadow-[0_2px_15px_rgba(216,184,90,0.3)] hover:shadow-[0_4px_22px_rgba(216,184,90,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 text-[#15191F]" />
              <span className="hidden xs:inline">Solicitar Orçamento</span>
              <span className="xs:hidden">Orçamento</span>
              {selectedItemsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#15191F] text-[#E8D58A] flex items-center justify-center text-[10px] font-black ml-1">
                  {selectedItemsCount}
                </span>
              )}
            </button>

            {/* Admin Shield trigger */}
            <button
              onClick={onOpenAdmin}
              className="p-2 text-slate-400 hover:text-[#E8D58A] rounded-lg hover:bg-[#1A202A] transition-colors border border-transparent hover:border-[#D8B85A]/30 cursor-pointer"
              title="Área Administrativa El Shadday"
            >
              <Shield className="w-4 h-4" />
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-[#E8D58A] rounded-lg border border-[#2E3744]"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-4 pb-3 border-t border-[#2E3744] flex flex-col gap-2.5 animate-fadeIn">
            <button 
              onClick={() => scrollToSection('inicio')}
              className="text-left py-2 px-3 rounded-lg text-sm uppercase tracking-wider text-slate-200 hover:bg-[#1A202A] hover:text-[#E8D58A]"
            >
              Início
            </button>
            <button 
              onClick={() => scrollToSection('quem-somos')}
              className="text-left py-2 px-3 rounded-lg text-sm uppercase tracking-wider text-slate-200 hover:bg-[#1A202A] hover:text-[#E8D58A]"
            >
              Quem Somos
            </button>
            <button 
              onClick={() => scrollToSection('como-funciona')}
              className="text-left py-2 px-3 rounded-lg text-sm uppercase tracking-wider text-slate-200 hover:bg-[#1A202A] hover:text-[#E8D58A]"
            >
              Como Funciona
            </button>
            <button 
              onClick={() => scrollToSection('cardapio-preview')}
              className="text-left py-2 px-3 rounded-lg text-sm uppercase tracking-wider text-slate-200 hover:bg-[#1A202A] hover:text-[#E8D58A]"
            >
              O Que Servimos
            </button>
            <button 
              onClick={() => scrollToSection('montador')}
              className="text-left py-2.5 px-3 rounded-lg text-sm uppercase tracking-wider text-[#E8D58A] font-bold bg-[#D8B85A]/10 border border-[#D8B85A]/30 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-[#D8B85A]" />
                Monte seu Orçamento
              </span>
              {selectedItemsCount > 0 && (
                <span className="bg-[#D8B85A] text-[#15191F] text-xs font-black px-2 py-0.5 rounded-full">
                  {selectedItemsCount} itens
                </span>
              )}
            </button>
            <button 
              onClick={() => scrollToSection('contato')}
              className="text-left py-2 px-3 rounded-lg text-sm uppercase tracking-wider text-slate-200 hover:bg-[#1A202A] hover:text-[#E8D58A]"
            >
              Contato
            </button>
          </div>
        )}

      </div>
    </header>
  );
}
