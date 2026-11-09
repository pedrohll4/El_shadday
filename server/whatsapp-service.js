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

// TRAVA ANTI-RENDER: o motor agora roda no PC da pizzaria. Se o serviço do Render
// voltar sozinho (ex: virada do mês), ele sobe DESLIGADO para não disputar a sessão
// do WhatsApp nem mandar mensagens repetidas. Para liberar de propósito no Render,
// crie a variável de ambiente ALLOW_RENDER_ENGINE=true lá.
const IS_RENDER = !!(process.env.RENDER || process.env.RENDER_EXTERNAL_URL || process.env.RENDER_SERVICE_ID);
const ENGINE_DISABLED = IS_RENDER && process.env.ALLOW_RENDER_ENGINE !== 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Porta dinâmica (Render atribui porta via process.env.PORT)
const PORT = process.env.PORT || 5001;
const AUTH_DIR = path.join(process.cwd(), 'data', 'wa_auth');

// Garante que o diretório de dados existe
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// Configuração do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://yzeemqzxlgudynydvpof.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZWVtcXp4bGd1ZHlueWR2cG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MjAwOTgsImV4cCI6MjEwNzA5NjA5OH0.aahKZCTuVyJ9lNS09EZPVhaucSRhTL6pDGwKITSUnwg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Estado da Conexão
const state = {
  status: 'DISCONNECTED', // 'DISCONNECTED' | 'CONNECTING' | 'SCAN_QR' | 'CONNECTED'
  qrCodeDataUrl: null,
  userInfo: null,
  lastError: null,
  batteryLevel: 98,
  autoNotify: true
};

let sock = null;
let isConnecting = false;

// Normaliza chave de status para deduplicação precisa
export function normalizeStatusKey(status) {
  const s = String(status || '').toUpperCase().trim();
  if (s === 'RECEBIDO_COZINHA' || s === 'RECEBIDO' || s === 'NOVO' || s === 'PENDENTE' || s === 'CRIADO') return 'RECEBIDO';
  if (s === 'EM_PREPARO' || s === 'PREPARO' || s === 'NO_FORNO' || s === 'FORNO' || s === 'PREPARING') return 'EM_PREPARO';
  if (s === 'SAIU_ENTREGA' || s === 'ENTREGA' || s === 'EM_ENTREGA' || s === 'A_CAMINHO' || s === 'DESPACHADO') return 'SAIU_ENTREGA';
  if (s === 'PRONTO_BALCAO' || s === 'BALCAO' || s === 'PRONTO' || s === 'RETIRADA') return 'PRONTO_BALCAO';
  if (s === 'CONCLUIDO' || s === 'CONCLUÍDO' || s === 'FINALIZADO' || s === 'ENTREGUE') return 'CONCLUIDO';
  if (s === 'CANCELADO' || s === 'CANCELED') return 'CANCELADO';
  return s;
}

// Histórico de mensagens enviadas para evitar duplicatas por status
const sentHistory = new Map();

/**
 * Tenta adquirir lock síncrono para o disparo do pedido + status.
 * Bloqueia se já tiver disparado ou estiver em envio nos últimos 10 minutos.
 */
function tryAcquireSendLock(orderId, status) {
  if (!orderId || !status) return true; // Mensagens avulsas/teste sem ID passam livremente
  const norm = normalizeStatusKey(status);
  const key = `${orderId}:${norm}`;
  const lastTime = sentHistory.get(key);

  if (lastTime && (Date.now() - lastTime < 10 * 60 * 1000)) {
    return false; // Já enviado ou lock ativo!
  }

  // Trava imediatamente antes de qualquer await
  sentHistory.set(key, Date.now());

  if (sentHistory.size > 1000) {
    const firstKey = sentHistory.keys().next().value;
    sentHistory.delete(firstKey);
  }

  return true;
}

function hasAlreadySent(orderId, status) {
  if (!orderId || !status) return false;
  const key = `${orderId}:${normalizeStatusKey(status)}`;
  const sentTime = sentHistory.get(key);
  if (!sentTime) return false;
  return Date.now() - sentTime < 10 * 60 * 1000;
}

function recordSentMessage(orderId, status) {
  if (!orderId || !status) return;
  const key = `${orderId}:${normalizeStatusKey(status)}`;
  sentHistory.set(key, Date.now());
}

// Persistência de Sessão no Supabase (Garante permanência mesmo em servidores com disco efêmero como Render Free)
// IMPORTANTE (banda/segurança): salvamos SOMENTE o creds.json, numa linha separada
// (AUTH_ROW_ID), apenas quando muda e no máximo 1x por minuto. Antes, a pasta inteira
// de sessão (centenas de arquivos) era reenviada a cada 'creds.update' dentro da linha
// principal de configurações, que é lida por todo visitante e retransmitida via Realtime.
const AUTH_ROW_ID = 'el_shadday_whatsapp_session';
const AUTH_BACKUP_MIN_INTERVAL_MS = 60 * 1000;
let lastAuthBackupContent = '';
let lastAuthBackupAt = 0;
let authBackupTimer = null;
let lastPublishedCloudStatus = null;

