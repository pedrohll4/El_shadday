import React, { useState, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, CheckCircle2, ShoppingBag, 
  Store, Calendar, Percent, ArrowUpRight, Filter, 
  ChevronRight, Award, Flame, Search, AlertCircle, Clock,
  ArrowRight, ShieldCheck, PieChart, Sparkles, Sliders
} from 'lucide-react';

export function MasterFinancialView({ 
  orders = [], 
  branches = [], 
  onNavigateToBranchMenu, 
  onNavigateToBranchKitchen 
}) {
  const [periodFilter, setPeriodFilter] = useState('all'); // 'today' | '7days' | 'month' | 'all'
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');
  const [profitMarginPercent, setProfitMarginPercent] = useState(() => {
    try {
      const saved = localStorage.getItem('el_shadday_profit_margin');
      return saved ? Number(saved) : 45; // 45% margem líquida média estimada padrão
    } catch (e) {
      return 45;
    }
  });
  const [isEditingMargin, setIsEditingMargin] = useState(false);
  const [tempMargin, setTempMargin] = useState(profitMarginPercent);
  const [searchOrderQuery, setSearchOrderQuery] = useState('');

  const handleSaveMargin = () => {
    const valid = Math.min(Math.max(Number(tempMargin) || 45, 5), 90);
    setProfitMarginPercent(valid);
    try {
      localStorage.setItem('el_shadday_profit_margin', String(valid));
    } catch (e) {}
    setIsEditingMargin(false);
  };

  // Filter orders by period
  const periodFilteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
      if (!order.createdAt) return true;
      const orderDate = new Date(order.createdAt);
      if (isNaN(orderDate.getTime())) return true;

      if (periodFilter === 'today') {
        return (
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      if (periodFilter === '7days') {
        const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      }
      if (periodFilter === 'month') {
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      return true; // 'all'
    });
  }, [orders, periodFilter]);

  // Financial Metrics (Consolidated)
  const consolidatedMetrics = useMemo(() => {
    const validOrders = periodFilteredOrders.filter(o => o.orderStatus !== 'CANCELADO');
    const completedOrders = periodFilteredOrders.filter(o => 
      o.orderStatus === 'CONCLUIDO' || 
      o.orderStatus === 'SAIU_ENTREGA' ||
      o.status === 'CONCLUIDO'
    );

    const grossRevenue = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const estimatedProfit = (grossRevenue * profitMarginPercent) / 100;
    const estimatedCost = grossRevenue - estimatedProfit;
    const ordersCount = validOrders.length;
    const avgTicket = ordersCount > 0 ? grossRevenue / ordersCount : 0;

    return {
      grossRevenue,
      estimatedProfit,
      estimatedCost,
      ordersCount,
      completedCount: completedOrders.length,
      avgTicket
    };
  }, [periodFilteredOrders, profitMarginPercent]);

  // Branch by Branch breakdown
  const branchBreakdown = useMemo(() => {
    return branches.map(branch => {
      const branchOrders = periodFilteredOrders.filter(o => {
        const orderBranchId = o.branchId || 'ariquemes';
        return orderBranchId === branch.id;
      });

      const validBranchOrders = branchOrders.filter(o => o.orderStatus !== 'CANCELADO');
      const revenue = validBranchOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const profit = (revenue * profitMarginPercent) / 100;
      const count = validBranchOrders.length;
      const sharePercent = consolidatedMetrics.grossRevenue > 0 
        ? (revenue / consolidatedMetrics.grossRevenue) * 100 
        : 0;

      return {
        ...branch,
        revenue,
        profit,
        ordersCount: count,
        sharePercent: Math.round(sharePercent * 10) / 10
      };
    });
  }, [branches, periodFilteredOrders, consolidatedMetrics.grossRevenue, profitMarginPercent]);

  // Product Ranking (Top items sold)
  const topProducts = useMemo(() => {
    const itemCounts = {};
    periodFilteredOrders.forEach(order => {
      if (order.orderStatus === 'CANCELADO') return;
      if (Array.isArray(order.items)) {
        order.items.forEach(it => {
          const name = it.name || 'Produto sem nome';
          const qty = Number(it.quantity) || 1;
          const totalVal = (Number(it.price) || 0) * qty;
          if (!itemCounts[name]) {
            itemCounts[name] = { name, quantity: 0, revenue: 0 };
          }
          itemCounts[name].quantity += qty;
          itemCounts[name].revenue += totalVal;
        });
      }
    });

    return Object.values(itemCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [periodFilteredOrders]);

  // Table Orders (with branch filter & search)
  const displayOrders = useMemo(() => {
    return periodFilteredOrders.filter(order => {
      const orderBranch = order.branchId || 'ariquemes';
      if (selectedBranchFilter !== 'all' && orderBranch !== selectedBranchFilter) {
        return false;
      }
      if (searchOrderQuery.trim()) {
        const query = searchOrderQuery.toLowerCase();
        const matchesName = (order.customerName || '').toLowerCase().includes(query);
        const matchesId = (order.orderId || '').toLowerCase().includes(query);
        const matchesPhone = (order.customerPhone || '').toLowerCase().includes(query);
        return matchesName || matchesId || matchesPhone;
      }
      return true;
    });
  }, [periodFilteredOrders, selectedBranchFilter, searchOrderQuery]);

  return (
    <div className="space-y-6 animate-fade-in text-white">
      
      {/* Header & Period Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-brand-gold/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-brand-gold/20 text-brand-gold border border-brand-gold/40">
              👑 Painel Estratégico Master
            </span>
            <span className="text-xs text-slate-400">
              Visão Consolidada de Todas as Filiais
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-black text-white mt-1">
            Faturamento, Lucro & Desempenho das Filiais
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-dark-950 p-1 rounded-2xl border border-dark-800">
            {[
              { id: 'today', label: 'Hoje' },
              { id: '7days', label: '7 Dias' },
              { id: 'month', label: 'Este Mês' },
              { id: 'all', label: 'Todo o Período' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriodFilter(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  periodFilter === p.id 
                    ? 'bg-brand-gold text-dark-950 font-black shadow-glow-gold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setTempMargin(profitMarginPercent);
              setIsEditingMargin(!isEditingMargin);
            }}
            className="px-3 py-2 rounded-2xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ajustar margem de lucro estimada"
          >
            <Sliders className="w-3.5 h-3.5 text-brand-gold" />
            <span>Margem: {profitMarginPercent}%</span>
          </button>
        </div>
      </div>

      {/* Margin Adjust Popover */}
      {isEditingMargin && (
        <div className="p-4 rounded-2xl bg-dark-900 border border-brand-gold/40 flex flex-wrap items-center justify-between gap-3 animate-fade-in shadow-xl">
          <div className="flex items-center gap-3">
            <Percent className="w-5 h-5 text-brand-gold" />
            <div>
              <div className="text-xs font-bold text-white">Configurar Margem de Lucro Média Estimada (%)</div>
              <div className="text-[11px] text-slate-400">
                Usada para calcular o lucro estimado sobre o faturamento bruto das filiais.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="5"
              max="90"
              value={tempMargin}
              onChange={(e) => setTempMargin(e.target.value)}
              className="w-20 px-3 py-1.5 rounded-xl bg-dark-950 border border-dark-700 text-white font-bold text-center text-sm focus:border-brand-gold focus:outline-none"
            />
            <span className="text-xs text-slate-400 font-bold">%</span>
            <button
              onClick={handleSaveMargin}
              className="px-3.5 py-1.5 rounded-xl bg-brand-gold text-dark-950 font-black text-xs hover:bg-amber-400 transition-colors cursor-pointer"
            >
              Salvar
            </button>
            <button
              onClick={() => setIsEditingMargin(false)}
              className="px-2.5 py-1.5 rounded-xl bg-dark-800 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Faturamento Bruto Total */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-dark-900 via-dark-850 to-dark-900 border border-dark-800 relative overflow-hidden group hover:border-emerald-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Faturamento Bruto</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-display font-black text-white">
              R$ {consolidatedMetrics.grossRevenue.toFixed(2).replace('.', ',')}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Receita total acumulada no período</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Lucro Líquido Estimado */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-dark-900 via-dark-850 to-dark-900 border border-brand-gold/40 relative overflow-hidden group hover:border-brand-gold transition-all shadow-lg shadow-brand-gold/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">Lucro Estimado ({profitMarginPercent}%)</span>
            <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 text-brand-gold flex items-center justify-center border border-brand-gold/40">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-display font-black text-brand-gold">
              R$ {consolidatedMetrics.estimatedProfit.toFixed(2).replace('.', ',')}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">
              Custos operacionais est.: R$ {consolidatedMetrics.estimatedCost.toFixed(2).replace('.', ',')}
            </div>
          </div>
        </div>

        {/* KPI 3: Pedidos Vendidos */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-dark-900 via-dark-850 to-dark-900 border border-dark-800 relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pedidos Vendidos</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-display font-black text-white">
              {consolidatedMetrics.ordersCount}
            </div>
            <div className="text-[11px] text-amber-400 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{consolidatedMetrics.completedCount} entregues / finalizados</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Ticket Médio Consolidado */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-dark-900 via-dark-850 to-dark-900 border border-dark-800 relative overflow-hidden group hover:border-purple-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ticket Médio</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-display font-black text-white">
              R$ {consolidatedMetrics.avgTicket.toFixed(2).replace('.', ',')}
            </div>
            <div className="text-[11px] text-purple-400 font-medium mt-1">
              Média de valor por pedido realizado
            </div>
          </div>
        </div>

      </div>

      {/* Branch Comparison Cards (Ariquemes vs Porto Velho) */}
      <div className="p-6 rounded-3xl bg-dark-900 border border-dark-800 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dark-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center border border-brand-gold/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base sm:text-lg text-white">
                Comparativo de Faturamento Entre Filiais
              </h3>
              <p className="text-xs text-slate-400">
                Acompanhe em tempo real a divisão de vendas e o lucro de cada unidade.
              </p>
            </div>
          </div>
        </div>

        {/* Visual Share Bar */}
        <div className="space-y-1.5">
          <div className="text-xs font-bold text-slate-400 flex justify-between">
            <span>Participação nas Vendas (%)</span>
            <span>Total: 100%</span>
          </div>
          <div className="h-4 w-full bg-dark-950 rounded-full overflow-hidden flex border border-dark-800">
            {branchBreakdown.map((b, idx) => {
              const colors = [
                'bg-gradient-to-r from-amber-400 to-brand-gold',
                'bg-gradient-to-r from-blue-500 to-indigo-500',
                'bg-gradient-to-r from-emerald-400 to-teal-500',
                'bg-gradient-to-r from-purple-400 to-pink-500'
              ];
              const colorClass = colors[idx % colors.length];
              return (
                <div
                  key={b.id}
                  style={{ width: `${b.sharePercent || (idx === 0 ? 100 : 0)}%` }}
                  className={`${colorClass} transition-all duration-500 relative group`}
                  title={`${b.displayName}: ${b.sharePercent}% (R$ ${b.revenue.toFixed(2)})`}
                />
              );
            })}
          </div>
        </div>

        {/* Branch Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {branchBreakdown.map((b, idx) => {
            const isAriquemes = b.id === 'ariquemes';
            return (
              <div 
                key={b.id}
                className="p-5 rounded-2xl bg-dark-950 border border-dark-800 hover:border-brand-gold/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${b.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                      {b.name}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      b.status === 'active' 
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {b.badge || (b.status === 'active' ? 'Ativa' : 'Em Obras')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{b.displayName}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-2 border-y border-dark-850">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Faturamento</div>
                    <div className="text-base font-black text-white">
                      R$ {b.revenue.toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-brand-gold font-semibold uppercase">Lucro Est.</div>
                    <div className="text-base font-black text-brand-gold">
                      R$ {b.profit.toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Pedidos</div>
                    <div className="text-sm font-bold text-white">
                      {b.ordersCount} vendas
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Participação</div>
                    <div className="text-sm font-bold text-white">
                      {b.sharePercent}%
                    </div>
                  </div>
                </div>

                {/* Direct Branch Access Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {onNavigateToBranchMenu && (
                    <button
                      onClick={() => onNavigateToBranchMenu(b.id)}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-xs font-bold text-slate-300 hover:text-white border border-dark-750 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Gerenciar cardápio e preços desta filial"
                    >
                      <span>Cardápio</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {onNavigateToBranchKitchen && (
                    <button
                      onClick={() => onNavigateToBranchKitchen(b.id)}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-brand-gold/15 hover:bg-brand-gold/25 text-xs font-bold text-brand-gold border border-brand-gold/30 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Acessar painel da cozinha desta filial"
                    >
                      <span>Cozinha KDS</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Two columns: Top Products Ranking & Consolidated Order History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Top 5 Itens Mais Vendidos */}
        <div className="p-5 rounded-3xl bg-dark-900 border border-dark-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 border-b border-dark-800 pb-3">
            <Award className="w-5 h-5 text-brand-gold" />
            <h3 className="font-display font-extrabold text-sm sm:text-base text-white">
              Mais Vendidos (Todas as Filiais)
            </h3>
          </div>

          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">
                Nenhum pedido registrado no período selecionado.
              </div>
            ) : (
              topProducts.map((p, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-dark-950 border border-dark-800"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-dark-800 text-brand-gold font-black text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white line-clamp-1">{p.name}</div>
                      <div className="text-[11px] text-slate-400">{p.quantity} un. vendidas</div>
                    </div>
                  </div>
                  <div className="text-xs font-black text-emerald-400">
                    R$ {p.revenue.toFixed(2).replace('.', ',')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2 & 3: Extrato de Pedidos das Filiais */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-dark-900 border border-dark-800 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dark-800 pb-3">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <h3 className="font-display font-extrabold text-sm sm:text-base text-white">
                Extrato Consolidado de Pedidos
              </h3>
            </div>

            {/* Filter by Branch & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs font-bold focus:border-brand-gold focus:outline-none cursor-pointer"
              >
                <option value="all">Todas as Filiais</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar pedido/cliente..."
                  value={searchOrderQuery}
                  onChange={(e) => setSearchOrderQuery(e.target.value)}
                  className="pl-7 pr-3 py-1.5 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs placeholder:text-slate-500 focus:border-brand-gold focus:outline-none w-36 sm:w-48"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto max-h-[380px] overflow-y-auto pr-1">
            {displayOrders.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-8">
                Nenhum pedido encontrado para os filtros selecionados.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-dark-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-2.5">ID / Horário</th>
                    <th className="pb-2.5">Filial</th>
                    <th className="pb-2.5">Cliente</th>
                    <th className="pb-2.5">Valor</th>
                    <th className="pb-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-850">
                  {displayOrders.map((ord) => {
                    const branchName = branches.find(b => b.id === (ord.branchId || 'ariquemes'))?.displayName || ord.branchName || 'Ariquemes';
                    const isPortoVelho = ord.branchId === 'porto-velho';
                    return (
                      <tr key={ord.orderId} className="hover:bg-dark-850/50 transition-colors">
                        <td className="py-2.5 pr-2 font-mono font-bold text-brand-gold">
                          <div>#{ord.orderId}</div>
                          <div className="text-[10px] text-slate-400 font-sans font-normal">
                            {ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </div>
                        </td>
                        <td className="py-2.5 pr-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isPortoVelho 
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' 
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}>
                            {branchName}
                          </span>
                        </td>
                        <td className="py-2.5 pr-2">
                          <div className="font-bold text-white line-clamp-1">{ord.customerName || 'Cliente'}</div>
                          <div className="text-[10px] text-slate-400">{ord.deliveryType === 'delivery' ? 'Entrega' : 'Balcão'}</div>
                        </td>
                        <td className="py-2.5 pr-2 font-black text-emerald-400">
                          R$ {(Number(ord.total) || 0).toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ord.orderStatus === 'CONCLUIDO' 
                              ? 'bg-emerald-500/15 text-emerald-400' 
                              : ord.orderStatus === 'CANCELADO'
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}>
                            {ord.orderStatus || 'PENDENTE'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
