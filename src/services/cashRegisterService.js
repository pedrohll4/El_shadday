/**
 * Cash Register & Shift Closing Service (Fechamento de Caixa) - El Shadday Delivery
 * Handles manual and automated daily shift closings, financial reconciliation,
 * thermal receipt generation, and archiving kitchen orders for financial control.
 */

const STORAGE_KEY_SETTINGS = 'el_shadday_cash_register_settings_v1';
import { persistShiftClosing } from './ordersSyncService';

const STORAGE_KEY_HISTORY = 'el_shadday_cash_closing_history_v1';

export const DEFAULT_CASH_SETTINGS = {
  autoCloseEnabled: true,
  autoCloseTime: '23:30', // Horário padrão para fechamento automático (23:30)
  autoArchiveOrders: true,
  lastClosedDate: null,
  initialDrawerCash: 0 // Fundo de troco inicial padrão
};

/**
 * Retrieve cash register settings
 */
export function getCashRegisterSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CASH_SETTINGS, ...parsed };
    }
  } catch (e) {}
  return { ...DEFAULT_CASH_SETTINGS };
}

/**
 * Save cash register settings
 */
export function saveCashRegisterSettings(settings) {
  try {
    const merged = { ...getCashRegisterSettings(), ...settings };
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('cash_register_settings_updated', { detail: merged }));
    return merged;
  } catch (e) {
    return settings;
  }
}

/**
 * Retrieve cash closing historical records
 */
export function getCashClosingHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

/**
 * Save cash closing historical records
 */
export function saveCashClosingHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent('cash_closing_history_updated', { detail: history }));
  } catch (e) {}
}

/**
 * Calculate totals and breakdown for a list of orders in the current shift
 */
export function calculateShiftTotals(orders = [], initialCash = 0) {
  const list = Array.isArray(orders) ? orders : [];
  // Exclude cancelled and already archived orders from current shift calculations
  const shiftOrders = list.filter(o => o && o.orderStatus !== 'CANCELADO' && !o.shiftClosedAt);

  let grossRevenue = 0;
  let pixTotal = 0;
  let dinheiroTotal = 0;
  let debitoTotal = 0;
  let creditoTotal = 0;
  let deliveryFeesTotal = 0;
  let balcaoCount = 0;
  let deliveryCount = 0;

  shiftOrders.forEach(o => {
    const tot = Number(o.total) || 0;
    const fee = Number(o.deliveryFee) || 0;
    grossRevenue += tot;
    deliveryFeesTotal += fee;

    const pm = (o.paymentMethod || '').toLowerCase();
    if (pm.includes('pix')) {
      pixTotal += tot;
    } else if (pm.includes('dinheiro')) {
      dinheiroTotal += tot;
    } else if (pm.includes('débito') || pm.includes('debito')) {
      debitoTotal += tot;
    } else if (pm.includes('crédito') || pm.includes('credito') || pm.includes('cartão') || pm.includes('cartao')) {
      creditoTotal += tot;
    } else {
      // Fallback
      pixTotal += tot;
    }

    if (o.deliveryType === 'balcao' || o.deliveryType === 'retirada' || o.district === 'Balcão') {
      balcaoCount++;
    } else {
      deliveryCount++;
    }
  });

  const ordersCount = shiftOrders.length;
  const avgTicket = ordersCount > 0 ? grossRevenue / ordersCount : 0;
  const initialDrawer = Number(initialCash) || 0;
  const expectedDrawerCash = initialDrawer + dinheiroTotal;

  return {
    ordersCount,
    shiftOrders,
    grossRevenue,
    pixTotal,
    dinheiroTotal,
    debitoTotal,
    creditoTotal,
    deliveryFeesTotal,
    balcaoCount,
    deliveryCount,
    avgTicket,
    initialDrawer,
    expectedDrawerCash
  };
}

/**
 * Execute Cash Closing (Fechar Caixa)
 * Generates audit record, archives active orders from kitchen, resets daily order sequence,
 * and notifies listeners.
 */
