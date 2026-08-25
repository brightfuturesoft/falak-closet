'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { CategoryFilterSlider } from '@/components/home/CategoryFilterSlider';
import { NewArrivalSection } from '@/components/home/NewArrivalSection';
import { BestSellersSection } from '@/components/home/BestSellersSection';
import { PromoBannerSection } from '@/components/home/PromoBannerSection';
import { AllProductsSection } from '@/components/home/AllProductsSection';
import { ValuePropsSection } from '@/components/home/ValuePropsSection';

export default function HomePage() {
  const { products } = useCart();
  const [selectedFilter, setSelectedFilter] = useState<{ type: string; val: string } | null>(null);

  // Filter products dynamically when user clicks a category tag
  const filteredProducts = selectedFilter
    ? products.filter((p) => {
        if (selectedFilter.type === 'occasion') return p.occasion === selectedFilter.val;
        if (selectedFilter.type === 'weather') return p.weather === selectedFilter.val;
        if (selectedFilter.type === 'material') return p.material === selectedFilter.val;
        if (selectedFilter.type === 'category') return p.category === selectedFilter.val;
        return true;
      })
    : products;

  const handleSelectFilter = (type: string, value: string) => {
    if (selectedFilter?.type === type && selectedFilter?.val === value) {
      setSelectedFilter(null);
    } else {
      setSelectedFilter({ type, val: value });
    }
  };

  return (
    <div className="pb-20 lg:pb-16 space-y-6 sm:space-y-10">
      {/* 1. Hero Banner Slider */}
      <HeroCarousel />

      {/* 2. Shop By Category / Occasion / Weather / Material Interactive Slider */}
      <CategoryFilterSlider onSelectFilter={handleSelectFilter} activeFilter={selectedFilter} />

      {/* Active Filter Indicator Banner */}
      {selectedFilter && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between bg-[#9B050B]/10 border border-[#9B050B]/30 rounded-2xl px-5 py-2.5 text-xs text-stone-800">
            <span>
              Filtering by <strong>{selectedFilter.type}</strong>:{' '}
              <span className="text-[#9B050B] font-bold">{selectedFilter.val}</span>
            </span>
            <button
              onClick={() => setSelectedFilter(null)}
              className="text-[#9B050B] font-bold hover:underline cursor-pointer"
            >
              Clear Filter ✕
            </button>
          </div>
        </div>
      )}

      {/* 3. NEW ARRIVALS Section */}
      <NewArrivalSection products={filteredProducts} />

      {/* 4. BEST SELLERS & TRENDING CHOICE Section */}
      <BestSellersSection products={products} />

      {/* 5. FLASH SALE & PROMOTIONAL VOUCHERS Banner */}
      <PromoBannerSection />

      {/* 6. ALL PRODUCTS & FULL COLLECTION Section */}
      <AllProductsSection products={filteredProducts} />

      {/* 7. WHY CHOOSE FALAK CLOSET Value Showcase */}
      <ValuePropsSection />
    </div>
  );
}
