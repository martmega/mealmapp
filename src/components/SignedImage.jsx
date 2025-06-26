import React, { useEffect, useState } from 'react';
import {
  getSignedImageUrl,
  peekCachedSignedUrl,
  preloadSignedImageUrl,
  DEFAULT_IMAGE_URL,
} from '@/lib/images';
import { cn } from '@/lib/utils';

export default function SignedImage({
  bucket,
  path,
  alt = '',
  className = '',
  fallback = DEFAULT_IMAGE_URL,
  ...props
}) {
  const cached = peekCachedSignedUrl(bucket, path);
  const [url, setUrl] = useState(cached || fallback);
  const [loaded, setLoaded] = useState(!!cached);

  useEffect(() => {
    let isMounted = true;
    preloadSignedImageUrl(bucket, path, fallback);
    async function fetchUrl() {
      const signed = await getSignedImageUrl(bucket, path, fallback);
      if (isMounted) setUrl(signed);
    }
    fetchUrl();
    return () => {
      isMounted = false;
    };
  }, [bucket, path, fallback]);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        src={url}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          if (e.target.src !== fallback) {
            e.target.src = fallback;
          }
        }}
        className={cn(
          'w-full h-full object-cover transition-all duration-300',
          loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
        )}
        {...props}
      />
      {!loaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
    </div>
  );
}
