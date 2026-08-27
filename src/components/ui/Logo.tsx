'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/**
 * Logo image — served as an optimized WebP (~11KB @ 512×512) through
 * next/image so every route ships a tiny, cacheable, non-shifting brand mark.
 * The raw 374KB PNG previously loaded unoptimized on every page.
 */
const LOGO_SRC = '/logo-transparent-512.webp';
const LOGO_FALLBACK = '/logo-512.png';

interface LogoProps {
  variant?: 'full' | 'icon' | 'badge' | 'transparent' | 'normal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  transparent?: boolean;
  href?: string;
  className?: string;
  /** Eager-load + preload — use for above-the-fold placements (Header). */
  priority?: boolean;
}

export function Logo({
  variant = 'full',
  size = 'md',
  transparent = true,
  href = '/',
  className = '',
  priority = false
}: LogoProps) {
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    sm: 'h-8 sm:h-9 max-w-[140px]',
    md: 'h-10 sm:h-12 max-w-[180px]',
    lg: 'h-12 sm:h-16 max-w-[220px]',
    xl: 'h-16 sm:h-24 max-w-[280px]'
  };

  const currentHeight = sizeMap[size] || sizeMap.md;

  const logoImage = (
    <div className="relative inline-flex items-center shrink-0">
      <Image
        src={imgError ? LOGO_FALLBACK : LOGO_SRC}
        alt="Falak Closet Logo"
        width={512}
        height={512}
        sizes="(max-width: 640px) 140px, 180px"
        priority={priority}
        className={`${currentHeight} w-auto object-contain transition-transform duration-300 group-hover:scale-105`}
        onError={() => setImgError(true)}
      />
    </div>
  );

  if (variant === 'badge') {
    return (
      <Link
        href={href}
        className={`inline-flex items-center gap-2 px-3 py-1.5 bg-[#FFFBF0] border border-[#F2C76E]/60 rounded-2xl shadow-xs ${className}`}
      >
        {logoImage}
      </Link>
    );
  }

  return (
    <Link href={href} className={`group inline-flex items-center cursor-pointer ${className}`}>
      {logoImage} <span className='mx-2'>Falak Closet</span>
    </Link>
  );
}
