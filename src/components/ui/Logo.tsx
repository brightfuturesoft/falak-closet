'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface LogoProps {
  variant?: 'full' | 'icon' | 'badge' | 'transparent' | 'normal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  transparent?: boolean;
  href?: string;
  className?: string;
}

export function Logo({
  variant = 'full',
  size = 'md',
  transparent = true,
  href = '/',
  className = ''
}: LogoProps) {
  const [imgError, setImgError] = useState(false);

  // Pick between transparent logo (/transparent_logo.png) or normal logo (/logo.png)
  // const isTransparent = variant === 'transparent' || (transparent && variant !== 'normal');
  const logoSrc = '/favicon.ico';

  const sizeMap = {
    sm: 'h-8 sm:h-9 max-w-[140px]',
    md: 'h-10 sm:h-12 max-w-[180px]',
    lg: 'h-12 sm:h-16 max-w-[220px]',
    xl: 'h-16 sm:h-24 max-w-[280px]'
  };

  const currentHeight = sizeMap[size] || sizeMap.md;

  const logoImage = (
    <div className="relative inline-flex items-center shrink-0">
      <img
        src={imgError ? '/apple-touch-icon.png' : logoSrc}
        alt="Falak Closet Logo"
        className={`${currentHeight}  rounded-md w-auto object-contain transition-transform duration-300 group-hover:scale-105`}
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
      {logoImage} <span className='mx-2 font-bold text-[#a80d15]'>Falak Closet</span>
    </Link>
  );
}
