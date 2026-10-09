import { supabase, isSupabaseConfigured } from './supabaseClient';

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
    const rawExt = file.name ? file.name.split('.').pop() : '';
    const ext = rawExt ? rawExt.toLowerCase() : (file.type.startsWith('video/') ? 'mp4' : 'webp');
    const safeName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    let uploadRes = await supabase.storage
      .from('gallery')
      .upload(safeName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadRes.error && (uploadRes.error.message?.includes('not found') || uploadRes.error.message?.includes('Bucket') || uploadRes.error.message?.includes('bucket'))) {
      try {
        await supabase.storage.createBucket('gallery', { public: true });
        uploadRes = await supabase.storage
          .from('gallery')
          .upload(safeName, file, {
            cacheControl: '3600',
            upsert: true
          });
      } catch (bErr) {}
    }

    if (uploadRes.error) {
      console.warn('⚠️ Supabase Storage upload avisou:', uploadRes.error.message);
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
  }

  return null;
}
