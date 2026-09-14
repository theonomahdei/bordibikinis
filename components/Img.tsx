'use client';

import { useState } from 'react';

// Every image slot in the store renders through this component.
// If a remote placeholder photo ever fails to load, it swaps to a
// styled monogram tile instead of a broken/blank frame — the user's
// hard requirement that no space is ever empty.

interface ImgProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  fallbackHex?: string;
  eager?: boolean;
}

export default function Img({
  src, alt, className = '', fallbackLabel = 'SWIMZY', fallbackHex = '#EFE7DC', eager = false,
}: ImgProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          background: `linear-gradient(160deg, ${fallbackHex} 0%, ${fallbackHex}99 55%, #ffffff 130%)`,
        }}
        aria-label={alt}
      >
        <span className="font-display uppercase tracking-widest2 text-ink/50 text-2xl">
          {fallbackLabel}
        </span>
      </div>
    );
  }

  /* eslint-disable-next-line @next/next/no-img-element */
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
    />
  );
}
