'use client';

import React, { useState, useEffect } from 'react';
import { SmartImage } from '@/components/ui/SmartImage';
import { Maximize2, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Product, ProductColor } from '@/data/products';
import { formatCurrency } from '@/lib/utils';
import { ProductZoomModal } from '@/components/product/ProductZoomModal';

interface ProductGalleryProps {
  product: Product;
  imagesList: string[];
  colorsList?: ProductColor[];
  selectedIndex?: number;
  onSelectImageIndex?: (index: number) => void;
}

export function ProductGallery({
  product,
  imagesList,
  colorsList,
  selectedIndex: externalIndex,
  onSelectImageIndex,
}: ProductGalleryProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const currentIndex = externalIndex !== undefined ? externalIndex : internalIndex;

  const setIndex = (idx: number) => {
    if (onSelectImageIndex) {
      onSelectImageIndex(idx);
    } else {
      setInternalIndex(idx);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const currentCode = product.code
    ? product.code.includes('-')
      ? product.code
      : `${product.code}-C${currentIndex + 1}`
    : `OPTION-${currentIndex + 1}`;

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-3 lg:gap-4 w-full">
      {/* Thumbnail Rail */}
      {imagesList.length > 1 && (
        <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto lg:h-[480px] lg:max-h-[480px] xl:h-[620px] xl:max-h-[620px] pb-2 lg:pb-0 no-scrollbar flex-shrink-0 w-full lg:w-20 snap-x snap-mandatory lg:snap-none">
          {imagesList.map((img, idx) => {
            const mappedColor = colorsList?.find(
              (c) =>
                c.imageIndex === idx ||
                ((c as { images?: string[] }).images &&
                  (c as { images?: string[] }).images?.includes(img))
            ) || (colorsList && colorsList[idx] ? colorsList[idx] : null);

            const isSelected = currentIndex === idx;

            return (
              <button
                key={idx}
                onClick={() => setIndex(idx)}
                aria-label={`View image ${idx + 1} of ${imagesList.length}`}
                aria-current={isSelected}
                className={`relative w-[68px] h-[84px] sm:w-20 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 snap-start border-2 transition-all cursor-pointer group/thumb ${isSelected
                  ? 'border-pink-500 ring-2 ring-pink-200 scale-[1.02] shadow-sm'
                  : 'border-stone-200/80 opacity-70 hover:opacity-100 active:scale-95'
                  }`}
              >
                <SmartImage
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
                {mappedColor && (
                  <span
                    className="absolute bottom-1.5 right-1.5 w-3 h-3 rounded-full border border-white shadow-md transition-transform group-hover/thumb:scale-125"
                    style={{ backgroundColor: mappedColor.hex || '#000' }}
                    title={mappedColor.name}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Image Viewport */}
      <div
        onClick={() => setIsZoomModalOpen(true)}
        onMouseEnter={() => {
          if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
            setIsHovering(true);
          }
        }}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={(e) => {
          if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
            handleMouseMove(e);
          }
        }}
        className="relative h-[480px] sm:h-[460px] lg:h-[480px] xl:h-[620px] w-full rounded-3xl overflow-hidden bg-stone-100 border border-stone-200/90 shadow-sm group cursor-pointer flex-grow"
      >
        <SmartImage
          src={imagesList[currentIndex] || imagesList[0]}
          alt={product?.name || 'Product Image'}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          style={
            isHovering
              ? {
                transform: 'scale(2.2)',
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                transition: 'transform 0.08s ease-out',
              }
              : {
                transform: 'scale(1)',
                transition: 'transform 0.3s ease-out',
              }
          }
          className="object-cover pointer-events-none"
        />

        {/* Fullscreen Zoom Trigger (Top-Right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomModalOpen(true);
          }}
          className="absolute top-3 right-3 p-2.5 bg-white/90 hover:bg-white text-stone-800 rounded-full backdrop-blur-md transition-all shadow-md cursor-pointer z-20 hover:scale-110 active:scale-95"
          title="Fullscreen Zoom"
          aria-label="Open fullscreen zoom"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Previous & Next Floating Navigation Arrows */}
        {imagesList.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIndex(currentIndex === 0 ? imagesList.length - 1 : currentIndex - 1);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-stone-900/60 hover:bg-stone-900 text-white rounded-full backdrop-blur-md shadow-lg transition-all active:scale-90 z-20 cursor-pointer"
              aria-label="Previous image"
              title="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIndex(currentIndex === imagesList.length - 1 ? 0 : currentIndex + 1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-stone-900/60 hover:bg-stone-900 text-white rounded-full backdrop-blur-md shadow-lg transition-all active:scale-90 z-20 cursor-pointer"
              aria-label="Next image"
              title="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* SKU/Code Badge Overlay (Bottom Left) */}
        <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
          <span className="bg-stone-900/85 backdrop-blur-md text-white font-semibold text-xs sm:text-sm px-3 py-1 rounded-md border border-white/10 shadow-sm uppercase tracking-wide">
            {currentCode}
          </span>
        </div>

        {/* Price Badge Overlay (Bottom Right) */}
        <div className="absolute bottom-3 right-3 z-20 pointer-events-none">
          <span className="bg-stone-900/85 backdrop-blur-md text-white font-bold text-xs sm:text-sm px-3.5 py-1 rounded-md border border-white/10 shadow-sm font-sans">
            {formatCurrency(product.price)}
          </span>
        </div>
      </div>

      {/* Lightbox / Zoom Modal */}
      <ProductZoomModal
        isOpen={isZoomModalOpen}
        onClose={() => setIsZoomModalOpen(false)}
        imageUrl={imagesList[currentIndex] || imagesList[0]}
        title={`${product.name} (${currentCode})`}
      />
    </div>
  );
}
