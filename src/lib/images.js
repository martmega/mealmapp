export const DEFAULT_IMAGE_URL = 'https://placehold.co/600x400?text=Image';
export const DEFAULT_AVATAR_URL = 'https://placehold.co/100x100?text=Avatar';

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

  try {
    const params = new URLSearchParams({ bucket, path: objectPath });
    const response = await fetch(`/api/getSignedImageUrl?${params.toString()}`);
    if (!response.ok) throw new Error('Request failed');
    const { url } = await response.json();
    return url;
  } catch (err) {
    console.error('getSignedImageUrl error:', err.message);
    return fallback;
  }
}
