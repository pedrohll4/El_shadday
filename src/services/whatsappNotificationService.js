import { getStoredBranches, fixLegacyStoreAddress, STORE_ADDRESS } from '../data/branchesData';
import { getBranchWhatsApp, sendEngineDirectMessage } from './whatsappBranchService';

const STORAGE_SETTINGS_KEY = 'el_shadday_whatsapp_settings_v1';

export const DEFAULT_WHATSAPP_SETTINGS = {
  autoNotify: true,          // Disparo automático ao mudar status no KDS
  notifyOnClick: false,      // NUNCA abre nova aba no navegador ao clicar em avançar etapa
  notifyOnReceive: true,     // Ao criar/receber o pedido
  notifyOnPrep: true,        // Ao mover para forno / preparo
  notifyOnDelivery: true,    // Ao despachar para entrega
  notifyOnReadyCounter: true,// Ao marcar pronto no balcão
  notifyOnComplete: false,   // Desativado por padrão: evita mensagem redundante após pronto/entrega
  notifyOnCancel: true,      // Ao cancelar o pedido
  openDirectly: false        // Disparos 100% silenciosos em segundo plano
};

export function getWhatsAppSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { 
        ...DEFAULT_WHATSAPP_SETTINGS, 
        ...parsed,
        notifyOnClick: false, // Força false: nunca abrir nova aba ao avançar etapa
        openDirectly: false,  // Força false: envio 100% silencioso em segundo plano
        notifyOnComplete: parsed.notifyOnComplete === true
      };
    }
  } catch (e) {
    console.error('Error reading WhatsApp settings:', e);
  }
  return DEFAULT_WHATSAPP_SETTINGS;
}

export function saveWhatsAppSettings(settings) {
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('el_shadday_whatsapp_settings_updated', { detail: settings }));
    }
  } catch (e) {
    console.error('Error saving WhatsApp settings:', e);
  }
}

/**
 * Limpa e padroniza o telefone para o padrão internacional (DDI 55 + DDD + Número)
 */
export function cleanPhoneNumber(rawPhone) {
  if (!rawPhone) return '';
  let digits = rawPhone.toString().replace(/\D/g, '');

  if (!digits) return '';

  // Se tem 10 ou 11 dígitos (ex: 69992228682 ou 6992228682), adiciona 55 do Brasil
  if (digits.length === 10 || digits.length === 11) {
    digits = '55' + digits;
  } else if (digits.length === 8 || digits.length === 9) {
    // Caso o usuário não tenha digitado o DDD, coloca DDD 69 padrão de RO
    digits = '5569' + digits;
  }

  return digits;
}

/**
 * Retorna as configurações de WhatsApp da filial do pedido
 */
export function getBranchForOrder(order, branches = null) {
  const list = branches || getStoredBranches();
  const targetId = order?.branchId || 'ariquemes';
  const found = list.find(b => b.id === targetId) || list.find(b => b.id === 'ariquemes') || list[0] || {};
  const session = getBranchWhatsApp(targetId);
  return {
    ...found,
    phone: session?.phone || found.phone,
    phoneFormatted: session?.phoneFormatted || found.phoneFormatted,
    whatsapp: session?.phone || found.whatsapp,
    whatsappFormatted: session?.phoneFormatted || found.whatsappFormatted,
    whatsappApiUrl: session?.apiUrl || found.whatsappApiUrl,
    whatsappApiToken: session?.apiToken || found.whatsappApiToken
  };
}

/**
 * Cache local de disparos para evitar duplicidade de mensagens na mesma sessão/dispositivo
 */
const recentDispatches = new Map();

function shouldBlockDuplicateDispatch(orderId, statusType) {
  if (!orderId || !statusType) return false;
  const key = `${orderId}:${String(statusType).toUpperCase()}`;
  const lastTime = recentDispatches.get(key);
  if (lastTime && Date.now() - lastTime < 15000) {
    return true; // Bloqueia tentativas repetidas em menos de 15 segundos
  }
  recentDispatches.set(key, Date.now());
  if (recentDispatches.size > 200) {
    const oldest = recentDispatches.keys().next().value;
    recentDispatches.delete(oldest);
  }
  return false;
}

/**
 * Formata lista resumida de itens para o texto da mensagem (oculta detalhes se for sortido)
 */
