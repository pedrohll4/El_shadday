import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5001;
const AUTH_DIR = path.join(process.cwd(), 'data', 'wa_auth');

// Garante que o diretório de dados existe
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// Configuração do Supabase para escuta de pedidos em tempo real (compatível com Vercel)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://yzeemqzxlgudynydvpof.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZWVtcXp4bGd1ZHlueWR2cG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MjAwOTgsImV4cCI6MjEwNzA5NjA5OH0.aahKZCTuVyJ9lNS09EZPVhaucSRhTL6pDGwKITSUnwg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Estado da Conexão
const state = {
  status: 'DISCONNECTED', // 'DISCONNECTED' | 'CONNECTING' | 'SCAN_QR' | 'CONNECTED'
  qrCodeDataUrl: null,
  userInfo: null,
  lastError: null,
  batteryLevel: 96,
  autoNotify: true
};

let sock = null;
let isConnecting = false;

// Histórico de mensagens enviadas para evitar duplicatas por status
const sentHistory = new Map(); // key: `${orderId}:${status}` -> timestamp

function recordSentMessage(orderId, status) {
  if (!orderId || !status) return;
  sentHistory.set(`${orderId}:${status}`, Date.now());
  // Mantém no máximo 500 registros
  if (sentHistory.size > 500) {
    const firstKey = sentHistory.keys().next().value;
    sentHistory.delete(firstKey);
  }
}

function hasAlreadySent(orderId, status) {
  if (!orderId || !status) return false;
  const key = `${orderId}:${status}`;
  const sentTime = sentHistory.get(key);
  if (!sentTime) return false;
  // Se foi enviado há menos de 10 minutos, considera duplicata
  return Date.now() - sentTime < 10 * 60 * 1000;
}

// Broadcast de status para o canal do Supabase (para telas no Vercel receberem o QR Code)
let supabaseBridgeChannel = null;

function broadcastStateToSupabase() {
  if (!supabaseBridgeChannel) return;
  try {
    supabaseBridgeChannel.send({
      type: 'broadcast',
      event: 'STATUS_UPDATE',
      payload: {
        status: state.status,
        qrCodeDataUrl: state.qrCodeDataUrl,
        userInfo: state.userInfo,
        lastError: state.lastError,
        batteryLevel: state.batteryLevel,
        autoNotify: state.autoNotify,
        timestamp: Date.now()
      }
    }).catch(() => {});
  } catch (err) {
    // Silencia erros de broadcast
  }
}

// Normaliza números de telefone do Brasil para consulta e envio no WhatsApp
export function formatToWhatsAppQueries(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return [];

  const candidates = [];

  // Se tem DDD de 2 dígitos + número (10 ou 11 dígitos) sem o 55 do país
  if (digits.length === 10 || digits.length === 11) {
    candidates.push(`55${digits}`);
    if (digits.length === 11 && digits[2] === '9') {
      const ddd = digits.slice(0, 2);
      const rest = digits.slice(3);
      candidates.push(`55${ddd}${rest}`);
    }
  } else if (digits.length === 12 || digits.length === 13) {
    candidates.push(digits);
    if (digits.startsWith('55') && digits.length === 13 && digits[4] === '9') {
      const ddd = digits.slice(2, 4);
      const rest = digits.slice(5);
      candidates.push(`55${ddd}${rest}`);
    }
  } else {
    candidates.push(digits);
  }

  return Array.from(new Set(candidates));
}

// Formata itens do pedido para texto do WhatsApp
function formatOrderItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) return '• Itens do pedido';
  return items.map(it => {
    let line = `• ${it.quantity || 1}x *${it.name || 'Item'}*`;
    if (it.pizzaSelections && it.pizzaSelections.length > 0) {
      const sab = it.pizzaSelections.map(p => p.flavors?.join('/')).filter(Boolean).join(' + ');
      if (sab) line += ` (${sab})`;
    } else if (it.flavors && it.flavors.length > 0) {
      line += ` (${it.flavors.join('/')})`;
    }
    return line;
  }).join('\n');
}

