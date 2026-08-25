'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, SlidersHorizontal, ArrowRight, Search, Sparkles } from 'lucide-react';
import { Product } from '@/data/products';
import { ProductCard } from '@/components/product/ProductCard';

interface AllProductsSectionProps {
  products: Product[];
}

export function AllProductsSection({ products }: AllProductsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'rating'>('newest');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const categories = [
    'All',
    'Abayas',
    'Hijabs & Dupattas',
    'Modest Dresses',
    'Co-ord Sets',
    'Luxury Tunics',
    'Accessories'
  ];

  // Filter products by selected category and search query
  let filtered = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      !searchTerm.trim() ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      p.material.toLowerCase().includes(searchTerm.toLowerCase().trim());
    return matchesCat && matchesSearch;
  });

  // Apply sorting
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
  });

  return (
    <section id="all-products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8 sm:my-14 space-y-6">
      {/* Section Title Header */}
      <div className="bg-white border border-[#F2C76E]/40 rounded-3xl p-5 sm:p-7 space-y-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F2C76E]/30 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#9B050B]/10 border border-[#9B050B]/20 rounded-full text-xs text-[#9B050B] font-bold uppercase tracking-wider mb-1">
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Full Store Catalog</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#0C163A]">
              ALL PRODUCTS & MODEST COLLECTION
            </h2>
            <p className="text-xs text-stone-500">
              Browse our complete catalog of handcrafted abayas, premium hijabs, co-ord sets, and accessories.
            </p>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-48">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search collection..."
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9B050B]"
              />
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-stone-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="newest">Featured & Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${selectedCategory === cat
                  ? 'bg-[#9B050B] text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-pink-100 hover:text-[#9B050B]'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Result Summary Bar */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
          <span>
            Showing <strong>{filtered.length}</strong> of <strong>{products.length}</strong> Products
          </span>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchTerm('');
              }}
              className="text-[#9B050B] font-bold hover:underline cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Product Cards Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map((product) => (
              <ProductCard key={product?.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-3 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            <p className="text-stone-500 text-sm">No products found matching your active filter.</p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchTerm('');
              }}
              className="px-5 py-2 bg-[#9B050B] text-white font-bold text-xs rounded-xl hover:bg-[#B8000A]"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Bottom Catalog Link Banner */}
        <div className="pt-4 text-center border-t border-[#F2C76E]/30">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#0C163A] hover:bg-[#122050] text-[#FFFBF0] font-extrabold text-xs uppercase tracking-wider rounded-full transition-all shadow-md hover:scale-105"
          >
            <span>Explore Entire Storefront Catalog</span>
            <ArrowRight className="w-4 h-4 text-[#F2C76E]" />
          </Link>
        </div>
      </div>
    </section>
  );
}