function formatOrderItemsSummary(items = []) {
  if (!Array.isArray(items) || items.length === 0) return '• Itens do pedido';
  
  return items.map(it => {
    let line = `• ${it.quantity}x *${it.name}*`;
    const details = [];
    if (it.pizzaSelections && it.pizzaSelections.length > 0) {
      const sab = it.pizzaSelections.map(p => p.flavors?.join('/')).filter(Boolean).join(' + ');
      if (sab) details.push(sab);
    } else if (it.flavors && it.flavors.length > 0) {
      details.push(it.flavors.join('/'));
    } else if (it.boxOptionTitle) {
      details.push(it.boxOptionTitle + (it.notes ? ` - Obs: ${it.notes}` : ''));
    } else if (it.isSortido || (it.name && it.name.toLowerCase().includes('sortid')) || (it.isBox && !it.salgadasDetails)) {
      details.push(`Sortido da Casa${it.semSuinos ? ' - Sem Suínos' : ''}`);
    } else if (it.isCustomBox && !it.isSortido && it.salgadasDetails) {
      const salg = Object.entries(it.salgadasDetails).map(([f, q]) => `${q}x ${f}`).join(', ');
      if (salg) details.push(salg);
    }
    if (it.acaiComplements && it.acaiComplements.length > 0) {
      details.push(`Barca: ${it.acaiComplements.join(', ')}`);
    } else if (it.complements && it.complements.length > 0) {
      details.push(`Acomp: ${it.complements.join(', ')}`);
    }
    if (it.dydyoFlavor) {
      details.push(`Refri: ${it.dydyoFlavor}`);
    }
    if (it.beverage) {
      details.push(`Bebida: ${it.beverage}`);
    }
    if (it.hasExtraSauce) {
      details.push(`Molho Extra`);
    }
    if (details.length > 0) {
      line += ` (${details.join(' | ')})`;
    }
    return line;
  }).join('\n');
}

/**
 * Constrói o texto da mensagem de WhatsApp de acordo com o status
 */
export function buildStatusMessage({ order, statusType, branch, reason = '' }) {
  const customerName = order?.customerName || 'Cliente';
  const orderId = order?.orderId || 'S/N';
  const branchName = branch?.displayName || branch?.name || order?.branchName || 'El Shadday Ariquemes';
  const branchPhone = branch?.phoneFormatted || branch?.whatsappFormatted || '(69) 99222-8682';
  const branchAddress = fixLegacyStoreAddress(branch?.address) || STORE_ADDRESS;
  const isBalcao = order?.deliveryType === 'balcao' || order?.deliveryType === 'retirada';
  const deliveryAddress = order?.address ? `${order.address}${order.number ? `, Nº ${order.number}` : ''}${order.district ? ` (${order.district})` : ''}` : '';

  switch (statusType) {
    case 'RECEBIDO':
    case 'RECEBIDO_COZINHA':
      return (
`🍕 *Pedido Confirmado! - El Shadday*

Oi, *${customerName}*! Recebemos seu pedido *#${orderId}* e já mandamos pra cozinha! ✅

📋 *Itens:*
${formatOrderItemsSummary(order?.items)}

💰 *Total:* R$ ${(order?.total || 0).toFixed(2).replace('.', ',')}
🛵 *Tipo:* ${isBalcao ? 'Retirada no Balcão' : 'Entrega em Domicílio'}
${!isBalcao && deliveryAddress ? `📍 *Endereço:* ${deliveryAddress}\n` : ''}⏳ *Previsão:* ${branch?.deliveryTime || '45 - 60 min'}

Te avisamos quando estiver ${isBalcao ? 'pronto' : 'a caminho'}! Qualquer coisa só chamar aqui. 😉`
      );

    case 'EM_PREPARO':
      return (
`👨‍🍳 *Pedido no Forno! - El Shadday*

Oi, *${customerName}*! Seu pedido *#${orderId}* já foi pro forno e tá assando quentinho! 🔥

Assim que ${isBalcao ? 'estiver pronto pra retirada' : 'sair com o motoboy'}, te avisamos por aqui! 🍕`
      );

    case 'SAIU_ENTREGA':
      return (
`🛵 *Pedido a caminho! - El Shadday*

Oi, *${customerName}*! O motoboy acabou de sair com o seu pedido *#${orderId}*! 🚀
${deliveryAddress ? `📍 *Entrega:* ${deliveryAddress}\n` : ''}
Fica de olho aí no portão ou campainha que tá quentinho chegando. Bom apetite! 🍕😋`
      );

    case 'PRONTO_BALCAO':
      return (
`🛍️ *Pedido Pronto! - El Shadday*

Oi, *${customerName}*! Seu pedido *#${orderId}* já tá prontinho no balcão te esperando! 🍕✨

📍 *Retirada:* ${branchAddress}
Pode passar pra pegar quando quiser. Te esperamos aqui! 😉`
      );

    case 'CONCLUIDO':
      return (
`🎉 *Pedido Finalizado! - El Shadday*

Obrigado pela preferência, *${customerName}*! Esperamos que goste de tudo. Se precisar de algo, só chamar aqui. Até a próxima! 💛🍕`
      );

    case 'CANCELADO':
      return (
`❌ *Pedido Cancelado - El Shadday*

Oi, *${customerName}*, seu pedido *#${orderId}* foi cancelado.
${reason ? `📝 *Motivo:* ${reason}\n` : ''}
Se precisar de qualquer ajuda ou se já fez Pix, pode responder aqui que te atendemos na hora! Desculpe o transtorno.`
      );

    default:
      return (
`🍕 *El Shadday Informa*

Oi, *${customerName}*! Seu pedido *#${orderId}* foi atualizado. Qualquer dúvida estamos por aqui!`
      );
  }
}

