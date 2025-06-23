import { getSupabase } from './supabase';

export const DEFAULT_IMAGE_URL = 'https://placehold.co/600x400?text=Image';
export const DEFAULT_AVATAR_URL = 'https://placehold.co/100x100?text=Avatar';

const supabase = getSupabase();

export async function getSignedImageUrl(bucket, path, fallback = DEFAULT_IMAGE_URL) {
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
    if (error) throw error;
    return data.signedUrl;
  } catch (err) {
    console.error('getSignedImageUrl error:', err.message);
    return fallback;
  }
}