// Construtor das mensagens padrão da El Shadday
export function buildOrderWhatsAppText({ order, statusType, reason = '' }) {
  const customerName = order.customer_name || order.customerName || 'Cliente';
  const orderId = order.id || order.orderId || 'S/N';
  const branchName = order.branch_name || order.branchName || 'El Shadday Ariquemes';
  const isBalcao = (order.delivery_type === 'balcao' || order.deliveryType === 'balcao' || order.district === 'Balcão');
  const deliveryAddress = order.delivery_address?.address 
    ? `${order.delivery_address.address}${order.delivery_address.number ? `, Nº ${order.delivery_address.number}` : ''}`
    : (order.address ? `${order.address}${order.number ? `, Nº ${order.number}` : ''}` : '');

  const norm = String(statusType).toUpperCase().trim();

  switch (norm) {
    case 'RECEBIDO':
    case 'RECEBIDO_COZINHA':
      return (
`🍕 *EL SHADDAY DELIVERY - PEDIDO CONFIRMADO!*
📍 *${branchName}*
----------------------------------------
Olá, *${customerName}*! Seu pedido *#${orderId}* foi recebido com sucesso pela nossa equipe e já está na fila de produção! ✅

📋 *ITENS:*
${formatOrderItems(order.items)}

🛵 *Modalidade:* ${isBalcao ? 'Retirada no Balcão' : 'Delivery (Entrega em Domicílio)'}
${!isBalcao && deliveryAddress ? `🏠 *Endereço:* ${deliveryAddress}\n` : ''}💰 *Total:* R$ ${Number(order.total || 0).toFixed(2).replace('.', ',')}
⏳ *Tempo Estimado:* 45 - 75 min

Passaremos todas as atualizações do seu pedido por aqui. Muito obrigado pela preferência! 💛`
      );

    case 'EM_PREPARO':
    case 'NO_FORNO':
      return (
`👨‍🍳🔥 *PEDIDO NO FORNO! - EL SHADDAY*
📍 *${branchName}*
----------------------------------------
Olá, *${customerName}*! Passando para avisar que o seu pedido *#${orderId}* acabou de entrar no forno! 🔥

Nossa equipe está preparando tudo com ingredientes frescos, massa artesanal e muito carinho.

⏳ Logo seu pedido estará no ponto ideal! Avisaremos assim que ${isBalcao ? 'estiver pronto para retirada no balcão' : 'o motoboy sair para entrega'}. ✨`
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

🏢 *Local de Retirada:* Av Canaã, 4065 - Ariquemes - RO
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

⭐ Se gostou, compartilhe nos stories e marque a gente! (@elshadday_buffet)
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

WhatsApp da Filial: *(69) 99222-8682*
Pedimos sinceras desculpas pelo inconveniente!`
      );

    default:
      return (
`🍕 *ATUALIZAÇÃO DO PEDIDO - EL SHADDAY*
📍 *${branchName}*
----------------------------------------
Olá, *${customerName}*! O status do seu pedido *#${orderId}* foi atualizado para: *${norm}*.

Qualquer dúvida, estamos à disposição! 💛`
      );
  }
}

// Inicializa o Baileys WhatsApp Socket
async function initWhatsApp(forceReconnect = false) {
  if (isConnecting) return;
  if (sock && state.status === 'CONNECTED' && !forceReconnect) return;

  isConnecting = true;
  state.status = 'CONNECTING';
  state.lastError = null;
  broadcastStateToSupabase();

  try {
    const { state: authState, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: authState,
      logger: pino({ level: 'warn' }),
      printQRInTerminal: true,
      browser: ['Windows', 'Brave', '131.0.0.0'],
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      syncFullHistory: false,
      markOnlineOnConnect: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          state.qrCodeDataUrl = await QRCode.toDataURL(qr, {
            margin: 2,
            width: 320,
            color: {
              dark: '#0f172a',
              light: '#ffffff'
            }
          });
          state.status = 'SCAN_QR';
          console.log('\n[WhatsApp Service] 📲 NOVO QR CODE GERADO! Escaneie no WhatsApp:');
          broadcastStateToSupabase();
        } catch (err) {
          console.error('[WhatsApp Service] Erro ao gerar imagem do QR Code:', err);
        }
      }

      if (connection === 'open') {
        state.status = 'CONNECTED';
        state.qrCodeDataUrl = null;
        isConnecting = false;

        const rawJid = sock?.user?.id || '';
        const cleanPhone = rawJid.split(':')[0].replace(/\D/g, '');

        state.userInfo = {
          id: rawJid,
          name: sock?.user?.name || 'WhatsApp Pizzaria El Shadday',
          phone: cleanPhone
        };

        console.log(`\n[WhatsApp Service] ✅ CONECTADO COM SUCESSO! Telefone Oficial: +${cleanPhone}`);
        broadcastStateToSupabase();
      }

      if (connection === 'close') {
        isConnecting = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`[WhatsApp Service] Conexão encerrada. Código: ${statusCode}. Reconectar? ${shouldReconnect}`);

        if (shouldReconnect) {
          state.status = 'CONNECTING';
          broadcastStateToSupabase();
          setTimeout(() => initWhatsApp(true), 3000);
        } else {
          state.status = 'DISCONNECTED';
          state.userInfo = null;
          state.qrCodeDataUrl = null;
          sock = null;
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
            fs.mkdirSync(AUTH_DIR, { recursive: true });
          } catch (e) {}
          broadcastStateToSupabase();
        }
      }
    });
  } catch (error) {
    console.error('[WhatsApp Service] Erro ao inicializar socket:', error);
    state.status = 'DISCONNECTED';
    state.lastError = error?.message || 'Erro de conexão';
    isConnecting = false;
    broadcastStateToSupabase();
  }
}

// Envia mensagem silenciosa
export async function sendWhatsAppMessage(phone, message) {
  if (!sock || state.status !== 'CONNECTED') {
    throw new Error('WhatsApp não está conectado. Escaneie o QR Code no painel primeiro.');
  }

  const queries = formatToWhatsAppQueries(phone);
  if (queries.length === 0) {
    throw new Error(`Número de telefone inválido: "${phone}"`);
  }

  let targetJid = null;

  // Verifica se o número existe no WhatsApp
  for (const q of queries) {
    try {
      const results = await sock.onWhatsApp(q);
      if (results && results.length > 0) {
        const match = results.find(r => r.exists);
        if (match) {
          targetJid = match.jid;
          break;
        }
      }
    } catch (e) {
      // Ignora erro no loop de checagem
    }
  }

  // Fallback para query padrão com sufixo
  if (!targetJid) {
    targetJid = `${queries[0]}@s.whatsapp.net`;
  }

  // Simulação de presença humana antes do envio (evita bloqueio)
  try {
    await sock.sendPresenceUpdate('available');
    await new Promise(r => setTimeout(r, 600));
    await sock.sendPresenceUpdate('composing', targetJid);
    const typingTime = Math.min(3000, Math.max(1000, message.length * 15));
    await new Promise(r => setTimeout(r, typingTime));
    await sock.sendPresenceUpdate('paused', targetJid);
  } catch (e) {}

  const result = await sock.sendMessage(targetJid, { text: message });

  setTimeout(() => {
    sock?.sendPresenceUpdate('unavailable').catch(() => {});
  }, 1000);

  console.log(`[WhatsApp Service] 🚀 Mensagem enviada para ${targetJid} (ID: ${result?.key?.id})`);

  return {
    success: true,
    messageId: result?.key?.id,
    targetJid
  };
}

// Desconecta e limpa sessão
async function logoutWhatsApp() {
  if (sock) {
    try {
      await sock.logout();
    } catch (e) {}
    sock = null;
  }

  try {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  } catch (e) {}

  state.status = 'DISCONNECTED';
  state.qrCodeDataUrl = null;
  state.userInfo = null;
  state.lastError = null;
  broadcastStateToSupabase();

  return { success: true };
}

// Escutador de pedidos no Supabase Realtime (Permite que o site na Vercel acione o disparo silencioso!)
function initSupabaseOrderWatcher() {
  console.log('[WhatsApp Service] 📡 Conectando ao Supabase Realtime para ouvir pedidos...');

  // Canal de Broadcast bi-direcional para comunicar com o Admin no Vercel
  supabaseBridgeChannel = supabase.channel('el_shadday_whatsapp_bridge');

  supabaseBridgeChannel
    .on('broadcast', { event: 'REQUEST_STATUS' }, () => {
      console.log('[WhatsApp Bridge] 📨 Pedido de status recebido via Supabase Broadcast');
      broadcastStateToSupabase();
    })
    .on('broadcast', { event: 'CONNECT' }, () => {
      console.log('[WhatsApp Bridge] 🔌 Comando CONNECT recebido via Supabase Broadcast');
      initWhatsApp(true);
    })
    .on('broadcast', { event: 'LOGOUT' }, () => {
      console.log('[WhatsApp Bridge] 🚪 Comando LOGOUT recebido via Supabase Broadcast');
      logoutWhatsApp();
    })
    .on('broadcast', { event: 'SEND_TEST' }, async ({ payload }) => {
      console.log('[WhatsApp Bridge] 🧪 Envio de teste solicitado:', payload?.phone);
      if (payload?.phone && payload?.message) {
        try {
          await sendWhatsAppMessage(payload.phone, payload.message);
          supabaseBridgeChannel.send({
            type: 'broadcast',
            event: 'SEND_TEST_RESULT',
            payload: { success: true, phone: payload.phone }
          });
        } catch (err) {
          supabaseBridgeChannel.send({
            type: 'broadcast',
            event: 'SEND_TEST_RESULT',
            payload: { success: false, error: err.message, phone: payload.phone }
          });
        }
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ [WhatsApp Bridge] Conectado ao canal de broadcast do Supabase!');
        broadcastStateToSupabase();
      }
    });

  // Escuta alterações na tabela 'orders'
  supabase
    .channel('whatsapp_orders_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      async (payload) => {
        try {
          const row = payload.new;
          if (!row || !row.id) return;

          const orderId = row.id;
          const status = String(row.status || '').toUpperCase().trim();
          const phone = row.customer_phone;

          if (!phone) return;

          // Se for INSERT de novo pedido
          if (payload.eventType === 'INSERT') {
            if (hasAlreadySent(orderId, 'RECEBIDO')) return;
            console.log(`[Supabase Realtime] 🔔 Novo pedido recebido: #${orderId} (${row.customer_name})`);
            recordSentMessage(orderId, 'RECEBIDO');
            const msg = buildOrderWhatsAppText({ order: row, statusType: 'RECEBIDO' });
            await sendWhatsAppMessage(phone, msg).catch((err) => {
              console.warn('[WhatsApp Service] Falha ao enviar confirmação de novo pedido:', err.message);
            });
            return;
          }

          // Se for UPDATE de status
          if (payload.eventType === 'UPDATE') {
            const oldStatus = String(payload.old?.status || '').toUpperCase().trim();
            if (status === oldStatus) return; // Status não mudou

            // Mapeia se o pedido é balcão para mensagem correta de conclusão
            let notifyType = status;
            if (status === 'CONCLUIDO' && (row.delivery_type === 'balcao' || row.district === 'Balcão')) {
              notifyType = 'PRONTO_BALCAO';
            }

            if (hasAlreadySent(orderId, notifyType)) {
              return; // Já enviado
            }

            console.log(`[Supabase Realtime] 🔄 Status alterado no pedido #${orderId}: ${oldStatus} ➔ ${notifyType}`);
            recordSentMessage(orderId, notifyType);

            const msg = buildOrderWhatsAppText({
              order: row,
              statusType: notifyType,
              reason: row.notes || ''
            });

            await sendWhatsAppMessage(phone, msg).catch((err) => {
              console.warn(`[WhatsApp Service] Falha ao enviar atualização (${notifyType}):`, err.message);
            });
          }
        } catch (err) {
          console.warn('[WhatsApp Service] Erro no processamento de evento do Supabase:', err);
        }
      }
    )
    .subscribe();
}

