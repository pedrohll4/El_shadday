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
          mimeType: chosenMime
        });
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}
