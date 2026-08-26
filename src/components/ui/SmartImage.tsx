'use client';

import React from 'react';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import { isCloudinaryUrl } from '@/lib/cloudinary';

interface SmartImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  style?: React.CSSProperties;
}

/**
 * Cloudinary srcs render via CldImage (auto format/quality by default);
 * everything else — data: URLs, Unsplash, local paths — falls back to
 * next/image so legacy base64 products keep working everywhere.
 */
export function SmartImage({
  src,
  alt,
  width,
  height,
  fill,
  className,
  sizes,
  priority,
  style,
}: SmartImageProps) {
  if (isCloudinaryUrl(src)) {
    return (
      <CldImage
        src={src}
        alt={alt}
        {...(width !== undefined ? { width } : {})}
        {...(height !== undefined ? { height } : {})}
        {...(fill ? { fill: true } : {})}
        {...(className ? { className } : {})}
        {...(sizes ? { sizes } : {})}
        {...(priority ? { priority: true } : {})}
        {...(style ? { style } : {})}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      {...(width !== undefined ? { width } : {})}
      {...(height !== undefined ? { height } : {})}
      {...(fill ? { fill: true } : {})}
      {...(className ? { className } : {})}
      {...(sizes ? { sizes } : {})}
      {...(priority ? { priority: true } : {})}
      {...(style ? { style } : {})}
    />
  );
}
