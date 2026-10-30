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
  Zap
} from 'lucide-react';
import { 
  getAllBranchWhatsApp, 
  getBranchWhatsApp, 
  connectBranchWhatsApp, 
  disconnectBranchWhatsApp, 
  updateBranchWhatsApp,
  fetchEngineStatus,
  requestEngineConnect,
  sendEngineDirectMessage
} from '../../services/whatsappBranchService';
import { getWhatsAppSettings, saveWhatsAppSettings } from '../../services/whatsappNotificationService';

export default function WhatsAppManagerView({ 
  currentUser, 
  branches = [], 
  currentBranch 
}) {
  const [sessions, setSessions] = useState(() => getAllBranchWhatsApp());
  const [settings, setSettings] = useState(() => getWhatsAppSettings());
  const [activeQrModalBranch, setActiveQrModalBranch] = useState(null);
  const [testPhone, setTestPhone] = useState('');
  const [testFeedback, setTestFeedback] = useState(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isConnectingEngine, setIsConnectingEngine] = useState(false);

  // Carrega status inicial do motor e configura sincronização
  useEffect(() => {
    fetchEngineStatus('ariquemes').catch(() => {});

    const handleSync = (e) => {
      if (e?.detail) {
        setSessions(prev => ({
          ...prev,
          [e.detail.branchId || 'ariquemes']: {
            ...prev[e.detail.branchId || 'ariquemes'],
            ...e.detail
          }
        }));
      } else {
        setSessions(getAllBranchWhatsApp());
      }
    };

    const handleEngineUpdate = (e) => {
      if (e?.detail) {
        setSessions(getAllBranchWhatsApp());
        if (e.detail.status === 'CONNECTED' || e.detail.status === 'connected') {
          setActiveQrModalBranch(null);
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

  // Polling a cada 2.5s se modal de QR Code estiver aberto
  useEffect(() => {
    if (!activeQrModalBranch) return;

    const interval = setInterval(() => {
      fetchEngineStatus(activeQrModalBranch).then((data) => {
        if (data?.status === 'CONNECTED' || data?.status === 'connected') {
          setActiveQrModalBranch(null);
        }
      }).catch(() => {});
    }, 2500);

    return () => clearInterval(interval);
  }, [activeQrModalBranch]);

  // Lista de filiais a exibir
  const displayedBranches = (currentUser?.role === 'SUPER_ADMIN' || !currentUser?.branchId)
    ? branches
    : branches.filter(b => b.id === currentUser.branchId || b.id === currentBranch?.id);

  // Abrir Modal de QR Code para uma filial
  const handleOpenConnectModal = async (branchId) => {
    setActiveQrModalBranch(branchId);
    setIsConnectingEngine(true);
    try {
      await requestEngineConnect(branchId);
      await fetchEngineStatus(branchId);
    } catch (err) {
      console.warn('Erro ao requisitar conexão:', err);
    } finally {
      setIsConnectingEngine(false);
    }
  };

  // Gerar / atualizar QR Code
  const handleRefreshQr = async () => {
    if (activeQrModalBranch) {
      setIsConnectingEngine(true);
      try {
        await requestEngineConnect(activeQrModalBranch);
        await fetchEngineStatus(activeQrModalBranch);
      } finally {
        setIsConnectingEngine(false);
      }
    }
  };

  // Desconectar WhatsApp
  const handleDisconnect = async (branchId) => {
    const branchName = branchId === 'porto-velho' ? 'Porto Velho' : 'Ariquemes';
    if (window.confirm(`Tem certeza que deseja desconectar o WhatsApp da filial ${branchName}? Será necessário escanear o QR Code novamente para reconectar.`)) {
      disconnectBranchWhatsApp(branchId);
      setSessions(getAllBranchWhatsApp());
    }
  };

  // Envio de mensagem de teste silenciosa
  const handleSendTestMessage = async (branchId) => {
    if (!testPhone || testPhone.replace(/\D/g, '').length < 8) {
      setTestFeedback({ success: false, msg: 'Digite um número de telefone com DDD (ex: 69992228682)' });
      return;
    }

    setIsSendingTest(true);
    setTestFeedback(null);

    const clean = testPhone.replace(/\D/g, '');
    const session = sessions[branchId] || {};
    const testMsg = `🍕 *TESTE DE CONEXÃO - EL SHADDAY DELIVERY*\n📍 *${branchId === 'porto-velho' ? 'Unidade Porto Velho' : 'Unidade Ariquemes'}*\n\nConexão com WhatsApp realizada com sucesso! As notificações de pedidos (No Forno, Saiu para Entrega, Pronto no Balcão) serão disparadas silenciosamente por este número. ✅`;

    try {
      const result = await sendEngineDirectMessage({
        phone: clean,
        message: testMsg
      });

      if (result.success) {
        setTestFeedback({
          success: true,
          msg: `✅ Mensagem enviada com sucesso no WhatsApp de +${clean}! Verifique o aplicativo.`
        });
      } else {
        setTestFeedback({
          success: false,
          msg: `⚠️ Falha: ${result.error || 'WhatsApp não conectado. Inicie o motor e escaneie o QR Code.'}`
        });
      }
    } catch (err) {
      setTestFeedback({
        success: false,
        msg: `⚠️ Erro de conexão com o motor: ${err.message}`
      });
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setTestFeedback(null), 8000);
    }
  };

  // Salvar opções de disparo
  const handleToggleAutoNotify = (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    saveWhatsAppSettings(next);
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
              <h2 className="text-lg font-bold text-white">Conexões de WhatsApp</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                100% Gratuito (Baileys)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Disparos 100% automáticos e silenciosos para os clientes a cada mudança de status do pedido na cozinha.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleToggleAutoNotify('autoNotify')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              settings.autoNotify 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : 'bg-dark-800 text-slate-400 border border-dark-750'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${settings.autoNotify ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>Disparos Automáticos: {settings.autoNotify ? 'Ativados' : 'Pausados'}</span>
          </button>
        </div>
      </div>

      {/* Grid de Filiais: Ariquemes e Porto Velho */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedBranches.map((branch) => {
          const session = sessions[branch.id] || getBranchWhatsApp(branch.id);
          const isConnected = session.status === 'connected' || session.status === 'CONNECTED';
          const isScanning = session.status === 'scan_qr' || session.status === 'SCAN_QR';

          return (
            <div 
              key={branch.id}
              className={`rounded-2xl border p-5 transition-all bg-dark-900 ${
                isConnected ? 'border-emerald-500/40 shadow-lg shadow-emerald-950/20' : 'border-dark-800'
              }`}
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-dark-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{branch.name}</span>
                    <span className="text-[11px] font-medium text-slate-400">({branch.displayName})</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {isConnected ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        WhatsApp Conectado
                      </span>
                    ) : isScanning ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Aguardando Leitura do QR Code
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-dark-800 text-slate-400 font-semibold border border-dark-750">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        Desconectado
                      </span>
                    )}
                  </div>
                </div>

                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                  isConnected 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-dark-800 border-dark-750 text-slate-400'
                }`}>
                  <Smartphone className="w-5 h-5" />
                </div>
              </div>

              {/* Detalhes da Conexão */}
              <div className="py-4 space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-dark-950 border border-dark-800">
                  <span className="text-slate-400">Número Oficial:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {session.phoneFormatted || (session.phone ? `+${session.phone}` : branch.phoneFormatted || '(69) 99222-8682')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-dark-950 border border-dark-800 flex items-center gap-2">
                    <Wifi className={`w-4 h-4 flex-shrink-0 ${isConnected ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <div className="text-slate-400">Motor:</div>
                      <div className="font-bold text-slate-200 truncate">
                        {isConnected ? 'Baileys Socket Ativo' : 'Aguardando Início'}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-dark-950 border border-dark-800 flex items-center gap-2">
                    <Battery className={`w-4 h-4 flex-shrink-0 ${isConnected ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="text-slate-400">Status Celular:</div>
                      <div className="font-bold text-slate-200">
                        {isConnected ? `${session.batteryLevel || 95}% • Online` : 'Offline'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenConnectModal(branch.id)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-dark-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{isConnected ? 'Reconectar / QR Code' : 'Conectar WhatsApp'}</span>
                </button>

                {isConnected && (
                  <button
                    type="button"
                    onClick={() => handleDisconnect(branch.id)}
                    className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                    title="Desconectar este WhatsApp"
                  >
                    <Power className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Teste Rápido de Envio */}
      <div className="rounded-2xl border border-dark-800 bg-dark-900 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Testar Disparo de Mensagem</h3>
          </div>
          <span className="text-[11px] text-slate-400">Envio 100% Silencioso em Segundo Plano</span>
        </div>
        <p className="text-xs text-slate-400">
          Envie uma mensagem de teste para o seu próprio WhatsApp para verificar se o motor silencioso está entregando perfeitamente.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            placeholder="Seu WhatsApp com DDD (ex: 69992228682)"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            className="flex-1 w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            disabled={isSendingTest}
            onClick={() => handleSendTestMessage(displayedBranches[0]?.id || 'ariquemes')}
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
            <h3 className="font-bold text-sm text-white">Eventos com Disparo Automático para o Cliente</h3>
          </div>
          <span className="text-[11px] text-slate-400">Sem abrir abas • 100% no fundo</span>
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
                onChange={() => handleToggleAutoNotify(item.key)}
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

      {/* MODAL: QR CODE REAL PARA ESCANEAR WHATSAPP */}
      {activeQrModalBranch && (
        <div className="fixed inset-0 z-50 bg-dark-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-dark-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-dark-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Conectar WhatsApp Oficial
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {activeQrModalBranch === 'porto-velho' ? 'Unidade Porto Velho' : 'Unidade Ariquemes (Matriz)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveQrModalBranch(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl shadow-inner min-h-[260px]">
              {sessions[activeQrModalBranch]?.qrCodeDataUrl ? (
                <img 
                  src={sessions[activeQrModalBranch].qrCodeDataUrl} 
                  alt="QR Code WhatsApp" 
                  className="w-56 h-56 object-contain"
                />
              ) : isConnectingEngine ? (
                <div className="flex flex-col items-center gap-2 text-slate-700 py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                  <span className="text-xs font-bold">Iniciando motor e gerando QR Code...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-700 py-8 text-center px-4">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                  <span className="text-xs font-bold">Aguardando QR Code do motor...</span>
                  <span className="text-[11px] text-slate-500">
                    Certifique-se de que o motor está rodando via <code>npm run whatsapp</code>.
                  </span>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2 text-dark-950 text-xs font-bold">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                <span>Atualização em tempo real</span>
                <button
                  type="button"
                  onClick={handleRefreshQr}
                  className="ml-2 text-[11px] underline text-emerald-700 hover:text-emerald-900 cursor-pointer"
                >
                  Recarregar QR
                </button>
              </div>
            </div>

            {/* Passo a Passo */}
            <div className="space-y-1.5 text-xs text-slate-300 bg-dark-950 p-3.5 rounded-xl border border-dark-800">
              <div className="font-bold text-slate-200 mb-1">Como conectar o WhatsApp da pizzaria:</div>
              <div>1. Abra o WhatsApp no celular da pizzaria</div>
              <div>2. Toque nos <strong>três pontinhos</strong> (Android) ou em <strong>Configurações</strong> (iPhone)</div>
              <div>3. Toque em <strong>Aparelhos conectados</strong> &gt; <strong>Conectar um aparelho</strong></div>
              <div>4. Aponte a câmera para o QR Code acima</div>
              <div className="text-[11px] text-emerald-400 font-semibold pt-1">
                ✨ Assim que ler, esta janela fecha sozinha e a conexão fica ativa permanentemente!
              </div>
            </div>

            {/* Botão de Fechar */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setActiveQrModalBranch(null)}
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
