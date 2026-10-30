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
  MousePointer,
  HelpCircle,
  Copy
} from 'lucide-react';
import { 
  getAllBranchWhatsApp, 
  getBranchWhatsApp, 
  updateBranchWhatsApp
} from '../../services/whatsappBranchService';
import { 
  getWhatsAppSettings, 
  saveWhatsAppSettings,
  openWhatsAppInstantLink
} from '../../services/whatsappNotificationService';
import { 
  getGreenApiConfig, 
  saveGreenApiConfig, 
  checkGreenApiStatus, 
  getGreenApiQRCode, 
  sendGreenApiMessage,
  syncGreenApiFromCloud
} from '../../services/greenApiService';

export default function WhatsAppManagerView({ 
  currentUser, 
  branches = [], 
  currentBranch 
}) {
  const [sessions, setSessions] = useState(() => getAllBranchWhatsApp());
  const [settings, setSettings] = useState(() => getWhatsAppSettings());
  const [greenConfig, setGreenConfig] = useState(() => getGreenApiConfig());
  const [greenStatus, setGreenStatus] = useState('checking'); // 'authorized' | 'notAuthorized' | 'not_configured' | 'checking'
  const [greenQrDataUrl, setGreenQrDataUrl] = useState(null);
  const [showGreenQrModal, setShowGreenQrModal] = useState(false);
  const [isCheckingGreen, setIsCheckingGreen] = useState(false);
  const [showGreenTutorial, setShowGreenTutorial] = useState(false);

  const [testPhone, setTestPhone] = useState('');
  const [testFeedback, setTestFeedback] = useState(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Sincroniza configurações ao montar
  useEffect(() => {
    syncGreenApiFromCloud().then((cfg) => {
      if (cfg) {
        setGreenConfig(cfg);
        if (cfg.idInstance && cfg.apiTokenInstance) {
          checkGreenApiStatus().then(res => {
            setGreenStatus(res.authorized ? 'authorized' : 'notAuthorized');
          }).catch(() => setGreenStatus('not_configured'));
        } else {
          setGreenStatus('not_configured');
        }
      }
    });

    const handleGreenUpdate = (e) => {
      if (e?.detail) setGreenConfig(e.detail);
    };

    window.addEventListener('el_shadday_green_api_updated', handleGreenUpdate);
    return () => window.removeEventListener('el_shadday_green_api_updated', handleGreenUpdate);
  }, []);

  // Polling de QR Code se modal da Green API estiver aberto
  useEffect(() => {
    if (!showGreenQrModal) return;

    const interval = setInterval(async () => {
      const res = await checkGreenApiStatus();
      if (res.authorized) {
        setGreenStatus('authorized');
        setShowGreenQrModal(false);
        setGreenQrDataUrl(null);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [showGreenQrModal]);

  // Salvar credenciais da Green API
  const handleSaveGreenConfig = async () => {
    setIsCheckingGreen(true);
    setTestFeedback(null);
    try {
      await saveGreenApiConfig(greenConfig);
      const res = await checkGreenApiStatus();
      if (res.authorized) {
        setGreenStatus('authorized');
        setTestFeedback({ success: true, msg: '✅ Green API Conectada com Sucesso! Disparos 100% silenciosos ativos.' });
      } else {
        setGreenStatus('notAuthorized');
        setTestFeedback({ success: false, msg: '⚠️ Credenciais salvas, mas a instância ainda não está conectada ao WhatsApp. Clique em "Escanear QR Code".' });
      }
    } catch (err) {
      setTestFeedback({ success: false, msg: `Erro ao testar Green API: ${err.message}` });
    } finally {
      setIsCheckingGreen(false);
      setTimeout(() => setTestFeedback(null), 7000);
    }
  };

  // Abrir Modal de QR Code da Green API
  const handleOpenGreenQrModal = async () => {
    if (!greenConfig.idInstance || !greenConfig.apiTokenInstance) {
      alert('Preencha o ID da Instância e o Token da Green API primeiro.');
      return;
    }

    setIsCheckingGreen(true);
    setShowGreenQrModal(true);
    setGreenQrDataUrl(null);

    try {
      const res = await getGreenApiQRCode();
      if (res.alreadyLogged) {
        setGreenStatus('authorized');
        setShowGreenQrModal(false);
        alert('Este WhatsApp já está autenticado e conectado na Green API!');
      } else if (res.qrCodeDataUrl) {
        setGreenQrDataUrl(res.qrCodeDataUrl);
      } else {
        alert(res.error || 'Não foi possível carregar o QR Code.');
      }
    } catch (err) {
      console.warn('Erro ao carregar QR Code:', err);
    } finally {
      setIsCheckingGreen(false);
    }
  };

  // Envio de Mensagem de Teste (usa Green API se configurada, senão usa Opção 2 link direto)
  const handleSendTestMessage = async () => {
    if (!testPhone || testPhone.replace(/\D/g, '').length < 8) {
      setTestFeedback({ success: false, msg: 'Digite um número de telefone com DDD (ex: 69992228682)' });
      return;
    }

    setIsSendingTest(true);
    setTestFeedback(null);

    const clean = testPhone.replace(/\D/g, '');
    const testMsg = `🍕 *TESTE DE NOTIFICAÇÃO - EL SHADDAY DELIVERY*\n📍 *Unidade Ariquemes*\n\nTeste realizado com sucesso! Suas notificações de pedidos (No Forno, Saiu para Entrega, Balcão) estão configuradas e prontas. ✅`;

    try {
      if (greenStatus === 'authorized') {
        const res = await sendGreenApiMessage({ phone: clean, message: testMsg });
        if (res.success) {
          setTestFeedback({ success: true, msg: `✅ Mensagem enviada silenciosamente via Green API para +${clean}!` });
        } else {
          setTestFeedback({ success: false, msg: `⚠️ Falha no envio pela Green API: ${res.error}` });
        }
      } else {
        // Opção 2: Abre no clique
        const url = `https://wa.me/55${clean}?text=${encodeURIComponent(testMsg)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        setTestFeedback({ success: true, msg: `✅ WhatsApp Web aberto com a mensagem de teste para +${clean}!` });
      }
    } catch (err) {
      setTestFeedback({ success: false, msg: `Erro ao enviar teste: ${err.message}` });
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setTestFeedback(null), 8000);
    }
  };

  // Alternar regras de disparo
  const handleToggleSetting = (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    saveWhatsAppSettings(next);
  };

  const isGreenActive = greenStatus === 'authorized' && greenConfig.enabled;

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
              <h2 className="text-lg font-bold text-white">Central de WhatsApp</h2>
              {isGreenActive ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Opção 1 Ativa: Nuvem Silenciosa (Green API)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Opção 2 Ativa: Disparo Imediato no Clique (Nativo)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Notifique seus clientes automaticamente quando o pedido entrar no forno, for despachado para entrega ou ficar pronto no balcão.
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

      {/* Grid: Opção 1 e Opção 2 Lado a Lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* CARD: OPÇÃO 2 - Disparo no Clique (Nativo / Ativo Agora) */}
        <div className="rounded-2xl border border-dark-800 bg-dark-900 p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-dark-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-black text-[11px]">
                  OPÇÃO 2
                </span>
                <h3 className="font-bold text-white text-sm">Disparo Imediato no Clique</h3>
              </div>
              <p className="text-[11px] text-slate-400">
                100% Nativo na Vercel • Sem contas extras • Sem bloqueio no Brave
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <MousePointer className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-950 border border-dark-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Já está ativo e funcionando na cozinha!</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Ao clicar em <strong>[Mover p/ Forno]</strong> ou <strong>[Despachar Entrega]</strong> no KDS, o sistema abre o WhatsApp no exato instante do clique com a mensagem pronta. Como o disparo é síncrono, o navegador <strong>nunca bloqueia</strong>.
            </p>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-dark-950 border border-dark-800 cursor-pointer hover:border-dark-700 transition-colors">
              <input
                type="checkbox"
                checked={settings.notifyOnClick !== false}
                onChange={() => handleToggleSetting('notifyOnClick')}
                className="rounded text-blue-500 focus:ring-0 cursor-pointer accent-blue-500"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-200">Abrir WhatsApp com mensagem pronta no clique</div>
                <div className="text-[11px] text-slate-400">Se desmarcar, não abrirá abas ao alterar o status</div>
              </div>
            </label>
          </div>
        </div>

        {/* CARD: OPÇÃO 1 - Green API (Nuvem 100% Silenciosa) */}
        <div className="rounded-2xl border border-dark-800 bg-dark-900 p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-dark-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-black text-[11px]">
                  OPÇÃO 1
                </span>
                <h3 className="font-bold text-white text-sm">WhatsApp na Nuvem (Green API)</h3>
              </div>
              <p className="text-[11px] text-slate-400">
                100% Silencioso • Não abre abas • Roda 24h na nuvem
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
          </div>

          {/* Status da Conexão */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-dark-950 border border-dark-800 text-xs">
            <span className="text-slate-400">Status na Nuvem:</span>
            {greenStatus === 'authorized' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Conectado e Ativo
              </span>
            ) : greenStatus === 'notAuthorized' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Aguardando QR Code
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-dark-800 text-slate-400 font-bold border border-dark-750">
                Não configurado
              </span>
            )}
          </div>

          {/* Campos de Configuração */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">ID da Instância (idInstance):</label>
              <input
                type="text"
                placeholder="Ex: 1101234567"
                value={greenConfig.idInstance || ''}
                onChange={(e) => setGreenConfig(prev => ({ ...prev, idInstance: e.target.value.trim() }))}
                className="w-full px-3.5 py-2 rounded-xl bg-dark-950 border border-dark-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Token da Instância (apiTokenInstance):</label>
              <input
                type="password"
                placeholder="Ex: ab12cd34ef56gh78..."
                value={greenConfig.apiTokenInstance || ''}
                onChange={(e) => setGreenConfig(prev => ({ ...prev, apiTokenInstance: e.target.value.trim() }))}
                className="w-full px-3.5 py-2 rounded-xl bg-dark-950 border border-dark-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={isCheckingGreen}
              onClick={handleSaveGreenConfig}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-dark-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {isCheckingGreen ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Salvar e Conectar</span>
            </button>

            <button
              type="button"
              onClick={handleOpenGreenQrModal}
              className="py-2 px-3 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-200 border border-dark-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Escanear QR Code da Green API"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>QR Code</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGreenTutorial(!showGreenTutorial)}
              className="p-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white border border-dark-750 cursor-pointer"
              title="Como pegar sua chave gratuita na Green API"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Tutorial Colapsável da Green API */}
          {showGreenTutorial && (
            <div className="p-3.5 rounded-xl bg-dark-950 border border-emerald-500/30 text-xs text-slate-300 space-y-2 animate-in fade-in">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Como pegar o Token Grátis na Green API:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                <li>Acesse <strong>green-api.com</strong> e crie uma conta gratuita.</li>
                <li>No painel deles, clique em <strong>Create Instance</strong> (Plano Developer gratuito).</li>
                <li>Copie o <strong>idInstance</strong> e o <strong>apiTokenInstance</strong> e cole nos campos acima.</li>
                <li>Clique em <strong>"QR Code"</strong> e aponte a câmera do WhatsApp da pizzaria!</li>
              </ol>
            </div>
          )}
        </div>

      </div>

      {/* Teste Rápido de Disparo */}
      <div className="rounded-2xl border border-dark-800 bg-dark-900 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Testar Disparo de Mensagem</h3>
          </div>
          <span className="text-[11px] text-slate-400">
            {isGreenActive ? 'Modo: Nuvem Silenciosa (Green API)' : 'Modo: Disparo no Clique (Nativo)'}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Envie uma mensagem de teste para o seu próprio WhatsApp para verificar se a formatação e o envio estão perfeitos.
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
            onClick={handleSendTestMessage}
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

      {/* MODAL: QR CODE DA GREEN API */}
      {showGreenQrModal && (
        <div className="fixed inset-0 z-50 bg-dark-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-dark-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-dark-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Escanear QR Code da Green API</h3>
                  <p className="text-[11px] text-slate-400">Conecte o WhatsApp da pizzaria na nuvem</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGreenQrModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl shadow-inner min-h-[260px]">
              {greenQrDataUrl ? (
                <img 
                  src={greenQrDataUrl} 
                  alt="QR Code Green API" 
                  className="w-56 h-56 object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-700 py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                  <span className="text-xs font-bold">Gerando QR Code na Green API...</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 bg-dark-950 p-3.5 rounded-xl border border-dark-800">
              <div className="font-bold text-slate-200 mb-1">Como escanear:</div>
              <div>1. Abra o WhatsApp no celular da pizzaria</div>
              <div>2. Vá em <strong>Aparelhos conectados &gt; Conectar um aparelho</strong></div>
              <div>3. Aponte a câmera para o QR Code acima</div>
              <div className="text-[11px] text-emerald-400 font-semibold pt-1">
                ✨ Assim que ler, a conexão fica ativa 24h na nuvem!
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowGreenQrModal(false)}
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