async function backupAuthToSupabase() {
  try {
    const credsPath = path.join(AUTH_DIR, 'creds.json');
    if (!fs.existsSync(credsPath)) return;
    const content = fs.readFileSync(credsPath, 'utf-8');
    if (!content || content === lastAuthBackupContent) return;

    const { error } = await supabase.from('company_settings').upsert({
      id: AUTH_ROW_ID,
      card_machine_settings: {
        baileys_cloud_auth: { 'creds.json': content },
        updated_at: new Date().toISOString()
      }
    });
    if (error) throw new Error(error.message);
    lastAuthBackupContent = content;
    lastAuthBackupAt = Date.now();
  } catch (e) {
    console.warn('[WhatsApp Service] Falha ao fazer backup de sessão no Supabase:', e.message);
  }
}

function scheduleAuthBackup(immediate = false) {
  if (authBackupTimer) return;
  const wait = immediate ? 0 : Math.max(0, AUTH_BACKUP_MIN_INTERVAL_MS - (Date.now() - lastAuthBackupAt));
  authBackupTimer = setTimeout(async () => {
    authBackupTimer = null;
    await backupAuthToSupabase();
  }, wait);
}

// Publica apenas status/telefone na linha principal (pequeno) e remove o backup antigo gigante
async function publishCloudStatusToSettings(force = false) {
  const phone = state.userInfo?.phone || '';
  const key = `${state.status}|${phone}`;
  if (!force && key === lastPublishedCloudStatus) return;
  try {
    const { data } = await supabase.from('company_settings').select('card_machine_settings').eq('id', 'el_shadday_config').single();
    const existing = { ...(data?.card_machine_settings || {}) };
    delete existing.baileys_cloud_auth;
    existing.baileys_cloud_status = state.status;
    existing.baileys_cloud_phone = phone;
    await supabase.from('company_settings').update({ card_machine_settings: existing }).eq('id', 'el_shadday_config');
    lastPublishedCloudStatus = key;
  } catch (e) {
    console.warn('[WhatsApp Service] Falha ao publicar status no Supabase:', e.message);
  }
}

function writeAuthFiles(authData) {
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
  for (const [file, content] of Object.entries(authData)) {
    if (!/^[\w.-]+\.json$/.test(file)) continue;
    fs.writeFileSync(path.join(AUTH_DIR, file), String(content), 'utf-8');
  }
}

async function restoreAuthFromSupabase() {
  try {
    // 1. Novo local (linha separada, só creds.json)
    const { data: authRow } = await supabase.from('company_settings').select('card_machine_settings').eq('id', AUTH_ROW_ID).maybeSingle();
    const newAuth = authRow?.card_machine_settings?.baileys_cloud_auth;
    if (newAuth && typeof newAuth === 'object' && newAuth['creds.json']) {
      writeAuthFiles(newAuth);
      lastAuthBackupContent = String(newAuth['creds.json']);
      console.log('✅ [WhatsApp Service] Sessão permanente restaurada do Supabase com sucesso!');
      return true;
    }

    // 2. Local antigo (compatibilidade): restaura e migra para o novo formato
    const { data } = await supabase.from('company_settings').select('card_machine_settings').eq('id', 'el_shadday_config').single();
    const authData = data?.card_machine_settings?.baileys_cloud_auth;
    if (authData && typeof authData === 'object' && Object.keys(authData).length > 0) {
      writeAuthFiles(authData);
      console.log('✅ [WhatsApp Service] Sessão restaurada do formato antigo. Migrando backup...');
      await backupAuthToSupabase();
      await publishCloudStatusToSettings(true);
      return true;
    }
  } catch (e) {
    console.warn('[WhatsApp Service] Falha ao restaurar sessão do Supabase:', e.message);
  }
  return false;
}

let reconnectAttempts = 0;

// Broadcast de status para o canal do Supabase
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
  } catch (err) {}
}

