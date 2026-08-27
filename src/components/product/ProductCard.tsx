'use client';

import React from 'react';
import Link from 'next/link';
import { SmartImage } from '@/components/ui/SmartImage';
import { Heart, ShoppingBag, ArrowRight, Star } from 'lucide-react';
import { Product, type ProductColor } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useToast } from '@/components/ui/Toast';

interface ProductCardProps {
  product: Product;
  /** Pre-select a color (e.g. deep-linking from search results). */
  selectedColor?: string;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1000&q=80';

/** Map a color onto the flat image list: explicit index first, then its own gallery. */
function resolveImageIndex(color: ProductColor | null, images: string[]): number {
  if (!color) return 0;
  if (typeof color.imageIndex === 'number' && images[color.imageIndex]) {
    return color.imageIndex;
  }
  if (color.images?.length && images.includes(color.images[0])) {
    return images.indexOf(color.images[0]);
  }
  return 0;
}

export function ProductCard({ product, selectedColor }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { trackEvent } = useAnalytics();
  const { showToast } = useToast();
  const isWishlisted = isInWishlist(product?.id);

  const sizesList = product?.sizes && product.sizes.length > 0 ? product.sizes : ['Free Size'];

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
  const [activeImageIndex, setActiveImageIndex] = React.useState<number>(() =>
    resolveImageIndex(initialColorObj, product?.images ?? [])
  );

  // Derived-state adjustment during render (no effect → no cascading renders):
  // when the incoming color changes — new product object or a deep-linked
  // selectedColor — re-sync the local selections from it.
  const [lastInitialColor, setLastInitialColor] = React.useState(initialColorObj);
  if (initialColorObj && lastInitialColor !== initialColorObj) {
    setLastInitialColor(initialColorObj);
    setActiveColor(initialColorObj);
    setActiveImageIndex(resolveImageIndex(initialColorObj, product?.images ?? []));
  }

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

  const currentImage = product?.images[activeImageIndex] || product?.images[0] || FALLBACK_IMAGE;

  const productUrl = activeColor
    ? `/product/${product?.slug}?color=${encodeURIComponent(activeColor.name)}`
    : `/product/${product?.slug}`;

  // Stock for the active color: variation matrix first, then the flat product stock.
  const activeColorStock = activeColor && product?.variations?.length
    ? product.variations
        .filter((v) => v.colorName === activeColor.name)
        .reduce((sum, v) => sum + (v.stock ?? 0), 0)
    : (product?.stock ?? 10);
  const isSoldOut = activeColorStock <= 0;

  const discountPct =
    product?.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const needsSizeChoice = sizesList.length > 1;

  /** One-size products add straight to cart; multi-size ones link to the page to pick a size. */
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSoldOut || needsSizeChoice || !product) return;

