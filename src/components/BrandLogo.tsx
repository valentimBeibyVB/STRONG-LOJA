import React, { useState, useEffect } from 'react';
import { resolveLogoUrl, DEFAULT_BRAND_LOGO, DEFAULT_BRAND_LOGO_HIGHRES } from '../utils/logo';

interface BrandLogoProps {
  src?: string | null;
  alt?: string;
  className?: string;
  imageClassName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'rounded' | 'circle' | 'square';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  src,
  alt = 'Strong Logo',
  className = '',
  imageClassName = '',
  size = 'md',
  shape = 'rounded',
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(() => resolveLogoUrl(src));
  const [failed, setFailed] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);

  useEffect(() => {
    setCurrentSrc(resolveLogoUrl(src));
    setFailed(false);
    setAttempts(0);
  }, [src]);

  const handleError = () => {
    if (attempts === 0 && currentSrc !== DEFAULT_BRAND_LOGO) {
      // First retry with bundled optimized logo
      setCurrentSrc(DEFAULT_BRAND_LOGO);
      setAttempts(1);
    } else if (attempts === 1 && currentSrc !== DEFAULT_BRAND_LOGO_HIGHRES) {
      // Second retry with highres bundled logo
      setCurrentSrc(DEFAULT_BRAND_LOGO_HIGHRES);
      setAttempts(2);
    } else if (attempts === 2 && currentSrc !== './strong-logo.jpg') {
      // Third retry with direct relative public file
      setCurrentSrc('./strong-logo.jpg');
      setAttempts(3);
    } else {
      // If all image sources fail, show the graceful vector emblem fallback
      setFailed(true);
    }
  };

  const shapeClasses = {
    circle: 'rounded-full',
    rounded: 'rounded-xl',
    square: 'rounded-none',
  }[shape];

  const sizeClasses = {
    xs: 'w-5 h-5',
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }[size];

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-900 border border-amber-400/50 text-amber-400 font-black select-none ${sizeClasses} ${shapeClasses} ${className}`}
        title={alt}
      >
        <span className="text-xs tracking-tighter">ST</span>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-neutral-950 ${sizeClasses} ${shapeClasses} ${className}`}
    >
      <img
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-contain ${shapeClasses} ${imageClassName}`}
        onError={handleError}
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