/**
 * Disparo Imediato no Clique (Opção 2)
 * Roda de forma 100% síncrona dentro do evento de clique para que o Brave e Chrome NUNCA bloqueiem como popup!
 */
export function openWhatsAppInstantLink({ order, statusType, branch, reason = '' }) {
  if (!order) return null;
  const rawPhone = order.customerPhone;
  const cleanPhone = cleanPhoneNumber(rawPhone);
  if (!cleanPhone) return null;

  const settings = getWhatsAppSettings();
  if (!settings.autoNotify) return { success: false, reason: 'auto_notify_disabled' };
  if ((statusType === 'RECEBIDO' || statusType === 'RECEBIDO_COZINHA') && settings.notifyOnReceive === false) return { success: false };
  if (statusType === 'EM_PREPARO' && settings.notifyOnPrep === false) return { success: false };
  if (statusType === 'SAIU_ENTREGA' && settings.notifyOnDelivery === false) return { success: false };
  if (statusType === 'PRONTO_BALCAO' && settings.notifyOnReadyCounter === false) return { success: false };
  if (statusType === 'CONCLUIDO' && settings.notifyOnComplete === false) return { success: false };
  if (statusType === 'CANCELADO' && settings.notifyOnCancel === false) return { success: false };

  if (shouldBlockDuplicateDispatch(order.orderId, statusType)) {
    console.log('[WhatsApp] Abertura instantânea evitada por duplicata recente:', order.orderId, statusType);
    return { success: true, skippedDuplicate: true };
  }

  const resolvedBranch = branch || getBranchForOrder(order);
  const message = buildStatusMessage({ order, statusType, branch: resolvedBranch, reason });
  const encoded = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

  try {
    const win = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    return { success: true, url: whatsappUrl, windowOpened: !!win };
  } catch (err) {
    console.error('[WhatsApp] Erro ao abrir link instantâneo:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Dispara a notificação via WhatsApp (por API ou abrindo WhatsApp Web / app)
 */
export async function sendCustomerWhatsAppNotification({
  order,
  statusType,
  branch: providedBranch = null,
  reason = '',
  forceOpen = false
}) {
  if (!order) return { success: false, error: 'Pedido inválido' };

  // Pedido concluído/entregue nunca dispara mensagem automática para o cliente.
  // (Só o envio manual pelo botão 'Avisar Cliente' continua possível.)
  if (!forceOpen && String(statusType).toUpperCase() === 'CONCLUIDO') {
    return { success: false, reason: 'complete_never_notifies' };
  }

  if (!forceOpen && shouldBlockDuplicateDispatch(order.orderId, statusType)) {
    console.log('[WhatsApp] Disparo duplicado ignorado no cliente:', order.orderId, statusType);
    return { success: true, duplicateIgnored: true };
  }

  const rawPhone = order.customerPhone;
  const cleanPhone = cleanPhoneNumber(rawPhone);

  if (!cleanPhone) {
    console.warn('[WhatsApp] Pedido sem telefone válido do cliente:', order.orderId);
    return { success: false, error: 'Telefone do cliente não informado ou inválido' };
  }

  const branch = providedBranch || getBranchForOrder(order);
  const settings = getWhatsAppSettings();

  // Verifica se o disparo automático está ativo para este status
  if (!forceOpen) {
    if (!settings.autoNotify) {
      console.log('[WhatsApp] Auto-envio desativado nas preferências');
      return { success: false, reason: 'auto_notify_disabled' };
    }
    if ((statusType === 'RECEBIDO' || statusType === 'RECEBIDO_COZINHA') && settings.notifyOnReceive === false) {
      return { success: false, reason: 'notify_on_receive_disabled' };
    }
    if (statusType === 'EM_PREPARO' && settings.notifyOnPrep === false) {
      return { success: false, reason: 'notify_on_prep_disabled' };
    }
    if (statusType === 'SAIU_ENTREGA' && settings.notifyOnDelivery === false) {
      return { success: false, reason: 'notify_on_delivery_disabled' };
    }
    if (statusType === 'PRONTO_BALCAO' && settings.notifyOnReadyCounter === false) {
      return { success: false, reason: 'notify_on_ready_counter_disabled' };
    }
    if (statusType === 'CONCLUIDO' && settings.notifyOnComplete === false) {
      return { success: false, reason: 'notify_on_complete_disabled' };
    }
    if (statusType === 'CANCELADO' && settings.notifyOnCancel === false) {
      return { success: false, reason: 'notify_on_cancel_disabled' };
    }
  }

  const message = buildStatusMessage({ order, statusType, branch, reason });
  const encoded = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

  let apiSuccess = false;

  // 1. TENTA ENVIAR VIA MOTOR BAILEYS NA NUVEM (RENDER) OU LOCAL
  try {
    const directResult = await sendEngineDirectMessage({
      phone: cleanPhone,
      message,
      orderId: order.orderId,
      status: statusType
    });
    if (directResult.success) {
      apiSuccess = true;
      console.log('✅ [WhatsApp] Notificação disparada silenciosamente via Baileys Cloud para', cleanPhone);
    }
  } catch (err) {
    console.warn('[WhatsApp] Falha ao enviar via motor Baileys:', err);
  }

  // 2. Se disparou com sucesso pelo Baileys na nuvem, encerra aqui (SEM ABRIR JANELAS!)
  if (apiSuccess) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('el_shadday_whatsapp_notification_triggered', {
        detail: {
          orderId: order.orderId,
          customerName: order.customerName,
          phone: cleanPhone,
          statusType,
          branchName: branch?.displayName || branch?.name,
          whatsappUrl,
          apiSuccess: true,
          timestamp: new Date().toISOString()
        }
      }));
    }
    return { success: true, apiSuccess: true, phone: cleanPhone };
  }

  // 2. TENTA ENVIAR VIA WEBHOOK / API EXTERNA SE CONFIGURADA
  if (!apiSuccess) {
    const webhookUrl = branch?.whatsappApiUrl || settings.whatsappApiUrl;
    if (webhookUrl && !webhookUrl.includes('127.0.0.1')) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(branch?.whatsappApiToken ? { 'Authorization': `Bearer ${branch.whatsappApiToken}` } : {})
          },
          body: JSON.stringify({
            phone: cleanPhone,
            message,
            orderId: order.orderId,
            status: statusType,
            branchId: branch?.id || 'ariquemes'
          })
        });
        if (response.ok) {
          apiSuccess = true;
          console.log('[WhatsApp] Mensagem enviada com sucesso via webhook para', cleanPhone);
        }
      } catch (err) {
        console.warn('[WhatsApp] Falha ao enviar via webhook customizado:', err);
      }
    }
  }

  // 3. Fallback MANUAL: se for forceOpen (ex: clique explícito no botão 'Avisar Cliente Manualmente') e não tiver disparado pela API
  if (!apiSuccess && forceOpen) {
    try {
      window.open(whatsappUrl, '_blank');
    } catch (e) {
      console.error('[WhatsApp] Erro ao abrir janela manual do WhatsApp:', e);
    }
  }

  // 3. Emite evento global de notificação para a UI mostrar feedback
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('el_shadday_whatsapp_notification_triggered', {
      detail: {
        orderId: order.orderId,
        customerName: order.customerName,
        phone: cleanPhone,
        statusType,
        branchName: branch?.displayName || branch?.name,
        whatsappUrl,
        apiSuccess,
        timestamp: new Date().toISOString()
      }
    }));
  }

  return {
    success: true,
    phone: cleanPhone,
    whatsappUrl,
    message,
    apiSuccess
  };
}