    const size = sizesList[0];
    addToCart(product, activeColor?.name || 'Standard', size, 1);
    trackEvent('add_to_cart', {
      productId: product.id,
      productName: product.name,
      price: product.price,
      color: activeColor?.name || 'Standard',
      size,
      quantity: 1
    });
    showToast({
      type: 'cart',
      title: 'Added to Cart',
      subtitle: `${product.name} · ${activeColor?.name || 'Standard'}`,
      image: currentImage,
      price: product.price,
      actionLink: '/cart',
      actionText: 'Checkout'
    });
  };

  return (
    <div className="group relative bg-white rounded-3xl border border-pink-100 p-2.5 sm:p-3 shadow-xs hover:shadow-lg hover:border-pink-200 transition-all h-full duration-300 flex flex-col overflow-hidden active:scale-[0.98]">
      {/* Top Image Container */}
      <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-stone-100">
        <Link href={productUrl} className="block relative w-full h-full" aria-label={product?.name}>
          <SmartImage
            src={currentImage}
            alt={product?.name}
            fill
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 20vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${isSoldOut ? 'grayscale-[0.6]' : ''}`}
          />
        </Link>

        {/* Status badges — top right, stacked so they never fight for width */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10 pointer-events-none">
          {isSoldOut && (
            <span className="px-2 py-0.5 bg-stone-900/85 text-white text-[9px] font-black uppercase tracking-wider rounded-full backdrop-blur-xs">
              Sold Out
            </span>
          )}
          {product?.isFlashSale && discountPct > 0 && (
            <span className="px-2 py-0.5 bg-[#9B050B] text-white text-[9px] font-black rounded-full shadow-sm">
              -{discountPct}%
            </span>
          )}
          {product?.isNewArrival && (
            <span className="px-2 py-0.5 bg-[#F2C76E] text-[#0C163A] text-[9px] font-black uppercase tracking-wider rounded-full shadow-sm">
              New
            </span>
          )}
          {product?.isBestSeller && !product?.isNewArrival && (
            <span className="px-2 py-0.5 bg-[#0C163A] text-[#F2C76E] text-[9px] font-black uppercase tracking-wider rounded-full shadow-sm">
              Best
            </span>
          )}
        </div>

        {/* Wishlist Heart — 40px touch target on every breakpoint */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2 left-2 w-10 h-10 rounded-full backdrop-blur-xs transition-all shadow-xs z-10 cursor-pointer flex items-center justify-center active:scale-90 ${isWishlisted
            ? 'bg-[#D92670] text-white'
            : 'bg-white/90 text-stone-700 hover:bg-[#D92670] hover:text-white'
            }`}
          aria-label={isWishlisted ? `Remove ${product?.name} from wishlist` : `Save ${product?.name} to wishlist`}
          aria-pressed={isWishlisted}
        >
          <Heart className={`w-[18px] h-[18px] ${isWishlisted ? 'fill-white' : ''}`} />
        </button>

        {/* Quick action — bottom right over the image.
            Mobile: always visible. Desktop: slides in on hover. */}
        {isSoldOut ? (
          <span className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-stone-200 text-stone-400 flex items-center justify-center z-10 cursor-not-allowed shadow-sm" title="Sold out">
            <ShoppingBag className="w-[18px] h-[18px]" />
          </span>
        ) : needsSizeChoice ? (
          <Link
            href={productUrl}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#0C163A]/90 hover:bg-[#0C163A] text-[#F2C76E] flex items-center justify-center z-10 shadow-md transition-all sm:opacity-0 sm:translate-y-1 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 active:scale-90 cursor-pointer"
            aria-label={`View ${product?.name} — pick a size`}
            title="Pick a size"
          >
            <ArrowRight className="w-[18px] h-[18px]" />
          </Link>
        ) : (
          <button
            onClick={handleQuickAdd}
            className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#D92670] hover:bg-[#C2185B] text-white flex items-center justify-center z-10 shadow-md transition-all sm:opacity-0 sm:translate-y-1 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 active:scale-90 cursor-pointer"
            aria-label={`Add ${product?.name} to cart`}
            title="Quick add to cart"
          >
            <ShoppingBag className="w-[18px] h-[18px]" />
          </button>
        )}

        {/* Selected Color chip — bottom left of image */}
        {activeColor && (
          <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-black/75 backdrop-blur-xs rounded-full text-[10px] font-semibold text-white flex items-center gap-1.5 shadow-xs pointer-events-none z-[5] max-w-[70%]">
            <span
              className="w-2 h-2 rounded-full border border-white/60 flex-shrink-0"
              style={{ backgroundColor: activeColor.hex }}
            />
            <span className="truncate">{activeColor.name}</span>
          </div>
        )}
      </div>

      {/* Product Information Below Image */}
      <div className="pt-2.5 px-1 pb-0.5 flex flex-col gap-1.5 flex-1">
        <Link href={productUrl} className="block">
          <h3 className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-1 group-hover:text-[#D92670] transition-colors leading-snug">
            {product?.name}
          </h3>
        </Link>

        {/* Rating — compact single-star + score, only when there's data */}
        {(product?.rating > 0 || product?.reviewCount > 0) && (
          <div className="flex items-center gap-1 text-[10px] text-stone-500">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
            <span className="font-bold text-stone-700">{(product?.rating || 0).toFixed(1)}</span>
            {product?.reviewCount > 0 && <span className="text-stone-400">({product.reviewCount})</span>}
          </div>
        )}

        {/* Interactive Color Swatches Row (fixed height keeps grids aligned) */}
        {product?.colors && product.colors.length > 1 ? (
          <div className="flex items-center flex-nowrap gap-2.5 h-7 py-1 overflow-x-auto no-scrollbar w-full px-0.5" role="group" aria-label="Available colors">
            {product.colors.map((color) => {
              const isSelected = activeColor?.name === color.name;
              return (
                <button
                  key={color.name}
                  onClick={() => {
                    setActiveColor(color);
                    const images = product.images ?? [];
                    if (typeof color.imageIndex === 'number' && images[color.imageIndex]) {
                      setActiveImageIndex(color.imageIndex);
                    } else if (color.images?.length && images.includes(color.images[0])) {
                      setActiveImageIndex(images.indexOf(color.images[0]));
                    }
                  }}
                  aria-label={`Color: ${color.name}`}
                  aria-pressed={isSelected}
                  className={`relative w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-200 cursor-pointer flex-shrink-0 after:content-[''] after:absolute after:-inset-1.5 after:rounded-full border border-stone-200/50 hover:scale-110 active:scale-95
                    ${isSelected
                      ? 'ring-2 ring-[#0C163A] ring-offset-2 scale-110 shadow-xs z-10 bg-white'
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

        {/* Price Row — price, old price, save pill */}
        <div className="flex items-center justify-between gap-1 mt-auto pt-0.5">
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="font-extrabold text-stone-900 text-sm sm:text-base">
              ৳ {product?.price}
            </span>
            {product?.originalPrice > product?.price && (
              <span className="text-[10px] sm:text-xs text-stone-400 line-through font-mono shrink-0">
                ৳ {product?.originalPrice}
              </span>
            )}
          </div>
          {!product?.isFlashSale && discountPct >= 10 && (
            <span className="px-1.5 py-0.5 bg-[#D92670]/10 text-[#D92670] text-[9px] font-black rounded-md shrink-0">
              -{discountPct}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
