import React, { useEffect, useState } from 'react';
import {
  getSignedImageUrl,
  peekCachedSignedUrl,
  preloadSignedImageUrl,
  DEFAULT_IMAGE_URL,
} from '@/lib/images';

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
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={(e) => {
        if (e.target.src !== fallback) {
          e.target.src = fallback;
        }
      }}
      className={`bg-muted ${className}`}
      {...props}
    />
  );
}
