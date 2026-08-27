'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { Product } from '@/data/products';
import { ProductCard } from '@/components/product/ProductCard';

interface NewArrivalSectionProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  /** Pill next to the heading — pass `null` to hide (e.g. on the product page). */
  badge?: string | null;
}

export function NewArrivalSection({
  products,
  title = 'NEW ARRIVALS',
  subtitle = 'Discover our latest modest luxury Abayas, Kaftans & Hijabs',
  badge = 'Fresh Drop'
}: NewArrivalSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Filter or sort for new arrivals (newest items first)
  const newArrivalsList = products.length > 0 ? products : [];

  const updateScrollState = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollState, { passive: true });
      updateScrollState();
    }
    return () => el?.removeEventListener('scroll', updateScrollState);
  }, [products]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.75;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const displayProducts = newArrivalsList.slice(0, 10);

  return (
    <section className="md:max-w-7xl mx-auto md:px-4 sm:px-6 lg:px-8 w-full">
      <div className="bg-white border border-pink-100 rounded-3xl p-4 sm:p-7 space-y-4 sm:space-y-6 shadow-xs relative overflow-hidden">
        {/* Section Header Row */}
        <div className="flex items-center justify-between border-b border-pink-100/60 pb-3 sm:pb-4 relative z-10">
          <div className="space-y-0.5">
            <h2 className="font-sans font-black text-[#0C163A] text-base sm:text-lg tracking-wider uppercase leading-tight">
              {title}
            </h2>
            <p className="text-[11px] sm:text-xs text-stone-500 font-sans">{subtitle}</p>
          </div>

          <Link
            href="/shop?sort=newest"
            className="inline-flex min-h-[36px] sm:min-h-[40px] items-center justify-center px-4 bg-[#D92670] hover:bg-[#C2185B] text-white rounded-full text-xs font-bold transition-colors shadow-xs active:scale-95 cursor-pointer"
          >
            See More
          </Link>
        </div>

        {/* Product Cards Grid */}
        <div className="relative z-10">
          {displayProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {displayProducts.map((product) => (
                <ProductCard key={product?.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="w-full py-12 text-center text-stone-500 font-mono text-xs">
              No products found in new arrivals collection.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
