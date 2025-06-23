import React, { useEffect, useState } from 'react';
import { getSignedImageUrl, DEFAULT_IMAGE_URL } from '@/lib/images';

export default function SignedImage({
  bucket,
  path,
  alt = '',
  className = '',
  fallback = DEFAULT_IMAGE_URL,
  ...props
}) {
  const [url, setUrl] = useState(fallback);

  useEffect(() => {
    let isMounted = true;
    async function fetchUrl() {
      const signed = await getSignedImageUrl(bucket, path, fallback);
      if (isMounted) setUrl(signed);
    }
    fetchUrl();
    return () => {
      isMounted = false;
    };
  }, [bucket, path, fallback]);

  return <img src={url} alt={alt} className={className} {...props} />;
}
