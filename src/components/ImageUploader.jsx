import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, Link as LinkIcon, Image as ImageIcon, Video as VideoIcon,
  Trash2, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Play, Film
} from 'lucide-react';
import { 
  compressImageFile, 
  processVideoFile, 
  isVideoUrl, 
  getEmbedVideoUrl, 
  getVideoPosterUrl,
  formatBytes 
} from '../utils/imageCompressor';
import { uploadMediaToSupabaseStorage } from '../services/storageService';

export function ImageUploader({
  value = '',
  onChange,
  label = 'Foto / Mídia',
  description = 'Envie uma foto ou vídeo do seu dispositivo ou informe uma URL externa.',
  placeholder = 'https://...',
  acceptVideo = true,
  className = ''
}) {
  const isVideo = isVideoUrl(value);
  const isDataUrl = value && (value.startsWith('data:image/') || value.startsWith('data:video/'));
  
  const [activeTab, setActiveTab] = useState(isDataUrl ? 'upload' : (value.startsWith('http') ? 'url' : 'upload'));
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [mediaInfo, setMediaInfo] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadError, setLoadError] = useState(false);

  const fileInputRef = useRef(null);

  // Detect embed URL if YouTube/Vimeo
  const embedUrl = isVideo ? getEmbedVideoUrl(value) : null;
  const youtubePoster = isVideo ? getVideoPosterUrl(value) : null;

  const handleProcessFile = async (file) => {
    if (!file) return;
    setErrorMessage('');
    setLoadError(false);
    setIsProcessing(true);

    try {
      if (file.type.startsWith('video/')) {
        if (!acceptVideo) {
          throw new Error('Apenas imagens são aceitas neste campo.');
        }

        setProcessingStatus('Processando e gerando prévia do vídeo...');
        const result = await processVideoFile(file, { maxSizeBytes: 30 * 1024 * 1024 });

        // Tenta hospedar no Supabase Storage para transmissão rápida em todos os celulares
        setProcessingStatus('Enviando para a nuvem...');
        const storageUrl = await uploadMediaToSupabaseStorage(file, 'videos');
        const finalUrl = storageUrl || result.dataUrl;

        setMediaInfo({
          type: 'video',
          size: result.sizeFormatted,
          dimensions: storageUrl ? 'Hospedado na Nuvem (Supabase)' : 'Vídeo MP4/WebM'
        });

        onChange(finalUrl, { 
          isVideo: true, 
          type: 'video', 
          thumbnail: result.thumbnail 
        });
      } else if (file.type.startsWith('image/')) {
        setProcessingStatus('Otimizando imagem para WebP ultra-leve...');
        const result = await compressImageFile(file, {
          maxWidth: 900,
          maxHeight: 900,
          quality: 0.75,
          mimeType: 'image/webp'
        });

        // Tenta hospedar no Supabase Storage se disponível
        const storageUrl = await uploadMediaToSupabaseStorage(file, 'images');
        const finalUrl = storageUrl || result.dataUrl;

        setMediaInfo({
          type: 'image',
          original: result.originalSizeFormatted,
          optimized: result.sizeFormatted,
          reduction: result.reductionPercent,
          dimensions: `${result.width}x${result.height}px`
        });

        onChange(finalUrl, { 
          isVideo: false, 
          type: 'image', 
          thumbnail: finalUrl 
        });
      } else {
        throw new Error('Formato não suportado. Por favor, envie uma foto (JPG, PNG, WEBP) ou vídeo (MP4, WebM, MOV).');
      }
    } catch (err) {
      console.error('Erro no processamento da mídia:', err);
      setErrorMessage(err.message || 'Erro ao processar arquivo.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
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

  const handleRemoveMedia = () => {
    onChange('', { isVideo: false, type: 'image', thumbnail: '' });
    setMediaInfo(null);
    setErrorMessage('');
    setLoadError(false);
  };

  const handleUrlChange = (url) => {
    setLoadError(false);
    setMediaInfo(null);
    const trimmed = url.trim();
    const isVid = isVideoUrl(trimmed);
    const ytThumb = getVideoPosterUrl(trimmed);

    onChange(trimmed, {
      isVideo: isVid,
      type: isVid ? 'video' : 'image',
      thumbnail: ytThumb || trimmed
    });
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Header com Label e Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div>
          <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
            {label}
            {acceptVideo && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 font-bold">
                Fotos & Vídeos 🎬
              </span>
            )}
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
            <span>Link / YouTube</span>
          </button>
        </div>
      </div>

      {/* ÁREA 1: ENVIAR DO DISPOSITIVO (FOTO OU VÍDEO) */}
      {activeTab === 'upload' && (
        <div className="space-y-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept={acceptVideo 
              ? "image/png,image/jpeg,image/webp,image/jpg,video/mp4,video/webm,video/quicktime,video/mov" 
              : "image/png,image/jpeg,image/webp,image/jpg"
            }
            className="hidden"
          />

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center select-none flex flex-col items-center justify-center gap-2 ${
              isDragOver
                ? 'border-brand-gold bg-brand-gold/10'
                : 'border-dark-750 hover:border-brand-gold/60 bg-dark-850 hover:bg-dark-800'
            }`}
          >
            {isProcessing ? (
              <div className="py-2 flex flex-col items-center gap-2 text-brand-gold">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="text-xs font-bold">{processingStatus || 'Processando arquivo...'}</span>
                <span className="text-[10px] text-slate-400">Preparando para o site</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-brand-gold">
                  <div className="w-10 h-10 rounded-xl bg-brand-gold/15 flex items-center justify-center border border-brand-gold/30">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  {acceptVideo && (
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center border border-amber-500/30 text-amber-400">
                      <Film className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-xs font-bold text-white block">
                    Clique para selecionar {acceptVideo ? 'Foto ou Vídeo' : 'Foto'} do aparelho
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {acceptVideo 
                      ? 'Aceita Fotos (JPG, PNG, WebP) ou Vídeos (MP4, WebM até 30MB)'
                      : 'Aceita Fotos (JPG, PNG, WebP)'}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Compressão e Otimização Automática no Navegador</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ÁREA 2: URL / LINK DA WEB (FOTO OU VÍDEO / YOUTUBE) */}
      {activeTab === 'url' && (
        <div className="space-y-1.5">
          <div className="relative">
            <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={value.startsWith('data:') ? '' : value}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder={placeholder || (acceptVideo ? "https://... (Foto, MP4 ou YouTube)" : "https://...")}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-dark-850 border border-dark-750 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-brand-gold"
            />
          </div>
          <span className="text-[10px] text-slate-500 block">
            {acceptVideo 
              ? 'Cole o link direto da imagem, link de vídeo direto (.mp4), ou link do YouTube Shorts / Vídeo.'
              : 'Cole aqui o link direto de uma imagem da internet.'}
          </span>
        </div>
      )}

      {/* MENSAGEM DE ERRO */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* PRÉVIA DA MÍDIA (FOTO OU VÍDEO) */}
      {value && (
        <div className="p-3 rounded-2xl bg-dark-950 border border-dark-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            
            {/* Visual Thumbnail */}
            <div className="w-16 h-16 rounded-xl bg-dark-900 overflow-hidden flex-shrink-0 border border-dark-750 relative flex items-center justify-center">
              {isVideo ? (
                embedUrl ? (
                  <div className="w-full h-full relative bg-black flex items-center justify-center">
                    {youtubePoster ? (
                      <img src={youtubePoster} alt="YouTube" className="w-full h-full object-cover" />
                    ) : (
                      <Film className="w-6 h-6 text-brand-gold" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                  </div>
                ) : (
                  <video
                    src={value}
                    muted
                    loop
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <img
                  src={value}
                  alt="Prévia"
                  className="w-full h-full object-cover"
                  onError={() => setLoadError(true)}
                />
              )}

              {loadError && (
                <div className="absolute inset-0 bg-dark-950/90 flex items-center justify-center text-rose-400 text-[9px] text-center p-1">
                  Erro ao carregar
                </div>
              )}
            </div>

            {/* Media Information */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white truncate">
                  {isVideo ? 'Vídeo pronto para o site' : 'Imagem pronta para o site'}
                </span>
                
                {isVideo ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                    <Film className="w-3 h-3 text-amber-400" />
                    <span>{embedUrl ? 'YouTube Vídeo' : 'Vídeo MP4'}</span>
                  </span>
                ) : value.startsWith('data:') ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    Otimizada (WebP)
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                    URL Externa
                  </span>
                )}
              </div>

              {mediaInfo ? (
                mediaInfo.type === 'video' ? (
                  <div className="text-[11px] text-amber-300 mt-0.5">
                    <span>Tamanho: {mediaInfo.size}</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-400 mt-0.5 flex flex-wrap items-center gap-x-2">
                    <span><strong>{mediaInfo.optimized}</strong> ({mediaInfo.reduction}% mais leve)</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{mediaInfo.dimensions}</span>
                  </div>
                )
              ) : (
                <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                  {value.startsWith('data:') ? 'Arquivo carregado do dispositivo' : value}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {activeTab === 'upload' && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-dark-750 transition-colors cursor-pointer"
                title="Trocar por outro arquivo"
              >
                <RefreshCw className="w-4 h-4 text-brand-gold" />
              </button>
            )}

            <button
              type="button"
              onClick={handleRemoveMedia}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
              title="Remover mídia"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
