'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  ShoppingBag,
  Home,
  LayoutGrid,
  Sparkles,
  Truck,
  User,
  X
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Product } from '@/data/products';
import { formatCurrency } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';

// Safe Image Component with fallback to prevent broken image icons
function SafeImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  if (hasError || !imgSrc) {
    return (
      <div className="w-full h-full bg-[#0D153A]/10 flex flex-col items-center justify-center p-1 text-center text-[#0D153A]">
        <Sparkles className="w-4 h-4 text-[#A80C14]" />
        <span className="text-[8px] font-bold mt-0.5 font-mono line-clamp-1">{alt}</span>
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      sizes="60px"
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { cartCount, products: cartProducts, user } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  const userName = user ? user.name.split(' ')[0] : null;

  // Search the live catalog only. Falling back to the seed array meant an empty
  // store still returned demo products, whose /product links 404.
  const allStoreProducts = cartProducts || [];

  useEffect(() => {
    if (!searchQuery.trim()) {
      Promise.resolve().then(() => {
        setSearchResults([]);
      });
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const matches = allStoreProducts.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      const matchMaterial = (p.material || '').toLowerCase().includes(q);
      const matchWork = (p.workType || '').toLowerCase().includes(q);
      const matchCode = (p.code || '').toLowerCase().includes(q);
      const matchColor = p.colors?.some((c) => c.name.toLowerCase().includes(q) || (c.hex && c.hex.toLowerCase().includes(q)));
      const matchVar = p.variations?.some((v) => v.colorName.toLowerCase().includes(q) || (v.colorHex && v.colorHex.toLowerCase().includes(q)) || (v.size && v.size.toLowerCase() === q));

      return matchName || matchCategory || matchMaterial || matchWork || matchCode || matchColor || matchVar;
    }).slice(0, 6);

    Promise.resolve().then(() => {
      setSearchResults(matches);
    });
  }, [searchQuery, allStoreProducts]);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchFocused(false);
    }
  };

  // Helper to extract matched variation/color details for a product based on current search query
  const getMatchedVariation = (product: Product, queryStr: string) => {
    const q = queryStr.toLowerCase().trim();
    if (!q) return null;

    // 1. Check colors array
    const matchedColor = product.colors?.find((c) => {
      const nameMatch = c.name.toLowerCase().includes(q);
      const hexMatch = c.hex && c.hex.toLowerCase().includes(q);
      return nameMatch || hexMatch;
    });

    if (matchedColor) {
      let image = product.images?.[0];
      if ((matchedColor as any).images && (matchedColor as any).images.length > 0) {
        image = (matchedColor as any).images[0];
      } else if (typeof matchedColor.imageIndex === 'number' && product.images?.[matchedColor.imageIndex]) {
        image = product.images[matchedColor.imageIndex];
      }
      return {
        colorName: matchedColor.name,
        hex: matchedColor.hex || '#000000',
        image: image || product.images?.[0],
      };
    }

    // 2. Check variations matrix array
    const matchedVar = product.variations?.find((v) => {
      const colorMatch = v.colorName.toLowerCase().includes(q);
      const hexMatch = v.colorHex && v.colorHex.toLowerCase().includes(q);
      const sizeMatch = v.size && v.size.toLowerCase() === q;
      return colorMatch || hexMatch || sizeMatch;
    });

    if (matchedVar) {
      return {
        colorName: `${matchedVar.colorName}${matchedVar.size ? ` (${matchedVar.size})` : ''}`,
        hex: matchedVar.colorHex || '#000000',
        image: matchedVar.imageUrl || product.images?.[0],
      };
    }

    return null;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F8D2D5]/80 shadow-xs">
      {/* Main Top Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">

          {/* Brand Logo */}
          <div className="shrink-0">
            <Logo variant="normal"
              size='md'
            />
          </div>

          {/* Centered Search Pill Input - Only visible on Desktop (lg:) screens */}
          <div className="hidden lg:block flex-1 max-w-xl mx-6 relative">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                placeholder="Search abayas, hijabs, colors (emerald, black)..."
                aria-label="Search store products"
                className="w-full pl-5 pr-10 py-2.5 bg-white border border-[#A80C14] focus:border-[#A80C14] rounded-full text-sm text-[#0D153A] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#A80C14]/10 transition-all shadow-xs"
              />

              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-[#A80C14] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A80C14] hover:scale-110 transition-transform cursor-pointer"
                >
                  <Search className="w-4.5 h-4.5" />
                </button>
              )}
            </form>

            {/* Desktop Autocomplete Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute left-0 top-full mt-2.5 w-[480px] max-w-xl bg-white border border-[#F8D2D5] rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 font-sans">

                {/* Header Meta Bar */}
                <div className="px-3.5 py-2.5 bg-[#FDF2F3]/55 border-b border-[#F8D2D5]/60 text-xs font-bold text-[#A80C14] uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-serif">
                    <Sparkles className="w-3.5 h-3.5 text-[#A80C14]" />
                    <span>Product Suggestions</span>
                  </span>
                  <span className="font-mono text-[10px] bg-white px-2.5 py-0.5 rounded-full border border-[#F8D2D5] text-[#A80C14]">
                    {searchResults.length} {searchResults.length === 1 ? 'Item' : 'Items'} Found
                  </span>
                </div>

                {/* Results List */}
                <div className="divide-y divide-[#FDF2F3] max-h-[70vh] overflow-y-auto">
                  {searchResults.map((prod) => {
                    const matchedVar = getMatchedVariation(prod, searchQuery);
                    const displayImage = matchedVar?.image || prod.images?.[0] || '';

                    return (
                      <Link
                        key={prod.id}
                        href={matchedVar?.colorName ? `/product/${prod.slug}?color=${encodeURIComponent(matchedVar.colorName)}` : `/product/${prod.slug}`}
                        onClick={() => setIsSearchFocused(false)}
                        className="flex items-center gap-3 p-3 hover:bg-[#FDF2F3]/70 transition-colors group text-left cursor-pointer"
                      >
                        {/* Thumbnail Image */}
                        <div className="relative w-14 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-[#F8D2D5]/80 shadow-xs">
                          <SafeImage src={displayImage} alt={prod.name} className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>

                        {/* Title, Category & Color Swatch Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="font-sans font-bold text-sm text-[#0D153A] group-hover:text-[#A80C14] transition-colors line-clamp-1">
                            {prod.name}
                          </p>

                          {/* Matched Color Variation Badge */}
                          {matchedVar ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#FDF2F3] text-[#A80C14] border border-[#F8D2D5] rounded-md text-xs font-bold">
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-stone-300 shrink-0 shadow-xs"
                                style={{ backgroundColor: matchedVar.hex }}
                              />
                              <span className="truncate">Variation: {matchedVar.colorName}</span>
                            </div>
                          ) : (
                            /* Available Colors Swatches Preview */
                            prod.colors && prod.colors.length > 0 && (
                              <div className="flex items-center gap-1 pt-0.5">
                                <span className="text-[9px] text-stone-500 font-bold">Colors:</span>
                                {prod.colors.slice(0, 5).map((c) => (
                                  <span
                                    key={c.name}
                                    className="w-2.5 h-2.5 rounded-full border border-stone-300 shadow-xs shrink-0"
                                    style={{ backgroundColor: c.hex }}
                                    title={c.name}
                                  />
                                ))}
                              </div>
                            )
                          )}

                          <p className="text-[10px] text-stone-500 font-mono">
                            {prod.category} {prod.code ? `• Code: ${prod.code}` : ''}
                          </p>
                        </div>

                        {/* Price Column */}
                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-sm text-[#A80C14] font-mono block">
                            {formatCurrency(prod.price)}
                          </span>
                          {prod.originalPrice > prod.price && (
                            <span className="text-[10px] text-stone-400 line-through font-mono block">
                              {formatCurrency(prod.originalPrice)}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Footer Link to Full Shop Search Results */}
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="w-full py-3 bg-[#A80C14] hover:bg-[#8C0A10] text-white font-bold text-xs text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-inner"
                >
                  <span>View All Search Results for &quot;{searchQuery}&quot;</span>
                  <span>→</span>
                </button>

              </div>
            )}
          </div>

          {/* Cart Icon - Only visible on Desktop (lg:) screens */}
          <Link
            href={'/cart'}
            className="hidden lg:flex relative p-2.5 text-[#0D153A] hover:text-[#A80C14] transition-colors rounded-full hover:bg-[#FDF2F3] cursor-pointer items-center gap-1.5 shrink-0"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-6 h-6 stroke-[1.8]" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#A80C14] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Desktop Pill Navigation Row */}
      <div className="hidden lg:block bg-white border-t border-[#F8D2D5]/60 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <nav className="flex items-center gap-3">
            {/* Home Pill */}
            <Link
              href="/"
              className={`px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-all ${pathname === '/'
                ? 'bg-[#A80C14] text-white shadow-xs'
                : 'bg-white hover:bg-[#FDF2F3]/60 border border-stone-200 text-[#0D153A] hover:text-[#A80C14]'
                }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            {/* Shop Pill */}
            <Link
              href="/shop"
              className={`px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${pathname === '/shop'
                ? 'bg-[#A80C14] text-white shadow-xs font-semibold'
                : 'bg-white hover:bg-[#FDF2F3]/60 border border-stone-200 text-[#0D153A] hover:text-[#A80C14]'
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Shop</span>
            </Link>

            {/* Live Promotions Pill */}
            <Link
              href="/live-promotions"
              className={`px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${pathname === '/live-promotions'
                ? 'bg-[#A80C14] text-white shadow-xs font-semibold'
                : 'bg-white hover:bg-[#FDF2F3]/60 border border-stone-200 text-[#0D153A] hover:text-[#A80C14]'
                }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Live Promotions</span>
            </Link>

            {/* Track Order Pill */}
            <Link
              href="/track"
              className={`px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${pathname === '/track'
                ? 'bg-[#A80C14] text-white shadow-xs font-semibold'
                : 'bg-white hover:bg-[#FDF2F3]/60 border border-stone-200 text-[#0D153A] hover:text-[#A80C14]'
                }`}
            >
              <Truck className="w-4 h-4" />
              <span>Track Order</span>
            </Link>
          </nav>

          {/* Login Pill Right Side */}
          <Link
            href="/account"
            className="px-5 py-2 rounded-full text-sm font-medium bg-white hover:bg-[#FDF2F3]/60 border border-stone-200 text-[#0D153A] hover:text-[#A80C14] flex items-center gap-2 transition-all"
          >
            <User className="w-4 h-4 text-[#A80C14]" />
            <span>{userName ? userName : 'Login'}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
