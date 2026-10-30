import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Smartphone, 
  Wifi, 
  Battery, 
  Power, 
  Send, 
  ShieldCheck, 
  Settings2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  Cloud,
  HelpCircle,
  Copy,
  Terminal,
  Check
} from 'lucide-react';
import { 
  getAllBranchWhatsApp, 
  getBranchWhatsApp, 
  updateBranchWhatsApp,
  getCloudEngineUrl,
  saveCloudEngineUrl,
  syncCloudEngineUrlFromDatabase,
  fetchEngineStatus,
  requestEngineConnect,
  disconnectBranchWhatsApp,
  sendEngineDirectMessage,
  isCloudBaileysActive
} from '../../services/whatsappBranchService';
import { 
  getWhatsAppSettings, 
  saveWhatsAppSettings 
} from '../../services/whatsappNotificationService';

export default function WhatsAppManagerView({ 
  currentUser, 
  branches = [], 
  currentBranch 
}) {
  const [sessions, setSessions] = useState(() => getAllBranchWhatsApp());
  const [settings, setSettings] = useState(() => getWhatsAppSettings());
  const [cloudUrlInput, setCloudUrlInput] = useState(() => getCloudEngineUrl());
  const [activeQrModal, setActiveQrModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [copiedText, setCopiedText] = useState(null);

  const [testPhone, setTestPhone] = useState('');
  const [testFeedback, setTestFeedback] = useState(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Sincroniza configurações ao montar
  useEffect(() => {
    syncCloudEngineUrlFromDatabase().then(url => {
      if (url) setCloudUrlInput(url);
    });

    fetchEngineStatus('ariquemes').catch(() => {});

    const handleSync = (e) => {
      if (e?.detail) setSessions(getAllBranchWhatsApp());
    };

    const handleEngineUpdate = (e) => {
      if (e?.detail) {
        setSessions(getAllBranchWhatsApp());
        if (e.detail.status === 'CONNECTED' || e.detail.status === 'connected') {
          setActiveQrModal(false);
        }
      }
    };

    window.addEventListener('el_shadday_whatsapp_session_updated', handleSync);
    window.addEventListener('el_shadday_whatsapp_engine_update', handleEngineUpdate);

    return () => {
      window.removeEventListener('el_shadday_whatsapp_session_updated', handleSync);
      window.removeEventListener('el_shadday_whatsapp_engine_update', handleEngineUpdate);
    };
  }, []);

  // Polling de QR Code quando modal estiver aberto
  useEffect(() => {
    if (!activeQrModal) return;

    const interval = setInterval(() => {
      fetchEngineStatus('ariquemes').then(data => {
        if (data?.status === 'CONNECTED' || data?.status === 'connected') {
          setActiveQrModal(false);
          setQrCodeDataUrl(null);
        } else if (data?.qrCodeDataUrl) {
          setQrCodeDataUrl(data.qrCodeDataUrl);
        }
      }).catch(() => {});
    }, 2500);

    return () => clearInterval(interval);
  }, [activeQrModal]);

  const session = sessions['ariquemes'] || getBranchWhatsApp('ariquemes');
  const isConnected = session.status === 'connected' || session.status === 'CONNECTED';
  const isScanning = session.status === 'scan_qr' || session.status === 'SCAN_QR';

  // Salvar URL do motor na nuvem
  const handleSaveCloudUrl = async () => {
    setIsCheckingStatus(true);
    setTestFeedback(null);
    try {
      const clean = saveCloudEngineUrl(cloudUrlInput);
      const data = await fetchEngineStatus('ariquemes');
      if (data?.status === 'CONNECTED' || data?.status === 'connected') {
        setTestFeedback({ success: true, msg: '✅ Conexão com o Motor Baileys estabelecida com sucesso! WhatsApp Conectado.' });
      } else {
        setTestFeedback({ success: true, msg: `✅ URL salva (${clean}). Clique em "Reconectar / QR Code" para emparelhar seu WhatsApp.` });
      }
    } catch (err) {
      setTestFeedback({ success: false, msg: `⚠️ Erro ao verificar URL: ${err.message}` });
    } finally {
      setIsCheckingStatus(false);
      setTimeout(() => setTestFeedback(null), 7000);
    }
  };

  // Abrir Modal de QR Code
  const handleOpenQrModal = async () => {
    setActiveQrModal(true);
    setIsConnecting(true);
    setQrCodeDataUrl(null);
    try {
      await requestEngineConnect('ariquemes');
      const data = await fetchEngineStatus('ariquemes');
      if (data?.qrCodeDataUrl) {
        setQrCodeDataUrl(data.qrCodeDataUrl);
      }
    } catch (err) {
      console.warn('Erro ao solicitar conexão:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Desconectar WhatsApp
  const handleDisconnect = async () => {
    if (window.confirm('Tem certeza que deseja desconectar o WhatsApp da pizzaria? Será necessário escanear o QR Code novamente para reconectar.')) {
      disconnectBranchWhatsApp('ariquemes');
      setSessions(getAllBranchWhatsApp());
    }
  };

  // Enviar Teste Silencioso
  const handleSendTest = async () => {
    if (!testPhone || testPhone.replace(/\D/g, '').length < 8) {
      setTestFeedback({ success: false, msg: 'Digite um número de telefone com DDD (ex: 69992228682)' });
      return;
    }

    setIsSendingTest(true);
    setTestFeedback(null);

    const clean = testPhone.replace(/\D/g, '');
    const testMsg = `🍕 *TESTE DE NOTIFICAÇÃO - EL SHADDAY DELIVERY*\n📍 *Unidade Ariquemes*\n\nConexão com WhatsApp na Nuvem realizada com sucesso! As notificações de pedidos (No Forno, Saiu para Entrega, Balcão) serão disparadas 100% silenciosamente por este número. ✅`;

    try {
      const res = await sendEngineDirectMessage({ phone: clean, message: testMsg });
      if (res.success) {
        setTestFeedback({ success: true, msg: `✅ Mensagem enviada com sucesso no WhatsApp de +${clean}! Verifique o aplicativo.` });
      } else {
        setTestFeedback({ success: false, msg: `⚠️ Falha: ${res.error || 'WhatsApp não conectado. Escaneie o QR Code primeiro.'}` });
      }
    } catch (err) {
      setTestFeedback({ success: false, msg: `Erro ao enviar teste: ${err.message}` });
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setTestFeedback(null), 8000);
    }
  };

  // Alternar regras
  const handleToggleSetting = (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    saveWhatsAppSettings(next);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Limpo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-dark-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Central de WhatsApp (Nuvem Gratuita)</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-emerald-400" />
                Motor Baileys Cloud • Sem Limite de Mensagens
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Disparos 100% automáticos e silenciosos na nuvem (sem abrir abas no navegador e sem limite de mensagens).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleToggleSetting('autoNotify')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              settings.autoNotify 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : 'bg-dark-800 text-slate-400 border border-dark-750'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${settings.autoNotify ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>Notificações: {settings.autoNotify ? 'Ativadas' : 'Pausadas'}</span>
          </button>
        </div>
      </div>

      {/* Status em Tempo Real da Conexão */}
      <div className={`rounded-2xl border p-5 transition-all bg-dark-900 ${
        isConnected ? 'border-emerald-500/40 shadow-lg shadow-emerald-950/20' : 'border-dark-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-dark-800">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
              isConnected 
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-md' 
                : 'bg-dark-800 text-slate-400 border-dark-750'
            }`}>
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">WhatsApp Pizzaria El Shadday</h3>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Conectado na Nuvem
                  </span>
                ) : isScanning ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold text-xs border border-amber-500/30">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Aguardando Leitura do QR Code
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-dark-800 text-slate-400 font-bold text-xs border border-dark-750">
                    Desconectado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Número Oficial: <strong className="text-emerald-400 font-mono">{session.phoneFormatted || (session.phone ? `+${session.phone}` : '(69) 99222-8682')}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenQrModal}
              className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-dark-950 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <QrCode className="w-4 h-4" />
              <span>{isConnected ? 'Reconectar / QR Code' : 'Conectar WhatsApp (QR Code)'}</span>
            </button>

            {isConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                title="Desconectar WhatsApp"
              >
                <Power className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Banner Explicativo de Comportamento na Cozinha */}
        <div className="pt-4">
          {isConnected ? (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <strong>Modo 100% Silencioso Ativo:</strong> Ao mudar os status dos pedidos na cozinha ("No Forno", "Saiu p/ Entrega", etc.), as mensagens são disparadas direto pela nuvem para o WhatsApp do cliente. <strong>Nenhuma nova guia é aberta no seu navegador.</strong>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3 text-xs text-blue-300">
              <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div>
                <strong>Modo 1-Clique em Espera (Fallback):</strong> Como o motor na nuvem ainda não está conectado, a cozinha abrirá a guia do WhatsApp no clique para você não deixar o cliente sem aviso. Assim que você escanear o QR Code acima, o sistema para de abrir guias e passa a enviar sozinho!
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuração da URL da Nuvem (Render) */}
      <div className="rounded-2xl border border-dark-800 bg-dark-900 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-dark-800">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-sm">Hospedagem na Nuvem (Render Free)</h3>
              <p className="text-[11px] text-slate-400">O motor roda de graça na nuvem do Render e atende a Vercel 24 horas por dia</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowTutorial(!showTutorial)}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showTutorial ? 'Ocultar Tutorial' : 'Como Hospedar no Render (3 min)'}</span>
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <label className="text-slate-400 font-bold block">URL do Serviço no Render ou Local:</label>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              placeholder="Ex: https://el-shadday-whatsapp.onrender.com (ou http://127.0.0.1:5001)"
              value={cloudUrlInput}
              onChange={(e) => setCloudUrlInput(e.target.value)}
              className="flex-1 w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="button"
              disabled={isCheckingStatus}
              onClick={handleSaveCloudUrl}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-200 border border-dark-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isCheckingStatus ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>Salvar e Verificar</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Dica: Se você estiver testando na sua máquina agora, deixe <code>http://127.0.0.1:5001</code>. Quando subir no Render, basta colar o link fornecido pelo Render aqui!
          </p>
        </div>

        {/* Tutorial do Render */}
        {showTutorial && (
          <div className="p-4 rounded-xl bg-dark-950 border border-emerald-500/30 text-xs text-slate-300 space-y-3 animate-in fade-in">
            <div className="font-bold text-emerald-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Passo a Passo para Subir no Render Grátis (100% Pronto):</span>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Já criei o arquivo de configuração <code>render.yaml</code> no projeto. Para colocar o motor no ar:
            </p>

            <ol className="list-decimal list-inside space-y-2 text-[11px] text-slate-300">
              <li>
                Acesse <strong>render.com</strong> e faça login com seu GitHub.
              </li>
              <li>
                Clique no botão <strong>New +</strong> e escolha <strong>Web Service</strong>.
              </li>
              <li>
                Selecione o repositório do projeto: <strong>El_shadday</strong>.
              </li>
              <li>
                O Render preencherá tudo sozinho pelo <code>render.yaml</code>:
                <ul className="list-disc list-inside ml-4 mt-1 text-slate-400">
                  <li>Build Command: <code>npm install</code></li>
                  <li>Start Command: <code>npm run whatsapp</code></li>
                  <li>Instance Type: <strong>Free ($0/month)</strong></li>
                </ul>
              </li>
              <li>
                Clique em <strong>Create Web Service</strong>. Em 2 minutos, o Render vai gerar a sua URL (ex: <code>https://el-shadday-whatsapp.onrender.com</code>).
              </li>
              <li>
                Copie essa URL, cole no campo acima e clique em <strong>Salvar e Verificar</strong>!
              </li>
            </ol>

            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
              ✨ <strong>Sessão Permanente:</strong> Mesmo que o Render reinicie ou atualize, o código já salva as credenciais automaticamente no Supabase para você nunca perder a conexão do WhatsApp!
            </div>
          </div>
        )}
      </div>

      {/* Teste Rápido de Disparo */}
      <div className="rounded-2xl border border-dark-800 bg-dark-900 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Testar Disparo de Mensagem</h3>
          </div>
          <span className="text-[11px] text-slate-400">
            {isConnected ? 'Modo: Nuvem Baileys (100% Silencioso)' : 'Modo: 1-Clique no Navegador'}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Envie uma mensagem de teste para o seu próprio WhatsApp para verificar se a entrega está perfeita.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            placeholder="Seu WhatsApp com DDD (ex: 69992228682)"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            className="flex-1 w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
          />
          <button
            type="button"
            disabled={isSendingTest}
            onClick={handleSendTest}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-dark-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {isSendingTest ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{isSendingTest ? 'Enviando...' : 'Enviar Teste'}</span>
          </button>
        </div>

        {testFeedback && (
          <div className={`p-3 rounded-xl text-xs font-semibold ${
            testFeedback.success 
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
          }`}>
            {testFeedback.msg}
          </div>
        )}
      </div>

      {/* Regras de Notificação Automática */}
      <div className="rounded-2xl border border-dark-800 bg-dark-900 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Eventos com Disparo para o Cliente</h3>
          </div>
          <span className="text-[11px] text-slate-400">Ativado para todos os pedidos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            { key: 'notifyOnReceive', label: 'Ao receber o pedido', desc: 'Confirmação e tempo estimado' },
            { key: 'notifyOnPrep', label: 'Ao entrar no forno', desc: 'Avisa que a pizza começou a assar' },
            { key: 'notifyOnDelivery', label: 'Ao despachar entrega', desc: 'Avisa que o motoboy saiu com endereço' },
            { key: 'notifyOnReadyCounter', label: 'Pronto no balcão', desc: 'Avisa cliente para retirar' },
            { key: 'notifyOnComplete', label: 'Ao concluir entrega', desc: 'Agradecimento e avaliação' },
            { key: 'notifyOnCancel', label: 'Ao cancelar pedido', desc: 'Aviso com motivo informado' },
          ].map((item) => (
            <label 
              key={item.key} 
              className="flex items-start gap-3 p-3 rounded-xl bg-dark-950 border border-dark-800 cursor-pointer hover:border-dark-700 transition-colors"
            >
              <input
                type="checkbox"
                checked={settings[item.key] !== false}
                onChange={() => handleToggleSetting(item.key)}
                className="mt-0.5 rounded text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
              />
              <div>
                <div className="font-bold text-slate-200">{item.label}</div>
                <div className="text-[11px] text-slate-400">{item.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* MODAL: QR CODE REAL DO BAILEYS NA NUVEM */}
      {activeQrModal && (
        <div className="fixed inset-0 z-50 bg-dark-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-dark-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-dark-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Conectar WhatsApp na Nuvem</h3>
                  <p className="text-[11px] text-slate-400">Escaneie o QR Code com o WhatsApp da pizzaria</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveQrModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl shadow-inner min-h-[260px]">
              {qrCodeDataUrl ? (
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code WhatsApp" 
                  className="w-56 h-56 object-contain"
                />
              ) : isConnecting ? (
                <div className="flex flex-col items-center gap-2 text-slate-700 py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                  <span className="text-xs font-bold">Solicitando QR Code do motor...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-700 py-8 text-center px-4">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                  <span className="text-xs font-bold">Conectando ao motor na nuvem...</span>
                  <span className="text-[11px] text-slate-500">
                    Aguarde alguns segundos enquanto o QR Code é gerado.
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 bg-dark-950 p-3.5 rounded-xl border border-dark-800">
              <div className="font-bold text-slate-200 mb-1">Como escanear:</div>
              <div>1. Abra o WhatsApp no celular da pizzaria</div>
              <div>2. Toque em <strong>Aparelhos conectados &gt; Conectar um aparelho</strong></div>
              <div>3. Aponte a câmera para o QR Code acima</div>
              <div className="text-[11px] text-emerald-400 font-semibold pt-1">
                ✨ Assim que ler, esta janela fecha sozinha e a abertura de novas guias é desativada!
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setActiveQrModal(false)}
                className="w-full py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
