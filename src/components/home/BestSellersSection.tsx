'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Flame, ArrowRight, ChevronLeft, ChevronRight, Sparkles, Star, TrendingUp } from 'lucide-react';
import { Product } from '@/data/products';
import { ProductCard } from '@/components/product/ProductCard';

interface BestSellersSectionProps {
  products: Product[];
}

type TabType = 'all' | 'abayas' | 'hijabs' | 'top-rated' | 'discounts';

export function BestSellersSection({ products }: BestSellersSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Filter products based on selected tab
  const getFilteredProducts = useCallback(() => {
    switch (activeTab) {
      case 'abayas':
        return products.filter(
          (p) =>
            p.category === 'Abayas' && (p.isBestSeller || p.rating >= 4.6 || p.discountPercentage > 0)
        );
      case 'hijabs':
        return products.filter(
          (p) =>
            (p.category === 'Hijabs & Dupattas' || p.category === 'Accessories') &&
            (p.isBestSeller || p.rating >= 4.5 || p.discountPercentage > 0)
        );
      case 'top-rated':
        return products.filter((p) => p.rating >= 4.8);
      case 'discounts':
        return products.filter((p) => p.discountPercentage >= 15);
      case 'all':
      default:
        const best = products.filter((p) => p.isBestSeller || p.rating >= 4.7);
        return best.length >= 4 ? best : products;
    }
  }, [products, activeTab]);

  const displayList = getFilteredProducts();

  const updateScrollState = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);

    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress(Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100)));
    } else {
      setScrollProgress(100);
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollState, { passive: true });
      updateScrollState();
    }
    return () => el?.removeEventListener('scroll', updateScrollState);
  }, [displayList, updateScrollState]);

  // Handle Manual Carousel Scroll
  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.75;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Auto Scroll Carousel effect — pauses on hover AND while a finger is down,
  // so it never yanks the rail out from under a touch reader.
  useEffect(() => {
    if (isPaused || displayList.length <= 3) return;

    const timer = setInterval(() => {
      if (!scrollContainerRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;

      if (scrollLeft + clientWidth >= scrollWidth - 15) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
      }
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, displayList]);

  const bestSellersList = products.filter((p) => p.isBestSeller || p.rating >= 4.7).slice(0, 10);
  const displayProducts = bestSellersList.length >= 4 ? bestSellersList : products.slice(0, 10);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="bg-transparent sm:bg-white border-none sm:border sm:border-[#F8D2D5]/90 rounded-none sm:rounded-3xl p-0 sm:p-6 lg:p-7 space-y-3.5 sm:space-y-6 shadow-none sm:shadow-xs relative overflow-hidden">
        {/* Header Row */}
        <div className="flex items-center justify-between gap-2 border-b border-[#F8D2D5]/60 pb-2.5 sm:pb-4 relative z-10">
          <div className="space-y-0.5 flex-1 min-w-0 pr-2">
            <h2 className="font-sans font-black text-[#0D153A] text-sm sm:text-base md:text-lg tracking-wider uppercase leading-tight truncate sm:whitespace-normal">
              BEST SELLING
            </h2>
            <p className="text-[11px] sm:text-xs text-stone-500 font-sans line-clamp-1 sm:line-clamp-none">
              Our most beloved luxury abayas and hijabs loved by thousands of modest fashion enthusiasts.
            </p>
          </div>

          <Link
            href="/shop?sort=popular"
            className="inline-flex min-h-[34px] sm:min-h-[40px] items-center justify-center px-3.5 sm:px-4 bg-[#0D153A] hover:bg-black text-white rounded-full text-[11px] sm:text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
          >
            Shop All
          </Link>
        </div>

        {/* Product Cards Grid */}
        <div className="relative z-10">
          {displayProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
              {displayProducts.map((product) => (
                <ProductCard key={product?.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="w-full py-12 text-center text-stone-400 font-mono text-xs">
              No best-selling products found.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
