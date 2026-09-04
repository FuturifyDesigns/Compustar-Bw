import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Keep uploads small for Supabase free tier (1 GB storage / limited egress). */
const MAX_EDGE = 1600;
const TARGET_BYTES = 420_000;
const HARD_MAX_BYTES = 750_000;

export const supabaseConfigured = Boolean(url && anon);
export const supabase = supabaseConfigured
  ? createClient(url, anon, {
      realtime: { params: { eventsPerSecond: 8 } }
    })
  : null;

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

/** Resize + WebP compress client-side before Storage upload. */
export async function compressImage(file, { maxEdge = MAX_EDGE } = {}) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('Please choose an image file');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.8;
  let blob = await canvasToBlob(canvas, 'image/webp', quality);
  if (!blob || blob.size === 0) {
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);
  }

  while (blob && blob.size > TARGET_BYTES && quality > 0.48) {
    quality -= 0.08;
    const nextType = blob.type.includes('webp') ? 'image/webp' : 'image/jpeg';
    blob = await canvasToBlob(canvas, nextType, quality);
  }

  if (!blob) throw new Error('Could not compress image');
  if (blob.size > HARD_MAX_BYTES) {
    throw new Error('Image is still too large after compression. Use a smaller photo.');
  }

  const ext = blob.type.includes('webp') ? 'webp' : 'jpg';
  const base = (file.name || 'upload').replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '-').slice(0, 48);
  return new File([blob], `${base}.${ext}`, { type: blob.type });
}

export async function uploadMedia(file, folder = 'uploads') {
  if (!supabase) throw new Error('Supabase is not configured');
  const optimized = await compressImage(file, {
    maxEdge: folder === 'adverts' ? 1800 : MAX_EDGE
  });
  const ext = optimized.name.split('.').pop() || 'webp';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('media').upload(path, optimized, {
    upsert: false,
    contentType: optimized.type,
    cacheControl: '31536000'
  });
  if (error) throw error;
  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}
