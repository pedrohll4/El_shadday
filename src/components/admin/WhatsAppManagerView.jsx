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
  ChevronUp
} from 'lucide-react';
import { 
  getAllBranchWhatsApp, 
  getBranchWhatsApp, 
  connectBranchWhatsApp, 
  disconnectBranchWhatsApp, 
  generateBranchQRCodeData,
  updateBranchWhatsApp 
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
  const [qrCodeData, setQrCodeData] = useState(null);
  const [inputPhone, setInputPhone] = useState('');
  const [inputSessionName, setInputSessionName] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testFeedback, setTestFeedback] = useState(null);
  const [showAdvancedApi, setShowAdvancedApi] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [customApiToken, setCustomApiToken] = useState('');

  // Sincroniza sessões caso ocorram mudanças externas
  useEffect(() => {
    const handleSync = (e) => {
      if (e?.detail) setSessions(e.detail);
      else setSessions(getAllBranchWhatsApp());
    };
    window.addEventListener('el_shadday_whatsapp_session_updated', handleSync);
    return () => window.removeEventListener('el_shadday_whatsapp_session_updated', handleSync);
  }, []);

  // Lista de filiais a exibir:
  // Se for SUPER_ADMIN (Master): exibe TODAS as filiais lado a lado
  // Se for BRANCH_ADMIN: exibe a filial logada com destaque, e visão resumida das demais
  const displayedBranches = (currentUser?.role === 'SUPER_ADMIN' || !currentUser?.branchId)
    ? branches
    : branches.filter(b => b.id === currentUser.branchId || b.id === currentBranch?.id);

  // Abrir Modal de QR Code para uma filial
  const handleOpenConnectModal = (branchId) => {
    const qr = generateBranchQRCodeData(branchId);
    setQrCodeData(qr);
    setActiveQrModalBranch(branchId);
    const existing = sessions[branchId] || {};
    setInputPhone(existing.phoneFormatted || existing.phone || '');
    setInputSessionName(existing.sessionName || `WhatsApp ${branchId === 'porto-velho' ? 'Porto Velho' : 'Ariquemes'}`);
    setCustomApiUrl(existing.apiUrl || '');
    setCustomApiToken(existing.apiToken || '');
  };

  // Gerar novo QR Code
  const handleRefreshQr = () => {
    if (activeQrModalBranch) {
      const qr = generateBranchQRCodeData(activeQrModalBranch);
      setQrCodeData(qr);
    }
  };

  // Confirmar conexão do WhatsApp
  const handleConfirmConnection = (branchId) => {
    const phoneToUse = inputPhone || (branchId === 'porto-velho' ? '(69) 99222-8682' : '(69) 99222-8682');
    connectBranchWhatsApp(branchId, {
      phone: phoneToUse,
      phoneFormatted: phoneToUse,
      sessionName: inputSessionName,
      apiUrl: customApiUrl,
      apiToken: customApiToken
    });
    setSessions(getAllBranchWhatsApp());
    setActiveQrModalBranch(null);
  };

  // Desconectar WhatsApp
  const handleDisconnect = (branchId) => {
    if (window.confirm(`Tem certeza que deseja desconectar o WhatsApp da filial ${branchId === 'porto-velho' ? 'Porto Velho' : 'Ariquemes'}?`)) {
      disconnectBranchWhatsApp(branchId);
      setSessions(getAllBranchWhatsApp());
    }
  };

  // Envio de mensagem de teste
  const handleSendTestMessage = (branchId) => {
    if (!testPhone) {
      setTestFeedback({ success: false, msg: 'Digite um número de telefone com DDD' });
      return;
    }
    const clean = testPhone.replace(/\D/g, '');
    const session = sessions[branchId] || {};
    const text = encodeURIComponent(
      `🍕 *TESTE DE CONEXÃO - EL SHADDAY DELIVERY*\n📍 *${branchId === 'porto-velho' ? 'Unidade Porto Velho' : 'Unidade Ariquemes'}*\n\nConexão com WhatsApp realizada com sucesso! As notificações de pedidos serão disparadas por este número. ✅`
    );
    const url = `https://wa.me/55${clean}?text=${text}`;
    window.open(url, '_blank');
    setTestFeedback({ success: true, msg: `✅ WhatsApp aberto para teste com ${testPhone}!` });
    setTimeout(() => setTestFeedback(null), 4000);
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
            <h2 className="text-lg font-bold text-white">Conexões de WhatsApp</h2>
            <p className="text-xs text-slate-400">
              Conecte um WhatsApp independente para cada filial via QR Code para disparar atualizações automáticas aos clientes.
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
          const isConnected = session.status === 'connected';

          return (
            <div 
              key={branch.id}
              className={`rounded-2xl border p-5 transition-all bg-dark-900 ${
                isConnected ? 'border-emerald-500/40' : 'border-dark-800'
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
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-dark-800 text-slate-400 font-semibold border border-dark-750">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        Desconectado
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-10 h-10 rounded-xl bg-dark-800 border border-dark-750 flex items-center justify-center text-slate-400">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              {/* Detalhes da Conexão */}
              <div className="py-4 space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-dark-950 border border-dark-800">
                  <span className="text-slate-400">Número Oficial:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {session.phoneFormatted || branch.phoneFormatted || '(69) 99222-8682'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-dark-950 border border-dark-800 flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="text-slate-400">Sessão:</div>
                      <div className="font-bold text-slate-200 truncate">{session.sessionName || branch.name}</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-dark-950 border border-dark-800 flex items-center gap-2">
                    <Battery className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="text-slate-400">Status Celular:</div>
                      <div className="font-bold text-slate-200">{isConnected ? `${session.batteryLevel || 95}% • Online` : 'Offline'}</div>
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
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-white">Testar Disparo de Mensagem</h3>
        </div>
        <p className="text-xs text-slate-400">
          Envie uma mensagem de teste para o seu próprio WhatsApp para verificar se as notificações estão chegando perfeitamente.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            placeholder="Seu WhatsApp (ex: 69992228682)"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            className="flex-1 w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => handleSendTestMessage(displayedBranches[0]?.id || 'ariquemes')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-200 border border-dark-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>Enviar Teste</span>
          </button>
        </div>

        {testFeedback && (
          <div className={`p-2.5 rounded-xl text-xs font-semibold ${
            testFeedback.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400'
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            { key: 'notifyOnReceive', label: 'Ao receber o pedido', desc: 'Confirmação e tempo estimado' },
            { key: 'notifyOnPrep', label: 'Ao entrar no forno', desc: 'Avisa que a pizza começou a assar' },
            { key: 'notifyOnDelivery', label: 'Ao despachar entrega', desc: 'Avisa que o motoboy saiu' },
            { key: 'notifyOnReadyCounter', label: 'Pronto no balcão', desc: 'Para retirada no local' },
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

      {/* MODAL: QR CODE PARA ESCANEAR WHATSAPP */}
      {activeQrModalBranch && (
        <div className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-dark-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-dark-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Conectar WhatsApp • {activeQrModalBranch === 'porto-velho' ? 'Porto Velho' : 'Ariquemes'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Escaneie o QR Code abaixo com seu celular</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveQrModalBranch(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl shadow-inner">
              {qrCodeData?.qrUrl ? (
                <img 
                  src={qrCodeData.qrUrl} 
                  alt="QR Code WhatsApp" 
                  className="w-52 h-52 object-contain"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-slate-500">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
              )}
              <div className="mt-3 flex items-center gap-2 text-dark-950 text-xs font-bold">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                <span>Atualiza a cada 60s</span>
                <button
                  type="button"
                  onClick={handleRefreshQr}
                  className="ml-2 text-[11px] underline text-emerald-700 hover:text-emerald-900 cursor-pointer"
                >
                  Recarregar
                </button>
              </div>
            </div>

            {/* Passo a Passo */}
            <div className="space-y-1.5 text-xs text-slate-300 bg-dark-950 p-3.5 rounded-xl border border-dark-800">
              <div className="font-bold text-slate-200 mb-1">Como conectar:</div>
              <div>1. Abra o WhatsApp no celular da filial</div>
              <div>2. Toque em <strong>Mais opções</strong> (Android) ou <strong>Configurações</strong> (iPhone)</div>
              <div>3. Toque em <strong>Aparelhos conectados</strong> &gt; <strong>Conectar um aparelho</strong></div>
              <div>4. Aponte a câmera para o QR Code acima</div>
            </div>

            {/* Configuração de Número */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Número Conectado (DDD + Telefone):</label>
              <input
                type="text"
                value={inputPhone}
                onChange={(e) => setInputPhone(e.target.value)}
                placeholder="(69) 99222-8682"
                className="w-full px-3.5 py-2 rounded-xl bg-dark-950 border border-dark-800 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveQrModalBranch(null)}
                className="flex-1 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleConfirmConnection(activeQrModalBranch)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-dark-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Conexão</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
