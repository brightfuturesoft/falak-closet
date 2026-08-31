'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { INITIAL_CATEGORIES } from '@/data/categories';
import { useCategories } from '@/lib/useCategories';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/data/products';

interface CategoryFilterSliderProps {
  onSelectFilter?: (type: string, value: string) => void;
  activeFilter?: { type: string; val: string } | null;
}

/** Max tag pills per card — beyond this the card gets a "+N more" pill. */
const MAX_TAGS_PER_CARD = 4;

interface FilterTag {
  label: string;
  filterType: string;
  filterVal: string;
}

/**
 * Distinct values of one product field, most common first.
 *
 * These pills used to be a hardcoded list ("CEY", "Ac Cotton", "+7 more"), so
 * they advertised materials and seasons no product in the store carried — every
 * one of those clicks filtered the home page down to nothing.
 */
function valuesOf(products: Product[], key: 'occasion' | 'weather' | 'material' | 'workType'): FilterTag[] {
  const counts = new Map<string, { value: string; count: number }>();

  products.forEach((p) => {
    const raw = (p[key] || '').trim();
    if (!raw) return;
    const id = raw.toLowerCase();
    const existing = counts.get(id);
    if (existing) existing.count += 1;
    else counts.set(id, { value: raw, count: 1 });
  });

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .map(({ value }) => ({ label: value, filterType: key, filterVal: value }));
}

