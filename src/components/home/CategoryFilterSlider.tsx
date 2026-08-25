'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, LayoutGrid, Scissors, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryFilterSliderProps {
  onSelectFilter?: (type: string, value: string) => void;
  activeFilter?: { type: string; val: string } | null;
}

export function CategoryFilterSlider({ onSelectFilter, activeFilter }: CategoryFilterSliderProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const filterCards = [
    {
      id: 'occasion',
      icon: Heart,
      title: 'Shop by occasion',
      subtitle: 'Find the right pick for the moment',
      tags: [
        { label: 'Party Wear', filterType: 'occasion', filterVal: 'Party Wear' },
        { label: 'Casual Wear', filterType: 'occasion', filterVal: 'Casual Wear' },
        { label: '+2 more', filterType: 'occasion', filterVal: 'Festive & Eid' }
      ]
    },
    {
      id: 'weather',
      icon: LayoutGrid,
      title: 'Shop for the weather',
      subtitle: 'Seasonal picks, just right',
      tags: [
        { label: 'Summer', filterType: 'weather', filterVal: 'Summer' },
        { label: 'Winter', filterType: 'weather', filterVal: 'Winter' },
        { label: 'Festive', filterType: 'weather', filterVal: 'Festive' },
        { label: 'Wedding', filterType: 'weather', filterVal: 'Wedding' }
      ]
    },
    {
      id: 'material',
      icon: Scissors,
      title: 'Shop by material',
      subtitle: 'Cotton, silk, linen and more',
      tags: [
        { label: 'CEY', filterType: 'material', filterVal: 'CEY' },
        { label: 'Ac Cotton', filterType: 'material', filterVal: 'Ac Cotton' },
        { label: 'Airy Cotton', filterType: 'material', filterVal: 'Airy Cotton' },
        { label: '+7 more', filterType: 'material', filterVal: 'Crinkle' }
      ]
    },
    {
      id: 'category',
      icon: Sparkles,
      title: 'Shop by category',
      subtitle: 'What kind of product are you looking for?',
      tags: [
        { label: 'Dress', filterType: 'category', filterVal: 'Modest Dresses' },
        { label: 'HIJAB', filterType: 'category', filterVal: 'Hijabs & Dupattas' },
        { label: 'Accessories', filterType: 'category', filterVal: 'Accessories' }
      ]
    }
  ];

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

  // Continuous Auto-rotate timer (3.5 seconds per card)
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setActiveCardIndex((prevIndex) => {
        const nextIdx = (prevIndex + 1) % filterCards.length;
        handleScrollTo(nextIdx);
        return nextIdx;
      });
    }, 3500);

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

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6 sm:my-8 relative group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="relative">
        {/* Left Arrow Button */}
        <button
          onClick={handleScrollLeft}
          className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-[#F2C76E] shadow-md flex items-center justify-center text-[#0C163A] hover:bg-[#9B050B] hover:text-[#FFFBF0] hover:border-[#9B050B] transition-all cursor-pointer hover:scale-110 active:scale-95"
          aria-label="Previous category"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Single Line Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar py-2 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filterCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="w-[290px] sm:w-[360px] flex-shrink-0 snap-start bg-white border border-[#F2C76E]/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-[#9B050B] text-[#F2C76E] flex items-center justify-center shadow-xs flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0C163A] text-sm">{card.title}</h3>
                      <p className="text-xs text-stone-500">{card.subtitle}</p>
                    </div>
                  </div>

                  {/* Tags Pill List */}
                  <div className="flex flex-wrap gap-2 pt-3">
                    {card.tags.map((tag) => {
                      const isTagActive =
                        activeFilter?.type === tag.filterType && activeFilter?.val === tag.filterVal;
                      return (
                        <button
                          key={tag.label}
                          onClick={() => handleTagClick(tag.filterType, tag.filterVal)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                            isTagActive
                              ? 'bg-[#9B050B] text-[#FFFBF0] shadow-xs'
                              : 'bg-[#FFFBF0] hover:bg-[#F2C76E]/20 border border-[#F2C76E]/60 text-[#0C163A] hover:text-[#9B050B]'
                          }`}
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={handleScrollRight}
          className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-[#F2C76E] shadow-md flex items-center justify-center text-[#0C163A] hover:bg-[#9B050B] hover:text-[#FFFBF0] hover:border-[#9B050B] transition-all cursor-pointer hover:scale-110 active:scale-95"
          aria-label="Next category"
        >
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Pagination Bar Indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {filterCards.map((_, idx) => (
          <button
            key={idx}
            onClick={() => handleScrollTo(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              activeCardIndex === idx ? 'w-6 bg-[#9B050B]' : 'w-2 bg-[#F2C76E]/50 hover:bg-[#F2C76E]'
            }`}
            aria-label={`Scroll to card ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

