import React from 'react';
import { MapPin, Phone, Clock, Heart, Award, ExternalLink, Lock } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';

export function Footer({ onOpenAdmin }) {
  return (
    <footer className="bg-dark-950 border-t border-dark-800/80 pt-16 pb-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-gold p-0.5 bg-dark-900 shadow-glow-gold">
                <img 
                  src={RESTAURANT_INFO.logoUrl} 
                  alt={RESTAURANT_INFO.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div>
                <span className="font-display font-extrabold text-xl tracking-tight text-white block">
                  EL SHADDAY
                </span>
                <span className="text-xs text-brand-gold font-semibold">
                  Ariquemes - Rondônia
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Mais de 15 anos de história e tradição. Pioneiros em caixas de esfirras, trazendo receitas exclusivas e pizzas de dar água na boca direto para sua mesa.
            </p>

            <div className="flex items-center gap-2 text-xs text-brand-gold font-bold">
              <Award className="w-4 h-4" />
              <span>Tradição & Qualidade Comprovada</span>
            </div>
          </div>

          {/* Atendimento e Horários */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-gold" />
              Horários de Entrega
            </h4>
            <ul className="text-xs space-y-2 text-slate-300">
              <li className="flex justify-between border-b border-dark-800 pb-1.5">
                <span>Terça a Domingo:</span>
                <strong className="text-emerald-400">09:00 às 23:00</strong>
              </li>
              <li className="flex justify-between border-b border-dark-800 pb-1.5">
                <span>Segunda-feira:</span>
                <span className="text-red-400 font-semibold">Fechado</span>
              </li>
              <li className="flex justify-between">
                <span>Tempo Médio:</span>
                <strong className="text-white">45 a 75 minutos</strong>
              </li>
            </ul>
          </div>

          {/* Endereço Físico */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-gold" />
              Localização
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Rua Maceió, 2333 • Setor 03<br />
              Ariquemes - RO, CEP 76870-000<br />
              Brasil
            </p>
            <a
              href={RESTAURANT_INFO.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-gold hover:text-amber-300 transition-colors pt-1"
            >
              <span>Abrir no Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Contato & Gestão */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-gold" />
              Fale Conosco
            </h4>
            <a
              href={`https://wa.me/${RESTAURANT_INFO.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-dark-900 hover:bg-dark-850 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>(69) 99222-8682</span>
            </a>

            <div className="pt-2">
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-brand-gold transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Área Restrita da Pizzaria (Login da Cozinha)</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-dark-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} El Shadday Delivery Esfirraria e Pizzaria. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Feito com <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> para os amantes do verdadeiro sabor em Ariquemes
          </p>
        </div>

      </div>
    </footer>
  );
}
