import React, { useState } from 'react';
import { 
  Crown, Calendar, Users, Sparkles, MessageCircle, 
  Send, Wine, Utensils, HeartHandshake, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { ElShaddayLogo, GoldFiligree } from '../buffet/components/ElShaddayLogo';

export function BuffetSection({ onExploreFullBuffet }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    eventType: 'Casamento',
    guestCount: '100',
    eventDate: '',
    notes: ''
  });

  const [formError, setFormError] = useState('');

  const eventTypes = [
    'Casamento',
    'Aniversário / 15 Anos',
    'Confraternização Corporativa',
    'Bodas / Batizado',
    'Jantar / Almoço Especial',
    'Outro Tipo de Evento'
  ];

  const handleSubmitQuote = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Por favor, informe seu nome!');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Por favor, informe seu telefone ou WhatsApp!');
      return;
    }

    setFormError('');

    const message = 
`👑 *SOLICITAÇÃO DE ORÇAMENTO - BUFFET EL SHADDAY*
----------------------------------------
👤 *Cliente:* ${formData.name.trim()}
📱 *WhatsApp:* ${formData.phone.trim()}
🎉 *Tipo de Evento:* ${formData.eventType}
👥 *Nº Estimado de Convidados:* ${formData.guestCount || 'A definir'}
📅 *Data Prevista:* ${formData.eventDate ? formData.eventDate : 'A combinar'}
${formData.notes ? `📝 *Detalhes:* ${formData.notes.trim()}\n` : ''}----------------------------------------
Olá! Gostaria de receber uma proposta e orçamento personalizado para os serviços de Buffet da El Shadday.`;

    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5569992228682?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <section id="buffet-section" className="relative py-16 lg:py-24 bg-gradient-to-b from-dark-950 via-[#11141A] to-dark-950 border-t border-brand-gold/30 overflow-hidden">
      
      {/* Background Gold Ambient Glows */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none -z-0"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex justify-center mb-3">
            <ElShaddayLogo size="md" variant="horizontal" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-gold/15 border border-brand-gold/40 text-brand-goldLight text-xs font-semibold mb-3">
            <Crown className="w-3.5 h-3.5 text-brand-gold" />
            <span>Serviços de Buffet de Alta Gastronomia</span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
            Vai comemorar um momento especial?
          </h2>

          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            A El Shadday oferece estrutura gastronômica completa para o seu evento. Solicite seu orçamento personalizado sem compromisso direto pelo WhatsApp!
          </p>

          <GoldFiligree className="my-5" />
        </div>

        {/* Two Columns: Highlights & Quotation Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Event Cards & Features */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-dark-900/90 border border-brand-gold/30 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="font-display font-bold text-lg sm:text-xl text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-gold" />
                <span>Estrutura Completa para seu Evento</span>
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Mais de 15 anos de excelência em Ariquemes e região. Atendemos com cardápios finos, equipe qualificada, serviço de mesa, entradas, pratos principais e sobremesas requintadas.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-950/70 border border-dark-800">
                  <div className="w-9 h-9 rounded-lg bg-brand-gold/20 text-brand-gold flex items-center justify-center flex-shrink-0">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Casamentos & 15 Anos</h4>
                    <p className="text-[11px] text-slate-400">Cardápios sofisticados para momentos inesquecíveis.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-950/70 border border-dark-800">
                  <div className="w-9 h-9 rounded-lg bg-brand-gold/20 text-brand-gold flex items-center justify-center flex-shrink-0">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Confraternizações & Empresas</h4>
                    <p className="text-[11px] text-slate-400">Almoços, jantares e coffee breaks de alto padrão.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-950/70 border border-dark-800">
                  <div className="w-9 h-9 rounded-lg bg-brand-gold/20 text-brand-gold flex items-center justify-center flex-shrink-0">
                    <Wine className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Coquetéis & Formaturas</h4>
                    <p className="text-[11px] text-slate-400">Finger foods elegantes e serviço impecável.</p>
                  </div>
                </div>
              </div>

              {/* Optional: Switch to full buffet experience */}
              {onExploreFullBuffet && (
                <div className="pt-3 border-t border-dark-800">
                  <button
                    type="button"
                    onClick={onExploreFullBuffet}
                    className="w-full py-2.5 px-4 rounded-xl bg-dark-800 hover:bg-dark-750 text-brand-gold hover:text-amber-300 text-xs font-bold border border-brand-gold/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Explorar Apresentação Completa do Buffet</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Fast WhatsApp Quotation Form */}
          <div className="lg:col-span-7">
            <div className="bg-dark-900 border-2 border-brand-gold/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
                  Orçamento Rápido e Sem Compromisso
                </span>
                <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white mt-1">
                  Solicite sua Proposta de Buffet via WhatsApp
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Preencha os dados básicos do seu evento abaixo para gerarmos a solicitação no WhatsApp da nossa equipe de eventos:
                </p>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmitQuote} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Seu Nome Completo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Ana Clara Souza"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-800 focus:border-brand-gold text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Seu Telefone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      placeholder="Ex: (69) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-800 focus:border-brand-gold text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Event Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Tipo do Evento
                    </label>
                    <select
                      value={formData.eventType}
                      onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-800 focus:border-brand-gold text-white text-xs sm:text-sm focus:outline-none transition-colors"
                    >
                      {eventTypes.map((type) => (
                        <option key={type} value={type} className="bg-dark-950 text-white">
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Guests */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Nº Estimado de Pessoas
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 120 convidados"
                      value={formData.guestCount}
                      onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-800 focus:border-brand-gold text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Data Prevista (Opcional)
                    </label>
                    <input
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-800 focus:border-brand-gold text-white text-xs sm:text-sm focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Mensagem ou Detalhes Especiais (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Conte um pouco sobre suas ideias, local do evento ou preferências..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-dark-950 border border-dark-800 focus:border-brand-gold text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none transition-colors resize-none"
                  ></textarea>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-sm sm:text-base shadow-lg transition-all duration-300 hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Enviar Solicitação de Orçamento via WhatsApp</span>
                </button>

                <p className="text-center text-[11px] text-slate-400">
                  Ao clicar, uma mensagem formatada será aberta no WhatsApp comercial da El Shadday.
                </p>
              </form>

            </div>
          </div>

        </div>

      </div>

    </section>
  );
}
