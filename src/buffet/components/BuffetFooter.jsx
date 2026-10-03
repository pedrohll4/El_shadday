import React from 'react';
import { ElShaddayLogo, GoldFiligree } from './ElShaddayLogo';
import { Phone, Instagram, MapPin, Shield, Heart } from 'lucide-react';

export function BuffetFooter({ company, onOpenAdmin, onScrollToSection }) {
  const scrollTo = (id) => {
    if (onScrollToSection) {
      onScrollToSection(id);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer id="contato" className="bg-[#15191F] text-slate-300 border-t border-[#2E3744] pt-14 pb-8 relative overflow-hidden">
      
      {/* Decorative top gold line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D8B85A]/70 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#2E3744]">
          
          {/* Brand Info */}
          <div className="lg:col-span-1 space-y-4">
            <ElShaddayLogo variant="horizontal" size="sm" />
            <p className="text-xs text-slate-400 leading-relaxed font-light mt-3">
              {company.tagline || "Seu evento merece uma experiência inesquecível."}
            </p>
            <p className="text-xs text-[#E8D58A] italic font-serif">
              "Transformando eventos em experiências inesquecíveis."
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold uppercase tracking-[0.2em] text-[#E8D58A]">
              Navegação
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => scrollTo('inicio')} 
                  className="hover:text-[#E8D58A] transition-colors cursor-pointer"
                >
                  Início
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollTo('quem-somos')} 
                  className="hover:text-[#E8D58A] transition-colors cursor-pointer"
                >
                  Quem Somos
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollTo('como-funciona')} 
                  className="hover:text-[#E8D58A] transition-colors cursor-pointer"
                >
                  Como Funciona
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollTo('cardapio-preview')} 
                  className="hover:text-[#E8D58A] transition-colors cursor-pointer"
                >
                  Cardápio
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollTo('montador')} 
                  className="hover:text-[#E8D58A] text-[#D8B85A] font-semibold transition-colors cursor-pointer"
                >
                  Monte seu Orçamento
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold uppercase tracking-[0.2em] text-[#E8D58A]">
              Atendimento & Contato
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#D8B85A] flex-shrink-0" />
                <a 
                  href={`https://wa.me/${company.phone}?text=${encodeURIComponent("Olá, El Shadday! Gostaria de um orçamento.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#E8D58A] transition-colors"
                >
                  {company.phoneDisplay || "(69) 99200-0000"} (WhatsApp)
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Instagram className="w-3.5 h-3.5 text-[#D8B85A] flex-shrink-0" />
                <a 
                  href={company.instagramUrl || "https://instagram.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#E8D58A] transition-colors"
                >
                  {company.instagram || "@elshadday_buffet"}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#D8B85A] flex-shrink-0" />
                <span>{company.city || "Ariquemes - Rondônia"}</span>
              </li>
            </ul>
          </div>

          {/* Guarantee / Included Notice */}
          <div className="rounded-xl bg-[#202630] border border-[#2E3744] p-4 text-center space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#D8B85A] block">
              Diferencial Incluso
            </span>
            <p className="font-serif text-xs font-semibold text-slate-100">
              {company.bannerIncluso || "JÁ INCLUSO GARÇONS, PRATARIA, TAÇAS, RECHAUDS E TALHERES"}
            </p>
            <p className="text-[11px] text-slate-400">
              Sua tranquilidade garantida do início ao encerramento do evento.
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>
            © {new Date().getFullYear()} {company.name || "El Shadday Serviços de Buffet"}. Todos os direitos reservados.
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-[#E8D58A] transition-colors cursor-pointer text-[11px]"
            >
              <Shield className="w-3 h-3 text-[#D8B85A]" />
              <span>Painel do Administrador</span>
            </button>
          </div>
        </div>

      </div>

    </footer>
  );
}