// Normaliza números de telefone do Brasil
export function formatToWhatsAppQueries(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return [];

  const candidates = [];
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

// Formata itens do pedido para o cliente (oculta detalhes internos de sabores caso seja sortido)
function formatOrderItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) return '• Itens do pedido';
  return items.map(it => {
    let line = `• ${it.quantity || 1}x *${it.name || 'Item'}*`;
    if (it.pizzaSelections && it.pizzaSelections.length > 0) {
      const sab = it.pizzaSelections.map(p => p.flavors?.join('/')).filter(Boolean).join(' + ');
      if (sab) line += ` (${sab})`;
    } else if (it.flavors && it.flavors.length > 0) {
      line += ` (${it.flavors.join('/')})`;
    } else if (it.isSortido || (it.name && it.name.toLowerCase().includes('sortid')) || (it.isBox && !it.salgadasDetails)) {
      line += ` (Sortido da Casa${it.semSuinos ? ' - Sem Suínos' : ''})`;
    } else if (it.isCustomBox && !it.isSortido && it.salgadasDetails) {
      const salg = Object.entries(it.salgadasDetails).map(([f, q]) => `${q}x ${f}`).join(', ');
      if (salg) line += ` (${salg})`;
    }
    const extras = [];
    if (it.dydyoFlavor) extras.push(`Refri: ${it.dydyoFlavor}`);
    if (it.beverage) extras.push(`Bebida: ${it.beverage}`);
    if (it.hasExtraSauce) extras.push(`Molho Extra`);
    if (extras.length > 0) line += ` [${extras.join(' | ')}]`;
    return line;
  }).join('\n');
}

// Construtor das mensagens padrão
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
      browser: ['Windows', 'Chrome', '131.0.0.0'],
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      syncFullHistory: false,
      markOnlineOnConnect: false
    });

    sock.ev.on('creds.update', async () => {
      await saveCreds();
      scheduleAuthBackup();
    });

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
          console.log('\n[WhatsApp Service] 📲 NOVO QR CODE GERADO! Escaneie no painel:');
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

        console.log(`\n[WhatsApp Service] ✅ CONECTADO COM SUCESSO! Telefone: +${cleanPhone}`);
        reconnectAttempts = 0;
        broadcastStateToSupabase();
        scheduleAuthBackup(true);
        publishCloudStatusToSettings();
      }

      if (connection === 'close') {
        isConnecting = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`[WhatsApp Service] Conexão encerrada. Código: ${statusCode}. Reconectar? ${shouldReconnect}`);

        if (shouldReconnect) {
          state.status = 'CONNECTING';
          broadcastStateToSupabase();
          // Backoff exponencial: 3s, 6s, 12s... ate 5 min (evita loop de reconexao gastando banda)
          reconnectAttempts += 1;
          const delay = Math.min(3000 * Math.pow(2, reconnectAttempts - 1), 5 * 60 * 1000);
          console.log(`[WhatsApp Service] Nova tentativa em ${Math.round(delay / 1000)}s (tentativa ${reconnectAttempts})`);
          setTimeout(() => initWhatsApp(true), delay);
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
          publishCloudStatusToSettings();
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
    } catch (e) {}
  }

  if (!targetJid) {
    targetJid = `${queries[0]}@s.whatsapp.net`;
  }

  try {
    await sock.sendPresenceUpdate('available');
    await new Promise(r => setTimeout(r, 500));
    await sock.sendPresenceUpdate('composing', targetJid);
    const typingTime = Math.min(2500, Math.max(800, message.length * 12));
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

  try {
    const { data } = await supabase.from('company_settings').select('card_machine_settings').eq('id', 'el_shadday_config').single();
    const existing = data?.card_machine_settings || {};
    delete existing.baileys_cloud_auth;
    delete existing.baileys_cloud_status;
    delete existing.baileys_cloud_phone;
    await supabase.from('company_settings').update({ card_machine_settings: existing }).eq('id', 'el_shadday_config');
    await supabase.from('company_settings').delete().eq('id', AUTH_ROW_ID);
    lastAuthBackupContent = '';
    lastPublishedCloudStatus = null;
  } catch (e) {}

  return { success: true };
}

