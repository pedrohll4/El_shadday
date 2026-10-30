import { getStoredBranches } from '../data/branchesData';
import { getBranchWhatsApp, sendEngineDirectMessage } from './whatsappBranchService';

const STORAGE_SETTINGS_KEY = 'el_shadday_whatsapp_settings_v1';

export const DEFAULT_WHATSAPP_SETTINGS = {
  autoNotify: true,          // Disparo automático ao mudar status no KDS
  notifyOnReceive: true,     // Ao criar/receber o pedido
  notifyOnPrep: true,        // Ao mover para forno / preparo
  notifyOnDelivery: true,    // Ao despachar para entrega
  notifyOnReadyCounter: true,// Ao marcar pronto no balcão
  notifyOnComplete: true,    // Ao marcar como concluído
  notifyOnCancel: true,      // Ao cancelar o pedido
  openDirectly: false        // Disparos 100% silenciosos em segundo plano (sem abrir abas)
};

export function getWhatsAppSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_WHATSAPP_SETTINGS, ...JSON.parse(raw) };
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
 * Formata lista resumida de itens para o texto da mensagem
 */
function formatOrderItemsSummary(items = []) {
  if (!Array.isArray(items) || items.length === 0) return '• Itens do pedido';
  
  return items.map(it => {
    let line = `• ${it.quantity}x *${it.name}*`;
    if (it.pizzaSelections && it.pizzaSelections.length > 0) {
      const sab = it.pizzaSelections.map(p => p.flavors?.join('/')).filter(Boolean).join(' + ');
      if (sab) line += ` (${sab})`;
    } else if (it.flavors && it.flavors.length > 0) {
      line += ` (${it.flavors.join('/')})`;
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
  const branchAddress = branch?.address || 'Rua Maceió, 2333 - Setor 03, Ariquemes - RO';
  const isBalcao = order?.deliveryType === 'balcao' || order?.deliveryType === 'retirada';
  const deliveryAddress = order?.address ? `${order.address}${order.number ? `, Nº ${order.number}` : ''}${order.district ? ` (${order.district})` : ''}` : '';

  switch (statusType) {
    case 'RECEBIDO':
    case 'RECEBIDO_COZINHA':
      return (
`🍕 *EL SHADDAY DELIVERY - PEDIDO CONFIRMADO!*
📍 *${branchName}*
----------------------------------------
Olá, *${customerName}*! Seu pedido *#${orderId}* foi recebido com sucesso pela nossa equipe e já está na fila de produção! ✅

📋 *ITENS:*
${formatOrderItemsSummary(order?.items)}

🛵 *Modalidade:* ${isBalcao ? 'Retirada no Balcão' : 'Delivery (Entrega em Domicílio)'}
${!isBalcao && deliveryAddress ? `🏠 *Endereço:* ${deliveryAddress}\n` : ''}💰 *Total:* R$ ${(order?.total || 0).toFixed(2).replace('.', ',')}
⏳ *Tempo Estimado:* ${branch?.deliveryTime || '45 - 75 min'}

Passaremos todas as atualizações do seu pedido por aqui. Muito obrigado pela preferência! 💛`
      );

    case 'EM_PREPARO':
      return (
`👨‍🍳🔥 *PEDIDO NO FORNO! - EL SHADDAY*
📍 *${branchName}*
----------------------------------------
Olá, *${customerName}*! Passando para avisar que o seu pedido *#${orderId}* acabou de entrar no forno! 🔥

Nossa equipe está preparando tudo com ingredientes frescos, massa artesanal e muito carinho.

⏳ Logo seu pedido estará no ponto ideal! Avisaremos assim que ${isBalcao ? 'estiver pronto para retirada' : 'o motoboy sair para entrega'}. ✨`
      );

    case 'SAIU_ENTREGA':
      return (
`🛵💨 *PEDIDO A CAMINHO! - EL SHADDAY*
📍 *${branchName}*
----------------------------------------
Boas notícias, *${customerName}*! O seu pedido *#${orderId}* acabou de sair da nossa cozinha e já está a caminho! 🛵💨

${deliveryAddress ? `📍 *Destino:* ${deliveryAddress}\n` : ''}⚠️ *Dica:* Por favor, mantenha alguém atento ao portão/campainha para receber o entregador.

Seu pedido está quentinho. Bom apetite! 🍕😋`
      );

    case 'PRONTO_BALCAO':
      return (
`🛍️✨ *SEU PEDIDO ESTÁ PRONTO! - EL SHADDAY*
📍 *${branchName}*
----------------------------------------
Olá, *${customerName}*! O seu pedido *#${orderId}* já ficou pronto, quentinho e embalado esperando por você no balcão! 🍕✨

🏢 *Local de Retirada:* ${branchAddress}
⏰ Pode passar para retirar a qualquer momento.

Estamos te esperando! 💛`
      );

    case 'CONCLUIDO':
      return (
`🎉🍕 *PEDIDO ENTREGUE COM SUCESSO!*
📍 *${branchName}*
----------------------------------------
Olá, *${customerName}*! Seu pedido *#${orderId}* foi finalizado! ✅

Esperamos que sua refeição esteja deliciosa e que tenha uma experiência incrível com a El Shadday.

⭐ Se gostou, compartilhe nos stories e marque a gente!
Qualquer feedback ou dúvida, estamos sempre à disposição por este WhatsApp.

Muito obrigado e até a próxima! 💛`
      );

    case 'CANCELADO':
      return (
`⚠️ *AVISO: PEDIDO CANCELADO - EL SHADDAY*
📍 *${branchName}*
----------------------------------------
Olá, *${customerName}*, informamos que o seu pedido *#${orderId}* precisou ser cancelado no sistema.

${reason ? `📝 *Motivo informado:* ${reason}\n` : ''}Se você já efetuou o pagamento via Pix ou precisa de qualquer esclarecimento, por favor responda esta mensagem para falar diretamente com nosso atendimento da unidade.

WhatsApp da Filial: *${branchPhone}*
Pedimos sinceras desculpas pelo inconveniente!`
      );

    default:
      return (
`🍕 *ATUALIZAÇÃO DO PEDIDO - EL SHADDAY*
📍 *${branchName}*
----------------------------------------
Olá, *${customerName}*! Informamos que o status do seu pedido *#${orderId}* foi atualizado.

Em caso de dúvidas, estamos à disposição por aqui!`
      );
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

  const rawPhone = order.customerPhone;
  const cleanPhone = cleanPhoneNumber(rawPhone);

  if (!cleanPhone) {
    console.warn('[WhatsApp] Pedido sem telefone válido do cliente:', order.orderId);
    return { success: false, error: 'Telefone do cliente não informado ou inválido' };
  }

  const branch = providedBranch || getBranchForOrder(order);
  const settings = getWhatsAppSettings();

  // Verifica se o disparo automático está ativo para este status
  if (!forceOpen && !settings.autoNotify) {
    console.log('[WhatsApp] Auto-envio desativado nas preferências');
    return { success: false, reason: 'auto_notify_disabled' };
  }

  const message = buildStatusMessage({ order, statusType, branch, reason });
  const encoded = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

  let apiSuccess = false;

  // 1. TENTA ENVIAR VIA MOTOR GRATUITO LOCAL / SUPABASE BRIDGE (100% Silencioso)
  try {
    const directResult = await sendEngineDirectMessage({
      phone: cleanPhone,
      message,
      orderId: order.orderId,
      status: statusType
    });
    if (directResult.success) {
      apiSuccess = true;
      console.log('✅ [WhatsApp] Notificação disparada silenciosamente para', cleanPhone);
    }
  } catch (err) {
    console.warn('[WhatsApp] Falha ao enviar via motor direto:', err);
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

  // 3. Fallback MANUAL: se for forceOpen (ex: clique no botão 'Avisar Cliente') e não tiver disparado
  if (!apiSuccess && (forceOpen || settings.openDirectly)) {
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
