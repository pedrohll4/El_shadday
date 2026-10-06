import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Flame, Clock, AlertTriangle, CheckCircle2, Search, 
  MapPin, User, DollarSign, Package, 
  Printer, ArrowLeft, LogOut, RefreshCw, Send, Check,
  Bike, ChefHat, BellRing
} from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';

export function AdminDashboard({ orders, onUpdateOrderStatus, onUpdatePaymentStatus, onLogout, onBackToSite }) {
  const [selectedFilter, setSelectedFilter] = useState('todos'); // 'todos' | 'atrasados' | 'pendentes' | 'preparo' | 'entrega' | 'concluidos' | 'nao_pagos'
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(Date.now());
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  const audioCtxRef = useRef(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const knownOrderIdsRef = useRef(new Set(orders.map(o => o.orderId)));

  // Sound chime helper using Web Audio API + Speech Synthesis
  const playChime = (isTest = false) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Three-tone bright restaurant order bell
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, t); // E5
      osc.frequency.setValueAtTime(830.61, t + 0.12); // G#5
      osc.frequency.setValueAtTime(987.77, t + 0.25); // B5

      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.start(t);
      osc.stop(t + 1.2);

      // Speak notification in Portuguese
      if ('speechSynthesis' in window) {
        try {
          const phrase = isTest 
            ? 'Som de alerta da cozinha ativado com sucesso!' 
            : 'Atenção cozinha! Novo pedido recebido!';
          const utterance = new SpeechSynthesisUtterance(phrase);
          utterance.lang = 'pt-BR';
          utterance.rate = 1.05;
          window.speechSynthesis.speak(utterance);
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  const handleUnlockAndTestAudio = () => {
    setIsAudioUnlocked(true);
    playChime(true);
  };

  // Watch for incoming new orders and sound the alarm
  useEffect(() => {
    const newOrders = orders.filter(o => o.orderId && !knownOrderIdsRef.current.has(o.orderId));
    
    if (newOrders.length > 0) {
      newOrders.forEach(o => knownOrderIdsRef.current.add(o.orderId));
      const newestOrder = newOrders[0];
      setNewOrderAlert(newestOrder);
      playChime(false);

      const timer = setTimeout(() => {
        setNewOrderAlert(null);
      }, 9000);
      return () => clearTimeout(timer);
    }
  }, [orders]);

  // Update clock every 10 seconds to recalculate elapsed minutes and delay flags
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Format elapsed time in minutes
  const getElapsedMinutes = (createdAt) => {
    const diffMs = now - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  // Check if order is delayed (active and older than 35 minutes)
  const isOrderDelayed = (order) => {
    if (order.orderStatus === 'CONCLUIDO') return false;
    const elapsed = getElapsedMinutes(order.createdAt);
    return elapsed >= 35; // 35+ minutes threshold for warning
  };

  // Metrics calculations
  const totalRevenue = useMemo(() => {
    return orders
      .filter(o => o.paymentStatus === 'PAGO_APROVADO' || o.orderStatus === 'CONCLUIDO')
      .reduce((acc, o) => acc + o.total, 0);
  }, [orders]);

  const pendingCount = useMemo(() => {
    return orders.filter(o => o.orderStatus === 'RECEBIDO_COZINHA').length;
  }, [orders]);

  const inPrepCount = useMemo(() => {
    return orders.filter(o => o.orderStatus === 'EM_PREPARO').length;
  }, [orders]);

  const delayedCount = useMemo(() => {
    return orders.filter(o => isOrderDelayed(o)).length;
  }, [orders, now]);

  const completedCount = useMemo(() => {
    return orders.filter(o => o.orderStatus === 'CONCLUIDO').length;
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Filter by category
      if (selectedFilter === 'atrasados' && !isOrderDelayed(order)) return false;
      if (selectedFilter === 'pendentes' && order.orderStatus !== 'RECEBIDO_COZINHA') return false;
      if (selectedFilter === 'preparo' && order.orderStatus !== 'EM_PREPARO') return false;
      if (selectedFilter === 'entrega' && order.orderStatus !== 'SAIU_ENTREGA') return false;
      if (selectedFilter === 'concluidos' && order.orderStatus !== 'CONCLUIDO') return false;
      if (selectedFilter === 'nao_pagos' && order.paymentStatus === 'PAGO_APROVADO') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = order.orderId.toLowerCase().includes(q);
        const matchesName = order.customerName.toLowerCase().includes(q);
        const matchesDistrict = (order.district || '').toLowerCase().includes(q);
        return matchesId || matchesName || matchesDistrict;
      }

      return true;
    });
  }, [orders, selectedFilter, searchQuery, now]);

  const handlePrintOrder = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Comanda #${order.orderId} - El Shadday</title>
          <style>
            body { font-family: monospace; font-size: 13px; max-width: 320px; padding: 10px; margin: 0 auto; }
            h2, h3 { text-align: center; margin: 5px 0; }
            hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
            .item { margin-bottom: 8px; }
            .bold { font-weight: bold; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <h2>EL SHADDAY DELIVERY</h2>
          <h3>COMANDA #${order.orderId}</h3>
          <div>Data: ${new Date(order.createdAt).toLocaleString('pt-BR')}</div>
          <hr />
          <div><span class="bold">Cliente:</span> ${order.customerName}</div>
          <div><span class="bold">Tipo:</span> ${order.deliveryType === 'delivery' ? 'ENTREGA' : 'RETIRADA NO BALCÃO'}</div>
          ${order.deliveryType === 'delivery' ? `
            <div><span class="bold">Bairro:</span> ${order.district}</div>
            <div><span class="bold">End:</span> ${order.address}, Nº ${order.number || 'S/N'}</div>
            ${order.reference ? `<div><span class="bold">Ref:</span> ${order.reference}</div>` : ''}
          ` : ''}
          <hr />
          <div class="bold">ITENS DO PEDIDO:</div>
          ${order.items.map(it => `
            <div class="item">
              <div class="bold">${it.quantity}x ${it.name}</div>
              ${it.isCustomBox && it.salgadasDetails ? `<div>- Salg: ${Object.entries(it.salgadasDetails).map(([k,v]) => `${v}x ${k}`).join(', ')}</div>` : ''}
              ${it.isCustomBox && it.docesDetails ? `<div>- Doces: ${Object.entries(it.docesDetails).map(([k,v]) => `${v}x ${k}`).join(', ')}</div>` : ''}
              ${it.notes ? `<div>- OBS: ${it.notes}</div>` : ''}
            </div>
          `).join('')}
          <hr />
          <div>Subtotal: R$ ${order.subtotal.toFixed(2)}</div>
          <div>Taxa Entrega: R$ ${order.deliveryFee.toFixed(2)}</div>
          <div class="bold" style="font-size: 15px;">TOTAL: R$ ${order.total.toFixed(2)}</div>
          <hr />
          <div><span class="bold">Pagamento:</span> ${order.paymentMethod}</div>
          <div><span class="bold">Status:</span> ${order.paymentStatus === 'PAGO_APROVADO' ? 'PAGO NO SITE' : 'RECEBER NA ENTREGA'}</div>
          <hr />
          <div style="text-align: center; font-size: 11px;">Ariquemes - RO • (69) 99222-8682</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans">
      
      {/* Real-time Order Alert Banner */}
      {newOrderAlert && (
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-dark-950 font-black px-4 py-3 flex items-center justify-between shadow-2xl animate-bounce-subtle z-50 sticky top-0">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <BellRing className="w-5 h-5 animate-pulse" />
            <span>NOVO PEDIDO CHEGOU NA COZINHA! #{newOrderAlert.orderId} - {newOrderAlert.customerName} (R$ {newOrderAlert.total.toFixed(2).replace('.', ',')})</span>
          </div>
          <button
            onClick={() => setNewOrderAlert(null)}
            className="text-xs bg-dark-950 text-white px-2.5 py-1 rounded-lg"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-dark-900 border-b border-dark-800 sticky top-0 z-40 px-4 sm:px-6 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/30">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-base sm:text-lg text-white">
                  Painel de Controle da Pizzaria
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  🟢 Servidor Sincronizado
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                El Shadday Ariquemes • Gestão de Cozinha (KDS) & Delivery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio activation and test button */}
            <button
              onClick={handleUnlockAndTestAudio}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isAudioUnlocked
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40'
                  : 'bg-gradient-to-r from-brand-gold to-amber-400 text-dark-950 font-black animate-pulse shadow-glow-gold'
              }`}
              title="Clique para ativar e testar o aviso sonoro da cozinha"
            >
              <BellRing className="w-4 h-4" />
              <span>{isAudioUnlocked ? '🔔 Som: Ativo (Testar)' : '🔔 ATIVAR SOM DO ALERTA'}</span>
            </button>

            <button
              onClick={onBackToSite}
              className="px-3.5 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 font-semibold text-xs border border-dark-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ver Site / Cardápio</span>
            </button>

            <button
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-xs border border-red-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sair do painel administrativo"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          
          {/* Card 1: Faturamento */}
          <div className="p-4 rounded-2xl bg-dark-900 border border-dark-800 shadow-md flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Faturamento Total</div>
              <div className="text-lg sm:text-xl font-black text-white">
                R$ {totalRevenue.toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>

          {/* Card 2: Pedidos Pendentes */}
          <div className="p-4 rounded-2xl bg-dark-900 border border-dark-800 shadow-md flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Novos / Pendentes</div>
              <div className="text-lg sm:text-xl font-black text-amber-400">
                {pendingCount}
              </div>
            </div>
          </div>

          {/* Card 3: Na Cozinha */}
          <div className="p-4 rounded-2xl bg-dark-900 border border-dark-800 shadow-md flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">No Forno / Preparo</div>
              <div className="text-lg sm:text-xl font-black text-brand-gold">
                {inPrepCount}
              </div>
            </div>
          </div>

          {/* Card 4: EM ATRASO (ALERT!) */}
          <div className={`p-4 rounded-2xl border shadow-md flex items-center gap-3 ${
            delayedCount > 0 
              ? 'bg-red-500/15 border-red-500/50 text-red-400 animate-pulse' 
              : 'bg-dark-900 border-dark-800 text-slate-400'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              delayedCount > 0 ? 'bg-red-500 text-dark-950 font-bold' : 'bg-dark-800 text-slate-500'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider">
                {delayedCount > 0 ? '🚨 Em Atraso (+35 min)' : 'Em Atraso'}
              </div>
              <div className="text-lg sm:text-xl font-black text-white">
                {delayedCount}
              </div>
            </div>
          </div>

          {/* Card 5: Concluídos */}
          <div className="p-4 rounded-2xl bg-dark-900 border border-dark-800 shadow-md flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Entregues / Prontos</div>
              <div className="text-lg sm:text-xl font-black text-white">
                {completedCount}
              </div>
            </div>
          </div>

        </div>

        {/* Filter Bar & Search */}
        <div className="p-4 rounded-2xl bg-dark-900 border border-dark-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedFilter('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedFilter === 'todos' 
                    ? 'bg-brand-gold text-dark-950' 
                    : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                }`}
              >
                Todos ({orders.length})
              </button>

              <button
                onClick={() => setSelectedFilter('atrasados')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  selectedFilter === 'atrasados' 
                    ? 'bg-red-500 text-white font-black' 
                    : 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Em Atraso ({delayedCount})</span>
              </button>

              <button
                onClick={() => setSelectedFilter('pendentes')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedFilter === 'pendentes' 
                    ? 'bg-amber-500 text-dark-950 font-black' 
                    : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                }`}
              >
                Pendentes ({pendingCount})
              </button>

              <button
                onClick={() => setSelectedFilter('preparo')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedFilter === 'preparo' 
                    ? 'bg-brand-gold text-dark-950 font-black' 
                    : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                }`}
              >
                No Forno ({inPrepCount})
              </button>

              <button
                onClick={() => setSelectedFilter('entrega')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedFilter === 'entrega' 
                    ? 'bg-blue-500 text-white font-black' 
                    : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                }`}
              >
                Saiu p/ Entrega
              </button>

              <button
                onClick={() => setSelectedFilter('nao_pagos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedFilter === 'nao_pagos' 
                    ? 'bg-amber-400 text-dark-950 font-black' 
                    : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
                }`}
              >
                Dinheiro / A Cobrar
              </button>
            </div>

            {/* Search input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por Nº, Nome ou Bairro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-gold"
              />
            </div>

          </div>
        </div>

        {/* Orders Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Mostrando <strong>{filteredOrders.length}</strong> pedidos</span>
            <span className="flex items-center gap-1 text-[11px] text-brand-gold">
              <RefreshCw className="w-3 h-3 animate-spin-slow" />
              Sincronização em tempo real ativa
            </span>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-12 rounded-3xl bg-dark-900 border border-dark-800 text-center space-y-2">
              <Package className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-slate-300">Nenhum pedido encontrado nesta seção.</div>
              <p className="text-xs text-slate-500">Faça um novo pedido no site ou mude os filtros acima.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map((order) => {
                const elapsedMin = getElapsedMinutes(order.createdAt);
                const isDelayed = isOrderDelayed(order);
                const isPaid = order.paymentStatus === 'PAGO_APROVADO';

                return (
                  <div
                    key={order.orderId}
                    className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all shadow-md ${
                      isDelayed
                        ? 'bg-red-950/20 border-red-500/60 ring-1 ring-red-500/40'
                        : order.orderStatus === 'CONCLUIDO'
                        ? 'bg-dark-900/60 border-dark-800 opacity-70'
                        : 'bg-dark-900 border-dark-800 hover:border-brand-gold/50'
                    }`}
                  >
                    <div>
                      {/* Top Header of the card */}
                      <div className="flex items-start justify-between gap-2 border-b border-dark-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-black text-lg text-white">
                              #{order.orderId}
                            </span>

                            {/* Delay warning pill */}
                            {isDelayed && (
                              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-black text-[10px] uppercase flex items-center gap-1 animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                ATRASO ({elapsedMin} min)
                              </span>
                            )}

                            {!isDelayed && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3 text-brand-gold" />
                                {elapsedMin === 0 ? 'Agora mesmo' : `há ${elapsedMin} min`}
                              </span>
                            )}
                          </div>

                          <div className="text-xs font-bold text-white mt-1 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-brand-gold" />
                            <span>{order.customerName}</span>
                          </div>
                        </div>

                        {/* Payment Status Pill */}
                        <div className="text-right">
                          {isPaid ? (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-[11px] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>PAGO NO SITE</span>
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold text-[11px] inline-flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>COBRAR NA ENTREGA</span>
                              </span>
                              <button
                                onClick={() => onUpdatePaymentStatus(order.orderId, 'PAGO_APROVADO')}
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 underline block text-right cursor-pointer"
                              >
                                Marcar como Pago
                              </button>
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 mt-1">
                            {order.paymentMethod}
                          </div>
                        </div>
                      </div>

                      {/* Delivery address & info */}
                      <div className="py-2.5 text-xs text-slate-300 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" />
                          <span>
                            <strong>{order.deliveryType === 'delivery' ? order.district : 'Retirada no Balcão (Setor 03)'}</strong>
                            {order.deliveryType === 'delivery' && ` • ${order.address}, Nº ${order.number || 'S/N'}`}
                          </span>
                        </div>
                        {order.reference && (
                          <div className="text-[11px] text-brand-goldLight pl-5">
                            Ponto de Referência: {order.reference}
                          </div>
                        )}
                      </div>

                      {/* Items List (Kitchen preparation list) */}
                      <div className="bg-dark-950 p-3 rounded-xl border border-dark-850 space-y-2 mt-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          O que precisa ser feito:
                        </div>
                        <div className="space-y-1.5 text-xs">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="border-b border-dark-900 pb-1 last:border-0 last:pb-0">
                              <div className="font-bold text-white flex items-center justify-between">
                                <span>{it.quantity}x {it.name}</span>
                                <span className="text-slate-400 text-[11px]">
                                  R$ {(it.price * it.quantity).toFixed(2).replace('.', ',')}
                                </span>
                              </div>

                              {/* Box details */}
                              {it.isCustomBox && (
                                <div className="text-[11px] text-brand-goldLight pl-2 mt-0.5 space-y-0.5">
                                  {it.salgadasDetails && (
                                    <div>🥟 <strong>Salg:</strong> {Object.entries(it.salgadasDetails).map(([k, v]) => `${v}x ${k}`).join(', ')}</div>
                                  )}
                                  {it.docesDetails && (
                                    <div>🍫 <strong>Doces:</strong> {Object.entries(it.docesDetails).map(([k, v]) => `${v}x ${k}`).join(', ')}</div>
                                  )}
                                </div>
                              )}

                              {(it.semSuinos || it.semSuinosEsfirras) && (
                                <div className="text-[11px] text-red-400 font-extrabold pl-2 bg-red-950/40 p-1 rounded border border-red-500/40 mt-0.5">
                                  🚫 ATENÇÃO COZINHA: SEM CARNE SUÍNA (SEM CALABRESA / BACON)
                                </div>
                              )}

                              {it.notes && (
                                <div className="text-[11px] text-amber-300 font-semibold pl-2">
                                  ⚠️ OBS: {it.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total */}
                      <div className="flex justify-between items-baseline pt-3 text-xs">
                        <span className="text-slate-400">Total com Entrega:</span>
                        <span className="text-lg font-black text-brand-gold">
                          R$ {order.total.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>

                    {/* Operational Action Controls */}
                    <div className="pt-4 border-t border-dark-800 mt-4 flex flex-wrap items-center justify-between gap-2">
                      
                      {/* Kitchen print button */}
                      <button
                        onClick={() => handlePrintOrder(order)}
                        className="p-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-dark-700 transition-colors cursor-pointer"
                        title="Imprimir comanda para a cozinha"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir</span>
                      </button>

                      {/* Status Progress Button */}
                      <div className="flex items-center gap-1.5">
                        
                        {order.orderStatus === 'RECEBIDO_COZINHA' && (
                          <button
                            onClick={() => onUpdateOrderStatus(order.orderId, 'EM_PREPARO')}
                            className="px-3.5 py-2 rounded-xl bg-brand-gold hover:bg-amber-400 text-dark-950 font-bold text-xs flex items-center gap-1.5 shadow-glow-gold transition-all cursor-pointer"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>Mover p/ Forno</span>
                          </button>
                        )}

                        {order.orderStatus === 'EM_PREPARO' && (
                          <button
                            onClick={() => onUpdateOrderStatus(order.orderId, 'SAIU_ENTREGA')}
                            className="px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                          >
                            <Bike className="w-3.5 h-3.5" />
                            <span>Despachar Entrega</span>
                          </button>
                        )}

                        {order.orderStatus === 'SAIU_ENTREGA' && (
                          <button
                            onClick={() => onUpdateOrderStatus(order.orderId, 'CONCLUIDO')}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Marcar Entregue</span>
                          </button>
                        )}

                        {order.orderStatus === 'CONCLUIDO' && (
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Concluído</span>
                          </span>
                        )}

                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </main>

    </div>
  );
}
