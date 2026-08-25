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
  const [isHovered, setIsHovered] = useState(false);

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
      el.addEventListener('scroll', updateScrollState);
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

  // Auto Scroll Carousel effect (pauses on hover)
  useEffect(() => {
    if (isHovered || displayList.length <= 3) return;

    const timer = setInterval(() => {
      if (!scrollContainerRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;

      if (scrollLeft + clientWidth >= scrollWidth - 15) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
      }
    }, 4500);

    return () => clearInterval(timer);
  }, [isHovered, displayList]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8 sm:my-12">
      <div
        className="bg-gradient-to-br from-[#0C163A] via-[#122050] to-[#0C163A] border border-[#F2C76E]/40 rounded-3xl p-5 sm:p-8 space-y-6 shadow-xl relative overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Decorative Golden Ambient Blur */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F2C76E]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#9B050B]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 border-b border-[#F2C76E]/20 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F2C76E]/15 border border-[#F2C76E]/30 rounded-full text-xs text-[#F2C76E] font-bold">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
              <span>Customer Favorites & Trending</span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#FFFBF0]">
              Best Sellers & Trending Choice
            </h2>
            <p className="text-xs text-stone-300">
              Our most beloved luxury abayas and hijabs loved by thousands of modest fashion enthusiasts.
            </p>
          </div>

          {/* Carousel Controls & Main Link */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                aria-label="Previous Slide"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0C163A]/80 border border-[#F2C76E]/60 text-[#F2C76E] hover:bg-[#F2C76E] hover:text-[#0C163A] transition-all shadow-md flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:hover:bg-[#0C163A]/80 disabled:hover:text-[#F2C76E] disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                aria-label="Next Slide"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0C163A]/80 border border-[#F2C76E]/60 text-[#F2C76E] hover:bg-[#F2C76E] hover:text-[#0C163A] transition-all shadow-md flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:hover:bg-[#0C163A]/80 disabled:hover:text-[#F2C76E] disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <Link
              href="/shop?sort=popular"
              className="px-5 py-2 sm:px-6 sm:py-2.5 bg-[#F2C76E] hover:bg-[#E5B550] text-[#0C163A] font-extrabold text-xs uppercase tracking-wider rounded-full transition-all shadow-md hover:scale-105 flex items-center gap-2"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Sub-Category Filter Pills inside Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 relative z-10">
          {[
            { id: 'all', label: 'All Trending', icon: TrendingUp },
            { id: 'abayas', label: 'Best Seller Abayas', icon: Sparkles },
            { id: 'hijabs', label: 'Popular Hijabs', icon: Flame },
            { id: 'top-rated', label: 'Top Rated (4.8★+)', icon: Star },
            { id: 'discounts', label: 'Special Offers', icon: Flame },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                  }
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${isActive
                  ? 'bg-[#F2C76E] text-[#0C163A] border-[#F2C76E] font-bold shadow-md'
                  : 'bg-[#0C163A]/60 text-stone-300 border-[#F2C76E]/20 hover:border-[#F2C76E]/50 hover:text-white'
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0C163A]' : 'text-[#F2C76E]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Product Cards Carousel Track */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none snap-x snap-mandatory py-2 px-1 scroll-smooth relative z-10"
        >
          {displayList.map((product) => (
            <div
              key={product?.id}
              className="snap-start flex-shrink-0 w-[210px] sm:w-[250px] md:w-[270px] transform transition-transform duration-300 hover:-translate-y-1"
            >
              <ProductCard product={product} />
            </div>
          ))}

          {displayList.length === 0 && (
            <div className="w-full py-12 text-center text-stone-300 font-mono text-xs">
              No products available in this trending category right now.
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

