'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SmartImage } from '@/components/ui/SmartImage';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Star,
  Heart,
  ShoppingBag,
  Zap,
  ChevronRight,
  Maximize2,
  Sparkles,
  Plus,
  Minus,
  ZoomIn,
  Truck,
  Check,
  X,
  Share2,
  Banknote,
  RefreshCcw,
  Shirt,
  Droplets
} from 'lucide-react';
import { Product } from '@/data/products';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useToast } from '@/components/ui/Toast';
import { getProductSchema, getBreadcrumbSchema } from '@/lib/schema';
import { ProductZoomModal } from '@/components/product/ProductZoomModal';
import { NewArrivalSection } from '@/components/home/NewArrivalSection';



export default function ProductDetailClient({ initialProduct }: { initialProduct: Product }) {
  const searchParams = useSearchParams();
  const colorQueryParam = searchParams.get('color');
  const sizeQueryParam = searchParams.get('size');
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist, products, user } = useCart();
  const { trackEvent } = useAnalytics();
  const { showToast } = useToast();

  // The server resolved this product (and 404'd if it did not exist), so it is
  // always the FULL document — description, features, reviews. Context copies
  // come from the slim card list (see serializeProductCard) and would lose the
  // prose, so the server doc is used as-is.
  const product: Product = initialProduct;

  const colorsList = product?.colors && product.colors.length > 0
    ? product.colors
    : [{ name: 'Standard', hex: '#000000' }];

  const imagesList = product?.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=800&q=80'];

  const [selectedColor, setSelectedColor] = useState(() => {
    if (colorQueryParam && colorsList) {
      const colorObj = colorsList.find((c) => c.name.toLowerCase() === colorQueryParam.toLowerCase());
      if (colorObj) return colorObj.name;
      const matchedVar = product?.variations?.find((v) => v.colorName.toLowerCase() === colorQueryParam.toLowerCase());
      if (matchedVar) return matchedVar.colorName;
    }
    return colorsList[0]?.name || 'Standard';
  });

  const sizesList = useMemo(() => {
    if (product?.variations && product.variations.length > 0) {
      const varSizes = product.variations
        .filter((v) => v.colorName.toLowerCase() === selectedColor.toLowerCase())
        .map((v) => v.size)
        .filter(Boolean);
      if (varSizes.length > 0) {
        return Array.from(new Set(varSizes));
      }
    }
    return product?.sizes && product.sizes.length > 0 ? product.sizes : ['Free Size'];
  }, [product?.variations, product?.sizes, selectedColor]);

  const [selectedSize, setSelectedSize] = useState(() => {
    if (sizeQueryParam && sizesList.includes(sizeQueryParam)) {
      return sizeQueryParam;
    }
    return sizesList[0] || 'Free Size';
  });

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Mouse Hover Image Zoom Lens State
  const [isHovering, setIsHovering] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  };

  // Active Variation Price & Stock Lookup
  const activeVariation = product?.variations?.find(
    (v) => v.colorName === selectedColor && v.size === selectedSize
  );

  const currentPrice = activeVariation?.price ?? activeVariation?.priceOverride ?? product?.price ?? 0;
  const currentStock = activeVariation?.stock ?? product?.stock ?? 10;
  const isOutOfStock = currentStock <= 0;

  // Per-size stock for the selected color (only when a variation matrix exists)
  const stockForSize = (colorName: string, size: string): number | undefined =>
    product?.variations?.find(
      (v) => v.colorName.toLowerCase() === colorName.toLowerCase() && v.size === size
    )?.stock;

  const ratingValue = product?.rating || 0;

  // 1. When user selects a color -> auto select corresponding product image
  const handleSelectColor = (colorName: string) => {
    setSelectedColor(colorName);

    let matchedImgIdx = -1;

    // A. Check variations matrix first for imageUrl match
    const matchedVar = product?.variations?.find(
      (v) => v.colorName.toLowerCase() === colorName.toLowerCase() && v.imageUrl
    );
    if (matchedVar && matchedVar.imageUrl) {
      matchedImgIdx = imagesList.findIndex((img) => img === matchedVar.imageUrl);
    }

    // B. Check colors list for imageIndex or images array
    if (matchedImgIdx === -1) {
      const colorObj = colorsList.find((c) => c.name.toLowerCase() === colorName.toLowerCase());
      if (colorObj) {
        if (typeof colorObj.imageIndex === 'number' && imagesList[colorObj.imageIndex]) {
          matchedImgIdx = colorObj.imageIndex;
        } else if ((colorObj as { images?: string[] }).images && ((colorObj as { images?: string[] }).images?.length ?? 0) > 0) {
          const firstColorImg = (colorObj as { images?: string[] }).images?.[0];
          matchedImgIdx = imagesList.findIndex((img) => img === firstColorImg);
        }
      }
    }

    // C. Fallback: match by index order
    if (matchedImgIdx === -1) {
      const colorIdx = colorsList.findIndex((c) => c.name.toLowerCase() === colorName.toLowerCase());
      if (colorIdx !== -1 && imagesList[colorIdx]) {
        matchedImgIdx = colorIdx;
      }
    }

    if (matchedImgIdx !== -1) {
      setSelectedImageIndex(matchedImgIdx);
    }

    // Compute available sizes for the new color synchronously
    const newColorSizes = product?.variations && product.variations.length > 0
      ? Array.from(new Set(product.variations.filter((v) => v.colorName.toLowerCase() === colorName.toLowerCase()).map((v) => v.size).filter(Boolean)))
      : (product?.sizes && product.sizes.length > 0 ? product.sizes : ['Free Size']);

    let nextSize = selectedSize;
    if (newColorSizes.length > 0 && !newColorSizes.includes(selectedSize)) {
      nextSize = newColorSizes[0];
      setSelectedSize(nextSize);
    } else if (product?.variations?.length) {
      const selStock = stockForSize(colorName, selectedSize);
      if (selStock !== undefined && selStock <= 0) {
        const fallback = newColorSizes.find((s) => {
          const st = stockForSize(colorName, s);
          return st === undefined || st > 0;
        });
        if (fallback) {
          nextSize = fallback;
          setSelectedSize(fallback);
        }
      }
    }

    // Update URL parameter dynamically without full page reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('color', colorName);
      if (nextSize) url.searchParams.set('size', nextSize);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleSelectSize = (sz: string) => {
    setSelectedSize(sz);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('color', selectedColor);
      url.searchParams.set('size', sz);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // 2. When user selects/opens a different thumbnail image -> auto select corresponding color
  const handleSelectImageIndex = (imgIdx: number) => {
    setSelectedImageIndex(imgIdx);
    const targetImgUrl = imagesList[imgIdx];

    let matchedColorName: string | null = null;

    // A. Check variations matrix for matching imageUrl
    if (targetImgUrl && product?.variations) {
      const matchedVar = product.variations.find((v) => v.imageUrl === targetImgUrl);
      if (matchedVar && matchedVar.colorName) {
        matchedColorName = matchedVar.colorName;
      }
    }

    // B. Check colors list for matching imageIndex or images array
    if (!matchedColorName && colorsList) {
      const colorObj = colorsList.find((c) => {
        if (typeof c.imageIndex === 'number' && c.imageIndex === imgIdx) return true;
        if ((c as { images?: string[] }).images && Array.isArray((c as { images?: string[] }).images) && (c as { images?: string[] }).images?.includes(targetImgUrl)) return true;
        return false;
      });
      if (colorObj) {
        matchedColorName = colorObj.name;
      }
    }

    // C. Fallback: match by index if colorsList has an item at this index
    if (!matchedColorName && colorsList && colorsList[imgIdx]) {
      matchedColorName = colorsList[imgIdx].name;
    }

    if (matchedColorName) {
      setSelectedColor(matchedColorName);

      // Update URL parameter dynamically without full page reload
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('color', matchedColorName);
        window.history.replaceState({}, '', url.toString());
      }
    }
  };

  // Modals & UI States
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);

  // Review Form State
  const [newReview, setNewReview] = useState({ author: '', rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  // Storefront shows approved reviews only — pending ones wait in the admin queue.
  const [reviewsList, setReviewsList] = useState(
    (product?.reviewsList || []).filter((r) => (r.status ?? 'approved') === 'approved')
  );

  // Sync review author name when user profile is loaded from session
  useEffect(() => {
    if (user?.name) {
      Promise.resolve().then(() => {
        setNewReview((prev) => ({ ...prev, author: user.name }));
      });
    }
  }, [user]);

  // Lock body scroll while any owned modal is open
  useEffect(() => {
    const anyOpen = isWriteReviewOpen || isLightboxOpen;
    document.body.style.overflow = anyOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isWriteReviewOpen, isLightboxOpen]);

  // Escape closes owned modals (zoom modal handles its own)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsWriteReviewOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingReview) return;

    setIsSubmittingReview(true);
    setReviewError(null);
    try {
      const res = await fetch(`/api/products/${product?.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newReview,
          email: user?.email || '',
          phone: user?.phone || '',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setReviewError(data.error || 'Could not submit the review.');
        return;
      }
      setReviewSubmitted(true);
      setNewReview({ author: '', rating: 5, comment: '' });
      setTimeout(() => {
        setReviewSubmitted(false);
        setIsWriteReviewOpen(false);
      }, 2500);
    } catch {
      setReviewError('Network error — please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'specs' | 'care' | 'shipping' | 'reviews'>('specs');
  const tabsRef = useRef<HTMLDivElement>(null);

  const jumpToReviews = () => {
    setActiveTab('reviews');
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Trigger Write Review Modal if query param is set
  const writeReviewParam = searchParams.get('writeReview');
  useEffect(() => {
    if (writeReviewParam === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab('reviews');
      setIsWriteReviewOpen(true);
    }
  }, [writeReviewParam]);

  const isWishlisted = isInWishlist(product?.id || '');

  useEffect(() => {
    if (product) {
      trackEvent('view_item', {
        productId: product.id,
        productName: product.name,
        price: product.price,
        category: product.category
      });
    }
  }, [product, trackEvent]);

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;
    addToCart(product, selectedColor, selectedSize, quantity);
    trackEvent('add_to_cart', {
      productId: product.id,
      productName: product.name,
      price: product.price,
      color: selectedColor,
      size: selectedSize,
      quantity
    });

    showToast({
      type: 'cart',
      title: 'Added to Cart',
      subtitle: `${product.name} (Code: ${product.code})`,
      image: imagesList[selectedImageIndex] || imagesList[0],
      price: product.price * quantity,
      actionLink: '/cart',
      actionText: 'Checkout'
    });
  };

  const handleBuyNow = () => {
    if (!product || isOutOfStock) return;
    trackEvent('begin_checkout', {
      source: 'buy_now_button',
      productId: product.id,
      price: product.price * quantity
    });
    // Navigate with buyNow params — checkout uses ONLY this item, cart untouched.
    const params = new URLSearchParams({
      buyNow: product.id,
      color: selectedColor,
      size: selectedSize,
      qty: String(quantity),
    });
    router.push(`/checkout?${params.toString()}`);
  };

  const handleShare = async () => {
    if (typeof window === 'undefined' || !product) return;
    const url = window.location.href;
    trackEvent('view_item', { source: 'share', productId: product.id, productName: product.name });

    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: `${product.name} — Falak Closet`, url });
      } catch {
        /* user dismissed the share sheet */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showToast({
          type: 'info',
          title: 'Link Copied',
          subtitle: 'Share this design with your friends',
        });
      } catch {
        /* clipboard unavailable */
      }
    }
  };

  const productSchema = getProductSchema(product);
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
    { name: product?.category || 'Category', url: `/shop?category=${encodeURIComponent(product?.category || '')}` },
    { name: product?.name || 'Product', url: `/product/${product?.slug || ''}` }
  ]);

  const isOneSize = sizesList.length === 1 && /free/i.test(String(sizesList[0]));

  const TABS: { id: typeof activeTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'specs', label: 'Specifications', icon: Sparkles },
    { id: 'care', label: 'Garment Care', icon: Droplets },
    { id: 'shipping', label: 'Shipping & Returns', icon: Truck },
    { id: 'reviews', label: `Reviews (${reviewsList.length})`, icon: Star }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-8 sm:space-y-12 pb-44 lg:pb-12 text-stone-900">
      {/* Dynamic SEO Schemas */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px] sm:text-xs text-stone-500">
        <Link href="/" className="hover:text-[#A80C14] transition-colors shrink-0">Home</Link>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <Link href="/shop" className="hover:text-[#A80C14] transition-colors shrink-0">Shop</Link>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <Link
          href={`/shop?category=${encodeURIComponent(product?.category || '')}`}
          className="hover:text-[#A80C14] transition-colors truncate max-w-[100px] sm:max-w-none"
        >
          {product?.category}
        </Link>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <span className="text-stone-900 font-semibold truncate max-w-[120px] sm:max-w-[200px]">
          {product?.name}
        </span>
      </nav>

      {/* Product Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
        {/* Left: Gallery (thumbnails below on mobile, rail on left for desktop) */}
        <div className="lg:col-span-7 flex flex-col-reverse lg:flex-row gap-3 lg:gap-4">
          {/* Thumbnail Strip */}
          {imagesList.length > 1 && (
            <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto lg:max-h-[520px] xl:max-h-[620px] pb-2 lg:pb-0 no-scrollbar flex-shrink-0 w-full lg:w-20 snap-x snap-mandatory lg:snap-none">
              {imagesList.map((img, idx) => {
                const mappedColor = colorsList.find(
                  (c) => c.imageIndex === idx || ((c as { images?: string[] }).images && (c as { images?: string[] }).images?.includes(img))
                ) || (colorsList[idx] ? colorsList[idx] : null);

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectImageIndex(idx)}
                    aria-label={`View image ${idx + 1} of ${imagesList.length}`}
                    aria-current={selectedImageIndex === idx}
                    className={`relative w-[68px] h-[84px] sm:w-20 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 snap-start border-2 transition-all cursor-pointer group/thumb ${selectedImageIndex === idx
                      ? 'border-[#A80C14] ring-2 ring-[#F8D2D5] scale-[1.03]'
                      : 'border-transparent opacity-70 hover:opacity-100 active:scale-95'
                      }`}
                  >
                    <SmartImage src={img} alt={`Thumbnail ${idx + 1}`} fill sizes="96px" className="object-cover" />
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

          {/* Main Gallery Image */}
          <div
            onClick={() => setIsLightboxOpen(true)}
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
            className="relative aspect-[4/5] w-full sm:aspect-[3/4] rounded-3xl overflow-hidden bg-stone-100 border border-[#F8D2D5] shadow-md group cursor-pointer flex-grow"
          >
            <SmartImage
              src={imagesList[selectedImageIndex] || imagesList[0]}
              alt={product?.name || 'Product Image'}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              style={
                isHovering
                  ? {
                    transform: 'scale(2.4)',
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transition: 'transform 0.08s ease-out'
                  }
                  : {
                    transform: 'scale(1)',
                    transition: 'transform 0.3s ease-out'
                  }
              }
              className="object-cover pointer-events-none"
            />

            {product?.isFlashSale && (
              <span className="absolute top-3 left-3 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-[#A80C14] text-white font-black text-[10px] sm:text-xs uppercase tracking-wider rounded-xl shadow-md z-10">
                -{product?.discountPercentage}% OFF
              </span>
            )}

            {/* Image position badge (mobile) */}
            <span className="md:hidden absolute bottom-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold font-mono rounded-full z-10 pointer-events-none">
              {selectedImageIndex + 1}/{imagesList.length}
            </span>

            {/* Hover Zoom Hint Badge (desktop pointer devices) */}
            <div className="absolute bottom-4 left-4 px-3.5 py-1.5 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold rounded-xl hidden md:flex items-center gap-1.5 pointer-events-none z-10 opacity-80 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-3.5 h-3.5 text-[#F2C76E]" />
              <span>Hover cursor to zoom details</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
              className="absolute top-3 right-3 p-2.5 bg-stone-900/70 hover:bg-stone-900 text-white rounded-full backdrop-blur-xs transition-all shadow-md cursor-pointer z-20 active:scale-90"
              title="Fullscreen Zoom"
              aria-label="Open fullscreen zoom"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Details & Purchase Form */}
        <div className="lg:col-span-5 space-y-5 lg:space-y-6">
          {/* Title, rating & quick actions */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {/* Eyebrow: category + code + flags */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Link
                  href={`/shop?category=${encodeURIComponent(product?.category || '')}`}
                  className="px-2.5 py-1 rounded-full bg-[#FFF0F6] border border-[#F8D2D5] text-[10px] font-bold text-[#A80C14] hover:bg-[#FDF2F3] transition-colors"
                >
                  {product?.category}
                </Link>
                {product?.code && (
                  <span className="px-2 py-0.5 rounded-md bg-stone-100 text-[10px] font-mono text-stone-500">
                    Code: {product.code}
                  </span>
                )}
                {product?.isNewArrival && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-black uppercase tracking-wider">New</span>
                )}
                {product?.isBestSeller && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase tracking-wider">Bestseller</span>
                )}
              </div>

              <h1 className="font-sans text-[22px] leading-tight sm:text-3xl lg:text-4xl font-extrabold text-stone-900 mt-2">
                {product?.name}
              </h1>

              <button
                onClick={jumpToReviews}
                className="flex flex-wrap items-center gap-2 mt-2 cursor-pointer group/rating"
              >
                <div className="flex text-amber-400 gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFull = star <= Math.floor(ratingValue);
                    const isHalf = !isFull && star - 0.5 <= ratingValue;
                    return (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${isFull
                          ? 'fill-amber-400 text-amber-400'
                          : isHalf
                            ? 'fill-amber-400/50 text-amber-400'
                            : 'text-stone-300'
                          }`}
                      />
                    );
                  })}
                </div>
                <span className="text-xs font-bold text-stone-800 font-mono">
                  {ratingValue.toFixed(1)} / 5.0
                </span>
                <span className="text-xs text-stone-400 font-medium group-hover/rating:text-[#A80C14] underline-offset-2 group-hover/rating:underline transition-colors">
                  ({reviewsList.length} review{reviewsList.length === 1 ? '' : 's'})
                </span>
              </button>
            </div>

            {/* Quick actions: wishlist + share */}
            <div className="flex flex-col gap-2 pt-0.5 shrink-0">
              <button
                onClick={() => toggleWishlist(product)}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-90 ${isWishlisted ? 'bg-[#FDF2F3] border-[#A80C14] text-[#A80C14]' : 'border-stone-200 text-stone-400 hover:text-[#A80C14] hover:border-[#F8D2D5]'
                  }`}
              >
                <Heart className={`w-[18px] h-[18px] ${isWishlisted ? 'fill-[#A80C14]' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                aria-label="Share this product"
                className="w-10 h-10 rounded-full border border-stone-200 text-stone-400 hover:text-[#A80C14] hover:border-[#F8D2D5] flex items-center justify-center transition-all cursor-pointer active:scale-90"
              >
                <Share2 className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>

          {/* Pricing & Stock Card (stacks mobile-first, row on desktop) */}
          <div className="p-4 sm:p-5 bg-[#FFF0F6] rounded-3xl border border-[#F8D2D5]/80 shadow-xs flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-[26px] sm:text-3xl font-extrabold text-stone-900 leading-none">
                  {formatCurrency(currentPrice)}
                </span>
                {product?.originalPrice && product.originalPrice > currentPrice && (
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs sm:text-sm text-stone-400 line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                    <span className="px-2 py-0.5 bg-[#A80C14]/10 text-[#A80C14] text-[10px] font-black rounded-md shrink-0">
                      SAVE {Math.round(((product.originalPrice - currentPrice) / product.originalPrice) * 100)}%
                    </span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 mt-1.5">
                Variation: <span className="font-bold text-[#A80C14]">{selectedColor} / {selectedSize}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {product?.freeDeliveryQuantity && product.freeDeliveryQuantity > 0 && (
                <span className="bg-[#A80C14]/10 text-[#A80C14] border border-[#A80C14]/20 px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 shrink-0">
                  <Truck className="w-3.5 h-3.5 shrink-0" />
                  <span>Free Delivery @ {product.freeDeliveryQuantity}+ pcs</span>
                </span>
              )}

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] sm:text-xs font-bold rounded-xl shrink-0 ${isOutOfStock ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                <span className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                {isOutOfStock ? 'Out of Stock' : `In Stock (${currentStock} left)`}
              </span>
            </div>
          </div>

          {/* Color Variation Swatches */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-700">
                Color: <span className="text-[#A80C14] normal-case tracking-normal">{selectedColor}</span>
              </label>
              <span className="text-[11px] text-stone-400 font-medium">{colorsList.length} available</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {colorsList.map((col) => {
                const isSelected = selectedColor === col.name;
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => handleSelectColor(col.name)}
                    aria-pressed={isSelected}
                    className={`flex items-center gap-2 pl-2 pr-3.5 min-h-[40px] rounded-full border text-xs font-bold transition-all cursor-pointer active:scale-95 ${isSelected
                      ? 'border-[#A80C14] bg-[#A80C14] text-white shadow-xs'
                      : 'border-stone-200 text-stone-700 hover:border-[#F8D2D5] bg-white'
                      }`}
                  >
                    <span className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-white/60' : 'border-stone-300'}`} style={{ backgroundColor: col.hex }}>
                      {isSelected && <Check className="w-3 h-3 text-white drop-shadow" />}
                    </span>
                    <span>{col.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <label className="font-bold uppercase tracking-wider text-stone-700">
                Size: <span className="text-[#A80C14] normal-case tracking-normal">{selectedSize}</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              {sizesList.map((sz) => {
                const sizeStock = stockForSize(selectedColor, sz);
                const isSoldOut = sizeStock !== undefined && sizeStock <= 0;
                const isSelected = selectedSize === sz;
                return (
                  <button
                    key={sz}
                    title={`${sz} (Stock: ${sizeStock})`}
                    type="button"
                    onClick={() => handleSelectSize(sz)}
                    disabled={isSoldOut}
                    aria-pressed={isSelected}
                    className={`min-w-[52px] h-11 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center cursor-pointer ${isSelected
                      ? 'border-[#A80C14] bg-[#A80C14] text-white shadow-xs scale-[1.03]'
                      : isSoldOut
                        ? 'border-stone-200 text-stone-300 line-through cursor-not-allowed bg-stone-50'
                        : 'border-stone-200 text-stone-800 hover:bg-[#FDF2F3] active:scale-95'
                      }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-700">
                Quantity
              </label>
              <span className="text-[11px] text-stone-400 font-medium">Available: {currentStock}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-stone-50 border border-stone-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 rounded-full bg-white text-stone-800 font-bold flex items-center justify-center shadow-xs border border-stone-200 hover:bg-[#FDF2F3] active:scale-90 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <span className="w-8 text-center font-bold text-stone-900 font-mono text-base" aria-live="polite">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.min(currentStock, prev + 1))}
                  disabled={quantity >= currentStock}
                  className="w-10 h-10 rounded-full bg-white text-stone-800 font-bold flex items-center justify-center shadow-xs border border-stone-200 hover:bg-[#FDF2F3] active:scale-90 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Subtotal</span>
                <span className="font-extrabold text-[#A80C14] font-mono text-base">
                  {formatCurrency(currentPrice * quantity)}
                </span>
              </div>
            </div>
          </div>

          {/* Free Delivery Progress */}
          {product?.freeDeliveryQuantity && product.freeDeliveryQuantity > 0 && (
            <div className="text-xs font-bold font-sans">
              {quantity >= product.freeDeliveryQuantity ? (
                <p className="text-emerald-700 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                  <Truck className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>🎉 FREE delivery unlocked on this order!</span>
                </p>
              ) : (
                <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-xl space-y-1.5">
                  <p className="text-stone-500 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-stone-400 shrink-0" />
                    <span>Buy {product.freeDeliveryQuantity - quantity} more to unlock FREE delivery</span>
                  </p>
                  {/* Progress toward the free-delivery milestone */}
                  <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (quantity / product.freeDeliveryQuantity) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons — hidden on mobile (sticky purchase bar handles it) */}
          <div className="hidden md:block space-y-3 pt-1">
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 py-3.5 px-6 bg-stone-900 hover:bg-stone-700 disabled:bg-stone-400 disabled:cursor-not-allowed text-white text-xs lg:text-sm font-bold rounded-full transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="flex-1 py-3.5 px-6 bg-[#A80C14] hover:bg-[#8C0A10] disabled:bg-stone-300 disabled:cursor-not-allowed disabled:text-stone-500 text-white text-xs lg:text-sm font-extrabold rounded-full transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Buy Now</span>
              </button>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="flex flex-col items-center gap-1 rounded-2xl border border-stone-200/80 bg-white px-1.5 py-3 text-center">
              <Banknote className="w-[18px] h-[18px] text-[#A80C14] shrink-0" />
              <span className="text-[10px] font-bold text-stone-600 leading-tight">Cash on<br />Delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-2xl border border-stone-200/80 bg-white px-1.5 py-3 text-center">
              <RefreshCcw className="w-[18px] h-[18px] text-[#A80C14] shrink-0" />
              <span className="text-[10px] font-bold text-stone-600 leading-tight">30-Day<br />Returns</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-2xl border border-stone-200/80 bg-white px-1.5 py-3 text-center">
              <Truck className="w-[18px] h-[18px] text-[#A80C14] shrink-0" />
              <span className="text-[10px] font-bold text-stone-600 leading-tight">Fast<br />Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specification & Review Tabs */}
      <div ref={tabsRef} className="pt-6 sm:pt-8 border-t border-[#F8D2D5] space-y-5 sm:space-y-6 scroll-mt-20">
        <div
          className="flex gap-1 overflow-x-auto no-scrollbar flex-nowrap w-full border-b border-[#F8D2D5]"
          role="tablist"
          aria-label="Product information"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 pb-3 pt-1.5 px-3 sm:px-4 text-[11px] sm:text-sm font-bold border-b-2 -mb-px transition-all cursor-pointer ${isActive
                  ? 'border-[#A80C14] text-[#A80C14]'
                  : 'border-transparent text-stone-400 hover:text-stone-600'
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'fill-current' : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'specs' && (
          <div role="tabpanel" className="p-4 sm:p-6 bg-white rounded-3xl border border-[#F8D2D5] space-y-4 text-xs sm:text-sm leading-relaxed">
            <div className="flex items-center gap-2">
              <Shirt className="w-4 h-4 text-[#A80C14]" />
              <h3 className="font-bold text-base sm:text-lg text-[#A80C14]">Fabric &amp; Craftsmanship</h3>
            </div>
            <p className="text-stone-600">{product?.description || 'Luxury modest fashion item.'}</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-stone-600 pt-1">
              {(product?.features || ['Premium tailoring', 'Soft luxury fabric']).map((feat, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#A80C14] shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            {/* Quick attribute chips */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-stone-100">
              {[
                { label: 'Material', value: product?.material },
                { label: 'Work', value: product?.workType },
                { label: 'Occasion', value: product?.occasion },
                { label: 'Weather', value: product?.weather }
              ].filter((a) => a.value).map((attr) => (
                <span key={attr.label} className="px-3 py-1.5 rounded-full bg-[#FFF0F6] border border-[#F8D2D5] text-[10px] font-bold text-stone-600">
                  <span className="text-stone-400 uppercase tracking-wide mr-1">{attr.label}:</span> {attr.value}
                </span>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'care' && (
          <div role="tabpanel" className="p-4 sm:p-6 bg-white rounded-3xl border border-[#F8D2D5] space-y-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-[#A80C14]" />
              <h3 className="font-bold text-base sm:text-lg text-[#A80C14]">Garment Care Instructions</h3>
            </div>
            <ul className="space-y-2 text-stone-600">
              {(product?.careInstructions || ['Dry clean recommended', 'Steam iron low heat']).map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#A80C14] shrink-0 mt-0.5" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div role="tabpanel" className="p-4 sm:p-6 bg-white rounded-3xl border border-[#F8D2D5] space-y-4 text-xs sm:text-sm text-stone-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#A80C14]" />
              <h3 className="font-bold text-base sm:text-lg text-[#A80C14]">Express Logistics</h3>
            </div>
            <p>Fast delivery across Bangladesh. Easy returns and exchanges within 30 days.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex items-start gap-2 bg-stone-50 border border-stone-100 rounded-2xl p-3">
                <Truck className="w-4 h-4 text-[#A80C14] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-stone-800 text-xs">Inside Dhaka</p>
                  <p className="text-[11px] text-stone-500">1–2 business days</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-stone-50 border border-stone-100 rounded-2xl p-3">
                <Truck className="w-4 h-4 text-[#A80C14] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-stone-800 text-xs">Outside Dhaka</p>
                  <p className="text-[11px] text-stone-500">2–4 business days</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-stone-50 border border-stone-100 rounded-2xl p-3">
                <RefreshCcw className="w-4 h-4 text-[#A80C14] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-stone-800 text-xs">Easy Returns</p>
                  <p className="text-[11px] text-stone-500">Within 30 days</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (() => {
          const totalReviewsCount = reviewsList.length;
          const avgRatingVal = totalReviewsCount > 0
            ? Math.round((reviewsList.reduce((sum, r) => sum + r.rating, 0) / totalReviewsCount) * 10) / 10
            : 0;

          const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          reviewsList.forEach((r) => {
            const rounded = Math.min(5, Math.max(1, Math.round(r.rating))) as 5 | 4 | 3 | 2 | 1;
            ratingCounts[rounded]++;
          });

          return (
            <div role="tabpanel" className="space-y-5 sm:space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold text-base sm:text-lg text-stone-900">
                  Customer Ratings &amp; Feedback
                </h3>
                <button
                  onClick={() => setIsWriteReviewOpen(true)}
                  className="px-4 py-2.5 min-h-[40px] bg-[#A80C14] text-white font-bold text-xs rounded-full hover:bg-[#8C0A10] active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  Write a Review
                </button>
              </div>

              {/* Reviews Statistics Widget */}
              {totalReviewsCount > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 p-4 sm:p-6 bg-stone-50 rounded-3xl border border-[#F8D2D5]/50">
                  {/* Left: Overall Rating */}
                  <div className="md:col-span-4 flex md:flex-col items-center justify-center text-center p-2 md:p-4 border-b md:border-b-0 md:border-r border-stone-200/60 gap-3 md:gap-0">
                    <div className="text-4xl sm:text-5xl font-black text-stone-900 font-mono">
                      {avgRatingVal.toFixed(1)}
                    </div>
                    <div className="flex text-amber-400 gap-0.5 md:mt-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFull = star <= Math.floor(avgRatingVal);
                        const isHalf = !isFull && star - 0.5 <= avgRatingVal;
                        return (
                          <Star
                            key={star}
                            className={`w-4 h-4 sm:w-5 sm:h-5 ${isFull
                              ? 'fill-amber-400 text-amber-400'
                              : isHalf
                                ? 'fill-amber-400/50 text-amber-400'
                                : 'text-stone-300'
                              }`}
                          />
                        );
                      })}
                    </div>
                    <p className="text-xs text-stone-500 font-medium md:mt-3">
                      Based on {totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'}
                    </p>
                    <p className="text-[11px] text-[#A80C14] font-bold md:mt-1">
                      100% Verified Purchases
                    </p>
                  </div>

                  {/* Right: Breakdown Progress Bars */}
                  <div className="md:col-span-8 flex flex-col justify-center space-y-2.5 px-0 md:px-4">
                    {([5, 4, 3, 2, 1] as const).map((stars) => {
                      const count = ratingCounts[stars];
                      const percentage = totalReviewsCount > 0 ? (count / totalReviewsCount) * 100 : 0;
                      return (
                        <div key={stars} className="flex items-center gap-2 sm:gap-3 text-xs font-semibold text-stone-700">
                          <span className="w-10 text-right shrink-0">{stars} star</span>
                          <div className="flex-1 h-2.5 sm:h-3 bg-stone-200/70 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#A80C14] rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-14 text-left text-stone-500 font-mono text-[11px] shrink-0">
                            {Math.round(percentage)}% ({count})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {reviewsList.length === 0 && (
                <div className="p-6 sm:p-8 bg-white rounded-2xl border border-dashed border-[#F8D2D5] text-center space-y-1.5">
                  <Star className="w-6 h-6 text-stone-300 mx-auto" />
                  <p className="text-xs font-bold text-stone-900">No reviews yet</p>
                  <p className="text-[11px] text-stone-500">Be the first to share your experience with this piece.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {reviewsList.map((rev) => (
                  <div key={rev.id} className="p-4 sm:p-5 bg-white rounded-2xl border border-[#F8D2D5] space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-7 h-7 rounded-full bg-[#FFF0F6] border border-[#F8D2D5] text-[#A80C14] font-black text-[11px] flex items-center justify-center shrink-0">
                          {rev.author.trim().charAt(0).toUpperCase() || '?'}
                        </span>
                        <span className="font-bold text-stone-900 truncate">{rev.author}</span>
                        {rev.verifiedPurchase && (
                          <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold rounded shrink-0">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 shrink-0">{rev.date}</span>
                    </div>
                    <div className="flex text-amber-400 gap-0.5">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-stone-600 italic leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* New Arrivals Product Carousel */}
      <NewArrivalSection place='product_details'
        products={products.filter((p) => p.id !== product.id)}
        title="YOU MAY ALSO LIKE / NEW ARRIVALS"
        subtitle="Explore more of our latest modest fashion creations"
      />

      {/* Write a Review Modal — bottom sheet on mobile, centered dialog on desktop */}
      {isWriteReviewOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Write a review"
          onClick={(e) => e.target === e.currentTarget && setIsWriteReviewOpen(false)}
        >
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in mb-[calc(66px+env(safe-area-inset-bottom))] sm:mb-0">
            <div className="shrink-0 bg-white border-b border-stone-100 px-5 py-4 flex items-center justify-between z-10">
              <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900">Write a Review</h3>
              <button
                onClick={() => setIsWriteReviewOpen(false)}
                className="p-2 -mr-2 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer active:scale-90"
                aria-label="Close review form"
              >
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">

              {!user ? (
                <div className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-[#FDF2F3] text-[#A80C14] rounded-full flex items-center justify-center mx-auto">
                    <Star className="w-6 h-6 fill-current" />
                  </div>
                  <h4 className="font-bold text-base text-stone-900 font-sans">Sign In Required</h4>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Only customers who have purchased and received delivery of this product can write a review. Please sign in to verify your purchase.
                  </p>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsWriteReviewOpen(false)}
                      className="flex-1 py-3 min-h-[44px] bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <Link
                      href="/account"
                      className="flex-1 py-3 min-h-[44px] bg-[#A80C14] hover:bg-[#8C0A10] text-white font-bold text-xs rounded-xl text-center transition-colors shadow-sm flex items-center justify-center"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="p-5 sm:p-6 space-y-4">
                  {reviewSubmitted ? (
                    <div className="py-8 text-center space-y-2">
                      <Sparkles className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="text-sm font-bold text-stone-900">Thank you for your review!</p>
                      <p className="text-xs text-stone-500">It will appear on this page after our team approves it.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label htmlFor="review-author" className="text-xs font-bold text-stone-700">Your Name *</label>
                        <input
                          id="review-author"
                          type="text"
                          required
                          maxLength={60}
                          value={newReview.author}
                          onChange={(e) => setNewReview({ ...newReview, author: e.target.value })}
                          placeholder="e.g. Ayesha R."
                          className="w-full px-4 py-3 min-h-[44px] bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#A80C14]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-700">Your Rating *</label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewReview({ ...newReview, rating: star })}
                              aria-label={`${star} star${star > 1 ? 's' : ''}`}
                              className="p-1.5 -m-0.5 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                            >
                              <Star
                                className={`w-7 h-7 transition-colors ${star <= newReview.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-stone-300'
                                  }`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-xs font-bold text-stone-600 font-mono">{newReview.rating}/5</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="review-comment" className="text-xs font-bold text-stone-700">Your Review *</label>
                        <textarea
                          id="review-comment"
                          required
                          rows={4}
                          maxLength={1000}
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                          placeholder="How was the fabric, fit, and delivery experience?"
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#A80C14]"
                        />
                        <p className="text-[10px] text-stone-400 text-right">{newReview.comment.length}/1000</p>
                      </div>

                      {reviewError && (
                        <p className="text-[11px] font-bold text-rose-600" role="alert">{reviewError}</p>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsWriteReviewOpen(false)}
                          className="px-4 py-3 min-h-[44px] bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingReview}
                          className="px-5 py-3 min-h-[44px] bg-[#A80C14] hover:bg-[#8C0A10] text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 active:scale-95"
                        >
                          {isSubmittingReview ? 'Submitting…' : 'Submit Review'}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Zoom Modal */}
      <ProductZoomModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageUrl={imagesList[selectedImageIndex] || imagesList[0]}
        title={product?.name}
      />

      {/* Sticky Bottom Purchase Bar for Mobile — offset sits above MobileBottomNav,
          including its env(safe-area-inset-bottom) padding on notched phones */}
      <div className="md:hidden fixed bottom-[calc(62px+env(safe-area-inset-bottom))] left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#F8D2D5] px-3 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3 safe-bottom animate-fade-in">
        <div className="flex flex-col min-w-0 shrink-0">
          <span className="font-extrabold text-[#A80C14] font-mono text-sm leading-tight truncate">
            {formatCurrency(currentPrice * quantity)}
          </span>
          <span className="text-[9px] text-stone-400 truncate">
            {selectedColor} · {selectedSize} · Qty {quantity}
          </span>
        </div>
        <div className="flex gap-2 flex-1 max-w-[68%]">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="flex-1 py-3 px-3 min-h-[44px] bg-stone-900 disabled:bg-stone-400 text-white text-[11px] font-bold rounded-full transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
          </button>
          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="flex-1 py-3 px-3 min-h-[44px] bg-[#A80C14] disabled:bg-stone-300 disabled:text-stone-500 hover:bg-[#8C0A10] text-white text-[11px] font-extrabold rounded-full transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95 disabled:cursor-not-allowed"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>{isOutOfStock ? 'Sold Out' : 'Buy Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