// Escutador de pedidos no Supabase Realtime
function initSupabaseOrderWatcher() {
  console.log('[WhatsApp Service] 📡 Conectando ao Supabase Realtime...');

  supabaseBridgeChannel = supabase.channel('el_shadday_whatsapp_bridge');

  supabaseBridgeChannel
    .on('broadcast', { event: 'REQUEST_STATUS' }, () => {
      broadcastStateToSupabase();
    })
    .on('broadcast', { event: 'CONNECT' }, () => {
      initWhatsApp(true);
    })
    .on('broadcast', { event: 'LOGOUT' }, () => {
      logoutWhatsApp();
    })
    .on('broadcast', { event: 'SEND_TEST' }, async ({ payload }) => {
      if (payload?.phone && payload?.message) {
        try {
          if (payload.orderId && payload.status) {
            if (!tryAcquireSendLock(payload.orderId, payload.status)) {
              console.log(`[WhatsApp Service] ⚠️ Ignorando envio duplicado via Broadcast para pedido #${payload.orderId} (${payload.status})`);
              return;
            }
          }
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
        console.log('✅ [WhatsApp Bridge] Conectado ao Supabase Realtime!');
        broadcastStateToSupabase();
      }
    });

  // Ouve atualizações nos pedidos da cozinha
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
            if (!tryAcquireSendLock(orderId, 'RECEBIDO')) {
              console.log(`[Supabase Realtime] ⚠️ Ignorando INSERT duplicado para #${orderId}`);
              return;
            }
            console.log(`[Supabase Realtime] 🔔 Novo pedido: #${orderId} (${row.customer_name})`);
            const msg = buildOrderWhatsAppText({ order: row, statusType: 'RECEBIDO' });
            await sendWhatsAppMessage(phone, msg).catch(() => {});
            return;
          }

          // Se for UPDATE de status
          if (payload.eventType === 'UPDATE') {
            const oldStatus = String(payload.old?.status || '').toUpperCase().trim();
            if (oldStatus && status === oldStatus) return;

            let notifyType = normalizeStatusKey(status);

            if (!tryAcquireSendLock(orderId, notifyType)) {
              console.log(`[Supabase Realtime] ⚠️ Ignorando UPDATE duplicado para #${orderId} (${notifyType})`);
              return;
            }

            console.log(`[Supabase Realtime] 🔄 Pedido #${orderId}: ${oldStatus || 'status'} ➔ ${notifyType}`);

            const msg = buildOrderWhatsAppText({
              order: row,
              statusType: notifyType,
              reason: row.notes || ''
            });

            await sendWhatsAppMessage(phone, msg).catch((err) => {
              console.warn(`[WhatsApp Service] Erro ao enviar status (${notifyType}):`, err.message);
            });
          }
        } catch (err) {}
      }
    )
    .subscribe();
}

// Servidor HTTP com CORS Completo
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (ENGINE_DISABLED) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, disabled: true, status: 'DISABLED', error: 'Motor desativado no Render (roda no PC da pizzaria)' }));
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  const sendJson = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  try {
    // GET /health
    if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/')) {
      return sendJson(200, { ok: true, status: state.status, port: PORT, provider: 'Baileys Cloud Engine' });
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

      if (body.orderId && body.status) {
        if (!tryAcquireSendLock(body.orderId, body.status)) {
          console.log(`[WhatsApp Service] ⚠️ Ignorando envio duplicado via HTTP POST /send para pedido #${body.orderId} (${body.status})`);
          return sendJson(200, { success: true, duplicateIgnored: true });
        }
      }

      const result = await sendWhatsAppMessage(body.phone, body.message);
      return sendJson(200, result);
    }

    // POST /logout
    if (req.method === 'POST' && url.pathname === '/logout') {
      const result = await logoutWhatsApp();
      return sendJson(200, result);
    }

    return sendJson(404, { error: 'Rota não encontrada' });
  } catch (error) {
    return sendJson(500, { error: error?.message || 'Erro interno do serviço WhatsApp' });
  }
});

// Auto-ping para manter ativo se estiver no Render
if (process.env.RENDER_EXTERNAL_URL && !ENGINE_DISABLED) {
  const pingUrl = `${process.env.RENDER_EXTERNAL_URL}/health`;
  setInterval(() => {
    fetch(pingUrl).catch(() => {});
  }, 10 * 60 * 1000);
}

// Inicialização
// SEGURANÇA: no PC da pizzaria escuta só no próprio computador (127.0.0.1).
// Antes escutava na rede toda: qualquer aparelho no mesmo Wi-Fi podia pegar o
// QR Code em /status (e conectar o WhatsApp da loja) ou mandar mensagens via /send.
// Outros aparelhos usam a ponte do Supabase. Para liberar na rede: WHATSAPP_HOST=0.0.0.0
const HOST = process.env.WHATSAPP_HOST || (IS_RENDER ? '0.0.0.0' : '127.0.0.1');

server.listen(PORT, HOST, async () => {
  console.log(`\n============================================================`);
  console.log(`🚀 [WhatsApp Service] Motor El Shadday rodando na porta ${PORT}`);
  console.log(`⚡ 100% Gratuito | Sem Limite de Mensagens | Nuvem Render / Local`);
  console.log(`============================================================\n`);

  if (ENGINE_DISABLED) {
    console.log('⛔ [WhatsApp Service] Rodando no Render SEM ALLOW_RENDER_ENGINE=true: motor DESATIVADO.');
    console.log('   O WhatsApp roda no PC da pizzaria. Nada será conectado ou enviado daqui.');
    return;
  }

  initSupabaseOrderWatcher();

  // Tenta restaurar sessão permanente salva no Supabase
  const restored = await restoreAuthFromSupabase();
  if (restored) {
    console.log('[WhatsApp Service] Tentando reconexão automática com sessão salva...');
  }

  initWhatsApp().catch((err) => {
    console.log('[WhatsApp Service] Aguardando comando de conexão:', err.message);
  });
});
