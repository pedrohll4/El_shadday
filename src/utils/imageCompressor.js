/**
 * Utilitário de Compressão e Otimização de Imagens no Cliente
 * Redimensiona e converte imagens para WebP/JPEG com qualidade otimizada,
 * reduzindo o consumo de espaço no banco de dados e acelerando o carregamento no site.
 */

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function compressImageFile(file, options = {}) {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.75,
    mimeType = 'image/webp'
  } = options;

  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('Nenhum arquivo fornecido.'));
    }

    if (!file.type || !file.type.startsWith('image/')) {
      return reject(new Error('O arquivo selecionado não é uma imagem válida (JPG, PNG, WEBP, etc).'));
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Falha ao ler o arquivo selecionado no seu dispositivo.'));
    };

    reader.onload = (event) => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error('Não foi possível processar a imagem selecionada.'));
      };

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Redimensionamento proporcional mantendo a proporção original
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Erro ao inicializar o processador gráfico do navegador.'));
        }

        // Suavização para manter alta fidelidade visual
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Desenhar a imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Tentar exportar em WebP, se não for suportado faz fallback para JPEG
        let chosenMime = mimeType;
        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL(chosenMime, quality);
          if (!dataUrl.startsWith(`data:${chosenMime}`)) {
            chosenMime = 'image/jpeg';
            dataUrl = canvas.toDataURL(chosenMime, quality);
          }
        } catch (e) {
          chosenMime = 'image/jpeg';
          dataUrl = canvas.toDataURL(chosenMime, quality);
        }

        // Cálculo de tamanho comprimido a partir da string base64
        const commaIdx = dataUrl.indexOf(',');
        const base64Data = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
        const sizeBytes = Math.round((base64Data.length * 3) / 4);

        const originalSizeBytes = file.size;
        const reductionPercent = originalSizeBytes > sizeBytes
          ? Math.round(((originalSizeBytes - sizeBytes) / originalSizeBytes) * 100)
          : 0;

        resolve({
          dataUrl,
          sizeBytes,
          sizeFormatted: formatBytes(sizeBytes),
          originalSizeBytes,
          originalSizeFormatted: formatBytes(originalSizeBytes),
          reductionPercent,
          width,
          height,
          mimeType: chosenMime,
          isVideo: false
        });
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Helpers para Detecção e Processamento de Vídeos
 */

export function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  if (clean.startsWith('data:video/')) return true;
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(clean)) return true;
  if (/youtube\.com\/|youtu\.be\/|vimeo\.com\//i.test(clean)) return true;
  return false;
}

export function getYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  // YouTube Shorts: youtube.com/shorts/XYZ
  const shorts = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/i);
  if (shorts && shorts[1]) return shorts[1];

  // Standard YouTube: youtube.com/watch?v=XYZ
  const watch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/i);
  if (watch && watch[1]) return watch[1];

  return null;
}

export function getEmbedVideoUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const ytId = getYouTubeVideoId(url);
  if (ytId) {
    return `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=1&rel=0`;
  }

  const vimeo = url.match(/vimeo\.com\/(\d+)/i);
  if (vimeo && vimeo[1]) {
    return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1&muted=1&loop=1&controls=1`;
  }

  return null;
}

export function getVideoPosterUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const ytId = getYouTubeVideoId(url);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  return null;
}

/**
 * Gera uma miniatura (thumbnail) do primeiro quadro de um vídeo
 */
export async function generateVideoThumbnail(fileOrUrl) {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';

      let timeout = setTimeout(() => {
        resolve(null);
      }, 4000);

      video.onloadeddata = () => {
        video.currentTime = Math.min(0.5, (video.duration || 1) / 4);
      };

      video.onseeked = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          const width = Math.min(video.videoWidth || 640, 640);
          const height = Math.round((width * (video.videoHeight || 360)) / (video.videoWidth || 640));
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            const thumb = canvas.toDataURL('image/jpeg', 0.75);
            resolve(thumb);
            return;
          }
        } catch (e) {
          console.warn('Erro ao extrair thumbnail de vídeo:', e);
        }
        resolve(null);
      };

      video.onerror = () => {
        clearTimeout(timeout);
        resolve(null);
      };

      if (typeof fileOrUrl === 'string') {
        video.src = fileOrUrl;
      } else {
        video.src = URL.createObjectURL(fileOrUrl);
      }
    } catch (err) {
      resolve(null);
    }
  });
}

/**
 * Lê e processa arquivo de vídeo selecionado do dispositivo
 */
export async function processVideoFile(file, options = {}) {
  const { maxSizeBytes = 25 * 1024 * 1024 } = options; // 25 MB limite máx

  if (!file) {
    throw new Error('Nenhum arquivo de vídeo fornecido.');
  }

  if (!file.type || !file.type.startsWith('video/')) {
    throw new Error('O arquivo selecionado não é um formato de vídeo válido (MP4, WebM, MOV, etc).');
  }

  if (file.size > maxSizeBytes) {
    throw new Error(`O vídeo é muito pesado (${formatBytes(file.size)}). Para garantir que o site carregue rápido para os clientes no celular, selecione um vídeo de até 25 MB ou cole o link do YouTube/Instagram.`);
  }

  // Gera thumbnail do vídeo
  const thumbnail = await generateVideoThumbnail(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de vídeo do dispositivo.'));
    reader.onload = (e) => {
      resolve({
        dataUrl: e.target.result,
        thumbnail,
        sizeBytes: file.size,
        sizeFormatted: formatBytes(file.size),
        originalSizeBytes: file.size,
        originalSizeFormatted: formatBytes(file.size),
        isVideo: true,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  });
}
