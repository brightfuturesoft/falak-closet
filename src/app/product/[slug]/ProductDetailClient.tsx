'use client';

import React, { useState, useEffect } from 'react';
import { SmartImage } from '@/components/ui/SmartImage';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Star,
  Heart,
  ShoppingBag,
  Zap,
  Ruler,
  ChevronRight,
  Maximize2,
  Sparkles,
  Plus,
  Minus,
  ZoomIn,
  Truck
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
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist, products } = useCart();
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

  const sizesList = product?.sizes && product.sizes.length > 0
    ? product.sizes
    : ['Free Size'];

  const imagesList = product?.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=800&q=80'];

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(colorsList[0]?.name || 'Standard');
  const [selectedSize, setSelectedSize] = useState(sizesList[0] || 'Free Size');
  const [quantity, setQuantity] = useState(1);

  // Pre-select color from URL search parameter (e.g. ?color=Obsidian%20Black)
  useEffect(() => {
    if (colorQueryParam && colorsList) {
      const colorObj = colorsList.find(
        (c) => c.name.toLowerCase() === colorQueryParam.toLowerCase()
      );
      if (colorObj) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedColor(colorObj.name);
        if (typeof colorObj.imageIndex === 'number' && imagesList[colorObj.imageIndex]) {
          setSelectedImageIndex(colorObj.imageIndex);
        }
      }

      // Check variations array
      const matchedVar = product?.variations?.find(
        (v) => v.colorName.toLowerCase() === colorQueryParam.toLowerCase()
      );
      if (matchedVar) {
        setSelectedColor(matchedVar.colorName);
        if (matchedVar.imageUrl) {
          const varImgIdx = imagesList.findIndex((img) => img === matchedVar.imageUrl);
          if (varImgIdx !== -1) {
            setSelectedImageIndex(varImgIdx);
          }
        }
      }
    }
  }, [colorQueryParam, colorsList, imagesList, product?.variations]);

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

    // Update URL parameter dynamically without full page reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('color', colorName);
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
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);

  // Delivery Calculator State
  const [zipCode, setZipCode] = useState('');
  const [deliveryEstimate, setDeliveryEstimate] = useState<string | null>(null);

  // Review Form State
  const [newReview, setNewReview] = useState({ author: '', rating: 5, comment: '' });
  const [reviewsList, setReviewsList] = useState(product?.reviewsList || []);

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'specs' | 'care' | 'shipping' | 'reviews'>('specs');

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
    if (!product) return;
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
    if (!product) return;
    addToCart(product, selectedColor, selectedSize, quantity);
    trackEvent('begin_checkout', {
      source: 'buy_now_button',
      productId: product.id,
      price: product.price * quantity
    });
    router.push('/checkout');
  };

  const productSchema = getProductSchema(product);
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
    { name: product?.category || 'Category', url: `/shop?category=${encodeURIComponent(product?.category || '')}` },
    { name: product?.name || 'Product', url: `/product/${product?.slug || ''}` }
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10 pb-28 lg:pb-12 text-stone-900">
      {/* Dynamic SEO Schemas */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-stone-500">
        <Link href="/" className="hover:text-[#D92670]">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/shop" className="hover:text-[#D92670]">Shop</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/shop?category=${encodeURIComponent(product?.category || '')}`} className="hover:text-[#D92670]">
          {product?.category}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-stone-900 font-semibold truncate max-w-[200px]">
          {product?.name}
        </span>
      </nav>

      {/* Product Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div
            onClick={() => setIsLightboxOpen(true)}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onMouseMove={handleMouseMove}
            className="relative aspect-[4/5] sm:aspect-[3/4] w-full rounded-3xl overflow-hidden bg-stone-100 border border-pink-100 shadow-md group cursor-crosshair"
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
              <span className="absolute top-4 left-4 px-3 py-1 bg-[#D92670] text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-md z-10">
                -{product?.discountPercentage}% OFF
              </span>
            )}

            {/* Hover Zoom Hint Badge */}
            <div className="absolute bottom-4 left-4 px-3.5 py-1.5 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 pointer-events-none z-10 opacity-80 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-3.5 h-3.5 text-[#F2C76E]" />
              <span>Hover cursor to zoom details</span>
            </div>

            <button
              onClick={() => setIsLightboxOpen(true)}
              className="absolute top-4 right-4 p-2 bg-stone-900/70 hover:bg-stone-900 text-white rounded-full backdrop-blur-xs transition-all shadow-md cursor-pointer z-10"
              title="Fullscreen Zoom"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnail Strip */}
          {imagesList.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {imagesList.map((img, idx) => {
                const mappedColor = colorsList.find(
                  (c) => c.imageIndex === idx || ((c as { images?: string[] }).images && (c as { images?: string[] }).images?.includes(img))
                ) || (colorsList[idx] ? colorsList[idx] : null);

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectImageIndex(idx)}
                    className={`relative w-20 h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer group/thumb ${selectedImageIndex === idx
                      ? 'border-[#D92670] ring-2 ring-pink-200 scale-105'
                      : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                  >
                    <SmartImage src={img} alt={`Thumbnail ${idx + 1}`} fill sizes="80px" className="object-cover" />
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
        </div>

        {/* Right: Details & Purchase Form */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between gap-2">

              <button
                onClick={() => toggleWishlist(product)}
                className={`p-2 rounded-full border transition-all cursor-pointer ${isWishlisted ? 'bg-pink-100 border-[#D92670] text-[#D92670]' : 'border-stone-200 text-stone-400 hover:text-[#D92670]'
                  }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#D92670]' : ''}`} />
              </button>
            </div>

            <h1 className="font-sans text-2xl sm:text-4xl font-extrabold text-stone-900 mt-2">
              {product?.name}
            </h1>

            <div className="flex items-center gap-3 mt-2">
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-bold text-stone-800 font-mono">
                {product?.rating || 5.0} / 5.0
              </span>
              <span className="text-xs text-stone-400 font-medium">
                ({reviewsList.length} customer reviews)
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-5 bg-[#FFF0F6] rounded-3xl border border-pink-200/80 shadow-xs flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-stone-900">
                  {formatCurrency(currentPrice)}
                </span>
                {product?.originalPrice && product.originalPrice > currentPrice && (
                  <span className="text-sm text-stone-400 line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Variation: <span className="font-bold text-[#D92670]">{selectedColor} / {selectedSize}</span>
              </p>
            </div>

            {product?.freeDeliveryQuantity && product.freeDeliveryQuantity > 0 ? (
              <div className="bg-[#D92670]/10 text-[#D92670] border border-[#D92670]/20 px-3 py-1.5 rounded-2xl text-[10px] font-bold flex items-center gap-1 shrink-0">
                <Truck className="w-3.5 h-3.5 shrink-0" />
                <span>Free Delivery @ {product.freeDeliveryQuantity}+ pcs</span>
              </div>
            ) : null}

            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl ${currentStock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
              <span className={`w-2 h-2 rounded-full ${currentStock > 0 ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
              {currentStock > 0 ? `In Stock (${currentStock} left)` : 'Out of Stock'}
            </span>
          </div>

          {/* Color Variation Swatches */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex justify-between">
              <span>Select Color</span>
              <span className="text-[#D92670] font-bold">{selectedColor}</span>
            </label>

            <div className="flex flex-wrap gap-2">
              {colorsList.map((col) => {
                const isSelected = selectedColor === col.name;
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => handleSelectColor(col.name)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${isSelected
                      ? 'border-[#D92670] bg-[#D92670] text-white shadow-xs scale-105'
                      : 'border-stone-200 text-stone-700 hover:border-pink-200 bg-white'
                      }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-inner" style={{ backgroundColor: col.hex }} />
                    <span>{col.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold uppercase tracking-wider text-stone-700">
                Select Size
              </label>
              <button
                onClick={() => setIsSizeGuideOpen(true)}
                className="text-[#D92670] hover:underline flex items-center gap-1 font-semibold"
              >
                <Ruler className="w-3.5 h-3.5" /> Size Guide
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {sizesList.map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${selectedSize === sz
                    ? 'border-[#D92670] bg-[#D92670] text-white shadow-xs'
                    : 'border-stone-200 text-stone-800 hover:bg-pink-50'
                    }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex justify-between">
              <span>Select Quantity</span>
              <span className="text-stone-400 font-normal">Available stock: {currentStock}</span>
            </label>

            <div className="flex items-center justify-between p-2.5 bg-stone-50 border border-stone-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                  className="w-9 h-9 rounded-full bg-white text-stone-800 font-bold flex items-center justify-center shadow-xs border border-stone-200 hover:bg-pink-100 disabled:opacity-40 transition-all cursor-pointer"
                  aria-label="Decrease Quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <span className="w-8 text-center font-bold text-stone-900 font-mono text-base">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.min(currentStock, prev + 1))}
                  disabled={quantity >= currentStock}
                  className="w-9 h-9 rounded-full bg-white text-stone-800 font-bold flex items-center justify-center shadow-xs border border-stone-200 hover:bg-pink-100 disabled:opacity-40 transition-all cursor-pointer"
                  aria-label="Increase Quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Line Subtotal</span>
                <span className="font-extrabold text-[#D92670] font-mono text-base">
                  {formatCurrency(currentPrice * quantity)}
                </span>
              </div>
            </div>
          </div>

          {product?.freeDeliveryQuantity && product.freeDeliveryQuantity > 0 && (
            <div className="text-xs font-bold font-sans">
              {quantity >= product.freeDeliveryQuantity ? (
                <p className="text-emerald-700 flex items-center gap-1.5 bg-emerald-50 border border-emerald-250 p-2.5 rounded-xl">
                  <Truck className="w-4 h-4 shrink-0 text-emerald-600 animate-bounce" />
                  <span>🎉 Quantity milestone met! FREE delivery unlocked!</span>
                </p>
              ) : (
                <p className="text-stone-500 flex items-center gap-1.5 bg-stone-50 border border-stone-200 p-2.5 rounded-xl">
                  <Truck className="w-4 h-4 text-stone-400 shrink-0 animate-pulse" />
                  <span>Buy {product.freeDeliveryQuantity - quantity} more of this item to unlock FREE delivery!</span>
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3.5 px-6 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-bold rounded-full transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={handleBuyNow}
                className="flex-1 py-3.5 px-6 bg-[#D92670] hover:bg-[#C2185B] text-white text-xs sm:text-sm font-extrabold rounded-full transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Buy Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Specification & Review Tabs */}
      <div className="pt-8 border-t border-pink-100 space-y-6">
        <div className="flex border-b border-pink-100 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 px-4 border-b-2 transition-all cursor-pointer ${activeTab === 'specs' ? 'border-[#D92670] text-[#D92670]' : 'border-transparent text-stone-400'
              }`}
          >
            Fabric & Craftsmanship
          </button>
          <button
            onClick={() => setActiveTab('care')}
            className={`pb-3 px-4 border-b-2 transition-all cursor-pointer ${activeTab === 'care' ? 'border-[#D92670] text-[#D92670]' : 'border-transparent text-stone-400'
              }`}
          >
            Garment Care
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`pb-3 px-4 border-b-2 transition-all cursor-pointer ${activeTab === 'shipping' ? 'border-[#D92670] text-[#D92670]' : 'border-transparent text-stone-400'
              }`}
          >
            Shipping & Returns
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 px-4 border-b-2 transition-all cursor-pointer ${activeTab === 'reviews' ? 'border-[#D92670] text-[#D92670]' : 'border-transparent text-stone-400'
              }`}
          >
            Verified Reviews ({reviewsList.length})
          </button>
        </div>

        {activeTab === 'specs' && (
          <div className="p-6 bg-white rounded-3xl border border-pink-100 space-y-3 text-xs sm:text-sm leading-relaxed">
            <h3 className="font-bold text-lg text-[#D92670]">Specifications</h3>
            <p className="text-stone-600">{product?.description || 'Luxury modest fashion item.'}</p>
            <ul className="list-disc list-inside space-y-1 text-stone-600 pt-2">
              {(product?.features || ['Premium tailoring', 'Soft luxury fabric']).map((feat, i) => (
                <li key={i}>{feat}</li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'care' && (
          <div className="p-6 bg-white rounded-3xl border border-pink-100 space-y-3 text-xs sm:text-sm">
            <h3 className="font-bold text-lg text-[#D92670]">Garment Care Instructions</h3>
            <ul className="list-disc list-inside space-y-1.5 text-stone-600">
              {(product?.careInstructions || ['Dry clean recommended', 'Steam iron low heat']).map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="p-6 bg-white rounded-3xl border border-pink-100 space-y-3 text-xs sm:text-sm text-stone-600">
            <h3 className="font-bold text-lg text-[#D92670]">Express Logistics</h3>
            <p>Fast delivery across Bangladesh. Easy returns and exchanges within 30 days.</p>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-stone-900">
                Customer Ratings & Feedback
              </h3>
              <button
                onClick={() => setIsWriteReviewOpen(true)}
                className="px-4 py-2 bg-[#D92670] text-white font-bold text-xs rounded-full hover:bg-[#C2185B] transition-colors shadow-xs"
              >
                Write a Review
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewsList.map((rev) => (
                <div key={rev.id} className="p-5 bg-white rounded-2xl border border-pink-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900">{rev.author}</span>
                    <span className="text-[10px] text-stone-400">{rev.date}</span>
                  </div>
                  <div className="flex text-amber-400 gap-0.5">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-stone-600 italic">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Arrivals Product Carousel */}
      <NewArrivalSection
        products={products.filter((p) => p.id !== product.id)}
        title="YOU MAY ALSO LIKE / NEW ARRIVALS"
        subtitle="Explore more of our latest modest fashion creations"
      />

      {/* Fullscreen Lightbox Zoom Modal */}
      <ProductZoomModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageUrl={imagesList[selectedImageIndex] || imagesList[0]}
        title={product?.name}
      />
    </div>
  );
}