export function CategoryFilterSlider({ onSelectFilter, activeFilter }: CategoryFilterSliderProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Live taxonomy from MongoDB; seed data stands in while loading or if the API is down.
  const { categories } = useCategories({ fallback: INITIAL_CATEGORIES });
  const { products } = useCart();

  const filterCards = useMemo(() => {
    /** Cap the pill list, folding the overflow into a "+N more" that opens the first hidden value. */
    const capTags = (tags: FilterTag[]): FilterTag[] => {
      if (tags.length <= MAX_TAGS_PER_CARD) return tags;
      const shown = tags.slice(0, MAX_TAGS_PER_CARD - 1);
      const firstHidden = tags[MAX_TAGS_PER_CARD - 1];
      return [
        ...shown,
        { ...firstHidden, label: `+${tags.length - shown.length} more` },
      ];
    };

    // Featured categories lead, then the rest
    const sortedCategories = [...categories].sort(
      (a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured))
    );

    const categoryTags: FilterTag[] = sortedCategories.map((cat) => ({
      label: cat.name,
      filterType: 'category',
      filterVal: cat.name,
    }));

    const occasionTags = valuesOf(products, 'occasion');

    const cards = [];

    // 1. Shop by category
    cards.push({
      id: 'category',
      icon: Sparkles,
      title: 'Shop by category',
      subtitle: 'What kind of products are you looking for?',
      tags: capTags(categoryTags.length > 0 ? categoryTags : [
        { label: 'Dress', filterType: 'category', filterVal: 'Dress' },
        { label: 'HIJAS', filterType: 'category', filterVal: 'HIJAS' },
        { label: 'Accessories', filterType: 'category', filterVal: 'Accessories' }
      ])
    });

    // 2. Shop by occasion
    cards.push({
      id: 'occasion',
      icon: Heart,
      title: 'Shop by occasion',
      subtitle: 'Find the right fits for the moment',
      tags: capTags(occasionTags.length > 0 ? occasionTags : [
        { label: 'Party Wear', filterType: 'occasion', filterVal: 'Party Wear' },
        { label: 'Casual Wear', filterType: 'occasion', filterVal: 'Casual Wear' }
      ])
    });

    return cards;
  }, [categories, products]);

  const handleScrollTo = useCallback((index: number) => {
    if (scrollRef.current) {
      const children = Array.from(scrollRef.current.children) as HTMLElement[];
      if (children[index]) {
        scrollRef.current.scrollTo({
          left: children[index].offsetLeft - scrollRef.current.offsetLeft,
          behavior: 'smooth'
        });
        setActiveCardIndex(index);
      }
    }
  }, []);

  const handleScrollLeft = () => {
    const nextIdx = (activeCardIndex - 1 + filterCards.length) % filterCards.length;
    handleScrollTo(nextIdx);
  };

  const handleScrollRight = () => {
    const nextIdx = (activeCardIndex + 1) % filterCards.length;
    handleScrollTo(nextIdx);
  };

  // Continuous Auto-rotate timer (5s per card — unhurried on small screens)
  useEffect(() => {
    // `% 0` is NaN, and one card has nowhere to rotate to.
    if (isPaused || filterCards.length <= 1) return;

    const timer = setInterval(() => {
      setActiveCardIndex((prevIndex) => {
        const nextIdx = (prevIndex + 1) % filterCards.length;
        handleScrollTo(nextIdx);
        return nextIdx;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, filterCards.length, handleScrollTo]);

  // Sync activeCardIndex on manual user scrolling/swiping
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const children = Array.from(el.children) as HTMLElement[];
      if (children.length === 0) return;
      const containerLeft = el.scrollLeft;
      let closestIndex = 0;
      let minDistance = Infinity;

      children.forEach((child, idx) => {
        const dist = Math.abs(child.offsetLeft - el.offsetLeft - containerLeft);
        if (dist < minDistance) {
          minDistance = dist;
          closestIndex = idx;
        }
      });

      setActiveCardIndex(closestIndex);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTagClick = (filterType: string, filterVal: string) => {
    if (onSelectFilter) {
      onSelectFilter(filterType, filterVal);
    } else {
      router.push(`/shop?${filterType}=${encodeURIComponent(filterVal)}`);
    }
  };
  if (filterCards.length === 0) return null;

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      aria-label="Shop by category and occasion"
    >
      {/* 1. Desktop View: Side-by-Side 2 Column Grid */}
      <div className="hidden lg:grid grid-cols-2 gap-6">
        {filterCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.id}
              className="bg-white border border-[#F8D2D5] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#A80C14] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-sans font-bold text-[#0D153A] text-sm sm:text-base truncate">{card.title}</h3>
                    <p className="text-[11px] sm:text-xs text-stone-500 truncate">{card.subtitle}</p>
                  </div>
                </div>

                {/* Tags Pill List: Scrollable for Desktop */}
                <div
                  className="flex gap-2 pt-3 overflow-x-auto no-scrollbar -mx-1 px-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {card.tags.map((tag) => {
                    const isTagActive =
                      activeFilter?.type === tag.filterType && activeFilter?.val === tag.filterVal;
                    return (
                      <button
                        key={`${tag.filterType}-${tag.filterVal}-${tag.label}`}
                        onClick={() => handleTagClick(tag.filterType, tag.filterVal)}
                        aria-pressed={isTagActive}
                        className={`flex-shrink-0 min-h-[36px] inline-flex items-center px-4 rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-95 border ${
                          isTagActive
                            ? 'bg-[#A80C14] border-[#A80C14] text-white shadow-xs'
                            : 'bg-white hover:bg-[#FDF2F3]/60 border-stone-200 text-[#0D153A] hover:text-[#A80C14] hover:border-[#F8D2D5]'
                        }`}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* 2. Mobile/Tablet View: Carousel Slider */}
      <div className="lg:hidden relative">
        {/* Single Line Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar py-2 px-1 -mx-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filterCards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.id}
                className="w-[280px] sm:w-[360px] flex-shrink-0 snap-start bg-white border border-[#F8D2D5]/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-[#A80C14] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                      <Icon className="w-[18px] h-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-sans font-bold text-[#0D153A] text-sm sm:text-base truncate">{card.title}</h3>
                      <p className="text-[11px] sm:text-xs text-stone-500 truncate">{card.subtitle}</p>
                    </div>
                  </div>

                  {/* Tags Pill List: Scrollable for Mobile */}
                  <div
                    className="flex gap-2 pt-3 overflow-x-auto no-scrollbar -mx-1 px-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {card.tags.map((tag) => {
                      const isTagActive =
                        activeFilter?.type === tag.filterType && activeFilter?.val === tag.filterVal;
                      return (
                        <button
                          key={`${tag.filterType}-${tag.filterVal}-${tag.label}`}
                          onClick={() => handleTagClick(tag.filterType, tag.filterVal)}
                          aria-pressed={isTagActive}
                          className={`flex-shrink-0 min-h-[36px] inline-flex items-center px-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-95 border ${
                            isTagActive
                              ? 'bg-[#A80C14] border-[#A80C14] text-white shadow-xs'
                              : 'bg-white hover:bg-[#FDF2F3]/60 border-stone-200 text-[#0D153A] hover:text-[#A80C14] hover:border-[#F8D2D5]'
                          }`}
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Carousel indicator controls with chevrons and dots */}
        <div className="flex items-center justify-center gap-4 mt-3">
          <button
            onClick={handleScrollLeft}
            className="w-8 h-8 rounded-full border border-[#F8D2D5] flex items-center justify-center text-[#A80C14] bg-white active:scale-90 transition-transform shadow-xs cursor-pointer"
            aria-label="Previous category"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {filterCards.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleScrollTo(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeCardIndex === idx ? 'w-5 bg-[#A80C14]' : 'w-1.5 bg-[#FDF2F3]'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleScrollRight}
            className="w-8 h-8 rounded-full border border-[#F8D2D5] flex items-center justify-center text-[#A80C14] bg-white active:scale-90 transition-transform shadow-xs cursor-pointer"
            aria-label="Next category"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </section>
  );
}