// Servidor HTTP Local (porta 5001) para uso no mesmo computador / rede local
const server = http.createServer(async (req, res) => {
  // Configuração de CORS completo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  const sendJson = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  try {
    // GET /health
    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(200, { ok: true, status: state.status, port: PORT });
    }

    // GET /status
    if (req.method === 'GET' && url.pathname === '/status') {
      return sendJson(200, {
        status: state.status,
        qrCodeDataUrl: state.qrCodeDataUrl,
        userInfo: state.userInfo,
        lastError: state.lastError,
        batteryLevel: state.batteryLevel,
        autoNotify: state.autoNotify
      });
    }

    // POST /connect
    if (req.method === 'POST' && url.pathname === '/connect') {
      if (state.status !== 'CONNECTED') {
        initWhatsApp(true);
      }
      return sendJson(200, {
        status: state.status,
        qrCodeDataUrl: state.qrCodeDataUrl,
        userInfo: state.userInfo
      });
    }

    // Helper para leitura do corpo JSON
    const readBody = () => {
      return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', () => {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch (e) {
            reject(new Error('JSON inválido'));
          }
        });
        req.on('error', reject);
      });
    };

    // POST /send
    if (req.method === 'POST' && url.pathname === '/send') {
      const body = await readBody();
      if (!body.phone) {
        return sendJson(400, { error: "Parâmetro 'phone' é obrigatório" });
      }
      if (!body.message) {
        return sendJson(400, { error: "Parâmetro 'message' é obrigatório" });
      }

      const result = await sendWhatsAppMessage(body.phone, body.message);
      if (body.orderId && body.status) {
        recordSentMessage(body.orderId, body.status);
      }
      return sendJson(200, result);
    }

    // POST /logout
    if (req.method === 'POST' && url.pathname === '/logout') {
      const result = await logoutWhatsApp();
      return sendJson(200, result);
    }

    return sendJson(404, { error: 'Rota não encontrada' });
  } catch (error) {
    console.error('[WhatsApp Service Error]', error);
    return sendJson(500, { error: error?.message || 'Erro interno do serviço WhatsApp' });
  }
});

// Inicia servidor HTTP e escutador Supabase
server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n============================================================`);
  console.log(`🚀 [WhatsApp Service] Motor El Shadday rodando em http://127.0.0.1:${PORT}`);
  console.log(`⚡ 100% Gratuito | Sem API Paga | Disparos Silenciosos Ativos`);
  console.log(`============================================================\n`);

  // Conecta ao Supabase Realtime
  initSupabaseOrderWatcher();

  // Inicia conexão do WhatsApp
  initWhatsApp().catch((err) => {
    console.log('[WhatsApp Service] Aguardando comando de conexão:', err.message);
  });
});
