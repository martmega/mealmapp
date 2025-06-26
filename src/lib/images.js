export const DEFAULT_IMAGE_URL = '/img/placeholder-image.svg';
export const DEFAULT_AVATAR_URL = '/img/placeholder-avatar.svg';

const signedUrlCache = new Map();

export function clearSignedImageCache() {
  signedUrlCache.clear();
}

export function peekCachedSignedUrl(bucket, path) {
  if (!path) return null;
  const match = path.match(/\/storage\/v1\/object\/sign\/([^?]+)/);
  const objectPath = match ? match[1] : path;
  const cacheKey = `${bucket}:${objectPath}`;
  const cached = signedUrlCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.url;
  }
  return null;
}

export async function getSignedImageUrl(
  bucket,
  path,
  fallback = DEFAULT_IMAGE_URL
) {
  if (!path) return fallback;

  const match = path.match(/\/storage\/v1\/object\/sign\/([^?]+)/);
  const objectPath = match ? match[1] : path;

  if (!match && path.startsWith('http')) {
    return path;
  }

  const cacheKey = `${bucket}:${objectPath}`;
  const useCache = process.env.NODE_ENV !== 'test';
  const cached = signedUrlCache.get(cacheKey);
  if (useCache && cached && cached.expiry > Date.now()) {
    return cached.url;
  }

  try {
    const params = new URLSearchParams({ bucket, path: objectPath });
    const response = await fetch(`/api/getSignedImageUrl?${params.toString()}`);
    if (!response.ok) throw new Error('Request failed');
    const { url } = await response.json();
    if (useCache) {
      signedUrlCache.set(cacheKey, {
        url,
        expiry: Date.now() + 60 * 60 * 1000 - 60 * 1000, // ~1h validity
      });
    }
    return url;
  } catch (err) {
    console.error('getSignedImageUrl error:', err.message);
    return fallback;
  }
}

export function preloadSignedImageUrl(bucket, path, fallback = DEFAULT_IMAGE_URL) {
  getSignedImageUrl(bucket, path, fallback).catch(() => {});
}
