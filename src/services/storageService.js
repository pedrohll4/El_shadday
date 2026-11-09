import { supabase, isSupabaseConfigured } from './supabaseClient';
import { compressImageFile } from '../utils/imageCompressor';
import { showSaveError } from './saveGuard';

// Fotos de celular chegam com 5-10 MB. Antes subíamos o ORIGINAL para o Storage
// (a versão comprimida era descartada). Agora toda imagem é reduzida para no
// máximo 1200px em WebP antes do upload (~100-200 KB por foto).
async function optimizeImageForUpload(file) {
  if (!file?.type?.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }
  try {
    const result = await compressImageFile(file, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.78,
      mimeType: 'image/webp'
    });
    if (!result?.dataUrl || result.sizeBytes >= file.size) return file;
    const blob = await (await fetch(result.dataUrl)).blob();
    const ext = result.mimeType === 'image/webp' ? 'webp' : 'jpg';
    return new File([blob], `foto.${ext}`, { type: result.mimeType });
  } catch (e) {
    console.warn('⚠️ Não foi possível otimizar a imagem antes do upload:', e);
    return file;
  }
}

/**
 * Faz upload de arquivo de foto ou vídeo diretamente no Supabase Storage
 * @param {File} file Arquivo selecionado no dispositivo
 * @param {string} folder Pasta de destino (ex: 'gallery')
 * @returns {Promise<string|null>} Retorna a URL pública direta ou null se falhar
 */
export async function uploadMediaToSupabaseStorage(file, folder = 'gallery') {
  if (!isSupabaseConfigured || !supabase || !file) {
    return null;
  }

  try {
    file = await optimizeImageForUpload(file);
    const rawExt = file.name ? file.name.split('.').pop() : '';
    const ext = rawExt ? rawExt.toLowerCase() : (file.type.startsWith('video/') ? 'mp4' : 'webp');
    const safeName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    let uploadRes = await supabase.storage
      .from('gallery')
      .upload(safeName, file, {
        cacheControl: '31536000',
        contentType: file.type || undefined,
        upsert: true
      });

    if (uploadRes.error && (uploadRes.error.message?.includes('not found') || uploadRes.error.message?.includes('Bucket') || uploadRes.error.message?.includes('bucket'))) {
      try {
        await supabase.storage.createBucket('gallery', { public: true });
        uploadRes = await supabase.storage
          .from('gallery')
          .upload(safeName, file, {
            cacheControl: '31536000',
            contentType: file.type || undefined,
            upsert: true
          });
      } catch (bErr) {}
    }

    if (uploadRes.error) {
      console.warn('⚠️ Supabase Storage upload avisou:', uploadRes.error.message);
      const m = uploadRes.error.message || '';
      showSaveError(/security|permission|JWT|Unauthorized|403|401/i.test(m)
        ? 'a foto não foi enviada porque seu login expirou. Saia do painel, entre de novo e envie a foto outra vez.'
        : 'a foto não foi enviada (' + m.slice(0, 100) + '). Tente de novo.');
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('gallery')
      .getPublicUrl(safeName);

    if (publicUrlData && publicUrlData.publicUrl) {
      console.log('✅ Arquivo salvo com sucesso no Supabase Storage:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    }
  } catch (err) {
    console.warn('⚠️ Erro ao tentar upload no Supabase Storage:', err);
    showSaveError('a foto não foi enviada (sem internet ou erro no servidor). Tente de novo.');
  }

  return null;
}
