import React, { useState, useRef } from 'react';
import { 
  UploadCloud, Link as LinkIcon, Image as ImageIcon, 
  Trash2, Sparkles, CheckCircle2, AlertCircle, RefreshCw 
} from 'lucide-react';
import { compressImageFile, formatBytes } from '../utils/imageCompressor';

export function ImageUploader({
  value = '',
  onChange,
  label = 'Foto do Produto',
  description = 'Envie uma foto do seu dispositivo ou informe uma URL externa.',
  placeholder = 'https://...',
  className = ''
}) {
  const isDataUrl = value && value.startsWith('data:');
  const [activeTab, setActiveTab] = useState(isDataUrl ? 'upload' : (value.startsWith('http') ? 'url' : 'upload'));
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressInfo, setCompressInfo] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [imageError, setImageError] = useState(false);

  const fileInputRef = useRef(null);

  const handleProcessFile = async (file) => {
    if (!file) return;
    setErrorMessage('');
    setImageError(false);
    setIsCompressing(true);

    try {
      const result = await compressImageFile(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.75,
        mimeType: 'image/webp'
      });

      setCompressInfo({
        original: result.originalSizeFormatted,
        optimized: result.sizeFormatted,
        reduction: result.reductionPercent,
        dimensions: `${result.width}x${result.height}px`
      });

      onChange(result.dataUrl);
    } catch (err) {
      console.error('Erro na compressão:', err);
      setErrorMessage(err.message || 'Erro ao processar imagem.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    // Limpa o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemoveImage = () => {
    onChange('');
    setCompressInfo(null);
    setErrorMessage('');
    setImageError(false);
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Header com Label e Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div>
          <label className="block text-xs font-bold text-slate-200">
            {label}
          </label>
          {description && (
            <p className="text-[11px] text-slate-400">
              {description}
            </p>
          )}
        </div>

        {/* Alternador de Modo: Dispositivo vs URL */}
        <div className="flex items-center gap-1 bg-dark-950 p-1 rounded-xl border border-dark-750 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              setErrorMessage('');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-brand-gold text-dark-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Do Dispositivo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('url');
              setErrorMessage('');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'bg-brand-gold text-dark-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Link / URL</span>
          </button>
        </div>
      </div>

      {/* ÁREA 1: ENVIAR DO DISPOSITIVO (COM COMPRESSÃO AUTOMÁTICA) */}
      {activeTab === 'upload' && (
        <div className="space-y-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/png,image/jpeg,image/webp,image/jpg"
            className="hidden"
          />

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isCompressing && fileInputRef.current?.click()}
            className={`p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center select-none flex flex-col items-center justify-center gap-2 ${
              isDragOver
                ? 'border-brand-gold bg-brand-gold/10'
                : 'border-dark-750 hover:border-brand-gold/60 bg-dark-850 hover:bg-dark-800'
            }`}
          >
            {isCompressing ? (
              <div className="py-2 flex flex-col items-center gap-2 text-brand-gold">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="text-xs font-bold">Otimizando e comprimindo imagem...</span>
                <span className="text-[10px] text-slate-400">Reduzindo tamanho sem perder qualidade</span>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center border border-brand-gold/30">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    Clique para selecionar do computador/celular
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    ou arraste e solte o arquivo aqui (JPG, PNG ou WEBP)
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Otimização Ultra-Leve Automática para o Banco de Dados</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ÁREA 2: URL / LINK DA WEB */}
      {activeTab === 'url' && (
        <div className="space-y-1.5">
          <div className="relative">
            <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={value.startsWith('data:') ? '' : value}
              onChange={(e) => {
                setImageError(false);
                setCompressInfo(null);
                onChange(e.target.value.trim());
              }}
              placeholder={placeholder}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-dark-850 border border-dark-750 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-brand-gold"
            />
          </div>
          <span className="text-[10px] text-slate-500 block">
            Cole aqui o link direto de uma imagem da internet (ex: Imgur, Unsplash, Google Fotos direto).
          </span>
        </div>
      )}

      {/* MENSAGEM DE ERRO (SE HOUVER) */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* PRÉVIA DA IMAGEM E ESTATÍSTICAS DE COMPRESSÃO */}
      {value && (
        <div className="p-3 rounded-2xl bg-dark-950 border border-dark-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-dark-900 overflow-hidden flex-shrink-0 border border-dark-750 relative">
              <img
                src={value}
                alt="Prévia"
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
              {imageError && (
                <div className="absolute inset-0 bg-dark-950/90 flex items-center justify-center text-rose-400 text-[10px] text-center p-1">
                  Erro ao carregar
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white truncate">
                  Imagem pronta para o site
                </span>
                {value.startsWith('data:') ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    Otimizada (WebP)
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                    URL Externa
                  </span>
                )}
              </div>

              {compressInfo ? (
                <div className="text-[11px] text-emerald-400 mt-0.5 flex flex-wrap items-center gap-x-2">
                  <span><strong>{compressInfo.optimized}</strong> ({compressInfo.reduction}% mais leve)</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{compressInfo.dimensions}</span>
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                  {value.startsWith('data:') ? 'Foto comprimida e salva localmente' : value}
                </span>
              )}
            </div>
          </div>

          {/* Botões de Ação na Prévia */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {activeTab === 'upload' && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-dark-750 transition-colors cursor-pointer"
                title="Trocar por outra foto"
              >
                <RefreshCw className="w-4 h-4 text-brand-gold" />
              </button>
            )}

            <button
              type="button"
              onClick={handleRemoveImage}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
              title="Remover imagem"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
