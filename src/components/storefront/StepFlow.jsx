import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, X, Plus, Minus, Check, ArrowRight, AlertCircle, Search, Pizza } from 'lucide-react';

/*
 * Tela de pedido "uma pergunta por vez" (estilo Só Pizzas), nas cores da El Shadday.
 *
 * steps: [{
 *   id, title,            // ex.: "Sabores", "Escolha o refri"
 *   hint,                 // texto pequeno abaixo do título (opcional)
 *   min, max, count,      // para o selo "Falta 1" / "1 / 2"
 *   missingText,          // mensagem quando tenta avançar sem completar
 *   content               // JSX com as opções
 * }]
 */

export const money = (v) => `R$ ${(Number(v) || 0).toFixed(2).replace('.', ',')}`;

export function StepFlow({
  isOpen,
  onClose,
  product,
  summary,          // linhas do resumo no topo (ex.: ["Selecione até 2 sabores", "Selecione o refri"])
  steps,
  unitPrice,
  allowQuantity = true,
  isStoreOpen = true,
  onFinish,         // (quantidade) => void
  finishLabel = 'Adicionar'
}) {
  const [index, setIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [shake, setShake] = useState('');
  const bodyRef = useRef(null);

  useEffect(() => {
    if (isOpen) { setIndex(0); setQty(1); setShake(''); }
  }, [isOpen, product?.id]);

  // Trava a rolagem da página por trás
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
    setShake('');
  }, [index]);

  if (!isOpen || !product || !steps || steps.length === 0) return null;

  const safeIndex = Math.min(index, steps.length - 1);
  const step = steps[safeIndex];
  const isLast = safeIndex === steps.length - 1;
  const min = Number(step.min) || 0;
  const count = Number(step.count) || 0;
  const missing = Math.max(0, min - count);

  const goNext = () => {
    if (missing > 0) {
      setShake(step.missingText || (missing === 1 ? 'Escolha mais 1 opção para continuar' : `Escolha mais ${missing} opções para continuar`));
      return;
    }
    if (isLast) {
      if (!isStoreOpen) {
        setShake('A loja está fechada agora. Não dá para adicionar à sacola.');
        return;
      }
      onFinish(qty);
      return;
    }
    setIndex(safeIndex + 1);
  };

  const goBack = () => {
    if (safeIndex === 0) onClose();
    else setIndex(safeIndex - 1);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-stretch sm:items-center justify-center bg-black/75" role="dialog" aria-modal="true">
      <div className="relative w-full sm:max-w-lg h-[100dvh] sm:h-[92vh] bg-dark-950 sm:rounded-3xl sm:border sm:border-white/10 overflow-hidden flex flex-col">

        {/* Barra superior */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5 bg-dark-950">
          <button type="button" onClick={goBack} className="w-10 h-10 rounded-full bg-dark-900 text-slate-200 flex items-center justify-center cursor-pointer" aria-label="Voltar">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <p className="flex-1 text-center font-bold text-white truncate px-1">{product.name}</p>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-full bg-dark-900 text-slate-200 flex items-center justify-center cursor-pointer" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={bodyRef} className="flex-1 overflow-y-auto">
          {/* Foto e descrição só na primeira etapa */}
          {safeIndex === 0 && (
            <div>
              {product.image && (
                <div className="h-44 sm:h-52 bg-dark-900">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
              )}
              <div className="px-4 pt-3 pb-1">
                {product.description && <p className="text-[13px] text-slate-400 leading-snug">{product.description}</p>}
              </div>
            </div>
          )}

          {/* Lista das etapas (o que falta escolher) */}
          {(summary || steps.length > 1) && (
            <div className="px-4 pt-3 flex flex-wrap gap-1.5">
              {steps.map((s, i) => {
                const done = i < safeIndex;
                const current = i === safeIndex;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { if (i < safeIndex) setIndex(i); }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold border ${
                      current ? 'bg-brand-gold text-dark-950 border-brand-gold'
                        : done ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 cursor-pointer'
                        : 'bg-dark-900 text-slate-500 border-white/5'
                    }`}
                  >
                    {done && <Check className="w-3 h-3" />}
                    {s.shortTitle || s.title}
                  </button>
                );
              })}
            </div>
          )}

          {/* Título da etapa + selo */}
          <div className="sticky top-0 z-10 bg-dark-950 px-4 pt-4 pb-3 border-b border-white/5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white leading-tight">{step.title}</h2>
              {step.max > 0 || min > 0 ? (
                missing > 0 ? (
                  <span className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-bold">
                    <AlertCircle className="w-3.5 h-3.5" /> Falta {missing}
                  </span>
                ) : (
                  <span className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-xs font-bold">
                    {step.max > 0 ? `${count} / ${step.max}` : <Check className="w-4 h-4" />}
                  </span>
                )
              ) : (
                <span className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-dark-900 text-slate-400 text-xs font-semibold">Opcional</span>
              )}
            </div>
            {step.hint && (
              <p className="mt-2 flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-900 text-[12px] text-slate-300">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-brand-gold" /> {step.hint}
              </p>
            )}
          </div>

          <div className="px-3 py-3">{step.content}</div>
        </div>

        {/* Rodapé fixo */}
        <div className="border-t border-white/10 bg-dark-900 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {steps.length > 1 && (
            <div className="flex justify-center gap-1.5 mb-2">
              {steps.map((s, i) => (
                <span key={s.id} className={`h-1.5 rounded-full transition-all ${i === safeIndex ? 'w-5 bg-brand-gold' : i < safeIndex ? 'w-1.5 bg-emerald-400' : 'w-1.5 bg-dark-700'}`} />
              ))}
            </div>
          )}
          {shake && (
            <p className="mb-2 text-center text-[13px] font-semibold text-red-300">{shake}</p>
          )}
          <div className="flex items-center gap-2.5">
            {allowQuantity && (
              <div className="flex items-center rounded-xl border border-white/10 bg-dark-950">
                <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} className="w-11 h-12 flex items-center justify-center text-slate-200 cursor-pointer" aria-label="Diminuir">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-6 text-center font-bold text-white">{qty}</span>
                <button type="button" onClick={() => setQty(q => Math.min(50, q + 1))} className="w-11 h-12 flex items-center justify-center text-slate-200 cursor-pointer" aria-label="Aumentar">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={goNext}
              className={`flex-1 h-12 rounded-xl px-4 flex items-center justify-between font-bold text-[15px] transition-colors cursor-pointer ${
                missing > 0 ? 'bg-dark-700 text-slate-300' : 'bg-brand-gold text-dark-950'
              }`}
            >
              <span>{money((Number(unitPrice) || 0) * qty)}</span>
              <span className="flex items-center gap-1.5">
                {isLast ? finishLabel : 'Próximo'}
                {isLast ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Linha de opção: foto à esquerda, nome/descrição/preço, marcador à direita */
export function OptionRow({ title, description, priceText, image, imageFit = 'cover', selected, disabled, onClick, multi = true, badge, fallbackIcon: FallbackIcon = Pizza }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled && !selected}
      className={`w-full text-left flex items-center gap-3 p-2.5 rounded-2xl border transition-colors cursor-pointer ${
        selected ? 'bg-brand-gold/10 border-brand-gold' : 'bg-dark-900 border-white/[0.06]'
      } ${disabled && !selected ? 'opacity-40' : ''}`}
    >
      {image !== undefined && (
        <span className="w-16 h-16 rounded-xl overflow-hidden bg-dark-950 flex-shrink-0 flex items-center justify-center">
          {image ? (
            <img src={image} alt="" loading="lazy" className={`w-full h-full ${imageFit === 'contain' ? 'object-contain p-0.5 drop-shadow-md' : 'object-cover'}`} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <FallbackIcon className="w-7 h-7 text-brand-gold/40" />
          )}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-[15px] text-white leading-snug">{title}</span>
          {badge && <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-brand-gold/15 text-brand-goldLight">{badge}</span>}
        </span>
        {description && <span className="block mt-0.5 text-[13px] text-slate-400 leading-snug line-clamp-2">{description}</span>}
        {priceText && <span className="block mt-0.5 text-[14px] font-bold text-emerald-400">{priceText}</span>}
      </span>
      <span
        className={`flex-shrink-0 w-9 h-9 flex items-center justify-center ${multi ? 'rounded-xl' : 'rounded-full'} border-2 ${
          selected ? 'bg-brand-gold border-brand-gold text-dark-950' : 'border-slate-600 text-slate-300'
        }`}
      >
        {selected ? <Check className="w-5 h-5 stroke-[3]" /> : multi ? <Plus className="w-5 h-5" /> : null}
      </span>
    </button>
  );
}

/* Busca + filtros de categoria para listas grandes (sabores) */
export function OptionFilters({ search, onSearch, categories, active, onCategory, labels = {} }) {
  return (
    <div className="space-y-2 mb-3">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-dark-900 border border-white/10">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar sabor"
          className="flex-1 bg-transparent text-[15px] text-white placeholder-slate-500 focus:outline-none"
        />
      </div>
      {categories && categories.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {['todos', ...categories].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => onCategory(c)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[13px] font-semibold cursor-pointer ${
                active === c ? 'bg-brand-gold text-dark-950' : 'bg-dark-900 text-slate-300 border border-white/10'
              }`}
            >
              {c === 'todos' ? 'Todos' : (labels[c] || c.charAt(0).toUpperCase() + c.slice(1))}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* Campo de observação (última etapa) */
export function NotesStep({ value, onChange, placeholder }) {
  return (
    <div>
      <p className="text-[14px] text-slate-300 mb-2">Quer avisar alguma coisa para a cozinha?</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        maxLength={300}
        placeholder={placeholder || 'Ex.: sem cebola, bem assada, cortar em pedaços menores...'}
        className="w-full p-3 rounded-xl bg-dark-900 border border-white/10 text-[15px] text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
      />
      <p className="mt-1 text-xs text-slate-500">Se não precisar, é só tocar em Adicionar.</p>
    </div>
  );
}
