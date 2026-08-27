'use client';

import React from 'react';
import Link from 'next/link';
import { SmartImage } from '@/components/ui/SmartImage';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ui/Toast';

interface ProductCardProps {
  product: Product;
  selectedColor?: string;
  variationCode?: string;
}

export function ProductCard({ product, selectedColor, variationCode }: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useCart();
  const { showToast } = useToast();
  const isWishlisted = isInWishlist(product?.id);

  // Find color object if matched or selected
  const initialColorObj = React.useMemo(() => {
    if (!product?.colors || product.colors.length === 0) return null;
    if (selectedColor) {
      const match = product.colors.find(
        (c) => c.name.toLowerCase() === selectedColor.toLowerCase()
      );
      if (match) return match;
    }
    return product.colors[0];
  }, [product, selectedColor]);

  const [activeColor, setActiveColor] = React.useState(initialColorObj);
  const [activeImageIndex, setActiveImageIndex] = React.useState<number>(
    initialColorObj?.imageIndex ?? 0
  );

  React.useEffect(() => {
    if (initialColorObj) {
      setActiveColor(initialColorObj);
      if (typeof initialColorObj.imageIndex === 'number' && product?.images[initialColorObj.imageIndex]) {
        setActiveImageIndex(initialColorObj.imageIndex);
      }
    }
  }, [initialColorObj, product]);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);

    showToast({
      type: 'wishlist',
      title: isWishlisted ? 'Removed from Wishlist' : 'Saved to Wishlist',
      subtitle: product?.name,
      image: product?.images[activeImageIndex] || product?.images[0]
    });
  };

  const currentImage =
    product?.images[activeImageIndex] ||
    product?.images[0] ||
    'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1000&q=80';

  // Compute SKU Code format (e.g. EZ-K67-C1-Black)
  const colorIndex = activeColor ? product?.colors?.findIndex((c) => c.name === activeColor.name) : -1;
  const computedSkuCode =
    variationCode ||
    (product?.code && activeColor && colorIndex !== -1
      ? `${product.code}-C${colorIndex + 1}-${activeColor.name.replace(/\s+/g, '')}`
      : product?.code || 'EZ-L6');

  const productUrl = activeColor
    ? `/product/${product?.slug}?color=${encodeURIComponent(activeColor.name)}`
    : `/product/${product?.slug}`;

  return (
    <div className="group bg-white rounded-3xl border border-pink-100 p-2.5 sm:p-3 shadow-xs hover:shadow-md transition-all h-full duration-300 flex flex-col justify-between relative overflow-hidden">
      {/* Top Image Container */}
      <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-stone-100">
        <Link href={productUrl} className="block relative w-full h-full">
          <SmartImage
            src={currentImage}
            alt={product?.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Wishlist Heart Icon Top Left */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2.5 left-2.5 w-7 h-7 rounded-full backdrop-blur-xs transition-all shadow-xs z-10 cursor-pointer flex items-center justify-center ${isWishlisted
            ? 'bg-[#D92670] text-white'
            : 'bg-white/90 text-stone-700 hover:bg-[#D92670] hover:text-white'
            }`}
          aria-label="Wishlist"
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-white' : ''}`} />
        </button>

        {/* Selected Color Badge overlay on bottom left of image */}
        {activeColor && (
          <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 bg-black/75 backdrop-blur-xs rounded-full text-[11px] font-semibold text-white flex items-center gap-1.5 shadow-xs pointer-events-none">
            <span
              className="w-2 h-2 rounded-full border border-white/60 flex-shrink-0"
              style={{ backgroundColor: activeColor.hex }}
            />
            <span className="truncate max-w-[110px]">{activeColor.name}</span>
          </div>
        )}
      </div>

      {/* Product Information Below Image */}
      <div className="pt-3 px-1 space-y-2">
        <Link href={productUrl} className="block">
          <h3 className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-1 group-hover:text-[#D92670] transition-colors">
            {product?.name}
          </h3>
        </Link>

        {/* Interactive Color Swatches Row */}
        {product?.colors && product.colors.length > 1 ? (
          <div className="flex items-center flex-nowrap gap-2 h-7 py-1.5 overflow-x-auto no-scrollbar w-full px-2">
            {product.colors.map((color) => {
              const isSelected = activeColor?.name === color.name;
              return (
                <button
                  key={color.name}
                  onClick={() => {
                    setActiveColor(color);
                    if (typeof color.imageIndex === 'number' && product.images[color.imageIndex]) {
                      setActiveImageIndex(color.imageIndex);
                    }
                  }}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-200 cursor-pointer flex-shrink-0 border border-stone-200/50 hover:scale-110 active:scale-95
                    ${isSelected
                      ? 'ring-2 ring-[#0C163A] ring-offset-2 scale-110 shadow-xs z-10'
                      : 'hover:border-stone-400'
                    }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              );
            })}
          </div>
        ) : (
          /* Placeholder spacer to align card heights perfectly when there are no swatches */
          <div className="h-7" aria-hidden="true" />
        )}

        {/* Price & SKU Code Row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-1">
            <span className="font-extrabold text-stone-900 text-sm sm:text-base">
              ৳ {product?.price}
            </span>
            {product?.originalPrice > product?.price && (
              <span className="text-[10px] sm:text-xs text-stone-400 line-through font-mono">
                ৳ {product?.originalPrice}
              </span>
            )}
          </div>


        </div>
      </div>
    </div>
  );
}

