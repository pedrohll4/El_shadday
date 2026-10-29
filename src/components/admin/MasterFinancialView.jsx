import React, { useState, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, CheckCircle2, ShoppingBag, 
  Store, Calendar, Percent, ArrowUpRight, Filter, 
  ChevronRight, Award, Flame, Search, AlertCircle, Clock,
  ArrowRight, ShieldCheck, PieChart, Sparkles, Sliders,
  Printer, FileText, Download, X
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

  // Estados para Impressão / Exportação em PDF
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printReportType, setPrintReportType] = useState('summary'); // 'summary' | 'complete'
  const [printBranchFilter, setPrintBranchFilter] = useState('all');
  const [printPeriodFilter, setPrintPeriodFilter] = useState('all');

  const handleSaveMargin = () => {
    const valid = Math.min(Math.max(Number(tempMargin) || 45, 5), 90);
    setProfitMarginPercent(valid);
    try {
      localStorage.setItem('el_shadday_profit_margin', String(valid));
    } catch (e) {}
    setIsEditingMargin(false);
  };

  const escapeHtml = (str) => {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const formatOrderItemsText = (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) return 'Nenhum item informado';
    return items.map(it => {
      let desc = `${it.quantity || 1}x ${it.name || 'Item'}`;
      const details = [];
      if (it.isCustomBox) {
        if (it.salgadasDetails && typeof it.salgadasDetails === 'object') {
          const salg = Object.entries(it.salgadasDetails)
            .filter(([_, qty]) => Number(qty) > 0)
            .map(([name, qty]) => `${qty}x ${name}`)
            .join(', ');
          if (salg) details.push(`Salgadas: ${salg}`);
        }
        if (it.docesDetails && typeof it.docesDetails === 'object') {
          const doce = Object.entries(it.docesDetails)
            .filter(([_, qty]) => Number(qty) > 0)
            .map(([name, qty]) => `${qty}x ${name}`)
            .join(', ');
          if (doce) details.push(`Doces: ${doce}`);
        }
      }
      if (it.selectedFlavors && Array.isArray(it.selectedFlavors) && it.selectedFlavors.length > 0) {
        const flv = it.selectedFlavors.map(f => (typeof f === 'string' ? f : f.name || '')).filter(Boolean).join(' / ');
        if (flv) details.push(`Sabores: ${flv}`);
      }
      if (it.bordaSelected) {
        details.push(`Borda: ${it.bordaSelected}`);
      }
      if (it.soda) {
        details.push(`Bebida: ${it.soda}`);
      }
      if (it.notes) {
        details.push(`Obs: ${it.notes}`);
      }
      if (details.length > 0) {
        desc += ` [${details.join(' | ')}]`;
      }
      return desc;
    }).join('; ');
  };

  const handleGenerateAndPrintReport = ({
    type = 'summary',
    targetBranch = 'all',
    targetPeriod = 'all'
  }) => {
    const now = new Date();

    // 1. Filtrar pelo período
    const periodOrders = orders.filter(order => {
      if (!order.createdAt) return true;
      const orderDate = new Date(order.createdAt);
      if (isNaN(orderDate.getTime())) return true;

      if (targetPeriod === 'today') {
        return (
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      if (targetPeriod === '7days') {
        const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      }
      if (targetPeriod === 'month') {
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      return true; // 'all'
    });

    // 2. Filtrar pela filial
    const finalOrders = periodOrders.filter(order => {
      if (targetBranch === 'all') return true;
      const orderBranch = order.branchId || 'ariquemes';
      return orderBranch === targetBranch;
    });

    const validOrders = finalOrders.filter(o => o && o.orderStatus !== 'CANCELADO');
    const canceledOrders = finalOrders.filter(o => o && o.orderStatus === 'CANCELADO');
    const grossRevenue = validOrders.reduce((sum, o) => sum + (Number(o?.total) || 0), 0);
    const estimatedProfit = (grossRevenue * profitMarginPercent) / 100;
    const estimatedCost = grossRevenue - estimatedProfit;
    const ordersCount = validOrders.length;
    const completedCount = validOrders.filter(o => 
      o.orderStatus === 'CONCLUIDO' || o.orderStatus === 'SAIU_ENTREGA' || o.status === 'CONCLUIDO'
    ).length;
    const avgTicket = ordersCount > 0 ? grossRevenue / ordersCount : 0;

    // 3. Breakdown por Filial
    const bList = Array.isArray(branches) ? branches : [];
    const reportBranches = (targetBranch === 'all' ? bList : bList.filter(b => b.id === targetBranch)).map(branch => {
      const bOrders = validOrders.filter(o => (o.branchId || 'ariquemes') === branch.id);
      const rev = bOrders.reduce((sum, o) => sum + (Number(o?.total) || 0), 0);
      const prof = (rev * profitMarginPercent) / 100;
      const share = grossRevenue > 0 ? (rev / grossRevenue) * 100 : 0;
      return {
        id: branch.id,
        name: branch.name,
        displayName: branch.displayName,
        status: branch.status,
        ordersCount: bOrders.length,
        revenue: rev,
        profit: prof,
        sharePercent: Math.round(share * 10) / 10
      };
    });

    // 4. Ranking de Produtos
    const itemMap = {};
    validOrders.forEach(order => {
      if (Array.isArray(order.items)) {
        order.items.forEach(it => {
          const name = it.name || 'Produto sem nome';
          const qty = Number(it.quantity) || 1;
          const val = (Number(it.price) || 0) * qty;
          if (!itemMap[name]) itemMap[name] = { name, quantity: 0, revenue: 0 };
          itemMap[name].quantity += qty;
          itemMap[name].revenue += val;
        });
      }
    });
    const reportTopProducts = Object.values(itemMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // 5. Breakdown por Meios de Pagamento
    const payMap = {};
    validOrders.forEach(order => {
      const pay = order.paymentMethod || 'A Definir';
      if (!payMap[pay]) payMap[pay] = { count: 0, total: 0 };
      payMap[pay].count += 1;
      payMap[pay].total += Number(order.total) || 0;
    });
    const reportPayments = Object.entries(payMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        total: data.total,
        share: grossRevenue > 0 ? (data.total / grossRevenue) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);

    const periodLabels = {
      today: 'Hoje',
      '7days': 'Últimos 7 Dias',
      month: 'Este Mês',
      all: 'Todo o Período'
    };
    const periodLabel = periodLabels[targetPeriod] || 'Período Geral';

    const branchLabel = targetBranch === 'all' 
      ? 'Todas as Filiais (Consolidado Global)' 
      : (branches.find(b => b.id === targetBranch)?.name || targetBranch);

    const isComplete = type === 'complete';
    const reportTitle = isComplete 
      ? 'Relatório Financeiro Completo & Extrato Analítico' 
      : 'Relatório Financeiro & Resumo Executivo de Vendas';

    const printWin = window.open('', '_blank', 'width=1100,height=900');
    if (!printWin) {
      alert('Por favor, autorize pop-ups para abrir a tela de impressão do relatório em PDF.');
      return;
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${reportTitle} - El Shadday</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.45;
      padding: 24px;
    }
    .screen-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      margin: -24px -24px 24px -24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 15px rgba(0,0,0,0.25);
    }
    .btn-action {
      cursor: pointer;
      font-weight: 800;
      border: none;
      padding: 9px 18px;
      border-radius: 8px;
      font-size: 13px;
      transition: all 0.2s;
    }
    .btn-print {
      background: #f59e0b;
      color: #0f172a;
    }
    .btn-print:hover {
      background: #d97706;
    }
    .btn-close {
      background: #334155;
      color: #ffffff;
      margin-left: 8px;
    }
    .btn-close:hover {
      background: #475569;
    }
    @media print {
      .screen-bar { display: none !important; }
      body { padding: 0 !important; }
    }
    
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .brand-subtitle {
      font-size: 11px;
      font-weight: 700;
      color: #b45309;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-top: 1px;
    }
    .report-heading {
      font-size: 14px;
      font-weight: 800;
      color: #1e293b;
      margin-top: 6px;
      text-transform: uppercase;
    }
    .doc-meta {
      text-align: right;
      font-size: 10px;
      color: #475569;
    }
    .badge-pill {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      font-weight: 700;
      color: #0f172a;
      margin-top: 4px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .kpi-box {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 10px;
      padding: 10px 14px;
      page-break-inside: avoid;
    }
    .kpi-box.gold {
      border-color: #f59e0b;
      background: #fffbeb;
    }
    .kpi-label {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
    }
    .kpi-value {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      margin: 4px 0 2px 0;
    }
    .kpi-box.gold .kpi-value {
      color: #b45309;
    }
    .kpi-sub {
      font-size: 9px;
      color: #64748b;
    }

    .section-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
      margin: 14px 0 6px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .bar {
      width: 4px;
      height: 12px;
      background: #f59e0b;
      border-radius: 2px;
      display: inline-block;
    }

    table.styled-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    table.styled-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 800;
      text-align: left;
      font-size: 9px;
      text-transform: uppercase;
      padding: 7px 8px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
    }
    table.styled-table td {
      padding: 7px 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 10px;
      vertical-align: top;
    }
    table.styled-table tr:nth-child(even) td {
      background: #fafafa;
    }
    table.styled-table tfoot td {
      background: #f1f5f9;
      font-weight: 800;
      border-top: 2px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .bold { font-weight: 700; }
    .gold-text { color: #b45309; font-weight: 800; }
    .emerald-text { color: #047857; font-weight: 800; }
    .red-text { color: #b91c1c; font-weight: 800; }
    
    .item-desc {
      font-size: 9.5px;
      color: #334155;
      margin-top: 2px;
      line-height: 1.35;
    }
    .status-tag {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .status-concluido { background: #dcfce7; color: #15803d; }
    .status-pendente { background: #fef3c7; color: #b45309; }
    .status-cancelado { background: #fee2e2; color: #b91c1c; }

    .doc-footer {
      margin-top: 28px;
      padding-top: 12px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      color: #64748b;
      font-size: 9px;
      page-break-inside: avoid;
    }
    .signature-box {
      text-align: center;
      width: 200px;
      border-top: 1px solid #94a3b8;
      padding-top: 4px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="screen-bar">
    <div style="display:flex; align-items:center; gap:8px;">
      <span style="font-size: 16px;">👑</span>
      <div>
        <div style="font-weight: 800; font-size: 13px;">EL SHADDAY DELIVERY • SISTEMA FINANCEIRO</div>
        <div style="font-size: 10px; color: #94a3b8;">${reportTitle}</div>
      </div>
    </div>
    <div>
      <button class="btn-action btn-print" onclick="window.print()">
        🖨️ Imprimir / Salvar em PDF
      </button>
      <button class="btn-action btn-close" onclick="window.close()">
        ✖️ Fechar
      </button>
    </div>
  </div>

  <div class="doc-header">
    <div>
      <div class="brand-title">EL SHADDAY GOURMET</div>
      <div class="brand-subtitle">Pizzaria, Esfirraria & Buffet Multi-Filiais</div>
      <div class="report-heading">${reportTitle}</div>
    </div>
    <div class="doc-meta">
      <div><strong>Emissão:</strong> ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
      <div><strong>Período:</strong> <span class="badge-pill">${periodLabel}</span></div>
      <div><strong>Escopo:</strong> <span class="badge-pill">${escapeHtml(branchLabel)}</span></div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-box">
      <div class="kpi-label">Faturamento Bruto</div>
      <div class="kpi-value emerald-text">R$ ${grossRevenue.toFixed(2).replace('.', ',')}</div>
      <div class="kpi-sub">Receita total válida</div>
    </div>
    <div class="kpi-box gold">
      <div class="kpi-label">Lucro Estimado (${profitMarginPercent}%)</div>
      <div class="kpi-value">R$ ${estimatedProfit.toFixed(2).replace('.', ',')}</div>
      <div class="kpi-sub">Custos est.: R$ ${estimatedCost.toFixed(2).replace('.', ',')}</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">Pedidos Vendidos</div>
      <div class="kpi-value">${ordersCount}</div>
      <div class="kpi-sub">${completedCount} entregues / finalizados${canceledOrders.length > 0 ? ` (${canceledOrders.length} cancelados)` : ''}</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">Ticket Médio</div>
      <div class="kpi-value">R$ ${avgTicket.toFixed(2).replace('.', ',')}</div>
      <div class="kpi-sub">Média por pedido</div>
    </div>
  </div>

  <div class="section-title"><span class="bar"></span> 1. Desempenho & Faturamento por Filial / Loja</div>
  <table class="styled-table">
    <thead>
      <tr>
        <th>Filial / Unidade</th>
        <th>Status</th>
        <th class="text-center">Qtd Pedidos</th>
        <th class="text-right">Faturamento Bruto</th>
        <th class="text-right">Lucro Est. (${profitMarginPercent}%)</th>
        <th class="text-right">Participação (%)</th>
      </tr>
    </thead>
    <tbody>
      ${reportBranches.map(b => `
        <tr>
          <td class="bold">${escapeHtml(b.name || b.displayName)}</td>
          <td><span class="status-tag ${b.status === 'active' ? 'status-concluido' : 'status-pendente'}">${b.status === 'active' ? 'Ativa' : 'Em Obras'}</span></td>
          <td class="text-center bold">${b.ordersCount}</td>
          <td class="text-right bold emerald-text">R$ ${b.revenue.toFixed(2).replace('.', ',')}</td>
          <td class="text-right bold gold-text">R$ ${b.profit.toFixed(2).replace('.', ',')}</td>
          <td class="text-right bold">${b.sharePercent}%</td>
        </tr>
      `).join('')}
    </tbody>
    <tfoot>
      <tr>
        <td class="bold" colspan="2">TOTAL CONSOLIDADO</td>
        <td class="text-center bold">${ordersCount}</td>
        <td class="text-right bold emerald-text">R$ ${grossRevenue.toFixed(2).replace('.', ',')}</td>
        <td class="text-right bold gold-text">R$ ${estimatedProfit.toFixed(2).replace('.', ',')}</td>
        <td class="text-right bold">100%</td>
      </tr>
    </tfoot>
  </table>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
    <div>
      <div class="section-title"><span class="bar"></span> 2. Formas de Pagamento</div>
      <table class="styled-table">
        <thead>
          <tr>
            <th>Forma</th>
            <th class="text-center">Vendas</th>
            <th class="text-right">Total (R$)</th>
            <th class="text-right">%</th>
          </tr>
        </thead>
        <tbody>
          ${reportPayments.length === 0 ? `<tr><td colspan="4" class="text-center">Nenhum pagamento registrado</td></tr>` : 
            reportPayments.map(p => `
              <tr>
                <td class="bold">${escapeHtml(p.name)}</td>
                <td class="text-center">${p.count}</td>
                <td class="text-right bold">R$ ${p.total.toFixed(2).replace('.', ',')}</td>
                <td class="text-right">${p.share.toFixed(1)}%</td>
              </tr>
            `).join('')}
        </tbody>
      </table>
    </div>

    <div>
      <div class="section-title"><span class="bar"></span> 3. Top Produtos Mais Vendidos</div>
      <table class="styled-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Produto</th>
            <th class="text-center">Qtd</th>
            <th class="text-right">Receita (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${reportTopProducts.length === 0 ? `<tr><td colspan="4" class="text-center">Nenhum item vendido</td></tr>` : 
            reportTopProducts.map((p, idx) => `
              <tr>
                <td class="bold">${idx + 1}º</td>
                <td class="bold">${escapeHtml(p.name)}</td>
                <td class="text-center bold">${p.quantity}</td>
                <td class="text-right bold emerald-text">R$ ${p.revenue.toFixed(2).replace('.', ',')}</td>
              </tr>
            `).join('')}
        </tbody>
      </table>
    </div>
  </div>

  ${isComplete ? `
    <div style="margin-top: 14px;">
      <div class="section-title"><span class="bar"></span> 4. Extrato Completo de Pedidos (${finalOrders.length} registros)</div>
      <table class="styled-table">
        <thead>
          <tr>
            <th style="width: 75px;">ID / Hora</th>
            <th style="width: 90px;">Filial</th>
            <th style="width: 140px;">Cliente & Tipo</th>
            <th>Itens & Detalhes do Pedido</th>
            <th style="width: 90px;">Pagamento</th>
            <th style="width: 75px;" class="text-center">Status</th>
            <th style="width: 75px;" class="text-right">Total (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${finalOrders.length === 0 ? `<tr><td colspan="7" class="text-center">Nenhum pedido no período selecionado.</td></tr>` :
            finalOrders.map(ord => {
              const bName = branches.find(b => b.id === (ord.branchId || 'ariquemes'))?.displayName || ord.branchName || 'Ariquemes';
              const isCanc = ord.orderStatus === 'CANCELADO';
              const isDone = ord.orderStatus === 'CONCLUIDO';
              const timeStr = ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
              const dateStr = ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('pt-BR') : '';
              return `
                <tr style="${isCanc ? 'opacity: 0.6; background: #fff5f5;' : ''}">
                  <td>
                    <div class="bold">#${escapeHtml(ord.orderId)}</div>
                    <div style="font-size: 8.5px; color: #64748b;">${dateStr} ${timeStr}</div>
                  </td>
                  <td class="bold">${escapeHtml(bName)}</td>
                  <td>
                    <div class="bold">${escapeHtml(ord.customerName || 'Cliente')}</div>
                    <div style="font-size: 8.5px; color: #64748b;">
                      ${escapeHtml(ord.deliveryType === 'delivery' ? '🛵 Entrega' : '🏪 Balcão')}
                      ${ord.customerPhone ? ` • ${escapeHtml(ord.customerPhone)}` : ''}
                    </div>
                  </td>
                  <td>
                    <div class="item-desc">${escapeHtml(formatOrderItemsText(ord.items))}</div>
                  </td>
                  <td>
                    <div class="bold">${escapeHtml(ord.paymentMethod || 'A Definir')}</div>
                    <div style="font-size: 8.5px; color: #64748b;">${ord.paymentStatus === 'PAGO_APROVADO' ? '🟢 Pago' : '🟡 Pendente'}</div>
                  </td>
                  <td class="text-center">
                    <span class="status-tag ${isDone ? 'status-concluido' : isCanc ? 'status-cancelado' : 'status-pendente'}">
                      ${escapeHtml(ord.orderStatus || 'PENDENTE')}
                    </span>
                  </td>
                  <td class="text-right bold ${isCanc ? 'red-text' : 'emerald-text'}">
                    R$ ${(Number(ord.total) || 0).toFixed(2).replace('.', ',')}
                  </td>
                </tr>
              `;
            }).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="6" class="bold">TOTAL GERAL (${validOrders.length} pedidos válidos)</td>
            <td class="text-right bold emerald-text">R$ ${grossRevenue.toFixed(2).replace('.', ',')}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  ` : ''}

  <div class="doc-footer">
    <div>
      <div><strong>El Shadday Delivery</strong> • Ariquemes & Porto Velho - RO</div>
      <div>Documento gerado automaticamente para auditoria gerencial, contabilidade e controle de vendas.</div>
    </div>
    <div class="signature-box">
      <div>Administrador / Gestão Master</div>
      <div style="font-size: 8px; color: #94a3b8; margin-top: 2px;">Assinatura do Responsável</div>
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;

    printWin.document.write(htmlContent);
    printWin.document.close();
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
    const list = Array.isArray(periodFilteredOrders) ? periodFilteredOrders : [];
    const validOrders = list.filter(o => o && o.orderStatus !== 'CANCELADO');
    const completedOrders = list.filter(o => 
      o && (
        o.orderStatus === 'CONCLUIDO' || 
        o.orderStatus === 'SAIU_ENTREGA' ||
        o.status === 'CONCLUIDO'
      )
    );

    const grossRevenue = validOrders.reduce((sum, o) => sum + (Number(o?.total) || 0), 0);
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
    const bList = Array.isArray(branches) ? branches : [];
    return bList.filter(Boolean).map(branch => {
      const branchOrders = (periodFilteredOrders || []).filter(o => {
        if (!o) return false;
        const orderBranchId = o.branchId || 'ariquemes';
        return orderBranchId === branch.id;
      });

      const validBranchOrders = branchOrders.filter(o => o && o.orderStatus !== 'CANCELADO');
      const revenue = validBranchOrders.reduce((sum, o) => sum + (Number(o?.total) || 0), 0);
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

          <button
            onClick={() => {
              setPrintPeriodFilter(periodFilter);
              setPrintBranchFilter(selectedBranchFilter);
              setIsPrintModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-brand-gold via-amber-400 to-amber-500 hover:brightness-110 text-dark-950 font-black text-xs flex items-center gap-1.5 shadow-glow-gold transition-all cursor-pointer active:scale-95"
            title="Imprimir resumo ou relatório completo de vendas em PDF"
          >
            <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Imprimir em PDF</span>
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

              <button
                type="button"
                onClick={() => handleGenerateAndPrintReport({
                  type: 'complete',
                  targetBranch: selectedBranchFilter,
                  targetPeriod: periodFilter
                })}
                className="px-2.5 py-1.5 rounded-xl bg-dark-950 hover:bg-dark-850 text-brand-gold border border-brand-gold/30 hover:border-brand-gold text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Imprimir extrato detalhado de pedidos em PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imprimir Extrato</span>
              </button>
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

      {/* Modal de Impressão e Exportação em PDF */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-dark-900 border border-brand-gold/40 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-5 text-white max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-dark-800 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 text-brand-gold flex items-center justify-center border border-brand-gold/40">
                  <Printer className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-display font-black text-base sm:text-lg text-white">
                    Imprimir Relatório em PDF
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gere o resumo de vendas ou o relatório analítico completo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Escolha da Modalidade do Relatório */}
            <div className="space-y-2">
              <label className="block text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                1. Selecione o Tipo de Relatório:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Resumo de Vendas (Sintético) */}
                <div
                  onClick={() => setPrintReportType('summary')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    printReportType === 'summary'
                      ? 'bg-brand-gold/15 border-brand-gold shadow-glow-gold'
                      : 'bg-dark-950 border-dark-800 hover:border-dark-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-white flex items-center gap-1.5">
                      📊 Resumo de Vendas
                    </span>
                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      printReportType === 'summary' ? 'border-brand-gold bg-brand-gold' : 'border-slate-600'
                    }`} />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Faturamento consolidado, lucro líquido ({profitMarginPercent}%), comparativo entre filiais, formas de pagamento e produtos mais vendidos.
                  </p>
                  <span className="mt-2.5 inline-block text-[10px] font-bold text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-md">
                    Sintético / Executivo
                  </span>
                </div>

                {/* Option 2: Completo de Tudo (Analítico) */}
                <div
                  onClick={() => setPrintReportType('complete')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    printReportType === 'complete'
                      ? 'bg-brand-gold/15 border-brand-gold shadow-glow-gold'
                      : 'bg-dark-950 border-dark-800 hover:border-dark-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-white flex items-center gap-1.5">
                      📑 Completo de Tudo
                    </span>
                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      printReportType === 'complete' ? 'border-brand-gold bg-brand-gold' : 'border-slate-600'
                    }`} />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Inclui todo o resumo de vendas <strong>+ o extrato detalhado</strong> com cada pedido, cliente, telefone, itens pedidos e valores.
                  </p>
                  <span className="mt-2.5 inline-block text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    Analítico + Extrato Geral
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2: Filtros de Filial e Período */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
                  Filial / Unidade:
                </label>
                <select
                  value={printBranchFilter}
                  onChange={(e) => setPrintBranchFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs font-bold focus:border-brand-gold focus:outline-none cursor-pointer"
                >
                  <option value="all">Todas as Filiais (Consolidado Global)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
                  Período:
                </label>
                <select
                  value={printPeriodFilter}
                  onChange={(e) => setPrintPeriodFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-dark-750 text-white text-xs font-bold focus:border-brand-gold focus:outline-none cursor-pointer"
                >
                  <option value="today">Hoje</option>
                  <option value="7days">Últimos 7 Dias</option>
                  <option value="month">Este Mês</option>
                  <option value="all">Todo o Período</option>
                </select>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-dark-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  handleGenerateAndPrintReport({
                    type: printReportType,
                    targetBranch: printBranchFilter,
                    targetPeriod: printPeriodFilter
                  });
                  setIsPrintModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold via-amber-400 to-amber-500 hover:brightness-110 text-dark-950 font-black text-xs flex items-center gap-2 shadow-glow-gold transition-transform active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4 stroke-[2.5]" />
                <span>Gerar & Imprimir PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
