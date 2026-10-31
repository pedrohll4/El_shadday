import React, { useState, useMemo } from 'react';
import { 
  X, Lock, DollarSign, Printer, Check, Clock, AlertTriangle, 
  Settings2, History, ChevronRight, FileText, ArrowRight, ShieldCheck,
  Calendar, CreditCard, Banknote, QrCode, Bike, Store, Sparkles
} from 'lucide-react';
import { 
  calculateShiftTotals, 
  executeCashClosing, 
  printCashClosingReceipt,
  getCashRegisterSettings,
  saveCashRegisterSettings,
  getCashClosingHistory
} from '../services/cashRegisterService';

export function CashClosingModal({
  isOpen,
  onClose,
  orders = [],
  currentUser,
  currentBranch,
  onCashClosed
}) {
  const [activeTab, setActiveTab] = useState('current'); // 'current' | 'auto-settings' | 'history'
  const [settings, setSettings] = useState(() => getCashRegisterSettings());
  const [history, setHistory] = useState(() => getCashClosingHistory());

  // Current shift form inputs
  const [initialDrawerCash, setInitialDrawerCash] = useState(() => settings.initialDrawerCash || '');
  const [closingNotes, setClosingNotes] = useState('');
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState(null);
  const [settingsFeedback, setSettingsFeedback] = useState('');

  // Auto-close form inputs
  const [autoCloseEnabled, setAutoCloseEnabled] = useState(() => settings.autoCloseEnabled !== false);
  const [autoCloseTime, setAutoCloseTime] = useState(() => settings.autoCloseTime || '23:30');

  // Calculate live totals for the active shift
  const shiftTotals = useMemo(() => {
    return calculateShiftTotals(orders, Number(initialDrawerCash) || 0);
  }, [orders, initialDrawerCash]);

  if (!isOpen) return null;

  const handleSaveAutoSettings = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const updated = saveCashRegisterSettings({
      autoCloseEnabled,
      autoCloseTime: autoCloseTime.trim() || '23:30',
      initialDrawerCash: Number(initialDrawerCash) || 0
    });
    setSettings(updated);
    setSettingsFeedback('Configurações de fechamento automático salvas com sucesso! ✅');
    setTimeout(() => setSettingsFeedback(''), 4000);
  };

  const handleConfirmCloseCash = () => {
    const operatorName = currentUser?.name || currentUser?.username || 'Gerente';
    const result = executeCashClosing({
      orders,
      closedBy: operatorName,
      closingType: 'manual',
      initialDrawerCash: Number(initialDrawerCash) || 0,
      notes: closingNotes,
      branchId: currentBranch?.id || 'ariquemes',
      branchName: currentBranch?.displayName || currentBranch?.name || 'Unidade Ariquemes'
    });

    // Update local history list
    setHistory(getCashClosingHistory());
    setIsConfirmingClose(false);

    if (onCashClosed) {
      onCashClosed(result);
    }

    // Print thermal receipt automatically or offer option
    if (window.confirm('Caixa fechado com sucesso! 🎉\n\nDeseja imprimir a comanda térmica com o relatório de fechamento de caixa agora?')) {
      printCashClosingReceipt(result.closingRecord, currentBranch);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-dark-950/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-dark-900 border border-dark-750 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-dark-800 flex items-center justify-between gap-3 bg-dark-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Controle & Fechamento de Caixa
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider">
                  Caixa em Aberto
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentBranch?.displayName || 'Unidade Ariquemes'} • Gestão de Turno
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-4 sm:px-5 pt-3 pb-2 border-b border-dark-800 bg-dark-950/40 overflow-x-auto scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab('current'); setSelectedHistoryRecord(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'current'
                ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Resumo do Caixa Atual ({shiftTotals.ordersCount} pedidos)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('auto-settings'); setSelectedHistoryRecord(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'auto-settings'
                ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Fechamento Automático ({settings.autoCloseEnabled ? settings.autoCloseTime : 'OFF'})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('history'); setSelectedHistoryRecord(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-brand-gold text-dark-950 font-black shadow-sm'
                : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico de Fechamentos ({history.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* TAB 1: CURRENT ACTIVE SHIFT SUMMARY */}
          {activeTab === 'current' && (
            <div className="space-y-4">
              
              {/* Highlight Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-dark-950 border border-brand-gold/30">
                  <span className="text-[11px] text-slate-400 block font-medium">Faturamento Bruto</span>
                  <span className="text-xl font-black text-brand-gold mt-1 block">
                    R$ {shiftTotals.grossRevenue.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Neste turno aberto</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-950 border border-dark-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Total de Pedidos</span>
                  <span className="text-xl font-black text-white mt-1 block">
                    {shiftTotals.ordersCount}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {shiftTotals.deliveryCount} entrega • {shiftTotals.balcaoCount} balcão
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-dark-950 border border-dark-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Ticket Médio</span>
                  <span className="text-xl font-black text-emerald-400 mt-1 block">
                    R$ {shiftTotals.avgTicket.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Por pedido realizado</span>
                </div>
              </div>

              {/* Payment Methods Breakdown Card */}
              <div className="p-4 rounded-2xl bg-dark-950 border border-dark-800 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-dark-800">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-brand-gold" />
                    <span>Entradas por Forma de Pagamento</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Total do Turno</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-dark-900 border border-dark-750 flex items-center justify-between">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                      <span>PIX:</span>
                    </span>
                    <span className="font-bold text-white">
                      R$ {shiftTotals.pixTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-dark-900 border border-dark-750 flex items-center justify-between">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 text-amber-400" />
                      <span>Dinheiro (Espécie):</span>
                    </span>
                    <span className="font-bold text-white">
                      R$ {shiftTotals.dinheiroTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-dark-900 border border-dark-750 flex items-center justify-between">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                      <span>Cartão de Débito:</span>
                    </span>
                    <span className="font-bold text-white">
                      R$ {shiftTotals.debitoTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-dark-900 border border-dark-750 flex items-center justify-between">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                      <span>Cartão de Crédito:</span>
                    </span>
                    <span className="font-bold text-white">
                      R$ {shiftTotals.creditoTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Delivery Fees & Motoboys */}
                <div className="p-2.5 rounded-xl bg-dark-900 border border-dark-750 flex items-center justify-between text-xs mt-1">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Bike className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Total em Taxas de Entrega (Motoboys):</span>
                  </span>
                  <span className="font-bold text-cyan-300">
                    R$ {shiftTotals.deliveryFeesTotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Cash Drawer Reconciliation (Conferência de Gaveta) */}
              <div className="p-4 rounded-2xl bg-dark-950/80 border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-amber-400" />
                    <span>Conferência Física da Gaveta de Dinheiro</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Opcional</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      (+) Fundo de Troco Inicial (R$):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={initialDrawerCash}
                      onChange={(e) => setInitialDrawerCash(e.target.value)}
                      placeholder="Ex: 100.00"
                      className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs font-bold focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-dark-900 border border-dark-750 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-400">(=) Total Esperado em Dinheiro na Gaveta:</span>
                    <span className="text-base font-black text-amber-300 mt-0.5">
                      R$ {shiftTotals.expectedDrawerCash.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Observações do Fechamento:</label>
                  <input
                    type="text"
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="Ex: Turno tranquilo, sangria de R$ 200,00 feita às 22h..."
                    className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              {/* Confirmation Alert Box when closing */}
              {isConfirmingClose ? (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 space-y-3 animate-fade-in">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-white">Tem certeza que deseja fechar o caixa agora?</h4>
                      <p className="text-xs text-amber-200/90 mt-0.5 leading-relaxed">
                        Ao fechar o caixa, os pedidos ativos sairão da tela da cozinha e ficarão salvos permanentemente em Finanças para controle. A numeração de pedidos reiniciará a partir do <strong>#01</strong> para o próximo turno.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingClose(false)}
                      className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCloseCash}
                      className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg cursor-pointer flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Sim, Fechar Caixa Agora</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => printCashClosingReceipt({
                      id: `previa-${new Date().toISOString().slice(0, 10)}`,
                      closedAt: new Date().toISOString(),
                      closedBy: currentUser?.name || 'Operador',
                      closingType: 'manual',
                      branchName: currentBranch?.displayName || 'El Shadday',
                      ...shiftTotals
                    }, currentBranch)}
                    className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-200 border border-dark-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Imprimir comanda térmica prévia dos valores sem fechar ainda"
                  >
                    <Printer className="w-4 h-4 text-brand-gold" />
                    <span>Imprimir Prévia Térmica</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsConfirmingClose(true)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:brightness-110 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Fechar Caixa do Dia</span>
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: AUTOMATIC CLOSING SCHEDULE SETTINGS */}
          {activeTab === 'auto-settings' && (
            <form onSubmit={handleSaveAutoSettings} className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-950 border border-dark-800 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Fechamento Automático de Caixa</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Defina um horário para o caixa fechar sozinho todos os dias (ex: 23:30). Quando o horário chegar, o sistema gera o fechamento, arquiva os pedidos da tela da cozinha e prepara o cardápio para o dia seguinte.
                    </p>
                  </div>
                </div>

                {/* Switch Toggle */}
                <div className="p-3.5 rounded-xl bg-dark-900 border border-dark-750 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Ativar Fechamento Automático</span>
                    <span className="text-[11px] text-slate-400">Executa o fechamento diário no horário programado</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoCloseEnabled}
                      onChange={(e) => setAutoCloseEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                    />
                    <span className={`text-xs font-bold ${autoCloseEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {autoCloseEnabled ? 'ATIVADO' : 'DESATIVADO'}
                    </span>
                  </label>
                </div>

                {/* Closing Time Input */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Horário Programado para Fechar o Caixa:
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={autoCloseTime}
                      onChange={(e) => setAutoCloseTime(e.target.value)}
                      disabled={!autoCloseEnabled}
                      className={`px-3.5 py-2.5 rounded-xl bg-dark-900 border text-sm font-bold focus:outline-none focus:border-brand-gold ${
                        autoCloseEnabled 
                          ? 'border-brand-gold/40 text-white' 
                          : 'border-dark-800 text-slate-500 cursor-not-allowed'
                      }`}
                    />
                    <span className="text-xs text-slate-400">
                      Horário de Brasília / Rondônia
                    </span>
                  </div>
                </div>

                {/* Preset quick buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-slate-400">Sugestões de horário:</span>
                  {['23:00', '23:30', '23:45', '00:00', '00:30', '01:00'].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setAutoCloseTime(h)}
                      disabled={!autoCloseEnabled}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                        autoCloseTime === h 
                          ? 'bg-brand-gold text-dark-950 border-brand-gold' 
                          : 'bg-dark-900 text-slate-300 border-dark-750 hover:bg-dark-800'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>

                {/* Information Callout */}
                <div className="p-3 rounded-xl bg-brand-gold/10 border border-brand-gold/20 text-xs text-amber-200/90 leading-relaxed">
                  💡 <strong>Como funciona na prática:</strong> Se a equipe esquecer de fechar o caixa manualmente, às <strong>{autoCloseTime}</strong> o sistema salva o relatório financeiro automaticamente, zera a fila da cozinha e reseta o número do primeiro pedido para <strong>#01</strong> para o dia seguinte.
                </div>
              </div>

              {settingsFeedback && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{settingsFeedback}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black text-xs hover:brightness-110 shadow-glow-gold cursor-pointer"
                >
                  Salvar Configuração de Horário
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CLOSING HISTORY ARCHIVE */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {selectedHistoryRecord ? (
                /* Detail View of Selected Past Closing */
                <div className="p-4 rounded-2xl bg-dark-950 border border-dark-800 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-dark-800">
                    <button
                      type="button"
                      onClick={() => setSelectedHistoryRecord(null)}
                      className="text-xs font-bold text-brand-gold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      &larr; Voltar à lista de fechamentos
                    </button>

                    <button
                      type="button"
                      onClick={() => printCashClosingReceipt(selectedHistoryRecord, currentBranch)}
                      className="px-3 py-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-200 border border-dark-750 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-brand-gold" />
                      <span>Reimprimir Comanda</span>
                    </button>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-base text-white">
                        Fechamento de Caixa • {selectedHistoryRecord.closingDate}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Fechado às {new Date(selectedHistoryRecord.closedAt).toLocaleTimeString('pt-BR')} por {selectedHistoryRecord.closedBy} ({selectedHistoryRecord.closingType === 'automatic' ? 'Fechamento Automático' : 'Manual'})
                      </p>
                    </div>

                    <span className="text-lg font-black text-brand-gold">
                      R$ {(selectedHistoryRecord.grossRevenue || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-dark-900 border border-dark-800">
                      <span className="text-slate-400 block text-[10px]">PIX</span>
                      <span className="font-bold text-white block mt-0.5">R$ {(selectedHistoryRecord.pixTotal || 0).toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-dark-900 border border-dark-800">
                      <span className="text-slate-400 block text-[10px]">Dinheiro</span>
                      <span className="font-bold text-white block mt-0.5">R$ {(selectedHistoryRecord.dinheiroTotal || 0).toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-dark-900 border border-dark-800">
                      <span className="text-slate-400 block text-[10px]">Cartão Débito</span>
                      <span className="font-bold text-white block mt-0.5">R$ {(selectedHistoryRecord.debitoTotal || 0).toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-dark-900 border border-dark-800">
                      <span className="text-slate-400 block text-[10px]">Cartão Crédito</span>
                      <span className="font-bold text-white block mt-0.5">R$ {(selectedHistoryRecord.creditoTotal || 0).toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  {/* Summary list of orders */}
                  {selectedHistoryRecord.ordersSummary && selectedHistoryRecord.ordersSummary.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-xs font-bold text-slate-300 block">
                        Pedidos incluídos neste turno ({selectedHistoryRecord.ordersSummary.length}):
                      </span>
                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                        {selectedHistoryRecord.ordersSummary.map((ord, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-dark-900 border border-dark-800 text-[11px] flex items-center justify-between">
                            <span className="text-white font-semibold">
                              #{ord.orderNumber || ord.orderId} • {ord.customerName}
                            </span>
                            <span className="text-brand-gold font-bold">
                              R$ {(ord.total || 0).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* List of historical closings */
                <div className="space-y-2">
                  {history.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 bg-dark-950 rounded-2xl border border-dark-800 space-y-2">
                      <History className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                      <p className="text-sm font-bold text-white">Nenhum fechamento de caixa registrado ainda.</p>
                      <p className="text-xs text-slate-500">
                        Quando você ou o fechamento automático encerrar o turno, os extratos aparecerão aqui.
                      </p>
                    </div>
                  ) : (
                    history.map((record) => (
                      <div
                        key={record.id}
                        onClick={() => setSelectedHistoryRecord(record)}
                        className="p-3.5 rounded-2xl bg-dark-950 border border-dark-800 hover:border-brand-gold/40 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-dark-900 border border-dark-750 flex items-center justify-center text-brand-gold group-hover:scale-105 transition-transform">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">
                                {record.closingDate}
                              </span>
                              <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                                record.closingType === 'automatic'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-brand-gold/20 text-brand-gold border border-brand-gold/30'
                              }`}>
                                {record.closingType === 'automatic' ? 'Automático' : 'Manual'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {new Date(record.closedAt).toLocaleTimeString('pt-BR')} • {record.ordersCount} pedidos
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-black text-sm text-brand-gold block">
                              R$ {(record.grossRevenue || 0).toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-[10px] text-slate-500">Faturamento</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-gold transition-colors" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