export function executeCashClosing({
  orders = [],
  closedBy = 'Gerente',
  closingType = 'manual', // 'manual' | 'automatic'
  initialDrawerCash = 0,
  notes = '',
  branchId = 'ariquemes',
  branchName = 'Unidade Ariquemes'
}) {
  const totals = calculateShiftTotals(orders, initialDrawerCash);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const closingId = `cx-${dateStr}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

  const closingRecord = {
    id: closingId,
    closingDate: dateStr,
    closedAt: now.toISOString(),
    closedBy,
    closingType, // 'manual' | 'automatic'
    branchId,
    branchName,
    ordersCount: totals.ordersCount,
    grossRevenue: totals.grossRevenue,
    pixTotal: totals.pixTotal,
    dinheiroTotal: totals.dinheiroTotal,
    debitoTotal: totals.debitoTotal,
    creditoTotal: totals.creditoTotal,
    deliveryFeesTotal: totals.deliveryFeesTotal,
    balcaoCount: totals.balcaoCount,
    deliveryCount: totals.deliveryCount,
    avgTicket: totals.avgTicket,
    initialDrawerCash: totals.initialDrawer,
    expectedDrawerCash: totals.expectedDrawerCash,
    notes: notes.trim(),
    ordersSummary: totals.shiftOrders.map(o => ({
      orderId: o.orderId,
      orderNumber: o.orderNumber,
      customerName: o.customerName || 'Cliente',
      total: Number(o.total) || 0,
      paymentMethod: o.paymentMethod || 'A Definir',
      deliveryType: o.deliveryType || 'delivery',
      createdAt: o.createdAt
    }))
  };

  // 1. Save to Cash Closing History
  const currentHistory = getCashClosingHistory();
  const updatedHistory = [closingRecord, ...currentHistory];
  saveCashClosingHistory(updatedHistory);

  // 2. Mark orders in memory and localStorage with shiftClosedAt
  const shiftOrderIds = new Set(totals.shiftOrders.map(o => o.orderId));
  const updatedAllOrders = (orders || []).map(o => {
    if (shiftOrderIds.has(o.orderId)) {
      return {
        ...o,
        shiftClosedAt: now.toISOString(),
        shiftClosingId: closingId,
        isArchived: true
      };
    }
    return o;
  });

  try {
    localStorage.setItem('el_shadday_all_orders', JSON.stringify(updatedAllOrders));
  } catch (e) {}

  // 2b. Grava no Supabase para todos os aparelhos verem o caixa fechado
  persistShiftClosing(Array.from(shiftOrderIds), now.toISOString());

  // 3. Reset daily order numbering sequence so tomorrow starts from #01!
  try {
    localStorage.removeItem('el_shadday_daily_seq_v2');
  } catch (e) {}

  // 4. Update settings with lastClosedDate
  saveCashRegisterSettings({
    lastClosedDate: dateStr,
    lastClosedAt: now.toISOString(),
    lastClosedBy: closedBy
  });

  // 5. Dispatch global notification
  window.dispatchEvent(new CustomEvent('cash_register_closed', {
    detail: {
      closingRecord,
      updatedOrders: updatedAllOrders
    }
  }));

  return {
    closingRecord,
    updatedOrders: updatedAllOrders
  };
}

/**
 * Print Thermal Cash Closing Receipt (Extrato / Comanda de Fechamento de Caixa)
 */
export function printCashClosingReceipt(record, branchInfo = {}) {
  if (!record) return;

  const oldIframe = document.getElementById('cash-closing-print-frame');
  if (oldIframe) {
    try { oldIframe.remove(); } catch (e) {}
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'cash-closing-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const formattedDate = record.closedAt ? new Date(record.closedAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
  const bName = branchInfo.displayName || branchInfo.name || record.branchName || 'EL SHADDAY DELIVERY';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Fechamento de Caixa #${record.id} - ${bName}</title>
        <style>
          @page { size: auto; margin: 0mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.3;
            color: #000;
            background: #fff;
            width: 100%;
            max-width: 280px;
            padding: 4mm 3mm;
            margin: 0 auto;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .title { font-size: 13px; margin-bottom: 2px; }
          .receipt-header { font-size: 16px; font-weight: 900; border: 2px dashed #000; padding: 4px; margin: 5px 0; text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 5px 0; }
          .double-divider { border-top: 2px solid #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; font-size: 11px; }
          .highlight-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; margin: 4px 0; }
          .sub { padding-left: 6px; font-size: 10px; color: #222; }
        </style>
      </head>
      <body>
        <div class="center bold title">${bName.toUpperCase()}</div>
        <div class="receipt-header">*** FECHAMENTO DE CAIXA ***</div>
        <div class="center" style="font-size: 10px;">ID Turno: ${record.id}</div>
        <div class="center" style="font-size: 10px;">Data/Hora: ${formattedDate}</div>
        <div class="center" style="font-size: 10px;">Responsável: ${record.closedBy} (${record.closingType === 'automatic' ? 'AUTOMÁTICO' : 'MANUAL'})</div>

        <div class="divider"></div>
        <div class="bold" style="margin-bottom: 3px;">1. RESUMO OPERACIONAL:</div>
        <div class="row"><span>Total de Pedidos:</span><span class="bold">${record.ordersCount}</span></div>
        <div class="row sub"><span>↳ Entrega (Delivery):</span><span>${record.deliveryCount}</span></div>
        <div class="row sub"><span>↳ Retirada Balcão:</span><span>${record.balcaoCount}</span></div>
        <div class="row"><span>Ticket Médio:</span><span class="bold">R$ ${(record.avgTicket || 0).toFixed(2).replace('.', ',')}</span></div>

        <div class="divider"></div>
        <div class="bold" style="margin-bottom: 3px;">2. ENTRADAS POR FORMA DE PAGAMENTO:</div>
        <div class="row"><span>🔑 PIX:</span><span class="bold">R$ ${(record.pixTotal || 0).toFixed(2).replace('.', ',')}</span></div>
        <div class="row"><span>💵 Dinheiro:</span><span class="bold">R$ ${(record.dinheiroTotal || 0).toFixed(2).replace('.', ',')}</span></div>
        <div class="row"><span>💳 Cartão de Débito:</span><span class="bold">R$ ${(record.debitoTotal || 0).toFixed(2).replace('.', ',')}</span></div>
        <div class="row"><span>💳 Cartão de Crédito:</span><span class="bold">R$ ${(record.creditoTotal || 0).toFixed(2).replace('.', ',')}</span></div>

        <div class="double-divider"></div>
        <div class="highlight-row">
          <span>FATURAMENTO TOTAL:</span>
          <span>R$ ${(record.grossRevenue || 0).toFixed(2).replace('.', ',')}</span>
        </div>

        <div class="divider"></div>
        <div class="bold" style="margin-bottom: 3px;">3. CONFERÊNCIA FÍSICA DE CAIXA:</div>
        <div class="row"><span>(+) Fundo de Troco Inicial:</span><span>R$ ${(record.initialDrawerCash || 0).toFixed(2).replace('.', ',')}</span></div>
        <div class="row"><span>(+) Vendas em Dinheiro:</span><span>R$ ${(record.dinheiroTotal || 0).toFixed(2).replace('.', ',')}</span></div>
        <div class="highlight-row" style="font-size: 12px; margin-top: 3px;">
          <span>(=) TOTAL ESPERADO GAVETA:</span>
          <span>R$ ${(record.expectedDrawerCash || 0).toFixed(2).replace('.', ',')}</span>
        </div>

        <div class="divider"></div>
        <div class="row"><span>Total em Taxas Tele-entrega:</span><span class="bold">R$ ${(record.deliveryFeesTotal || 0).toFixed(2).replace('.', ',')}</span></div>

        ${record.notes ? `
          <div class="divider"></div>
          <div class="bold" style="font-size: 10px;">OBSERVAÇÕES:</div>
          <div style="font-size: 10px; margin-top: 2px;">${record.notes}</div>
        ` : ''}

        <div class="double-divider"></div>
        <div class="center" style="font-size: 9px; margin-top: 8px;">
          ________________________________________<br/>
          Assinatura do Responsável
        </div>
        <div class="center" style="font-size: 8.5px; margin-top: 6px; color: #555;">
          El Shadday Delivery • Gestão de Caixa
        </div>
      </body>
    </html>
  `;

  iframe.contentWindow.document.open();
  iframe.contentWindow.document.write(html);
  iframe.contentWindow.document.close();

  iframe.onload = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error('Print iframe error:', e);
    }
  };
}
